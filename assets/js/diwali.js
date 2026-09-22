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
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.check(); });
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
    const items = [1, 2, 3, 4].map((n, i) =>
      `<li style="--fd:${(i * 0.09).toFixed(2)}s"><span class="std-nm">${t('dw_item')} ${this.dev(n)}</span></li>`).join('');
    const spots = [[9, 24], [30, 80], [52, 16], [74, 74], [93, 34]];
    /* staggered across the cycle so the bursts take turns rather than
       all being lit at once */
    const bursts = spots.map(([x, y], i) => `<i class="dw-b" style="left:${x}%;top:${y}%;--d:${(i * 0.64).toFixed(2)}s"></i>`).join('');
    grid.insertAdjacentHTML('beforeend', `
      <button class="std-card dw-card" data-dw="1" type="button" aria-label="${t('dw_title')}">
        <span class="dw-fx" aria-hidden="true">${bursts}<i class="dw-tw"></i><i class="dw-tw dw-tw2"></i></span>
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
    grid.querySelector('[data-dw]').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); this.open(); });
    try { BOOKS.watchCards(); } catch (e) {}
    try { RUTUJA.reStill(); } catch (e) {}
  },

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
      top.querySelector('.dw-tag').textContent = '“' + t('dw_tagline') + '”';
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
