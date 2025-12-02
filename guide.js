document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('.accordion-header');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = header.nextElementSibling;
            
            // Toggle status buka/tutup pada item yang diklik
            item.classList.toggle('open');
            content.classList.toggle('active');
            
            // Mengatur tinggi konten untuk animasi collapse
            if (content.classList.contains('active')) {
                // Set max-height ke scrollHeight untuk animasi
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                // Tutup
                content.style.maxHeight = "0";
            }

            // Opsional: Tutup item lain saat satu item dibuka (Uncomment jika ingin hanya satu yang terbuka)
            // headers.forEach(otherHeader => {
            //     if (otherHeader !== header) {
            //         const otherItem = otherHeader.parentElement;
            //         const otherContent = otherHeader.nextElementSibling;
            //         otherItem.classList.remove('open');
            //         otherContent.classList.remove('active');
            //         otherContent.style.maxHeight = "0";
            //     }
            // });

        });
    });
});
