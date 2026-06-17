/* ============================================================
   COOKIE CONSENT — shared by index.html + privacy.html
   Stores "accepted" | "declined" under key tm_cookie_consent.
   Dispatches a "tm:consent-changed" event so other scripts
   (favourites in meme-engine.js) can react without depending
   on this file's internals directly.
   ============================================================ */
(function () {
  function getConsent() {
    try {
      var v = localStorage.getItem('tm_cookie_consent');
      if (v) return v;
    } catch (e) {}
    var m = document.cookie.split('; ').find(function (r) { return r.indexOf('tm_cookie_consent=') === 0; });
    return m ? decodeURIComponent(m.split('=')[1]) : null;
  }

  function setConsent(accepted) {
    var value = accepted ? 'accepted' : 'declined';
    try { localStorage.setItem('tm_cookie_consent', value); } catch (e) {}
    var exp = new Date(Date.now() + 365 * 864e5).toUTCString();
    document.cookie = 'tm_cookie_consent=' + encodeURIComponent(value) + '; expires=' + exp + '; path=/; SameSite=Lax';

    if (!accepted) {
      try { localStorage.removeItem('tmfavs'); } catch (e) {}
      document.cookie = 'tmfavs=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    hideBanner();
    document.dispatchEvent(new CustomEvent('tm:consent-changed', { detail: { accepted: accepted } }));
  }

  function hideBanner() {
    var b = document.getElementById('cookie-consent-banner');
    if (b) b.classList.remove('visible');
  }

  function showBanner() {
    var b = document.getElementById('cookie-consent-banner');
    if (b) b.classList.add('visible');
  }

  function showBannerIfNeeded() {
    if (getConsent() === null) showBanner();
  }

  function updateStatusUI() {
    var dot = document.getElementById('cookie-status-dot');
    var text = document.getElementById('cookie-status-text');
    if (!dot || !text) return;
    var consent = getConsent();
    dot.classList.remove('accepted', 'declined');
    if (consent === 'accepted') {
      dot.classList.add('accepted');
      text.textContent = '✅ You have accepted cookies. Favourites are enabled.';
    } else if (consent === 'declined') {
      dot.classList.add('declined');
      text.textContent = '🚫 You have declined cookies. Favourites are disabled.';
    } else {
      text.textContent = "You haven't made a choice yet — favourites are disabled until you decide.";
    }
  }

  window.TMCookies = {
    getConsent: getConsent,
    setConsent: setConsent,
    showBanner: showBanner,
    hideBanner: hideBanner,
    showBannerIfNeeded: showBannerIfNeeded
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action="accept-cookies"], [data-action="decline-cookies"]');
    if (!el) return;
    setConsent(el.dataset.action === 'accept-cookies');
  });

  document.addEventListener('tm:consent-changed', updateStatusUI);
  document.addEventListener('DOMContentLoaded', function () {
    updateStatusUI();
    showBannerIfNeeded();
  });
})();
