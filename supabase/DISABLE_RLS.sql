-- ============================================
-- DISABLE RLS FOR DEVELOPMENT
-- Tüm tablolar için RLS'i kapat (geçici)
-- ============================================

-- RLS'i tüm tablolarda devre dışı bırak
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE completed_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE review_objections DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_credits DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE empty_truck_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE partner_lead_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_area_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs DISABLE ROW LEVEL SECURITY;

-- ✅ BU SQL'i Supabase Dashboard > SQL Editor'de çalıştır
-- Development sırasında RLS sonsuz döngü sorununu çözer
