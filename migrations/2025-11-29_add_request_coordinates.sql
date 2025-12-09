-- Migration: Add coordinate columns to requests table
-- Date: 2025-11-29
-- Amaç: QuoteWizard formunda gönderilen GPS koordinatlarını saklamak
-- Not: TEXT formatında "lat,lon" tutuluyor (ör: 40.123456,29.987654)

ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS from_coordinates TEXT,
  ADD COLUMN IF NOT EXISTS to_coordinates TEXT;

COMMENT ON COLUMN requests.from_coordinates IS 'Başlangıç konumu GPS koordinatları (lat,lon)';
COMMENT ON COLUMN requests.to_coordinates IS 'Hedef konumu GPS koordinatları (lat,lon)';
