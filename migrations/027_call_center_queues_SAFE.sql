-- =====================================================
-- YOLMOV ÇAĞRI MERKEZİ (Call Center) - Veritabanı Şeması
-- =====================================================
-- Tarih: 2024-12-10 (UPDATED - SAFE VERSION)
-- 
-- ⚠️ IDEMPOTENT MIGRATION - Tekrar çalıştırılabilir!
-- Bu migration çağrı merkezi altyapısını oluşturur:
-- 1. Çağrı Havuzları (Call Queues) - Farklı çağrı türleri için havuzlar
-- 2. Çağrı Ajanları (Call Agents) - Adminler, operatörler
-- 3. Çağrı Atamaları (Call Assignments) - Çağrı-agent eşleşmeleri
-- =====================================================

-- =====================================================
-- 1. ÇAĞRI HAVUZLARI (Call Queues)
-- =====================================================
-- Farklı amaçlar için çağrı havuzları tanımlar
-- Örn: Genel Destek, Partner İletişim, Acil Yardım

CREATE TABLE IF NOT EXISTS call_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Havuz bilgileri
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL, -- 'general-support', 'partner-calls', 'emergency'
  description TEXT,
  
  -- Havuz türü
  queue_type VARCHAR(30) NOT NULL DEFAULT 'general', -- general, partner, emergency, vip
  priority INTEGER DEFAULT 0, -- Yüksek = daha öncelikli
  
  -- Çalışma saatleri (JSON)
  -- { "monday": { "start": "09:00", "end": "18:00" }, ... }
  working_hours JSONB DEFAULT '{}',
  
  -- Ayarlar
  max_wait_time_seconds INTEGER DEFAULT 300, -- Maksimum bekleme süresi (5 dk)
  auto_distribute BOOLEAN DEFAULT true, -- Otomatik dağıtım aktif mi?
  distribution_strategy VARCHAR(30) DEFAULT 'round-robin', -- round-robin, least-busy, random
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  
  -- Zaman damgaları
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayılan havuzları oluştur (sadece yoksa)
INSERT INTO call_queues (name, slug, description, queue_type, priority) VALUES
  ('Genel Destek', 'general-support', 'Web sitesi ve genel sorular için destek hattı', 'general', 1),
  ('Partner Aramaları', 'partner-calls', 'Müşteriden partnere direkt aramalar', 'partner', 2),
  ('Acil Yardım', 'emergency', '7/24 acil yol yardımı', 'emergency', 10)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2. ÇAĞRI AJANLARI (Call Agents)
-- =====================================================
-- Admin kullanıcıları çağrı ajanı olarak tanımlar

CREATE TABLE IF NOT EXISTS call_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Admin kullanıcı referansı
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  
  -- Agent bilgileri
  display_name VARCHAR(100), -- Çağrıda görünecek isim
  extension VARCHAR(10), -- Dahili numara (opsiyonel)
  
  -- Durum
  status VARCHAR(20) DEFAULT 'offline', -- online, busy, away, offline
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Çağrı istatistikleri (güncel)
  current_call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  calls_handled_today INTEGER DEFAULT 0,
  avg_call_duration_today INTEGER DEFAULT 0, -- saniye
  
  -- Yetenekler / Atanabilir havuzlar (JSON array)
  -- ["general-support", "partner-calls"]
  assigned_queues JSONB DEFAULT '["general-support"]',
  
  -- Öncelik ve sıralama
  priority INTEGER DEFAULT 0, -- Yüksek = daha önce çağrı alır
  max_concurrent_calls INTEGER DEFAULT 1, -- Aynı anda max çağrı
  
  -- Ayarlar
  auto_accept_calls BOOLEAN DEFAULT false, -- Otomatik kabul
  ring_timeout_seconds INTEGER DEFAULT 30, -- Cevap süresi
  
  -- Zaman damgaları
  last_call_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(admin_id)
);

-- =====================================================
-- 3. ÇAĞRI KUYRUĞU / ATAMALAR (Call Queue Assignments)
-- =====================================================
-- Gelen çağrıları havuza atar ve agent'lara dağıtır

CREATE TABLE IF NOT EXISTS call_queue_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Çağrı ve havuz referansları
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  queue_id UUID NOT NULL REFERENCES call_queues(id) ON DELETE CASCADE,
  
  -- Atanan agent (varsa)
  assigned_agent_id UUID REFERENCES call_agents(id) ON DELETE SET NULL,
  
  -- Çağrı kaynağı
  source_type VARCHAR(30) NOT NULL, -- web-contact, partner-direct, emergency-button
  source_page VARCHAR(255), -- /iletisim, /partner/xyz, /
  
  -- Arayan bilgileri
  caller_name VARCHAR(100),
  caller_phone VARCHAR(20),
  caller_email VARCHAR(255),
  caller_message TEXT, -- Ön mesaj (varsa)
  
  -- Çağrı detayları (Partner araması için)
  target_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  
  -- Durum
  status VARCHAR(30) DEFAULT 'waiting', -- waiting, ringing, answered, completed, abandoned, missed
  
  -- Zaman takibi
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Süre hesaplamaları (saniye)
  wait_duration INTEGER, -- Kuyrukta bekleme
  ring_duration INTEGER, -- Çalma süresi
  talk_duration INTEGER, -- Konuşma süresi
  
  -- Notlar ve metadata
  agent_notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Zaman damgaları
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CALLS TABLOSUNU GÜNCELLE
-- =====================================================
-- Mevcut calls tablosuna queue referansı ekle

ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS queue_assignment_id UUID REFERENCES call_queue_assignments(id) ON DELETE SET NULL;

ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS call_source VARCHAR(30) DEFAULT 'direct'; -- direct, queue, partner-page

-- =====================================================
-- 5. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_call_agents_admin ON call_agents(admin_id);
CREATE INDEX IF NOT EXISTS idx_call_agents_status ON call_agents(status) WHERE status = 'online';
CREATE INDEX IF NOT EXISTS idx_call_queue_assignments_queue ON call_queue_assignments(queue_id);
CREATE INDEX IF NOT EXISTS idx_call_queue_assignments_agent ON call_queue_assignments(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_call_queue_assignments_status ON call_queue_assignments(status);
CREATE INDEX IF NOT EXISTS idx_call_queue_assignments_waiting ON call_queue_assignments(queued_at) WHERE status = 'waiting';

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) - IDEMPOTENT
-- =====================================================

ALTER TABLE call_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_queue_assignments ENABLE ROW LEVEL SECURITY;

-- 🔧 DROP EXISTING POLICIES FIRST (Idempotent)
DROP POLICY IF EXISTS "call_queues_select_all" ON call_queues;
DROP POLICY IF EXISTS "call_agents_select_all" ON call_agents;
DROP POLICY IF EXISTS "call_queue_assignments_select_all" ON call_queue_assignments;
DROP POLICY IF EXISTS "call_queue_assignments_insert_all" ON call_queue_assignments;
DROP POLICY IF EXISTS "call_queue_assignments_update_all" ON call_queue_assignments;
DROP POLICY IF EXISTS "call_agents_update_all" ON call_agents;

-- ✅ CREATE NEW POLICIES
-- Herkes okuyabilir (public)
CREATE POLICY "call_queues_select_all" ON call_queues FOR SELECT USING (true);
CREATE POLICY "call_agents_select_all" ON call_agents FOR SELECT USING (true);
CREATE POLICY "call_queue_assignments_select_all" ON call_queue_assignments FOR SELECT USING (true);

-- Herkes ekleyebilir (çağrı başlatma için)
CREATE POLICY "call_queue_assignments_insert_all" ON call_queue_assignments FOR INSERT WITH CHECK (true);

-- Herkes güncelleyebilir (çağrı durumu için)
CREATE POLICY "call_queue_assignments_update_all" ON call_queue_assignments FOR UPDATE USING (true);
CREATE POLICY "call_agents_update_all" ON call_agents FOR UPDATE USING (true);

-- =====================================================
-- 7. TRIGGERS - IDEMPOTENT
-- =====================================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_call_center_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS call_queues_updated_at ON call_queues;
DROP TRIGGER IF EXISTS call_agents_updated_at ON call_agents;
DROP TRIGGER IF EXISTS call_queue_assignments_updated_at ON call_queue_assignments;

-- Create triggers
CREATE TRIGGER call_queues_updated_at
  BEFORE UPDATE ON call_queues
  FOR EACH ROW EXECUTE FUNCTION update_call_center_timestamp();

CREATE TRIGGER call_agents_updated_at
  BEFORE UPDATE ON call_agents
  FOR EACH ROW EXECUTE FUNCTION update_call_center_timestamp();

CREATE TRIGGER call_queue_assignments_updated_at
  BEFORE UPDATE ON call_queue_assignments
  FOR EACH ROW EXECUTE FUNCTION update_call_center_timestamp();

-- =====================================================
-- 8. VIEWS - IDEMPOTENT
-- =====================================================

-- Aktif çağrı ajanları görünümü
CREATE OR REPLACE VIEW v_active_call_agents AS
SELECT 
  ca.*,
  au.name as admin_name,
  au.email as admin_email,
  au.role as admin_role,
  CASE 
    WHEN ca.current_call_id IS NOT NULL THEN 'on-call'
    ELSE ca.status
  END as effective_status
FROM call_agents ca
JOIN admin_users au ON ca.admin_id = au.id
WHERE au.status = 'active';

-- Kuyrukta bekleyen çağrılar görünümü
CREATE OR REPLACE VIEW v_waiting_calls AS
SELECT 
  cqa.*,
  cq.name as queue_name,
  cq.slug as queue_slug,
  cq.priority as queue_priority,
  EXTRACT(EPOCH FROM (NOW() - cqa.queued_at))::INTEGER as wait_seconds
FROM call_queue_assignments cqa
JOIN call_queues cq ON cqa.queue_id = cq.id
WHERE cqa.status = 'waiting'
ORDER BY cq.priority DESC, cqa.queued_at ASC;

-- =====================================================
-- ✅ TAMAMLANDI - SAFE & IDEMPOTENT
-- =====================================================
-- Bu migration tekrar çalıştırılabilir (idempotent)
-- Mevcut yapıları bozmaz, sadece eksikleri tamamlar
-- =====================================================
