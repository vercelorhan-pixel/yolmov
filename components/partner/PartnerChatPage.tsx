import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Send, Lock, Unlock, CreditCard, AlertTriangle,
  MapPin, Clock, Phone, Image as ImageIcon, Loader2
} from 'lucide-react';
import { Conversation, Message, Partner } from '../../types';
import messagingApi from '../../services/messagingApi';
import { supabaseApi, supabase } from '../../services/supabaseApi';

const PartnerChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchParams] = useSearchParams();
  const shouldShowUnlock = searchParams.get('unlock') === 'true';

  const [partner, setPartner] = useState<Partner | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  
  // Unlock modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [conversationId]);

  useEffect(() => {
    if (shouldShowUnlock && conversation && !conversation.isUnlocked) {
      setShowUnlockModal(true);
    }
  }, [shouldShowUnlock, conversation]);

  useEffect(() => {
    // Real-time mesaj dinleme
    if (conversationId) {
      const subscription = messagingApi.subscribeToMessages(
        conversationId,
        (newMessage) => {
          setMessages((prev) => [...prev, newMessage]);
          scrollToBottom();
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadData = async () => {
    try {
      setLoading(true);

      // LocalStorage'dan partner bilgisini kontrol et
      const partnerStr = localStorage.getItem('yolmov_partner');
      if (!partnerStr) {
        console.error('❌ Partner oturumu bulunamadı');
        navigate('/giris/partner');
        return;
      }

      const partnerData = JSON.parse(partnerStr);
      if (!partnerData?.id) {
        console.error('❌ Partner ID bulunamadı');
        navigate('/giris/partner');
        return;
      }
      
      setPartner(partnerData as Partner);

      // Konuşma bilgisini al
      const conv = await messagingApi.getConversationById(conversationId!);
      setConversation(conv);

      // Eğer açık ise mesajları yükle
      if (conv.isUnlocked) {
        const msgs = await messagingApi.getMessages(conversationId!);
        setMessages(msgs);

        // Okunmamış mesajları okundu yap
        await messagingApi.markConversationAsRead(conversationId!, partnerData.id);
      }

      // Kredi bakiyesini getir
      const balance = await messagingApi.getPartnerCreditBalance(partnerData.id);
      setCreditBalance(balance);

    } catch (error) {
      console.error('❌ Veri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!partner || !conversation) return;

    try {
      setUnlocking(true);

      if (!partner?.id) {
        console.error('❌ Partner ID bulunamadı');
        return;
      }
      
      const result = await messagingApi.unlockConversation(
        conversation.id,
        partner.id,
        partner.id
      );

      if (result.success) {
        // Başarılı - sayfayı yenile
        await loadData();
        setShowUnlockModal(false);
      } else {
        alert(result.message);
        if (result.message.includes('Yetersiz kredi')) {
          navigate('/partner/krediler');
        }
      }
    } catch (error: any) {
      console.error('❌ Unlock error:', error);
      alert('Bir hata oluştu: ' + error.message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !partner || !conversation) return;
    if (!conversation.isUnlocked) {
      alert('Önce konuşmayı açmalısınız!');
      return;
    }

    try {
      setSending(true);

      // Partner ID kontrolü
      if (!partner?.id) {
        console.error('❌ Partner ID bulunamadı');
        return;
      }

      await messagingApi.sendMessage({
        conversationId: conversation.id,
        senderId: partner.id,
        senderType: 'partner',
        content: messageInput,
      });

      setMessageInput('');
    } catch (error) {
      console.error('❌ Mesaj gönderilemedi:', error);
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Konuşma bulunamadı.</p>
          <button
            onClick={() => navigate('/partner/mesajlar')}
            className="mt-4 px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/partner/mesajlar')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              {conversation.isUnlocked ? (
                <>
                  {conversation.customerName || 'Müşteri'}
                  <Unlock size={16} className="text-green-600" />
                </>
              ) : (
                <>
                  <span className="blur-sm">Müşteri Adı</span>
                  <Lock size={16} className="text-orange-600" />
                </>
              )}
            </h2>
            {conversation.customerLocation && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin size={12} />
                {conversation.customerLocation}
              </p>
            )}
          </div>

          {conversation.isUnlocked && conversation.customerPhone && (
            <button
              onClick={() => window.open(`tel:${conversation.customerPhone}`, '_self')}
              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Phone size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {!conversation.isUnlocked ? (
            /* Kilitli Durum - Placeholder */
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Lock size={64} className="text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Bu Konuşma Kilitli
                </h3>
                <p className="text-gray-600 mb-4">
                  Müşterinin mesajını görmek ve yanıt verebilmek için kilidi açmalısınız.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Maliyet:</strong> {conversation.unlockPrice} Kredi
                    <br />
                    <strong>Mevcut Bakiye:</strong> {creditBalance} Kredi
                  </p>
                </div>
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="px-6 py-3 bg-brand-orange text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
                >
                  Kilidi Aç
                </button>
              </div>
            </div>
          ) : (
            /* Açık Durum - Chat */
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderType === 'partner';
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-brand-orange text-white rounded-br-none'
                          : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className="text-xs text-gray-500 mb-1 font-medium">
                          {conversation.customerName || 'Müşteri'}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-orange-100' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      {conversation.isUnlocked && (
        <div className="bg-white border-t shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Mesajınızı yazın..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !messageInput.trim()}
                className="p-3 bg-brand-orange text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-brand-orange" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Konuşmayı Aç
              </h3>
              <p className="text-gray-600 text-sm">
                Bu konuşmayı açtıktan sonra müşteri ile sınırsız mesajlaşabilirsiniz.
              </p>
            </div>

            {/* İstatistikler */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Maliyet</span>
                <span className="font-bold text-gray-900">{conversation.unlockPrice} Kredi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mevcut Bakiye</span>
                <span className={`font-bold ${creditBalance >= conversation.unlockPrice ? 'text-green-600' : 'text-red-600'}`}>
                  {creditBalance} Kredi
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-gray-600">Kalan Bakiye</span>
                <span className="font-bold text-gray-900">
                  {creditBalance - conversation.unlockPrice} Kredi
                </span>
              </div>
            </div>

            {creditBalance < conversation.unlockPrice ? (
              /* Yetersiz Kredi */
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">
                    Yetersiz kredi. Lütfen kredi yükleyip tekrar deneyin.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => navigate('/partner/krediler')}
                    className="flex-1 px-4 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard size={18} />
                    Kredi Yükle
                  </button>
                </div>
              </div>
            ) : (
              /* Yeterli Kredi */
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnlockModal(false)}
                  disabled={unlocking}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="flex-1 px-4 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {unlocking ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Açılıyor...
                    </>
                  ) : (
                    <>
                      <Unlock size={18} />
                      Kilidi Aç
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerChatPage;
