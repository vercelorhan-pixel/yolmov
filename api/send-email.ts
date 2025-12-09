import type { VercelRequest, VercelResponse } from '@vercel/node';

// Minimal serverless function to send transactional emails.
// If RESEND_API_KEY is not set, it will no-op and return success.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { type, toEmail, payload } = req.body || {};
    if (!toEmail || typeof toEmail !== 'string') {
      return res.status(400).json({ error: 'Invalid toEmail' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // No-op: environment not configured. Succeed silently.
      console.log('[send-email] No RESEND_API_KEY, skipping real send.', { type, toEmail, payload });
      return res.status(200).json({ ok: true, skipped: true });
    }

    // Prepare email content
    const subject = type === 'partner_submission'
      ? 'Başvurunuz Alındı - Yolmov'
      : 'Yolmov Bildirim';

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto;">
        <h2>Merhaba ${payload?.firstName || ''} ${payload?.lastName || ''},</h2>
        <p>Başvurunuz başarıyla alındı. Operasyon ekibimiz en kısa sürede inceleyecektir.</p>
        <ul>
          <li><b>Firma:</b> ${payload?.companyName || '-'}</li>
          <li><b>Sektör:</b> ${payload?.sector || '-'}</li>
          <li><b>Bölge:</b> ${payload?.city || '-'} / ${payload?.district || '-'}</li>
          <li><b>Telefon:</b> ${payload?.phone || '-'}</li>
          <li><b>Kimlik/Vergi No:</b> ${payload?.taxNumber || '-'}</li>
        </ul>
        <p>Yolmov ekibi</p>
      </div>
    `;

    // Send via Resend REST API (no dependency), keeps it self-contained
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@yolmov.app',
        to: toEmail,
        subject,
        html
      })
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('[send-email] Resend failed:', resp.status, data);
      return res.status(500).json({ error: 'Email provider error', details: data });
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (err: any) {
    console.error('[send-email] Unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}
