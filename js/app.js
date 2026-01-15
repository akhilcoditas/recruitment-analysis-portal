/**
 * Main Application Logic
 *
 * Handles UI interactions and data display for recruitment dashboard
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const elements = {
    // Settings Modal
    settingsModal: document.getElementById("settingsModal"),
    settingsBtn: document.getElementById("settingsBtn"),
    closeModal: document.getElementById("closeModal"),
    cancelBtn: document.getElementById("cancelBtn"),
    saveBtn: document.getElementById("saveBtn"),
    webAppUrl: document.getElementById("webAppUrl"),

    // Mapping Modal
    mappingModal: document.getElementById("mappingModal"),
    closeMappingModal: document.getElementById("closeMappingModal"),
    cancelMappingBtn: document.getElementById("cancelMappingBtn"),
    saveMappingBtn: document.getElementById("saveMappingBtn"),
    resetMappingBtn: document.getElementById("resetMappingBtn"),
    mappingGrid: document.getElementById("mappingGrid"),
    mapColumnsBtn: document.getElementById("mapColumnsBtn"),

    // States
    emptyState: document.getElementById("emptyState"),
    loadingState: document.getElementById("loadingState"),
    dashboardContainer: document.getElementById("dashboardContainer"),
    errorState: document.getElementById("errorState"),

    // Status
    statusIndicator: document.getElementById("statusIndicator"),
    lastUpdated: document.getElementById("lastUpdated"),

    // Actions
    connectBtn: document.getElementById("connectBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    retryBtn: document.getElementById("retryBtn"),
    errorMessage: document.getElementById("errorMessage"),

    // Overview Metrics
    totalProfiles: document.getElementById("totalProfiles"),
    interviewsScheduled: document.getElementById("interviewsScheduled"),
    totalOffers: document.getElementById("totalOffers"),
    totalOnboarded: document.getElementById("totalOnboarded"),

    // Screening
    screeningPending: document.getElementById("screeningPending"),
    screeningFeedbackPending: document.getElementById(
      "screeningFeedbackPending"
    ),
    screeningSelected: document.getElementById("screeningSelected"),
    screeningRejected: document.getElementById("screeningRejected"),
    screeningHold: document.getElementById("screeningHold"),
    screeningNoShow: document.getElementById("screeningNoShow"),

    // Funnel
    rfReachedCount: document.getElementById("rfReachedCount"),
    l1ReachedCount: document.getElementById("l1ReachedCount"),
    l2ReachedCount: document.getElementById("l2ReachedCount"),
    clientReachedCount: document.getElementById("clientReachedCount"),

    // Funnel Pending Labels
    rfPendingLabel: document.getElementById("rfPendingLabel"),
    l1PendingLabel: document.getElementById("l1PendingLabel"),
    l2PendingLabel: document.getElementById("l2PendingLabel"),
    clientPendingLabel: document.getElementById("clientPendingLabel"),

    // Outcome Pending Badges
    rfPendingBadge: document.getElementById("rfPendingBadge"),
    l1PendingBadge: document.getElementById("l1PendingBadge"),
    l2PendingBadge: document.getElementById("l2PendingBadge"),
    clientPendingBadge: document.getElementById("clientPendingBadge"),

    // RF Outcomes
    rfSelected: document.getElementById("rfSelected"),
    rfRejected: document.getElementById("rfRejected"),
    rfDropped: document.getElementById("rfDropped"),
    rfReschedule: document.getElementById("rfReschedule"),
    rfToBeScheduled: document.getElementById("rfToBeScheduled"),
    rfFeedbackPending: document.getElementById("rfFeedbackPending"),

    // L1 Outcomes
    l1Selected: document.getElementById("l1Selected"),
    l1Rejected: document.getElementById("l1Rejected"),
    l1Dropped: document.getElementById("l1Dropped"),
    l1Reschedule: document.getElementById("l1Reschedule"),
    l1ToBeScheduled: document.getElementById("l1ToBeScheduled"),
    l1FeedbackPending: document.getElementById("l1FeedbackPending"),

    // L2 Outcomes
    l2Selected: document.getElementById("l2Selected"),
    l2Rejected: document.getElementById("l2Rejected"),
    l2Dropped: document.getElementById("l2Dropped"),
    l2Reschedule: document.getElementById("l2Reschedule"),
    l2ToBeScheduled: document.getElementById("l2ToBeScheduled"),
    l2FeedbackPending: document.getElementById("l2FeedbackPending"),

    // Client Outcomes
    clientSelected: document.getElementById("clientSelected"),
    clientRejected: document.getElementById("clientRejected"),
    clientDropped: document.getElementById("clientDropped"),
    clientReschedule: document.getElementById("clientReschedule"),
    clientToBeScheduled: document.getElementById("clientToBeScheduled"),
    clientFeedbackPending: document.getElementById("clientFeedbackPending"),

    // Quality

    // Tables
    vendorTableBody: document.getElementById("vendorTableBody"),
  };

  let currentData = null;
  let currentHeaders = null;

  // ========================================
  // State Management
  // ========================================

  function showState(stateName) {
    elements.emptyState.classList.remove("active");
    elements.loadingState.classList.remove("active");
    elements.dashboardContainer.classList.remove("active");
    elements.errorState.classList.remove("active");

    switch (stateName) {
      case "empty":
        elements.emptyState.classList.add("active");
        elements.mapColumnsBtn.style.display = "none";
        break;
      case "loading":
        elements.loadingState.classList.add("active");
        break;
      case "dashboard":
        elements.dashboardContainer.classList.add("active");
        elements.mapColumnsBtn.style.display = "inline-flex";
        break;
      case "error":
        elements.errorState.classList.add("active");
        break;
    }
  }

  function updateStatus(connected, message = "") {
    const statusDot = elements.statusIndicator.querySelector(".status-dot");
    const statusText = elements.statusIndicator.querySelector(".status-text");

    statusDot.classList.remove("connected", "error");

    if (connected === true) {
      statusDot.classList.add("connected");
      statusText.textContent = "Connected";
    } else if (connected === false) {
      statusDot.classList.add("error");
      statusText.textContent = message || "Error";
    } else {
      statusText.textContent = "Not Connected";
    }
  }

  function updateLastFetched(dateString) {
    if (dateString) {
      const date = new Date(dateString);
      elements.lastUpdated.textContent = `Updated: ${date.toLocaleTimeString()}`;
    } else {
      elements.lastUpdated.textContent = "";
    }
  }

  // ========================================
  // Settings Modal
  // ========================================

  function openSettingsModal() {
    const config = CONFIG.get();
    elements.webAppUrl.value = config.webAppUrl || "";
    elements.settingsModal.classList.add("active");
    elements.webAppUrl.focus();
  }

  function closeSettingsModal() {
    elements.settingsModal.classList.remove("active");
  }

  // ========================================
  // Column Mapping Modal
  // ========================================

  function openMappingModal() {
    if (!currentHeaders) return;

    const mappings = Analytics.getMappings();
    const fields = [
      { key: "vendor", label: "Vendor Name" },
      { key: "technology", label: "Technology" },
      { key: "experience", label: "Experience (Years)" },
      { key: "screeningDone", label: "Screening Done (Yes/No)" },
      {
        key: "screeningFeedback",
        label: "Screening Feedback (Select/Reject/Hold)",
      },
      { key: "rapidFire", label: "Rapid Fire (RF Select, RF Reject, etc.)" },
      { key: "l1", label: "L1 Round (L1 Select, L1 Reject, etc.)" },
      { key: "l2", label: "L2 Round (L2 Select, L2 Reject, etc.)" },
      { key: "clientRound", label: "Client Round" },
      { key: "offerReleased", label: "Offer Released" },
      { key: "onboarded", label: "Onboarded" },
      { key: "rejectionType", label: "Rejection Type (Technical/HR)" },
    ];

    elements.mappingGrid.innerHTML = fields
      .map(
        (field) => `
      <div class="mapping-row">
        <label>${field.label}</label>
        <select data-field="${field.key}">
          <option value="">-- Not Mapped --</option>
          ${currentHeaders
            .map(
              (h) => `
            <option value="${escapeHtml(h)}" ${
                mappings[field.key] === h ? "selected" : ""
              }>${escapeHtml(h)}</option>
          `
            )
            .join("")}
        </select>
      </div>
    `
      )
      .join("");

    elements.mappingModal.classList.add("active");
  }

  function closeMappingModal() {
    elements.mappingModal.classList.remove("active");
  }

  function saveMappings() {
    const selects = elements.mappingGrid.querySelectorAll("select");
    const mappings = {};

    selects.forEach((select) => {
      const field = select.dataset.field;
      const value = select.value;
      if (value) {
        mappings[field] = value;
      }
    });

    Analytics.saveMappings(mappings);
    closeMappingModal();

    if (currentData) {
      displayDashboard(currentData, currentHeaders);
    }
  }

  // ========================================
  // Data Fetching & Display
  // ========================================

  async function fetchAndDisplayData() {
    const config = CONFIG.get();

    if (!config.webAppUrl) {
      showState("empty");
      updateStatus(null);
      return;
    }

    showState("loading");

    try {
      const result = await GoogleSheets.fetchData(config.webAppUrl);

      currentData = result.data;
      currentHeaders = result.headers;

      displayDashboard(result.data, result.headers);
      updateStatus(true);
      updateLastFetched(result.fetchedAt);
      showState("dashboard");
    } catch (error) {
      console.error("Fetch error:", error);
      elements.errorMessage.textContent = error.message;
      updateStatus(false, "Connection Failed");
      showState("error");
    }
  }

  function displayDashboard(data, headers) {
    const analytics = Analytics.calculate(data, headers);

    // Overview metrics
    animateValue(elements.totalProfiles, analytics.totalProfiles);
    animateValue(elements.interviewsScheduled, analytics.interviewsScheduled);
    animateValue(elements.totalOffers, analytics.totalOffers);
    animateValue(elements.totalOnboarded, analytics.totalOnboarded);

    // Screening breakdown
    animateValue(elements.screeningPending, analytics.screeningPending);
    animateValue(
      elements.screeningFeedbackPending,
      analytics.screeningFeedbackPending
    );
    animateValue(elements.screeningSelected, analytics.screeningSelected);
    animateValue(elements.screeningRejected, analytics.screeningRejected);
    animateValue(elements.screeningHold, analytics.screeningHold);
    animateValue(elements.screeningNoShow, analytics.screeningNoShow);

    // Funnel - reached counts
    animateValue(elements.rfReachedCount, analytics.rfReached);
    animateValue(elements.l1ReachedCount, analytics.l1Reached);
    animateValue(elements.l2ReachedCount, analytics.l2Reached);
    animateValue(elements.clientReachedCount, analytics.clientReached);

    // Funnel - pending labels
    elements.rfPendingLabel.textContent = `${analytics.rfPending} pending`;
    elements.l1PendingLabel.textContent = `${analytics.l1Pending} pending`;
    elements.l2PendingLabel.textContent = `${analytics.l2Pending} pending`;

    // Outcome cards - pending badges
    if (elements.rfPendingBadge)
      elements.rfPendingBadge.textContent = `${analytics.rfPending} pending`;
    if (elements.l1PendingBadge)
      elements.l1PendingBadge.textContent = `${analytics.l1Pending} pending`;
    if (elements.l2PendingBadge)
      elements.l2PendingBadge.textContent = `${analytics.l2Pending} pending`;
    if (elements.clientPendingBadge)
      elements.clientPendingBadge.textContent = `${analytics.clientPending} pending`;
    elements.clientPendingLabel.textContent = `${analytics.clientPending} pending`;

    // === RF Outcomes ===
    const rfTotal =
      analytics.rfSelected +
        analytics.rfRejected +
        analytics.rfDropped +
        analytics.rfReschedule +
        analytics.rfToBeScheduled +
        analytics.rfFeedbackPending || 1;
    updateOutcomeBar("rfSelected", analytics.rfSelected, rfTotal);
    updateOutcomeBar("rfRejected", analytics.rfRejected, rfTotal);
    updateOutcomeBar("rfDropped", analytics.rfDropped, rfTotal);
    updateOutcomeBar("rfReschedule", analytics.rfReschedule, rfTotal);
    updateOutcomeBar("rfToBeScheduled", analytics.rfToBeScheduled, rfTotal);
    updateOutcomeBar("rfFeedbackPending", analytics.rfFeedbackPending, rfTotal);

    // === L1 Outcomes ===
    const l1Total =
      analytics.l1Selected +
        analytics.l1Rejected +
        analytics.l1Dropped +
        analytics.l1Reschedule +
        analytics.l1ToBeScheduled +
        analytics.l1FeedbackPending || 1;
    updateOutcomeBar("l1Selected", analytics.l1Selected, l1Total);
    updateOutcomeBar("l1Rejected", analytics.l1Rejected, l1Total);
    updateOutcomeBar("l1Dropped", analytics.l1Dropped, l1Total);
    updateOutcomeBar("l1Reschedule", analytics.l1Reschedule, l1Total);
    updateOutcomeBar("l1ToBeScheduled", analytics.l1ToBeScheduled, l1Total);
    updateOutcomeBar("l1FeedbackPending", analytics.l1FeedbackPending, l1Total);

    // === L2 Outcomes ===
    const l2Total =
      analytics.l2Selected +
        analytics.l2Rejected +
        analytics.l2Dropped +
        analytics.l2Reschedule +
        analytics.l2ToBeScheduled +
        analytics.l2FeedbackPending || 1;
    updateOutcomeBar("l2Selected", analytics.l2Selected, l2Total);
    updateOutcomeBar("l2Rejected", analytics.l2Rejected, l2Total);
    updateOutcomeBar("l2Dropped", analytics.l2Dropped, l2Total);
    updateOutcomeBar("l2Reschedule", analytics.l2Reschedule, l2Total);
    updateOutcomeBar("l2ToBeScheduled", analytics.l2ToBeScheduled, l2Total);
    updateOutcomeBar("l2FeedbackPending", analytics.l2FeedbackPending, l2Total);

    // === Client Outcomes ===
    const clientTotal =
      analytics.clientSelected +
        analytics.clientRejected +
        analytics.clientDropped +
        analytics.clientReschedule +
        analytics.clientToBeScheduled +
        analytics.clientFeedbackPending || 1;
    updateOutcomeBar("clientSelected", analytics.clientSelected, clientTotal);
    updateOutcomeBar("clientRejected", analytics.clientRejected, clientTotal);
    updateOutcomeBar("clientDropped", analytics.clientDropped, clientTotal);
    updateOutcomeBar(
      "clientReschedule",
      analytics.clientReschedule,
      clientTotal
    );
    updateOutcomeBar(
      "clientToBeScheduled",
      analytics.clientToBeScheduled,
      clientTotal
    );
    updateOutcomeBar(
      "clientFeedbackPending",
      analytics.clientFeedbackPending,
      clientTotal
    );

    // Quality metrics

    // Tables
    displayVendorTable(analytics.vendorSummary);
    displayTechSummary(analytics.techSummary);
    displayExpSummary(analytics.expSummary);
  }

  function updateOutcomeBar(id, value, total) {
    const valueEl = document.getElementById(id);
    const barEl = document.getElementById(id + "Bar");

    if (valueEl) animateValue(valueEl, value);
    if (barEl) {
      const percentage = Math.round((value / total) * 100);
      setTimeout(() => {
        barEl.style.width = percentage + "%";
      }, 100);
    }
  }

  // Vendor table sorting state
  let vendorSortKey = "profiles";
  let vendorSortAsc = false;
  let currentVendorSummary = null;

  function displayVendorTable(
    vendorSummary,
    sortKey = vendorSortKey,
    sortAsc = vendorSortAsc
  ) {
    currentVendorSummary = vendorSummary;
    vendorSortKey = sortKey;
    vendorSortAsc = sortAsc;

    // Calculate success rate for each vendor
    const vendorsWithRate = Object.entries(vendorSummary).map(
      ([vendor, stats]) => {
        // Success rate = (screening selected / profiles) * 100
        const successRate =
          stats.profiles > 0
            ? Math.round((stats.screeningSelected / stats.profiles) * 100)
            : 0;
        return [vendor, { ...stats, successRate }];
      }
    );

    // Sort vendors
    const vendors = vendorsWithRate.sort((a, b) => {
      let valA, valB;
      if (sortKey === "vendor") {
        valA = a[0].toLowerCase();
        valB = b[0].toLowerCase();
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortKey === "profiles") {
        valA = a[1].profiles;
        valB = b[1].profiles;
      } else if (sortKey === "successRate") {
        valA = a[1].successRate;
        valB = b[1].successRate;
      } else {
        valA = a[1].profiles;
        valB = b[1].profiles;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    if (vendors.length === 0) {
      elements.vendorTableBody.innerHTML = `
        <tr><td colspan="10" style="text-align: center; color: var(--text-muted);">No vendor data available</td></tr>
      `;
      return;
    }

    // Update sort icons
    document.querySelectorAll("#vendorTable th.sortable").forEach((th) => {
      const icon = th.querySelector(".sort-icon");
      if (th.dataset.sort === sortKey) {
        icon.textContent = sortAsc ? "↑" : "↓";
        th.classList.add("sorted");
      } else {
        icon.textContent = "↕";
        th.classList.remove("sorted");
      }
    });

    // Helper to create stage cell with colored badges
    function stageCell(
      selected,
      rejected,
      pending,
      hold = 0,
      rescheduled = 0,
      toBeRescheduled = 0
    ) {
      const parts = [];
      if (selected > 0)
        parts.push(
          `<span class="stage-badge success" title="Selected">${selected}</span>`
        );
      if (rejected > 0)
        parts.push(
          `<span class="stage-badge danger" title="Rejected">${rejected}</span>`
        );
      if (pending > 0)
        parts.push(
          `<span class="stage-badge warning" title="Pending">${pending}</span>`
        );
      if (hold > 0)
        parts.push(
          `<span class="stage-badge hold" title="On Hold">${hold}</span>`
        );
      if (rescheduled > 0)
        parts.push(
          `<span class="stage-badge info" title="Rescheduled">${rescheduled}</span>`
        );
      if (toBeRescheduled > 0)
        parts.push(
          `<span class="stage-badge purple" title="To Be Rescheduled">${toBeRescheduled}</span>`
        );
      return parts.length > 0
        ? parts.join(" ")
        : '<span class="stage-badge muted">-</span>';
    }

    // Helper to get success rate badge color
    function getSuccessRateClass(rate) {
      if (rate >= 20) return "success";
      if (rate >= 10) return "warning";
      if (rate > 0) return "danger";
      return "muted";
    }

    elements.vendorTableBody.innerHTML = vendors
      .map(([vendor, stats]) => {
        const rateClass = getSuccessRateClass(stats.successRate);
        return `
        <tr>
          <td><strong>${escapeHtml(vendor)}</strong></td>
          <td>${stats.profiles}</td>
          <td>${stageCell(
            stats.screeningSelected,
            stats.screeningRejected,
            stats.screeningPending,
            stats.screeningHold
          )}</td>
          <td>${stageCell(
            stats.rfSelected,
            stats.rfRejected,
            stats.rfPending,
            0,
            stats.rfReschedule || 0,
            stats.rfToBeRescheduled || 0
          )}</td>
          <td>${stageCell(
            stats.l1Selected,
            stats.l1Rejected,
            stats.l1Pending,
            0,
            stats.l1Reschedule || 0,
            stats.l1ToBeRescheduled || 0
          )}</td>
          <td>${stageCell(
            stats.l2Selected,
            stats.l2Rejected,
            stats.l2Pending,
            0,
            stats.l2Reschedule || 0,
            stats.l2ToBeRescheduled || 0
          )}</td>
          <td>${stageCell(
            stats.clientSelected,
            stats.clientRejected,
            stats.clientPending,
            0,
            stats.clientReschedule || 0,
            stats.clientToBeRescheduled || 0
          )}</td>
          <td><strong>${stats.offers}</strong></td>
          <td><strong>${stats.onboarded}</strong></td>
          <td><span class="stage-badge ${rateClass}">${
          stats.successRate
        }%</span></td>
        </tr>
      `;
      })
      .join("");
  }

  // Vendor table sorting click handler
  document.querySelectorAll("#vendorTable th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const newSortKey = th.dataset.sort;
      const newSortAsc = vendorSortKey === newSortKey ? !vendorSortAsc : false;
      if (currentVendorSummary) {
        displayVendorTable(currentVendorSummary, newSortKey, newSortAsc);
      }
    });
  });

  // Tech table sorting state
  let techSortKey = "profiles";
  let techSortAsc = false;
  let currentTechSummary = null;

  function displayTechSummary(
    techSummary,
    sortKey = techSortKey,
    sortAsc = techSortAsc
  ) {
    currentTechSummary = techSummary;
    techSortKey = sortKey;
    techSortAsc = sortAsc;

    const techTableBody = document.getElementById("techTableBody");
    if (!techTableBody) return;

    // Calculate metrics for each tech
    const techsWithMetrics = Object.entries(techSummary).map(
      ([tech, stats]) => {
        // Success rate = (screened / profiles) * 100
        const successRate =
          stats.profiles > 0
            ? Math.round((stats.screened / stats.profiles) * 100)
            : 0;
        const avgExp =
          stats.expCount > 0
            ? (stats.totalExp / stats.expCount).toFixed(1)
            : "-";
        return [tech, { ...stats, successRate, avgExp }];
      }
    );

    // Sort
    const techs = techsWithMetrics.sort((a, b) => {
      let valA, valB;
      if (sortKey === "tech") {
        valA = a[0].toLowerCase();
        valB = b[0].toLowerCase();
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortKey === "profiles") {
        valA = a[1].profiles;
        valB = b[1].profiles;
      } else if (sortKey === "offers") {
        valA = a[1].offers;
        valB = b[1].offers;
      } else if (sortKey === "rate") {
        valA = a[1].successRate;
        valB = b[1].successRate;
      } else {
        valA = a[1].profiles;
        valB = b[1].profiles;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    if (techs.length === 0) {
      techTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No data</td></tr>`;
      return;
    }

    // Update sort icons
    document.querySelectorAll("#techTable th.sortable-tech").forEach((th) => {
      const icon = th.querySelector(".sort-icon");
      if (th.dataset.sort === sortKey) {
        icon.textContent = sortAsc ? "↑" : "↓";
        th.classList.add("sorted");
      } else {
        icon.textContent = "↕";
        th.classList.remove("sorted");
      }
    });

    function getRateClass(rate) {
      if (rate >= 15) return "success";
      if (rate >= 5) return "warning";
      if (rate > 0) return "danger";
      return "muted";
    }

    techTableBody.innerHTML = techs
      .map(([tech, stats]) => {
        const rateClass = getRateClass(stats.successRate);
        return `
        <tr>
          <td><strong>${escapeHtml(tech)}</strong></td>
          <td>${stats.profiles}</td>
          <td>${stats.screened}</td>
          <td><strong>${stats.offers}</strong></td>
          <td><span class="stage-badge ${rateClass}">${
          stats.successRate
        }%</span></td>
          <td>${stats.avgExp}${stats.avgExp !== "-" ? "Y" : ""}</td>
        </tr>
      `;
      })
      .join("");
  }

  // Tech table sorting click handler
  document.querySelectorAll("#techTable th.sortable-tech").forEach((th) => {
    th.addEventListener("click", () => {
      const newSortKey = th.dataset.sort;
      const newSortAsc = techSortKey === newSortKey ? !techSortAsc : false;
      if (currentTechSummary) {
        displayTechSummary(currentTechSummary, newSortKey, newSortAsc);
      }
    });
  });

  function displayExpSummary(expSummary) {
    const expDistribution = document.getElementById("expDistribution");
    if (!expDistribution) return;

    const brackets = ["0-3 years", "3-5 years", "5-10 years", "10+ years"];
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

    // Calculate total for percentages
    let total = 0;
    brackets.forEach((bracket) => {
      const data = expSummary[bracket];
      total += data ? data.count : 0;
    });

    if (total === 0) {
      expDistribution.innerHTML = `<div style="text-align: center; color: var(--text-muted);">No data</div>`;
      return;
    }

    expDistribution.innerHTML = brackets
      .map((bracket, i) => {
        const data = expSummary[bracket] || {
          count: 0,
          screened: 0,
          offers: 0,
        };
        const percentage = Math.round((data.count / total) * 100);
        const conversionRate =
          data.count > 0 ? Math.round((data.offers / data.count) * 100) : 0;

        return `
        <div class="exp-bar-item">
          <div class="exp-bar-header">
            <span class="exp-label">${bracket}</span>
            <span class="exp-stats">
              <span class="exp-count">${data.count}</span>
              <span class="exp-percentage">(${percentage}%)</span>
            </span>
          </div>
          <div class="exp-bar-container">
            <div class="exp-bar" style="width: ${percentage}%; background: ${colors[i]};"></div>
          </div>
          <div class="exp-bar-footer">
            <span>Screened: ${data.screened}</span>
            <span>Offers: ${data.offers}</span>
            <span class="exp-conversion">Conv: ${conversionRate}%</span>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // ========================================
  // Utility Functions
  // ========================================

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function animateValue(element, targetValue) {
    if (!element) return;

    const duration = 500;
    const startValue = parseInt(element.textContent) || 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(
        startValue + (targetValue - startValue) * easeOut
      );

      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ========================================
  // Event Listeners
  // ========================================

  elements.settingsBtn.addEventListener("click", openSettingsModal);
  elements.connectBtn.addEventListener("click", openSettingsModal);
  elements.closeModal.addEventListener("click", closeSettingsModal);
  elements.cancelBtn.addEventListener("click", closeSettingsModal);

  elements.settingsModal.addEventListener("click", (e) => {
    if (e.target === elements.settingsModal) closeSettingsModal();
  });

  elements.saveBtn.addEventListener("click", async () => {
    const webAppUrl = elements.webAppUrl.value.trim();

    if (!webAppUrl) {
      elements.webAppUrl.focus();
      return;
    }

    if (
      !webAppUrl.includes("script.google.com") &&
      !webAppUrl.includes("googleusercontent.com")
    ) {
      alert("Please enter a valid Google Apps Script Web App URL.");
      elements.webAppUrl.focus();
      return;
    }

    CONFIG.save({ webAppUrl });
    closeSettingsModal();
    await fetchAndDisplayData();
  });

  elements.mapColumnsBtn.addEventListener("click", openMappingModal);
  elements.closeMappingModal.addEventListener("click", closeMappingModal);
  elements.cancelMappingBtn.addEventListener("click", closeMappingModal);
  elements.saveMappingBtn.addEventListener("click", saveMappings);
  elements.resetMappingBtn.addEventListener("click", () => {
    if (confirm("Reset all column mappings to defaults?")) {
      localStorage.removeItem("columnMappings");
      closeMappingModal();
      if (currentData) {
        displayDashboard(currentData, currentHeaders);
      }
    }
  });

  elements.mappingModal.addEventListener("click", (e) => {
    if (e.target === elements.mappingModal) closeMappingModal();
  });

  elements.refreshBtn.addEventListener("click", () => {
    if (CONFIG.isConfigured()) {
      fetchAndDisplayData();
    } else {
      openSettingsModal();
    }
  });

  elements.retryBtn.addEventListener("click", fetchAndDisplayData);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (elements.settingsModal.classList.contains("active"))
        closeSettingsModal();
      if (elements.mappingModal.classList.contains("active"))
        closeMappingModal();
      if (
        document
          .getElementById("pendingDetailModal")
          ?.classList.contains("active")
      )
        closePendingModal();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "r") {
      e.preventDefault();
      if (CONFIG.isConfigured()) fetchAndDisplayData();
    }
  });

  // ========================================
  // Pending Detail Modal
  // ========================================

  const pendingModal = document.getElementById("pendingDetailModal");
  const pendingModalTitle = document.getElementById("pendingModalTitle");
  const closePendingModalBtn = document.getElementById("closePendingModal");
  const searchInput = document.getElementById("searchInput");
  const filterTech = document.getElementById("filterTech");
  const filterVendor = document.getElementById("filterVendor");
  const filteredCount = document.getElementById("filteredCount");
  const pendingGroupedView = document.getElementById("pendingGroupedView");

  let currentPendingStage = null;
  let currentPendingCandidates = [];

  function openPendingModal(stage) {
    if (!currentData || !currentHeaders) return;

    currentPendingStage = stage;
    const stageNames = {
      rf: "Rapid Fire",
      l1: "L1 Technical",
      l2: "L2 Technical",
      client: "Client Round",
    };

    pendingModalTitle.textContent = `${stageNames[stage]} - Pending Candidates`;

    // Get pending candidates for this stage
    const results = Analytics.calculate(currentData, currentHeaders);
    const listKey = stage + "PendingList";
    currentPendingCandidates = results[listKey] || [];

    // Clear search
    searchInput.value = "";

    // Populate filters
    populateFilters();

    // Render candidates
    renderPendingCandidates();

    // Show modal
    pendingModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closePendingModal() {
    pendingModal.classList.remove("active");
    document.body.style.overflow = "";
    currentPendingStage = null;
    currentPendingCandidates = [];
  }

  function populateFilters() {
    // Get unique technologies
    const techs = [
      ...new Set(
        currentPendingCandidates.map((c) => c.technology).filter(Boolean)
      ),
    ].sort();
    filterTech.innerHTML = '<option value="">All Technologies</option>';
    techs.forEach((tech) => {
      filterTech.innerHTML += `<option value="${tech}">${tech}</option>`;
    });

    // Get unique vendors
    const vendors = [
      ...new Set(currentPendingCandidates.map((c) => c.vendor).filter(Boolean)),
    ].sort();
    filterVendor.innerHTML = '<option value="">All Vendors</option>';
    vendors.forEach((vendor) => {
      filterVendor.innerHTML += `<option value="${vendor}">${vendor}</option>`;
    });
  }

  function renderPendingCandidates() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const techFilter = filterTech.value;
    const vendorFilter = filterVendor.value;

    // Filter candidates
    let filtered = currentPendingCandidates;

    // Search filter (name or vendor)
    if (searchTerm) {
      filtered = filtered.filter((c) => {
        const name = (c.name || "").toLowerCase();
        const vendor = (c.vendor || "").toLowerCase();
        return name.includes(searchTerm) || vendor.includes(searchTerm);
      });
    }

    if (techFilter) {
      filtered = filtered.filter((c) => c.technology === techFilter);
    }
    if (vendorFilter) {
      filtered = filtered.filter((c) => c.vendor === vendorFilter);
    }

    filteredCount.textContent = filtered.length;

    if (filtered.length === 0) {
      pendingGroupedView.innerHTML = `
        <div class="empty-pending">
          <p>No pending candidates found</p>
        </div>
      `;
      return;
    }

    // Group by technology
    const grouped = {};
    filtered.forEach((c) => {
      const tech = c.technology || "Unknown";
      if (!grouped[tech]) grouped[tech] = [];
      grouped[tech].push(c);
    });

    // Render grouped view
    let html = "";
    Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([tech, candidates], index) => {
        const groupId = `tech-group-${index}`;
        html += `
        <div class="pending-tech-group">
          <div class="tech-group-header" onclick="toggleTechGroup('${groupId}')">
            <span class="tech-group-toggle" id="${groupId}-toggle">▼</span>
            <span class="tech-group-name">${tech}</span>
            <span class="tech-count">(${candidates.length})</span>
          </div>
          <div class="tech-group-content" id="${groupId}">
            <table class="pending-detail-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Experience</th>
                  <th>Vendor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${candidates
                  .map(
                    (c) => `
                  <tr>
                    <td>${c.name || "-"}</td>
                    <td>${c.experience || "-"}</td>
                    <td>${c.vendor || "-"}</td>
                    <td><span class="status-pending-badge">${
                      c.status || "Pending"
                    }</span></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
      });

    pendingGroupedView.innerHTML = html;
  }

  // Event listeners for pending modal
  closePendingModalBtn.addEventListener("click", closePendingModal);
  pendingModal.addEventListener("click", (e) => {
    if (e.target === pendingModal) closePendingModal();
  });
  searchInput.addEventListener("input", renderPendingCandidates);
  filterTech.addEventListener("change", renderPendingCandidates);
  filterVendor.addEventListener("change", renderPendingCandidates);

  // Make funnel pending labels clickable
  elements.rfPendingLabel.addEventListener("click", () =>
    openPendingModal("rf")
  );
  elements.l1PendingLabel.addEventListener("click", () =>
    openPendingModal("l1")
  );
  elements.l2PendingLabel.addEventListener("click", () =>
    openPendingModal("l2")
  );
  elements.clientPendingLabel.addEventListener("click", () =>
    openPendingModal("client")
  );

  // Add clickable styling to pending labels
  [
    elements.rfPendingLabel,
    elements.l1PendingLabel,
    elements.l2PendingLabel,
    elements.clientPendingLabel,
  ].forEach((el) => {
    el.style.cursor = "pointer";
    el.style.textDecoration = "underline";
    el.title = "Click to view pending candidates";
  });

  // ========================================
  // Initialize
  // ========================================

  function init() {
    if (CONFIG.isConfigured()) {
      fetchAndDisplayData();
    } else {
      showState("empty");
      updateStatus(null);
    }
  }

  init();
});

// Global function for collapsing tech groups
function toggleTechGroup(groupId) {
  const content = document.getElementById(groupId);
  const toggle = document.getElementById(groupId + "-toggle");

  if (content.classList.contains("collapsed")) {
    content.classList.remove("collapsed");
    toggle.textContent = "▼";
  } else {
    content.classList.add("collapsed");
    toggle.textContent = "►";
  }
}
