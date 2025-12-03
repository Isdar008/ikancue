// File: api/status.js

export default async function handler(req, res) {
  try {
    const backendRes = await fetch('https://JEJE-BACKEND-LO.COM/api/status');
    const data = await backendRes.json().catch(() => ({}));
    return res.status(backendRes.status).json(data);
  } catch (err) {
    console.error('Status error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
}
