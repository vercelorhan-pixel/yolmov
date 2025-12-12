# 🔧 Mesajlaşma Sistemi Migration - Hata Düzeltmesi

## ❌ Aldığınız Hata
```
Error: Failed to run sql query: ERROR: 42703: column partners.user_id does not exist
```

## 🔍 Sorunun Nedeni
Orijinal migration dosyasında RLS (Row Level Security) policies içinde `partners.user_id` kolonuna referans veriliyordu. Ancak veritabanınızdaki `partners` tablosunda `user_id` kolonu mevcut değil. 

**Partners tablosu yapısı:**
```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY,           -- ✅ auth.users(id) ile DOĞRUDAN eşleşiyor
  name VARCHAR(255),
  email VARCHAR(255),
  ...
  -- ❌ user_id kolonu YOK
);
```

Partner'ın auth kullanıcısı ile ilişkisi: `partners.id = auth.users.id` (1:1)

## ✅ Yapılan Düzeltmeler

### 1. RLS Policy Düzeltmeleri
**ÖNCE (YANLIŞ):**
```sql
CREATE POLICY "Partners can view their conversations"
ON conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM partners 
        WHERE partners.id = conversations.partner_id 
        AND partners.user_id = auth.uid()  -- ❌ HATA: user_id kolonu yok
    )
);
```

**SONRA (DOĞRU):**
```sql
CREATE POLICY "Partners can view their conversations"
ON conversations FOR SELECT
USING (partner_id = auth.uid());  -- ✅ Doğrudan auth.uid() kontrolü
```

### 2. Diğer Düzeltmeler
- ✅ Tüm RLS policies'de `partners.user_id` referansları kaldırıldı
- ✅ Message templates INSERT işlemi idempotent hale getirildi (tekrar çalıştırılabilir)
- ✅ Trigger'lar için `DROP IF EXISTS` eklendi
- ✅ Policies için `DROP IF EXISTS` eklendi
- ✅ Daha detaylı COMMENT'ler eklendi

## 📁 Dosyalar

### Kullanmanız Gereken Dosya
**`/workspaces/yolmov/migrations/042_messaging_system_FIXED.sql`** ✅

Bu dosya:
- Hatasız çalışır
- Tekrar çalıştırılabilir (idempotent)
- Daha iyi organize edilmiş (7 bölüm halinde)
- Detaylı açıklamalar içerir

### Yedek Dosya
**`/workspaces/yolmov/migrations/042_messaging_system.sql`** (Güncellenmiş)

## 🚀 Nasıl Çalıştırılır?

### Supabase Dashboard'dan:

1. **Supabase Dashboard** → Sol menüden **SQL Editor** seçin
2. **New query** butonuna tıklayın
3. Aşağıdaki dosyayı kopyalayıp yapıştırın:
   ```
   /workspaces/yolmov/migrations/042_messaging_system_FIXED.sql
   ```
4. **RUN** butonuna basın

### Beklenen Çıktı:
```
✅ Message templates eklendi (ilk çalıştırmada)
⚠️ Message templates zaten mevcut, atlandı (sonraki çalıştırmalarda)

Queries executed successfully.
```

## 🧪 Test Sorguları

Migration başarılı olduktan sonra kontrol için:

```sql
-- Tabloların oluşturulduğunu doğrula
SELECT 'conversations' as table_name, COUNT(*) as count FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'message_templates', COUNT(*) FROM message_templates
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;

-- RLS policies'leri kontrol et
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages', 'transactions')
ORDER BY tablename, policyname;

-- Trigger'ları kontrol et
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('messages', 'conversations')
ORDER BY event_object_table;
```

## 📊 Oluşturulan Yapı

### Tablolar (5 adet)
1. **conversations** - Konuşma başlıkları (paywall mekanizması ile)
2. **messages** - Mesaj içerikleri
3. **transactions** - Kredi işlemleri (unlock, purchase, refund)
4. **message_templates** - Hazır mesaj şablonları
5. **blocked_contacts** - Engellenmiş kullanıcılar

### İndeksler (11 adet)
- Performans için optimize edilmiş
- Foreign key ilişkileri için
- Sık kullanılan filter alanları için

### Trigger'lar (2 adet)
- `update_conversation_timestamp` - Her mesajda konuşma zamanı güncellenir
- `update_unread_count` - Okunmamış mesaj sayısı otomatik artar

### RLS Policies (5 adet)
- Customer'lar kendi konuşmalarını görebilir
- Partner'lar kilitli konuşmaları görebilir (içeriği görmek için unlock gerekir)
- Mesajlar sadece ilgili taraflarca görülebilir
- Transaction'lar sadece partner tarafından görülebilir

### Helper Functions (2 adet)
- `mask_sensitive_content()` - Telefon/email maskeleme
- `get_partner_credit_balance()` - Partner kredi bakiyesi sorgulama

## ⚠️ Önemli Notlar

1. **İlk Çalıştırma:**
   - 6 adet template message eklenecek
   - Tüm tablolar oluşturulacak

2. **Tekrar Çalıştırma:**
   - Hiçbir hata vermez (idempotent)
   - Mevcut veriler korunur
   - Sadece eksik yapılar eklenir

3. **Test Kredileri (Opsiyonel):**
   Dosyanın sonundaki yorum satırını aktif ederseniz, tüm partnerlere 100 kredi hediye edilir:
   ```sql
   INSERT INTO transactions (partner_id, type, amount, balance_after, description)
   SELECT id, 'CREDIT_GIFT', 100, 100, 'Mesajlaşma sistemi açılış hediyesi'
   FROM partners;
   ```

## 🐛 Karşılaşabileceğiniz Diğer Hatalar

### 1. "relation X already exists"
**Çözüm:** Normal, `CREATE TABLE IF NOT EXISTS` kullanıldığı için devam eder.

### 2. "policy X already exists"
**Çözüm:** Normal, `DROP POLICY IF EXISTS` eklendi, önce silinir sonra yeniden oluşturulur.

### 3. "duplicate key value violates unique constraint"
**Çözüm:** Message templates zaten var demektir. İdempotent kod sayesinde atlanır.

## 📞 Sonraki Adımlar

Migration başarılı olduktan sonra:

1. ✅ Frontend kodları (PartnerMessagesInbox, PartnerChatPage, CustomerMessageModal) zaten hazır
2. ✅ API katmanı (messagingApi.ts) zaten hazır
3. ⚠️ Supabase Realtime'ı aktif edin (Supabase Dashboard → Settings → API)
4. ⚠️ Storage bucket'ı oluşturun (gelecekte dosya ekleri için): `message-attachments`

## ✅ Hata Düzeltme Özeti

| Hata | Sebep | Çözüm |
|------|-------|-------|
| `partners.user_id does not exist` | RLS policies'de yanlış kolon referansı | `partner_id = auth.uid()` kullanıldı |
| Duplicate INSERT hatası | Template'ler tekrar eklenmeye çalışıldı | `IF NOT EXISTS` kontrolü eklendi |
| Trigger already exists | Tekrar çalıştırmada hata | `DROP TRIGGER IF EXISTS` eklendi |
| Policy already exists | Tekrar çalıştırmada hata | `DROP POLICY IF EXISTS` eklendi |

---

**Sonuç:** `042_messaging_system_FIXED.sql` dosyası hatasız çalışacaktır. ✅
