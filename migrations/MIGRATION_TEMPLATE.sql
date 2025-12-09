-- ============================================
-- MIGRATION TEMPLATE
-- NOT: Tüm migration'lar idempotent (tekrar çalıştırılabilir) olmalıdır!
-- ============================================

-- ADIM 1: Mevcut constraint/index/trigger'ları temizle
-- ============================================
DO $$ 
BEGIN
    -- Constraint kontrolü ve silme
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'constraint_adi' 
        AND conrelid = 'tablo_adi'::regclass
    ) THEN
        ALTER TABLE tablo_adi DROP CONSTRAINT constraint_adi;
        RAISE NOTICE '✓ constraint_adi silindi';
    END IF;

    -- Index silme
    DROP INDEX IF EXISTS idx_tablo_kolon;
    RAISE NOTICE '✓ Eski index''ler silindi';

    -- Trigger silme
    DROP TRIGGER IF EXISTS trigger_adi ON tablo_adi;
    RAISE NOTICE '✓ Eski trigger''lar silindi';
END $$;

-- ADIM 2: Tablo oluştur veya kolon ekle
-- ============================================
-- Yeni tablo oluşturma (DROP TABLE öncesi)
DROP TABLE IF EXISTS yeni_tablo CASCADE;
CREATE TABLE yeni_tablo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VEYA mevcut tabloya kolon ekleme
ALTER TABLE mevcut_tablo
  ADD COLUMN IF NOT EXISTS yeni_kolon VARCHAR(255),
  ADD COLUMN IF NOT EXISTS baska_kolon INTEGER DEFAULT 0;

-- ADIM 3: Veri güncelleme (gerekirse)
-- ============================================
UPDATE tablo_adi 
SET yeni_kolon = eski_kolon 
WHERE yeni_kolon IS NULL;

-- ADIM 4: Index oluştur
-- ============================================
CREATE INDEX idx_tablo_kolon ON tablo_adi(kolon_adi);
CREATE INDEX idx_tablo_multi ON tablo_adi(kolon1, kolon2);

-- ADIM 5: Constraint ekle
-- ============================================
ALTER TABLE tablo_adi 
  ADD CONSTRAINT constraint_adi UNIQUE (kolon_adi);

ALTER TABLE tablo_adi
  ADD CONSTRAINT fk_constraint FOREIGN KEY (kolon_adi) 
  REFERENCES baska_tablo(id) ON DELETE CASCADE;

-- ADIM 6: Trigger ekle (gerekirse)
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timestamp
    BEFORE UPDATE ON tablo_adi
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ADIM 7: Kolon açıklamaları
-- ============================================
COMMENT ON TABLE yeni_tablo IS 'Tablo açıklaması';
COMMENT ON COLUMN tablo_adi.kolon_adi IS 'Kolon açıklaması';

-- ============================================
-- BAŞARILI! Migration tamamlandı.
-- ============================================
DO $$ 
BEGIN
    RAISE NOTICE '🎉 Migration başarılı!';
    RAISE NOTICE '✅ Değişiklik özeti buraya';
END $$;

-- ============================================
-- ROLLBACK (Geri alma - gerekirse)
-- ============================================
/*
-- Bu migration'ı geri almak için:

DROP TABLE IF EXISTS yeni_tablo CASCADE;

ALTER TABLE mevcut_tablo
  DROP COLUMN IF EXISTS yeni_kolon,
  DROP COLUMN IF EXISTS baska_kolon;

DROP INDEX IF EXISTS idx_tablo_kolon;
DROP CONSTRAINT IF EXISTS constraint_adi ON tablo_adi;

RAISE NOTICE '♻️ Migration geri alındı';
*/
