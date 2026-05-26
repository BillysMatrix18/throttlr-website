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
  // Adds .is-visible to .reveal elements when they enter viewport.
  // Delays are set inline via --d CSS variable.
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
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
    if (!verEls.length && !dlEls.length) return;
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
          if (!exes.length) return;
          // Prefer the installer (filename contains "Setup") over portable .exe
          const installer = exes.find(function (a) {
            return /setup/i.test(a.name);
          }) || exes[0];
          dlEls.forEach(function (el) {
            el.setAttribute('href', installer.browser_download_url);
          });
        }
      })
      .catch(function () { /* silent fail — static href fallback still works */ });
  })();
