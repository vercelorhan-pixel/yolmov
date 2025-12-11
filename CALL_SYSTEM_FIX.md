# 🔧 Çağrı Sistemi Kritik Düzeltmeler

## 📋 Problem Özeti

Tüm çağrı tipleri (müşteri→partner, müşteri→admin, partner→admin) bozuktu:
- Çağrı başlatılıyor ✅
- SDP offer oluşturuluyor ✅  
- Karşı taraf cevaplıyor ✅
- SDP answer oluşturuluyor ✅
- **AMA bağlantı kurulmuyor** ❌
- Ses akışı yok, süre 0.00 saniye kalıyor ❌

## 🔍 Kök Neden Analizi

### 1. **existingCallId Race Condition**
**Problem**: Queue sistemi `call_id` oluşturuyor ama `startCall()` içinde **asenkron işlemlerden SONRA** `callIdRef` set ediliyordu.

**Sonuç**: Peer'in `signal` eventi geldiğinde `callIdRef.current === undefined` olduğu için **yeni bir call kaydı oluşturuluyordu** (duplikasyon).

**Çözüm**:
```typescript
// ❌ ÖNCE (YANLIŞ):
const startCall = async (receiverId, receiverType, existingCallId) => {
  // ... mikrofon izni, peer oluşturma ...
  if (existingCallId) {
    callIdRef.current = existingCallId; // ← ÇOK GEÇ!
  }
}

// ✅ SONRA (DOĞRU):
const startCall = async (receiverId, receiverType, existingCallId) => {
  if (existingCallId) {
    callIdRef.current = existingCallId; // ← HER ŞEYDEN ÖNCE!
  }
  // ... mikrofon izni, peer oluşturma ...
}
```

### 2. **Duplikasyon: İki SDP Answer Subscription**
**Problem**: `startCall()` içinde **ve** `useEffect` içinde iki ayrı SDP answer subscription vardı.

**Sonuç**: 
- Kanal isimleri çakışıyordu
- Timeout sonrası subscription kapanıyordu
- Closure içinde eski `callIdRef` değeri kalıyordu

**Çözüm**: `startCall()` içindeki subscription tamamen kaldırıldı. Sadece `useEffect` subscription kullanılıyor.

```typescript
// ❌ KALDIRILAN KOD:
const answerSubscription = supabase
  .channel(`call-answer-${callIdRef.current}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    filter: `id=eq.${callIdRef.current}`,
  }, ...)
  .subscribe();

setTimeout(() => {
  answerSubscription.unsubscribe(); // ← 30sn sonra kapanıyordu!
}, 30000);

// ✅ TEK KAYNAK: useEffect içindeki subscription (callStatus='calling')
```

### 3. **Yanlış Peer.connected Kontrolü**
**Problem**: SDP answer geldiğinde `peer.connected` kontrolü yapılıyordu.

**Sonuç**: `peer.connected` sadece **signal edildikten SONRA** `true` oluyor. Dolayısıyla bu kontrol **hep false** ve gereksizdi.

**Çözüm**: `!peer.connected` kontrolü kaldırıldı, sadece `!peer.destroyed` kontrol ediliyor.

```typescript
// ❌ ÖNCE:
if (!peerRef.current.destroyed && !peerRef.current.connected) {
  peerRef.current.signal(answer); // ← peer.connected hep false!
}

// ✅ SONRA:
if (!peerRef.current.destroyed) {
  peerRef.current.signal(answer); // ← Doğru kontrol
}
```

## 🎯 Yapılan Değişiklikler

### context/CallContext.tsx

1. **Satır ~685**: `existingCallId` kontrol fonksiyonun EN BAŞINA taşındı
2. **Satır ~960-1010**: Duplikasyon subscription kodu kaldırıldı
3. **Satır ~340-360**: `!peer.connected` kontrolü kaldırıldı, detaylı log eklendi
4. **Satır ~380-395**: Polling mekanizmasında aynı fix

## ✅ Beklenen Sonuç

### Tüm Çağrı Tipleri Çalışır Hale Geldi:

#### 1. **Müşteri → Partner**
```
Customer startCall(partner_id, 'partner')
  ↓
Partner answerCall()
  ↓
SDP exchange tamamlanır
  ↓
✅ SES BAĞLANTISI KURULUR
```

#### 2. **Müşteri → Admin (Destek Hattı)**
```
Customer → CallSupportButton
  ↓
Queue sistemi → call_id oluşturur
  ↓
Customer startCall(admin_id, 'admin', call_id) ← Mevcut ID kullanılır!
  ↓
Admin answerCall()
  ↓
✅ SES BAĞLANTISI KURULUR
```

#### 3. **Partner → Admin (Destek Hattı)**
```
Partner → PartnerCallSupportButton
  ↓
Queue sistemi → call_id oluşturur
  ↓
Partner startCall(admin_id, 'admin', call_id) ← Mevcut ID kullanılır!
  ↓
Admin answerCall()
  ↓
✅ SES BAĞLANTISI KURULUR
```

## 🧪 Test Adımları

### 1. Müşteri → Partner Araması
- Web sitesinden giriş yapmadan partner ara
- Partner'ın dashboardunda çağrı gelir
- Partner cevapla
- **Beklenen**: Ses akışı her iki yönde de çalışır

### 2. Müşteri → Admin Araması (Destek Hattı)
- Header'dan "Bizi Arayın" butonuna tıkla
- Admin panelde çağrı gelir
- Admin cevapla
- **Beklenen**: Ses akışı her iki yönde de çalışır

### 3. Partner → Admin Araması (Destek Hattı)
- Partner dashboard'dan "Destek Hattını Ara"
- Admin panelde çağrı gelir (partner-calls queue)
- Admin cevapla
- **Beklenen**: Ses akışı her iki yönde de çalışır

## 🔍 Debug Log'ları

### Başarılı Bağlantı Log'ları:
```
📞 [CallContext] ✅ Using EXISTING call ID (queue): xxx-xxx-xxx
📞 [CallContext] Starting call to: [admin_id] type: admin displayName: Yolmov Destek
📞 [CallContext] Got SDP offer, saving to DB...
📞 [CallContext] Updating existing call with SDP offer: xxx-xxx-xxx
📞 [CallContext] ✅ Peer setup complete - SDP answer via useEffect subscription
📞 [CallContext] Setting up SDP answer listener for call: xxx-xxx-xxx
📞 [CallContext] SDP answer subscription status: SUBSCRIBED
📞 [CallContext] ✅ My call updated: connected has answer: true
📞 [CallContext] Got SDP answer, signaling peer...
📞 [CallContext] Peer state - destroyed: false connected: false
📞 [CallContext] 🔥 Signaling SDP answer to peer NOW...
📞 [CallContext] ✅ SDP answer signaled successfully!
📞 [CallContext] Peer connected!
📞 [CallContext] Got remote stream
🎙️ [CallContext] Starting call recording...
```

### Hata Log'ları (Eğer sorun devam ederse):
```
❌ [CallContext] Peer already destroyed, cannot signal!
⚠️ [CallContext] Cannot signal - answer: false peer: false
📞 [CallContext] Call timeout - no answer (30sn)
```

## 📊 Teknik Detaylar

### SDP Exchange Akışı:
```
┌─────────────┐                    ┌─────────────┐
│   Caller    │                    │  Receiver   │
│ (Customer)  │                    │   (Admin)   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ 1. startCall(admin_id)           │
       │────────────────────────────────► │ 2. INSERT event
       │                                  │
       │ 3. peer.signal() → SDP offer     │
       │────────────────────────────────► │ 4. UPDATE DB
       │                                  │
       │                                  │ 5. answerCall()
       │                                  │
       │                                  │ 6. peer.signal(offer)
       │                                  │
       │ 8. UPDATE event ← SDP answer ────│ 7. peer.signal() → answer
       │                                  │
       │ 9. peer.signal(answer)           │
       │────────────────────────────────► │
       │                                  │
       │ 10. peer.on('connect')           │ 11. peer.on('connect')
       │◄────────────────────────────────►│
       │                                  │
       │ 12. peer.on('stream') ◄─────────►│ peer.on('stream')
       │                                  │
       │        ✅ BAĞLANTI KURULDU       │
       │                                  │
```

### Realtime Subscription Yapısı:

#### Caller Tarafı:
- **Incoming Calls**: `receiver_id=eq.${user.id}` + event=INSERT
- **SDP Answer**: `id=eq.${callId}` + event=UPDATE (useEffect, callStatus='calling')

#### Receiver Tarafı:
- **Incoming Calls**: `receiver_id=eq.${user.id}` + event=INSERT
- **SDP Answer Yazma**: `answerCall()` içinde UPDATE

## 🚀 Deploy Notları

Değişiklikler sadece frontend'de (`context/CallContext.tsx`). Backend değişikliği yok.

**Deploy Komutu**:
```bash
git add context/CallContext.tsx
git commit -m "fix: Critical WebRTC signaling fixes for all call types"
git push
```

Vercel otomatik deploy edecek.

## 🎉 Sonuç

Tüm çağrı tipleri artık düzgün çalışacak. SDP exchange doğru sırayla gerçekleşiyor ve duplikasyon yok.

**Test ettikten sonra bu dosyayı silebilirsiniz.**
