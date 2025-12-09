// Firebase Messaging Service Worker
// Arka planda (tarayıcı kapalıyken) bildirimleri almak için

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase Configuration (Service Worker ana dosyaları göremez, tekrar tanımlanmalı)
const firebaseConfig = {
  apiKey: "AIzaSyBoF-wh-ro18wSgJR5FFT7WzrLZX48Kcck",
  authDomain: "yolmov-web-push.firebaseapp.com",
  projectId: "yolmov-web-push",
  storageBucket: "yolmov-web-push.firebasestorage.app",
  messagingSenderId: "806551149404",
  appId: "1:806551149404:web:d356974ca9c187440e7f99",
  measurementId: "G-N99CHPLQHW"
};

// Firebase başlat
firebase.initializeApp(firebaseConfig);

// Messaging servisini al
const messaging = firebase.messaging();

// Arka planda mesaj geldiğinde
messaging.onBackgroundMessage((payload) => {
  console.log('[Firebase SW] Arka plan bildirimi geldi:', payload);
  
  const notificationTitle = payload.notification?.title || 'Yolmov Bildirimi';
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bir bildiriminiz var',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200, 100, 400], // Titreşim deseni (mobil için)
    tag: 'yolmov-call', // Aynı tag'lı bildirimler birleşir
    requireInteraction: true, // Kullanıcı kapatana kadar kalır
    data: {
      url: payload.data?.url || '/partner',
      callId: payload.data?.callId,
      callerId: payload.data?.callerId
    },
    actions: [
      {
        action: 'answer',
        title: '📞 Cevapla',
      },
      {
        action: 'reject',
        title: '❌ Reddet',
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bildirime tıklandığında
self.addEventListener('notificationclick', (event) => {
  console.log('[Firebase SW] Bildirime tıklandı:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'answer') {
    // Cevapla butonuna basıldı - Partner dashboard'u aç
    event.waitUntil(
      clients.openWindow(`/partner?tab=calls&answer=${data.callId}`)
    );
  } else if (action === 'reject') {
    // Reddet butonuna basıldı - API call yapılabilir
    console.log('[Firebase SW] Arama reddedildi');
  } else {
    // Bildirimin kendisine tıklandı
    event.waitUntil(
      clients.openWindow(data.url || '/partner')
    );
  }
});

console.log('[Firebase SW] Service Worker başlatıldı');
