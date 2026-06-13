// ═══════════════════════════════════════════════════════
//  app.js
//  UI rendering, state, and boot sequence
// ═══════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────
let todayRow  = null;   // current day's data row
let tickTimer = null;   // setInterval handle for countdown

// ── Render ────────────────────────────────────────────

/**
 * Re-render the prayer list and next-prayer strip.
 * Called on boot and every TICK_SECONDS thereafter.
 */
function render() {
  if (!todayRow) return;

  const nm = nowMins();

  // Adhan times decide which prayer period we're in
  const adhanMins = PRAYERS.map(p => toMins(todayRow[p.name]));

  // Iqamah times are shown in the list and used for countdown
  const iqamahMins = PRAYERS.map(p => {
    const key = `${p.name}_Iqamah`;
    return toMins(todayRow[key] || todayRow[key.toLowerCase()] || '');
  });

  // Current = last prayer whose Adhan has passed (drives "Now" badge)
  let curIdx = -1;
  adhanMins.forEach((m, i) => {
    if (m !== -1 && nm >= m) curIdx = i;
  });

  // Next = first prayer whose Iqamah hasn't passed yet (drives countdown)
  let nextIdx = iqamahMins.findIndex((iq, i) => {
    const target = iq !== -1 ? iq : adhanMins[i];
    return target !== -1 && nm < target;
  });
  if (nextIdx === -1) nextIdx = 0; // after Isha, wrap to Fajr

  // Countdown target: next prayer's Iqamah, fall back to Adhan
  const targetMins = iqamahMins[nextIdx] !== -1
    ? iqamahMins[nextIdx]
    : adhanMins[nextIdx];

  // ── Update next-prayer strip ──
  document.getElementById('next-name').textContent   = PRAYERS[nextIdx].name;
  document.getElementById('countdown').textContent   = minsLeft(targetMins - nm);

  // ── Render prayer rows ──
  document.getElementById('prayer-list').innerHTML = PRAYERS.map((p, i) => {
    const isActive = i === curIdx;
    const isPassed = i < curIdx;
    const cls = [
      'p-row',
      isActive ? 'active'  : '',
      isPassed ? 'passed'  : '',
    ].filter(Boolean).join(' ');

    const iqKey  = `${p.name}_Iqamah`;
    const iqamah = to12h(todayRow[iqKey] || todayRow[iqKey.toLowerCase()] || '');

    return `
      <div class="${cls}">
        <div class="p-left">
          <span class="p-icon">${p.icon}</span>
          <span class="p-name">
            ${p.name}
            ${isActive ? '<span class="now-badge">Now</span>' : ''}
          </span>
        </div>
        <div class="p-time iqamah-time">
          <div class="p-time-val">${iqamah}</div>
        </div>
      </div>`;
  }).join('');
}

// ── UI helpers ────────────────────────────────────────

function showApp() {
  const loader = document.getElementById('loading');
  loader.classList.add('out');
  setTimeout(() => loader.style.display = 'none', 380);
  document.getElementById('app').style.display = 'block';
}

function showError(msg) {
  showApp();
  document.getElementById('prayer-list').innerHTML = `
    <div class="info-card error">
      <div class="info-title">Could Not Load Timings</div>
      <div class="info-body">${msg}</div>
    </div>`;
}

function showSetupGuide() {
  showApp();
  document.getElementById('prayer-list').innerHTML = `
    <div class="info-card" style="border-color:#16a34a22">
      <div class="info-title" style="color:#166534">⚙️ Connection Setup Required</div>
      <div class="info-body">
        <strong>Step 1</strong> — Open your Google Sheet →
        <strong>Extensions → Apps Script</strong><br><br>
        <strong>Step 2</strong> — Paste this code:<br><br>
        <code style="display:block;background:#f5f5f4;padding:10px;border-radius:6px;
                     font-size:11px;line-height:1.8;white-space:pre-wrap">function doGet() {
  const ss = SpreadsheetApp.openById('${CONFIG.SHEET_ID}');
  const sheet = ss.getSheetByName('${CONFIG.SHEET_TAB}');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const data = rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
  return ContentService
    .createTextOutput(JSON.stringify({ data }))
    .setMimeType(ContentService.MimeType.JSON);
}</code><br>
        <strong>Step 3</strong> — Deploy → New deployment → Web app →
        Execute as <em>Me</em> → Access <em>Anyone</em> → Deploy → Allow<br><br>
        <strong>Step 4</strong> — Copy the Web App URL and paste it in
        <code>js/config.js</code> as <code>APPS_SCRIPT_URL</code>
      </div>
    </div>`;
}

function updateLastUpdated() {
  const el = document.getElementById('last-updated');
  if (el) {
    el.textContent = `Updated ${new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit'
    })}`;
  }
}

// ── Boot ──────────────────────────────────────────────

async function boot() {

  try {
    // Fetch data
    const rows = await fetchSheet();
    const row  = findToday(rows);

    if (!row) {
      throw new Error(
        `No data found for today (${todayStr()}).<br><br>` +
        `Make sure your Google Sheet has a <strong>Date</strong> column ` +
        `in <strong>DD/MM/YYYY</strong> format and today's row is filled in.`
      );
    }

    todayRow = row;
    render();
    showApp();
    updateLastUpdated();

    // Load Hijri date (non-blocking)
    fetchHijriDate()
      .then(h => { document.getElementById('hijri-date').textContent = h; })
      .catch(() => { document.getElementById('hijri-date').textContent = ''; });

    // Live countdown tick
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(render, CONFIG.TICK_SECONDS * 1000);

    // Periodic re-fetch from sheet
    setInterval(async () => {
      try {
        const r2   = await fetchSheet();
        const row2 = findToday(r2);
        if (row2) { todayRow = row2; render(); }
        updateLastUpdated();
      } catch (_) {}
    }, CONFIG.REFRESH_MINUTES * 60_000);

  } catch (err) {
    const msg = err.message || String(err);
    if (msg === 'SETUP_REQUIRED') {
      showSetupGuide();
    } else {
      showError(msg);
    }
  }
}

// Apply mosque info from config to all DOM elements
function applyConfig() {
  const location = `${CONFIG.MOSQUE_CITY} · ${CONFIG.MOSQUE_COUNTRY}`;
  const fullAddress = CONFIG.MOSQUE_ADDRESS
    ? `${CONFIG.MOSQUE_NAME}, ${CONFIG.MOSQUE_ADDRESS}, ${CONFIG.MOSQUE_CITY}`
    : `${CONFIG.MOSQUE_NAME}, ${CONFIG.MOSQUE_CITY}`;

  document.title = `${CONFIG.MOSQUE_NAME} — Prayer Times`;

  const metaTitle = document.getElementById('meta-app-title');
  if (metaTitle) metaTitle.setAttribute('content', CONFIG.MOSQUE_NAME);

  const metaDesc = document.getElementById('meta-description');
  if (metaDesc) metaDesc.setAttribute('content', `Daily prayer times for ${CONFIG.MOSQUE_NAME}, ${CONFIG.MOSQUE_CITY}`);

  const mosqueNameEls = document.querySelectorAll('.mosque-name, .loading-mosque');
  mosqueNameEls.forEach(el => el.textContent = CONFIG.MOSQUE_NAME);

  const locationEl = document.querySelector('.mosque-location');
  if (locationEl) locationEl.textContent = location;

  const footerName = document.querySelector('.footer-name');
  if (footerName) footerName.textContent = fullAddress;
}

// Start
applyConfig();
boot();
