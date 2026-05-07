# throttlr-soon

Coming-soon teaser page for [Throttlr](https://github.com/BillysMatrix18/throttlr).

Hazard-yellow mission-control aesthetic — animated lightning bolt, concentric rings, glitch effects, CRT scanlines. Hero followed by deep info sections explaining what the app is, what it does, who it's for, and how it works.

No CTAs. No forms. No external links. Just info.

## Local preview

```bash
# Open index.html in any browser, or run a local server:
python -m http.server 8080
# → http://localhost:8080
```

## Deploy to Netlify

1. Push this folder to a new GitHub repo (e.g. `throttlr-soon`)
2. On netlify.com → **Add new site → Import from Git** → pick the repo
3. Build command: empty &nbsp;·&nbsp; Publish directory: `.`
4. Click **Deploy**

You'll get a URL like `throttlr-soon-xxx.netlify.app`. Rename via Site settings → Change site name.

## Sections

1. **Hero** — animated bolt + COMING SOON title
2. **01 / What it is** — descriptive intro
3. **02 / Six functions** — Lag / Drop / Throttle / Freeze / Block / Fun
4. **03 / Per-process** — why this matters
5. **04 / Advanced tools** — 8 tools listed with descriptions
6. **05 / Made for** — Gamers / Devs / Streamers / Network folk
7. **06 / Specs** — platform, framework, license, etc.
8. **Closer** — "Soon."
9. Footer

## Customizing

### Brand colors

CSS variables at the top of `style.css` in `:root`. Main brand color is `--hazard`.

### Copy

All copy lives in `index.html`. Sections are clearly delimited with comment markers — search for `<!-- 01 — What -->`, `<!-- 02 — Functions -->`, etc.

— Billy's Matrix
