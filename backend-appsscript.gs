/* ===================================================================
   RUTUJA — VISITOR REGISTRATION BACKEND
   Paste into RUTUJA_VISITOR_DATA > Extensions > Apps Script
   Then Deploy > New deployment > Web app
   =================================================================== */

var HEADERS = ['reg_id','timestamp','date','month','name','whatsapp','category',
               'state','district','taluka','village_city','pin','language','source'];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    // Honeypot: bots fill hidden fields, humans never see them.
    if (d.website) return ok({ status: 'ok', ignored: true });

    var sh = sheet_();
    var id = makeId_(sh);
    var now = new Date();
    var tz = Session.getScriptTimeZone();

    sh.appendRow([
      id,
      Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss'),
      Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
      Utilities.formatDate(now, tz, 'yyyy-MM'),
      clean_(d.name), clean_(d.whatsapp), clean_(d.category),
      clean_(d.state), clean_(d.district), clean_(d.taluka),
      clean_(d.village_city), clean_(d.pin),
      clean_(d.language), clean_(d.source) || 'gate'
    ]);

    return ok({ status: 'ok', reg_id: id });

  } catch (err) {
    return ok({ status: 'error', message: String(err) });
  }
}

function doGet() {
  return ok({ status: 'alive' });
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Visitors');
  if (!sh) {
    sh = ss.insertSheet('Visitors');
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sh.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold').setBackground('#1A4D2E').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    for (var c = 1; c <= HEADERS.length; c++) sh.setColumnWidth(c, 140);
  }
  return sh;
}

function makeId_(sh) {
  var n = Math.max(0, sh.getLastRow() - 1) + 1;
  var y = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yy');
  return 'RP-' + y + '-' + ('0000' + n).slice(-4);
}

/* Strip control characters and cap length so one bad submission
   cannot corrupt or flood the sheet. */
function clean_(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 300);
}

function ok(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
