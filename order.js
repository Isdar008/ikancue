// =======================
// KONFIG BACKEND
// =======================
const API_BASE          = "https://api.rmpremium.cloud";
const SERVERS_ENDPOINT  = API_BASE + "/api/web/servers";
const ORDER_ENDPOINT    = API_BASE + "/api/web/create-order";

// ambil elemen
const serversDiv      = document.getElementById("servers");
const serverSelect    = document.getElementById("server-select");
const protocolSelect  = document.getElementById("protocol");
const pillProto       = document.getElementById("pill-proto");
const pillDurasi      = document.getElementById("pill-durasi");
const usernameInput   = document.getElementById("username");
const passwordInput   = document.getElementById("password");
const fieldPassword   = document.getElementById("field-password");
const daysSelect      = document.getElementById("days");
const orderBtn        = document.getElementById("btn-order");
const resultArea      = document.getElementById("result");
const statusEl        = document.getElementById("status");

// elemen QRIS
const qrisBox  = document.getElementById("qris-box");
const qrisImg  = document.getElementById("qris-img");
const qrisMeta = document.getElementById("qris-meta");

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

    // API abang: data ada di field "data"
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

      // kartu server di kiri
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

  // reset status
  statusEl.textContent = "";
  statusEl.className = "note";
  if (resultArea) resultArea.value = "";

  // sembunyikan QR lama
  if (qrisBox) qrisBox.style.display = "none";
  if (qrisImg) qrisImg.src = "";
  if (qrisMeta) qrisMeta.textContent = "";

  const serverId = serverSelect.value;
  const username = usernameInput.value.trim();
  const proto = protocolSelect.value;
  const rawDays = daysSelect.value;
  const password = (passwordInput?.value.trim() || "123123");

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

  // Trial: untuk backend tetap kirim 1 hari (logika 60 menit di backend)
  const daysForBackend = rawDays === "trial" ? 1 : parseInt(rawDays, 10);
  if (!daysForBackend || daysForBackend <= 0) {
    statusEl.textContent = "Durasi belum dipilih.";
    statusEl.className = "error";
    return;
  }

  orderBtn.disabled = true;
  orderBtn.textContent = "Memproses...";
  statusEl.textContent = "Menghubungi server...";
  statusEl.className = "note";

  try {
    const res = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // field tambahan ini tidak mengganggu logika bot yang lama
        action: "create",
        type: proto,
        user_id: 999999,              // dummy user web
        server_id: Number(serverId),
        username,
        password,
        days: daysForBackend,
        is_trial: rawDays === "trial",

        // field yang dipakai endpoint /api/web/create-order
        protocol: proto,
        duration: rawDays             // "trial" / "15" / "30" / "60"
      })
    });

    const data = await res.json();

    if (!data.success) {
      statusEl.textContent = "Gagal: " + (data.error || data.message || "error tidak diketahui");
      statusEl.className = "error";
      if (resultArea) {
        resultArea.value = data.error || data.message || "";
      }
      return;
    }

    // SUKSES BUAT TAGIHAN
    statusEl.textContent = "Berhasil! Tagihan QRIS berhasil dibuat.";
    statusEl.className = "success";

    if (resultArea) {
      resultArea.value =
        "Link pembayaran QRIS:\n" +
        (data.qris_url || "") +
        (data.order_id ? `\n\nOrder ID: ${data.order_id}` : "");
    }

    // Generate QR dari qris_url
    if (qrisBox && qrisImg && data.qris_url) {
      const qrUrl =
        "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" +
        encodeURIComponent(data.qris_url);

      qrisImg.src = qrUrl;

      const amount = Number(data.amount || 0);
      const metaText = [
        data.order_id ? `Order ID: ${data.order_id}` : null,
        amount > 0 ? `Total: Rp ${amount.toLocaleString("id-ID")}` : "Trial (Rp 0)"
      ]
        .filter(Boolean)
        .join(" • ");

      if (qrisMeta) {
        qrisMeta.textContent = metaText;
      }

      qrisBox.style.display = "block";
    }

  } catch (err) {
    console.error(err);
    statusEl.textContent = "Gagal terhubung ke API. Cek jaringan / domain backend.";
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
