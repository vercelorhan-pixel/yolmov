-- ============================================
-- ACTIVITY LOGS MIGRATION
-- Kullanıcı ve partner aktivite takibi
-- ============================================

-- Activity logs tablosu
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Kullanıcı bilgisi
  user_id UUID,
  user_type VARCHAR(20), -- 'customer', 'partner', 'admin', 'anonymous'
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  
  -- Aktivite bilgisi
  activity_type VARCHAR(50) NOT NULL, -- 'page_view', 'login', 'logout', 'request_create', etc.
  page_url TEXT,
  page_title VARCHAR(255),
  referrer TEXT,
  
  -- Cihaz ve konum bilgisi
  ip_address VARCHAR(45), -- IPv4 ve IPv6 için yeterli (max 45 karakter)
  user_agent TEXT,
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR(100),
  os VARCHAR(100),
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Ek veri
  metadata JSONB DEFAULT '{}',
  
  -- Session bilgisi
  session_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions tablosu
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL, -- 'customer', 'partner', 'admin'
  user_email VARCHAR(255),
  
  session_token TEXT UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type ON activity_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_ip_address ON activity_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_activity_logs_page_url ON activity_logs(page_url);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_type ON user_sessions(user_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity_at DESC);

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Admin her şeyi görebilir
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  );

-- Activity log eklemek herkes için açık (anonim dahil)
CREATE POLICY "Anyone can insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (true);

-- Admin tüm session'ları görebilir
CREATE POLICY "Admins can view all sessions" ON user_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
    )
  );

-- Kullanıcı kendi session'ını görebilir
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT
  USING (user_id = auth.uid());

-- Session oluşturma
CREATE POLICY "Users can create own sessions" ON user_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Session güncelleme
CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- ADMIN USERS TABLOSU GÜNCELLEMESİ
-- ============================================

-- admin_users tablosuna last_login ve status kolonu ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'last_login') THEN
    ALTER TABLE admin_users ADD COLUMN last_login TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'status') THEN
    ALTER TABLE admin_users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'name') THEN
    ALTER TABLE admin_users ADD COLUMN name VARCHAR(255);
  END IF;
END $$;

-- ============================================
-- ÖZET GÖRÜNÜM
-- ============================================

-- Aktivite özeti view'i
CREATE OR REPLACE VIEW activity_summary AS
SELECT 
  date_trunc('day', created_at) AS activity_date,
  user_type,
  activity_type,
  COUNT(*) AS count,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT ip_address) AS unique_ips
FROM activity_logs
GROUP BY date_trunc('day', created_at), user_type, activity_type
ORDER BY activity_date DESC;

-- Sayfa görüntüleme istatistikleri view'i
CREATE OR REPLACE VIEW page_view_stats AS
SELECT 
  page_url,
  page_title,
  COUNT(*) AS view_count,
  COUNT(DISTINCT user_id) AS unique_visitors,
  COUNT(DISTINCT ip_address) AS unique_ips,
  MIN(created_at) AS first_view,
  MAX(created_at) AS last_view
FROM activity_logs
WHERE activity_type = 'page_view'
GROUP BY page_url, page_title
ORDER BY view_count DESC;
