/* ===================================================================
   RIGHTS — Section 7 "हक्क, मौलिकता आणि जागरूकता" / "Rights, Originality
   & Awareness". A separate package: this file, assets/css/rights.css,
   data/rights.json and the images in assets/img/rights.

   Where: on the homepage directly after Section 6, and in every book
   window after "लेखणीमागची लेखिका", before Q&A (each book shows only the
   cards listed for it in rights.json).
   How: Section 5's form — one card at a time, each with its own tone,
   title, subtitle, content, and a gold closing line; arrows, dots, swipe,
   and a timer that rests off screen, while scrolling, behind windows and
   when the visitor taps to hold. One language at a time, never both.
   The section is exactly Section 5's size (VISION.deckHeight()), and every
   line that is a title, a label or a step is kept on one line.

   No accused person is named anywhere: the newspaper images show only the
   masthead, the headline, the opening lines and the date line.
   =================================================================== */
const RIGHTS = {
  data: null, ready: false, homeDeck: null, bookDecks: [], _cssP: null, _queued: [],

  /* ---------- loading ---------- */
  init() {
    const v = RUTUJA.VERSION;
    this._cssP = new Promise(res => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'assets/css/rights.css?v=' + v;
      l.onload = res; l.onerror = res; document.head.appendChild(l);
    });
    Promise.all([fetch('data/rights.json?v=' + v).then(r => r.json()), this._cssP]).then(([d]) => {
      this.data = d; this.ready = true;
      /* the book window's step path needs a label for this section; it comes
         from this package, so the site's own text file is left untouched */
      ['mr', 'en'].forEach(L => { const T = RUTUJA.text[L] || (RUTUJA.text[L] = {}); if (!T.st_b_rights) T.st_b_rights = d.ui[L].step; });
      /* book windows opened before the data arrived are filled in now */
      this._queued.splice(0).forEach(root => this.mount(root));
      /* the homepage deck is built when the page is quiet AND the section
         is within a screen of the viewport — so it costs nothing while the
         visitor is still reading the top of the page */
      this.whenNear();
    }).catch(e => console.error('rights package', e));
    /* a language switch redraws both places */
    const setLang = RUTUJA.setLang.bind(RUTUJA);
    RUTUJA.setLang = (...a) => { const r = setLang(...a); setTimeout(() => { if (this.ready) this.buildHome(); }, 80); return r; };
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => this.refitAll(), 220); });
    /* English cards use Lora, which can arrive after the first fit: every
       font that finishes loading refits the cards */
    if (document.fonts && document.fonts.addEventListener) {
      let ft; document.fonts.addEventListener('loadingdone', () => { clearTimeout(ft); ft = setTimeout(() => this.refitAll(), 120); });
    }
  },

  t(k) { const L = RUTUJA.lang === 'mr' ? 'mr' : 'en'; return (this.data && this.data.ui[L][k]) || ''; },
  L() { return RUTUJA.lang === 'mr' ? 'mr' : 'en'; },
  esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); },
  cards(bookId) {
    return ((this.data && this.data.cards) || []).filter(c => c.on && (bookId ? (c.books || []).indexOf(bookId) >= 0 : c.home));
  },
  deckH() { try { return VISION.deckHeight(); } catch (e) { return 380; } },

  /* ---------- the homepage section, placed at once (empty) so nothing below ever moves ---------- */
  placeHome() {
    const mom = document.getElementById('mom'); if (!mom || document.getElementById('rtHome')) return;
    mom.insertAdjacentHTML('afterend', `
      <div class="rt" id="rtHome" style="min-height:560px">
        <div class="rt-frame">
          <div class="hd hd-std"><h2 class="hd-t"><i class="hd-mark" aria-hidden="true"></i><span class="rt-h"></span></h2>
            <p class="hd-c-sub rt-hs"></p><span class="hd-rule" aria-hidden="true"></span></div>
          <div class="rt-root"></div>
        </div>
      </div>`);
  },
  whenNear() {
    const host = document.getElementById('rtHome'); if (!host || this.homeDeck) return;
    /* never while the page is being scrolled: the build would land in the
       middle of the scroll and stutter it */
    const go = () => { if (this.homeDeck) return;
      const when = () => { if (RUTUJA._scrolling) { setTimeout(when, 250); return; } RUTUJA.idle(() => this.buildHome(), 250); };
      when(); };
    if (!('IntersectionObserver' in window)) { RUTUJA.idle(() => this.buildHome(), 6500); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); go(); } }), { rootMargin: '900px 0px' });
    io.observe(host);
  },
  buildHome() {
    const host = document.getElementById('rtHome'); if (!host || !this.ready) return;
    const L = this.L(), H = this.data.head[L];
    host.querySelector('.rt-h').textContent = H.t; host.querySelector('.rt-hs').textContent = H.s;
    this.fitHead(host);
    if (this.homeDeck) this.homeDeck.destroy();
    this.homeDeck = this.deck(host.querySelector('.rt-root'), this.cards(null));
    host.style.minHeight = '';
  },

  /* ---------- the book window section: its frame comes with the window's
     own alternation (SEC.tone()), and is filled in by mount() ---------- */
  html(bookId) {
    const n = ((this.data && this.data.cards) || []).filter(c => c.on && (c.books || []).indexOf(bookId) >= 0).length;
    if (this.data && !n) return '';
    const H = this.data ? this.data.head[this.L()] : { t: '', s: '' };
    return `<section class="bsec ${SEC.tone()} rt-bw" data-rt-book="${this.esc(bookId)}" data-step="st_b_rights">
      <div class="hd hd-sm bsec-hd"><h3 class="hd-t"><i class="hd-mark" aria-hidden="true"></i><span class="rt-h">${this.esc(H.t)}</span></h3>
        <p class="hd-s rt-hs">${this.esc(H.s)}</p></div>
      <div class="rt-root"></div></section>`;
  },
  mount(root) {
    const sec = root && root.querySelector('.rt-bw'); if (!sec) return;
    if (!this.ready) { this._queued.push(root); return; }
    this.bookDecks = this.bookDecks.filter(d => { if (!document.body.contains(d.root)) { d.destroy(); return false; } return true; });
    const H = this.data.head[this.L()];
    sec.querySelector('.rt-h').textContent = H.t; sec.querySelector('.rt-hs').textContent = H.s;
    this.fitHead(sec);
    const cards = this.cards(sec.dataset.rtBook);
    if (!cards.length) { sec.remove(); return; }
    this.bookDecks.push(this.deck(sec.querySelector('.rt-root'), cards));
  },
  refitAll() {
    [this.homeDeck, ...this.bookDecks].forEach(d => { if (d && document.body.contains(d.root)) d.refit(); });
    document.querySelectorAll('#rtHome, .rt-bw').forEach(h => this.fitHead(h));
  },
  /* the section's heading on one line, whole — never cut short with "…" */
  fitHead(host) {
    const go = () => { const h = host.querySelector('.rt-h'), sub = host.querySelector('.rt-hs');
      if (h) RUTUJA.fitOne(h, 0.72); if (sub) { sub.style.whiteSpace = 'nowrap'; RUTUJA.fitOne(sub, 0.78); } };
    requestAnimationFrame(go); (RUTUJA.fontsReady || Promise.resolve()).then(() => requestAnimationFrame(go)).catch(() => {});
  },

  /* one line, with a single natural break kept in reserve for narrow
     phones: at "—", "·", ";" or "," — or else at the word nearest the
     middle. fitCard uses it only when the line cannot fit as one. */
  two(t) {
    const x = this.esc(t); let k = -1;
    [' — ', ' · ', '; ', ', '].some(sep => { const i = x.indexOf(sep); if (i > 0) { k = i + sep.length; return true; } return false; });
    if (k < 0) { const words = x.split(' ');
      if (words.length > 3) { let n = 0, mid = x.length / 2, best = 0, acc = 0;
        words.forEach((w, i) => { acc += w.length + 1; if (Math.abs(acc - mid) < Math.abs(best - mid)) { best = acc; n = i + 1; } });
        k = words.slice(0, n).join(' ').length + 1; } }
    return k > 0 ? `<span class="c1">${x.slice(0, k)}</span><span class="cs"></span><span class="c2">${x.slice(k)}</span>` : x;
  },

  /* ---------- one card ---------- */
  card(c) {
    const L = this.L(), w = c[L] || {}, e = v => this.esc(v);
    /* {word} = added or changed (rose), ~word~ = removed (struck) */
    const mark = t => e(t).replace(/\{([^}]+)\}/g, '<mark>$1</mark>').replace(/~([^~]+)~/g, '<del>$1</del>');
    const d = v => `style="--d:${v.toFixed(2)}s"`;
    const head = `<header class="rt-hd"><h3 class="rt-t rt-one">${e(w.t)}</h3>${
      w.acc ? `<p class="rt-accw"><span class="rt-acc rt-one">${e(w.acc)}</span></p>` : ''}${w.s ? `<p class="rt-s rt-one">${e(w.s)}</p>` : ''}</header>`;
    const foot2 = w.fa ? `<div class="rt-foot"><p class="rt-fa rt-one">${e(w.fa)}</p>${w.ft ? `<p class="rt-ft rt-one">${e(w.ft)}</p>` : ''}</div>` : '';
    const q = (w.q || []).length ? `<div class="rt-q">${w.q.map(x => `<p class="rt-close rt-one">${e(x)}</p>`).join('')}</div>` : '';
    let body = '', end = '';
    if (c.type === 'rights') {
      body = `<div class="rt-covers">${(c.covers || []).map((cv, i) => `
          <figure class="rt-cv" ${d(0.25 + i * 0.12)}>
            <img src="assets/img/books/${e(cv.img)}" alt="" loading="lazy" decoding="async" width="1240" height="1754">
            ${(w.names || [])[i] ? `<figcaption class="rt-bn rt-one can-split">${this.two(w.names[i])}</figcaption>` : ''}
            <span class="rt-reg"><i class="rt-one">${e(((w.regs || [])[i] || [])[0] || '')}</i><b class="rt-one">${e(((w.regs || [])[i] || [])[1] || '')}</b></span></figure>`).join('')}</div>
        <ul class="rt-facts">${(w.rows || []).map((r, i) => `<li class="rt-fr" ${d(0.6 + i * 0.12)}><span class="rt-fk rt-one">${e(r[0])}</span><span class="rt-fv rt-one">${e(r[1])}</span></li>`).join('')}</ul>
        <div class="rt-who">${(w.who || []).map((p, i) => `<p class="rt-wl" ${d(1.0 + i * 0.12)}><i class="rt-one">${e(p[0])}</i><b class="rt-one">${e(p[1])}</b></p>`).join('')}</div>`;
      end = this.close(w);
    } else if (c.type === 'changes') {
      /* each change: a gold tag and its caption; a long caption may break
         only at its first "·", into two neat lines (fitCard decides) */
      body = `<ol class="rt-rows">${(w.rows || []).map((r, i) => { const k = r[1].indexOf(' · ');
          const cap = k > 0 ? `<span class="c1">${mark(r[1].slice(0, k))}</span><span class="cs"> · </span><span class="c2">${mark(r[1].slice(k + 3))}</span>` : mark(r[1]);
          return `<li class="rt-row" ${d(0.25 + i * 0.18)}><span class="rt-tag">${e(r[0])}</span><span class="rt-cap rt-one${k > 0 ? ' can-split' : ''}">${cap}</span></li>`; }).join('')}</ol>
        <ul class="rt-points rt-pts3">${(w.points || []).map((p, i) => `<li class="rt-pt rt-one" ${d(0.85 + i * 0.12)}>${e(p)}</li>`).join('')}</ul>`;
      end = `<footer class="rt-end">${q}${foot2}</footer>`;
    } else if (c.type === 'story') {
      const steps = (w.steps || []).map((st, i) => {
        const txt = Array.isArray(st) ? st[0] : st, note = Array.isArray(st) ? st[1] : '';
        const extra = i === 1 ? `<span class="rt-cal" aria-hidden="true">${'<i></i>'.repeat(8)}</span>`
                    : i === 2 ? `<span class="rt-two" aria-hidden="true"><i>👤</i><i>👤</i></span>` : '';
        return `<li class="rt-st${i === 1 ? ' is-time' : ''}" ${d(0.45 + i * 0.2)}><span class="rt-n">${i + 1}</span><span class="rt-stt rt-one">${
          i === 1 ? '⏱ ' : ''}${e(txt)}</span>${note ? `<span class="rt-sb rt-one">(${e(note)})</span>` : ''}${extra}</li>`; }).join('');
      body = `<ol class="rt-time">${steps}</ol>${w.line ? `<p class="rt-line rt-one can-split" ${d(1.6)}>${this.two(w.line)}</p>` : ''}`;
      end = `<footer class="rt-end">${q}${w.note ? `<p class="rt-note rt-one can-split">${this.two(w.note)}</p>` : ''}</footer>`;
    } else if (c.type === 'clip') {
      body = `<button type="button" class="rt-clip" data-full="${e(c.img)}" aria-label="${e(this.t('read'))}">
          <img src="assets/img/rights/${e(c.cardimg || c.img + '-card')}.webp" srcset="assets/img/rights/${e(c.cardimg || c.img + '-card')}.webp 1x, assets/img/rights/${e(c.cardimg || c.img + '-card')}@2x.webp 2x"
               alt="${e(w.s)}" width="${c.imgw || 450}" height="${c.imgh || 200}" decoding="async"></button>
        ${w.know ? `<div class="rt-know"><p class="rt-kh rt-one">⚖️ ${e(w.know[0])}</p><p class="rt-kt rt-one can-split">${this.two(w.know[1])}</p></div>` : ''}
        <button type="button" class="rt-read" data-full="${e(c.img)}" data-alt="${e(w.s)}">${e(this.t('read'))}</button>`;
      end = `<footer class="rt-end">${foot2}</footer>`;
    } else if (c.type === 'reader') {
      body = `<div class="rt-chain">${(w.chain || []).map((s, i) => `${i ? `<i class="rt-arw" ${d(0.35 + i * 0.2)} aria-hidden="true">→</i>` : ''}
          <span class="rt-ch" ${d(0.25 + i * 0.2)}><b aria-hidden="true">${s[0]}</b><em class="rt-one">${e(s[1])}</em></span>`).join('')}</div>
        ${(w.checks || []).length ? `<ul class="rt-checks">${w.checks.map((x, i) => `<li class="rt-ck rt-one" ${d(0.85 + i * 0.12)}>${e(x)}</li>`).join('')}</ul>` : ''}
        ${w.isbn ? `<p class="rt-isbn rt-one" ${d(1.3)}>${e(w.isbn)}</p>` : ''}`;
      end = this.close(w);
    }
    return `<article class="rt-card rt-c-${c.type}" data-key="${e(c.key)}" lang="${L}"
      style="--g1:${e(c.tone[0])};--g2:${e(c.tone[1])}">${head}<div class="rt-body">${body}</div>${end}</article>`;
  },
  close(w) {
    const e = v => this.esc(v);
    return `<footer class="rt-end">${w.close ? `<p class="rt-close rt-one">${e(w.close)}</p>` : ''}${w.close2 ? `<p class="rt-close2 rt-one">${e(w.close2)}</p>` : ''}${
      w.note ? `<p class="rt-note rt-one can-split">${this.two(w.note)}</p>` : ''}</footer>`;
  },

  /* ---------- a deck: Section 5's behaviour ---------- */
  deck(root, cards) {
    const self = this, many = cards.length > 1;
    root.innerHTML = `<div class="rt-stage${many ? '' : ' is-one'}"><div class="rt-deck">${cards.map(c => this.card(c)).join('')}</div>
      ${many ? `<button type="button" class="rt-arrow rt-prev" aria-label="prev"></button><button type="button" class="rt-arrow rt-next" aria-label="next"></button>` : ''}</div>
      ${many ? `<div class="rt-dots">${cards.map((c, i) => `<button type="button" class="rt-dot" aria-label="${i + 1}" style="--secs:${c.seconds || 6}s"></button>`).join('')}</div>` : ''}`;
    const deckEl = root.querySelector('.rt-deck'), els = [...root.querySelectorAll('.rt-card')], dots = [...root.querySelectorAll('.rt-dot')];
    const D = { root, i: 0, timer: 0, held: false, seen: false, io: null };
    const busy = () => D.held || !D.seen || document.hidden || RUTUJA._scrolling || RUTUJA._watching || RUTUJA._winOpen || RUTUJA._pressing;
    const show = n => {
      D.i = (n + els.length) % els.length;
      D.fitOne(els[D.i]);
      if (els.length > 1) setTimeout(() => D.fitOne(els[(D.i + 1) % els.length]), 400);   /* the next one, while this one reads */
      els.forEach((el, k) => el.classList.toggle('on', k === D.i));
      dots.forEach((d, k) => { d.classList.toggle('on', k === D.i); d.classList.remove('run'); });
      const dt = dots[D.i]; if (dt) requestAnimationFrame(() => requestAnimationFrame(() => { if (dots[D.i] === dt) dt.classList.add('run'); }));
      try { RUTUJA.turn(); } catch (e) {}
      plan();
    };
    const plan = () => {
      clearTimeout(D.timer); if (!many) return;
      const secs = (cards[D.i].seconds || 6) * 1000;
      D.timer = setTimeout(function tick() { if (busy()) { D.timer = setTimeout(tick, 700); return; } show(D.i + 1); }, secs);
    };
    /* Fitting a card costs several layout passes, so only the card being
       shown is fitted (and the next one, just before it arrives). The rest
       are marked stale and fitted when their turn comes. */
    D.fitOne = el => { if (!el) return; const tag = root.clientWidth + '|' + self.L(); if (el.dataset.fitTag === tag) return;
      self.fitCard(el); el.dataset.fitTag = tag; };
    D.refit = () => {
      deckEl.style.height = self.deckH() + 'px';
      els.forEach(el => { el.dataset.fitTag = ''; });
      D.fitOne(els[D.i]); D.fitOne(els[(D.i + 1) % els.length]);
    };
    D.destroy = () => { clearTimeout(D.timer); if (D.io) D.io.disconnect(); };
    /* controls: arrows, dots, swipe, tap to hold, tap a clipping to read it */
    root.addEventListener('click', ev => {
      const clip = ev.target.closest('.rt-clip, .rt-read');
      if (clip) { ev.preventDefault(); self.view(clip.dataset.full, clip.dataset.alt || (clip.querySelector('img') || {}).alt || ''); return; }
      if (ev.target.closest('.rt-prev')) { show(D.i - 1); return; }
      if (ev.target.closest('.rt-next')) { show(D.i + 1); return; }
      const dot = ev.target.closest('.rt-dot'); if (dot) { show(dots.indexOf(dot)); return; }
      if (ev.target.closest('.rt-card')) {
        if (Date.now() - (RUTUJA._pressAt || 0) > 250) return;   /* a reading hold, not a tap */
        D.held = !D.held; root.classList.toggle('held', D.held); if (!D.held) plan();
      }
    });
    let sx = null, sy = 0;
    deckEl.addEventListener('pointerdown', ev => { sx = ev.clientX; sy = ev.clientY; }, { passive: true });
    deckEl.addEventListener('pointerup', ev => {
      if (sx === null || !many) return; const dx = ev.clientX - sx, dy = ev.clientY - sy; sx = null;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.4) show(D.i + (dx < 0 ? 1 : -1));
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      let first = true;
      D.io = new IntersectionObserver(es => es.forEach(x => {
        D.seen = x.isIntersecting; root.classList.toggle('seen', D.seen);
        if (D.seen && first) { first = false; requestAnimationFrame(() => D.refit()); }   /* fitted again the first time it is seen */
      }), { threshold: 0.35 });
      D.io.observe(root);
    } else D.seen = true;
    D.refit();
    /* the fonts the cards use are asked for explicitly, and the cards fitted
       again once they are in — English cards use Lora, which the rest of the
       page may not have requested yet */
    if (document.fonts && document.fonts.load) {
      Promise.all(['700 16px "Baloo 2"', '600 16px Mukta', '700 16px Mukta', '600 16px Lora', 'italic 400 16px Lora']
        .map(f => document.fonts.load(f).catch(() => null))).then(() => requestAnimationFrame(() => D.refit()));
    }
    /* a card whose image arrives later is fitted again */
    els.forEach(el => el.querySelectorAll('img').forEach(im => { if (!im.complete) im.addEventListener('load', () => self.fitCard(el), { once: true }); }));
    (RUTUJA.fontsReady || Promise.resolve()).then(() => requestAnimationFrame(() => D.refit())).catch(() => {});
    if ('ResizeObserver' in window) { let last = 0; new ResizeObserver(() => { const w = root.clientWidth; if (w && w !== last) { last = w; D.refit(); } }).observe(root); }
    show(0);
    return D;
  },

  /* every title, label and step on one line; the whole card is then
     scaled down (never below 82%) if its content is taller than the deck */
  fitCard(el) {
    /* The card is sized to the deck in one estimate and a few checks, not by
       creeping in small steps: measuring costs a layout pass each time, and
       this runs for every card in every book window.
       Grown to at most 140%, shrunk to no less than 82%; every title, label
       and step on one line; the height left over shared between the parts
       and then verified. */
    if (!el.clientWidth) return;
    const body = el.querySelector('.rt-body');
    const set = v => el.style.setProperty('--rs', v.toFixed(3));
    const ones = [...el.querySelectorAll('.rt-one')];
    const lineOver = x => { const cs = getComputedStyle(x); const room = x.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      const r = document.createRange(); r.selectNodeContents(x); return r.getBoundingClientRect().width > room + 1; };
    const wide = () => ones.some(x => x.offsetWidth && lineOver(x)) || [...el.querySelectorAll('.rt-chain, .rt-covers')].some(x => x.scrollWidth > x.clientWidth + 1);
    const splitCaps = () => el.querySelectorAll('.can-split').forEach(x => {
      x.classList.remove('split'); x.style.fontSize = '';
      const r = document.createRange(); r.selectNodeContents(x); const need = r.getBoundingClientRect().width;
      if (x.clientWidth && need > 0 && x.clientWidth / need < 0.82) x.classList.add('split'); });
    const fitLines = () => {
      ones.forEach(x => { x.style.fontSize = ''; }); ones.forEach(x => RUTUJA.fitOne(x, 0.72));
      [[...el.querySelectorAll('.rt-cap')], [...el.querySelectorAll('.rt-stt')]].forEach(ps => { if (ps.length < 2) return;
        const m = Math.min(...ps.map(p => parseFloat(getComputedStyle(p).fontSize))); ps.forEach(p => { p.style.fontSize = m + 'px'; }); });
      el.querySelectorAll('.rt-q').forEach(g => { const ps = [...g.children]; if (ps.length < 2) return;
        const m = Math.min(...ps.map(p => parseFloat(getComputedStyle(p).fontSize))); ps.forEach(p => { p.style.fontSize = m + 'px'; }); });
    };
    const natural = () => { const cs = getComputedStyle(el);
      return [...el.children].reduce((a, x) => a + x.offsetHeight, 0) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom); };
    const fits = () => el.scrollHeight <= el.clientHeight + 1;

    el.style.setProperty('--xg', '0px');
    ones.forEach(x => { x.style.fontSize = ''; });
    if (body) body.style.flex = '0 0 auto';
    let s = 1; set(s); splitCaps();
    /* one estimate from how much room the content needs at full size */
    const h = natural(), room = el.clientHeight;
    if (h > 0) s = Math.max(0.82, Math.min(1.4, 1 + (room - h) / h * 0.72));
    set(s); splitCaps(); fitLines();
    /* then at most three checks, in bigger steps */
    for (let k = 0; k < 3 && (wide() || !fits()) && s > 0.82; k++) { s = Math.max(0.82, s - 0.06); set(s); splitCaps(); fitLines(); }
    /* a line that still cannot fit, even split at its natural break, may
       wrap as a last resort — balanced, never mid-phrase if avoidable */
    el.querySelectorAll('.can-split, .rt-q .rt-close').forEach(x => { const over = x.offsetWidth && lineOver(x);
      x.classList.toggle('wrapok', !!over); if (over) x.style.fontSize = ''; });

    /* what height is left is shared between the card's parts, and verified */
    if (body) {
      const inner = [...el.querySelectorAll('.rt-time, .rt-rows, .rt-pts3, .rt-checks, .rt-facts')].reduce((a, g) => a + Math.max(0, g.children.length - 1) / 3, 0);
      const left = el.clientHeight - natural(), parts = Math.max(1, body.children.length) + inner;
      if (left > 0) {
        let g = Math.min(30, left / parts);
        el.style.setProperty('--xg', g.toFixed(1) + 'px');
        for (let k = 0; k < 4 && !fits() && g > 0.5; k++) { g *= 0.7; el.style.setProperty('--xg', g.toFixed(1) + 'px'); }
        if (!fits()) el.style.setProperty('--xg', '0px');
      }
      body.style.flex = '';
    }
  },




  /* ---------- the full newspaper record, tap to zoom ---------- */
  view(name, alt) {
    let v = document.getElementById('rtView');
    if (!v) {
      document.body.insertAdjacentHTML('beforeend', `<div class="rt-view" id="rtView" role="dialog" aria-modal="true">
        <div class="rt-vbar"><span class="rt-vhint"></span><button type="button" class="rt-vx" aria-label="close">&times;</button></div>
        <div class="rt-vbox"><img alt=""></div></div>`);
      v = document.getElementById('rtView');
      v.addEventListener('click', ev => {
        if (ev.target.closest('.rt-vx') || ev.target === v) { this.unview(); return; }
        if (ev.target.tagName === 'IMG') v.classList.toggle('zoom');
      });
      document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && v.classList.contains('open')) this.unview(); });
    }
    const img = v.querySelector('img');
    img.src = `assets/img/rights/${name}-full@2x.webp`; img.alt = alt || '';
    v.querySelector('.rt-vhint').textContent = this.t('zoom');
    v.classList.remove('zoom'); v.classList.add('open');
    document.documentElement.classList.add('win-open'); RUTUJA._winOpen = true;
    document.body.style.overflow = 'hidden';
    try { RUTUJA.pushWin(() => this.unview(true)); } catch (e) {}
  },
  unview(fromBack) {
    const v = document.getElementById('rtView'); if (!v || !v.classList.contains('open')) return;
    v.classList.remove('open', 'zoom'); document.body.style.overflow = '';
    const other = [...document.querySelectorAll('.modal')].some(m => !m.classList.contains('hidden'));
    if (!other) { document.documentElement.classList.remove('win-open'); RUTUJA._winOpen = false; }
    if (!fromBack) { try { RUTUJA.popWin(); } catch (e) {} }
  }
};

/* the homepage frame is placed at once, so nothing below it moves later;
   everything else starts once the site's own data has arrived */
try { RIGHTS.placeHome(); } catch (e) {}
(function wait() {
  if (typeof RUTUJA !== 'undefined' && RUTUJA.content && RUTUJA.text && RUTUJA.text.mr) { try { RIGHTS.init(); } catch (e) { console.error('rights init', e); } }
  else setTimeout(wait, 150);
})();
