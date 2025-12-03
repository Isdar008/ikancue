// File: api/web/order.js (Vercel backend)

const BOT_WEB_ORDER_URL = 'http://41.216.178.185:50123/api/web/order'; // VPS bot kamu

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Only POST allowed' });
  }

  try {
    // body dari browser (index.html)
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    // forward ke VPS bot
    const forwardResp = await fetch(BOT_WEB_ORDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await forwardResp.json().catch(() => ({}));

    return res.status(forwardResp.status).json(data);
  } catch (err) {
    console.error('Error forwarding /api/web/order → VPS:', err?.message || err);
    return res.status(500).json({
      success: false,
      message: 'Server error saat memproses order.'
    });
  }
}
