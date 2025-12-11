import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Health Check API - Environment Variables Test
 * Bu endpoint Vercel'de env var'ların doğru okunup okunmadığını test eder
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Tüm SUPABASE ile başlayan env var isimlerini listele (değerleri değil!)
  const supabaseEnvKeys = Object.keys(process.env).filter(k => 
    k.toUpperCase().includes('SUPABASE')
  );

  // Kritik env var'ların varlığını kontrol et
  const checks = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
  };

  // Service key'in ilk ve son 10 karakterini göster (debug için)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceKeyPreview = serviceKey 
    ? `${serviceKey.substring(0, 10)}...${serviceKey.substring(serviceKey.length - 10)}`
    : 'NOT_SET';

  const urlValue = process.env.SUPABASE_URL || 'NOT_SET';

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    node_version: process.version,
    environment: process.env.VERCEL_ENV || 'unknown',
    supabase_env_keys_found: supabaseEnvKeys,
    checks,
    url_value: urlValue,
    service_key_preview: serviceKeyPreview,
    all_checks_passed: Object.values(checks).every(v => v === true)
  });
}
