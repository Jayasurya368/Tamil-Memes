/* ============================================================
   DOWNLOAD GATE — loaded on every page that has download links.

   EVERY download click shows a 3-second "preparing your
   download" screen with a native banner ad in it, then the
   real file download starts automatically. No daily free
   quota — this runs every single time.

   Note: the auto-continue at the end of the countdown fires a
   real download by creating + clicking a temporary
   <a download> element. That click bubbles back up into our
   own capture-phase listener below, which would otherwise see
   it as *another* download click and gate it again — looping
   forever. The `suppressGate` flag is set right before that
   programmatic click and cleared on the next tick, so our own
   synthetic click is never re-gated.
   ============================================================ */
(function () {
  'use strict';

  var AD_SECONDS = 3;

  /* ── MODAL (built once, lazily) ──────────────────────────── */
  var overlay, continueBtn, timerEl, statusEl, progressBar, adContainer;

  function buildModal() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'ad-gate-overlay';
    overlay.innerHTML =
      '<div class="ad-gate-box" role="dialog" aria-modal="true">' +
        '<div class="ad-gate-icon">🎬</div>' +
        '<h3>Preparing your download...</h3>' +
        '<p class="ad-gate-msg">We know ads are irritating &mdash; but this website is a free downloading website, and this quick ad is what keeps every template free with no signup. Thanks for bearing with us! 🙏</p>' +
        '<div class="ad-gate-adslot">' +
          '<span class="ad-label">Ad</span>' +
          '<div id="ad-gate-ad-container"></div>' +
        '</div>' +
        '<div class="ad-gate-progress"><div class="ad-gate-progress-bar" id="ad-gate-progress-bar"></div></div>' +
        '<div class="ad-gate-status" id="ad-gate-status">Your download starts in <span id="ad-gate-timer">' + AD_SECONDS + '</span>s...</div>' +
        '<button type="button" class="ad-gate-continue" id="ad-gate-continue" disabled>Please wait...</button>' +
      '</div>';
    document.body.appendChild(overlay);
    continueBtn = overlay.querySelector('#ad-gate-continue');
    timerEl = overlay.querySelector('#ad-gate-timer');
    statusEl = overlay.querySelector('#ad-gate-status');
    progressBar = overlay.querySelector('#ad-gate-progress-bar');
    adContainer = overlay.querySelector('#ad-gate-ad-container');
  }

  function loadAdIntoSlot() {
    adContainer.innerHTML = '';
    try {
      var s = document.createElement('script');
      s.text =
        "(function(csowh){" +
        "var d = document, s = d.createElement('script'), l = d.currentScript || d.scripts[d.scripts.length - 1];" +
        "s.settings = csowh || {};" +
        "s.src = \"\\/\\/shameful-farm.com\\/b.X\\/VLsEdsGglT0PY\\/WgcV\\/te\\/mO9AuvZUUQlmkgPvTbc\\/xjMjT\\/Uj3TOTDdUPttNYz\\/EQxsNaTEc_4vOxQj\";" +
        "s.async = true;" +
        "s.referrerPolicy = 'no-referrer-when-downgrade';" +
        "l.parentNode.insertBefore(s, l.nextSibling);" +
        "})({});";
      adContainer.appendChild(s);
    } catch (e) {}
  }

  var pendingHref = null;
  var pendingDownload = null;
  var countdownTimer = null;
  var suppressGate = false; // true while we fire the real download click ourselves

  function triggerDownload(href, download) {
    var a = document.createElement('a');
    a.href = href;
    if (download !== null) a.setAttribute('download', download || '');
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);

    suppressGate = true;
    a.click();
    // reset on next tick, after our own capture-phase listener has run
    setTimeout(function () { suppressGate = false; }, 0);

    a.remove();
  }

  function finishGate() {
    var href = pendingHref, dl = pendingDownload;
    hideGate();
    pendingHref = null;
    pendingDownload = null;
    if (href) triggerDownload(href, dl);
  }

  function showGate(href, download) {
    buildModal();
    pendingHref = href;
    pendingDownload = download;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    loadAdIntoSlot();

    var seconds = AD_SECONDS;
    timerEl.textContent = seconds;
    statusEl.style.display = 'block';
    continueBtn.disabled = true;
    continueBtn.textContent = 'Please wait...';
    progressBar.style.width = '0%';

    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      seconds--;
      progressBar.style.width = (((AD_SECONDS - seconds) / AD_SECONDS) * 100) + '%';
      if (seconds <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        timerEl.textContent = '0';
        statusEl.style.display = 'none';
        continueBtn.disabled = false;
        continueBtn.textContent = '✅ Download ready';
        // auto-continue once the wait is over
        finishGate();
      } else {
        timerEl.textContent = seconds;
      }
    }, 1000);
  }

  function hideGate() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }

  /* ── INTERCEPT DOWNLOAD CLICKS (capture phase, works with
     dynamically-rendered cards from meme-engine.js too) ──── */
  document.addEventListener('click', function (e) {
    if (suppressGate) return; // this is our own programmatic download click — let it through

    var trigger = e.target.closest('a[download], .down, .btn-download, .fav-card-actions a');
    if (!trigger) return;

    var anchor = trigger.tagName === 'A' ? trigger : trigger.closest('a');
    if (!anchor || !anchor.href) return;

    // Every download goes through the gate now.
    e.preventDefault();
    e.stopPropagation();
    showGate(anchor.href, anchor.hasAttribute('download') ? anchor.getAttribute('download') : null);
  }, true);

  /* ── MODAL BUTTON (manual fallback — normally auto-fires) ─── */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'ad-gate-continue' && !e.target.disabled) {
      finishGate();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
      // Don't allow skipping the wait via Escape — just close the box,
      // the pending download simply won't fire.
      hideGate();
      pendingHref = null;
      pendingDownload = null;
    }
  });
})();
