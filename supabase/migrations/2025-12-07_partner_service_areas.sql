-- ============================================
-- MIGRATION: Partner Hizmet Bölgeleri ve Araç Dönüş Rotaları
-- Tarih: 7 Aralık 2025
-- Versiyon: 014
-- ============================================

-- ENUM Type for route status (if not exists)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'route_status') THEN
    CREATE TYPE route_status AS ENUM ('active', 'completed', 'cancelled');
  END IF;
END $$;

-- Helper function for updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. PARTNER_SERVICE_AREAS TABLE (Partner Hizmet Bölgeleri)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  city VARCHAR(100) NOT NULL,           -- İl adı
  districts TEXT[],                      -- Hizmet verilen ilçeler (NULL = tüm il)
  is_primary BOOLEAN DEFAULT FALSE,      -- Ana hizmet bölgesi mi?
  price_multiplier DECIMAL(3,2) DEFAULT 1.00, -- Bölgeye özel fiyat çarpanı
  is_active BOOLEAN DEFAULT TRUE,        -- Aktif mi?
  notes TEXT,                            -- Ek notlar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_partner_city UNIQUE(partner_id, city)
);

-- Indexler
CREATE INDEX idx_partner_service_areas_partner ON partner_service_areas(partner_id);
CREATE INDEX idx_partner_service_areas_city ON partner_service_areas(city);
CREATE INDEX idx_partner_service_areas_active ON partner_service_areas(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_partner_service_areas_primary ON partner_service_areas(is_primary) WHERE is_primary = TRUE;

-- Updated_at trigger
CREATE TRIGGER update_partner_service_areas_updated_at 
  BEFORE UPDATE ON partner_service_areas 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. VEHICLE_RETURN_ROUTES TABLE (Araç Boş Dönüş Rotaları)
-- ============================================

CREATE TABLE IF NOT EXISTS vehicle_return_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES partner_vehicles(id) ON DELETE SET NULL,
  
  -- Rota Bilgileri
  origin_city VARCHAR(100) NOT NULL,      -- Mevcut konum (başlangıç)
  destination_city VARCHAR(100) NOT NULL, -- Hedef (genelde ana hizmet bölgesi)
  route_cities TEXT[] NOT NULL,           -- Geçilen iller sırasıyla [Antalya, Burdur, Isparta, Afyon, Kütahya]
  
  -- Zamanlama
  departure_date DATE NOT NULL,
  departure_time TIME,
  estimated_arrival TIMESTAMPTZ,
  
  -- Araç Bilgileri
  vehicle_type VARCHAR(100) NOT NULL,
  vehicle_plate VARCHAR(20) NOT NULL,
  driver_name VARCHAR(255),
  driver_phone VARCHAR(20),
  available_capacity VARCHAR(100),        -- Boş kapasite açıklaması
  
  -- Fiyatlandırma
  price_per_km DECIMAL(10,2),
  discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  min_price DECIMAL(10,2),
  
  -- Durum
  status route_status DEFAULT 'active',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX idx_return_routes_partner ON vehicle_return_routes(partner_id);
CREATE INDEX idx_return_routes_cities ON vehicle_return_routes USING GIN(route_cities);
CREATE INDEX idx_return_routes_status ON vehicle_return_routes(status);
CREATE INDEX idx_return_routes_departure ON vehicle_return_routes(departure_date);
CREATE INDEX idx_return_routes_origin ON vehicle_return_routes(origin_city);
CREATE INDEX idx_return_routes_destination ON vehicle_return_routes(destination_city);
CREATE INDEX idx_return_routes_active ON vehicle_return_routes(status, departure_date) 
  WHERE status = 'active' AND departure_date >= CURRENT_DATE;

-- Updated_at trigger
CREATE TRIGGER update_vehicle_return_routes_updated_at 
  BEFORE UPDATE ON vehicle_return_routes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. RLS POLİTİKALARI
-- ============================================

-- Partner Service Areas RLS
ALTER TABLE partner_service_areas ENABLE ROW LEVEL SECURITY;

-- Herkes aktif hizmet bölgelerini okuyabilir (public listing için)
CREATE POLICY "partner_service_areas_public_read" 
  ON partner_service_areas FOR SELECT 
  USING (is_active = TRUE);

-- Partner kendi hizmet bölgelerini yönetebilir
CREATE POLICY "partner_service_areas_partner_all" 
  ON partner_service_areas FOR ALL 
  USING (partner_id = auth.uid());

-- Admin tüm kayıtları yönetebilir
CREATE POLICY "partner_service_areas_admin_all" 
  ON partner_service_areas FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- Vehicle Return Routes RLS
ALTER TABLE vehicle_return_routes ENABLE ROW LEVEL SECURITY;

-- Herkes aktif rotaları okuyabilir
CREATE POLICY "return_routes_public_read" 
  ON vehicle_return_routes FOR SELECT 
  USING (status = 'active' AND departure_date >= CURRENT_DATE);

-- Partner kendi rotalarını yönetebilir
CREATE POLICY "return_routes_partner_all" 
  ON vehicle_return_routes FOR ALL 
  USING (partner_id = auth.uid());

-- Admin tüm rotaları yönetebilir
CREATE POLICY "return_routes_admin_all" 
  ON vehicle_return_routes FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- ============================================
-- 4. YARDIMCI FONKSİYONLAR
-- ============================================

-- Bir şehirde hizmet veren partnerleri bul
CREATE OR REPLACE FUNCTION get_partners_by_service_area(target_city VARCHAR)
RETURNS TABLE (
  partner_id UUID,
  partner_name VARCHAR,
  partner_rating DECIMAL,
  is_primary_area BOOLEAN,
  price_multiplier DECIMAL,
  source VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as partner_id,
    p.name as partner_name,
    p.rating as partner_rating,
    psa.is_primary as is_primary_area,
    psa.price_multiplier,
    'service_area'::VARCHAR as source
  FROM partners p
  INNER JOIN partner_service_areas psa ON p.id = psa.partner_id
  WHERE psa.city = target_city
    AND psa.is_active = TRUE
    AND p.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Bir şehirden geçen boş dönüş rotalarını bul
CREATE OR REPLACE FUNCTION get_return_routes_by_city(target_city VARCHAR)
RETURNS TABLE (
  route_id UUID,
  partner_id UUID,
  partner_name VARCHAR,
  partner_rating DECIMAL,
  origin_city VARCHAR,
  destination_city VARCHAR,
  route_cities TEXT[],
  departure_date DATE,
  vehicle_type VARCHAR,
  vehicle_plate VARCHAR,
  discount_percent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vrr.id as route_id,
    vrr.partner_id,
    p.name as partner_name,
    p.rating as partner_rating,
    vrr.origin_city,
    vrr.destination_city,
    vrr.route_cities,
    vrr.departure_date,
    vrr.vehicle_type,
    vrr.vehicle_plate,
    vrr.discount_percent
  FROM vehicle_return_routes vrr
  INNER JOIN partners p ON vrr.partner_id = p.id
  WHERE target_city = ANY(vrr.route_cities)
    AND vrr.status = 'active'
    AND vrr.departure_date >= CURRENT_DATE
    AND p.status = 'active'
  ORDER BY vrr.departure_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Kombine sorgu: Hem hizmet bölgesi hem boş dönüş
CREATE OR REPLACE FUNCTION get_available_partners_for_city(target_city VARCHAR)
RETURNS TABLE (
  partner_id UUID,
  partner_name VARCHAR,
  partner_rating DECIMAL,
  source VARCHAR,
  route_id UUID,
  discount_percent INTEGER,
  is_primary_area BOOLEAN,
  departure_date DATE
) AS $$
BEGIN
  RETURN QUERY
  -- Hizmet bölgesi olan partnerler
  SELECT 
    p.id as partner_id,
    p.name as partner_name,
    p.rating as partner_rating,
    'service_area'::VARCHAR as source,
    NULL::UUID as route_id,
    0 as discount_percent,
    psa.is_primary as is_primary_area,
    NULL::DATE as departure_date
  FROM partners p
  INNER JOIN partner_service_areas psa ON p.id = psa.partner_id
  WHERE psa.city = target_city
    AND psa.is_active = TRUE
    AND p.status = 'active'
  
  UNION ALL
  
  -- Boş dönüş rotası geçen partnerler
  SELECT 
    p.id as partner_id,
    p.name as partner_name,
    p.rating as partner_rating,
    'return_route'::VARCHAR as source,
    vrr.id as route_id,
    vrr.discount_percent,
    FALSE as is_primary_area,
    vrr.departure_date
  FROM partners p
  INNER JOIN vehicle_return_routes vrr ON p.id = vrr.partner_id
  WHERE target_city = ANY(vrr.route_cities)
    AND vrr.status = 'active'
    AND vrr.departure_date >= CURRENT_DATE
    AND p.status = 'active'
    -- Hizmet bölgesi olanları hariç tut (duplicate önleme)
    AND NOT EXISTS (
      SELECT 1 FROM partner_service_areas psa2 
      WHERE psa2.partner_id = p.id 
        AND psa2.city = target_city 
        AND psa2.is_active = TRUE
    )
  
  ORDER BY partner_rating DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENTS
-- ============================================

COMMENT ON TABLE partner_service_areas IS 'Partner hizmet bölgeleri - Hangi illere hizmet verdikleri';
COMMENT ON TABLE vehicle_return_routes IS 'Araç boş dönüş rotaları - Boş dönen araçların güzergahları';

COMMENT ON COLUMN partner_service_areas.districts IS 'Hizmet verilen ilçeler dizisi. NULL ise tüm il.';
COMMENT ON COLUMN partner_service_areas.is_primary IS 'Ana hizmet bölgesi mi? (Öncelikli gösterim için)';
COMMENT ON COLUMN partner_service_areas.price_multiplier IS 'Bölgeye özel fiyat çarpanı (1.00 = standart)';

COMMENT ON COLUMN vehicle_return_routes.route_cities IS 'Geçilen iller sırasıyla. Örn: [Antalya, Burdur, Isparta, Afyon, Kütahya]';
COMMENT ON COLUMN vehicle_return_routes.discount_percent IS 'Boş dönüş indirimi yüzdesi (0-100)';

COMMENT ON FUNCTION get_partners_by_service_area IS 'Belirtilen şehirde hizmet veren partnerleri döndürür';
COMMENT ON FUNCTION get_return_routes_by_city IS 'Belirtilen şehirden geçen aktif boş dönüş rotalarını döndürür';
COMMENT ON FUNCTION get_available_partners_for_city IS 'Bir şehir için uygun tüm partnerleri (hizmet bölgesi + boş dönüş) döndürür';
