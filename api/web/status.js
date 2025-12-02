// api/web/status.js
const VPS_BASE = 'http://41.216.178.185:50123';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    const upstream = await fetch(`${VPS_BASE}/api/web/status`);
    const data = await upstream.json().catch(() => ({}));
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('status proxy error:', err);
    res.status(500).json({
      ok: false,
      message: 'Gagal menghubungi server utama'
    });
  }
}
