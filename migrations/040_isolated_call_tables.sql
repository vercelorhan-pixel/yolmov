-- =====================================================
-- YOLMOV TAM İZOLASYON MİMARİSİ
-- Migration: 040_isolated_call_tables.sql
-- Tarih: 2024-12-11
-- =====================================================
-- 
-- AMAÇ:
-- Çağrı sistemini 3 TAMAMEN BAĞIMSIZ bölüme ayırmak:
-- 1. Müşteri → Partner (Direkt Aramalar)
-- 2. Müşteri → Destek (Kuyruk Tabanlı)
-- 3. Partner → Destek (Kuyruk Tabanlı)
-- 
-- Her bölüm kendi tablosu, trigger'ları, RLS policy'leri
-- ve indekslerine sahip. Ortak bağımlılık YOK.
-- =====================================================

-- =====================================================
-- BÖLÜM 1: MÜŞTERİ → PARTNER ÇAĞRILARI (Direkt)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customer_partner_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Katılımcılar
  customer_id TEXT NOT NULL,                -- Anonim olabilir: anon_xxx
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  
  -- WebRTC Sinyal Verileri
  sdp_offer JSONB,                         -- SDP teklifi
  sdp_answer JSONB,                        -- SDP cevabı
  ice_candidates JSONB DEFAULT '[]',       -- ICE adayları
  
  -- Arama Durumu
  status TEXT DEFAULT 'ringing' CHECK (
    status IN ('ringing', 'connected', 'ended', 'rejected', 'missed', 'failed')
  ),
  
  -- Zaman Bilgileri
  started_at TIMESTAMPTZ DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- İş Mantığı
  end_reason TEXT,                         -- caller_ended, receiver_ended, timeout, error
  credit_deducted BOOLEAN DEFAULT FALSE,   -- Kredi düşürüldü mü?
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  
  -- İlişkiler
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler: Müşteri → Partner
CREATE INDEX idx_cpc_customer_id ON public.customer_partner_calls(customer_id);
CREATE INDEX idx_cpc_partner_id ON public.customer_partner_calls(partner_id);
CREATE INDEX idx_cpc_status ON public.customer_partner_calls(status);
CREATE INDEX idx_cpc_started_at ON public.customer_partner_calls(started_at DESC);
CREATE INDEX idx_cpc_request_id ON public.customer_partner_calls(request_id) WHERE request_id IS NOT NULL;

-- RLS Policies: Müşteri → Partner
ALTER TABLE public.customer_partner_calls ENABLE ROW LEVEL SECURITY;

-- Policy 1: Müşteri kendi aramalarını görebilir
CREATE POLICY "customer_partner_calls_customer_select" 
ON public.customer_partner_calls 
FOR SELECT 
USING (
  customer_id = current_setting('app.current_user_id', true) OR
  customer_id LIKE 'anon_%'
);

-- Policy 2: Partner kendi aramalarını görebilir
CREATE POLICY "customer_partner_calls_partner_select" 
ON public.customer_partner_calls 
FOR SELECT 
USING (
  partner_id = auth.uid()
);

-- Policy 3: Müşteri arama başlatabilir
CREATE POLICY "customer_partner_calls_customer_insert" 
ON public.customer_partner_calls 
FOR INSERT 
WITH CHECK (true);

-- Policy 4: Hem müşteri hem partner güncelleyebilir (SDP answer vs)
CREATE POLICY "customer_partner_calls_update" 
ON public.customer_partner_calls 
FOR UPDATE 
USING (
  customer_id = current_setting('app.current_user_id', true) OR
  customer_id LIKE 'anon_%' OR
  partner_id = auth.uid()
);

-- Trigger: Müşteri → Partner (updated_at)
CREATE OR REPLACE FUNCTION update_customer_partner_calls_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_partner_calls_timestamp
  BEFORE UPDATE ON public.customer_partner_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_partner_calls_timestamp();

-- =====================================================
-- BÖLÜM 2: MÜŞTERİ → DESTEK ÇAĞRILARI (Kuyruk)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customer_support_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Katılımcılar
  customer_id TEXT NOT NULL,                -- Anonim olabilir: anon_xxx
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Atanan admin/agent
  
  -- Kuyruk Bilgisi
  queue_id UUID REFERENCES public.call_queues(id) ON DELETE SET NULL,
  queue_position INTEGER,                   -- Sıradaki pozisyon
  wait_time_seconds INTEGER,                -- Bekleme süresi
  
  -- WebRTC Sinyal Verileri
  sdp_offer JSONB,
  sdp_answer JSONB,
  ice_candidates JSONB DEFAULT '[]',
  
  -- Arama Durumu
  status TEXT DEFAULT 'waiting' CHECK (
    status IN ('waiting', 'ringing', 'connected', 'ended', 'rejected', 'missed', 'failed', 'timeout')
  ),
  
  -- Zaman Bilgileri
  started_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,                 -- Agent'a atandığı zaman
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- İş Mantığı
  end_reason TEXT,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  notes TEXT,                              -- Agent notları
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler: Müşteri → Destek
CREATE INDEX idx_csc_customer_id ON public.customer_support_calls(customer_id);
CREATE INDEX idx_csc_admin_id ON public.customer_support_calls(admin_id);
CREATE INDEX idx_csc_queue_id ON public.customer_support_calls(queue_id);
CREATE INDEX idx_csc_status ON public.customer_support_calls(status);
CREATE INDEX idx_csc_started_at ON public.customer_support_calls(started_at DESC);
CREATE INDEX idx_csc_waiting ON public.customer_support_calls(status, queue_position) 
  WHERE status = 'waiting';

-- RLS Policies: Müşteri → Destek
ALTER TABLE public.customer_support_calls ENABLE ROW LEVEL SECURITY;

-- Policy 1: Müşteri kendi aramalarını görebilir
CREATE POLICY "customer_support_calls_customer_select" 
ON public.customer_support_calls 
FOR SELECT 
USING (
  customer_id = current_setting('app.current_user_id', true) OR
  customer_id LIKE 'anon_%'
);

-- Policy 2: Admin/Agent atanmış aramalarını görebilir
CREATE POLICY "customer_support_calls_admin_select" 
ON public.customer_support_calls 
FOR SELECT 
USING (
  admin_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.call_agents
    WHERE admin_id = auth.uid()
  )
);

-- Policy 3: Müşteri çağrı başlatabilir
CREATE POLICY "customer_support_calls_customer_insert" 
ON public.customer_support_calls 
FOR INSERT 
WITH CHECK (true);

-- Policy 4: Güncellemeler (SDP exchange, status change)
CREATE POLICY "customer_support_calls_update" 
ON public.customer_support_calls 
FOR UPDATE 
USING (
  customer_id = current_setting('app.current_user_id', true) OR
  customer_id LIKE 'anon_%' OR
  admin_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.call_agents
    WHERE admin_id = auth.uid()
  )
);

-- Trigger: Müşteri → Destek (updated_at)
CREATE OR REPLACE FUNCTION update_customer_support_calls_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_support_calls_timestamp
  BEFORE UPDATE ON public.customer_support_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_support_calls_timestamp();

-- Trigger: Otomatik kuyruk pozisyonu hesaplama
CREATE OR REPLACE FUNCTION assign_customer_support_queue_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.queue_position IS NULL AND NEW.status = 'waiting' THEN
    SELECT COALESCE(MAX(queue_position), 0) + 1
    INTO NEW.queue_position
    FROM public.customer_support_calls
    WHERE queue_id = NEW.queue_id AND status = 'waiting';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_customer_support_queue_position
  BEFORE INSERT ON public.customer_support_calls
  FOR EACH ROW
  EXECUTE FUNCTION assign_customer_support_queue_position();

-- =====================================================
-- BÖLÜM 3: PARTNER → DESTEK ÇAĞRILARI (Kuyruk)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.partner_support_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Katılımcılar
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Kuyruk Bilgisi
  queue_id UUID REFERENCES public.call_queues(id) ON DELETE SET NULL,
  queue_position INTEGER,
  wait_time_seconds INTEGER,
  
  -- WebRTC Sinyal Verileri
  sdp_offer JSONB,
  sdp_answer JSONB,
  ice_candidates JSONB DEFAULT '[]',
  
  -- Arama Durumu
  status TEXT DEFAULT 'waiting' CHECK (
    status IN ('waiting', 'ringing', 'connected', 'ended', 'rejected', 'missed', 'failed', 'timeout')
  ),
  
  -- Zaman Bilgileri
  started_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- İş Mantığı
  end_reason TEXT,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  priority_level INTEGER DEFAULT 0,        -- Partner aramaları öncelikli olabilir
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler: Partner → Destek
CREATE INDEX idx_psc_partner_id ON public.partner_support_calls(partner_id);
CREATE INDEX idx_psc_admin_id ON public.partner_support_calls(admin_id);
CREATE INDEX idx_psc_queue_id ON public.partner_support_calls(queue_id);
CREATE INDEX idx_psc_status ON public.partner_support_calls(status);
CREATE INDEX idx_psc_started_at ON public.partner_support_calls(started_at DESC);
CREATE INDEX idx_psc_waiting ON public.partner_support_calls(status, queue_position, priority_level) 
  WHERE status = 'waiting';

-- RLS Policies: Partner → Destek
ALTER TABLE public.partner_support_calls ENABLE ROW LEVEL SECURITY;

-- Policy 1: Partner kendi aramalarını görebilir
CREATE POLICY "partner_support_calls_partner_select" 
ON public.partner_support_calls 
FOR SELECT 
USING (
  partner_id = auth.uid()
);

-- Policy 2: Admin/Agent atanmış aramalarını görebilir
CREATE POLICY "partner_support_calls_admin_select" 
ON public.partner_support_calls 
FOR SELECT 
USING (
  admin_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.call_agents
    WHERE admin_id = auth.uid()
  )
);

-- Policy 3: Partner çağrı başlatabilir
CREATE POLICY "partner_support_calls_partner_insert" 
ON public.partner_support_calls 
FOR INSERT 
WITH CHECK (
  partner_id = auth.uid()
);

-- Policy 4: Güncellemeler
CREATE POLICY "partner_support_calls_update" 
ON public.partner_support_calls 
FOR UPDATE 
USING (
  partner_id = auth.uid() OR
  admin_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.call_agents
    WHERE admin_id = auth.uid()
  )
);

-- Trigger: Partner → Destek (updated_at)
CREATE OR REPLACE FUNCTION update_partner_support_calls_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_support_calls_timestamp
  BEFORE UPDATE ON public.partner_support_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_support_calls_timestamp();

-- Trigger: Otomatik kuyruk pozisyonu (öncelik bazlı)
CREATE OR REPLACE FUNCTION assign_partner_support_queue_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.queue_position IS NULL AND NEW.status = 'waiting' THEN
    SELECT COALESCE(MAX(queue_position), 0) + 1
    INTO NEW.queue_position
    FROM public.partner_support_calls
    WHERE queue_id = NEW.queue_id AND status = 'waiting';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_partner_support_queue_position
  BEFORE INSERT ON public.partner_support_calls
  FOR EACH ROW
  EXECUTE FUNCTION assign_partner_support_queue_position();

-- =====================================================
-- VERİ MİGRASYONU (ESKİ CALLS TABLOSU)
-- =====================================================
-- Mevcut calls tablosundaki verileri yeni tablolara taşı

-- NOT: Eğer 'calls' tablosu yoksa migration adımlarını atla
DO $$
BEGIN
  -- Tablo var mı kontrol et
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calls') THEN
    
    -- Müşteri → Partner aramalarını taşı (sadece geçerli partner_id olanlar)
    INSERT INTO public.customer_partner_calls (
      id, customer_id, partner_id, sdp_offer, sdp_answer, ice_candidates,
      status, started_at, connected_at, ended_at, duration_seconds,
      end_reason, credit_deducted, quality_rating, request_id, created_at, updated_at
    )
    SELECT 
      id, caller_id, receiver_id::UUID, sdp_offer, sdp_answer, ice_candidates,
      status, started_at, connected_at, ended_at, duration_seconds,
      end_reason, credit_deducted, quality_rating, request_id, created_at, updated_at
    FROM public.calls
    WHERE caller_type = 'customer' 
      AND receiver_type = 'partner'
      AND receiver_id::UUID IN (SELECT id FROM public.partners);

    -- Müşteri → Destek aramalarını taşı
    INSERT INTO public.customer_support_calls (
      id, customer_id, admin_id, sdp_offer, sdp_answer, ice_candidates,
      status, started_at, connected_at, ended_at, duration_seconds,
      end_reason, quality_rating, created_at, updated_at
    )
    SELECT 
      id, 
      caller_id, 
      CASE 
        WHEN receiver_id::UUID IN (SELECT id FROM auth.users) THEN receiver_id::UUID
        ELSE NULL
      END, 
      sdp_offer, sdp_answer, ice_candidates,
      status, started_at, connected_at, ended_at, duration_seconds,
      end_reason, quality_rating, created_at, updated_at
    FROM public.calls
    WHERE caller_type = 'customer' AND receiver_type = 'admin';

    -- Partner → Destek aramalarını taşı (sadece geçerli partner_id olanlar)
    INSERT INTO public.partner_support_calls (
      id, partner_id, admin_id, sdp_offer, sdp_answer, ice_candidates,
      status, started_at, connected_at, ended_at, duration_seconds,
      end_reason, quality_rating, created_at, updated_at
    )
    SELECT 
      id, 
      caller_id::UUID, 
      CASE 
        WHEN receiver_id::UUID IN (SELECT id FROM auth.users) THEN receiver_id::UUID
        ELSE NULL
      END,
      sdp_offer, sdp_answer, ice_candidates,
      status, started_at, connected_at, ended_at, duration_seconds,
      end_reason, quality_rating, created_at, updated_at
    FROM public.calls
    WHERE caller_type = 'partner' 
      AND receiver_type = 'admin'
      AND caller_id::UUID IN (SELECT id FROM public.partners);

    -- Eski calls tablosunu yedekleme amaçlı sakla
    ALTER TABLE public.calls RENAME TO calls_deprecated_backup;
    
    RAISE NOTICE '✅ Veri migrasyonu tamamlandı';
  ELSE
    RAISE NOTICE 'ℹ️  calls tablosu bulunamadı, migration atlandı';
  END IF;
END $$;

-- =====================================================
-- MİGRASYON TAMAMLANDI
-- =====================================================
-- 
-- ✅ 3 ayrı tablo oluşturuldu
-- ✅ Her tablo için RLS policy'leri tanımlandı
-- ✅ Her tablo için trigger'lar eklendi
-- ✅ Her tablo için indeksler optimize edildi
-- ✅ Eski veriler yeni tablolara taşındı
-- ✅ Eski tablo yedeklendi
-- 
-- SONRAKİ ADIMLAR:
-- 1. Backend servislerini ayır
-- 2. Frontend context'leri ayır
-- 3. Component'leri güncelle
-- =====================================================
