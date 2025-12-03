// ---------- PAGE SWITCH (WELCOME / LOGIN / DASHBOARD) ----------

function goLogin() {
  showPage('login');
}

function goWelcome() {
  showPage('welcome');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ---------- LOGIN / LOGOUT + LOCALSTORAGE ----------

function doLogin() {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (email === "" || pass === "") {
    alert("Email & password tidak boleh kosong!");
    return;
  }

  // Simpan ke localStorage (sementara)
  localStorage.setItem("xt_email", email);
  localStorage.setItem("xt_pass", pass);

  loadDashboard();
}

function loadDashboard() {
  const email = localStorage.getItem("xt_email");
  const pass = localStorage.getItem("xt_pass");

  if (!email || !pass) {
    showPage("welcome");
    return;
  }

  // Header + overview info
  document.getElementById("userEmailHeader").innerText = email;
  document.getElementById("infoEmail").innerText = email;
  document.getElementById("infoPass").innerText = pass;

  // Tampilkan dashboard
  showPage("dashboard");

  // Pastikan tab awal overview
  openAppPage("overview");
  renderDummyServers();
}

function logout() {
  localStorage.removeItem("xt_email");
  localStorage.removeItem("xt_pass");
  showPage("welcome");
}

// Auto check saat load
loadDashboard();

// ---------- NAVIGASI DALAM DASHBOARD ----------

function openAppPage(name, btn) {
  // ganti konten halaman
  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('app-' + name);
  if (target) target.classList.add('active');

  // highligt nav
  if (btn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  } else {
    // kalau dipanggil dari script (tanpa btn), activate tombol yang sesuai
    document.querySelectorAll('.nav-btn').forEach(b => {
      if (b.textContent.toLowerCase().includes(name === 'overview' ? 'overview' : name)) {
        b.classList.add('active');
      }
    });
  }
}

// ---------- DUMMY SERVER LIST (nanti bisa diganti dari API) ----------

const dummyServers = [
  {
    name: 'SG-1 Premium',
    location: 'Singapore',
    isp: 'DigitalOcean',
    status: 'online',
    note: 'Ping rendah, cocok gaming.'
  },
  {
    name: 'SG-2 Premium',
    location: 'Singapore',
    isp: 'Vultr',
    status: 'online',
    note: 'Koneksi stabil harian.'
  },
  {
    name: 'ID-1 Route',
    location: 'Indonesia',
    isp: 'Biznet',
    status: 'online',
    note: 'Cocok untuk streaming lokal.'
  },
  {
    name: 'US-1',
    location: 'United States',
    isp: 'OVH',
    status: 'offline',
    note: 'Sedang maintenance.'
  }
];

function renderDummyServers() {
  const wrap = document.getElementById('serverList');
  if (!wrap) return;

  wrap.innerHTML = dummyServers.map(s => {
    const statusClass = s.status === 'online' ? 'green' : 'red';
    const statusText = s.status === 'online' ? 'Online' : 'Offline';

    return `
      <div class="server-card">
        <div class="server-name">${s.name}</div>
        <div class="server-meta">${s.location} • ${s.isp}</div>
        <span class="badge ${statusClass}">${statusText}</span>
        <p class="muted small" style="margin-top:8px;">${s.note}</p>
      </div>
    `;
  }).join('');
}

// ---------- FORM SIMULASI BUAT AKUN ----------

function submitCreate() {
  const type = document.getElementById('createType').value;
  const server = document.getElementById('createServer').value;
  const user = document.getElementById('createUser').value.trim();
  const days = parseInt(document.getElementById('createDays').value, 10);

  if (!user || !days) {
    alert('Username & hari tidak boleh kosong!');
    return;
  }

  // nanti bagian ini bisa diganti POST ke API app.js
  console.log('Simulasi create:', { type, server, user, days });

  alert(`Simulasi: Buat akun ${type.toUpperCase()} di server ${server} untuk user "${user}" selama ${days} hari.\n\nNanti tombol ini tinggal diarahkan ke endpoint API.`);
}

// ---------- FORM SIMULASI RENEW ----------

function submitRenew() {
  const type = document.getElementById('renewType').value;
  const user = document.getElementById('renewUser').value.trim();
  const days = parseInt(document.getElementById('renewDays').value, 10);

  if (!user || !days) {
    alert('Username & hari tidak boleh kosong!');
    return;
  }

  console.log('Simulasi renew:', { type, user, days });

  alert(`Simulasi: Perpanjang akun ${type.toUpperCase()} untuk user "${user}" selama ${days} hari.\n\nNanti tinggal diarahkan ke endpoint renew.`);
}

// ---------- FORM SIMULASI TOPUP ----------

function submitTopup() {
  const amount = parseInt(document.getElementById('topupAmount').value, 10);
  if (!amount || amount < 1000) {
    alert('Nominal minimal 1.000');
    return;
  }

  const email = localStorage.getItem('xt_email') || '-';

  console.log('Simulasi topup:', { email, amount });

  alert(`Simulasi: Request topup Rp ${amount.toLocaleString('id-ID')} untuk ${email}.\n\nNanti bisa dihubungkan ke API topup + QRIS di backend.`);
}
