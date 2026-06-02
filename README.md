# throttlr-website

Marketing landing page for **Throttlr** — the per-application network throttler for Windows.

Single-page static site. Plain HTML + CSS + vanilla JS, zero build step, zero dependencies. Fonts loaded from Google Fonts (Big Shoulders Stencil + JetBrains Mono).

## Local preview

Just open `index.html` in any browser, or run a local static server:

```bash
python -m http.server 8080
# → http://localhost:8080
```

## Deploy to Netlify (recommended)

1. Push this folder to a new GitHub repo (e.g. `throttlr-website`)
2. Sign in to [netlify.com](https://netlify.com)
3. Click **Add new site → Import from Git**
4. Pick the repo
5. Leave build command empty — this is a static site
6. Publish directory: `.` (root)
7. Click **Deploy**

Netlify will give you a URL like `throttlr-tame-pizza-1234.netlify.app` immediately. Each push to `main` redeploys the site within ~30 seconds.

To add a custom domain later (after buying one): **Domain settings → Add custom domain**.

## How the download button works

All three Download buttons (top nav + hero + final CTA) have a static fallback URL of:

```
https://github.com/BillysMatrix18/throttlr-releases/releases/latest/download/Throttlr-Setup.exe
```

**On page load**, `app.js` calls the GitHub Releases API to fetch the latest release's actual `.exe` asset URL and rewrites the buttons' `href` attributes to point at it. This means the download keeps working even if the installer filename changes between releases (e.g. `Throttlr-Setup-3.1.2.exe` vs `Throttlr-Setup.exe`). It prefers installer files (filename contains "Setup") over plain `.exe` files when both are present.

If the GitHub API is unreachable or rate-limited, the static fallback URL is still active — so the buttons always work, they just might 404 if the installer isn't named exactly `Throttlr-Setup.exe`. **For maximum reliability, keep your installer naming consistent across releases.**

The version label on the buttons (showing `v3.1.0`, `v3.1.2`, etc.) is also auto-fetched from the same API call, so it always reflects the current latest version without any manual updates.

> **Note:** Throttlr's source code lives in a separate private repo. The public `throttlr-releases` repo hosts only the compiled binaries and release notes that this site links to.

## File structure

```
.
├── index.html       — markup
├── style.css        — all styling
├── app.js           — scroll/reveal/counters + tilt/magnetic + clickable architecture, working Compile, and the live demo simulator
└── README.md        — this file
```

## Sections

1. Top marquee + sticky nav
2. Hero with floating app screenshot
3. Use cases band (Gamers / Devs / Streamers / Network folk)
4. **// 01 Why Throttlr** — per-process explanation
5. **// 02 The six functions** — deep-dive cards with visualizations
6. **// 03 Live demo** — interactive throttle simulator (inbound/outbound + per-function numbers; packets delivered/dropped/delayed live)
7. **// 04 Advanced tools** — side-rail grid
8. **// 05 Built for serious testing** — power features
9. **// 06 How it works** — clickable architecture diagram
10. **// 07 Write your own filters** — DSL editor with a working **Compile** (staggered AST reveal)
11. **// 08 Pick your aesthetic** — Industrial vs Midnight
12. **// 09 What's new** — auto-pulled changelog
13. **// 10 Quick start** · **// 11 Specs** · **// 12 FAQ**
14. Final CTA + footer

— Billy's Matrix
