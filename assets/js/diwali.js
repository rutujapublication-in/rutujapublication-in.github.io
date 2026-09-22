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
    }, 200); });
    if (location.hash === '#diwali' && !this.inSeason()) this.toast();
    /* the window's language button repaints the page; the window's own
       Diwali pieces are drawn again once it has */
    const setLang = RUTUJA.setLang.bind(RUTUJA);
    RUTUJA.setLang = (...a) => {
      const r = setLang(...a);
      setTimeout(() => { if (this.isOpen()) ORDER.draw(); }, 60);
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
    const over = () => Math.max(...lis.map(li => li.scrollWidth / Math.max(1, li.clientWidth)));
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

  /* ---- the window: Section 2's order window, with these four books ---- */
  open() {
    if (!this.ready) return;
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
    let top = document.getElementById('dwTop');
    if (!top) {
      top = document.createElement('div'); top.id = 'dwTop'; top.className = 'dw-top';
      document.getElementById('orderPath').insertAdjacentElement('afterend', top);
    }
    /* the cover fan is built once per opening — its images load straight
       away and are never rebuilt; a language switch only rewrites the words */
    if (!top.querySelector('.dw-fan')) {
      top.innerHTML = `<p class="dw-tag"></p>
        <div class="dw-fan">${books.map((b, i) => `<span class="dw-cv" style="--i:${i}">${
          RUTUJA.img('books', b.cover_image, '', mr ? b.name_mr : b.name_en).replace('loading="lazy"', 'loading="eager"')}</span>`).join('')}</div>
        <div class="dw-offer"></div><div class="dw-table"></div>
        <button class="dw-all10" type="button"></button>`;
      top.querySelector('.dw-all10').addEventListener('click', () => { books.forEach(b => ORDER.setQty(b.book_id, 10)); });
    }
    if (top.dataset.lang !== RUTUJA.lang) {
      top.dataset.lang = RUTUJA.lang;
      const rows = [10, 25, 50].map(q => `<tr><td>${n(q)}</td><td><s>₹${n(q * 30)}</s></td><td><b>₹${n(q * 20)}</b></td><td class="dw-sv">₹${n(q * 10)}</td></tr>`).join('');
      this.tagline(top.querySelector('.dw-tag'), t('dw_tagline'));
      top.querySelector('.dw-offer').innerHTML = `<span class="dw-o1">${t('dw_offer_a')}</span><span class="dw-o2">${t('dw_offer_b')}</span><span class="dw-o3">${t('dw_offer_c')}</span>`;
      top.querySelector('.dw-table').innerHTML = `<p class="dw-th">${t('dw_table_h')}</p>
        <table><thead><tr><th>${t('dw_t_copies')}</th><th>${t('dw_t_mrp')}</th><th>${t('dw_t_offer')}</th><th>${t('dw_t_saved')}</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
      top.querySelector('.dw-all10').textContent = t('dw_all10');
      top.querySelectorAll('.dw-cv img').forEach((im, i) => { const b = books[i]; if (b) im.alt = mr ? b.name_mr : b.name_en; });
    }
    document.querySelectorAll('#orderPick .opick-row').forEach(row => {
      const inp = row.querySelector('[data-oi]'); if (!inp) return;
      const id = inp.dataset.oi; if (!books.some(b => b.book_id === id)) return;
      const q = ORDER.qtyOf(id);
      const name = row.querySelector('.opick-name');
      if (name && !row.querySelector('.dw-facts')) name.insertAdjacentHTML('afterend', `<p class="dw-facts">${t('dw_facts')}</p>`);
      row.querySelectorAll('.oslab-c b').forEach((b, k) => { b.textContent = t(k ? 'dw_slab_hi' : 'dw_slab_lo'); });
      const qty = row.querySelector('.opick-qty');
      if (qty && q > 0) qty.insertAdjacentHTML('afterend', q < 10
        ? `<p class="dw-nudge">${t('dw_nudge').replace('{n}', n(10 - q))}</p>`
        : `<p class="dw-nudge dw-ok">${t('dw_hit')}</p>`);
      if (q >= 10 && (this._prevQ[id] || 0) < 10) {
        row.classList.add('dw-hit');
        row.insertAdjacentHTML('beforeend', '<i class="dw-pop" aria-hidden="true"></i><i class="dw-pop dw-pop2" aria-hidden="true"></i>');
      }
      this._prevQ[id] = q;
    });
  },

  /* a shared #diwali link opened outside the season */
  toast() {
    const mr = RUTUJA.lang === 'mr';
    const m = document.createElement('div');
    m.textContent = mr ? 'दिवाळी अभ्यास — हा उपक्रम दरवर्षी सप्टेंबर ते नोव्हेंबर उपलब्ध असतो'
                       : 'Diwali Abhyas — available every year from September to November';
    m.setAttribute('role', 'status');
    m.style.cssText = 'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:9999;max-width:88vw;'
      + 'background:#7A0E46;color:#fff;padding:10px 16px;border-radius:12px;font-size:14px;text-align:center;'
      + 'box-shadow:0 6px 18px rgba(0,0,0,.25)';
    document.body.appendChild(m);
    setTimeout(() => m.remove(), 5000);
  }
};

/* starts once the site's own data has arrived */
(function wait() {
  if (typeof RUTUJA !== 'undefined' && RUTUJA.content && RUTUJA.content.books && RUTUJA.text && RUTUJA.text.mr) {
    try { DIWALI.init(); } catch (e) { console.error('diwali init', e); }
  } else setTimeout(wait, 150);
})();
