-- ============================================
-- ACTIVITY LOGS GEOLOCATION SUPPORT
-- Kullanıcı konum takibi için latitude, longitude, region kolonları
-- ============================================

DO $$ 
BEGIN
  -- Latitude (enlem)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'latitude') THEN
    ALTER TABLE activity_logs ADD COLUMN latitude DECIMAL(10, 8);
    RAISE NOTICE '✅ latitude kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  latitude kolonu zaten mevcut';
  END IF;

  -- Longitude (boylam)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'longitude') THEN
    ALTER TABLE activity_logs ADD COLUMN longitude DECIMAL(11, 8);
    RAISE NOTICE '✅ longitude kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  longitude kolonu zaten mevcut';
  END IF;

  -- Region (bölge/eyalet)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'region') THEN
    ALTER TABLE activity_logs ADD COLUMN region VARCHAR(100);
    RAISE NOTICE '✅ region kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  region kolonu zaten mevcut';
  END IF;

  -- Geolocation source (gps, ip, manual)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'geolocation_source') THEN
    ALTER TABLE activity_logs ADD COLUMN geolocation_source VARCHAR(20);
    RAISE NOTICE '✅ geolocation_source kolonu eklendi';
  ELSE
    RAISE NOTICE 'ℹ️  geolocation_source kolonu zaten mevcut';
  END IF;
END $$;

-- İndeks ekle (coğrafi sorgular için)
CREATE INDEX IF NOT EXISTS idx_activity_logs_latitude ON activity_logs(latitude);
CREATE INDEX IF NOT EXISTS idx_activity_logs_longitude ON activity_logs(longitude);
CREATE INDEX IF NOT EXISTS idx_activity_logs_country ON activity_logs(country);
CREATE INDEX IF NOT EXISTS idx_activity_logs_city ON activity_logs(city);
CREATE INDEX IF NOT EXISTS idx_activity_logs_region ON activity_logs(region);

-- Doğrulama
DO $$ 
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'activity_logs' 
    AND column_name IN ('latitude', 'longitude', 'region', 'geolocation_source');
  
  RAISE NOTICE '📊 Konum kolonları sayısı: % / 4', column_count;
  
  IF column_count = 4 THEN
    RAISE NOTICE '✅ Tüm konum kolonları başarıyla eklendi!';
  ELSE
    RAISE WARNING '⚠️  Bazı kolonlar eklenemedi. Lütfen kontrol edin.';
  END IF;
END $$;
