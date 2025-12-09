/**
 * Admin Job History Tab
 * Tamamlanan tüm işlerin geçmişi, partner bazlı filtreleme, gelir analizi
 */

import React, { useState } from 'react';
import { Search, TrendingUp, CheckCircle, Clock, MapPin, Eye, Download, Calendar, DollarSign } from 'lucide-react';
import { useAdminFilter } from '../hooks/useAdminFilter';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';

interface CompletedJob {
  id: string;
  partnerId: string;
  partnerName: string;
  customerName: string;
  serviceType: string;
  startLocation: string;
  endLocation?: string;
  distance?: number;
  startTime: string;
  completionTime: string;
  duration: number; // minutes
  totalAmount: number;
  commission: number;
  partnerEarning: number;
  paymentMethod: 'kredi_karti' | 'nakit' | 'havale';
  rating?: number;
  vehicleType: string;
  vehiclePlate: string;
}

// MOCK DATA
const MOCK_JOBS: CompletedJob[] = [
  {
    id: 'JOB-4923',
    partnerId: 'PTR-001',
    partnerName: 'Yılmaz Oto Kurtarma',
    customerName: 'Ahmet Yılmaz',
    serviceType: 'Çekici Hizmeti',
    startLocation: 'Kadıköy, İstanbul',
    endLocation: 'Kartal, İstanbul',
    distance: 18,
    startTime: '2024-11-22 15:00',
    completionTime: '2024-11-22 15:45',
    duration: 45,
    totalAmount: 2500,
    commission: 375,
    partnerEarning: 2125,
    paymentMethod: 'kredi_karti',
    rating: 5,
    vehicleType: 'Çekici - Ağır Hizmet',
    vehiclePlate: '34 ABC 123',
  },
  {
    id: 'JOB-4920',
    partnerId: 'PTR-001',
    partnerName: 'Yılmaz Oto Kurtarma',
    customerName: 'Mehmet K.',
    serviceType: 'Akü Takviyesi',
    startLocation: 'Beşiktaş, İstanbul',
    startTime: '2024-11-19 10:00',
    completionTime: '2024-11-19 10:30',
    duration: 30,
    totalAmount: 800,
    commission: 120,
    partnerEarning: 680,
    paymentMethod: 'nakit',
    rating: 2,
    vehicleType: 'Hafif Yardım Aracı',
    vehiclePlate: '34 XYZ 456',
  },
  {
    id: 'JOB-4918',
    partnerId: 'PTR-002',
    partnerName: 'Hızlı Yol Yardım',
    customerName: 'Selin Kaya',
    serviceType: 'Çekici Hizmeti',
    startLocation: 'Maltepe, İstanbul',
    endLocation: 'Pendik, İstanbul',
    distance: 12,
    startTime: '2024-11-15 13:30',
    completionTime: '2024-11-15 14:15',
    duration: 45,
    totalAmount: 3200,
    commission: 480,
    partnerEarning: 2720,
    paymentMethod: 'kredi_karti',
    rating: 4,
    vehicleType: 'Çekici - Orta Hizmet',
    vehiclePlate: '34 DEF 789',
  },
  {
    id: 'JOB-4915',
    partnerId: 'PTR-002',
    partnerName: 'Hızlı Yol Yardım',
    customerName: 'Burak Y.',
    serviceType: 'Çekici Hizmeti',
    startLocation: 'Sarıyer, İstanbul',
    endLocation: 'Şişli, İstanbul',
    distance: 8,
    startTime: '2024-11-12 09:00',
    completionTime: '2024-11-12 09:45',
    duration: 45,
    totalAmount: 2800,
    commission: 420,
    partnerEarning: 2380,
    paymentMethod: 'kredi_karti',
    rating: 1,
    vehicleType: 'Çekici - Ağır Hizmet',
    vehiclePlate: '34 GHI 012',
  },
  {
    id: 'JOB-4912',
    partnerId: 'PTR-003',
    partnerName: 'Mega Çekici',
    customerName: 'Zeynep Aydın',
    serviceType: 'Lastik Değişimi',
    startLocation: 'Ataşehir, İstanbul',
    startTime: '2024-11-10 16:30',
    completionTime: '2024-11-10 17:00',
    duration: 30,
    totalAmount: 600,
    commission: 90,
    partnerEarning: 510,
    paymentMethod: 'nakit',
    rating: 5,
    vehicleType: 'Hafif Yardım Aracı',
    vehiclePlate: '34 JKL 345',
  },
  {
    id: 'JOB-4910',
    partnerId: 'PTR-003',
    partnerName: 'Mega Çekici',
    customerName: 'Caner Erkin',
    serviceType: 'Yakıt Desteği',
    startLocation: 'Beylikdüzü, İstanbul',
    startTime: '2024-11-08 11:00',
    completionTime: '2024-11-08 11:30',
    duration: 30,
    totalAmount: 400,
    commission: 60,
    partnerEarning: 340,
    paymentMethod: 'kredi_karti',
    rating: 5,
    vehicleType: 'Hafif Yardım Aracı',
    vehiclePlate: '34 MNO 678',
  },
  {
    id: 'JOB-4908',
    partnerId: 'PTR-001',
    partnerName: 'Yılmaz Oto Kurtarma',
    customerName: 'Elif Demir',
    serviceType: 'Çekici Hizmeti',
    startLocation: 'Üsküdar, İstanbul',
    endLocation: 'Ümraniye, İstanbul',
    distance: 10,
    startTime: '2024-11-05 08:30',
    completionTime: '2024-11-05 09:15',
    duration: 45,
    totalAmount: 2900,
    commission: 435,
    partnerEarning: 2465,
    paymentMethod: 'kredi_karti',
    rating: 3,
    vehicleType: 'Çekici - Orta Hizmet',
    vehiclePlate: '34 PQR 901',
  },
  {
    id: 'JOB-4905',
    partnerId: 'PTR-002',
    partnerName: 'Hızlı Yol Yardım',
    customerName: 'Ayşe Kara',
    serviceType: 'Akü Takviyesi',
    startLocation: 'Bakırköy, İstanbul',
    startTime: '2024-11-03 14:00',
    completionTime: '2024-11-03 14:30',
    duration: 30,
    totalAmount: 750,
    commission: 112.5,
    partnerEarning: 637.5,
    paymentMethod: 'havale',
    rating: 5,
    vehicleType: 'Hafif Yardım Aracı',
    vehiclePlate: '34 STU 234',
  },
];

const AdminJobHistoryTab: React.FC = () => {
  const [jobs] = useState(MOCK_JOBS);
  const [selectedJob, setSelectedJob] = useState<CompletedJob | null>(null);
  const [partnerFilter, setPartnerFilter] = useState<string>('all');

  const { filtered, searchTerm, setSearchTerm } = useAdminFilter<CompletedJob>(
    jobs,
    { searchKeys: ['id', 'partnerName', 'customerName', 'serviceType', 'vehiclePlate'] }
  );

  const filteredByPartner = partnerFilter === 'all' 
    ? filtered 
    : filtered.filter(j => j.partnerId === partnerFilter);

  const uniquePartners = Array.from(new Set(jobs.map(j => ({ id: j.partnerId, name: j.partnerName }))));

  const stats = {
    totalJobs: jobs.length,
    totalRevenue: jobs.reduce((sum, j) => sum + j.totalAmount, 0),
    totalCommission: jobs.reduce((sum, j) => sum + j.commission, 0),
    totalPartnerEarnings: jobs.reduce((sum, j) => sum + j.partnerEarning, 0),
    avgDuration: Math.round(jobs.reduce((sum, j) => sum + j.duration, 0) / jobs.length),
    avgRating: (jobs.filter(j => j.rating).reduce((sum, j) => sum + (j.rating || 0), 0) / jobs.filter(j => j.rating).length).toFixed(1),
    totalDistance: jobs.filter(j => j.distance).reduce((sum, j) => sum + (j.distance || 0), 0),
  };

  const exportToCSV = () => {
    const headers = ['İş ID', 'Partner', 'Müşteri', 'Hizmet', 'Başlangıç', 'Bitiş', 'Süre (dk)', 'Mesafe (km)', 'Tutar', 'Partner Kazancı', 'Puan'];
    const rows = filteredByPartner.map(j => [
      j.id,
      j.partnerName,
      j.customerName,
      j.serviceType,
      j.startTime,
      j.completionTime,
      j.duration,
      j.distance || '-',
      `${j.totalAmount}₺`,
      `${j.partnerEarning}₺`,
      j.rating || '-',
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    // UTF-8 BOM ekleyerek Türkçe karakterlerin Excel'de doğru görünmesini sağla
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yolmov-is-gecmisi-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={20} />
            <span className="text-xs font-bold">Toplam İş</span>
          </div>
          <p className="text-2xl font-black">{stats.totalJobs}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} />
            <span className="text-xs font-bold">Toplam Gelir</span>
          </div>
          <p className="text-2xl font-black">{stats.totalRevenue.toLocaleString('tr-TR')}₺</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} className="text-purple-600" />
            <span className="text-xs font-bold text-purple-600">Komisyon</span>
          </div>
          <p className="text-2xl font-black text-purple-700">{stats.totalCommission.toLocaleString('tr-TR')}₺</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} className="text-orange-600" />
            <span className="text-xs font-bold text-orange-600">Partner</span>
          </div>
          <p className="text-2xl font-black text-orange-700">{stats.totalPartnerEarnings.toLocaleString('tr-TR')}₺</p>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock size={20} className="text-slate-600" />
            <span className="text-xs font-bold text-slate-600">Ort. Süre</span>
          </div>
          <p className="text-2xl font-black text-slate-700">{stats.avgDuration} dk</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={20} className="text-yellow-600" />
            <span className="text-xs font-bold text-yellow-600">Ort. Puan</span>
          </div>
          <p className="text-2xl font-black text-yellow-700">{stats.avgRating}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <MapPin size={20} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-600">Mesafe</span>
          </div>
          <p className="text-2xl font-black text-blue-700">{stats.totalDistance} km</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="İş ID, partner, müşteri, hizmet veya plaka ara..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
          >
            <option value="all">Tüm Partnerler</option>
            {uniquePartners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={16} />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredByPartner.length === 0 ? (
          <EmptyState title="İş Bulunamadı" description="Arama kriterinize uygun tamamlanmış iş yok." />
        ) : (
          filteredByPartner.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border-2 border-slate-200 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-slate-900">{job.id}</p>
                      <span className="text-xs text-slate-400">•</span>
                      <p className="text-sm font-bold text-slate-700">{job.serviceType}</p>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{job.partnerName} • {job.vehicleType} ({job.vehiclePlate})</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={14} />
                      <span>{job.startLocation}</span>
                      {job.endLocation && (
                        <>
                          <span>→</span>
                          <span>{job.endLocation}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">{job.distance} km</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-600">{job.totalAmount.toLocaleString('tr-TR')}₺</p>
                  <p className="text-xs text-slate-500">Komisyon: {job.commission.toLocaleString('tr-TR')}₺</p>
                  {job.rating && (
                    <p className="text-xs text-yellow-600 mt-1">★ {job.rating}/5</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Müşteri</p>
                  <p className="font-bold text-slate-900 text-sm">{job.customerName}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Başlangıç</p>
                  <p className="font-bold text-slate-900 text-sm">{job.startTime.split(' ')[1]}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Bitiş</p>
                  <p className="font-bold text-slate-900 text-sm">{job.completionTime.split(' ')[1]}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Süre</p>
                  <p className="font-bold text-slate-900 text-sm">{job.duration} dakika</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-xs">
                    {job.paymentMethod === 'kredi_karti' ? 'Kredi Kartı' : job.paymentMethod === 'nakit' ? 'Nakit' : 'Havale'}
                  </span>
                  <span className="text-xs text-slate-500">{job.completionTime.split(' ')[0]}</span>
                </div>
                <button
                  onClick={() => setSelectedJob(job)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 flex items-center gap-2"
                >
                  <Eye size={16} />
                  Detay
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedJob.id}</h2>
                <p className="text-sm text-slate-500">{selectedJob.serviceType}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <CheckCircle size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Partner</p>
                  <p className="font-bold text-slate-900">{selectedJob.partnerName}</p>
                  <p className="text-xs text-slate-500">{selectedJob.partnerId}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Müşteri</p>
                  <p className="font-bold text-slate-900">{selectedJob.customerName}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Araç Bilgisi</p>
                <p className="font-bold text-slate-900">{selectedJob.vehicleType}</p>
                <p className="text-xs text-slate-500 mt-1">Plaka: {selectedJob.vehiclePlate}</p>
              </div>

              <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-4">
                <p className="text-xs text-blue-600 mb-2">Lokasyon Bilgisi</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-600">Başlangıç</p>
                      <p className="font-bold text-blue-900">{selectedJob.startLocation}</p>
                    </div>
                  </div>
                  {selectedJob.endLocation && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-blue-600">Bitiş</p>
                        <p className="font-bold text-blue-900">{selectedJob.endLocation}</p>
                      </div>
                    </div>
                  )}
                  {selectedJob.distance && (
                    <p className="text-sm text-blue-700 font-bold">Mesafe: {selectedJob.distance} km</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Başlangıç</p>
                  <p className="font-bold text-slate-900">{selectedJob.startTime}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Bitiş</p>
                  <p className="font-bold text-slate-900">{selectedJob.completionTime}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Süre</p>
                  <p className="font-bold text-slate-900">{selectedJob.duration} dakika</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl border-2 border-green-200 p-4">
                  <p className="text-xs text-green-600 mb-1">Toplam Tutar</p>
                  <p className="text-2xl font-bold text-green-700">{selectedJob.totalAmount.toLocaleString('tr-TR')}₺</p>
                </div>
                <div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-4">
                  <p className="text-xs text-purple-600 mb-1">Komisyon</p>
                  <p className="text-2xl font-bold text-purple-700">{selectedJob.commission.toLocaleString('tr-TR')}₺</p>
                  <p className="text-xs text-purple-600 mt-1">%{((selectedJob.commission / selectedJob.totalAmount) * 100).toFixed(0)}</p>
                </div>
                <div className="bg-orange-50 rounded-xl border-2 border-orange-200 p-4">
                  <p className="text-xs text-orange-600 mb-1">Partner Kazancı</p>
                  <p className="text-2xl font-bold text-orange-700">{selectedJob.partnerEarning.toLocaleString('tr-TR')}₺</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-2">Ödeme Yöntemi</p>
                  <p className="font-bold text-slate-900">
                    {selectedJob.paymentMethod === 'kredi_karti' ? 'Kredi Kartı' : 
                     selectedJob.paymentMethod === 'nakit' ? 'Nakit' : 'Havale'}
                  </p>
                </div>
                {selectedJob.rating && (
                  <div className="bg-yellow-50 rounded-xl border-2 border-yellow-200 p-4">
                    <p className="text-xs text-yellow-600 mb-2">Müşteri Puanı</p>
                    <p className="text-2xl font-bold text-yellow-700">★ {selectedJob.rating}/5</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobHistoryTab;
