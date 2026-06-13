// ═══════════════════════════════════════════════════════
//  utils.js
//  Pure helper functions — no DOM, no fetch, no side effects
// ═══════════════════════════════════════════════════════

/** Zero-pad a number to 2 digits */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Current time as total minutes since midnight */
function nowMins() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

/** Today's date as DD/MM/YYYY */
function todayStr() {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Convert a raw time value to total minutes since midnight.
 * Handles:
 *   - 24h strings:  "03:51", "20:46"
 *   - 12h strings:  "3:51 AM", "8:46 PM"
 *   - Decimal fractions from Apps Script: 0.1604 (= 3:51 AM)
 */
function toMins(raw) {
  if (raw === null || raw === undefined || raw === '') return -1;
  raw = raw.toString().trim().replace(/\s*\(.*?\)/g, '');

  // Google Apps Script decimal format (0.0 – 0.9999)
  const asNum = parseFloat(raw);
  if (!isNaN(asNum) && asNum >= 0 && asNum < 1 && !raw.includes(':')) {
    return Math.round(asNum * 24 * 60);
  }

  const isPM = /pm/i.test(raw);
  const isAM = /am/i.test(raw);
  raw = raw.replace(/[apm\s]/gi, '');
  const [h, m] = raw.split(':').map(Number);
  if (isNaN(h)) return -1;

  let hr = h;
  if (isPM && h !== 12) hr += 12;
  if (isAM && h === 12) hr = 0;
  return hr * 60 + (m || 0);
}

/**
 * Convert a raw time value to a 12-hour formatted string.
 * Same input formats as toMins.
 */
function to12h(raw) {
  if (raw === null || raw === undefined || raw === '') return '—';
  raw = raw.toString().trim().replace(/\s*\(.*?\)/g, '');

  // Google Apps Script decimal format
  const asNum = parseFloat(raw);
  if (!isNaN(asNum) && asNum >= 0 && asNum < 1 && !raw.includes(':')) {
    const total = Math.round(asNum * 24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${pad(m)} ${ampm}`;
  }

  // Already 12-hour
  if (/am|pm/i.test(raw)) return raw.trim();

  // 24-hour string
  const [h, m] = raw.split(':').map(Number);
  if (isNaN(h)) return raw;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${pad(m || 0)} ${ampm}`;
}

/**
 * Format a difference in minutes as "Xh YYm" or "Ym"
 * Wraps midnight automatically.
 */
function minsLeft(diff) {
  if (diff < 0) diff += 1440;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
}

/**
 * Try to match a raw date string against today in many formats.
 * Google Sheets / Apps Script can return dates in various ways.
 */
function isToday(raw) {
  if (!raw) return false;
  const now = new Date();
  const d = now.getDate(), mo = now.getMonth() + 1, y = now.getFullYear();

  // Strip any time part
  let s = raw.toString().trim().split(' ')[0].split('T')[0];

  const formats = [
    `${pad(d)}/${pad(mo)}/${y}`,   // 10/05/2026  ← our CSV format
    `${d}/${mo}/${y}`,              // 10/5/2026
    `${d}/${pad(mo)}/${y}`,         // 10/05/2026 (no leading zero on day)
    `${y}-${pad(mo)}-${pad(d)}`,   // 2026-05-10  (ISO)
    `${pad(mo)}/${pad(d)}/${y}`,   // 05/10/2026  (US)
    `${mo}/${d}/${y}`,              // 5/10/2026   (US short)
  ];

  // Also handle Apps Script returning a JS Date string like "Mon May 10 2026 00:00:00"
  try {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      s = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
      return s === `${pad(d)}/${pad(mo)}/${y}`;
    }
  } catch (_) {}

  return formats.includes(s);
}
