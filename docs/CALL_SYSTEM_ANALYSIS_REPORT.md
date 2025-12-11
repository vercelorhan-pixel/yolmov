# 📊 YOLMOV Çağrı Sistemi Kapsamlı Analiz Raporu

**Tarih:** 11 Aralık 2025  
**Analiz:** Detaylı kod, veritabanı ve akış incelemesi

---

## 📋 MEVCUT SİSTEM ANALİZİ

### 1. Veritabanı Şeması

#### Ana Tablolar:

| Tablo | Amacı | Migration |
|-------|-------|-----------|
| `calls` | Tüm çağrı kayıtları (WebRTC sinyal verileri) | 007_voice_calls.sql |
| `call_queues` | Çağrı havuzları (general-support, partner-calls, emergency) | 027_call_center_queues.sql |
| `call_agents` | Admin kullanıcıların agent kayıtları | 027_call_center_queues.sql |
| `call_queue_assignments` | Çağrı-agent eşleştirmeleri | 027_call_center_queues.sql |
| `call_recordings` | Çağrı kayıt dosyaları | 025_call_recordings.sql |

#### `calls` Tablosu Yapısı:
```sql
- id (UUID PRIMARY KEY)
- caller_id (TEXT) -- Anonim: anon_xxx, Customer: UUID, Partner: UUID
- caller_type (TEXT) -- 'customer', 'partner', 'admin'
- receiver_id (UUID) -- Partner ID veya Admin ID
- receiver_type (TEXT) -- 'partner', 'admin', 'customer'
- status (TEXT) -- 'ringing', 'connected', 'ended', 'rejected', 'missed', 'failed'
- sdp_offer (JSONB) -- WebRTC teklifi
- sdp_answer (JSONB) -- WebRTC cevabı
- ice_candidates (JSONB)
- call_source (VARCHAR) -- 'direct', 'queue', 'partner-page'
```

### 2. Çağrı Akışları

#### A. Son Kullanıcı → Partner (Direkt Arama)
```
┌─────────────────┐
│ CallPartnerButton │ -- components/voice/CallPartnerButton.tsx
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ startCall()     │ -- context/CallContext.tsx
│ (receiverType:  │
│  'partner')     │
└────────┬────────┘
         │
         ▼ INSERT
┌─────────────────┐
│ calls tablosu   │ -- caller_type: 'customer', receiver_type: 'partner'
└────────┬────────┘
         │
         ▼ Realtime Subscription
┌─────────────────┐
│ Partner         │ -- Gelen arama bildirimi
│ CallContext     │
│ (receiver_id=   │
│  partner.id)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ answerCall()    │ -- Partner cevaplar
└─────────────────┘
```

**Özellikler:**
- Queue sistemi KULLANILMAZ
- Direkt `calls` tablosuna INSERT
- Partner ID doğrudan `receiver_id` olarak kullanılır
- `call_source = 'direct'` veya `'partner-page'`

---

#### B. Son Kullanıcı → Destek Hattı (Queue ile)
```
┌──────────────────┐
│ CallSupportButton │ -- components/voice/CallSupportButton.tsx
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ callCenterService│
│ .addToQueue()    │ -- services/callCenterService.ts
│ (queueSlug:      │
│  'general-       │
│   support')      │
└────────┬─────────┘
         │
         ├──► (1) call_queue_assignments INSERT (status: 'waiting')
         │
         ├──► (2) calls INSERT (caller_type: 'customer', receiver_type: 'admin')
         │
         ├──► (3) getAvailableAgents() -- Müsait admin ara
         │
         └──► (4) call_queue_assignments UPDATE (status: 'ringing')
         
         ▼
┌──────────────────┐
│ startCall()      │ -- Mevcut call_id ile
│ (receiverType:   │
│  'admin',        │
│  existingCallId) │
└────────┬─────────┘
         │
         ▼ UPDATE (sdp_offer)
┌──────────────────┐
│ calls tablosu    │
└────────┬─────────┘
         │
         ▼ Realtime Subscription
┌──────────────────┐
│ Admin            │
│ CallContext      │
│ (receiver_id=    │
│  admin.id)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ answerCall()     │
└──────────────────┘
```

**Özellikler:**
- Queue sistemi KULLANILIR
- `call_source = 'queue'`
- Önce `call_queue_assignments`, sonra `calls` tablosuna kayıt
- Agent otomatik atanır (round-robin)

---

#### C. Partner → Destek Hattı (Queue ile)
```
┌─────────────────────────┐
│ PartnerCallSupportButton │ -- components/voice/PartnerCallSupportButton.tsx
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ callCenterService       │
│ .addToQueue()           │
│ (queueSlug:             │
│  'partner-calls')       │ -- Partner'a özel queue
└────────┬────────────────┘
         │
         ├──► calls INSERT (caller_type: 'partner', receiver_type: 'admin')
         │
         └──► call_queue_assignments INSERT
         
         ▼
┌─────────────────────────┐
│ startCall()             │
│ (receiverType: 'admin', │
│  existingCallId)        │
└─────────────────────────┘
```

**Özellikler:**
- Queue sistemi KULLANILIR (`partner-calls` queue)
- `caller_type = 'partner'`, `receiver_type = 'admin'`
- Admin için ayrı öncelik olabilir

---

## 🔍 TESPİT EDİLEN SORUNLAR VE KARIŞIKLIKLAR

### SORUN 1: Ortak CallContext Karışıklığı ❌

**Problem:** Tüm çağrı tipleri aynı `CallContext.tsx` kullanıyor (1401 satır!). Bu karışıklığa neden oluyor:

```tsx
// Tek bir startCall fonksiyonu HER ŞEYİ yapmaya çalışıyor
const startCall = async (
  receiverId: string, 
  receiverType: 'customer' | 'partner' | 'admin' = 'partner',  // ❌ Karışık
  existingCallId?: string, 
  receiverName?: string
) => { ... }
```

**Etki:**
- Customer → Partner ve Customer → Admin aynı fonksiyon
- Partner → Admin da aynı fonksiyon
- Debugging zorlaşıyor
- Bir değişiklik tüm akışları etkiliyor

---

### SORUN 2: Realtime Subscription Çakışması ❌

**Problem:** Gelen arama subscription'ı sadece `receiver_id`'ye bakıyor, `receiver_type`'ı dikkate ALMIYOR:

```tsx
// context/CallContext.tsx - Satır 214-221
const channel = supabase
  .channel(`calls_incoming_${currentUser.id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'calls',
    filter: `receiver_id=eq.${currentUser.id}`  // ❌ receiver_type yok!
  }, ...)
```

**Etki:**
- Partner, Admin'e giden çağrıyı da görebilir (eğer ID çakışırsa)
- Yanlış bildirimlere neden olabilir

---

### SORUN 3: Queue vs Direct Akış Karışıklığı ❌

**Problem:** `callCenterService.addToQueue()` içinde hem `calls` hem `call_queue_assignments` tablosuna yazılıyor, sonra `startCall()` tekrar `calls` tablosunu güncelliyor:

```tsx
// services/callCenterService.ts - addToQueue()
// ADIM 1: calls INSERT
const { data: callData } = await supabase.from('calls').insert({...});

// ADIM 2: call_queue_assignments INSERT
await supabase.from('call_queue_assignments').insert({...});

// Sonra component'te:
// ADIM 3: startCall() çağrılınca calls UPDATE (sdp_offer)
await startCall(callData.receiver_id, 'admin', assignment.call_id!, 'Yolmov Destek');
```

**Etki:**
- Aynı veri iki kez işleniyor
- `call_queue_assignments.call_id` ile `calls.id` senkronizasyon riski
- Gereksiz DB operasyonları

---

### SORUN 4: Caller Type Belirleme Karmaşası ❌

**Problem:** `caller_type` belirleme işlemi birden fazla yerde yapılıyor ve tutarsız:

```tsx
// CallContext.tsx - getCurrentUser()
// localStorage'a bakar: admin > partner > customer > anon

// callCenterService.ts - addToQueue()
// Ayrı bir localStorage kontrolü: partner > customer > auth > anon
```

**Etki:**
- Aynı kullanıcı farklı yerlerde farklı tanınabilir
- Tutarsız `caller_type` değerleri

---

### SORUN 5: Credit Kontrolü Sadece Partner İçin ❌

**Problem:** Kredi kontrolü yalnızca `answerCall()` içinde ve sadece partner için:

```tsx
// context/CallContext.tsx - answerCall()
if (user?.type === 'partner' && !user.isAnonymous) {
  // Kredi kontrolü sadece partner'lar için
  // Admin aramayı cevaplarken kredi kontrolü YOK
}
```

**Etki:**
- Admin'ler çağrı cevaplayınca kredi düşmüyor (doğru)
- Ama Customer → Partner aramasında partner cevaplarken kredi düşüyor
- Customer → Admin aramasında kredi düşmemeli (doğru çalışıyor)

---

### SORUN 6: Tekrarlanan SDP Answer Subscription ❌

**Problem:** Önceki düzeltmelerde kaldırılmış olsa da, farklı kod yollarında hâlâ karışıklık var.

---

## 📐 ÖNERİLEN MİMARİ: 3 BÖLÜMLÜ İZOLASYON

### YENİ DOSYA YAPISI

```
components/voice/
├── customer-to-partner/     # BÖLÜM A
│   ├── CustomerCallPartnerButton.tsx
│   ├── CustomerCallPartnerContext.tsx
│   └── types.ts
│
├── customer-to-support/     # BÖLÜM B
│   ├── CustomerCallSupportButton.tsx
│   ├── CustomerCallSupportContext.tsx
│   └── types.ts
│
├── partner-to-support/      # BÖLÜM C
│   ├── PartnerCallSupportButton.tsx
│   ├── PartnerCallSupportContext.tsx
│   └── types.ts
│
├── admin/                   # ADMIN (Alıcı)
│   ├── AdminIncomingCallHandler.tsx
│   └── AdminCallReceiveContext.tsx
│
├── partner/                 # PARTNER (Alıcı)
│   ├── PartnerIncomingCallHandler.tsx
│   └── PartnerCallReceiveContext.tsx
│
└── shared/                  # ORTAK MODÜLLER
    ├── WebRTCPeer.ts
    ├── AudioManager.ts
    ├── RecordingManager.ts
    └── types.ts
```

### BÖLÜM A: Son Kullanıcı → Partner

**Dosyalar:**
- `CustomerCallPartnerContext.tsx` - Sadece müşteri→partner çağrıları
- `CustomerCallPartnerButton.tsx` - Partner detay sayfasındaki ara butonu

**Veritabanı:**
- `calls` tablosu (direkt INSERT)
- `caller_type = 'customer'`
- `receiver_type = 'partner'`
- `call_source = 'partner-page'`

**Özellikler:**
- Queue sistemi YOK
- Partner kredi kontrolü VAR
- Direkt WebRTC bağlantısı

---

### BÖLÜM B: Son Kullanıcı → Destek Hattı

**Dosyalar:**
- `CustomerCallSupportContext.tsx` - Sadece müşteri→admin çağrıları
- `CustomerCallSupportButton.tsx` - Web sitesindeki destek butonu

**Veritabanı:**
- `call_queues` → `general-support`
- `call_queue_assignments` 
- `calls` tablosu
- `caller_type = 'customer'`
- `receiver_type = 'admin'`
- `call_source = 'queue'`

**Özellikler:**
- Queue sistemi VAR
- Agent otomatik atama
- Kredi kontrolü YOK

---

### BÖLÜM C: Partner → Destek Hattı

**Dosyalar:**
- `PartnerCallSupportContext.tsx` - Sadece partner→admin çağrıları
- `PartnerCallSupportButton.tsx` - Partner dashboard'daki destek butonu

**Veritabanı:**
- `call_queues` → `partner-calls`
- `call_queue_assignments`
- `calls` tablosu
- `caller_type = 'partner'`
- `receiver_type = 'admin'`
- `call_source = 'queue'`

**Özellikler:**
- Queue sistemi VAR (ayrı queue)
- Öncelikli agent atama
- Kredi kontrolü YOK (admin cevaplıyor)

---

## 🔧 KISA VADELİ ÇÖZÜM (Mevcut Yapıda Düzeltme)

Tam izolasyon yerine, mevcut yapıda şu düzeltmeleri yapabiliriz:

### 1. Subscription'a receiver_type Filtresi Ekle
```tsx
// CallContext.tsx - Gelen arama subscription'ı
filter: `receiver_id=eq.${currentUser.id},receiver_type=eq.${currentUser.type}`
```

### 2. Ayrı CallContext Hook'ları
```tsx
// Wrapper hook'lar
export const useCustomerToPartnerCall = () => {
  const ctx = useCall();
  return {
    ...ctx,
    startCall: (partnerId: string) => ctx.startCall(partnerId, 'partner'),
  };
};

export const useCustomerToSupportCall = () => {
  const ctx = useCall();
  // Queue entegrasyonu burada
};

export const usePartnerToSupportCall = () => {
  const ctx = useCall();
  // Partner-specific queue entegrasyonu
};
```

### 3. Log'ları Bölümle
```tsx
// Her çağrı tipine özel prefix
console.log('📞 [Customer→Partner] ...');
console.log('📞 [Customer→Support] ...');
console.log('📞 [Partner→Support] ...');
```

---

## ✅ EYLEM PLANI

### Adım 1: Receiver Type Filtresi (Acil)
- [ ] Subscription'a `receiver_type` filtresi ekle
- [ ] Test: Farklı kullanıcı tipleri çağrı alabilmeli

### Adım 2: Log İyileştirme (Acil)
- [ ] Her akış için ayrı log prefix'i
- [ ] Debug kolaylaşacak

### Adım 3: Hook İzolasyonu (Orta Vade)
- [ ] Üç ayrı wrapper hook oluştur
- [ ] Component'ler uygun hook'u kullansın

### Adım 4: Tam İzolasyon (Uzun Vade)
- [ ] Ayrı context dosyaları
- [ ] Ayrı service fonksiyonları
- [ ] Kapsamlı test suite

---

## 📊 RİSK ANALİZİ

| Risk | Olasılık | Etki | Azaltma |
|------|----------|------|---------|
| Subscription çakışması | Yüksek | Kritik | receiver_type filtresi |
| SDP sinyalizasyon hatası | Orta | Kritik | Polling fallback |
| Kredi yanlış düşürme | Düşük | Yüksek | caller_type kontrolü |
| Queue timeout | Orta | Orta | 30sn timeout + bildirim |

---

## 📝 SONUÇ

Mevcut sistem **çalışabilir durumda** ama aşağıdaki riskler var:
1. Kod karmaşıklığı nedeniyle hata ayıklama zor
2. Bir değişiklik tüm akışları etkileyebilir
3. Farklı kullanıcı tipleri için davranış farklılıkları takip edilemez

**Önerim:** Öncelikle kısa vadeli düzeltmeleri uygulayıp sistemi stabilize edelim, ardından uzun vadede tam izolasyon yapılabilir.

---

*Bu rapor otomatik kod analizi ile oluşturulmuştur.*
