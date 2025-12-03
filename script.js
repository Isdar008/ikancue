function goLogin() {
  showPage('login');
}

function goWelcome() {
  showPage('welcome');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function doLogin() {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (email === "" || pass === "") {
    alert("Email & password tidak boleh kosong!");
    return;
  }

  // Simpan ke localStorage (sementara)
  localStorage.setItem("xt_email", email);
  localStorage.setItem("xt_pass", pass);

  loadDashboard();
}

function loadDashboard() {
  const email = localStorage.getItem("xt_email");
  const pass = localStorage.getItem("xt_pass");

  if (!email || !pass) {
    return showPage("welcome");
  }

  document.getElementById("userEmail").innerText = email;
  document.getElementById("infoEmail").innerText = email;
  document.getElementById("infoPass").innerText = pass;

  showPage("dashboard");
}

function logout() {
  localStorage.removeItem("xt_email");
  localStorage.removeItem("xt_pass");
  showPage("welcome");
}

// Auto load saat page dibuka
loadDashboard();
