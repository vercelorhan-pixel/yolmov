# Çağrı Merkezi Migration Kılavuzu

## 🚨 Önemli: Bu migration çağrı merkezi sisteminin çalışması için GEREKLİDİR!

Admin panelde "Çevrimdışı/Çevrimiçi" butonu çalışmıyorsa veya şu hataları görüyorsanız:
- `Failed to load resource: 406 (Not Acceptable)`
- `Failed to load resource: 401 (Unauthorized)`
- `❌ [CallCenter] registerAsAgent error`

Bu migration'ı çalıştırmanız gerekiyor.

---

## 📋 Adımlar

### 1. Supabase Dashboard'a Gidin
https://supabase.com/dashboard/project/uwslxmciglqxpvfbgjzm

### 2. SQL Editor'ı Açın
Sol menüden **SQL Editor** → **New query** tıklayın

### 3. Aşağıdaki SQL'i Yapıştırın

```sql
-- =====================================================
-- FIX: call_agents RLS CORS Issue
-- =====================================================

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "call_agents_select_all" ON call_agents;
DROP POLICY IF EXISTS "call_agents_update_all" ON call_agents;
DROP POLICY IF EXISTS "call_agents_update_admin" ON call_agents;
DROP POLICY IF EXISTS "call_agents_insert_all" ON call_agents;
DROP POLICY IF EXISTS "call_agents_insert_admin" ON call_agents;

-- Yeni politikalar
CREATE POLICY "call_agents_select_all" 
ON call_agents FOR SELECT 
USING (true);

CREATE POLICY "call_agents_update_admin" 
ON call_agents FOR UPDATE 
USING (
  admin_id = auth.uid()
  OR auth.role() = 'service_role'
);

CREATE POLICY "call_agents_insert_admin" 
ON call_agents FOR INSERT 
WITH CHECK (
  admin_id = auth.uid()
  OR auth.role() = 'service_role'
);

-- call_queue_assignments için de aynı düzeltme
DROP POLICY IF EXISTS "call_queue_assignments_select_all" ON call_queue_assignments;
DROP POLICY IF EXISTS "call_queue_assignments_insert_all" ON call_queue_assignments;
DROP POLICY IF EXISTS "call_queue_assignments_update_all" ON call_queue_assignments;

CREATE POLICY "call_queue_assignments_select_all" 
ON call_queue_assignments FOR SELECT 
USING (true);

CREATE POLICY "call_queue_assignments_insert_all" 
ON call_queue_assignments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "call_queue_assignments_update_all" 
ON call_queue_assignments FOR UPDATE 
USING (true);

-- call_queues için de kontrol
DROP POLICY IF EXISTS "call_queues_select_all" ON call_queues;
DROP POLICY IF EXISTS "call_queues_update_all" ON call_queues;

CREATE POLICY "call_queues_select_all" 
ON call_queues FOR SELECT 
USING (true);

CREATE POLICY "call_queues_update_all" 
ON call_queues FOR UPDATE 
USING (
  auth.role() = 'service_role'
  OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
);
```

### 4. SQL'i Çalıştırın
Sağ üstteki **RUN** butonuna basın veya `Ctrl+Enter` yapın.

### 5. Sonucu Kontrol Edin
✅ "Success. No rows returned" mesajı görmelisiniz.

---

## 🧪 Test

1. **Admin panelden çıkış yapın**
2. **Yeniden giriş yapın**
3. **Çağrı Merkezi sayfasına gidin**
4. **"Çevrimdışı" butonuna tıklayın**
5. ✅ **Durum "Çevrimiçi" olmalı**

---

## ❓ Sorun Giderme

### Hata: "relation 'call_agents' does not exist"
**Çözüm:** Önce `migrations/027_call_center_queues_SAFE.sql` dosyasını çalıştırın.

### Hata: "permission denied for table call_agents"
**Çözüm:** Supabase'de **Service Role Key** kullandığınızdan emin olun. SQL Editor'da sağ üstte ayarlardan kontrol edin.

### Çevrimiçi olmuyor ama hata yok
**Çözüm:** 
1. Tarayıcı konsolunu açın (F12)
2. Hataları kontrol edin
3. Sayfayı yenileyin (Ctrl+Shift+R)

---

## 📞 Destek

Hala sorun yaşıyorsanız:
1. Tarayıcı konsolundaki hata mesajlarını kaydedin
2. Supabase SQL Editor'da şu sorguyu çalıştırın:
   ```sql
   SELECT * FROM call_agents WHERE admin_id = 'YOUR_ADMIN_ID';
   ```
3. Sonuçları geliştirici ekiple paylaşın

---

**Not:** Bu migration çalıştırıldıktan sonra bir daha çalıştırmanıza gerek yoktur.
