import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Phone, MapPin, Clock } from 'lucide-react';
import { messagingApi } from '../services/messagingApi';
import { supabase } from '../services/supabaseApi';
import type { Conversation, Message } from '../types';
import CustomerBottomNav from './CustomerBottomNav';

const CustomerChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/giris/musteri');
      return;
    }
    setCustomerId(session.user.id);
    
    if (conversationId) {
      await loadConversation(conversationId);
      await loadMessages(conversationId);
    }
  };

  const loadConversation = async (convId: string) => {
    try {
      const conv = await messagingApi.getConversationById(convId);
      setConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      setLoading(true);
      const msgs = await messagingApi.getMessages(convId);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !customerId) return;

    try {
      setSending(true);
      const message = await messagingApi.sendMessage({
        conversationId,
        senderId: customerId,
        senderType: 'customer',
        content: newMessage.trim()
      });

      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long'
      });
    }
  };

  // Mesajları günlere göre grupla
  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(msg => {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    return Object.entries(groups).map(([dateKey, msgs]) => ({
      date: dateKey,
      displayDate: formatDate(msgs[0].createdAt),
      messages: msgs
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/musteri/mesajlar')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-orange-600">
                {conversation?.partnerName?.charAt(0) || 'P'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-slate-900 truncate">
                {conversation?.partnerName || 'Partner'}
              </h1>
              <p className="text-xs text-slate-500">
                {conversation?.isUnlocked ? '✅ Aktif Görüşme' : '🔒 Kilitli'}
              </p>
            </div>
          </div>

          {/* Partner'ı Ara */}
          {conversation?.isUnlocked && conversation?.partnerPhone && (
            <a
              href={`tel:${conversation.partnerPhone}`}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Phone size={20} />
            </a>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={40} className="animate-spin text-orange-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-600">Henüz mesaj yok</p>
            <p className="text-sm text-slate-500 mt-1">
              Partner yanıt verdiğinde mesajlar burada görünecek
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {groupMessagesByDate().map((group) => (
              <div key={group.date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center mb-4">
                  <span className="px-3 py-1 bg-white text-xs text-slate-500 rounded-full shadow-sm">
                    {group.displayDate}
                  </span>
                </div>

                {/* Messages */}
                <div className="space-y-3">
                  {group.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                          msg.senderType === 'customer'
                            ? 'bg-orange-500 text-white rounded-br-md'
                            : 'bg-white text-slate-900 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.senderType === 'customer' ? 'text-orange-200' : 'text-slate-400'
                        }`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed Bottom */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Mesajınızı yazın..."
            className="flex-1 px-4 py-3 bg-slate-100 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 outline-none"
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Navigation - Mobile */}
      <CustomerBottomNav />
    </div>
  );
};

export default CustomerChatPage;
