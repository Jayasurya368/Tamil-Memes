/* ============================================================
   SITE UI — loaded on every page (sidebar + generic modals).
   Meme-specific behaviour (search, tags, pagination, favourites)
   lives in meme-engine.js and is only loaded on pages that have
   a meme grid.
   ============================================================ */
(function () {
  'use strict';

  function toggleSidebar() {
    var sb = document.getElementById('sidebar');
    var ov = document.getElementById('overlay');
    if (sb) sb.classList.toggle('active');
    if (ov) ov.classList.toggle('active');
  }
  function closeSidebar() {
    var sb = document.getElementById('sidebar');
    var ov = document.getElementById('overlay');
    if (sb) sb.classList.remove('active');
    if (ov) ov.classList.remove('active');
  }
  function openModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.SiteUI = {
    toggleSidebar: toggleSidebar,
    closeSidebar: closeSidebar,
    openModal: openModal,
    closeModal: closeModal
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    switch (el.dataset.action) {
      case 'toggle-sidebar': toggleSidebar(); break;
      case 'close-sidebar': closeSidebar(); break;
      case 'open-modal': openModal(el.dataset.modal); break;
      case 'close-modal': closeModal(el.dataset.modal); break;
      default: break;
    }
  });

  // click on the dimmed backdrop itself closes the modal
  document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('modal-overlay') && e.target.classList.contains('open')) {
      e.target.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(function (m) { m.classList.remove('open'); });
      document.body.style.overflow = '';
    }
  });
})();
