import { google } from 'googleapis';

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const TAB_NAMES = {
  1: 'Option 1 - Organising Session',
  2: 'Option 2 - Discussing Options',
  3: 'Option 3 - No Response',
  4: 'Option 4 - Not Needed Now',
  5: 'Option 5 - No Longer Tutoring',
  6: 'Option 6 - Not Yet Contacted',
  7: 'Option 7 - Other',
};

// Build the row for each option. First 5 cols are always the same.
function buildRow(option, base, answers) {
  const { timestamp, tutorName, tutorId, studentName, studentId } = base;
  const common = [timestamp, tutorName, tutorId, studentName, studentId];

  switch (option) {
    case 1:
      return [...common,
        answers.estimatedSessionDate || '',
        answers.needsHelp ? 'Yes' : 'No',
        answers.helpDetails || '',
      ];
    case 2:
      return [...common,
        answers.dateContacted || '',
        answers.lastHeardFrom || '',
        answers.needsHelp ? 'Yes' : 'No',
        answers.helpDetails || '',
      ];
    case 3:
      return [...common,
        answers.dateContacted || '',
        answers.needsHelp ? 'Yes' : 'No',
        answers.helpDetails || '',
      ];
    case 4:
      return [...common,
        answers.estimatedRestartDate || '',
        answers.recontactBy || '',
      ];
    case 5:
      return [...common,
        answers.context || '',
      ];
    case 6:
      return [...common,
        answers.stillWantsToTutor ? 'Yes' : 'No',
      ];
    case 7:
      return [...common,
        answers.context || '',
      ];
    default:
      return common;
  }
}

export async function saveCheckIn({ option, tutorName, tutorId, studentName, studentId, answers }) {
  const tabName = TAB_NAMES[option];
  if (!tabName) throw new Error(`Invalid option: ${option}`);

  const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
  const row = buildRow(option, { timestamp, tutorName, tutorId, studentName, studentId }, answers);

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    // Dev mode — just log
    console.log(`[DEV] Check-in saved to "${tabName}":`, row);
    return;
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.CHECKINS_SHEET_ID,
    range: `'${tabName}'!A:Z`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}
