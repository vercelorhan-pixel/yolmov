-- ============================================
-- ACTIVITY LOGS V2 - GELİŞMİŞ TAKİP
-- Sayfa süresi, UTM, scroll derinliği, trafik kaynağı
-- ============================================

-- Yeni kolonları ekle (varsa atla)
DO $$ 
BEGIN
  -- Sayfa süresi (saniye cinsinden)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'duration_seconds') THEN
    ALTER TABLE activity_logs ADD COLUMN duration_seconds INTEGER DEFAULT 0;
    RAISE NOTICE 'duration_seconds kolonu eklendi';
  END IF;

  -- Scroll derinliği (yüzde)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'scroll_depth') THEN
    ALTER TABLE activity_logs ADD COLUMN scroll_depth INTEGER DEFAULT 0;
    RAISE NOTICE 'scroll_depth kolonu eklendi';
  END IF;
  
  -- Trafik kaynağı (google, direct, social, referral, email, paid)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'traffic_source') THEN
    ALTER TABLE activity_logs ADD COLUMN traffic_source VARCHAR(50);
    RAISE NOTICE 'traffic_source kolonu eklendi';
  END IF;
  
  -- Trafik ortamı (organic, cpc, social, email, referral)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'traffic_medium') THEN
    ALTER TABLE activity_logs ADD COLUMN traffic_medium VARCHAR(50);
    RAISE NOTICE 'traffic_medium kolonu eklendi';
  END IF;
  
  -- UTM Campaign
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'utm_campaign') THEN
    ALTER TABLE activity_logs ADD COLUMN utm_campaign VARCHAR(255);
    RAISE NOTICE 'utm_campaign kolonu eklendi';
  END IF;
  
  -- UTM Source
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'utm_source') THEN
    ALTER TABLE activity_logs ADD COLUMN utm_source VARCHAR(255);
    RAISE NOTICE 'utm_source kolonu eklendi';
  END IF;
  
  -- UTM Medium
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'utm_medium') THEN
    ALTER TABLE activity_logs ADD COLUMN utm_medium VARCHAR(255);
    RAISE NOTICE 'utm_medium kolonu eklendi';
  END IF;
  
  -- UTM Term (anahtar kelime)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'utm_term') THEN
    ALTER TABLE activity_logs ADD COLUMN utm_term VARCHAR(255);
    RAISE NOTICE 'utm_term kolonu eklendi';
  END IF;
  
  -- UTM Content
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'utm_content') THEN
    ALTER TABLE activity_logs ADD COLUMN utm_content VARCHAR(255);
    RAISE NOTICE 'utm_content kolonu eklendi';
  END IF;
  
  -- Giriş sayfası mı? (landing page)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'is_landing_page') THEN
    ALTER TABLE activity_logs ADD COLUMN is_landing_page BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'is_landing_page kolonu eklendi';
  END IF;
  
  -- Çıkış sayfası mı? (exit page)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'is_exit_page') THEN
    ALTER TABLE activity_logs ADD COLUMN is_exit_page BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'is_exit_page kolonu eklendi';
  END IF;
  
  -- Bounce mu? (tek sayfa ziyareti)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'is_bounce') THEN
    ALTER TABLE activity_logs ADD COLUMN is_bounce BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'is_bounce kolonu eklendi';
  END IF;
  
  -- Ekran çözünürlüğü
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'screen_resolution') THEN
    ALTER TABLE activity_logs ADD COLUMN screen_resolution VARCHAR(20);
    RAISE NOTICE 'screen_resolution kolonu eklendi';
  END IF;
  
  -- Viewport boyutu
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'viewport_size') THEN
    ALTER TABLE activity_logs ADD COLUMN viewport_size VARCHAR(20);
    RAISE NOTICE 'viewport_size kolonu eklendi';
  END IF;
  
  -- Dil tercihi
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'language') THEN
    ALTER TABLE activity_logs ADD COLUMN language VARCHAR(10);
    RAISE NOTICE 'language kolonu eklendi';
  END IF;
  
  -- Timezone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'timezone') THEN
    ALTER TABLE activity_logs ADD COLUMN timezone VARCHAR(50);
    RAISE NOTICE 'timezone kolonu eklendi';
  END IF;
  
  -- Connection type (4g, wifi, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'connection_type') THEN
    ALTER TABLE activity_logs ADD COLUMN connection_type VARCHAR(20);
    RAISE NOTICE 'connection_type kolonu eklendi';
  END IF;

END $$;

-- Yeni indeksler
CREATE INDEX IF NOT EXISTS idx_activity_logs_traffic_source ON activity_logs(traffic_source);
CREATE INDEX IF NOT EXISTS idx_activity_logs_utm_source ON activity_logs(utm_source);
CREATE INDEX IF NOT EXISTS idx_activity_logs_is_landing_page ON activity_logs(is_landing_page);
CREATE INDEX IF NOT EXISTS idx_activity_logs_duration ON activity_logs(duration_seconds);

-- ============================================
-- GELİŞMİŞ GÖRÜNÜMLER (VIEWS)
-- ============================================

-- Trafik kaynakları özeti
CREATE OR REPLACE VIEW traffic_sources_summary AS
SELECT 
  COALESCE(traffic_source, 'direct') AS source,
  COALESCE(traffic_medium, 'none') AS medium,
  COUNT(*) AS visits,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT user_id) AS unique_users,
  ROUND(AVG(duration_seconds)::numeric, 2) AS avg_duration_seconds,
  ROUND(AVG(scroll_depth)::numeric, 2) AS avg_scroll_depth
FROM activity_logs
WHERE activity_type = 'page_view'
GROUP BY traffic_source, traffic_medium
ORDER BY visits DESC;

-- Sayfa performansı
CREATE OR REPLACE VIEW page_performance AS
SELECT 
  page_url,
  page_title,
  COUNT(*) AS views,
  COUNT(DISTINCT session_id) AS unique_visits,
  ROUND(AVG(duration_seconds)::numeric, 2) AS avg_time_on_page,
  ROUND(AVG(scroll_depth)::numeric, 2) AS avg_scroll_depth,
  SUM(CASE WHEN is_landing_page THEN 1 ELSE 0 END) AS landing_count,
  SUM(CASE WHEN is_exit_page THEN 1 ELSE 0 END) AS exit_count,
  SUM(CASE WHEN is_bounce THEN 1 ELSE 0 END) AS bounce_count,
  ROUND(
    (SUM(CASE WHEN is_bounce THEN 1 ELSE 0 END)::numeric / 
     NULLIF(SUM(CASE WHEN is_landing_page THEN 1 ELSE 0 END), 0)) * 100, 
    2
  ) AS bounce_rate
FROM activity_logs
WHERE activity_type = 'page_view'
GROUP BY page_url, page_title
ORDER BY views DESC;

-- Kullanıcı yolculuğu (session bazında sayfa sırası)
CREATE OR REPLACE VIEW user_journeys AS
SELECT 
  session_id,
  user_id,
  user_type,
  traffic_source,
  utm_source,
  utm_campaign,
  ARRAY_AGG(page_url ORDER BY created_at) AS page_path,
  COUNT(*) AS pages_viewed,
  MIN(created_at) AS session_start,
  MAX(created_at) AS session_end,
  SUM(duration_seconds) AS total_duration
FROM activity_logs
WHERE activity_type = 'page_view' AND session_id IS NOT NULL
GROUP BY session_id, user_id, user_type, traffic_source, utm_source, utm_campaign
ORDER BY session_start DESC;

-- Günlük metrikler
CREATE OR REPLACE VIEW daily_metrics AS
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS total_pageviews,
  COUNT(DISTINCT session_id) AS sessions,
  COUNT(DISTINCT user_id) AS unique_visitors,
  ROUND(AVG(duration_seconds)::numeric, 2) AS avg_session_duration,
  ROUND(
    COUNT(*)::numeric / NULLIF(COUNT(DISTINCT session_id), 0), 
    2
  ) AS pages_per_session,
  SUM(CASE WHEN is_bounce THEN 1 ELSE 0 END) AS bounces,
  ROUND(
    (SUM(CASE WHEN is_bounce THEN 1 ELSE 0 END)::numeric / 
     NULLIF(COUNT(DISTINCT session_id), 0)) * 100, 
    2
  ) AS bounce_rate
FROM activity_logs
WHERE activity_type = 'page_view'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- SEO performansı (şehirlerarası, çekici gibi sayfalar için)
CREATE OR REPLACE VIEW seo_page_performance AS
SELECT 
  CASE 
    WHEN page_url LIKE '/sehirlerarasi/%' THEN 'Şehirlerarası'
    WHEN page_url LIKE '/cekici/%' THEN 'Çekici'
    WHEN page_url LIKE '/nobetci/%' THEN 'Nöbetçi'
    WHEN page_url LIKE '/tasima/%' THEN 'Taşıma'
    WHEN page_url LIKE '/fiyat/%' THEN 'Fiyat'
    WHEN page_url LIKE '/lokasyon/%' THEN 'Lokasyon'
    WHEN page_url LIKE '/marka/%' THEN 'Marka'
    WHEN page_url LIKE '/partner-ol/%' THEN 'Partner Ol'
    ELSE 'Diğer'
  END AS page_category,
  page_url,
  traffic_source,
  COUNT(*) AS views,
  COUNT(DISTINCT session_id) AS unique_visits,
  ROUND(AVG(duration_seconds)::numeric, 2) AS avg_time_on_page,
  ROUND(AVG(scroll_depth)::numeric, 2) AS avg_scroll_depth
FROM activity_logs
WHERE activity_type = 'page_view'
GROUP BY page_category, page_url, traffic_source
ORDER BY views DESC;

-- ============================================
-- DOĞRULAMA
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ Activity Logs V2 migration tamamlandı!';
  RAISE NOTICE '📊 Yeni kolonlar: duration_seconds, scroll_depth, traffic_source, UTM parametreleri';
  RAISE NOTICE '📊 Yeni view''lar: traffic_sources_summary, page_performance, user_journeys, daily_metrics, seo_page_performance';
END $$;
