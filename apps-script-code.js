/**
 * ===========================================
 * GOOGLE APPS SCRIPT - Copy this to your Sheet
 * ===========================================
 *
 * HOW TO USE:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code
 * 4. Paste ALL of this code
 * 5. Click Deploy → New deployment
 * 6. Select type: "Web app"
 * 7. Set "Who has access" to "Anyone"
 * 8. Click Deploy and authorize
 * 9. Copy the Web app URL
 *
 * Your spreadsheet stays PRIVATE - only this script can read it!
 */

/**
 * Helper function to safely trim any value
 */
function trimValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function doGet(e) {
  try {
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get sheet name from parameter, default to first sheet
    const sheetName = e.parameter.sheet || null;
    const sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];

    if (!sheet) {
      return sendError("Sheet not found: " + sheetName);
    }

    // Get all data from the sheet
    const data = sheet.getDataRange().getValues();

    if (data.length === 0) {
      return sendError("The sheet is empty");
    }

    // First row is headers - trim all header values
    const headers = data[0].map((h) => trimValue(h));

    // Remaining rows are data - trim all cell values
    const rows = data.slice(1).map((row) => row.map((cell) => trimValue(cell)));

    // Return JSON response
    const response = {
      success: true,
      headers: headers,
      rows: rows,
      rowCount: rows.length,
      sheetName: sheet.getName(),
    };

    return ContentService.createTextOutput(
      JSON.stringify(response)
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return sendError(error.message);
  }
}

function sendError(message) {
  const response = {
    success: false,
    error: message,
  };

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Optional: Add this function to test the script
 * Run it from the Apps Script editor to verify it works
 */
function testScript() {
  const mockEvent = { parameter: {} };
  const result = doGet(mockEvent);
  Logger.log(result.getContent());
}
