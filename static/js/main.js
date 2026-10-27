(function () {
  'use strict';

  /* ── THEME ──
     The initial theme is applied by an inline script in <head> to avoid a
     flash of the wrong palette; here we only handle toggling and labelling. */
  var THEME_KEY = 'iws-theme';

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      var next = theme === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      btn.setAttribute('title', next.charAt(0).toUpperCase() + next.slice(1));
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  function initTheme() {
    applyTheme(currentTheme());
  }

  function toggleTheme() {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }

  /* ── NOTES SEARCH + CATEGORY FILTER ── */
  function initBlog() {
    var searchInput = document.getElementById('blog-search');
    if (!searchInput) return;

    var catBtns = document.querySelectorAll('.cat-btn');
    var rows = document.querySelectorAll('.post-row[data-cat]');
    var countEl = document.getElementById('search-count');
    var noResults = document.getElementById('no-results');
    var total = rows.length;

    var activeCat = 'all';
    var query = '';

    function update() {
      var visible = 0;
      rows.forEach(function (row) {
        var cat = row.getAttribute('data-cat') || '';
        var text = (row.getAttribute('data-search') || '').toLowerCase();
        var matchCat = activeCat === 'all' || cat === activeCat;
        var matchQ = !query || text.indexOf(query.toLowerCase()) !== -1;
        var show = matchCat && matchQ;
        row.hidden = !show;
        if (show) visible++;
      });
      if (countEl) countEl.textContent = visible + ' / ' + total;
      if (noResults) noResults.classList.toggle('visible', visible === 0);
    }

    searchInput.addEventListener('input', function () {
      query = this.value;
      update();
    });

    catBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeCat = this.getAttribute('data-cat') || 'all';
        catBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        update();
      });
    });
  }

  /* ── SHOP FILTER ── */
  function initShop() {
    var filterBtns = document.querySelectorAll('.filter-btn[data-kind]');
    if (!filterBtns.length) return;

    var cards = document.querySelectorAll('.shop-card[data-kind]');
    var countEl = document.getElementById('shop-count');
    var activeKind = 'all';

    function update() {
      var visible = 0;
      cards.forEach(function (card) {
        var kind = card.getAttribute('data-kind') || '';
        var show = activeKind === 'all' || kind === activeKind;
        card.hidden = !show;
        if (show) visible++;
      });
      if (countEl) countEl.textContent = visible + ' item' + (visible !== 1 ? 's' : '');
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeKind = this.getAttribute('data-kind') || 'all';
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        update();
      });
    });
  }

  /* ── PRODUCT MODAL ── */
  function initModal() {
    var scrim = document.getElementById('product-modal');
    if (!scrim) return;

    var modalCode  = document.getElementById('modal-code');
    var modalTitle = document.getElementById('modal-title');
    var modalBlurb = document.getElementById('modal-blurb');
    var modalSpecs = document.getElementById('modal-specs');
    var modalPrice = document.getElementById('modal-price');
    var modalBuy   = document.getElementById('modal-buy-btn');
    var closeBtn   = document.getElementById('modal-close-btn');
    var lastFocus  = null;

    function openModal(card) {
      lastFocus = card;

      var code  = card.getAttribute('data-code') || '';
      var kind  = card.getAttribute('data-kind') || '';
      var specs = card.querySelector('.product-specs-data');

      if (modalCode)  modalCode.textContent  = code + (kind ? ' · ' + kind : '');
      if (modalTitle) modalTitle.textContent = card.getAttribute('data-title') || '';
      if (modalBlurb) modalBlurb.textContent = card.getAttribute('data-blurb') || '';
      if (modalPrice) modalPrice.textContent = '$' + (card.getAttribute('data-price') || '');
      if (modalBuy)   modalBuy.setAttribute('href', card.getAttribute('data-buy') || '#');
      if (modalSpecs && specs) modalSpecs.innerHTML = specs.innerHTML;

      scrim.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      scrim.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus) { lastFocus.focus(); lastFocus = null; }
    }

    document.querySelectorAll('.shop-card').forEach(function (card) {
      card.addEventListener('click', function () { openModal(this); });
    });

    scrim.addEventListener('click', function (e) {
      if (e.target === scrim) closeModal();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && scrim.classList.contains('open')) closeModal();
    });
  }

  /* ── MOBILE NAV ── */
  function initNav() {
    var btn = document.getElementById('nav-hamburger');
    var menu = document.getElementById('nav-links');
    if (!btn || !menu) return;

    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.navbar')) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── INIT ── */
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();

    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    initNav();
    initBlog();
    initShop();
    initModal();
  });

})();
