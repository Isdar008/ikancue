document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    const navActions = document.querySelector('.nav-actions');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            // Toggle class 'active' untuk menampilkan/menyembunyikan menu dan tombol
            mainNav.classList.toggle('active');
            navActions.classList.toggle('active');

            // Ganti ikon burger menjadi X saat menu terbuka
            if (mainNav.classList.contains('active')) {
                menuToggle.innerHTML = '✕'; // Simbol X
            } else {
                menuToggle.innerHTML = '☰'; // Simbol Burger
            }
        });
    }
});
