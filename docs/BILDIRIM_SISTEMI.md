# 🔔 YOLMOV Bildirim Sistemi

## Genel Bakış

YOLMOV bildirim sistemi, kullanıcı tercihlerine göre gerçek zamanlı bildirimler gönderen tamamen entegre bir sistemdir.

## Özellikler

✅ **Kullanıcı Tercihlerine Göre Filreleme**: Bildirimler kullanıcının ayarlarına göre gönderilir
✅ **Gerçek Veritabanı**: Supabase PostgreSQL tabanlı
✅ **Okundu Takibi**: Otomatik read_at timestamp
✅ **İlişkili Kayıtlar**: Her bildirim ilgili request/offer ile bağlantılı
✅ **RLS Güvenliği**: Kullanıcılar sadece kendi bildirimlerini görebilir

## Bildirim Tercihleri

### Bildirim Kanalları
- **E-Posta Bildirimleri**: Detaylı bilgilendirmeler (yakında aktif)
- **Push Bildirimleri**: Anlık bildirimler (ANA ANAHTAR - kapatılırsa hiçbir bildirim gitmez)

### Bildirim Türleri
1. **Talep Güncellemeleri** (`orderUpdates`):
   - Yeni teklif alındı
   - Teklif kabul/red edildi
   - Talep iptal edildi
   - Hizmet başladı/tamamlandı

2. **Kampanyalar ve Fırsatlar** (`promotions`):
   - Özel indirimler
   - Kampanya bildirimleri

3. **Haber Bülteni** (`newsletter`):
   - Yeni özellikler
   - Platform güncellemeleri
   - Duyurular

## Bildirim Tipleri

| Tip | Açıklama | Tercih Kategorisi |
|-----|----------|-------------------|
| `offer_received` | Yeni teklif alındı | Talep Güncellemeleri |
| `offer_accepted` | Teklif kabul edildi | Talep Güncellemeleri |
| `offer_rejected` | Teklif reddedildi | Talep Güncellemeleri |
| `request_matched` | Talep eşleşti | Talep Güncellemeleri |
| `request_cancelled` | Talep iptal edildi | Talep Güncellemeleri |
| `service_started` | Hizmet başladı | Talep Güncellemeleri |
| `service_completed` | Hizmet tamamlandı | Talep Güncellemeleri |
| `profile_updated` | Profil güncellendi | Sistem (her zaman) |
| `system` | Genel sistem bildirimi | Haber Bülteni |
| `payment_received` | Ödeme alındı | Talep Güncellemeleri |

## Kullanım

### Bildirim Gönderme

```typescript
import { notifyOfferReceived, notifyProfileUpdated } from '../services/notifications';

// Teklif bildirimi (tercih kontrolü ile)
await notifyOfferReceived(customerId, requestId, partnerId, 850);

// Profil güncelleme bildirimi (her zaman gönderilir)
await notifyProfileUpdated(customerId);

// Kampanya bildirimi (tercihlere göre)
import { notifyPromotion } from '../services/notifications';
await notifyPromotion(
  customerId,
  'Özel İndirim! 🎉',
  'Bu hafta sonu tüm hizmetlerde %20 indirim!',
  '/kampanyalar'
);
```

### Tercihleri Kontrol Etme

Tüm bildirim fonksiyonları otomatik olarak kullanıcı tercihlerini kontrol eder:

```typescript
// canSendNotification helper fonksiyonu otomatik çalışır
async function canSendNotification(
  customerId: string,
  notificationType: 'orderUpdates' | 'promotions' | 'newsletter' | 'system'
): Promise<boolean>
```

**Mantık:**
1. Sistem bildirimleri (`system`) → Her zaman gönderilir
2. Push bildirimleri kapalı → Hiçbir bildirim gönderilmez
3. İlgili kategori kapalı → O türde bildirim gönderilmez

## Veritabanı Yapısı

### `notifications` Tablosu

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  related_id UUID,           -- İlgili kayıt (request, offer)
  related_type VARCHAR(50),  -- 'request', 'offer', vb.
  action_url VARCHAR(500),   -- Tıklayınca gidilecek URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
```

### `customer_notification_preferences` Tablosu

```sql
CREATE TABLE customer_notification_preferences (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  order_updates BOOLEAN DEFAULT TRUE,
  promotions BOOLEAN DEFAULT FALSE,
  newsletter BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Notifications API

```typescript
// Bildirimleri getir
await supabaseApi.notifications.getByCustomerId(customerId);

// Okunmamış sayısını getir
await supabaseApi.notifications.getUnreadCount(customerId);

// Okundu işaretle
await supabaseApi.notifications.markAsRead(notificationId);

// Tümünü okundu işaretle
await supabaseApi.notifications.markAllAsRead(customerId);

// Yeni bildirim oluştur
await supabaseApi.notifications.create({
  customerId,
  type: 'offer_received',
  title: 'Başlık',
  message: 'Mesaj',
  read: false
});
```

### Notification Preferences API

```typescript
// Tercihleri getir
const prefs = await supabaseApi.notificationPreferences.getByCustomerId(customerId);

// Tercihleri güncelle
await supabaseApi.notificationPreferences.update(customerId, {
  pushEnabled: true,
  orderUpdates: true,
  promotions: false
});
```

## UI Bileşenleri

### NotificationCenter
Header'da bildirim merkezi - gerçek zamanlı güncelleme:
- 30 saniyede bir otomatik yenileme
- Auth değişikliklerini dinler
- Okunmamış sayaç
- Bildirime tıklayınca okundu işaretleme

### Bildirim Tercihleri Paneli
Profil sayfasında bildirim ayarları:
- Toggle switch'ler
- Açıklayıcı metinler
- Anında güncelleme

## İş Akışı Örnekleri

### 1. Yeni Kullanıcı Kaydı
```
Kayıt → LoginPage.tsx → notifyWelcome() → ✅ "Hoş Geldiniz" bildirimi
```

### 2. Profil Güncelleme
```
Profil Kaydet → CustomerProfilePage.tsx → notifyProfileUpdated() → ✅ "Profil güncellendi" bildirimi
```

### 3. Teklif Alma
```
Partner Teklif Gönder → notifyOfferReceived() → Tercih Kontrolü → ✅/❌ Bildirim
```

### 4. Kampanya Bildirimi
```
Admin Kampanya Oluştur → notifyPromotion() → promotions: true? → ✅/❌ Bildirim
```

## Güvenlik

- **RLS Policies**: Kullanıcılar sadece kendi bildirimlerini görebilir
- **Session Validation**: Tüm API çağrıları session kontrolü yapar
- **Input Validation**: Bildirim içeriği sanitize edilir

## Gelecek Özellikler

🔜 **E-posta Entegrasyonu**: E-posta ile bildirim gönderimi
🔜 **Push Notifications**: Gerçek browser push notifications
🔜 **Bildirim Sesleri**: Özelleştirilebilir bildirim sesleri
🔜 **Zamanlama**: Bildirimleri belirli saatlerde gönderme
🔜 **Toplu İşlemler**: Birden fazla kullanıcıya aynı anda bildirim

## Sorun Giderme

### Bildirim Gelmiyor
1. `pushEnabled` açık mı kontrol edin
2. İlgili kategori (`orderUpdates`, `promotions`, `newsletter`) açık mı?
3. Console'da hata mesajlarını kontrol edin
4. Session geçerli mi kontrol edin

### Bildirim Sayısı Yanlış
- NotificationCenter 30 saniyede bir güncellenir
- Manuel yenilemek için logout/login yapın
- `getUnreadCount` API'sini kontrol edin

## Katkıda Bulunma

Yeni bildirim tipi eklerken:
1. `types.ts`'de `Notification.type`'a yeni tip ekleyin
2. Migration dosyasında CHECK constraint'e ekleyin
3. Helper fonksiyonu `notifications.ts`'ye ekleyin
4. Uygun tercih kategorisini belirleyin
5. Dokümantasyonu güncelleyin
