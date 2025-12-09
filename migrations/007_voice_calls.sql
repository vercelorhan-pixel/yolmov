-- =====================================================
-- YOLMOV VOICE - WebRTC Sesli Arama Sistemi
-- Migration: 007_voice_calls.sql
-- Tarih: 2024-12-08
-- 
-- İŞ MANTIĞI:
-- - Müşteri üye girişi YAPMADAN partner'ı arayabilir
-- - Partner aramayı CEVAPLADIĞINda 1 kredi düşer
-- - Cevapsız/Reddedilen aramalarda kredi DÜŞMEZ
-- =====================================================

-- 1. Aramalar Tablosu (Calls)
-- WebRTC sinyal verilerini ve arama geçmişini tutar
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Katılımcılar
  caller_id TEXT NOT NULL,            -- Aramayı başlatan (anonim olabilir: anon_xxx)
  caller_type TEXT DEFAULT 'customer' CHECK (caller_type IN ('customer', 'partner', 'admin')),
  receiver_id UUID NOT NULL,          -- Aranan (genelde partner)
  receiver_type TEXT DEFAULT 'partner' CHECK (receiver_type IN ('customer', 'partner', 'admin')),
  
  -- Arama durumu
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'connected', 'ended', 'rejected', 'missed', 'failed')),
  
  -- WebRTC Sinyal Verileri (SDP)
  sdp_offer JSONB,                   -- Arama teklifi (Initiator)
  sdp_answer JSONB,                  -- Arama cevabı (Receiver)
  ice_candidates JSONB DEFAULT '[]', -- ICE adayları (NAT geçişi için)
  
  -- Zaman bilgileri
  started_at TIMESTAMPTZ DEFAULT NOW(),
  connected_at TIMESTAMPTZ,          -- Görüşme başladı
  ended_at TIMESTAMPTZ,              -- Görüşme bitti
  
  -- Meta bilgiler
  duration_seconds INTEGER,          -- Görüşme süresi (saniye)
  end_reason TEXT,                   -- 'caller_ended', 'receiver_ended', 'timeout', 'error', 'insufficient_credits'
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5), -- Görüşme kalitesi puanı
  credit_deducted BOOLEAN DEFAULT FALSE, -- Kredi düşürüldü mü?
  
  -- İlişkili iş talebi (opsiyonel)
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexler (Performans için)
CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON public.calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_receiver_id ON public.calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON public.calls(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_request_id ON public.calls(request_id);

-- 3. Realtime Aktifleştirme (Çok Önemli!)
-- Bu tablonun değişikliklerini canlı dinlemek için
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'calls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
    RAISE NOTICE 'calls table added to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'calls table already in supabase_realtime publication, skipping';
  END IF;
END $$;

-- 4. RLS (Row Level Security) Politikaları
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Herkes kendi aramalarını görebilir (anonim dahil)
DROP POLICY IF EXISTS "Users can view their own calls" ON public.calls;
CREATE POLICY "Users can view their own calls"
ON public.calls FOR SELECT
USING (
  caller_id::text = auth.uid()::text 
  OR receiver_id::text = auth.uid()::text
  OR caller_id LIKE 'anon_%'  -- Anonim aramaları da görebilir
);

-- Herkes arama başlatabilir (anonim dahil - üye girişi gerekmez!)
DROP POLICY IF EXISTS "Users can create calls" ON public.calls;
CREATE POLICY "Users can create calls"
ON public.calls FOR INSERT
WITH CHECK (
  caller_id::text = auth.uid()::text 
  OR caller_id LIKE 'anon_%'  -- Anonim kullanıcılar da arama başlatabilir
);

-- Kullanıcılar kendi aramalarını güncelleyebilir (anonim dahil)
DROP POLICY IF EXISTS "Users can update their own calls" ON public.calls;
CREATE POLICY "Users can update their own calls"
ON public.calls FOR UPDATE
USING (
  caller_id::text = auth.uid()::text 
  OR receiver_id::text = auth.uid()::text
  OR caller_id LIKE 'anon_%'  -- Anonim aramaları da güncelleyebilir
);

-- 5. Updated_at Trigger
CREATE OR REPLACE FUNCTION update_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calls_updated_at ON public.calls;
CREATE TRIGGER trigger_calls_updated_at
  BEFORE UPDATE ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION update_calls_updated_at();

-- 6. Görüşme süresini otomatik hesaplama
CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND NEW.connected_at IS NOT NULL AND NEW.ended_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.connected_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_call_duration ON public.calls;
CREATE TRIGGER trigger_calculate_call_duration
  BEFORE UPDATE ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION calculate_call_duration();

-- 7. Admin için tüm aramaları görme politikası
-- (admin_users tablosundaki kullanıcılar tüm aramaları görebilir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    EXECUTE '
      CREATE POLICY "Admins can view all calls"
      ON public.calls FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_users 
          WHERE admin_users.id = auth.uid()
        )
      )
    ';
    RAISE NOTICE 'Admin policy created for calls table';
  ELSE
    RAISE NOTICE 'admin_users table does not exist, skipping admin policy';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Admin policy already exists';
END $$;

-- 8. Arama İstatistikleri View'ı (Admin Dashboard için)
CREATE OR REPLACE VIEW public.call_statistics AS
SELECT 
  DATE_TRUNC('day', started_at) as call_date,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE status = 'connected') as connected_calls,
  COUNT(*) FILTER (WHERE status = 'ended') as completed_calls,
  COUNT(*) FILTER (WHERE status = 'missed') as missed_calls,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_calls,
  AVG(duration_seconds) FILTER (WHERE duration_seconds > 0) as avg_duration_seconds,
  AVG(quality_rating) FILTER (WHERE quality_rating IS NOT NULL) as avg_quality_rating
FROM public.calls
GROUP BY DATE_TRUNC('day', started_at)
ORDER BY call_date DESC;

-- 9. Partner Arama Geçmişi View'ı
CREATE OR REPLACE VIEW public.partner_call_history AS
SELECT 
  c.id,
  c.caller_id,
  c.receiver_id,
  c.status,
  c.started_at,
  c.connected_at,
  c.ended_at,
  c.duration_seconds,
  c.quality_rating,
  c.end_reason,
  COALESCE(cu.first_name || ' ' || cu.last_name, 'Anonim Arayan') as caller_name,
  cu.phone as caller_phone,
  p.company_name as partner_name,
  p.phone as partner_phone
FROM public.calls c
LEFT JOIN public.customers cu ON c.caller_id::text = cu.id::text
LEFT JOIN public.partners p ON c.receiver_id = p.id
WHERE c.receiver_type = 'partner'
ORDER BY c.started_at DESC;

COMMENT ON TABLE public.calls IS 'WebRTC sesli arama kayıtları - Yolmov Voice sistemi';
COMMENT ON COLUMN public.calls.sdp_offer IS 'WebRTC SDP teklifi (Session Description Protocol)';
COMMENT ON COLUMN public.calls.sdp_answer IS 'WebRTC SDP cevabı';
COMMENT ON COLUMN public.calls.ice_candidates IS 'ICE adayları listesi (NAT traversal için)';
COMMENT ON COLUMN public.calls.credit_deducted IS 'Partner aramayı cevaplayınca true olur - 1 kredi düşürüldüğünü gösterir';

-- 10. Credit Transactions tablosuna call_answered tipi ekleme
-- (Eğer constraint varsa güncelle, yoksa uyarıyı yoksay)
DO $$
BEGIN
  -- credit_transactions tablosu varsa type constraint'i güncelle
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions') THEN
    -- Mevcut constraint'i kaldır ve yenisini ekle (call_answered dahil)
    ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
    ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_type_check 
      CHECK (type IN ('purchase', 'bonus', 'job_unlock', 'refund', 'adjustment', 'call_answered', 'promotion', 'referral'));
    RAISE NOTICE 'credit_transactions type constraint updated to include call_answered';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not update credit_transactions constraint: %', SQLERRM;
END $$;
