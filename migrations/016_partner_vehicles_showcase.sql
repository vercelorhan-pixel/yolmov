-- Migration 016: Partner Vehicles Showcase Columns
-- ================================================
-- Araç vitrin özelliklerini ekler

-- Partner Vehicles tablosuna showcase kolonları ekle
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS showcase_capacity VARCHAR(100);
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS showcase_insurance_type VARCHAR(100);
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS showcase_equipment TEXT[];
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS showcase_description TEXT;
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS is_showcase_vehicle BOOLEAN DEFAULT false;
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Comment ekle
COMMENT ON COLUMN partner_vehicles.showcase_capacity IS 'Vitrin için kapasite açıklaması';
COMMENT ON COLUMN partner_vehicles.showcase_insurance_type IS 'Vitrin için sigorta tipi';
COMMENT ON COLUMN partner_vehicles.showcase_equipment IS 'Vitrin için ekipman listesi';
COMMENT ON COLUMN partner_vehicles.showcase_description IS 'Vitrin için araç açıklaması';
COMMENT ON COLUMN partner_vehicles.is_showcase_vehicle IS 'Vitrinde gösterilecek mi?';
COMMENT ON COLUMN partner_vehicles.image_url IS 'Araç resmi URL';

-- İndeks ekle (vitrin sorgularını hızlandırmak için)
CREATE INDEX IF NOT EXISTS idx_vehicles_showcase ON partner_vehicles(is_showcase_vehicle) WHERE is_showcase_vehicle = true;

-- Migration tamamlandı
SELECT 'Migration 016: partner_vehicles showcase columns added successfully' as status;
