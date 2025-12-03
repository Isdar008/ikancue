// main.js - UI logic (tanpa menampilkan harga)
const API_ROOT = '/api'; // tetap siap untuk integrasi nanti

function el(q){ return document.querySelector(q) }
function qAll(q){ return Array.from(document.querySelectorAll(q)) }

document.addEventListener('DOMContentLoaded', init);

function safeFetch(path, opts){
  const url = path.startsWith('http') ? path : (API_ROOT + path);
  return fetch(url, opts).then(async r => {
    if (!r.ok) {
      const txt = await r.text().catch(()=>null);
      throw new Error(`HTTP ${r.status} ${txt||''}`);
    }
    return r.json();
  });
}

async function init(){
  el('#year').textContent = new Date().getFullYear();

  // mobile menu
  el('#menuToggle').addEventListener('click', toggleMobileNav);

  el('#exploreBtn').addEventListener('click', ()=> location.hash = '#services');

  // load services (no price)
  await loadServices();

  // contact form handler (placeholder)
  el('#contactSend').addEventListener('click', async (e) => {
    e.preventDefault();
    const name = el('#c_name').value.trim();
    const email = el('#c_email').value.trim();
    const msg = el('#c_msg').value.trim();
    if(!name || !email || !msg){ alert('Lengkapi semua field'); return; }

    // simple UX: simulate send
    el('#contactSend').disabled = true;
    el('#contactSend').textContent = 'Mengirim...';
    await new Promise(r=>setTimeout(r,700));
    alert('Pesan terkirim. Kami akan menghubungi via email.');
    el('#c_name').value = el('#c_email').value = el('#c_msg').value = '';
    el('#contactSend').disabled = false;
    el('#contactSend').textContent = 'Kirim Pesan';
  });

  // checkout modal close
  el('#closeCheckout').addEventListener('click', ()=> toggleCheckout(false));
}

function toggleMobileNav(){
  const nav = el('#mainNav');
  if (getComputedStyle(nav).display === 'none') {
    nav.style.display = 'flex';
    nav.style.flexDirection = 'column';
    nav.style.position = 'absolute';
    nav.style.right = '16px';
    nav.style.top = '64px';
    nav.style.background = 'rgba(4,56,97,0.95)';
    nav.style.padding = '8px';
    nav.style.borderRadius = '8px';
  } else {
    nav.style.display = 'none';
  }
}

async function loadServices(){
  const container = el('#servicesGrid');
  container.innerHTML = '<div class="small muted">Memuat layanan...</div>';
  try {
    // cobalah ambil list server langsung dari backend jika tersedia:
    const servers = await safeFetch('/services').catch(()=>null);

    let list;
    if (Array.isArray(servers) && servers.length) {
      list = servers.map(s => ({
        id: s.id,
        name: s.protocol || s.nama_server || `Server ${s.id}`,
        domain: s.domain || ''
      }));
    } else {
      // fallback static (tanpa harga)
      list = [
        { id: 1, name: 'SSH', domain: 'ssh.example.com' },
        { id: 2, name: 'VMESS', domain: 'vmess.example.com' },
        { id: 3, name: 'VLESS', domain: 'vless.example.com' },
        { id: 4, name: 'TROJAN', domain: 'trojan.example.com' }
      ];
    }

    container.innerHTML = '';
    list.forEach(s => {
      const div = document.createElement('div');
      div.className = 'service-card';
      div.innerHTML = `
        <h4>${s.name}</h4>
        <p class="small muted">Server: ${s.domain || 'Global'}</p>
        <div class="service-meta">
          <span class="small muted">Detail koneksi akan diberikan setelah pembayaran</span>
          <div>
            <button class="btn" data-id="${s.id}" data-proto="${s.name}">Detail</button>
            <button class="btn primary buy-btn" data-id="${s.id}" data-proto="${s.name}">Beli</button>
          </div>
        </div>
      `;
      container.appendChild(div);
    });

    qAll('.buy-btn').forEach(b => b.addEventListener('click', (ev) => {
      const id = ev.currentTarget.dataset.id;
      const proto = ev.currentTarget.dataset.proto;
      openCheckout({ id, proto });
    }));
  } catch (err) {
    container.innerHTML = `<div class="small muted">Gagal memuat layanan: ${err.message}</div>`;
  }
}

function toggleCheckout(show = true){
  const modal = el('#checkoutModal');
  if (show) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  } else {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    el('#checkoutBody').innerHTML = '';
  }
}

function openCheckout(service){
  toggleCheckout(true);
  const body = el('#checkoutBody');
  body.innerHTML = `
    <p class="small muted">Membeli: <strong>${service.proto}</strong> (Server ID: ${service.id})</p>
    <label>Durasi (hari) <input id="co_days" type="number" min="1" value="1"></label>
    <label>Telegram User ID (opsional) <input id="co_tgid" placeholder="Contoh: 123456789"></label>
    <div style="margin-top:10px;display:flex;gap:8px">
      <button id="co_buy" class="btn primary">Beli & Bayar</button>
      <button id="co_cancel" class="btn">Batal</button>
    </div>
    <div id="co_feedback" style="margin-top:12px"></div>
  `;

  el('#co_cancel').addEventListener('click', ()=> toggleCheckout(false));
  el('#co_buy').addEventListener('click', async ()=>{
    const days = Number(el('#co_days').value) || 1;
    const tgid = el('#co_tgid').value.trim() || null;

    const payload = {
      service: service.proto.toLowerCase(),
      server_id: Number(service.id),
      days,
      buyer_id: tgid
    };

    const feedback = el('#co_feedback');
    feedback.textContent = 'Membuat order...';

    // NOTE: endpoint create-order akan dihubungkan nanti.
    // Untuk sekarang kita hanya simulasi UX tanpa memanggil API.
    await new Promise(r => setTimeout(r, 800));
    feedback.innerHTML = `<div class="small">Order simulasi berhasil. (Integrasi pembayaran menyusul)</div>`;
  });
}
