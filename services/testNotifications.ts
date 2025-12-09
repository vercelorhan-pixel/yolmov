// Test Notification Service - 5 dakikada bir bildirim gönderir

const TEST_MESSAGES = [
  {
    title: "🚗 Yeni Teklif Geldi!",
    body: "Kadıköy bölgesindeki çekici hizmeti için 3 yeni teklif var.",
    icon: "/yolmov-icon.png"
  },
  {
    title: "⚡ Hizmet Hazır!",
    body: "Akü takviyesi ekibiniz yola çıktı. Tahmini varış: 15 dakika.",
    icon: "/yolmov-icon.png"
  },
  {
    title: "✅ İşlem Tamamlandı",
    body: "Hizmetiniz başarıyla tamamlandı. Değerlendirmenizi bekliyoruz!",
    icon: "/yolmov-icon.png"
  },
  {
    title: "🎉 Özel Kampanya",
    body: "Şu an çekici hizmetinde %15 indirim fırsatı! Acele edin.",
    icon: "/yolmov-icon.png"
  },
  {
    title: "📍 Yakınınızda Hizmet",
    body: "5 km yakınınızda güvenilir bir yol yardım ekibi mevcut.",
    icon: "/yolmov-icon.png"
  }
];

let currentMessageIndex = 0;
let testInterval: NodeJS.Timeout | null = null;

export const startTestNotifications = () => {
  // Test için 1 dakikada bir bildirim gönder (test amaçlı)
  const INTERVAL = 1 * 60 * 1000; // 1 dakika

  console.log('🔔 Test bildirimleri başlatıldı (1 dakikada bir)');

  // İlk bildirimi hemen gönder
  sendTestNotification();

  // Sonra 1 dakikada bir devam et
  testInterval = setInterval(() => {
    sendTestNotification();
  }, INTERVAL);
};

export const stopTestNotifications = () => {
  if (testInterval) {
    clearInterval(testInterval);
    testInterval = null;
    console.log('🔕 Test bildirimleri durduruldu');
  }
};

const sendTestNotification = () => {
  if (!('Notification' in window)) {
    console.warn('⚠️ Notification API desteklenmiyor');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('⚠️ Bildirim izni verilmemiş');
    return;
  }

  const message = TEST_MESSAGES[currentMessageIndex];
  
  // Service Worker varsa onun üzerinden gönder
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    console.log('📱 Service Worker üzerinden bildirim gönderiliyor...');
    
    // Service Worker'a mesaj gönder
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(message.title, {
        body: message.body,
        icon: message.icon || '/yolmov-icon.png',
        badge: message.icon || '/yolmov-icon.png',
        tag: 'yolmov-test-' + Date.now(),
        requireInteraction: false,
        silent: false,
        data: {
          url: '/',
          timestamp: Date.now()
        }
      }).then(() => {
        console.log(`✅ Service Worker bildirimi gönderildi: ${message.title}`);
      }).catch((error) => {
        console.error('❌ Service Worker bildirimi gönderilemedi:', error);
        // Fallback: Native Notification API
        sendNativeNotification(message);
      });
    });
  } else {
    // Service Worker yoksa native API kullan
    console.log('📱 Native Notification API kullanılıyor...');
    sendNativeNotification(message);
  }
  
  // Sıradaki mesaja geç
  currentMessageIndex = (currentMessageIndex + 1) % TEST_MESSAGES.length;
};

const sendNativeNotification = (message: typeof TEST_MESSAGES[0]) => {
  try {
    const notification = new Notification(message.title, {
      body: message.body,
      icon: message.icon,
      badge: message.icon,
      tag: 'yolmov-test-' + Date.now(),
      requireInteraction: false,
      silent: false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    console.log(`✅ Native bildirimi gönderildi: ${message.title}`);
  } catch (error) {
    console.error('❌ Native bildirim hatası:', error);
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Bu tarayıcı bildirimleri desteklemiyor');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Bildirim izni zaten verilmiş');
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Bildirim izni verildi');
      return true;
    }
  }

  console.warn('❌ Bildirim izni reddedildi');
  return false;
};
