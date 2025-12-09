/**
 * Partner Payments & Commission Component
 * Partnerin ödemeleri, komisyon detayları ve kazanç takibi
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, Eye, CreditCard, Wallet, ArrowUpRight, ArrowDownLeft, Receipt, Filter, CheckCircle, Clock, XCircle, Coins, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import supabaseApi from '../services/supabaseApi';

interface Payment {
  id: string;
  jobId: string;
  type: 'earning' | 'commission' | 'fee';
  amount: number;
  grossAmount?: number;
  commission?: number;
  commissionRate?: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  customer?: string;
  service?: string;
}

const PartnerPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase'den ödemeleri yükle
  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // Partner ID'yi yolmov_partner JSON objesinden al
      const partnerData = localStorage.getItem('yolmov_partner');
      const partnerId = partnerData ? JSON.parse(partnerData).id : '';
      console.log('💰 [PartnerPayments] Partner ID:', partnerId);
      
      // completed_jobs tablosundan tamamlanan işleri çek
      const completedJobs = await supabaseApi.completedJobs.getByPartnerId(partnerId);
      console.log('💰 [PartnerPayments] Loaded completed jobs:', completedJobs?.length || 0);
      
      // CompletedJob -> Payment formatına dönüştür
      const formattedPayments: Payment[] = (completedJobs || []).map((job: any) => ({
        id: `PAY-${job.id?.substring(0, 8) || ''}`,
        jobId: `JOB-${job.id?.substring(0, 4) || ''}`,
        type: 'earning' as const,
        grossAmount: job.totalAmount || 0,
        commission: job.commission || 0,
        commissionRate: job.totalAmount ? Math.round((job.commission / job.totalAmount) * 100) : 0,
        amount: job.partnerEarning || job.totalAmount || 0,
        date: job.completionTime || job.startTime || new Date().toISOString(),
        status: (job.status === 'completed' ? 'completed' : job.status === 'cancelled' ? 'failed' : 'pending') as any,
        paymentMethod: (job.paymentMethod === 'nakit' ? 'cash' : job.paymentMethod === 'kredi_karti' ? 'card' : 'bank_transfer') as any,
        customer: job.customerName || 'Müşteri',
        service: job.serviceType || 'Hizmet'
      }));
      
      setPayments(formattedPayments);
      console.log('💰 [PartnerPayments] Formatted payments:', formattedPayments.length);
    } catch (error) {
      console.error('❌ Ödemeler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

// MOCK DATA - KULLANILMIYOR
const MOCK_PAYMENTS_OLD: Payment[] = [
  {
    id: 'PAY-1234',
    jobId: 'JOB-4923',
    type: 'earning',
    grossAmount: 850,
    commission: 85,
    commissionRate: 10,
    amount: 765,
    date: '2023-11-22 15:00',
    status: 'completed',
    paymentMethod: 'cash',
    customer: 'Ahmet Yılmaz',
    service: 'Çekici Hizmeti',
  },
  {
    id: 'PAY-1233',
    jobId: 'JOB-4922',
    type: 'earning',
    grossAmount: 400,
    commission: 40,
    commissionRate: 10,
    amount: 360,
    date: '2023-11-21 10:30',
    status: 'completed',
    paymentMethod: 'card',
    customer: 'Selin Kaya',
    service: 'Akü Takviyesi',
  },
  {
    id: 'PAY-1232',
    jobId: 'JOB-4920',
    type: 'earning',
    grossAmount: 1200,
    commission: 120,
    commissionRate: 10,
    amount: 1080,
    date: '2023-11-19 12:30',
    status: 'pending',
    paymentMethod: 'bank_transfer',
    customer: 'Caner Erkin',
    service: 'Çekici Hizmeti',
  },
  {
    id: 'PAY-1231',
    jobId: 'JOB-4918',
    type: 'earning',
    grossAmount: 900,
    commission: 90,
    commissionRate: 10,
    amount: 810,
    date: '2023-11-15 11:00',
    status: 'completed',
    paymentMethod: 'cash',
    customer: 'Burak Y.',
    service: 'Çekici Hizmeti',
  },
  {
    id: 'FEE-501',
    jobId: '-',
    type: 'fee',
    amount: -50,
    date: '2023-11-10 14:00',
    status: 'completed',
    paymentMethod: 'card',
    service: 'Platform Üyelik Ücreti',
  },
];

// Component aşağıda tanımlandı - bu satırı sil
const [filterType, setFilterType] = useState<'all' | 'earning' | 'commission' | 'fee'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const matchesType = filterType === 'all' || payment.type === filterType;
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesType && matchesStatus;
  });

  // Hesaplamalar (Komisyon yok - sadece net kazanç)
  const totalEarnings = payments
    .filter(p => p.type === 'earning' && p.status === 'completed')
    .reduce((sum, p) => sum + (p.grossAmount || p.amount), 0);

  // Bu ay kazanç (son 30 gün)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thisMonthEarnings = payments
    .filter(p => p.type === 'earning' && p.status === 'completed' && new Date(p.date) >= thirtyDaysAgo)
    .reduce((sum, p) => sum + (p.grossAmount || p.amount), 0);

  const pendingPayments = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const completedJobsCount = payments
    .filter(p => p.type === 'earning' && p.status === 'completed').length;

  const getStatusBadge = (status: Payment['status']) => {
    const config = {
      completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle, label: 'Tamamlandı' },
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock, label: 'Beklemede' },
      failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Başarısız' },
    };
    const { bg, text, border, icon: Icon, label } = config[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
        <Icon size={12} />
        {label}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: Payment['paymentMethod']) => {
    const labels = {
      cash: 'Nakit',
      card: 'Kredi Kartı',
      bank_transfer: 'Banka Havalesi',
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <ArrowUpRight size={20} className="opacity-60" />
          </div>
          <p className="text-sm text-green-100 mb-1">Toplam Kazanç</p>
          <p className="text-3xl font-bold">{totalEarnings.toLocaleString()} ₺</p>
          <p className="text-xs text-green-100 mt-1">{completedJobsCount} İş Tamamlandı</p>
        </div>


        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <Receipt size={20} className="opacity-60" />
          </div>
          <p className="text-sm text-purple-100 mb-1">Bu Ay Kazanç</p>
          <p className="text-3xl font-bold">{thisMonthEarnings.toLocaleString()} ₺</p>
          <p className="text-xs text-purple-100 mt-1">Son 30 Gün</p>
        </div>
      </div>

      {/* Info Card - Platform Avantajları */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Coins size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-2">💰 Komisyonsuz Kazanç Sistemi</h3>
            <p className="text-sm text-blue-700 mb-3">
              Yolmov platformunda müşterilerden aldığınız ödemenin <span className="font-bold">%100'ü size aittir!</span> 
              Platform geliri sadece kredi satışından elde edilir. İş başı komisyon alınmaz.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-blue-900 font-semibold">%0 Komisyon</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-blue-900 font-semibold">Hızlı Ödeme</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-blue-900 font-semibold">Anında Tahsilat</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tüm İşlemler</option>
              <option value="earning">Kazançlar</option>
              <option value="commission">Komisyonlar</option>
              <option value="fee">Ücretler</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="completed">Tamamlandı</option>
              <option value="pending">Beklemede</option>
              <option value="failed">Başarısız</option>
            </select>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="ml-auto px-6 py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Ödeme kayıtları yükleniyor...</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlem ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İş No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Müşteri/Hizmet</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tutar</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ödeme Yöntemi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-700">{payment.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-600">{payment.jobId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{payment.customer || '-'}</p>
                      <p className="text-gray-500 text-xs">{payment.service}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${payment.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {payment.amount >= 0 ? '+' : ''}{(payment.grossAmount || payment.amount).toLocaleString()} ₺
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{getPaymentMethodLabel(payment.paymentMethod)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{payment.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors mx-auto"
                    >
                      <Eye size={16} className="text-gray-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {filteredPayments.length === 0 && !loading && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Ödeme Bulunamadı</h3>
            <p className="text-gray-500">Henüz tamamlanmış bir iş kaydınız bulunmuyor.</p>
            <p className="text-sm text-gray-400 mt-2">İş tamamladığınızda ödeme kayıtları burada görünecektir.</p>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Rapor İndir</h2>
                <p className="text-sm text-gray-500 mt-1">Ödeme raporunuzu özelleştirin ve indirin</p>
              </div>
              <button onClick={() => setShowExportModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Tarih Aralığı */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">Tarih Aralığı</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Başlangıç</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Bitiş</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {setStartDate(''); setEndDate('');}} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">Tümü</button>
                  <button onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                    setStartDate(lastMonth.toISOString().split('T')[0]);
                    setEndDate(today.toISOString().split('T')[0]);
                  }} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">Son 30 Gün</button>
                  <button onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    setStartDate(firstDay.toISOString().split('T')[0]);
                    setEndDate(today.toISOString().split('T')[0]);
                  }} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">Bu Ay</button>
                </div>
              </div>

              {/* Kayıt Sayısı */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Sayfa Başına Kayıt</label>
                <div className="flex gap-3">
                  {[10, 20, 50, 100].map(size => (
                    <button
                      key={size}
                      onClick={() => setPageSize(size)}
                      className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${
                        pageSize === size
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Seçimi */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Dosya Formatı</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => {
                      alert(`Excel formatında rapor indiriliyor... (${filteredPayments.length} kayıt)`);
                      setShowExportModal(false);
                    }}
                    className="py-3 px-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg font-bold hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Excel
                  </button>
                  <button 
                    onClick={() => {
                      alert(`PDF formatında rapor indiriliyor... (${filteredPayments.length} kayıt)`);
                      setShowExportModal(false);
                    }}
                    className="py-3 px-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    PDF
                  </button>
                  <button 
                    onClick={() => {
                      alert(`CSV formatında rapor indiriliyor... (${filteredPayments.length} kayıt)`);
                      setShowExportModal(false);
                    }}
                    className="py-3 px-4 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    CSV
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>{filteredPayments.length} kayıt</strong> indirilecek. Tarih aralığı ve filtreler uygulanacaktır.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayment(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Ödeme Detayları</h2>
              <button onClick={() => setSelectedPayment(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">İşlem ID</span>
                <span className="font-mono font-semibold">{selectedPayment.id}</span>
              </div>

              {selectedPayment.jobId !== '-' && (
                <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">İş No</span>
                  <span className="font-mono font-semibold">{selectedPayment.jobId}</span>
                </div>
              )}

              {selectedPayment.customer && (
                <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Müşteri</span>
                  <span className="font-semibold">{selectedPayment.customer}</span>
                </div>
              )}

              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Hizmet</span>
                <span className="font-semibold">{selectedPayment.service}</span>
              </div>

              {selectedPayment.grossAmount && (
                <div className="flex justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm text-green-700 font-semibold">Ödeme Tutarı</span>
                  <span className="text-lg font-bold text-green-600">{selectedPayment.grossAmount} ₺</span>
                </div>
              )}

              <div className="flex justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <span className="text-sm text-blue-700 font-semibold">Kazancınız (%0 Komisyon)</span>
                <span className="text-2xl font-bold text-blue-600">{(selectedPayment.grossAmount || selectedPayment.amount)} ₺</span>
              </div>

              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Ödeme Yöntemi</span>
                <span className="font-semibold">{getPaymentMethodLabel(selectedPayment.paymentMethod)}</span>
              </div>

              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Tarih</span>
                <span className="font-semibold">{selectedPayment.date}</span>
              </div>

              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Durum</span>
                {getStatusBadge(selectedPayment.status)}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <Download size={18} />
                Fatura İndir
              </button>
              <button className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
                <Receipt size={18} />
                Dekont Görüntüle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerPayments;
