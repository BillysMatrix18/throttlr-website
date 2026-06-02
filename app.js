// ============================================================================
// THROTTLR — landing site interactions
// Scroll progress bar, reveal-on-scroll, animated counters.
// Plain vanilla JS, no dependencies.
// ============================================================================

(function () {
  'use strict';

  // ---- Scroll progress indicator ----
  // Updates the width of the top progress bar based on scroll position.
  const progressEl = document.getElementById('scrollProgress');
  let scrollTicking = false;

  function updateProgress() {
    const doc = document.documentElement;
    const scrollTop = window.pageYOffset || doc.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    if (progressEl) progressEl.style.width = pct + '%';
    scrollTicking = false;
  }

  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateProgress);
      scrollTicking = true;
    }
  }, { passive: true });

  updateProgress();

  // ---- Reveal-on-scroll ----
  // v4 — uses anime.js (if available) for a smooth spring fade-up.
  // Falls back to the original .is-visible class toggle if anime isn't
  // loaded (e.g. CDN fail) — the CSS-only path keeps the page working.
  const revealEls = document.querySelectorAll('.reveal');
  const hasAnime = typeof window.anime !== 'undefined' && window.anime &&
                   (window.anime.animate || window.anime.default);
  const animeAnimate = hasAnime
    ? (window.anime.animate || window.anime.default && window.anime.default.animate)
    : null;

  function revealEl(el) {
    el.classList.add('is-visible');
    if (animeAnimate) {
      try {
        animeAnimate(el, {
          translateY: [28, 0],
          opacity: [0, 1],
          duration: 900,
          ease: 'out(3)',  // anime v4 easing string
        });
      } catch (e) { /* CSS fallback already applied via .is-visible */ }
    }
  }

  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          revealEl(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px',
    });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    // No IO support — show everything immediately
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ---- Animated counters ----
  // Counts up [data-count] elements when they first enter viewport.
  // Numbers with commas are preserved in formatting.
  const counterEls = document.querySelectorAll('[data-count]');
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (!Number.isFinite(target)) return;
    const duration = 1400;
    const startTime = performance.now();
    const formatter = new Intl.NumberFormat('en-US');

    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      el.textContent = formatter.format(value);
      if (t < 1) {
        window.requestAnimationFrame(tick);
      } else {
        el.textContent = formatter.format(target);
      }
    }
    window.requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && counterEls.length) {
    const counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(function (el) { counterIO.observe(el); });
  }

  // ---- v4: Scroll-driven parallax CSS variable ----
  // We expose window.scrollY as a CSS custom property on body, so CSS can
  // drive parallax-style translations on background elements (bg-orbs,
  // section overlays, etc.) without each one needing its own JS. The CSS
  // multiplies the value by a fraction to get layered scroll speeds.
  let lastScrollY = -1;
  let scrollRaf = false;
  function tickParallax() {
    const y = window.scrollY || window.pageYOffset || 0;
    document.body.style.setProperty('--scroll-y', y + 'px');
    lastScrollY = y;
    scrollRaf = false;
  }
  window.addEventListener('scroll', function () {
    if (!scrollRaf) {
      scrollRaf = true;
      window.requestAnimationFrame(tickParallax);
    }
  }, { passive: true });
  tickParallax();

  const isDesktopPointer = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;

  // ---- v4: 3D Card tilt with cursor-following glow ----
  // Cards in .usecase / .tool-card / .power-card / .design-card / .faq-item
  // get a subtle rotateX/rotateY that tracks the cursor, plus a radial
  // glow on the surface (CSS variables --mx/--my drive a ::after gradient).
  // Touch devices skip this entirely — rotation interferes with scrolling.
  const tiltSelector = '.usecase, .tool-card, .power-card, .design-card, .faq-item, .fn-row, .script-window, .demo-stage, .qs-step, .cl-col, .spec-card';
  if (isDesktopPointer) {
    document.querySelectorAll(tiltSelector).forEach(function (card) {
      let rect = null;
      let rafTilt = false;
      let mx = 0, my = 0;

      const updateTilt = function () {
        if (!rect) return;
        // Position within card, 0..1
        const px = (mx - rect.left) / rect.width;
        const py = (my - rect.top) / rect.height;
        // Rotation amount — gentle (max ~6deg)
        const rotY = (px - 0.5) * 4;      // left/right (gentler)
        const rotX = (0.5 - py) * 3;      // up/down (gentler)
        card.style.transform =
          'perspective(1200px) rotateX(' + rotX.toFixed(2) + 'deg) ' +
          'rotateY(' + rotY.toFixed(2) + 'deg)';
        // Glow position — % within card for the ::after radial-gradient
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        rafTilt = false;
      };

      card.addEventListener('mouseenter', function () {
        rect = card.getBoundingClientRect();
        card.classList.add('is-tilting');
      });
      card.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        if (!rafTilt) {
          rafTilt = true;
          window.requestAnimationFrame(updateTilt);
        }
      }, { passive: true });
      card.addEventListener('mouseleave', function () {
        card.classList.remove('is-tilting');
        card.style.transform = '';
        rect = null;
      });
    });
  }

  // ---- v4: Magnetic buttons ----
  // .nav-cta / .btn-download / .btn-secondary get a subtle pull-toward-cursor
  // effect: the button translates ~12px toward the cursor when the mouse is
  // within a small radius. Springs back when the cursor leaves.
  if (isDesktopPointer) {
    const magnetSelector = '.__no-magnet__';  // magnetic cursor-follow disabled
    document.querySelectorAll(magnetSelector).forEach(function (btn) {
      let rect = null;
      let rafM = false;
      let mx = 0, my = 0;

      const updateMagnet = function () {
        if (!rect) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // Distance from center, normalized to half the button's longest dim
        const dx = (mx - cx);
        const dy = (my - cy);
        // Pull strength — keep it gentle so it doesn't feel jumpy
        const strength = 0.22;
        btn.style.transform =
          'translate3d(' + (dx * strength).toFixed(1) + 'px,' +
                            (dy * strength).toFixed(1) + 'px,0)';
        rafM = false;
      };

      btn.addEventListener('mouseenter', function () {
        rect = btn.getBoundingClientRect();
        btn.classList.add('is-magnetic');
      });
      btn.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        if (!rafM) {
          rafM = true;
          window.requestAnimationFrame(updateMagnet);
        }
      }, { passive: true });
      btn.addEventListener('mouseleave', function () {
        btn.classList.remove('is-magnetic');
        btn.style.transform = '';
        rect = null;
      });
    });
  }

  // ---- v4.1: Clickable architecture diagram (// 05) ----
  // Each .arch-block has a data-arch identifier. Clicking one populates
  // and opens the #archDetail panel below. Clicking the same block again
  // (or the panel's close behavior) closes it.
  const archBlocks = document.querySelectorAll('.arch-block[data-arch]');
  const archDetail = document.getElementById('archDetail');
  const archDetailNum = document.getElementById('archDetailNum');
  const archDetailTitle = document.getElementById('archDetailTitle');
  const archDetailBody = document.getElementById('archDetailBody');

  const ARCH_DETAILS = {
    app: {
      num: '// 01',
      title: 'TARGETED APP',
      body: '<p>Any Windows process — <code>Discord.exe</code>, <code>chrome.exe</code>, a game, an installer. Throttlr matches by <strong>PID</strong>, not name, so two copies of the same exe stay independent.</p>' +
            '<p>The app has no idea Throttlr exists. It calls <code>send()</code> / <code>recv()</code> through the normal Windows socket APIs, and the OS hands the packet to the kernel like usual.</p>' +
            '<p>No DLL injection, no hooks in the target process, no admin rights needed on the target. The interception happens <strong>below</strong> the app — in the kernel — so this works even on processes you don\'t own.</p>'
    },
    os: {
      num: '// 02',
      title: 'WINDOWS TCP/IP STACK',
      body: '<p>The packet enters the Windows kernel network stack — specifically <code>tcpip.sys</code>, which handles IP routing, TCP windowing, and dispatches packets to network adapters.</p>' +
            '<p>Normally the packet would head straight to the NIC driver and out the wire. Throttlr inserts itself <strong>just before</strong> that, via the WFP (Windows Filtering Platform) framework that the WinDivert driver registers with.</p>' +
            '<p>This is the kernel-mode layer where every outbound and inbound packet must pass — bulletproof choke point, no app can bypass it.</p>'
    },
    divert: {
      num: '// 03',
      title: 'WINDIVERT FILTER',
      body: '<p>WinDivert is a kernel driver that lets userspace processes <em>capture, modify, and re-inject</em> packets. Throttlr opens a WinDivert handle with a filter string like:</p>' +
            '<p><code>processId == 1234 and (outbound or inbound)</code></p>' +
            '<p>Only packets matching are diverted out of the kernel and into Throttlr\'s userspace queue. Everything else flows through untouched at full speed — zero impact on apps you\'re not throttling.</p>' +
            '<p>A second WinDivert handle runs in <strong>SNIFF mode</strong> on the FLOW layer, watching <code>WSA_FLOW_ESTABLISHED</code> events so Throttlr learns each new connection\'s PID the moment it\'s created. That\'s why per-app filtering has no polling lag.</p>'
    },
    engine: {
      num: '// 04',
      title: 'THROTTLR ENGINE',
      body: '<p>Diverted packets land in a Python event loop. Each one runs through the function pipeline in a fixed order so the rules compose predictably:</p>' +
            '<p><code>track → script → blocklists → block → freeze → drop → fun → throttle → lag</code></p>' +
            '<p>Each function can do one of three things: <strong>forward immediately</strong>, <strong>queue for later</strong> (lag, throttle, freeze), or <strong>drop entirely</strong> (drop, block, blocklists, script-match).</p>' +
            '<p>Throttle and lag use a min-heap priority queue keyed on release time, so the asyncio loop wakes up exactly when the next packet is due — no busy-waiting, no extra CPU.</p>'
    },
    dropped: {
      num: '// 05a',
      title: 'DROPPED',
      body: '<p>The packet is silently discarded — never re-injected. The application sees a missing ACK and treats it as packet loss.</p>' +
            '<p>For TCP this triggers retransmission and gradually slows the connection (TCP congestion control). For UDP/realtime traffic (voice, video, game state), the packet is just gone — perfect for simulating bad networks.</p>' +
            '<p>Throttlr never sends an ICMP error or RST packet — drops are <strong>indistinguishable from real packet loss</strong>, which is the whole point.</p>'
    },
    delayed: {
      num: '// 05b',
      title: 'DELAYED',
      body: '<p>The packet is held in a priority queue with a target release timestamp. The asyncio loop wakes up when the next packet\'s release time arrives, then re-injects it via WinDivert.</p>' +
            '<p>Lag adds a fixed delay (with optional jitter); Throttle delays packets just enough to enforce a bandwidth cap. Freeze holds packets indefinitely until you release them as a burst.</p>' +
            '<p>The heap-based scheduler means even with thousands of queued packets, the per-packet overhead is <code>O(log n)</code> — Throttlr can hold many seconds of traffic without lag.</p>'
    },
    forwarded: {
      num: '// 05c',
      title: 'FORWARDED',
      body: '<p>The default case. Packet is re-injected into the kernel stack via <code>WinDivertSend()</code> and continues on its original journey — out the NIC, across the network, or up to userspace for inbound packets.</p>' +
            '<p>The application sees no difference from a normal packet. Throttlr\'s overhead per forwarded packet is ~10-30µs — well under any user-perceptible threshold.</p>'
    },
  };

  let currentArchKey = null;
  function setArchDetail(key) {
    const data = ARCH_DETAILS[key];
    if (!data || !archDetail) return;
    archDetailNum.textContent = data.num;
    archDetailTitle.textContent = data.title;
    archDetailBody.innerHTML = data.body;
    archDetail.classList.add('is-open');
  }
  function closeArchDetail() {
    if (archDetail) archDetail.classList.remove('is-open');
    archBlocks.forEach(function (b) { b.classList.remove('is-active'); });
    currentArchKey = null;
  }
  archBlocks.forEach(function (block) {
    const key = block.getAttribute('data-arch');
    const activate = function () {
      if (currentArchKey === key) {
        closeArchDetail();
        return;
      }
      archBlocks.forEach(function (b) { b.classList.remove('is-active'); });
      block.classList.add('is-active');
      currentArchKey = key;
      setArchDetail(key);
      // Smooth-scroll the detail into view so the user actually sees it
      setTimeout(function () {
        archDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    };
    block.addEventListener('click', activate);
    block.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });

  // ---- v4.1: Script "Compile" tab (// 06) ----
  // Clicking the Compile tab triggers a brief "compiling..." animation,
  // then swaps to the AST view. Clicking filter.py switches back instantly.
  const scriptTabs = document.querySelectorAll('.script-tab[data-script-tab]');
  const scriptWindow = document.getElementById('scriptWindow');
  const scriptStatus = document.getElementById('scriptStatusText');
  const scriptCompiled = document.getElementById('scriptCompiled');
  const scRules = scriptCompiled ? scriptCompiled.querySelectorAll('.sc-rule') : [];
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function staggerRules() {
    scRules.forEach(function (r, i) {
      r.classList.remove('sc-show');
      if (prefersReduced) { r.classList.add('sc-show'); return; }
      setTimeout(function () { r.classList.add('sc-show'); }, 70 + i * 110);
    });
  }
  const STATUS_SOURCE = 'Compiled · 0 errors · 4 rules ready · 12 AST nodes';
  const STATUS_COMPILED = 'Showing compiled AST · 4 rules · all valid · sandbox checks ✓';
  scriptTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = tab.getAttribute('data-script-tab');
      // Visually toggle active tab
      scriptTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      if (target === 'compiled') {
        // Show the "compiling" overlay briefly, then swap to compiled view
        scriptWindow.classList.remove('is-compiled');
        scriptWindow.classList.add('is-compiling');
        if (scriptStatus) scriptStatus.textContent = 'Compiling…';
        setTimeout(function () {
          scriptWindow.classList.remove('is-compiling');
          scriptWindow.classList.add('is-compiled');
          if (scriptStatus) scriptStatus.textContent = STATUS_COMPILED;
          staggerRules();
        }, prefersReduced ? 0 : 700);
      } else {
        scriptWindow.classList.remove('is-compiled');
        scriptWindow.classList.remove('is-compiling');
        if (scriptStatus) scriptStatus.textContent = STATUS_SOURCE;
      }
    });
  });

  // ---- Subtle parallax on hero mock ----
  // Mouse-based 3D tilt on the floating app screenshot.
  const mock = document.querySelector('.hero-mock .mock-screen');
  const heroSection = document.querySelector('.hero');
  if (mock && heroSection && window.matchMedia('(min-width: 1100px)').matches) {
    let parallaxTicking = false;
    let mouseX = 0, mouseY = 0;
    heroSection.addEventListener('mousemove', function (e) {
      const rect = heroSection.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;  // 0 to 1
      mouseY = (e.clientY - rect.top) / rect.height;
      if (!parallaxTicking) {
        window.requestAnimationFrame(function () {
          // Map to small rotations around the base orientation
          const ry = -7 + (mouseX - 0.5) * -6;  // ±3deg around -7
          const rx = 3 + (mouseY - 0.5) * 4;     // ±2deg around 3
          mock.style.transform =
            'rotateY(' + ry.toFixed(2) + 'deg) ' +
            'rotateX(' + rx.toFixed(2) + 'deg)';
          parallaxTicking = false;
        });
        parallaxTicking = true;
      }
    });
    heroSection.addEventListener('mouseleave', function () {
      mock.style.transform = '';  // reset to CSS default + animation
    });
  }
})();


  // ---- Auto-fetch latest release from GitHub ----
  // Two jobs in one fetch:
  //   1. Update [data-auto-version] elements with the actual tag (e.g. "v3.1.2")
  //   2. Update [data-auto-download] / .nav-cta / .btn-download href attributes
  //      to point at the actual .exe asset URL in the latest release.
  // Why job #2: GitHub's /releases/latest/download/FILENAME redirect requires
  // an exact filename match. If the installer is uploaded as
  // "Throttlr-Setup-3.1.2.exe" but the website hardcodes "Throttlr-Setup.exe",
  // it 404s. Fetching the asset list from the API lets the site survive
  // arbitrary filename changes between releases.
  // Silent fail — the static fallback href on the buttons still works if
  // GitHub's API is unreachable or rate-limited.
  (function fetchLatestRelease() {
    const verEls = document.querySelectorAll('[data-auto-version]');
    // Any download button that should be auto-rewritten: nav + hero + final CTA
    const dlEls = document.querySelectorAll(
      '.nav-cta, .btn-download, [data-auto-download]'
    );
    const clAuto = document.querySelector('[data-cl-auto]');
    if (!verEls.length && !dlEls.length && !clAuto) return;
    fetch('https://api.github.com/repos/BillysMatrix18/throttlr-releases/releases/latest', {
      headers: { 'Accept': 'application/vnd.github+json' }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        // Job 1: version labels
        if (data.tag_name) {
          const tag = String(data.tag_name);
          verEls.forEach(function (el) { el.textContent = tag; });
        }
        // Job 2: download hrefs. Look for the FIRST .exe asset in the
        // release (there should only be one). Prefer ones with "Setup"
        // in the name (the installer) over any other .exe.
        if (Array.isArray(data.assets) && data.assets.length) {
          const exes = data.assets.filter(function (a) {
            return /\.exe$/i.test(a.name) && a.browser_download_url;
          });
          if (exes.length) {
            const installer = exes.find(function (a) {
              return /setup/i.test(a.name);
            }) || exes[0];
            dlEls.forEach(function (el) {
              el.setAttribute('href', installer.browser_download_url);
            });
          }
        }
        // Job 3: changelog. Parse the release body (markdown) into
        // NEW / FIXED / IMPROVED buckets and render them, so the
        // "What's new" section updates itself every release — no manual
        // edits. If parsing yields nothing, the hardcoded fallback stays.
        if (clAuto && data.body) {
          try { renderChangelogFromBody(data.body); }
          catch (e) { /* keep fallback content */ }
        }
      })
      .catch(function () { /* silent fail — static content/href fallback works */ });
  })();

  // Parse a GitHub release body (markdown) into the three changelog lists.
  // Recognises section headers whose text contains "new", "fixed", or
  // "improved" (case-insensitive) — works with "### ✨ New", "## Fixed",
  // "**Improved**", etc. Also recognises inline category prefixes like
  // "NEW · ...", "FIXED — ...", "IMPROVED: ..." on individual bullets, so
  // either release-note style works. Bullets start with -, *, •, or ›.
  function renderChangelogFromBody(body) {
    const lines = String(body).replace(/\r/g, '').split('\n');
    const buckets = { new: [], fixed: [], improved: [] };
    let current = null;

    // Strip markdown decoration from a line of text.
    const clean = function (s) {
      return s
        .replace(/\*\*/g, '').replace(/__/g, '')      // bold
        .replace(/`/g, '')                            // code ticks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')      // [text](url) -> text
        .replace(/[#>*_~]/g, '')                      // stray md chars
        .trim();
    };
    // Which bucket does a header/category word map to?
    const bucketOf = function (text) {
      const t = text.toLowerCase();
      if (/\bfix(ed|es)?\b/.test(t)) return 'fixed';
      if (/\bimproved?\b|\bimprovement/.test(t)) return 'improved';
      if (/\bnew\b|\badded\b|\bfeature/.test(t)) return 'new';
      return null;
    };

    lines.forEach(function (raw) {
      const line = raw.trim();
      if (!line) return;
      // Header line? (markdown # or a short bold/plain label line)
      const headerMatch = line.match(/^#{1,6}\s*(.+)$/);
      if (headerMatch) {
        const b = bucketOf(clean(headerMatch[1]));
        if (b) current = b;
        return;
      }
      // Bullet line?
      const bulletMatch = line.match(/^[-*•›]\s+(.+)$/);
      if (bulletMatch) {
        let text = clean(bulletMatch[1]);
        // Inline category prefix? e.g. "NEW · ...", "FIXED — ..."
        const pfx = text.match(/^(new|added|fixed|improved|improvement)\b[\s:·—–-]+(.+)$/i);
        let target = current;
        if (pfx) {
          const b = bucketOf(pfx[1]);
          if (b) { target = b; text = clean(pfx[2]); }
        }
        if (target && text) buckets[target].push(text);
        return;
      }
    });

    // Only proceed if we actually parsed some items.
    const total = buckets.new.length + buckets.fixed.length + buckets.improved.length;
    if (!total) return;

    const fill = function (id, items) {
      const ul = document.getElementById(id);
      if (!ul) return;
      if (!items.length) { ul.innerHTML = ''; return; }
      ul.innerHTML = items.map(function (t) {
        // Basic HTML-escape for safety since this is remote content.
        const safe = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return '<li>' + safe + '</li>';
      }).join('');
    };
    fill('cl-new-list', buckets.new);
    fill('cl-fixed-list', buckets.fixed);
    fill('cl-improved-list', buckets.improved);

    // Hide the IMPROVED tag + list if there were none this release.
    const impTag = document.getElementById('cl-improved-tag');
    const impList = document.getElementById('cl-improved-list');
    if (impTag) impTag.style.display = buckets.improved.length ? '' : 'none';
    if (impList && !buckets.improved.length) impList.style.display = 'none';
  }


// ============================================================================
// LIVE DEMO (// 03) — clean, simple per-app throttle simulator.
// Bidirectional packet "chips" flow APP <-> NET; flip functions + tune numbers
// and watch delivered / dropped / delayed / throughput respond in real time.
// Self-contained IIFE, vanilla, reduced-motion aware.
// ============================================================================
(function () {
  'use strict';
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(initDemo);

  function initDemo() {
    var c = document.getElementById('demoCanvas'); if (!c) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };
    var ctx, W, H;
    function fit() { var dpr = Math.min(window.devicePixelRatio || 1, 2), r = c.getBoundingClientRect(); c.width = Math.max(1, (r.width * dpr) | 0); c.height = Math.max(1, (r.height * dpr) | 0); ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); W = r.width; H = r.height; }
    fit();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 150); });

    var PROTOS = [
      { l: 'TCP', c: '102,221,255' }, { l: 'UDP', c: '102,229,184' }, { l: '443', c: '255,184,0' },
      { l: 'TLS', c: '102,221,255' }, { l: 'DNS', c: '102,229,184' }, { l: 'ACK', c: '255,184,0' }, { l: 'GET', c: '102,221,255' }
    ];
    function proto() { return PROTOS[(Math.random() * PROTOS.length) | 0]; }

    var state = { lag: false, drop: false, throttle: false, block: false, fun: false, out: true, in: true };
    var params = { lag: 500, drop: 40, throttle: 35, fun: 60 };
    var packets = [], stats = { delivered: 0, dropped: 0, delayed: 0 }, outcomes = [], flip = 0, lastSpawn = 0, lastStat = 0;
    var font = '700 9px "JetBrains Mono", monospace';

    // wire controls
    document.querySelectorAll('#demoFns .demo-fn').forEach(function (row) {
      var fn = row.getAttribute('data-fn'), btn = row.querySelector('.df-sw');
      if (btn) btn.addEventListener('click', function () { state[fn] = !state[fn]; row.classList.toggle('on', state[fn]); btn.setAttribute('aria-pressed', state[fn] ? 'true' : 'false'); });
    });
    document.querySelectorAll('#demoFns .df-input[data-param]').forEach(function (inp) {
      var k = inp.getAttribute('data-param');
      function apply() { var v = parseFloat(inp.value); if (isNaN(v)) return; params[k] = Math.max(parseFloat(inp.min || 0), Math.min(parseFloat(inp.max || 1e9), v)); }
      inp.addEventListener('input', apply); apply();
    });
    var btnOut = document.getElementById('demo-out'), btnIn = document.getElementById('demo-in');
    function dirBtn(b, k) { if (!b) return; b.addEventListener('click', function () { state[k] = !state[k]; b.classList.toggle('on', state[k]); b.setAttribute('aria-pressed', state[k] ? 'true' : 'false'); }); }
    dirBtn(btnOut, 'out'); dirBtn(btnIn, 'in');
    var reset = document.getElementById('demo-reset');
    if (reset) reset.addEventListener('click', function () { stats = { delivered: 0, dropped: 0, delayed: 0 }; outcomes = []; packets = []; });

    var elSent = document.getElementById('demo-sent'), elDrop = document.getElementById('demo-dropped'), elDelay = document.getElementById('demo-delayed'), elRate = document.getElementById('demo-rate');

    function lx() { return Math.max(64, W * 0.12); }
    function rx() { return W - Math.max(64, W * 0.12); }
    function laneOut() { return H * 0.36; }
    function laneIn() { return H * 0.64; }
    function speed() { return state.throttle ? Math.max(0.12, params.throttle / 100) : 1; }
    function interval() { return state.throttle ? Math.min(1300, 240 / Math.max(0.18, params.throttle / 100)) : 240; }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function pushOut(ok) { outcomes.push(ok ? 1 : 0); if (outcomes.length > 50) outcomes.shift(); }

    function spawn() {
      var dirs = []; if (state.out) dirs.push(1); if (state.in) dirs.push(-1);
      if (!dirs.length) return;
      var dir = dirs[flip % dirs.length]; flip++;
      var pr = proto(), src = dir === 1 ? lx() : rx();
      var laneY = (dir === 1 ? laneOut() : laneIn()) + (Math.random() * 12 - 6);
      var p = { dir: dir, src: src, p: 0, x: src, y: laneY, w: 32 + (Math.random() * 12 | 0), h: 16, alpha: 1, hue: pr.c, label: pr.l, state: 'travel', lagged: false, willDrop: false, dropAt: 0, scram: false, vy: 0, frag: [Math.random(), Math.random(), Math.random(), Math.random()] };
      if (state.drop && Math.random() < params.drop / 100) { p.willDrop = true; p.dropAt = 0.3 + Math.random() * 0.28; }
      if (state.fun && Math.random() < params.fun / 100) p.scram = true;
      packets.push(p);
    }

    function chip(p) {
      var w = p.w, h = p.h, x = p.x - w / 2, y = p.y - h / 2, a = p.alpha, hue = p.hue;
      if (p.state === 'held') hue = '255,184,0'; else if (state.throttle) hue = '255,184,0';
      if (p.state === 'travel' || p.state === 'held') {
        var sx = p.x - (w * 0.5 + 18) * p.dir;
        var g = ctx.createLinearGradient(sx, p.y, p.x - (w / 2) * p.dir, p.y);
        g.addColorStop(0, 'rgba(' + hue + ',0)'); g.addColorStop(1, 'rgba(' + hue + ',' + (0.3 * a) + ')');
        ctx.strokeStyle = g; ctx.lineWidth = h * 0.45; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx, p.y); ctx.lineTo(p.x - (w / 2) * p.dir, p.y); ctx.stroke();
      }
      if (p.state === 'dying') { for (var f = 0; f < 4; f++) { var fx = x + (f % 2) * (w / 2), fy = y + ((f / 2) | 0) * (h / 2) + p.frag[f] * 6; ctx.fillStyle = 'rgba(255,68,102,' + a + ')'; rr(fx + p.frag[f] * 3, fy, w / 2 - 2, h / 2 - 2, 2); ctx.fill(); } return; }
      if (p.scram) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((Math.random() - 0.5) * 0.16); ctx.translate(-p.x, -p.y); }
      rr(x, y, w, h, 4); ctx.fillStyle = 'rgba(10,12,12,' + (0.94 * a) + ')'; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(' + hue + ',' + (0.85 * a) + ')'; ctx.stroke();
      rr(x, y, 4, h, 2); ctx.fillStyle = 'rgba(' + hue + ',' + a + ')'; ctx.fill();
      ctx.fillStyle = 'rgba(' + (p.scram ? '255,122,192' : '232,230,216') + ',' + a + ')';
      ctx.font = font; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      var lbl = p.label; if (p.scram && Math.random() < 0.5) lbl = '!#%&*?'[(Math.random() * 6) | 0] + lbl.slice(1);
      ctx.fillText(lbl, x + 8, p.y + 0.5);
      if (p.state === 'held') { ctx.fillStyle = 'rgba(255,184,0,' + a + ')'; ctx.beginPath(); ctx.arc(x + w - 5, y + 5, 2.2, 0, 6.283); ctx.fill(); }
      if (p.scram) ctx.restore();
    }

    function node(x, y, col) { ctx.fillStyle = col.replace(/[\d.]+\)$/, '0.1)'); rr(x - 21, y - 21, 42, 42, 10); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.3; rr(x - 21, y - 21, 42, 42, 10); ctx.stroke(); }

    function update(now) {
      if (now - lastSpawn > interval()) { spawn(); lastSpawn = now; }
      var L = lx(), R = rx();
      for (var i = packets.length - 1; i >= 0; i--) {
        var p = packets[i], dest = p.dir === 1 ? R : L;
        if (p.state === 'held') { if (now >= p.releaseAt) p.state = 'travel'; }
        else if (p.state === 'travel') {
          p.p += 0.0062 * speed() * (1 + Math.random() * 0.1);
          p.x = p.src + (dest - p.src) * p.p;
          if (state.lag && !p.lagged && p.p >= 0.42) { p.state = 'held'; p.lagged = true; p.releaseAt = now + params.lag + Math.random() * params.lag * 0.4; stats.delayed++; continue; }
          if (state.block && p.p >= 0.5) { p.state = 'dying'; stats.dropped++; pushOut(0); continue; }
          if (p.willDrop && p.p >= p.dropAt) { p.state = 'dying'; stats.dropped++; pushOut(0); continue; }
          if (p.p >= 1) { stats.delivered++; pushOut(1); packets.splice(i, 1); continue; }
        } else if (p.state === 'dying') { p.alpha -= 0.05; p.vy += 0.3; p.y += p.vy; if (p.alpha <= 0) packets.splice(i, 1); }
      }
      if (packets.length > 80) packets.splice(0, packets.length - 80);
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      var L = lx(), R = rx(), oY = laneOut(), iY = laneIn(), mid = (L + R) / 2;
      // faint grid
      ctx.strokeStyle = 'rgba(255,184,0,0.04)'; ctx.lineWidth = 1;
      for (var gx = L; gx < R; gx += 46) { ctx.beginPath(); ctx.moveTo(gx, H * 0.12); ctx.lineTo(gx, H * 0.88); ctx.stroke(); }
      // lane rails + labels
      ctx.setLineDash([2, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      if (state.out) { ctx.beginPath(); ctx.moveTo(L, oY); ctx.lineTo(R, oY); ctx.stroke(); }
      if (state.in) { ctx.beginPath(); ctx.moveTo(L, iY); ctx.lineTo(R, iY); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.font = '700 9px "JetBrains Mono", monospace'; ctx.textBaseline = 'middle';
      if (state.out) { ctx.fillStyle = 'rgba(102,229,184,0.5)'; ctx.textAlign = 'left'; ctx.fillText('OUTBOUND \u2192', L, oY - 16); }
      if (state.in) { ctx.fillStyle = 'rgba(102,221,255,0.5)'; ctx.textAlign = 'right'; ctx.fillText('\u2190 INBOUND', R, iY + 16); }
      node(L, (oY + iY) / 2, 'rgba(102,221,255,0.5)');
      node(R, (oY + iY) / 2, state.block ? 'rgba(255,68,102,0.6)' : 'rgba(102,229,184,0.55)');
      if (state.block) { ctx.fillStyle = 'rgba(255,68,102,0.1)'; ctx.fillRect(mid - 4, H * 0.12, 8, H * 0.76); for (var s = H * 0.12; s < H * 0.88; s += 13) { ctx.strokeStyle = 'rgba(255,68,102,0.55)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(mid - 7, s); ctx.lineTo(mid + 7, s + 9); ctx.stroke(); } }
      for (var i = 0; i < packets.length; i++) chip(packets[i]);
    }

    function loop(now) {
      now = now || 0; update(now); draw();
      if (now - lastStat > 100) {
        if (elSent) elSent.textContent = stats.delivered;
        if (elDrop) elDrop.textContent = stats.dropped;
        if (elDelay) elDelay.textContent = stats.delayed;
        if (elRate) {
          var sum = 0; for (var k = 0; k < outcomes.length; k++) sum += outcomes[k];
          var pct = outcomes.length ? Math.round((sum / outcomes.length) * 100) : 100;
          if (state.throttle) pct = Math.round(pct * (params.throttle / 100));
          elRate.textContent = pct + '%';
          elRate.style.color = pct >= 75 ? 'var(--mint)' : pct >= 35 ? 'var(--hazard)' : 'var(--danger)';
        }
        lastStat = now;
      }
      raf(loop);
    }
    if (!reduced) raf(loop); else { for (var k = 0; k < 6; k++) spawn(); draw(); }
  }
})();
