-- ============================================
-- YOLMOV SUPABASE CLEANUP
-- Tüm Tabloları, Policies ve ENUM'ları Sil
-- ============================================

-- ÖNCE BU DOSYAYI ÇALIŞTIR!

-- ============================================
-- 1. TRIGGERS SİL
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_partner_credits ON credit_transactions;
DROP TRIGGER IF EXISTS trigger_update_partner_completed_jobs ON completed_jobs;
DROP TRIGGER IF EXISTS trigger_update_partner_rating ON partner_reviews;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
DROP TRIGGER IF EXISTS update_partner_vehicles_updated_at ON partner_vehicles;
DROP TRIGGER IF EXISTS update_partner_credits_updated_at ON partner_credits;

-- ============================================
-- 2. FUNCTIONS SİL
-- ============================================

DROP FUNCTION IF EXISTS update_partner_credits_on_transaction();
DROP FUNCTION IF EXISTS update_partner_completed_jobs();
DROP FUNCTION IF EXISTS update_partner_rating();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================
-- 3. VIEWS SİL
-- ============================================

DROP VIEW IF EXISTS daily_stats;
DROP VIEW IF EXISTS customer_stats;
DROP VIEW IF EXISTS partner_stats;

-- ============================================
-- 4. TABLOLARI SİL (Foreign key sırasına göre)
-- ============================================

DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS service_area_requests CASCADE;
DROP TABLE IF EXISTS partner_lead_requests CASCADE;
DROP TABLE IF EXISTS empty_truck_routes CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS partner_credits CASCADE;
DROP TABLE IF EXISTS partner_vehicles CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS partner_documents CASCADE;
DROP TABLE IF EXISTS review_objections CASCADE;
DROP TABLE IF EXISTS partner_reviews CASCADE;
DROP TABLE IF EXISTS completed_jobs CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- ============================================
-- 5. ENUM'LARI SİL
-- ============================================

DROP TYPE IF EXISTS urgency CASCADE;
DROP TYPE IF EXISTS timing CASCADE;
DROP TYPE IF EXISTS vehicle_condition CASCADE;
DROP TYPE IF EXISTS service_type CASCADE;
DROP TYPE IF EXISTS route_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS vehicle_status CASCADE;
DROP TYPE IF EXISTS ticket_priority CASCADE;
DROP TYPE IF EXISTS ticket_category CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_type CASCADE;
DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS offer_status CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;

-- ============================================
-- TAMAMLANDI!
-- ============================================

-- Şimdi sırayla çalıştır:
-- 1. schema.sql
-- 2. rls-policies.sql  
-- 3. seed.sql
