import { google } from 'googleapis';

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const OPTION_LABELS = {
  1: 'Organising a session',
  2: 'Discussing options',
  3: 'No response from family',
  4: 'Not needed right now',
  5: 'No longer tutoring',
  6: 'Not yet contacted',
  7: 'Other',
};

// Columns: Timestamp | Tutor Name | Tutor ID | Student Name | Student ID |
//          Option | Option Label |
//          1 - Estimated Session Date |
//          1 - Needs Help | 1 - Help Details |
//          2 - Date Contacted | 2 - Last Heard From |
//          2 - Needs Help | 2 - Help Details |
//          3 - Date Contacted |
//          3 - Needs Help | 3 - Help Details |
//          4 - Estimated Restart Date | 4 - Re-contact By |
//          5 - Context |
//          6 - Still Wants to Tutor |
//          7 - Context
function buildRow(option, base, answers) {
  const { timestamp, tutorName, tutorId, studentName, studentId } = base;

  const needsHelp  = answers.needsHelp  || '';
  const helpDetails = answers.helpDetails || '';

  return [
    timestamp,
    tutorName,
    tutorId,
    studentName,
    studentId,
    option,
    OPTION_LABELS[option] || '',
    // Option 1
    option === 1 ? (answers.estimatedSessionDate || '') : '',
    option === 1 ? needsHelp   : '',
    option === 1 ? helpDetails : '',
    // Option 2
    option === 2 ? (answers.dateContacted  || '') : '',
    option === 2 ? (answers.lastHeardFrom  || '') : '',
    option === 2 ? needsHelp   : '',
    option === 2 ? helpDetails : '',
    // Option 3
    option === 3 ? (answers.dateContacted  || '') : '',
    option === 3 ? needsHelp   : '',
    option === 3 ? helpDetails : '',
    // Option 4
    option === 4 ? (answers.estimatedRestartDate || '') : '',
    option === 4 ? (answers.recontactBy          || '') : '',
    // Option 5
    option === 5 ? (answers.context || '') : '',
    // Option 6
    option === 6 ? (answers.stillWantsToTutor || '') : '',
    // Option 7
    option === 7 ? (answers.context || '') : '',
  ];
}

export async function saveCheckIn({ option, tutorName, tutorId, studentName, studentId, answers }) {
  if (!OPTION_LABELS[option]) throw new Error(`Invalid option: ${option}`);

  const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
  const row = buildRow(option, { timestamp, tutorName, tutorId, studentName, studentId }, answers);

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log('[DEV] Check-in row:', row);
    return;
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.CHECKINS_SHEET_ID,
    range: `'responses'!A:W`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}
