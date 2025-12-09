# Yolmov SUPABASE KURULUM VE MİGRASYON KILAVUZU

## 📋 İçindekiler

1. [Supabase Proje Kurulumu](#1-supabase-proje-kurulumu)
2. [Veritabanı Schema Oluşturma](#2-veritabanı-schema-oluşturma)
3. [RLS Politikalarını Aktif Etme](#3-rls-politikalarını-aktif-etme)
4. [Test Verilerini Yükleme](#4-test-verilerini-yükleme)
5. [Storage Bucket Kurulumu](#5-storage-bucket-kurulumu)
6. [Kod Tabanını Güncelleme](#6-kod-tabanını-güncelleme)
7. [Test ve Doğrulama](#7-test-ve-doğrulama)
8. [Production Deployment](#8-production-deployment)

---

## 1. Supabase Proje Kurulumu

### ✅ Tamamlandı

Proje bilgileri:
- **Proje Adı**: Yolmov
- **URL**: https://uwslxmciglqxpvfbgjzm.supabase.co
- **Bölge**: Auto (seçilmiş)

Environment variables `.env` dosyasında hazır:
```bash
VITE_SUPABASE_URL=https://uwslxmciglqxpvfbgjzm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 2. Veritabanı Schema Oluşturma

### Adım 2.1: Supabase Dashboard'a Giriş

1. https://uwslxmciglqxpvfbgjzm.supabase.co adresine git
2. SQL Editor'ü aç (sol menüden)

### Adım 2.2: Schema SQL'ini Çalıştır

1. `supabase/schema.sql` dosyasını aç
2. Tüm içeriği kopyala
3. Supabase SQL Editor'e yapıştır
4. **"RUN"** butonuna bas

**Oluşturulacak Tablolar** (17 adet):
- ✅ customers - Müşteriler
- ✅ partners - Partnerler
- ✅ admin_users - Admin kullanıcıları
- ✅ requests - Müşteri talepleri
- ✅ offers - Partner teklifleri
- ✅ completed_jobs - Tamamlanan işler
- ✅ partner_reviews - Partner değerlendirmeleri
- ✅ review_objections - Değerlendirme itirazları
- ✅ partner_documents - Partner belgeleri
- ✅ support_tickets - Destek talepleri
- ✅ partner_vehicles - Partner araçları
- ✅ partner_credits - Partner kredi bakiyeleri
- ✅ credit_transactions - Kredi işlemleri
- ✅ empty_truck_routes - Boş araç rotaları
- ✅ partner_lead_requests - Partner iş talepleri
- ✅ service_area_requests - Hizmet alanı genişletme talepleri
- ✅ system_logs - Sistem logları

**Oluşturulacak Views** (3 adet):
- ✅ partner_stats - Partner istatistikleri
- ✅ customer_stats - Müşteri istatistikleri
- ✅ daily_stats - Günlük istatistikler

### Adım 2.3: Doğrulama

SQL Editor'de şu sorguyu çalıştır:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

17 tablo görmelisin.

---

## 3. RLS Politikalarını Aktif Etme

### Adım 3.1: RLS Policies SQL'ini Çalıştır

1. `supabase/rls-policies.sql` dosyasını aç
2. Tüm içeriği kopyala
3. Supabase SQL Editor'e yapıştır
4. **"RUN"** butonuna bas

**Oluşturulacak Politikalar**:
- ✅ Customer'lar sadece kendi verilerini görebilir
- ✅ Partner'lar sadece kendi verilerini görebilir
- ✅ Admin'ler her şeyi görebilir ve yönetebilir
- ✅ Açık talepleri tüm aktif partnerler görebilir
- ✅ Teklifler ilgili taraflara görünür

### Adım 3.2: Doğrulama

SQL Editor'de şu sorguyu çalıştır:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

Her tablo için birden fazla policy görmelisin.

---

## 4. Test Verilerini Yükleme

### Adım 4.1: Seed Data SQL'ini Çalıştır

1. `supabase/seed.sql` dosyasını aç
2. Tüm içeriği kopyala
3. Supabase SQL Editor'e yapıştır
4. **"RUN"** butonuna bas

**Yüklenecek Test Verileri**:
- ✅ 4 Admin kullanıcısı
- ✅ 5 Müşteri
- ✅ 5 Partner
- ✅ 5 Talep (farklı durumlarda)
- ✅ 5 Teklif
- ✅ 3 Tamamlanmış iş
- ✅ 3 Partner değerlendirmesi
- ✅ 3 Partner aracı
- ✅ 10+ diğer test verileri

### Adım 4.2: Doğrulama

```sql
-- Veri sayılarını kontrol et
SELECT 'customers' as table_name, COUNT(*) FROM customers
UNION ALL
SELECT 'partners', COUNT(*) FROM partners
UNION ALL
SELECT 'requests', COUNT(*) FROM requests
UNION ALL
SELECT 'offers', COUNT(*) FROM offers;
```

---

## 5. Storage Bucket Kurulumu

### Adım 5.1: Partner Documents Bucket

1. Supabase Dashboard > Storage
2. **"New bucket"** tıkla
3. Ayarlar:
   - **Name**: `partner-documents`
   - **Public**: ❌ (Private)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `application/pdf,image/jpeg,image/png`

### Adım 5.2: Customer Photos Bucket

1. **"New bucket"** tıkla
2. Ayarlar:
   - **Name**: `customer-photos`
   - **Public**: ❌ (Private)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`

### Adım 5.3: Vehicle Images Bucket

1. **"New bucket"** tıkla
2. Ayarlar:
   - **Name**: `vehicle-images`
   - **Public**: ✅ (Public - araç listeleri için)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`

### Adım 5.4: Storage Policies

Her bucket için SQL Editor'de çalıştır:

```sql
-- Partner Documents (sadece partner kendi dosyalarını yükleyebilir)
CREATE POLICY "Partners can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'partner-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Partners can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'partner-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'partner-documents' AND
  EXISTS (SELECT 1 FROM admin_users WHERE id::text = auth.uid()::text)
);

-- Customer Photos (müşteriler kendi fotoğraflarını yükleyebilir)
CREATE POLICY "Customers can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Customers can view own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'customer-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Vehicle Images (public)
CREATE POLICY "Anyone can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Partners can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-images' AND
  EXISTS (SELECT 1 FROM partners WHERE id::text = auth.uid()::text)
);
```

---

## 6. Kod Tabanını Güncelleme

### Adım 6.1: API Import'larını Değiştir

Tüm component dosyalarında `mockApi` import'larını `supabaseApi` ile değiştir:

**ÖNCE:**
```typescript
import { mockApi } from '../services/mockApi';
```

**SONRA:**
```typescript
import supabaseApi from '../services/supabaseApi';
```

### Adım 6.2: API Fonksiyon Çağrılarını Güncelle

**ÖNCE:**
```typescript
const requests = mockApi.getRequests();
```

**SONRA:**
```typescript
const requests = await supabaseApi.requests.getAll();
```

### Adım 6.3: Auth Entegrasyonu

Login sayfalarını güncelle:

**CustomerProfilePage.tsx:**
```typescript
const handleLogin = async () => {
  try {
    const { user } = await supabaseApi.auth.signIn(email, password);
    // Login başarılı
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

**PartnerDashboard.tsx:**
```typescript
const handleLogin = async () => {
  try {
    const { user } = await supabaseApi.auth.signIn(email, password);
    const role = await supabaseApi.auth.getUserRole();
    if (role?.type === 'partner') {
      // Partner dashboard'a yönlendir
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

**AdminLoginPage.tsx:**
```typescript
const handleLogin = async () => {
  try {
    const { user } = await supabaseApi.auth.signIn(email, password);
    const role = await supabaseApi.auth.getUserRole();
    if (role?.type === 'admin') {
      // Admin dashboard'a yönlendir
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Adım 6.4: Real-time Updates Ekle

**OffersPanel.tsx** (Müşteri teklif listesi):
```typescript
useEffect(() => {
  if (!selectedRequest) return;

  // Real-time teklif güncellemelerini dinle
  const subscription = supabaseApi.realtime.subscribeToOffers(
    selectedRequest.id,
    (payload) => {
      console.log('Offer update:', payload);
      // Teklif listesini yenile
      loadOffers();
    }
  );

  return () => {
    supabaseApi.realtime.unsubscribe(subscription);
  };
}, [selectedRequest]);
```

**PartnerDashboard.tsx** (İş aşaması takibi):
```typescript
useEffect(() => {
  if (!currentJob) return;

  const subscription = supabaseApi.realtime.subscribeToJobStages(
    currentJob.id,
    (payload) => {
      console.log('Job stage update:', payload);
      // İş aşamasını güncelle
      setCurrentJob(payload.new);
    }
  );

  return () => {
    supabaseApi.realtime.unsubscribe(subscription);
  };
}, [currentJob]);
```

---

## 7. Test ve Doğrulama

### Test Senaryoları

#### 7.1 Müşteri Akışı

1. **Kayıt**: Yeni müşteri kaydı oluştur
   ```typescript
   await supabaseApi.auth.signUpCustomer(
     'test@customer.com',
     'password123',
     {
       first_name: 'Test',
       last_name: 'Customer',
       phone: '05321234567',
       city: 'İstanbul',
       district: 'Kadıköy',
     }
   );
   ```

2. **Giriş**: Müşteri girişi yap
3. **Talep Oluştur**: Yeni yol yardım talebi oluştur
4. **Teklifleri Gör**: Gelen teklifleri görüntüle (real-time)
5. **Teklif Kabul Et**: Bir teklifi kabul et
6. **İş Takibi**: İş aşamalarını takip et (real-time)
7. **Değerlendirme**: İş tamamlandıktan sonra değerlendirme yap

#### 7.2 Partner Akışı

1. **Kayıt**: Yeni partner kaydı oluştur
2. **Belge Yükle**: Gerekli belgeleri yükle (Storage)
3. **Açık Talepleri Gör**: Açık talepleri listele
4. **Teklif Ver**: Taleplere teklif ver
5. **Teklif Kabul Edildi**: Müşteri teklifi kabul etti (real-time bildirim)
6. **İşi Başlat**: İş aşamalarını güncelle
7. **İşi Tamamla**: İşi tamamla ve kazanç kaydı oluştur

#### 7.3 Admin Akışı

1. **Giriş**: Admin girişi yap
2. **Partner Onayla**: Bekleyen partnerleri onayla
3. **Belge İncele**: Partner belgelerini onayla/reddet
4. **Kredi Yükle**: Partner'lara kredi yükle
5. **Raporlar**: İstatistikleri görüntüle
6. **Sistem Logları**: Yapılan işlemleri gör

### Otomatik Test Komutları

```bash
# Test kullanıcısı ile veri oluştur
npm run seed-test-data

# API endpoint testleri
npm run test:api

# E2E testler
npm run test:e2e
```

---

## 8. Production Deployment

### Adım 8.1: Environment Variables

Vercel/Netlify'da environment variables ayarla:
```
VITE_SUPABASE_URL=https://uwslxmciglqxpvfbgjzm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Adım 8.2: Production Build

```bash
npm run build
```

### Adım 8.3: Deploy

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

### Adım 8.4: Production Verification

1. ✅ Auth çalışıyor mu?
2. ✅ CRUD işlemleri çalışıyor mu?
3. ✅ Real-time updates çalışıyor mu?
4. ✅ File upload çalışıyor mu?
5. ✅ RLS policies doğru çalışıyor mu?
6. ✅ Performance kabul edilebilir mi?

---

## 🎯 Migrasyon Kontrol Listesi

### Database Setup
- [ ] Schema SQL çalıştırıldı (17 tablo oluşturuldu)
- [ ] RLS policies çalıştırıldı
- [ ] Seed data yüklendi
- [ ] Views oluşturuldu
- [ ] Triggers aktif

### Storage Setup
- [ ] partner-documents bucket oluşturuldu
- [ ] customer-photos bucket oluşturuldu
- [ ] vehicle-images bucket oluşturuldu
- [ ] Storage policies uygulandı

### Code Migration
- [ ] supabaseApi.ts oluşturuldu
- [ ] Auth API entegre edildi
- [ ] Tüm CRUD fonksiyonları supabaseApi kullanıyor
- [ ] Real-time subscriptions eklendi
- [ ] File upload fonksiyonları çalışıyor

### Testing
- [ ] Müşteri akışı test edildi
- [ ] Partner akışı test edildi
- [ ] Admin akışı test edildi
- [ ] Real-time updates test edildi
- [ ] RLS policies doğrulandı

### Production
- [ ] Environment variables ayarlandı
- [ ] Production build başarılı
- [ ] Deploy edildi
- [ ] Production verification tamamlandı

---

## 🔧 Sorun Giderme

### RLS Policy Hatası
```
Error: new row violates row-level security policy
```
**Çözüm**: Auth kullanıcısının id'si ile tablo kaydının id'si eşleşiyor mu kontrol et.

### Real-time Çalışmıyor
```
Error: Realtime subscription failed
```
**Çözüm**: Supabase Dashboard > Database > Replication > Enable realtime for tables.

### Storage Upload Hatası
```
Error: new row violates policy
```
**Çözüm**: Storage policies'i kontrol et, bucket izinlerini doğrula.

### Auth Hatası
```
Error: Invalid login credentials
```
**Çözüm**: Email confirmation gerekiyor mu? Supabase Dashboard > Authentication > Settings > Email confirmation kapalı olmalı (development için).

---

## 📚 Yararlı Linkler

- [Supabase Docs](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
- [SQL Editor](https://supabase.com/docs/guides/database/overview)

---

## 🚀 Sonraki Adımlar

1. **Performance Optimization**
   - Index optimization
   - Query optimization
   - Caching strategies

2. **Advanced Features**
   - Push notifications
   - SMS integration
   - Payment gateway

3. **Monitoring**
   - Sentry error tracking
   - Analytics integration
   - Performance monitoring

4. **Backup & Security**
   - Automatic backups
   - Security audit
   - Penetration testing
