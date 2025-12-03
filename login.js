// ====== SETTING BACKEND ======
// GANTI URL INI SESUAI BACKEND-MU
// misal: https://tun.xtrimer.cloud/api/login
const LOGIN_API_URL = "https://api.rmpremium.cloud/api/login"; // ganti kalau beda

// ambil elemen
const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMeCheckbox = document.getElementById("rememberMe");
const messageEl = document.getElementById("message");
const togglePassword = document.getElementById("togglePassword");
const btnLogin = document.getElementById("btnLogin");

// ====== AUTO FILL DARI LOCALSTORAGE ======
window.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("fake_login_data");
    if (saved) {
        try {
            const { email, password } = JSON.parse(saved);
            emailInput.value = email || "";
            passwordInput.value = password || "";
            rememberMeCheckbox.checked = true;
        } catch (e) {
            console.error("Gagal parse data login tersimpan:", e);
        }
    }
});

// ====== TOGGLE LIHAT PASSWORD ======
togglePassword.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
});

// ====== HANDLE SUBMIT FORM ======
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageEl.textContent = "";
    messageEl.style.color = "#333";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        messageEl.textContent = "Email dan password wajib diisi.";
        messageEl.style.color = "red";
        return;
    }

    // simpan kalau centang "Ingat Saya"
    if (rememberMeCheckbox.checked) {
        localStorage.setItem(
            "fake_login_data",
            JSON.stringify({ email, password })
        );
    } else {
        localStorage.removeItem("fake_login_data");
    }

    // kirim ke backend
    try {
        btnLogin.disabled = true;
        btnLogin.textContent = "Memproses...";

        const res = await fetch(LOGIN_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok || data.success === false) {
            // sesuaikan sama format response backend-mu
            messageEl.textContent = data.message || "Login gagal.";
            messageEl.style.color = "red";
        } else {
            // LOGIN BERHASIL
            messageEl.textContent = "Login berhasil!";
            messageEl.style.color = "green";

            // kalau backend kirim token, bisa disimpan:
            // localStorage.setItem("token", data.token);

            // redirect ke dashboard (ganti URL)
            window.location.href = "/dashboard.html";
        }
    } catch (err) {
        console.error(err);
        messageEl.textContent = "Terjadi kesalahan koneksi ke server.";
        messageEl.style.color = "red";
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = "Masuk";
    }
});
