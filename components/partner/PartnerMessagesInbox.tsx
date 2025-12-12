import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Lock, Unlock, Clock, MapPin, RefreshCw,
  AlertCircle, CreditCard, Star, Filter
} from 'lucide-react';
import { Conversation, Partner } from '../../types';
import messagingApi from '../../services/messagingApi';
import { supabaseApi } from '../../services/supabaseApi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  (import.meta as any).env.VITE_SUPABASE_URL || '',
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY || ''
);

const PartnerMessagesInbox: React.FC = () => {
  const navigate = useNavigate();
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [filter, setFilter] = useState<'all' | 'locked' | 'unlocked'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Session kontrolü
      const session = await supabaseApi.auth.getSession();
      if (!session?.user) {
        navigate('/giris/partner');
        return;
      }

      // Partner bilgisini al
      const { data: partners, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
        
      if (partnerError || !partners) {
        navigate('/giris/partner');
        return;
      }
      setPartner(partners as Partner);

      // Konuşmaları yükle
      const convs = await messagingApi.getPartnerConversations(partners.id);
      setConversations(convs);

      // Kredi bakiyesini getir
      const balance = await messagingApi.getPartnerCreditBalance(partners.id);
      setCreditBalance(balance);

    } catch (error) {
      console.error('❌ Veri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleConversationClick = (conversation: Conversation) => {
    if (conversation.isUnlocked) {
      // Açık konuşma - direkt chat'e git
      navigate(`/partner/mesajlar/${conversation.id}`);
    } else {
      // Kilitli - kilidi açma ekranına git
      navigate(`/partner/mesajlar/${conversation.id}?unlock=true`);
    }
  };

  const getFilteredConversations = () => {
    switch (filter) {
      case 'locked':
        return conversations.filter(c => !c.isUnlocked);
      case 'unlocked':
        return conversations.filter(c => c.isUnlocked);
      default:
        return conversations;
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return 'Az önce';
    if (hours < 24) return `${Math.floor(hours)} saat önce`;
    if (hours < 48) return 'Dün';
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const filteredConversations = getFilteredConversations();
  const lockedCount = conversations.filter(c => !c.isUnlocked).length;
  const unlockedCount = conversations.filter(c => c.isUnlocked).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="text-brand-orange" />
                Mesajlar
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {conversations.length} konuşma • {lockedCount} kilitli
              </p>
            </div>
            
            {/* Kredi Kartı */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              
              <button
                onClick={() => navigate('/partner/krediler')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
              >
                <CreditCard size={18} />
                <div className="text-left">
                  <div className="text-xs opacity-90">Bakiye</div>
                  <div className="text-sm font-bold">{creditBalance} Kredi</div>
                </div>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-brand-orange text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tümü ({conversations.length})
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'locked'
                  ? 'bg-brand-orange text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Lock size={14} />
              Kilitli ({lockedCount})
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                filter === 'unlocked'
                  ? 'bg-brand-orange text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Unlock size={14} />
              Açık ({unlockedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredConversations.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              {filter === 'all' ? 'Henüz Mesaj Yok' : `${filter === 'locked' ? 'Kilitli' : 'Açık'} Mesaj Yok`}
            </h3>
            <p className="text-gray-500 text-sm">
              Müşterilerden mesaj geldiğinde burada görüntüleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation)}
                className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                  conversation.isUnlocked
                    ? 'border-gray-100 hover:border-gray-200'
                    : 'border-orange-200 bg-orange-50/30 hover:border-orange-300'
                } ${conversation.partnerUnreadCount > 0 ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Kilit İkonu */}
                  <div className={`p-3 rounded-full ${
                    conversation.isUnlocked
                      ? 'bg-green-100 text-green-600'
                      : 'bg-orange-100 text-brand-orange'
                  }`}>
                    {conversation.isUnlocked ? <Unlock size={24} /> : <Lock size={24} />}
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          {conversation.isUnlocked ? (
                            conversation.customerName || 'Müşteri'
                          ) : (
                            <span className="blur-sm">Müşteri Adı</span>
                          )}
                          {conversation.serviceType && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {conversation.serviceType}
                            </span>
                          )}
                        </h3>
                        
                        {conversation.customerLocation && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin size={14} />
                            {conversation.customerLocation}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        {!conversation.isUnlocked && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                            <Lock size={12} />
                            {conversation.unlockPrice} Kredi
                          </span>
                        )}
                        {conversation.partnerUnreadCount > 0 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full mt-2">
                            {conversation.partnerUnreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Son Mesaj (Kilitliyse bulanık) */}
                    <div className={`text-sm text-gray-600 mb-2 ${!conversation.isUnlocked ? 'blur-sm select-none' : ''}`}>
                      {conversation.lastMessage?.content.substring(0, 100) || 'Mesaj içeriği...'}
                      {(conversation.lastMessage?.content.length || 0) > 100 && '...'}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(conversation.lastMessageAt)}
                      </span>
                      
                      {conversation.isUnlocked ? (
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <Unlock size={12} />
                          Açık
                        </span>
                      ) : (
                        <span className="text-orange-600 font-medium flex items-center gap-1">
                          <Lock size={12} />
                          Mesajı görmek için kilidi açın
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner - Yetersiz Kredi Uyarısı */}
      {lockedCount > 0 && creditBalance < 50 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto">
          <div className="bg-orange-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-3">
            <AlertCircle size={24} />
            <div className="flex-1">
              <p className="font-bold">Yetersiz Kredi</p>
              <p className="text-sm opacity-90">
                Kilitli mesajları açmak için kredi yüklemeniz gerekiyor.
              </p>
            </div>
            <button
              onClick={() => navigate('/partner/krediler')}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Kredi Yükle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerMessagesInbox;
