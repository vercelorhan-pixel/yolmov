-- ============================================
-- YOLMOV SUPABASE SEED DATA
-- Test ve Geliştirme İçin Başlangıç Verileri
-- ============================================

-- ============================================
-- 1. ADMIN USERS (Test Admin Kullanıcıları)
-- ============================================

INSERT INTO admin_users (id, email, name, role, permissions) VALUES
('a1111111-1111-1111-1111-111111111111'::uuid, 'admin@yolmov.com', 'Super Admin', 'super_admin', ARRAY['all']),
('a2222222-2222-2222-2222-222222222222'::uuid, 'support@yolmov.com', 'Destek Ekibi', 'support', ARRAY['tickets', 'users']),
('a3333333-3333-3333-3333-333333333333'::uuid, 'finance@yolmov.com', 'Finans', 'finance', ARRAY['payments', 'credits', 'reports']),
('a4444444-4444-4444-4444-444444444444'::uuid, 'operations@yolmov.com', 'Operasyon', 'operations', ARRAY['requests', 'partners', 'documents']);

-- ============================================
-- 2. CUSTOMERS (Test Müşterileri)
-- ============================================

INSERT INTO customers (id, first_name, last_name, phone, email, city, district) VALUES
('c1111111-1111-1111-1111-111111111111'::uuid, 'Ahmet', 'Yılmaz', '05321234567', 'ahmet@example.com', 'İstanbul', 'Kadıköy'),
('c2222222-2222-2222-2222-222222222222'::uuid, 'Mehmet', 'Demir', '05331234568', 'mehmet@example.com', 'Ankara', 'Çankaya'),
('c3333333-3333-3333-3333-333333333333'::uuid, 'Ayşe', 'Kaya', '05341234569', 'ayse@example.com', 'İzmir', 'Bornova'),
('c4444444-4444-4444-4444-444444444444'::uuid, 'Fatma', 'Şahin', '05351234570', 'fatma@example.com', 'İstanbul', 'Beşiktaş'),
('c5555555-5555-5555-5555-555555555555'::uuid, 'Ali', 'Çelik', '05361234571', 'ali@example.com', 'Bursa', 'Osmangazi');

-- ============================================
-- 3. PARTNERS (Test Partnerleri)
-- ============================================

INSERT INTO partners (id, name, email, phone, rating, completed_jobs, credits, status, city, district, service_types) VALUES
('11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri', 'hizli@partner.com', '05301234567', 4.8, 150, 50, 'active', 'İstanbul', 'Kadıköy', ARRAY['cekici', 'yardim']::service_type[]),
('22222222-2222-2222-2222-222222222222'::uuid, 'Güvenilir Yol Yardım', 'guvenilir@partner.com', '05302234568', 4.5, 120, 30, 'active', 'İstanbul', 'Beşiktaş', ARRAY['cekici', 'aku', 'lastik']::service_type[]),
('33333333-3333-3333-3333-333333333333'::uuid, 'Express Çekici', 'express@partner.com', '05303234569', 4.9, 200, 100, 'active', 'Ankara', 'Çankaya', ARRAY['cekici']::service_type[]),
('44444444-4444-4444-4444-444444444444'::uuid, '7/24 Yol Yardım', 'yardim724@partner.com', '05304234570', 4.2, 80, 20, 'active', 'İzmir', 'Bornova', ARRAY['cekici', 'yakit', 'yardim']::service_type[]),
('55555555-5555-5555-5555-555555555555'::uuid, 'Yeni Partner A.Ş.', 'yeni@partner.com', '05305234571', 0.0, 0, 0, 'pending', 'Bursa', 'Osmangazi', ARRAY['cekici']::service_type[]);

-- ============================================
-- 4. PARTNER CREDITS (Kredi Bakiyeleri)
-- ============================================

INSERT INTO partner_credits (partner_id, partner_name, balance, total_purchased, total_used, last_transaction) VALUES
('11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri', 50, 100, 50, NOW() - INTERVAL '2 days'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Güvenilir Yol Yardım', 30, 80, 50, NOW() - INTERVAL '5 days'),
('33333333-3333-3333-3333-333333333333'::uuid, 'Express Çekici', 100, 200, 100, NOW() - INTERVAL '1 day'),
('44444444-4444-4444-4444-444444444444'::uuid, '7/24 Yol Yardım', 20, 50, 30, NOW() - INTERVAL '7 days'),
('55555555-5555-5555-5555-555555555555'::uuid, 'Yeni Partner A.Ş.', 0, 0, 0, NULL);

-- ============================================
-- 5. REQUESTS (Test Talepleri)
-- ============================================

INSERT INTO requests (
  id, customer_id, customer_name, service_type, description, from_location, to_location,
  vehicle_info, status, amount, job_stage, assigned_partner_id, assigned_partner_name,
  vehicle_condition, has_load, timing, customer_phone, created_at
) VALUES
-- Tamamlanan iş
('b1111111-1111-1111-1111-111111111111'::uuid, 
 'c1111111-1111-1111-1111-111111111111'::uuid, 'Ahmet Yılmaz', 'cekici', 
 'Araç çalışmıyor', 'Kadıköy, İstanbul', 'Kartal, İstanbul',
 'Renault Megane - 34 ABC 123', 'completed', 1500.00, 4, 
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri',
 'broken', false, 'now', '05321234567', NOW() - INTERVAL '5 days'),

-- Devam eden iş (stage 2)
('b2222222-2222-2222-2222-222222222222'::uuid,
 'c2222222-2222-2222-2222-222222222222'::uuid, 'Mehmet Demir', 'cekici',
 'Kaza sonrası çekici gerekli', 'Çankaya, Ankara', 'Keçiören, Ankara',
 'Volkswagen Golf - 06 DEF 456', 'in_progress', 1800.00, 2,
 '33333333-3333-3333-3333-333333333333'::uuid, 'Express Çekici',
 'broken', false, 'now', '05331234568', NOW() - INTERVAL '2 hours'),

-- Eşleşmiş (teklif kabul edildi, henüz başlamadı)
('b3333333-3333-3333-3333-333333333333'::uuid,
 'c3333333-3333-3333-3333-333333333333'::uuid, 'Ayşe Kaya', 'aku',
 'Akü bitti', 'Bornova, İzmir', NULL,
 'Honda Civic - 35 GHI 789', 'matched', 500.00, 0,
 '44444444-4444-4444-4444-444444444444'::uuid, '7/24 Yol Yardım',
 'running', false, 'now', '05341234569', NOW() - INTERVAL '30 minutes'),

-- Açık talep (teklif bekliyor)
('b4444444-4444-4444-4444-444444444444'::uuid,
 'c4444444-4444-4444-4444-444444444444'::uuid, 'Fatma Şahin', 'lastik',
 'Lastik patladı', 'Beşiktaş, İstanbul', NULL,
 'Toyota Corolla - 34 JKL 012', 'open', NULL, NULL,
 NULL, NULL,
 'running', false, 'now', '05351234570', NOW() - INTERVAL '10 minutes'),

-- İptal edilen talep
('b5555555-5555-5555-5555-555555555555'::uuid,
 'c5555555-5555-5555-5555-555555555555'::uuid, 'Ali Çelik', 'yakit',
 'Yakıt bitti', 'Osmangazi, Bursa', NULL,
 'Ford Focus - 16 MNO 345', 'cancelled', NULL, NULL,
 NULL, NULL,
 'running', false, 'now', '05361234571', NOW() - INTERVAL '1 day');

-- ============================================
-- 6. OFFERS (Test Teklifleri)
-- ============================================

INSERT INTO offers (id, request_id, partner_id, partner_name, price, eta_minutes, message, status) VALUES
-- Tamamlanan iş için kabul edilen teklif
('d1111111-1111-1111-1111-111111111111'::uuid, 'b1111111-1111-1111-1111-111111111111'::uuid, 
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri', 
 1500.00, 20, 'Hemen yola çıkıyoruz', 'accepted'),

-- Devam eden iş için kabul edilen teklif
('d2222222-2222-2222-2222-222222222222'::uuid, 'b2222222-2222-2222-2222-222222222222'::uuid,
 '33333333-3333-3333-3333-333333333333'::uuid, 'Express Çekici',
 1800.00, 15, '15 dakikada oradayız', 'accepted'),

-- Eşleşmiş iş için kabul edilen teklif
('d3333333-3333-3333-3333-333333333333'::uuid, 'b3333333-3333-3333-3333-333333333333'::uuid,
 '44444444-4444-4444-4444-444444444444'::uuid, '7/24 Yol Yardım',
 500.00, 25, 'Akü takviyesi yapabiliriz', 'accepted'),

-- Açık talep için gönderilen teklifler
('d4444444-4444-4444-4444-444444444444'::uuid, 'b4444444-4444-4444-4444-444444444444'::uuid,
 '22222222-2222-2222-2222-222222222222'::uuid, 'Güvenilir Yol Yardım',
 450.00, 30, 'Lastik değişimi hızlıca yapılır', 'sent'),

('d5555555-5555-5555-5555-555555555555'::uuid, 'b4444444-4444-4444-4444-444444444444'::uuid,
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri',
 400.00, 20, 'En yakın ekibimiz geliyor', 'sent');

-- ============================================
-- 7. COMPLETED_JOBS (Tamamlanan İşler)
-- ============================================

INSERT INTO completed_jobs (
  id, partner_id, partner_name, customer_id, customer_name, customer_phone,
  service_type, start_location, end_location, distance, start_time, completion_time,
  duration, total_amount, commission, partner_earning, payment_method, rating,
  vehicle_type, vehicle_plate, status
) VALUES
('e1111111-1111-1111-1111-111111111111'::uuid,
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri',
 'c1111111-1111-1111-1111-111111111111'::uuid, 'Ahmet Yılmaz', '05321234567',
 'cekici', 'Kadıköy, İstanbul', 'Kartal, İstanbul', 15.5,
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '45 minutes',
 45, 1500.00, 225.00, 1275.00, 'kredi_karti', 5,
 'Çekici', '34 ÇEK 100', 'completed'),

('e2222222-2222-2222-2222-222222222222'::uuid,
 '22222222-2222-2222-2222-222222222222'::uuid, 'Güvenilir Yol Yardım',
 'c2222222-2222-2222-2222-222222222222'::uuid, 'Mehmet Demir', '05331234568',
 'lastik', 'Çankaya, Ankara', NULL, 0,
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '20 minutes',
 20, 600.00, 90.00, 510.00, 'nakit', 4,
 'Servis Aracı', '06 SRV 200', 'completed'),

('e3333333-3333-3333-3333-333333333333'::uuid,
 '33333333-3333-3333-3333-333333333333'::uuid, 'Express Çekici',
 'c3333333-3333-3333-3333-333333333333'::uuid, 'Ayşe Kaya', '05341234569',
 'cekici', 'Bornova, İzmir', 'Karşıyaka, İzmir', 12.0,
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '35 minutes',
 35, 1200.00, 180.00, 1020.00, 'kredi_karti', 5,
 'Çekici', '35 ÇEK 300', 'completed');

-- ============================================
-- 8. PARTNER_REVIEWS (Değerlendirmeler)
-- ============================================

INSERT INTO partner_reviews (
  id, job_id, partner_id, partner_name, customer_id, customer_name,
  service, rating, comment, tags
) VALUES
('f1111111-1111-1111-1111-111111111111'::uuid,
 'e1111111-1111-1111-1111-111111111111'::uuid,
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri',
 'c1111111-1111-1111-1111-111111111111'::uuid, 'Ahmet Yılmaz',
 'cekici', 5, 'Çok hızlı ve profesyoneldi. Kesinlikle tavsiye ederim.',
 ARRAY['Hızlı', 'Profesyonel', 'Güler Yüzlü']),

('f2222222-2222-2222-2222-222222222222'::uuid,
 'e2222222-2222-2222-2222-222222222222'::uuid,
 '22222222-2222-2222-2222-222222222222'::uuid, 'Güvenilir Yol Yardım',
 'c2222222-2222-2222-2222-222222222222'::uuid, 'Mehmet Demir',
 'lastik', 4, 'İyi hizmet aldık, teşekkürler.',
 ARRAY['Güvenilir', 'Deneyimli']),

('f3333333-3333-3333-3333-333333333333'::uuid,
 'e3333333-3333-3333-3333-333333333333'::uuid,
 '33333333-3333-3333-3333-333333333333'::uuid, 'Express Çekici',
 'c3333333-3333-3333-3333-333333333333'::uuid, 'Ayşe Kaya',
 'cekici', 5, 'Mükemmel hizmet! Çok memnun kaldım.',
 ARRAY['Hızlı', 'Profesyonel', 'Güvenilir']);

-- ============================================
-- 9. PARTNER_VEHICLES (Partner Araçları)
-- ============================================

INSERT INTO partner_vehicles (
  id, partner_id, partner_name, plate, model, type, driver, status,
  registration_date, total_jobs, total_earnings
) VALUES
('aa111111-1111-1111-1111-111111111111'::uuid,
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri',
 '34 ÇEK 100', 'Ford Cargo 2526', 'Çekici', 'Mehmet Şoför', 'active',
 '2020-01-15', 150, 225000.00),

('aa222222-2222-2222-2222-222222222222'::uuid,
 '22222222-2222-2222-2222-222222222222'::uuid, 'Güvenilir Yol Yardım',
 '06 SRV 200', 'Mercedes Sprinter', 'Servis Aracı', 'Ali Teknisyen', 'active',
 '2021-03-20', 120, 72000.00),

('aa333333-3333-3333-3333-333333333333'::uuid,
 '33333333-3333-3333-3333-333333333333'::uuid, 'Express Çekici',
 '35 ÇEK 300', 'MAN TGM', 'Çekici', 'Ahmet Sürücü', 'active',
 '2019-06-10', 200, 360000.00);

-- ============================================
-- 10. PARTNER_DOCUMENTS (Partner Belgeleri)
-- ============================================

INSERT INTO partner_documents (
  id, partner_id, partner_name, type, file_name, file_size, status,
  upload_date, expiry_date, reviewed_by
) VALUES
('ab111111-1111-1111-1111-111111111111'::uuid,
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri',
 'license', 'surucu_belgesi.pdf', '2.5 MB', 'approved',
 NOW() - INTERVAL '30 days', '2026-12-31', 'a1111111-1111-1111-1111-111111111111'::uuid),

('ab222222-2222-2222-2222-222222222222'::uuid,
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri',
 'insurance', 'sigorta_belgesi.pdf', '1.8 MB', 'approved',
 NOW() - INTERVAL '25 days', '2025-12-31', 'a1111111-1111-1111-1111-111111111111'::uuid),

('ab333333-3333-3333-3333-333333333333'::uuid,
 '55555555-5555-5555-5555-555555555555'::uuid, 'Yeni Partner A.Ş.',
 'license', 'ehliyet.pdf', '1.2 MB', 'pending',
 NOW() - INTERVAL '2 days', '2027-06-30', NULL);

-- ============================================
-- 11. SUPPORT_TICKETS (Destek Talepleri)
-- ============================================

INSERT INTO support_tickets (
  id, partner_id, partner_name, category, priority, subject, description,
  status, assigned_to
) VALUES
('bb111111-1111-1111-1111-111111111111'::uuid,
 '22222222-2222-2222-2222-222222222222'::uuid, 'Güvenilir Yol Yardım',
 'technical', 'medium', 'Mobil uygulama giriş sorunu',
 'Mobil uygulamaya giriş yaparken hata alıyorum.',
 'in_progress', 'a2222222-2222-2222-2222-222222222222'::uuid),

('bb222222-2222-2222-2222-222222222222'::uuid,
 '44444444-4444-4444-4444-444444444444'::uuid, '7/24 Yol Yardım',
 'billing', 'high', 'Ödeme yapılamıyor',
 'Kredi kartımdan ödeme alınamıyor, lütfen kontrol edin.',
 'open', NULL);

-- ============================================
-- 12. CREDIT_TRANSACTIONS (Kredi İşlemleri)
-- ============================================

INSERT INTO credit_transactions (
  id, partner_id, partner_name, type, amount, balance_before, balance_after,
  description, created_at
) VALUES
('cc111111-1111-1111-1111-111111111111'::uuid,
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri',
 'purchase', 100, 0, 100, '100 kredi satın alındı',
 NOW() - INTERVAL '10 days'),

('cc222222-2222-2222-2222-222222222222'::uuid,
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri',
 'usage', -50, 100, 50, 'Talep görüntüleme için kullanıldı',
 NOW() - INTERVAL '2 days'),

('cc333333-3333-3333-3333-333333333333'::uuid,
 '33333333-3333-3333-3333-333333333333'::uuid, 'Express Çekici',
 'purchase', 200, 0, 200, '200 kredi satın alındı',
 NOW() - INTERVAL '15 days');

-- ============================================
-- 13. EMPTY_TRUCK_ROUTES (Boş Araç Rotaları)
-- ============================================

INSERT INTO empty_truck_routes (
  id, partner_id, partner_name, from_city, to_city, departure_date,
  vehicle_type, vehicle_plate, available_capacity, price_per_km, notes, status
) VALUES
('dd111111-1111-1111-1111-111111111111'::uuid,
 '11111111-1111-1111-1111-111111111111'::uuid, 'Hızlı Çekici Hizmetleri',
 'İstanbul', 'Ankara', CURRENT_DATE + INTERVAL '3 days',
 'Çekici', '34 ÇEK 100', 'Tam Kapasite', 25.00,
 'İstanbul-Ankara arası boş dönüş', 'active'),

('dd222222-2222-2222-2222-222222222222'::uuid,
 '33333333-3333-3333-3333-333333333333'::uuid, 'Express Çekici',
 'Ankara', 'İzmir', CURRENT_DATE + INTERVAL '5 days',
 'Çekici', '35 ÇEK 300', 'Yarım Kapasite', 22.00,
 'Ankara-İzmir güzergahı', 'active');

-- ============================================
-- 14. SYSTEM_LOGS (Sistem Logları)
-- ============================================

INSERT INTO system_logs (
  id, admin_id, admin_name, action, entity, entity_id, details, created_at
) VALUES
('ee111111-1111-1111-1111-111111111111'::uuid,
 'a1111111-1111-1111-1111-111111111111'::uuid, 'Super Admin',
 'approve', 'document', 'ab111111-1111-1111-1111-111111111111'::uuid,
 'Partner belgesi onaylandı: Sürücü belgesi',
 NOW() - INTERVAL '30 days'),

('ee222222-2222-2222-2222-222222222222'::uuid,
 'a1111111-1111-1111-1111-111111111111'::uuid, 'Super Admin',
 'approve', 'partner', '11111111-1111-1111-1111-111111111111'::uuid,
 'Partner hesabı aktif edildi: Hızlı Çekici Hizmetleri',
 NOW() - INTERVAL '35 days'),

('ee333333-3333-3333-3333-333333333333'::uuid,
 'a2222222-2222-2222-2222-222222222222'::uuid, 'Destek Ekibi',
 'update', 'ticket', 'bb111111-1111-1111-1111-111111111111'::uuid,
 'Destek talebi işleme alındı',
 NOW() - INTERVAL '1 hour');

-- ============================================
-- SEQUENCE & FUNCTION UPDATES
-- ============================================

-- Partner rating güncellemesi için fonksiyon
CREATE OR REPLACE FUNCTION update_partner_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE partners
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM partner_reviews
    WHERE partner_id = NEW.partner_id
  )
  WHERE id = NEW.partner_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Partner rating otomatik güncelleme trigger'ı
CREATE TRIGGER trigger_update_partner_rating
AFTER INSERT OR UPDATE ON partner_reviews
FOR EACH ROW EXECUTE FUNCTION update_partner_rating();

-- Partner completed_jobs sayısını güncelleyen fonksiyon
CREATE OR REPLACE FUNCTION update_partner_completed_jobs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE partners
  SET completed_jobs = (
    SELECT COUNT(*)
    FROM completed_jobs
    WHERE partner_id = NEW.partner_id AND status = 'completed'
  )
  WHERE id = NEW.partner_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Partner completed_jobs otomatik güncelleme trigger'ı
CREATE TRIGGER trigger_update_partner_completed_jobs
AFTER INSERT ON completed_jobs
FOR EACH ROW EXECUTE FUNCTION update_partner_completed_jobs();

-- Kredi bakiyesi güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_partner_credits_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE partner_credits
  SET 
    balance = NEW.balance_after,
    total_purchased = CASE 
      WHEN NEW.type = 'purchase' THEN total_purchased + NEW.amount
      ELSE total_purchased
    END,
    total_used = CASE 
      WHEN NEW.type = 'usage' THEN total_used + ABS(NEW.amount)
      ELSE total_used
    END,
    last_transaction = NEW.created_at
  WHERE partner_id = NEW.partner_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Kredi işlemi trigger'ı
CREATE TRIGGER trigger_update_partner_credits
AFTER INSERT ON credit_transactions
FOR EACH ROW EXECUTE FUNCTION update_partner_credits_on_transaction();
