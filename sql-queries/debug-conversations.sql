-- Debug: Tüm conversations tablosunu kontrol et
SELECT 
  c.id as conversation_id,
  c.partner_id,
  c.customer_id,
  c.status,
  c.is_unlocked,
  c.created_at,
  p.company_name,
  (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count
FROM conversations c
LEFT JOIN partners p ON p.id = c.partner_id
ORDER BY c.created_at DESC
LIMIT 20;

-- Partner ID'yi kontrol et
SELECT id, company_name, name 
FROM partners 
WHERE company_name LIKE '%Yolmov%' OR id = 'acbc5d37-b471-4b09-a01c-866fc009e8c3';

-- Specific partner için konuşmaları getir
SELECT * 
FROM conversations 
WHERE partner_id = 'acbc5d37-b471-4b09-a01c-866fc009e8c3';

-- Messages tablosundaki tüm mesajları ve conversation detaylarını kontrol et
SELECT 
  m.id as message_id,
  m.conversation_id,
  m.sender_type,
  m.content,
  m.created_at,
  c.partner_id,
  c.customer_id,
  c.status as conv_status
FROM messages m
LEFT JOIN conversations c ON c.id = m.conversation_id
ORDER BY m.created_at DESC
LIMIT 20;

-- Eğer conversations'da partner_id NULL veya yanlışsa düzelt:
-- UPDATE conversations 
-- SET partner_id = 'DOĞRU_PARTNER_ID'
-- WHERE id = 'CONVERSATION_ID';
