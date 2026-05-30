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
  const tiltSelector = '.usecase, .tool-card, .power-card, .design-card, .faq-item';
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
        const rotY = (px - 0.5) * 8;      // left/right
        const rotX = (0.5 - py) * 6;      // up/down
        card.style.transform =
          'perspective(900px) rotateX(' + rotX.toFixed(2) + 'deg) ' +
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
    const magnetSelector = '.nav-cta, .btn-download, .btn-secondary';
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
        scriptWindow.classList.add('is-compiling');
        if (scriptStatus) scriptStatus.textContent = 'Compiling…';
        setTimeout(function () {
          scriptWindow.classList.remove('is-compiling');
          scriptWindow.classList.add('is-compiled');
          if (scriptStatus) scriptStatus.textContent = STATUS_COMPILED;
        }, 900);
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
