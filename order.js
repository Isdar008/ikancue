// === SESUAIKAN DOMAIN API DENGAN BACKEND ===
const API_BASE = "https://api.rmpremium.cloud";

const SERVERS_ENDPOINT    = API_BASE + "/api/web/servers";
const ORDER_QRIS_ENDPOINT = API_BASE + "/api/web/order/qris";

const serversDiv     = document.getElementById("servers");
const serverSelect   = document.getElementById("server-select");
const protocolSelect = document.getElementById("protocol");
const pillProto      = document.getElementById("pill-proto");
const pillDurasi     = document.getElementById("pill-durasi");
const usernameInput  = document.getElementById("username");
const passwordInput  = document.getElementById("password");
const fieldPassword  = document.getElementById("field-password");
const daysSelect     = document.getElementById("days");
const orderBtn       = document.getElementById("btn-order");
const resultArea     = document.getElementById("result");
const statusEl       = document.getElementById("status");

let serverList = [];

const DURASI_LABEL = {
  trial: "Trial 60 menit • Rp 0",
  15: "15 Hari • Rp 5.000",
  30: "30 Hari • Rp 8.000",
  60: "60 Hari • Rp 16.000"
};

// ========= BACA PARAM DARI URL (misal ?days=15 / ?mode=trial) =========
(function initFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const d = params.get("days");

  if (mode === "trial") {
    daysSelect.value = "trial";
  } else if (d && daysSelect) {
    const opt = Array.from(daysSelect.options).find(o => o.value === d);
    if (opt) daysSelect.value = d;
  }
})();

// ========= LOAD SERVER DARI BACKEND =========
async function loadServers() {
  try {
    const res = await fetch(SERVERS_ENDPOINT);
    const data = await res.json();

    if (!data.success) {
      serversDiv.innerHTML =
        "<p class='error'>Gagal mengambil server: " +
        (data.error || "error tidak diketahui") +
        "</p>";
      return;
    }

    serverList = data.servers || [];
    if (!serverList.length) {
      serversDiv.innerHTML =
        "<p class='muted'>Belum ada server terdaftar.</p>";
      return;
    }

    serversDiv.innerHTML = "";
    serverSelect.innerHTML = "<option value=''>Pilih server…</option>";

    serverList.forEach((s) => {
      const full = s.total_create_akun >= s.batas_create_akun;

      const card = document.createElement("div");
      card.className = "server-card";
      card.innerHTML = `
        <div class="server-name">${s.nama_server}</div>
        <div class="location">${s.lokasi || "-"}</div>
        <div class="server-meta">
          Harga / hari: <b>Rp${(s.harga || 0).toLocaleString("id-ID")}</b><br/>
          Kuota / hari: <b>${s.quota} GB</b><br/>
          IP Limit: <b>${s.iplimit}</b><br/>
          Akun terbuat: <b>${s.total_create_akun}/${s.batas_create_akun}</b>
        </div>
        <div class="server-status ${full ? "status-full" : "status-ok"}">
          ${full ? "❌ PENUH" : "✅ Tersedia"}
        </div>
      `;
      card.addEventListener("click", () => {
        serverSelect.value = s.id;
      });
      serversDiv.appendChild(card);

      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.nama_server} (${s.lokasi || "-"})`;
      serverSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    serversDiv.innerHTML =
      "<p class='error'>Gagal konek ke API server. Cek domain API / CORS.</p>";
  }
}

// ========= VALIDASI USERNAME =========
function validateUsername(u) {
  return /^[a-zA-Z0-9]{3,20}$/.test(u);
}

// ========= UPDATE UI PROTOKOL & DURASI =========
function updateProtocolUI() {
  const proto = protocolSelect.value;
  pillProto.textContent = "Protokol: " + proto.toUpperCase();
  fieldPassword.style.display = proto === "ssh" ? "block" : "none";
}

function updateDurasiUI() {
  const val = daysSelect.value;
  const label = DURASI_LABEL[val] || "";
  pillDurasi.textContent = "Durasi: " + label;
}

protocolSelect.addEventListener("change", updateProtocolUI);
daysSelect.addEventListener("change", updateDurasiUI);

// ========= HANDLE ORDER (BUAT TAGIHAN QRIS) =========
async function handleOrder() {
  statusEl.textContent = "";
  statusEl.className = "note";
  resultArea.value = "";

  const serverId = serverSelect.value;
  const username = usernameInput.value.trim();
  let daysValue = daysSelect.value;
  const proto = protocolSelect.value;
  const password = passwordInput.value.trim() || "123123";

  // user_id fix untuk web (bisa diganti ke sistem login nanti)
  const userId = 999999;

  if (!serverId) {
    statusEl.textContent = "Pilih server terlebih dahulu.";
    statusEl.className = "error";
    return;
  }
  if (!username || !validateUsername(username)) {
    statusEl.textContent =
      "Username hanya boleh huruf & angka, 3–20 karakter, tanpa spasi/simbol.";
    statusEl.className = "error";
    return;
  }

  // untuk trial kita kirim days = 1 (backend yang atur jadi 60 menit / free)
  let daysForBackend;
  if (daysValue === "trial") {
    daysForBackend = 1;
  } else {
    daysForBackend = parseInt(daysValue, 10);
  }

  if (!daysForBackend || daysForBackend <= 0) {
    statusEl.textContent = "Durasi belum dipilih.";
    statusEl.className = "error";
    return;
  }

  if (proto === "ssh" && passwordInput.value.trim().length < 3) {
    statusEl.textContent = "Password SSH minimal 3 karakter.";
    statusEl.className = "error";
    return;
  }

  orderBtn.disabled = true;
  orderBtn.textContent = "Membuat tagihan...";
  statusEl.textContent = "Membuat tagihan QRIS dari server...";
  statusEl.className = "note";

  try {
    const res = await fetch(ORDER_QRIS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        type: proto,          // vmess / vless / trojan / ssh
        user_id: userId,      // fix sementara untuk web
        server_id: Number(serverId),
        username,
        password,
        days: daysForBackend,
        // flag trial dikirim, backend boleh abaikan kalau belum dipakai
        is_trial: daysValue === "trial"
      })
    });

    const data = await res.json();

    if (!data.success) {
      statusEl.textContent = "Gagal buat tagihan: " + (data.error || "error tidak diketahui");
      statusEl.className = "error";
      return;
    }

    const payUrl = data.payment_url;

    statusEl.textContent = "✅ Tagihan berhasil dibuat. Kamu akan diarahkan ke halaman pembayaran QRIS.";
    statusEl.className = "success";

    resultArea.value =
      "Link Pembayaran QRIS:\n" +
      payUrl +
      "\n\nSetelah pembayaran berhasil, akun akan dibuat otomatis.";

    // Auto redirect ke halaman pembayaran
    window.location.href = payUrl;

  } catch (err) {
    console.error(err);
    statusEl.textContent = "Gagal terhubung ke API. Cek jaringan / domain backend.";
    statusEl.className = "error";
  } finally {
    orderBtn.disabled = false;
    orderBtn.textContent = "🚀 Buat Akun & Buat Tagihan QRIS";
  }
}

orderBtn.addEventListener("click", handleOrder);

// jalankan saat halaman dibuka
updateProtocolUI();
updateDurasiUI();
loadServers();
