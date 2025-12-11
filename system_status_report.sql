-- 📊 SİSTEM DURUM RAPORU
-- Bu SQL'i çalıştırarak tüm sistemi kontrol edin

-- 1️⃣ Tablo kayıt sayıları
SELECT 
  'customer_partner_calls' as table_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE status = 'ringing') as ringing,
  COUNT(*) FILTER (WHERE status = 'connected') as connected,
  COUNT(*) FILTER (WHERE status = 'ended') as ended
FROM customer_partner_calls
UNION ALL
SELECT 
  'customer_support_calls',
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'waiting'),
  COUNT(*) FILTER (WHERE status = 'connected'),
  COUNT(*) FILTER (WHERE status = 'ended')
FROM customer_support_calls
UNION ALL
SELECT 
  'partner_support_calls',
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'waiting'),
  COUNT(*) FILTER (WHERE status = 'connected'),
  COUNT(*) FILTER (WHERE status = 'ended')
FROM partner_support_calls;

-- 2️⃣ Son 5 müşteri-partner araması
SELECT 
  id,
  customer_id,
  partner_id,
  status,
  started_at,
  duration_seconds
FROM customer_partner_calls
ORDER BY started_at DESC
LIMIT 5;

-- 3️⃣ Aktif kuyruklar
SELECT 
  queue_id,
  COUNT(*) as waiting_count,
  MIN(queue_position) as first_position,
  MAX(queue_position) as last_position
FROM customer_support_calls
WHERE status = 'waiting'
GROUP BY queue_id
UNION ALL
SELECT 
  queue_id,
  COUNT(*),
  MIN(queue_position),
  MAX(queue_position)
FROM partner_support_calls
WHERE status = 'waiting'
GROUP BY queue_id;

-- 4️⃣ Partner kredi durumu (son kullanım)
SELECT 
  p.id,
  p.business_name,
  pc.balance,
  pc.total_used,
  pc.last_transaction
FROM partners p
LEFT JOIN partner_credits pc ON p.id = pc.partner_id
WHERE pc.balance < 10
ORDER BY pc.balance ASC
LIMIT 5;
