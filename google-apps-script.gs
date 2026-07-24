/**
 * RSVP → Google Sheets connector for Olayemi & Emmanuel's wedding site.
 *
 * SETUP:
 * 1. Go to https://sheets.google.com and create a new blank spreadsheet
 *    (e.g. name it "Wedding RSVPs").
 * 2. In row 1, add these column headers (exactly, in this order):
 *    Timestamp | Guest Name | Attending | Company | Companion Name | Submitted At
 * 3. In the sheet, go to Extensions > Apps Script.
 * 4. Delete any starter code in the editor and paste in this entire file.
 * 5. Click the "Save" (disk) icon, name the project anything (e.g. "RSVP Handler").
 * 6. Click "Deploy" > "New deployment".
 *    - Click the gear icon next to "Select type" and choose "Web app".
 *    - Description: anything, e.g. "RSVP endpoint".
 *    - Execute as: "Me".
 *    - Who has access: "Anyone".
 *    - Click "Deploy".
 * 7. Google will ask you to authorize the script — click through and allow it.
 * 8. Copy the "Web app URL" shown after deployment (it ends in /exec).
 * 9. Send me that URL — I'll paste it into script.js in place of
 *    GOOGLE_SHEETS_ENDPOINT and the RSVP form will start writing straight
 *    into this spreadsheet.
 *
 * Note: if you ever edit and re-save this script, you must create a NEW
 * deployment (Deploy > Manage deployments > pencil icon > New version) for
 * the changes to take effect on the live /exec URL.
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.guestName || '',
    data.attendance || '',
    data.company || '',
    data.companionName || '',
    data.submittedAt || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
