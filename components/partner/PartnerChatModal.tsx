import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Lock, Unlock, Loader2, AlertCircle } from 'lucide-react';
import { Conversation, Message } from '../../types';
import messagingApi from '../../services/messagingApi';

interface PartnerChatModalProps {
  conversation: Conversation;
  partnerId: string;
  partnerCredit: number;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

const PartnerChatModal: React.FC<PartnerChatModalProps> = ({
  conversation,
  partnerId,
  partnerCredit,
  onClose,
  onUnlockSuccess
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(conversation.isUnlocked);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isUnlocked) {
      loadMessages();
    }
  }, [isUnlocked]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const msgs = await messagingApi.getMessages(conversation.id);
      setMessages(msgs);
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (partnerCredit < conversation.unlockPrice) {
      alert('Yetersiz kredi! Lütfen kredi yükleyin.');
      return;
    }

    if (!confirm(`Bu konuşmayı ${conversation.unlockPrice} kredi karşılığında açmak istiyor musunuz?`)) {
      return;
    }

    try {
      setUnlocking(true);
      const result = await messagingApi.unlockConversation(
        conversation.id,
        partnerId,
        partnerId
      );

      if (result.success) {
        setIsUnlocked(true);
        onUnlockSuccess(); // Conversation state ve kredi güncelle
        // Alert gösterme, hemen mesajları yükle
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      console.error('❌ Unlock error:', error);
      alert('Konuşma açılırken hata oluştu.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isUnlocked) return;

    try {
      const message = await messagingApi.sendMessage({
        conversationId: conversation.id,
        senderId: partnerId,
        senderType: 'partner',
        content: newMessage.trim()
      });

      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      alert('Mesaj gönderilemedi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-lg text-gray-900">
              {isUnlocked ? conversation.customerName : '🔒 Gizli Müşteri'}
            </h3>
            <p className="text-sm text-gray-500">
              {conversation.serviceType && `${conversation.serviceType} • `}
              {conversation.customerLocation}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!isUnlocked ? (
            /* Unlock Screen */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Lock size={40} className="text-brand-orange" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Konuşma Kilitli
              </h4>
              <p className="text-gray-600 mb-6 max-w-md">
                Bu konuşmayı açmak için <strong>{conversation.unlockPrice} kredi</strong> harcamanız gerekiyor.
                Açtıktan sonra müşteri bilgilerini görebilir ve mesajlaşabilirsiniz.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 max-w-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mevcut Krediniz:</span>
                  <span className="text-lg font-bold text-gray-900">{partnerCredit} Kredi</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">Açılma Ücreti:</span>
                  <span className="text-lg font-bold text-orange-600">-{conversation.unlockPrice} Kredi</span>
                </div>
                <div className="border-t border-blue-300 mt-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Kalan Bakiye:</span>
                    <span className="text-lg font-bold text-green-600">
                      {partnerCredit - conversation.unlockPrice} Kredi
                    </span>
                  </div>
                </div>
              </div>

              {partnerCredit < conversation.unlockPrice ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 max-w-md">
                  <AlertCircle size={20} className="text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-700">
                    Yetersiz kredi! Lütfen kredi yükleyin.
                  </p>
                </div>
              ) : null}

              <button
                onClick={handleUnlock}
                disabled={unlocking || partnerCredit < conversation.unlockPrice}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {unlocking ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Açılıyor...
                  </>
                ) : (
                  <>
                    <Unlock size={20} />
                    Konuşmayı Aç ({conversation.unlockPrice} Kredi)
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Messages Screen */
            <>
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={32} className="animate-spin text-orange-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Henüz mesaj yok. İlk mesajı siz gönderin!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'partner' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.senderType === 'partner'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.senderType === 'partner' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerChatModal;
