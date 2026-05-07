# throttlr-soon

Coming-soon teaser page for [Throttlr](https://github.com/BillysMatrix18/throttlr) — a per-application network throttler for Windows.

Hazard-yellow mission-control aesthetic with custom 3D bolt logo, animated rings, radar sweep, glitch effects, CRT scanlines. Hero followed by deep info sections explaining what the app is, what it does, who it's for, plus full UI showcase mockups for both Industrial and Midnight themes. Email notify form at the bottom.

## Local preview

```bash
# Open index.html in any browser, or run a local server:
python -m http.server 8080
# → http://localhost:8080
```

## Deploy to Netlify

1. Push this folder to a GitHub repo
2. On netlify.com → **Add new site → Import from Git** → pick the repo
3. Build command: empty &nbsp;·&nbsp; Publish directory: `.`
4. Click **Deploy**

## Sections

1. **Hero** — animated 3D bolt + COMING SOON title + telemetry boxes
2. **01 / What it is** — descriptive intro
3. **02 / Six functions** — Lag / Drop / Throttle / Freeze / Block / Fun
4. **03 / Per-process** — why this matters
5. **04 / Advanced tools** — 8 tool descriptions
6. **05 / Made for** — Gamers / Devs / Streamers / Network folk
7. **06 / Specs** — platform, framework, license
8. **07 / The Interface** — full main app UI mockup with annotations
9. **08 / Tools, visualized** — 6 tool UI mockups (Inspector, Topology, Filter Script, Practice Ping, Recording, Quick Presets)
10. **09 / Two designs** — Industrial vs Midnight Aurora full-app mockups + 6-accent picker
11. **Closer** — "Soon." + email notify form

## Email notify form

The notify form at the bottom of the closer is wired up to **Netlify Forms** automatically when deployed. Submissions land in your Netlify dashboard under Forms → notify.

### Setting up email notifications

After your first submission registers the form:

1. Netlify dashboard → **Forms** in the sidebar
2. Click into the **notify** form
3. **Form notifications** → **Add notification** → **Email notification**
4. Enter the email you want to receive notifications at
5. Save

### Troubleshooting: submissions not appearing

If you submit but nothing shows in the Forms tab:

1. **Open browser DevTools (F12) → Console tab** while submitting. The form now logs `[notify] submitting`, `[notify] response status: ...`, and any errors. Read what it says.

2. **Open DevTools → Network tab → Preserve log** before submitting. After clicking "Notify Me", look for a POST request to `/`. Click it and check:
   - Status code should be **200** or **303**
   - Request payload should include `form-name=notify&email=your@email.com`

3. **Force a fresh deploy:** Netlify dashboard → Deploys → **Trigger deploy** → **Clear cache and deploy site**. Then submit again.

4. **Form detection check:** Site configuration → Build & deploy → Post processing → confirm **Form detection is enabled**.

5. **Localstorage block:** the form no longer auto-locks on revisit, but if you ever see the success message without the network POST happening, clear `throttlr_notify_list` from DevTools → Application → Local Storage and try again.

## Customizing

### Brand colors

CSS variables at the top of `style.css` in `:root`. Main brand color is `--hazard` (yellow `#ffb800`).

### Copy

All copy lives in `index.html`. Sections are clearly delimited with comment markers — search for `<!-- 01 — What -->`, `<!-- 02 — Functions -->`, etc.

### Logo

`throttlr-logo.png` is the custom 3D bolt at 600×600 with transparent background. Replace with your own PNG (transparent recommended) at the same path.

— Billy's Matrix
