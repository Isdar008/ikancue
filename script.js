document.addEventListener('DOMContentLoaded', () => {
    /* =============================
       NAVBAR MOBILE TOGGLE
    ============================== */
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    const navActions = document.querySelector('.nav-actions');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            navActions.classList.toggle('active');

            menuToggle.innerHTML = mainNav.classList.contains('active') ? '✕' : '☰';
        });
    }

    /* =============================
       LOAD SERVER LIST (ORDER PAGE)
    ============================== */

    const serverContainer = document.getElementById('serverList'); 
    const serverDropdown = document.getElementById('serverDropdown');

    // Hanya jalan jika elemen ada (biar tidak error di halaman lain)
    if (serverContainer || serverDropdown) {
        fetchServers();
    }

    function fetchServers() {
        fetch('https://api.rmpremium.cloud/api/web/servers')
            .then(res => res.json())
            .then(json => {
                if (!json.success || !Array.isArray(json.data)) {
                    renderNoServer();
                    return;
                }

                const servers = json.data;

                if (serverContainer) renderServerCards(servers);
                if (serverDropdown) renderServerDropdown(servers);
            })
            .catch(err => {
                console.log("Error ambil server:", err);
                renderNoServer();
            });
    }

    /* =============================
       RENDER SERVER DI KIRI (CARD)
    ============================== */
    function renderServerCards(servers) {
        serverContainer.innerHTML = "";

        if (servers.length === 0) {
            serverContainer.innerHTML = `<p>Belum ada server terdaftar.</p>`;
            return;
        }

        servers.forEach(srv => {
            const card = document.createElement('div');
            card.className = "server-card";
            const penuh = srv.total_create_akun >= srv.batas_create_akun;

            card.innerHTML = `
                <div class="server-name">${srv.nama_server}</div>
                <div class="location">${srv.lokasi}</div>
                <div class="server-meta">
                    Harga/hari: Rp${srv.harga}<br>
                    Kuota: ${srv.quota} GB<br>
                    IP Limit: ${srv.iplimit}
                </div>
                <div class="server-status ${penuh ? 'status-full' : 'status-ok'}">
                    ${penuh ? "✖ Penuh" : "✔ Tersedia"}
                </div>
            `;

            // Klik kartu → auto pilih server di dropdown
            if (!penuh && serverDropdown) {
                card.addEventListener('click', () => {
                    serverDropdown.value = srv.id;
                    highlightCard(card);
                });
            }

            serverContainer.appendChild(card);
        });
    }

    function highlightCard(card) {
        const all = document.querySelectorAll('.server-card');
        all.forEach(c => c.style.borderColor = "#1f2937");
        card.style.borderColor = "#22c55e";
    }

    /* =============================
       RENDER DROPDOWN SERVER
    ============================== */
    function renderServerDropdown(servers) {
        serverDropdown.innerHTML = `<option value="">Pilih server dari list kiri</option>`;

        servers.forEach(srv => {
            const penuh = srv.total_create_akun >= srv.batas_create_akun;
            const opt = document.createElement('option');
            opt.value = penuh ? "" : srv.id;
            opt.textContent = penuh
                ? `${srv.nama_server} (Penuh)`
                : `${srv.nama_server} (${srv.lokasi})`;

            serverDropdown.appendChild(opt);
        });
    }

    /* =============================
       FALLBACK
    ============================== */
    function renderNoServer() {
        if (serverContainer)
            serverContainer.innerHTML = `<p>Gagal konek ke API server.</p>`;
    }
});
