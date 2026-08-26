/* ============================================================
   FEEDBACK DUPLICATE CHECK
   Live search in window.MEMES as the user types in the meme request form
   ============================================================ */
(function () {
  'use strict';

  function initDuplicateCheck() {
    var textarea = document.querySelector('textarea[name="feedback"]');
    var matchBox = document.getElementById('feedback-match-box');

    if (!textarea || !matchBox) return;

    function escapeHTML(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    textarea.addEventListener('input', function () {
      if (!window.MEMES) return;

      var val = textarea.value.trim().toLowerCase();
      if (val.length < 4) {
        matchBox.innerHTML = '';
        return;
      }

      var matches = [];
      for (var i = 0; i < window.MEMES.length; i++) {
        var meme = window.MEMES[i];
        if (!meme) continue;

        var title = (meme.title || '').toLowerCase();
        var tags = Array.isArray(meme.tags)
          ? meme.tags.join(' ').toLowerCase()
          : (meme.tags || '').toLowerCase();

        if (title.indexOf(val) !== -1 || tags.indexOf(val) !== -1) {
          matches.push(meme);
          if (matches.length >= 3) break;
        }
      }

      if (matches.length > 0) {
        var formatted = matches.map(function (m) {
          return '<strong>' + escapeHTML(m.title) + '</strong>';
        }).join(', ');

        matchBox.innerHTML = '✅ Looks like we might already have this: ' + formatted;
      } else {
        matchBox.innerHTML = '';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDuplicateCheck);
  } else {
    initDuplicateCheck();
  }
})();
