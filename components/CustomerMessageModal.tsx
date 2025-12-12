import React, { useState, useEffect } from 'react';
import { X, Send, MapPin, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { MessageTemplate, Customer } from '../types';
import messagingApi from '../services/messagingApi';
import { supabaseApi } from '../services/supabaseApi';

interface CustomerMessageModalProps {
  partnerId: string;
  partnerName: string;
  serviceType?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const CustomerMessageModal: React.FC<CustomerMessageModalProps> = ({
  partnerId,
  partnerName,
  serviceType,
  onClose,
  onSuccess,
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [shareLocation, setShareLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  useEffect(() => {
    loadCustomer();
    loadTemplates();
  }, []);

  const loadCustomer = async () => {
    try {
      const session = await supabaseApi.auth.getSession();
      if (session?.user) {
        const customerData = await supabaseApi.customers.getById(session.user.id);
        setCustomer(customerData);
      }
    } catch (error) {
      console.error('❌ Customer yüklenemedi:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const temps = await messagingApi.getTemplates('customer');
      setTemplates(temps);
    } catch (error) {
      console.error('❌ Şablonlar yüklenemedi:', error);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setShareLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding ile adres al (basit versiyon)
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          setLocation({ lat: latitude, lng: longitude, address });
          setMessage((prev) => prev + `\n\n📍 Konumum: https://maps.google.com/?q=${latitude},${longitude}`);
        },
        (error) => {
          console.error('❌ Konum alınamadı:', error);
          setError('Konum bilgisi alınamadı. Lütfen tarayıcı izinlerini kontrol edin.');
          setShareLocation(false);
        }
      );
    } else {
      setError('Tarayıcınız konum paylaşımını desteklemiyor.');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError('Lütfen bir mesaj yazın.');
      return;
    }

    if (!customer) {
      setError('Giriş yapmanız gerekiyor.');
      return;
    }

    if (!partnerId) {
      console.error('❌ partnerId is missing!');
      setError('Partner bilgisi eksik. Lütfen sayfayı yenileyin.');
      return;
    }

    try {
      setSending(true);
      setError('');

      console.log('📤 Sending message:', {
        customerId: customer.id,
        partnerId: partnerId,
        serviceType: serviceType,
      });

      // Konuşma oluştur
      await messagingApi.createConversation({
        customerId: customer.id,
        partnerId: partnerId,
        serviceType: serviceType,
        initialMessage: message,
        customerLocation: customer.city ? `${customer.city}${customer.district ? ', ' + customer.district : ''}` : undefined,
        customerLocationLat: location?.lat,
        customerLocationLng: location?.lng,
      });

      setSuccess(true);
      
      // 2 saniye sonra kapat
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Mesaj gönderilemedi:', error);
      setError(error.message || 'Mesaj gönderilirken bir hata oluştu.');
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Mesaj Gönderildi!</h3>
          <p className="text-gray-600">
            Talebiniz <strong>{partnerName}</strong> firmasına iletildi.
            Partner size yanıt verdiğinde bildirim alacaksınız.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div>
            <h3 className="text-xl font-bold">{partnerName}</h3>
            <p className="text-sm opacity-90">Mesaj Gönder</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Templates */}
          {templates.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hazır Şablonlar
              </label>
              <div className="grid grid-cols-1 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setMessage(template.content)}
                    className="text-left p-3 border border-gray-200 rounded-lg hover:border-brand-orange hover:bg-orange-50 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900">{template.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{template.content.substring(0, 60)}...</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mesajınız *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Örn: Aracım yolda kaldı, Ankara Çankaya'da bulunuyorum. Fiyat bilgisi alabilir miyim?"
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length} / 500 karakter
            </p>
          </div>

          {/* Location Share */}
          <div className="mb-4">
            <button
              onClick={handleGetLocation}
              disabled={shareLocation || !!location}
              className="flex items-center gap-2 text-sm text-brand-orange hover:text-orange-600 font-medium disabled:opacity-50"
            >
              <MapPin size={16} />
              {location ? '✓ Konum Eklendi' : 'Konumumu Paylaş'}
            </button>
            {location && (
              <p className="text-xs text-gray-600 mt-2 pl-6">
                📍 {location.address}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-4">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Not:</strong> Gönderdiğiniz mesaj partnere ulaştırılacaktır. 
              Partner size yanıt verdiğinde bildirim alacaksınız. 
              Platform dışında iletişim kurmak hizmet garantisini geçersiz kılabilir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleSendMessage}
            disabled={sending || !message.trim()}
            className="flex-1 px-4 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send size={18} />
                Gönder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerMessageModal;
