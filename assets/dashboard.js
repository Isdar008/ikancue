// ========== CONFIG ==========
const API_BASE = window.location.origin; // karena sudah di-redirect via vercel
document.getElementById("api-label").textContent = API_BASE;

// Ambil uid dari URL (?uid=123)
const params = new URLSearchParams(window.location.search);
const uidFromUrl = params.get("uid") || "";

// ========== DOM REF ==========
const userAvatarEl = document.getElementById("user-avatar");
const userNameEl = document.getElementById("user-name");
const userSaldoEl = document.getElementById("user-saldo");
const userRoleEl = document.getElementById("user-role");

const statOrderCountEl = document.getElementById("stat-order-count");
const statOrderSpentEl = document.getElementById("stat-order-spent");
const statTopupCountEl = document.getElementById("stat-topup-count");
const statTopupAmountEl = document.getElementById("stat-topup-amount");
const statServerCountEl = document.getElementById("stat-server-count");
const statServerAkunEl = document.getElementById("stat-server-akun");

const serversGrid = document.getElementById("servers-grid");
const serverSelect = document.getElementById("server-select");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabOverview = document.getElementById("tab-overview");
const tabCreate = document.getElementById("tab-create");
const tabComing = document.getElementById("tab-coming");

const protoButtons = document.querySelectorAll("#proto-row .proto-btn");
const fieldPassword = document.getElementById("field-password");
const userIdInput = document.getElementById("user-id");
const userIdNote = document.getElementById("user-id-note");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const daysSelect = document.getElementById("days");
const btnCreate = document.getElementById("btn-create");
const createStatusEl = document.getElementById("create-status");

const resStatusEl = document.getElementById("res-status");
const resProtoEl = document.getElementById("res-proto");
const resServerEl = document.getElementById("res-server");
const resDaysEl = document.getElementById("res-days");
const resPriceEl = document.getElementById("res-price");
const resKomisiEl = document.getElementById("res-komisi");
const resConfigEl = document.getElementById("res-config");
const btnCopyConfig = document.getElementById("btn-copy-config");

// ========== STATE ==========
let currentProto = "vmess";
let serverList = [];

// ========== HELPERS ==========
function rupiah(n) {
  const num = Number(n || 0);
  return "Rp" + num.toLocaleString("id-ID");
}

function validateUsername(u) {
  return /^[a-zA-Z0-9]{3,20}$/.test(u);
}

function setUserHeaderDemo() {
  const name = uidFromUrl ? "User " + uidFromUrl : "Demo user";
  userAvatarEl.textContent = (name[0] || "E").toUpperCase();
  userNameEl.textContent = uidFromUrl ? `${name} (${uidFromUrl})` : name;
  userSaldoEl.textContent = "Saldo: Rp0";
  userRoleEl.textContent = "Role: - • Level: -";
}

// ========== TABS ==========
function switchTab(name) {
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === name);
  });
  tabOverview.style.display = name === "overview" ? "block" : "none";
  tabCreate.style.display = name === "create" ? "block" : "none";
  tabComing.style.display = name === "coming" ? "block" : "none";
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

switchTab("overview");

// ========== PROTOCOL ==========
function setProto(proto) {
  currentProto = proto;
  protoButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.proto === proto);
  });
  fieldPassword.style.display = proto === "ssh" ? "block" : "none";
  resProtoEl.textContent = proto.toUpperCase();
}

protoButtons.forEach((btn) => {
  btn.addEventListener("click", () => setProto(btn.dataset.proto));
});
setProto("vmess");

// ========== USER ID AUTO ==========
if (uidFromUrl) {
  userIdInput.value = uidFromUrl;
  userIdInput.readOnly = true;
  userIdNote.textContent =
    "User ID dikunci dari parameter ?uid=" + uidFromUrl + " (ambil dari bot/backend).";
} else {
  setUserHeaderDemo();
}

// ========== LOAD DASHBOARD (opsional, kalau endpoint ada) ==========
async function loadDashboard() {
  if (!uidFromUrl) {
    // mode demo
    setUserHeaderDemo();
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/web/dashboard?user_id=${encodeURIComponent(uidFromUrl)}`
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "dashboard error");

    const u = data.user || {};
    const orderStats = data.orderStats || {};
    const topupStats = data.topupStats || {};
    const serverCount = data.serverCount || 0;

    const name = u.username || u.first_name || "User " + uidFromUrl;
    userAvatarEl.textContent = (name[0] || "U").toUpperCase();
    userNameEl.textContent = `${name} (${uidFromUrl})`;
    userSaldoEl.textContent = "Saldo: " + rupiah(u.saldo || 0);
    userRoleEl.textContent = `Role: ${u.role || "-"} • Level: ${
      u.reseller_level || "-"
    }`;

    statOrderCountEl.textContent = orderStats.total_order || 0;
    statOrderSpentEl.textContent = rupiah(orderStats.total_spent || 0);
    statTopupCountEl.textContent = topupStats.total_topup || 0;
    statTopupAmountEl.textContent = rupiah(topupStats.total_amount || 0);
    statServerCountEl.textContent = serverCount || 0;
    statServerAkunEl.textContent = (data.serverStats?.total_akun) || 0;
  } catch (err) {
    console.warn("Dashboard API not available, fallback demo:", err.message);
    setUserHeaderDemo();
  }
}

// ========== LOAD SERVERS ==========
async function loadServers() {
  try {
    const res = await fetch(`${API_BASE}/api/web/servers`);
    const data = await res.json();
    if (!data.success) {
      serversGrid.innerHTML =
        "<p class='note'>Gagal mengambil server: " +
        (data.error || "unknown") +
        "</p>";
      return;
    }

    serverList = data.servers || [];
    if (!serverList.length) {
      serversGrid.innerHTML =
        "<p class='note'>Belum ada server terdaftar di backend.</p>";
      return;
    }

    serversGrid.innerHTML = "";
    serverSelect.innerHTML = "<option value=''>Pilih server…</option>";

    serverList.forEach((s) => {
      const full = s.total_create_akun >= s.batas_create_akun;

      const card = document.createElement("div");
      card.className = "server-card";
      card.innerHTML = `
        <div class="server-name">${s.nama_server}</div>
        <div class="server-location">${s.lokasi || "-"}</div>
        <div class="server-meta">
          Harga / hari: <b>${rupiah(s.harga || 0)}</b><br/>
          Kuota / hari: <b>${s.quota} GB</b><br/>
          IP Limit: <b>${s.iplimit}</b><br/>
          Akun: <b>${s.total_create_akun}/${s.batas_create_akun}</b>
        </div>
        <div class="server-status ${full ? "status-full" : "status-ok"}">
          ${full ? "❌ PENUH" : "✅ Tersedia"}
        </div>
      `;
      card.addEventListener("click", () => {
        serverSelect.value = s.id;
        document
          .querySelectorAll(".server-card")
          .forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        switchTab("create");
      });
      serversGrid.appendChild(card);

      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.nama_server} (${s.lokasi || "-"})`;
      serverSelect.appendChild(opt);
    });

    // update stat server minimal
    statServerCountEl.textContent = serverList.length;
    const totalAkun = serverList.reduce(
      (sum, s) => sum + (s.total_create_akun || 0),
      0
    );
    statServerAkunEl.textContent = totalAkun;
  } catch (err) {
    console.error(err);
    serversGrid.innerHTML =
      "<p class='note error'>Gagal konek ke API server. Cek domain / CORS.</p>";
  }
}

// ========== CREATE ACCOUNT ==========
async function handleCreate() {
  createStatusEl.textContent = "";
  createStatusEl.className = "note";

  const serverId = serverSelect.value;
  const username = (usernameInput.value || "").trim();
  const userId = parseInt(userIdInput.value, 10);
  const days = parseInt(daysSelect.value, 10) || 0;
  const password = (passwordInput.value || "").trim() || "123123";

  if (!serverId) {
    createStatusEl.textContent = "Pilih server terlebih dahulu.";
    createStatusEl.className = "error";
    return;
  }
  if (!validateUsername(username)) {
    createStatusEl.textContent =
      "Username hanya huruf & angka, 3–20 karakter, tanpa spasi/simbol.";
    createStatusEl.className = "error";
    return;
  }
  if (!userId) {
    createStatusEl.textContent = "User ID backend belum diisi.";
    createStatusEl.className = "error";
    return;
  }
  if (currentProto === "ssh" && password.length < 3) {
    createStatusEl.textContent = "Password SSH minimal 3 karakter.";
    createStatusEl.className = "error";
    return;
  }

  btnCreate.disabled = true;
  btnCreate.textContent = "Memproses...";
  createStatusEl.textContent = "Menghubungi API /api/web/order...";
  createStatusEl.className = "note";

  try {
    const res = await fetch(`${API_BASE}/api/web/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        type: currentProto,
        user_id: userId,
        server_id: Number(serverId),
        username,
        password,
        days,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      createStatusEl.textContent =
        "Gagal: " + (data.error || "error tidak diketahui");
      createStatusEl.className = "error";
      resStatusEl.textContent = "Gagal";
      resConfigEl.value = data.error || "";
      return;
    }

    createStatusEl.textContent = "Berhasil membuat akun.";
    createStatusEl.className = "success";

    const server = serverList.find((s) => String(s.id) === String(serverId));

    resStatusEl.textContent = "Berhasil";
    resProtoEl.textContent = currentProto.toUpperCase();
    resServerEl.textContent = server ? server.nama_server : "-";
    resDaysEl.textContent = (data.days || days) + " hari";
    resPriceEl.textContent = rupiah(data.harga || 0);
    resKomisiEl.textContent = rupiah(data.komisi || 0);
    resConfigEl.value =
      data.message || "Config tidak dikirim oleh backend (message kosong).";
  } catch (err) {
    console.error(err);
    createStatusEl.textContent =
      "Gagal terhubung ke API. Cek jaringan / domain backend.";
    createStatusEl.className = "error";
    resStatusEl.textContent = "Error koneksi";
  } finally {
    btnCreate.disabled = false;
    btnCreate.textContent = "🚀 Buat Akun";
  }
}

btnCreate.addEventListener("click", handleCreate);

// ========== COPY CONFIG ==========
btnCopyConfig.addEventListener("click", async () => {
  const text = resConfigEl.value || "";
  if (!text.trim()) {
    alert("Belum ada config untuk disalin.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    alert("Config berhasil disalin.");
  } catch {
    alert("Gagal menyalin config. Silakan copy manual.");
  }
});

// ========== INIT ==========
loadDashboard(); // kalau endpoint belum ada, dia fallback ke demo
loadServers();
