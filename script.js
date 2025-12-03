// ===== helper untuk ganti page utama (welcome/login/dashboard) =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

let cachedServers = [];
const fmtRupiah = n =>
  'Rp ' + Number(n || 0).toLocaleString('id-ID');

// ===== API: STATUS USER =====
async function loadStatusFromApi() {
  try {
    const res = await fetch('/api/web/status', { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok || !json.data) {
      console.warn('status API error:', json);
      return;
    }

    const d = json.data;
    document.getElementById('statusSaldo').innerText = fmtRupiah(d.saldo);
    document.getElementById('statusTotalAkun').innerText = d.totalAkun || 0;
    document.getElementById('statusLevel').innerText =
      (d.level || 'member').toUpperCase();
  } catch (e) {
    console.warn('gagal load status web:', e);
  }
}

// ===== API: SERVER LIST =====
async function loadServersFromApi() {
  try {
    const res = await fetch('/api/web/servers', { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok || !Array.isArray(json.data)) {
      console.warn('servers API error:', json);
      cachedServers = [];
    } else {
      cachedServers = json.data;
    }
    renderServers();
    fillServerSelects();
  } catch (e) {
    console.warn('gagal load server web:', e);
    cachedServers = [];
    renderServers();
    fillServerSelects();
  }
}

function renderServers() {
  const wrap = document.getElementById('serverList');
  if (!wrap) return;

  if (!cachedServers.length) {
    wrap.innerHTML = '<p class="muted small">Belum ada server di database atau gagal memuat.</p>';
    return;
  }

  wrap.innerHTML = cachedServers.map(s => {
    const statusClass = s.penuh ? 'red' : 'green';
    const statusText  = s.penuh ? 'Penuh' : 'Tersedia';

    return `
      <div class="server-card">
        <div class="server-name">${s.nama_server}</div>
        <div class="server-meta">
          ${s.lokasi || '-'} • ${s.isp || '-'}
        </div>
        <div class="server-meta">
          Harga/hari: ${fmtRupiah(s.harga)}<br>
          Kuota/hari: ${s.quota || '-'} GB<br>
          IP Max: ${s.iplimit || '-'}<br>
          Akun: ${(s.total_create_akun || 0)}/${(s.batas_create_akun || 0)}
        </div>
        <span class="badge ${statusClass}">${statusText}</span>
      </div>
    `;
  }).join('');
}

function fillServerSelects() {
  const selCreate = document.getElementById('createServer');
  const selRenew  = document.getElementById('renewServer');
  if (!selCreate || !selRenew) return;

  if (!cachedServers.length) {
    const opt = '<option value="">(Belum ada server)</option>';
    selCreate.innerHTML = opt;
    selRenew.innerHTML  = opt;
    return;
  }

  const optionsHtml = cachedServers.map(s =>
    `<option value="${s.id}">${s.nama_server}</option>`
  ).join('');

  selCreate.innerHTML = optionsHtml;
  selRenew.innerHTML  = optionsHtml;
}

// ===== LOGIN & DASHBOARD =====
function loadDashboard() {
  const email = localStorage.getItem("xt_email");
  const pass  = localStorage.getItem("xt_pass");
  if (!email || !pass) {
    showPage('welcome');
    return;
  }
  document.getElementById('userEmailHeader').innerText = email;
  document.getElementById('infoEmail').innerText = email;
  document.getElementById('infoPass').innerText  = pass;

  showPage('dashboard');
  openAppPage('overview');

  // load data dari backend
  loadStatusFromApi();
  loadServersFromApi();
}

document.getElementById('btnMulai').addEventListener('click', () => {
  showPage('login');
});

document.getElementById('btnBack').addEventListener('click', () => {
  showPage('welcome');
});

document.getElementById('btnLogin').addEventListener('click', () => {
  const email = document.getElementById("email").value.trim();
  const pass  = document.getElementById("password").value.trim();
  if (!email || !pass) {
    alert("Email & password tidak boleh kosong!");
    return;
  }
  localStorage.setItem("xt_email", email);
  localStorage.setItem("xt_pass", pass);
  loadDashboard();
});

document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.removeItem("xt_email");
  localStorage.removeItem("xt_pass");
  showPage('welcome');
});

// ===== NAVIGASI DALAM DASHBOARD =====
function openAppPage(name) {
  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('app-' + name);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => {
    if (b.dataset.target === name) b.classList.add('active');
  });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.target;
    openAppPage(name);
  });
});

// ===== helper disable/enable button biar ga dobel klik =====
function lockButton(btn, locked) {
  if (!btn) return;
  btn.disabled = locked;
  btn.style.opacity = locked ? 0.6 : 1;
}

// ===== FORM BUAT AKUN (CALL API) =====
document.getElementById('btnCreate').addEventListener('click', async (ev) => {
  const btn = ev.currentTarget;
  const type     = document.getElementById('createType').value;
  const serverId = parseInt(document.getElementById('createServer').value, 10);
  const user     = document.getElementById('createUser').value.trim();
  const days     = parseInt(document.getElementById('createDays').value, 10);

  if (!serverId) {
    alert('Pilih server dulu.');
    return;
  }
  if (!user || !days) {
    alert('Username & hari tidak boleh kosong!');
    return;
  }

  lockButton(btn, true);
  try {
    const res = await fetch('/api/web/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, serverId, username: user, days })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok || !json.data) {
      throw new Error(json.error || 'Gagal membuat akun.');
    }

    alert(
      '✅ Akun berhasil dibuat.\n\n' +
      'Server: ' + json.data.serverName + '\n' +
      'Total Bayar: ' + fmtRupiah(json.data.totalHarga) +
      '\n\nDetail akun:\n\n' + json.data.message
    );

    loadStatusFromApi();
  } catch (e) {
    alert('❌ Gagal buat akun: ' + e.message);
  } finally {
    lockButton(btn, false);
  }
});

// ===== FORM RENEW (CALL API) =====
document.getElementById('btnRenew').addEventListener('click', async (ev) => {
  const btn = ev.currentTarget;
  const type     = document.getElementById('renewType').value;
  const serverId = parseInt(document.getElementById('renewServer').value, 10);
  const user     = document.getElementById('renewUser').value.trim();
  const days     = parseInt(document.getElementById('renewDays').value, 10);

  if (!serverId) {
    alert('Pilih server dulu.');
    return;
  }
  if (!user || !days) {
    alert('Username & hari tidak boleh kosong!');
    return;
  }

  lockButton(btn, true);
  try {
    const res = await fetch('/api/web/renew-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, serverId, username: user, days })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok || !json.data) {
      throw new Error(json.error || 'Gagal perpanjang akun.');
    }

    alert(
      '✅ Akun berhasil diperpanjang.\n\n' +
      'Server: ' + json.data.serverName + '\n' +
      'Total Bayar: ' + fmtRupiah(json.data.totalHarga) +
      '\n\nDetail:\n\n' + json.data.message
    );

    loadStatusFromApi();
  } catch (e) {
    alert('❌ Gagal perpanjang: ' + e.message);
  } finally {
    lockButton(btn, false);
  }
});

// ===== FORM TOPUP (CALL API + BUKA PAYMENT URL) =====
document.getElementById('btnTopup').addEventListener('click', async (ev) => {
  const btn = ev.currentTarget;
  const amount = parseInt(document.getElementById('topupAmount').value, 10);
  if (!amount || amount < 1000) {
    alert('Nominal minimal 1.000');
    return;
  }

  lockButton(btn, true);
  try {
    const res = await fetch('/api/web/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok || !json.data) {
      throw new Error(json.error || 'Gagal membuat invoice.');
    }

    alert(
      '✅ Invoice dibuat!\n\n' +
      'Order ID: ' + json.data.orderId + '\n' +
      'Nominal: ' + fmtRupiah(json.data.amount) +
      '\n\nSetelah klik OK, halaman pembayaran akan dibuka.'
    );

    if (json.data.paymentUrl) {
      window.open(json.data.paymentUrl, '_blank');
    }
  } catch (e) {
    alert('❌ Gagal topup: ' + e.message);
  } finally {
    lockButton(btn, false);
  }
});

// auto cek login saat pertama kali buka
loadDashboard();
