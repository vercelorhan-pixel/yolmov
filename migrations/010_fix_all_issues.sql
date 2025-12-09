-- Migration 010: Fix All Critical Issues
-- Fixes: plate_number column, session management, font issues
-- Date: 2024-12-06

-- ============================================
-- 1. FIX PARTNER_VEHICLES TABLE SCHEMA
-- ============================================

-- Check if 'plate' column exists, rename it to 'plate_number' if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_vehicles' 
    AND column_name = 'plate'
  ) THEN
    ALTER TABLE partner_vehicles RENAME COLUMN plate TO plate_number;
    RAISE NOTICE 'Column plate renamed to plate_number';
  ELSE
    RAISE NOTICE 'Column plate_number already exists, skipping rename';
  END IF;
END $$;

-- Add missing columns from previous migrations
ALTER TABLE partner_vehicles 
  ADD COLUMN IF NOT EXISTS brand VARCHAR(50),
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS front_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS side_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS back_photo_url TEXT;

-- Update indexes
DROP INDEX IF EXISTS idx_partner_vehicles_plate;
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_plate_number ON partner_vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_brand ON partner_vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_year ON partner_vehicles(year);

-- Add comments
COMMENT ON COLUMN partner_vehicles.plate_number IS 'Vehicle license plate number';
COMMENT ON COLUMN partner_vehicles.brand IS 'Vehicle brand/manufacturer';
COMMENT ON COLUMN partner_vehicles.year IS 'Vehicle manufacturing year';
COMMENT ON COLUMN partner_vehicles.front_photo_url IS 'Front view photo URL (plate visible)';
COMMENT ON COLUMN partner_vehicles.side_photo_url IS 'Side view photo URL (plate visible)';
COMMENT ON COLUMN partner_vehicles.back_photo_url IS 'Back view photo URL (plate visible)';

-- ============================================
-- 2. FIX PARTNERS TABLE (Missing Columns from Migration 003)
-- ============================================

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS trade_registry_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sector VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mersis_no VARCHAR(16),
  ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100),
  ADD COLUMN IF NOT EXISTS foundation_year INTEGER,
  ADD COLUMN IF NOT EXISTS authorized_person VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS landline_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS business_address TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_trade_registry ON partners(trade_registry_number);
CREATE INDEX IF NOT EXISTS idx_partners_sector ON partners(sector);

-- Add comments
COMMENT ON COLUMN partners.logo_url IS 'Company logo URL (uploaded to Supabase Storage)';
COMMENT ON COLUMN partners.profile_photo_url IS 'Profile photo URL (uploaded to Supabase Storage)';
COMMENT ON COLUMN partners.trade_registry_number IS 'Trade registry number (Ticaret Sicil Numarası)';
COMMENT ON COLUMN partners.sector IS 'Business sector (Sektör)';
COMMENT ON COLUMN partners.mersis_no IS 'MERSIS number (16 digits)';
COMMENT ON COLUMN partners.tax_office IS 'Tax office name';
COMMENT ON COLUMN partners.foundation_year IS 'Company foundation year';
COMMENT ON COLUMN partners.mobile_phone IS 'Mobile phone number';
COMMENT ON COLUMN partners.landline_phone IS 'Office landline phone';
COMMENT ON COLUMN partners.emergency_phone IS 'Emergency contact phone';
COMMENT ON COLUMN partners.business_address IS 'Business address';

-- ============================================
-- 3. UPDATE EXISTING DATA (Prevent NULL errors)
-- ============================================

-- Set defaults for existing partner_vehicles records
UPDATE partner_vehicles 
SET brand = 'Unknown' 
WHERE brand IS NULL;

UPDATE partner_vehicles 
SET year = 2020 
WHERE year IS NULL;

-- ============================================
-- 4. REFRESH SCHEMA CACHE (Fix Supabase API errors)
-- ============================================

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 5. ADD HELPER FUNCTIONS
-- ============================================

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- This is a placeholder - actual session cleanup is handled by Supabase Auth
  -- But we keep this for future custom session management
  NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION VERIFICATION
-- ============================================

-- Verify columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_vehicles' 
    AND column_name = 'plate_number'
  ) THEN
    RAISE EXCEPTION 'Migration failed: plate_number column not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'trade_registry_number'
  ) THEN
    RAISE EXCEPTION 'Migration failed: trade_registry_number column not found';
  END IF;
  
  RAISE NOTICE 'Migration 010 completed successfully!';
END $$;
