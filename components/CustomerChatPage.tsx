import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Phone, MapPin, Clock, Lock } from 'lucide-react';
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

  useEffect(() => {
    // Realtime mesaj dinleme
    if (!conversationId) return;

    console.log('🔌 [Realtime] Subscribing to conversation:', conversationId);
    
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('📨 [Realtime] New message received:', payload);
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Mesaj zaten listede varsa ekleme
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        console.log('🔔 [Realtime] Subscription status:', status);
      });

    return () => {
      console.log('🚫 [Realtime] Unsubscribing from:', conversationId);
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

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

      // Manuel ekleme (Realtime fallback)
      setMessages((prev) => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
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
    <div className="fixed inset-0 bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* Header - Modern Design */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/musteri/mesajlar')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Partner Avatar */}
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-white">
                  {conversation?.partnerName?.charAt(0) || 'P'}
                </span>
              </div>
              {/* Online status */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            {/* Partner Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-slate-900 truncate text-lg">
                {conversation?.partnerName || 'Partner'}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                {conversation?.isUnlocked ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Aktif
                  </>
                ) : (
                  <>
                    <Lock size={12} />
                    Kilitli
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {conversation?.isUnlocked && conversation?.partnerPhone && (
              <a
                href={`tel:${conversation.partnerPhone}`}
                className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all active:scale-95 shadow-sm"
              >
                <Phone size={20} />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area - Beautiful Design */}
      <div className="flex-1 overflow-y-auto px-4 py-6" style={{ paddingBottom: '90px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 size={48} className="animate-spin text-orange-500 mb-4" />
            <p className="text-slate-500 text-sm">Mesajlar yükleniyor...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Clock size={40} className="text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Henüz Mesaj Yok</h3>
            <p className="text-slate-500 max-w-sm">
              Partner yanıt verdiğinde mesajlarınız burada görünecek
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {groupMessagesByDate().map((group) => (
              <div key={group.date}>
                {/* Date Separator - Modern */}
                <div className="flex items-center justify-center mb-6">
                  <div className="px-4 py-1.5 bg-white/80 backdrop-blur-sm text-xs font-medium text-slate-600 rounded-full shadow-sm border border-slate-200">
                    {group.displayDate}
                  </div>
                </div>

                {/* Messages - Modern Bubbles */}
                <div className="space-y-4">
                  {group.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.senderType === 'partner' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md mb-1">
                          {conversation?.partnerName?.charAt(0) || 'P'}
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[75%] px-4 py-3 rounded-2xl transition-all ${
                          msg.senderType === 'customer'
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm shadow-lg'
                            : 'bg-white text-slate-900 rounded-bl-sm shadow-md border border-slate-100'
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[11px] mt-1.5 ${
                          msg.senderType === 'customer' ? 'text-orange-100' : 'text-slate-400'
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

      {/* Message Input - Modern Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Mesajınızı yazın..."
                className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 focus:border-orange-400 focus:bg-white outline-none transition-all text-[15px] placeholder:text-slate-400"
                disabled={sending}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="p-3.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg disabled:shadow-none"
            >
              {sending ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <Send size={22} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerChatPage;
