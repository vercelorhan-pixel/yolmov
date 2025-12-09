const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uwslxmciglqxpvfbgjzm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNDk4MzgsImV4cCI6MjA0ODcyNTgzOH0.5v3aT6lIKZMo8T00UfXDMVXY1W31KhTNPANW48AZjvs'
);

async function checkSchema() {
  console.log('🔍 Completed Jobs tablo yapısını kontrol ediyorum...\n');
  
  // Tüm completed jobs'ları al
  const { data: jobs, error } = await supabase
    .from('completed_jobs')
    .select('*')
    .limit(3);
  
  if (error) {
    console.log('❌ Hata:', error.message);
  } else if (jobs && jobs.length > 0) {
    console.log('✅ Completed Jobs kayıt sayısı:', jobs.length);
    console.log('   Kolonlar:', Object.keys(jobs[0]).join(', '));
    console.log('\n📋 Örnek completed job:');
    console.log(JSON.stringify(jobs[0], null, 2));
  } else {
    console.log('⚠️ Completed jobs tablosu boş');
  }
  
  // Request bilgilerini kontrol et
  console.log('\n🔍 Transport Requests kontrol ediyorum...');
  const { data: requests } = await supabase
    .from('transport_requests')
    .select('id, status, assigned_partner_id')
    .eq('status', 'completed')
    .limit(3);
  
  if (requests && requests.length > 0) {
    console.log('✅ Completed requests:', requests.length);
    console.log('   Request IDs:', requests.map(r => r.id).join(', ').substring(0, 100) + '...');
  }
}

checkSchema().catch(console.error);
