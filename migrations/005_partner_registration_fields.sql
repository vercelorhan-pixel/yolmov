-- ============================================
-- PARTNER REGISTRATION FORM FIELDS
-- Tarih: Aralık 2025
-- Amaç: PartnerRegisterPage formundan gelen alanları desteklemek için partners tablosuna yeni kolonlar ekleme
-- NOT: Bu migration tekrar çalıştırılabilir (idempotent)
-- ============================================

-- ADIM 1: Mevcut constraint ve index'leri temizle (hata önleme)
-- ============================================
DO $$ 
BEGIN
    -- Unique constraint'i sil (varsa)
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_tax_number' 
        AND conrelid = 'partners'::regclass
    ) THEN
        ALTER TABLE partners DROP CONSTRAINT unique_tax_number;
        RAISE NOTICE '✓ unique_tax_number constraint silindi';
    END IF;

    -- Index'leri sil (varsa)
    DROP INDEX IF EXISTS idx_partners_tax_number;
    DROP INDEX IF EXISTS idx_partners_sector;
    RAISE NOTICE '✓ Eski index''ler silindi';
END $$;

-- ADIM 2: Yeni kolonlar ekle (IF NOT EXISTS ile güvenli)
-- ============================================
ALTER TABLE partners 
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sector VARCHAR(50),
  ADD COLUMN IF NOT EXISTS vehicle_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vehicle_types TEXT,
  ADD COLUMN IF NOT EXISTS commercial_registry_url TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_license_url TEXT;

-- ADIM 3: Mevcut 'name' kolonu verisini company_name'e taşı
-- ============================================
UPDATE partners 
SET company_name = name 
WHERE company_name IS NULL AND name IS NOT NULL;

-- ADIM 4: Yeni index'ler oluştur (performans için)
-- ============================================
CREATE INDEX idx_partners_tax_number ON partners(tax_number);
CREATE INDEX idx_partners_sector ON partners(sector);

-- ADIM 5: Constraint ekle (vergi numarası unique olmalı)
-- ============================================
ALTER TABLE partners 
  ADD CONSTRAINT unique_tax_number UNIQUE (tax_number);

-- ADIM 6: Kolon açıklamaları ekle (dokümantasyon)
-- ============================================
COMMENT ON COLUMN partners.first_name IS 'Partner sahibinin adı';
COMMENT ON COLUMN partners.last_name IS 'Partner sahibinin soyadı';
COMMENT ON COLUMN partners.company_name IS 'Şirket/İşletme adı';
COMMENT ON COLUMN partners.tax_number IS 'TC Kimlik No (11 hane) veya Vergi Kimlik No (10 hane)';
COMMENT ON COLUMN partners.sector IS 'Hizmet sektörü: tow, tire, repair, battery';
COMMENT ON COLUMN partners.vehicle_count IS 'Toplam araç sayısı';
COMMENT ON COLUMN partners.vehicle_types IS 'Araç tipleri (örn: Çekici, Tamirat Aracı)';
COMMENT ON COLUMN partners.commercial_registry_url IS 'Ticari sicil gazetesi belgesi URL';
COMMENT ON COLUMN partners.vehicle_license_url IS 'Araç ruhsat belgesi URL';

-- ============================================
-- BAŞARILI! Migration tamamlandı.
-- ============================================
DO $$ 
BEGIN
    RAISE NOTICE '🎉 Partner registration fields migration başarılı!';
    RAISE NOTICE '✅ 9 yeni kolon eklendi';
    RAISE NOTICE '✅ 2 index oluşturuldu';
    RAISE NOTICE '✅ 1 unique constraint eklendi';
END $$;
