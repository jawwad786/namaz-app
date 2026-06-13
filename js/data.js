// ═══════════════════════════════════════════════════════
//  data.js
//  All data fetching: Apps Script, Google Sheets CSV, proxies
// ═══════════════════════════════════════════════════════

/**
 * Main entry point — tries all methods in order, returns array of row objects.
 * Throws if all methods fail.
 */
async function fetchSheet() {

  // ── Method 1: Google Apps Script Web App ──────────────
  // Most reliable — no CORS issues. Set APPS_SCRIPT_URL in config.js.
  if (CONFIG.APPS_SCRIPT_URL) {
    try {
      const res = await fetch(CONFIG.APPS_SCRIPT_URL, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          return normaliseAppsScriptRows(json.data);
        }
      }
    } catch (_) {}
  }

  // ── Method 2: Direct CSV export ───────────────────────
  // Works when the sheet is publicly shared AND published.
  const csvUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}`
               + `/export?format=csv&sheet=${encodeURIComponent(CONFIG.SHEET_TAB)}`;
  try {
    const res = await fetch(csvUrl, { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      if (isValidCSV(text)) return parseCSV(text);
    }
  } catch (_) {}

  // ── Method 3: CORS proxies ────────────────────────────
  // Fallback when direct fetch is blocked by browser CORS policy.
  const proxies = [
    `https://corsproxy.io/?url=${encodeURIComponent(csvUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`,
  ];
  for (const url of proxies) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const text = await res.text();
      if (isValidCSV(text)) return parseCSV(text);
    } catch (_) {}
  }

  // All methods failed
  throw new Error('SETUP_REQUIRED');
}

/**
 * Find the row matching today's date.
 * Returns null if not found.
 */
function findToday(rows) {
  return rows.find(r => isToday(r['Date'] || r['date'] || '')) || null;
}

// ── Internals ─────────────────────────────────────────

/**
 * Apps Script returns time values as decimal fractions and dates as Date strings.
 * This normalises both back to strings our utils can handle.
 */
function normaliseAppsScriptRows(rows) {
  return rows.map(row => {
    const out = {};
    for (const key in row) {
      let val = row[key];
      if (key.toLowerCase() === 'date' && val) {
        // Convert JS Date → DD/MM/YYYY
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          val = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
        }
      }
      // Time decimals are left as-is; to12h / toMins handle them
      out[key] = val;
    }
    return out;
  });
}

/** Returns true if the string looks like a CSV (not an HTML error page) */
function isValidCSV(text) {
  return text
    && text.trim().length > 10
    && !text.includes('<!DOCTYPE')
    && !text.includes('<html');
}

/** Parse a CSV string into an array of objects keyed by header row */
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = splitRow(lines[0]).map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const cols = splitRow(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] || '').replace(/"/g, '').trim();
    });
    return obj;
  });
}

/** Split a single CSV row respecting quoted commas */
function splitRow(line) {
  const cols = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"')           inQ = !inQ;
    else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
    else                       cur += ch;
  }
  cols.push(cur);
  return cols;
}

/** Fetch the Hijri date for today from Aladhan (free, no API key) */
async function fetchHijriDate() {
  const d = new Date();
  const url = `https://api.aladhan.com/v1/gToH?date=${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  const res = await fetch(url);
  const { data } = await res.json();
  const h = data.hijri;
  return `${h.day} ${h.month.en} ${h.year} AH`;
}
