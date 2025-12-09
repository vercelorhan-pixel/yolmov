/**
 * Partner Offer History Component
 * Partnerin gönderdiği tekliflerin geçmişi ve durumları
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter, Calendar, DollarSign, Eye, ChevronRight, User, MapPin, FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';
import supabaseApi from '../services/supabaseApi';

interface Offer {
  id: string;
  requestId: string;
  customer: string;
  service: string;
  location: string;
  price: number;
  sentDate: string;
  status: 'accepted' | 'rejected' | 'pending' | 'expired';
  responseDate?: string;
  responseMessage?: string;
}

const PartnerOfferHistory: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase'den teklifleri yükle
  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      // Partner ID'yi yolmov_partner JSON objesinden al
      const partnerData = localStorage.getItem('yolmov_partner');
      const partnerId = partnerData ? JSON.parse(partnerData).id : '';
      console.log('📦 [PartnerOfferHistory] Partner ID:', partnerId);
      
      const offersData = await supabaseApi.offers.getByPartnerId(partnerId);
      console.log('📦 [PartnerOfferHistory] Loaded offers:', offersData?.length || 0, offersData);
      
      if (offersData && offersData.length > 0) {
        // Supabase verilerini Offer formatına dönüştür
        const formattedOffers: Offer[] = offersData.map((offer: any) => ({
          id: offer.id,
          requestId: offer.request_id,
          customer: 'Müşteri', // Request'ten çekilecek
          service: 'Hizmet',
          location: 'Konum',
          price: offer.price,
          sentDate: new Date(offer.created_at).toLocaleString('tr-TR'),
          status: offer.status as any,
          responseDate: offer.updated_at ? new Date(offer.updated_at).toLocaleString('tr-TR') : undefined,
          responseMessage: offer.notes
        }));
        setOffers(formattedOffers);
      }
    } catch (error) {
      console.error('❌ Teklifler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

// MOCK DATA - KULLANILMIYOR
const MOCK_OFFERS_OLD: Offer[] = [
  {
    id: 'OFF-1234',
    requestId: 'REQ-5678',
    customer: 'Ahmet Yılmaz',
    service: 'Çekici Hizmeti',
    location: 'Kadıköy, İstanbul',
    price: 850,
    sentDate: '2023-11-22 14:30',
    status: 'accepted',
    responseDate: '2023-11-22 14:45',
    responseMessage: 'Teklif kabul edildi',
  },
  {
    id: 'OFF-1233',
    requestId: 'REQ-5677',
    customer: 'Zeynep Kaya',
    service: 'Akü Takviyesi',
    location: 'Beşiktaş, İstanbul',
    price: 400,
    sentDate: '2023-11-21 09:15',
    status: 'accepted',
    responseDate: '2023-11-21 09:20',
  },
  {
    id: 'OFF-1232',
    requestId: 'REQ-5676',
    customer: 'Mehmet Demir',
    service: 'Lastik Değişimi',
    location: 'TEM Otoyolu',
    price: 600,
    sentDate: '2023-11-20 23:45',
    status: 'rejected',
    responseDate: '2023-11-20 23:50',
    responseMessage: 'Başka bir teklif kabul edildi',
  },
  {
    id: 'OFF-1231',
    requestId: 'REQ-5675',
    customer: 'Caner Erkin',
    service: 'Çekici Hizmeti',
    location: 'Ümraniye, İstanbul',
    price: 1200,
    sentDate: '2023-11-19 11:20',
    status: 'accepted',
    responseDate: '2023-11-19 11:25',
  },
  {
    id: 'OFF-1230',
    requestId: 'REQ-5674',
    customer: 'Selin A.',
    service: 'Yakıt Desteği',
    location: 'E-5 Merter',
    price: 350,
    sentDate: '2023-11-18 16:40',
    status: 'pending',
  },
  {
    id: 'OFF-1229',
    requestId: 'REQ-5673',
    customer: 'Burak Y.',
    service: 'Çekici Hizmeti',
    location: 'Kartal, İstanbul',
    price: 900,
    sentDate: '2023-11-15 10:00',
    status: 'expired',
  },
];

// Component aşağıda tanımlandı - bu satırı sil
const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'accepted' | 'rejected' | 'pending' | 'expired'>('all');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.customer.toLowerCase().includes(search.toLowerCase()) ||
      offer.service.toLowerCase().includes(search.toLowerCase()) ||
      offer.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: offers.length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
    pending: offers.filter(o => o.status === 'pending').length,
    winRate: offers.length > 0 ? ((offers.filter(o => o.status === 'accepted').length / offers.length) * 100).toFixed(1) : '0',
  };

  const getStatusBadge = (status: Offer['status']) => {
    const config = {
      accepted: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle, label: 'Kabul Edildi' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Reddedildi' },
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock, label: 'Beklemede' },
      expired: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: XCircle, label: 'Süresi Doldu' },
    };
    const { bg, text, border, icon: Icon, label } = config[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${bg} ${text} ${border}`}>
        <Icon size={14} />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Toplam Teklif</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Kabul Edilen</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Reddedilen</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Bekleyen</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-100 mb-1">Kazanma Oranı</p>
              <p className="text-2xl font-bold">{stats.winRate}%</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Müşteri, hizmet veya teklif ID'si ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="accepted">Kabul Edildi</option>
              <option value="rejected">Reddedildi</option>
              <option value="pending">Beklemede</option>
              <option value="expired">Süresi Doldu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className="space-y-3">
        {filteredOffers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Teklif Bulunamadı</h3>
            <p className="text-gray-500">Arama kriterlerinize uygun teklif bulunamadı.</p>
          </div>
        ) : (
          filteredOffers.map((offer) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedOffer(offer)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-500">{offer.id}</span>
                  {getStatusBadge(offer.status)}
                </div>
                <span className="text-sm text-gray-400">{offer.sentDate}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Müşteri</p>
                    <p className="text-sm font-semibold text-gray-900">{offer.customer}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hizmet</p>
                    <p className="text-sm font-semibold text-gray-900">{offer.service}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                    <MapPin size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Konum</p>
                    <p className="text-sm font-semibold text-gray-900">{offer.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                    <DollarSign size={16} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Teklif Fiyatı</p>
                    <p className="text-sm font-bold text-orange-600">{offer.price} ₺</p>
                  </div>
                </div>
              </div>

              {offer.responseMessage && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Müşteri Yanıtı:</span> {offer.responseMessage}
                  </p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setSelectedOffer(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Teklif Detayları</h2>
              <button onClick={() => setSelectedOffer(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Teklif ID</span>
                <span className="font-mono font-semibold">{selectedOffer.id}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Talep ID</span>
                <span className="font-mono font-semibold">{selectedOffer.requestId}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Durum</span>
                {getStatusBadge(selectedOffer.status)}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Müşteri</span>
                <span className="font-semibold">{selectedOffer.customer}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Hizmet</span>
                <span className="font-semibold">{selectedOffer.service}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Konum</span>
                <span className="font-semibold">{selectedOffer.location}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-sm text-orange-700 font-semibold">Teklif Fiyatı</span>
                <span className="text-2xl font-bold text-orange-600">{selectedOffer.price} ₺</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Gönderilme Tarihi</span>
                <span className="font-semibold">{selectedOffer.sentDate}</span>
              </div>

              {selectedOffer.responseDate && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Yanıt Tarihi</span>
                  <span className="font-semibold">{selectedOffer.responseDate}</span>
                </div>
              )}

              {selectedOffer.responseMessage && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 mb-1 font-semibold">Müşteri Yanıtı:</p>
                  <p className="text-gray-700">{selectedOffer.responseMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerOfferHistory;
