/**
 * Configuration for Google Apps Script Integration
 *
 * This file stores the Apps Script Web App URL.
 * The settings are saved to localStorage for persistence.
 */

const CONFIG = {
  defaults: {
    webAppUrl: "",
  },

  storageKey: "appsScriptConfig",

  /**
   * Get the current configuration from localStorage
   * @returns {Object} Configuration object
   */
  get() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return { ...this.defaults, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Error reading config:", e);
    }
    return { ...this.defaults };
  },

  /**
   * Save configuration to localStorage
   * @param {Object} config - Configuration to save
   */
  save(config) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error("Error saving config:", e);
      return false;
    }
  },

  /**
   * Clear configuration from localStorage
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (e) {
      console.error("Error clearing config:", e);
      return false;
    }
  },

  /**
   * Check if Apps Script is configured
   * @returns {boolean}
   */
  isConfigured() {
    const config = this.get();
    return Boolean(config.webAppUrl && config.webAppUrl.trim());
  },
};

window.CONFIG = CONFIG;
