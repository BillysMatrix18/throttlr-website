# Feedback Form — Setup Guide

This sets up the feedback form on `throttlr.netlify.app/feedback`
to write submissions to a private Google Sheet.

You only do this **once**. After that, submissions arrive automatically.

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **blank** spreadsheet.
2. Rename it to something like **"Throttlr Feedback"**.
3. Leave it empty — the script will create the header row on first submission.

The sheet is private by default. Don't share it.

---

## Step 2 — Create the Apps Script

There are two ways. **Bound** is simpler and recommended.

### Option A — Bound to the sheet (recommended)

1. With the spreadsheet open, click **Extensions → Apps Script**.
2. A new tab opens with a default `Code.gs` file. **Delete everything** in that file.
3. Open `apps-script.gs` (in this folder) and paste its entire contents into `Code.gs`.
4. The `SHEET_ID` constant near the top can stay **blank** — bound scripts use the active spreadsheet automatically.
5. Click the floppy-disk save icon (or `Ctrl+S`). Name the project **"Throttlr Feedback"**.

### Option B — Standalone script

Same as A but start at [script.google.com](https://script.google.com) → **New project**. After pasting the code, copy your spreadsheet's ID (the long string in its URL, between `/d/` and `/edit`) and set it as `SHEET_ID` in the script.

---

## Step 3 — Deploy as a web app

1. In the Apps Script editor, click **Deploy → New deployment** (top-right).
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Fill in:
   - **Description:** "Throttlr feedback receiver"
   - **Execute as:** **Me** (your account — so the script writes to your sheet)
   - **Who has access:** **Anyone** *(this means anyone can POST to the URL — but only your sheet receives the data, and no one can read it)*
4. Click **Deploy**.
5. Google will prompt you to **authorize**. Click through:
   - "Review permissions" → choose your account
   - You'll see a "Google hasn't verified this app" warning. Click **Advanced → Go to Throttlr Feedback (unsafe)**. This warning is normal for personal scripts — the script is yours and only writes to your sheet.
   - Allow access.
6. After authorization, you'll get a **Web app URL** like:
   ```
   https://script.google.com/macros/s/AKfycby...long...string.../exec
   ```
7. **Copy this URL.** You'll paste it into the website next.

---

## Step 4 — Wire the website to the script

1. Open `feedback.html` (in this folder).
2. Find the line near the bottom that says:
   ```js
   const FEEDBACK_ENDPOINT = "REPLACE_WITH_YOUR_APPS_SCRIPT_URL";
   ```
3. Replace the placeholder string with the web app URL you copied. Example:
   ```js
   const FEEDBACK_ENDPOINT = "https://script.google.com/macros/s/AKfy...xyz/exec";
   ```
4. Save the file.

---

## Step 5 — Deploy the website

Push to Netlify the same way you always do (drag-and-drop or git push).

The new files going up:
- `feedback.html` — the form page
- `feedback-thanks.html` — the success page
- `apps-script.gs` — *for your reference only*; Netlify ignores it
- `FEEDBACK_SETUP.md` — *for your reference only*
- updated `style.css` (form styles)
- updated `index.html` (Feedback link in footer)

---

## Step 6 — Test it

1. Visit `throttlr.netlify.app/feedback.html`.
2. Fill in the form and submit.
3. You should be redirected to `/feedback-thanks.html`.
4. Open your Google Sheet — a new row should appear within a few seconds.

If a row doesn't appear, see **Troubleshooting** below.

---

## Updating the script later

If you change `apps-script.gs` (e.g. add a new field), you need to **re-deploy**:

1. In Apps Script, **Deploy → Manage deployments**.
2. Click the pencil icon on your existing deployment.
3. **Version:** change to **New version**.
4. Click **Deploy**.

The URL stays the same, so you don't need to update the website. **Do not** click "New deployment" again or you'll get a new URL and have to update the website.

---

## Troubleshooting

**Submitting redirects but no row appears in the sheet.**
- Check the Apps Script editor → **Executions** tab (left sidebar). You'll see every invocation, including failures with stack traces.
- Make sure the web app is deployed with **"Who has access: Anyone"**. If it's set to "Anyone with Google account," anonymous form submissions get blocked.

**"Authorization required" error on submit.**
- The deployment isn't authorized yet. Re-do Step 3 — Google asks you to re-authorize after script changes.

**Form says "Couldn't send."**
- The `FEEDBACK_ENDPOINT` URL in `feedback.html` is wrong or still the placeholder. Re-check Step 4.

**Getting spam.**
- The script silently drops submissions where the hidden honeypot field is filled, which catches the dumbest bots. If sophisticated spam gets through:
  - Add a reCAPTCHA (more involved — let me know if you want it).
  - Reduce the rate by adding a cooldown check (script-side: refuse if last submission from a similar UA was under 30s ago).

**Want email alerts on new submissions?**
Add this near the end of `doPost`, just before `return _ok(...)`:
```js
MailApp.sendEmail({
  to: "your@email.com",
  subject: `Throttlr feedback (${safeType}) — ${name || "anonymous"}`,
  body: `${msg}\n\nFrom: ${email || "(no email)"}\nPage: ${page}`,
});
```
Re-deploy with a new version (see "Updating the script later").

---

## Why this approach

- **Free.** Google Sheets + Apps Script have generous free quotas — far beyond what any side project needs.
- **No backend to maintain.** No server, no DB, no auth, no SSL cert.
- **Fits your stack.** Netlify static site + a single endpoint script.
- **Looks like the rest of the site.** Forms-builder embeds always look foreign; a custom HTML form doesn't.
- **Submissions go to a sheet you own.** Easy to read, sort, filter, archive.
