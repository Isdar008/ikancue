// api/trial/ssh.js
// Proxy ke VPS:5888 /trialssh (yang route-nya lo kirim di app.js)

const API_BASE = 'http://41.216.178.185:5888';

export default async function handler(req, res) {
  // cuma izinkan GET
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ status: 'error', error: 'Method not allowed' });
  }

  // auth pakai key yang sama dengan /root/.key (disimpan di ENV Vercel)
  const auth = process.env.PANEL_AUTH_KEY;
  if (!auth) {
    return res.status(500).json({
      status: 'error',
      error: 'PANEL_AUTH_KEY belum diset di Vercel',
    });
  }

  try {
    const url = `${API_BASE}/trialssh?auth=${encodeURIComponent(auth)}`;

    const upstream = await fetch(url, {
      method: 'GET',
      // header ini opsional, kalau mau boleh dihapus
      headers: { 'Content-Type': 'application/json' },
    });

    const text = await upstream.text(); // baca mentah dulu
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      // kalau VPS ngirim HTML error dll, kirim balik apa adanya buat debug
      console.error('Gagal parse JSON dari VPS trialssh:', e, 'raw:', text);
      return res.status(500).json({
        status: 'error',
        error: 'Gagal parse JSON dari VPS',
        raw: text,
      });
    }

    // langsung terusin status & body dari VPS
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error('trial ssh proxy error:', err);
    return res.status(500).json({
      status: 'error',
      error: 'Gagal menghubungi panel trialssh',
      detail: err.message,
    });
  }
}
