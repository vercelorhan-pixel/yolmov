# Migration 013: completed_jobs.request_id Kolonu

## 🎯 Amaç
Müşteri değerlendirme (partner review) oluşturulurken `completed_jobs.id` gerekiyor, ancak müşteri sadece `transport_requests.id`'yi biliyor. Bu ilişkiyi sağlamak için `request_id` kolonu ekliyoruz.

## ❌ Sorun
```
POST /rest/v1/partner_reviews 409 Conflict
Key (job_id)=(xxx) is not present in table "completed_jobs"
```

**Sebep:** Müşteri `transport_requests.id`'yi `job_id` olarak gönderiyordu, ancak `partner_reviews.job_id` foreign key olarak `completed_jobs.id`'yi bekliyor.

## ✅ Çözüm

### 1. Migration'ı Çalıştır
**Supabase Dashboard > SQL Editor > New Query**

```sql
-- migrations/013_add_request_id_to_completed_jobs.sql dosyasını kopyala-yapıştır
```

### 2. Completed Jobs Oluştururken request_id Ekle
`supabaseApi.ts` veya partner dashboard'da completed job oluştururken:

```typescript
await supabase.from('completed_jobs').insert({
  // ... diğer alanlar
  request_id: requestId, // ✅ EKLE
  partner_id: partnerId,
  customer_id: customerId,
  // ...
});
```

### 3. Review Oluştururken Completed Job Bul
`OffersPanel.tsx` güncellendi:

```typescript
// ❌ ESKİ: Yanlış - request.id kullanıyordu
jobId: requestToRate.id

// ✅ YENİ: Doğru - completed_jobs'dan bul
const completedJobs = await supabaseApi.completedJobs.getByCustomerId(customerId);
const completedJob = completedJobs.find(job => job.request_id === requestToRate.id);
jobId: completedJob.id
```

## 📋 Test

### 1. Migration Kontrolü
```sql
-- Kolon var mı kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'completed_jobs' 
AND column_name = 'request_id';

-- Beklenen output:
-- request_id | uuid
```

### 2. İndeks Kontrolü
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'completed_jobs' 
AND indexname = 'idx_completed_jobs_request_id';

-- Beklenen output:
-- idx_completed_jobs_request_id
```

### 3. Foreign Key Kontrolü
```sql
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'completed_jobs'::regclass
AND conname LIKE '%request_id%';

-- Beklenen output:
-- completed_jobs_request_id_fkey | f (foreign key)
```

## 🔄 Güncellenecek Kod Yerleri

### 1. Partner Dashboard - İş Tamamlama
`components/PartnerDashboard.tsx` içinde `handleCompleteJob`:

```typescript
// Completed job kaydı oluştur
await supabaseApi.completedJobs.create({
  request_id: requestId, // ✅ EKLE
  partner_id: partnerId,
  customer_id: customerId,
  // ...
});
```

### 2. Admin Dashboard - Manuel İş Kapatma
Eğer admin panelde manuel tamamlama varsa oraya da ekle.

## 📊 İlişki Şeması

```
┌─────────────────────┐
│ transport_requests  │
│ ─────────────────── │
│ id (PK)             │───┐
│ customer_id         │   │
│ assigned_partner_id │   │
│ status              │   │
└─────────────────────┘   │
                          │ references
                          │
┌─────────────────────┐   │
│ completed_jobs      │   │
│ ─────────────────── │   │
│ id (PK)             │   │
│ request_id (FK) ────────┘
│ partner_id          │
│ customer_id         │
└─────────────────────┘
          │ references
          │
┌─────────────────────┐
│ partner_reviews     │
│ ─────────────────── │
│ id (PK)             │
│ job_id (FK) ────────┘
│ partner_id          │
│ customer_id         │
│ rating              │
└─────────────────────┘
```

## ⚠️ Önemli Notlar

1. **Mevcut Kayıtlar:** Migration sonrası mevcut `completed_jobs` kayıtlarının `request_id` değeri `NULL` olacak. Bunları manuel düzeltmek gerekebilir.

2. **Rating Sistemi:** Migration 012'deki rating trigger'ı da aktif olmalı ki review eklenince partner rating otomatik güncellensin.

3. **RLS Policies:** `completed_jobs` ve `partner_reviews` tablolarında RLS policy'lerin doğru ayarlandığından emin olun.

## 🚀 Deployment Sonrası Test

1. Müşteri tamamlanmış bir işi değerlendirsin
2. Console'da hata olmamalı
3. `partner_reviews` tablosuna kayıt eklenmelisupabase.co/dashboard/project/uwslxmciglqxpvfbgjzm/editor

4. Partner rating'i otomatik güncellenmeli

---

**Son Güncelleme:** 2025-12-07
