const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");

// fungsi cek apakah tombol boleh aktif
function updateButtonState() {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();

    if (email !== "" && pass !== "") {
        btnLogin.disabled = false;
        btnLogin.classList.add("active");
    } else {
        btnLogin.disabled = true;
        btnLogin.classList.remove("active");
    }
}

emailInput.addEventListener("input", updateButtonState);
passwordInput.addEventListener("input", updateButtonState);
