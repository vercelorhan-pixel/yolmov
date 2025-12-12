# Yolmov Mesajlaşma & Kredi Bazlı İletişim Sistemi - İmplementasyon Kılavuzu

**Tarih:** 12 Aralık 2025  
**Versiyon:** 1.0  
**Durum:** ✅ Temel Modül Tamamlandı

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Veritabanı Yapısı](#veritabanı-yapısı)
3. [API Fonksiyonları](#api-fonksiyonları)
4. [UI Componentleri](#ui-componentleri)
5. [Kurulum Adımları](#kurulum-adımları)
6. [Kullanım Senaryoları](#kullanım-senaryoları)
7. [Gelir Modeli](#gelir-modeli)
8. [Gelecek Geliştirmeler](#gelecek-geliştirmeler)

---

## 🎯 Genel Bakış

### Sistemin Amacı
Müşteri (B2C) ve Partner arasında **gelir odaklı** bir iletişim kanalı kurmak. Partner, müşteri mesajlarını görmek için **Yolmov Kredisi** harcamalıdır.

### Temel İş Akışı

```
[Müşteri] ━━ Mesaj Gönder ━━▶ [Kilitli Mesaj] ━━▶ [Partner]
                                      ⬇
                               Kredi Harca (50₺)
                                      ⬇
                            [Açık Konuşma] ◀━━▶ [İletişim]
```

### Gelir Mekanizması
- **Kilit Açma:** Partner her yeni konuşmayı açmak için 50 kredi (veya daha fazla) harcar
- **Kredi Satışı:** Partnerlar kredi paketleri satın alır (100₺ = 100 Kredi gibi)
- **Platform Komisyonu:** Her kredi harcamasında Yolmov gelir elde eder

---

## 🗄️ Veritabanı Yapısı

### Tablolar

#### 1. `conversations` (Konuşma Başlıkları)
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id),
    partner_id UUID REFERENCES partners(id),
    service_type VARCHAR(50),
    
    -- Kilit Mekanizması
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlock_price INTEGER DEFAULT 50,
    unlocked_at TIMESTAMP,
    unlocked_by UUID,
    
    -- İstatistikler
    last_message_at TIMESTAMP,
    customer_unread_count INTEGER DEFAULT 0,
    partner_unread_count INTEGER DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'active',
    customer_location TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `messages` (Mesaj İçerikleri)
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    sender_id UUID REFERENCES auth.users(id),
    sender_type VARCHAR(20) NOT NULL, -- 'customer', 'partner', 'admin'
    
    content TEXT NOT NULL,
    content_masked TEXT, -- Kilitli durumda gösterilen
    
    attachment_urls TEXT[],
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    is_system_message BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `transactions` (Kredi İşlemleri)
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    partner_id UUID REFERENCES partners(id),
    type VARCHAR(50) NOT NULL, -- 'CREDIT_PURCHASE', 'CHAT_UNLOCK', 'REFUND'
    amount INTEGER NOT NULL, -- Pozitif: eklenen, Negatif: harcanan
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `message_templates` (Hazır Şablonlar)
```sql
CREATE TABLE message_templates (
    id UUID PRIMARY KEY,
    user_type VARCHAR(20), -- 'customer', 'partner'
    title VARCHAR(100),
    content TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Özel Fonksiyonlar

#### `mask_sensitive_content(text_content TEXT)`
Platform dışına çıkmayı engellemek için telefon numarası ve email maskeleme:
```sql
-- 0532 123 45 67 → 0*** *** ** **
-- test@gmail.com → t***@gmail.com
```

#### `get_partner_credit_balance(partner_id UUID)`
Partner'in güncel kredi bakiyesini hesaplar.

---

## 🔌 API Fonksiyonları

### Dosya: `/services/messagingApi.ts`

#### Konuşma Yönetimi
```typescript
// Yeni konuşma başlat (Müşteri)
messagingApi.createConversation({
  customerId: string,
  partnerId: string,
  serviceType: string,
  initialMessage: string,
  customerLocation: string,
  customerLocationLat: number,
  customerLocationLng: number
})

// Partner konuşmaları listele
messagingApi.getPartnerConversations(partnerId: string)

// Müşteri konuşmaları listele
messagingApi.getCustomerConversations(customerId: string)

// Konuşma kilidini aç (KRİTİK - PARA KAZANMA)
messagingApi.unlockConversation(
  conversationId: string,
  partnerId: string,
  partnerUserId: string
)
```

#### Mesaj Yönetimi
```typescript
// Mesajları getir
messagingApi.getMessages(conversationId: string)

// Mesaj gönder
messagingApi.sendMessage({
  conversationId: string,
  senderId: string,
  senderType: 'customer' | 'partner' | 'admin',
  content: string
})

// Okundu işaretle
messagingApi.markConversationAsRead(conversationId: string, userId: string)
```

#### Kredi Yönetimi
```typescript
// Bakiye sorgula
messagingApi.getPartnerCreditBalance(partnerId: string)

// İşlem geçmişi
messagingApi.getPartnerTransactions(partnerId: string)

// Kredi ekle (Admin/Ödeme)
messagingApi.addCreditsToPartner(
  partnerId: string,
  amount: number,
  description: string
)
```

#### Real-time Dinleme
```typescript
// Yeni mesajları dinle
messagingApi.subscribeToMessages(conversationId, (message) => {
  console.log('Yeni mesaj:', message);
})

// Yeni konuşmaları dinle (Partner)
messagingApi.subscribeToPartnerConversations(partnerId, (conversation) => {
  console.log('Yeni iş fırsatı:', conversation);
})
```

---

## 🎨 UI Componentleri

### 1. PartnerMessagesInbox (Partner Gelen Kutusu)
**Dosya:** `/components/partner/PartnerMessagesInbox.tsx`  
**Route:** `/partner/mesajlar`

**Özellikler:**
- Tüm konuşmaları listele (kilitli/açık)
- Filtreleme: Tümü / Kilitli / Açık
- Kredi bakiyesi gösterimi
- Kilitli mesajlar bulanık gösterim
- Real-time yeni mesaj bildirimi

**Kullanım:**
```tsx
<PartnerMessagesInbox />
```

### 2. PartnerChatPage (Partner Chat Ekranı)
**Dosya:** `/components/partner/PartnerChatPage.tsx`  
**Route:** `/partner/mesajlar/:conversationId`

**Özellikler:**
- **Kilitli Durum:** 
  - Mesaj içeriği gizli
  - "Kilidi Aç" modal
  - Kredi kontrolü
  - Yetersiz kredi uyarısı
- **Açık Durum:**
  - Tam chat arayüzü
  - Real-time mesajlaşma
  - Müşteri telefonu görünür
  - Konum bilgisi

**Unlock Modal:**
```tsx
// Kredi bakiyesi kontrol edilir
// Yetersizse: Kredi yükleme sayfasına yönlendir
// Yeterliyse: Transaction oluştur, kilidi aç
```

### 3. CustomerMessageModal (Müşteri Mesaj Gönderme)
**Dosya:** `/components/CustomerMessageModal.tsx`

**Özellikler:**
- Hazır mesaj şablonları
- Konum paylaşımı (GPS)
- Partner bilgisi gösterimi
- Başarı/Hata mesajları

**Kullanım:**
```tsx
<CustomerMessageModal
  partnerId={partner.id}
  partnerName={partner.name}
  serviceType="cekici"
  onClose={() => setShowModal(false)}
  onSuccess={() => navigate('/musteri/mesajlar')}
/>
```

---

## 🚀 Kurulum Adımları

### 1. Database Migration Çalıştır
```bash
# Supabase Dashboard'da SQL Editor'de çalıştır
migrations/042_messaging_system.sql
```

### 2. Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Hazır Şablonları Yükle
Migration dosyası otomatik olarak hazır şablonları ekler:
- Müşteri: Acil Yardım, Fiyat Sorgusu, Konum Paylaşımı
- Partner: Yolda, Teklif, Detay İsteği

### 4. Test Kredisi Ver (Opsiyonel)
```sql
-- Tüm partnerlere 100 kredi hediye
INSERT INTO transactions (partner_id, type, amount, balance_after, description)
SELECT id, 'CREDIT_GIFT', 100, 100, 'Mesajlaşma sistemi açılış hediyesi'
FROM partners;
```

### 5. Route'ları Kontrol Et
`App.tsx` dosyasında route'lar otomatik eklenmiştir:
```tsx
<Route path="/partner/mesajlar" element={<PartnerMessagesInbox />} />
<Route path="/partner/mesajlar/:conversationId" element={<PartnerChatPage />} />
```

---

## 📝 Kullanım Senaryoları

### Senaryo 1: Müşteri Mesaj Gönderir
1. Müşteri ListingPage veya ProviderDetailPage'de "Mesaj Gönder" butonuna tıklar
2. `CustomerMessageModal` açılır
3. Müşteri mesajını yazar (opsiyonel: konum paylaşır)
4. Mesaj gönderilir → `conversations` + `messages` tabloları oluşturulur
5. Partner'e bildirim gönderilir (SMS/Push/Email)

### Senaryo 2: Partner Kilitli Mesajı Görür
1. Partner `/partner/mesajlar` sayfasına girer
2. Yeni konuşmayı görür ama içerik bulanık
3. "Kilidi Aç - 50 Kredi" butonuna tıklar
4. Unlock modal açılır

**Durum A: Yeterli Kredi Var**
- Kredi düşer (Transaction oluşturulur)
- `is_unlocked = TRUE` yapılır
- Mesaj içeriği görünür hale gelir
- Chat açılır

**Durum B: Yetersiz Kredi**
- Uyarı gösterilir
- "Kredi Yükle" butonuna tıkla → `/partner/krediler` sayfasına git

### Senaryo 3: Açık Konuşmada Mesajlaşma
1. Partner mesaj yazar ve gönderir
2. Mesaj real-time olarak müşteriye düşer
3. Müşteri yanıt verir
4. Sınırsız mesajlaşma devam eder (ek ücret yok)

---

## 💰 Gelir Modeli

### Kredi Fiyatlandırması
```
100 Kredi = 100₺ (1 Kredi = 1₺)
500 Kredi = 450₺ (%10 indirim)
1000 Kredi = 800₺ (%20 indirim)
```

### Kilidi Açma Bedeli
- **Standart:** 50 Kredi (50₺)
- **Acil İş:** 100 Kredi (100₺) - Müşteri "Acil" olarak işaretlerse
- **Premium Müşteri:** 30 Kredi (30₺) - Tekrar eden müşteriler için indirim

### Gelir Hesaplaması
```
Aylık 1000 yeni konuşma × 50₺ = 50,000₺ platform geliri
```

---

## 🔐 Güvenlik & Anti-Leakage

### Platform Dışına Çıkmayı Engellemek
```typescript
// messagingApi.ts içinde
maskSensitiveInfo(text: string): string {
  // Telefon: 0532 123 45 67 → 0*** *** ** **
  text = text.replace(/0[0-9]{3}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}/g, '0*** *** ** **');
  
  // Email: test@example.com → t***@example.com
  text = text.replace(/([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1***@$2');
  
  return text;
}
```

### Kural İhlali Tespiti
- Müşteri mesajında telefon varsa maskele
- Platform dışı iletişim tespit edilirse uyarı
- Tekrarlayan ihlaller → Partner hesabı askıya alınır

---

## 🎯 KPI ve Metrikler

### Takip Edilecek Metrikler
```sql
-- Günlük kilidi açılan konuşma sayısı
SELECT COUNT(*) FROM conversations 
WHERE is_unlocked = TRUE 
AND unlocked_at::date = CURRENT_DATE;

-- Partner başına ortalama harcama
SELECT partner_id, SUM(amount) as total_spent
FROM transactions
WHERE type = 'CHAT_UNLOCK'
GROUP BY partner_id;

-- Dönüşüm oranı (mesaj → kilit açma)
SELECT 
  COUNT(CASE WHEN is_unlocked THEN 1 END)::FLOAT / COUNT(*) as conversion_rate
FROM conversations;
```

---

## 🚀 Gelecek Geliştirmeler

### Faz 2: Gelişmiş Özellikler
- [ ] **Ses/Video Mesajlar:** Daha zengin iletişim
- [ ] **Dosya Ekleri:** Fotoğraf, PDF paylaşımı
- [ ] **Otomatik Yanıtlar:** Partner hazır şablonlarla hızlı yanıt
- [ ] **AI Asistan:** Otomatik fiyat teklifi oluşturma
- [ ] **Read Receipts:** "Görüldü" tikleri (WhatsApp tarzı)

### Faz 3: Akıllı Fiyatlandırma
- [ ] **Dinamik Fiyatlandırma:** Yoğunluğa göre kilit fiyatı değişir
- [ ] **Abonelik Modeli:** Aylık sabit ücretle sınırsız kilidi aç
- [ ] **Premium Plus:** İlk yanıt garantisi (15 dk içinde)

### Faz 4: Analitik & Raporlama
- [ ] **Partner Dashboard:** Mesaj istatistikleri, dönüşüm oranları
- [ ] **Admin Analytics:** Gelir raporları, en çok harcayan partnerler
- [ ] **A/B Testing:** Farklı kilit fiyatları test et

---

## 📞 Destek & İletişim

### Teknik Sorunlar
- **Supabase RLS Hataları:** RLS politikalarını kontrol et
- **Real-time Çalışmıyor:** Supabase Realtime'ın aktif olduğundan emin ol
- **Kredi Düşmüyor:** Transaction trigger'larını kontrol et

### Geliştirici Notları
```bash
# Migration geri alma
# Supabase'de manuel DROP TABLE gerekir

# Test için kredi ekle
INSERT INTO transactions (partner_id, type, amount, balance_after, description)
VALUES ('partner-uuid', 'CREDIT_GIFT', 1000, 1000, 'Test kredisi');

# Konuşma kilidini manuel aç (test için)
UPDATE conversations SET is_unlocked = TRUE WHERE id = 'conv-uuid';
```

---

## ✅ Tamamlanan İşler

- [x] Database şeması oluşturuldu
- [x] TypeScript type tanımlamaları
- [x] Supabase API fonksiyonları
- [x] Partner Inbox UI
- [x] Partner Chat UI (kilit mekanizması)
- [x] Müşteri mesaj gönderme modal
- [x] Kredi sistemi entegrasyonu
- [x] Real-time messaging
- [x] Hassas bilgi maskeleme
- [x] Route tanımları
- [x] RLS politikaları

---

## 📄 Dosya Yapısı

```
/migrations
  └── 042_messaging_system.sql

/services
  └── messagingApi.ts

/components
  ├── CustomerMessageModal.tsx
  └── /partner
      ├── PartnerMessagesInbox.tsx
      └── PartnerChatPage.tsx

/types.ts (Messaging types eklendi)
```

---

**Son Güncelleme:** 12 Aralık 2025  
**Geliştirici:** GitHub Copilot + Yolmov Team  
**Lisans:** Proprietary
