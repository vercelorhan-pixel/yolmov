/**
 * Admin Financial Management Tab
 * Ödeme takibi, komisyon analizi, partner kazanç yönetimi
 * Gerçek Supabase verileriyle çalışır
 */

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Eye, Download, CheckCircle, XCircle, AlertCircle, RefreshCcw, Building } from 'lucide-react';
import { useAdminFilter } from '../hooks/useAdminFilter';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import { supabaseApi } from '../../../services/supabaseApi';
import type { CompletedJob, Partner } from '../../../types';

interface Payment {
  id: string;
  partnerId: string;
  partnerName: string;
  jobId: string;
  service: string;
  amount: number;
  commission: number;
  partnerEarning: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: 'kredi_karti' | 'nakit' | 'havale';
  date: string;
  customer: string;
  transactionId?: string;
}

// Map CompletedJob to Payment interface
const mapJobToPayment = (job: CompletedJob): Payment => {
  // Determine status from job data - CompletedJob status is 'completed' | 'cancelled' | 'refunded'
  let status: Payment['status'] = 'completed';
  if (job.status === 'cancelled') {
    status = 'failed';
  } else if (job.status === 'refunded') {
    status = 'refunded';
  }

  // Map payment method
  let paymentMethod: Payment['paymentMethod'] = 'kredi_karti';
  if (job.paymentMethod === 'nakit') {
    paymentMethod = 'nakit';
  } else if (job.paymentMethod === 'havale') {
    paymentMethod = 'havale';
  }

  return {
    id: `PAY-${job.id?.slice(-8)}`,
    partnerId: job.partnerId || '',
    partnerName: job.partnerName || 'Bilinmeyen Partner',
    jobId: job.requestId || job.id || '',
    service: job.serviceType || 'Çekici Hizmeti',
    amount: job.totalAmount || 0,
    commission: job.commission || 0,
    partnerEarning: job.partnerEarning || 0,
    status,
    paymentMethod,
    date: job.completionTime || new Date().toISOString(),
    customer: job.customerName || 'Müşteri',
    transactionId: job.id ? `TRX-${job.id.slice(-8)}` : undefined
  };
};

const AdminFinancialTab: React.FC = () => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');

  const { filtered, searchTerm, setSearchTerm } = useAdminFilter<Payment>(
    payments,
    { searchKeys: ['partnerName', 'customer', 'service', 'jobId'] }
  );

  // Load data from Supabase
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsData, partnersData] = await Promise.all([
        supabaseApi.completedJobs.getAll(),
        supabaseApi.partners.getAll()
      ]);

      // Create partner name map
      const partnerMap = new Map<string, string>();
      partnersData.forEach(p => partnerMap.set(p.id, p.name || p.company_name || 'Bilinmeyen'));

      // Map jobs to payments with partner names
      const mappedPayments: Payment[] = jobsData.map(job => {
        const payment = mapJobToPayment(job);
        // Update partner name from map if available
        if (partnerMap.has(payment.partnerId)) {
          payment.partnerName = partnerMap.get(payment.partnerId) || payment.partnerName;
        }
        return payment;
      });

      setPayments(mappedPayments);
      setPartners(partnersData);
    } catch (err) {
      console.error('Financial data load error:', err);
      setError('Finansal veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Apply filters
  const filteredPayments = filtered.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (selectedPartner !== 'all' && p.partnerId !== selectedPartner) return false;
    return true;
  });

  // Calculate stats - Komisyon almıyoruz, toplam tutar = partner kazancı
  const stats = {
    totalRevenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    refundedAmount: payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0),
    failedAmount: payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0),
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
    refunded: payments.filter(p => p.status === 'refunded').length,
  };

  const getPaymentMethodLabel = (method: Payment['paymentMethod']) => {
    switch (method) {
      case 'kredi_karti': return 'Kredi Kartı';
      case 'nakit': return 'Nakit';
      case 'havale': return 'Havale';
      default: return method;
    }
  };

  const formatDate = (dateStr: string) => {
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

  const exportToCSV = () => {
    const headers = ['ID', 'Partner', 'Müşteri', 'Hizmet', 'Tutar', 'Ödeme Yöntemi', 'Durum', 'Tarih'];
    const rows = filteredPayments.map(p => [
      p.id,
      p.partnerName,
      p.customer,
      p.service,
      `${p.amount}₺`,
      getPaymentMethodLabel(p.paymentMethod),
      p.status,
      formatDate(p.date),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    // UTF-8 BOM ekleyerek Türkçe karakterlerin Excel'de doğru görünmesini sağla
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yolmov-finansal-rapor-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} />
            <span className="text-xs font-bold">Toplam Gelir</span>
          </div>
          <p className="text-2xl font-black">{stats.totalRevenue.toLocaleString('tr-TR')}₺</p>
          <p className="text-xs opacity-80">{stats.completed} tamamlanan iş</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={20} />
            <span className="text-xs font-bold">Tamamlanan</span>
          </div>
          <p className="text-2xl font-black">{stats.completed}</p>
          <p className="text-xs opacity-80">işlem</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle size={20} className="text-orange-600" />
            <span className="text-xs font-bold text-orange-600">Bekleyen</span>
          </div>
          <p className="text-2xl font-black text-orange-700">{stats.pendingAmount.toLocaleString('tr-TR')}₺</p>
          <p className="text-xs text-orange-600">{stats.pending} işlem</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle size={20} className="text-red-600" />
            <span className="text-xs font-bold text-red-600">Başarısız/İade</span>
          </div>
          <p className="text-2xl font-black text-red-700">{(stats.failedAmount + stats.refundedAmount).toLocaleString('tr-TR')}₺</p>
          <p className="text-xs text-red-600">{stats.failed + stats.refunded} işlem</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Partner, müşteri, hizmet veya iş ID ara..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Partner Filter */}
        <div className="w-full lg:w-56">
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="all">Tüm Partnerler</option>
              {partners.map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.name || partner.company_name || 'Bilinmeyen'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            Tümü ({payments.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${statusFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            Tamamlanan ({stats.completed})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${statusFilter === 'pending' ? 'bg-orange-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            Bekleyen ({stats.pending})
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 flex items-center gap-2"
          >
            <RefreshCcw size={16} />
            Yenile
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={16} />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Ödeme ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Partner</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Müşteri</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Hizmet</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Tutar</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Ödeme Yöntemi</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Durum</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12">
                    <EmptyState 
                      title="Ödeme Bulunamadı" 
                      description={payments.length === 0 
                        ? "Henüz tamamlanmış iş kaydı bulunmuyor." 
                        : "Arama kriterinize uygun ödeme kaydı yok."
                      } 
                    />
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{payment.id}</p>
                      <p className="text-xs text-slate-500">{payment.jobId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{payment.partnerName}</p>
                      <p className="text-xs text-slate-500">{payment.partnerId.slice(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">{payment.customer}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">{payment.service}</p>
                      <p className="text-xs text-slate-500">{formatDate(payment.date)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-green-600">{payment.amount.toLocaleString('tr-TR')}₺</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{getPaymentMethodLabel(payment.paymentMethod)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge type="payment" status={payment.status} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <Eye size={18} className="text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        {filteredPayments.length === payments.length
          ? `Toplam ${payments.length} ödeme kaydı`
          : `${filteredPayments.length} / ${payments.length} ödeme kaydı gösteriliyor`
        }
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayment(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Ödeme Detayları</h2>
              <button onClick={() => setSelectedPayment(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <XCircle size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Ödeme ID</p>
                  <p className="font-bold text-slate-900">{selectedPayment.id}</p>
                  {selectedPayment.transactionId && (
                    <p className="text-xs text-slate-500 mt-1">TRX: {selectedPayment.transactionId}</p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">İş ID</p>
                  <p className="font-bold text-slate-900">{selectedPayment.jobId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Partner</p>
                  <p className="font-bold text-slate-900">{selectedPayment.partnerName}</p>
                  <p className="text-xs text-slate-500">{selectedPayment.partnerId}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Müşteri</p>
                  <p className="font-bold text-slate-900">{selectedPayment.customer}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Hizmet & Tarih</p>
                <p className="font-bold text-slate-900">{selectedPayment.service}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDate(selectedPayment.date)}</p>
              </div>

              <div className="bg-green-50 rounded-xl border-2 border-green-200 p-4">
                <p className="text-xs text-green-600 mb-1">Tutar</p>
                <p className="text-2xl font-bold text-green-700">{selectedPayment.amount.toLocaleString('tr-TR')}₺</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-2">Ödeme Yöntemi</p>
                  <p className="font-bold text-slate-900">{getPaymentMethodLabel(selectedPayment.paymentMethod)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-2">Durum</p>
                  <StatusBadge type="payment" status={selectedPayment.status} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinancialTab;
