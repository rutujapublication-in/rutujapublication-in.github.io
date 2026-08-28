/* ===================================================================
   RUTUJA PUBLICATION — APP
   Phase 5: language gate, routing, top strip, contact, footer.
   Phases 6-11 add their modules below without touching this core.
   =================================================================== */

const RUTUJA = {
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

    GATE.init(this);

    const saved = localStorage.getItem('rutuja_lang');
    if (saved) {
      this.setLang(saved, true);
    }
  },

  /* ---- SETTINGS YOU CAN CHANGE ---- */
  settings: {
    // Paste your Apps Script Web App URL between the quotes.
    backendUrl: '',
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
    document.getElementById('langLabel').textContent = lang === 'mr' ? 'EN' : 'मरा';

    document.getElementById('langGate').classList.add('hidden');
    document.getElementById('site').classList.remove('hidden');

    this.paint();
    if (!silent) {
      window.scrollTo(0, 0);
      GATE.maybeOpen();
    } else {
      GATE.render();
    }
  },

  t(key) {
    const d = this.text[this.lang];
    return (d && d[key]) || this.extra(key) || '';
  },

  /* Keys not in the SiteText sheet yet. Moved to the sheet in Phase 12. */
  extra(key) {
    const x = {
      mr: {
        pub_name: 'ऋतुजा प्रकाशन',
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

document.addEventListener('DOMContentLoaded', () => RUTUJA.init());

/* ===================================================================
   PHASE 6 — VISITOR GATEWAY
   Cascading State > District > Taluka, validation, and submission
   to the private Google Sheet via Apps Script.
   =================================================================== */

const GATE = {
  app: null,
  el: {},

  CATEGORIES: ['student','teacher','parent','retailer','wholesaler',
               'bookseller','school','distributor','author','other'],

  init(app) {
    this.app = app;
    const g = id => document.getElementById(id);
    this.el = {
      gate: g('gate'), form: g('gateForm'), done: g('gateDone'),
      name: g('gName'), phone: g('gPhone'), cat: g('gCat'),
      state: g('gState'), dist: g('gDist'), tal: g('gTal'),
      village: g('gVillage'), pin: g('gPin'), hp: g('hp'),
      submit: g('gateSubmit'), skip: g('gateSkip'), x: g('gateX'),
      parentNote: g('parentNote'), regId: g('regId'), go: g('gateGo')
    };

    this.el.form.addEventListener('submit', e => { e.preventDefault(); this.submit(); });
    this.el.skip.addEventListener('click', () => this.close());
    this.el.x.addEventListener('click', () => this.close());
    this.el.go.addEventListener('click', () => { this.close(); this.app.go('books'); });

    this.el.state.addEventListener('change', () => this.onState());
    this.el.dist.addEventListener('change', () => this.onDist());
    this.el.cat.addEventListener('change', () => {
      this.el.parentNote.classList.toggle('hidden', this.el.cat.value !== 'student');
    });

    this.el.phone.addEventListener('input', () => this.digits(this.el.phone, 10));
    this.el.pin.addEventListener('input', () => this.digits(this.el.pin, 6));

    this.bindIntent();
  },

  digits(input, max) {
    input.value = input.value.replace(/\D/g, '').slice(0, max);
  },

  registered() { return !!localStorage.getItem('rutuja_reg'); },

  /* Soft gate: shown once, skippable. Hard gate: shown until completed. */
  maybeOpen() {
    this.render();
    if (this.registered()) return;
    if (this.app.settings.gateMode === 'hard') return this.open(true);
    if (!sessionStorage.getItem('rutuja_gate_seen')) {
      sessionStorage.setItem('rutuja_gate_seen', '1');
      this.open(false);
    }
  },

  /* Intent gate: a visitor who acts is asked to register, even in soft mode. */
  bindIntent() {
    document.addEventListener('click', e => {
      const a = e.target.closest('.wa-float, [data-intent]');
      if (!a || this.registered()) return;
      if (this.app.settings.gateMode !== 'soft') return;
      e.preventDefault();
      this.pending = a.getAttribute('href') || '';
      this.open(true);
    });
  },

  open(force) {
    this.el.gate.classList.remove('hidden');
    this.el.x.classList.toggle('hidden', !!force && this.app.settings.gateMode === 'hard');
    this.el.skip.classList.toggle('hidden', !!force);
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.el.gate.classList.add('hidden');
    document.body.style.overflow = '';
  },

  /* ---- DROPDOWNS ---- */
  render() {
    const t = k => this.app.t(k);
    const pick = `<option value="">${t('gate_select')}</option>`;

    this.el.cat.innerHTML = pick + this.CATEGORIES
      .map(c => `<option value="${c}">${t('cat_' + c)}</option>`).join('');

    const loc = this.app.locations;
    if (!loc) return;
    const mr = this.app.lang === 'mr';
    const mh = mr ? loc.maharashtra.name_mr : loc.maharashtra.name_en;

    this.el.state.innerHTML = pick
      + `<option value="Maharashtra">${mh}</option>`
      + loc.other_states.map(s =>
          `<option value="${s.name_en}">${mr ? s.name_mr : s.name_en}</option>`).join('');

    this.el.dist.innerHTML = pick;
    this.el.tal.innerHTML = pick;
    this.el.dist.disabled = true;
    this.el.tal.disabled = true;
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
      // Outside Maharashtra we still capture location, with Other as the fallback.
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

  /* ---- VALIDATION ---- */
  validate() {
    const t = k => this.app.t(k);
    const req = t('common_required');
    let ok = true;

    const check = (el, errId, pass, msg) => {
      const e = document.getElementById(errId);
      if (pass) { el.classList.remove('bad'); e.textContent = ''; }
      else { el.classList.add('bad'); e.textContent = msg; ok = false; }
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

  /* ---- SUBMIT ---- */
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
      source: 'gate',
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
        // Network or CORS problem: send once more without reading the reply,
        // so the visitor is never blocked by a backend hiccup.
        try {
          await fetch(url, { method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload) });
        } catch (e2) { console.error('Gateway send failed', e2); }
      }
    }

    localStorage.setItem('rutuja_reg', JSON.stringify({ id: regId, cat: payload.category }));
    this.el.submit.disabled = false;
    this.el.submit.textContent = this.app.t('gate_submit');

    this.el.form.classList.add('hidden');
    this.el.done.classList.remove('hidden');
    this.el.x.classList.remove('hidden');
    this.el.regId.textContent = regId;

    if (this.pending) { window.open(this.pending, '_blank'); this.pending = ''; }
  },

  localId() {
    const d = new Date();
    return 'RP-' + String(d.getFullYear()).slice(2) + '-'
         + String(Math.floor(1000 + Math.random() * 9000));
  }
};
