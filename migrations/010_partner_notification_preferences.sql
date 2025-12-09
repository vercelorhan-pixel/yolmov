-- =====================================================
-- YOLMOV - Partner Bildirim Tercihleri
-- Migration: 010_partner_notification_preferences.sql
-- Tarih: 2024-12-09
-- 
-- Partner'ların bildirim tercihlerini yönetmek için
-- =====================================================

-- 1. Partner bildirim tercihleri tablosu
CREATE TABLE IF NOT EXISTS public.partner_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  
  -- ========================================
  -- YENİ İŞ TALEPLERİ BİLDİRİMLERİ
  -- ========================================
  new_job_push_enabled BOOLEAN DEFAULT true,          -- Push notification
  new_job_sms_enabled BOOLEAN DEFAULT true,           -- SMS
  new_job_email_enabled BOOLEAN DEFAULT false,        -- E-posta
  
  -- ========================================
  -- TEKLİF KABUL/RED BİLDİRİMLERİ
  -- ========================================
  offer_status_push_enabled BOOLEAN DEFAULT true,     -- Push notification
  offer_status_sms_enabled BOOLEAN DEFAULT false,     -- SMS
  offer_status_email_enabled BOOLEAN DEFAULT false,   -- E-posta
  
  -- ========================================
  -- ÖDEME & CÜZDAN BİLDİRİMLERİ
  -- ========================================
  payment_push_enabled BOOLEAN DEFAULT true,          -- Push notification
  payment_email_enabled BOOLEAN DEFAULT true,         -- E-posta
  
  -- ========================================
  -- SESLİ ARAMA BİLDİRİMLERİ (Firebase)
  -- ========================================
  voice_call_push_enabled BOOLEAN DEFAULT true,       -- Push notification (Firebase)
  voice_call_sms_enabled BOOLEAN DEFAULT false,       -- SMS fallback
  
  -- ========================================
  -- GENEL AYARLAR
  -- ========================================
  all_notifications_enabled BOOLEAN DEFAULT true,     -- Master switch (tüm bildirimleri kapat)
  quiet_hours_enabled BOOLEAN DEFAULT false,          -- Sessiz saatler aktif mi
  quiet_hours_start TIME DEFAULT '22:00:00',          -- Sessiz saatler başlangıç (örn: 22:00)
  quiet_hours_end TIME DEFAULT '08:00:00',            -- Sessiz saatler bitiş (örn: 08:00)
  
  -- ========================================
  -- METAdata
  -- ========================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for fast partner lookups
CREATE INDEX IF NOT EXISTS idx_partner_notification_prefs_partner_id 
ON public.partner_notification_preferences(partner_id);

-- 3. RLS Policies (Partner sadece kendi tercihlerini görebilir/düzenleyebilir)
ALTER TABLE public.partner_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Partner kendi tercihlerini görebilir
CREATE POLICY "Partners can view own notification preferences"
  ON public.partner_notification_preferences
  FOR SELECT
  USING (partner_id::TEXT = current_setting('request.jwt.claims', true)::json->>'partner_id');

-- Partner kendi tercihlerini ekleyebilir
CREATE POLICY "Partners can insert own notification preferences"
  ON public.partner_notification_preferences
  FOR INSERT
  WITH CHECK (partner_id::TEXT = current_setting('request.jwt.claims', true)::json->>'partner_id');

-- Partner kendi tercihlerini güncelleyebilir
CREATE POLICY "Partners can update own notification preferences"
  ON public.partner_notification_preferences
  FOR UPDATE
  USING (partner_id::TEXT = current_setting('request.jwt.claims', true)::json->>'partner_id')
  WITH CHECK (partner_id::TEXT = current_setting('request.jwt.claims', true)::json->>'partner_id');

-- Admin tüm tercihleri görebilir (opsiyonel)
CREATE POLICY "Admins can view all notification preferences"
  ON public.partner_notification_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id::TEXT = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- 4. Updated at trigger function
CREATE OR REPLACE FUNCTION update_partner_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (her update'te çalışır)
DROP TRIGGER IF EXISTS trigger_partner_notification_prefs_updated_at ON public.partner_notification_preferences;
CREATE TRIGGER trigger_partner_notification_prefs_updated_at
  BEFORE UPDATE ON public.partner_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_notification_prefs_updated_at();

-- 5. Varsayılan tercihleri otomatik oluşturma fonksiyonu
-- Yeni partner kaydolduğunda otomatik tercih kaydı oluşturulsun
CREATE OR REPLACE FUNCTION create_default_partner_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.partner_notification_preferences (partner_id)
  VALUES (NEW.id)
  ON CONFLICT (partner_id) DO NOTHING; -- Zaten varsa bir şey yapma
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (yeni partner eklendiğinde çalışır)
DROP TRIGGER IF EXISTS trigger_create_default_partner_notification_prefs ON public.partners;
CREATE TRIGGER trigger_create_default_partner_notification_prefs
  AFTER INSERT ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION create_default_partner_notification_preferences();

-- 6. Tablo hakkında açıklama
COMMENT ON TABLE public.partner_notification_preferences IS 
'Partner bildirim tercihleri - push, SMS, e-posta kanalları için iş talepleri, teklif durumları, ödemeler ve sesli arama bildirimleri';

COMMENT ON COLUMN public.partner_notification_preferences.new_job_push_enabled IS 
'Yeni iş talebi geldiğinde push notification göster';

COMMENT ON COLUMN public.partner_notification_preferences.voice_call_push_enabled IS 
'Müşteri sesli arama yaptığında Firebase push notification gönder (offline iken)';

COMMENT ON COLUMN public.partner_notification_preferences.all_notifications_enabled IS 
'Master switch - false ise hiçbir bildirim gönderilmez';

COMMENT ON COLUMN public.partner_notification_preferences.quiet_hours_enabled IS 
'Sessiz saatler aktifse belirtilen saat aralığında bildirim gönderilmez';

-- 7. Mevcut partnerlar için varsayılan tercihleri oluştur
INSERT INTO public.partner_notification_preferences (partner_id)
SELECT id FROM public.partners
ON CONFLICT (partner_id) DO NOTHING;

-- =====================================================
-- BAŞARILI! Artık partner_notification_preferences tablosu hazır
-- =====================================================
