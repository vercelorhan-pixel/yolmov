# 📋 YOLMOV Çağrı Sistemi Değişiklik Özeti

**Tarih:** 11 Aralık 2025  
**Kapsam:** Çağrı sistemi karışıklıklarının çözümü ve 3 bölümlü izolasyon

---

## 🎯 YAPILAN ÇALIŞMA

### Analiz Aşaması

1. **Veritabanı Şeması İncelendi:**
   - `calls` tablosu (007_voice_calls.sql)
   - `call_queues`, `call_agents`, `call_queue_assignments` (027_call_center_queues.sql)
   - `call_recordings` (025_call_recordings.sql)

2. **Çağrı Akışları Haritalandı:**
   - Customer → Partner (Direkt)
   - Customer → Admin (Queue ile)
   - Partner → Admin (Queue ile)

3. **Sorunlar Tespit Edildi:**
   - Subscription'da `receiver_type` kontrolü eksikti
   - Tüm çağrılar tek CallContext'te karışıyordu
   - Log'lar hangi çağrı tipine ait belirsizdi
   - Kredi kontrolü yanlış scope'daydı

---

## 🔧 YAPILAN DEĞİŞİKLİKLER

### 1. context/CallContext.tsx

#### A. Receiver Type Güvenlik Kontrolü Eklendi
**Satır ~217-228:**
```tsx
// 🛡️ GÜVENLİK KONTROLÜ 2: receiver_type da eşleşmeli!
if (newCall.receiver_type !== currentUser.type) {
  console.log('📞 [CallContext] Call receiver_type mismatch:', 
    newCall.receiver_type, '!==', currentUser.type, '- ignoring');
  return;
}
```

**Etki:** Admin'e gelen çağrıyı Partner göremez (ve tersi).

#### B. Çağrı Tipi Etiket Sistemi Eklendi
**Satır ~105-115:**
```tsx
const getCallTypeLabel = (callerType: string, receiverType: string): string => {
  if (callerType === 'customer' && receiverType === 'partner') {
    return 'Customer→Partner';
  } else if (callerType === 'customer' && receiverType === 'admin') {
    return 'Customer→Support';
  } else if (callerType === 'partner' && receiverType === 'admin') {
    return 'Partner→Support';
  }
  return `${callerType}→${receiverType}`;
};
```

**Etki:** Console log'larında `[Customer→Partner]`, `[Customer→Support]`, `[Partner→Support]` prefix'leri görünür.

#### C. startCall ve answerCall Log'ları Güncellendi
```tsx
// startCall içinde
const callTypeLabel = getCallTypeLabel(user.type, receiverType);
console.log(`📞 [${callTypeLabel}] Starting call to:`, receiverId);

// answerCall içinde
const callTypeLabel = getCallTypeLabel(currentCall.callerType, user.type);
console.log(`📞 [${callTypeLabel}] Answering call:`, callIdRef.current);
```

#### D. Kredi Kontrolü Scope'u Düzeltildi
**Önceki:**
```tsx
if (user?.type === 'partner' && !user.isAnonymous) {
  // Her zaman kredi kontrolü
}
```

**Sonraki:**
```tsx
if (user?.type === 'partner' && !user.isAnonymous && currentCall.receiverType === 'partner') {
  // Sadece Customer→Partner aramasında kredi kontrolü
  // Admin cevaplarken kredi düşmez
}
```

---

### 2. Yeni Dosya: components/voice/hooks/useIsolatedCalls.ts

Üç ayrı izole hook oluşturuldu:

```tsx
// 1. Müşteri → Partner direkt araması
export function useCustomerToPartnerCall() { ... }

// 2. Müşteri → Destek Hattı (queue ile)
export function useCustomerToSupportCall() { ... }

// 3. Partner → Destek Hattı (queue ile)
export function usePartnerToSupportCall() { ... }
```

**Kullanım örneği:**
```tsx
// Eski (karışık):
const { startCall } = useCall();
startCall(partnerId, 'partner');

// Yeni (izole):
const { callPartner } = useCustomerToPartnerCall();
callPartner(partnerId, 'ABC Nakliyat');
```

---

### 3. Yeni Dokümanlar

| Dosya | Açıklama |
|-------|----------|
| `docs/CALL_SYSTEM_ANALYSIS_REPORT.md` | Kapsamlı sistem analizi |
| `docs/CALL_SYSTEM_TEST_SCENARIOS.md` | 12 test senaryosu |
| `docs/CALL_SYSTEM_CHANGES_SUMMARY.md` | Bu dosya |

---

## 📊 ÖNCEKİ ve SONRAKİ DURUM

### Gelen Arama Subscription

**ÖNCEKİ:**
```tsx
filter: `receiver_id=eq.${currentUser.id}`  // Sadece ID kontrolü
```

**SONRAKİ:**
```tsx
filter: `receiver_id=eq.${currentUser.id}`
// + Callback içinde:
if (newCall.receiver_type !== currentUser.type) return;  // Type kontrolü
```

### Console Log'ları

**ÖNCEKİ:**
```
📞 [CallContext] Starting call to: xxx
📞 [CallContext] Got SDP answer...
```

**SONRAKİ:**
```
📞 [Customer→Partner] Starting call to: xxx
📞 [Customer→Partner] Got SDP answer...
```

---

## ⚠️ GERİYE UYUMLULUK

- Mevcut componentler (`CallSupportButton`, `PartnerCallSupportButton`, `CallPartnerButton`) **değişmeden çalışır**.
- Yeni hook'lar (`useIsolatedCalls.ts`) **opsiyonel**.
- Veritabanı şeması değişikliği **YOK**.

---

## 🧪 TEST TALİMATLARI

Test senaryoları için: `docs/CALL_SYSTEM_TEST_SCENARIOS.md`

**Hızlı Test:**
1. Browser console'u aç (F12)
2. Customer olarak partner'ı ara
3. Log'larda `[Customer→Partner]` prefix'ini gör
4. Partner cevapla, ses iletişimini doğrula
5. Görüşmeyi sonlandır

---

## 🚀 DEPLOYMENT

```bash
git add context/CallContext.tsx
git add components/voice/hooks/useIsolatedCalls.ts
git add docs/*.md
git commit -m "fix: Call system isolation and receiver_type security

- Added receiver_type validation in incoming call subscription
- Added call type labels for better debugging
- Created isolated hooks for each call flow
- Fixed credit deduction scope for Partner→Admin calls
- Added comprehensive documentation and test scenarios"
git push origin main
```

---

## 📈 GELECEKTEKİ İYİLEŞTİRMELER

1. **Tam İzolasyon:** Her çağrı tipi için ayrı Context dosyası
2. **Type-safe Queue Slug:** Enum kullanımı
3. **Unit Test:** Jest ile hook testleri
4. **E2E Test:** Playwright ile tarayıcı testleri

---

*Bu doküman değişiklik özeti olarak oluşturulmuştur.*
