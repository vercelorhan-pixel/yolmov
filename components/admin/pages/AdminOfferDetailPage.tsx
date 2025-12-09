import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, User, Phone, Calendar, CheckCircle, XCircle, Clock, Send } from 'lucide-react';

interface Offer {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  requestId: string;
  requestService: string;
  customerName: string;
  price: number;
  status: 'sent' | 'accepted' | 'rejected';
  createdAt: string;
  notes?: string;
  estimatedTime?: string;
}

const MOCK_OFFERS: Offer[] = [
  { 
    id: 'OFF-001', 
    partnerId: 'PTR-001', 
    partnerName: 'Yılmaz Oto Kurtarma',
    partnerPhone: '0532 XXX XX 01',
    requestId: 'REQ-001',
    requestService: 'Çekici Hizmeti',
    customerName: 'Ahmet Yılmaz',
    price: 850,
    status: 'accepted',
    createdAt: '2023-11-22 14:35',
    notes: '15 dakikada oradayız',
    estimatedTime: '15 dk'
  },
  { 
    id: 'OFF-002', 
    partnerId: 'PTR-002', 
    partnerName: 'Hızlı Yol Yardım',
    partnerPhone: '0533 XXX XX 02',
    requestId: 'REQ-002',
    requestService: 'Akü Takviyesi',
    customerName: 'Selin Kaya',
    price: 400,
    status: 'accepted',
    createdAt: '2023-11-23 09:20',
    notes: '10 dakikada varırız',
    estimatedTime: '10 dk'
  },
  { 
    id: 'OFF-003', 
    partnerId: 'PTR-001', 
    partnerName: 'Yılmaz Oto Kurtarma',
    partnerPhone: '0532 XXX XX 01',
    requestId: 'REQ-003',
    requestService: 'Lastik Değişimi',
    customerName: 'Mehmet Demir',
    price: 600,
    status: 'sent',
    createdAt: '2023-11-24 11:05',
    estimatedTime: '20 dk'
  },
];

const AdminOfferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const offer = MOCK_OFFERS.find(o => o.id === id);

  if (!offer) {
    return (
      <div className="p-8">
        <button onClick={() => navigate('/admin/teklifler')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={20} />
          Geri Dön
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          Teklif bulunamadı.
        </div>
      </div>
    );
  }

  const statusConfig = {
    sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Gönderildi', icon: Send },
    accepted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Kabul Edildi', icon: CheckCircle },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Reddedildi', icon: XCircle }
  };

  const config = statusConfig[offer.status];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <button onClick={() => navigate('/admin/teklifler')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft size={20} />
        Teklif Listesine Dön
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Teklif Detayı</h1>
            <p className="text-slate-500 font-mono">{offer.id}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.text} font-bold`}>
            <StatusIcon size={18} />
            {config.label}
          </div>
        </div>

        {/* Price Card */}
        <div className="mb-8 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-8 text-center">
          <p className="text-purple-700 font-bold mb-2">Teklif Tutarı</p>
          <p className="text-5xl font-bold text-slate-900">₺{offer.price.toLocaleString()}</p>
          {offer.estimatedTime && (
            <div className="flex items-center justify-center gap-2 mt-4 text-slate-600">
              <Clock size={16} />
              <span className="text-sm font-medium">Tahmini Süre: {offer.estimatedTime}</span>
            </div>
          )}
        </div>

        {/* Partner Info */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Partner Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <User size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Partner Adı</p>
                <p className="font-medium text-slate-900">{offer.partnerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Phone size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Telefon</p>
                <p className="font-medium text-slate-900">{offer.partnerPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Request Info */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Talep Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Talep ID</p>
              <p className="font-mono font-medium text-slate-900">{offer.requestId}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Hizmet Türü</p>
              <p className="font-medium text-slate-900">{offer.requestService}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Müşteri</p>
              <p className="font-medium text-slate-900">{offer.customerName}</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Calendar size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Gönderilme Tarihi</p>
                <p className="font-medium text-slate-900">{offer.createdAt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {offer.notes && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Notlar</h2>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-slate-900">{offer.notes}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button 
            onClick={() => navigate(`/admin/partner/${offer.partnerId}`)}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600"
          >
            Partner Profiline Git
          </button>
          <button 
            onClick={() => navigate(`/admin/talep/${offer.requestId}`)}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600"
          >
            Talep Detayına Git
          </button>
          {offer.status === 'sent' && (
            <button className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200">
              Teklifi İptal Et
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOfferDetailPage;
