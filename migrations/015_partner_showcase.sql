-- =====================================================
-- Migration 015: Partner Showcase (Vitrin) Sistemi
-- Partner'ların B2C kullanıcılarına gösterilecek vitrin bilgileri
-- =====================================================

-- 1. Partners tablosuna vitrin alanları ekle
ALTER TABLE partners ADD COLUMN IF NOT EXISTS showcase_description TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS showcase_working_hours VARCHAR(255);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS showcase_payment_methods TEXT[];
ALTER TABLE partners ADD COLUMN IF NOT EXISTS showcase_is_24_7 BOOLEAN DEFAULT false;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS showcase_satisfaction_rate DECIMAL(5,2);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS showcase_response_time VARCHAR(50);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS showcase_total_reviews INTEGER DEFAULT 0;

-- 2. Partner Vehicles tablosuna vitrin alanları ekle
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS showcase_capacity VARCHAR(100);
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS showcase_insurance_type VARCHAR(100);
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS showcase_equipment TEXT[];
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS showcase_description TEXT;
ALTER TABLE partner_vehicles ADD COLUMN IF NOT EXISTS is_showcase_vehicle BOOLEAN DEFAULT false;

-- 3. İndeksler
CREATE INDEX IF NOT EXISTS idx_partners_showcase_is_24_7 ON partners(showcase_is_24_7) WHERE showcase_is_24_7 = true;
CREATE INDEX IF NOT EXISTS idx_partners_showcase_satisfaction ON partners(showcase_satisfaction_rate) WHERE showcase_satisfaction_rate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_showcase ON partner_vehicles(is_showcase_vehicle) WHERE is_showcase_vehicle = true;

-- 4. Yorumlar
COMMENT ON COLUMN partners.showcase_description IS 'Partner vitrin açıklaması - B2C kullanıcılara gösterilir';
COMMENT ON COLUMN partners.showcase_working_hours IS 'Çalışma saatleri bilgisi, örn: Hafta içi 08:00-20:00, Haftasonu 09:00-18:00';
COMMENT ON COLUMN partners.showcase_payment_methods IS 'Kabul edilen ödeme yöntemleri: nakit, kredi_karti, havale, eft';
COMMENT ON COLUMN partners.showcase_is_24_7 IS '7/24 hizmet veriyor mu?';
COMMENT ON COLUMN partners.showcase_satisfaction_rate IS 'Müşteri memnuniyet oranı (0-100)';
COMMENT ON COLUMN partners.showcase_response_time IS 'Ortalama yanıt süresi, örn: 15-30 dk';
COMMENT ON COLUMN partners.showcase_total_reviews IS 'Toplam değerlendirme sayısı';

COMMENT ON COLUMN partner_vehicles.showcase_capacity IS 'Araç kapasitesi, örn: 3.5 Tona kadar';
COMMENT ON COLUMN partner_vehicles.showcase_insurance_type IS 'Sigorta türü, örn: Taşıma Kaskosu';
COMMENT ON COLUMN partner_vehicles.showcase_equipment IS 'Araç ekipmanları: ahtapot_aparat, vinc, rampa, zincir vb.';
COMMENT ON COLUMN partner_vehicles.showcase_description IS 'Araç açıklaması - B2C kullanıcılara gösterilir';
COMMENT ON COLUMN partner_vehicles.is_showcase_vehicle IS 'Bu araç vitrin aracı mı? (detay sayfasında gösterilecek)';

-- 5. Mevcut verileri varsayılan değerlerle güncelle
UPDATE partners SET 
    showcase_is_24_7 = true,
    showcase_payment_methods = ARRAY['nakit', 'kredi_karti'],
    showcase_response_time = '30-60 dk'
WHERE showcase_description IS NULL;

-- 6. Örnek veri güncelleme (varsa)
UPDATE partner_vehicles SET 
    showcase_capacity = '3.5 Tona kadar',
    showcase_insurance_type = 'Taşıma Kaskosu Var',
    showcase_equipment = ARRAY['Ahtapot Aparat', 'Kayar Kasa'],
    is_showcase_vehicle = true
WHERE is_showcase_vehicle IS NULL OR is_showcase_vehicle = false;
