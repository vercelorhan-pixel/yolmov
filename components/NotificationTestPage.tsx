import React, { useState, useEffect } from 'react';
import { Bell, Check, X, AlertCircle, Send } from 'lucide-react';

const NotificationTestPage: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [swRegistered, setSwRegistered] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);

  useEffect(() => {
    // İzin durumunu kontrol et
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Service Worker durumunu kontrol et
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setSwRegistered(true);
    }
  }, []);

  const addLog = (message: string) => {
    setTestLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      addLog('❌ Tarayıcınız bildirimleri desteklemiyor');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    addLog(`🔔 İzin durumu: ${result}`);
  };

  const sendTestNotification = async () => {
    if (Notification.permission !== 'granted') {
      addLog('❌ Bildirim izni verilmemiş');
      return;
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Service Worker üzerinden
        addLog('📱 Service Worker üzerinden gönderiliyor...');
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification('🎉 Test Bildirimi', {
          body: 'Bu bir test bildirimidir. Başarılı!',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
          tag: 'test-' + Date.now(),
          requireInteraction: false,
          data: { url: '/' }
        });
        
        addLog('✅ Service Worker bildirimi gönderildi');
      } else {
        // Native API
        addLog('📱 Native API kullanılıyor...');
        const notification = new Notification('🎉 Test Bildirimi', {
          body: 'Bu bir test bildirimidir. Başarılı!',
          icon: '/icons/icon-192.png',
          tag: 'test-' + Date.now(),
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        addLog('✅ Native bildirim gönderildi');
      }
    } catch (error) {
      addLog(`❌ Hata: ${error}`);
    }
  };

  const clearLog = () => {
    setTestLog([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Bell className="text-brand-orange" size={32} />
            Bildirim Test Paneli
          </h1>

          {/* Durum Kartları */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Bildirim İzni</span>
                {permission === 'granted' ? (
                  <Check className="text-green-500" size={20} />
                ) : permission === 'denied' ? (
                  <X className="text-red-500" size={20} />
                ) : (
                  <AlertCircle className="text-yellow-500" size={20} />
                )}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {permission === 'granted' ? '✅ Verildi' : 
                 permission === 'denied' ? '❌ Reddedildi' : 
                 '⏳ Bekleniyor'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Service Worker</span>
                {swRegistered ? (
                  <Check className="text-green-500" size={20} />
                ) : (
                  <X className="text-red-500" size={20} />
                )}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {swRegistered ? '✅ Aktif' : '❌ Pasif'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">API Desteği</span>
                {('Notification' in window) ? (
                  <Check className="text-green-500" size={20} />
                ) : (
                  <X className="text-red-500" size={20} />
                )}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {('Notification' in window) ? '✅ Var' : '❌ Yok'}
              </div>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="space-y-4 mb-8">
            <button
              onClick={requestPermission}
              disabled={permission === 'granted'}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Bell size={20} />
              Bildirim İzni İste
            </button>

            <button
              onClick={sendTestNotification}
              disabled={permission !== 'granted'}
              className="w-full py-4 bg-brand-orange hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Test Bildirimi Gönder
            </button>
          </div>

          {/* Uyarılar */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <AlertCircle size={18} />
              Önemli Notlar
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Bildirimler bazen <strong>sayfa minimize</strong> edildiğinde görünür</li>
              <li>Chrome'da <strong>Ayarlar → Gizlilik ve Güvenlik → Site Ayarları → Bildirimler</strong> kontrol edin</li>
              <li>macOS/Windows <strong>Bildirim Merkezi</strong> ayarlarını kontrol edin</li>
              <li>Bazı tarayıcılarda bildirimler <strong>sessiz mod</strong>da gelebilir</li>
            </ul>
          </div>

          {/* Log Alanı */}
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white">Console Log</h3>
              <button
                onClick={clearLog}
                className="text-xs text-gray-400 hover:text-white"
              >
                Temizle
              </button>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs text-green-400">
              {testLog.length === 0 ? (
                <div className="text-gray-500">Log boş...</div>
              ) : (
                testLog.map((log, idx) => (
                  <div key={idx} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Geri Dön */}
          <button
            onClick={() => window.history.back()}
            className="mt-6 text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPage;
