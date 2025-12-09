/**
 * Admin Credits Management Tab
 * Müşterilere ulaşmak için satın alınan iletişim kredisi yönetimi
 * Gerçek Supabase verileri ile çalışır
 */

import React, { useState, useEffect } from 'react';
import { Search, Wallet, Plus, Minus, Phone, ShoppingCart, Calendar, Filter, RefreshCcw, AlertCircle, Building } from 'lucide-react';
import { useAdminFilter } from '../hooks/useAdminFilter';
import EmptyState from '../ui/EmptyState';
import { supabaseApi } from '../../../services/supabaseApi';
import type { PartnerCredit, CreditTransaction, Partner } from '../../../types';

interface CreditAccount {
  partnerId: string;
  partnerName: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  lastTransaction?: string;
}

interface LocalTransaction {
  id: string;
  partnerId: string;
  partnerName: string;
  type: 'purchase' | 'usage' | 'adjustment' | 'refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  date: string;
  requestId?: string;
  adminUser?: string;
}

const AdminCreditsTab: React.FC = () => {
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'purchase' | 'usage' | 'adjustment' | 'refund'>('all');

  const { filtered, searchTerm, setSearchTerm } = useAdminFilter<LocalTransaction>(
    transactions,
    { searchKeys: ['partnerName', 'description', 'requestId'] }
  );

  // Load data from Supabase
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [creditsData, transactionsData, partnersData] = await Promise.all([
        supabaseApi.partnerCredits.getAll(),
        supabaseApi.partnerCredits.getAllTransactions(),
        supabaseApi.partners.getAll()
      ]);

      // Create partner name map
      const partnerMap = new Map<string, string>();
      partnersData.forEach(p => partnerMap.set(p.id, p.name || p.company_name || 'Bilinmeyen'));

      // Map credits to accounts
      const mappedAccounts: CreditAccount[] = creditsData.map((c: any) => ({
        partnerId: c.partnerId,
        partnerName: c.partnerName || partnerMap.get(c.partnerId) || 'Bilinmeyen Partner',
        balance: c.balance || 0,
        totalPurchased: c.totalPurchased || 0,
        totalUsed: c.totalUsed || 0,
        lastTransaction: c.lastUpdated
      }));

      // Map transactions
      const mappedTransactions: LocalTransaction[] = transactionsData.map((t: any) => ({
        id: t.id,
        partnerId: t.partnerId,
        partnerName: t.partnerName || partnerMap.get(t.partnerId) || 'Bilinmeyen Partner',
        type: t.type as 'purchase' | 'usage' | 'adjustment' | 'refund',
        amount: t.amount,
        balanceBefore: t.balanceBefore || 0,
        balanceAfter: t.balanceAfter || 0,
        description: t.description || '',
        date: t.createdAt || new Date().toISOString(),
        requestId: t.requestId,
        adminUser: t.adminUser
      }));

      setAccounts(mappedAccounts);
      setTransactions(mappedTransactions);
      setPartners(partnersData);
    } catch (err) {
      console.error('Credits data load error:', err);
      setError('Kredi verileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredByType = typeFilter === 'all' 
    ? filtered 
    : filtered.filter(t => t.type === typeFilter);

  // Admin tarafından eklenen kredileri tespit et
  // Tip 'adjustment' olan VEYA açıklamada "admin" geçen pozitif işlemler
  const isAdminAdded = (t: LocalTransaction) => {
    const descLower = (t.description || '').toLowerCase();
    return t.amount > 0 && (
      t.type === 'adjustment' || 
      descLower.includes('admin') ||
      descLower.includes('manuel')
    );
  };

  // Admin tarafından eklenen krediler toplamı
  const adminAddedCredits = transactions
    .filter(isAdminAdded)
    .reduce((sum, t) => sum + t.amount, 0);

  // Satın alınan krediler (purchase tipindekiler - admin eklenenler hariç)
  const purchasedCredits = transactions
    .filter(t => t.type === 'purchase' && !isAdminAdded(t))
    .reduce((sum, t) => sum + t.amount, 0);

  const stats = {
    totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
    totalPurchased: purchasedCredits,
    adminAdded: adminAddedCredits,
    totalUsed: accounts.reduce((sum, a) => sum + a.totalUsed, 0),
    activePartners: accounts.filter(a => a.balance > 0).length,
  };

  const handleAddAdjustment = async () => {
    if (!selectedAccount || !adjustmentAmount || !adjustmentReason) return;

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount === 0) {
      alert('Geçerli bir miktar girin');
      return;
    }

    try {
      // API çağrısı - veritabanına kaydet
      const result = await supabaseApi.partnerCredits.adjustCredits(
        selectedAccount.partnerId,
        selectedAccount.partnerName,
        amount,
        adjustmentReason,
        'Admin User'
      );

      // Local state güncelle
      const newTransaction: LocalTransaction = {
        id: result.transaction.id,
        partnerId: result.transaction.partnerId,
        partnerName: result.transaction.partnerName,
        type: 'adjustment',
        amount: result.transaction.amount,
        balanceBefore: result.transaction.balanceBefore,
        balanceAfter: result.transaction.balanceAfter,
        description: result.transaction.description,
        date: result.transaction.date || new Date().toISOString(),
        adminUser: result.transaction.adminUser,
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      // Update account balance locally
      setAccounts(prev => prev.map(acc => 
        acc.partnerId === selectedAccount.partnerId 
          ? { ...acc, balance: result.newBalance }
          : acc
      ));

      setShowAdjustmentModal(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setSelectedAccount(null);
    } catch (err) {
      console.error('Kredi düzeltme hatası:', err);
      alert('Kredi düzeltme işlemi başarısız: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
    }
  };

  const getTransactionColor = (type: LocalTransaction['type']) => {
    switch (type) {
      case 'purchase': return 'text-green-600 bg-green-50';
      case 'usage': return 'text-blue-600 bg-blue-50';
      case 'adjustment': return 'text-purple-600 bg-purple-50';
      case 'refund': return 'text-red-600 bg-red-50';
    }
  };

  const getTransactionLabel = (type: LocalTransaction['type']) => {
    switch (type) {
      case 'purchase': return 'Satın Alım';
      case 'usage': return 'Kullanım';
      case 'adjustment': return 'Düzeltme';
      case 'refund': return 'İade';
    }
  };

  const getTransactionIcon = (type: LocalTransaction['type']) => {
    switch (type) {
      case 'purchase': return <ShoppingCart size={16} />;
      case 'usage': return <Phone size={16} />;
      case 'adjustment': return <Filter size={16} />;
      case 'refund': return <Minus size={16} />;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadData}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Wallet size={20} />
            <span className="text-xs font-bold">Toplam Bakiye</span>
          </div>
          <p className="text-2xl font-black">{stats.totalBalance.toLocaleString('tr-TR')} Kredi</p>
          <p className="text-xs opacity-80">{stats.activePartners} aktif partner</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart size={20} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-600">Satın Alınan</span>
          </div>
          <p className="text-2xl font-black text-blue-700">{stats.totalPurchased.toLocaleString('tr-TR')} Kredi</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Phone size={20} className="text-purple-600" />
            <span className="text-xs font-bold text-purple-600">Kullanılan</span>
          </div>
          <p className="text-2xl font-black text-purple-700">{stats.totalUsed.toLocaleString('tr-TR')} Kredi</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar size={20} className="text-orange-600" />
            <span className="text-xs font-bold text-orange-600">Kullanılabilir</span>
          </div>
          <p className="text-2xl font-black text-orange-700">{stats.totalBalance.toLocaleString('tr-TR')} Kredi</p>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Plus size={20} className="text-slate-600" />
            <span className="text-xs font-bold text-slate-600">Admin Eklenen</span>
          </div>
          <p className="text-2xl font-black text-slate-700">
            {stats.adminAdded.toLocaleString('tr-TR')} Kredi
          </p>
        </div>
      </div>

      {/* Partner Accounts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">Partner Hesapları</h3>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
          >
            <RefreshCcw size={14} />
            Yenile
          </button>
        </div>
        
        {accounts.length === 0 ? (
          <EmptyState title="Hesap Bulunamadı" description="Henüz kredi hesabı olan partner bulunmuyor." />
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.partnerId} className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{account.partnerName}</p>
                      <p className="text-xs text-slate-500">{account.partnerId.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-600">{account.balance.toLocaleString('tr-TR')} Kredi</p>
                    <p className="text-xs text-slate-500">Mevcut Bakiye</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500">Toplam Satın Alınan</p>
                    <p className="font-bold text-blue-600">{account.totalPurchased.toLocaleString('tr-TR')} Kredi</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Toplam Kullanılan</p>
                    <p className="font-bold text-purple-600">{account.totalUsed.toLocaleString('tr-TR')} Kredi</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Kalan</p>
                    <p className="font-bold text-orange-600">{account.balance.toLocaleString('tr-TR')} Kredi</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Son İşlem: {formatDate(account.lastTransaction)}</p>
                  <button
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowAdjustmentModal(true);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Düzeltme
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Partner, açıklama veya talep ID ara..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${typeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            Tümü
          </button>
          <button
            onClick={() => setTypeFilter('purchase')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${typeFilter === 'purchase' ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            Satın Alım
          </button>
          <button
            onClick={() => setTypeFilter('usage')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${typeFilter === 'usage' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            Kullanım
          </button>
          <button
            onClick={() => setTypeFilter('adjustment')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${typeFilter === 'adjustment' ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            Düzeltme
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredByType.length === 0 ? (
          <EmptyState 
            title="İşlem Bulunamadı" 
            description={transactions.length === 0 
              ? "Henüz kredi işlemi bulunmuyor." 
              : "Arama kriterinize uygun işlem yok."
            } 
          />
        ) : (
          filteredByType.map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900">{transaction.partnerName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getTransactionColor(transaction.type)}`}>
                        {getTransactionLabel(transaction.type)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{transaction.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span>{formatDate(transaction.date)}</span>
                      <span>•</span>
                      <span>{transaction.id}</span>
                      {transaction.requestId && (
                        <>
                          <span>•</span>
                          <span>{transaction.requestId}</span>
                        </>
                      )}
                      {transaction.adminUser && (
                        <>
                          <span>•</span>
                          <span>Admin: {transaction.adminUser}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-black ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString('tr-TR')} Kredi
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Önceki: {transaction.balanceBefore.toLocaleString('tr-TR')} → Sonraki: {transaction.balanceAfter.toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        {filteredByType.length === transactions.length
          ? `Toplam ${transactions.length} işlem`
          : `${filteredByType.length} / ${transactions.length} işlem gösteriliyor`
        }
      </div>

      {/* Adjustment Modal */}
      {showAdjustmentModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdjustmentModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Kredi Düzeltme</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Partner</p>
                <p className="font-bold text-slate-900">{selectedAccount.partnerName}</p>
                <p className="text-xs text-slate-500">{selectedAccount.partnerId}</p>
              </div>
              <div className="bg-green-50 rounded-xl border-2 border-green-200 p-4">
                <p className="text-xs text-green-600 mb-1">Mevcut Kredi Bakiyesi</p>
                <p className="text-2xl font-black text-green-700">{selectedAccount.balance.toLocaleString('tr-TR')} Kredi</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Kredi Miktarı (+ veya -)</label>
                <input
                  type="number"
                  placeholder="Örn: +50 veya -10"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sebep</label>
                <textarea
                  placeholder="Düzeltme sebebini yazın..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdjustmentModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddAdjustment}
                  disabled={!adjustmentAmount || !adjustmentReason}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreditsTab;
