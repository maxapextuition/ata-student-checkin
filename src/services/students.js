import { google } from 'googleapis';

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

// Spreadsheet columns:
//   A = Tutor ID        B = Tutor Name
//   C = Student ID      D = Student Name
//   E = Cohort Year     F = 2026 Session Date   G = 2026 Session Status
//   H = Last Session Date (optional)            I = Last Session Notes (optional)
export async function getStudentsForTutor(tutorId) {
  if (!process.env.STUDENTS_SHEET_ID) {
    // Rich dev fallback — covers all three UI states
    return [
      {
        studentId: '2006352', studentName: 'Toby Selvarajah',
        cohortYear: '2025',
        sessionDate: '3 Feb 2026',  sessionStatus: 'Attended',
        lastSessionDate: '', lastSessionNotes: '',
      },
      {
        studentId: '2093599', studentName: 'Isaiah Barton',
        cohortYear: '2025',
        sessionDate: '16 Feb 2026', sessionStatus: 'Attended',
        lastSessionDate: '', lastSessionNotes: '',
      },
      {
        studentId: '2065958', studentName: 'Milly Easter',
        cohortYear: '2025',
        sessionDate: '22 Mar 2026', sessionStatus: 'Scheduled',
        lastSessionDate: '14 Nov 2025', lastSessionNotes: '',
      },
      {
        studentId: '1507813', studentName: 'Amalie Fryar',
        cohortYear: '2022',
        sessionDate: '',  sessionStatus: '',
        lastSessionDate: '28 Oct 2025', lastSessionNotes: '',
      },
      {
        studentId: '1804678', studentName: 'Ryan Altus',
        cohortYear: '2024',
        sessionDate: '',  sessionStatus: '',
        lastSessionDate: '5 Dec 2025', lastSessionNotes: '',
      },
    ];
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.STUDENTS_SHEET_ID,
    range: 'Sheet1!A:I',
  });

  const rows = response.data.values || [];
  return rows
    .slice(1) // skip header
    .filter(row => String(row[0] || '').trim() === String(tutorId).trim())
    .map(row => ({
      studentId:        row[2] || '',
      studentName:      row[3] || '',
      cohortYear:       row[4] || '',
      sessionDate:      row[5] || '',
      sessionStatus:    row[6] || '',
      lastSessionDate:  row[7] || '',
      lastSessionNotes: row[8] || '',
    }));
}
