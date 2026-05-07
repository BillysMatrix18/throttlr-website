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
// Format check → POST to Netlify Forms → show feedback. Always submits to
// Netlify when format is valid. localStorage is used only for tracking, never
// for blocking submissions (so users can always resubmit if needed).
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

  function lockSuccess() {
    form.classList.add('is-locked');
    if (btn) btn.disabled = true;
    showFeedback('success', "Locked in. We'll transmit when it's live.");
  }

  // NOTE: We intentionally do NOT auto-lock the form on revisit. Previously
  // this blocked legitimate submissions if the user had ever tested locally,
  // and Netlify never received the POST. localStorage is now informational
  // only — users can always resubmit.

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

    // 2. Build POST body for Netlify
    const formData = new FormData(form);
    formData.set('form-name', 'notify');   // ensure it's set even if hidden input is missed
    formData.set('email', email);          // ensure normalized email is sent

    const params = new URLSearchParams();
    formData.forEach(function (v, k) { params.append(k, v); });

    // 3. Disable button while in flight, show "transmitting" feedback
    if (btn) btn.disabled = true;
    showFeedback('warn', 'Transmitting…');
    console.log('[notify] submitting', { email: email, body: params.toString() });

    // 4. POST to Netlify Forms (root path of the site)
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }).then(function (response) {
      console.log('[notify] response status:', response.status, response.statusText);
      if (response.ok || response.status === 200 || response.status === 303) {
        // 200 = JSON-ish success, 303 = Netlify's standard redirect-after-POST
        const list = loadList();
        if (list.indexOf(email) === -1) list.push(email);
        saveList(list);
        lockSuccess();
      } else {
        if (btn) btn.disabled = false;
        showFeedback('error', 'Submission failed (' + response.status + '). Please try again.');
        console.error('[notify] non-OK response', response);
      }
    }).catch(function (err) {
      // Network failure or non-Netlify host — save locally so the user gets
      // confirmation, but log the actual error so it can be debugged.
      console.error('[notify] fetch failed:', err);
      const list = loadList();
      if (list.indexOf(email) === -1) list.push(email);
      saveList(list);
      lockSuccess();
    });
  });
})();
