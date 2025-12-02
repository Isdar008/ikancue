// Sesuaikan dengan domain API kamu
const API_BASE = "https://api.rmpremium.cloud";
const SERVERS_ENDPOINT = API_BASE + "/api/web/servers";
const ORDER_ENDPOINT   = API_BASE + "/api/web/order";

const serversDiv    = document.getElementById("servers");
const serverSelect  = document.getElementById("server-select");
const protocolSelect = document.getElementById("protocol");
const pillProto     = document.getElementById("pill-proto");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const fieldPassword = document.getElementById("field-password");
const daysSelect    = document.getElementById("days");
const userIdInput   = document.getElementById("user-id");
const orderBtn      = document.getElementById("btn-order");
const resultArea    = document.getElementById("result");
const statusEl      = document.getElementById("status");

let serverList = [];

// ========= LOAD SERVER =========
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

// ========= UPDATE PROTOKOL UI =========
function updateProtocolUI() {
  const proto = protocolSelect.value;
  pillProto.textContent = "Protokol: " + proto.toUpperCase();

  // SSH butuh password
  if (proto === "ssh") {
    fieldPassword.style.display = "block";
  } else {
    fieldPassword.style.display = "none";
  }
}

protocolSelect.addEventListener("change", updateProtocolUI);

// ========= HANDLE ORDER =========
async function handleOrder() {
  statusEl.textContent = "";
  statusEl.className = "note";
  resultArea.value = "";

  const serverId = serverSelect.value;
  const username = usernameInput.value.trim();
  const days = parseInt(daysSelect.value, 10);
  const userId = parseInt(userIdInput.value, 10);
  const proto = protocolSelect.value;
  const password = passwordInput.value.trim() || "123123"; // default

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
  if (!userId) {
    statusEl.textContent = "User ID backend belum diisi.";
    statusEl.className = "error";
    return;
  }
  if (proto === "ssh" && passwordInput.value.trim().length < 3) {
    statusEl.textContent = "Password SSH minimal 3 karakter.";
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
        action: "create",
        type: proto,          // <— vmess / vless / trojan / ssh
        user_id: userId,
        server_id: Number(serverId),
        username: username,
        password: password,
        days: days
      })
    });

    const data = await res.json();

    if (!data.success) {
      statusEl.textContent =
        "Gagal: " + (data.error || "error tidak diketahui");
      statusEl.className = "error";
      resultArea.value = data.error || "";
      return;
    }

    statusEl.textContent =
      "Berhasil! Harga: Rp" +
      (data.harga || 0).toLocaleString("id-ID") +
      (data.komisi
        ? " • Komisi: Rp" + data.komisi.toLocaleString("id-ID")
        : "");
    statusEl.className = "success";
    resultArea.value = data.message || "";
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      "Gagal terhubung ke API. Cek jaringan / domain backend.";
    statusEl.className = "error";
  } finally {
    orderBtn.disabled = false;
    orderBtn.textContent = "🚀 Buat Akun Sekarang";
  }
}

orderBtn.addEventListener("click", handleOrder);

// jalankan saat halaman dibuka
updateProtocolUI();
loadServers();
