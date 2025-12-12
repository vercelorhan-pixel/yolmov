import React, { useState, useEffect } from 'react';
import { MessageSquare, Lock, Unlock, DollarSign, Users, TrendingUp, Search, Filter } from 'lucide-react';
import messagingApi from '../../../services/messagingApi';
import { Conversation } from '../../../types';

const AdminMessagesTab: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // Admin tüm konuşmaları görebilir
      // Not: messagingApi'de getAllConversations metodu yoksa eklemeliyiz
      // Şimdilik boş bırakıyoruz, gerçek implementasyon için API metodu gerekli
      console.log('📊 Admin: Mesajlaşma verilerini yükleniyor...');
      setConversations([]);
    } catch (error) {
      console.error('❌ Mesajlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'locked' && conv.isUnlocked) return false;
    if (filter === 'unlocked' && !conv.isUnlocked) return false;
    if (searchTerm) {
      // Search in customer/partner names
      const search = searchTerm.toLowerCase();
      return (
        conv.customerName?.toLowerCase().includes(search) ||
        conv.partnerName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    total: conversations.length,
    locked: conversations.filter((c) => !c.isUnlocked).length,
    unlocked: conversations.filter((c) => c.isUnlocked).length,
    revenue: conversations.filter((c) => c.isUnlocked).reduce((sum, c) => sum + (c.unlockPrice || 0), 0),
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Mesajlaşma Sistemi</h1>
        <p className="text-blue-100">
          Müşteri-Partner arası mesajlaşmayı yönetin, gelir analizlerini görüntüleyin
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{stats.total}</div>
          <div className="text-sm text-slate-600">Toplam Konuşma</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Lock className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{stats.locked}</div>
          <div className="text-sm text-slate-600">Kilitli Konuşma</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Unlock className="text-green-600" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{stats.unlocked}</div>
          <div className="text-sm text-slate-600">Açık Konuşma</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{stats.revenue} ₺</div>
          <div className="text-sm text-slate-600">Toplam Gelir (Kredi)</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Müşteri veya Partner ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-brand-orange text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'locked'
                  ? 'bg-brand-orange text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Kilitli
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unlocked'
                  ? 'bg-brand-orange text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Açık
            </button>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-slate-400" size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Henüz mesajlaşma yok</h3>
            <p className="text-slate-600">
              Müşteriler ve partnerler arasında mesajlaşma başladığında burada görünecek.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Partner</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Hizmet</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Kredi</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Tarih</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredConversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{conv.customerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{conv.partnerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{conv.serviceType || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {conv.isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <Unlock size={12} />
                          Açık
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          <Lock size={12} />
                          Kilitli
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{conv.unlockPrice || 0} ₺</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {conv.createdAt ? new Date(conv.createdAt).toLocaleDateString('tr-TR') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-brand-orange hover:text-orange-600 font-medium text-sm">
                        Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-2">📊 Mesajlaşma Sistemi Nasıl Çalışır?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Müşteriler partnerlerle mesaj başlatabilir (ücretsiz)</li>
          <li>• Partnerler konuşmayı görebilir ancak mesajları okumak için kredi harcamalıdır</li>
          <li>• Konuşma açıldığında partner mesajları okuyup yanıtlayabilir</li>
          <li>• Her açılan konuşma için platform gelir elde eder</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminMessagesTab;
