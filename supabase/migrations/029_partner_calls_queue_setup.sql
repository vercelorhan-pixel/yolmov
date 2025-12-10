-- Migration 029: Partner Calls Queue Setup
-- Partner → Admin çağrıları için özel kuyruk ve agent atamaları

-- 1. partner-calls kuyruğunu oluştur (varsa güncelle)
INSERT INTO call_queues (
  name, 
  slug, 
  description,
  queue_type, 
  priority, 
  is_active, 
  auto_distribute,
  distribution_strategy,
  max_wait_time_seconds
)
VALUES (
  'Partner Destek',
  'partner-calls',
  'Partner destek ve operasyonel sorunlar için özel kuyruk',
  'partner',
  90,
  true,
  true,
  'round-robin',
  300
)
ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  priority = EXCLUDED.priority,
  is_active = true,
  auto_distribute = true,
  updated_at = NOW();

-- 2. Tüm aktif admin agent'ları partner-calls kuyruğuna ata
-- (Eğer zaten atanmışsa tekrar eklenmez)
UPDATE call_agents
SET 
  assigned_queues = CASE
    WHEN assigned_queues IS NULL THEN ARRAY['partner-calls']::text[]
    WHEN 'partner-calls' = ANY(assigned_queues) THEN assigned_queues
    ELSE array_append(assigned_queues, 'partner-calls')
  END,
  updated_at = NOW()
WHERE status IN ('online', 'offline')
  AND (assigned_queues IS NULL OR NOT ('partner-calls' = ANY(assigned_queues)));

-- 3. Veritabanı kontrolü için yardımcı sorgu (migration sonrası çalıştırın)
-- SELECT * FROM call_queues WHERE slug = 'partner-calls';
-- SELECT admin_id, display_name, status, assigned_queues FROM call_agents;
