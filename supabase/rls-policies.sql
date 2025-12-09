-- ============================================
-- YOLMOV SUPABASE RLS POLICIES
-- Row Level Security - Satır Seviyesi Güvenlik Politikaları
-- ============================================

-- RLS'i tüm tablolarda etkinleştir
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE empty_truck_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_lead_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_area_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. CUSTOMERS POLICIES
-- ============================================

-- Yeni kayıt olan kullanıcılar kendi customer kaydını oluşturabilsin
CREATE POLICY "Users can insert their own customer record"
ON customers FOR INSERT
WITH CHECK (auth.uid()::text = id::text);

-- Müşteriler sadece kendi bilgilerini görebilir
CREATE POLICY "Customers can view their own data"
ON customers FOR SELECT
USING (auth.uid()::text = id::text);

-- Müşteriler kendi bilgilerini güncelleyebilir
CREATE POLICY "Customers can update their own data"
ON customers FOR UPDATE
USING (auth.uid()::text = id::text);

-- Adminler tüm müşterileri görebilir
CREATE POLICY "Admins can view all customers"
ON customers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 2. PARTNERS POLICIES
-- ============================================

-- Partnerler sadece kendi bilgilerini görebilir
CREATE POLICY "Partners can view their own data"
ON partners FOR SELECT
USING (auth.uid()::text = id::text);

-- Partnerler kendi bilgilerini güncelleyebilir
CREATE POLICY "Partners can update their own data"
ON partners FOR UPDATE
USING (auth.uid()::text = id::text);

-- Adminler tüm partnerleri görebilir ve yönetebilir
CREATE POLICY "Admins can manage all partners"
ON partners FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- Müşteriler partner listesini görebilir (sadece aktif partnerler)
CREATE POLICY "Customers can view active partners"
ON partners FOR SELECT
USING (status = 'active');

-- ============================================
-- 3. ADMIN_USERS POLICIES
-- ============================================

-- Sadece adminler admin kullanıcılarını görebilir
CREATE POLICY "Admins can view admin users"
ON admin_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- Sadece super_admin yeni admin oluşturabilir
CREATE POLICY "Super admins can create admin users"
ON admin_users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id::text = auth.uid()::text AND role = 'super_admin'
  )
);

-- ============================================
-- 4. REQUESTS POLICIES
-- ============================================

-- Müşteriler kendi taleplerini görebilir
CREATE POLICY "Customers can view their own requests"
ON requests FOR SELECT
USING (auth.uid()::text = customer_id::text);

-- Müşteriler yeni talep oluşturabilir
CREATE POLICY "Customers can create requests"
ON requests FOR INSERT
WITH CHECK (auth.uid()::text = customer_id::text);

-- Müşteriler kendi taleplerini güncelleyebilir
CREATE POLICY "Customers can update their own requests"
ON requests FOR UPDATE
USING (auth.uid()::text = customer_id::text);

-- Partnerler kendilerine atanan talepleri görebilir
CREATE POLICY "Partners can view assigned requests"
ON requests FOR SELECT
USING (auth.uid()::text = assigned_partner_id::text);

-- Partnerler açık talepleri görebilir (teklif vermek için)
CREATE POLICY "Partners can view open requests"
ON requests FOR SELECT
USING (
  status = 'open' AND 
  EXISTS (
    SELECT 1 FROM partners WHERE id::text = auth.uid()::text AND status = 'active'
  )
);

-- Adminler tüm talepleri yönetebilir
CREATE POLICY "Admins can manage all requests"
ON requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 5. OFFERS POLICIES
-- ============================================

-- Müşteriler kendi taleplerinin tekliflerini görebilir
CREATE POLICY "Customers can view offers for their requests"
ON offers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM requests 
    WHERE requests.id = offers.request_id 
    AND requests.customer_id::text = auth.uid()::text
  )
);

-- Partnerler kendi tekliflerini görebilir
CREATE POLICY "Partners can view their own offers"
ON offers FOR SELECT
USING (auth.uid()::text = partner_id::text);

-- Partnerler teklif oluşturabilir
CREATE POLICY "Partners can create offers"
ON offers FOR INSERT
WITH CHECK (
  auth.uid()::text = partner_id::text AND
  EXISTS (
    SELECT 1 FROM partners WHERE id::text = auth.uid()::text AND status = 'active'
  )
);

-- Partnerler kendi tekliflerini güncelleyebilir
CREATE POLICY "Partners can update their own offers"
ON offers FOR UPDATE
USING (auth.uid()::text = partner_id::text);

-- Adminler tüm teklifleri görebilir
CREATE POLICY "Admins can view all offers"
ON offers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 6. COMPLETED_JOBS POLICIES
-- ============================================

-- Partnerler kendi tamamlanan işlerini görebilir
CREATE POLICY "Partners can view their completed jobs"
ON completed_jobs FOR SELECT
USING (auth.uid()::text = partner_id::text);

-- Müşteriler kendi işlerini görebilir
CREATE POLICY "Customers can view their jobs"
ON completed_jobs FOR SELECT
USING (auth.uid()::text = customer_id::text);

-- Partnerler iş tamamlayabilir
CREATE POLICY "Partners can create completed jobs"
ON completed_jobs FOR INSERT
WITH CHECK (auth.uid()::text = partner_id::text);

-- Adminler tüm işleri görebilir ve yönetebilir
CREATE POLICY "Admins can manage all jobs"
ON completed_jobs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 7. PARTNER_REVIEWS POLICIES
-- ============================================

-- Müşteriler kendi yorumlarını görebilir
CREATE POLICY "Customers can view their reviews"
ON partner_reviews FOR SELECT
USING (auth.uid()::text = customer_id::text);

-- Müşteriler yorum oluşturabilir
CREATE POLICY "Customers can create reviews"
ON partner_reviews FOR INSERT
WITH CHECK (auth.uid()::text = customer_id::text);

-- Partnerler kendileri hakkındaki yorumları görebilir
CREATE POLICY "Partners can view their reviews"
ON partner_reviews FOR SELECT
USING (auth.uid()::text = partner_id::text);

-- Adminler tüm yorumları görebilir
CREATE POLICY "Admins can manage all reviews"
ON partner_reviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 8. REVIEW_OBJECTIONS POLICIES
-- ============================================

-- Partnerler kendi itirazlarını görebilir ve oluşturabilir
CREATE POLICY "Partners can manage their objections"
ON review_objections FOR ALL
USING (auth.uid()::text = partner_id::text);

-- Adminler tüm itirazları görebilir ve çözebilir
CREATE POLICY "Admins can manage all objections"
ON review_objections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 9. PARTNER_DOCUMENTS POLICIES
-- ============================================

-- Partnerler kendi belgelerini görebilir ve yükleyebilir
CREATE POLICY "Partners can manage their documents"
ON partner_documents FOR ALL
USING (auth.uid()::text = partner_id::text);

-- Adminler tüm belgeleri görebilir ve onaylayabilir
CREATE POLICY "Admins can manage all documents"
ON partner_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 10. SUPPORT_TICKETS POLICIES
-- ============================================

-- Partnerler kendi destek taleplerini görebilir ve oluşturabilir
CREATE POLICY "Partners can manage their tickets"
ON support_tickets FOR ALL
USING (auth.uid()::text = partner_id::text);

-- Adminler tüm destek taleplerini görebilir ve yönetebilir
CREATE POLICY "Admins can manage all tickets"
ON support_tickets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 11. PARTNER_VEHICLES POLICIES
-- ============================================

-- Partnerler kendi araçlarını yönetebilir
CREATE POLICY "Partners can manage their vehicles"
ON partner_vehicles FOR ALL
USING (auth.uid()::text = partner_id::text);

-- Adminler tüm araçları görebilir
CREATE POLICY "Admins can view all vehicles"
ON partner_vehicles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 12. PARTNER_CREDITS POLICIES
-- ============================================

-- Partnerler kendi kredi bakiyelerini görebilir
CREATE POLICY "Partners can view their credits"
ON partner_credits FOR SELECT
USING (auth.uid()::text = partner_id::text);

-- Adminler tüm kredi bakiyelerini görebilir ve yönetebilir
CREATE POLICY "Admins can manage all credits"
ON partner_credits FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 13. CREDIT_TRANSACTIONS POLICIES
-- ============================================

-- Partnerler kendi kredi geçmişlerini görebilir
CREATE POLICY "Partners can view their credit transactions"
ON credit_transactions FOR SELECT
USING (auth.uid()::text = partner_id::text);

-- Adminler tüm kredi işlemlerini görebilir ve oluşturabilir
CREATE POLICY "Admins can manage credit transactions"
ON credit_transactions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 14. EMPTY_TRUCK_ROUTES POLICIES
-- ============================================

-- Partnerler kendi rotalarını yönetebilir
CREATE POLICY "Partners can manage their routes"
ON empty_truck_routes FOR ALL
USING (auth.uid()::text = partner_id::text);

-- Aktif rotalar herkese açık (potansiyel müşteriler için)
CREATE POLICY "Anyone can view active routes"
ON empty_truck_routes FOR SELECT
USING (status = 'active');

-- Adminler tüm rotaları görebilir
CREATE POLICY "Admins can view all routes"
ON empty_truck_routes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 15. PARTNER_LEAD_REQUESTS POLICIES
-- ============================================

-- Partnerler kendi lead taleplerini yönetebilir
CREATE POLICY "Partners can manage their lead requests"
ON partner_lead_requests FOR ALL
USING (auth.uid()::text = partner_id::text);

-- Adminler tüm lead taleplerini görebilir ve yönetebilir
CREATE POLICY "Admins can manage all lead requests"
ON partner_lead_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 16. SERVICE_AREA_REQUESTS POLICIES
-- ============================================

-- Partnerler kendi alan taleplerini yönetebilir
CREATE POLICY "Partners can manage their area requests"
ON service_area_requests FOR ALL
USING (auth.uid()::text = partner_id::text);

-- Adminler tüm alan taleplerini görebilir ve yönetebilir
CREATE POLICY "Admins can manage all area requests"
ON service_area_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- ============================================
-- 17. SYSTEM_LOGS POLICIES
-- ============================================

-- Sadece adminler sistem loglarını görebilir
CREATE POLICY "Admins can view system logs"
ON system_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text
  )
);

-- Sistem logları sadece sistem tarafından oluşturulabilir
CREATE POLICY "System can create logs"
ON system_logs FOR INSERT
WITH CHECK (true);

-- ============================================
-- STORAGE POLICIES (Supabase Storage için)
-- ============================================

-- Partner belgeleri için storage bucket policy
-- Bu politikalar Supabase Dashboard'dan manuel olarak uygulanmalıdır

-- Bucket: partner-documents
-- - Partners can upload to their own folder: partner-documents/{partner_id}/*
-- - Admins can view all documents
-- - Public read access: false

-- Bucket: customer-photos
-- - Customers can upload to their own folder: customer-photos/{customer_id}/*
-- - Partners can view photos for their assigned requests
-- - Public read access: false

-- Bucket: vehicle-images
-- - Partners can upload to their own folder: vehicle-images/{partner_id}/*
-- - Public read access: true (for vehicle listings)
