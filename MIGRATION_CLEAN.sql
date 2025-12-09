-- ========================================
-- YOLMOV PARTNER SETTINGS MIGRATIONS
-- ========================================

-- 1. Partners Table - Settings Fields
ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS mersis_no VARCHAR(16);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS foundation_year INTEGER;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS authorized_person VARCHAR(100);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(20);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS landline_phone VARCHAR(20);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS business_address TEXT;

-- 2. Partner Vehicles Table - Missing Columns
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS brand VARCHAR(50);
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS model VARCHAR(50);
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS year INTEGER;

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_partners_mersis_no ON partners(mersis_no);
CREATE INDEX IF NOT EXISTS idx_partners_tax_office ON partners(tax_office);
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_brand ON partner_vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_model ON partner_vehicles(model);
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_year ON partner_vehicles(year);

-- 4. Update existing vehicle records with default values
UPDATE partner_vehicles SET brand = 'Unknown' WHERE brand IS NULL;
UPDATE partner_vehicles SET model = 'Unknown' WHERE model IS NULL;
UPDATE partner_vehicles SET year = 2020 WHERE year IS NULL;

-- 5. Comments for Documentation
COMMENT ON COLUMN partners.logo_url IS 'Company logo URL from Supabase Storage';
COMMENT ON COLUMN partners.profile_photo_url IS 'Profile photo URL from Supabase Storage';
COMMENT ON COLUMN partners.mersis_no IS 'Mersis (Central Registration System) number';
COMMENT ON COLUMN partners.tax_office IS 'Tax office name where the company is registered';
COMMENT ON COLUMN partners.foundation_year IS 'Year the company was founded';
COMMENT ON COLUMN partners.authorized_person IS 'Name of the authorized person for contact';
COMMENT ON COLUMN partners.mobile_phone IS 'Mobile phone number of authorized person';
COMMENT ON COLUMN partners.landline_phone IS 'Landline phone number of the company';
COMMENT ON COLUMN partners.emergency_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN partners.business_address IS 'Detailed business address';
COMMENT ON COLUMN partner_vehicles.brand IS 'Vehicle brand/manufacturer name';
COMMENT ON COLUMN partner_vehicles.model IS 'Vehicle model name';
COMMENT ON COLUMN partner_vehicles.year IS 'Vehicle manufacturing year';
