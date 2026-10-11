/* ============================================================
   DOWNLOAD GATE & AD BLOCKER RESTRICTION SYSTEM
   TamilMemes.co.in — loaded on every page that has download links.

   1. AD BLOCKER DETECTION & RESTRICTION:
      - Lightweight multi-vector JavaScript detection:
        a) Harmless cosmetic DOM bait element testing ad filter lists.
        b) Network probe of site's required ad resources (talentpastryadvisedly / google).
        c) Baseline network check to differentiate ad blockers from network/service outages.
      - If ad resources are blocked:
        a) Existing meme download buttons are disabled.
        b) Existing download handlers are strictly prevented from executing.
        c) Clear message near the button: "Ad blocker detected. Please disable ad blocking and refresh the page to download memes."
        d) "Check Again" / Retry option re-evaluates detection dynamically.
      - If inconclusive (network error or provider outage):
        a) Shows clear connection retry message without permanently blocking users.
      - Avoids repeated network tests on render by caching status.

   2. DOWNLOAD GATE MODAL & FLOW:
      - When ad check passes, normal download flow is fully preserved.
      - 5-second ad timer for first 5 daily downloads; +10s after cap.
      - Downloads fire only from direct user click ("⬇ Click to Download")
        in the same tab to prevent popup blockers.
   ============================================================ */
(function () {
  'use strict';

  var BASE_AD_SECONDS = 5;       // standard visible countdown (seconds)
  var EXTRA_AD_SECONDS = 10;     // extra ad time added after 5 downloads (seconds)
  var STANDARD_DOWNLOAD_CAP = 5; // download count threshold for extra ad time
  var MAX_AD_LOAD_WAIT = 2500;  // ms — never wait longer than this for ad script to settle

  var BLOCKED_MSG = 'Ad blocker detected. Please disable ad blocking and refresh the page to download memes.';
  var INCONCLUSIVE_MSG = 'Unable to verify required ad services due to a network issue. Please check your connection and retry.';

  var REQUIRED_AD_SCRIPT = 'https://talentpastryadvisedly.com/05fa0fb0e4ce305cd4b9218a631436ec/invoke.js';
  var SECONDARY_AD_SCRIPT = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
  var CONNECTIVITY_CHECK_URL = 'assets/style.css';

  /* ── AD BLOCK DETECTION ENGINE ───────────────────────────── */
  var STATE = {
    CHECKING: 'checking',
    ALLOWED: 'allowed',
    BLOCKED: 'blocked',
    INCONCLUSIVE: 'inconclusive'
  };

  var detectorState = STATE.CHECKING;
  var isChecking = false;
  var checkCallbacks = [];
  var hasRunInitialCheck = false;
  var toastTimer = null;

  /* Vector 1: Harmless cosmetic DOM element test */
  function testCosmeticBait() {
    var bait = document.createElement('div');
    bait.className = 'ad-banner adsbox ad-placement pub_300x250 ads-holder banner-ad ad_unit';
    bait.setAttribute('aria-hidden', 'true');
    bait.style.setProperty('position', 'absolute', 'important');
    bait.style.setProperty('left', '-9999px', 'important');
    bait.style.setProperty('top', '-9999px', 'important');
    bait.style.setProperty('width', '100px', 'important');
    bait.style.setProperty('height', '100px', 'important');
    bait.style.setProperty('pointer-events', 'none', 'important');
    bait.style.setProperty('opacity', '0', 'important');

    var container = document.body || document.documentElement;
    if (!container) return false;
    container.appendChild(bait);

    var isBlocked = false;
    try {
      var style = window.getComputedStyle(bait);
      if (
        style &&
        (style.display === 'none' ||
         style.visibility === 'hidden' ||
         style.height === '0px' ||
         bait.offsetParent === null ||
         bait.offsetHeight === 0 ||
         bait.clientHeight === 0)
      ) {
        isBlocked = true;
      }
    } catch (e) {}

    if (bait.parentNode) bait.parentNode.removeChild(bait);
    return isBlocked;
  }

  /* Vector 2: Network probe with abort controller fallback */
  function probeUrl(url, timeoutMs, done) {
    var timedOut = false;
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () {
      timedOut = true;
      if (controller) {
        try { controller.abort(); } catch (e) {}
      }
      done(false, true);
    }, timeoutMs || 2500);

    fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller ? controller.signal : undefined
    })
      .then(function () {
        if (!timedOut) {
          clearTimeout(timer);
          done(true, false);
        }
      })
      .catch(function () {
        if (!timedOut) {
          clearTimeout(timer);
          done(false, false);
        }
      });
  }

  /* Vector 3: Baseline connectivity test */
  function checkConnectivity(cb) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return cb(false);
    }
    probeUrl(CONNECTIVITY_CHECK_URL + '?_t=' + Date.now(), 2000, function (ok) {
      cb(ok);
    });
  }

  /* Full Multi-Vector Detection Procedure */
  function runDetection(callback) {
    // 1. Cosmetic DOM filter test
    if (testCosmeticBait()) {
      return callback(STATE.BLOCKED);
    }

    // 2. Offline check
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return callback(STATE.INCONCLUSIVE);
    }

    // 3. Network probes to required & standard ad network resources
    var urls = [REQUIRED_AD_SCRIPT, SECONDARY_AD_SCRIPT];
    var remaining = urls.length;
    var successes = 0;

    urls.forEach(function (url) {
      probeUrl(url, 2500, function (ok) {
        if (ok) successes++;
        remaining--;

        if (remaining === 0) {
          if (successes > 0) {
            // Required ad resources reachable
            return callback(STATE.ALLOWED);
          }

          // Both failed — check if site/network connectivity is working
          checkConnectivity(function (networkOk) {
            if (networkOk) {
              // Network is fine, but ad services were specifically blocked
              callback(STATE.BLOCKED);
            } else {
              // General network error or server outage
              callback(STATE.INCONCLUSIVE);
            }
          });
        }
      });
    });
  }

  /* Public check trigger with queuing & refresh support */
  function check(forceRefresh, cb) {
    if (cb && typeof cb === 'function') checkCallbacks.push(cb);

    if (!forceRefresh && hasRunInitialCheck && detectorState !== STATE.CHECKING) {
      if (cb) {
        var queued = checkCallbacks.slice();
        checkCallbacks = [];
        queued.forEach(function (fn) { fn(detectorState); });
      }
      return;
    }

    if (isChecking) return;
    isChecking = true;
    detectorState = STATE.CHECKING;
    updateAllCards();
    updateGateModalBlockedState();

    runDetection(function (result) {
      isChecking = false;
      hasRunInitialCheck = true;
      detectorState = result;
      updateAllCards();
      updateGateModalBlockedState();

      try {
        window.dispatchEvent(new CustomEvent('tm:adblock-changed', {
          detail: { status: result }
        }));
      } catch (e) {}

      if (forceRefresh) {
        if (result === STATE.ALLOWED) {
          showToast('✅ Ad check passed! You can now download memes.', false);
        } else if (result === STATE.BLOCKED) {
          showToast('⚠️ ' + BLOCKED_MSG, true);
        } else if (result === STATE.INCONCLUSIVE) {
          showToast('📡 ' + INCONCLUSIVE_MSG, true);
        }
      }

      var queued = checkCallbacks.slice();
      checkCallbacks = [];
      queued.forEach(function (fn) { fn(result); });
    });
  }

  /* Apply detection status to a meme card (.o) */
  function applyToCard(card) {
    if (!card) return;
    var dlBtn = card.querySelector('.down, .btn-download');
    var dlLink = card.querySelector('a[download], .card-actions a, a.down');
    if (!dlLink && dlBtn) dlLink = dlBtn.closest('a');

    var existingNotice = card.querySelector('.adblock-card-notice');

    if (detectorState === STATE.ALLOWED) {
      if (dlBtn) {
        dlBtn.disabled = false;
        dlBtn.classList.remove('adblock-disabled');
        dlBtn.textContent = dlBtn.dataset.originalText || '⬇ Download';
      }
      if (dlLink) {
        dlLink.classList.remove('adblock-disabled-link');
        dlLink.removeAttribute('aria-disabled');
      }
      if (existingNotice) existingNotice.remove();
      return;
    }

    // Restricted (BLOCKED or INCONCLUSIVE or CHECKING)
    if (dlBtn) {
      if (!dlBtn.dataset.originalText) {
        dlBtn.dataset.originalText = dlBtn.textContent || '⬇ Download';
      }
      dlBtn.disabled = true;
      dlBtn.classList.add('adblock-disabled');
      if (detectorState === STATE.CHECKING) {
        dlBtn.textContent = '⏳ Checking Ads...';
      } else if (detectorState === STATE.BLOCKED) {
        dlBtn.textContent = '🚫 Download Disabled';
      } else {
        dlBtn.textContent = '⚠️ Connection Issue';
      }
    }

    if (dlLink) {
      dlLink.classList.add('adblock-disabled-link');
      dlLink.setAttribute('aria-disabled', 'true');
    }

    var noticeType = (detectorState === STATE.BLOCKED) ? 'adblock-blocked' : 'adblock-inconclusive';
    var noticeIcon = (detectorState === STATE.BLOCKED) ? '⚠️' : '📡';
    var noticeMsg = (detectorState === STATE.BLOCKED) ? BLOCKED_MSG : INCONCLUSIVE_MSG;
    if (detectorState === STATE.CHECKING) {
      noticeMsg = 'Checking ad services... Please wait.';
    }

    if (!existingNotice) {
      existingNotice = document.createElement('div');
      existingNotice.className = 'adblock-card-notice ' + noticeType;
      var insertTarget = card.querySelector('.card-actions') || dlLink || dlBtn;
      if (insertTarget && insertTarget.parentNode === card) {
        insertTarget.insertAdjacentElement('afterend', existingNotice);
      } else {
        card.appendChild(existingNotice);
      }
    } else {
      existingNotice.className = 'adblock-card-notice ' + noticeType;
    }

    var isCheckingNow = (detectorState === STATE.CHECKING);
    existingNotice.innerHTML =
      '<div class="adblock-notice-body">' +
        '<span class="adblock-notice-icon">' + noticeIcon + '</span>' +
        '<span class="adblock-notice-text">' + noticeMsg + '</span>' +
      '</div>' +
      '<button type="button" class="adblock-retry-btn" data-action="retry-adblock"' + (isCheckingNow ? ' disabled' : '') + '>' +
        (isCheckingNow ? '⏳ Checking...' : '🔄 Check Again') +
      '</button>';
  }

  /* Apply detection status to a favourite modal card (.fav-card) */
  function applyToFavCard(card) {
    if (!card) return;
    var dlLink = card.querySelector('.fav-card-actions a');
    var existingNotice = card.querySelector('.adblock-card-notice');

    if (detectorState === STATE.ALLOWED) {
      if (dlLink) {
        dlLink.classList.remove('adblock-disabled-link');
        dlLink.removeAttribute('aria-disabled');
        dlLink.textContent = '⬇ Download';
      }
      if (existingNotice) existingNotice.remove();
      return;
    }

    if (dlLink) {
      dlLink.classList.add('adblock-disabled-link');
      dlLink.setAttribute('aria-disabled', 'true');
      dlLink.textContent = (detectorState === STATE.CHECKING) ? '⏳ Checking...' : '🚫 Disabled';
    }

    var noticeType = (detectorState === STATE.BLOCKED) ? 'adblock-blocked' : 'adblock-inconclusive';
    var noticeIcon = (detectorState === STATE.BLOCKED) ? '⚠️' : '📡';
    var noticeMsg = (detectorState === STATE.BLOCKED) ? BLOCKED_MSG : INCONCLUSIVE_MSG;
    if (detectorState === STATE.CHECKING) {
      noticeMsg = 'Checking ad services...';
    }

    if (!existingNotice) {
      existingNotice = document.createElement('div');
      existingNotice.className = 'adblock-card-notice ' + noticeType;
      card.appendChild(existingNotice);
    } else {
      existingNotice.className = 'adblock-card-notice ' + noticeType;
    }

    var isCheckingNow = (detectorState === STATE.CHECKING);
    existingNotice.innerHTML =
      '<div class="adblock-notice-body">' +
        '<span class="adblock-notice-icon">' + noticeIcon + '</span>' +
        '<span class="adblock-notice-text">' + noticeMsg + '</span>' +
      '</div>' +
      '<button type="button" class="adblock-retry-btn" data-action="retry-adblock"' + (isCheckingNow ? ' disabled' : '') + '>' +
        (isCheckingNow ? '⏳ Checking...' : '🔄 Check Again') +
      '</button>';
  }

  /* Update all rendered cards in the DOM */
  function updateAllCards() {
    var cards = document.querySelectorAll('.o');
    for (var i = 0; i < cards.length; i++) {
      applyToCard(cards[i]);
    }
    var favCards = document.querySelectorAll('.fav-card');
    for (var j = 0; j < favCards.length; j++) {
      applyToFavCard(favCards[j]);
    }
  }

  /* Toast notification */
  function showToast(msg, isWarning) {
    var toast = document.getElementById('adblock-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adblock-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML =
      '<span class="adblock-toast-msg">' + msg + '</span>' +
      (isWarning ? '<button type="button" class="adblock-toast-retry" data-action="retry-adblock">Check Again</button>' : '');

    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 4500);
  }

  /* Highlight notice when user clicks a disabled button */
  function highlightRestriction(trigger) {
    var card = trigger ? trigger.closest('.o, .fav-card') : null;
    if (card) {
      var notice = card.querySelector('.adblock-card-notice');
      if (notice) {
        notice.classList.remove('adblock-pulse');
        void notice.offsetWidth;
        notice.classList.add('adblock-pulse');
      }
    }
    var msg = (detectorState === STATE.BLOCKED) ? BLOCKED_MSG : INCONCLUSIVE_MSG;
    showToast('⚠️ ' + msg, true);
  }

  /* Public API exposed on window */
  window.TMAdBlock = {
    STATE: STATE,
    getStatus: function () { return detectorState; },
    isRestricted: function () { return detectorState !== STATE.ALLOWED; },
    check: check,
    applyToCard: applyToCard,
    applyToFavCard: applyToFavCard,
    updateAllCards: updateAllCards,
    highlightRestriction: highlightRestriction
  };

  /* ── DAILY DOWNLOAD COUNTER ───────────────────────────────── */
  function getDailyDownloadCount() {
    try {
      var today = new Date().toDateString();
      var savedDate = localStorage.getItem('tmw_download_date');
      var count = parseInt(localStorage.getItem('tmw_download_count') || '0', 10);
      if (savedDate !== today) {
        localStorage.setItem('tmw_download_date', today);
        localStorage.setItem('tmw_download_count', '0');
        return 0;
      }
      return isNaN(count) ? 0 : count;
    } catch (e) {
      return 0;
    }
  }

  function incrementDailyDownloadCount() {
    try {
      var today = new Date().toDateString();
      var count = getDailyDownloadCount();
      localStorage.setItem('tmw_download_date', today);
      localStorage.setItem('tmw_download_count', (count + 1).toString());
    } catch (e) {}
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
    timerEl = null;
    statusEl = overlay.querySelector('#ad-gate-status');
    progressBar = overlay.querySelector('#ad-gate-progress-bar');
    adContainer = overlay.querySelector('#ad-gate-ad-container');
  }

  /* Loads the ad into the modal slot with verified settlement */
  function loadAdIntoSlot(onSettled) {
    adContainer.innerHTML = '';
    var settled = false;
    function settle(success) {
      if (settled) return;
      settled = true;
      if (onSettled) onSettled(success);
    }

    try {
      window.atOptions = {
        'key' : '0d138aeb5525dbdf1aa7fb2be9127134',
        'format' : 'iframe',
        'height' : 300,
        'width' : 160,
        'params' : {}
      };

      var s = document.createElement('script');
      s.src = 'https://talentpastryadvisedly.com/0d138aeb5525dbdf1aa7fb2be9127134/invoke.js';
      s.async = true;
      s.onload = function () {
        settle(true);
      };
      s.onerror = function () {
        // Script blocked or errored
        settle(false);
      };
      adContainer.appendChild(s);
    } catch (e) {
      settle(false);
    }

    setTimeout(function () {
      var hasAdContent = adContainer.querySelector('iframe') || (adContainer.children.length > 1);
      settle(!!hasAdContent);
    }, MAX_AD_LOAD_WAIT);
  }

  function updateGateModalBlockedState() {
    if (!overlay || !overlay.classList.contains('open')) return;
    if (detectorState === STATE.ALLOWED) {
      // Allowed — if gate is open and ad settled, let countdown resume
      return;
    }
    // Blocked or Inconclusive inside the modal
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    progressBar.style.width = '0%';
    continueBtn.disabled = true;
    continueBtn.textContent = 'Download Restricted';
    pendingHref = null;
    pendingDownload = null;

    var msg = (detectorState === STATE.BLOCKED) ? BLOCKED_MSG : INCONCLUSIVE_MSG;
    statusEl.style.display = 'block';
    statusEl.innerHTML =
      '<div class="adblock-modal-msg">⚠️ ' + msg + '</div>' +
      '<button type="button" class="adblock-retry-btn" data-action="retry-adblock" style="margin: 0 auto 10px;">🔄 Check Again</button>';
  }

  var pendingHref = null;
  var pendingDownload = null;
  var countdownTimer = null;
  var suppressGate = false;
  var gateHistoryPushed = false;
  var selfPop = false;

  function triggerDownload(href, download) {
    var a = document.createElement('a');
    a.href = href;
    if (download !== null) a.setAttribute('download', download || '');
    document.body.appendChild(a);

    suppressGate = true;
    a.click();
    setTimeout(function () { suppressGate = false; }, 0);

    a.remove();
  }

  function finishGate() {
    if (detectorState !== STATE.ALLOWED) {
      updateGateModalBlockedState();
      return;
    }
    var href = pendingHref, dl = pendingDownload;
    hideGate();
    gateHistoryPushed = false;
    pendingHref = null;
    pendingDownload = null;
    incrementDailyDownloadCount();
    if (href) triggerDownload(href, dl);
  }

  function startCountdown(totalSeconds) {
    var duration = totalSeconds || BASE_AD_SECONDS;
    statusEl.innerHTML = 'Your download starts in <span id="ad-gate-timer">' + duration + '</span>s...';
    timerEl = statusEl.querySelector('#ad-gate-timer');

    var secondsRemaining = duration;
    progressBar.style.width = '0%';

    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      secondsRemaining--;
      progressBar.style.width = (((duration - secondsRemaining) / duration) * 100) + '%';
      if (secondsRemaining <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        statusEl.style.display = 'none';
        continueBtn.disabled = false;
        continueBtn.textContent = '⬇ Click to Download';
      } else if (timerEl) {
        timerEl.textContent = secondsRemaining;
      }
    }, 1000);
  }

  function showGate(href, download) {
    // Extra safety barrier: do not open gate if ad blocker is active
    if (detectorState !== STATE.ALLOWED) {
      highlightRestriction(null);
      return;
    }

    buildModal();
    pendingHref = href;
    pendingDownload = download;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    statusEl.style.display = 'block';
    statusEl.textContent = 'Loading ad\u2026';
    continueBtn.disabled = true;
    continueBtn.textContent = 'Please wait...';
    progressBar.style.width = '0%';

    try {
      history.pushState({ tmwAdGate: true }, '', location.href);
      gateHistoryPushed = true;
    } catch (e) {}

    var count = getDailyDownloadCount();
    var adSeconds = count >= STANDARD_DOWNLOAD_CAP ? (BASE_AD_SECONDS + EXTRA_AD_SECONDS) : BASE_AD_SECONDS;

    loadAdIntoSlot(function (adSuccess) {
      if (!adSuccess) {
        detectorState = STATE.BLOCKED;
        updateAllCards();
        updateGateModalBlockedState();
        return;
      }
      startCountdown(adSeconds);
    });
  }

  function hideGate() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }

  /* ── INTERCEPT DOWNLOAD CLICKS (capture phase) ──── */
  document.addEventListener('click', function (e) {
    if (suppressGate) return;

    var trigger = e.target.closest('a[download], .down, .btn-download, .fav-card-actions a, .tmw-result-item a, a[href*="drive.google.com"], a[href*="mediafire.com"]');
    if (!trigger) return;

    var anchor = trigger.tagName === 'A' ? trigger : trigger.closest('a');
    if (!anchor || !anchor.href) return;

    // RESTRICTION ENFORCEMENT: Prevent download handler if ad blocker detected or inconclusive
    if (detectorState !== STATE.ALLOWED) {
      e.preventDefault();
      e.stopPropagation();
      highlightRestriction(trigger);
      return;
    }

    // Ad gate active when check passes
    e.preventDefault();
    e.stopPropagation();
    showGate(anchor.href, anchor.hasAttribute('download') ? anchor.getAttribute('download') : null);
  }, true);

  /* ── GLOBAL DELEGATED CLICK LISTENER (Check Again / Modals) ──── */
  document.addEventListener('click', function (e) {
    // Retry / Check Again button
    var retryBtn = e.target.closest('[data-action="retry-adblock"]');
    if (retryBtn) {
      e.preventDefault();
      check(true);
      return;
    }

    // Modal Continue button
    if (e.target && e.target.id === 'ad-gate-continue' && !e.target.disabled) {
      finishGate();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
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

  /* ── PHONE / BROWSER BACK BUTTON WHILE GATE IS OPEN ────────── */
  window.addEventListener('popstate', function () {
    if (selfPop) { selfPop = false; return; }
    if (overlay && overlay.classList.contains('open')) {
      gateHistoryPushed = false;
      hideGate();
      pendingHref = null;
      pendingDownload = null;
      window.location.href = 'index.html';
    }
  });

  /* ── DOM OBSERVER FOR DYNAMIC CARDS ──────────────────────── */
  function observeGrids() {
    if (typeof MutationObserver === 'undefined') return;
    var obs = new MutationObserver(function () {
      if (detectorState === STATE.ALLOWED) return;
      updateAllCards();
    });

    var resultList = document.getElementById('resultList');
    if (resultList) obs.observe(resultList, { childList: true });

    var favGrid = document.getElementById('fav-grid');
    if (favGrid) obs.observe(favGrid, { childList: true });
  }

  /* ── INITIAL CHECK ON STARTUP ────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      observeGrids();
      check(false);
    });
  } else {
    observeGrids();
    check(false);
  }
})();
