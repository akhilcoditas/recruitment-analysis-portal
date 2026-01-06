/**
 * Google Sheets Data Fetcher
 *
 * This module handles fetching data from Google Sheets via Apps Script.
 * The sheet remains PRIVATE - no need to publish to web.
 */

const GoogleSheets = {
  /**
   * Helper to safely trim any value
   */
  trimValue(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value;
    return String(value).trim();
  },

  /**
   * Fetch data from a Google Apps Script Web App
   * @param {string} webAppUrl - The deployed Apps Script web app URL
   * @returns {Promise<Object>} Parsed sheet data
   */
  async fetchData(webAppUrl) {
    if (!webAppUrl || !webAppUrl.trim()) {
      throw new Error("Please provide your Google Apps Script Web App URL.");
    }

    // Clean the URL
    let url = webAppUrl.trim();

    // Ensure it's an Apps Script URL
    if (
      !url.includes("script.google.com") &&
      !url.includes("googleusercontent.com")
    ) {
      throw new Error(
        "Invalid URL. Please use your Google Apps Script Web App URL."
      );
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch data: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Check for errors from the script
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.headers || !data.rows) {
        throw new Error("Invalid response format from the script.");
      }

      // Trim all header values
      const headers = data.headers.map((h) => this.trimValue(h));

      // Trim all row values
      const rows = data.rows.map((row) =>
        row.map((cell) => this.trimValue(cell))
      );

      // Convert rows to objects with trimmed keys and values
      const dataObjects = rows.map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
          // Use trimmed header as key, trimmed value as value
          obj[header] = row[index] !== undefined ? row[index] : "";
        });
        return obj;
      });

      return {
        success: true,
        headers: headers,
        rows: rows,
        data: dataObjects,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        throw new Error(
          "Network error. Please check your internet connection and ensure the Apps Script is deployed correctly."
        );
      }
      throw error;
    }
  },

  /**
   * Calculate basic statistics from the data
   * @param {Array} data - Array of data objects
   * @param {Array} headers - Column headers
   * @returns {Array} Statistics objects
   */
  calculateStats(data, headers) {
    const stats = [];

    // Total rows
    stats.push({
      label: "Total Rows",
      value: data.length.toLocaleString(),
    });

    // Total columns
    stats.push({
      label: "Total Columns",
      value: headers.length.toLocaleString(),
    });

    // Find numeric columns and calculate sums/averages
    headers.forEach((header) => {
      const numericValues = data
        .map((row) => parseFloat(row[header]))
        .filter((val) => !isNaN(val));

      if (numericValues.length > data.length * 0.5) {
        const sum = numericValues.reduce((a, b) => a + b, 0);
        const avg = sum / numericValues.length;

        if (sum !== 0) {
          stats.push({
            label: `Avg ${header}`,
            value: avg.toFixed(2),
          });
        }
      }
    });

    return stats.slice(0, 4);
  },
};

window.GoogleSheets = GoogleSheets;
