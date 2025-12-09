/**
 * Transactional Email Service (Placeholder)
 * 
 * Not: Gerçek gönderim için bir e-posta sağlayıcı (Resend, SendGrid, Mailgun)
 * veya Supabase Edge Function kullanın. Bu dosya, front-end çağrısı için
 * tek bir arayüz sağlar ve şimdilik "best-effort" bir sahte gönderim yapar.
 */

export type PartnerSubmissionEmailPayload = {
  firstName: string;
  lastName: string;
  companyName: string;
  sector: string;
  city: string;
  district: string;
  phone: string;
  taxNumber: string;
};

/**
 * Başvuru alındı e-postası gönder.
 * Gerçek üretimde bir backend endpoint veya edge function çağrın.
 */
export async function sendPartnerSubmissionEmail(
  toEmail: string,
  payload: PartnerSubmissionEmailPayload
): Promise<void> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'partner_submission', toEmail, payload })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('✉️ [Email] API responded non-OK:', res.status, text);
    }
  } catch (err) {
    console.warn('✉️ [Email] API call failed; continuing silently:', err);
  }
}
