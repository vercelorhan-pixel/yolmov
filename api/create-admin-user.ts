import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  try {
    const { email, password, name, role } = req.body || {};
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing Supabase keys' });
    }

    // 1) Create auth user via admin API (skips email confirmation)
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
        email_confirm: true, // Auto-confirm email
        user_metadata: { 
          user_type: 'admin', 
          first_name: name.split(' ')[0], 
          last_name: name.split(' ').slice(1).join(' ') || '' 
        }
      })
    });
    
    const userData = await createUserResp.json().catch(() => ({}));
    
    if (!createUserResp.ok) {
      return res.status(createUserResp.status).json({ 
        error: userData.msg || userData.message || 'Failed to create auth user' 
      });
    }

    const userId = userData.id || userData.user?.id;
    if (!userId) {
      return res.status(500).json({ error: 'User created but ID missing' });
    }

    // 2) Insert admin_users row (bypass RLS via service role)
    const insertResp = await fetch(`${url}/rest/v1/admin_users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: userId,
        email,
        name,
        role: role || 'support',
        status: 'active'
      })
    });

    const insertData = await insertResp.json().catch(() => ({}));
    
    if (!insertResp.ok) {
      // Rollback auth user if db insert fails? 
      // For now just return error
      return res.status(insertResp.status).json({ 
        error: insertData.msg || insertData.message || 'Failed to create admin profile',
        details: insertData
      });
    }

    return res.status(200).json({ 
      ok: true, 
      user: insertData[0] || insertData 
    });

  } catch (error: any) {
    console.error('Create Admin User Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
