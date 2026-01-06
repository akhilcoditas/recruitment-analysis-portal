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

    // Metrics
    totalProfiles: document.getElementById("totalProfiles"),
    interviewsScheduled: document.getElementById("interviewsScheduled"),
    totalOffers: document.getElementById("totalOffers"),
    totalOnboarded: document.getElementById("totalOnboarded"),

    // Funnel
    screenedCount: document.getElementById("screenedCount"),
    rapidFireCount: document.getElementById("rapidFireCount"),
    l1Count: document.getElementById("l1Count"),
    l2Count: document.getElementById("l2Count"),
    clientCount: document.getElementById("clientCount"),

    // Outcomes
    screeningSelected: document.getElementById("screeningSelected"),
    screeningRejected: document.getElementById("screeningRejected"),
    screeningHold: document.getElementById("screeningHold"),
    rapidFirePassed: document.getElementById("rapidFirePassed"),
    rapidFireRejected: document.getElementById("rapidFireRejected"),
    l1Selected: document.getElementById("l1Selected"),
    l1Rejected: document.getElementById("l1Rejected"),
    l2Selected: document.getElementById("l2Selected"),
    l2Rejected: document.getElementById("l2Rejected"),
    clientSelected: document.getElementById("clientSelected"),
    clientRejected: document.getElementById("clientRejected"),

    // Quality
    noShowCount: document.getElementById("noShowCount"),
    technicalRejections: document.getElementById("technicalRejections"),
    hrRejections: document.getElementById("hrRejections"),

    // Tables
    vendorTableBody: document.getElementById("vendorTableBody"),
    techSummary: document.getElementById("techSummary"),
    expSummary: document.getElementById("expSummary"),
  };

  // Current data state
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
      { key: "screeningOutcome", label: "Screening Outcome" },
      { key: "rapidFireDone", label: "Rapid Fire Done" },
      { key: "rapidFireOutcome", label: "Rapid Fire Outcome" },
      { key: "l1Scheduled", label: "L1 Scheduled" },
      { key: "l1Outcome", label: "L1 Outcome" },
      { key: "l2Scheduled", label: "L2 Scheduled" },
      { key: "l2Outcome", label: "L2 Outcome" },
      { key: "clientScheduled", label: "Client Round Scheduled" },
      { key: "clientOutcome", label: "Client Round Outcome" },
      { key: "offerReleased", label: "Offer Released" },
      { key: "onboarded", label: "Onboarded" },
      { key: "rejectionType", label: "Rejection Type" },
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

    // Recalculate with new mappings
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

    // Funnel
    animateValue(elements.screenedCount, analytics.screened);
    animateValue(elements.rapidFireCount, analytics.rapidFireDone);
    animateValue(elements.l1Count, analytics.l1Scheduled);
    animateValue(elements.l2Count, analytics.l2Scheduled);
    animateValue(elements.clientCount, analytics.clientScheduled);

    // Screening outcomes
    const screeningTotal =
      analytics.screeningSelected +
        analytics.screeningRejected +
        analytics.screeningHold || 1;
    updateOutcomeBar(
      "screeningSelected",
      analytics.screeningSelected,
      screeningTotal
    );
    updateOutcomeBar(
      "screeningRejected",
      analytics.screeningRejected,
      screeningTotal
    );
    updateOutcomeBar("screeningHold", analytics.screeningHold, screeningTotal);

    // Rapid Fire outcomes
    const rfTotal =
      analytics.rapidFirePassed + analytics.rapidFireRejected || 1;
    updateOutcomeBar("rapidFirePassed", analytics.rapidFirePassed, rfTotal);
    updateOutcomeBar("rapidFireRejected", analytics.rapidFireRejected, rfTotal);

    // L1 outcomes
    const l1Total = analytics.l1Selected + analytics.l1Rejected || 1;
    updateOutcomeBar("l1Selected", analytics.l1Selected, l1Total);
    updateOutcomeBar("l1Rejected", analytics.l1Rejected, l1Total);

    // L2 outcomes
    const l2Total = analytics.l2Selected + analytics.l2Rejected || 1;
    updateOutcomeBar("l2Selected", analytics.l2Selected, l2Total);
    updateOutcomeBar("l2Rejected", analytics.l2Rejected, l2Total);

    // Client outcomes
    const clientTotal =
      analytics.clientSelected + analytics.clientRejected || 1;
    updateOutcomeBar("clientSelected", analytics.clientSelected, clientTotal);
    updateOutcomeBar("clientRejected", analytics.clientRejected, clientTotal);

    // Quality metrics
    animateValue(elements.noShowCount, analytics.noShows);
    animateValue(elements.technicalRejections, analytics.technicalRejections);
    animateValue(elements.hrRejections, analytics.hrRejections);

    // Vendor table
    displayVendorTable(analytics.vendorSummary);

    // Tech summary
    displayTechSummary(analytics.techSummary);

    // Experience summary
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

  function displayVendorTable(vendorSummary) {
    const vendors = Object.entries(vendorSummary).sort(
      (a, b) => b[1].profiles - a[1].profiles
    );

    elements.vendorTableBody.innerHTML = vendors
      .map(([vendor, stats]) => {
        const successRate =
          stats.screened > 0
            ? Math.round((stats.selected / stats.screened) * 100)
            : 0;
        const rateClass =
          successRate >= 50 ? "high" : successRate >= 25 ? "medium" : "low";

        return `
        <tr>
          <td>${escapeHtml(vendor)}</td>
          <td>${stats.profiles}</td>
          <td>${stats.screened}</td>
          <td>${stats.selected}</td>
          <td>${stats.rejected}</td>
          <td><span class="success-rate ${rateClass}">${successRate}%</span></td>
        </tr>
      `;
      })
      .join("");
  }

  function displayTechSummary(techSummary) {
    const techs = Object.entries(techSummary).sort(
      (a, b) => b[1].profiles - a[1].profiles
    );

    elements.techSummary.innerHTML = techs
      .map(
        ([tech, stats]) => `
      <div class="summary-item">
        <span class="summary-item-name">${escapeHtml(tech)}</span>
        <div class="summary-item-stats">
          <span><span class="count">${stats.profiles}</span> profiles</span>
          <span><span class="selected">${stats.selected}</span> selected</span>
        </div>
      </div>
    `
      )
      .join("");
  }

  function displayExpSummary(expSummary) {
    const brackets = ["0-3 years", "3-5 years", "5-10 years", "10+ years"];

    elements.expSummary.innerHTML = brackets
      .map(
        (bracket) => `
      <div class="summary-item">
        <span class="summary-item-name">${bracket}</span>
        <div class="summary-item-stats">
          <span class="count">${expSummary[bracket] || 0}</span>
        </div>
      </div>
    `
      )
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

  // Settings modal
  elements.settingsBtn.addEventListener("click", openSettingsModal);
  elements.connectBtn.addEventListener("click", openSettingsModal);
  elements.closeModal.addEventListener("click", closeSettingsModal);
  elements.cancelBtn.addEventListener("click", closeSettingsModal);

  elements.settingsModal.addEventListener("click", (e) => {
    if (e.target === elements.settingsModal) {
      closeSettingsModal();
    }
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

  // Mapping modal
  elements.mapColumnsBtn.addEventListener("click", openMappingModal);
  elements.closeMappingModal.addEventListener("click", closeMappingModal);
  elements.cancelMappingBtn.addEventListener("click", closeMappingModal);
  elements.saveMappingBtn.addEventListener("click", saveMappings);

  elements.mappingModal.addEventListener("click", (e) => {
    if (e.target === elements.mappingModal) {
      closeMappingModal();
    }
  });

  // Refresh
  elements.refreshBtn.addEventListener("click", () => {
    if (CONFIG.isConfigured()) {
      fetchAndDisplayData();
    } else {
      openSettingsModal();
    }
  });

  // Retry
  elements.retryBtn.addEventListener("click", fetchAndDisplayData);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (elements.settingsModal.classList.contains("active")) {
        closeSettingsModal();
      }
      if (elements.mappingModal.classList.contains("active")) {
        closeMappingModal();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "r") {
      e.preventDefault();
      if (CONFIG.isConfigured()) {
        fetchAndDisplayData();
      }
    }
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
