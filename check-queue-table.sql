-- call_queue_assignments tablosunun yapısını kontrol et
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'call_queue_assignments'
ORDER BY ordinal_position;
