/* ============================================================
   DOWNLOAD GATE — loaded on every page that has download links.

   EVERY download click shows a "preparing your download" screen
   with a native banner ad in it. Once the countdown finishes,
   the person clicks "Click to Download" and the real file
   download starts. No daily free quota — this runs every time.

   FIX 1 (ad showing up "late"): the visible countdown used to
   start the instant the modal opened, at the same time the ad
   script was still being requested over the network. On a slow
   connection the countdown could finish before the ad even
   rendered. Now we show a "Loading ad…" state first and only
   start the AD_SECONDS countdown once the ad script's onload/
   onerror fires — with a MAX_AD_LOAD_WAIT safety cap so a
   blocked/slow ad can never hang the download forever.

   FIX 2 ("popup blocked" on download): the download used to fire
   automatically from the timer with target="_blank". Opening a
   new tab from code that isn't running inside a direct click
   handler is exactly what browsers flag as a blocked popup —
   which is what everyone was seeing and clicking through blindly.
   Now: (a) there's no target="_blank" at all, the file downloads
   in the same tab like the original buttons did, and (b) the
   download only fires from the person's actual click on
   "Click to Download", never automatically from the timer. A real
   click is a genuine user gesture, so browsers never block it.

   Note: that real click on "Continue" fires a real download by
   creating + clicking a temporary <a download> element. That
   click bubbles back up into our own capture-phase listener
   below, which would otherwise see it as *another* download
   click and gate it again — looping forever. The `suppressGate`
   flag is set right before that programmatic click and cleared
   on the next tick, so our own synthetic click is never re-gated.
   ============================================================ */
(function () {
  'use strict';

  var AD_SECONDS = 5;          // visible countdown, only starts once the ad has loaded
  var MAX_AD_LOAD_WAIT = 2500; // ms — never wait longer than this for the ad itself to load

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
        '<div class="ad-gate-status" id="ad-gate-status">Loading ad&hellip;</div>' +
        '<button type="button" class="ad-gate-continue" id="ad-gate-continue" disabled>Please wait...</button>' +
      '</div>';
    document.body.appendChild(overlay);
    continueBtn = overlay.querySelector('#ad-gate-continue');
    timerEl = null; // (re)created fresh each time we build the countdown text
    statusEl = overlay.querySelector('#ad-gate-status');
    progressBar = overlay.querySelector('#ad-gate-progress-bar');
    adContainer = overlay.querySelector('#ad-gate-ad-container');
  }

  /* Loads the ad and calls back once it has either loaded,
     errored, or MAX_AD_LOAD_WAIT has elapsed — whichever comes first.
     This is what lets us delay the countdown until the ad is actually
     ready, instead of racing it. */
  function loadAdIntoSlot(onSettled) {
    adContainer.innerHTML = '';
    var settled = false;
    function settle() {
      if (settled) return;
      settled = true;
      if (onSettled) onSettled();
    }

    try {
      // 1) Config script: declares the global `atOptions` object that
      //    the invoke.js script below reads when it boots.
      var configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.text =
        "atOptions = {" +
          "'key' : '05fa0fb0e4ce305cd4b9218a631436ec'," +
          "'format' : 'iframe'," +
          "'height' : 50," +
          "'width' : 320," +
          "'params' : {}" +
        "};";
      adContainer.appendChild(configScript);

      // 2) Main ad tag — this is what actually inserts the iframe banner.
      //    onload fires after the script has executed, onerror if it 404s
      //    or is blocked. Either way we settle and start the countdown.
      var s = document.createElement('script');
      s.type = 'text/javascript';
      s.src = 'https://www.highperformanceformat.com/05fa0fb0e4ce305cd4b9218a631436ec/invoke.js';
      s.async = true;
      s.referrerPolicy = 'no-referrer-when-downgrade';
      s.onload = settle;
      s.onerror = settle;
      adContainer.appendChild(s);
    } catch (e) {
      settle();
    }

    // Safety net: an adblocker or a slow network should never leave the
    // user stuck on "Loading ad…" forever.
    setTimeout(settle, MAX_AD_LOAD_WAIT);
  }

  var pendingHref = null;
  var pendingDownload = null;
  var countdownTimer = null;
  var suppressGate = false;      // true while we fire the real download click ourselves
  var gateHistoryPushed = false; // true while a "checkpoint" history entry is sitting under the gate
  var selfPop = false;           // true while we're the ones popping our own checkpoint (not the user)

  function triggerDownload(href, download) {
    var a = document.createElement('a');
    a.href = href;
    if (download !== null) a.setAttribute('download', download || '');
    // No target="_blank" here on purpose: opening a new tab from code
    // that isn't running directly inside a click handler is exactly what
    // browsers flag as a blocked popup. Downloading in the same tab
    // (same as the site's original download buttons) avoids that entirely.
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
    gateHistoryPushed = false; // the tab is about to navigate for the download anyway
    pendingHref = null;
    pendingDownload = null;
    if (href) triggerDownload(href, dl);
  }

  function startCountdown() {
    // Build the "X seconds" status line fresh now that the ad has settled.
    statusEl.innerHTML = 'Your download starts in <span id="ad-gate-timer">' + AD_SECONDS + '</span>s...';
    timerEl = statusEl.querySelector('#ad-gate-timer');

    var seconds = AD_SECONDS;
    progressBar.style.width = '0%';

    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      seconds--;
      progressBar.style.width = (((AD_SECONDS - seconds) / AD_SECONDS) * 100) + '%';
      if (seconds <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        statusEl.style.display = 'none';
        continueBtn.disabled = false;
        continueBtn.textContent = '⬇ Click to Download';
        // NOTE: we deliberately do NOT call finishGate() here.
        // Firing the download automatically from a timer callback (no
        // real click behind it) is exactly what browsers flag as an
        // unwanted popup/auto-download and silently block. Enabling the
        // button and waiting for the person's actual click keeps the
        // download tied to a genuine user gesture, so it always goes
        // through cleanly with no "popup blocked" bar.
      } else if (timerEl) {
        timerEl.textContent = seconds;
      }
    }, 1000);
  }

  function showGate(href, download) {
    buildModal();
    pendingHref = href;
    pendingDownload = download;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Reset to the "loading" state every time the gate opens.
    statusEl.style.display = 'block';
    statusEl.textContent = 'Loading ad\u2026';
    continueBtn.disabled = true;
    continueBtn.textContent = 'Please wait...';
    progressBar.style.width = '0%';

    // Push a "checkpoint" history entry so a phone/browser back-press
    // while the gate is open fires our popstate handler below instead
    // of silently navigating to whatever page happened to be earlier
    // in history (e.g. a stray thank-you.html from a past form submit).
    try {
      history.pushState({ tmwAdGate: true }, '', location.href);
      gateHistoryPushed = true;
    } catch (e) {}

    // Only start the visible countdown once the ad has actually
    // loaded (or the safety timeout fires) — this is the fix for
    // the ad appearing "late" relative to the timer.
    loadAdIntoSlot(startCountdown);
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
      if (gateHistoryPushed) {
        selfPop = true;
        gateHistoryPushed = false;
        try { history.back(); } catch (e2) {}
      }
    }
  });

  /* ── PHONE / BROWSER BACK BUTTON WHILE GATE IS OPEN ──────────
     Fires when the checkpoint state pushed in showGate() gets
     popped. Instead of letting the browser fall through to
     whatever page was actually earlier in history, we close the
     gate, cancel the pending download (the person backed out, they
     didn't continue), and send them to index.html on purpose. */
  window.addEventListener('popstate', function () {
    if (selfPop) { selfPop = false; return; } // we triggered this ourselves cleaning up, ignore it
    if (overlay && overlay.classList.contains('open')) {
      gateHistoryPushed = false;
      hideGate();
      pendingHref = null;
      pendingDownload = null;
      window.location.href = 'index.html';
    }
  });
})();

