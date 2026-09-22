/* ===================================================================
   DIWALI ABHYAS — seasonal package
   ─────────────────────────────────────────────────────────────────────
   A button below Grade 5 in Section 3, and an order window for the four
   Diwali Abhyas booklets (इयत्ता १ ली – ४ थी) — the same window, form,
   notes and done screen as Section 2's "चौकशी करा / मागणी नोंदवा".

   Everything seasonal lives in three files, so it can be worked on on
   its own: this one, assets/css/diwali.css and data/diwali.json.
   The main site has only small, inert hooks (ORDER.source / series /
   afterDraw / onAgain / onClose, and one call in paintStandards).

   Season: config.diwali_start – config.diwali_end in content.json
   (month-day, inclusive), judged in Indian time whatever zone the phone
   is set to. Outside the season nothing is fetched: no data, no styles,
   no button. ?diwali=1 in the address previews it at any time; #diwali
   opens the window straight away (a link that can be shared).
   =================================================================== */
const DIWALI = {
  on: false, ready: false, data: null, cfg: null, _prevQ: {}, _t: null,

  /* ---- season ---- */
  istNow() { return new Date(Date.now() + 5.5 * 3600e3); },   // read with getUTC*
  preview() { return /[?&]diwali=1\b/.test(location.search); },
  inSeason() {
    if (this.preview()) return true;
    const n = this.istNow(), md = (n.getUTCMonth() + 1) * 100 + n.getUTCDate();
    const p = x => { const [m, d] = String(x).split('-').map(Number); return m * 100 + d; };
    const a = p(this.cfg.start), b = p(this.cfg.end);
    return a <= b ? (md >= a && md <= b) : (md >= a || md <= b);
  },
  /* checked again just after every Indian midnight, and whenever the
     phone wakes the page — so the button appears on 1 September and goes
     after 30 November even if the site was left open */
  schedule() {
    clearTimeout(this._t);
    const n = this.istNow();
    const ms = ((23 - n.getUTCHours()) * 3600 + (59 - n.getUTCMinutes()) * 60 + (60 - n.getUTCSeconds())) * 1000 + 3000;
    this._t = setTimeout(() => this.check(), Math.min(ms, 2147483000));
  },
  check() {
    const want = this.inSeason();
    if (want && !this.on) this.load();
    else if (!want && this.on) this.off();
    if (!want) this.offStrip(); else { const o = document.getElementById('dwOff'); if (o) o.remove(); }
    this.schedule();
  },

  init() {
    const C = (RUTUJA.content && RUTUJA.content.config) || {};
    this.cfg = { start: C.diwali_start || '09-01', end: C.diwali_end || '11-30' };
    this.check();
    /* once the fonts are in, the button's lines are fitted again (once) */
    (RUTUJA.fontsReady || Promise.resolve()).then(() => this.fitButton(document.querySelector('#stdGrid [data-dw]'))).catch(() => {});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.check(); });
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
      this.fitButton(document.querySelector('#stdGrid [data-dw]')); this.fitTag(document.querySelector('#dwTop .dw-tag'));
      if (this.ready) this.fitInline(document.querySelector('.cta-books [data-dw-t="btn_books_sub"]'));
    }, 200); });
    /* a shared Diwali link outside the season opens the books page at the strip */
    if (location.hash === '#diwali' && !this.inSeason()) setTimeout(() => {
      try { RUTUJA.go('books'); } catch (e) {}
      setTimeout(() => { this.offStrip(); const o = document.getElementById('dwOff');
        if (o) { o.scrollIntoView({ behavior: 'smooth', block: 'center' }); o.classList.add('dw-call'); setTimeout(() => o.classList.remove('dw-call'), 1600); } }, 700);
    }, 300);
    /* the window's language button repaints the page; the window's own
       Diwali pieces are drawn again once it has */
    const setLang = RUTUJA.setLang.bind(RUTUJA);
    RUTUJA.setLang = (...a) => {
      const r = setLang(...a);
      setTimeout(() => { if (this.isOpen()) ORDER.draw(); if (this.ready) { this.entries(); this.greenButton(); } else if (!this.inSeason()) this.offStrip(); }, 60);
      return r;
    };
  },

  async load() {
    this.on = true;
    const v = RUTUJA.VERSION;
    const css = new Promise(res => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = 'assets/css/diwali.css?v=' + v; l.id = 'dwCss';
      l.onload = res; l.onerror = res; document.head.appendChild(l);
    });
    try {
      const [d] = await Promise.all([fetch('data/diwali.json?v=' + v).then(r => r.json()), css]);
      if (!this.on) return;
      this.merge(d);
      this.ready = true;
      this.button();
      this.booksCard();
      this.entries();
      this.greenButton();
      if (location.hash === '#diwali') this.open();
    } catch (e) { console.error('diwali package', e); this.on = false; }
  },

  /* the booklets and their offer join the site's data as status SEASON —
     every regular list shows LIVE only, so none of them ever sees these */
  merge(d) {
    if (this.data) return;
    this.data = d;
    const c = RUTUJA.content;
    const books = c.books || (c.books = []);
    (d.books || []).forEach(b => { if (!books.some(x => x.book_id === b.book_id)) books.push(b); });
    const offers = c.offers || (c.offers = []);
    (d.offers || []).forEach(o => offers.push(o));
    ['mr', 'en'].forEach(L => {
      const T = RUTUJA.text[L] || (RUTUJA.text[L] = {});
      Object.entries((d.text || {})[L] || {}).forEach(([k, v]) => { if (!(k in T)) T[k] = v; });
    });
  },

  off() {
    this.on = false; this.ready = false;
    if (this._fw) { this._fw.stop(); this._fw = null; }
    const b = document.querySelector('#stdGrid [data-dw]'); if (b) b.remove();
    const c = document.getElementById('dwBooks'); if (c) c.remove();
    this.restoreHint();
    document.querySelectorAll('#page-books option[data-dw]').forEach(o => o.remove());
    this.restoreGreen();
    if (this.isOpen()) ORDER.close();
  },

  books() {
    return ((RUTUJA.content && RUTUJA.content.books) || [])
      .filter(b => b.series === 'DIWALI' && b.status === 'SEASON')
      .sort((a, b) => a.sort_order - b.sort_order);
  },
  dev(v) { return RUTUJA.lang === 'mr' ? String(v).replace(/[0-9]/g, d => '०१२३४५६७८९'[d]) : String(v); },
  isOpen() { const w = document.getElementById('orderWin'); return !!(w && w.classList.contains('dw-mode') && !w.classList.contains('hidden')); },

  /* ---- the button, below Grade 5 ---- */
  button() {
    if (!this.ready) return;
    const grid = document.getElementById('stdGrid'); if (!grid) return;
    const old = grid.querySelector('[data-dw]'); if (old) old.remove();
    const t = k => RUTUJA.t(k);
    const stds = String(t('dw_stds')).split('|');
    const items = stds.map((sd, i) =>
      `<li style="--fd:${(i * 0.09).toFixed(2)}s"><span class="std-nm">${t('dw_item')} · ${sd}</span></li>`).join('');
    grid.insertAdjacentHTML('beforeend', `
      <button class="std-card dw-card" data-dw="1" type="button" aria-label="${t('dw_title')}">
        <span class="dw-fx" aria-hidden="true"><canvas class="dw-canvas"></canvas></span>
        <span class="std-left">
          <span class="std-top">${t('dw_std')}</span>
          <span class="std-figure"><span class="std-num dw-num">${t('dw_range')}</span></span>
        </span>
        <ul class="std-mid dw-mid">${items}</ul>
        <span class="std-right">
          <span class="std-count">${t('dw_count')}<br>${t('std_books_count')}</span>
          <span class="std-go">${t('std_open')}<i class="std-arrow">&rarr;</i></span>
        </span>
      </button>`);
    const btn = grid.querySelector('[data-dw]');
    btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); this.open(); });
    requestAnimationFrame(() => { this.fitButton(btn); this.fireworks(btn); });

    try { BOOKS.watchCards(); } catch (e) {}
    try { RUTUJA.reStill(); } catch (e) {}
  },

  /* Firecrackers, drawn into one canvas — one layer, however many bursts.
     Measured on a slow phone: twelve separately animated sparks (each its
     own layer inside the button's rounded, clipped corners) sometimes
     stuttered; two did not. A canvas redrawn twelve times a second from
     the same 8-frame burst strips costs about a millisecond per step, and
     stops entirely off screen, while scrolling, while a video plays, and
     while a window covers the page. Sixteen bursts (38-52px) and glitter on
     a capable phone; eight on a slow one. */
  fireworks(btn) {
    if (this._fw) { this._fw.stop(); this._fw = null; }
    const cv = btn && btn.querySelector('.dw-canvas'); if (!cv) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const v = RUTUJA.VERSION, names = ['gold', 'rose', 'teal'];
    /* loaded once and reused by every redraw of the button */
    const imgs = this._imgs || (this._imgs = names.map(n => { const i = new Image(); i.src = 'assets/img/diwali/fw-' + n + '.webp?v=' + v; return i; }));
    /* bursts over the titles sit on the top and bottom edges of the middle
       column, so every line stays easy to read */
    const spots = [[5, 22], [12, 76], [20, 40], [27, 90], [33, 8], [40, 94], [46, 6], [52, 95],
                   [58, 7], [64, 93], [70, 8], [76, 86], [82, 30], [88, 64], [94, 18], [97, 84]];
    const glit = [[12, 55], [33, 12], [50, 90], [68, 52], [84, 90], [95, 12]];
    let raf = 0, last = -1, seen = false, ctx = null, W = 0, H = 0, dpr = 1;
    const size = () => {
      const r = btn.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const covered = () => [...document.querySelectorAll('.modal')].some(m => !m.classList.contains('hidden'));
    const busy = () => RUTUJA._scrolling || RUTUJA._watching || document.hidden || covered();
    const draw = now => {
      raf = requestAnimationFrame(draw);
      if (!seen || busy()) return;
      const step = Math.floor(now / 83);                 /* 12 steps a second */
      if (step === last) return; last = step;
      if (!ctx) size();
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';           /* overlapping bursts add light, like real fireworks */
      const lite = document.documentElement.classList.contains('lite-fx');
      spots.forEach(([x, y], i) => {
        if (lite && i % 2) return;
        const period = 14 + (i % 4) * 3;                  /* steps per cycle: 8 lit, the rest dark */
        const f = (step + i * 5) % period; if (f > 7) return;
        const im = imgs[i % 3]; if (!im.complete || !im.naturalWidth) return;
        const z = 38 + (i % 3) * 7;                       /* 38, 45 or 52 px */
        ctx.drawImage(im, 0, f * 64, 64, 64, x / 100 * W - z / 2, y / 100 * H - z / 2, z, z);
      });
      ctx.globalCompositeOperation = 'source-over';
      if (!lite) glit.forEach(([x, y], i) => {
        const a = 0.25 + 0.75 * Math.abs(Math.sin((step + i * 3) / 4));
        ctx.fillStyle = `rgba(255,246,208,${a.toFixed(2)})`;
        ctx.beginPath(); ctx.arc(x / 100 * W, y / 100 * H, 1.8, 0, 6.2832); ctx.fill();
      });
    };
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
      seen = e.isIntersecting; if (seen && !raf && !reduced) raf = requestAnimationFrame(draw);
      if (!seen && raf) { cancelAnimationFrame(raf); raf = 0; }
    })) : null;
    if (io) io.observe(btn); else { seen = true; if (!reduced) raf = requestAnimationFrame(draw); }
    let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { ctx = null; last = -1; }, 150); };
    window.addEventListener('resize', onResize);
    this._fw = { stop: () => { if (raf) cancelAnimationFrame(raf); raf = 0; if (io) io.disconnect(); window.removeEventListener('resize', onResize); } };
  },

  /* The four lines of the button stay on one line each: if the longest is
     too wide, all four shrink together — never below 88%. */
  fitButton(btn) {
    const mid = btn && btn.querySelector('.dw-mid'); if (!mid || !mid.clientWidth) return;
    mid.classList.remove('dw-wrap');
    const lis = [...mid.querySelectorAll('li')];
    lis.forEach(li => { li.style.fontSize = ''; });
    /* the lines carry their own size in pixels, so each line is shrunk
       itself — together, and measured again after each step, because the
       bullet's space does not shrink with the text */
    const base = parseFloat(getComputedStyle(lis[0]).fontSize);
    /* the text itself is measured: a gliding light band inside a title
       counts as overflow in scrollWidth and would shrink it for nothing */
    const over = () => Math.max(...lis.map(li => {
      const cs = getComputedStyle(li), room = li.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      const r = document.createRange(); r.selectNodeContents(li);
      return r.getBoundingClientRect().width / Math.max(1, room);
    }));
    let f = 1;
    for (let k = 0; k < 4 && over() > 1.005; k++) {
      f = Math.max(0.88, f / over() * 0.995);
      lis.forEach(li => { li.style.fontSize = (base * f).toFixed(2) + 'px'; });
      if (f === 0.88) break;
    }
    if (over() > 1.005) mid.classList.add('dw-wrap');   /* never cut: wrap instead */
  },

  /* The tagline: one line wherever it fits at 88% or more; otherwise two
     even lines broken at its own pause (the "…" or the dash) — the way the
     cover prints it — so a single word is never left alone on a line. */
  tagline(p, text) {
    const at = (() => {
      const cands = [];
      for (const m of text.matchAll(/… |— /g)) cands.push(m.index + m[0].length);
      if (!cands.length) return -1;
      return cands.reduce((b, c) => Math.abs(c - text.length / 2) < Math.abs(b - text.length / 2) ? c : b);
    })();
    const a = at > 0 ? text.slice(0, at).trim() : text, b = at > 0 ? text.slice(at).trim() : '';
    p.innerHTML = b ? `<span class="dw-t1">“${this.esc(a)}</span> <span class="dw-t2">${this.esc(b)}”</span>` : `<span class="dw-t1">“${this.esc(a)}”</span>`;
    this.fitTag(p);
  },
  fitTag(p) {
    if (!p) return;
    p.classList.remove('dw-two', 'dw-free'); p.style.fontSize = '';
    const room = p.clientWidth; if (!room) return;
    const base = parseFloat(getComputedStyle(p).fontSize);
    const fit = need => {
      let f = room / need(); if (f >= 1) return true;
      for (let k = 0; k < 3 && f >= 0.88; k++) {
        p.style.fontSize = (base * f * 0.99).toFixed(2) + 'px';
        const w = need(); if (w <= room) return true; f *= room / w;
      }
      p.style.fontSize = ''; return false;
    };
    if (fit(() => p.scrollWidth)) return;
    p.classList.add('dw-two');
    if (fit(() => Math.max(...[...p.querySelectorAll('.dw-t1, .dw-t2')].map(x => x.offsetWidth)))) return;
    p.classList.add('dw-free');   /* a half still too wide: its words wrap evenly — never cut */
  },
  esc(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;'); },

  /* ---- the card at the end of the books page (Section 2's first button) ----
     A festive "rangoli lamp card" below the book grid: ribbon, heading,
     four cover tiles, the button, facts, and a row of diyas that light one
     by one. It answers to the page's standard filter: 1-4 name that
     standard and enlarge its tile; 5 (no booklet) keeps the card with a
     "for Std 1-4" line. The button and the tiles open the same Diwali
     window; a tile lands on its own booklet's row. Added below the grid,
     so nothing above it ever moves. */
  booksCard() {
    if (!this.ready) return;
    const page = document.getElementById('page-books'); if (!page) return;
    const wrap = page.querySelector('.wrap'); if (!wrap) return;
    const t = k => RUTUJA.t(k), mr = RUTUJA.lang === 'mr';
    const books = this.books(), stds = String(t('dw_stds')).split('|');
    const f = (typeof BOOKS !== 'undefined' && BOOKS.filters && String(BOOKS.filters.std || '')) || '';
    const pick = ['1', '2', '3', '4'].indexOf(f);
    this.seasonHint();
    const sig = [RUTUJA.lang, f].join('|');
    let card = document.getElementById('dwBooks');
    if (card && card.dataset.sig === sig) return;           /* nothing changed: leave it, effects and all */
    const head = pick >= 0 ? t('dw_bk_head_std').replace('{s}', stds[pick]) : t('dw_bk_head');
    const kandil = `<svg viewBox="0 0 40 72" aria-hidden="true"><path d="M20 0v10" stroke="#B8860B" stroke-width="1.6"/>
      <path d="M20 10 34 24 20 40 6 24z" fill="#E8A33D" stroke="#8E1450" stroke-width="1.6"/>
      <path d="M20 14 29 24 20 34 11 24z" fill="#FFE08A"/><path d="M11 40h18l-3 6H14z" fill="#C2185B"/>
      <path d="M13 46v20M17 46v24M20 46v18M23 46v24M27 46v20" stroke="#E8A33D" stroke-width="1.4"/></svg>`;
    const diya = i => `<i class="dw-diya" style="--i:${i}"><b class="dw-flame"></b></i>`;
    const tiles = books.map((b, i) => `<button type="button" class="dw-tile${i === pick ? ' on' : ''}" style="--i:${i}" data-dwbook="${b.book_id}"
        aria-label="${mr ? b.name_mr : b.name_en}">${RUTUJA.img('books', b.cover_image, '', mr ? b.name_mr : b.name_en)}<span>${stds[i]}</span></button>`).join('');
    const html = `
      <div class="dw-bk-in">
        <i class="dw-kandil dw-k1">${kandil}</i><i class="dw-kandil dw-k2">${kandil}</i>
        <p class="dw-bk-rib">✦ ${t('dw_bk_ribbon')} ✦</p>
        <h2 class="dw-bk-h"><span>${head}</span></h2>
        ${f === '5' ? `<p class="dw-bk-for">${t('dw_bk_for14')}</p>` : ''}
        <p class="dw-bk-sub">${t('dw_bk_sub')}</p>
        <div class="dw-tiles${pick >= 0 ? ' has-pick' : ''}">${tiles}</div>
        <div class="dw-bk-bwrap"><i class="dw-bk-halo" aria-hidden="true"></i>
        <button type="button" class="dw-bk-btn"><span class="dw-bk-ring" aria-hidden="true"></span>
          <span class="dw-bk-body"><i class="dw-bk-diya" aria-hidden="true"><b class="dw-flame"></b></i>
            <span class="dw-bk-txt"><b>${t('dw_bk_btn')}</b><em>${t('dw_bk_btn2')}</em></span>
            <i class="dw-bk-go" aria-hidden="true"><span>${t('dw_bk_go')}</span><b>›</b><b>›</b><em class="dw-bk-rip"></em></i></span></button></div>
        <div class="dw-bk-chips">${String(t('dw_bk_chips')).split('|').map(c => `<span>${c}</span>`).join('')}</div>
        <p class="dw-bk-val">${t('dw_bk_value')}</p>
        <p class="dw-bk-auth">${t('dw_bk_author')}</p>
        <div class="dw-diyas" aria-hidden="true">${[0, 1, 2, 3, 4, 5, 6, 7].map(diya).join('')}</div>
      </div>`;
    if (!card) {
      card = document.createElement('section');
      card.id = 'dwBooks'; card.className = 'dw-bk';
      const none = document.getElementById('bookNone');
      (none && none.parentNode === wrap ? none : wrap.lastElementChild).insertAdjacentElement('afterend', card);
      card.addEventListener('click', e => {
        const tile = e.target.closest('[data-dwbook]');
        const btn = e.target.closest('.dw-bk-btn');
        if (!tile && !btn) return;
        e.preventDefault();
        const el = tile || btn;
        el.classList.remove('dw-tap'); void 0; requestAnimationFrame(() => el.classList.add('dw-tap'));
        setTimeout(() => this.open(tile ? tile.dataset.dwbook : null), 160);
      });
      /* the diyas light one by one the first time the card is seen */
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { card.classList.add('dw-lit'); io.disconnect(); } }), { threshold: 0.2 });
        io.observe(card);
      } else card.classList.add('dw-lit');
    }
    card.dataset.sig = sig;
    card.innerHTML = html;
    /* every line of the card, and the season hint, stays on one line —
       fitted whenever the card's size changes, including the moment the
       books page is first shown (it is drawn while hidden) */
    this._bkFit = () => {
      const c = document.getElementById('dwBooks'); if (!c || !c.clientWidth) return;
      c.querySelectorAll('.dw-bk-rib, .dw-bk-h span, .dw-bk-for, .dw-bk-sub, .dw-bk-txt b, .dw-bk-txt em, .dw-bk-val, .dw-bk-auth')
        .forEach(el => RUTUJA.fitOne(el, 0.72));
      RUTUJA.fitOne(document.querySelector('#page-books .dw-hint-t'), 0.72);
      RUTUJA.fitRow(c.querySelector('.dw-bk-chips'), 0.7);
    };
    requestAnimationFrame(() => this._bkFit());
    (RUTUJA.fontsReady || Promise.resolve()).then(() => requestAnimationFrame(() => this._bkFit())).catch(() => {});
    if (!card._ro && 'ResizeObserver' in window) { card._ro = new ResizeObserver(() => this._bkFit && this._bkFit()); card._ro.observe(card); }
    if (!this._bkResize) {
      this._bkResize = true; let rt;
      window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const c = document.getElementById('dwBooks'); if (c) c.dataset.sig = ''; this.booksCard(); }, 220); });
    }
  },

  /* The Diwali entries at the end of three lists on the books page — the
     book list (पुस्तक निवडा), इयत्ता and विषय — each after a thin separator.
     Choosing one scrolls to the Diwali card, which glows once; the list
     then shows what it showed before, so the grid is never filtered and a
     chosen standard stays chosen. The page rebuilds these lists (on a
     language switch, for example), so each list is watched and its entry
     put back whenever that happens. Its own reaction never runs for a
     Diwali choice: this listener runs first and stops it. */
  entries() {
    if (!this.ready) return;
    const t = k => RUTUJA.t(k);
    const lists = [['bPick', 'dw_opt_pick', () => ''], ['fStd', 'dw_opt_std', () => (BOOKS.filters && BOOKS.filters.std) || ''],
                   ['fSub', 'dw_opt_sub', () => (BOOKS.filters && BOOKS.filters.sub) || '']];
    lists.forEach(([id, key, prev]) => {
      const sel = document.getElementById(id); if (!sel) return;
      const put = () => {
        const want = t(key);
        const have = sel.querySelector('option[value="dw:diwali"]');
        if (have && have.textContent === want && sel.lastElementChild === have) return;
        sel.querySelectorAll('option[data-dw]').forEach(o => o.remove());
        const keep = sel.value;
        sel.insertAdjacentHTML('beforeend', `<option data-dw="1" disabled>──────────</option><option data-dw="1" value="dw:diwali">${want}</option>`);
        sel.value = keep;
      };
      put();
      if (!sel._dwWatch) {
        sel._dwWatch = new MutationObserver(() => { if (this.ready) put(); });
        sel._dwWatch.observe(sel, { childList: true });
        sel.addEventListener('change', e => {
          if (sel.value !== 'dw:diwali') return;
          e.stopImmediatePropagation();
          sel.value = prev();
          this.callCard();
        }, true);
      }
    });
  },
  /* bring the card into view and let it glow once */
  callCard() {
    const c = document.getElementById('dwBooks'); if (!c) return;
    c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    /* each choice clears the timers of the one before, so a quick second
       choice still glows */
    clearTimeout(this._callOn); clearTimeout(this._callOff);
    c.classList.remove('dw-call');
    this._callOn = setTimeout(() => requestAnimationFrame(() => c.classList.add('dw-call')), 450);
    this._callOff = setTimeout(() => c.classList.remove('dw-call'), 2200);
  },

  /* Section 2's green button (पुस्तके पाहा): during the season its second
     line mentions the Diwali booklets; afterwards its own line returns.
     Only the words change — same place, same size, and the locked button
     stylesheet is untouched. The line is kept on one line. */
  greenButton() {
    if (!this.ready) return;
    const i = document.querySelector('.cta-books [data-t="btn_books_sub"], .cta-books [data-dw-t="btn_books_sub"]'); if (!i) return;
    if (i.dataset.t) { i.dataset.dwT = i.dataset.t; i.removeAttribute('data-t'); }
    i.textContent = RUTUJA.t('dw_btn_books_sub');
    requestAnimationFrame(() => this.fitInline(i));
  },
  restoreGreen() {
    const i = document.querySelector('.cta-books [data-dw-t="btn_books_sub"]'); if (!i) return;
    i.dataset.t = i.dataset.dwT; delete i.dataset.dwT; i.style.fontSize = '';
    i.textContent = RUTUJA.t(i.dataset.t);
  },
  /* one line for a short line of text inside a box it cannot widen */
  fitInline(el) {
    if (!el) return;
    el.style.fontSize = '';
    const box = el.parentElement; if (!box || !box.clientWidth) return;
    const room = box.clientWidth;
    const need = () => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };
    const base = parseFloat(getComputedStyle(el).fontSize); let f = 1;
    for (let k = 0; k < 4 && need() > room - 1; k++) {
      f = Math.max(0.75, f * (room - 2) / need()); el.style.fontSize = (base * f).toFixed(2) + 'px'; if (f === 0.75) break;
    }
  },

  /* During the season the books page's hint points to the card below it;
     outside the season (or when the season ends while open) the page's own
     hint returns. Its data-t is set aside while in season, so a language
     switch cannot overwrite the Diwali hint with the ordinary one. */
  seasonHint() {
    const h = document.querySelector('#page-books .books-hint'); if (!h) return;
    const t = k => RUTUJA.t(k);
    if (h.dataset.t) { h.dataset.dwT = h.dataset.t; h.removeAttribute('data-t'); }
    h.classList.add('dw-hint');
    h.innerHTML = `<span class="dw-hint-t">🪔 ${t('dw_bk_hint')}</span> <button type="button" class="dw-hint-go">${t('dw_bk_hint_go')}</button>`;
    h.querySelector('.dw-hint-go').addEventListener('click', () => {
      const c = document.getElementById('dwBooks'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    requestAnimationFrame(() => { if (this._bkFit) this._bkFit(); else RUTUJA.fitOne(h.querySelector('.dw-hint-t'), 0.72); });
  },
  restoreHint() {
    const h = document.querySelector('#page-books .books-hint'); if (!h || !h.dataset.dwT) return;
    h.dataset.t = h.dataset.dwT; delete h.dataset.dwT; h.classList.remove('dw-hint');
    h.textContent = RUTUJA.t(h.dataset.t);
  },

  /* ---- the window: Section 2's order window, with these four books ---- */
  open(focusId) {
    if (!this.ready) return;
    this._focus = focusId || null;
    ORDER.source = () => this.books();
    ORDER.series = 'DIWALI';
    ORDER.afterDraw = () => this.decorate();
    ORDER.onAgain = () => this.open();
    ORDER.onClose = () => this.leave();
    this._prevQ = {};
    const w = document.getElementById('orderWin');
    w.classList.add('dw-mode');
    this.swap(true);
    ORDER.open([]);
  },
  /* the window's heading and "see again" read the Diwali text while open */
  swap(on) {
    const w = document.getElementById('orderWin'); if (!w) return;
    [['order_title', 'dw_title'], ['see_books_again', 'dw_again']].forEach(([a, b]) => {
      const el = w.querySelector(`[data-t="${on ? a : b}"]`);
      if (el) { el.dataset.t = on ? b : a; el.textContent = RUTUJA.t(el.dataset.t); }
    });
  },
  leave() {
    ORDER.source = null; ORDER.series = ''; ORDER.afterDraw = null; ORDER.onAgain = null;
    this.swap(false);
    const w = document.getElementById('orderWin'); if (w) w.classList.remove('dw-mode');
    const top = document.getElementById('dwTop'); if (top) top.remove();
  },

  /* after every draw of the window: the Diwali top, and each book row's facts */
  decorate() {
    const t = k => RUTUJA.t(k), mr = RUTUJA.lang === 'mr', n = v => this.dev(v);
    const books = this.books();
    /* until a quantity is chosen, the first + gently invites a tap */
    const pick = document.getElementById('orderPick');
    if (pick) pick.classList.toggle('dw-empty', !ORDER.picked.some(p => p.qty > 0));
    let top = document.getElementById('dwTop');
    if (!top) {
      top = document.createElement('div'); top.id = 'dwTop'; top.className = 'dw-top';
      document.getElementById('orderPath').insertAdjacentElement('afterend', top);
    }
    /* the cover fan is built once per opening — its images load straight
       away and are never rebuilt; a language switch only rewrites the words */
    if (!top.querySelector('.dw-fan')) {
      top.innerHTML = `<p class="dw-tag"></p>
        <div class="dw-fan">${books.map((b, i) => `<span class="dw-cv" style="--i:${i}" data-dwjump="${b.book_id}" role="button" tabindex="0">${
          RUTUJA.img('books', b.cover_image, '', mr ? b.name_mr : b.name_en).replace('loading="lazy"', 'loading="eager"')}</span>`).join('')}</div>
        <div class="dw-offer"></div><div class="dw-table"></div>
        <button class="dw-all10" type="button"></button>`;
      top.querySelector('.dw-all10').addEventListener('click', () => { books.forEach(b => ORDER.setQty(b.book_id, 10)); });
      /* tapping a cover brings that booklet's row into view */
      top.querySelector('.dw-fan').addEventListener('click', e => {
        const cv = e.target.closest('[data-dwjump]'); if (!cv) return;
        const inp = document.querySelector(`#orderPick [data-oi="${cv.dataset.dwjump}"]`);
        const row = inp && inp.closest('.opick-row'); if (!row) return;
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.remove('dw-focus'); requestAnimationFrame(() => row.classList.add('dw-focus'));
      });
    }
    if (top.dataset.lang !== RUTUJA.lang) {
      top.dataset.lang = RUTUJA.lang;
      const rows = [10, 25, 50].map((q, ri) => `<tr style="--r:${ri}"><td>${n(q)}</td><td><s>₹${n(q * 30)}</s></td><td><b>₹${n(q * 20)}</b></td><td class="dw-sv">₹${n(q * 10)}</td></tr>`).join('');
      this.tagline(top.querySelector('.dw-tag'), t('dw_tagline'));
      top.querySelector('.dw-offer').innerHTML = `<i class="dw-odiya dw-od1"><b class="dw-flame"></b></i><i class="dw-odiya dw-od2"><b class="dw-flame"></b></i><span class="dw-o1">${t('dw_offer_a')}</span><span class="dw-o2">${t('dw_offer_b')}</span><span class="dw-o3">${t('dw_offer_c')}</span>`;
      top.querySelector('.dw-table').innerHTML = `<p class="dw-th">${t('dw_table_h')}</p>
        <table><thead><tr><th>${t('dw_t_copies')}</th><th>${t('dw_t_mrp')}</th><th>${t('dw_t_offer')}</th><th>${t('dw_t_saved')}</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
      top.querySelector('.dw-all10').textContent = t('dw_all10');
      top.querySelectorAll('.dw-cv img').forEach((im, i) => { const b = books[i]; if (b) im.alt = mr ? b.name_mr : b.name_en; });
    }
    /* every book name in the window — rows and the summary — complete on
       one line: fitted to its own box */
    requestAnimationFrame(() => document.querySelectorAll('#orderWin .opick-name.bt, #orderSum .oline-name.bt').forEach(nm => {
      /* measured against the name's own box, whose width is stable — the
         span inside shrinks with its text and cannot be measured against */
      const sp = nm.querySelector(':scope > span'); if (sp) sp.style.fontSize = '';
      nm.style.fontSize = '';
      const room = nm.clientWidth; if (!room) return;
      const need = () => { const r = document.createRange(); r.selectNodeContents(nm); return r.getBoundingClientRect().width; };
      const base = parseFloat(getComputedStyle(nm).fontSize); let f = 1;
      for (let k = 0; k < 4 && need() > room - 1; k++) {
        f = Math.max(0.66, f * (room - 2) / need());
        nm.style.fontSize = (base * f).toFixed(2) + 'px';
        if (f === 0.66) break;
      }
    }));
    document.querySelectorAll('#orderPick .opick-row').forEach(row => {
      const inp = row.querySelector('[data-oi]'); if (!inp) return;
      const id = inp.dataset.oi; if (!books.some(b => b.book_id === id)) return;
      const q = ORDER.qtyOf(id);
      const name = row.querySelector('.opick-name');
      if (name && !row.querySelector('.dw-facts')) {
        name.insertAdjacentHTML('afterend', `<p class="dw-facts">${t('dw_facts')}</p>`);
        const fx = row.querySelector('.dw-facts'); requestAnimationFrame(() => RUTUJA.fitOne(fx, 0.72));
      }
      row.querySelectorAll('.oslab-c b').forEach((b, k) => { b.textContent = t(k ? 'dw_slab_hi' : 'dw_slab_lo'); });
      /* the price shows as just ₹30 until 10+ copies bring it down; then
         the struck-through ₹30 → ₹20 appears */
      const money = row.querySelector('.opick-money'); if (money) money.classList.toggle('dw-flat', q < 10);
      const main = row.querySelector('.opick-main');
      if (main && q > 0) {
        /* a bar that fills towards ten copies — the offer made visible */
        const from = Math.min(1, (this._prevQ[id] || 0) / 10), to = Math.min(1, q / 10);
        const each = q >= 10 ? 20 : 30;
        main.insertAdjacentHTML('beforeend', `<div class="dw-prog${q >= 10 ? ' dw-ok' : ''}">
          <p class="dw-prog-t"><b>${n(q)} × ₹${n(each)} = ₹${n(q * each)}</b><span>${q < 10 ? t('dw_prog_more').replace('{n}', n(10 - q)) : t('dw_prog_ok')}</span></p>
          <i class="dw-bar"><i style="--from:${from.toFixed(2)};--to:${to.toFixed(2)}"></i></i></div>`);
      }
      if (this._focus === id) {
        this._focus = null;
        row.classList.add('dw-focus');
        requestAnimationFrame(() => row.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      }
      if (q >= 10 && (this._prevQ[id] || 0) < 10) {
        row.classList.add('dw-hit');
        row.insertAdjacentHTML('beforeend', '<i class="dw-pop" aria-hidden="true"></i><i class="dw-pop dw-pop2" aria-hidden="true"></i>');
      }
      this._prevQ[id] = q;
    });
  },

  /* ---- outside the season: a slim strip below the books ----
     From 1 December to 31 August the books page ends with a calm strip:
     the booklets' name, the exact date they return (a countdown in the
     last month), and a "Remind me" button that opens WhatsApp with a ready
     message. Its words and style live here, since the package's data and
     stylesheet are not downloaded outside the season. */
  OFF: {
    mr: { h: 'दिवाळी अभ्यास (इयत्ता १–४)', s1: 'पुन्हा उपलब्ध: {d}', cd: ' ({n} दिवसांत)', cd1: ' (उद्या)', s2: 'दरवर्षी सप्टेंबर ते नोव्हेंबर',
          btn: '🔔 आठवण करून द्या', again: '🔔 पुन्हा पाठवा', ok: '✓ आठवण पाठवली — सप्टेंबरमध्ये कळवू',
          months: ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'] },
    en: { h: 'Diwali Abhyas (Std 1–4)', s1: 'Back on {d}', cd: ' (in {n} days)', cd1: ' (tomorrow)', s2: 'Every year, September to November',
          btn: '🔔 Remind me', again: '🔔 Send again', ok: '✓ Reminder sent',
          months: ['January','February','March','April','May','June','July','August','September','October','November','December'] }
  },
  nextStart() {
    const n = this.istNow(), [m, d] = String(this.cfg.start).split('-').map(Number);
    const md = (n.getUTCMonth() + 1) * 100 + n.getUTCDate();
    const y = n.getUTCFullYear() + (md < m * 100 + d ? 0 : 1);
    const today = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
    return { y, m, d, days: Math.round((Date.UTC(y, m - 1, d) - today) / 86400000) };
  },
  offStrip() {
    if (this.inSeason()) return;
    const page = document.getElementById('page-books'), wrap = page && page.querySelector('.wrap'); if (!wrap) return;
    const mr = RUTUJA.lang === 'mr', T = this.OFF[mr ? 'mr' : 'en'];
    const dev = v => mr ? String(v).replace(/[0-9]/g, x => '०१२३४५६७८९'[x]) : String(v);
    const ns = this.nextStart();
    const date = `${dev(ns.d)} ${T.months[ns.m - 1]} ${dev(ns.y)}`;
    const cd = ns.days === 1 ? T.cd1 : (ns.days > 1 && ns.days <= 31 ? T.cd.replace('{n}', dev(ns.days)) : '');
    let sent = false; try { sent = localStorage.getItem('rutuja_dw_remind') === String(ns.y); } catch (e) {}
    /* the WhatsApp message is always in Marathi, like the site's orders;
       the visitor's saved name and village are added when known */
    const mrDate = `${String(ns.d).replace(/[0-9]/g, x => '०१२३४५६७८९'[x])} ${this.OFF.mr.months[ns.m - 1]} ${String(ns.y).replace(/[0-9]/g, x => '०१२३४५६७८९'[x])}`;
    let who = ''; try { const bu = (typeof BUYER !== 'undefined' && BUYER.get()) || null;
      if (bu && bu.name) who = '\n— ' + bu.name + (bu.village_city ? ', ' + bu.village_city : ''); } catch (e) {}
    const msg = `नमस्कार! दिवाळी अभ्यास (इयत्ता १–४) ${mrDate} ला उपलब्ध झाल्यावर मला व्हॉट्सॲपवर कळवा.${who}`;
    const num = (RUTUJA.config && RUTUJA.config.whatsapp_number) || '';
    const link = num ? 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg) : '';
    this.offStyle();
    let el = document.getElementById('dwOff');
    if (!el) {
      el = document.createElement('section'); el.id = 'dwOff'; el.className = 'dw-off';
      const none = document.getElementById('bookNone');
      (none && none.parentNode === wrap ? none : wrap.lastElementChild).insertAdjacentElement('afterend', el);
      el.addEventListener('click', e => {
        if (!e.target.closest('.dw-off-go')) return;
        try { localStorage.setItem('rutuja_dw_remind', String(this.nextStart().y)); } catch (x) {}
        setTimeout(() => this.offStrip(), 400);
      });
    }
    el.classList.toggle('sent', sent);
    el.innerHTML = `<i class="dw-off-diya" aria-hidden="true"><b></b></i>
      <div class="dw-off-t"><p class="dw-off-h">${T.h}</p>
        <p class="dw-off-s">${T.s1.replace('{d}', `<b>${date}</b>`)}${cd}</p><p class="dw-off-s dw-off-s2">${T.s2}</p></div>
      <div class="dw-off-act">${sent ? `<span class="dw-off-ok">${T.ok}</span>` : ''}
        ${link ? `<a class="dw-off-go" href="${link}" target="_blank" rel="noopener">${sent ? T.again : T.btn}</a>` : ''}</div>`;
    requestAnimationFrame(() => el.querySelectorAll('.dw-off-h, .dw-off-s, .dw-off-ok').forEach(x => RUTUJA.fitOne(x, 0.78)));
    if (!el._ro && 'ResizeObserver' in window) { el._ro = new ResizeObserver(() => el.querySelectorAll('.dw-off-h, .dw-off-s, .dw-off-ok').forEach(x => RUTUJA.fitOne(x, 0.78))); el._ro.observe(el); }
  },
  offStyle() {
    if (document.getElementById('dwOffCss')) return;
    const st = document.createElement('style'); st.id = 'dwOffCss';
    st.textContent = `
.dw-off{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:12px;row-gap:10px;align-items:center;margin:18px 0 6px;padding:12px 14px;
  border-radius:16px;background:linear-gradient(180deg,#FFFBF1,#FFF3DC);border:1.5px solid rgba(232,163,61,.8);box-shadow:0 4px 12px rgba(232,163,61,.14)}
.dw-off-diya{position:relative;width:26px;height:13px;margin-top:12px;border-radius:0 0 13px 13px;background:linear-gradient(180deg,#C8621F,#7A2E0C)}
.dw-off-diya b{position:absolute;left:50%;bottom:92%;width:10px;height:15px;margin-left:-5px;border-radius:50% 50% 42% 42%/64% 64% 36% 36%;
  background:radial-gradient(55% 50% at 50% 72%,#FFF4B8 0%,#FFC107 38%,#FF7A00 72%,#E53B0E 100%);box-shadow:0 0 7px 2px rgba(255,150,0,.5);
  transform-origin:50% 100%;animation:dwOffFl 1.6s ease-in-out infinite}
.dw-off-t{min-width:0}
.dw-off-h{margin:0;font-weight:800;font-size:15px;line-height:1.3;color:#8E1450;white-space:nowrap}
.dw-off-s{margin:2px 0 0;font-size:12.5px;font-weight:600;line-height:1.35;color:#5B4350;white-space:nowrap}
.dw-off-s b{color:#A5114F}
.dw-off-s2{color:#7A6570;font-weight:500}
.dw-off-act{grid-column:1/-1;display:flex;align-items:center;justify-content:flex-end;gap:10px;min-width:0}
.dw-off-ok{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:12px;font-weight:700;color:#1B7A3A;white-space:nowrap}
.dw-off-go{flex:0 0 auto;display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;font-weight:800;font-size:13px;
  color:#fff;background:#1FA855;text-decoration:none;white-space:nowrap;box-shadow:0 3px 8px rgba(31,168,85,.3)}
.dw-off.sent .dw-off-go{background:#fff;color:#1B7A3A;box-shadow:inset 0 0 0 1.5px #1FA855}
.dw-off-go:active{transform:scale(.96)}
.dw-off.dw-call{animation:dwOffCall 1.4s ease-out}
@keyframes dwOffFl{0%,100%{transform:scale(1,1)}30%{transform:scale(.92,1.08)}60%{transform:scale(1.06,.95)}}
@keyframes dwOffCall{0%{box-shadow:0 0 0 0 rgba(232,163,61,.95)}100%{box-shadow:0 0 0 16px rgba(232,163,61,0)}}
html:is(.scrolling,.watching,.win-open) .dw-off-diya b{animation:none}
@media(prefers-reduced-motion:reduce){.dw-off-diya b,.dw-off.dw-call{animation:none}}`;
    document.head.appendChild(st);
  }
};

/* starts once the site's own data has arrived */
(function wait() {
  if (typeof RUTUJA !== 'undefined' && RUTUJA.content && RUTUJA.content.books && RUTUJA.text && RUTUJA.text.mr) {
    try { DIWALI.init(); } catch (e) { console.error('diwali init', e); }
  } else setTimeout(wait, 150);
})();
