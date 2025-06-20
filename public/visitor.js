// Google Apps Script
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxEmESDTSkOCieRrZFaDAP5VVAO7ooElAIdEuq6uS2KljAmrSO6V5jbhhDJg9tzrwL__g/exec";

// logVisitor
async function logVisitor() {
  const today = new Date().toISOString().slice(0, 10);
  const KEY = 'lastLoggedDate';

  if (localStorage.getItem(KEY) === today) return;

  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipRes.json();
    const ua = navigator.userAgent;

    window.handleLog = function(result) {
      if (result.status === 'success') {
        localStorage.setItem(KEY, today);
        console.log('Visitor logged for', today);
      } else {
        console.warn('Gagal log visitor:', result.message);
      }
      delete window.handleLog;
    };

    const params = new URLSearchParams({
      action: 'log',
      ip,
      userAgent: ua,
      callback: 'handleLog'
    });
    const script = document.createElement('script');
    script.src = `${SHEET_URL}?${params.toString()}`;
    document.body.appendChild(script);
    script.onload = () => script.remove();

  } catch (e) {
    console.warn('Error fetching IP for logVisitor:', e);
  }
}

// handleSummary
function handleSummary(data) {
  document.getElementById('visitorCount').textContent   = data.todayCount    || '0';
  document.getElementById('uniqueCount').textContent    = data.todayUnique   || '0';
  document.getElementById('pageviewCount').textContent  = data.todayPageviews || '0';
  document.getElementById('monthlyCount').textContent   = data.monthlyCount  || '0';
}

// fetchSummary
function fetchSummary() {
  const script = document.createElement('script');
  script.src = `${SHEET_URL}?action=stats_summary&callback=handleSummary&ts=${Date.now()}`;
  document.body.appendChild(script);
  script.onload = () => script.remove();
}

// handleWeekly
function handleWeekly(data) {
  const labels = data.map(item => item.date);
  const counts = data.map(item => item.count);
  const ctx = document.getElementById('trafficChart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Pengunjung Harian',
        data: counts,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Tanggal' } },
        y: { title: { display: true, text: 'Jumlah Pengunjung' }, beginAtZero: true }
      }
    }
  });
}

// fetchWeekly
function fetchWeekly() {
  const script = document.createElement('script');
  script.src = `${SHEET_URL}?action=stats_weekly&callback=handleWeekly&ts=${Date.now()}`;
  document.body.appendChild(script);
  script.onload = () => script.remove();
}

// handleCount
function handleCount(data) {
  document.getElementById('totalVisits').textContent = data.count || '0';
}

// fetchCount
function fetchCount() {
  const script = document.createElement('script');
  script.src = `${SHEET_URL}?callback=handleCount&ts=${Date.now()}`;
  document.body.appendChild(script);
  script.onload = () => script.remove();
}

// updateBattery
function updateBattery(bat) {
  const statEl = document.getElementById('batteryStatus');
  const detEl  = document.getElementById('batteryDetails');

  function refresh() {
    const lvl = Math.round(bat.level * 100) + '%';
    const msg = bat.charging
      ? `⚡ Charging, Level ${lvl}`
      : `🔋 Discharging, Level ${lvl}`;

    if (statEl) statEl.textContent = msg;

    if (detEl) {
      detEl.textContent =
        `Charging Time: ${bat.chargingTime === Infinity ? '∞' : bat.chargingTime + 's'} | ` +
        `Discharging Time: ${bat.dischargingTime === Infinity ? '∞' : bat.dischargingTime + 's'}`;
    }
  }

  refresh();
  bat.addEventListener('levelchange', refresh);
  bat.addEventListener('chargingchange', refresh);
}

// init
window.addEventListener('load', () => {
  logVisitor();
  fetchSummary();
  fetchWeekly();
  fetchCount();

  if (navigator.getBattery) {
    navigator.getBattery().then(updateBattery);
  } else {
    const statEl = document.getElementById('batteryStatus');
    if (statEl) statEl.textContent = 'API tidak didukung';
  }
});