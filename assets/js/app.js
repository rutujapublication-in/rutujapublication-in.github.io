/* ===================================================================
   RUTUJA PUBLICATION — APP
   Phase 5: language gate, routing, top strip, contact, footer.
   Phases 6-11 add their modules below without touching this core.
   =================================================================== */

const RUTUJA = {
  VERSION: 'v15c',
  lang: 'mr',
  text: {},
  locations: null,
  content: { books: [], offers: [], videos: [], ads: [], config: {} },
  config: {},

  /* ---- 1. BOOT ---- */
  async init() {
    this.bindGate();
    this.bindNav();
    this.bindMenu();
    this.bindLangToggle();

    try {
      const [t, l, c, s] = await Promise.all([
        fetch('data/sitetext.json?v=' + this.VERSION).then(r => r.json()),
        fetch('data/locations.json?v=' + this.VERSION).then(r => r.json()),
        fetch('data/content.json?v=' + this.VERSION).then(r => r.json()),
        fetch('data/story.json?v=' + this.VERSION).then(r => r.json()).catch(() => ({ slides: [] }))
      ]);
      this.text = t;
      this.locations = l;
      this.content = c;
      this.story = (s && s.slides) || [];
    } catch (e) {
      console.error('Data load failed', e);
    }

    this.config = this.defaultConfig();

    /* No right-click menu on images, on a laptop or a phone.
       Delegated, so it covers images added later too. */
    document.addEventListener('contextmenu', e => {
      if (e.target && e.target.tagName === 'IMG') e.preventDefault();
    });
    document.addEventListener('dragstart', e => {
      if (e.target && e.target.tagName === 'IMG') e.preventDefault();
    });

    BOOKS.init(this);
    MEDIA.init(this);
    STORY.init(this);
    CART.init(this);
    ORDERFORM.init(this);
    ORDER.init(this);
    PEEK.init(this);
    QA.init(this);
    PATH.init(this);
    NEEDHD.init(this);
    ENTRY.init(this);
  },

  /* ---- SETTINGS YOU CAN CHANGE ---- */
  settings: {
    // Paste your Apps Script Web App URL between the quotes.
    backendUrl: 'https://script.google.com/macros/s/AKfycby_7sZkLo0hjHhfSiZMS2yLN1WHM9KJ6rdUrNx4MJA3gL988u7bl9IC0xuNJXVGaiyI/exec',
    // 'soft' = visitor may browse first.  'hard' = must register to enter.
    gateMode: 'soft'
  },

  /* Config is hard-coded until Phase 12 wires the Google Sheet. */
  defaultConfig() {
    return {
      whatsapp_number: '919373141263',
      phone_number: '9373141263',
      facebook_url: '',
      instagram_url: '',
      email: '',
      address_mr: 'पढेगाव, ता. श्रीरामपूर, जि. अहिल्यानगर, महाराष्ट्र',
      address_en: 'Padhegaon, Tal. Shrirampur, Dist. Ahilyanagar, Maharashtra',
      strip_mr: ['इयत्ता १ ते ५ ची पुस्तके उपलब्ध', 'मराठी · सेमी-इंग्रजी · इंग्रजी माध्यम', 'शाळांसाठी विशेष सवलत'],
      strip_en: ['Books for Std 1 to 5 available now', 'Marathi · Semi-English · English medium', 'Special discounts for schools']
    };
  },

  /* ---- 2. LANGUAGE ---- */
  bindGate() {
    document.querySelectorAll('.lang-btn').forEach(b => {
      b.addEventListener('click', () => this.setLang(b.dataset.lang));
    });
  },

  bindLangToggle() {
    document.getElementById('langToggle').addEventListener('click', () => {
      this.setLang(this.lang === 'mr' ? 'en' : 'mr');
    });
  },

  /* Labels in a named language, whatever the site is currently showing.
     The sheet must always read English; WhatsApp must always read Marathi. */
  tIn(lang, key) {
    const d = this.text && this.text[lang];
    return (d && d[key]) || this.t(key);
  },

  /* Option values are stored as name_en everywhere, so English needs no
     lookup. This turns those stored values into Marathi for WhatsApp. */
  placeIn(lang, stateEn, distEn, talEn) {
    const L = this.locations || {};
    if (lang !== 'mr') return { state: stateEn || '', district: distEn || '', taluka: talEn || '' };
    const mh = L.maharashtra || {};
    let st = stateEn, di = distEn, ta = talEn;
    if (stateEn === 'Maharashtra') {
      st = mh.name_mr || stateEn;
      const d = (mh.districts || []).find(x => x.name_en === distEn);
      if (d) {
        di = d.name_mr || distEn;
        const t = (d.talukas || []).find(x => x.name_en === talEn);
        if (t) ta = t.name_mr || talEn;
      }
    } else {
      const o = (L.other_states || []).find(x => x.name_en === stateEn);
      if (o) st = o.name_mr || stateEn;
    }
    return { state: st || '', district: di || '', taluka: ta || '' };
  },

  setLang(lang, silent) {
    this.lang = lang;
    localStorage.setItem('rutuja_lang', lang);
    document.documentElement.lang = lang;
    document.getElementById('langLabel').textContent = lang === 'mr' ? 'English' : 'मराठी';

    /* The tap used to trigger twelve section re-renders in one blocking
       pass — the books grid, the nine slides, the carousels — whether or
       not any of it was on screen. Labels and the section in front of the
       visitor now go first; the rest follows a frame later. */
    this.paintLabels();
    this.paintWinLang();
    const now = this.visibleSections();
    this.paintSections(now);

    requestAnimationFrame(() => {
      try { this.paintSections(null, now); } catch (e) { console.error('deferred paint', e); }
      try { ENTRY.repaint(); } catch (e) {}
    });
    if (!silent) window.scrollTo(0, 0);
  },

  /* Leaves the entry screen and reveals the website. */
  /* There is no welcome screen any more — the site is what a visitor
     lands on. Kept as a helper for anything that still asks to enter. */
  enterSite(to) {
    document.getElementById('site').classList.remove('hidden');
    document.body.style.overflow = '';
    if (to) this.go(to); else window.scrollTo(0, 0);
  },

  t(key) {
    const d = this.text[this.lang];
    return (d && d[key]) || this.extra(key) || '';
  },

  /* Keys not in the SiteText sheet yet. Moved to the sheet in Phase 12. */
  extra(key) {
    const x = {
      mr: {
        pub_name: 'ऋतुजा पब्लिकेशन',
        brand_tag: 'इयत्ता १ ते ५',
        hero_title: 'मुलांच्या शिक्षणासाठी विश्वासाची पुस्तके',
        hero_sub: 'इयत्ता १ ते ५ साठी मराठी, सेमी-इंग्रजी आणि इंग्रजी माध्यमाची पुस्तके',
        std_label: 'इयत्ता'
      },
      en: {
        pub_name: 'Rutuja Publication',
        brand_tag: 'Std 1 to 5',
        hero_title: 'Books families trust for the early years',
        hero_sub: 'Std 1 to 5 in Marathi, Semi-English and English medium',
        std_label: 'Standard'
      }
    };
    return x[this.lang][key];
  },

  /* Book, ad, experience and news images all follow one rule:
     name.webp is the 1x file, name@2x.webp is the retina file if present. */
  img(folder, file, cls, alt) {
    if (!file) return '';
    const dot = file.lastIndexOf('.');
    const x2 = dot > 0 ? file.slice(0, dot) + '@2x' + file.slice(dot) : file;
    const a = (alt || '').replace(/"/g, '&quot;');
    return `<img src="assets/img/${folder}/${file}"
      srcset="assets/img/${folder}/${file} 1x, assets/img/${folder}/${x2} 2x"
      onerror="this.removeAttribute('srcset')"
      alt="${a}" decoding="async" loading="lazy"${cls ? ` class="${cls}"` : ''}>`;
  },

  /* ---- 3. RENDER ---- */
  paint() {
    this.paintLabels();
    this.paintSections();
  },

  /* Every label on the page, in one cheap sweep. */
  paintLabels() {
    document.querySelectorAll('[data-t]').forEach(el => {
      const v = this.t(el.dataset.t);
      if (v) el.textContent = v;
    });
  },

  /* Which sections the visitor can actually see right now. Repainting
     these first keeps a language tap feeling immediate; everything else
     can catch up a frame later without anyone noticing. */
  visibleSections() {
    const open = id => {
      const el = document.getElementById(id);
      return el && !el.classList.contains('hidden');
    };
    if (open('order')) return ['order'];
    if (open('modal') || open('sheet')) return [];
    const byPage = {
      home:    ['strip', 'standards', 'offers', 'explore', 'story', 'footer'],
      books:   ['books'], book: ['books'],
      cart:    ['cart'], qa: ['qa'], contact: ['contact'],
      media:   ['media'], offers: ['offers']
    };
    return byPage[this.page || 'home'] || [];
  },

  /* `only` renders just those sections; `skip` renders all but those. */
  paintSections(only, skip) {
    // Each section is isolated: if one fails, the rest of the site still renders.
    [['strip', () => this.paintStrip()],
     ['standards', () => this.paintStandards()],
     ['offers', () => this.paintOffers()],
     ['explore', () => this.paintExplore()],
     ['books', () => BOOKS.paint()],
     ['story', () => STORY.paint()],
     ['media', () => MEDIA.paint()],
     ['cart', () => CART.render()],
     ['order', () => {
       /* redraw the open order window too, or the picker and the whole
          summary keep the language they were opened in */
       const w = document.getElementById('order');
       if (w && !w.classList.contains('hidden')) ORDER.draw();
     }],
     ['contact', () => this.paintContact()],
     ['qa', () => QA.paint()],
     ['footer', () => this.paintFooter()]
    ].forEach(([name, fn]) => {
      if (only && only.indexOf(name) < 0) return;
      if (skip && skip.indexOf(name) >= 0) return;
      try { fn(); } catch (e) { console.error('Section failed:', name, e); }
    });
  },

  paintStrip() {
    const items = this.lang === 'mr' ? this.config.strip_mr : this.config.strip_en;
    const html = items.map(i => `<span class="strip-item">${i}</span>`).join('');
    document.getElementById('stripTrack').innerHTML = html + html;
  },

  /* Marathi uses proper ordinals: १ ली, २ री, ३ री, ४ थी, ५ वी.
     Showing a bare digit next to the word इयत्ता reads as broken Marathi. */
  paintStandards() {
    const mr = this.lang === 'mr';
    const digit = ['१','२','३','४','५'];
    const ord   = mr ? ['ली','री','री','थी','वी'] : ['st','nd','rd','th','th'];
    const label = this.extra('std_label');
    const books = (this.content.books || []).filter(b => b.status === 'LIVE');

    document.getElementById('stdGrid').innerHTML = [1,2,3,4,5].map((n, i) => {
      const mine = books.filter(b =>
        String(b.standard || '').split(',').map(x => x.trim()).includes(String(n)));
      const list = mine.map(b =>
        `<li>${mr ? b.name_mr : b.name_en}</li>`).join('');
      return `
      <button class="std-card" style="--c:var(--std${n})" data-std="${n}">
        <span class="std-left">
          <span class="std-top">${label}</span>
          <span class="std-figure">
            <span class="std-num">${mr ? digit[i] : n}</span>
            <span class="std-ord">${ord[i]}</span>
          </span>
        </span>
        <ul class="std-mid">${list}</ul>
        <span class="std-right">
          <span class="std-count">${mine.length}<br>${this.t('std_books_count')}</span>
          <span class="std-go">${this.t('std_open')}<i class="std-arrow">&rarr;</i></span>
        </span>
      </button>`;
    }).join('');

    document.querySelectorAll('.std-card').forEach(c => {
      c.addEventListener('click', () => {
        sessionStorage.setItem('rutuja_filter_std', c.dataset.std);
        this.go('books');
      });
    });
  },

  paintExplore() {
    const box = document.getElementById('exploreGrid');
    if (!box) return;
    const items = [
      ['books','nav_books','ex_books','&#128218;'],
      ['videos','nav_videos','ex_videos','&#9654;'],
      ['experiences','nav_experiences','ex_exp','&#128172;'],
      ['offers','nav_offers','ex_offers','&#127991;'],
      ['qa','nav_qa','ex_qa','&#10068;'],
      ['authors','nav_authors','ex_authors','&#9998;'],
      ['about','nav_publication','ex_about','&#127968;'],
      ['contact','nav_contact','ex_contact','&#128241;']
    ];
    box.innerHTML = items.map(([page, t, d, ico]) => `
      <button class="ex-card" data-nav="${page}">
        <span class="ex-ico">${ico}</span>
        <span class="ex-body">
          <span class="ex-t">${this.t(t)}</span>
          <span class="ex-d">${this.t(d)}</span>
        </span>
        <span class="ex-arrow">&rarr;</span>
      </button>`).join('');
    box.querySelectorAll('[data-nav]').forEach(b =>
      b.addEventListener('click', () => this.go(b.dataset.nav)));
  },

  paintOffers() {
    const list = [
      { k: 'school', t: 'offer_school_t', d: 'offer_school_d' },
      { k: 'bulk',   t: 'offer_bulk_t',   d: 'offer_bulk_d' },
      { k: 'retail', t: 'offer_retail_t', d: 'offer_retail_d' },
      { k: 'parent', t: 'offer_parent_t', d: 'offer_parent_d' }
    ];
    const html = list.map(o => `
      <button class="offer-card" data-offer="${o.k}">
        <span class="offer-t">${this.t(o.t)}</span>
        <span class="offer-d">${this.t(o.d)}</span>
        <span class="offer-go">${this.t('offer_cta')} &rarr;</span>
      </button>`).join('')
      /* Not an offer, so it sits below the four and says so. */
      + `<button class="offer-card offer-qa" data-nav="qa">
        <span class="offer-t"><i class="offer-mark" aria-hidden="true"></i>${this.t('qa_card_t')}</span>
        <span class="offer-d">${this.t('qa_card_d')}</span>
        <span class="offer-go">${this.t('qa_card_go')} &rarr;</span>
      </button>`;
    ['offerGrid', 'offerGrid2'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = html;
      const q = el.querySelector('.offer-qa');
      if (q) q.addEventListener('click', e => { e.preventDefault(); this.go('qa'); });
    });
  },

  paintContact() {
    const c = this.config;
    const rows = [
      { k: 'contact_whatsapp', v: c.phone_number, i: '💬', u: this.wa() },
      { k: 'contact_call',     v: c.phone_number, i: '📞', u: c.phone_number ? 'tel:' + c.phone_number : '' },
      { k: 'contact_facebook', v: 'Facebook',     i: 'f',  u: c.facebook_url },
      { k: 'contact_instagram',v: 'Instagram',    i: '◙',  u: c.instagram_url },
      { k: 'contact_email',    v: c.email,        i: '✉',  u: c.email ? 'mailto:' + c.email : '' }
    ];
    document.getElementById('contactGrid').innerHTML = rows.map(r => {
      const tag = r.u ? 'a' : 'div';
      const href = r.u ? ` href="${r.u}" target="_blank" rel="noopener"` : '';
      return `<${tag} class="contact-card"${href}>
          <div class="contact-ico">${r.i}</div>
          <div><div class="contact-t">${this.t(r.k)}</div>
          <div class="contact-v">${r.v || '—'}</div></div>
        </${tag}>`;
    }).join('');
  },

  paintFooter() {
    document.getElementById('year').textContent = new Date().getFullYear();
    const vb = document.getElementById('verBadge');
    if (vb) vb.textContent = this.VERSION;
    document.getElementById('footerAddr').textContent =
      this.lang === 'mr' ? this.config.address_mr : this.config.address_en;
    this.waFloat();
    this.paintWinLang();
  },

  /* Every window that covers the header carries its own language switch,
     because the ribbon one is not reachable while a window is open. */
  paintWinLang() {
    document.querySelectorAll('[data-winlang]').forEach(b => {
      b.textContent = this.t('win_lang');
      if (!b.dataset.bound) {
        b.dataset.bound = '1';
        b.addEventListener('click', () => {
          const next = this.lang === 'mr' ? 'en' : 'mr';
          /* setLang now paints the visible section first and defers the
             rest, so the tap can be answered straight away */
          b.textContent = next === 'mr' ? 'English' : 'मराठी';
          this.setLang(next, true);
        });
      }
    });
  },

  /* The float used to send the same anonymous line from every page.
     It now carries where the person actually was, so the reply can
     start from the book they were reading. */
  waFloat() {
    const w = document.getElementById('waFloat');
    if (!w) return;
    let key = 'wa_general', extra = '';
    const p = this.page || 'home';
    if (p === 'book' && BOOKS && BOOKS.current) {
      const b = (this.content.books || []).find(x => x.book_id === BOOKS.current);
      /* the message itself is always Marathi, so the book name in it is too */
      if (b) { key = 'wa_book'; extra = b.name_mr || b.name_en; }
    } else if (p === 'offers') key = 'wa_school';
    else if (p === 'qa')      key = 'wa_qa';
    const link = this.wa(key, extra, 'mr');
    if (link) { w.href = link; w.classList.remove('hidden'); }
    else { w.classList.add('hidden'); }
  },

  /* Builds a WhatsApp deep link with a pre-filled message (Phase 11 extends this). */
  wa(msgKey, extra, lang) {
    const n = this.config.whatsapp_number;
    if (!n) return '';
    let m = lang ? this.tIn(lang, msgKey || 'wa_general') : this.t(msgKey || 'wa_general');
    if (extra) m += ' ' + extra;
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(m);
  },

  /* ---- 4. ROUTING ---- */
  bindNav() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); this.go(el.dataset.nav); });
    });
    window.addEventListener('hashchange', () => this.go(location.hash.slice(1) || 'home', true));

    /* Back used to leave the site while a window was open, because only
       the hash was tracked. Each window now adds a history entry, and
       Back closes that window instead of navigating away. */
    window.addEventListener('popstate', () => {
      if (!this.winStack.length) return;
      const w = this.winStack.pop();
      try { w.close(); } catch (e) { console.error('close win', e); }
    });
  },

  winStack: [],

  /* Called by every window that covers the page. */
  pushWin(closeFn) {
    this.winStack.push({ close: closeFn });
    try { history.pushState({ win: this.winStack.length }, ''); } catch (e) {}
  },
  /* Called when a window is closed by its own X, so the stack stays true. */
  popWin() {
    if (!this.winStack.length) return;
    this.winStack.pop();
    try { history.back(); } catch (e) {}
  },

  go(page, fromHash) {
    const target = document.getElementById('page-' + page);
    if (!target) return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    target.classList.add('active');
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === page));
    document.getElementById('nav').classList.remove('open');
    if (!fromHash) location.hash = page;
    this.page = page;
    try { QA.onPage(page); } catch (e) { console.error('QA page', e); }
    this.waFloat();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  bindMenu() {
    const btn = document.getElementById('menuBtn');
    const nav = document.getElementById('nav');
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Tapping a destination closes the menu
    nav.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('is-open');
    });
  }
};

console.log('%cRutuja site ' + RUTUJA.VERSION + ' loaded', 'color:#1A4D2E;font-weight:bold');
document.addEventListener('DOMContentLoaded', () => {
  RUTUJA.init().catch(e => {
    console.error('Boot failed', e);

    document.getElementById('site')?.classList.remove('hidden');
  });
});



/* ===================================================================
   SCREEN 1 — WELCOME, and the registration form it opens.
   Screen 2 is the website itself.
   =================================================================== */

const ENTRY = {
  app: null,
  where: 'sheet',    // 'sheet' on the welcome screen, 'modal' once inside the site
  offerKey: '',

  init(app) {
    this.app = app;

    document.getElementById('modalX').addEventListener('click', () => this.closeModal());

    // Anything with data-offer reopens the form, framed for that audience.
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-offer]');
      if (b) { e.preventDefault(); this.openModal(b.dataset.offer); }
    });

    FORM.build(app, this);

    app.setLang(localStorage.getItem('rutuja_lang') || 'mr', true);

    /* No welcome screen and no gate — every visitor lands on the site.
       This previously hid #site and locked scrolling until the gate was
       passed, which with the gate removed would leave a blank page. */
    app.enterSite();

  },

  done() { return !!localStorage.getItem('rutuja_reg'); },

  repaint() {
    document.querySelectorAll('.pill').forEach(p =>
      p.classList.toggle('on', p.dataset.lang === this.app.lang));
    const h = document.getElementById('formHead');
    if (h) h.textContent = this.app.t('entry_form_head');
    FORM.repaint();
  },

  /* ---- SHEET (welcome screen) ---- */
  /* ---- MODAL (inside the site) ---- */
  openModal(key) {
    const t = k => this.app.t(k);
    const heads = { school: 'form_head_school', bulk: 'form_head_bulk',
                    retail: 'form_head_retail', parent: 'form_head_parent' };

    this.where = 'modal';
    this.offerKey = key === 'default' ? '' : key;
    const reg = this.done();
    this.app.pushWin(() => this.closeModal(true));

    const subs = { school: 'offer_school_d', bulk: 'offer_bulk_d',
                   retail: 'offer_retail_d', parent: 'offer_parent_d' };
    document.getElementById('modalHead').textContent = t(heads[key] || 'form_head_default');
    const hs = document.getElementById('modalHeadSub');
    if (hs) hs.textContent = subs[key] ? t(subs[key]) : t('form_sub_offer');
    document.getElementById('modalBody').classList.remove('hidden');
    document.getElementById('modalDone').classList.add('hidden');
    document.getElementById('modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const slot  = document.getElementById('modalSlot');
    const waBox = document.getElementById('modalWa');
    const sub   = document.getElementById('modalSub');

    if (reg) {
      /* Already registered. Asking again wastes their time, so the
         window carries the answers and a way to talk instead. */
      slot.classList.add('hidden');
      const mp = document.getElementById('modalPrefill');
      if (mp) mp.classList.add('hidden');
      if (sub) sub.classList.add('hidden');
      document.getElementById('modalFormHd').classList.add('hidden');
      waBox.classList.remove('hidden');
      const link = this.app.wa('wa_' + (key === 'school' ? 'school'
                              : key === 'retail' ? 'retailer' : 'general'), '', 'mr');
      const b = document.getElementById('modalWaBtn');
      if (link) { b.href = link; b.classList.remove('hidden'); }
      else { b.classList.add('hidden'); }
    } else {
      waBox.classList.add('hidden');
      slot.classList.remove('hidden');
      if (sub) sub.classList.remove('hidden');
      document.getElementById('modalFormHd').classList.remove('hidden');
      FORM.moveTo('modalSlot');
      FORM.reset();
      FORM.preset(key);
      FORM.repaint();
    }

    /* The questions sit below the form, matched to this button. */
    try { QA.forAudience(key); } catch (e) { console.error('QA modal', e); }
    const ptone = { school: 'green', bulk: 'gold', retail: 'blue', parent: 'violet' }[key] || 'gold';
    const pk = ['school', 'bulk', 'retail', 'parent'].indexOf(key) >= 0 ? key : '';
    const pswap = pk ? { st_m_q: 'st_m_q_' + pk, st_m_wa: 'st_m_wa_' + pk } : null;
    try { NEEDHD.set(key); } catch (e) { console.error('needhd', e); }
    try { PATH.draw('modalBody', 'modalPath', ptone, pswap); } catch (e) { console.error('path', e); }
  },

  closeModal(fromBack) {
    document.getElementById('modal').classList.add('hidden');
    document.body.style.overflow = '';
    try { QA.forAudience(''); } catch (e) {}
    if (!fromBack) this.app.popWin();
  },

  /* The details go to the sheet, and the same details are handed to
     WhatsApp so they arrive there too. The window is no longer closed
     on a timer, because the person needs time to press send. */
  regMessage(regId) {
    /* Always Marathi on WhatsApp, whatever language the form was in. */
    const t = k => this.app.tIn('mr', k);
    const p = this.lastReg || {};
    const cat = p.category ? t('cat_' + p.category) : '';
    const L = this.app.placeIn('mr', p.state, p.district, p.taluka);
    const place = [p.village_city, L.taluka, L.district].filter(Boolean).join(', ');
    const lines = [t('wa_register'), '', t('wa_reg_id') + ': ' + regId];
    if (p.name) lines.push(t('wa_reg_name') + ': ' + p.name);
    if (cat)    lines.push(t('wa_reg_who') + ': ' + cat);
    if (place)  lines.push(t('wa_reg_place') + ': ' + place);
    const num = (this.app.config.phone_number || '').replace(/\D/g, '');
    if (!num) return '';
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(lines.join('\n'));
  },

  onSubmitted(regId) {
    const link = this.regMessage(regId);

    document.getElementById('regId2').textContent = regId;
    document.getElementById('modalBody').classList.add('hidden');
    document.getElementById('modalDone').classList.remove('hidden');

    const btn = document.getElementById('modalWaBtn2');
    if (btn) {
      if (link) { btn.href = link; btn.classList.remove('hidden'); }
      else { btn.classList.add('hidden'); }
    }
    /* Hand off immediately if the browser allows it. If the gesture was
       spent on the await, the button above still works. */
    if (link) { try { window.open(link, '_blank'); } catch (e) {} }
  },

  /* The skip link inside the form. */
  onSkipped() {
    this.closeModal();
  }
};


/* ===================================================================
   THE FORM — one instance, moved between the welcome sheet and the modal
   =================================================================== */

const FORM = {
  app: null, entry: null, el: {}, node: null,

  CATEGORIES: ['student','teacher','parent','retailer','wholesaler',
               'bookseller','school','distributor','author','other'],

  build(app, entry) {
    this.app = app;
    this.entry = entry;
    this.node = document.getElementById('formTemplate').content.firstElementChild.cloneNode(true);

    const q = id => this.node.querySelector('#' + id);
    this.el = {
      form: this.node, name: q('gName'), phone: q('gPhone'), cat: q('gCat'),
      state: q('gState'), dist: q('gDist'), tal: q('gTal'), village: q('gVillage'),
      pin: q('gPin'), hp: q('hp'), submit: q('gateSubmit'), skip: q('gateSkip'),
      parentNote: q('parentNote'),
      distT: q('gDistT'), talT: q('gTalT'), wDist: q('wDist'), wTal: q('wTal')
    };

    this.el.form.addEventListener('submit', e => { e.preventDefault(); this.submit(); });
    this.el.skip.addEventListener('click', () => this.entry.onSkipped());
    this.el.state.addEventListener('change', () => this.onState());
    this.el.dist.addEventListener('change', () => this.onDist());
    this.el.cat.addEventListener('change', () => {
      this.el.parentNote.classList.toggle('hidden', this.el.cat.value !== 'student');
    });
    RULE.bind(this.el.name, 'name');
    RULE.bind(this.el.village, 'place');
    RULE.bind(this.el.distT, 'place');
    RULE.bind(this.el.talT, 'place');
    RULE.bind(this.el.phone, 'digits', 10);
    RULE.bind(this.el.pin, 'digits', 6);
  },

  /* Outside Maharashtra there is no district list, so the visitor types
     the name instead. Letters only, same as every other place field. */
  outside(on) {
    const t = k => this.app.t(k);
    if (this.el.wDist) this.el.wDist.classList.toggle('hidden', on);
    if (this.el.wTal) this.el.wTal.classList.toggle('hidden', on);
    if (this.el.distT) {
      this.el.distT.classList.toggle('hidden', !on);
      this.el.distT.placeholder = t('ph_district');
    }
    if (this.el.talT) {
      this.el.talT.classList.toggle('hidden', !on);
      this.el.talT.placeholder = t('ph_taluka');
    }
  },

  distVal() {
    const out = this.el.state.value && this.el.state.value !== 'Maharashtra';
    return out ? (this.el.distT ? this.el.distT.value.trim() : '') : this.el.dist.value;
  },
  talVal() {
    const out = this.el.state.value && this.el.state.value !== 'Maharashtra';
    return out ? (this.el.talT ? this.el.talT.value.trim() : '') : this.el.tal.value;
  },

  moveTo(slotId) {
    const slot = document.getElementById(slotId);
    if (slot && this.node.parentElement !== slot) slot.appendChild(this.node);
    // The skip link says different things depending on where the form sits.
    this.el.skip.dataset.t = 'gate_skip';
  },

  /* mark any prefilled field the visitor edits, so a change is visible
     before they send */
  markEdits() {
    this.node.querySelectorAll('input, select').forEach(f => {
      /* the baseline is reset every time a window opens; the listener is
         bound only once, or each open would add another */
      f.dataset.filled = f.value || '';
      f.classList.remove('edited');
      if (f.dataset.editBound) return;
      f.dataset.editBound = '1';
      const flag = () => f.classList.toggle('edited',
        !!f.dataset.filled && f.value !== f.dataset.filled);
      f.addEventListener('input', flag);
      f.addEventListener('change', flag);
    });
  },

  reset() {
    this.el.form.classList.remove('hidden');
    this.el.submit.disabled = false;
    this.node.querySelectorAll('.err').forEach(e => e.textContent = '');
    this.node.querySelectorAll('.bad').forEach(e => e.classList.remove('bad'));
    this.prefill('prefillNote', true);
    this.markEdits();
  },

  /* Whatever the visitor has told us anywhere is already here.
     One routine serves the welcome form, the offer forms and the
     order form, so no field is ever typed twice. */
  /* One shared form travels between windows, so a half-typed value from
     the last window can survive into the next. `force` rewrites every
     field from what was saved, so each window opens on the same truth. */
  prefill(note, force) {
    const b = BUYER.get();
    const el = document.getElementById(note || 'prefillNote');
    const nw = document.getElementById('flowNoteNew');
    const bk = document.getElementById('flowNoteBack');
    const seen = !!(b && b.name);
    /* the closing note reads differently for someone who has been here */
    if (nw) nw.classList.toggle('hidden', seen);
    if (bk) bk.classList.toggle('hidden', !seen);
    if (!seen) { if (el) el.classList.add('hidden'); return false; }

    if (force || !this.el.name.value) this.el.name.value = b.name || '';
    if (force || !this.el.phone.value) this.el.phone.value = (b.whatsapp || '').replace(/^91/, '');
    if (force || !this.el.cat.value) this.el.cat.value = b.category || '';
    if ((force || !this.el.state.value) && b.state) {
      this.el.state.value = b.state;
      this.onState();
      if (b.state === 'Maharashtra') {
        this.el.dist.value = b.district || '';
        if (b.district) { this.onDist(); this.el.tal.value = b.taluka || ''; }
      } else {
        if (this.el.distT) this.el.distT.value = b.district || '';
        if (this.el.talT) this.el.talT.value = b.taluka || '';
      }
    }
    if (force || !this.el.village.value) this.el.village.value = b.village_city || '';
    if (force || !this.el.pin.value) this.el.pin.value = b.pin || '';
    if (el) el.classList.remove('hidden');
    return true;
  },

  preset(key) {
    const map = { school: 'school', bulk: 'wholesaler', retail: 'retailer', parent: 'parent' };
    if (map[key]) {
      this.el.cat.value = map[key];
      this.el.parentNote.classList.add('hidden');
    }
  },

  digits(input, max) { input.value = input.value.replace(/\D/g, '').slice(0, max); },

  repaint() {
    const t = k => this.app.t(k);
    this.node.querySelectorAll('[data-t]').forEach(el => {
      const v = t(el.dataset.t);
      if (v) el.textContent = v;
    });

    const keep = { cat: this.el.cat.value, state: this.el.state.value,
                   dist: this.el.dist.value, tal: this.el.tal.value };
    const pick = `<option value="">${t('gate_select')}</option>`;

    this.el.cat.innerHTML = pick + FORM.CATEGORIES
      .map(c => `<option value="${c}">${t('cat_' + c)}</option>`).join('');
    this.el.cat.value = keep.cat;

    const loc = this.app.locations;
    if (!loc) return;
    const mr = this.app.lang === 'mr';
    this.el.state.innerHTML = pick
      + `<option value="Maharashtra">${mr ? loc.maharashtra.name_mr : loc.maharashtra.name_en}</option>`
      + loc.other_states.map(s =>
          `<option value="${s.name_en}">${mr ? s.name_mr : s.name_en}</option>`).join('');
    this.el.state.value = keep.state;

    if (keep.state) { this.onState(); this.el.dist.value = keep.dist; }
    if (keep.dist)  { this.onDist();  this.el.tal.value = keep.tal; }
  },

  onState() {
    const t = k => this.app.t(k);
    const pick = `<option value="">${t('gate_select')}</option>`;
    const mr = this.app.lang === 'mr';
    const v = this.el.state.value;

    this.el.tal.innerHTML = pick;
    this.el.tal.disabled = true;

    this.outside(false);
    if (v === 'Maharashtra') {
      this.el.dist.disabled = false;
      this.el.dist.innerHTML = pick + this.app.locations.maharashtra.districts
        .map(d => `<option value="${d.name_en}">${mr ? d.name_mr : d.name_en}</option>`).join('');
    } else if (v) {
      this.outside(true);
      return;
    } else {
      this.el.dist.disabled = true;
      this.el.dist.innerHTML = pick;
    }
  },

  onDist() {
    const t = k => this.app.t(k);
    const pick = `<option value="">${t('gate_select')}</option>`;
    const mr = this.app.lang === 'mr';
    if (this.el.state.value !== 'Maharashtra') return;

    const d = this.app.locations.maharashtra.districts
      .find(x => x.name_en === this.el.dist.value);
    if (!d) { this.el.tal.disabled = true; this.el.tal.innerHTML = pick; return; }

    this.el.tal.disabled = false;
    this.el.tal.innerHTML = pick + d.talukas
      .map(x => `<option value="${x.name_en}">${mr ? x.name_mr : x.name_en}</option>`).join('');
  },

  validate() {
    const t = k => this.app.t(k);
    const req = t('common_required');
    let ok = true;
    const check = (el, errId, pass, msg) => {
      const e = this.node.querySelector('#' + errId);
      if (pass) { el.classList.remove('bad'); if (e) e.textContent = ''; }
      else { el.classList.add('bad'); if (e) e.textContent = msg; ok = false; }
    };
    const out = this.el.state.value && this.el.state.value !== 'Maharashtra';
    check(this.el.name, 'eName', RULE.okName(this.el.name.value), t('err_name'));
    check(this.el.phone, 'ePhone', RULE.okPhone(this.el.phone.value), t('err_phone'));
    check(this.el.cat, 'eCat', !!this.el.cat.value, t('err_select'));
    check(this.el.state, 'eState', !!this.el.state.value, t('err_select'));
    check(out ? this.el.distT : this.el.dist, 'eDist',
          RULE.okPlace(this.distVal()), out ? t('err_district') : t('err_select'));
    check(out ? this.el.talT : this.el.tal, 'eTal',
          RULE.okPlace(this.talVal()), out ? t('err_taluka') : t('err_select'));
    check(this.el.village, 'eVillage', RULE.okPlace(this.el.village.value), t('err_village'));
    check(this.el.pin, 'ePin', RULE.okPin(this.el.pin.value), t('err_pin'));
    return ok;
  },

  async submit() {
    if (!this.validate()) return;

    const payload = {
      name: this.el.name.value.trim(),
      whatsapp: '91' + this.el.phone.value,
      category: this.el.cat.value,
      state: this.el.state.value,
      district: this.distVal(),
      taluka: this.talVal(),
      village_city: this.el.village.value.trim(),
      pin: this.el.pin.value,
      language: this.app.lang,
      source: this.entry.offerKey ? 'offer:' + this.entry.offerKey
            : (this.entry.where === 'sheet' ? 'welcome' : 'site'),
      website: this.el.hp.value
    };

    this.el.submit.disabled = true;
    this.el.submit.textContent = this.app.t('common_loading');

    let regId = this.localId();
    this.entry.lastReg = payload;
    const url = this.app.settings.backendUrl;
    const changed = BUYER.isNew(payload);
    const prev = localStorage.getItem('rutuja_reg');

    if (url && changed) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        const j = await r.json();
        if (j && j.reg_id) regId = j.reg_id;
      } catch (err) {
        try {
          await fetch(url, { method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload) });
        } catch (e2) { console.error('Send failed', e2); }
      }
    }

    if (!changed && prev) { try { regId = JSON.parse(prev).id || regId; } catch (e) {} }
    BUYER.set({ name: payload.name, whatsapp: payload.whatsapp, category: payload.category,
                state: payload.state, district: payload.district, taluka: payload.taluka,
                village_city: payload.village_city, pin: payload.pin });
    BUYER.markSent(payload);
    localStorage.setItem('rutuja_reg', JSON.stringify({ id: regId, cat: payload.category }));
    this.el.submit.disabled = false;
    this.el.submit.textContent = this.app.t('gate_submit');
    this.entry.onSubmitted(regId);
  },

  localId() {
    const d = new Date();
    return 'RP-' + String(d.getFullYear()).slice(2) + '-'
         + String(Math.floor(1000 + Math.random() * 9000));
  }
};

/* ===================================================================
   PHASE 7 — BOOKS
   Discovery grid, filters, search, detail page, price calculator.
   Reads data/content.json until Phase 12 swaps in the Google Sheet.
   =================================================================== */

const BOOKS = {
  app: null,
  filters: { q: '', std: '', med: '', sub: '', sort: 'std' },
  current: null,

  init(app) {
    this.app = app;
    const g = id => document.getElementById(id);
    this.el = { grid: g('bookGrid'), feat: g('featGrid'), none: g('bookNone'),
                count: g('bCount'), search: g('bSearch'), std: g('fStd'),
                med: g('fMed'), sub: g('fSub'), sort: g('fSort'),
                clear: g('fClear'), detail: g('bookDetail'), slab: g('slabTable'),
                note: g('sampleNote') };

    this.el.search.addEventListener('input', () => {
      this.filters.q = this.el.search.value.trim().toLowerCase(); this.renderGrid();
    });
    ['std','med','sub','sort'].forEach(k => {
      this.el[k].addEventListener('change', () => {
        this.filters[k] = this.el[k].value; this.renderGrid();
      });
    });
    this.el.clear.addEventListener('click', () => {
      this.filters = { q: '', std: '', med: '', sub: '', sort: 'std' };
      this.el.search.value = '';
      ['std','med','sub'].forEach(k => this.el[k].value = '');
      this.el.sort.value = 'std';
      this.renderGrid();
    });

    // Any [data-book] control anywhere opens that book.
    document.addEventListener('click', e => {
      const b = e.target.closest('.vcard-btn[data-book]');
      if (b) this.openBook(b.dataset.book);
    });

    /* the same button on a book's own page opens the order window with
       that book already picked */
    document.addEventListener('click', e => {
      const o = e.target.closest('.vcard-btn[data-order-book]');
      if (o) ORDER.open([{ id: o.dataset.orderBook, qty: 1 }]);
    });

    // A standard card on the home page pre-filters the books page.
    document.addEventListener('click', e => {
      const c = e.target.closest('.std-card');
      if (!c) return;
      this.filters.std = c.dataset.std;
      if (this.el.std) this.el.std.value = c.dataset.std;
      this.renderGrid();
    });
  },

  live() {
    return (this.app.content.books || []).filter(b => b.status === 'LIVE');
  },

  /* A book can serve more than one standard: "1,2" or "3,4,5". */
  stds(b) {
    return String(b.standard || '').split(',').map(x => x.trim()).filter(Boolean);
  },

  stdLabel(b) {
    const mr = this.app.lang === 'mr';
    const list = this.stds(b);
    if (!list.length) return '';
    const show = n => mr ? '१२३४५'[n - 1] : n;
    return list.length === 1 ? show(list[0])
         : show(list[0]) + '–' + show(list[list.length - 1]);
  },

  /* A book can also cover several subjects: "वाचन, लेखन, सामान्यज्ञान". */
  subs(b) {
    const raw = this.app.lang === 'mr' ? b.subject_mr : b.subject_en;
    return String(raw || '').split(',').map(x => x.trim()).filter(Boolean);
  },

  subsEn(b) {
    return String(b.subject_en || '').split(',').map(x => x.trim()).filter(Boolean);
  },

  /* A book may be published in more than one medium: "Marathi, English". */
  meds(b) {
    return String(b.medium || '').split(',').map(x => x.trim()).filter(Boolean);
  },

  medLabel(b) {
    return this.meds(b).map(m => this.app.t('med_' + m) || m).join(' · ');
  },

  /* Colour comes from the lowest standard the book serves. */
  stdColor(b) {
    const list = this.stds(b);
    return 'var(--std' + (list[0] || 1) + ')';
  },

  paint() {
    if (!this.el || !this.el.grid) return;
    this.buildFilters();
    this.renderGrid();
    this.renderFeatured();
    this.renderSlabs();
    if (this.el.note) this.el.note.classList.toggle('hidden', !this.app.content.sample);
    if (this.current) this.openBook(this.current, true);
  },

  buildFilters() {
    const t = k => this.app.t(k);
    const mr = this.app.lang === 'mr';
    const all = `<option value="">${t('books_all')}</option>`;
    const books = this.live();

    this.el.search.placeholder = t('books_search_ph');

    this.el.std.innerHTML = all + ['1','2','3','4','5']
      .map(s => `<option value="${s}">${t('books_standard')} ${mr ? '१२३४५'[s-1] : s}</option>`).join('');

    const meds = [];
    books.forEach(b => this.meds(b).forEach(m => { if (!meds.includes(m)) meds.push(m); }));
    ['Marathi','Semi-English','English'].forEach(m => { if (!meds.includes(m)) return; });
    this.el.med.innerHTML = all + meds
      .map(m => `<option value="${m}">${t('med_' + m) || m}</option>`).join('');

    const pairs = new Map();
    books.forEach(b => {
      const en = this.subsEn(b);
      const loc = String(b.subject_mr || '').split(',').map(x => x.trim());
      en.forEach((x, i) => { if (!pairs.has(x)) pairs.set(x, loc[i] || x); });
    });
    this.el.sub.innerHTML = all + [...pairs.entries()].sort()
      .map(([en, loc]) => `<option value="${en}">${mr ? loc : en}</option>`).join('');

    this.el.sort.innerHTML =
      `<option value="std">${t('books_sort_std')}</option>` +
      `<option value="low">${t('books_sort_low')}</option>` +
      `<option value="high">${t('books_sort_high')}</option>`;

    this.el.std.value = this.filters.std;
    this.el.med.value = this.filters.med;
    this.el.sub.value = this.filters.sub;
    this.el.sort.value = this.filters.sort;
  },

  match() {
    const f = this.filters;
    let out = this.live().filter(b => {
      if (f.std && !this.stds(b).includes(f.std)) return false;
      if (f.med && !this.meds(b).includes(f.med)) return false;
      if (f.sub && !this.subsEn(b).includes(f.sub)) return false;
      if (f.q) {
        const hay = [b.name_mr, b.name_en, b.subject_mr, b.subject_en]
          .join(' ').toLowerCase();
        if (!hay.includes(f.q)) return false;
      }
      return true;
    });
    if (f.sort === 'low')  out.sort((a, b) => a.mrp - b.mrp);
    else if (f.sort === 'high') out.sort((a, b) => b.mrp - a.mrp);
    else out.sort((a, b) => (a.standard - b.standard) || (a.sort_order - b.sort_order));
    return out;
  },

  /* `plain` renders the home page's featured row unchanged — the book
     title treatment applies everywhere except there. */
  card(b, plain) {
    const t = k => this.app.t(k);
    const mr = this.app.lang === 'mr';
    const name = mr ? b.name_mr : b.name_en;
    const sl   = this.subs(b);
    const sub  = sl.slice(0, 2).join(' · ') + (sl.length > 2 ? ' +' + (sl.length - 2) : '');
    const num  = this.stdLabel(b);
    const cover = b.cover_image
      ? this.app.img('books', b.cover_image, '', mr ? b.name_mr : b.name_en)
      : `<span class="book-cover-ph">${num}</span>`;
    const best = this.slabs(b.offer_id).slice(-1)[0];
    const hint = best && best.selling_rate < b.mrp
      ? `<span class="book-bulk">${best.qty_min}+ ${t('book_bulk_hint')} &#8377;${best.selling_rate}</span>` : '';
    const pct = this.bestPct(b);
    const peek = (b.gallery_images || '').trim()
      ? `<span class="peek-tab" data-peek="${b.book_id}">
           <i class="peek-arrow">&rsaquo;</i><em>${t('look_inside')}</em></span>` : '';
    return `<button class="book-card" data-book="${b.book_id}" style="--sc:${this.stdColor(b)}">
      <span class="book-stage">
        <span class="book3d">
          <span class="book-cover">${cover}</span>
          ${peek}
          <span class="book-pages"></span>
          <span class="book-open">${t('book_open')} &rarr;</span>
        </span>
      </span>
      <span class="book-body">
        <span class="chips">
          <span class="chip chip-std" style="background:${this.stdColor(b)}">${t('chip_std')} ${num}</span>
          ${pct ? `<span class="chip chip-off">${pct}% ${t('disc_upto')}</span>` : ''}
        </span>
        ${(() => { const T = MEDIA.bookTitle(b, mr); return `<span class="book-name${plain ? '' : ' bt'}" style="--tw:${T.w};--bc:${T.c}">${plain ? name : `<i class="bt-mark" aria-hidden="true"></i><span>${T.html}</span>`}</span>`; })()}
        <span class="book-meta">${sub} · ${this.medLabel(b)}</span>
        ${b.subtitle_mr || b.subtitle_en ? `<span class="book-sub">${mr ? b.subtitle_mr : b.subtitle_en}</span>` : ''}
        <span class="book-price">&#8377;${b.mrp}${hint}</span>
      </span></button>`;
  },

  bind(root) {
    root.querySelectorAll('[data-book]').forEach(c => {
      c.addEventListener('click', () => this.openBook(c.dataset.book));
    });
  },

  renderGrid() {
    const list = this.match();
    this.el.grid.innerHTML = list.map(b => this.card(b)).join('');
    try { PATH.draw('page-books', 'booksPath', 'terra'); } catch (e) { console.error('path', e); }
    this.el.count.textContent = list.length;
    this.el.none.classList.toggle('hidden', list.length > 0);
    this.bind(this.el.grid);
  },

  renderFeatured() {
    if (!this.el.feat) return;
    this.el.feat.classList.add('shelf');
    const f = this.live().filter(b => b.featured === 'YES').slice(0, 4);
    this.el.feat.innerHTML = f.map(b => this.card(b, true)).join('');
    this.bind(this.el.feat);
  },

  /* ---- PRICING ---- */
  slabs(offerId) {
    return (this.app.content.offers || [])
      .filter(o => o.status === 'LIVE' && (!offerId || o.offer_id === offerId))
      .sort((a, b) => a.qty_min - b.qty_min);
  },

  /* qty_max may be a number or an open-ended value such as "200+". */
  topOf(o) {
    const v = String(o.qty_max);
    return v.includes('+') ? Infinity : (parseInt(v, 10) || 0);
  },

  slabLabel(o) {
    return o.qty_min + ' – ' + o.qty_max;
  },

  /* The selling rate is the source of truth; the percentage is only
     shown to the customer, so no rounding can distort the price. */
  priceFor(book, qty) {
    const s = this.slabs(book.offer_id)
      .find(o => qty >= o.qty_min && qty <= this.topOf(o));
    const each = s && s.selling_rate ? Number(s.selling_rate) : Number(book.mrp);
    const pct  = book.mrp ? Math.round((book.mrp - each) / book.mrp * 100) : 0;
    return { pct, each, total: each * qty, saved: (book.mrp - each) * qty };
  },

  /* The best discount this book ever offers, for the card ribbon
     and the headline sentence. Returns 0 when there is no offer. */
  bestPct(b) {
    const sl = this.slabs(b.offer_id);
    if (!sl.length || !b.mrp) return 0;
    const low = Math.min(...sl.map(o => Number(o.selling_rate) || b.mrp));
    return Math.round((b.mrp - low) / b.mrp * 100);
  },

  /* The slab after the current one, so we can tell the buyer what
     a few more copies would be worth to them. */
  nextSlab(b, qty) {
    const sl = this.slabs(b.offer_id);
    const cur = this.priceFor(b, qty);
    return sl.find(o => o.qty_min > qty && Number(o.selling_rate) < cur.each) || null;
  },

  /* The full ladder, with the slab the buyer is currently on marked. */
  ladder(b, qty) {
    const t = k => this.app.t(k);
    const sl = this.slabs(b.offer_id);
    if (!sl.length) return '';
    return `<div class="ladder">${sl.map(o => {
      const on = qty >= o.qty_min && qty <= this.topOf(o);
      const pct = b.mrp ? Math.round((b.mrp - o.selling_rate) / b.mrp * 100) : 0;
      return `<div class="rung${on ? ' on' : ''}">
        <span class="rung-q">${this.slabLabel(o)} ${t('price_qty')}</span>
        <span class="rung-r">&#8377;${o.selling_rate}</span>
        <span class="rung-p">${pct ? pct + '% ' + t('cart_saving') : '&mdash;'}</span>
        ${on ? `<span class="rung-here">${t('disc_here')}</span>` : ''}
      </div>`;
    }).join('')}</div>`;
  },

  /* Three explicit columns. A <table> was leaving roughly a quarter of
     the width unused on the right and the figures sat away from their
     headers; a grid puts the columns under our own control. */
  rateGrid(sl, b, head) {
    const t = k => this.app.t(k);
    const mr = this.app.lang === 'mr';
    return `<div class="rate">
      ${head ? `<div class="rate-cap">${mr ? b.name_mr : b.name_en} &middot; MRP &#8377;${b.mrp}</div>` : ''}
      <div class="rate-grid">
        <span class="rate-h">${t('price_qty')}</span>
        <span class="rate-h rate-num">${t('price_rate')}</span>
        <span class="rate-h rate-num">${t('price_discount')}</span>
        ${sl.map((o, i) => `
          <span class="rate-c rate-q${i % 2 ? ' alt' : ''}">${this.slabLabel(o)}</span>
          <span class="rate-c rate-num rate-r${i % 2 ? ' alt' : ''}">&#8377;${o.selling_rate}</span>
          <span class="rate-c rate-num rate-p${i % 2 ? ' alt' : ''}">${o.discount_percent ? Math.round(o.discount_percent) + '%' : '&mdash;'}</span>
        `).join('')}
      </div>
    </div>`;
  },

  renderSlabs() {
    if (!this.el.slab) return;
    const t = k => this.app.t(k);
    const mr = this.app.lang === 'mr';
    const blocks = this.live().map(b => {
      const sl = this.slabs(b.offer_id);
      if (!sl.length) return '';
      return this.rateGrid(sl, b, true);
    }).join('');
    this.el.slab.innerHTML = blocks + `<div class="cond"><span class="cond-i">&#9888;</span><span>${t('price_delivery')}</span></div>`;
  },

  /* ---- DETAIL PAGE ---- */
  /* One heading for every section on a book page: mark, title, subtitle.
     Built here so the pattern cannot drift between sections. */
  bhd(head, sub) {
    const t = k => this.app.t(k);
    return `<div class="hd hd-sm bsec-hd">
      <h3 class="hd-t"><i class="hd-mark" aria-hidden="true"></i><span>${t(head)}</span></h3>
      <p class="hd-s">${t(sub)}</p>
    </div>`;
  },

  openBook(id, silent) {
    const b = this.live().find(x => x.book_id === id);
    if (!b) return;
    this.current = id;
    const t = k => this.app.t(k);
    const mr = this.app.lang === 'mr';
    const num = this.stdLabel(b);
    const cover = b.cover_image
      ? this.app.img('books', b.cover_image, '', mr ? b.name_mr : b.name_en)
      : `<span>${num}</span>`;
    const mySlabs = this.slabs(b.offer_id);
    const pct = this.bestPct(b);

    this.el.detail.innerHTML = `
      <div class="bd">
        <div class="book-stage bd-stage" style="--sc:${this.stdColor(b)}">
          <div class="book3d">
            <div class="book-cover bd-cover">${cover}</div>
            <span class="book-pages"></span>
          </div>
        </div>
        <div>
          ${(() => { const T = MEDIA.bookTitle(b, mr); return `<h1 class="bd-title bt" style="--tw:${T.w};--bc:${T.c}"><i class="bt-mark" aria-hidden="true"></i><span>${T.html}</span></h1>`; })()}
          ${(mr ? b.subtitle_mr : b.subtitle_en) ? `<p class="bd-subtitle">${mr ? b.subtitle_mr : b.subtitle_en}</p>` : ''}
          <p class="bd-sub">${this.subs(b).join(' · ')} &nbsp;|&nbsp; ${this.medLabel(b)}</p>
          <div id="bdPath" class="wpath"></div>
          <section class="bsec bsec-a" data-step="st_b_facts">
            ${this.bhd('bd_facts_h', 'bd_facts_s')}
            <div class="bd-facts">
              <div class="bd-fact"><div class="bd-fact-k">${t('books_standard')}</div>
                <div class="bd-fact-v">${num}</div></div>
              <div class="bd-fact"><div class="bd-fact-k">${t('book_mrp')}</div>
                <div class="bd-fact-v">₹${b.mrp}</div></div>
              ${b.pages ? `<div class="bd-fact"><div class="bd-fact-k">${t('book_pages')}</div>
                <div class="bd-fact-v">${b.pages}</div></div>` : ''}
            </div>
          </section>

          <section class="bsec bsec-b" data-step="st_b_about">
            ${this.bhd('bd_about_h', 'bd_about_s')}
            <p class="bd-desc">${mr ? b.description_mr : b.description_en}</p>
          </section>

          ${pct ? `<div class="disc-head"><b>${pct}% ${t('disc_upto')}</b> &nbsp;&middot;&nbsp; ${t('disc_head')}</div>` : ''}

          <section class="bsec bsec-a calc" data-step="st_b_calc">
            ${this.bhd('price_title', 'bd_calc_s')}
            <div class="calc-row">
              <span class="calc-lbl">${t('price_qty')}</span>
              <div class="qty">
                <button type="button" id="qMinus">&minus;</button>
                <input type="text" id="qVal" inputmode="numeric" value="1">
                <button type="button" id="qPlus">+</button>
              </div>
            </div>
            <div class="nudge" id="nudge"></div>
            <div class="calc-out" id="calcOut"></div>
            <div id="ladderBox"></div>
            <div class="cond"><span class="cond-i">&#9888;</span><span>${t('price_delivery')}</span></div>
            <div class="calc-actions">
              <button class="btn btn-gold" id="calcOrder">${t('book_order_now')}</button>
              <button class="btn btn-primary" id="calcCart">${t('cart_add')}</button>
            </div>
            <button class="calc-enq" id="calcAsk">${t('book_enq')}</button>
          </section>

          ${MEDIA.forBook(b.book_id, 'b')}

          <section class="bsec bsec-a slab-wrap" data-step="st_b_rate">
            ${this.bhd('bd_rate_h', 'bd_rate_s')}
            ${this.rateGrid(mySlabs, b, false)}
          </section>
        </div>
      </div>`;

    const qv = document.getElementById('qVal');
    const draw = () => {
      let q = Math.max(1, Math.min(10000, parseInt(qv.value, 10) || 1));
      qv.value = q;
      const p = this.priceFor(b, q);

      document.getElementById('calcOut').innerHTML = `
        <div class="calc-line"><span>${t('price_per')}</span>
          <span>&#8377;${p.each} ${p.pct ? `<s>&#8377;${b.mrp}</s>` : ''}</span></div>
        ${p.pct ? `<div class="calc-line"><span>${t('price_slab')}</span>
          <span class="calc-save">${p.pct}%</span></div>` : ''}
        <div class="calc-line"><span>${t('price_total')}</span>
          <span class="calc-total">&#8377;${p.total}</span></div>
        ${p.saved ? `<div class="calc-line"><span>${t('price_saving')}</span>
          <span class="calc-save">&#8377;${p.saved} (${p.pct}%)</span></div>` : ''}`;

      document.getElementById('ladderBox').innerHTML = this.ladder(b, q);

      // Tell the buyer exactly what a few more copies would be worth.
      const nx = this.nextSlab(b, q);
      const nb = document.getElementById('nudge');
      if (nx) {
        const need = nx.qty_min - q;
        const extra = (p.each - Number(nx.selling_rate)) * nx.qty_min;
        const from = mySlabs.find(o => q >= o.qty_min && q <= this.topOf(o));
        const start = from ? from.qty_min : 1;
        const fill = Math.max(6, Math.min(100,
          ((q - start) / Math.max(1, nx.qty_min - start)) * 100));
        nb.className = 'nudge on';
        nb.innerHTML = `
          <div class="nudge-bar"><i style="width:${fill}%"></i></div>
          <div class="nudge-text">${t('disc_next')} <b>${need}</b> ${t('disc_next2')}
            <b>&#8377;${nx.selling_rate}</b> &mdash; <span class="calc-save">&#8377;${extra > 0 ? extra : 0} ${t('disc_save_more')}</span></div>`;
      } else if (p.pct) {
        nb.className = 'nudge best';
        nb.innerHTML = `<div class="nudge-text">&#10003; ${p.pct}% ${t('disc_applied')} &mdash; ${t('disc_best')}</div>`;
      } else {
        nb.className = 'nudge';
        nb.innerHTML = '';
      }
    };
    MEDIA.bindBookVideos(this.el.detail);
    QA.forBook(this.el.detail);
    try { PATH.draw('bookDetail', 'bdPath', 'cream'); } catch (e) { console.error('path', e); }
    qv.addEventListener('input', () => { qv.value = qv.value.replace(/\D/g, ''); draw(); });
    document.getElementById('qMinus').onclick = () => { qv.value = Math.max(1, (+qv.value || 1) - 1); draw(); };
    document.getElementById('qPlus').onclick  = () => { qv.value = (+qv.value || 1) + 1; draw(); };
    document.getElementById('calcOrder').onclick = () => {
      ORDER.open([{ id: b.book_id, qty: +qv.value || 1 }]);
    };
    document.getElementById('calcCart').onclick = () => {
      CART.add(b.book_id, +qv.value || 1);
      const btn = document.getElementById('calcCart');
      btn.textContent = t('cart_added');
      btn.classList.add('done');
      setTimeout(() => { btn.textContent = t('cart_add'); btn.classList.remove('done'); }, 1600);
    };
    document.getElementById('calcAsk').onclick = () => {
      const q = +qv.value || 1;
      const detail = `${b.name_mr || b.name_en} (${this.medLabel(b)}) × ${q}`;
      const link = this.app.wa(q > 1 ? 'wa_quantity' : 'wa_book', detail, 'mr');
      if (link) window.open(link, '_blank'); else this.app.go('contact');
    };
    draw();

    if (!silent) this.app.go('book');
  }
};

/* ===================================================================
   PHASE 8 — VIDEO AND ADVERTISEMENT CAROUSELS
   Two independent systems. Auto-rotate, arrows, dots, swipe.
   Rotation pauses on hover, touch, and while a video is playing.
   =================================================================== */

const MEDIA = {
  app: null,
  rails: [],

  init(app) { this.app = app; },

  cfg(key, fallback) {
    const v = (this.app.content.config || {})[key];
    return Number(v) > 0 ? Number(v) * 1000 : fallback;
  },

  live(list, carouselOnly) {
    return (this.app.content[list] || [])
      .filter(x => x.status === 'LIVE' && (!carouselOnly || x.in_carousel !== 'NO'))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  },

  paint() {
    if (!this.app) return;
    try { PATH.draw('page-videos', 'vidPath', 'violet'); } catch (e) { console.error('path', e); }
    this.rails.forEach(r => clearInterval(r.timer));
    this.rails = [];
    /* Only book videos appear here. Advertisement and experience
       videos carry a different video_type and stay out. */
    const vids = this.live('videos', true)
      .filter(v => !v.video_type || /book/i.test(v.video_type) || v.book_id);
    const ads  = this.live('ads', true);

    this.build('vidCar',  vids, 'video', this.cfg('video_rotate_seconds', 4000));
    this.build('vidCar2', vids, 'video', this.cfg('video_rotate_seconds', 4000));
    this.build('adCar',   ads,  'ad',    this.cfg('ad_rotate_seconds', 3000));
    this.grid('vidGrid', vids);
  },

  /* maxresdefault is 1280x720. Not every video has one, so fall back
     through sd, then hq, which always exist. */
  /* maxresdefault is the largest still YouTube keeps (1280x720).
     Not every video has one, so step down through sd, then hq. */
  thumbImg(id, eager) {
    const hq = `this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'`;
    return `<img src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg"
      onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/sddefault.jpg';this.onerror=function(){${hq}}"
      alt="" decoding="async"${eager ? '' : ' loading="lazy"'}>`;
  },


  /* ---- BUILD ONE CAROUSEL ---- */
  build(elId, items, kind, delay) {
    const box = document.getElementById(elId);
    if (!box) return;
    const t = k => this.app.t(k);

    if (!items.length) {
      box.innerHTML = `<div class="car-empty">${t(kind === 'ad' ? 'ads_none' : 'videos_none')}</div>`;
      return;
    }

    const mr = this.app.lang === 'mr';
    const slides = items.map((x, i) => kind === 'video'
      ? this.videoSlide(x, mr, i) : this.adSlide(x, mr)).join('');

    box.innerHTML = `
      <div class="car-track">${slides}</div>
      ${items.length > 1 ? `
        <div class="car-controls">
          <button class="car-arrow car-prev" aria-label="${t('car_prev')}">&#8249;</button>
          <div class="car-dots">${items
            .map((_, i) => `<button class="car-dot${i ? '' : ' on'}" data-i="${i}"></button>`)
            .join('')}</div>
          <button class="car-arrow car-next" aria-label="${t('car_next')}">&#8250;</button>
        </div>` : ''}`;

    const rail = { box, track: box.querySelector('.car-track'), n: items.length,
                   i: 0, delay, timer: null, paused: false };

    const go = i => {
      rail.i = (i + rail.n) % rail.n;
      rail.track.style.transform = `translateX(-${rail.i * 100}%)`;
      box.querySelectorAll('.car-dot').forEach((d, k) => d.classList.toggle('on', k === rail.i));
    };
    const start = () => { clearInterval(rail.timer);
      if (rail.n > 1 && !rail.paused) rail.timer = setInterval(() => go(rail.i + 1), rail.delay); };
    const stop = () => clearInterval(rail.timer);

    box.querySelector('.car-next')?.addEventListener('click', () => { go(rail.i + 1); start(); });
    box.querySelector('.car-prev')?.addEventListener('click', () => { go(rail.i - 1); start(); });
    box.querySelectorAll('.car-dot').forEach(d =>
      d.addEventListener('click', () => { go(+d.dataset.i); start(); }));

    box.addEventListener('mouseenter', stop);
    box.addEventListener('mouseleave', () => { if (!rail.paused) start(); });

    // Swipe on touch devices
    let x0 = null;
    box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    box.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(rail.i + (dx < 0 ? 1 : -1));
      x0 = null; if (!rail.paused) start();
    });

    // Playing a video stops rotation until the visitor moves on
    box.querySelectorAll('[data-yt]').forEach(m => {
      m.addEventListener('click', () => { rail.paused = true; stop(); });
    });
    this.bindPlay(box);

    this.rails.push(rail);
    start();
  },

  /* The same card is used in the carousel, on the Videos page and on a
     book page, so a visitor always sees the video presented identically.
     Order below the video: book name, then tagline, then the description. */
  /* A book title, everywhere it appears. The name carries the weight;
     the bracketed qualifier follows it lighter and smaller, on the same
     line. --tw is the whole thing measured in units of font-size, so
     CSS can pick the largest size that still holds one row. */
  bookTitle(b, mr) {
    const t = (mr ? b.name_mr : b.name_en) || '';
    const adv = mr ? 0.394 : 0.371;
    const i = t.indexOf('(');
    const esc = x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let inner, w;
    if (i > 0) {
      const a = t.slice(0, i).trim(), br = t.slice(i);
      inner = `<b>${esc(a)}</b><i class="bt-q">${esc(br)}</i>`;
      w = a.length * adv + br.length * adv * 0.72 + adv;
    } else {
      inner = `<b>${esc(t)}</b>`;
      w = t.length * adv;
    }
    return { html: inner, w: w.toFixed(2), c: b.title_colour || '' };
  },

  /* How wide this title wants to be, in units of font-size. CSS divides
     the space available by this, so each title lands at the largest size
     that fits on one line rather than every title sharing the smallest. */
  titleWidth(t, mr) {
    const n = String(t || '').length || 1;
    return (n * (mr ? 0.52 : 0.50)).toFixed(1);
  },

  /* `own` is true when the card sits on the book's own page. There the
     browse button would only re-open the page you are already on — a
     rebuild, a scroll to top and every animation replayed, for nothing.
     So it becomes the order action instead, which is what someone who
     has just watched the video actually wants next. */
  card(v, mr, eager, idx, own) {
    const t = k => this.app.t(k);
    const o = v.orientation === 'horizontal' ? 'horizontal' : 'vertical';
    const book = (this.app.content.books || []).find(b => b.book_id === v.book_id);
    /* the tone alternates by position, so any book added later is framed
       correctly without anyone editing this file again */
    const tone = ((idx || 0) % 2) ? 'vt-b' : 'vt-a';
    return `<article class="vcard ${tone}">
      <div class="vcard-stage">
        <div class="car-media ${o}" data-yt="${v.youtube_id}">
          <a class="car-full" href="https://www.youtube.com/watch?v=${v.youtube_id}"
             target="_blank" rel="noopener" title="YouTube" onclick="event.stopPropagation()">&#10530;</a>
          ${this.thumbImg(v.youtube_id, eager)}
          <span class="car-play">&#9654;</span>
        </div>
      </div>
      <div class="vcard-body">
        ${(() => { const T = book ? MEDIA.bookTitle(book, mr) : { html: `<b>${mr ? v.title_mr : v.title_en}</b>`, w: 20, c: '' }; return `<h3 class="vcard-title bt" style="--tw:${T.w};--bc:${T.c}"><i class="bt-mark" aria-hidden="true"></i><span>${T.html}</span></h3>`; })()}
        <span class="vcard-tag">${mr ? v.tagline_mr : v.tagline_en}</span>
        <p class="vcard-cap">${mr ? v.caption_mr : v.caption_en}</p>
        ${book ? `<button class="vcard-btn" ${own ? `data-order-book="${book.book_id}"` : `data-book="${book.book_id}"`}>${t(own ? 'book_order_now' : 'video_see_book')} &rarr;</button>` : ''}
      </div>
    </article>`;
  },

  videoSlide(v, mr, i) {
    return `<div class="car-slide">${this.card(v, mr, i === 0, i)}</div>`;
  },

  adSlide(a, mr) {
    const link = a.link_type === 'book' && a.link_target
      ? `<button class="vcard-btn" data-book="${a.link_target}">${this.app.t('books_view')} &rarr;</button>` : '';
    const cap = mr ? (a.caption_mr || '') : (a.caption_en || '');
    return `<div class="car-slide"><article class="vcard">
      <div class="vcard-stage">
        <div class="car-media horizontal">${this.app.img('ads', a.image)}</div>
      </div>
      <div class="vcard-body">
        <h3 class="vcard-title">${mr ? a.title_mr : a.title_en}</h3>
        ${cap ? `<p class="vcard-cap">${cap}</p>` : ''}
        ${link}
      </div>
    </article></div>`;
  },

  /* ---- GRID OF ALL VIDEOS ---- */
  grid(elId, items) {
    const box = document.getElementById(elId);
    if (!box) return;
    const mr = this.app.lang === 'mr';
    box.innerHTML = items.map((v, i) => this.card(v, mr, false, i)).join('');
    this.bindPlay(box);
  },

  /* Clicking the frame swaps the still for the real player, in place. */
  bindPlay(root) {
    root.querySelectorAll('[data-yt]').forEach(m => {
      m.setAttribute('role', 'button');
      m.setAttribute('tabindex', '0');
      m.addEventListener('click', () => {
        if (m.classList.contains('playing')) return;
        m.classList.add('playing');
        m.innerHTML = `<iframe src="https://www.youtube.com/embed/${m.dataset.yt}?autoplay=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3"
          title="" allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowfullscreen></iframe>`;
      });
    });
  },

  /* ---- VIDEOS BELONGING TO ONE BOOK ---- */
  forBook(bookId, tone) {
    const vids = this.live('videos', false).filter(v => v.book_id === bookId);
    if (!vids.length) return '';
    const mr = this.app.lang === 'mr';
    return `<section class="bsec bsec-${tone || 'a'} bd-videos" data-step="st_b_video">
      <div class="hd hd-sm bsec-hd bsec-hd-solo">
        <h3 class="hd-t"><i class="hd-mark" aria-hidden="true"></i><span>${this.app.t('book_videos')}</span></h3>
      </div>
      <div class="vid-list">${vids.map((v, i) => this.card(v, mr, false, i, true)).join('')}</div>
    </section>`;
  },

  bindBookVideos(root) { this.bindPlay(root); }
};

/* ===================================================================
   INPUT RULES — the same everywhere, so bad data cannot be typed at all
   =================================================================== */

const RULE = {
  /* Devanagari and Latin letters, spaces, dot and hyphen. No digits. */
  name(v) { return v.replace(/[^\u0900-\u097F A-Za-z.\-']/g, '').replace(/\s{2,}/g, ' ').slice(0, 60); },
  place(v) { return v.replace(/[^\u0900-\u097F A-Za-z.\-]/g, '').replace(/\s{2,}/g, ' ').slice(0, 50); },
  digits(v, n) { return v.replace(/\D/g, '').slice(0, n); },

  okName(v) { return /^[\u0900-\u097FA-Za-z][\u0900-\u097F A-Za-z.\-']{1,}$/.test(v.trim()); },
  okPhone(v) { return /^[6-9]\d{9}$/.test(v); },
  okPin(v) { return /^[1-9]\d{5}$/.test(v); },
  okPlace(v) { return v.trim().length >= 2; },

  /* Attaches live filtering to a field so wrong characters never appear. */
  bind(el, kind, max) {
    if (!el) return;
    el.addEventListener('input', () => {
      const p = el.selectionStart;
      const before = el.value;
      el.value = kind === 'name' ? this.name(before)
               : kind === 'place' ? this.place(before)
               : this.digits(before, max);
      if (el.value !== before) el.setSelectionRange(Math.max(0, p - 1), Math.max(0, p - 1));
    });
    if (kind === 'digits') { el.setAttribute('inputmode', 'numeric'); }
  }
};


/* ===================================================================
   BUYER — one profile, shared by every form on the site.
   Filled at entry, in the list, or in the order window. Whichever
   comes first, the others are already complete.
   =================================================================== */

const BUYER = {
  get() {
    try { return JSON.parse(localStorage.getItem('rutuja_buyer') || 'null'); }
    catch (e) { return null; }
  },
  set(b) {
    const old = this.get() || {};
    localStorage.setItem('rutuja_buyer', JSON.stringify({ ...old, ...b }));
  },
  has() { const b = this.get(); return !!(b && b.name && b.whatsapp); },

  /* A fingerprint of the details, so an unchanged profile is never
     written to the sheet a second time. */
  sig(b) {
    b = b || this.get() || {};
    return [b.name, b.whatsapp, b.category, b.state, b.district,
            b.taluka, b.village_city, b.pin].join('|');
  },
  sent() { return localStorage.getItem('rutuja_sig') || ''; },
  markSent(b) { localStorage.setItem('rutuja_sig', this.sig(b)); },
  isNew(b) { return this.sig(b) !== this.sent(); },
  line(t) {
    const b = this.get(); if (!b) return '';
    return [b.village_city, b.taluka, b.district].filter(Boolean).join(', ');
  }
};


/* ===================================================================
   PHASE 9 — CART, ORDER WINDOW, LOOK INSIDE
   Cart holds books and quantities. The order window is separate: it
   collects the buyer, then sends the whole order to WhatsApp in one tap.
   =================================================================== */

const CART = {
  app: null,
  items: [],

  init(app) {
    this.app = app;
    try { this.items = JSON.parse(localStorage.getItem('rutuja_cart') || '[]'); }
    catch (e) { this.items = []; }

    document.getElementById('orderX').addEventListener('click', () => ORDER.close());
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-cart-remove]');
      if (b) { this.remove(b.dataset.cartRemove); }
      const n = e.target.closest('[data-nav="cart"]');
      if (n) { e.preventDefault(); this.app.go('cart'); }
    });
    this.sync();
  },

  save() { localStorage.setItem('rutuja_cart', JSON.stringify(this.items)); },

  add(bookId, qty) {
    const f = this.items.find(x => x.id === bookId);
    if (f) f.qty = qty; else this.items.push({ id: bookId, qty });
    this.save(); this.sync(); this.render();
  },

  setQty(bookId, qty) {
    const f = this.items.find(x => x.id === bookId);
    if (!f) return;
    f.qty = Math.max(1, Math.min(10000, qty));
    this.save(); this.sync(); this.render();
  },

  remove(bookId) {
    this.items = this.items.filter(x => x.id !== bookId);
    this.save(); this.sync(); this.render();
  },

  clear() { this.items = []; this.save(); this.sync(); this.render(); },

  /* Every line priced through the same slab logic the book page uses. */
  /* The summary lists books in the same order as the picker above it,
     not in the order they happened to be added. */
  lines() {
    const all = (this.app.content.books || []).filter(b => b.status === 'LIVE');
    const rank = id => {
      const i = all.findIndex(x => x.book_id === id);
      return i < 0 ? 9999 : i;
    };
    return this.items.map(it => {
      const b = (this.app.content.books || []).find(x => x.book_id === it.id);
      if (!b) return null;
      const p = BOOKS.priceFor(b, it.qty);
      return { book: b, qty: it.qty, each: p.each, total: p.total,
               saved: p.saved, pct: p.pct };
    }).filter(Boolean)
      .sort((a, b) => rank(a.book.book_id) - rank(b.book.book_id));
  },

  totals() {
    const l = this.lines();
    return { n: l.length,
             qty: l.reduce((a, x) => a + x.qty, 0),
             total: l.reduce((a, x) => a + x.total, 0),
             saved: l.reduce((a, x) => a + x.saved, 0) };
  },

  sync() {
    const t = this.totals();
    const c = document.getElementById('cartCount');
    const nav = document.getElementById('navCart');
    if (c) c.textContent = t.n;
    if (nav) nav.classList.toggle('has', t.n > 0);
    const bar = document.getElementById('cartBar');
    if (bar) {
      bar.classList.toggle('hidden', t.n === 0);
      document.getElementById('cartBarN').textContent = t.n;
      document.getElementById('cartBarT').textContent = '\u20B9' + t.total;
    }
  },

  render() {
    const box = document.getElementById('cartBody');
    if (!box) return;
    const t = k => this.app.t(k);
    const mr = this.app.lang === 'mr';
    const lines = this.lines();

    if (!lines.length) {
      box.innerHTML = `<div class="cart-empty">
        <p>${t('cart_empty')}</p>
        <button class="btn btn-primary" data-nav="books">${t('cart_empty_go')}</button></div>`;
      box.querySelector('[data-nav]').onclick = () => this.app.go('books');
      return;
    }

    const T = this.totals();
    box.innerHTML = `
      <div class="cart-list">${lines.map(l => `
        <div class="cart-row">
          <div class="cart-thumb">${this.app.img('books', l.book.cover_image, '', this.app.lang === 'mr' ? l.book.name_mr : l.book.name_en)}</div>
          <div class="cart-info">
            ${(() => { const T = MEDIA.bookTitle(l.book, mr); return `<div class="cart-name bt" style="--tw:${T.w};--bc:${T.c}"><i class="bt-mark" aria-hidden="true"></i><span>${T.html}</span></div>`; })()}
            <div class="cart-meta">&#8377;${l.each} ${t('price_each')}
              ${l.pct ? `<span class="cart-pct">${l.pct}% ${t('cart_saving')}</span>` : ''}</div>
          </div>
          <div class="cart-qty">
            <button data-cq="${l.book.book_id}" data-d="-1">&minus;</button>
            <input type="text" inputmode="numeric" value="${l.qty}" data-ci="${l.book.book_id}">
            <button data-cq="${l.book.book_id}" data-d="1">+</button>
          </div>
          <div class="cart-amt">
            <b>&#8377;${l.total}</b>
            ${l.saved ? `<span class="calc-save">&#8377;${l.saved}</span>` : ''}
          </div>
          <button class="cart-x" data-cart-remove="${l.book.book_id}" aria-label="${t('cart_remove')}">&times;</button>
        </div>`).join('')}
      </div>

      <div class="cart-foot">
        <div class="cart-sums">
          <div><span>${T.qty} ${t('price_qty')} &middot; ${T.n} ${t('cart_books')}</span></div>
          ${T.saved ? `<div class="cart-saved">${t('cart_total_save')}
            <b>&#8377;${T.saved}</b></div>` : ''}
          <div class="cart-grand">${t('cart_total')} <b>&#8377;${T.total}</b></div>
          <div class="cond"><span class="cond-i">&#9888;</span><span>${t('price_delivery')}</span></div>
        </div>
        <div class="cart-cta">
          <button class="btn btn-gold" id="cartOrder">${t('cart_order')}</button>
          <button class="btn btn-ghost" id="cartMore">${t('cart_continue')}</button>
        </div>
      </div>`;

    box.querySelectorAll('[data-cq]').forEach(b => b.onclick = () => {
      const it = this.items.find(x => x.id === b.dataset.cq);
      this.setQty(b.dataset.cq, it.qty + (+b.dataset.d));
    });
    /* same lag as the order window had: onchange only fired after tapping
       outside. oninput updates live, with focus and caret restored. */
    box.querySelectorAll('[data-ci]').forEach(i => {
      i.oninput = () => {
        const id = i.dataset.ci;
        const raw = (i.value || '').replace(/\D/g, '').slice(0, 5);
        this.setQty(id, parseInt(raw, 10) || 1);
        const again = document.querySelector(`[data-ci="${id}"]`);
        if (again) {
          again.value = raw;
          again.focus();
          const n = again.value.length;
          try { again.setSelectionRange(n, n); } catch (e) {}
        }
      };
    });
    document.getElementById('cartOrder').onclick = () => ORDER.open(null);
    document.getElementById('cartMore').onclick = () => this.app.go('books');
  },

  /* ---- ORDER WINDOW ---- */
  openOrder() {
    if (!this.lines().length) return;
    const t = k => this.app.t(k);
    const mr = this.app.lang === 'mr';
    const T = this.totals();

    document.getElementById('orderSum').innerHTML = `
      <div class="osum-h">${t('order_summary')}</div>
      ${this.lines().map(l => `<div class="osum-row">
        <span>${mr ? l.book.name_mr : l.book.name_en}</span>
        <span>${l.qty} &times; &#8377;${l.each}</span>
        <b>&#8377;${l.total}</b></div>`).join('')}
      <div class="osum-total"><span>${t('cart_total')}</span>
        <b>&#8377;${T.total}</b></div>
      ${T.saved ? `<div class="osum-save">${t('cart_total_save')} &#8377;${T.saved}</div>` : ''}
      <div class="cond"><span class="cond-i">&#9888;</span><span>${t('price_delivery')}</span></div>`;

    document.getElementById('orderBody').classList.remove('hidden');
    document.getElementById('orderDone').classList.add('hidden');
    document.getElementById('orderWin').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    ORDERFORM.mount();
  },

  closeOrder() {
    document.getElementById('orderWin').classList.add('hidden');
    document.body.style.overflow = '';
  },

  /* The message the publication receives, complete and ready to act on. */
  message(buyer, orderNo, lines, T) {
    /* Always Marathi on WhatsApp — book names, labels and place names —
       even when the visitor filled the form in English. */
    const mr = true;
    const t = k => this.app.tIn('mr', k);
    const P = this.app.placeIn('mr', buyer.state, buyer.district, buyer.taluka);
    lines = lines || this.lines();
    T = T || this.totals();
    const num = mr ? ['१','२','३','४','५','६','७','८','९','१०'] : null;
    const L = lines.map((l, i) => {
      const n = num && num[i] ? num[i] : (i + 1);
      return `${n}. ${mr ? l.book.name_mr : l.book.name_en} — ${l.qty} ${t('price_qty')} × ₹${l.each} = ₹${l.total}`;
    }).join('\n');

    return [
      `${t('pub_name')} — ${t('order_new')}`,
      `${t('order_no')}: ${orderNo}`,
      '',
      `${t('gate_name')}: ${buyer.name}`,
      `${t('gate_whatsapp')}: ${buyer.whatsapp}`,
      buyer.category ? `${t('gate_category')}: ${t('cat_' + buyer.category)}` : '',
      [buyer.village_city, P.taluka, P.district].filter(Boolean).join(', ')
        + (buyer.pin ? ' — ' + buyer.pin : ''),
      '',
      L,
      '',
      `${t('cart_total')}: ₹${T.total}`,
      T.saved ? `${t('cart_total_save')}: ₹${T.saved}` : '',
      t('price_delivery')
    ].filter(Boolean).join('\n');
  },

  orderNo() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return 'RP-O-' + String(d.getFullYear()).slice(2) + mm + '-' +
           String(Math.floor(1000 + Math.random() * 9000));
  }
};

/* ===================================================================
   ORDER FORM — reuses the registration form, pre-filled if the visitor
   already registered at entry. Separate window, same fields, one submit
   that both records the order and opens WhatsApp.
   =================================================================== */

const ORDERFORM = {
  app: null,
  node: null,
  el: {},

  init(app) { this.app = app; },

  mount() {
    if (!this.node) this.build();
    const slot = document.getElementById('orderSlot');
    if (this.node.parentElement !== slot) slot.appendChild(this.node);
    this.repaint();
    this.prefill();
  },

  build() {
    this.node = document.getElementById('formTemplate').content.firstElementChild.cloneNode(true);
    this.node.id = 'orderForm';
    const q = id => this.node.querySelector('#' + id);
    // ids must be unique on the page
    ['gName','gPhone','gCat','gState','gDist','gTal','gVillage','gPin','hp',
     'gateSubmit','gateSkip','parentNote','eName','ePhone','eCat','eState',
     'eDist','eTal','eVillage','ePin','gDistT','gTalT','wDist','wTal'].forEach(id => {
       const n = q(id); if (n) n.id = 'o_' + id;
     });
    const o = id => this.node.querySelector('#o_' + id);
    this.el = { name:o('gName'), phone:o('gPhone'), cat:o('gCat'), state:o('gState'),
                dist:o('gDist'), tal:o('gTal'), village:o('gVillage'), pin:o('gPin'),
                hp:o('hp'), submit:o('gateSubmit'), skip:o('gateSkip'),
                parentNote:o('parentNote'),
                distT:o('gDistT'), talT:o('gTalT'), wDist:o('wDist'), wTal:o('wTal') };

    this.el.submit.classList.add('btn-gold');
    /* the second button belongs here too — it goes back to the books */
    this.el.skip.classList.remove('hidden');
    /* the label comes from the form template — gate_skip, "आधी पुस्तके पाहा".
       It used to be overwritten here with "पुन्हा", which reads wrongly
       before an order has been placed. */
    this.el.skip.onclick = () => { ORDER.close(); this.app.go('books'); };

    this.node.addEventListener('submit', e => { e.preventDefault(); this.submit(); });
    this.el.state.addEventListener('change', () => FORM.onState.call(this));
    this.el.dist.addEventListener('change', () => FORM.onDist.call(this));
    this.el.cat.addEventListener('change', () => {
      this.el.parentNote.classList.toggle('hidden', this.el.cat.value !== 'student');
    });
    RULE.bind(this.el.name, 'name');
    RULE.bind(this.el.village, 'place');
    RULE.bind(this.el.distT, 'place');
    RULE.bind(this.el.talT, 'place');
    RULE.bind(this.el.phone, 'digits', 10);
    RULE.bind(this.el.pin, 'digits', 6);
    this.outside = FORM.outside;
    this.distVal = FORM.distVal;
    this.talVal = FORM.talVal;
    this.onState = FORM.onState;
    this.onDist = FORM.onDist;
  },

  repaint() {
    FORM.repaint.call(this);
    this.el.submit.textContent = this.app.t('submit_continue');
    this.el.village.placeholder = this.app.t('ph_village');
    this.el.pin.placeholder = this.app.t('ph_pin');
    this.el.name.placeholder = this.app.t('gate_name_ph');
    this.el.phone.placeholder = this.app.t('gate_whatsapp_ph');
  },

  prefill() { FORM.prefill.call(this, 'prefillNote', true); },

  validate() { return FORM.validate.call(this); },

  async submit() {
    if (!this.validate()) return;
    const t = k => this.app.t(k);

    const buyer = {
      name: this.el.name.value.trim(),
      whatsapp: '91' + this.el.phone.value,
      category: this.el.cat.value,
      state: this.el.state.value,
      district: FORM.distVal.call(this),
      taluka: FORM.talVal.call(this),
      village_city: this.el.village.value.trim(),
      pin: this.el.pin.value,
      language: this.app.lang
    };
    const orderNo = CART.orderNo();
    const lines = ORDER.lines();
    const T = ORDER.totals();
    if (!lines.length) { alert(t('order_none_picked')); return; }

    this.el.submit.disabled = true;
    this.el.submit.textContent = t('common_loading');

    const payload = {
      kind: 'order', order_no: orderNo, ...buyer,
      items: lines.map(l => ({
        book_id: l.book.book_id,
        name_mr: l.book.name_mr,
        name_en: l.book.name_en,
        standard: l.book.standard,
        medium: l.book.medium,
        subject: l.book.subject_en,
        mrp: l.book.mrp,
        qty: l.qty,
        rate: l.each,
        discount_percent: l.pct,
        amount: l.total,
        saved: l.saved
      })),
      total: T.total, saved: T.saved, website: this.el.hp.value
    };

    const url = this.app.settings.backendUrl;
    if (url) {
      try {
        await fetch(url, { method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload) });
      } catch (err) {
        try { await fetch(url, { method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload) }); } catch (e) {}
      }
    }

    // remember the buyer so a second order needs no retyping
    BUYER.set(buyer);
    BUYER.markSent(buyer);
    localStorage.setItem('rutuja_reg', JSON.stringify({ id: orderNo, cat: buyer.category }));

    /* Recorded on the sheet above; now the same order is handed to
       WhatsApp. The button on the done screen is the fallback for when
       the browser blocks a window opened after an await. */
    const n = this.app.config.whatsapp_number;
    const link = n ? 'https://wa.me/' + n + '?text=' +
      encodeURIComponent(CART.message(buyer, orderNo, lines, T)) : '';
    const wb = document.getElementById('orderWaBtn');
    if (wb) {
      if (link) { wb.href = link; wb.classList.remove('hidden'); }
      else { wb.classList.add('hidden'); }
    }
    if (link) { try { window.open(link, '_blank'); } catch (e) {} }

    this.el.submit.disabled = false;
    this.el.submit.textContent = t('submit_continue');
    document.getElementById('orderNo').textContent = orderNo;
    document.getElementById('orderBody').classList.add('hidden');
    document.getElementById('orderDone').classList.remove('hidden');
    CART.clear();
  }
};


/* ===================================================================
   LOOK INSIDE — sample pages, opened from the fore-edge of the book
   =================================================================== */

const PEEK = {
  app: null, pages: [], i: 0, name: '',

  init(app) {
    this.app = app;
    document.getElementById('peekX').addEventListener('click', () => this.close());
    document.getElementById('peekPrev').addEventListener('click', () => this.go(-1));
    document.getElementById('peekNext').addEventListener('click', () => this.go(1));
    document.addEventListener('keydown', e => {
      if (document.getElementById('peek').classList.contains('hidden')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.go(-1);
      if (e.key === 'ArrowRight') this.go(1);
    });
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-peek]');
      if (t) { e.preventDefault(); e.stopPropagation(); this.open(t.dataset.peek); }
    });
  },

  open(bookId) {
    this.app.pushWin(() => this.close(true));
    const b = (this.app.content.books || []).find(x => x.book_id === bookId);
    if (!b) return;
    this.pages = String(b.gallery_images || '').split(',').map(x => x.trim()).filter(Boolean);
    if (!this.pages.length) return;
    this.name = this.app.lang === 'mr' ? b.name_mr : b.name_en;
    this.book = b;
    this.i = 0;
    document.getElementById('peek').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    this.draw();
  },

  close(fromBack) {
    if (!fromBack) this.app.popWin();
    document.getElementById('peek').classList.add('hidden');
    document.body.style.overflow = '';
  },

  go(d) {
    const n = this.pages.length;
    const next = (this.i + d + n) % n;
    const fr = document.getElementById('peekFrame');
    fr.classList.remove('turn-l', 'turn-r');
    void fr.offsetWidth;                       // restart the animation
    fr.classList.add(d > 0 ? 'turn-r' : 'turn-l');
    this.i = next;
    this.draw();
  },

  draw() {
    document.getElementById('peekFrame').innerHTML =
      this.app.img('books', this.pages[this.i], '', this.name);
    /* the same treatment as every other book title */
    const pb = this.book;
    const pn = document.getElementById('peekName');
    if (pb) {
      const T = MEDIA.bookTitle(pb, this.app.lang === 'mr');
      pn.className = 'peek-name bt';
      pn.style.setProperty('--tw', T.w);
      pn.style.setProperty('--bc', T.c);
      pn.innerHTML = `<i class="bt-mark" aria-hidden="true"></i><span>${T.html}</span>`;
    } else {
      pn.className = 'peek-name';
      pn.textContent = this.name;
    }
    // Marathi reads "8 पैकी 3", English reads "3 of 8"
    document.getElementById('peekCount').textContent = this.app.lang === 'mr'
      ? `${this.pages.length} ${this.app.t('inside_of')} ${this.i + 1}`
      : `${this.i + 1} ${this.app.t('inside_of')} ${this.pages.length}`;
    const one = this.pages.length < 2;
    document.getElementById('peekPrev').classList.toggle('hidden', one);
    document.getElementById('peekNext').classList.toggle('hidden', one);
  }
};

/* ===================================================================
   ORDER — the third way in. Reached from a book, from the list, or
   straight from the home page without visiting either.
   =================================================================== */

const ORDER = {
  app: null,
  picked: [],          // [{id, qty}] chosen inside this window

  init(app) {
    this.app = app;
    const nav = document.getElementById('navOrder');
    if (nav) nav.addEventListener('click', e => { e.preventDefault(); this.open(null); });
    const hero = document.getElementById('heroOrder');
    if (hero) hero.addEventListener('click', () => this.open(null));
    const again = document.getElementById('orderBooksAgain');
    if (again) again.addEventListener('click', () => { this.close(); app.go('books'); });
  },

  /* preset = books to start with. null means start from the list,
     or from nothing if the list is empty. */
  open(preset) {
    this.app.pushWin(() => this.close(true));
    const fromCart = CART.items.map(x => ({ id: x.id, qty: x.qty }));
    this.picked = preset && preset.length ? preset
                : (fromCart.length ? fromCart : []);
    document.getElementById('orderBody').classList.remove('hidden');
    document.getElementById('orderDone').classList.add('hidden');
    document.getElementById('orderWin').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    this.draw();
    ORDERFORM.mount();
  },

  qtyOf(id) { const f = this.picked.find(x => x.id === id); return f ? f.qty : 0; },

  setQty(id, q) {
    q = Math.max(0, Math.min(10000, q));
    const i = this.picked.findIndex(x => x.id === id);
    if (q === 0) { if (i >= 0) this.picked.splice(i, 1); }
    else if (i >= 0) this.picked[i].qty = q;
    else this.picked.push({ id, qty: q });
    this.draw();
  },

  /* Always in book-section order, never in the order quantities were
     typed. The same rule as the cart; this builder is a separate one
     and was missed when the cart was fixed. */
  lines() {
    const all = (this.app.content.books || []).filter(b => b.status === 'LIVE');
    const rank = id => {
      const i = all.findIndex(x => x.book_id === id);
      return i < 0 ? 9999 : i;
    };
    return this.picked.slice()
      .sort((a, b) => rank(a.id) - rank(b.id))
      .map(p => {
      const b = (this.app.content.books || []).find(x => x.book_id === p.id);
      if (!b) return null;
      const pr = BOOKS.priceFor(b, p.qty);
      return { book: b, qty: p.qty, each: pr.each, total: pr.total, saved: pr.saved, pct: pr.pct };
    }).filter(Boolean);
  },

  totals() {
    const l = this.lines();
    return { n: l.length, qty: l.reduce((a,x) => a + x.qty, 0),
             total: l.reduce((a,x) => a + x.total, 0),
             saved: l.reduce((a,x) => a + x.saved, 0) };
  },

  /* Every book listed with a quantity box, so a visitor who never
     opened a single book page can still place a complete order. */
  draw() {
    const t = k => this.app.t(k);
    const mr = this.app.lang === 'mr';
    const books = (this.app.content.books || []).filter(b => b.status === 'LIVE');

    document.getElementById('orderPick').innerHTML = `
      
      <div class="opick-list">${books.map((b, i) => {
        const q = this.qtyOf(b.book_id);
        const pr = BOOKS.priceFor(b, q || 1);
        const sl = BOOKS.slabs(b.offer_id);
        const cur = q || 1;
        const strip = sl.length ? `<div class="oslab">
          <span class="oslab-h">${t('slab_pick')}</span>
          ${sl.map(o => {
            const on = cur >= o.qty_min && cur <= BOOKS.topOf(o);
            return `<button class="oslab-c${on ? ' on' : ''}"
              data-jump="${b.book_id}" data-q="${o.qty_min}">
              <b>${BOOKS.slabLabel(o)}</b><i>&#8377;${o.selling_rate}</i></button>`;
          }).join('')}
        </div>` : '';
        return `<div class="opick-row bk-${(i % 5) + 1}${q ? ' on' : ''}">
          <div class="opick-cover">${this.app.img('books', b.cover_image, '', this.app.lang === 'mr' ? b.name_mr : b.name_en)}</div>
          <div class="opick-main">
            ${(() => { const T = MEDIA.bookTitle(b, mr); return `<div class="opick-name bt" style="--tw:${T.w};--bc:${T.c}"><i class="bt-mark" aria-hidden="true"></i><span>${T.html}</span></div>`; })()}
            <div class="opick-money">
              <span class="om-mrp"><em>${t('mrp_short')}</em><s>&#8377;${b.mrp}</s></span>
              <span class="om-arrow">&rarr;</span>
              <span class="om-now${pr.pct ? ' live' : ''}">
                <em>${t('now_rate')}</em><b>&#8377;${pr.each}</b></span>
              ${pr.pct ? `<span class="om-off">${pr.pct}% ${t('price_discount')}</span>` : ''}
            </div>
            <div class="opick-qty">
              <span class="opick-qlbl">${t('price_qty')}</span>
              <div class="cart-qty">
                <button data-oq="${b.book_id}" data-d="-1">&minus;</button>
                <input type="text" inputmode="numeric" value="${q}" data-oi="${b.book_id}">
                <button data-oq="${b.book_id}" data-d="1">+</button>
              </div>
              ${q ? `<span class="opick-line">${q} &times; &#8377;${pr.each} =
                <b>&#8377;${pr.total}</b>${pr.saved ? `<span class="om-saved">&#8377;${pr.saved} ${t('saved_amt')}</span>` : ''}</span>` : ''}
            </div>
            ${strip}
          </div>
        </div>`;
      }).join('')}</div>`;

    const T = this.totals();
    try { NEEDHD.set('order'); } catch (e) { console.error('needhd', e); }
    try { PATH.draw('orderBody', 'orderPath', 'gold'); } catch (e) { console.error('path', e); }
    const L = this.lines();
    const mrpTotal = L.reduce((a, l) => a + l.book.mrp * l.qty, 0);
    const avgPct = mrpTotal ? Math.round(T.saved / mrpTotal * 100) : 0;

    document.getElementById('orderSum').innerHTML = T.n ? `
      <div class="osum-h">${t('order_lines')}</div>
      ${L.map(l => `<div class="oline">
        ${(() => { const T = MEDIA.bookTitle(l.book, mr); return `<div class="oline-name bt" style="--tw:${T.w};--bc:${T.c}"><i class="bt-mark" aria-hidden="true"></i><span>${T.html}</span></div>`; })()}
        <div class="oline-facts">
          ${l.pct ? `<span class="of of-pct">${l.pct}% ${t('price_discount')}</span>` : ''}
          <span class="of of-rate">&#8377;${l.each} ${t('per_unit')}</span>
          ${l.saved ? `<span class="of of-save">&#8377;${l.saved} ${t('saved_amt')}</span>` : ''}
        </div>
        <div class="oline-amt"><span>${l.qty} &times; &#8377;${l.each}</span>
          <b>&#8377;${l.total}</b></div>
      </div>`).join('')}

      <div class="osum-foot">
        ${T.saved ? `<div class="osf"><span>${t('at_mrp')}</span><s>&#8377;${mrpTotal}</s></div>` : ''}
        ${avgPct ? `<div class="osf osf-avg"><span>${t('avg_saving')}</span><b>${avgPct}%</b></div>` : ''}
        ${T.saved ? `<div class="osf osf-save"><span>${t('you_save_now')}</span>
          <b>&#8377;${T.saved}</b></div>` : ''}
        <div class="osf osf-grand"><span>${t('grand_total')}</span><b>&#8377;${T.total}</b></div>
      </div>
      <div class="cond"><span class="cond-i">&#9888;</span><span>${t('price_delivery')}</span></div>`
      : `<div class="osum-empty">${t('order_none_picked')}</div>`;

    const box = document.getElementById('orderPick');
    box.querySelectorAll('[data-oq]').forEach(b =>
      b.onclick = () => this.setQty(b.dataset.oq, this.qtyOf(b.dataset.oq) + (+b.dataset.d)));
    /* was onchange, which only fired after tapping outside the box, so the
       new rate and the discount appeared late. oninput updates as it is
       typed; the row is redrawn, so focus and caret are put back. */
    box.querySelectorAll('[data-oi]').forEach(i => {
      i.oninput = () => {
        const id = i.dataset.oi;
        const raw = (i.value || '').replace(/\D/g, '').slice(0, 5);
        this.setQty(id, parseInt(raw, 10) || 0);
        const again = document.querySelector(`[data-oi="${id}"]`);
        if (again) {
          again.value = raw;
          again.focus();
          const n = again.value.length;
          try { again.setSelectionRange(n, n); } catch (e) {}
        }
      };
    });
    box.querySelectorAll('[data-jump]').forEach(b =>
      b.onclick = () => this.setQty(b.dataset.jump, +b.dataset.q));
  },

  close(fromBack) {
    if (!fromBack) this.app.popWin();
    document.getElementById('orderWin').classList.add('hidden');
    document.body.style.overflow = '';
  }
};


/* ===================================================================
   STORY BAND — nine chapters, one visual system.
   LEFT   keyword + symbol, always with a divider
   MIDDLE the narrative, the primary intellectual carrier
   RIGHT  two to four stacked words, the impact zone
   Three seconds each, right to left, automatic.
   =================================================================== */

const STORY = {
  app: null, i: 0, timer: null, held: false,

  /* bg, deep, keyword, narrative, impact, rule */
  SKIN: [
    ['#0F6E56','#0A5240','#FAC775','#CFEBE0','#FAC775','#EF9F27'],
    ['#26215C','#1C1846','#FAC775','#CECBF6','#FAC775','#FAC775'],
    ['#1E1A4A','#161339','#FAC775','#C4C0EE','#FAC775','#FAC775'],
    ['#0B3D28','#07301F','#FAC775','#A9D8C4','#FAC775','#EF9F27'],
    ['#0F6E56','#0A5240','#FAC775','#CFEBE0','#FAC775','#EF9F27'],
    ['#1E332B','#152520','#FAC775','#AFC7BC','#FAC775','#EF9F27'],
    ['#993C1D','#7A2E14','#FAECE7','#F5C4B3','#FAC775','#FAC775'],
    ['#0F6E56','#0A5240','#FAC775','#CFEBE0','#FAC775','#EF9F27'],
    ['#0E5C57','#0A4642','#FAC775','#B6E0DA','#FAC775','#EF9F27']
  ],

  /* One symbol per chapter, drawn rather than illustrated, so it stays
     sharp at any size and carries the idea rather than decorating it. */
  SYM: {
    logo:   '',
    rings:  '<circle cx="24" cy="24" r="6" class="f"/><circle cx="24" cy="24" r="12" class="o"/><circle cx="24" cy="24" r="18" class="o" opacity=".45"/>',
    door:   '<rect x="12" y="10" width="24" height="28" rx="2" class="o"/><path d="M24 10v28" class="o"/><path d="M30 38 42 30V14L30 10" class="f2"/>',
    arrow:  '<circle cx="24" cy="24" r="17" class="o" opacity=".4"/><path d="M24 8v32M24 8l-6 8M24 8l6 8" class="o"/>',
    triad:  '<circle cx="17" cy="20" r="9" class="o"/><circle cx="31" cy="20" r="9" class="o"/><circle cx="24" cy="31" r="9" class="o"/>',
    base:   '<rect x="8" y="30" width="32" height="7" rx="1.5" class="f"/><rect x="13" y="21" width="22" height="7" rx="1.5" class="o"/><rect x="18" y="12" width="12" height="7" rx="1.5" class="o" opacity=".5"/>',
    letter: '<circle cx="24" cy="24" r="17" class="o" opacity=".35"/><text x="24" y="32" class="g">अ</text>',
    arc:    '<path d="M10 32c8 0 8-16 14-16s6 16 14 16" class="o"/><circle cx="10" cy="32" r="4" class="f"/><circle cx="38" cy="32" r="4" class="f"/>',
    check:  '<path d="M12 26l8 8 16-18" class="o2"/><circle cx="24" cy="24" r="18" class="o" opacity=".35"/>'
  },

  /* Each keyword is revealed differently: beam, radiate, strokes,
     sweep, pulse — one visual language, nine expressions. */
  KWFX: ['beam','rings','door','arrow','triad','rise','spark','join','glow'],

  /* MIDDLE→RIGHT divider, exactly as specified */
  MIDRULE: [true, false, true, false, true, false, false, true, false],

  init(app) {
    this.app = app;
    const box = document.getElementById('story');
    const track = document.getElementById('storyTrack');
    if (!box || !track) return;

    let x0 = 0, y0 = 0, dx = 0, dragging = false, w = 1;

    const begin = e => {
      const t = e.touches ? e.touches[0] : e;
      x0 = t.clientX; y0 = t.clientY; dx = 0; dragging = true;
      w = box.offsetWidth || 1;
      this.held = true; this.stop();
      track.style.transition = 'none';
    };

    /* The slide follows the finger, so the gesture is felt, not guessed. */
    const move = e => {
      if (!dragging) return;
      const t = e.touches ? e.touches[0] : e;
      const mx = t.clientX - x0, my = t.clientY - y0;
      if (Math.abs(mx) < Math.abs(my)) return;   // a vertical scroll, leave it alone
      if (e.cancelable) e.preventDefault();
      dx = mx;
      track.style.transform = `translateX(calc(-${this.i * 100}% + ${dx}px))`;
    };

    const end = () => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      const far = Math.abs(dx) > Math.min(70, w * 0.16);
      if (far) this.go(this.i + (dx < 0 ? 1 : -1)); else this.go(this.i);
      this.held = false;
      this.start();
    };

    box.addEventListener('touchstart', begin, { passive: true });
    box.addEventListener('touchmove',  move,  { passive: false });
    box.addEventListener('touchend',   end);
    box.addEventListener('touchcancel',end);
    box.addEventListener('mousedown',  begin);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup',   end);

    box.addEventListener('mouseenter', () => this.stop());
    box.addEventListener('mouseleave', () => { if (!this.held) this.start(); });
  },

  /* Each slide may set its own seconds. Anything without one falls
     back to story_seconds in Config, and that to 3. */
  secs(i) {
    const cfg = Number((this.app.content.config || {}).story_seconds);
    const base = cfg > 0 ? cfg : 3;
    const sl = (this.app.story || [])[i === undefined ? this.i : i] || {};
    const own = Number(sl.seconds);
    return (own > 0 ? own : base) * 1000;
  },

  /* Size responds to how much the slide actually carries. */
  /* A starting size only. The real size is measured after rendering. */
  narSize() { return 'auto'; },



  /* Key concepts are lifted in contrast colour, not merely bolded. */
  mark(text) {
    return text.replace(/\[\[(.+?)\]\]/g, '<b class="st-key">$1</b>');
  },

  impSize(words) {
    const longest = Math.max(...words.map(w => w.length));
    if (longest >= 11) return 'sm';
    if (longest >= 8) return 'md';
    return 'lg';
  },

  /* A one-box phrase is sized so it stays on a single line.
     Worked out from its length, once, at render time. */
  /* force is true, false, or undefined for the automatic rule */
  oneLine(text, force, fixed) {
    if (force === false) return null;
    if (fixed) return Number(fixed);
    const n = text.trim().length;
    if (!n) return null;
    const dev = /[\u0900-\u097F]/.test(text);
    const px = Math.round((302 / (n * (dev ? 0.50 : 0.47))) * 10) / 10;
    if (px >= 19) return 19;
    if (force === true) return Math.max(11, px);
    if (px >= 15) return px;
    return null;
  },

  paint() {
    const track = document.getElementById('storyTrack');
    if (!track) return;
    const t = k => this.app.t(k);

    const L = this.app.lang === 'mr' ? 'mr' : 'en';
    const S = i => (this.app.story || []).find(x => Number(x.slide) === i) || {};
    const F = (i, f) => { const o = S(i); return o[f + '_' + L] || o[f + '_mr'] || ''; };

    const slides = (this.app.story || []);
    if (!slides.length) return;

    track.innerHTML = slides.map((sl, k) => {
      const n = Number(sl.slide) || (k + 1);
      const fb = this.SKIN[k] || this.SKIN[0];
      const bg   = sl.background       || fb[0];
      const deep = sl.left_panel       || fb[1];
      const kw   = sl.chapter_colour   || fb[2];
      const nar  = sl.narrative_colour || fb[3];
      const imp  = sl.highlight_colour || fb[4];
      const rule = sl.divider_colour   || fb[5];
      const fx   = sl.keyword_effect   || this.KWFX[k] || 'beam';
      const sym  = this.SYM[sl.symbol] !== undefined ? this.SYM[sl.symbol] : this.SYM.rings;
      const isLogo = (sl.symbol || '') === 'logo';
      const blocks = F(n, 'narrative').split('//').map(b => b.split('|'));
      const size = this.narSize(blocks);
      const words = F(n, 'impact').split('|');
      const mid = sl.right_divider !== undefined ? !!sl.right_divider : !!this.MIDRULE[k];
      if (isLogo) {
        return `<article class="st st-hero" style="--bg:${bg};--deep:${deep};--kw:${kw};--nar:${nar};--imp:${imp};--rule:${rule}">

          <div class="sh-title">
            <span class="sh-box"><em>${F(n, 'chapter')}</em></span>
            <span class="sh-underline"></span>
          </div>

          <div class="sh-logo-wrap">
            <span class="sh-rays" aria-hidden="true"></span>
            <img src="assets/img/rutuja-logo.png" alt="${t('pub_name')}" class="sh-logo">
          </div>

          <p class="sh-quote">${F(n, 'tagline')}</p>

          <div class="sh-steps${F(n,'impact').split('|').length === 1 ? ' one' : ''}${sl.big_boxes ? ' big' : ''}">
            ${F(n, 'impact').split('|').map((w, wi, arr) =>
              `<span class="sh-step" style="--d:${wi * 0.6}s${
                arr.length === 1
                  ? (this.oneLine(w, sl.box_one_line, sl.box_size)
                      ? `;--one:${this.oneLine(w, sl.box_one_line, sl.box_size)}px;white-space:nowrap`
                      : (sl.box_size ? `;--one:${sl.box_size}px` : ''))
                  : ''}">${w.trim()}</span>`).join('')}
          </div>

          <span class="st-pg"><i style="width:${Math.round(((k + 1) / slides.length) * 100)}%"></i></span>
        </article>`;
      }

      return `<article class="st" style="--bg:${bg};--deep:${deep};--kw:${kw};--nar:${nar};--imp:${imp};--rule:${rule}">

        <div class="sh-title">
          <span class="st-orb"><svg viewBox="0 0 48 48" aria-hidden="true">${sym}</svg></span>
          <span class="sh-box"><em>${F(n, 'chapter')}</em></span>
        </div>
        <span class="sh-underline"></span>

        <div class="st-m"${(() => {
          const px = sl['text_size_' + L] || sl.text_size;
          return px ? ` style="--fs-max:${px}px"` : '';
        })()}>
          ${blocks.map((blk, bi) => {
            const lastBlock = bi === blocks.length - 1;
            const rows = blk.map((l, li) => {
              const em = l.startsWith('**');
              const chain = l.startsWith('>>');
              const txt = this.mark(l.replace(/^(\*\*|>>)/, ''));
              if (chain) return `<p class="st-chain">${txt.split('→').map(x =>
                `<span>${x.trim()}</span>`).join('<i class="st-arw">&rarr;</i>')}</p>`;
              if (em) return `<p class="st-nar ${size} em">${txt}</p>`;
              return `<p class="st-nar ${size}">${txt}</p>`;
            }).join('');
            return `<div class="st-blk${bi ? ' next' : ''}">${rows}</div>`;
          }).join('')}
        </div>

        <div class="sh-steps${mid ? ' ruled' : ''}${words.length === 1 ? ' one' : ''}${sl.big_boxes ? ' big' : ''}">
          ${words.map((w, wi) =>
            `<span class="sh-step" style="--d:${wi * 0.6}s${
              words.length === 1
                ? (this.oneLine(w, sl['box_one_line_' + L] !== undefined ? sl['box_one_line_' + L] : sl.box_one_line,
                                sl['box_size_' + L] || sl.box_size)
                    ? `;--one:${this.oneLine(w, sl['box_one_line_' + L] !== undefined ? sl['box_one_line_' + L] : sl.box_one_line,
                                              sl['box_size_' + L] || sl.box_size)}px;white-space:nowrap`
                    : ((sl['box_size_' + L] || sl.box_size) ? `;--one:${sl['box_size_' + L] || sl.box_size}px` : ''))
                : ''}">${w.trim()}</span>`).join('')}
        </div>

        <span class="st-pg"><i style="width:${Math.round(((k + 1) / slides.length) * 100)}%"></i></span>
      </article>`;
    }).join('');

    document.getElementById('storyDots').innerHTML =
      slides.map((_, k) => `<button class="st-dot${k === this.i ? ' on' : ''}" data-s="${k}"></button>`).join('');
    document.querySelectorAll('.st-dot').forEach(d =>
      d.addEventListener('click', () => { this.go(+d.dataset.s); this.start(); }));

    this.go(this.i);
    this.start();

  },

  go(n) {
    const total = (this.app.story || []).length || 1;
    this.i = (n + total) % total;
    const tr = document.getElementById('storyTrack');
    if (tr) { tr.style.transition = ''; tr.style.transform = `translateX(-${this.i * 100}%)`; }
    document.querySelectorAll('.st-dot').forEach((d, k) =>
      d.classList.toggle('on', k === this.i));
  },

  start() {
    this.stop();
    this.timer = setTimeout(() => { this.go(this.i + 1); this.start(); }, this.secs());
  },
  stop() { clearTimeout(this.timer); }
};


/* ===================================================================
   PATH — the strip under a window's title
   Built by reading every [data-step] inside the window, in DOM order.
   Nothing is hard-coded, so adding, removing or reordering a section
   updates the route with no further work. A section with no data-step
   simply does not appear, rather than showing something stale.
   =================================================================== */

/* The form section speaks to whoever opened the window. Each title is
   sized to the largest that still holds one row, the same way a video
   title is, so nothing has to be shortened to fit. */
const NEEDHD = {
  app: null,
  init(app) { this.app = app; },

  set(key) {
    const k = ['school', 'bulk', 'retail', 'parent'].indexOf(key) >= 0 ? key : 'order';
    const t = this.app.t('nh_' + k);
    const sub = this.app.t('ns_' + k);
    const mr = this.app.lang === 'mr';
    document.querySelectorAll('.need-t').forEach(h => {
      const sp = h.querySelector('span');
      if (sp) sp.textContent = t;
      h.style.setProperty('--chw', (t.length * (mr ? 0.394 : 0.371)).toFixed(2));
    });
    document.querySelectorAll('.need-s').forEach(p => { p.textContent = sub; });
  }
};


const PATH = {
  app: null,
  init(app) { this.app = app; },

  /* `root` is the window, `host` where the strip goes, `tone` its colour.
     `swap` renames steps for a window that serves several audiences —
     the four offer windows share one DOM but need four routes. */
  draw(rootId, hostId, tone, swap) {
    const root = document.getElementById(rootId);
    const host = document.getElementById(hostId);
    if (!root || !host) return;

    const steps = [];
    root.querySelectorAll('[data-step]').forEach(el => {
      if (el.closest('.hidden')) return;
      String(el.dataset.step || '').split(',').forEach(raw => {
        const k = (swap && swap[raw.trim()]) || raw.trim();
        if (k && steps.indexOf(k) < 0) steps.push(k);
      });
    });

    if (!steps.length) { host.innerHTML = ''; host.className = 'wpath empty'; return; }

    host.className = 'wpath wp-' + (tone || 'gold');
    /* the lead-in says what the strip is before listing the route */
    host.innerHTML = `<span class="wp-lead">${this.app.t('path_lead')}</span>` +
      steps.map((k, i) => `
        <span class="wp-s">${this.app.t(k)}</span>
        ${i < steps.length - 1 ? `<i class="wp-a" style="--d:${(i + 1) * 0.1}s" aria-hidden="true"></i>` : ''}
      `).join('');
  }
};


/* ===================================================================
   Q & A — answers, and the route back into the books
   data/qa.json is fetched only when the page is opened, so the
   first paint of the site stays exactly as light as it was.
   =================================================================== */

const QA = {
  app: null, data: null, meta: {}, loading: false, cat: '', open: '', aud: '',

  init(app) {
    this.app = app;
    const box = document.getElementById('qaBody');
    if (box) box.addEventListener('click', e => this.tap(e));
    const det = document.getElementById('bookDetail');
    if (det) det.addEventListener('click', e => this.tap(e));
    const mod = document.getElementById('modalQA');
    if (mod) mod.addEventListener('click', e => this.tap(e));
    const send = document.getElementById('qaSend');
    if (send) send.addEventListener('click', () => this.ask());
  },

  /* One delegated handler serves the page and the book block. */
  tap(e) {
    const c = e.target.closest('[data-qcat]');
    if (c) { this.cat = c.dataset.qcat; this.open = ''; this.render(); return; }
    const h = e.target.closest('[data-qid]');
    if (h) { this.open = this.open === h.dataset.qid ? '' : h.dataset.qid;
             this.render(); this.paintBook(); this.paintAudience(); return; }
    const b = e.target.closest('[data-qbook]');
    if (b) { e.preventDefault(); BOOKS.openBook(b.dataset.qbook); }
  },

  onPage(page) { if (page === 'qa') this.load(); },

  async load() {
    if (this.data) { this.render(); return this.data; }
    if (this.loading) return null;
    this.loading = true;
    this.render();
    try {
      const r = await fetch('data/qa.json?v=' + this.app.VERSION);
      const j = await r.json();
      this.meta = j || {};
      this.data = (j && j.questions) || [];
    } catch (err) {
      console.error('Q&A load failed', err);
      this.data = [];
    }
    this.loading = false;
    this.render();
    this.paintBook();
    this.paintAudience();
    return this.data;
  },

  live() {
    return (this.data || [])
      .filter(q => q.status === 'LIVE')
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  },

  L() { return this.app.lang === 'mr' ? 'mr' : 'en'; },

  chips() { return this.meta.chips || []; },
  groups() { return (this.meta.groups || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)); },

  /* Line breaks in the source are real; bullets stay readable. */
  body(text) {
    return String(text || '').split('\n')
      .map(l => l.trim() ? `<p class="qa-p">${l}</p>` : '')
      .join('');
  },

  bookLink(id) {
    if (!id) return '';
    const b = (this.app.content.books || []).find(x => x.book_id === id);
    if (!b) return '';
    const mr = this.L() === 'mr';
    return `<a class="qa-book" href="#books" data-qbook="${id}">${mr ? b.name_mr : b.name_en} &rarr;</a>`;
  },

  item(q, hideBook) {
    const L = this.L();
    const on = this.open === q.qa_id;
    return `<div class="qa-item${on ? ' on' : ''}">
      <button class="qa-q" data-qid="${q.qa_id}" aria-expanded="${on}">
        <i class="qa-qmark" aria-hidden="true"></i>
        <span class="qa-qt">${q['question_' + L]}</span><span class="qa-sign" aria-hidden="true"></span>
      </button>
      <div class="qa-a"><div class="qa-inner">${this.body(q['answer_' + L])}${hideBook ? '' : this.bookLink(q.book_id)}</div></div>
    </div>`;
  },

  render() {
    const box = document.getElementById('qaBody');
    if (!box) return;
    const t = k => this.app.t(k);

    if (this.loading && !this.data) { box.innerHTML = `<p class="qa-wait">${t('common_loading')}</p>`; return; }

    const all = this.live();
    if (!all.length) { box.innerHTML = `<p class="qa-wait">${t('qa_none')}</p>`; return; }

    const L = this.L();
    const sel = this.cat || 'all';

    /* The first chip stands alone on the left, spanning both rows; the
       other six sit in a fixed three-by-two grid beside it. */
    const chipAll = this.chips()[0] || { id: 'all', mr: 'सर्व', en: 'All' };
    const six = this.chips().slice(1);
    const chips = `
      <div class="qa-chips">
        <button class="qa-chip qa-chip-all${sel === chipAll.id ? ' on' : ''}" data-qcat="${chipAll.id}">${chipAll[L]}</button>
        <div class="qa-chip-grid">${six.map((c, i) =>
          `<button class="qa-chip qa-chip-n${i + 1}${sel === c.id ? ' on' : ''}" data-qcat="${c.id}">${c[L]}</button>`
        ).join('')}</div>
      </div>`;

    let n = 0;
    const groups = this.groups()
      .filter(g => sel === 'all' || g.chip === sel)
      .map(g => {
        const mine = all.filter(q => q.group === g.id);
        if (!mine.length) return '';
        n++;
        const book = g.kind === 'book';
        return `<section class="qa-group${book ? ' qa-group-book' : ''}${n % 2 ? ' qa-tint' : ''}" data-step="qg_${g.id}">
          <header class="qa-gh">
            <i class="qa-gmark" aria-hidden="true"></i>
            <span class="qa-gt">${g[L]}</span>
          </header>
          <div class="qa-list">${mine.map(q => this.item(q, book)).join('')}</div>
        </section>`;
      }).join('');

    box.innerHTML = chips + `<div class="qa-groups">${groups}</div>`;
    try { PATH.draw('page-qa', 'qaPath', 'green'); } catch (e) { console.error('path', e); }
  },

  /* The same questions, filtered, sitting on the book's own page. */
  /* A book page carries two blocks: the questions about that book, and
     the whole Learning and Curriculum set, which explains where the book
     sits inside Pragat Maharashtra, the NEP and NIPUN Bharat. */
  paintBook() {
    const root = document.getElementById('bookDetail');
    if (!root || !BOOKS.current) return;
    const host = root.querySelector('#qaForBook');
    if (!host) return;
    const t = k => this.app.t(k);
    const mine  = this.live().filter(q => q.book_id === BOOKS.current);
    const learn = this.live().filter(q => q.group === 'g_learn');
    if (!mine.length && !learn.length) { host.innerHTML = ''; return; }

    const block = (cls, head, sub, rows) => rows.length ? `
      <section class="qa-bsec ${cls}" data-step="st_b_qa">
        <div class="hd hd-sm qa-bhd">
          <h3 class="hd-t"><i class="hd-mark" aria-hidden="true"></i><span>${t(head)}</span></h3>
          <p class="hd-s">${t(sub)}</p>
        </div>
        <div class="qa-list qa-list-book">${rows.map(q => this.item(q, true)).join('')}</div>
      </section>` : '';

    host.innerHTML =
      block('qa-bsec-learn', 'qa_learn_head', 'qa_learn_sub', learn) +
      block('qa-bsec-book',  'qa_for_book',   'qa_book_sub',  mine);
  },

  /* The questions that belong to one offer button, below its form. */
  paintAudience() {
    const host = document.getElementById('modalQA');
    if (!host) return;
    if (!this.aud) { host.innerHTML = ''; return; }
    const mine = this.live().filter(q =>
      (q.audience || '').split(',').map(x => x.trim()).indexOf(this.aud) >= 0);
    if (!mine.length) { host.innerHTML = ''; return; }
    const t = k => this.app.t(k);
    const L = this.L();
    const head = { school: 'qa_h_school', bulk: 'qa_h_bulk',
                   retail: 'qa_h_retail', parent: 'qa_h_parent' }[this.aud] || 'qa_h_default';
    host.innerHTML = `
      <div class="hd hd-sm">
        <h3 class="hd-t"><i class="hd-mark" aria-hidden="true"></i><span>${t(head)}</span></h3>
        <p class="hd-s">${t('qa_h_sub')}</p>
      </div>
      ${this.groups().filter(g => mine.some(q => q.group === g.id)).map((g, i) => {
        const rows = mine.filter(q => q.group === g.id);
        const book = g.kind === 'book';
        return `<section class="qa-group qa-group-modal${book ? ' qa-group-book' : ''}${i % 2 ? ' qa-tint' : ''}">
          <header class="qa-gh">
            <i class="qa-gmark" aria-hidden="true"></i>
            <span class="qa-gt">${g[L]}</span>
          </header>
          <div class="qa-list qa-list-modal">${rows.map(q => this.item(q, book)).join('')}</div>
        </section>`;
      }).join('')}`;
  },

  forAudience(key) {
    this.aud = key || '';
    this.open = '';
    if (this.data) this.paintAudience(); else this.load();
  },

  forBook(root) {
    if (!root) return;
    const host = document.createElement('div');
    host.id = 'qaForBook';
    host.className = 'qa-book-block';
    root.appendChild(host);
    if (this.data) this.paintBook(); else this.load();
  },

  /* The question goes to WhatsApp, not to a sheet. No await before
     the call, so the tap keeps its gesture and the window opens. */
  ask() {
    const el = document.getElementById('qaAsk');
    if (!el) return;
    const q = (el.value || '').trim().slice(0, 400);
    if (!q) { el.focus(); return; }
    const link = this.app.wa('wa_qa', q, 'mr');
    if (link) { window.open(link, '_blank'); el.value = ''; }
    else this.app.go('contact');
  },

  paint() { this.render(); this.paintBook(); this.paintAudience(); }
};
