// =====================================
// CONFIG
// =====================================
const API_BASE = "/api/web"; // karena panel di domain yang sama
// email yang dianggap admin panel
const ADMIN_EMAILS = [
  "istiqwamantunnel@gmail.com",   // ganti / tambah sesuai kebutuhan
  // "admin2@gmail.com",
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

  // kalau ke halaman login, pastikan mode login normal
  if (id === "login") {
    showResetStep(0);
  }
}

// =====================================
// RESET PASSWORD MODE (0=login normal, 1=step1, 2=step2)
// =====================================
function showResetStep(step) {
  const boxLogin = document.getElementById("loginBox");
  const s1 = document.getElementById("resetStep1");
  const s2 = document.getElementById("resetStep2");

  if (!boxLogin || !s1 || !s2) return;

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

// ----- Load Status Dari API (PER EMAIL) -----
async function loadStatusFromApi() {
  try {
    const email = localStorage.getItem("xt_email") || "";

    if (!email) {
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

  if (!selCreate || !selRenew) return;

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
// ADMIN: TAMBAH SALDO MANUAL (EMAIL WEB)
// =====================================
const btnAdminAddSaldo = document.getElementById("btnAdminAddSaldo");
if (btnAdminAddSaldo) {
  btnAdminAddSaldo.onclick = async (ev) => {
    const btn = ev.currentTarget;

    const adminEmail = (localStorage.getItem("xt_email") || "").trim().toLowerCase();
    const isAdmin = localStorage.getItem("xt_is_admin") === "1";

    const targetEmail = (document.getElementById("adminTargetUser").value || "")
      .trim()
      .toLowerCase();
    const amount = parseInt(document.getElementById("adminAmount").value, 10) || 0;
    const note = (document.getElementById("adminNote").value || "").trim();

    if (!adminEmail || !isAdmin) {
      alert("Hanya admin yang boleh menggunakan fitur ini.");
      return;
    }

    if (!targetEmail || !amount || amount <= 0) {
      alert("Email user & nominal wajib diisi dengan benar.");
      return;
    }

    if (!confirm(`Tambah saldo ${fmtRupiah(amount)} ke ${targetEmail}?`)) {
      return;
    }

    lockButton(btn, true);
    try {
      const res = await fetch(`${API_BASE}/admin/add-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          targetEmail,
          amount,
          note,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menambah saldo.");
      }

      alert(`Saldo ${fmtRupiah(amount)} berhasil ditambahkan ke ${targetEmail}.`);
      loadTopupHistoryAdmin();
    } catch (e) {
      alert(e.message || "Gagal menambah saldo.");
    } finally {
      lockButton(btn, false);
    }
  };
}

// =====================================
// LOGIN SYSTEM
// =====================================
function loadDashboard() {
  const email = localStorage.getItem("xt_email");
  const pass = localStorage.getItem("xt_pass");

  // kalau belum login → langsung ke halaman login
  if (!email || !pass) {
    showPage("login");
    return;
  }

  // header (ini pasti ada)
  const headerEmail = document.getElementById("userEmailHeader");
  if (headerEmail) headerEmail.innerText = email;

  // box Informasi Login sudah dihapus dari HTML,
  // jadi cek dulu, kalau elemennya nggak ada ya di-skip
  const infoEmailEl = document.getElementById("infoEmail");
  if (infoEmailEl) infoEmailEl.innerText = email;

  const infoPassEl = document.getElementById("infoPass");
  if (infoPassEl) infoPassEl.innerText = pass;

  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  localStorage.setItem("xt_is_admin", isAdmin ? "1" : "0");

  const navAdmin = document.getElementById("navAdmin");
  if (navAdmin) navAdmin.style.display = isAdmin ? "inline-flex" : "none";

  showPage("dashboard");
  openAppPage("overview");

  loadStatusFromApi();
  loadServersFromApi();
}

// tombol back (sebenarnya di panel.html disembunyikan, tapi aman)
const btnBack = document.getElementById("btnBack");
if (btnBack) btnBack.onclick = () => showPage("login");

// login normal
const btnLogin = document.getElementById("btnLogin");
if (btnLogin) {
  btnLogin.addEventListener("click", async (ev) => {
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
}

// logout
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.onclick = () => {
    localStorage.removeItem("xt_email");
    localStorage.removeItem("xt_pass");
    showPage("login"); // ✅ balik ke form login (bukan welcome)
  };
}

// =====================================
// RESET PASSWORD (FRONTEND)
// =====================================

// Lupa password → masuk step1
const btnForgot = document.getElementById("btnForgot");
if (btnForgot) {
  btnForgot.onclick = () => {
    const email = document.getElementById("email").value.trim();
    const resetEmailInput = document.getElementById("resetEmail");
    if (email && resetEmailInput) resetEmailInput.value = email;
    showResetStep(1);
  };
}

// Kembali ke login dari step1 / step2
const btnResetBack1 = document.getElementById("btnResetBack1");
if (btnResetBack1) {
  btnResetBack1.onclick = () => showResetStep(0);
}
const btnResetBack2 = document.getElementById("btnResetBack2");
if (btnResetBack2) {
  btnResetBack2.onclick = () => showResetStep(0);
}

// Kirim kode ke email
const btnSendReset = document.getElementById("btnSendReset");
if (btnSendReset) {
  btnSendReset.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    const email = document.getElementById("resetEmail").value.trim();
    if (!email) {
      alert("Email tidak boleh kosong.");
      return;
    }

    lockButton(btn, true);
    try {
      const res = await fetch(`${API_BASE}/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal mengirim kode reset.");
      }

      alert("Kode reset sudah dikirim ke email kamu.");
      showResetStep(2);
    } catch (e) {
      alert(e.message || "Gagal mengirim kode reset.");
    } finally {
      lockButton(btn, false);
    }
  });
}

// Konfirmasi reset password
const btnDoReset = document.getElementById("btnDoReset");
if (btnDoReset) {
  btnDoReset.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    const email = document.getElementById("resetEmail").value.trim();
    const code = document.getElementById("resetCode").value.trim();
    const newPass = document.getElementById("resetNewPass").value.trim();

    if (!email || !code || !newPass) {
      alert("Email, kode, dan password baru wajib diisi.");
      return;
    }

    lockButton(btn, true);
    try {
      const res = await fetch(`${API_BASE}/confirm-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: newPass }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal reset password.");
      }

      alert("Password berhasil direset. Silakan login dengan password baru.");
      document.getElementById("email").value = email;
      document.getElementById("password").value = newPass;
      showResetStep(0);
    } catch (e) {
      alert(e.message || "Gagal reset password.");
    } finally {
      lockButton(btn, false);
    }
  });
}

// =====================================
// NAVIGATION (Overview/Server/Buat/Renew/Topup)
// =====================================
function openAppPage(name) {
  document.querySelectorAll(".app-page").forEach(p => p.classList.remove("active"));
  document.getElementById("app-" + name).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.nav-btn[data-target="${name}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  // kalau di HP dan nav lagi kebuka → tutup setelah pilih menu
  const nav = document.querySelector(".app-nav");
  if (nav) nav.classList.remove("open");

  if (name === "topup") {
    loadTopupHistory();
  } else if (name === "admin") {
    loadTopupHistoryAdmin();
  }
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.onclick = () => openAppPage(btn.dataset.target);
});

// ====== TOGGLE HAMBURGER NAV (MOBILE) ======
const btnToggleNav = document.getElementById("btnToggleNav");
if (btnToggleNav) {
  btnToggleNav.onclick = () => {
    const nav = document.querySelector(".app-nav");
    if (nav) nav.classList.toggle("open");
  };
}

// =====================================
// MODAL HASIL (CREATE / RENEW)
// =====================================
function showResultModal(title, subtitle, rawMsg, accType) {
  const overlay = document.getElementById("resultModal");
  const titleEl = document.getElementById("modalTitle");
  const subEl = document.getElementById("modalSubtitle");
  const bodyEl = document.getElementById("modalBody");
  const pillEl = document.getElementById("modalTypePill");
  const successTextEl = document.getElementById("modalSuccessText");

  if (!overlay || !titleEl || !bodyEl) {
    alert(rawMsg || "Berhasil.");
    return;
  }

  // simpan untuk fitur copy
  lastModalMessage = rawMsg || "";
  lastModalType = (accType || "").toLowerCase();

  titleEl.textContent = title || "";
  subEl.textContent = subtitle || "";
  bodyEl.innerHTML = rawMsg || "";

  // update pill type (SSH / VMESS / VLESS / TROJAN)
  if (pillEl && accType) {
    const upper = accType.toUpperCase();
    pillEl.textContent =
      upper === "SSH" ? "SSH PREMIUM" : `${upper} PREMIUM`;
  }

  // teks success menyesuaikan tipe
  if (successTextEl && accType) {
    const upper = accType.toUpperCase();
    successTextEl.textContent =
      upper === "SSH"
        ? "Akun SSH kamu berhasil dibuat dan siap dipakai."
        : `Akun ${upper} kamu berhasil dibuat dan siap dipakai.`;
  }

  overlay.classList.add("show");
}

// tombol tutup
const modalClose = document.getElementById("modalClose");
if (modalClose) {
  modalClose.onclick = () => {
    const overlay = document.getElementById("resultModal");
    if (overlay) overlay.classList.remove("show");
  };
}

// =========================
// COPY: SALIN SEMUA & DETAIL
// =========================

// "Salin Semua" -> ambil semua teks di dalam modalBody
const modalCopy = document.getElementById("modalCopy");
if (modalCopy) {
  modalCopy.onclick = async () => {
    const bodyEl = document.getElementById("modalBody");
    if (!bodyEl) return;

    const text = (bodyEl.innerText || "").trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      alert("Semua config berhasil disalin ✅");
    } catch (e) {
      const range = document.createRange();
      range.selectNodeContents(bodyEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      alert("Teks sudah diselect, tekan Salin di perangkat kamu.");
    }
  };
}

// "Salin Detail Akun" -> hanya Server/User/Pass/UUID + link-link utama
const modalCopyMain = document.getElementById("modalCopyMain");
if (modalCopyMain) {
  modalCopyMain.onclick = async () => {
    const bodyEl = document.getElementById("modalBody");
    if (!bodyEl) return;

    const mainBox = bodyEl.querySelector(".mini-box");       // box pertama (server, user, dll)
    const linkEls = bodyEl.querySelectorAll(".scroll-x");    // semua baris link (tls/nontls/grpc/dll)

    let parts = [];

    if (mainBox) {
      parts.push(mainBox.innerText.trim());
    }

    if (linkEls.length) {
      const linksText = Array.from(linkEls)
        .map((el) => {
          const label =
            el.parentElement?.querySelector("strong")?.innerText || "";
          const linkText = el.innerText.trim();
          return label ? `${label}\n${linkText}` : linkText;
        })
        .join("\n\n");

      parts.push(linksText);
    }

    const text = parts.join("\n\n").trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      alert("Detail akun berhasil disalin ✅");
    } catch (e) {
      window.prompt("Salin detail akun secara manual:", text);
    }
  };
}
// ====== SERVICE CARD CTA → buka tab Buat Akun & set jenis ======
document.querySelectorAll(".service-cta").forEach((btn) => {
  btn.addEventListener("click", () => {
    const t = btn.dataset.createType || "ssh";

    // pindah ke tab Buat Akun
    openAppPage("create");

    // set select jenis akun
    const sel = document.getElementById("createType");
    if (sel) {
      sel.value = t;
      // kalau punya fungsi hide password ssh, panggil lagi
      if (typeof updatePasswordVisibility === "function") {
        updatePasswordVisibility();
      }
    }
  });
});
// ====== SERVICE CARD CTA RENEW → buka tab Perpanjang & set jenis ======
document.querySelectorAll(".service-cta-renew").forEach((btn) => {
  btn.addEventListener("click", () => {
    const t = btn.dataset.renewType || "ssh";

    // pindah ke tab Perpanjang
    openAppPage("renew");

    // set select jenis akun di form renew
    const sel = document.getElementById("renewType");
    if (sel) {
      sel.value = t;
    }
  });
});
// ============================
// HIDE PASSWORD UNTUK NON-SSH
// ============================
const typeSelect = document.getElementById("createType");
const passwordFieldWrap = document.getElementById("createPassWrap");

function updatePasswordVisibility() {
  if (!typeSelect || !passwordFieldWrap) return;

  const t = typeSelect.value.toLowerCase();
  if (t === "ssh") {
    passwordFieldWrap.style.display = "block";
  } else {
    passwordFieldWrap.style.display = "none";
  }
}

// load pertama
updatePasswordVisibility();

// ketika user ganti jenis akun
if (typeSelect) {
  typeSelect.addEventListener("change", updatePasswordVisibility);
}

// =====================================
// FORM: BUAT AKUN
// =====================================
const btnCreate = document.getElementById("btnCreate");
if (btnCreate) {
  btnCreate.onclick = async (ev) => {
    const btn = ev.target;
    const type = document.getElementById("createType").value;
    const serverId = parseInt(document.getElementById("createServer").value);
    const username = document.getElementById("createUser").value.trim();
    const password = document.getElementById("createPass")
      ? document.getElementById("createPass").value.trim()
      : "";
    const days = parseInt(document.getElementById("createDays").value);
    const email = localStorage.getItem("xt_email") || "";

    if (!serverId || !username || !days)
      return alert("Lengkapi semua form!");

    if (type === "ssh" && !password) {
      return alert("Password SSH wajib diisi untuk akun SSH.");
    }

    lockButton(btn, true);

    try {
      const res = await fetch(`${API_BASE}/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type,
          serverId,
          username,
          days,
          password,
        }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      showResultModal(
  "Akun berhasil dibuat",
  `Server: ${json.data.serverName} • Harga: ${fmtRupiah(json.data.totalHarga)}`,
  json.data.message,
  type   // << kirim jenis akun (ssh/vmess/vless/trojan)
);

      loadStatusFromApi();
    } catch (e) {
      alert("Gagal membuat akun: " + e.message);
    }

    lockButton(btn, false);
  };
}

// =====================================
// FORM: RENEW AKUN
// =====================================
const btnRenew = document.getElementById("btnRenew");
if (btnRenew) {
  btnRenew.onclick = async (ev) => {
    const btn = ev.target;
    const type = document.getElementById("renewType").value;
    const serverId = parseInt(document.getElementById("renewServer").value);
    const username = document.getElementById("renewUser").value.trim();
    const days = parseInt(document.getElementById("renewDays").value);

    const email = localStorage.getItem("xt_email") || "";

    if (!serverId || !username || !days || !email)
      return alert("Lengkapi semua form & pastikan kamu sudah login.");

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
  type   // kirim jenis akun juga
);

      loadStatusFromApi();
    } catch (e) {
      alert("Gagal perpanjang akun: " + (e.message || "Error tidak diketahui"));
    }

    lockButton(btn, false);
  };
}

// =====================================
// TOPUP: FORM + HISTORY + QRIS
// =====================================
const btnTopup = document.getElementById("btnTopup");
if (btnTopup) {
  btnTopup.onclick = async (ev) => {
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

      const data = json.data || {};

      const card = document.getElementById("topupPaymentCard");
      const img = document.getElementById("qrisImage");
      const infoEl = document.getElementById("paymentInfo");
      const linkEl = document.getElementById("paymentLink");

      if (card && img && infoEl && linkEl) {
        infoEl.textContent = `Invoice: ${data.orderId || "-"} • Nominal: ${fmtRupiah(
          data.amount || amount
        )}`;

        const qrUrl =
          data.qrImageBase64 ||
          data.qrImageUrl ||
          data.qrisImageUrl ||
          data.qr_url ||
          data.qris_image ||
          data.qrisImage ||
          data.qrImage ||
          "";

        if (qrUrl) {
          img.src = qrUrl;
          img.style.display = "block";
        } else {
          img.style.display = "none";
        }

        if (data.paymentUrl) {
          linkEl.href = data.paymentUrl;
          linkEl.style.display = "inline-block";
        } else {
          linkEl.style.display = "none";
        }

        card.style.display = "block";
      }

      loadTopupHistory();
    } catch (e) {
      alert("Gagal request topup: " + e.message);
    }

    lockButton(btn, false);
  };
}

// -- load riwayat topup
async function loadTopupHistory() {
  const email = localStorage.getItem("xt_email");
  const list = document.getElementById("topupHistory");
  const empty = document.getElementById("topupHistoryEmpty");

  if (!list || !empty) return;

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

async function loadTopupHistoryAdmin() {
  const list = document.getElementById("topupHistoryAdmin");
  const empty = document.getElementById("topupHistoryAdminEmpty");
  if (!list || !empty) return;

  list.innerHTML = "<li>Memuat...</li>";
  empty.style.display = "none";

  try {
    const res = await fetch(`${API_BASE}/topup-history`);
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
        const statusText = (item.status || "-").toString().toUpperCase();
        const refText = item.reference ? ` • Ref: ${item.reference}` : "";
        const methodText = item.method ? ` • ${item.method}` : "";

        return `
          <li>
            #${item.id || "-"} • ${fmtRupiah(item.amount)} • ${statusText}${refText}${methodText} • ${waktu}
          </li>
        `;
      })
      .join("");
  } catch (e) {
    console.warn("Gagal load history admin:", e);
    list.innerHTML = "<li>Gagal memuat riwayat.</li>";
    empty.style.display = "none";
  }
}

// =====================================
// START PANEL
// =====================================
loadDashboard();
