import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Loader2, Search } from 'lucide-react';
import { messagingApi } from '../services/messagingApi';
import type { Conversation } from '../types';
import { supabase } from '../services/supabaseApi';

const CustomerMessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      navigate('/giris/musteri');
      return;
    }
    setSession(currentSession);
    loadConversations(currentSession.user.id);
  };

  const loadConversations = async (customerId: string) => {
    try {
      setLoading(true);
      const result = await messagingApi.getCustomerConversations(customerId);
      if (Array.isArray(result)) {
        setConversations(result);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const partnerName = conv.partnerName?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return partnerName.includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/musteri/profil')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Mesajlarım</h1>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Partner ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-orange-500" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <MessageSquare size={64} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {searchQuery ? 'Sonuç bulunamadı' : 'Henüz mesajınız yok'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Arama kriterlerinize uygun mesaj bulunamadı.'
                : 'Bir partner ile iletişime geçtiğinizde mesajlarınız burada görünecek.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/liste')}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
              >
                Partner Bul
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full bg-white rounded-xl p-4 hover:shadow-md transition-all text-left border border-slate-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-slate-600">
                      {conv.partnerName?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900 truncate">{conv.partnerName || 'Partner'}</h3>
                      <span className="text-xs text-slate-500">
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 truncate">
                      {conv.serviceType === 'cekici' && '🚛 Çekici Hizmeti'}
                      {conv.serviceType === 'aku' && '🔋 Akü Servisi'}
                      {conv.serviceType === 'lastik' && '🛞 Lastik Hizmeti'}
                      {conv.serviceType === 'yakit' && '⛽ Yakıt Hizmeti'}
                      {conv.serviceType === 'yardim' && '🆘 Yol Yardım'}
                      {!conv.serviceType && '💬 Genel Mesaj'}
                    </p>
                    {conv.customerUnreadCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                        {conv.customerUnreadCount} yeni
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerMessagesPage;
