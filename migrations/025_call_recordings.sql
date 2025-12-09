-- =====================================================
-- YOLMOV VOICE - Çağrı Kayıt ve Arşivleme Sistemi
-- Migration: 025_call_recordings.sql
-- Tarih: 2025-12-10
-- 
-- ÇİFT AKIŞ MİMARİSİ:
-- 1. Canlı Görüşme: WebRTC HD Audio (48 kHz) - Kalite odaklı
-- 2. Arşiv Kaydı: Opus Codec (12-16 kbps) - Maliyet odaklı
--
-- DEPOLAMA KAZANIMI:
-- - Standart: 1 saat = ~30 MB
-- - Yolmov Akıllı Kayıt: 1 saat = ~5 MB (%80+ tasarruf)
-- =====================================================

-- 1. Çağrı Kayıtları Tablosu (Call Recordings)
CREATE TABLE IF NOT EXISTS public.call_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- İlişkili arama
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  
  -- Katılımcı bilgileri (denormalize - hızlı erişim için)
  caller_id TEXT NOT NULL,
  caller_type TEXT NOT NULL,
  caller_name TEXT,
  receiver_id UUID NOT NULL,
  receiver_type TEXT NOT NULL,
  receiver_name TEXT,
  
  -- Dosya bilgileri
  file_path TEXT NOT NULL,              -- Supabase Storage path: 'call-recordings/2025/12/call_xxx.opus'
  file_name TEXT NOT NULL,              -- 'call_xxx.opus'
  file_size_bytes INTEGER,              -- Dosya boyutu (bytes)
  file_format TEXT DEFAULT 'opus',      -- 'opus', 'webm', 'wav'
  
  -- Ses özellikleri
  duration_seconds INTEGER NOT NULL,    -- Kayıt süresi (saniye)
  sample_rate INTEGER DEFAULT 16000,    -- Örnekleme hızı (Hz) - 16kHz Opus
  bitrate INTEGER DEFAULT 16000,        -- Bit hızı (bps) - 16kbps
  channels INTEGER DEFAULT 1,           -- Kanal sayısı (mono)
  
  -- Sıkıştırma bilgileri
  original_size_bytes INTEGER,          -- Sıkıştırma öncesi boyut
  compression_ratio DECIMAL(5,2),       -- Sıkıştırma oranı (örn: 6.5)
  codec TEXT DEFAULT 'opus',            -- Kullanılan codec
  
  -- Şifreleme
  is_encrypted BOOLEAN DEFAULT TRUE,    -- E2E şifreli mi?
  encryption_key_id TEXT,               -- Şifreleme anahtarı referansı
  
  -- Durum
  status TEXT DEFAULT 'recording' CHECK (status IN ('recording', 'processing', 'ready', 'failed', 'deleted')),
  error_message TEXT,                   -- Hata durumunda mesaj
  
  -- İndirme/Dinleme sayısı
  play_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  last_played_by UUID,                  -- Admin ID
  
  -- İlişkili iş
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  job_id UUID,
  
  -- Metadata (ek bilgiler)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ               -- Soft delete
);

-- 2. Indexler
CREATE INDEX IF NOT EXISTS idx_call_recordings_call_id ON public.call_recordings(call_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_caller_id ON public.call_recordings(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_receiver_id ON public.call_recordings(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_status ON public.call_recordings(status);
CREATE INDEX IF NOT EXISTS idx_call_recordings_created_at ON public.call_recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_recordings_request_id ON public.call_recordings(request_id);

-- 3. calls tablosuna recording ilişkisi ekle
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calls' AND column_name = 'recording_id') THEN
    ALTER TABLE public.calls ADD COLUMN recording_id UUID REFERENCES public.call_recordings(id) ON DELETE SET NULL;
    RAISE NOTICE 'recording_id kolonu calls tablosuna eklendi';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calls' AND column_name = 'is_recorded') THEN
    ALTER TABLE public.calls ADD COLUMN is_recorded BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'is_recorded kolonu calls tablosuna eklendi';
  END IF;
END $$;

-- 4. RLS Politikaları
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;

-- Adminler tüm kayıtları görebilir
DROP POLICY IF EXISTS "Admins can view all recordings" ON public.call_recordings;
CREATE POLICY "Admins can view all recordings"
ON public.call_recordings FOR SELECT
USING (TRUE); -- Admin kontrolü uygulama seviyesinde yapılacak

-- Kayıt oluşturma (sistem/servis tarafından)
DROP POLICY IF EXISTS "System can create recordings" ON public.call_recordings;
CREATE POLICY "System can create recordings"
ON public.call_recordings FOR INSERT
WITH CHECK (TRUE);

-- Güncelleme (sistem/servis tarafından)
DROP POLICY IF EXISTS "System can update recordings" ON public.call_recordings;
CREATE POLICY "System can update recordings"
ON public.call_recordings FOR UPDATE
USING (TRUE);

-- 5. Otomatik updated_at trigger
CREATE OR REPLACE FUNCTION update_call_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_call_recordings_updated_at ON public.call_recordings;
CREATE TRIGGER set_call_recordings_updated_at
BEFORE UPDATE ON public.call_recordings
FOR EACH ROW EXECUTE FUNCTION update_call_recordings_updated_at();

-- 6. calls tablosu bittiğinde kayıt işleme trigger
CREATE OR REPLACE FUNCTION on_call_ended()
RETURNS TRIGGER AS $$
BEGIN
  -- Sadece status 'ended' olduğunda ve kayıt varsa işle
  IF NEW.status = 'ended' AND NEW.is_recorded = TRUE AND NEW.recording_id IS NOT NULL THEN
    -- Recording durumunu 'ready' yap
    UPDATE public.call_recordings
    SET status = 'ready', updated_at = NOW()
    WHERE id = NEW.recording_id AND status = 'recording';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_call_ended ON public.calls;
CREATE TRIGGER trigger_call_ended
AFTER UPDATE OF status ON public.calls
FOR EACH ROW
WHEN (NEW.status = 'ended')
EXECUTE FUNCTION on_call_ended();

-- 7. Kayıt özeti view
CREATE OR REPLACE VIEW call_recordings_summary AS
SELECT 
  DATE(cr.created_at) AS date,
  COUNT(*) AS total_recordings,
  COUNT(DISTINCT cr.call_id) AS unique_calls,
  SUM(cr.duration_seconds) AS total_duration_seconds,
  ROUND(AVG(cr.duration_seconds)::numeric, 0) AS avg_duration_seconds,
  SUM(cr.file_size_bytes) AS total_size_bytes,
  ROUND(AVG(cr.file_size_bytes)::numeric, 0) AS avg_size_bytes,
  ROUND(AVG(cr.compression_ratio)::numeric, 2) AS avg_compression_ratio,
  SUM(cr.play_count) AS total_plays
FROM public.call_recordings cr
WHERE cr.status = 'ready' AND cr.deleted_at IS NULL
GROUP BY DATE(cr.created_at)
ORDER BY date DESC;

-- 8. Partner bazlı kayıt istatistikleri view
CREATE OR REPLACE VIEW partner_recording_stats AS
SELECT 
  cr.receiver_id AS partner_id,
  cr.receiver_name AS partner_name,
  COUNT(*) AS total_recordings,
  SUM(cr.duration_seconds) AS total_duration_seconds,
  ROUND(AVG(cr.duration_seconds)::numeric, 0) AS avg_call_duration,
  SUM(cr.file_size_bytes) AS total_storage_bytes,
  MAX(cr.created_at) AS last_recording_at
FROM public.call_recordings cr
WHERE cr.status = 'ready' AND cr.deleted_at IS NULL
GROUP BY cr.receiver_id, cr.receiver_name
ORDER BY total_recordings DESC;

-- 9. Depolama kullanım view
CREATE OR REPLACE VIEW recording_storage_usage AS
SELECT 
  TO_CHAR(cr.created_at, 'YYYY-MM') AS month,
  COUNT(*) AS recording_count,
  SUM(cr.duration_seconds) AS total_seconds,
  SUM(cr.duration_seconds) / 3600.0 AS total_hours,
  SUM(cr.file_size_bytes) AS total_bytes,
  ROUND(SUM(cr.file_size_bytes) / 1024.0 / 1024.0, 2) AS total_mb,
  ROUND(SUM(cr.original_size_bytes) / 1024.0 / 1024.0, 2) AS original_mb,
  ROUND(AVG(cr.compression_ratio)::numeric, 2) AS avg_compression
FROM public.call_recordings cr
WHERE cr.status = 'ready' AND cr.deleted_at IS NULL
GROUP BY TO_CHAR(cr.created_at, 'YYYY-MM')
ORDER BY month DESC;

-- 10. Doğrulama
DO $$ 
BEGIN
  RAISE NOTICE '✅ Call Recordings V1 migration tamamlandı!';
  RAISE NOTICE '📊 Tablo: call_recordings';
  RAISE NOTICE '📊 Views: call_recordings_summary, partner_recording_stats, recording_storage_usage';
  RAISE NOTICE '🎯 Çift Akış Mimarisi hazır: HD canlı görüşme + Opus arşiv';
END $$;
