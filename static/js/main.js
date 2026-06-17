(function () {
  'use strict';

  /* ── THEME ── */
  var THEME_KEY = 'iws-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☼' : '☽';
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  function initTheme() {
    var saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  /* ── BLOG SEARCH + FILTER ── */
  function initBlog() {
    var searchInput = document.getElementById('blog-search');
    var catBtns = document.querySelectorAll('.cat-btn');
    var rows = document.querySelectorAll('.post-row[data-cat]');
    var countEl = document.getElementById('search-count');
    var noResults = document.getElementById('no-results');
    var total = rows.length;

    if (!searchInput) return;

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
        row.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (countEl) {
        var v = String(visible).padStart(2, '0');
        var t = String(total).padStart(2, '0');
        countEl.textContent = v + '/' + t;
      }
      if (noResults) {
        noResults.classList.toggle('visible', visible === 0);
      }
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
    var cards = document.querySelectorAll('.shop-card[data-kind]');
    var countEl = document.getElementById('shop-count');

    if (!filterBtns.length) return;

    var activeKind = 'all';

    function update() {
      var visible = 0;
      cards.forEach(function (card) {
        var kind = card.getAttribute('data-kind') || '';
        var show = activeKind === 'all' || kind === activeKind;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (countEl) {
        countEl.textContent = visible + ' ITEM' + (visible !== 1 ? 'S' : '');
      }
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

    var modalCode    = document.getElementById('modal-code');
    var modalTitle   = document.getElementById('modal-title');
    var modalBlurb   = document.getElementById('modal-blurb');
    var modalSpecs   = document.getElementById('modal-specs');
    var modalPrice   = document.getElementById('modal-price');
    var modalBuyBtn  = document.getElementById('modal-buy-btn');

    function openModal(card) {
      var code    = card.getAttribute('data-code') || '';
      var title   = card.getAttribute('data-title') || '';
      var blurb   = card.getAttribute('data-blurb') || '';
      var price   = card.getAttribute('data-price') || '';
      var buyUrl  = card.getAttribute('data-buy') || '#';
      var specsEl = card.querySelector('.product-specs-data');

      if (modalCode)   modalCode.textContent   = code + ' · ' + (card.getAttribute('data-kind') || '').toUpperCase();
      if (modalTitle)  modalTitle.textContent  = title;
      if (modalBlurb)  modalBlurb.textContent  = '> ' + blurb;
      if (modalPrice)  modalPrice.textContent  = '$' + price;
      if (modalBuyBtn) {
        modalBuyBtn.setAttribute('href', buyUrl);
        modalBuyBtn.textContent = '▸ BUY VIA GUMROAD';
      }

      if (modalSpecs && specsEl) {
        modalSpecs.innerHTML = specsEl.innerHTML;
      }

      scrim.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      scrim.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.shop-card').forEach(function (card) {
      card.addEventListener('click', function () { openModal(this); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(this); }
      });
    });

    scrim.addEventListener('click', function (e) {
      if (e.target === scrim) closeModal();
    });

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && scrim.classList.contains('open')) closeModal();
    });
  }

  /* ── NAV HAMBURGER ── */
  function initNav() {
    var btn  = document.getElementById('nav-hamburger');
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
