// =====================================
// CONFIG
// =====================================
const API_BASE = "/api/web";
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
// PAGE SWITCHER
// =====================================
function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const page = document.getElementById(id);
  if (page) page.classList.add("active");

  if (id === "login") showResetStep(0);
}

// =====================================
// RESET PASSWORD STEPS
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

// ----- Load Status User -----
async function loadStatusFromApi() {
  try {
    const email = localStorage.getItem("xt_email") || "";

    if (!email) {
      document.getElementById("statusSaldo").textContent = "Rp 0";
      document.getElementById("statusTotalAkun").textContent = "0";
      document.getElementById("statusLevel").textContent = "MEMBER";
      return;
    }

    const res = await fetch(`${API_BASE}/status?email=${encodeURIComponent(email)}`);
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.ok) return;

    const d = json.data;
    document.getElementById("statusSaldo").textContent = fmtRupiah(d.saldo);
    document.getElementById("statusTotalAkun").textContent = d.totalAkun || 0;
    document.getElementById("statusLevel").textContent = (d.level || "member").toUpperCase();
  } catch (e) {
    console.warn("Gagal load status:", e);
  }
}

// ----- Load server -----
async function loadServersFromApi() {
  try {
    const res = await fetch(`${API_BASE}/servers`);
    const json = await res.json().catch(() => ({}));
    if (!json.ok) return;

    cachedServers = json.data || [];
    renderServers();
    fillServerSelects();
  } catch (e) {
    console.warn("Gagal load server:", e);
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
// LOGIN SYSTEM
// =====================================
function loadDashboard() {
  const email = localStorage.getItem("xt_email");

  // Perbaikan: cukup cek email
  if (!email) {
    showPage("login");
    return;
  }

  const headerEmailEl = document.getElementById("userEmailHeader");
  if (headerEmailEl) headerEmailEl.innerText = email;

  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  localStorage.setItem("xt_is_admin", isAdmin ? "1" : "0");

  const navAdmin = document.getElementById("navAdmin");
  if (navAdmin) navAdmin.style.display = isAdmin ? "inline-flex" : "none";

  showPage("dashboard");
  openAppPage("overview");

  loadStatusFromApi();
  loadServersFromApi();
}

const btnLogin = document.getElementById("btnLogin");
if (btnLogin) {
  btnLogin.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (!email || !pass) return alert("Email & password tidak boleh kosong!");

    lockButton(btn, true);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      const json = await res.json();

      if (!json.ok) throw new Error(json.error);

      localStorage.setItem("xt_email", json.data.email);
      localStorage.setItem("xt_pass", pass);

      loadDashboard();
    } catch (e) {
      alert(e.message);
    }

    lockButton(btn, false);
  });
}

const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.onclick = () => {
    localStorage.removeItem("xt_email");
    localStorage.removeItem("xt_pass");
    showPage("login");
  };
}

// =====================================
// RESET PASSWORD
// =====================================
const btnForgot = document.getElementById("btnForgot");
if (btnForgot) {
  btnForgot.onclick = () => {
    const email = document.getElementById("email").value.trim();
    const resetEmailInput = document.getElementById("resetEmail");
    if (email) resetEmailInput.value = email;
    showResetStep(1);
  };
}

const btnResetBack1 = document.getElementById("btnResetBack1");
if (btnResetBack1) btnResetBack1.onclick = () => showResetStep(0);

const btnResetBack2 = document.getElementById("btnResetBack2");
if (btnResetBack2) btnResetBack2.onclick = () => showResetStep(0);

const btnSendReset = document.getElementById("btnSendReset");
if (btnSendReset) {
  btnSendReset.onclick = async (ev) => {
    const email = document.getElementById("resetEmail").value.trim();
    if (!email) return alert("Email wajib diisi!");

    lockButton(ev.currentTarget, true);

    try {
      const res = await fetch(`${API_BASE}/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      alert("Kode reset sudah dikirim.");
      showResetStep(2);
    } catch (e) {
      alert(e.message);
    }

    lockButton(ev.currentTarget, false);
  };
}

const btnDoReset = document.getElementById("btnDoReset");
if (btnDoReset) {
  btnDoReset.onclick = async (ev) => {
    const email = document.getElementById("resetEmail").value.trim();
    const code = document.getElementById("resetCode").value.trim();
    const newPass = document.getElementById("resetNewPass").value.trim();

    if (!email || !code || !newPass)
      return alert("Semua field wajib diisi.");

    lockButton(ev.currentTarget, true);

    try {
      const res = await fetch(`${API_BASE}/confirm-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: newPass }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      alert("Password berhasil direset!");

      // Auto login
      localStorage.setItem("xt_email", email);
      localStorage.setItem("xt_pass", newPass);

      loadDashboard();
    } catch (e) {
      alert(e.message);
    }

    lockButton(ev.currentTarget, false);
  };
}

// =====================================
// NAVIGATION
// =====================================
function openAppPage(name) {
  document.querySelectorAll(".app-page").forEach((p) =>
    p.classList.remove("active")
  );
  document.getElementById("app-" + name).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach((btn) =>
    btn.classList.remove("active")
  );
  const activeBtn = document.querySelector(`.nav-btn[data-target="${name}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  const nav = document.querySelector(".app-nav");
  if (nav) nav.classList.remove("open");

  if (name === "topup") loadTopupHistory();
  if (name === "admin") loadTopupHistoryAdmin();
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.onclick = () => openAppPage(btn.dataset.target);
});

const btnToggleNav = document.getElementById("btnToggleNav");
if (btnToggleNav) {
  btnToggleNav.onclick = () => {
    const nav = document.querySelector(".app-nav");
    if (nav) nav.classList.toggle("open");
  };
}

// =====================================
// MODAL RESULT
// =====================================
let lastModalMessage = "";
let lastModalType = "";

function showResultModal(title, subtitle, rawMsg, accType) {
  const overlay = document.getElementById("resultModal");
  const titleEl = document.getElementById("modalTitle");
  const subEl = document.getElementById("modalSubtitle");
  const bodyEl = document.getElementById("modalBody");
  const pillEl = document.getElementById("modalTypePill");
  const successTextEl = document.getElementById("modalSuccessText");

  lastModalMessage = rawMsg || "";
  lastModalType = (accType || "").toLowerCase();

  titleEl.textContent = title;
  subEl.textContent = subtitle;
  bodyEl.innerHTML = rawMsg || "";

  const upper = accType.toUpperCase();
  pillEl.textContent = upper + " PREMIUM";

  successTextEl.textContent = `Akun ${upper} berhasil diproses.`;

  overlay.classList.add("show");
}

document.getElementById("modalClose").onclick = () =>
  document.getElementById("resultModal").classList.remove("show");

document.getElementById("modalCopy").onclick = async () => {
  const text = document.getElementById("modalBody").innerText.trim();
  await navigator.clipboard.writeText(text);
  alert("Disalin!");
};

document.getElementById("modalCopyMain").onclick = async () => {
  const box = document.querySelector("#modalBody .mini-box");
  const links = document.querySelectorAll("#modalBody .scroll-x");

  let parts = [];
  if (box) parts.push(box.innerText.trim());

  if (links.length) {
    parts.push(
      Array.from(links)
        .map((el) => el.innerText.trim())
        .join("\n\n")
    );
  }

  const text = parts.join("\n\n");
  await navigator.clipboard.writeText(text);
  alert("Detail akun disalin!");
};

// =====================================
// SERVICE CARD ACTIONS
// =====================================
document.querySelectorAll(".service-cta").forEach((btn) => {
  btn.onclick = () => {
    const t = btn.dataset.createType;
    openAppPage("create");
    document.getElementById("createType").value = t;
    updatePasswordVisibility();
  };
});

document.querySelectorAll(".service-cta-renew").forEach((btn) => {
  btn.onclick = () => {
    const t = btn.dataset.renewType;
    openAppPage("renew");
    document.getElementById("renewType").value = t;
  };
});

// =====================================
// BUAT AKUN
// =====================================
const typeSelect = document.getElementById("createType");
const passwordFieldWrap = document.getElementById("createPassWrap");

function updatePasswordVisibility() {
  const t = typeSelect.value.toLowerCase();
  passwordFieldWrap.style.display = t === "ssh" ? "block" : "none";
}
updatePasswordVisibility();
typeSelect.onchange = updatePasswordVisibility;

document.getElementById("btnCreate").onclick = async (ev) => {
  const btn = ev.target;
  const type = document.getElementById("createType").value;
  const serverId = parseInt(document.getElementById("createServer").value);
  const username = document.getElementById("createUser").value.trim();
  const password = document.getElementById("createPass")?.value.trim() || "";
  const days = parseInt(document.getElementById("createDays").value);
  const email = localStorage.getItem("xt_email");

  if (!serverId || !username || !days)
    return alert("Lengkapi form!");

  if (type === "ssh" && !password)
    return alert("Password SSH wajib.");

  lockButton(btn, true);

  try {
    const res = await fetch(`${API_BASE}/create-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email, type, serverId, username, days, password,
      }),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error);

    showResultModal(
      "Akun berhasil dibuat",
      `Server: ${json.data.serverName} • Harga: ${fmtRupiah(json.data.totalHarga)}`,
      json.data.message,
      type
    );

    loadStatusFromApi();
  } catch (e) {
    alert("Gagal: " + e.message);
  }

  lockButton(btn, false);
};

// =====================================
// RENEW AKUN
// =====================================
document.getElementById("btnRenew").onclick = async (ev) => {
  const btn = ev.target;
  const type = document.getElementById("renewType").value;
  const serverId = parseInt(document.getElementById("renewServer").value);
  const username = document.getElementById("renewUser").value.trim();
  const days = parseInt(document.getElementById("renewDays").value);
  const email = localStorage.getItem("xt_email");

  if (!serverId || !username || !days)
    return alert("Lengkapi semua form.");

  lockButton(btn, true);

  try {
    const res = await fetch(`${API_BASE}/renew-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, serverId, username, days, email }),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error);

    showResultModal(
      "Akun berhasil diperpanjang",
      `Server: ${json.data.serverName} • Harga: ${fmtRupiah(json.data.totalHarga)}`,
      json.data.message,
      type
    );

    loadStatusFromApi();
  } catch (e) {
    alert(e.message);
  }

  lockButton(btn, false);
};

// =====================================
// TOPUP SYSTEM
// =====================================
document.getElementById("btnTopup").onclick = async (ev) => {
  const btn = ev.target;
  const amount = parseInt(document.getElementById("topupAmount").value);
  const email = localStorage.getItem("xt_email");

  if (!amount || amount < 1000) return alert("Minimal topup Rp 1000");
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

    const data = json.data;
    const card = document.getElementById("topupPaymentCard");
    const img = document.getElementById("qrisImage");
    const info = document.getElementById("paymentInfo");
    const link = document.getElementById("paymentLink");

    info.textContent = `Invoice: ${data.orderId} • Nominal: ${fmtRupiah(data.amount)}`;

    const qr =
      data.qrImageBase64 ||
      data.qrImageUrl ||
      data.qrisImageUrl ||
      data.qr_url ||
      "";

    if (qr) {
      img.src = qr;
      img.style.display = "block";
    } else img.style.display = "none";

    if (data.paymentUrl) {
      link.href = data.paymentUrl;
      link.style.display = "inline-block";
    } else link.style.display = "none";

    card.style.display = "block";

    loadTopupHistory();
  } catch (e) {
    alert(e.message);
  }

  lockButton(btn, false);
};

async function loadTopupHistory() {
  const email = localStorage.getItem("xt_email");
  const list = document.getElementById("topupHistory");
  const empty = document.getElementById("topupHistoryEmpty");

  if (!email) {
    list.innerHTML = "";
    empty.textContent = "Silakan login.";
    empty.style.display = "block";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/topup-history?email=${encodeURIComponent(email)}`);
    const json = await res.json();

    if (!json.ok || !json.items.length) {
      list.innerHTML = "";
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    list.innerHTML = json.items
      .map((i) => {
        const waktu = i.created_at ? new Date(i.created_at).toLocaleString("id-ID") : "-";
        return `<li>#${i.id} • ${fmtRupiah(i.amount)} • ${i.status.toUpperCase()} • ${waktu}</li>`;
      })
      .join("");
  } catch (e) {
    list.innerHTML = "<li>Gagal load riwayat.</li>";
  }
}

async function loadTopupHistoryAdmin() {
  const list = document.getElementById("topupHistoryAdmin");
  const empty = document.getElementById("topupHistoryAdminEmpty");

  try {
    const res = await fetch(`${API_BASE}/topup-history`);
    const json = await res.json();

    if (!json.ok || !json.items.length) {
      list.innerHTML = "";
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    list.innerHTML = json.items
      .map((i) => {
        const waktu = i.created_at ? new Date(i.created_at).toLocaleString("id-ID") : "-";
        return `
          <li>
            #${i.id} • ${fmtRupiah(i.amount)} • ${i.status.toUpperCase()} • ${waktu}
          </li>`;
      })
      .join("");
  } catch (e) {
    list.innerHTML = "<li>Gagal load history admin.</li>";
  }
}

// =====================================
// AUTO RESTORE SESSION
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("xt_email");
  if (email) loadDashboard();
  else showPage("login");
});
