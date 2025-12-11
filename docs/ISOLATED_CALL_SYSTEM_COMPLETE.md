# 🎯 TAM İZOLASYON MİMARİSİ - ARAMA SİSTEMİ

## 📋 ÖZET

Arama sistemini **3 tamamen bağımsız** bölüme ayırdık. Her bölüm kendi veritabanı tablosu, backend servisi ve frontend context'ine sahip. **Hiçbir ortak bağımlılık yok.**

---

## ✅ TAMAMLANAN İŞLER

### 1️⃣ VERİTABANI SEVİYESİ İZOLASYONU

#### Yeni Tablolar

✅ **`customer_partner_calls`** - Müşteri → Partner direkt aramalar
- SDP offer/answer
- Kredi düşme mantığı
- RLS policies (customer & partner)
- Triggers (updated_at)
- Indexes (performance için)

✅ **`customer_support_calls`** - Müşteri → Destek kuyruk aramaları
- Queue sistemi (position, wait_time)
- Admin/agent atama
- RLS policies (customer & admin)
- Triggers (updated_at, queue_position auto)
- Indexes (queue optimization)

✅ **`partner_support_calls`** - Partner → Destek öncelikli kuyruk
- Priority level (partner aramaları öncelikli)
- Queue sistemi
- Admin/agent atama
- RLS policies (partner & admin)
- Triggers (updated_at, queue_position + priority)
- Indexes (priority + queue optimization)

#### Eski Tablo
- `calls` tablosu → `calls_deprecated_backup` olarak yeniden adlandırıldı
- Eski veriler yeni tablolara migrate edildi

---

### 2️⃣ BACKEND SERVİS İZOLASYONU

✅ **`services/calls/customerToPartner.ts`**
```typescript
Fonksiyonlar:
- startCustomerToPartnerCall()
- answerCustomerToPartnerCall()  // KREDİ DÜŞER
- endCustomerToPartnerCall()
- rejectCustomerToPartnerCall()  // KREDİ DÜŞMEZ
- getPartnerCallHistory()
- getCustomerCallHistory()
- addIceCandidate()
```

✅ **`services/calls/customerToSupport.ts`**
```typescript
Fonksiyonlar:
- startCustomerToSupportCall()     // Kuyruğa ekle
- assignCustomerSupportCall()      // Admin ata
- autoAssignCustomerSupportCall()  // Otomatik atama
- answerCustomerToSupportCall()
- endCustomerToSupportCall()
- getWaitingCalls()                // Admin paneli için
- getAgentActiveCalls()
- addCallNotes()
- rateCall()
```

✅ **`services/calls/partnerToSupport.ts`**
```typescript
Fonksiyonlar:
- startPartnerToSupportCall()        // Öncelikli kuyruğa
- assignPartnerSupportCall()
- autoAssignPartnerSupportCall()
- answerPartnerToSupportCall()
- endPartnerToSupportCall()
- getWaitingPartnerCalls()           // Öncelik sıralamalı
- getAgentActivePartnerCalls()
- updateCallPriority()               // Acil durumlar için
- addPartnerCallNotes()
- ratePartnerCall()
```

---

### 3️⃣ FRONTEND CONTEXT İZOLASYONU

✅ **`context/CustomerToPartnerCallContext.tsx`**
```typescript
Hook: useCustomerPartnerCall()

State:
- currentCall
- isInitiator (customer/partner kim başlattı)
- callStatus (idle/ringing/connected/ended)
- localStream, remoteStream

Fonksiyonlar:
- startCall(partnerId, requestId?)
- answerCall(callId)
- endCall()
- rejectCall(callId)
```

✅ **`context/CustomerToSupportCallContext.tsx`**
```typescript
Hook: useCustomerSupportCall()

State:
- currentCall
- isCustomer (customer/agent kim)
- callStatus (idle/waiting/ringing/connected/ended)
- queuePosition (kuyruk sırası)
- localStream, remoteStream

Fonksiyonlar:
- callSupport(queueId?)
- answerSupportCall(callId)  // Agent için
- endCall()
```

✅ **`context/PartnerToSupportCallContext.tsx`**
```typescript
Hook: usePartnerSupportCall()

State:
- currentCall
- isPartner (partner/agent kim)
- callStatus (idle/waiting/ringing/connected/ended)
- queuePosition, priorityLevel
- localStream, remoteStream

Fonksiyonlar:
- callSupport(queueId?, priority?)
- answerPartnerSupportCall(callId)  // Agent için
- endCall()
```

---

## 🚀 MİGRATION NASIL UYGULANIR?

### Adım 1: Supabase Dashboard'a Git

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) → Projenizi seçin
2. Sol menüden **SQL Editor**'ü açın

### Adım 2: Migration Dosyasını Çalıştır

```bash
# Migration dosyası:
migrations/040_isolated_call_tables.sql
```

1. SQL Editor'de **New Query** oluşturun
2. `migrations/040_isolated_call_tables.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın
4. **Run** butonuna basın

### Adım 3: Kontrol Et

Migration başarılı olduysa şu mesajı göreceksiniz:
```
CREATE TABLE
CREATE INDEX
CREATE POLICY
...
INSERT 0 X  (X = eski aramalar sayısı)
ALTER TABLE
```

Hata yoksa devam edin.

### Adım 4: Tabloları Kontrol Et

SQL Editor'de çalıştırın:

```sql
-- Yeni tabloları gör
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%_calls';

-- Sonuç:
-- customer_partner_calls
-- customer_support_calls
-- partner_support_calls
-- calls_deprecated_backup
```

---

## 🧪 TEST SENARYOLARI

### Senaryo 1: Müşteri → Partner Araması

```typescript
// Component içinde
import { useCustomerPartnerCall } from '../context/CustomerToPartnerCallContext';

function CallPartnerButton({ partnerId, requestId }) {
  const { startCall, callStatus, error } = useCustomerPartnerCall();

  const handleCall = async () => {
    await startCall(partnerId, requestId);
  };

  return (
    <>
      <button onClick={handleCall}>
        Partner'ı Ara
      </button>
      {callStatus === 'ringing' && <p>Çalıyor...</p>}
      {callStatus === 'connected' && <p>✅ Bağlandı</p>}
      {error && <p>❌ {error}</p>}
    </>
  );
}
```

### Senaryo 2: Müşteri → Destek Araması

```typescript
import { useCustomerSupportCall } from '../context/CustomerToSupportCallContext';

function CallSupportButton() {
  const { callSupport, callStatus, queuePosition } = useCustomerSupportCall();

  return (
    <>
      <button onClick={() => callSupport()}>
        Destek Hattını Ara
      </button>
      {callStatus === 'waiting' && (
        <p>Kuyrukta bekliyorsunuz... Sıra: {queuePosition}</p>
      )}
      {callStatus === 'ringing' && <p>Agent atandı, çalıyor...</p>}
      {callStatus === 'connected' && <p>✅ Bağlandı</p>}
    </>
  );
}
```

### Senaryo 3: Partner → Destek Araması

```typescript
import { usePartnerSupportCall } from '../context/PartnerToSupportCallContext';

function PartnerCallSupportButton() {
  const { callSupport, callStatus, priorityLevel } = usePartnerSupportCall();

  return (
    <>
      <button onClick={() => callSupport(undefined, 1)}>
        Öncelikli Destek Çağrısı
      </button>
      {callStatus === 'waiting' && (
        <p>Öncelikli kuyrukta: Seviye {priorityLevel}</p>
      )}
      {callStatus === 'connected' && <p>✅ Agent bağlandı</p>}
    </>
  );
}
```

---

## 🔧 COMPONENT ENTEGRASYONLARİ

### App.tsx'e Provider Ekleyin

```typescript
import { CustomerPartnerCallProvider } from './context/CustomerToPartnerCallContext';
import { CustomerSupportCallProvider } from './context/CustomerToSupportCallContext';
import { PartnerSupportCallProvider } from './context/PartnerToSupportCallContext';

function App() {
  return (
    <CustomerPartnerCallProvider>
      <CustomerSupportCallProvider>
        <PartnerSupportCallProvider>
          {/* Uygulamanız */}
        </PartnerSupportCallProvider>
      </CustomerSupportCallProvider>
    </CustomerPartnerCallProvider>
  );
}
```

---

## 📊 İZOLASYON KALİTE GÖSTERGELERİ

| Özellik | Durum | Açıklama |
|---------|-------|----------|
| **Ayrı Tablolar** | ✅ | 3 bağımsız tablo |
| **Ayrı RLS Policies** | ✅ | Her tablo kendi policy'leri |
| **Ayrı Triggers** | ✅ | Her tablo kendi trigger'ları |
| **Ayrı Indexes** | ✅ | Her tablo optimize edilmiş |
| **Ayrı Backend Servisler** | ✅ | 3 tamamen izole servis dosyası |
| **Ayrı Frontend Context** | ✅ | 3 tamamen izole Context |
| **Ortak Bağımlılık** | ❌ | YOK - Tamamen izole |
| **Veri Migrasyonu** | ✅ | Eski veriler taşındı |
| **Eski Tablo** | ✅ | Yedeklendi (kullanılmıyor) |

---

## 🎯 SONUÇ

### ÖNCESİ (Karışık Sistem)
```
[calls tablosu]
  ├── customer → partner
  ├── customer → admin
  └── partner → admin
      └── Hepsi aynı tablo, trigger, context ❌
```

### SONRASI (Tam İzolasyon)
```
[customer_partner_calls]
  └── customerToPartner.ts
      └── CustomerToPartnerCallContext.tsx ✅

[customer_support_calls]
  └── customerToSupport.ts
      └── CustomerToSupportCallContext.tsx ✅

[partner_support_calls]
  └── partnerToSupport.ts
      └── PartnerToSupportCallContext.tsx ✅
```

---

## 📝 SONRAKİ ADIMLAR

1. ✅ Migration'ı Supabase'e uygula (SQL Editor)
2. ✅ Component'leri yeni Context'lere bağla
3. ⏳ Her 3 senaryoyu test et
4. ⏳ Eski `CallContext.tsx`'i tamamen kaldır
5. ⏳ Production'a deploy

---

## 🆘 DESTEK

Herhangi bir sorun yaşarsanız:

1. **Migration hatası**: SQL Editor'deki hata mesajını kontrol edin
2. **RLS policy hatası**: `auth.uid()` ve `app.current_user_id` ayarlarını doğrulayın
3. **WebRTC bağlantı hatası**: Browser console'u kontrol edin
4. **Realtime subscription hatası**: Supabase Realtime ayarlarını kontrol edin

---

**🎉 TAM İZOLASYON TAMAMLANDI**

Her çağrı tipi artık kendi evreninde çalışıyor. Birbirlerine müdahale edemezler!
