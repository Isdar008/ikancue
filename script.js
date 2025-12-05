// =====================================
// CONFIG
// =====================================
const API_BASE = "/api/web"; // panel domain sama
const ADMIN_EMAILS = [
  "istiqwamantunnel@gmail.com",
];

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
// PAGE SWITCHER (LOGIN / DASHBOARD)
// =====================================
function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const page = document.getElementById(id);
  if (page) page.classList.add("active");

  if (id === "login") showResetStep(0);
}

// =====================================
// RESET PASSWORD STEP (0/1/2)
// =====================================
function showResetStep(step) {
  const boxLogin = document.getElementById("loginBox");
  const s1 = document.getElementById("resetStep1");
  const s2 = document.getElementById("resetStep2");

  if (step === 0) {
    boxLogin.style.display = "block";
    s1.style.display = "none";
    s2.style.display = "none";
  } else if (step === 1) {
    boxLogin.style.display = "none";
    s1.style.display = "block";
    s2.style.display = "none";
  } else if (step === 2) {
    boxLogin.style.display = "none";
    s1.style.display = "none";
    s2.style.display = "block";
  }
}

// =====================================
// DASHBOARD DATA
// =====================================
let cachedServers = [];

// ---- Load Status ----
async function loadStatusFromApi() {
  try {
    const email = localStorage.getItem("xt_email") || "";
    if (!email) return;

    const res = await fetch(`${API_BASE}/status?email=${encodeURIComponent(email)}`);
    const json = await res.json().catch(() => ({}));
    if (!json.ok) return;

    const d = json.data;
    document.getElementById("statusSaldo").textContent = fmtRupiah(d.saldo);
    document.getElementById("statusTotalAkun").textContent = d.totalAkun || 0;
    document.getElementById("statusLevel").textContent = (d.level || "member").toUpperCase();
  } catch (e) {
    console.warn("Gagal load status:", e);
  }
}

// ---- Load Servers ----
async function loadServersFromApi() {
  try {
    const res = await fetch(`${API_BASE}/servers`);
    const json = await res.json().catch(() => ({}));
    if (!json.ok) return;

    cachedServers = json.data || [];
    renderServers();
    fillServerSelects();
  } catch (e) {
    console.warn("Gagal load servers:", e);
  }
}

function renderServers() {
  const wrap = document.getElementById("serverList");
  if (!wrap) return;

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
// ADMIN: TAMBAH SALDO
// =====================================
const btnAdminAddSaldo = document.getElementById("btnAdminAddSaldo");
if (btnAdminAddSaldo) {
  btnAdminAddSaldo.onclick = async () => {
    const adminEmail = localStorage.getItem("xt_email");
    const isAdmin = localStorage.getItem("xt_is_admin") === "1";

    const targetEmail = document.getElementById("adminTargetUser").value.trim().toLowerCase();
    const amount = parseInt(document.getElementById("adminAmount").value);
    const note = document.getElementById("adminNote").value.trim();

    if (!isAdmin) return alert("Hanya admin!");

    if (!targetEmail || !amount) return alert("Lengkapi data!");

    const res = await fetch(`${API_BASE}/admin/add-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminEmail, targetEmail, amount, note }),
    });

    const json = await res.json();
    if (!json.ok) return alert(json.error);

    alert("Saldo berhasil ditambah.");
    loadTopupHistoryAdmin();
  };
}

// =====================================
// LOGIN SYSTEM
// =====================================
function loadDashboard() {
  const email = localStorage.getItem("xt_email");

  if (!email) {
    showPage("login");
    return;
  }

  document.getElementById("userEmailHeader").innerText = email;

  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  localStorage.setItem("xt_is_admin", isAdmin ? "1" : "0");

  const navAdmin = document.getElementById("navAdmin");
  if (navAdmin) navAdmin.style.display = isAdmin ? "inline-flex" : "none";

  showPage("dashboard");
  openAppPage("overview");

  loadStatusFromApi();
  loadServersFromApi();
}

// ---- LOGIN ----
const btnLogin = document.getElementById("btnLogin");
if (btnLogin) {
  btnLogin.onclick = async () => {
    const email = document.getElementById("email").value.trim().toLowerCase();
    const pass = document.getElementById("password").value.trim();

    if (!email || !pass) return alert("Email & Password wajib diisi!");

    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    const json = await res.json();
    if (!json.ok) return alert(json.error);

    localStorage.setItem("xt_email", email);
    loadDashboard();
  };
}

// ---- LOGOUT ----
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.onclick = () => {
    localStorage.clear();
    showPage("login");
  };
}

// =====================================
// RESET PASSWORD
// =====================================
const btnForgot = document.getElementById("btnForgot");
if (btnForgot) {
  btnForgot.onclick = () => {
    const emailNow = document.getElementById("email").value.trim();
    document.getElementById("resetEmail").value = emailNow;
    showResetStep(1);
  };
}

document.getElementById("btnResetBack1").onclick = () => showResetStep(0);
document.getElementById("btnResetBack2").onclick = () => showResetStep(0);

document.getElementById("btnSendReset").onclick = async () => {
  const email = document.getElementById("resetEmail").value.trim();
  if (!email) return alert("Email wajib.");

  const res = await fetch(`${API_BASE}/request-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const json = await res.json();
  if (!json.ok) return alert(json.error);

  alert("Kode reset dikirim.");
  showResetStep(2);
};

document.getElementById("btnDoReset").onclick = async () => {
  const email = document.getElementById("resetEmail").value.trim();
  const code = document.getElementById("resetCode").value.trim();
  const newPass = document.getElementById("resetNewPass").value.trim();
  if (!email || !code || !newPass) return alert("Wajib lengkap!");

  const res = await fetch(`${API_BASE}/confirm-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword: newPass }),
  });

  const json = await res.json();
  if (!json.ok) return alert(json.error);

  alert("Password diperbarui.");
  showResetStep(0);
};

// =====================================
// NAVIGATION
// =====================================
function openAppPage(name) {
  document.querySelectorAll(".app-page").forEach((p) => p.classList.remove("active"));
  document.getElementById("app-" + name).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
  const btn = document.querySelector(`.nav-btn[data-target="${name}"]`);
  if (btn) btn.classList.add("active");

  document.querySelector(".app-nav").classList.remove("open");

  if (name === "topup") loadTopupHistory();
  if (name === "admin") loadTopupHistoryAdmin();
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.onclick = () => openAppPage(btn.dataset.target);
});

document.getElementById("btnToggleNav").onclick = () => {
  document.querySelector(".app-nav").classList.toggle("open");
};

// =====================================
// RESULT MODAL
// =====================================
let lastModalMessage = "";
let lastModalType = "";

function showResultModal(title, subtitle, body, type) {
  lastModalMessage = body;
  lastModalType = type;

  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalSubtitle").innerText = subtitle;
  document.getElementById("modalBody").innerHTML = body;

  document.getElementById("modalTypePill").innerText =
    type.toUpperCase() + " PREMIUM";

  document.getElementById("resultModal").classList.add("show");
}

document.getElementById("modalClose").onclick = () =>
  document.getElementById("resultModal").classList.remove("show");

// ---- COPY ALL ----
document.getElementById("modalCopy").onclick = async () => {
  const t = document.getElementById("modalBody").innerText.trim();
  try {
    await navigator.clipboard.writeText(t);
    alert("Disalin!");
  } catch {
    alert("Tidak bisa auto-copy. Copy manual.");
  }
};

// ---- COPY DETAIL ----
document.getElementById("modalCopyMain").onclick = async () => {
  const text = lastModalMessage;
  try {
    await navigator.clipboard.writeText(text);
    alert("Detail disalin!");
  } catch {
    alert("Copy manual.");
  }
};

// =====================================
// SERVICE CARD BUTTONS
// =====================================
document.querySelectorAll(".service-cta").forEach((btn) =>
  btn.addEventListener("click", () => {
    const t = btn.dataset.createType;
    openAppPage("create");
    document.getElementById("createType").value = t;
    updatePasswordVisibility();
  })
);

document.querySelectorAll(".service-cta-renew").forEach((btn) =>
  btn.addEventListener("click", () => {
    const t = btn.dataset.renewType;
    openAppPage("renew");
    document.getElementById("renewType").value = t;
  })
);

// =====================================
// SSH PASSWORD FIELD
// =====================================
function updatePasswordVisibility() {
  const t = document.getElementById("createType").value;
  document.getElementById("createPassWrap").style.display =
    t === "ssh" ? "block" : "none";
}

updatePasswordVisibility();
document.getElementById("createType").onchange = updatePasswordVisibility;

// =====================================
// CREATE ACCOUNT
// =====================================
document.getElementById("btnCreate").onclick = async () => {
  const type = document.getElementById("createType").value;
  const serverId = document.getElementById("createServer").value;
  const username = document.getElementById("createUser").value.trim();
  const password = document.getElementById("createPass").value.trim();
  const days = document.getElementById("createDays").value;
  const email = localStorage.getItem("xt_email");

  if (!username || !serverId || !days) return alert("Lengkapi data!");

  if (type === "ssh" && !password) return alert("Password SSH wajib!");

  const res = await fetch(`${API_BASE}/create-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, type, serverId, username, days, password }),
  });

  const json = await res.json();
  if (!json.ok) return alert(json.error);

  showResultModal(
    "Akun berhasil dibuat",
    `Server: ${json.data.serverName} • Harga: ${fmtRupiah(json.data.totalHarga)}`,
    json.data.message,
    type
  );

  loadStatusFromApi();
};

// =====================================
// RENEW ACCOUNT
// =====================================
document.getElementById("btnRenew").onclick = async () => {
  const type = document.getElementById("renewType").value;
  const serverId = document.getElementById("renewServer").value;
  const username = document.getElementById("renewUser").value.trim();
  const days = document.getElementById("renewDays").value;
  const email = localStorage.getItem("xt_email");

  if (!serverId || !username || !days)
    return alert("Lengkapi semua form!");

  const res = await fetch(`${API_BASE}/renew-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, type, serverId, username, days }),
  });

  const json = await res.json();
  if (!json.ok) return alert(json.error);

  showResultModal(
    "Akun berhasil diperpanjang",
    `Server: ${json.data.serverName} • Harga: ${fmtRupiah(json.data.totalHarga)}`,
    json.data.message,
    type
  );

  loadStatusFromApi();
};

// =====================================
// TOPUP SYSTEM
// =====================================
document.getElementById("btnTopup").onclick = async () => {
  const amount = parseInt(document.getElementById("topupAmount").value);
  const email = localStorage.getItem("xt_email");

  if (!amount || !email) return alert("Nominal salah / belum login");

  const res = await fetch(`${API_BASE}/topup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount }),
  });

  const json = await res.json();
  if (!json.ok) return alert(json.error);

  const data = json.data;

  const card = document.getElementById("topupPaymentCard");
  const img = document.getElementById("qrisImage");
  const infoEl = document.getElementById("paymentInfo");
  const linkEl = document.getElementById("paymentLink");

  infoEl.textContent = `Invoice: ${data.orderId}`;

  img.src =
    data.qrImageBase64 ||
    data.qrisImage ||
    data.qrImage ||
    data.qrisImageUrl ||
    "";
  img.style.display = img.src ? "block" : "none";

  if (data.paymentUrl) {
    linkEl.href = data.paymentUrl;
    linkEl.style.display = "inline-block";
  } else linkEl.style.display = "none";

  card.style.display = "block";

  loadTopupHistory();
};

// ---- HISTORY USER ----
async function loadTopupHistory() {
  const email = localStorage.getItem("xt_email");
  const list = document.getElementById("topupHistory");
  const empty = document.getElementById("topupHistoryEmpty");

  if (!email) {
    empty.textContent = "Login dulu.";
    empty.style.display = "block";
    return;
  }

  const res = await fetch(`${API_BASE}/topup-history?email=${email}`);
  const json = await res.json();

  if (!json.ok || !json.items.length) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  list.innerHTML = json.items
    .map((i) => {
      const w = new Date(i.created_at).toLocaleString("id-ID");
      return `<li>#${i.id} • ${fmtRupiah(i.amount)} • ${i.status.toUpperCase()} • ${w}</li>`;
    })
    .join("");

  empty.style.display = "none";
}

// ---- HISTORY ADMIN ----
async function loadTopupHistoryAdmin() {
  const list = document.getElementById("topupHistoryAdmin");
  const empty = document.getElementById("topupHistoryAdminEmpty");

  const res = await fetch(`${API_BASE}/topup-history`);
  const json = await res.json();

  if (!json.ok || !json.items.length) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  list.innerHTML = json.items
    .map((i) => {
      const w = new Date(i.created_at).toLocaleString("id-ID");
      return `<li>#${i.id} • ${fmtRupiah(i.amount)} • ${i.status} • ${w}</li>`;
    })
    .join("");

  empty.style.display = "none";
}

// =====================================
// START PANEL
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("xt_email");
  if (email) loadDashboard();
  else showPage("login");
});
