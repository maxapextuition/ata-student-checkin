/**
 * One-time setup script — run once to create the 7 check-in tabs in your Google Sheet.
 * Usage:  node src/scripts/setup-sheets.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
dotenv.config({ path: path.join(projectRoot, '..', '.env') }); // shared ATA secrets
dotenv.config({ path: path.join(projectRoot, '.env') });

// Tab definitions: name + headers
const TABS = [
  {
    name: 'Option 1 - Organising Session',
    headers: ['Timestamp', 'Tutor Name', 'Tutor ID', 'Student Name', 'Student ID',
              'Estimated First Session Date', 'Needs Help?', 'Help Details'],
  },
  {
    name: 'Option 2 - Discussing Options',
    headers: ['Timestamp', 'Tutor Name', 'Tutor ID', 'Student Name', 'Student ID',
              'Date Contacted', 'Last Heard From', 'Needs Help?', 'Help Details'],
  },
  {
    name: 'Option 3 - No Response',
    headers: ['Timestamp', 'Tutor Name', 'Tutor ID', 'Student Name', 'Student ID',
              'Date Contacted', 'Needs Help?', 'Help Details'],
  },
  {
    name: 'Option 4 - Not Needed Now',
    headers: ['Timestamp', 'Tutor Name', 'Tutor ID', 'Student Name', 'Student ID',
              'Estimated Restart Date', 'Who Will Re-contact?'],
  },
  {
    name: 'Option 5 - No Longer Tutoring',
    headers: ['Timestamp', 'Tutor Name', 'Tutor ID', 'Student Name', 'Student ID',
              'Context / Notes'],
  },
  {
    name: 'Option 6 - Not Yet Contacted',
    headers: ['Timestamp', 'Tutor Name', 'Tutor ID', 'Student Name', 'Student ID',
              'Still Wants to Tutor?'],
  },
  {
    name: 'Option 7 - Other',
    headers: ['Timestamp', 'Tutor Name', 'Tutor ID', 'Student Name', 'Student ID',
              'Additional Context'],
  },
];

async function setup() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.CHECKINS_SHEET_ID;

  // Get existing sheets
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingNames = meta.data.sheets.map(s => s.properties.title);
  console.log('Existing tabs:', existingNames);

  const tabsToCreate = TABS.filter(t => !existingNames.includes(t.name));
  if (tabsToCreate.length === 0) {
    console.log('All tabs already exist — nothing to do.');
  } else {
    // Add missing tabs
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: tabsToCreate.map(t => ({
          addSheet: { properties: { title: t.name } },
        })),
      },
    });
    console.log(`Created tabs: ${tabsToCreate.map(t => t.name).join(', ')}`);
  }

  // Write headers to every tab (won't overwrite existing data)
  for (const tab of TABS) {
    const rangeCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tab.name}'!A1`,
    });
    const currentA1 = rangeCheck.data.values?.[0]?.[0];
    if (currentA1 === 'Timestamp') {
      console.log(`Headers already set for: ${tab.name}`);
      continue;
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tab.name}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [tab.headers] },
    });
    console.log(`Headers written for: ${tab.name}`);
  }

  console.log('\nSetup complete.');
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
