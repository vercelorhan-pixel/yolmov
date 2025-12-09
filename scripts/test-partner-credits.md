# Partner Credits Sorunu - Test ve Çözüm

## Tespit Edilen Sorunlar

### 1. ❌ Admin'den Kredi Ekleme Supabase'e Kaydedilmiyordu
**Sorun:** `handleAddCredit` fonksiyonu sadece local state güncelliyor, Supabase'e kaydetmiyordu.

**Çözüm:** 
- `supabaseApi.partnerCredits.addCredits()` kullanılarak gerçek veritabanına kaydediliyor
- Eğer partner_credits kaydı yoksa otomatik oluşturuluyor
- Admin panelinde güncel bakiye partner_credits tablosundan çekiliyor

### 2. ❌ Partner Dashboard Credits Yüklemesi Hatalıydı
**Sorun:** useEffect çalışıyor ama CURRENT_PARTNER_ID boş olabiliyordu.

**Çözüm:**
- Detaylı console.log'lar eklendi
- Partner ID kontrolü yapılıyor
- Her 10 saniyede bir otomatik güncelleme

### 3. ❌ Admin Paneli Eski Credits Gösteriyordu
**Sorun:** Admin paneli partners tablosundaki credits kolonunu gösteriyordu (güncel değil).

**Çözüm:**
- Partner detay yüklenirken partner_credits tablosundan güncel bakiye çekiliyor

## Test Adımları

### 1. Admin Panelinde Test
```
1. Admin → Partners → Partner Seç (Yolmov 8)
2. "Kredi Ekle" butonuna tıkla
3. Kredi miktarı gir (örn: 5)
4. Console'da şu logları göreceksin:
   - "💰 [Admin] Adding credits to partner: xxx"
   - "✅ [Admin] Credits added successfully"
```

### 2. Partner Dashboard'da Test
```
1. Partner olarak giriş yap
2. Console'u aç
3. Şu logları göreceksin:
   - "🔍 [Credits] CURRENT_PARTNER_ID: xxx"
   - "💰 [Credits] Loading credits for partner: xxx"
   - "✅ [Credits] Partner credits loaded: 5"
4. Bakiye kısmında "5 Kredi" görünecek
```

### 3. Realtime Test
```
1. Partner dashboard'u aç
2. Başka sekmede admin panel aç
3. Admin'den kredi ekle
4. Partner dashboard'da 10 saniye içinde güncellenir
```

## Veritabanı Yapısı

### partner_credits Tablosu
```sql
- id: UUID (primary key)
- partner_id: UUID (unique, foreign key to partners.id)
- partner_name: VARCHAR(255)
- balance: INTEGER (güncel bakiye)
- total_purchased: INTEGER (toplam satın alınan)
- total_used: INTEGER (toplam kullanılan)
- last_transaction: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### credit_transactions Tablosu
```sql
- id: UUID (primary key)
- partner_id: UUID (foreign key)
- partner_name: VARCHAR(255)
- type: transaction_type ('purchase' | 'usage')
- amount: INTEGER
- balance_before: INTEGER
- balance_after: INTEGER
- description: TEXT
- request_id: UUID (opsiyonel)
- admin_user: UUID (opsiyonel)
- created_at: TIMESTAMPTZ
```

### Trigger
`trigger_update_partner_credits`: credit_transactions'a kayıt eklendiğinde otomatik olarak partner_credits.balance günceller

## Kod Değişiklikleri

### AdminDashboard.tsx
1. `supabase` client import edildi
2. `handleAddCredit` async yapıldı ve Supabase'e kaydediyor
3. Partner detay yüklenirken partner_credits'ten bakiye çekiliyor

### PartnerDashboard.tsx
1. Credits yükleme useEffect eklendi
2. Her 10 saniyede realtime güncelleme
3. Detaylı console.log'lar (debug için)
4. Teklif verirken kredi kullanımı API'ye bağlandı

## Beklenen Sonuç

✅ Admin'den eklenen krediler anında partner_credits tablosuna kaydediliyor
✅ Partner dashboard açıldığında Supabase'den güncel bakiye yükleniyor
✅ Her 10 saniyede otomatik güncelleme
✅ Teklif verildiğinde kredi düşüyor ve transaction kaydı oluşuyor
✅ Admin panelinde güncel bakiye görünüyor
