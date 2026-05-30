/**
 * Throttlr — Feedback form receiver
 * ============================================================
 * Google Apps Script web app. Receives POSTs from the feedback
 * page on throttlr.netlify.app and appends one row per
 * submission to a Google Sheet you own.
 *
 * To deploy: see FEEDBACK_SETUP.md.
 *
 * Sheet columns (in this order — created automatically if missing):
 *   timestamp | type | name | email | message | page | client_time | user_agent | ip_hint
 *
 * Spam handling:
 *   - Honeypot field "hp_website": if non-empty, silently drop.
 *   - Empty message or message under 8 chars: drop with 400.
 *   - Reasonable rate-limit headroom; Apps Script's own quotas
 *     prevent abusive volume.
 */

// ---- Configuration ---------------------------------------------------
// Leave SHEET_ID blank to use the spreadsheet this script is bound to
// (if you created the script from Extensions → Apps Script inside a
// Sheet). Otherwise paste the sheet's ID (the long string in its URL,
// between /d/ and /edit).
const SHEET_ID = "";

// Name of the tab inside the spreadsheet to write into. The script
// creates the tab and the header row if they don't exist yet.
const SHEET_TAB = "Feedback";

// ----------------------------------------------------------------------

/**
 * Main entry point. Apps Script calls this when the deployed web app
 * receives a POST request.
 */
function doPost(e) {
  try {
    // e.parameter is the parsed form fields (FormData from the website)
    const p = (e && e.parameter) || {};

    // Honeypot — bots will fill this; humans never see it.
    if (p.hp_website && String(p.hp_website).trim() !== "") {
      // Pretend success so the bot moves on.
      return _ok({ ignored: true });
    }

    // Validate
    const message = String(p.message || "").trim();
    if (message.length < 8) {
      return _bad("Message too short.");
    }
    // Cap field sizes so a misbehaving client can't write huge rows.
    const type    = _cap(String(p.type    || "general"), 32);
    const name    = _cap(String(p.name    || ""),         200);
    const email   = _cap(String(p.email   || ""),         200);
    const page    = _cap(String(p.page    || ""),         500);
    const clientT = _cap(String(p.client_time || ""),     64);
    const ua      = _cap(String(p.user_agent  || ""),     300);
    const msg     = _cap(message, 4000);

    // Only allow the known types; anything else becomes "general"
    const safeType = ["bug", "feature", "feedback", "general"].indexOf(type) >= 0 ? type : "general";

    // Tiny IP hint: Apps Script doesn't expose the requester IP, but if
    // you ever proxy through Cloudflare you can forward CF-Connecting-IP
    // via a header — leaving this column for future use.
    const ipHint = "";

    const sheet = _getSheet();
    sheet.appendRow([
      new Date(),
      safeType,
      name,
      email,
      msg,
      page,
      clientT,
      ua,
      ipHint,
    ]);

    return _ok({ written: true });
  } catch (err) {
    // Don't leak internals to the public; just log for the script owner.
    console.error("doPost failed", err);
    return _bad("Server error.");
  }
}

/**
 * Optional GET handler — opens this URL in a browser and you'll see a
 * tiny status page, useful for confirming the deployment is live.
 */
function doGet() {
  return HtmlService.createHtmlOutput(
    "<html><body style='background:#0b0b0b;color:#ffb800;font-family:monospace;padding:24px'>" +
    "Throttlr feedback endpoint is live. POST submissions accepted." +
    "</body></html>"
  );
}

// ---- Internals -------------------------------------------------------

function _getSheet() {
  const ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("No spreadsheet — set SHEET_ID or bind the script to a sheet.");
  }
  let sh = ss.getSheetByName(SHEET_TAB);
  if (!sh) {
    sh = ss.insertSheet(SHEET_TAB);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow([
      "Timestamp", "Type", "Name", "Email", "Message",
      "Page", "Client time (UTC)", "User agent", "IP hint",
    ]);
    // Bold + freeze the header row for nicer browsing
    sh.getRange(1, 1, 1, 9).setFontWeight("bold");
    sh.setFrozenRows(1);
    // Reasonable column widths so the sheet is readable on first open
    sh.setColumnWidth(1, 170);  // timestamp
    sh.setColumnWidth(2, 80);   // type
    sh.setColumnWidth(3, 140);  // name
    sh.setColumnWidth(4, 200);  // email
    sh.setColumnWidth(5, 520);  // message
  }
  return sh;
}

function _cap(str, n) {
  if (!str) return "";
  return str.length > n ? str.substring(0, n) : str;
}

function _ok(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ ok: true }, payload || {})))
    .setMimeType(ContentService.MimeType.JSON);
}

function _bad(reason) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: reason }))
    .setMimeType(ContentService.MimeType.JSON);
}
