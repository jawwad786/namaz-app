// ═══════════════════════════════════════════════════════
//  config.js
//  All settings live here. Edit this file only.
// ═══════════════════════════════════════════════════════

const CONFIG = {

  // ── Google Sheet ──────────────────────────────────────
  // Your Google Sheet ID (from the URL)
  SHEET_ID: '1yHtpHLNGrGxiPfflrp0fagR9YWFvz3F8a2Q1VpA-NcY',

  // The tab name at the bottom of your Google Sheet
  SHEET_TAB: 'MusallahYusuf_PrayerTimes',

  // ── Apps Script ───────────────────────────────────────
  // Paste your Google Apps Script Web App URL here
  // Looks like: https://script.google.com/macros/s/ABC.../exec
  APPS_SCRIPT_URL: '',

  // ── Mosque info ───────────────────────────────────────
  // Change these to update the name and address everywhere in the app
  MOSQUE_NAME:    'MUSALLAH YUSUF',
  MOSQUE_ADDRESS: '193 Bolton Road',
  MOSQUE_CITY:    'Blackburn',
  MOSQUE_COUNTRY: 'United Kingdom',

  // ── Behaviour ─────────────────────────────────────────
  // How often to re-fetch data from the sheet (minutes)
  REFRESH_MINUTES: 30,

  // How often the countdown ticks (seconds)
  TICK_SECONDS: 30,
};

// ── Prayer definitions ────────────────────────────────
// Add or remove prayers here if needed
const PRAYERS = [
  { name: 'Fajr',    icon: '🌙' },
  { name: 'Dhuhr',   icon: '☀️'  },
  { name: 'Asr',     icon: '🌤️' },
  { name: 'Maghrib', icon: '🌅' },
  { name: 'Isha',    icon: '🌃' },
];
