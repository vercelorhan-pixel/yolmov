import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

/**
 * Push Notification API - Arama Bildirimi (Firebase Admin SDK v1)
 * 
 * Google 2024 Haziran'da legacy Server Key'i kapattı.
 * Artık firebase-admin SDK ile HTTP v1 API kullanılıyor.
 * 
 * Environment Variable:
 * FIREBASE_SERVICE_ACCOUNT = JSON string (service account credentials)
 * 
 * Body: {
 *   partnerId: string - Aranacak partner ID
 *   callerName: string - Arayan kişi/firma adı
 *   callerPhone?: string - Arayan telefon numarası
 *   callId: string - Arama kaydı ID
 * }
 */

// Firebase Admin'i sadece bir kez başlat
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountJson) {
    console.error('[FCM] FIREBASE_SERVICE_ACCOUNT environment variable not set');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('[FCM] Error parsing service account JSON:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { partnerId, callerName, callerPhone, callId } = req.body || {};

    if (!partnerId) {
      return res.status(400).json({ error: 'partnerId gerekli' });
    }

    if (!callId) {
      return res.status(400).json({ error: 'callId gerekli' });
    }

    // Supabase client oluştur
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[send-call-notification] Missing Supabase credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Partner'ın FCM token ve bildirim tercihlerini al
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('fcm_token, company_name')
      .eq('id', partnerId)
      .single();

    if (partnerError) {
      console.error('[send-call-notification] Partner not found:', partnerError);
      return res.status(404).json({ error: 'Partner bulunamadı' });
    }

    if (!partner.fcm_token) {
      console.log('[send-call-notification] Partner has no FCM token:', partnerId);
      return res.status(200).json({ 
        ok: true, 
        skipped: true, 
        reason: 'no_fcm_token' 
      });
    }

    // Bildirim tercihlerini kontrol et
    const { data: prefs } = await supabase
      .from('partner_notification_preferences')
      .select('voice_call_push_enabled, all_notifications_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end')
      .eq('partner_id', partnerId)
      .single();

    // Bildirimler kapalıysa gönderme
    if (prefs && !prefs.all_notifications_enabled) {
      console.log('[send-call-notification] All notifications disabled for partner:', partnerId);
      return res.status(200).json({ 
        ok: true, 
        skipped: true, 
        reason: 'notifications_disabled' 
      });
    }

    // Sesli arama bildirimleri kapalıysa gönderme
    if (prefs && !prefs.voice_call_push_enabled) {
      console.log('[send-call-notification] Voice call notifications disabled for partner:', partnerId);
      return res.status(200).json({ 
        ok: true, 
        skipped: true, 
        reason: 'voice_call_notifications_disabled' 
      });
    }

    // Sessiz saatler kontrolü (opsiyonel)
    if (prefs && prefs.quiet_hours_enabled && prefs.quiet_hours_start && prefs.quiet_hours_end) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format
      
      const start = prefs.quiet_hours_start;
      const end = prefs.quiet_hours_end;
      
      // Sessiz saatler içinde mi kontrol et
      let isQuietHour = false;
      if (start < end) {
        // Normal saat aralığı (örn: 22:00 - 08:00 değil, 09:00 - 17:00)
        isQuietHour = currentTime >= start && currentTime <= end;
      } else {
        // Gece yarısını geçen saat aralığı (örn: 22:00 - 08:00)
        isQuietHour = currentTime >= start || currentTime <= end;
      }
      
      if (isQuietHour) {
        console.log('[send-call-notification] Quiet hours active, skipping notification:', partnerId);
        return res.status(200).json({ 
          ok: true, 
          skipped: true, 
          reason: 'quiet_hours' 
        });
      }
    }

    // Firebase Admin'i başlat
    const firebaseApp = initializeFirebaseAdmin();
    
    if (!firebaseApp) {
      console.log('[send-call-notification] Firebase Admin not configured, skipping push');
      return res.status(200).json({ 
        ok: true, 
        skipped: true, 
        reason: 'firebase_not_configured' 
      });
    }

    // App URL'ini belirle
    const appUrl = process.env.VITE_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://yolmov.com');

    // Firebase Cloud Messaging HTTP v1 API ile push notification gönder
    const message: admin.messaging.Message = {
      token: partner.fcm_token,
      notification: {
        title: '📞 Gelen Arama',
        body: callerName ? `${callerName} sizi arıyor` : 'Yeni bir arama var',
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: `call_${callId}`,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
        },
        fcmOptions: {
          link: `${appUrl}/partner/dashboard?incoming_call=${callId}`,
        },
      },
      data: {
        type: 'incoming_call',
        callId: callId,
        callerName: callerName || 'Anonim',
        callerPhone: callerPhone || '',
        url: `/partner/dashboard?incoming_call=${callId}`,
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'calls',
          defaultVibrateTimings: true,
        },
      },
    };

    console.log('[send-call-notification] Sending FCM to partner:', partnerId);

    try {
      const messageId = await admin.messaging().send(message);
      console.log('[send-call-notification] Push notification sent successfully:', messageId);
      return res.status(200).json({ ok: true, sent: true, messageId });
    } catch (fcmError: any) {
      console.error('[send-call-notification] FCM Error:', fcmError);
      
      // Token geçersiz ise veritabanından sil
      if (fcmError.code === 'messaging/invalid-registration-token' ||
          fcmError.code === 'messaging/registration-token-not-registered') {
        console.warn('[send-call-notification] Invalid FCM token, removing from DB');
        
        await supabase
          .from('partners')
          .update({ fcm_token: null })
          .eq('id', partnerId);
          
        return res.status(200).json({ 
          ok: true, 
          skipped: true, 
          reason: 'invalid_token' 
        });
      }
      
      throw fcmError;
    }

  } catch (error) {
    console.error('[send-call-notification] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
