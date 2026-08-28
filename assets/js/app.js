/* ===================================================================
   RUTUJA PUBLICATION — APP
   Phase 5: language gate, routing, top strip, contact, footer.
   Phases 6-11 add their modules below without touching this core.
   =================================================================== */

const RUTUJA = {
  VERSION: 'v6e',
  lang: 'mr',
  text: {},
  locations: null,
  config: {},

  /* ---- 1. BOOT ---- */
  async init() {
    this.bindGate();
    this.bindNav();
    this.bindMenu();
    this.bindLangToggle();

    try {
      const [t, l] = await Promise.all([
        fetch('data/sitetext.json').then(r => r.json()),
        fetch('data/locations.json').then(r => r.json())
      ]);
      this.text = t;
      this.locations = l;
    } catch (e) {
      console.error('Data load failed', e);
    }

    this.config = this.defaultConfig();

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
      whatsapp_number: '',
      phone_number: '',
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
    this.paintStrip();
    this.paintStandards();
    this.paintOffers();
    this.paintContact();
    this.paintFooter();
  },

  paintStrip() {
    const items = this.lang === 'mr' ? this.config.strip_mr : this.config.strip_en;
    const html = items.map(i => `<span class="strip-item">${i}</span>`).join('');
    document.getElementById('stripTrack').innerHTML = html + html;
  },

  paintStandards() {
    const nums = this.lang === 'mr' ? ['१','२','३','४','५'] : ['1','2','3','4','5'];
    const label = this.extra('std_label');
    document.getElementById('stdGrid').innerHTML = nums.map((n, i) => `
      <div class="std-card" style="background:var(--std${i + 1})" data-std="${i + 1}">
        <div class="std-num">${n}</div>
        <div class="std-label">${label}</div>
      </div>`).join('');

    document.querySelectorAll('.std-card').forEach(c => {
      c.addEventListener('click', () => {
        sessionStorage.setItem('rutuja_filter_std', c.dataset.std);
        this.go('books');
      });
    });
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
    document.getElementById('menuBtn').addEventListener('click', () => {
      document.getElementById('nav').classList.toggle('open');
    });
  }
};

console.log('%cRutuja site ' + RUTUJA.VERSION + ' loaded', 'color:#1A4D2E;font-weight:bold');
document.addEventListener('DOMContentLoaded', () => RUTUJA.init());



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
