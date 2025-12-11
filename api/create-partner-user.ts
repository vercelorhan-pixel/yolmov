import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Partner User Creation API
 * 
 * Bu endpoint service_role key kullanarak partner kullanıcısı oluşturur.
 * Email confirmation atlanır (email_confirm: true)
 * 
 * Admin API kullanımı sayesinde:
 * - Email doğrulama maili GÖNDERİLMEZ
 * - Kullanıcı hemen aktif olur
 * - Partner tablosuna kayıt eklenir
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      company_name,
      sector,
      city,
      district,
      phone,
      service_types,
      vehicle_count,
      vehicle_types
    } = req.body || {};

    // Validasyon
    if (!email || !password) {
      return res.status(400).json({ error: 'Email ve şifre gereklidir' });
    }

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'Ad ve soyad gereklidir' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Telefon numarası gereklidir' });
    }

    // Supabase URL - birden fazla environment variable kontrolü yap
    const url = process.env.SUPABASE_URL || 
                process.env.VITE_SUPABASE_URL || 
                'https://uwslxmciglqxpvfbgjzm.supabase.co';

    // Mevcut SUPABASE env key'lerini listele (debug için)
    const supabaseEnvKeys = Object.keys(process.env).filter((k) =>
      k.toUpperCase().includes('SUPABASE')
    );

    // Service Role Key - birden fazla isim dene (konfigürasyon esnekliği)
    const serviceKeyCandidates = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SERVICE_ROLE',
      'SUPABASE_SERVICE_KEY',
      'SUPABASE_SECRET_KEY'
    ];

    const serviceKey = serviceKeyCandidates
      .map((name) => process.env[name])
      .find((val) => typeof val === 'string' && val.length > 0);

    // Detaylı error logging
    if (!url) {
      console.error('❌ SUPABASE_URL missing. Available env vars:', supabaseEnvKeys);
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: `SUPABASE_URL not configured. Available SUPABASE env keys: ${supabaseEnvKeys.join(', ')}`
      });
    }

    if (!serviceKey) {
      console.error('❌ Supabase service role key missing. Available SUPABASE env vars:', supabaseEnvKeys);
      console.error('⚠️ Tried env names:', serviceKeyCandidates);
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: `Supabase service role key not configured. Tried: ${serviceKeyCandidates.join(', ')}. Available SUPABASE env keys: ${supabaseEnvKeys.join(', ')}`
      });
    }

    console.log('🔐 Creating partner user with Admin API:', email);

    // 1) Auth kullanıcısı oluştur (Admin API - email confirmation ATLA)
    const createUserResp = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        password,
        email_confirm: true, // ✅ Email doğrulamayı ATLA - mail gönderilmez
        user_metadata: {
          user_type: 'partner',
          first_name,
          last_name
        }
      })
    });

    const userData = await createUserResp.json().catch(() => ({}));

    if (!createUserResp.ok) {
      console.error('❌ Auth user creation failed:', userData);
      
      // Duplicate email hatası kontrolü
      if (userData.msg?.includes('already been registered') || userData.message?.includes('already exists')) {
        return res.status(409).json({ 
          error: 'Bu email adresi zaten kayıtlı',
          code: 'EMAIL_EXISTS'
        });
      }
      
      return res.status(createUserResp.status).json({
        error: userData.msg || userData.message || 'Auth kullanıcısı oluşturulamadı'
      });
    }

    const userId = userData.id || userData.user?.id;
    if (!userId) {
      console.error('❌ User created but ID missing:', userData);
      return res.status(500).json({ error: 'Kullanıcı oluşturuldu ancak ID alınamadı' });
    }

    console.log('✅ Auth user created:', userId);

    // 2) Partner tablosuna kayıt ekle (Service Role ile RLS bypass)
    const partnerData = {
      id: userId,
      name: company_name || `${first_name} ${last_name}`.trim(),
      first_name: first_name || '',
      last_name: last_name || '',
      company_name: company_name || '',
      tax_number: null,
      sector: sector || null,
      city: city || null,
      district: district || null,
      phone: phone || null,
      email: email.toLowerCase(),
      vehicle_count: vehicle_count || 1,
      vehicle_types: vehicle_types || 'Genel Servis Aracı',
      service_types: service_types || null,
      commercial_registry_url: null,
      vehicle_license_url: null,
      status: 'pending', // Admin onayı bekleyecek
      rating: 0,
      completed_jobs: 0,
      credits: 0
    };

    const insertResp = await fetch(`${url}/rest/v1/partners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(partnerData)
    });

    const partnerResult = await insertResp.json().catch(() => null);

    if (!insertResp.ok) {
      console.error('❌ Partner insert failed:', partnerResult);
      
      // Auth kullanıcısını sil (rollback)
      await fetch(`${url}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }).catch(() => {});
      
      // Duplicate phone hatası kontrolü
      if (partnerResult?.message?.includes('phone') || partnerResult?.code === '23505') {
        return res.status(409).json({ 
          error: 'Bu telefon numarası zaten kayıtlı',
          code: 'PHONE_EXISTS'
        });
      }
      
      return res.status(500).json({
        error: 'Partner kaydı oluşturulamadı',
        details: partnerResult?.message || 'Database error'
      });
    }

    console.log('✅ Partner created successfully:', userId);

    // 3) Otomatik hizmet bölgesi ekle (partner'ın kayıt olduğu il/ilçe)
    // Bu sayede partner admin onayından sonra hemen listelenebilir
    if (city) {
      const serviceAreaData = {
        partner_id: userId,
        city: city,
        districts: district ? [district] : null, // İlçe varsa array olarak ekle
        is_primary: true,                         // İlk kayıt = ana hizmet bölgesi
        price_multiplier: 1.00,                   // Standart fiyat
        is_active: true,
        notes: 'Kayıt sırasında otomatik oluşturuldu'
      };

      const serviceAreaResp = await fetch(`${url}/rest/v1/partner_service_areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(serviceAreaData)
      });

      if (serviceAreaResp.ok) {
        console.log('✅ Service area auto-created:', city, district || '(tüm il)');
      } else {
        const errorData = await serviceAreaResp.json().catch(() => null);
        console.warn('⚠️ Service area creation failed (non-critical):', errorData);
        // Hata olsa bile partner kaydı başarılı, devam et
      }
    }

    // Başarılı yanıt
    return res.status(201).json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase()
      },
      partner: Array.isArray(partnerResult) ? partnerResult[0] : partnerResult,
      message: 'Partner kaydı başarıyla oluşturuldu. Admin onayı bekleniyor.'
    });

  } catch (error: any) {
    console.error('❌ Partner creation error:', error);
    return res.status(500).json({
      error: 'Beklenmeyen bir hata oluştu',
      details: error.message
    });
  }
}
