# 🧪 YOLMOV Çağrı Sistemi Test Senaryoları

**Tarih:** 11 Aralık 2025  
**Versiyon:** 1.0

---

## 📋 Test Ortamı Hazırlığı

### Gerekli Kullanıcılar:
1. **Customer** (Son Kullanıcı) - Web sitesinden giriş yapan veya anonim
2. **Partner** - Partner dashboard'a giriş yapan
3. **Admin** - Admin panele giriş yapan ve agent olarak online olan

### Kontrol Listesi:
- [ ] Admin çağrı merkezinde "Online" durumda
- [ ] Admin `general-support` ve `partner-calls` queue'larına atanmış
- [ ] Partner'ın en az 1 kredisi var
- [ ] Tüm tarayıcılarda mikrofon izni verilmiş
- [ ] Browser console açık (F12 → Console)

---

## 🔵 BÖLÜM A: Customer → Partner (Direkt Arama)

### TEST A1: Başarılı Arama
**Senaryo:** Müşteri partner'ı arar, partner cevaplar, görüşme yapılır, sonlandırılır.

**Adımlar:**
1. Müşteri olarak partner detay sayfasına git
2. "Hemen Ara" butonuna tıkla
3. Mikrofon iznini ver
4. Partner dashboard'da gelen arama bildirimini gör
5. Partner "Cevapla" butonuna tıkla
6. Her iki tarafta ses iletişimi test et
7. Müşteri görüşmeyi sonlandırır

**Beklenen Davranış:**
- ✅ Müşteri: Status `calling` → `connected` → `ended`
- ✅ Partner: Status `ringing` → `connected` → `ended`
- ✅ Partner'dan 1 kredi düşer
- ✅ `calls` tablosunda kayıt oluşur: `caller_type='customer'`, `receiver_type='partner'`
- ✅ Console log'larında `[Customer→Partner]` prefix'i görülür

**Console Log Kontrol:**
```
📞 [Customer→Partner] Initiating direct call to partner: xxx
📞 [Customer→Partner] ✅ Using EXISTING call ID (queue): xxx   // VEYA
📞 [Customer→Partner] No existing call ID - will create NEW record
📞 [Customer→Partner] Got SDP answer, signaling peer...
📞 [Customer→Partner] Peer connected!
```

---

### TEST A2: Partner Reddetme
**Senaryo:** Müşteri arar, partner reddeder.

**Adımlar:**
1. Müşteri partner'ı arar
2. Partner "Reddet" butonuna tıklar

**Beklenen Davranış:**
- ✅ Müşteri: Status `calling` → `ended`, error: "Arama reddedildi"
- ✅ Partner'dan kredi düşmez
- ✅ `calls.status = 'rejected'`

---

### TEST A3: Partner Yetersiz Kredi
**Senaryo:** Partner'ın kredisi yok, arama gelir.

**Adımlar:**
1. Partner kredisini 0 yap (DB'den)
2. Müşteri partner'ı arar
3. Partner cevaplamaya çalışır

**Beklenen Davranış:**
- ✅ Partner: "Yetersiz kredi!" hatası görür
- ✅ Arama otomatik reddedilir
- ✅ `calls.end_reason = 'insufficient_credits'`

---

### TEST A4: 30 Saniye Timeout
**Senaryo:** Müşteri arar, partner 30 saniye içinde cevap vermez.

**Beklenen Davranış:**
- ✅ Müşteri: 30sn sonra "Cevap yok" mesajı
- ✅ `calls.status = 'missed'`

---

## 🟢 BÖLÜM B: Customer → Destek Hattı (Queue ile)

### TEST B1: Başarılı Destek Araması
**Senaryo:** Müşteri destek hattını arar, admin cevaplar.

**Adımlar:**
1. Web sitesinde "Bizi Arayın" butonuna tıkla
2. İsim ve telefon gir (opsiyonel)
3. "Ara" butonuna tıkla
4. Admin panelinde gelen arama bildirimi gör
5. Admin cevapla

**Beklenen Davranış:**
- ✅ `call_queue_assignments` tablosunda kayıt oluşur
- ✅ `calls` tablosu: `caller_type='customer'`, `receiver_type='admin'`
- ✅ `call_source = 'queue'`
- ✅ Admin'den kredi DÜŞMEZ
- ✅ Console: `[Customer→Support]` prefix'i

**Console Log Kontrol:**
```
📞 [Customer→Support] Initiating support call via queue
📞 [Customer→Support] Added to queue: xxx
📞 [Customer→Support] Starting WebRTC to agent: xxx
```

---

### TEST B2: Admin Offline
**Senaryo:** Tüm adminler offline, müşteri destek hattını arar.

**Adımlar:**
1. Admin'i offline yap
2. Müşteri destek hattını arar

**Beklenen Davranış:**
- ✅ Müşteri: "Şu an tüm temsilcilerimiz meşgul" hatası
- ✅ Çağrı başlatılmaz
- ✅ `call_queue_assignments.status = 'waiting'` kalır

---

### TEST B3: Anonim Arayan
**Senaryo:** Giriş yapmadan destek hattı aranır.

**Beklenen Davranış:**
- ✅ `caller_id` "anon_xxx" formatında
- ✅ Arama normal çalışır

---

## 🟣 BÖLÜM C: Partner → Destek Hattı (Queue ile)

### TEST C1: Partner Destek Araması
**Senaryo:** Partner, admin destek hattını arar.

**Adımlar:**
1. Partner dashboard'a giriş yap
2. "Destek Hattını Ara" butonuna tıkla
3. Onay modalında "Ara" tıkla
4. Admin cevapla

**Beklenen Davranış:**
- ✅ `call_queue_assignments`: `queue_id = partner-calls queue'sunun id'si`
- ✅ `calls`: `caller_type='partner'`, `receiver_type='admin'`
- ✅ Partner'dan kredi DÜŞMEZ (admin cevaplıyor)
- ✅ Console: `[Partner→Support]` prefix'i

**Console Log Kontrol:**
```
📞 [Partner→Support] Initiating partner support call via queue
📞 [Partner→Support] Added to queue: xxx
📞 [Partner→Support] Starting WebRTC to agent: xxx
```

---

### TEST C2: Partner Bilgileri Otomatik Doldurulur
**Senaryo:** Partner araması yaparken isim/telefon otomatik alınır.

**Beklenen Davranış:**
- ✅ `call_queue_assignments.caller_name` = Partner'ın company_name'i
- ✅ `call_queue_assignments.caller_phone` = Partner'ın telefonu

---

## 🔴 REGRESYON TESTLERİ

### TEST R1: Cross-Type Çakışma
**Senaryo:** Admin hem partner hem customer'dan arama alabilmeli.

**Adımlar:**
1. Customer destek hattını arar → Admin cevaplar → Sonlandır
2. Hemen ardından Partner destek hattını arar → Admin cevaplar

**Beklenen Davranış:**
- ✅ Her iki arama da bağımsız çalışır
- ✅ İkisi de `receiver_type='admin'`
- ✅ `caller_type` doğru set edilir

---

### TEST R2: Receiver Type Filtresi
**Senaryo:** Partner, Admin'e gelen çağrıyı görMEmeli.

**Adımlar:**
1. Partner dashboard'da bekle
2. Customer → Admin araması yap
3. Partner'da gelen arama bildirimi OLMAMALI

**Beklenen Davranış:**
- ✅ Partner'a bildirim gelmez
- ✅ Console: "Call receiver_type mismatch" log'u

---

### TEST R3: Eşzamanlı Çağrılar
**Senaryo:** Aynı anda iki farklı customer iki farklı partner'ı arar.

**Beklenen Davranış:**
- ✅ Her iki arama da bağımsız çalışır
- ✅ Çakışma olmaz

---

## ✅ TEST SONUÇ FORMU

| Test ID | Durum | Notlar |
|---------|-------|--------|
| A1 | ⬜ | |
| A2 | ⬜ | |
| A3 | ⬜ | |
| A4 | ⬜ | |
| B1 | ⬜ | |
| B2 | ⬜ | |
| B3 | ⬜ | |
| C1 | ⬜ | |
| C2 | ⬜ | |
| R1 | ⬜ | |
| R2 | ⬜ | |
| R3 | ⬜ | |

**Durum Göstergesi:**
- ✅ Başarılı
- ❌ Başarısız
- ⚠️ Kısmen başarılı
- ⬜ Test edilmedi

---

## 📝 HATA RAPORLAMA

Bir test başarısız olursa aşağıdaki bilgileri kaydedin:

1. **Test ID:** 
2. **Hata mesajı:** 
3. **Console log'ları:** (Screenshot)
4. **Network istekleri:** (F12 → Network)
5. **Supabase log'ları:** (Dashboard → Logs)
6. **Reproduktion adımları:**

---

*Bu test dokümanı otomatik oluşturulmuştur.*
