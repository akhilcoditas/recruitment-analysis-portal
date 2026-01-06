/**
 * Recruitment Analytics Calculator
 *
 * This module calculates all recruitment metrics from the spreadsheet data.
 * It uses column mappings to work with any spreadsheet structure.
 */

const Analytics = {
  // Default column mappings (user can customize these)
  defaultMappings: {
    vendor: "Vendor",
    technology: "Technology",
    experience: "Experience",
    screeningDone: "Screening Done",
    screeningOutcome: "Screening Outcome",
    rapidFireDone: "Rapid Fire Done",
    rapidFireOutcome: "Rapid Fire Outcome",
    l1Scheduled: "L1 Scheduled",
    l1Outcome: "L1 Outcome",
    l2Scheduled: "L2 Scheduled",
    l2Outcome: "L2 Outcome",
    clientScheduled: "Client Round Scheduled",
    clientOutcome: "Client Round Outcome",
    offerReleased: "Offer Released",
    onboarded: "Onboarded",
    rejectionType: "Rejection Type",
  },

  // Storage key for mappings
  mappingStorageKey: "columnMappings",

  /**
   * Get column mappings from localStorage or use defaults
   */
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

  /**
   * Save column mappings to localStorage
   */
  saveMappings(mappings) {
    try {
      localStorage.setItem(this.mappingStorageKey, JSON.stringify(mappings));
      return true;
    } catch (e) {
      console.error("Error saving mappings:", e);
      return false;
    }
  },

  /**
   * Helper to safely get and trim a value from a row
   */
  getValue(row, key) {
    if (!row || !key) return "";
    const value = row[key];
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value;
    return String(value).trim();
  },

  /**
   * Helper to check if a value is "yes" or truthy
   */
  isYes(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    const v = String(value).toLowerCase().trim();
    return (
      v === "yes" ||
      v === "y" ||
      v === "true" ||
      v === "1" ||
      v === "done" ||
      v === "scheduled" ||
      v === "completed"
    );
  },

  /**
   * Helper to normalize outcome values (always returns trimmed lowercase string)
   */
  normalizeOutcome(value) {
    if (value === null || value === undefined) return "";
    return String(value).toLowerCase().trim();
  },

  /**
   * Calculate all analytics from data
   */
  calculate(data, headers) {
    const mappings = this.getMappings();
    const results = {
      // Overview
      totalProfiles: data.length,
      interviewsScheduled: 0,
      totalOffers: 0,
      totalOnboarded: 0,

      // Funnel counts
      screened: 0,
      rapidFireDone: 0,
      l1Scheduled: 0,
      l2Scheduled: 0,
      clientScheduled: 0,

      // Screening outcomes
      screeningSelected: 0,
      screeningRejected: 0,
      screeningHold: 0,

      // Rapid Fire outcomes
      rapidFirePassed: 0,
      rapidFireRejected: 0,

      // L1 outcomes
      l1Selected: 0,
      l1Rejected: 0,

      // L2 outcomes
      l2Selected: 0,
      l2Rejected: 0,

      // Client outcomes
      clientSelected: 0,
      clientRejected: 0,

      // Quality metrics
      noShows: 0,
      technicalRejections: 0,
      hrRejections: 0,

      // Summaries
      vendorSummary: {},
      techSummary: {},
      expSummary: {},
    };

    // Process each row
    data.forEach((row) => {
      // Get trimmed values using helper
      const screeningDoneValue = this.getValue(row, mappings.screeningDone);
      const screeningDone = this.isYes(screeningDoneValue);

      if (screeningDone) {
        results.interviewsScheduled++;
        results.screened++;

        const screeningOutcome = this.normalizeOutcome(
          this.getValue(row, mappings.screeningOutcome)
        );
        if (screeningOutcome.includes("select")) {
          results.screeningSelected++;
        } else if (screeningOutcome.includes("reject")) {
          results.screeningRejected++;
        } else if (screeningOutcome.includes("hold")) {
          results.screeningHold++;
        }
      } else {
        // No-show = screening not done (only if there's actual data in the row)
        const hasData = Object.values(row).some((v) => {
          const trimmed = String(v || "").trim();
          return trimmed !== "";
        });
        if (hasData) {
          results.noShows++;
        }
      }

      // Rapid Fire
      const rapidFireDoneValue = this.getValue(row, mappings.rapidFireDone);
      const rapidFireDone = this.isYes(rapidFireDoneValue);
      if (rapidFireDone) {
        results.rapidFireDone++;

        const rfOutcome = this.normalizeOutcome(
          this.getValue(row, mappings.rapidFireOutcome)
        );
        if (rfOutcome.includes("pass") || rfOutcome.includes("select")) {
          results.rapidFirePassed++;
        } else if (rfOutcome.includes("reject") || rfOutcome.includes("fail")) {
          results.rapidFireRejected++;
        }
      }

      // L1 Round
      const l1ScheduledValue = this.getValue(row, mappings.l1Scheduled);
      const l1Scheduled = this.isYes(l1ScheduledValue);
      if (l1Scheduled) {
        results.l1Scheduled++;

        const l1Outcome = this.normalizeOutcome(
          this.getValue(row, mappings.l1Outcome)
        );
        if (l1Outcome.includes("select") || l1Outcome.includes("pass")) {
          results.l1Selected++;
        } else if (l1Outcome.includes("reject") || l1Outcome.includes("fail")) {
          results.l1Rejected++;
        }
      }

      // L2 Round
      const l2ScheduledValue = this.getValue(row, mappings.l2Scheduled);
      const l2Scheduled = this.isYes(l2ScheduledValue);
      if (l2Scheduled) {
        results.l2Scheduled++;

        const l2Outcome = this.normalizeOutcome(
          this.getValue(row, mappings.l2Outcome)
        );
        if (l2Outcome.includes("select") || l2Outcome.includes("pass")) {
          results.l2Selected++;
        } else if (l2Outcome.includes("reject") || l2Outcome.includes("fail")) {
          results.l2Rejected++;
        }
      }

      // Client Round
      const clientScheduledValue = this.getValue(row, mappings.clientScheduled);
      const clientScheduled = this.isYes(clientScheduledValue);
      if (clientScheduled) {
        results.clientScheduled++;

        const clientOutcome = this.normalizeOutcome(
          this.getValue(row, mappings.clientOutcome)
        );
        if (
          clientOutcome.includes("select") ||
          clientOutcome.includes("pass")
        ) {
          results.clientSelected++;
        } else if (
          clientOutcome.includes("reject") ||
          clientOutcome.includes("fail")
        ) {
          results.clientRejected++;
        }
      }

      // Offers & Onboarding
      const offerValue = this.getValue(row, mappings.offerReleased);
      if (this.isYes(offerValue)) {
        results.totalOffers++;
      }

      const onboardedValue = this.getValue(row, mappings.onboarded);
      if (this.isYes(onboardedValue)) {
        results.totalOnboarded++;
      }

      // Rejection types
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

      // Vendor summary - trim the vendor name
      const vendorRaw = this.getValue(row, mappings.vendor);
      const vendor = vendorRaw || "Unknown";
      if (!results.vendorSummary[vendor]) {
        results.vendorSummary[vendor] = {
          profiles: 0,
          screened: 0,
          selected: 0,
          rejected: 0,
        };
      }
      results.vendorSummary[vendor].profiles++;
      if (screeningDone) {
        results.vendorSummary[vendor].screened++;
        const outcome = this.normalizeOutcome(
          this.getValue(row, mappings.screeningOutcome)
        );
        if (outcome.includes("select")) {
          results.vendorSummary[vendor].selected++;
        } else if (outcome.includes("reject")) {
          results.vendorSummary[vendor].rejected++;
        }
      }

      // Technology summary - trim the tech name
      const techRaw = this.getValue(row, mappings.technology);
      const tech = techRaw || "Other";
      if (!results.techSummary[tech]) {
        results.techSummary[tech] = { profiles: 0, selected: 0 };
      }
      results.techSummary[tech].profiles++;
      if (this.isYes(offerValue)) {
        results.techSummary[tech].selected++;
      }

      // Experience summary
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

  /**
   * Parse experience value to number
   */
  parseExperience(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;

    // Trim and extract number
    const strValue = String(value).trim();
    const num = parseFloat(strValue.replace(/[^0-9.]/g, ""));
    return isNaN(num) ? 0 : num;
  },

  /**
   * Get experience bracket
   */
  getExperienceBracket(years) {
    if (years < 3) return "0-3 years";
    if (years < 5) return "3-5 years";
    if (years < 10) return "5-10 years";
    return "10+ years";
  },
};

window.Analytics = Analytics;
