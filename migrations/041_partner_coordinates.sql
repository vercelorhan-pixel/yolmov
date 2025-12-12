-- =============================================
-- Migration 041: Partner Konum Koordinatları
-- Son kullanıcı ile partner arası mesafe hesaplaması için
-- =============================================

DO $$
BEGIN
  -- Latitude (enlem) kolonu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'latitude') THEN
    ALTER TABLE partners ADD COLUMN latitude DECIMAL(10, 8);
    RAISE NOTICE '✅ partners.latitude kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  partners.latitude kolonu zaten mevcut';
  END IF;

  -- Longitude (boylam) kolonu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'longitude') THEN
    ALTER TABLE partners ADD COLUMN longitude DECIMAL(11, 8);
    RAISE NOTICE '✅ partners.longitude kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  partners.longitude kolonu zaten mevcut';
  END IF;

  -- Koordinat kaynağı (nominatim, manual, google)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'coordinates_source') THEN
    ALTER TABLE partners ADD COLUMN coordinates_source VARCHAR(50);
    RAISE NOTICE '✅ partners.coordinates_source kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  partners.coordinates_source kolonu zaten mevcut';
  END IF;

  -- Koordinat son güncellenme tarihi
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'coordinates_updated_at') THEN
    ALTER TABLE partners ADD COLUMN coordinates_updated_at TIMESTAMPTZ;
    RAISE NOTICE '✅ partners.coordinates_updated_at kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  partners.coordinates_updated_at kolonu zaten mevcut';
  END IF;
END $$;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_partners_latitude ON partners(latitude);
CREATE INDEX IF NOT EXISTS idx_partners_longitude ON partners(longitude);
CREATE INDEX IF NOT EXISTS idx_partners_location ON partners(latitude, longitude);

-- Verify
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'partners' 
  AND column_name IN ('latitude', 'longitude', 'coordinates_source', 'coordinates_updated_at')
ORDER BY column_name;
