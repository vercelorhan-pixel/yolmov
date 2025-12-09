-- Migration: Add address column to partners table
-- Date: 2025-12-05
-- Description: Partner adres bilgisi için address kolonu ekleniyor

-- Add address column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' AND column_name = 'address'
  ) THEN
    ALTER TABLE partners ADD COLUMN address TEXT;
    COMMENT ON COLUMN partners.address IS 'Partner firma adresi (şehir, ilçe, mahalle, cadde vb.)';
  END IF;
END $$;

-- Index oluştur (isteğe bağlı, arama performansı için)
-- CREATE INDEX IF NOT EXISTS idx_partners_address ON partners USING gin(to_tsvector('turkish', address));
