/* ===================================================================
   RUTUJA PUBLICATION — APP
   Phase 5: language gate, routing, top strip, contact, footer.
   Phases 6-11 add their modules below without touching this core.
   =================================================================== */

const RUTUJA = {
  VERSION: 'v8e',
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
      const [t, l, c] = await Promise.all([
        fetch('data/sitetext.json').then(r => r.json()),
        fetch('data/locations.json').then(r => r.json()),
        fetch('data/content.json').then(r => r.json())
      ]);
      this.text = t;
      this.locations = l;
      this.content = c;
    } catch (e) {
      console.error('Data load failed', e);
    }

    this.config = this.defaultConfig();

    BOOKS.init(this);
    MEDIA.init(this);
    ENTRY.init(this);
  },

  /* ---- SETTINGS YOU CAN CHANGE ---- */
  settings: {
    // Paste your Apps Script Web App URL between the quotes.
    backendUrl: 'https://script.google.com/macros/s/AKfycbxVqP0kTJSbn9bc2oesvfSKqt21CpTD0qMRb2y8Bk1UUNH8XBjTfH60cCQ3cWd4Fhqu/exec',
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

  setLang(lang, silent) {
    this.lang = lang;
    localStorage.setItem('rutuja_lang', lang);
    document.documentElement.lang = lang;
    document.getElementById('langLabel').textContent = lang === 'mr' ? 'English' : 'मराठी';
    this.paint();
    ENTRY.repaint();
    if (!silent) window.scrollTo(0, 0);
  },

  /* Leaves the entry screen and reveals the website. */
  enterSite() {
    document.getElementById('entry').classList.add('hidden');
    document.getElementById('site').classList.remove('hidden');
    document.body.style.overflow = '';
    window.scrollTo(0, 0);
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

  /* ---- 3. RENDER ---- */
  paint() {
    document.querySelectorAll('[data-t]').forEach(el => {
      const v = this.t(el.dataset.t);
      if (v) el.textContent = v;
    });
    // Each section is isolated: if one fails, the rest of the site still renders.
    [['strip', () => this.paintStrip()],
     ['standards', () => this.paintStandards()],
     ['offers', () => this.paintOffers()],
     ['explore', () => this.paintExplore()],
     ['books', () => BOOKS.paint()],
     ['media', () => MEDIA.paint()],
     ['contact', () => this.paintContact()],
     ['footer', () => this.paintFooter()]
    ].forEach(([name, fn]) => {
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
      const count = books.filter(b =>
        String(b.standard || '').split(',').map(x => x.trim()).includes(String(n))).length;
      return `
      <button class="std-card" style="--c:var(--std${n})" data-std="${n}">
        <span class="std-top">${label}</span>
        <span class="std-figure">
          <span class="std-num">${mr ? digit[i] : n}</span>
          <span class="std-ord">${ord[i]}</span>
        </span>
        <span class="std-foot">
          <span class="std-count">${count} ${this.t('std_books_count')}</span>
          <span class="std-go">${this.t('std_open')} &rarr;</span>
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
      </button>`).join('');
    ['offerGrid', 'offerGrid2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
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
    const w = document.getElementById('waFloat');
    const link = this.wa();
    if (link) { w.href = link; w.classList.remove('hidden'); }
    else { w.classList.add('hidden'); }
  },

  /* Builds a WhatsApp deep link with a pre-filled message (Phase 11 extends this). */
  wa(msgKey, extra) {
    const n = this.config.whatsapp_number;
    if (!n) return '';
    let m = this.t(msgKey || 'wa_general');
    if (extra) m += ' ' + extra;
    return 'https://wa.me/' + n + '?text=' + encodeURIComponent(m);
  },

  /* ---- 4. ROUTING ---- */
  bindNav() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); this.go(el.dataset.nav); });
    });
    window.addEventListener('hashchange', () => this.go(location.hash.slice(1) || 'home', true));
  },

  go(page, fromHash) {
    const target = document.getElementById('page-' + page);
    if (!target) return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    target.classList.add('active');
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === page));
    document.getElementById('nav').classList.remove('open');
    if (!fromHash) location.hash = page;
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
    document.getElementById('entry')?.classList.add('hidden');
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

    document.querySelectorAll('.pill').forEach(b => {
      b.addEventListener('click', () => app.setLang(b.dataset.lang));
    });

    document.getElementById('openForm').addEventListener('click', () => this.openSheet());
    document.getElementById('welcomeSkip').addEventListener('click', () => app.enterSite());
    document.getElementById('sheetX').addEventListener('click', () => this.closeSheet());
    document.getElementById('doneEnter').addEventListener('click', () => app.enterSite());
    document.getElementById('modalX').addEventListener('click', () => this.closeModal());

    // Anything with data-offer reopens the form, framed for that audience.
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-offer]');
      if (b) { e.preventDefault(); this.openModal(b.dataset.offer); }
    });

    FORM.build(app, this);

    app.setLang(localStorage.getItem('rutuja_lang') || 'mr', true);

    if (this.done()) app.enterSite();
    else document.body.style.overflow = 'hidden';

    this.syncPrompts();
  },

  done() { return !!localStorage.getItem('rutuja_reg'); },

  repaint() {
    document.querySelectorAll('.pill').forEach(p =>
      p.classList.toggle('on', p.dataset.lang === this.app.lang));
    const h = document.getElementById('formHead');
    if (h) h.textContent = this.app.t('entry_form_head');
    FORM.repaint();
  },

  /* Register prompts only exist for visitors who have not registered. */
  syncPrompts() {
    const show = !this.done();
    const nav = document.getElementById('navReg');
    const ban = document.getElementById('regBanner');
    if (nav) nav.classList.toggle('hidden', !show);
    if (ban) ban.classList.toggle('hidden', !show);
  },

  /* ---- SHEET (welcome screen) ---- */
  openSheet() {
    this.where = 'sheet';
    this.offerKey = '';
    document.getElementById('sheetBody').classList.remove('hidden');
    document.getElementById('sheetDone').classList.add('hidden');
    document.getElementById('sheet').classList.remove('hidden');
    FORM.moveTo('formSlot');
    FORM.reset();
    FORM.repaint();
  },

  closeSheet() { document.getElementById('sheet').classList.add('hidden'); },

  /* ---- MODAL (inside the site) ---- */
  openModal(key) {
    const t = k => this.app.t(k);
    const heads = { school: 'form_head_school', bulk: 'form_head_bulk',
                    retail: 'form_head_retail', parent: 'form_head_parent' };

    if (this.done()) {
      const link = this.app.wa('wa_' + (key === 'school' ? 'school'
                              : key === 'retail' ? 'retailer' : 'general'));
      if (link) window.open(link, '_blank'); else this.app.go('contact');
      return;
    }

    this.where = 'modal';
    this.offerKey = key === 'default' ? '' : key;
    document.getElementById('modalHead').textContent = t(heads[key] || 'form_head_default');
    document.getElementById('modalBody').classList.remove('hidden');
    document.getElementById('modalDone').classList.add('hidden');
    document.getElementById('modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    FORM.moveTo('modalSlot');
    FORM.reset();
    FORM.preset(key);
    FORM.repaint();
  },

  closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.body.style.overflow = '';
  },

  onSubmitted(regId) {
    this.syncPrompts();
    if (this.where === 'modal') {
      document.getElementById('regId2').textContent = regId;
      document.getElementById('modalBody').classList.add('hidden');
      document.getElementById('modalDone').classList.remove('hidden');
      setTimeout(() => this.closeModal(), 2600);
    } else {
      document.getElementById('regId').textContent = regId;
      document.getElementById('sheetBody').classList.add('hidden');
      document.getElementById('sheetDone').classList.remove('hidden');
    }
  },

  /* The skip link inside the form. */
  onSkipped() {
    if (this.where === 'modal') this.closeModal();
    else this.app.enterSite();
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
      parentNote: q('parentNote')
    };

    this.el.form.addEventListener('submit', e => { e.preventDefault(); this.submit(); });
    this.el.skip.addEventListener('click', () => this.entry.onSkipped());
    this.el.state.addEventListener('change', () => this.onState());
    this.el.dist.addEventListener('change', () => this.onDist());
    this.el.cat.addEventListener('change', () => {
      this.el.parentNote.classList.toggle('hidden', this.el.cat.value !== 'student');
    });
    this.el.phone.addEventListener('input', () => this.digits(this.el.phone, 10));
    this.el.pin.addEventListener('input', () => this.digits(this.el.pin, 6));
  },

  moveTo(slotId) {
    const slot = document.getElementById(slotId);
    if (slot && this.node.parentElement !== slot) slot.appendChild(this.node);
    // The skip link says different things depending on where the form sits.
    this.el.skip.dataset.t = (slotId === 'formSlot') ? 'welcome_skip' : 'gate_skip';
  },

  reset() {
    this.el.form.classList.remove('hidden');
    this.el.submit.disabled = false;
    this.node.querySelectorAll('.err').forEach(e => e.textContent = '');
    this.node.querySelectorAll('.bad').forEach(e => e.classList.remove('bad'));
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

    this.el.cat.innerHTML = pick + this.CATEGORIES
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

    if (v === 'Maharashtra') {
      this.el.dist.disabled = false;
      this.el.dist.innerHTML = pick + this.app.locations.maharashtra.districts
        .map(d => `<option value="${d.name_en}">${mr ? d.name_mr : d.name_en}</option>`).join('');
    } else if (v) {
      this.el.dist.disabled = false;
      this.el.dist.innerHTML = `<option value="Other" selected>${t('cat_other')}</option>`;
      this.el.tal.disabled = false;
      this.el.tal.innerHTML = `<option value="Other" selected>${t('cat_other')}</option>`;
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
    check(this.el.name, 'eName', this.el.name.value.trim().length >= 2, req);
    check(this.el.phone, 'ePhone', /^[6-9]\d{9}$/.test(this.el.phone.value), t('common_invalid_phone'));
    check(this.el.cat, 'eCat', !!this.el.cat.value, req);
    check(this.el.state, 'eState', !!this.el.state.value, req);
    check(this.el.dist, 'eDist', !!this.el.dist.value, req);
    check(this.el.tal, 'eTal', !!this.el.tal.value, req);
    check(this.el.village, 'eVillage', this.el.village.value.trim().length >= 2, req);
    check(this.el.pin, 'ePin', /^\d{6}$/.test(this.el.pin.value), t('common_invalid_pin'));
    return ok;
  },

  async submit() {
    if (!this.validate()) return;

    const payload = {
      name: this.el.name.value.trim(),
      whatsapp: '91' + this.el.phone.value,
      category: this.el.cat.value,
      state: this.el.state.value,
      district: this.el.dist.value,
      taluka: this.el.tal.value,
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
    const url = this.app.settings.backendUrl;

    if (url) {
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
      const b = e.target.closest('.car-link[data-book]');
      if (b) this.openBook(b.dataset.book);
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

  card(b) {
    const mr = this.app.lang === 'mr';
    const name = mr ? b.name_mr : b.name_en;
    const sl   = this.subs(b);
    const sub  = sl.slice(0, 2).join(' · ') + (sl.length > 2 ? ' +' + (sl.length - 2) : '');
    const num  = this.stdLabel(b);
    const cover = b.cover_image
      ? this.app.img('books', b.cover_image)
      : `<span class="book-cover-ph">${num}</span>`;
    return `<button class="book-card" data-book="${b.book_id}">
      <span class="book-cover" style="background:${this.stdColor(b)}">
        ${cover}<span class="book-std">${this.app.t('books_standard')} ${num}</span>
      </span>
      <span class="book-body">
        <span class="book-name">${name}</span>
        <span class="book-meta">${sub} · ${this.medLabel(b)}</span>
        ${b.subtitle_mr || b.subtitle_en ? `<span class="book-sub">${mr ? b.subtitle_mr : b.subtitle_en}</span>` : ''}
        <span class="book-price">₹${b.mrp}</span>
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
    this.el.count.textContent = list.length;
    this.el.none.classList.toggle('hidden', list.length > 0);
    this.bind(this.el.grid);
  },

  renderFeatured() {
    if (!this.el.feat) return;
    const f = this.live().filter(b => b.featured === 'YES').slice(0, 4);
    this.el.feat.innerHTML = f.map(b => this.card(b)).join('');
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

  renderSlabs() {
    if (!this.el.slab) return;
    const t = k => this.app.t(k);
    const mr = this.app.lang === 'mr';
    const blocks = this.live().map(b => {
      const sl = this.slabs(b.offer_id);
      if (!sl.length) return '';
      return `<table class="slab">
        <tr><th colspan="3">${mr ? b.name_mr : b.name_en} &nbsp;·&nbsp; MRP &#8377;${b.mrp}</th></tr>
        <tr><td class="sh">${t('price_qty')}</td><td class="sh">${t('price_rate')}</td><td class="sh">${t('price_discount')}</td></tr>
        ${sl.map(o => `<tr>
          <td>${this.slabLabel(o)}</td>
          <td><strong>&#8377;${o.selling_rate}</strong></td>
          <td class="pct">${o.discount_percent ? Math.round(o.discount_percent) + '%' : '—'}</td>
        </tr>`).join('')}
      </table>`;
    }).join('');
    this.el.slab.innerHTML = blocks + `<p class="calc-note">${t('price_delivery')}</p>`;
  },

  /* ---- DETAIL PAGE ---- */
  openBook(id, silent) {
    const b = this.live().find(x => x.book_id === id);
    if (!b) return;
    this.current = id;
    const t = k => this.app.t(k);
    const mr = this.app.lang === 'mr';
    const num = this.stdLabel(b);
    const cover = b.cover_image
      ? this.app.img('books', b.cover_image)
      : `<span>${num}</span>`;
    const mySlabs = this.slabs(b.offer_id);

    this.el.detail.innerHTML = `
      <div class="bd">
        <div class="bd-cover" style="background:${this.stdColor(b)}">${cover}</div>
        <div>
          <h1 class="bd-title">${mr ? b.name_mr : b.name_en}</h1>
          ${(mr ? b.subtitle_mr : b.subtitle_en) ? `<p class="bd-subtitle">${mr ? b.subtitle_mr : b.subtitle_en}</p>` : ''}
          <p class="bd-sub">${this.subs(b).join(' · ')} &nbsp;|&nbsp; ${this.medLabel(b)}</p>
          <div class="bd-facts">
            <div class="bd-fact"><div class="bd-fact-k">${t('books_standard')}</div>
              <div class="bd-fact-v">${num}</div></div>
            <div class="bd-fact"><div class="bd-fact-k">${t('book_mrp')}</div>
              <div class="bd-fact-v">₹${b.mrp}</div></div>
            ${b.pages ? `<div class="bd-fact"><div class="bd-fact-k">${t('book_pages')}</div>
              <div class="bd-fact-v">${b.pages}</div></div>` : ''}
          </div>
          <p class="bd-desc">${mr ? b.description_mr : b.description_en}</p>

          <div class="calc">
            <div class="calc-h">${t('price_title')}</div>
            <div class="calc-row">
              <span class="calc-lbl">${t('price_qty')}</span>
              <div class="qty">
                <button type="button" id="qMinus">−</button>
                <input type="text" id="qVal" inputmode="numeric" value="1">
                <button type="button" id="qPlus">+</button>
              </div>
            </div>
            <div class="calc-out" id="calcOut"></div>
            <p class="calc-note">${t('price_delivery')}</p>
            <button class="btn btn-gold calc-btn" id="calcAsk">${t('price_ask')}</button>
          </div>

          ${MEDIA.forBook(b.book_id)}

          <div class="slab-wrap" style="margin-top:18px">
            <table class="slab">
              <tr><th>${t('price_qty')}</th><th>${t('price_rate')}</th><th>${t('price_discount')}</th></tr>
              ${mySlabs.map(o => `<tr>
                <td>${this.slabLabel(o)}</td>
                <td>&#8377;${o.selling_rate}</td>
                <td class="pct">${o.discount_percent ? Math.round(o.discount_percent) + '%' : '—'}</td>
              </tr>`).join('')}
            </table>
          </div>
        </div>
      </div>`;

    const qv = document.getElementById('qVal');
    const draw = () => {
      let q = Math.max(1, Math.min(9999, parseInt(qv.value, 10) || 1));
      qv.value = q;
      const p = this.priceFor(b, q);
      document.getElementById('calcOut').innerHTML = `
        <div class="calc-line"><span>${t('price_per')}</span>
          <span>₹${p.each} ${p.pct ? `<s style="opacity:.5">₹${b.mrp}</s>` : ''}</span></div>
        ${p.pct ? `<div class="calc-line"><span>${t('price_slab')}</span>
          <span class="calc-save">${p.pct}%</span></div>` : ''}
        <div class="calc-line"><span>${t('price_total')}</span>
          <span class="calc-total">₹${p.total}</span></div>
        ${p.saved ? `<div class="calc-line"><span>${t('price_saving')}</span>
          <span class="calc-save">₹${p.saved}</span></div>` : ''}`;
    };
    MEDIA.bindBookVideos(this.el.detail);
    qv.addEventListener('input', () => { qv.value = qv.value.replace(/\D/g, ''); draw(); });
    document.getElementById('qMinus').onclick = () => { qv.value = Math.max(1, (+qv.value || 1) - 1); draw(); };
    document.getElementById('qPlus').onclick  = () => { qv.value = (+qv.value || 1) + 1; draw(); };
    document.getElementById('calcAsk').onclick = () => {
      const q = +qv.value || 1;
      const detail = `${mr ? b.name_mr : b.name_en} (${this.medLabel(b)}) × ${q}`;
      const link = this.app.wa(q > 1 ? 'wa_quantity' : 'wa_book', detail);
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
    this.rails.forEach(r => clearInterval(r.timer));
    this.rails = [];
    const vids = this.live('videos', true);
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

  /* Book, ad, experience and news images all follow one rule:
     name.webp is the 1x file, name@2x.webp is the retina file if present. */
  img(folder, file, cls) {
    if (!file) return '';
    const dot = file.lastIndexOf('.');
    const x2 = dot > 0 ? file.slice(0, dot) + '@2x' + file.slice(dot) : file;
    return `<img src="assets/img/${folder}/${file}"
      srcset="assets/img/${folder}/${file} 1x, assets/img/${folder}/${x2} 2x"
      onerror="this.removeAttribute('srcset')"
      alt="" decoding="async" loading="lazy"${cls ? ` class="${cls}"` : ''}>`;
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
    const slides = items.map(x => kind === 'video'
      ? this.videoSlide(x, mr) : this.adSlide(x, mr)).join('');

    box.innerHTML = `
      <div class="car-track">${slides}</div>
      ${items.length > 1 ? `
        <button class="car-arrow car-prev" aria-label="${t('car_prev')}">&#8249;</button>
        <button class="car-arrow car-next" aria-label="${t('car_next')}">&#8250;</button>` : ''}
      ${items.length > 1 ? `<div class="car-dots">${items
        .map((_, i) => `<button class="car-dot${i ? '' : ' on'}" data-i="${i}"></button>`)
        .join('')}</div>` : ''}`;

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

    // Playing a video stops rotation for good until the visitor moves on
    box.querySelectorAll('[data-yt]').forEach(m => {
      m.addEventListener('click', () => {
        if (m.classList.contains('playing')) return;
        rail.paused = true; stop();
        m.classList.add('playing');
        m.innerHTML = `<iframe src="https://www.youtube.com/embed/${m.dataset.yt}?autoplay=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3"
          title="" allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowfullscreen></iframe>`;
      });
    });

    this.rails.push(rail);
    start();
  },

  videoSlide(v, mr) {
    const t = k => this.app.t(k);
    const o = v.orientation === 'horizontal' ? 'horizontal' : 'vertical';
    const book = (this.app.content.books || []).find(b => b.book_id === v.book_id);
    return `<div class="car-slide">
      <div class="car-media ${o}" data-yt="${v.youtube_id}">
        <a class="car-full" href="https://www.youtube.com/watch?v=${v.youtube_id}"
           target="_blank" rel="noopener" title="YouTube" onclick="event.stopPropagation()">&#10530;</a>
        ${this.thumbImg(v.youtube_id, true)}
        <span class="car-play">&#9654;</span>
      </div>
      <div class="car-body">
        <span class="car-tag">${mr ? v.tagline_mr : v.tagline_en}</span>
        <div class="car-title">${mr ? v.title_mr : v.title_en}</div>
        <p class="car-cap">${mr ? v.caption_mr : v.caption_en}</p>
        ${book ? `<button class="car-link" data-book="${book.book_id}">${t('video_see_book')} &rarr;</button>` : ''}
      </div>
    </div>`;
  },

  adSlide(a, mr) {
    const link = a.link_type === 'book' && a.link_target
      ? `<button class="car-link" data-book="${a.link_target}">${this.app.t('books_view')} &rarr;</button>` : '';
    return `<div class="car-slide">
      <div class="car-media horizontal">
        ${this.app.img('ads', a.image)}
      </div>
      <div class="car-body">
        <div class="car-title">${mr ? a.title_mr : a.title_en}</div>
        <p class="car-cap">${mr ? (a.caption_mr || '') : (a.caption_en || '')}</p>
        ${link}
      </div>
    </div>`;
  },

  /* ---- GRID OF ALL VIDEOS ---- */
  grid(elId, items) {
    const box = document.getElementById(elId);
    if (!box) return;
    const mr = this.app.lang === 'mr';
    box.innerHTML = items.map(v => {
      const o = v.orientation === 'horizontal' ? 'horizontal' : 'vertical';
      return `<button class="vid-card" data-yt-open="${v.youtube_id}">
        <span class="vid-thumb ${o}">
          ${this.thumbImg(v.youtube_id)}
          <span class="car-play">&#9654;</span>
        </span>
        <span class="vid-body">
          <span class="vid-tag">${mr ? v.tagline_mr : v.tagline_en}</span>
          <span class="vid-name">${mr ? v.title_mr : v.title_en}</span>
        </span></button>`;
    }).join('');

    box.querySelectorAll('[data-yt-open]').forEach(c => {
      c.addEventListener('click', () => {
        const th = c.querySelector('.vid-thumb');
        th.innerHTML = `<iframe src="https://www.youtube.com/embed/${c.dataset.ytOpen}?autoplay=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3"
          title="" allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowfullscreen style="width:100%;height:100%;border:0"></iframe>`;
      });
    });
  },

  /* ---- VIDEOS BELONGING TO ONE BOOK ---- */
  forBook(bookId) {
    const vids = this.live('videos', false).filter(v => v.book_id === bookId);
    if (!vids.length) return '';
    const mr = this.app.lang === 'mr';
    return `<div class="bd-videos">
      <div class="calc-h">${this.app.t('book_videos')}</div>
      <div class="vid-grid">${vids.map(v => {
        const o = v.orientation === 'horizontal' ? 'horizontal' : 'vertical';
        return `<button class="vid-card" data-yt-open="${v.youtube_id}">
          <span class="vid-thumb ${o}">
            ${this.thumbImg(v.youtube_id)}
            <span class="car-play">&#9654;</span></span>
          <span class="vid-body">
            <span class="vid-tag">${mr ? v.tagline_mr : v.tagline_en}</span>
            <span class="vid-name">${mr ? v.title_mr : v.title_en}</span>
          </span></button>`; }).join('')}</div></div>`;
  },

  bindBookVideos(root) {
    root.querySelectorAll('[data-yt-open]').forEach(c => {
      c.addEventListener('click', () => {
        const th = c.querySelector('.vid-thumb');
        th.innerHTML = `<iframe src="https://www.youtube.com/embed/${c.dataset.ytOpen}?autoplay=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3"
          title="" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen
          style="width:100%;height:100%;border:0"></iframe>`;
      });
    });
  }
};
