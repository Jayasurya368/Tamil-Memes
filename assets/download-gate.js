/* ============================================================
   DOWNLOAD GATE — loaded on every page that has download links.
   Free downloads: 10 per day (resets at midnight, per browser).
   From the 11th download of the day onward, the user has to
   sit through a 5-second "ad" screen before the download starts.
   Reuses the site's existing ad script — no new ad network.
   ============================================================ */
(function () {
  'use strict';

  var DAILY_LIMIT = 10;
  var AD_SECONDS = 5;
  var COUNT_KEY_PREFIX = 'tm_dl_count_';

  /* ── DAILY COUNTER (resets automatically each new day) ──── */
  function todayKey() {
    var d = new Date();
    return COUNT_KEY_PREFIX + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function getCount() {
    try { return parseInt(localStorage.getItem(todayKey()) || '0', 10) || 0; }
    catch (e) { return 0; }
  }
  function incCount() {
    try { localStorage.setItem(todayKey(), String(getCount() + 1)); } catch (e) {}
  }

  /* ── MODAL (built once, lazily) ──────────────────────────── */
  var overlay, continueBtn, timerEl, statusEl, progressBar, adContainer;

  function buildModal() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'ad-gate-overlay';
    overlay.innerHTML =
      '<div class="ad-gate-box" role="dialog" aria-modal="true">' +
        '<div class="ad-gate-icon">🎬</div>' +
        '<h3>One quick ad, then your download</h3>' +
        '<p class="ad-gate-msg">We know ads are irritating &mdash; but this website is a free downloading website, and this tiny ad is what keeps every template free with no signup. You\u2019ve grabbed ' + DAILY_LIMIT + '+ memes today already, legend. Thanks for bearing with us! 🙏</p>' +
        '<div class="ad-gate-adslot">' +
          '<span class="ad-label">Ad</span>' +
          '<div id="ad-gate-ad-container"></div>' +
        '</div>' +
        '<div class="ad-gate-progress"><div class="ad-gate-progress-bar" id="ad-gate-progress-bar"></div></div>' +
        '<div class="ad-gate-status" id="ad-gate-status">Please wait <span id="ad-gate-timer">' + AD_SECONDS + '</span>s...</div>' +
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
      // Reuse the site's existing ad zone/config
      window.atOptions = {
        key: '05fa0fb0e4ce305cd4b9218a631436ec',
        format: 'iframe',
        height: 50,
        width: 320,
        params: {}
      };
      var s = document.createElement('script');
      s.src = 'https://www.highperformanceformat.com/05fa0fb0e4ce305cd4b9218a631436ec/invoke.js';
      adContainer.appendChild(s);
    } catch (e) {}
  }

  var pendingHref = null;
  var pendingDownload = null;
  var countdownTimer = null;

  function triggerDownload(href, download) {
    var a = document.createElement('a');
    a.href = href;
    if (download !== null) a.setAttribute('download', download || '');
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
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
        continueBtn.textContent = '✅ Continue Download';
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
    var trigger = e.target.closest('a[download], .down, .btn-download, .fav-card-actions a');
    if (!trigger) return;

    var anchor = trigger.tagName === 'A' ? trigger : trigger.closest('a');
    if (!anchor || !anchor.href) return;

    var count = getCount();
    if (count >= DAILY_LIMIT) {
      e.preventDefault();
      e.stopPropagation();
      showGate(anchor.href, anchor.hasAttribute('download') ? anchor.getAttribute('download') : null);
      return;
    }
    incCount();
  }, true);

  /* ── MODAL BUTTON ─────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'ad-gate-continue' && !e.target.disabled) {
      var href = pendingHref, dl = pendingDownload;
      hideGate();
      incCount();
      pendingHref = null;
      pendingDownload = null;
      if (href) triggerDownload(href, dl);
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
