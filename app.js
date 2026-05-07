// ============================================================================
// THROTTLR — coming soon (max-impact)
// 1. CRT noise canvas
// 2. Cursor spotlight (CSS vars)
// 3. Bolt mouse parallax
// 4. Scroll-triggered section reveals
// 5. Live clock in telemetry box
// ============================================================================

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------------------------------------------------------------------------
  // 1. CRT NOISE CANVAS
  // -------------------------------------------------------------------------
  const noiseCanvas = document.getElementById('noise');
  if (noiseCanvas && noiseCanvas.getContext) {
    const ctx = noiseCanvas.getContext('2d');
    function resizeNoise() {
      noiseCanvas.width = Math.floor(window.innerWidth / 2);
      noiseCanvas.height = Math.floor(window.innerHeight / 2);
      noiseCanvas.style.width = window.innerWidth + 'px';
      noiseCanvas.style.height = window.innerHeight + 'px';
    }
    function paintNoise() {
      const w = noiseCanvas.width, h = noiseCanvas.height;
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    resizeNoise();
    paintNoise();
    if (!reduceMotion) setInterval(paintNoise, 120);
    window.addEventListener('resize', function () { resizeNoise(); paintNoise(); });
  }

  // -------------------------------------------------------------------------
  // 2. CURSOR SPOTLIGHT
  // Update CSS vars --mx and --my to drive the radial-gradient .cursor-light.
  // -------------------------------------------------------------------------
  if (!reduceMotion) {
    let cursorTicking = false;
    let cx = window.innerWidth / 2, cy = window.innerHeight * 0.3;
    document.addEventListener('mousemove', function (e) {
      cx = e.clientX;
      cy = e.clientY;
      if (!cursorTicking) {
        requestAnimationFrame(function () {
          document.documentElement.style.setProperty('--mx', cx + 'px');
          document.documentElement.style.setProperty('--my', cy + 'px');
          cursorTicking = false;
        });
        cursorTicking = true;
      }
    }, { passive: true });
  }

  // -------------------------------------------------------------------------
  // 3. BOLT MOUSE PARALLAX
  // Subtle 3D tilt of the bolt SVG that tracks the cursor in the hero area.
  // -------------------------------------------------------------------------
  const bolt = document.getElementById('boltSvg');
  const hero = document.querySelector('.hero');
  if (bolt && hero && !reduceMotion && window.matchMedia('(min-width: 1100px)').matches) {
    let parallaxTicking = false;
    hero.addEventListener('mousemove', function (e) {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;   // 0 to 1
      const y = (e.clientY - rect.top) / rect.height;
      if (!parallaxTicking) {
        requestAnimationFrame(function () {
          // Combine with the float animation by overriding transform
          const ry = (x - 0.5) * 18;   // ±9deg
          const rx = -(y - 0.5) * 12;  // ±6deg
          bolt.style.transform =
            `perspective(800px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
          parallaxTicking = false;
        });
        parallaxTicking = true;
      }
    });
    hero.addEventListener('mouseleave', function () {
      bolt.style.transform = '';   // resume CSS keyframe
    });
  }

  // -------------------------------------------------------------------------
  // 4. SCROLL-TRIGGERED SECTION REVEALS
  // Adds .is-visible to elements with [data-section-reveal] when they enter
  // the viewport — CSS handles the actual transition.
  // -------------------------------------------------------------------------
  const revealEls = document.querySelectorAll('[data-section-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // -------------------------------------------------------------------------
  // 5. LIVE CLOCK in the top-right telemetry box
  // -------------------------------------------------------------------------
  const timeEl = document.getElementById('telem-time');
  if (timeEl) {
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function tickClock() {
      const d = new Date();
      timeEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
    tickClock();
    setInterval(tickClock, 1000);
  }
})();

// ============================================================================
// 6. NOTIFY FORM
// Format check → dedup against localStorage → POST to Netlify Forms (if
// deployed there) → show feedback. Three states: error / warn / success.
// ============================================================================
(function () {
  const form     = document.getElementById('notify-form');
  const input    = document.getElementById('notify-email');
  const wrap     = form && form.querySelector('.notify-input-wrap');
  const feedback = document.getElementById('notify-feedback');
  const btn      = document.getElementById('notify-btn');
  if (!form || !input || !feedback) return;

  // Loose email format check — catches obvious garbage but stays permissive
  const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const STORAGE_KEY = 'throttlr_notify_list';

  function loadList() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }
  function saveList(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (_) {}
  }

  let feedbackTimer = null;
  function showFeedback(type, message) {
    feedback.className = 'notify-feedback notify-feedback-' + type + ' is-active';
    feedback.textContent = message;
    clearTimeout(feedbackTimer);
    if (type !== 'success') {
      // Auto-clear non-success messages after a few seconds
      feedbackTimer = setTimeout(function () {
        feedback.className = 'notify-feedback';
        feedback.textContent = '';
      }, 5000);
    }
  }

  function flashError() {
    if (!wrap) return;
    wrap.classList.add('is-error');
    setTimeout(function () { wrap.classList.remove('is-error'); }, 600);
  }

  // If this browser already submitted before, lock the form on load so the
  // returning visitor doesn't see a blank form again.
  const existing = loadList();
  if (existing.length > 0) {
    form.classList.add('is-locked');
    showFeedback('warn', "You're already on the list. We'll transmit when it's live.");
    if (btn) btn.disabled = true;
    input.value = existing[existing.length - 1];
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = (input.value || '').trim().toLowerCase();

    // 1. Format check
    if (!EMAIL_RX.test(email)) {
      flashError();
      showFeedback('error', 'Invalid email — try again.');
      input.focus();
      return;
    }

    // 2. Dedup check (per-browser via localStorage)
    const list = loadList();
    if (list.indexOf(email) !== -1) {
      showFeedback('warn', "Already on the list — we'll transmit soon.");
      return;
    }

    // 3. Save locally
    list.push(email);
    saveList(list);

    // 4. POST to Netlify Forms (silent, only works on Netlify deploy).
    //    On non-Netlify hosts the fetch fails harmlessly — local dedup
    //    + success message still work for the user.
    if (form.getAttribute('data-netlify') === 'true') {
      const formData = new FormData(form);
      const params = new URLSearchParams();
      formData.forEach(function (v, k) { params.append(k, v); });
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }).catch(function () { /* silent — local list already saved */ });
    }

    // 5. Success state
    form.classList.add('is-locked');
    if (btn) btn.disabled = true;
    showFeedback('success', "Locked in. We'll transmit when it's live.");
  });
})();
