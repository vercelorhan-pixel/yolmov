-- Migration: Extend Partner Settings
-- Description: Add logo, profile photo, company details, and contact information fields to partners table
-- Author: Yolmov Dev Team
-- Date: 2024-01-15

-- Add logo and profile photo fields
ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add company information fields
ALTER TABLE partners ADD COLUMN IF NOT EXISTS trade_registry_number VARCHAR(50);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS mersis_no VARCHAR(16);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS foundation_year INTEGER;

-- Add contact information fields
ALTER TABLE partners ADD COLUMN IF NOT EXISTS authorized_person VARCHAR(100);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(20);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS landline_phone VARCHAR(20);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS business_address TEXT;

-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_partners_trade_registry ON partners(trade_registry_number);
CREATE INDEX IF NOT EXISTS idx_partners_mersis_no ON partners(mersis_no);
CREATE INDEX IF NOT EXISTS idx_partners_tax_office ON partners(tax_office);
CREATE INDEX IF NOT EXISTS idx_partners_sector ON partners(sector);

-- Add comments for documentation
COMMENT ON COLUMN partners.logo_url IS 'Company logo URL from Supabase Storage';
COMMENT ON COLUMN partners.profile_photo_url IS 'Profile photo URL from Supabase Storage';
COMMENT ON COLUMN partners.trade_registry_number IS 'Trade registry number (Ticaret Sicil No)';
COMMENT ON COLUMN partners.mersis_no IS 'Mersis (Central Registration System) number';
COMMENT ON COLUMN partners.tax_office IS 'Tax office name where the company is registered';
COMMENT ON COLUMN partners.sector IS 'Business sector/industry';
COMMENT ON COLUMN partners.foundation_year IS 'Year the company was founded';
COMMENT ON COLUMN partners.authorized_person IS 'Name of the authorized person for contact';
COMMENT ON COLUMN partners.mobile_phone IS 'Mobile phone number of authorized person';
COMMENT ON COLUMN partners.landline_phone IS 'Landline phone number of the company';
COMMENT ON COLUMN partners.emergency_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN partners.business_address IS 'Detailed business address';
