/**
 * Firebase Configuration - Yolmov Web Push Notifications
 * 
 * Bu dosya Firebase ile bağlantıyı kurar.
 * Partner'lara push notification göndermek için kullanılır.
 */

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "../services/supabase";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBoF-wh-ro18wSgJR5FFT7WzrLZX48Kcck",
  authDomain: "yolmov-web-push.firebaseapp.com",
  projectId: "yolmov-web-push",
  storageBucket: "yolmov-web-push.firebasestorage.app",
  messagingSenderId: "806551149404",
  appId: "1:806551149404:web:d356974ca9c187440e7f99",
  measurementId: "G-N99CHPLQHW"
};

// VAPID Key - Web Push Certificates
// Firebase Console > Project Settings > Cloud Messaging > Web configuration > Web Push certificates
export const VAPID_KEY = "BOHukI7P2r18VSnpIULfSV-z75IbItBU9ZtlfvxZOCLJK3XqiXTi47yCv2QaT_0sldlOqmkymGqkZdUMq-OG1KM";

// Firebase App başlat
const app = initializeApp(firebaseConfig);

// Messaging servisini al (sadece browser'da çalışır)
let messaging: ReturnType<typeof getMessaging> | null = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging could not be initialized:', error);
  }
}

/**
 * Bildirim izni iste ve FCM token al
 * @returns FCM token veya null
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Tarayıcı desteği kontrolü
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('[FCM] Bu tarayıcı bildirim desteklemiyor');
      return null;
    }

    // PushManager desteği kontrolü
    if (!('PushManager' in window)) {
      console.warn('[FCM] Bu tarayıcı Push API desteklemiyor');
      return null;
    }

    // İzin iste
    const permission = await Notification.requestPermission();
    console.log('[FCM] Bildirim izni durumu:', permission);
    
    if (permission !== 'granted') {
      console.warn('[FCM] Bildirim izni reddedildi');
      return null;
    }

    // Messaging kontrolü
    if (!messaging) {
      console.warn('[FCM] Firebase Messaging başlatılamadı');
      return null;
    }

    console.log('[FCM] Service Worker hazırlanıyor...');

    // Mevcut firebase SW'yi bul veya kaydet
    let firebaseReg: ServiceWorkerRegistration | null = null;
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      if (reg.active?.scriptURL.includes('firebase-messaging-sw.js')) {
        firebaseReg = reg;
        console.log('[FCM] Mevcut Firebase SW bulundu:', reg.scope);
        break;
      }
    }

    // Firebase SW yoksa kaydet
    if (!firebaseReg) {
      console.log('[FCM] Yeni Firebase SW kaydediliyor...');
      firebaseReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[FCM] Firebase SW kaydedildi, scope:', firebaseReg.scope);
      
      // Yeni SW'nin aktif olmasını bekle
      if (firebaseReg.installing || firebaseReg.waiting) {
        const sw = firebaseReg.installing || firebaseReg.waiting;
        if (sw) {
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              console.log('[FCM] SW activation timeout');
              resolve();
            }, 10000);
            
            const checkState = () => {
              if (sw.state === 'activated') {
                clearTimeout(timeout);
                console.log('[FCM] SW aktif oldu');
                resolve();
              }
            };
            
            sw.addEventListener('statechange', checkState);
            checkState();
          });
        }
      }
    }

    // navigator.serviceWorker.ready bekle
    await navigator.serviceWorker.ready;
    console.log('[FCM] Service Worker hazır!');

    // Token alma - 3 deneme yap
    let token: string | null = null;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[FCM] Token alınıyor... (Deneme ${attempt}/3)`);
        
        token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: firebaseReg!
        });
        
        if (token) {
          console.log('[FCM] 🔥 TOKEN ALINDI:', token.substring(0, 50) + '...');
          return token;
        }
        
        console.warn('[FCM] Token boş döndü');
      } catch (error: unknown) {
        lastError = error as Error;
        console.warn(`[FCM] Deneme ${attempt} başarısız:`, (error as Error).message);
        
        // Push service error ise bekle ve tekrar dene
        if ((error as Error).message?.includes('push service') && attempt < 3) {
          console.log('[FCM] 2 saniye beklenip tekrar denenecek...');
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    
    // Tüm denemeler başarısız
    console.error('[FCM] ❌ Tüm denemeler başarısız. Son hata:', lastError);
    return null;
    
  } catch (error) {
    console.error('[FCM] ❌ Kritik hata:', error);
    return null;
  }
};

/**
 * FCM Token'ı partner tablosuna kaydet
 * @param partnerId Partner ID
 * @param token FCM Token
 */
export const saveFCMToken = async (partnerId: string, token: string): Promise<void> => {
  if (!partnerId || !token) {
    console.warn('[FCM] Partner ID veya token eksik');
    return;
  }

  try {
    const { error } = await supabase
      .from('partners')
      .update({ 
        fcm_token: token,
        fcm_token_updated_at: new Date().toISOString()
      })
      .eq('id', partnerId);

    if (error) {
      console.error('[FCM] Token kaydetme hatası:', error);
    } else {
      console.log('[FCM] ✅ Token veritabanına kaydedildi');
    }
  } catch (error) {
    console.error('[FCM] Supabase hatası:', error);
  }
};

export { messaging, getToken, onMessage };
export default app;
