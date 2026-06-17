/* ============================================================
   MEME ENGINE — shared by every page on the site.
   Reads window.MEMES (assets/memes-data.js) and a small config
   read from <body data-category data-trending data-favorites
   data-per-page> to decide what to show. Renders ONLY the
   current page's cards into the DOM (instead of dumping every
   meme into the HTML up front), which is the main speed fix.
   ============================================================ */
(function () {
  'use strict';

  var body = document.body;
  var CONFIG = {
    category: body.dataset.category || '',
    trending: body.dataset.trending === 'true',
    favorites: body.dataset.favorites === 'true',
    perPage: parseInt(body.dataset.perPage, 10) || 10
  };

  var resultList = document.getElementById('resultList');
  var searchInput = document.getElementById('searchInput');
  var tagBar = document.getElementById('tag-filter-bar');
  var activeTagLabel = document.getElementById('active-tag-label');
  var paginationWrap = document.getElementById('paginationWrap');
  var visibleCountEl = document.getElementById('visibleCount');
  var totalCountEl = document.getElementById('totalCount');

  var state = { page: 1, activeTag: null };

  /* ── BASE DATA SET FOR THIS PAGE ─────────────────────────── */
  function baseList() {
    if (!window.MEMES) return [];
    return window.MEMES.filter(function (m) {
      if (CONFIG.trending) return !!m.trending;
      if (CONFIG.category) return (m.categories || []).indexOf(CONFIG.category) !== -1;
      return true; // homepage: everything
    });
  }

  function filteredList() {
    var q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    var tag = state.activeTag ? state.activeTag.toLowerCase() : null;
    return baseList().filter(function (m) {
      if (tag && (m.tags || []).map(function (t) { return t.toLowerCase(); }).indexOf(tag) === -1) return false;
      if (q) {
        var hay = (m.title + ' ' + (m.about || '') + ' ' + (m.tags || []).join(' ')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  /* ── LAZY IFRAME LOADING ──────────────────────────────────── */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        if (el.dataset.src) { el.src = el.dataset.src; delete el.dataset.src; }
        io.unobserve(el);
      }
    });
  }, { rootMargin: '200px' }) : null;

  function observe(el) {
    if (!el) return;
    if (io) io.observe(el);
    else if (el.dataset.src) { el.src = el.dataset.src; delete el.dataset.src; } // no IO support: just load
  }

  /* ── CARD BUILDING ───────────────────────────────────────── */
  function buildCard(meme) {
    var card = document.createElement('div');
    card.className = 'o';
    card.dataset.id = meme.id;

    var iframe = document.createElement('iframe');
    iframe.className = 'video';
    iframe.dataset.src = meme.src;
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    card.appendChild(iframe);

    if (meme.about) {
      var aboutBox = document.createElement('div');
      aboutBox.className = 'card-about';
      aboutBox.textContent = meme.about;
      card.appendChild(aboutBox);
    }

    var h3 = document.createElement('h3');
    h3.textContent = meme.title;
    card.appendChild(h3);

    if (meme.about) {
      var toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'about-toggle';
      toggleBtn.textContent = '▼ About';
      toggleBtn.dataset.action = 'toggle-about';
      card.appendChild(toggleBtn);
    }

    if (meme.tags && meme.tags.length) {
      var tagsRow = document.createElement('div');
      tagsRow.className = 'card-tags';
      meme.tags.forEach(function (t) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'tag-chip';
        chip.dataset.action = 'toggle-tag';
        chip.dataset.tag = t.toLowerCase();
        if (state.activeTag && state.activeTag.toLowerCase() === t.toLowerCase()) chip.classList.add('active');
        chip.textContent = '#' + t;
        tagsRow.appendChild(chip);
      });
      card.appendChild(tagsRow);
    }

    var dlLink = document.createElement('a');
    dlLink.href = meme.href;
    dlLink.setAttribute('download', '');

    var dlBtn = document.createElement('button');
    dlBtn.type = 'button';
    dlBtn.className = 'down';
    dlBtn.textContent = '⬇ Download';
    dlLink.appendChild(dlBtn);

    if (CONFIG.favorites) {
      var actions = document.createElement('div');
      actions.className = 'card-actions';
      actions.appendChild(dlLink);

      var favBtn = document.createElement('button');
      favBtn.type = 'button';
      favBtn.className = 'btn-fav';
      favBtn.dataset.action = 'toggle-fav';
      favBtn.dataset.id = meme.id;
      favBtn.dataset.title = meme.title;
      favBtn.dataset.dl = meme.href;
      favBtn.textContent = '\u2764\ufe0f';
      if (isFaved(meme.id)) {
        favBtn.classList.add('faved');
        favBtn.title = 'Remove from Favourites';
      } else {
        favBtn.title = 'Add to Favourites';
      }
      actions.appendChild(favBtn);
      card.appendChild(actions);
    } else {
      card.appendChild(dlLink);
    }

    return card;
  }

  /* ── RENDER ───────────────────────────────────────────────── */
  function render() {
    var pool = filteredList();
    var totalPages = Math.max(1, Math.ceil(pool.length / CONFIG.perPage));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    var start = (state.page - 1) * CONFIG.perPage;
    var pageItems = pool.slice(start, start + CONFIG.perPage);

    resultList.innerHTML = '';
    pageItems.forEach(function (meme) {
      var card = buildCard(meme);
      resultList.appendChild(card);
      observe(card.querySelector('iframe[data-src]'));
    });

    if (visibleCountEl) visibleCountEl.textContent = pageItems.length;
    if (totalCountEl) totalCountEl.textContent = pool.length;

    renderPagination(totalPages, pool.length);
  }

  function renderPagination(totalPages, poolLength) {
    if (!paginationWrap) return;
    if (poolLength === 0 || totalPages <= 1) {
      paginationWrap.style.display = 'none';
      return;
    }
    paginationWrap.style.display = 'flex';

    var prevBtn = document.getElementById('prevPageBtn');
    var nextBtn = document.getElementById('nextPageBtn');
    var numbers = document.getElementById('pageNumbers');
    if (prevBtn) prevBtn.disabled = state.page === 1;
    if (nextBtn) nextBtn.disabled = state.page === totalPages;
    if (!numbers) return;

    numbers.innerHTML = '';
    var pages = new Set([1, totalPages, state.page, state.page - 1, state.page + 1]);
    var sorted = Array.from(pages).filter(function (p) { return p >= 1 && p <= totalPages; }).sort(function (a, b) { return a - b; });

    var prev = 0;
    sorted.forEach(function (p) {
      if (p - prev > 1) {
        var dots = document.createElement('span');
        dots.className = 'page-btn';
        dots.style.cursor = 'default';
        dots.style.border = 'none';
        dots.style.background = 'none';
        dots.textContent = '…';
        numbers.appendChild(dots);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-btn' + (p === state.page ? ' active' : '');
      btn.textContent = p;
      btn.addEventListener('click', function () { state.page = p; render(); scrollToResults(); });
      numbers.appendChild(btn);
      prev = p;
    });
  }

  function scrollToResults() {
    if (resultList) resultList.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── FAVOURITES (only active when data-favorites="true") ──── */
  function isFaved(id) {
    return getFavs().some(function (f) { return f.id === id; });
  }
  function getFavs() {
    if (!window.TMCookies || window.TMCookies.getConsent() !== 'accepted') return [];
    try {
      var raw = localStorage.getItem('tmfavs');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      try {
        var v = document.cookie.split('; ').find(function (r) { return r.indexOf('tmfavs=') === 0; });
        return v ? JSON.parse(decodeURIComponent(v.split('=')[1])) : [];
      } catch (e2) { return []; }
    }
  }
  function saveFavs(arr) {
    if (!window.TMCookies || window.TMCookies.getConsent() !== 'accepted') return;
    try { localStorage.setItem('tmfavs', JSON.stringify(arr)); } catch (e) {}
    try {
      var exp = new Date(Date.now() + 365 * 864e5).toUTCString();
      document.cookie = 'tmfavs=' + encodeURIComponent(JSON.stringify(arr)) + '; expires=' + exp + '; path=/; SameSite=Lax';
    } catch (e) {}
  }
  function toggleFav(id, title, dl, btn) {
    if (!window.TMCookies || window.TMCookies.getConsent() !== 'accepted') {
      if (window.TMCookies) window.TMCookies.showBanner();
      return;
    }
    var favs = getFavs();
    var exists = favs.some(function (f) { return f.id === id; });
    if (exists) {
      favs = favs.filter(function (f) { return f.id !== id; });
      btn.classList.remove('faved');
      btn.title = 'Add to Favourites';
    } else {
      favs.push({ id: id, title: title, dl: dl });
      btn.classList.add('faved');
      btn.title = 'Remove from Favourites';
      btn.style.transform = 'scale(1.3)';
      setTimeout(function () { btn.style.transform = ''; }, 200);
    }
    saveFavs(favs);
    updateSidebarCount();
  }
  function removeFav(id) {
    saveFavs(getFavs().filter(function (f) { return f.id !== id; }));
    updateSidebarCount();
    renderFavPage();
    render();
  }
  function clearAllFavourites() {
    if (!confirm('Clear all your saved favourites?')) return;
    saveFavs([]);
    updateSidebarCount();
    renderFavPage();
    render();
  }
  function updateSidebarCount() {
    var badge = document.getElementById('fav-sidebar-count');
    if (!badge) return;
    var n = getFavs().length;
    if (n > 0) { badge.textContent = n; badge.style.display = 'inline'; }
    else badge.style.display = 'none';
  }
  function renderFavPage() {
    var favs = getFavs();
    var grid = document.getElementById('fav-grid');
    var empty = document.getElementById('fav-empty');
    var clearWrap = document.getElementById('fav-clear-wrap');
    var subtitle = document.getElementById('fav-subtitle');
    if (!grid) return;
    grid.innerHTML = '';

    if (!favs.length) {
      if (empty) empty.style.display = 'block';
      if (clearWrap) clearWrap.style.display = 'none';
      if (subtitle) subtitle.textContent = 'Your saved memes appear here';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (clearWrap) clearWrap.style.display = 'block';
    if (subtitle) subtitle.textContent = favs.length + ' meme' + (favs.length > 1 ? 's' : '') + ' saved';

    favs.forEach(function (fav) {
      var card = document.createElement('div');
      card.className = 'fav-card';

      var title = document.createElement('div');
      title.className = 'fav-card-title';
      title.textContent = fav.title;
      card.appendChild(title);

      var actions = document.createElement('div');
      actions.className = 'fav-card-actions';

      var dl = document.createElement('a');
      dl.href = fav.dl;
      dl.setAttribute('download', '');
      dl.textContent = '⬇ Download';
      actions.appendChild(dl);

      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'fav-remove-btn';
      rm.dataset.action = 'remove-fav';
      rm.dataset.id = fav.id;
      rm.textContent = '✕';
      actions.appendChild(rm);

      card.appendChild(actions);
      grid.appendChild(card);
    });
  }

  /* ── MODALS ─────────────────────────────────────────────────
     Generic open/close + sidebar toggle live in site-ui.js
     (loaded on every page). We just reuse them here. */
  function openModal(id) { if (window.SiteUI) window.SiteUI.openModal(id); }
  function closeModal(id) { if (window.SiteUI) window.SiteUI.closeModal(id); }
  function closeSidebar() { if (window.SiteUI) window.SiteUI.closeSidebar(); }

  /* ── TAG FILTER ───────────────────────────────────────────── */
  function setActiveTag(tag) {
    state.activeTag = tag;
    state.page = 1;
    if (tagBar) {
      if (tag) {
        tagBar.classList.add('visible');
        if (activeTagLabel) activeTagLabel.textContent = '#' + tag;
      } else {
        tagBar.classList.remove('visible');
      }
    }
    render();
  }

  /* ── ABOUT TOGGLE ─────────────────────────────────────────── */
  function toggleAbout(btn) {
    var card = btn.closest('.o');
    if (!card) return;
    var box = card.querySelector('.card-about');
    if (!box) return;
    var open = box.classList.toggle('show');
    btn.textContent = open ? '▲ About' : '▼ About';
  }

  /* ── DELEGATED CLICK HANDLER (replaces all inline onclick=) ── */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.dataset.action;

    switch (action) {
      case 'clear-tag-filter': setActiveTag(null); break;
      case 'toggle-tag':
        if (state.activeTag === el.dataset.tag) setActiveTag(null);
        else setActiveTag(el.dataset.tag);
        break;
      case 'toggle-about': toggleAbout(el); break;
      case 'show-favourites':
        renderFavPage();
        openModal('fav-page');
        closeSidebar();
        break;
      case 'close-favourites': closeModal('fav-page'); break;
      case 'clear-favourites': clearAllFavourites(); break;
      case 'remove-fav': removeFav(el.dataset.id); break;
      case 'toggle-fav': toggleFav(el.dataset.id, el.dataset.title, el.dataset.dl, el); break;
      default: break;
    }
  });

  if (CONFIG.favorites) {
    document.addEventListener('tm:consent-changed', function (e) {
      if (!e.detail.accepted) {
        document.querySelectorAll('.btn-fav.faved').forEach(function (b) { b.classList.remove('faved'); });
      }
      updateSidebarCount();
    });
  }

  /* ── SEARCH ───────────────────────────────────────────────── */
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      state.page = 1;
      render();
    });
  }

  /* ── PREV / NEXT ──────────────────────────────────────────── */
  var prevBtn = document.getElementById('prevPageBtn');
  var nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) prevBtn.addEventListener('click', function () {
    if (state.page > 1) { state.page--; render(); scrollToResults(); }
  });
  if (nextBtn) nextBtn.addEventListener('click', function () {
    var totalPages = Math.max(1, Math.ceil(filteredList().length / CONFIG.perPage));
    if (state.page < totalPages) { state.page++; render(); scrollToResults(); }
  });

  /* ── INIT ─────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    if (searchInput) {
      var q = new URLSearchParams(window.location.search).get('q');
      if (q) searchInput.value = q;
    }
    if (CONFIG.favorites) updateSidebarCount();
    render();
  });
})();
