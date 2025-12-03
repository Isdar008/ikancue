// ====== CONFIG BACKEND ======
const API_BASE_URL       = "https://api.rmpremium.cloud"; // GANTI kalau beda
const PROFILE_API_URL    = API_BASE_URL + "/api/profile"; // GET
const SERVERS_API_URL    = API_BASE_URL + "/api/servers"; // GET
const TRIAL_SSH_API_URL  = API_BASE_URL + "/api/trialssh"; // POST
const ORDER_SSH_API_URL  = API_BASE_URL + "/api/order/ssh"; // POST

// ====== ELEMEN DOM ======
const welcomeText = document.getElementById("welcomeText");
const saldoText   = document.getElementById("saldoText");
const serverList  = document.getElementById("serverList");
const dashMessage = document.getElementById("dashMessage");
const btnTrial    = document.getElementById("btnTrial");
const btnOrderSSH = document.getElementById("btnOrderSSH");
const btnLogout   = document.getElementById("btnLogout");

// ====== UTIL: AMBIL TOKEN ======
function getToken() {
    return localStorage.getItem("auth_token");
}

// ====== PROTECT ROUTE: CEK LOGIN ======
function requireAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = "index.html"; // halaman login
    }
    return token;
}

// ====== FETCH DENGAN AUTH HEADER ======
async function authFetch(url, options = {}) {
    const token = requireAuth();
    const headers = options.headers || {};
    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
            ...headers
        }
    });
}

// ====== LOAD PROFILE ======
async function loadProfile() {
    try {
        const res = await authFetch(PROFILE_API_URL, { method: "GET" });
        const data = await res.json();

        if (!res.ok || data.success === false) {
            welcomeText.textContent = "Gagal memuat profil.";
            dashMessage.textContent = data.message || "";
            dashMessage.style.color = "red";
            return;
        }

        const name  = data.name || data.username || data.email || "Pengguna";
        const saldo = data.saldo || 0;

        welcomeText.textContent = "Halo, " + name;
        saldoText.textContent   = "Rp " + Number(saldo).toLocaleString("id-ID");
    } catch (err) {
        console.error(err);
        welcomeText.textContent = "Error memuat profil.";
    }
}

// ====== LOAD SERVERS ======
async function loadServers() {
    try {
        const res = await authFetch(SERVERS_API_URL, { method: "GET" });
        const data = await res.json();

        serverList.innerHTML = "";

        if (!res.ok || data.success === false) {
            const li = document.createElement("li");
            li.textContent = data.message || "Gagal memuat server.";
            serverList.appendChild(li);
            return;
        }

        const servers = data.servers || data.data || [];
        if (!servers.length) {
            const li = document.createElement("li");
            li.textContent = "Belum ada server.";
            serverList.appendChild(li);
            return;
        }

        servers.forEach(s => {
            const li = document.createElement("li");
            li.textContent = `${s.name || s.server_name} (${s.location || s.region || "-"})`;
            serverList.appendChild(li);
        });
    } catch (err) {
        console.error(err);
        serverList.innerHTML = "<li>Error memuat server.</li>";
    }
}

// ====== GENERATE TRIAL SSH ======
btnTrial.addEventListener("click", async () => {
    dashMessage.textContent = "";
    dashMessage.style.color = "#333";

    try {
        btnTrial.disabled = true;
        btnTrial.textContent = "Memproses...";

        const res = await authFetch(TRIAL_SSH_API_URL, { method: "POST" });
        const data = await res.json();

        if (!res.ok || data.success === false) {
            dashMessage.textContent = data.message || "Gagal generate trial.";
            dashMessage.style.color = "red";
        } else {
            // misal backend balikin detail akun trial
            dashMessage.textContent = data.message || "Trial SSH berhasil dibuat.";
            dashMessage.style.color = "green";
            console.log("Trial data:", data);
        }
    } catch (err) {
        console.error(err);
        dashMessage.textContent = "Terjadi kesalahan koneksi.";
        dashMessage.style.color = "red";
    } finally {
        btnTrial.disabled = false;
        btnTrial.textContent = "⚡ Generate Trial SSH";
    }
});

// ====== ORDER SSH (BELI) ======
btnOrderSSH.addEventListener("click", async () => {
    dashMessage.textContent = "";
    dashMessage.style.color = "#333";

    // contoh payload: 30 hari di server id 1
    const payload = {
        server_id: 1,
        duration_days: 30,
        type: "ssh"
    };

    try {
        btnOrderSSH.disabled = true;
        btnOrderSSH.textContent = "Memproses...";

        const res = await authFetch(ORDER_SSH_API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok || data.success === false) {
            dashMessage.textContent = data.message || "Gagal membuat pesanan.";
            dashMessage.style.color = "red";
        } else {
            dashMessage.textContent = data.message || "Pesanan SSH berhasil dibuat.";
            dashMessage.style.color = "green";
            console.log("Order data:", data);
        }
    } catch (err) {
        console.error(err);
        dashMessage.textContent = "Terjadi kesalahan koneksi.";
        dashMessage.style.color = "red";
    } finally {
        btnOrderSSH.disabled = false;
        btnOrderSSH.textContent = "💳 Beli Akun SSH";
    }
});

// ====== LOGOUT ======
btnLogout.addEventListener("click", () => {
    localStorage.removeItem("auth_token");
    // kalau mau, hapus juga user_info
    localStorage.removeItem("user_info");
    window.location.href = "index.html";
});

// ====== INIT ======
window.addEventListener("DOMContentLoaded", () => {
    requireAuth();   // cek token
    loadProfile();   // ambil profil
    loadServers();   // ambil server
});
