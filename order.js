document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    const packageSummary = document.getElementById('packageSummary');
    const packageIdInput = document.getElementById('packageId');
    const messageBox = document.getElementById('message');
    const paymentResult = document.getElementById('paymentResult');
    const invoiceDetails = document.getElementById('invoiceDetails');
    const submitText = document.getElementById('submitText');
    const spinner = document.getElementById('spinner');

    // --- KONFIGURASI API ---
    const API_PACKAGES_ENDPOINT = '/api/packages'; // Untuk ambil data paket
    const API_ORDER_ENDPOINT = '/api/order';       // Endpoint untuk kirim pesanan
    
    // Fungsi utilitas (Ambil dari pricing.js agar tidak perlu load 2x)
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    // Fungsi untuk mendapatkan ID paket dari URL (?package=...)
    const getPackageIdFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('package');
    };

    // --- 1. MEMUAT DETAIL PAKET ---
    const loadPackageDetails = async (packageId) => {
        if (!packageId) {
            packageSummary.innerHTML = `<p style="color: red;">❌ ERROR: Paket tidak dipilih. Silakan kembali ke <a href="pricing.html">Halaman Harga</a>.</p>`;
            return null;
        }

        try {
            const response = await fetch(API_PACKAGES_ENDPOINT);
            if (!response.ok) throw new Error('Gagal mengambil daftar paket dari server.');
            
            const packages = await response.json();
            const selectedPackage = packages.find(pkg => pkg.id === packageId);

            if (selectedPackage) {
                // Tampilkan ringkasan paket
                packageSummary.innerHTML = `
                    <h4>Ringkasan Pesanan</h4>
                    <p>Paket: <strong>${selectedPackage.name}</strong></p>
                    <p>Harga: <strong>${formatRupiah(selectedPackage.price)}</strong> / ${selectedPackage.duration || '30 Hari'}</p>
                `;
                packageIdInput.value = selectedPackage.id; // Set hidden input
                return selectedPackage;
            } else {
                packageSummary.innerHTML = `<p style="color: red;">❌ ERROR: Paket ID "${packageId}" tidak ditemukan.</p>`;
                return null;
            }

        } catch (error) {
            console.error('Error loading package details:', error);
            packageSummary.innerHTML = `<p style="color: red;">❌ Gagal memuat data paket. Cek koneksi API Anda.</p>`;
            return null;
        }
    };
    
    // Panggil saat halaman dimuat
    const packageId = getPackageIdFromUrl();
    loadPackageDetails(packageId);


    // --- 2. SUBMIT FORMULIR PEMESANAN ---
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Sembunyikan pesan sebelumnya
        messageBox.style.display = 'none';
        paymentResult.style.display = 'none';

        // Tampilkan loading spinner
        submitText.style.display = 'none';
        spinner.style.display = 'inline-block';
        orderForm.querySelector('button[type="submit"]').disabled = true;

        const username = document.getElementById('username').value;
        const contact = document.getElementById('contact').value;
        const packageId = document.getElementById('packageId').value;
        
        // Data yang akan dikirim ke backend (sesuaikan dengan kebutuhan API Anda)
        const orderData = {
            package_id: packageId,
            username: username,
            contact: contact,
        };

        try {
            const response = await fetch(API_ORDER_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();

            // Cek status respons dari backend (misalnya status 200 OK)
            if (response.ok) {
                // Berhasil membuat pesanan
                
                // Pastikan result memiliki data yang dibutuhkan (misalnya invoice, QRIS, total, dll.)
                if (result.invoice_id && result.total_amount) {
                    
                    // Sembunyikan form dan tampilkan hasil pembayaran
                    orderForm.style.display = 'none';
                    paymentResult.style.display = 'block';

                    // Tampilkan detail invoice dan QRIS (asumsi backend memberikan URL QR)
                    invoiceDetails.innerHTML = `
                        <p>Invoice ID: <strong>${result.invoice_id}</strong></p>
                        <p>Total Bayar: <span style="font-size: 1.5rem; color: #cc0000; font-weight: 700;">${formatRupiah(result.total_amount)}</span></p>
                        <p>Batas Pembayaran: <strong>${result.expiry_time || '30 Menit'}</strong></p>
                        
                        ${result.qris_url ? `
                            <p>Scan QRIS di bawah ini:</p>
                            <img src="${result.qris_url}" alt="QRIS Code">
                        ` : '<p>Silakan transfer ke rekening yang tertera (Cek WA/Kontak).</p>'}
                        
                        <a href="login.html?invoice=${result.invoice_id}" class="btn btn-primary btn-large" style="margin-top: 20px;">Cek Status Pembayaran</a>
                    `;

                } else {
                    // Berhasil, tapi format respons tidak sesuai
                    messageBox.className = 'message-box error';
                    messageBox.innerHTML = `✅ Pesanan berhasil dibuat, tapi detail invoice tidak lengkap. Cek WA/Kontak Anda.`;
                    messageBox.style.display = 'block';
                }

            } else {
                // Gagal membuat pesanan (Error dari server, misalnya username sudah dipakai)
                messageBox.className = 'message-box error';
                messageBox.innerHTML = `❌ Gagal memproses pesanan: ${result.message || 'Terjadi kesalahan pada server.'}`;
                messageBox.style.display = 'block';
            }

        } catch (error) {
            // Gagal koneksi ke API
            console.error('Submission Error:', error);
            messageBox.className = 'message-box error';
            messageBox.innerHTML = `❌ Gagal terhubung ke server API. Cek koneksi internet Anda atau hubungi admin.`;
            messageBox.style.display = 'block';
        } finally {
            // Sembunyikan loading spinner
            submitText.style.display = 'inline';
            spinner.style.display = 'none';
            orderForm.querySelector('button[type="submit"]').disabled = false;
        }
    });

});
