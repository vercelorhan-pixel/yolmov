// Minimal test API - Herhangi bir bağımlılık olmadan
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const allEnvKeys = Object.keys(process.env);
  const supabaseKeys = allEnvKeys.filter(k => k.includes('SUPABASE'));
  
  return res.status(200).json({
    message: 'Test API works',
    node_version: process.version,
    total_env_vars: allEnvKeys.length,
    supabase_env_count: supabaseKeys.length,
    supabase_keys: supabaseKeys,
    // İlk 5 env key'i göster (debug)
    sample_env_keys: allEnvKeys.slice(0, 5)
  });
}
