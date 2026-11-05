/* Shared script for every page of the notes site. No dependencies.
   Load it in <head> without defer: the theme is applied before first paint,
   everything else waits for DOMContentLoaded.
   - Theme toggle (auto -> light -> dark), remembered across pages.
   - Reading progress bar.
   - Contents: sidebar on wide screens, collapsible drop-down on narrow ones,
     with the current section highlighted.
   - Wide tables and figures scroll inside their own box on small screens.
   - Click a table header to sort by that column. */
(function () {
  'use strict';
  var root = document.documentElement;

  // localStorage can throw (e.g. some browsers on file://); fall back to memory.
  var prefs = (function () {
    try {
      var s = window.localStorage; s.getItem('notes-theme'); return s;
    } catch (e) {
      var m = {};
      return {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
        setItem: function (k, v) { m[k] = String(v); }
      };
    }
  })();
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function themeMode() { return prefs.getItem('notes-theme') || 'auto'; }
  function applyTheme() {
    var p = themeMode();
    var dark = p === 'dark' || (p === 'auto' && darkQuery.matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.themeMode = p;
  }
  applyTheme();
  root.dataset.nav = prefs.getItem('notes-nav') === 'hidden' ? 'hidden' : 'auto';

  var ICONS = {
    auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" stroke="none"/></svg>',
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
  };
  var NEXT = { auto: 'light', light: 'dark', dark: 'auto' };
  var LABEL = { auto: 'Theme: follows system', light: 'Theme: light', dark: 'Theme: dark' };

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(function () {
    // ── Theme button ──
    var themeBtn = document.getElementById('theme-btn');
    function paintThemeBtn() {
      if (!themeBtn) return;
      var p = themeMode();
      themeBtn.innerHTML = ICONS[p] || ICONS.auto;
      themeBtn.title = LABEL[p] + ' (click to change)';
      themeBtn.setAttribute('aria-label', LABEL[p] + '. Click to change.');
    }
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        prefs.setItem('notes-theme', NEXT[themeMode()] || 'auto');
        applyTheme(); paintThemeBtn();
      });
    }
    darkQuery.addEventListener('change', function () { applyTheme(); paintThemeBtn(); });
    paintThemeBtn();

    // ── Reading progress bar ──
    var bar = document.querySelector('.progress-bar');
    function progress() {
      if (!bar) return;
      var max = root.scrollHeight - window.innerHeight;
      var f = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = 'scaleX(' + f + ')';
    }

    // ── Contents ──
    var nav = document.getElementById('toc');
    var navBtn = document.getElementById('nav-btn');
    var narrow = window.matchMedia('(max-width:1100px)');
    var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
    var heads = links.map(function (a) {
      try { return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); } catch (e) { return null; }
    });
    function spy() {
      var y = window.scrollY + 90, idx = -1;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top + window.scrollY <= y) idx = i; });
      links.forEach(function (a, i) { a.classList.toggle('on', i === idx); });
    }
    function navShown() { return narrow.matches ? root.dataset.nav === 'shown' : root.dataset.nav !== 'hidden'; }
    function syncNavBtn() { if (navBtn) navBtn.setAttribute('aria-expanded', navShown() ? 'true' : 'false'); }
    function setNav(mode) {
      root.dataset.nav = mode;
      if (!narrow.matches) prefs.setItem('notes-nav', mode === 'hidden' ? 'hidden' : 'auto');
      syncNavBtn();
    }
    if (nav && navBtn) {
      navBtn.addEventListener('click', function (e) { e.stopPropagation(); setNav(navShown() ? (narrow.matches ? 'auto' : 'hidden') : 'shown'); });
      nav.addEventListener('click', function (e) { if (narrow.matches && e.target.closest('a')) setNav('auto'); });
      document.addEventListener('click', function (e) {
        if (narrow.matches && root.dataset.nav === 'shown' && !nav.contains(e.target)) setNav('auto');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && narrow.matches && root.dataset.nav === 'shown') { setNav('auto'); navBtn.focus(); }
      });
      narrow.addEventListener('change', function () { setNav(prefs.getItem('notes-nav') === 'hidden' ? 'hidden' : 'auto'); });
      syncNavBtn();
    } else if (navBtn) {
      navBtn.hidden = true;
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; progress(); spy(); });
    }, { passive: true });

    // ── Wide tables scroll inside their own box ──
    function inScroller(el) {
      for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (p.classList.contains('tbl-wrap') || /auto|scroll/.test(getComputedStyle(p).overflowX)) return true;
      }
      return false;
    }
    Array.prototype.forEach.call(document.querySelectorAll('main table'), function (t) {
      if (t.closest('svg') || inScroller(t)) return;
      var w = document.createElement('div'); w.className = 'tbl-wrap';
      t.parentNode.insertBefore(w, t); w.appendChild(t);
    });

    // ── Wide figures keep a legible minimum width and scroll sideways ──
    var figScrollers = [];
    Array.prototype.forEach.call(document.querySelectorAll('main figure svg'), function (s) {
      if (s.parentElement.closest('svg')) return;
      var vb = s.viewBox && s.viewBox.baseVal;
      if (!vb || vb.width < 640) return;
      var w = document.createElement('div');
      w.className = 'tbl-wrap fig-scroll';
      s.parentNode.insertBefore(w, s); w.appendChild(s);
      s.style.minWidth = Math.round(vb.width * 0.7) + 'px';
      var hint = document.createElement('p');
      hint.className = 'fig-hint'; hint.setAttribute('aria-hidden', 'true');
      hint.textContent = 'Scroll sideways to see the whole figure.';
      w.parentNode.insertBefore(hint, w.nextSibling);
      figScrollers.push(w);
    });
    function markScrollable() {
      figScrollers.forEach(function (w) { w.classList.toggle('is-scrollable', w.scrollWidth > w.clientWidth + 1); });
    }
    window.addEventListener('resize', function () { markScrollable(); progress(); });

    // ── Click (or Enter/Space on) a column header to sort; click again to reverse ──
    function key(cell) {
      if (!cell) return null;
      var t = (cell.getAttribute('data-sort') || cell.textContent).replace(/\s+/g, ' ').trim();
      if (!t || /^(-|\u2013|\u2014|n\/a|none|\?)$/i.test(t)) return null;
      var s = t.replace(/[\u2212\u2012\u2013\u2014]/g, '-').replace(/[\s,\u00a0\u202f_]/g, '').replace(/^[~\u2248<>\u2264\u2265]+/, '');
      var m = /^([+-]?)(\d+(?:\.\d+)?|\.\d+)(?:e([+-]?\d+))?(?:[a-z\u00b5\u03bc%\u00d7]{0,4})$/i.exec(s);
      if (m) return { n: parseFloat(m[1] + m[2] + (m[3] ? 'e' + m[3] : '')) };
      return { s: t };
    }
    function cmp(a, b) {
      if ('n' in a && 'n' in b) return a.n - b.n;
      if ('n' in a) return -1;
      if ('n' in b) return 1;
      return a.s.localeCompare(b.s, undefined, { numeric: true, sensitivity: 'base' });
    }
    Array.prototype.forEach.call(document.querySelectorAll('main table'), function (table) {
      if (table.closest('svg') || table.classList.contains('glance') || table.tBodies.length !== 1) return;
      var head = table.tHead && table.tHead.rows.length ? table.tHead.rows[table.tHead.rows.length - 1] : null;
      var body = table.tBodies[0], rows = Array.prototype.slice.call(body.rows);
      if (!head && rows.length && Array.prototype.every.call(rows[0].cells, function (c) { return c.tagName === 'TH'; })) head = rows.shift();
      if (!head || rows.length < 2) return;
      var ths = Array.prototype.slice.call(head.cells);
      if (ths.some(function (c) { return c.colSpan > 1 || c.rowSpan > 1; })) return;
      if (table.querySelector('tbody [rowspan]:not([rowspan="1"]), tbody [colspan]:not([colspan="1"])')) return;
      ths.forEach(function (th, col) {
        th.classList.add('ns-sort'); th.tabIndex = 0;
        th.setAttribute('aria-sort', 'none');
        function sort() {
          var asc = th.getAttribute('aria-sort') !== 'ascending';
          ths.forEach(function (o) { o.setAttribute('aria-sort', 'none'); });
          th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
          rows.map(function (r, i) { return { r: r, i: i, k: key(r.cells[col]) }; })
            .sort(function (a, b) {
              if (a.k === null || b.k === null) { if (a.k !== b.k) return a.k === null ? 1 : -1; return a.i - b.i; }
              var c = cmp(a.k, b.k); return (asc ? c : -c) || a.i - b.i;
            })
            .forEach(function (x) { body.appendChild(x.r); });
        }
        th.addEventListener('click', sort);
        th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort(); } });
      });
    });

    markScrollable(); progress(); spy();
  });
})();
