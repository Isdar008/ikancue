// File: api/webhook/pakasir.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Metode tidak diizinkan. Hanya POST yang diterima.'
    });
  }

  try {
    // Data webhook dari PakAsir
    const body = req.body || {};

    // Contoh: kirim body ini ke backend lo di VPS
    const fetchRes = await fetch('https://tun.xtrimer.cloud/api/webhook/pakasir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERCEL-PROXY': 'api.rmpremium.cloud'
      },
      body: JSON.stringify(body),
    });

    const data = await fetchRes.json().catch(() => ({}));

    return res.status(fetchRes.status).json(data);
  } catch (err) {
    console.error('Webhook PakAsir error:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan di server Vercel.',
    });
  }
}
