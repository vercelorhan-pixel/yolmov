-- ============================================
-- Migration: completed_jobs tablosuna request_id kolonu ekleme
-- ============================================
-- Tarih: 2025-12-07
-- Açıklama: 
--   partner_reviews oluşturulurken completed_jobs.id gerekiyor
--   Ancak müşteri requests.id'yi biliyor
--   Bu ilişkiyi sağlamak için request_id kolonu ekliyoruz

-- 1. Kolonu ekle
ALTER TABLE completed_jobs
ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES requests(id) ON DELETE CASCADE;

-- 2. İndeks oluştur (hızlı arama için)
CREATE INDEX IF NOT EXISTS idx_completed_jobs_request_id ON completed_jobs(request_id);

-- 3. Yorum ekle
COMMENT ON COLUMN completed_jobs.request_id IS 'İş talebinin (requests) ID''si';

-- ============================================
-- NOT: Bu migration sonrası completed_jobs kaydı oluştururken
-- request_id'yi de eklemeyi unutmayın!
-- ============================================

-- Başarılı migration mesajı
DO $$
BEGIN
  RAISE NOTICE '✅ completed_jobs.request_id kolonu eklendi!';
  RAISE NOTICE '   Artık request_id ile completed_job bulabilirsiniz:';
  RAISE NOTICE '   SELECT * FROM completed_jobs WHERE request_id = ''xxx'';';
END $$;
