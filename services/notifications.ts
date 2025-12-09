/**
 * NOTIFICATION HELPERS
 * 
 * Supabase API'yi kullanarak bildirim oluşturma helper fonksiyonları
 * localStorage yerine gerçek veritabanı kullanımı
 * 
 * Bildirim tercihleri ile entegre - kullanıcı tercihlerine göre bildirim gönderilir
 */

import supabaseApi from './supabaseApi';
import { Notification } from '../types';

/**
 * Kullanıcının bildirim tercihlerini kontrol et
 * @param customerId Müşteri ID
 * @param notificationType Bildirim türü: 'orderUpdates' | 'promotions' | 'newsletter'
 * @returns Bildirim gönderilebilir mi?
 */
async function canSendNotification(
  customerId: string,
  notificationType: 'orderUpdates' | 'promotions' | 'newsletter' | 'system'
): Promise<boolean> {
  try {
    // Sistem bildirimleri her zaman gönderilir
    if (notificationType === 'system') {
      return true;
    }

    const prefs = await supabaseApi.notificationPreferences.getByCustomerId(customerId);
    
    // Push bildirimleri kapalıysa hiç bildirim gönderme
    if (!prefs.pushEnabled) {
      console.log(`📵 Push notifications disabled for user ${customerId}`);
      return false;
    }

    // Bildirim türüne göre kontrol et
    switch (notificationType) {
      case 'orderUpdates':
        return prefs.orderUpdates;
      case 'promotions':
        return prefs.promotions;
      case 'newsletter':
        return prefs.newsletter;
      default:
        return true;
    }
  } catch (error) {
    console.error('Bildirim tercihleri kontrol edilemedi:', error);
    // Hata durumunda bildirim GÖNDERME (kullanıcı tercihlerine saygı göster)
    return false;
  }
}

/**
 * Teklif alındığında bildirim oluştur (Talep Güncellemeleri)
 */
export async function notifyOfferReceived(
  customerId: string,
  requestId: string,
  partnerId: string,
  price: number
): Promise<void> {
  try {
    // Kullanıcının talep güncellemeleri tercihini kontrol et
    const canSend = await canSendNotification(customerId, 'orderUpdates');
    if (!canSend) {
      console.log('⚠️ User has disabled order updates notifications');
      return;
    }

    await supabaseApi.notifications.create({
      customerId,
      type: 'offer_received',
      title: 'Yeni Teklif Alındı',
      message: `Size ₺${price.toLocaleString('tr-TR')} tutarında yeni bir teklif geldi.`,
      read: false,
      relatedId: requestId,
      relatedType: 'request',
      actionUrl: `/profil?tab=taleplerim`,
    });
    console.log('✅ Offer notification sent to user:', customerId);
  } catch (error) {
    console.error('Teklif bildirimi oluşturulamadı:', error);
  }
}

/**
 * Teklif kabul edildiğinde bildirim oluştur (Talep Güncellemeleri)
 */
export async function notifyOfferAccepted(
  customerId: string,
  offerId: string,
  requestId: string
): Promise<void> {
  try {
    // Kullanıcının talep güncellemeleri tercihini kontrol et
    const canSend = await canSendNotification(customerId, 'orderUpdates');
    if (!canSend) {
      console.log('⚠️ User has disabled order updates notifications');
      return;
    }

    await supabaseApi.notifications.create({
      customerId,
      type: 'offer_accepted',
      title: 'Teklif Kabul Edildi',
      message: 'Teklifiniz müşteri tarafından kabul edildi. Hemen yola çıkabilirsiniz!',
      read: false,
      relatedId: offerId,
      relatedType: 'offer',
      actionUrl: `/partner/dashboard`,
    });
  } catch (error) {
    console.error('Kabul bildirimi oluşturulamadı:', error);
  }
}

/**
 * Teklif reddedildiğinde bildirim oluştur (Talep Güncellemeleri)
 */
export async function notifyOfferRejected(
  customerId: string,
  offerId: string,
  requestId: string
): Promise<void> {
  try {
    // Kullanıcının talep güncellemeleri tercihini kontrol et
    const canSend = await canSendNotification(customerId, 'orderUpdates');
    if (!canSend) {
      console.log('⚠️ User has disabled order updates notifications');
      return;
    }

    await supabaseApi.notifications.create({
      customerId,
      type: 'offer_rejected',
      title: 'Teklif Reddedildi',
      message: 'Teklifiniz müşteri tarafından reddedildi.',
      read: false,
      relatedId: offerId,
      relatedType: 'offer',
    });
  } catch (error) {
    console.error('Red bildirimi oluşturulamadı:', error);
  }
}

/**
 * Talep iptal edildiğinde bildirim oluştur (Talep Güncellemeleri)
 */
export async function notifyRequestCancelled(
  customerId: string,
  requestId: string
): Promise<void> {
  try {
    // Kullanıcının talep güncellemeleri tercihini kontrol et
    const canSend = await canSendNotification(customerId, 'orderUpdates');
    if (!canSend) {
      console.log('⚠️ User has disabled order updates notifications');
      return;
    }

    await supabaseApi.notifications.create({
      customerId,
      type: 'request_cancelled',
      title: 'Talep İptal Edildi',
      message: 'Talebiniz başarıyla iptal edildi.',
      read: false,
      relatedId: requestId,
      relatedType: 'request',
    });
  } catch (error) {
    console.error('İptal bildirimi oluşturulamadı:', error);
  }
}

/**
 * Profil güncellendiğinde bildirim oluştur (Talep Güncellemeleri)
 */
export async function notifyProfileUpdated(customerId: string): Promise<void> {
  try {
    // Profil güncellemeleri de orderUpdates tercihine bağlı
    const canSend = await canSendNotification(customerId, 'orderUpdates');
    if (!canSend) {
      console.log('⚠️ User has disabled order updates notifications');
      return;
    }

    await supabaseApi.notifications.create({
      customerId,
      type: 'profile_updated',
      title: 'Profil Güncellendi',
      message: 'Profil bilgileriniz başarıyla güncellendi.',
      read: false,
      actionUrl: `/profil`,
    });
  } catch (error) {
    console.error('Profil güncelleme bildirimi oluşturulamadı:', error);
  }
}

/**
 * Hizmet başladığında bildirim oluştur (Talep Güncellemeleri)
 */
export async function notifyServiceStarted(
  customerId: string,
  requestId: string
): Promise<void> {
  try {
    // Kullanıcının talep güncellemeleri tercihini kontrol et
    const canSend = await canSendNotification(customerId, 'orderUpdates');
    if (!canSend) {
      console.log('⚠️ User has disabled order updates notifications');
      return;
    }

    await supabaseApi.notifications.create({
      customerId,
      type: 'service_started',
      title: 'Hizmet Başladı',
      message: 'Yol yardım hizmetiniz başladı. Araç yola çıktı!',
      read: false,
      relatedId: requestId,
      relatedType: 'request',
      actionUrl: `/profil?tab=taleplerim`,
    });
  } catch (error) {
    console.error('Hizmet başlangıç bildirimi oluşturulamadı:', error);
  }
}

/**
 * Hizmet tamamlandığında bildirim oluştur (Talep Güncellemeleri)
 */
export async function notifyServiceCompleted(
  customerId: string,
  requestId: string
): Promise<void> {
  try {
    // Kullanıcının talep güncellemeleri tercihini kontrol et
    const canSend = await canSendNotification(customerId, 'orderUpdates');
    if (!canSend) {
      console.log('⚠️ User has disabled order updates notifications');
      return;
    }

    await supabaseApi.notifications.create({
      customerId,
      type: 'service_completed',
      title: 'Hizmet Tamamlandı',
      message: 'Yol yardım hizmetiniz başarıyla tamamlandı. Deneyiminizi değerlendirmek ister misiniz?',
      read: false,
      relatedId: requestId,
      relatedType: 'request',
      actionUrl: `/profil?tab=taleplerim`,
    });
  } catch (error) {
    console.error('Hizmet tamamlama bildirimi oluşturulamadı:', error);
  }
}

/**
 * Sistem bildirimi oluştur (Haber Bülteni)
 */
export async function notifySystem(
  customerId: string,
  title: string,
  message: string,
  actionUrl?: string
): Promise<void> {
  try {
    // Haber bülteni tercihini kontrol et
    const canSend = await canSendNotification(customerId, 'newsletter');
    if (!canSend) {
      console.log('⚠️ User has disabled newsletter notifications');
      return;
    }

    await supabaseApi.notifications.create({
      customerId,
      type: 'system',
      title,
      message,
      read: false,
      actionUrl,
    });
  } catch (error) {
    console.error('Sistem bildirimi oluşturulamadı:', error);
  }
}

/**
 * Kampanya bildirimi oluştur (Kampanyalar ve Fırsatlar)
 */
export async function notifyPromotion(
  customerId: string,
  title: string,
  message: string,
  actionUrl?: string
): Promise<void> {
  try {
    // Kampanya tercihini kontrol et
    const canSend = await canSendNotification(customerId, 'promotions');
    if (!canSend) {
      console.log('⚠️ User has disabled promotion notifications');
      return;
    }

    await supabaseApi.notifications.create({
      customerId,
      type: 'system',
      title,
      message,
      read: false,
      actionUrl,
    });
    console.log('✅ Promotion notification sent to user:', customerId);
  } catch (error) {
    console.error('Kampanya bildirimi oluşturulamadı:', error);
  }
}

/**
 * Hoş geldin bildirimi oluştur (yeni kullanıcı için) - Sistem Bildirimi
 */
export async function notifyWelcome(customerId: string): Promise<void> {
  try {
    // Hoş geldin bildirimi her zaman gönderilir
    const canSend = await canSendNotification(customerId, 'system');
    if (!canSend) return;

    await supabaseApi.notifications.create({
      customerId,
      type: 'system',
      title: 'Hoş Geldiniz! 🎉',
      message: 'YOLMOV platformuna hoş geldiniz! Yolda kaldığınız her an yanınızdayız.',
      read: false,
    });
    console.log('✅ Welcome notification sent to user:', customerId);
  } catch (error) {
    console.error('Hoş geldin bildirimi oluşturulamadı:', error);
  }
}