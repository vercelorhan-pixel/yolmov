-- ============================================
-- PARTNERS NAME CONSTRAINT FIX
-- Amaç: 'name' NOT NULL hatasını kalıcı olarak çözmek
-- Çözüm: NOT NULL kaldır + BEFORE INSERT/UPDATE trigger ile name doldur
-- Idempotent: Güvenli tekrar çalıştırma
-- ============================================

-- 1) 'name' kolonundaki NOT NULL constraint'i kaldır (varsa)
DO $$
BEGIN
  -- NOT NULL kaldırma (PostgreSQL'de doğrudan ALTER COLUMN DROP NOT NULL)
  ALTER TABLE partners ALTER COLUMN name DROP NOT NULL;
  RAISE NOTICE '✓ partners.name DROP NOT NULL';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠ partners.name DROP NOT NULL atlandı: %', SQLERRM;
END $$;

-- 2) Trigger function oluştur (name boşsa company_name veya email ile doldur)
CREATE OR REPLACE FUNCTION partners_fill_name()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT/UPDATE öncesi name boşsa doldur
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    NEW.name := COALESCE(NULLIF(trim(NEW.company_name), ''), NULLIF(trim(NEW.email), ''), 'Partner');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Trigger ekle (idempotent: önce varsa sil, sonra ekle)
DO $$
BEGIN
  -- Eski trigger'ı sil
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'partners_fill_name_trigger'
  ) THEN
    DROP TRIGGER partners_fill_name_trigger ON partners;
  END IF;

  -- Yeni trigger oluştur
  CREATE TRIGGER partners_fill_name_trigger
  BEFORE INSERT OR UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION partners_fill_name();
  RAISE NOTICE '✓ partners_fill_name_trigger oluşturuldu';
END $$;

-- 4) Mevcut verileri düzelt (name NULL olanları doldur)
UPDATE partners
SET name = COALESCE(NULLIF(trim(company_name), ''), NULLIF(trim(email), ''), 'Partner')
WHERE name IS NULL OR trim(name) = '';

-- 5) Başarılı mesaj
DO $$
BEGIN
  RAISE NOTICE '🎉 partners.name constraint fix tamamlandı';
END $$;
