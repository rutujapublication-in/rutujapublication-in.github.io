/* ===================================================================
   RUTUJA — BACKEND  v2

   Three tabs in RUTUJA_VISITOR_DATA:
     Visitors     one row per registration     RP-260925-0001, 0002, ...
     Orders       one row per order            RP-O-260925-0001, 0002, ...
     Order_Items  one row per book in an order RP-I-260925-000001, ...
     Enquiries    one row per WhatsApp tap       RP-E-260925-0001, ...

   WHAT THIS VERSION FIXES
   1. ONE numbering scheme. The SHEET issues every number, in sequence,
      starting at 0001. The site no longer invents one, so the series
      cannot fork (RP-O-SAT-05092026-982 was an invented one).
   2. Order_Items has its own running number as well as its line number.
   3. Phone numbers are stored as TEXT. Google was reading 919921466282
      as a number and showing 9.19921E+11, losing the last digits.
   4. BOTH languages, both filled, nothing lost:
        name / village_city   exactly as the visitor typed
        *_mr                  the Marathi form
        *_en                  the English form
   5. Orders and Order_Items carry reg_id, so every order can be traced
      back to the visitor who placed it.

   Order_Number.gs is no longer used — the number is issued here. It can
   be deleted, or left alone; it defines no doPost and cannot interfere.

   TO INSTALL
     1. RUTUJA_VISITOR_DATA -> Extensions -> Apps Script
     2. Replace Code.gs with this file (leave Order_Number.gs alone), Save
     3. Run resetAll()        -- empties the tabs, numbering starts at 0001
        Run installDailyPeople() -- People rebuilds itself each morning
     4. Deploy -> Manage deployments -> pencil -> New version -> Deploy
   =================================================================== */

var V_HEAD = ['reg_id','timestamp','date','month','year',
              'name','name_mr','name_en','whatsapp','category',
              'state','district','taluka','village_city','village_city_mr','village_city_en',
              'pin','language','source'];

var O_HEAD = ['order_no','reg_id','enq_id','timestamp','date','month','year',
              'name','name_mr','name_en','whatsapp','category',
              'state','district','taluka','village_city','village_city_mr','village_city_en',
              'pin','language','titles_en','titles_mr','total_qty','total_amount',
              'total_saving','mrp_value','status','notes'];

var I_HEAD = ['item_no','order_no','reg_id','enq_id','date','month','year',
              'name','name_mr','name_en','whatsapp','category',
              'state','district','taluka','village_city','village_city_mr','village_city_en',
              'pin','line_no','book_id','book_name_mr','book_name_en',
              'standard','medium','subject','mrp','qty','rate','discount_percent',
              'amount','saved','status'];

var E_HEAD = ['enq_id','reg_id','order_no','timestamp','date','month','year','kind',
              'name','name_mr','name_en','whatsapp','category',
              'state','district','taluka','village_city','village_city_mr','village_city_en',
              'pin','language','detail','source','status','notes'];

/* columns that must stay TEXT, never be read as numbers */
var TEXT_COLS = ['whatsapp','pin','reg_id','order_no','item_no','enq_id','last_order_no','last_enq_id','standard'];

/* Two orders can arrive in the same second — from two phones, or from one
   person tapping twice. Without a lock both would count the same rows and
   be given the SAME number. Everything that writes takes the lock first,
   so the numbers can never collide.
   (The old Order_Number.gs did this correctly; it is where this came from.) */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (err) {
    return ok({ status: 'error', message: 'busy, please try again' });
  }
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.website) return ok({ status: 'ok', ignored: true });
    if (d.kind === 'enquiry') return saveEnquiry_(d);
    return d.kind === 'order' ? saveOrder_(d) : saveVisitor_(d);
  } catch (err) {
    return ok({ status: 'error', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function doGet() { return ok({ status: 'alive' }); }

/* ---- the numbers: issued here, in sequence, from 0001 ---- */
/* RP-YYMMDD-NNNN — the date is in the number, and the running count
   carries on through the year rather than restarting each day */
function nextNo_(sh, prefix, width) {
  var n = Math.max(0, sh.getLastRow() - 1) + 1;
  return prefix + ymd_() + '-' + pad_(n, width);
}

/* writing a visitor and answering the site are two different jobs —
   keeping them apart means an order can create a person without having
   to unpick an HTTP reply to find out who it made */
function newVisitor_(d) {
  var sh = tab_('Visitors', V_HEAD);
  var id = nextNo_(sh, 'RP-', 4);
  var who = names_(d);
  sh.appendRow([id].concat(stamp_()).concat([
    who.name, who.name_mr, who.name_en, c_(d.whatsapp), c_(d.category),
    c_(d.state), c_(d.district), c_(d.taluka),
    who.village, who.village_mr, who.village_en,
    c_(d.pin), c_(d.language), c_(d.source) || 'gate'
  ]));
  return id;
}

function saveVisitor_(d) {
  return ok({ status: 'ok', reg_id: newVisitor_(d) });
}

function saveOrder_(d) {
  var items = d.items || [];
  var st = stamp_();
  var oSh = tab_('Orders', O_HEAD);
  var orderNo = nextNo_(oSh, 'RP-O-', 4);
  var who = names_(d);
  var regId = linkPerson_(d);
  var changed = changedSince_(regId, d);
  var enqId = c_(d.enq_id) || lastEnquiry_(regId);

  var person = [who.name, who.name_mr, who.name_en, c_(d.whatsapp), c_(d.category),
                c_(d.state), c_(d.district), c_(d.taluka),
                who.village, who.village_mr, who.village_en, c_(d.pin)];

  var titlesEn = items.map(function (i) { return c_(i.name_en) || c_(i.name_mr); }).join(' | ');
  var titlesMr = items.map(function (i) { return c_(i.name_mr) || c_(i.name_en); }).join(' | ');
  var qty = items.reduce(function (a, i) { return a + n_(i.qty); }, 0);
  var mrpValue = items.reduce(function (a, i) { return a + n_(i.mrp) * n_(i.qty); }, 0);

  oSh.appendRow([orderNo, regId, enqId].concat(st).concat(person).concat([
    c_(d.language), titlesEn, titlesMr, qty, n_(d.total), n_(d.saved), mrpValue, 'NEW', changed
  ]));

  var iSh = tab_('Order_Items', I_HEAD);
  var seq = Math.max(0, iSh.getLastRow() - 1);
  items.forEach(function (i, k) {
    seq++;
    iSh.appendRow(['RP-I-' + ymd_() + '-' + pad_(seq, 6), orderNo, regId, enqId,
      st[1], st[2], st[3]].concat(person).concat([
      k + 1, c_(i.book_id), c_(i.name_mr), c_(i.name_en),
      c_(i.standard), c_(i.medium), c_(i.subject),
      n_(i.mrp), n_(i.qty), n_(i.rate), n_(i.discount_percent),
      n_(i.amount), n_(i.saved), 'NEW'
    ]));
  });

  return ok({ status: 'ok', order_no: orderNo, reg_id: regId, lines: items.length });
}

/* Every WhatsApp tap is noted here — what kind of enquiry, who asked and
   when. The message itself is unaffected; this is the record of the tap,
   so "how many schools asked this month" can be answered. */
function saveEnquiry_(d) {
  var sh = tab_('Enquiries', E_HEAD);
  var id = nextNo_(sh, 'RP-E-', 4);
  var who = names_(d);
  var regId = c_(d.whatsapp) ? linkPerson_(d) : c_(d.reg_id);
  /* an enquiry ABOUT an order carries that order's number, so the two
     rows find each other from either side */
  var kind = c_(d.enq_kind) || 'general';
  var orderNo = c_(d.order_no) ||
    ((kind === 'order' || kind === 'diwali_order') ? c_(d.detail) : '');
  sh.appendRow([id, regId, orderNo].concat(stamp_()).concat([
    kind,
    who.name, who.name_mr, who.name_en, c_(d.whatsapp), c_(d.category),
    c_(d.state), c_(d.district), c_(d.taluka),
    who.village, who.village_mr, who.village_en,
    c_(d.pin), c_(d.language), c_(d.detail), c_(d.source) || 'site', 'NEW', ''
  ]));
  return ok({ status: 'ok', enq_id: id });
}

/* ===================================================================
   EVERY ROW IS TIED TO A PERSON.
   An order or an enquiry can arrive with no reg_id — the visitor never
   registered, or cleared their phone. Rather than leave an orphan row,
   the phone number is looked up in Visitors; if it is known, that
   reg_id is used, and if it is not, a Visitors row is created from the
   details the order already carries. So reg_id is never empty, and
   filtering by one person always shows everything they have done.
   =================================================================== */
function linkPerson_(d) {
  var given = c_(d.reg_id);
  if (given) return given;
  var phone = c_(d.whatsapp).replace(/\D/g, '');
  if (!phone) return '';
  var sh = tab_('Visitors', V_HEAD);
  var rows = sh.getLastRow() - 1;
  if (rows > 0) {
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var idCol = head.indexOf('reg_id') + 1, phCol = head.indexOf('whatsapp') + 1;
    if (idCol && phCol) {
      var ids = sh.getRange(2, idCol, rows, 1).getValues();
      var phs = sh.getRange(2, phCol, rows, 1).getValues();
      for (var r = rows - 1; r >= 0; r--) {                 /* newest first */
        if (String(phs[r][0]).replace(/\D/g, '') === phone) return String(ids[r][0]);
      }
    }
  }
  /* not known yet — record them, so the order has someone to belong to */
  return newVisitor_(Object.assign({}, d, { source: 'auto:' + (d.kind || 'order') }));
}

/* the categories, so a note reads "कोण: पालक → विक्रेता" rather than
   "parent → retailer" */
var CAT_MR = { parent: 'पालक', teacher: 'शिक्षक', student: 'विद्यार्थी', school: 'शाळा',
  retailer: 'किरकोळ विक्रेता', wholesaler: 'घाऊक विक्रेता', distributor: 'वितरक',
  bookseller: 'पुस्तक विक्रेता', author: 'लेखक', other: 'इतर' };
function catName_(v) { var k = c_(v); return CAT_MR[k] || k; }

/* the enquiry this person made most recently, so an order can point back
   to the question that led to it */
function lastEnquiry_(regId) {
  if (!regId) return '';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Enquiries');
  if (!sh || sh.getLastRow() < 2) return '';
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var idCol = head.indexOf('enq_id') + 1, regCol = head.indexOf('reg_id') + 1;
  if (!idCol || !regCol) return '';
  var rows = sh.getLastRow() - 1;
  var ids = sh.getRange(2, idCol, rows, 1).getValues();
  var regs = sh.getRange(2, regCol, rows, 1).getValues();
  for (var r = rows - 1; r >= 0; r--) {
    if (String(regs[r][0]) === regId) return String(ids[r][0]);
  }
  return '';
}

/* what changed since we last heard from them — written into notes, so a
   parcel is never sent to an address they have since corrected */
function changedSince_(regId, d) {
  if (!regId) return '';
  var sh = tab_('Visitors', V_HEAD);
  var rows = sh.getLastRow() - 1;
  if (rows < 1) return '';
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var idCol = head.indexOf('reg_id') + 1;
  if (!idCol) return '';
  var ids = sh.getRange(2, idCol, rows, 1).getValues();
  for (var r = rows - 1; r >= 0; r--) {
    if (String(ids[r][0]) !== regId) continue;
    var row = sh.getRange(r + 2, 1, 1, head.length).getValues()[0];
    var out = [];
    [['village_city', 'गाव'], ['category', 'कोण'], ['pin', 'पिन'], ['taluka', 'तालुका']].forEach(function (f) {
      var col = head.indexOf(f[0]);
      if (col < 0) return;
      var was = c_(row[col]), now = c_(d[f[0]]);
      if (f[0] === 'category') { was = catName_(was); now = catName_(now); }
      if (was && now && was !== now) out.push(f[1] + ': ' + was + ' → ' + now);
    });
    return out.join(' · ');
  }
  return '';
}

/* both language columns, filled whichever way the visitor typed */
function names_(d) {
  var nm = c_(d.name), vl = c_(d.village_city);
  return {
    name: nm,
    name_mr: c_(d.name_mr) || toMarathi_(nm),
    name_en: c_(d.name_en) || toEnglish_(nm),
    village: vl,
    village_mr: c_(d.village_city_mr) || toMarathi_(vl),
    village_en: c_(d.village_city_en) || toEnglish_(vl)
  };
}

/* -------------------------------------------------------------------
   RUN ONCE: empties the three tabs and rebuilds their headers, so the
   numbering starts again at 0001. Your old rows are NOT deleted blindly
   — a copy of each tab is kept as "Visitors_old" and so on, in case you
   want anything from them.
   ------------------------------------------------------------------- */
/* ===================================================================
   PEOPLE — one row per person, always showing the LATEST details and
   what they have done. Nothing here is typed: it is rebuilt from the
   other tabs, so the history in them is never overwritten.
   =================================================================== */
var P_HEAD = ['reg_id','name','name_mr','name_en','whatsapp','category',
              'village_city','village_city_en','taluka','district','pin',
              'first_seen','last_seen','orders','books','amount','enquiries','last_order_no','last_enq_id','my_notes'];

/* my_notes is YOURS. Everything else on this tab is rebuilt each morning
   from the other tabs, but whatever you type in my_notes is read first
   and written back, so it survives every rebuild. */

function buildPeople_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  function read(name) {
    var sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return { head: [], rows: [] };
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    return { head: head, rows: sh.getRange(2, 1, sh.getLastRow() - 1, head.length).getValues() };
  }
  function at(t, r, n) { var i = t.head.indexOf(n); return i < 0 ? '' : r[i]; }
  var V = read('Visitors'), O = read('Orders'), E = read('Enquiries');
  var who = {}, order = [];

  V.rows.forEach(function (r) {
    var id = String(at(V, r, 'reg_id') || ''); if (!id || who[id]) return;
    order.push(id);
    who[id] = { id: id, name: at(V, r, 'name'), name_mr: at(V, r, 'name_mr'), name_en: at(V, r, 'name_en'),
      phone: at(V, r, 'whatsapp'), cat: at(V, r, 'category'),
      village: at(V, r, 'village_city'), village_en: at(V, r, 'village_city_en'),
      taluka: at(V, r, 'taluka'), district: at(V, r, 'district'), pin: at(V, r, 'pin'),
      first: at(V, r, 'date'), last: at(V, r, 'date'),
      orders: 0, books: 0, amount: 0, enq: 0, lastOrder: '', lastEnq: '' };
  });

  O.rows.forEach(function (r) {
    var p = who[String(at(O, r, 'reg_id') || '')]; if (!p) return;
    p.orders++;
    p.books += Number(at(O, r, 'total_qty')) || 0;
    p.amount += Number(at(O, r, 'total_amount')) || 0;
    p.lastOrder = String(at(O, r, 'order_no') || '');
    /* the latest details win — people move, and a parent can become a shop */
    if (at(O, r, 'name')) p.name = at(O, r, 'name');
    if (at(O, r, 'name_mr')) p.name_mr = at(O, r, 'name_mr');
    if (at(O, r, 'name_en')) p.name_en = at(O, r, 'name_en');
    if (at(O, r, 'category')) p.cat = at(O, r, 'category');
    if (at(O, r, 'village_city')) p.village = at(O, r, 'village_city');
    if (at(O, r, 'village_city_en')) p.village_en = at(O, r, 'village_city_en');
    if (at(O, r, 'taluka')) p.taluka = at(O, r, 'taluka');
    if (at(O, r, 'district')) p.district = at(O, r, 'district');
    if (at(O, r, 'pin')) p.pin = at(O, r, 'pin');
    var d = String(at(O, r, 'date') || ''); if (d > String(p.last)) p.last = d;
  });

  E.rows.forEach(function (r) {
    var p = who[String(at(E, r, 'reg_id') || '')]; if (!p) return;
    p.enq++;
    p.lastEnq = String(at(E, r, 'enq_id') || '');
    var d = String(at(E, r, 'date') || ''); if (d > String(p.last)) p.last = d;
  });

  /* keep what you have written before the tab is rebuilt */
  var mine = {};
  var old = ss.getSheetByName('People');
  if (old && old.getLastRow() > 1) {
    var oh = old.getRange(1, 1, 1, old.getLastColumn()).getValues()[0];
    var idC = oh.indexOf('reg_id'), noteC = oh.indexOf('my_notes');
    if (idC > -1 && noteC > -1) {
      var oldRows = old.getRange(2, 1, old.getLastRow() - 1, oh.length).getValues();
      oldRows.forEach(function (r) {
        var note = c_(r[noteC]);
        if (note) mine[String(r[idC])] = note;
      });
    }
  }
  if (old) ss.deleteSheet(old);
  var sh = tab_('People', P_HEAD);
  var out = order.map(function (id) {
    var p = who[id];
    return [p.id, p.name, p.name_mr, p.name_en, p.phone, p.cat, p.village, p.village_en,
            p.taluka, p.district, p.pin, p.first, p.last, p.orders, p.books, p.amount, p.enq,
            p.lastOrder, p.lastEnq, mine[p.id] || ''];
  });
  if (out.length) sh.getRange(2, 1, out.length, P_HEAD.length).setValues(out);
  return out.length;
}

function buildPeople() { Logger.log('People: ' + buildPeople_() + ' row(s)'); }

/* rebuilt every morning at 6, so the tab is current before you open it */
function installDailyPeople() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'buildPeople') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('buildPeople').timeBased().everyDays(1).atHour(6).create();
  Logger.log('People will rebuild itself every morning at 6.');
}

function resetAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var plan = [['Visitors', V_HEAD], ['Orders', O_HEAD], ['Order_Items', I_HEAD], ['Enquiries', E_HEAD]];
  var report = [];
  plan.forEach(function (p) {
    var name = p[0], head = p[1];
    var sh = ss.getSheetByName(name);
    if (sh) {
      var rows = Math.max(0, sh.getLastRow() - 1);
      if (rows > 0) {
        var keep = ss.getSheetByName(name + '_old');
        if (keep) ss.deleteSheet(keep);
        sh.copyTo(ss).setName(name + '_old');
      }
      ss.deleteSheet(sh);
      report.push(name + ': ' + rows + ' row(s) kept in ' + name + '_old, tab rebuilt');
    } else {
      report.push(name + ': created');
    }
    tab_(name, head);
  });
  Logger.log('RUTUJA\n' + report.join('\n'));
}

function tab_(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, head.length).setValues([head]);
    sh.getRange(1, 1, 1, head.length)
      .setFontWeight('bold').setBackground('#1A4D2E').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    for (var c = 1; c <= head.length; c++) {
      sh.setColumnWidth(c, 130);
      /* phone, pin and the ids stay text, so nothing is rounded away */
      if (TEXT_COLS.indexOf(head[c - 1]) !== -1) {
        sh.getRange(1, c, sh.getMaxRows(), 1).setNumberFormat('@');
      }
    }
  }
  return sh;
}

function stamp_() {
  var n = new Date(), tz = Session.getScriptTimeZone();
  return [Utilities.formatDate(n, tz, 'yyyy-MM-dd HH:mm:ss'),
          Utilities.formatDate(n, tz, 'yyyy-MM-dd'),
          Utilities.formatDate(n, tz, 'yyyy-MM'),
          Utilities.formatDate(n, tz, 'yyyy')];
}

function yy_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yy'); }
function ymd_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMdd'); }
/* The number is padded to a tidy width, but NEVER cut: at 10,000 rows
   the old version wrapped back to 0000 and began repeating numbers. Past
   the width it simply grows a digit. */
function pad_(n, w) {
  var t = String(n);
  w = w || 4;
  return t.length >= w ? t : new Array(w - t.length + 1).join('0') + t;
}
function n_(v) { return Number(v) || 0; }

function c_(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 500);
}

function ok(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---- the two transliterators, taken from the site so the sheet and the
   site can never disagree ---- */
function toEnglish_(v) {
    const t = String(v == null ? '' : v).trim();
    if (!t) return '';
    if (!/[\u0900-\u097F]/.test(t)) return t;      /* already in English */
    const C = { 'क':'k','ख':'kh','ग':'g','घ':'gh','ङ':'n','च':'ch','छ':'chh','ज':'j','झ':'jh','ञ':'n',
      'ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n','त':'t','थ':'th','द':'d','ध':'dh','न':'n',
      'प':'p','फ':'ph','ब':'b','भ':'bh','म':'m','य':'y','र':'r','ल':'l','व':'v','ळ':'l',
      'श':'sh','ष':'sh','स':'s','ह':'h','क्ष':'ksh','ज्ञ':'dny','ऱ':'r' };
    const M = { 'ा':'a','ि':'i','ी':'i','ु':'u','ू':'u','ृ':'ru','े':'e','ै':'ai','ो':'o','ौ':'au',
      'ं':'n','ँ':'n','ः':'h','ॅ':'a','ॉ':'o' };
    const V = { 'अ':'a','आ':'aa','इ':'i','ई':'ee','उ':'u','ऊ':'oo','ऋ':'ru','ए':'e','ऐ':'ai',
      'ओ':'o','औ':'au','अं':'an','ऑ':'o' };
    const D = { '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9' };
    /* A word is read as units — a consonant with whatever follows it —
       so the silent 'a' can be handled the way Marathi actually reads:
       not at the end of a word, and not before a final syllable that
       already carries a vowel (गिरमे is Girme, not Girame). */
    const word = w => {
      const units = [];
      for (let i = 0; i < w.length; i++) {
        const ch = w[i];
        if (D[ch]) { units.push({ s: D[ch], plain: false }); continue; }
        if (V[ch]) { units.push({ s: V[ch], plain: false }); continue; }
        if (C[ch]) {
          let sound = C[ch], tail = '', cut = false;
          let k = i + 1;
          while (k < w.length) {
            const n = w[k];
            if (n === '\u094D') { cut = true; k++; continue; }       /* joined to the next */
            if (M[n] && n !== 'ं' && n !== 'ँ' && n !== 'ः') { tail += M[n]; k++; continue; }
            if (n === 'ं' || n === 'ँ') { tail = (tail || 'a') + 'n'; k++; continue; }
            if (n === 'ः') { tail = (tail || 'a') + 'h'; k++; continue; }
            break;
          }
          i = k - 1;
          units.push({ s: sound + tail, plain: !tail && !cut, cut });
          continue;
        }
        if (M[ch] || ch === '\u094D') continue;
        units.push({ s: ch, plain: false });
      }
      return units.map((u, k) => {
        if (!u.plain) return u.s;
        const last = k === units.length - 1;
        const beforeFinalVowel = k === units.length - 2 && units[k + 1] && !units[k + 1].plain;
        return u.s + (last || beforeFinalVowel ? '' : 'a');
      }).join('');
    };
    const out = [t.split(/(\s+)/).map(p => /\s/.test(p) ? p : word(p)).join('')];
    return out.join('')
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : w)
      .join(' ')
      .trim();
  }

function toMarathi_(v) {
    const t = String(v == null ? '' : v).trim();
    if (!t) return '';
    if (/[\u0900-\u097F]/.test(t)) return t;        /* already Marathi */
    /* whole words we see over and over in this district — exact, not guessed */
    const KNOWN = {
      padhegaon: 'पढेगाव', shrirampur: 'श्रीरामपूर', ahilyanagar: 'अहिल्यानगर',
      ahmednagar: 'अहमदनगर', maharashtra: 'महाराष्ट्र', pune: 'पुणे', nashik: 'नाशिक',
      mumbai: 'मुंबई', kolhapur: 'कोल्हापूर', satara: 'सातारा', sangli: 'सांगली',
      solapur: 'सोलापूर', aurangabad: 'औरंगाबाद', latur: 'लातूर', nagpur: 'नागपूर',
      girme: 'गिरमे', sumit: 'सुमित', sunil: 'सुनील', meena: 'मीना', mina: 'मीना',
      rutuja: 'ऋतुजा', patil: 'पाटील', kale: 'काळे', jadhav: 'जाधव', shinde: 'शिंदे',
      pawar: 'पवार', more: 'मोरे', gaikwad: 'गायकवाड', kamble: 'कांबळे', deshmukh: 'देशमुख'
    };
    /* endings that always read the same way in Marathi place names */
    const END = [['gaon','गाव'],['wadi','वाडी'],['vadi','वाडी'],['pur','पूर'],['nagar','नगर'],
                 ['wasti','वस्ती'],['pada','पाडा'],['khurd','खुर्द'],['budruk','बुद्रुक']];
    const CL = { 'shr':'श्र','chh':'छ','ksh':'क्ष','dny':'ज्ञ','shh':'श','tra':'त्र' };
    const TWO = { 'kh':'ख','gh':'घ','ch':'च','jh':'झ','th':'थ','dh':'ध','ph':'फ','bh':'भ','sh':'श','ny':'ञ' };
    const ONE = { 'k':'क','g':'ग','c':'क','j':'ज','t':'त','d':'द','n':'न','p':'प','b':'ब','m':'म',
      'y':'य','r':'र','l':'ल','v':'व','w':'व','s':'स','h':'ह','z':'झ','f':'फ','q':'क' };
    /* vowels: the longest match first, so 'aa' and 'ee' are not read as two */
    const VS = [['aai','ाई'],['aa','ा'],['ee','ी'],['oo','ू'],['ai','ै'],['au','ौ'],['ou','ौ'],
                ['ia','िया'],['ie','ी'],['ea','ी'],['oa','ो'],['a','ा'],['e','े'],['i','ि'],['o','ो'],['u','ु']];
    const VH = [['aa','आ'],['ee','ई'],['oo','ऊ'],['ai','ऐ'],['au','औ'],
                ['a','अ'],['e','ए'],['i','इ'],['o','ओ'],['u','उ']];
    const word = raw => {
      const low = raw.toLowerCase().replace(/[^a-z]/g, '');
      if (!low) return raw;
      if (KNOWN[low]) return KNOWN[low];
      for (const [tail, mr] of END) {
        if (low.length > tail.length + 1 && low.endsWith(tail)) {
          const head = word(low.slice(0, -tail.length));
          return head + mr;
        }
      }
      let out = '', i = 0, first = true;
      while (i < low.length) {
        if (first) {
          const vh = VH.find(([e]) => low.startsWith(e, i));
          if (vh) { out += vh[1]; i += vh[0].length; first = false; continue; }
        }
        const cl = Object.keys(CL).find(k => low.startsWith(k, i));
        const two = low.slice(i, i + 2);
        let cons = null, step = 0;
        if (cl) { cons = CL[cl]; step = cl.length; }
        else if (TWO[two]) { cons = TWO[two]; step = 2; }
        else if (ONE[low[i]]) { cons = ONE[low[i]]; step = 1; }
        if (cons) {
          i += step; first = false;
          const vs = VS.find(([e]) => low.startsWith(e, i));
          if (vs) { out += cons + vs[1]; i += vs[0].length; }
          else if (i >= low.length) out += cons;        /* word ends: no vowel */
          else out += cons + '\u094D';                  /* joined to the next */
          continue;
        }
        const vs = VS.find(([e]) => low.startsWith(e, i));
        if (vs) { out += vs[1]; i += vs[0].length; continue; }
        i += 1;
      }
      return out;
    };
    return t.split(/(\s+)/).map(p => /\s/.test(p) ? p : word(p)).join('').trim();
  }
