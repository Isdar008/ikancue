// api/web/order.js
const VPS_BASE = 'http://41.216.178.185:50123';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    const upstream = await fetch(`${VPS_BASE}/api/web/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await upstream.json().catch(() => ({}));
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('order proxy error:', err);
    res.status(500).json({
      ok: false,
      message: 'Gagal menghubungi server utama'
    });
  }
}
