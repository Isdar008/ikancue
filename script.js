// =====================================
// CONFIG
// =====================================
const API_BASE = "/api/web"; // karena panel di domain yang sama

// =====================================
// HELPER
// =====================================
const fmtRupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

function lockButton(btn, locked) {
  if (!btn) return;
  btn.disabled = locked;
  btn.style.opacity = locked ? 0.6 : 1;
}

// =====================================
// PAGE SWITCHER (WELCOME / LOGIN / DASHBOARD)
// =====================================
function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// =====================================
// DASHBOARD DATA
// =====================================
let cachedServers = [];

// ----- Load Status Dari API (PER EMAIL) -----
async function loadStatusFromApi() {
  try {
    const email = localStorage.getItem("xt_email") || "";

    if (!email) {
      // belum login, reset tampilan
      document.getElementById("statusSaldo").textContent = "Rp 0";
      document.getElementById("statusTotalAkun").textContent = "0";
      document.getElementById("statusLevel").textContent = "MEMBER";
      return;
    }

    const res = await fetch(
      `${API_BASE}/status?email=${encodeURIComponent(email)}`
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok || !json.data) return;

    const d = json.data;
    document.getElementById("statusSaldo").textContent = fmtRupiah(d.saldo);
    document.getElementById("statusTotalAkun").textContent = d.totalAkun || 0;
    document.getElementById("statusLevel").textContent = (d.level || "member").toUpperCase();
  } catch (e) {
    console.warn("Gagal load status:", e);
  }
}

// ----- Load Server Dari API -----
async function loadServersFromApi() {
  try {
    const res = await fetch(`${API_BASE}/servers`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) return;

    cachedServers = json.data || [];
    renderServers();
    fillServerSelects();
  } catch (e) {
    console.warn("Gagal load servers:", e);
  }
}

function renderServers() {
  const wrap = document.getElementById("serverList");
  if (!cachedServers.length) {
    wrap.innerHTML = "<p class='muted small'>Server kosong / gagal memuat.</p>";
    return;
  }

  wrap.innerHTML = cachedServers
    .map((s) => {
      const statusClass = s.penuh ? "red" : "green";
      const statusText = s.penuh ? "Penuh" : "Tersedia";

      return `
        <div class="server-card">
          <div class="server-name">${s.nama_server}</div>
          <div class="server-meta">${s.lokasi} • ${s.isp}</div>
          <div class="server-meta">
            Harga/hari: ${fmtRupiah(s.harga)}<br>
            Kuota/hari: ${s.quota} GB<br>
            IP Max: ${s.iplimit}<br>
            Akun: ${s.total_create_akun}/${s.batas_create_akun}
          </div>
          <span class="badge ${statusClass}">${statusText}</span>
        </div>
      `;
    })
    .join("");
}

function fillServerSelects() {
  const selCreate = document.getElementById("createServer");
  const selRenew = document.getElementById("renewServer");

  if (!cachedServers.length) {
    selCreate.innerHTML = "<option value=''>Server kosong</option>";
    selRenew.innerHTML = "<option value=''>Server kosong</option>";
    return;
  }

  const html = cachedServers
    .map((s) => `<option value="${s.id}">${s.nama_server}</option>`)
    .join("");

  selCreate.innerHTML = html;
  selRenew.innerHTML = html;
}

// =====================================
// LOGIN SYSTEM
// =====================================
function loadDashboard() {
  const email = localStorage.getItem("xt_email");
  const pass = localStorage.getItem("xt_pass");
  if (!email || !pass) return showPage("welcome");

  document.getElementById("userEmailHeader").innerText = email;
  document.getElementById("infoEmail").innerText = email;
  document.getElementById("infoPass").innerText = pass;

  showPage("dashboard");
  openAppPage("overview");

  loadStatusFromApi();
  loadServersFromApi();
}

document.getElementById("btnMulai").onclick = () => showPage("login");
document.getElementById("btnBack").onclick = () => showPage("welcome");

document.getElementById("btnLogin").addEventListener("click", async (ev) => {
  const btn = ev.currentTarget;
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (!email || !pass) {
    alert("Email & password tidak boleh kosong!");
    return;
  }

  lockButton(btn, true);

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.ok) {
      throw new Error(json.error || "Gagal login.");
    }

    // simpan di browser
    localStorage.setItem("xt_email", json.data.email);
    localStorage.setItem("xt_pass", pass);

    if (json.data.isNew) {
      alert("Berhasil daftar & login dengan email baru.");
    }

    loadDashboard();
  } catch (e) {
    alert(e.message || "Gagal login.");
  } finally {
    lockButton(btn, false);
  }
});

document.getElementById("btnLogout").onclick = () => {
  localStorage.removeItem("xt_email");
  localStorage.removeItem("xt_pass");
  showPage("welcome");
};

// =====================================
// NAVIGATION (Overview/Server/Buat/Renew/Topup)
// =====================================
function openAppPage(name) {
  document
    .querySelectorAll(".app-page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("app-" + name).classList.add("active");

  document
    .querySelectorAll(".nav-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelector(`.nav-btn[data-target="${name}"]`)
    .classList.add("active");

  // saat buka tab Topup → load history
  if (name === "topup") {
    loadTopupHistory();
  }
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.onclick = () => openAppPage(btn.dataset.target);
});

// =====================================
// FORM: BUAT AKUN
// =====================================
document.getElementById("btnCreate").onclick = async (ev) => {
  const btn = ev.target;
  const type = document.getElementById("createType").value;
  const serverId = parseInt(document.getElementById("createServer").value);
  const username = document.getElementById("createUser").value.trim();
  const days = parseInt(document.getElementById("createDays").value);
  const email = localStorage.getItem("xt_email") || "";

  if (!serverId || !username || !days)
    return alert("Lengkapi semua form!");

  lockButton(btn, true);

  try {
    const res = await fetch(`${API_BASE}/create-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type, serverId, username, days }),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error);

    alert(
      `Akun berhasil dibuat:\nServer: ${json.data.serverName}\nHarga: ${fmtRupiah(
        json.data.totalHarga
      )}\n\n${json.data.message}`
    );

    loadStatusFromApi();
  } catch (e) {
    alert("Gagal membuat akun: " + e.message);
  }

  lockButton(btn, false);
};

// =====================================
// FORM: RENEW AKUN
// =====================================
document.getElementById("btnRenew").onclick = async (ev) => {
  const btn = ev.target;
  const type = document.getElementById("renewType").value;
  const serverId = parseInt(document.getElementById("renewServer").value);
  const username = document.getElementById("renewUser").value.trim();
  const days = parseInt(document.getElementById("renewDays").value);

  if (!serverId || !username || !days)
    return alert("Lengkapi semua form!");

  lockButton(btn, true);

  try {
    const res = await fetch(`${API_BASE}/renew-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, serverId, username, days }),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error);

    alert(
      `Akun berhasil diperpanjang!\nServer: ${json.data.serverName}\nHarga: ${fmtRupiah(
        json.data.totalHarga
      )}\n\n${json.data.message}`
    );

    loadStatusFromApi();
  } catch (e) {
    alert("Gagal perpanjang akun: " + e.message);
  }

  lockButton(btn, false);
};

// =====================================
// TOPUP: FORM + HISTORY
// =====================================

// -- lakukan request topup
document.getElementById("btnTopup").onclick = async (ev) => {
  const btn = ev.target;
  const amount = parseInt(document.getElementById("topupAmount").value);
  const email = localStorage.getItem("xt_email");

  if (!amount || amount < 1000) return alert("Minimal topup Rp 1.000");
  if (!email) return alert("Login dulu");

  lockButton(btn, true);

  try {
    const res = await fetch(`${API_BASE}/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount }),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error);

    alert("Invoice dibuat. Buka halaman pembayaran...");

    if (json.data.paymentUrl) {
      window.open(json.data.paymentUrl, "_blank");
    }

    // reload riwayat
    loadTopupHistory();
  } catch (e) {
    alert("Gagal request topup: " + e.message);
  }

  lockButton(btn, false);
};

// -- load riwayat topup
async function loadTopupHistory() {
  const email = localStorage.getItem("xt_email");
  const list = document.getElementById("topupHistory");
  const empty = document.getElementById("topupHistoryEmpty");

  if (!email) {
    list.innerHTML = "";
    empty.textContent = "Silakan login untuk melihat riwayat.";
    empty.style.display = "block";
    return;
  }

  list.innerHTML = "<li>Memuat...</li>";
  empty.style.display = "none";

  try {
    const res = await fetch(
      `${API_BASE}/topup-history?email=${encodeURIComponent(email)}`
    );
    const json = await res.json();

    if (!json.ok || !json.items || json.items.length === 0) {
      list.innerHTML = "";
      empty.textContent = "Belum ada riwayat topup.";
      empty.style.display = "block";
      return;
    }

    list.innerHTML = json.items
      .map((item) => {
        const waktu = item.created_at
          ? new Date(item.created_at).toLocaleString("id-ID")
          : "-";
        return `
          <li>
            #${item.id} • ${fmtRupiah(item.amount)} • ${item.status.toUpperCase()} • ${waktu}
          </li>
        `;
      })
      .join("");
  } catch (e) {
    list.innerHTML = "<li>Gagal memuat riwayat.</li>";
    empty.style.display = "none";
  }
}

// =====================================
// START PANEL
// =====================================
loadDashboard();
