# Bolton Road Masjid — Prayer Times App

A mobile-friendly web app that shows daily Iqamah times fetched automatically from Google Sheets.

---

## Project Structure

```
bolton-road-masjid/
│
├── index.html          ← Main page (HTML only, no logic)
├── manifest.json       ← PWA manifest (install on phone)
│
├── css/
│   └── style.css       ← All styles
│
├── js/
│   ├── config.js       ← ⚙️  YOUR SETTINGS — edit this file
│   ├── utils.js        ← Helper functions (time parsing etc.)
│   ├── data.js         ← Google Sheets fetching & parsing
│   └── app.js          ← UI rendering & boot logic
│
└── icons/
    ├── icon-192.png    ← App icon (add your own)
    └── icon-512.png    ← App icon (add your own)
```

---

## Setup

### 1. Configure your settings
Open `js/config.js` and fill in:
- `SHEET_ID` — your Google Sheet ID
- `APPS_SCRIPT_URL` — your Google Apps Script Web App URL
- `MOSQUE_NAME`, `MOSQUE_CITY` etc.

### 2. Google Sheet format
Your sheet tab must be named `PrayerTimes` with these columns:

| Date | Fajr | Fajr_Iqamah | Dhuhr | Dhuhr_Iqamah | Asr | Asr_Iqamah | Maghrib | Maghrib_Iqamah | Isha | Isha_Iqamah |
|------|------|------------|-------|-------------|-----|-----------|---------|---------------|------|------------|
| 10/05/2026 | 03:51 | 05:00 | 13:12 | 13:45 | ... | ... | ... | ... | ... | ... |

- Date format: `DD/MM/YYYY`
- Times: `HH:MM` (24-hour)

