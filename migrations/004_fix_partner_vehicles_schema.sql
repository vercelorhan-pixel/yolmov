-- Migration: Fix Partner Vehicles Schema
-- Description: Add missing brand, model, year columns to partner_vehicles table
-- Author: Yolmov Dev Team
-- Date: 2024-12-05

-- Add missing columns
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS brand VARCHAR(50);
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS model VARCHAR(50);
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS front_photo_url TEXT;
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS side_photo_url TEXT;
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS back_photo_url TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_brand ON partner_vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_model ON partner_vehicles(model);
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_year ON partner_vehicles(year);

-- Add comments
COMMENT ON COLUMN partner_vehicles.brand IS 'Vehicle brand/manufacturer name';
COMMENT ON COLUMN partner_vehicles.model IS 'Vehicle model name';
COMMENT ON COLUMN partner_vehicles.year IS 'Vehicle manufacturing year';
COMMENT ON COLUMN partner_vehicles.front_photo_url IS 'Front view photo URL (plate visible)';
COMMENT ON COLUMN partner_vehicles.side_photo_url IS 'Side view photo URL (plate visible)';
COMMENT ON COLUMN partner_vehicles.back_photo_url IS 'Back view photo URL (plate visible)';

-- Update existing records with default values if needed
UPDATE partner_vehicles SET brand = 'Unknown' WHERE brand IS NULL;
UPDATE partner_vehicles SET model = 'Unknown' WHERE model IS NULL;
UPDATE partner_vehicles SET year = 2020 WHERE year IS NULL;
