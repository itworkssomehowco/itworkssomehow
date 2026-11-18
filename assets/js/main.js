(function () {
  'use strict';

  var THEME_KEY = 'iws-theme';
  var SCAN_KEY = 'iws-scanlines';

  /* == THEME ==
     The initial value is written to <html data-theme> by an inline script in
     <head> so nothing paints in the wrong palette. Here we only toggle. */
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
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
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
      });
    }
  }

  /* == SCANLINES == */
  function applyScanlines(state) {
    document.documentElement.setAttribute('data-scanlines', state);
    var btn = document.getElementById('scanlines-toggle');
    if (btn) {
      btn.textContent = 'Scanlines: ' + (state === 'off' ? 'off' : 'on');
      btn.setAttribute('aria-pressed', state === 'off' ? 'false' : 'true');
    }
    try { localStorage.setItem(SCAN_KEY, state); } catch (e) {}
  }

  function initScanlines() {
    var state = document.documentElement.getAttribute('data-scanlines') || 'on';
    applyScanlines(state);
    var btn = document.getElementById('scanlines-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        applyScanlines(
          (document.documentElement.getAttribute('data-scanlines') === 'off') ? 'on' : 'off'
        );
      });
    }
  }

  /* == NOTES: SEARCH + CATEGORY FILTER ==
     Every row is rendered server-side. Category buttons are real links to the
     taxonomy pages, so the page still works with JS off; we intercept them. */
  function initNotes() {
    var searchInput = document.getElementById('note-search');
    var catBtns = document.querySelectorAll('.cat-btn');
    var rows = document.querySelectorAll('.post-row[data-cat]');
    if (!searchInput && !catBtns.length) return;

    var countEl = document.getElementById('search-count');
    var noResults = document.getElementById('no-results');
    var total = rows.length;
    var activeCat = 'all';
    var query = '';

    function update() {
      var visible = 0;
      Array.prototype.forEach.call(rows, function (row) {
        var cat = row.getAttribute('data-cat') || '';
        var text = (row.getAttribute('data-text') || '').toLowerCase();
        var okCat = activeCat === 'all' || cat === activeCat;
        var okQ = !query || text.indexOf(query.toLowerCase()) !== -1;
        var show = okCat && okQ;
        row.hidden = !show;
        if (show) visible++;
      });
      if (countEl) countEl.textContent = visible + ' / ' + total;
      if (noResults) noResults.classList.toggle('visible', visible === 0);
    }

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        query = this.value;
        update();
      });
    }

    Array.prototype.forEach.call(catBtns, function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        activeCat = this.getAttribute('data-cat') || 'all';
        Array.prototype.forEach.call(catBtns, function (b) {
          b.classList.remove('active');
          b.removeAttribute('aria-current');
        });
        this.classList.add('active');
        this.setAttribute('aria-current', 'true');
        update();
      });
    });
  }

  /* == SHOP FILTER == */
  function initShop() {
    var filterBtns = document.querySelectorAll('.filter-btn[data-kind]');
    if (!filterBtns.length) return;

    var cards = document.querySelectorAll('.shop-card[data-kind]');
    var countEl = document.getElementById('shop-count');
    var activeKind = 'all';

    function update() {
      var visible = 0;
      Array.prototype.forEach.call(cards, function (card) {
        var show = activeKind === 'all' || card.getAttribute('data-kind') === activeKind;
        card.hidden = !show;
        if (show) visible++;
      });
      if (countEl) countEl.textContent = visible + ' item' + (visible !== 1 ? 's' : '');
    }

    Array.prototype.forEach.call(filterBtns, function (btn) {
      btn.addEventListener('click', function () {
        activeKind = this.getAttribute('data-kind') || 'all';
        Array.prototype.forEach.call(filterBtns, function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        update();
      });
    });
  }

  /* == PRODUCT MODAL == */
  function initModal() {
    var scrim = document.getElementById('product-modal');
    if (!scrim) return;

    var els = {
      code: document.getElementById('modal-code'),
      title: document.getElementById('modal-title'),
      blurb: document.getElementById('modal-blurb'),
      specs: document.getElementById('modal-specs'),
      price: document.getElementById('modal-price'),
      buy: document.getElementById('modal-buy'),
      close: document.getElementById('modal-close')
    };
    var lastFocus = null;

    function open(card) {
      lastFocus = card;
      var kind = card.getAttribute('data-kind') || '';
      var specs = card.querySelector('.specs-data');

      if (els.code) els.code.textContent = (card.getAttribute('data-code') || '') + (kind ? ' · ' + kind : '');
      if (els.title) els.title.textContent = card.getAttribute('data-title') || '';
      if (els.blurb) els.blurb.textContent = card.getAttribute('data-blurb') || '';
      if (els.price) els.price.textContent = '$' + (card.getAttribute('data-price') || '');
      if (els.buy) els.buy.setAttribute('href', card.getAttribute('data-buy') || '#');
      if (els.specs && specs) els.specs.innerHTML = specs.innerHTML;

      scrim.hidden = false;
      document.body.style.overflow = 'hidden';
      if (els.close) els.close.focus();
    }

    function close() {
      scrim.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) { lastFocus.focus(); lastFocus = null; }
    }

    Array.prototype.forEach.call(document.querySelectorAll('.shop-card'), function (card) {
      card.addEventListener('click', function () { open(this); });
    });

    scrim.addEventListener('click', function (e) { if (e.target === scrim) close(); });
    if (els.close) els.close.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !scrim.hidden) close();
    });
  }

  /* == PROJECT STATUS FILTER == */
  function initProjects() {
    var btns = document.querySelectorAll('.filter-btn[data-status]');
    if (!btns.length) return;

    var cards = document.querySelectorAll('.project-card[data-status]');
    var countEl = document.getElementById('project-count');
    var active = 'all';

    function update() {
      var visible = 0;
      Array.prototype.forEach.call(cards, function (card) {
        var show = active === 'all' || card.getAttribute('data-status') === active;
        card.hidden = !show;
        if (show) visible++;
      });
      if (countEl) countEl.textContent = visible + ' project' + (visible !== 1 ? 's' : '');
    }

    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener('click', function () {
        active = this.getAttribute('data-status') || 'all';
        Array.prototype.forEach.call(btns, function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        update();
      });
    });
  }

  /* == MOBILE NAV == */
  function initNav() {
    var btn = document.getElementById('nav-hamburger');
    var menu = document.getElementById('nav-links');
    if (!btn || !menu) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.site-header')) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initScanlines();
    initNav();
    initNotes();
    initShop();
    initModal();
    initProjects();
  });
})();
