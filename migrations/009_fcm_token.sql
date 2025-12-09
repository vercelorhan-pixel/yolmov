-- =====================================================
-- YOLMOV VOICE - Firebase Push Notification Token
-- Migration: 009_fcm_token.sql
-- Tarih: 2024-12-09
-- 
-- Partner'ların FCM token'larını saklamak için
-- =====================================================

-- 1. Partners tablosuna fcm_token sütunu ekle
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- 2. fcm_token için index (hızlı arama)
CREATE INDEX IF NOT EXISTS idx_partners_fcm_token 
ON public.partners(fcm_token) 
WHERE fcm_token IS NOT NULL;

-- 3. Partner online durumu için sütun (Supabase Presence alternatifi)
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- 4. last_seen_at için index
CREATE INDEX IF NOT EXISTS idx_partners_last_seen 
ON public.partners(last_seen_at DESC) 
WHERE last_seen_at IS NOT NULL;

-- 5. Online durumunu otomatik güncelleyen fonksiyon
-- Partner 5 dakikadır aktif değilse offline say
CREATE OR REPLACE FUNCTION update_partner_online_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 5 dakikadan eski last_seen = offline
  IF NEW.last_seen_at < NOW() - INTERVAL '5 minutes' THEN
    NEW.is_online = FALSE;
  ELSE
    NEW.is_online = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (her update'te çalışır)
DROP TRIGGER IF EXISTS trigger_partner_online_status ON public.partners;
CREATE TRIGGER trigger_partner_online_status
  BEFORE UPDATE OF last_seen_at ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_online_status();

-- =====================================================
-- NOT: Bu SQL'i Supabase SQL Editor'de çalıştırın
-- Dashboard > SQL Editor > New Query > Paste & Run
-- =====================================================
