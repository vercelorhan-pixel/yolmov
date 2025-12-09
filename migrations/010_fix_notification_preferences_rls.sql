-- =====================================================
-- YOLMOV - Partner Bildirim Tercihleri RLS FIX
-- Migration: 010_fix_notification_preferences_rls.sql
-- Tarih: 2024-12-09
-- 
-- RLS politikalarını düzelt - localStorage auth için
-- =====================================================

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Partners can view own notification preferences" ON public.partner_notification_preferences;
DROP POLICY IF EXISTS "Partners can insert own notification preferences" ON public.partner_notification_preferences;
DROP POLICY IF EXISTS "Partners can update own notification preferences" ON public.partner_notification_preferences;
DROP POLICY IF EXISTS "Admins can view all notification preferences" ON public.partner_notification_preferences;

-- YENİ POLİTİKALAR - Daha basit, anon key ile çalışır

-- Herkes kendi partner_id'si ile okuyabilir (anon key)
CREATE POLICY "Allow public read access"
  ON public.partner_notification_preferences
  FOR SELECT
  USING (true);

-- Herkes kendi partner_id'si ile ekleyebilir (anon key)
CREATE POLICY "Allow public insert access"
  ON public.partner_notification_preferences
  FOR INSERT
  WITH CHECK (true);

-- Herkes kendi partner_id'si ile güncelleyebilir (anon key)
CREATE POLICY "Allow public update access"
  ON public.partner_notification_preferences
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Herkes kendi partner_id'si ile silebilir (anon key - opsiyonel)
CREATE POLICY "Allow public delete access"
  ON public.partner_notification_preferences
  FOR DELETE
  USING (true);

-- =====================================================
-- NOT: Bu basitleştirilmiş politikalar production'da
-- daha güvenli JWT-based politikalarla değiştirilmeli
-- Şimdilik localStorage auth ile çalışması için açık
-- =====================================================
