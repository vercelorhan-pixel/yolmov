import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const { email, password, firstName, lastName } = req.body || {};
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      // No service role available; let client fallback handle it
      return res.status(200).json({ ok: true, skipped: true });
    }

    // 1) Create auth user via admin API
    const createUserResp = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { user_type: 'admin', first_name: firstName, last_name: lastName }
      })
    });
    const userData = await createUserResp.json().catch(() => ({}));
    if (!createUserResp.ok) {
      // If already exists, try to fetch by email
      if (userData?.message?.includes('User already registered')) {
        // Proceed to db insert
        // get existing user id via admin list
        const listResp = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
          headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
        });
        const listData = await listResp.json();
        const existing = Array.isArray(listData?.users) ? listData.users[0] : listData?.users?.[0] || listData;
        if (!existing?.id) return res.status(500).json({ error: 'Unable to retrieve user id' });
        const uid = existing.id;
        // 2) Insert admin_users row (bypass RLS via service role)
        const insertResp = await fetch(`${url}/rest/v1/admin_users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          },
          body: JSON.stringify({ 
            id: uid, 
            name: `${firstName} ${lastName}`, 
            email, 
            role: 'super_admin',
            permissions: ['all']
          })
        });
        if (!insertResp.ok) {
          const t = await insertResp.text().catch(() => '');
          return res.status(500).json({ error: 'admin_users insert failed', details: t });
        }
        return res.status(200).json({ ok: true, id: uid });
      }
      return res.status(500).json({ error: 'Create user failed', details: userData });
    }

    const uid = userData?.user?.id;
    if (!uid) return res.status(500).json({ error: 'No user id returned' });

    // 2) Insert admin_users row with service role (bypass RLS)
    const insertResp = await fetch(`${url}/rest/v1/admin_users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ 
        id: uid, 
        name: `${firstName} ${lastName}`, 
        email, 
        role: 'super_admin',
        permissions: ['all']
      })
    });
    if (!insertResp.ok) {
      const t = await insertResp.text().catch(() => '');
      return res.status(500).json({ error: 'admin_users insert failed', details: t });
    }

    return res.status(200).json({ ok: true, id: uid });
  } catch (err: any) {
    console.error('[bootstrap-admin] error', err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}
