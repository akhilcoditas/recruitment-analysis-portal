/**
 * Recruitment Analytics Calculator
 *
 * SCREENING LOGIC:
 * - Screening = empty OR "No" → Screening Pending
 * - Screening = Yes + Feedback = empty → Feedback Pending (blocked)
 * - Screening = Yes + Feedback = Select → Passed → Check RF
 * - Screening = Yes + Feedback = Reject → OUT
 * - Screening = Yes + Feedback = Hold → Blocked
 * - Screening = Yes + Feedback = Candidate No-show → No-show (OUT)
 *
 * PIPELINE RULE:
 * - Only Screening = Select can progress to RF
 * - All others blocked at screening
 *
 * RF/L1/L2/CLIENT LOGIC:
 * - Empty/NA/- = Skipped or Not Yet Reached
 * - Find LAST stage with value, if "Select" → Next stage is Pending
 */

const Analytics = {
  // Default column mappings (matching actual sheet structure)
  defaultMappings: {
    vendor: "VENDOR",
    technology: "TECHNOLOGY",
    experience: "YoE",
    screeningDone: "Screening Done",
    screeningFeedback: "Feedback",
    rapidFire: "Rapid Fire",
    l1: "L1",
    l2: "L2",
    clientRound: "Client Round",
    offerReleased: "Offer Released",
    onboarded: "Onboarded",
    rejectionType: "Rejection Type",
  },

  mappingStorageKey: "columnMappings",

  getMappings() {
    try {
      const stored = localStorage.getItem(this.mappingStorageKey);
      if (stored) {
        return { ...this.defaultMappings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Error reading mappings:", e);
    }
    return { ...this.defaultMappings };
  },

  saveMappings(mappings) {
    try {
      localStorage.setItem(this.mappingStorageKey, JSON.stringify(mappings));
      return true;
    } catch (e) {
      console.error("Error saving mappings:", e);
      return false;
    }
  },

  // ========================================
  // Helper Functions
  // ========================================

  getValue(row, key) {
    if (!row || !key) return "";
    const value = row[key];
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "yes" : "";
    return String(value).trim();
  },

  /**
   * Check if value is truly empty (pending - not yet scheduled)
   */
  isTrulyEmpty(value) {
    if (value === null || value === undefined) return true;
    const v = String(value).trim();
    return v === "";
  },

  /**
   * Check if value is explicitly skipped (NA, -, nil - intentionally bypassed)
   */
  isExplicitlySkipped(value) {
    if (value === null || value === undefined) return false;
    const v = String(value).toLowerCase().trim();
    return v === "na" || v === "n/a" || v === "-" || v === "--" || v === "nil";
  },

  /**
   * Check if value is skipped OR empty (no actual outcome)
   */
  isSkipped(value) {
    return this.isTrulyEmpty(value) || this.isExplicitlySkipped(value);
  },

  hasValue(value) {
    return !this.isSkipped(value);
  },

  isYes(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    const v = String(value).toLowerCase().trim();
    return v === "yes" || v === "y" || v === "true" || v === "1";
  },

  isNo(value) {
    if (value === null || value === undefined) return false;
    const v = String(value).toLowerCase().trim();
    return v === "no" || v === "n" || v === "false" || v === "0";
  },

  normalizeOutcome(value) {
    if (value === null || value === undefined) return "";
    return String(value).toLowerCase().trim();
  },

  // ========================================
  // Outcome Detection
  // ========================================

  isSelect(value) {
    const v = this.normalizeOutcome(value);
    return v.includes("select") || v.includes("pass") || v.includes("cleared");
  },

  isReject(value) {
    const v = this.normalizeOutcome(value);
    return (
      v.includes("reject") && !v.includes("no-show") && !v.includes("noshow")
    );
  },

  isHold(value) {
    const v = this.normalizeOutcome(value);
    return v.includes("hold");
  },

  isNoShow(value) {
    const v = this.normalizeOutcome(value);
    return (
      v.includes("no-show") || v.includes("noshow") || v.includes("no show")
    );
  },

  isDroppedOrCancelled(value) {
    const v = this.normalizeOutcome(value);
    return v.includes("drop") || v.includes("cancel");
  },

  isReschedule(value) {
    const v = this.normalizeOutcome(value);
    return v.includes("reschedule") || v.includes("re-schedule");
  },

  isToBeScheduled(value) {
    const v = this.normalizeOutcome(value);
    return v.includes("tb ") || v.includes("to be");
  },

  isFeedbackPending(value) {
    const v = this.normalizeOutcome(value);
    return v.includes("feedback pending") || v.includes("awaiting");
  },

  isInProgress(value) {
    return (
      this.isReschedule(value) ||
      this.isToBeScheduled(value) ||
      this.isFeedbackPending(value) ||
      this.normalizeOutcome(value).includes("pending")
    );
  },

  // ========================================
  // Screening Status Determination
  // ========================================

  /**
   * Determine screening status
   * Returns: { status, canProgress }
   * status: 'pending', 'feedbackPending', 'selected', 'rejected', 'hold', 'noshow'
   * canProgress: true only if selected
   */
  getScreeningStatus(screeningDone, screeningFeedback) {
    const result = {
      status: "pending",
      canProgress: false,
      isScreened: false,
      isSelected: false,
      isRejected: false,
      isHold: false,
      isNoShow: false,
      isFeedbackPending: false,
    };

    // Screening = empty → Screening Pending
    if (this.isSkipped(screeningDone)) {
      result.status = "pending";
      return result;
    }

    // Screening = "No" → No-show / Cancelled (interview didn't happen)
    if (this.isNo(screeningDone)) {
      result.status = "noshow";
      result.isNoShow = true;
      return result;
    }

    // Screening = Yes
    if (this.isYes(screeningDone)) {
      result.isScreened = true;

      // Check feedback
      if (this.isSkipped(screeningFeedback)) {
        // Feedback empty → Feedback Pending
        result.status = "feedbackPending";
        result.isFeedbackPending = true;
        return result;
      }

      // Feedback = Select
      if (this.isSelect(screeningFeedback)) {
        result.status = "selected";
        result.isSelected = true;
        result.canProgress = true;
        return result;
      }

      // Feedback = Reject
      if (this.isReject(screeningFeedback)) {
        result.status = "rejected";
        result.isRejected = true;
        return result;
      }

      // Feedback = Hold
      if (this.isHold(screeningFeedback)) {
        result.status = "hold";
        result.isHold = true;
        return result;
      }

      // Feedback = Candidate No-show
      if (this.isNoShow(screeningFeedback)) {
        result.status = "noshow";
        result.isNoShow = true;
        return result;
      }

      // Unknown feedback value - treat as feedback pending
      result.status = "feedbackPending";
      result.isFeedbackPending = true;
    }

    return result;
  },

  // ========================================
  // Stage Pending Determination (RF/L1/L2/Client)
  // ========================================

  /**
   * Determine where candidate is pending in RF→L1→L2→Client pipeline
   * Only called if screening is passed (canProgress = true)
   * Returns: 'rf', 'l1', 'l2', 'client', 'offer', or null
   *
   * KEY LOGIC:
   * - If a later stage has a value, earlier empty/skipped stages were BYPASSED (not pending)
   * - A stage is PENDING only if it's truly empty AND no later stages have values
   * - Explicitly skipped (NA/-) means intentionally bypassed, not pending
   */
  determinePendingStage(rfValue, l1Value, l2Value, clientValue, offerValue) {
    // If offer released, not pending anywhere
    if (this.isYes(offerValue)) {
      return null;
    }

    // Check from LAST stage (Client) backwards to find the furthest stage reached
    // If any stage has a value, all earlier stages are NOT pending (they were skipped/bypassed)

    // Client Round has a value
    if (this.hasValue(clientValue)) {
      if (this.isSelect(clientValue)) return "offer"; // Waiting for offer
      if (this.isInProgress(clientValue)) return "client"; // Still in client round
      return null; // Rejected/Dropped - pipeline ended
    }

    // L2 has a value (Client was not reached yet, or skipped)
    if (this.hasValue(l2Value)) {
      if (this.isSelect(l2Value)) return "client"; // Passed L2, pending Client
      if (this.isInProgress(l2Value)) return "l2"; // Still in L2
      return null; // Rejected at L2 - pipeline ended
    }

    // L1 has a value (L2+ not reached)
    if (this.hasValue(l1Value)) {
      if (this.isSelect(l1Value)) return "l2"; // Passed L1, pending L2
      if (this.isInProgress(l1Value)) return "l1"; // Still in L1
      return null; // Rejected at L1 - pipeline ended
    }

    // RF has a value (L1+ not reached)
    if (this.hasValue(rfValue)) {
      if (this.isSelect(rfValue)) return "l1"; // Passed RF, pending L1
      if (this.isInProgress(rfValue)) return "rf"; // Still in RF
      return null; // Rejected at RF - pipeline ended
    }

    // No stages have values - check if RF is truly empty (pending) or explicitly skipped
    // If RF is explicitly skipped (NA/-), it's not pending - but then where are they?
    // If all stages are explicitly skipped with no values, candidate is in limbo (not pending)
    if (this.isTrulyEmpty(rfValue)) {
      return "rf"; // RF is empty = pending at RF
    }

    // RF is explicitly skipped (NA/-) but no later stages have values
    // This means they haven't started any round yet after skipping RF
    // Check if L1 is truly empty
    if (this.isTrulyEmpty(l1Value)) {
      return "l1"; // L1 is empty = pending at L1 (RF was skipped)
    }

    // L1 is also skipped, check L2
    if (this.isTrulyEmpty(l2Value)) {
      return "l2"; // L2 is empty = pending at L2 (RF, L1 were skipped)
    }

    // L2 is also skipped, check Client
    if (this.isTrulyEmpty(clientValue)) {
      return "client"; // Client is empty = pending at Client (RF, L1, L2 were skipped)
    }

    // All stages are explicitly skipped (NA/-) - not pending anywhere
    return null;
  },

  /**
   * Parse stage outcome for counting
   */
  parseStageOutcome(value) {
    const result = {
      hasValue: false,
      isSelect: false,
      isReject: false,
      isDropped: false,
      isReschedule: false,
      isToBeScheduled: false,
      isFeedbackPending: false,
      isInProgress: false, // Any of the above 3
    };

    if (this.isSkipped(value)) return result;

    result.hasValue = true;

    if (this.isSelect(value)) {
      result.isSelect = true;
    } else if (this.isReject(value)) {
      result.isReject = true;
    } else if (this.isDroppedOrCancelled(value)) {
      result.isDropped = true;
    } else if (this.isToBeScheduled(value)) {
      // Check TB first - "RF TB Reschedule" goes here
      result.isToBeScheduled = true;
      result.isInProgress = true;
    } else if (this.isReschedule(value)) {
      // Pure reschedule without TB - "RF Reschedule" goes here
      result.isReschedule = true;
      result.isInProgress = true;
    } else if (this.isFeedbackPending(value)) {
      result.isFeedbackPending = true;
      result.isInProgress = true;
    } else if (this.isInProgress(value)) {
      result.isInProgress = true;
    }

    return result;
  },

  // ========================================
  // Main Calculate Function
  // ========================================

  calculate(data, headers) {
    const mappings = this.getMappings();

    const results = {
      // Overview
      totalProfiles: data.length,
      interviewsScheduled: 0,
      totalOffers: 0,
      totalOnboarded: 0,

      // Screening
      screeningPending: 0,
      screeningFeedbackPending: 0,
      screeningSelected: 0,
      screeningRejected: 0,
      screeningHold: 0,
      screeningNoShow: 0,

      // Funnel (reached each stage)
      rfReached: 0,
      l1Reached: 0,
      l2Reached: 0,
      clientReached: 0,

      // Pending at each stage
      rfPending: 0,
      l1Pending: 0,
      l2Pending: 0,
      clientPending: 0,
      offerPending: 0,

      // RF outcomes
      rfSelected: 0,
      rfRejected: 0,
      rfDropped: 0,
      rfReschedule: 0,
      rfToBeScheduled: 0,
      rfFeedbackPending: 0,
      rfInProgress: 0,

      // L1 outcomes
      l1Selected: 0,
      l1Rejected: 0,
      l1Dropped: 0,
      l1Reschedule: 0,
      l1ToBeScheduled: 0,
      l1FeedbackPending: 0,
      l1InProgress: 0,

      // L2 outcomes
      l2Selected: 0,
      l2Rejected: 0,
      l2Dropped: 0,
      l2Reschedule: 0,
      l2ToBeScheduled: 0,
      l2FeedbackPending: 0,
      l2InProgress: 0,

      // Client outcomes
      clientSelected: 0,
      clientRejected: 0,
      clientDropped: 0,
      clientReschedule: 0,
      clientToBeScheduled: 0,
      clientFeedbackPending: 0,
      clientInProgress: 0,

      // Quality
      noShowCount: 0,
      technicalRejections: 0,
      hrRejections: 0,

      // Summaries
      vendorSummary: {},
      techSummary: {},
      expSummary: {},
    };

    data.forEach((row) => {
      // Skip completely empty rows
      const hasData = Object.values(row).some((v) => this.hasValue(v));
      if (!hasData) return;

      // Get values
      const screeningDone = this.getValue(row, mappings.screeningDone);
      const screeningFeedback = this.getValue(row, mappings.screeningFeedback);
      const rfValue = this.getValue(row, mappings.rapidFire);
      const l1Value = this.getValue(row, mappings.l1);
      const l2Value = this.getValue(row, mappings.l2);
      const clientValue = this.getValue(row, mappings.clientRound);
      const offerValue = this.getValue(row, mappings.offerReleased);
      const onboardedValue = this.getValue(row, mappings.onboarded);

      // === SCREENING ===
      const screening = this.getScreeningStatus(
        screeningDone,
        screeningFeedback
      );

      if (screening.isScreened) {
        results.interviewsScheduled++;
      }

      // Count screening outcomes
      switch (screening.status) {
        case "pending":
          results.screeningPending++;
          break;
        case "feedbackPending":
          results.screeningFeedbackPending++;
          break;
        case "selected":
          results.screeningSelected++;
          break;
        case "rejected":
          results.screeningRejected++;
          break;
        case "hold":
          results.screeningHold++;
          break;
        case "noshow":
          results.screeningNoShow++;
          results.noShowCount++;
          break;
      }

      // === PIPELINE (only if screening passed) ===
      if (screening.canProgress) {
        // Determine pending stage
        const pendingStage = this.determinePendingStage(
          rfValue,
          l1Value,
          l2Value,
          clientValue,
          offerValue
        );

        if (pendingStage === "rf") results.rfPending++;
        else if (pendingStage === "l1") results.l1Pending++;
        else if (pendingStage === "l2") results.l2Pending++;
        else if (pendingStage === "client") results.clientPending++;
        else if (pendingStage === "offer") results.offerPending++;

        // Count RF outcomes
        const rfResult = this.parseStageOutcome(rfValue);
        if (rfResult.hasValue) {
          results.rfReached++;
          if (rfResult.isSelect) results.rfSelected++;
          else if (rfResult.isReject) results.rfRejected++;
          else if (rfResult.isDropped) results.rfDropped++;
          else if (rfResult.isReschedule) results.rfReschedule++;
          else if (rfResult.isToBeScheduled) results.rfToBeScheduled++;
          else if (rfResult.isFeedbackPending) results.rfFeedbackPending++;
          if (rfResult.isInProgress) results.rfInProgress++;
        }

        // Count L1 outcomes
        const l1Result = this.parseStageOutcome(l1Value);
        if (l1Result.hasValue) {
          results.l1Reached++;
          if (l1Result.isSelect) results.l1Selected++;
          else if (l1Result.isReject) results.l1Rejected++;
          else if (l1Result.isDropped) results.l1Dropped++;
          else if (l1Result.isReschedule) results.l1Reschedule++;
          else if (l1Result.isToBeScheduled) results.l1ToBeScheduled++;
          else if (l1Result.isFeedbackPending) results.l1FeedbackPending++;
          if (l1Result.isInProgress) results.l1InProgress++;
        }

        // Count L2 outcomes
        const l2Result = this.parseStageOutcome(l2Value);
        if (l2Result.hasValue) {
          results.l2Reached++;
          if (l2Result.isSelect) results.l2Selected++;
          else if (l2Result.isReject) results.l2Rejected++;
          else if (l2Result.isDropped) results.l2Dropped++;
          else if (l2Result.isReschedule) results.l2Reschedule++;
          else if (l2Result.isToBeScheduled) results.l2ToBeScheduled++;
          else if (l2Result.isFeedbackPending) results.l2FeedbackPending++;
          if (l2Result.isInProgress) results.l2InProgress++;
        }

        // Count Client outcomes
        const clientResult = this.parseStageOutcome(clientValue);
        if (clientResult.hasValue) {
          results.clientReached++;
          if (clientResult.isSelect) results.clientSelected++;
          else if (clientResult.isReject) results.clientRejected++;
          else if (clientResult.isDropped) results.clientDropped++;
          else if (clientResult.isReschedule) results.clientReschedule++;
          else if (clientResult.isToBeScheduled) results.clientToBeScheduled++;
          else if (clientResult.isFeedbackPending)
            results.clientFeedbackPending++;
          if (clientResult.isInProgress) results.clientInProgress++;
        }
      }

      // === OFFERS & ONBOARDING ===
      if (this.isYes(offerValue)) {
        results.totalOffers++;
      }
      if (this.isYes(onboardedValue)) {
        results.totalOnboarded++;
      }

      // === REJECTION TYPES ===
      const rejectionType = this.normalizeOutcome(
        this.getValue(row, mappings.rejectionType)
      );
      if (
        rejectionType.includes("technical") ||
        rejectionType.includes("tech")
      ) {
        results.technicalRejections++;
      } else if (
        rejectionType.includes("hr") ||
        rejectionType.includes("soft")
      ) {
        results.hrRejections++;
      }

      // === VENDOR SUMMARY ===
      const vendor = this.getValue(row, mappings.vendor) || "Unknown";
      if (!results.vendorSummary[vendor]) {
        results.vendorSummary[vendor] = {
          profiles: 0,
          screened: 0,
          screeningSelected: 0,
          screeningRejected: 0,
          screeningHold: 0,
          screeningPending: 0,
          rfPending: 0,
          rfSelected: 0,
          rfRejected: 0,
          l1Pending: 0,
          l1Selected: 0,
          l1Rejected: 0,
          l2Pending: 0,
          l2Selected: 0,
          l2Rejected: 0,
          clientPending: 0,
          clientSelected: 0,
          clientRejected: 0,
          offers: 0,
          onboarded: 0,
        };
      }
      const vendorData = results.vendorSummary[vendor];
      vendorData.profiles++;

      if (screening.isScreened) {
        vendorData.screened++;
      }
      if (screening.isSelected) vendorData.screeningSelected++;
      if (screening.isRejected) vendorData.screeningRejected++;
      if (screening.isHold) vendorData.screeningHold++;
      if (screening.status === "pending") vendorData.screeningPending++;

      // Stage pending counts per vendor
      if (screening.canProgress) {
        const vendorPendingStage = this.determinePendingStage(
          rfValue,
          l1Value,
          l2Value,
          clientValue,
          offerValue
        );
        if (vendorPendingStage === "rf") vendorData.rfPending++;
        else if (vendorPendingStage === "l1") vendorData.l1Pending++;
        else if (vendorPendingStage === "l2") vendorData.l2Pending++;
        else if (vendorPendingStage === "client") vendorData.clientPending++;

        // Stage outcomes per vendor
        const vendorRfResult = this.parseStageOutcome(rfValue);
        if (vendorRfResult.isSelect) vendorData.rfSelected++;
        if (vendorRfResult.isReject) vendorData.rfRejected++;

        const vendorL1Result = this.parseStageOutcome(l1Value);
        if (vendorL1Result.isSelect) vendorData.l1Selected++;
        if (vendorL1Result.isReject) vendorData.l1Rejected++;

        const vendorL2Result = this.parseStageOutcome(l2Value);
        if (vendorL2Result.isSelect) vendorData.l2Selected++;
        if (vendorL2Result.isReject) vendorData.l2Rejected++;

        const vendorClientResult = this.parseStageOutcome(clientValue);
        if (vendorClientResult.isSelect) vendorData.clientSelected++;
        if (vendorClientResult.isReject) vendorData.clientRejected++;
      }

      // Offers and onboarded per vendor
      if (this.isYes(offerValue)) vendorData.offers++;
      if (this.isYes(onboardedValue)) vendorData.onboarded++;

      // === TECHNOLOGY SUMMARY ===
      const tech = this.getValue(row, mappings.technology) || "Other";
      if (!results.techSummary[tech]) {
        results.techSummary[tech] = { profiles: 0, selected: 0 };
      }
      results.techSummary[tech].profiles++;
      if (this.isYes(offerValue)) {
        results.techSummary[tech].selected++;
      }

      // === EXPERIENCE SUMMARY ===
      const expValue = this.getValue(row, mappings.experience);
      const exp = this.parseExperience(expValue);
      const expBracket = this.getExperienceBracket(exp);
      if (!results.expSummary[expBracket]) {
        results.expSummary[expBracket] = 0;
      }
      results.expSummary[expBracket]++;
    });

    return results;
  },

  parseExperience(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    const num = parseFloat(
      String(value)
        .trim()
        .replace(/[^0-9.]/g, "")
    );
    return isNaN(num) ? 0 : num;
  },

  getExperienceBracket(years) {
    if (years < 3) return "0-3 years";
    if (years < 5) return "3-5 years";
    if (years < 10) return "5-10 years";
    return "10+ years";
  },
};

window.Analytics = Analytics;
