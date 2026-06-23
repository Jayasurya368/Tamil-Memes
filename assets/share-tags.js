/**
 * share-tags.js  v2
 * Injects WhatsApp share + Copy Link buttons into every meme card.
 * Works with meme-engine.js (dynamic .o cards) AND tamil.html static cards.
 * Tag filtering is fully handled by meme-engine.js — we don't touch it.
 */
(function () {
  'use strict';

  /* ── STYLES ─────────────────────────────────────────── */
  var CSS = `
    .card-share-row {
      display: flex;
      gap: 6px;
      padding: 0 14px 12px;
    }
    .btn-wa {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      background: #25d366;
      color: #fff;
      border: none;
      padding: 8px 10px;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      text-decoration: none;
      transition: opacity .2s, transform .1s;
      flex: 1;
      white-space: nowrap;
    }
    .btn-wa:hover { opacity: .85; transform: scale(1.02); }
    .btn-wa svg { width: 13px; height: 13px; fill: #fff; flex-shrink: 0; }

    .btn-copy {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      background: var(--surface, #f7f7f8);
      color: var(--text, #1a1a1a);
      border: 1px solid var(--border, #e6e6e6);
      padding: 8px 10px;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: border-color .2s, color .2s, transform .1s;
      flex: 1;
      white-space: nowrap;
    }
    .btn-copy:hover {
      border-color: var(--accent, #ff4500);
      color: var(--accent, #ff4500);
      transform: scale(1.02);
    }
    .btn-copy svg { width: 13px; height: 13px; fill: currentColor; flex-shrink: 0; }
    .btn-copy.copied { border-color: #25d366; color: #25d366; }

    @media (max-width: 600px) {
      .card-share-row { padding: 0 8px 10px; gap: 5px; }
      .btn-wa, .btn-copy { font-size: 10px; padding: 6px 8px; }
    }
  `;
  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ── HELPERS ─────────────────────────────────────────── */
  function getTitle(card) {
    var h3 = card.querySelector('h3');
    return h3 ? h3.textContent.trim() : 'Tamil Meme Template';
  }

  function getPageBase() {
    return window.location.origin + window.location.pathname;
  }

  function buildShareUrl(title) {
    return getPageBase() + '?q=' + encodeURIComponent(title);
  }

  /* ── INJECT SHARE ROW INTO ONE CARD ─────────────────── */
  function enrichCard(card) {
    if (card.dataset.shareInjected) return;
    card.dataset.shareInjected = '1';

    var title = getTitle(card);
    var shareUrl = buildShareUrl(title);
    var waMessage = encodeURIComponent('🎬 ' + title + '\n\nFree Tamil meme templates 👉 ' + shareUrl);

    var row = document.createElement('div');
    row.className = 'card-share-row';

    // WhatsApp button
    var waLink = document.createElement('a');
    waLink.className = 'btn-wa';
    waLink.href = 'https://wa.me/?text=' + waMessage;
    waLink.target = '_blank';
    waLink.rel = 'noopener noreferrer';
    waLink.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
      ' WhatsApp';

    // Copy link button
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn-copy';
    copyBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
      ' Copy Link';

    copyBtn.addEventListener('click', function () {
      var self = this;
      navigator.clipboard.writeText(shareUrl).then(function () {
        self.classList.add('copied');
        self.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(function () {
          self.classList.remove('copied');
          self.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Link';
        }, 2000);
      }).catch(function () {
        // Fallback
        var ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(e) {}
        document.body.removeChild(ta);
        self.textContent = '✓ Copied!';
        setTimeout(function () { self.textContent = '📋 Copy Link'; }, 2000);
      });
    });

    row.appendChild(waLink);
    row.appendChild(copyBtn);

    // Insert BEFORE the download <a> tag
    var dlAnchor = card.querySelector('a[download], .card-actions, a[href*="mediafire"], a[href*="cloudinary"]');
    if (dlAnchor) {
      card.insertBefore(row, dlAnchor);
    } else {
      card.appendChild(row);
    }
  }

  /* ── SCAN AND ENRICH ALL CURRENT CARDS ──────────────── */
  function enrichAll() {
    document.querySelectorAll('.o').forEach(enrichCard);
  }

  /* ── WATCH #resultList FOR NEW CARDS ────────────────── */
  // meme-engine.js clears and re-renders resultList on every
  // page change / search / tag filter — MutationObserver catches it
  var resultList = document.getElementById('resultList');
  if (resultList) {
    new MutationObserver(function () {
      enrichAll();
    }).observe(resultList, { childList: true, subtree: true });
  }

  // Initial run (catches static cards in tamil.html)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enrichAll);
  } else {
    enrichAll();
  }

  // Extra safety pass after meme-engine's DOMContentLoaded fires
  window.addEventListener('load', enrichAll);
  setTimeout(enrichAll, 300);

})();
