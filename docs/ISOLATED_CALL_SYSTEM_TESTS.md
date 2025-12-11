# 🧪 TAM İZOLASYON SİSTEMİ - TEST SENARYOLARI

## 📋 TEST PLANI

Her çağrı tipini **tamamen bağımsız** test edeceğiz.

---

## 🎯 BÖLÜM 1: MÜŞTERİ → PARTNER ÇAĞRI TESTLERİ

### Test 1.1: Başarılı Direkt Arama

**Senaryo:**
1. Müşteri partner profiline gider
2. "Partner'ı Ara" butonuna tıklar
3. Partner aramayı cevaplar
4. 30 saniye konuşurlar
5. Müşteri aramayı sonlandırır

**Beklenen Sonuç:**
- ✅ `customer_partner_calls` tablosuna kayıt eklenir
- ✅ Partner'ın kredisi 1 azalır (cevapladığında)
- ✅ `status`: ringing → connected → ended
- ✅ `duration_seconds`: ~30
- ✅ `credit_deducted`: true

**SQL Kontrolü:**
```sql
-- Son aramayı kontrol et
SELECT 
  id,
  customer_id,
  partner_id,
  status,
  credit_deducted,
  duration_seconds,
  started_at,
  connected_at,
  ended_at
FROM customer_partner_calls
ORDER BY started_at DESC
LIMIT 1;
```

**Console Log Kontrolü:**
```
[CustomerToPartner] Arama başlatılıyor: <partner-id>
[CustomerToPartner] 🎤 Mikrofon erişimi sağlandı
[CustomerToPartner] SDP Offer oluşturuldu
[CustomerToPartner] ✅ Arama oluşturuldu: <call-id>
[CustomerToPartner] Partner aramayı cevaplıyor: <call-id>
[CustomerToPartner] SDP Answer oluşturuldu
[CustomerToPartner] ✅ Arama bağlandı ve kredi düşürüldü
[CustomerToPartner] ✅ Remote stream alındı
[CustomerToPartner] Arama sonlandırılıyor
[CustomerToPartner] ✅ Arama sonlandırıldı: 30 saniye
```

---

### Test 1.2: Partner Aramayı Reddeder (Kredi Düşmez)

**Senaryo:**
1. Müşteri partner'ı arar
2. Partner "Reddet" butonuna tıklar
3. Arama sonlanır

**Beklenen Sonuç:**
- ✅ `status`: ringing → rejected
- ✅ `credit_deducted`: false (KREDİ DÜŞMEZ!)
- ✅ `end_reason`: receiver_ended

**SQL Kontrolü:**
```sql
SELECT 
  status,
  credit_deducted,
  end_reason
FROM customer_partner_calls
WHERE status = 'rejected'
ORDER BY started_at DESC
LIMIT 1;

-- Sonuç:
-- status: rejected
-- credit_deducted: false
-- end_reason: receiver_ended
```

---

### Test 1.3: Anonim Müşteri Araması

**Senaryo:**
1. Giriş yapmamış müşteri partner'ı arar
2. `customer_id`: "anon_<timestamp>" olarak kaydedilir

**Beklenen Sonuç:**
- ✅ Anonim müşteri ara bilmeli
- ✅ `customer_id` LIKE 'anon_%'

**SQL Kontrolü:**
```sql
SELECT 
  customer_id,
  status
FROM customer_partner_calls
WHERE customer_id LIKE 'anon_%'
ORDER BY started_at DESC
LIMIT 5;
```

---

## 🎯 BÖLÜM 2: MÜŞTERİ → DESTEK ÇAĞRI TESTLERİ

### Test 2.1: Kuyruk Sistemi - Müsait Agent Var

**Senaryo:**
1. Müşteri "Destek Hattını Ara" butonuna tıklar
2. Çağrı kuyruğa eklenir
3. Müsait agent otomatik atanır
4. Agent aramayı cevaplar
5. 60 saniye konuşurlar

**Beklenen Sonuç:**
- ✅ `customer_support_calls` tablosuna eklenir
- ✅ `status`: waiting → ringing → connected → ended
- ✅ `queue_position`: 1 (veya sıradaki numara)
- ✅ `admin_id`: atanan agent
- ✅ `wait_time_seconds`: < 5 saniye (hızlı atama)
- ✅ `duration_seconds`: ~60

**SQL Kontrolü:**
```sql
SELECT 
  id,
  customer_id,
  admin_id,
  queue_position,
  wait_time_seconds,
  status,
  started_at,
  assigned_at,
  connected_at,
  ended_at
FROM customer_support_calls
ORDER BY started_at DESC
LIMIT 1;
```

**Console Log:**
```
[CustomerToSupport] Destek hattı aranıyor
[CustomerToSupport] SDP Offer oluşturuldu
[CustomerToSupport] ✅ Kuyruğa eklendi: {call_id, position: 1}
[CustomerToSupport] Realtime subscription başlatılıyor
[CustomerToSupport] Agent atandı, çalıyor...
[CustomerToSupport] Agent aramayı cevaplıyor: <call-id>
[CustomerToSupport] SDP Answer oluşturuldu
[CustomerToSupport] ✅ Arama bağlandı
[CustomerToSupport] ✅ Agent stream alındı
```

---

### Test 2.2: Kuyruk Sistemi - Agent Yok (Bekleme)

**Senaryo:**
1. Tüm agent'lar meşgul
2. Müşteri destek hattını arar
3. Kuyrukta bekler

**Beklenen Sonuç:**
- ✅ `status`: waiting
- ✅ `queue_position`: artan numara (2, 3, 4...)
- ✅ `admin_id`: NULL
- ✅ Frontend'de "Sıradaki: X" mesajı

**SQL Kontrolü:**
```sql
-- Bekleyen çağrıları gör
SELECT 
  id,
  customer_id,
  queue_position,
  started_at,
  NOW() - started_at AS bekleme_suresi
FROM customer_support_calls
WHERE status = 'waiting'
ORDER BY queue_position ASC;
```

---

### Test 2.3: Agent Notu ve Kalite Puanı

**Senaryo:**
1. Agent müşteri ile konuşur
2. Not ekler: "Fiyat sorusu, bilgi verildi"
3. Müşteri aramayı 5 yıldız puanlar

**Beklenen Sonuç:**
- ✅ `notes`: "Fiyat sorusu, bilgi verildi"
- ✅ `quality_rating`: 5

**Backend Test:**
```typescript
import * as CustomerSupportService from './services/calls/customerToSupport';

// Not ekle
await CustomerSupportService.addCallNotes(
  'call-id-123',
  'Fiyat sorusu, bilgi verildi'
);

// Puan ver
await CustomerSupportService.rateCall('call-id-123', 5);
```

**SQL Kontrolü:**
```sql
SELECT 
  id,
  notes,
  quality_rating
FROM customer_support_calls
WHERE notes IS NOT NULL
LIMIT 5;
```

---

## 🎯 BÖLÜM 3: PARTNER → DESTEK ÇAĞRI TESTLERİ

### Test 3.1: Öncelikli Kuyruk - Normal Öncelik

**Senaryo:**
1. Partner "Destek Hattını Ara" butonuna tıklar
2. `priority_level`: 0 (normal)
3. Kuyrukta bekler

**Beklenen Sonuç:**
- ✅ `partner_support_calls` tablosuna eklenir
- ✅ `priority_level`: 0
- ✅ `queue_position`: sıradaki numara

**SQL Kontrolü:**
```sql
SELECT 
  id,
  partner_id,
  queue_position,
  priority_level,
  status
FROM partner_support_calls
WHERE priority_level = 0
ORDER BY started_at DESC
LIMIT 5;
```

---

### Test 3.2: Öncelikli Kuyruk - Yüksek Öncelik

**Senaryo:**
1. Partner acil durum için destek arar
2. `priority_level`: 5 (yüksek)
3. Diğer bekleyen partner'lardan ÖNCE atanır

**Beklenen Sonuç:**
- ✅ `priority_level`: 5
- ✅ Normal (0) öncelikli partner'lardan önce agent ataması
- ✅ Kuyrukta yukarı çıkar

**Backend Test:**
```typescript
import * as PartnerSupportService from './services/calls/partnerToSupport';

// Yüksek öncelikli arama
await PartnerSupportService.startPartnerToSupportCall({
  partner_id: 'partner-123',
  sdp_offer: offerData,
  priority_level: 5
});
```

**SQL Kontrolü (Sıralama):**
```sql
-- Bekleyen partner çağrıları (öncelik sırasına göre)
SELECT 
  id,
  partner_id,
  queue_position,
  priority_level,
  started_at
FROM partner_support_calls
WHERE status = 'waiting'
ORDER BY 
  priority_level DESC,  -- Yüksek önce
  queue_position ASC    -- Sonra sıra
LIMIT 10;
```

---

### Test 3.3: Partner Arama Geçmişi

**Senaryo:**
1. Partner dashboard'ına gider
2. "Destek Arama Geçmişim" sayfasını açar

**Beklenen Sonuç:**
- ✅ Partner'a ait tüm aramalar listelenir
- ✅ Sadece o partner'ın aramaları görünür (RLS)

**Backend Test:**
```typescript
const result = await PartnerSupportService.getPartnerSupportHistory(
  'partner-123',
  50
);

console.log('Partner arama geçmişi:', result.calls);
```

**SQL Kontrolü:**
```sql
SELECT 
  id,
  status,
  duration_seconds,
  quality_rating,
  notes,
  started_at,
  ended_at
FROM partner_support_calls
WHERE partner_id = 'partner-123'
ORDER BY started_at DESC
LIMIT 10;
```

---

## 🔒 BÖLÜM 4: RLS POLİCY TESTLERİ

### Test 4.1: Customer Only Sees Own Calls

**Senaryo:**
1. Customer A aramalarını listeler
2. Customer B'nin aramalarını görmemeli

**SQL Test:**
```sql
-- Customer A context'i ile
SET app.current_user_id = 'customer-a-id';

SELECT count(*) 
FROM customer_partner_calls;
-- Sonuç: Sadece customer A'nın aramaları

-- Customer B context'i ile
SET app.current_user_id = 'customer-b-id';

SELECT count(*) 
FROM customer_partner_calls;
-- Sonuç: Sadece customer B'nin aramaları
```

---

### Test 4.2: Partner Only Sees Own Calls

**SQL Test:**
```sql
-- Partner context
SELECT count(*) 
FROM customer_partner_calls
WHERE partner_id = (
  SELECT id FROM partners WHERE user_id = auth.uid()
);
-- Sonuç: Sadece o partner'a gelen aramalar
```

---

### Test 4.3: Admin Sees Assigned Calls Only

**SQL Test:**
```sql
-- Admin context
SELECT count(*) 
FROM customer_support_calls
WHERE admin_id = auth.uid()
   OR admin_id IS NULL; -- Atanmamışlar da görünür

-- Başka admin'e atanan aramalar GÖRÜNMEMELİ
```

---

## 📊 BÖLÜM 5: İZOLASYON DOĞRULAMA TESTLERİ

### Test 5.1: Tablolar Birbirini Etkilemez

**Senaryo:**
1. Müşteri → Partner araması yapılır
2. Aynı anda Müşteri → Destek araması yapılır
3. Aynı anda Partner → Destek araması yapılır

**Beklenen Sonuç:**
- ✅ Her arama kendi tablosuna gider
- ✅ Hiçbiri diğerini etkilemez
- ✅ 3 farklı `call_id` oluşur

**SQL Kontrolü:**
```sql
-- Aynı zamanda 3 farklı tablo
SELECT 'customer_partner' AS type, count(*) FROM customer_partner_calls WHERE started_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 'customer_support', count(*) FROM customer_support_calls WHERE started_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 'partner_support', count(*) FROM partner_support_calls WHERE started_at > NOW() - INTERVAL '1 hour';
```

---

### Test 5.2: Context'ler Birbirini Etkilemez

**Component Test:**
```typescript
// Aynı component içinde 3 hook kullan
function TestComponent() {
  const cpCall = useCustomerPartnerCall();
  const csCall = useCustomerSupportCall();
  const psCall = usePartnerSupportCall();

  // Hepsi ayrı state'lere sahip olmalı
  console.log('CP Call:', cpCall.currentCall);
  console.log('CS Call:', csCall.currentCall);
  console.log('PS Call:', psCall.currentCall);
  
  // Her biri bağımsız çalışmalı
}
```

---

### Test 5.3: Realtime Subscription İzolasyonu

**Senaryo:**
1. Customer → Partner araması başlat
2. Customer → Support araması başlat
3. Her biri kendi channel'ını dinler

**Beklenen Sonuç:**
- ✅ `customer_partner_call:<id>` channel
- ✅ `customer_support_call:<id>` channel
- ✅ İki subscription birbirini tetiklemez

**Console Kontrolü:**
```
[CustomerToPartner] Realtime subscription: customer_partner_call:abc123
[CustomerToSupport] Realtime subscription: customer_support_call:def456

// Güncellemeler karışmaz:
[CustomerToPartner] Realtime güncelleme: {id: abc123, ...}
[CustomerToSupport] Realtime güncelleme: {id: def456, ...}
```

---

## ✅ TEST BAŞARI KRİTERLERİ

| Test | Başarı Kriteri | Durum |
|------|----------------|-------|
| **1.1** | Partner araması başarılı, kredi düşer | ⏳ |
| **1.2** | Partner red, kredi düşmez | ⏳ |
| **1.3** | Anonim arama çalışır | ⏳ |
| **2.1** | Destek kuyruğu çalışır | ⏳ |
| **2.2** | Kuyrukta bekleme doğru | ⏳ |
| **2.3** | Agent notu ve puan | ⏳ |
| **3.1** | Partner destek normal | ⏳ |
| **3.2** | Partner destek öncelikli | ⏳ |
| **3.3** | Partner geçmişi doğru | ⏳ |
| **4.1** | Customer RLS çalışır | ⏳ |
| **4.2** | Partner RLS çalışır | ⏳ |
| **4.3** | Admin RLS çalışır | ⏳ |
| **5.1** | Tablolar izole | ⏳ |
| **5.2** | Context'ler izole | ⏳ |
| **5.3** | Realtime izole | ⏳ |

---

## 🔧 HATA AYIKLAMA REHBERİ

### Hata: "Çağrı bulunamadı"
**Neden:** RLS policy kullanıcıya erişim vermiyor
**Çözüm:** 
```sql
-- RLS policy'leri kontrol et
SELECT * FROM pg_policies 
WHERE tablename LIKE '%_calls';
```

### Hata: "Mikrofon erişimi engellenmiş"
**Neden:** Browser mikrofon izni vermemiş
**Çözüm:** Browser ayarlarından mikrofon izni ver (HTTPS gerekli)

### Hata: "Peer bağlantı hatası"
**Neden:** STUN/TURN server'a erişim sorunu
**Çözüm:** 
- Network bağlantısını kontrol et
- Farklı STUN server dene
- TURN server ekle (NAT traversal için)

### Hata: "SDP Answer gelmedi"
**Neden:** Realtime subscription çalışmıyor
**Çözüm:**
```sql
-- Supabase Realtime aktif mi?
SELECT * FROM pg_publication;
```

---

## 📝 TEST RAPORU ŞABLONU

```
TEST RAPORU
===========
Tarih: __________
Test Eden: __________

BÖLÜM 1: Müşteri → Partner
- Test 1.1: [ ] Başarılı  [ ] Başarısız
- Test 1.2: [ ] Başarılı  [ ] Başarısız
- Test 1.3: [ ] Başarılı  [ ] Başarısız

BÖLÜM 2: Müşteri → Destek
- Test 2.1: [ ] Başarılı  [ ] Başarısız
- Test 2.2: [ ] Başarılı  [ ] Başarısız
- Test 2.3: [ ] Başarılı  [ ] Başarısız

BÖLÜM 3: Partner → Destek
- Test 3.1: [ ] Başarılı  [ ] Başarısız
- Test 3.2: [ ] Başarılı  [ ] Başarısız
- Test 3.3: [ ] Başarılı  [ ] Başarısız

BÖLÜM 4: RLS Policies
- Test 4.1: [ ] Başarılı  [ ] Başarısız
- Test 4.2: [ ] Başarılı  [ ] Başarısız
- Test 4.3: [ ] Başarılı  [ ] Başarısız

BÖLÜM 5: İzolasyon
- Test 5.1: [ ] Başarılı  [ ] Başarısız
- Test 5.2: [ ] Başarılı  [ ] Başarısız
- Test 5.3: [ ] Başarılı  [ ] Başarısız

GENEL NOTLAR:
_________________________________
_________________________________
_________________________________
```

---

**🎯 TEST SÜRECİ BAŞLADI**

Her test senaryosunu sırayla uygulayın ve sonuçları kaydedin!
