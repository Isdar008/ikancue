// =======================
// KONFIG BACKEND
// =======================
const API_BASE = "https://api.rmpremium.cloud"; // domain backend kamu
const SERVERS_ENDPOINT = API_BASE + "/api/web/servers";
const ORDER_ENDPOINT   = API_BASE + "/api/web/create-order";

// ambil elemen
const serversDiv     = document.getElementById("servers");
const serverSelect   = document.getElementById("server-select");
const protocolSelect = document.getElementById("protocol");
const pillProto      = document.getElementById("pill-proto");
const pillDurasi     = document.getElementById("pill-durasi");
const usernameInput  = document.getElementById("username");
const passwordInput  = document.getElementById("password");      // sementara belum dipakai backend
const fieldPassword  = document.getElementById("field-password");
const daysSelect     = document.getElementById("days");
const orderBtn       = document.getElementById("btn-order");
const resultArea     = document.getElementById("result");
const statusEl       = document.getElementById("status");

let serverList = [];

// label durasi + harga di pill
const DURASI_LABEL = {
  trial: "Trial 60 menit • Rp 0",
  15: "15 Hari • Rp 5.000",
  30: "30 Hari • Rp 8.000",
  60: "60 Hari • Rp 16.000"
};

// =======================
// BACA PARAM DARI URL
// =======================
(function initFromQuery() {
  if (!daysSelect) return;
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const d = params.get("days");

  if (mode === "trial") {
    daysSelect.value = "trial";
  } else if (d) {
    const opt = Array.from(daysSelect.options).find(o => o.value === d);
    if (opt) daysSelect.value = d;
  }
})();

// =======================
// LOAD LIST SERVER
// =======================
async function loadServers() {
  if (!serversDiv || !serverSelect) return;

  try {
    const res = await fetch(SERVERS_ENDPOINT);
    const data = await res.json();

    if (!data.success) {
      serversDiv.innerHTML =
        "<p class='error'>Gagal mengambil server: " +
        (data.message || "error tidak diketahui") +
        "</p>";
      return;
    }

    // pakai data.data (bukan data.servers)
    serverList = data.data || [];

    if (!serverList.length) {
      serversDiv.innerHTML =
        "<p class='muted'>Belum ada server terdaftar.</p>";
      return;
    }

    // render kartu + dropdown
    serversDiv.innerHTML = "";
    serverSelect.innerHTML = "<option value=''>Pilih server dari list kiri</option>";

    serverList.forEach(s => {
      const full = s.total_create_akun >= s.batas_create_akun;

      // Kartu server di kiri
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

      // kalau tidak penuh, klik kartu = pilih di dropdown
      if (!full) {
        card.addEventListener("click", () => {
          serverSelect.value = s.id;
          highlightCard(card);
        });
      }

      serversDiv.appendChild(card);

      // option di dropdown
      const opt = document.createElement("option");
      opt.value = full ? "" : s.id;
      opt.textContent = full
        ? `${s.nama_server} (Penuh)`
        : `${s.nama_server} (${s.lokasi || "-"})`;

      serverSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    serversDiv.innerHTML =
      "<p class='error'>Gagal konek ke API server. Cek domain API / CORS.</p>";
  }
}

function highlightCard(selectedCard) {
  const all = document.querySelectorAll(".server-card");
  all.forEach(c => (c.style.borderColor = "#1f2937"));
  selectedCard.style.borderColor = "#22c55e";
}

// =======================
// UI PROTOKOL & DURASI
// =======================
function updateProtocolUI() {
  if (!protocolSelect || !pillProto) return;
  const proto = protocolSelect.value;
  pillProto.textContent = "Protokol: " + proto.toUpperCase();
  if (fieldPassword) {
    fieldPassword.style.display = proto === "ssh" ? "block" : "none";
  }
}

function updateDurasiUI() {
  if (!daysSelect || !pillDurasi) return;
  const val = daysSelect.value;
  const label = DURASI_LABEL[val] || "";
  pillDurasi.textContent = "Durasi: " + label;
}

if (protocolSelect) {
  protocolSelect.addEventListener("change", updateProtocolUI);
}
if (daysSelect) {
  daysSelect.addEventListener("change", updateDurasiUI);
}

// =======================
// VALIDASI
// =======================
function validateUsername(u) {
  return /^[a-zA-Z0-9]{3,20}$/.test(u);
}

// =======================
// HANDLE ORDER
// =======================
async function handleOrder() {
  if (!orderBtn) return;

  statusEl.textContent = "";
  statusEl.className = "note";
  resultArea.value = "";

  const serverId = serverSelect.value;
  const username = usernameInput.value.trim();
  const proto = protocolSelect.value;
  const rawDays = daysSelect.value;          // "trial" | "15" | "30" | "60"
  const password = (passwordInput?.value.trim() || "123123"); // sementara belum ke backend

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
  if (proto === "ssh" && (!passwordInput || passwordInput.value.trim().length < 3)) {
    statusEl.textContent = "Password SSH minimal 3 karakter.";
    statusEl.className = "error";
    return;
  }
  if (!rawDays) {
    statusEl.textContent = "Durasi belum dipilih.";
    statusEl.className = "error";
    return;
  }

  orderBtn.disabled = true;
  orderBtn.textContent = "Memproses...";
  statusEl.textContent = "Membuat tagihan QRIS...";
  statusEl.className = "note";

  try {
    // body HARUS sama dengan yang dibaca app.js:
    // const { protocol, server_id, username, duration } = req.body;
    const payload = {
      protocol: proto,              // vmess / vless / trojan / ssh
      server_id: Number(serverId),
      username: username,
      duration: rawDays             // "trial" / "15" / "30" / "60"
    };

    const res = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // Baca raw text DULU
    const rawText = await res.text();
    const contentType = res.headers.get("content-type") || "";

    let data = null;
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        statusEl.textContent = "Respon JSON tidak valid dari backend.";
        statusEl.className = "error";
        resultArea.value = rawText;
        return;
      }
    } else {
      // BUKAN JSON → tampilkan apa adanya (biar ketahuan error aslinya)
      statusEl.textContent = `Respon bukan JSON (status ${res.status}).`;
      statusEl.className = "error";
      resultArea.value = rawText || "(kosong)";
      return;
    }

    if (!data.success) {
      statusEl.textContent = "Gagal buat tagihan: " + (data.message || "error tidak diketahui");
      statusEl.className = "error";
      resultArea.value = data.message || rawText;
      return;
    }

    // sukses buat tagihan
    statusEl.textContent = "Berhasil! Tagihan QRIS berhasil dibuat.";
    statusEl.className = "success";

    const qrisUrl = data.qris_url || data.checkout_url || "";
    if (qrisUrl) {
      resultArea.value = "Link pembayaran QRIS:\n" + qrisUrl;
      // kalau mau langsung auto-redirect:
      // window.location.href = qrisUrl;
    } else {
      resultArea.value = rawText;
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Gagal terhubung ke API (network / CORS).";
    statusEl.className = "error";
  } finally {
    orderBtn.disabled = false;
    orderBtn.textContent = "🚀 Buat Akun & Buat Tagihan QRIS";
  }
}

if (orderBtn) {
  orderBtn.addEventListener("click", handleOrder);
}

// =======================
// INIT SAAT HALAMAN DIBUKA
// =======================
updateProtocolUI();
updateDurasiUI();
loadServers();
