# ATA Tutor Portal — Start-of-Year Student Check-In

A simple Node.js web portal for Apex Tuition Australia tutors.
Tutors log in via magic link, see their assigned students, and submit a quick check-in form. Submissions are saved to a Google Sheet.

---

## Features

- **Magic link login** — tutors enter their email, receive a one-time login link (no password)
- **Teachworks integration** — only active employees can log in; their assigned students are pulled automatically
- **Check-in form** — tutors add notes per student and mark whether they made contact
- **Google Sheets** — every submission is appended as a new row
- **No database** — sessions and tokens are held in memory (resets on restart, which is fine for short-lived use)

---

## Tech Stack

- Node.js (ESM, no TypeScript)
- Express
- Nodemailer (Gmail)
- Teachworks REST API
- Google Sheets API (service account)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

```bash
cp .env.example .env
```

Fill in each value — see the section below.

### 3. Set up Google Sheets

1. Create a Google Sheet. Add headers in row 1:
   `Timestamp | Tutor Email | Student Name | Student ID | Notes | Contacted?`
2. Create a Google Cloud service account and download the JSON key.
3. Share the sheet with the service account email (Editor access).
4. Paste the full JSON key as a single line in `GOOGLE_SERVICE_ACCOUNT_JSON`.

### 4. Set up Gmail

Use a **Gmail App Password** (not your regular password):
Google Account → Security → 2-Step Verification → App Passwords → generate one.

### 5. Run

```bash
npm run dev    # development (auto-restarts on save)
npm start      # production
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description |
|---|---|
| `BASE_URL` | Public URL of this app (e.g. `https://portal.yourdomain.com`) |
| `PORT` | Port to listen on (default: `3000`) |
| `TEACHWORKS_API_URL` | Teachworks API base (default: `https://api.teachworks.com`) |
| `TEACHWORKS_API_KEY` | Your Teachworks API key |
| `GMAIL_USER` | Gmail address used to send login emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not account password) |
| `GOOGLE_SHEET_ID` | ID from the Google Sheet URL |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON key for the Google service account (single line) |
| `NODE_ENV` | Set to `production` in production |

---

## Project Structure

```
src/
  index.js              — Express server entry point
  middleware/
    auth.js             — requireAuth middleware (checks session cookie)
  routes/
    auth.js             — POST /api/auth/magic-link, GET /verify, POST /logout
    students.js         — GET /api/students, GET /api/me
    checkin.js          — POST /api/checkin
  services/
    auth.js             — magic link generation, verification, session management
    email.js            — sends login email via nodemailer
    teachworks.js       — Teachworks API calls (validate employee, fetch students)
    sheets.js           — appends check-in rows to Google Sheets
  storage/
    index.js            — in-memory store (users, sessions, tokens, rate limits)
public/
  index.html            — Login page
  dashboard.html        — Tutor dashboard (student list + check-in forms)
```

---

## How It Works

1. Tutor visits the portal and enters their email.
2. Server checks the email against Teachworks (must be an active employee).
3. A one-time token is stored in memory and a magic link is emailed.
4. Tutor clicks the link — token is validated and a session cookie is set.
5. Dashboard loads, fetches the tutor's students from Teachworks.
6. Tutor expands a student card, fills in the form, and submits.
7. Submission is appended to the configured Google Sheet.
