/**
 * Throttlr — Feedback form receiver
 * ============================================================
 * Receives POSTs from throttlr.netlify.app/feedback.html and
 * appends each submission to a per-type tab in the Google Sheet:
 *   "Bug", "Feature", "Feedback", "General"
 * Tabs are created lazily on the first submission of each type.
 *
 * Sheet columns (created automatically on first row of each tab):
 *   timestamp | type | name | email | message | page | client_time | user_agent | ip_hint
 */

// Leave blank if this script is bound to the spreadsheet
// (Extensions → Apps Script from inside the Sheet). Otherwise paste
// the sheet's ID.
const SHEET_ID = "";

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};

    // Honeypot — silently drop bot submissions.
    if (p.hp_website && String(p.hp_website).trim() !== "") {
      return _ok({ ignored: true });
    }

    const message = String(p.message || "").trim();
    if (message.length < 8) return _bad("Message too short.");

    const rawType = String(p.type || "general");
    const safeType = ["bug", "feature", "feedback", "general"].indexOf(rawType) >= 0
      ? rawType : "general";

    const name    = _cap(String(p.name        || ""), 200);
    const email   = _cap(String(p.email       || ""), 200);
    const page    = _cap(String(p.page        || ""), 500);
    const clientT = _cap(String(p.client_time || ""), 64);
    const ua      = _cap(String(p.user_agent  || ""), 300);
    const msg     = _cap(message, 4000);

    // Route each submission to its own tab. "bug" → tab "Bug", etc.
    const tabName = safeType.charAt(0).toUpperCase() + safeType.slice(1);
    const sheet = _getSheet(tabName);
    sheet.appendRow([new Date(), safeType, name, email, msg, page, clientT, ua, ""]);

    return _ok({ written: true, tab: tabName });
  } catch (err) {
    console.error("doPost failed", err);
    return _bad("Server error.");
  }
}

function doGet() {
  return HtmlService.createHtmlOutput(
    "<html><body style='background:#0b0b0b;color:#ffb800;font-family:monospace;padding:24px'>" +
    "Throttlr feedback endpoint is live. POST submissions accepted." +
    "</body></html>"
  );
}

function _getSheet(tabName) {
  const ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("No spreadsheet bound.");
  let sh = ss.getSheetByName(tabName);
  if (!sh) sh = ss.insertSheet(tabName);
  if (sh.getLastRow() === 0) {
    sh.appendRow([
      "Timestamp", "Type", "Name", "Email", "Message",
      "Page", "Client time (UTC)", "User agent", "IP hint",
    ]);
    sh.getRange(1, 1, 1, 9).setFontWeight("bold");
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 170);
    sh.setColumnWidth(2, 80);
    sh.setColumnWidth(3, 140);
    sh.setColumnWidth(4, 200);
    sh.setColumnWidth(5, 520);
  }
  return sh;
}

function _cap(s, n) {
  if (!s) return "";
  return s.length > n ? s.substring(0, n) : s;
}
function _ok(p) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ ok: true }, p || {})))
    .setMimeType(ContentService.MimeType.JSON);
}
function _bad(r) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: r }))
    .setMimeType(ContentService.MimeType.JSON);
}
