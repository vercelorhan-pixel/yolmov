-- ============================================
-- YOLMOV SUPABASE DATABASE SCHEMA
-- Proje: Yolmov Yol Yardım Platformu
-- Tarih: 28 Kasım 2025
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS (Sabit Değerler)
-- ============================================

CREATE TYPE request_status AS ENUM ('open', 'matched', 'in_progress', 'completed', 'cancelled');
CREATE TYPE offer_status AS ENUM ('sent', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE admin_role AS ENUM ('super_admin', 'support', 'finance', 'operations');
CREATE TYPE user_type AS ENUM ('customer', 'partner', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('license', 'insurance', 'registration', 'tax', 'identity');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_category AS ENUM ('general', 'technical', 'billing', 'account', 'feature');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE vehicle_status AS ENUM ('active', 'maintenance', 'disabled');
CREATE TYPE transaction_type AS ENUM ('purchase', 'usage', 'adjustment', 'refund');
CREATE TYPE payment_method AS ENUM ('kredi_karti', 'nakit', 'havale');
CREATE TYPE job_status AS ENUM ('completed', 'cancelled', 'refunded');
CREATE TYPE route_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE service_type AS ENUM ('cekici', 'aku', 'lastik', 'yakit', 'yardim');
CREATE TYPE vehicle_condition AS ENUM ('running', 'broken');
CREATE TYPE timing AS ENUM ('now', 'week', 'later');
CREATE TYPE urgency AS ENUM ('high', 'normal');

-- ============================================
-- 1. CUSTOMERS TABLE (Müşteriler)
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================
-- 2. PARTNERS TABLE (Partnerler/Hizmet Sağlayıcılar)
-- ============================================

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.00,
  completed_jobs INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 0,
  status user_status DEFAULT 'pending',
  city VARCHAR(100),
  district VARCHAR(100),
  service_types service_type[] DEFAULT ARRAY['cekici']::service_type[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partners_email ON partners(email);
CREATE INDEX idx_partners_status ON partners(status);

-- ============================================
-- 3. ADMIN_USERS TABLE (Admin Kullanıcıları)
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role admin_role DEFAULT 'support',
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- ============================================
-- 4. REQUESTS TABLE (Müşteri Talepleri)
-- ============================================

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  service_type service_type NOT NULL,
  description TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT,
  vehicle_info VARCHAR(255),
  status request_status DEFAULT 'open',
  amount DECIMAL(10,2),
  
  -- İş takibi alanları
  job_stage SMALLINT CHECK (job_stage BETWEEN 0 AND 4),
  assigned_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  assigned_partner_name VARCHAR(255),
  stage_updated_at TIMESTAMPTZ,
  
  -- Genişletilmiş alanlar
  vehicle_condition vehicle_condition,
  has_load BOOLEAN DEFAULT FALSE,
  load_description TEXT,
  damage_photo_urls TEXT[],
  timing timing,
  customer_phone VARCHAR(20),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_requests_customer_id ON requests(customer_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_assigned_partner_id ON requests(assigned_partner_id);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);

-- ============================================
-- 5. OFFERS TABLE (Teklifler)
-- ============================================

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  eta_minutes INTEGER NOT NULL,
  message TEXT,
  status offer_status DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offers_request_id ON offers(request_id);
CREATE INDEX idx_offers_partner_id ON offers(partner_id);
CREATE INDEX idx_offers_status ON offers(status);

-- ============================================
-- 6. COMPLETED_JOBS TABLE (Tamamlanan İşler)
-- ============================================

CREATE TABLE IF NOT EXISTS completed_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  service_type service_type NOT NULL,
  start_location TEXT NOT NULL,
  end_location TEXT,
  distance DECIMAL(10,2),
  start_time TIMESTAMPTZ NOT NULL,
  completion_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- dakika cinsinden
  total_amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  partner_earning DECIMAL(10,2) NOT NULL,
  payment_method payment_method DEFAULT 'nakit',
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  vehicle_type VARCHAR(100),
  vehicle_plate VARCHAR(20),
  status job_status DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_completed_jobs_partner_id ON completed_jobs(partner_id);
CREATE INDEX idx_completed_jobs_customer_id ON completed_jobs(customer_id);
CREATE INDEX idx_completed_jobs_completion_time ON completed_jobs(completion_time DESC);

-- ============================================
-- 7. PARTNER_REVIEWS TABLE (Partner Değerlendirmeleri)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES completed_jobs(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  service service_type NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_reviews_partner_id ON partner_reviews(partner_id);
CREATE INDEX idx_partner_reviews_job_id ON partner_reviews(job_id);
CREATE INDEX idx_partner_reviews_rating ON partner_reviews(rating);

-- ============================================
-- 8. REVIEW_OBJECTIONS TABLE (Değerlendirme İtirazları)
-- ============================================

CREATE TABLE IF NOT EXISTS review_objections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES partner_reviews(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  status document_status DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES admin_users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_objections_review_id ON review_objections(review_id);
CREATE INDEX idx_review_objections_status ON review_objections(status);

-- ============================================
-- 9. PARTNER_DOCUMENTS TABLE (Partner Belgeleri)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  type document_type NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size VARCHAR(50),
  file_url TEXT, -- Supabase Storage URL
  status document_status DEFAULT 'pending',
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date DATE,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_documents_partner_id ON partner_documents(partner_id);
CREATE INDEX idx_partner_documents_status ON partner_documents(status);
CREATE INDEX idx_partner_documents_type ON partner_documents(type);

-- ============================================
-- 10. SUPPORT_TICKETS TABLE (Destek Talepleri)
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  category ticket_category NOT NULL,
  priority ticket_priority DEFAULT 'medium',
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  assigned_to UUID REFERENCES admin_users(id),
  resolution TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_partner_id ON support_tickets(partner_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);

-- ============================================
-- 11. PARTNER_VEHICLES TABLE (Partner Araçları)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  plate VARCHAR(20) NOT NULL UNIQUE,
  model VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  driver VARCHAR(255),
  status vehicle_status DEFAULT 'active',
  registration_date DATE NOT NULL,
  last_service DATE,
  total_jobs INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_vehicles_partner_id ON partner_vehicles(partner_id);
CREATE INDEX idx_partner_vehicles_plate ON partner_vehicles(plate);
CREATE INDEX idx_partner_vehicles_status ON partner_vehicles(status);

-- ============================================
-- 12. PARTNER_CREDITS TABLE (Partner Kredi Bakiyeleri)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL UNIQUE REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  balance INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  last_transaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_credits_partner_id ON partner_credits(partner_id);

-- ============================================
-- 13. CREDIT_TRANSACTIONS TABLE (Kredi İşlemleri)
-- ============================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  type transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  request_id UUID REFERENCES requests(id),
  admin_user UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_partner_id ON credit_transactions(partner_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- ============================================
-- 14. EMPTY_TRUCK_ROUTES TABLE (Boş Araç Rotaları)
-- ============================================

CREATE TABLE IF NOT EXISTS empty_truck_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  from_city VARCHAR(100) NOT NULL,
  to_city VARCHAR(100) NOT NULL,
  departure_date DATE NOT NULL,
  vehicle_type VARCHAR(100) NOT NULL,
  vehicle_plate VARCHAR(20) NOT NULL,
  available_capacity VARCHAR(100),
  price_per_km DECIMAL(10,2),
  notes TEXT,
  status route_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_empty_truck_routes_partner_id ON empty_truck_routes(partner_id);
CREATE INDEX idx_empty_truck_routes_status ON empty_truck_routes(status);
CREATE INDEX idx_empty_truck_routes_departure_date ON empty_truck_routes(departure_date);

-- ============================================
-- 15. PARTNER_LEAD_REQUESTS TABLE (Partner İş Talepleri)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_lead_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  request_type VARCHAR(50) DEFAULT 'lead_purchase',
  service_area VARCHAR(255) NOT NULL,
  service_type service_type NOT NULL,
  credit_cost INTEGER NOT NULL,
  status document_status DEFAULT 'pending',
  customer_info JSONB, -- {name, phone, location}
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES admin_users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_lead_requests_partner_id ON partner_lead_requests(partner_id);
CREATE INDEX idx_partner_lead_requests_status ON partner_lead_requests(status);

-- ============================================
-- 16. SERVICE_AREA_REQUESTS TABLE (Hizmet Alanı Genişletme Talepleri)
-- ============================================

CREATE TABLE IF NOT EXISTS service_area_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255) NOT NULL,
  request_type VARCHAR(50) DEFAULT 'area_expansion',
  current_areas TEXT[] NOT NULL,
  requested_areas TEXT[] NOT NULL,
  reason TEXT NOT NULL,
  status document_status DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES admin_users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_area_requests_partner_id ON service_area_requests(partner_id);
CREATE INDEX idx_service_area_requests_status ON service_area_requests(status);

-- ============================================
-- 17. SYSTEM_LOGS TABLE (Sistem Logları)
-- ============================================

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  admin_name VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- approve, reject, delete, update, create
  entity VARCHAR(50) NOT NULL, -- user, partner, request, offer, document
  entity_id UUID NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_logs_admin_id ON system_logs(admin_id);
CREATE INDEX idx_system_logs_entity ON system_logs(entity);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);

-- ============================================
-- TRIGGERS (Otomatik Güncellemeler)
-- ============================================

-- Updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Her tablo için updated_at trigger'ı
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_vehicles_updated_at BEFORE UPDATE ON partner_vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_credits_updated_at BEFORE UPDATE ON partner_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS (Görünümler - Raporlama İçin)
-- ============================================

-- Partner istatistikleri view
CREATE OR REPLACE VIEW partner_stats AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.rating,
  p.completed_jobs,
  p.credits,
  p.status,
  COALESCE(SUM(cj.partner_earning), 0) AS total_earnings,
  COALESCE(AVG(pr.rating), 0) AS avg_review_rating,
  COUNT(DISTINCT cj.id) AS actual_completed_jobs
FROM partners p
LEFT JOIN completed_jobs cj ON p.id = cj.partner_id
LEFT JOIN partner_reviews pr ON p.id = pr.partner_id
GROUP BY p.id, p.name, p.email, p.rating, p.completed_jobs, p.credits, p.status;

-- Müşteri istatistikleri view
CREATE OR REPLACE VIEW customer_stats AS
SELECT 
  c.id,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  COUNT(DISTINCT r.id) AS total_requests,
  COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) AS completed_requests,
  COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.amount END), 0) AS total_spent
FROM customers c
LEFT JOIN requests r ON c.id = r.customer_id
GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone;

-- Günlük istatistikler view
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_requests,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_requests,
  COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0) AS total_revenue
FROM requests
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- ============================================
-- COMMENTS (Açıklamalar)
-- ============================================

COMMENT ON TABLE customers IS 'Müşteri bilgileri - B2C kullanıcılar';
COMMENT ON TABLE partners IS 'Partner bilgileri - B2B hizmet sağlayıcılar';
COMMENT ON TABLE admin_users IS 'Admin kullanıcıları - Sistem yöneticileri';
COMMENT ON TABLE requests IS 'Müşteri talepleri - Yol yardım talepleri';
COMMENT ON TABLE offers IS 'Partner teklifleri - Taleplere verilen teklifler';
COMMENT ON TABLE completed_jobs IS 'Tamamlanan işler - İş geçmişi';
COMMENT ON TABLE partner_reviews IS 'Partner değerlendirmeleri - Müşteri yorumları';
COMMENT ON TABLE partner_documents IS 'Partner belgeleri - Ruhsat, sigorta vb.';
COMMENT ON TABLE support_tickets IS 'Destek talepleri - Partner destek sistemi';
COMMENT ON TABLE partner_vehicles IS 'Partner araçları - Filo yönetimi';
COMMENT ON TABLE partner_credits IS 'Partner kredi bakiyeleri';
COMMENT ON TABLE credit_transactions IS 'Kredi işlem geçmişi';
COMMENT ON TABLE empty_truck_routes IS 'Boş araç rotaları - Optimizasyon için';
COMMENT ON TABLE system_logs IS 'Sistem logları - Admin işlem geçmişi';
