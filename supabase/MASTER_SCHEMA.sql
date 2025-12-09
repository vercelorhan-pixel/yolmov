-- ============================================
-- YOLMOV MASTER DATABASE SCHEMA
-- Proje: Yolmov Yol Yardım Platformu
-- Son Güncelleme: 5 Aralık 2025
-- Bu dosya tüm migration'ların birleştirilmiş halidir
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
-- 1. CUSTOMERS TABLE
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

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ============================================
-- 2. CUSTOMER_ADDRESSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('home', 'work')),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_created_at ON customer_addresses(created_at DESC);

-- ============================================
-- 3. PARTNERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  
  -- Registration Form Fields (from 005_partner_registration_fields.sql)
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  tax_number VARCHAR(50),
  trade_registry_number VARCHAR(50),
  sector VARCHAR(50),
  vehicle_count INTEGER DEFAULT 0,
  vehicle_types TEXT,
  
  -- Status & Ratings
  status user_status DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0.00,
  completed_jobs INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 0,
  
  -- Location
  city VARCHAR(100),
  district VARCHAR(100),
  
  -- Services
  service_types service_type[] DEFAULT ARRAY['cekici']::service_type[],
  
  -- Documents (from 005_partner_registration_fields.sql)
  commercial_registry_url TEXT,
  vehicle_license_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_tax_number ON partners(tax_number);
CREATE INDEX IF NOT EXISTS idx_partners_sector ON partners(sector);

-- ============================================
-- 4. CUSTOMER_FAVORITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS customer_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer_id ON customer_favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_partner_id ON customer_favorites(partner_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_created_at ON customer_favorites(created_at DESC);

-- ============================================
-- 5. ADMIN_USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role admin_role DEFAULT 'support',
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(20) DEFAULT 'active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- ============================================
-- 6. REQUESTS TABLE (Müşteri Talepleri)
-- ============================================

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Request Details
  service_type service_type NOT NULL,
  vehicle_condition vehicle_condition DEFAULT 'broken',
  timing timing DEFAULT 'now',
  urgency urgency DEFAULT 'normal',
  
  -- Location (from 2025-11-29_add_request_coordinates.sql)
  from_city VARCHAR(100) NOT NULL,
  from_district VARCHAR(100) NOT NULL,
  from_address TEXT,
  from_lat DECIMAL(10, 8),
  from_lng DECIMAL(11, 8),
  
  to_city VARCHAR(100),
  to_district VARCHAR(100),
  to_address TEXT,
  to_lat DECIMAL(10, 8),
  to_lng DECIMAL(11, 8),
  
  -- Vehicle Info
  vehicle_brand VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  vehicle_plate VARCHAR(20),
  
  -- Status & Assignment
  status request_status DEFAULT 'open',
  matched_partner_id UUID REFERENCES partners(id),
  
  -- Pricing
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  
  -- Additional Info
  notes TEXT,
  photo_urls TEXT[],
  archived BOOLEAN DEFAULT false, -- from 2025-12-03_add_request_archived.sql
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_requests_customer_id ON requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_partner ON requests(matched_partner_id);
CREATE INDEX IF NOT EXISTS idx_requests_service_type ON requests(service_type);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_archived ON requests(archived);

-- ============================================
-- 7. OFFERS TABLE (Partner Teklifleri)
-- ============================================

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  price DECIMAL(10,2) NOT NULL,
  estimated_arrival_minutes INTEGER,
  message TEXT,
  
  status offer_status DEFAULT 'sent',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_offers_request_id ON offers(request_id);
CREATE INDEX IF NOT EXISTS idx_offers_partner_id ON offers(partner_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

-- ============================================
-- 8. COMPLETED_JOBS TABLE (Tamamlanan İşler)
-- ============================================

CREATE TABLE IF NOT EXISTS completed_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  
  service_type service_type NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  payment_method payment_method,
  
  status job_status DEFAULT 'completed',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON completed_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_partner_id ON completed_jobs(partner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_completed_at ON completed_jobs(completed_at DESC);

-- ============================================
-- 9. PARTNER_REVIEWS TABLE (Değerlendirmeler)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  job_id UUID REFERENCES completed_jobs(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_partner_id ON partner_reviews(partner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON partner_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON partner_reviews(created_at DESC);

-- ============================================
-- 10. PARTNER_DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS partner_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  document_type document_type NOT NULL,
  document_url TEXT NOT NULL,
  status document_status DEFAULT 'pending',
  
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documents_partner_id ON partner_documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON partner_documents(status);

-- ============================================
-- 11. SUPPORT_TICKETS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  category ticket_category DEFAULT 'general',
  priority ticket_priority DEFAULT 'medium',
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  
  assigned_to UUID REFERENCES admin_users(id),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_partner_id ON support_tickets(partner_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON support_tickets(assigned_to);

-- ============================================
-- 12. PARTNER_VEHICLES TABLE (Filo Yönetimi)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  vehicle_type VARCHAR(50) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  plate VARCHAR(20) NOT NULL UNIQUE,
  
  status vehicle_status DEFAULT 'active',
  capacity_tons DECIMAL(5,2),
  
  -- Vitrin (Showcase) alanları
  showcase_capacity VARCHAR(100),
  showcase_insurance_type VARCHAR(100),
  showcase_equipment TEXT[],
  showcase_description TEXT,
  is_showcase_vehicle BOOLEAN DEFAULT false,
  image_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_partner_id ON partner_vehicles(partner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON partner_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON partner_vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_showcase ON partner_vehicles(is_showcase_vehicle) WHERE is_showcase_vehicle = true;

-- ============================================
-- 13. PARTNER_CREDITS TABLE (Kredi Hareketleri)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  transaction_type transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  
  admin_id UUID REFERENCES admin_users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credits_partner_id ON partner_credits(partner_id);
CREATE INDEX IF NOT EXISTS idx_credits_created_at ON partner_credits(created_at DESC);

-- ============================================
-- 14. NOTIFICATIONS TABLE (from 2025-12-03_create_notifications_table.sql)
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type user_type NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  
  read BOOLEAN DEFAULT false,
  data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 15. NOTIFICATION_PREFERENCES TABLE (from 2025-11-29_create_notification_preferences.sql)
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_type user_type NOT NULL,
  
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, user_type)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id, user_type);

-- ============================================
-- 16. PRICING_CONFIG TABLE (from 004_pricing_config.sql)
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type service_type NOT NULL,
  city VARCHAR(100),
  
  base_price DECIMAL(10,2) NOT NULL,
  price_per_km DECIMAL(10,2) NOT NULL,
  min_price DECIMAL(10,2) NOT NULL,
  
  urgency_multiplier DECIMAL(3,2) DEFAULT 1.00,
  night_multiplier DECIMAL(3,2) DEFAULT 1.00,
  
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_service_city ON pricing_config(service_type, city);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CUSTOMER POLICIES
-- ============================================

-- Customers can view their own record
CREATE POLICY "Customers can view own record" ON customers
  FOR SELECT USING (auth.uid() = id);

-- Customers can update their own record
CREATE POLICY "Customers can update own record" ON customers
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- CUSTOMER ADDRESSES POLICIES
-- ============================================

CREATE POLICY "Users can view own addresses" ON customer_addresses
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert own addresses" ON customer_addresses
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own addresses" ON customer_addresses
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Users can delete own addresses" ON customer_addresses
  FOR DELETE USING (auth.uid() = customer_id);

-- ============================================
-- CUSTOMER FAVORITES POLICIES
-- ============================================

CREATE POLICY "Users can view own favorites" ON customer_favorites
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert own favorites" ON customer_favorites
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete own favorites" ON customer_favorites
  FOR DELETE USING (auth.uid() = customer_id);

-- ============================================
-- PARTNER POLICIES (from 006_rls_policies_partner_registration.sql)
-- ============================================

-- Partners görüntüleme (public read for active partners)
CREATE POLICY "Public can view active partners" ON partners
  FOR SELECT USING (status = 'active');

-- Partner kendi kaydını görebilir
CREATE POLICY "Partners can view own record" ON partners
  FOR SELECT USING (auth.uid() = id);

-- Yeni partner kaydı (authenticated users)
CREATE POLICY "Authenticated users can register as partner" ON partners
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Partner kendi kaydını güncelleyebilir
CREATE POLICY "Partners can update own record" ON partners
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- ADMIN PARTNER MANAGEMENT POLICIES
-- ============================================

-- Admin tüm partnerleri görebilir
CREATE POLICY "Admins can view all partners" ON partners
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()));

-- Admin tüm partnerleri güncelleyebilir (ONAYLAMA İÇİN ÖNEMLİ!)
CREATE POLICY "Admins can update all partners" ON partners
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()));

-- Admin tüm partnerleri silebilir
CREATE POLICY "Admins can delete all partners" ON partners
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()));

-- ============================================
-- ADMIN_USERS POLICIES (from 008_admin_bootstrap_policy.sql + 009_fix_admin_insert.sql)
-- ============================================

-- İlk admin bootstrap (tablo boşsa izin ver)
CREATE POLICY "Allow first admin bootstrap" ON admin_users
  FOR INSERT TO authenticated
  WITH CHECK (NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1));

-- Admin kendi kaydını görebilir
CREATE POLICY "Admin can view their own record" ON admin_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Adminler birbirini görebilir
CREATE POLICY "Admins can view all admins" ON admin_users
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- ============================================
-- REQUEST POLICIES (from 2025-11-29_fix_request_storage_policies.sql)
-- ============================================

-- Müşteriler kendi taleplerini görebilir
CREATE POLICY "Customers can view own requests" ON requests
  FOR SELECT USING (auth.uid() = customer_id);

-- Müşteriler talep oluşturabilir
CREATE POLICY "Customers can create requests" ON requests
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Müşteriler kendi taleplerini güncelleyebilir
CREATE POLICY "Customers can update own requests" ON requests
  FOR UPDATE USING (auth.uid() = customer_id);

-- Partnerler eşleştiği talepleri görebilir
CREATE POLICY "Partners can view matched requests" ON requests
  FOR SELECT USING (auth.uid() = matched_partner_id);

-- Admin tüm talepleri görebilir
CREATE POLICY "Admins can view all requests" ON requests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()));

-- ============================================
-- STORAGE POLICIES (from 2025-11-29_fix_request_storage_policies.sql)
-- ============================================

-- Request photos bucket (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('request-photos', 'request-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Partner documents bucket (public for previews)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-documents', 'partner-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for request photos
CREATE POLICY "Public can view request photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'request-photos');

CREATE POLICY "Authenticated users can upload request photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'request-photos' AND auth.role() = 'authenticated');

-- Storage policies for partner documents
CREATE POLICY "Public can view partner documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'partner-documents');

-- Anonymous kullanıcılar partner belgesi yükleyebilir (kayıt formu için)
CREATE POLICY "Anyone can upload partner documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'partner-documents');

-- Anyone can delete partner documents
CREATE POLICY "Anyone can delete partner documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'partner-documents');

-- ============================================
-- COMMENTS
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
COMMENT ON TABLE customer_addresses IS 'Müşteri adresleri - Ev, iş adresleri';
COMMENT ON TABLE customer_favorites IS 'Müşterilerin favori hizmet sağlayıcıları';
COMMENT ON TABLE notifications IS 'Sistem bildirimleri';
COMMENT ON TABLE notification_preferences IS 'Bildirim tercihleri';
COMMENT ON TABLE pricing_config IS 'Dinamik fiyatlandırma konfigürasyonu';

-- ============================================
-- END OF MASTER SCHEMA
-- ============================================
