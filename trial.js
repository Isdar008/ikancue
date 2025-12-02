// =======================
// KONFIG BACKEND
// =======================
const API_BASE         = "https://api.rmpremium.cloud";
const SERVERS_ENDPOINT = API_BASE + "/api/web/servers";
const TRIAL_ENDPOINT   = API_BASE + "/api/web/trial";

const serversDiv    = document.getElementById("servers");
const serverSelect  = document.getElementById("server-select");
const protoNote     = document.getElementById("proto-note");
const btnTrial      = document.getElementById("btn-trial");
const statusEl      = document.getElementById("status");
const resultArea    = document.getElementById("result");

let serverList = [];
let selectedProtocol = "vmess";
let selectedServerId = null;

// =======================
// UI: pilih protokol
// =======================
function initProtoPills() {
  const pills = document.querySelectorAll(".proto-pill");
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      selectedProtocol = pill.dataset.proto || "vmess";
      if (protoNote) {
        protoNote.textContent =
          `Protokol: ${selectedProtocol.toUpperCase()} • Trial 60 menit (Rp 0)`;
      }
    });
  });
}

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

    serverList = data.data || [];

    if (!serverList.length) {
      serversDiv.innerHTML =
        "<p class='muted'>Belum ada server terdaftar.</p>";
      return;
    }

    serversDiv.innerHTML = "";
    serverSelect.innerHTML =
      "<option value=''>Pilih server dari list kiri atau biarkan kosong untuk pakai server pertama</option>";

    serverList.forEach((s, idx) => {
      const full = s.total_create_akun >= s.batas_create_akun;

      // kartu server
      const card = document.createElement("div");
      card.className = "server-card";
      card.innerHTML = `
        <div class="server-name">${s.nama_server}</div>
        <div class="location">${s.lokasi || "-"}</div>
        <div class="server-meta">
          Kuota / hari: <b>${s.quota} GB</b><br/>
          IP Limit: <b>${s.iplimit}</b><br/>
          Akun terbuat: <b>${s.total_create_akun}/${s.batas_create_akun}</b>
        </div>
        <div class="server-status ${full ? "status-full" : "status-ok"}">
          ${full ? "❌ PENUH" : "✅ Tersedia"}
        </div>
      `;

      if (!full) {
        card.addEventListener("click", () => {
          selectedServerId = s.id;
          serverSelect.value = s.id;
          highlightCard(card);
        });
      } else {
        card.style.opacity = "0.6";
        card.style.cursor = "not-allowed";
      }

      serversDiv.appendChild(card);

      const opt = document.createElement("option");
      opt.value = full ? "" : s.id;
      opt.textContent = full
        ? `${s.nama_server} (Penuh)`
        : `${s.nama_server} (${s.lokasi || "-"})`;
      serverSelect.appendChild(opt);

      // default: kalau user gak pilih apa-apa, pakai server pertama yg tidak penuh
      if (!full && selectedServerId === null) {
        selectedServerId = s.id;
        serverSelect.value = s.id;
        highlightCard(card);
      }
    });
  } catch (err) {
    console.error(err);
    serversDiv.innerHTML =
      "<p class='error'>Gagal konek ke API server. Cek domain API / CORS.</p>";
  }
}

function highlightCard(selectedCard) {
  const all = document.querySelectorAll(".server-card");
  all.forEach((c) => (c.style.borderColor = "#1f2937"));
  if (selectedCard) {
    selectedCard.style.borderColor = "#22c55e";
  }
}

// =======================
// HANDLE TRIAL
// =======================
async function handleTrial() {
  if (!btnTrial) return;

  statusEl.textContent = "";
  statusEl.className = "note";
  if (resultArea) resultArea.value = "";

  const serverId =
    selectedServerId || (serverSelect && serverSelect.value) || "";

  // server boleh kosong -> backend pakai server ON pertama
  btnTrial.disabled = true;
  btnTrial.textContent = "Memproses...";
  statusEl.textContent = "Menghubungi server untuk membuat akun trial...";
  statusEl.className = "note";

  try {
    const res = await fetch(TRIAL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        protocol: selectedProtocol,
        server_id: serverId ? Number(serverId) : undefined,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      statusEl.textContent =
        "Gagal: " + (data.message || "tidak diketahui (cek log backend)");
      statusEl.className = "error";
      if (resultArea) {
        resultArea.value = data.message || JSON.stringify(data, null, 2);
      }
      return;
    }

    statusEl.textContent = "Berhasil! Akun trial berhasil dibuat.";
    statusEl.className = "success";

    if (resultArea) {
      resultArea.value = data.text || JSON.stringify(data.account || data, null, 2);
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      "Gagal terhubung ke API. Cek jaringan / domain backend.";
    statusEl.className = "error";
  } finally {
    btnTrial.disabled = false;
    btnTrial.textContent = "🚀 Buat Akun Trial Sekarang";
  }
}

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  initProtoPills();
  loadServers();
  if (btnTrial) {
    btnTrial.addEventListener("click", handleTrial);
  }
});
