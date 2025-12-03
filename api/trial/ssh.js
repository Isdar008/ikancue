const API_BASE = 'http://41.216.178.185:5888';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', error: 'Method not allowed' });
  }

  const auth = process.env.PANEL_AUTH_KEY;
  if (!auth) {
    return res.status(500).json({ status: 'error', error: 'PANEL_AUTH_KEY belum diset di Vercel' });
  }

  try {
    const url = `${API_BASE}/trialssh?auth=${encodeURIComponent(auth)}`;
    const upstream = await fetch(url);
    const data = await upstream.json().catch(() => ({}));
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('trial ssh proxy error:', err);
    res.status(500).json({ status: 'error', error: 'Gagal hubungi panel trialssh' });
  }
}
