import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, User, Calendar, DollarSign, CheckCircle, Clock, XCircle, Package } from 'lucide-react';

interface Request {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
  amount?: number;
  fromLocation: string;
  toLocation?: string;
  vehicleInfo?: string;
  description?: string;
  matchedPartner?: string;
}

const MOCK_REQUESTS: Request[] = [
  { 
    id: 'REQ-001', 
    customerId: 'USR-001', 
    customerName: 'Ahmet Yılmaz',
    customerPhone: '0532 111 22 33',
    serviceType: 'Çekici Hizmeti',
    status: 'completed',
    createdAt: '2023-11-22 14:30',
    amount: 850,
    fromLocation: 'Kadıköy, İstanbul',
    toLocation: 'Maltepe Servis, İstanbul',
    vehicleInfo: 'Renault Megane - 34 ABC 123',
    description: 'Araç çalışmıyor, kontak açılmıyor',
    matchedPartner: 'Yılmaz Oto Kurtarma'
  },
  { 
    id: 'REQ-002', 
    customerId: 'USR-002', 
    customerName: 'Selin Kaya',
    customerPhone: '05XX XXX XX XX',
    serviceType: 'Akü Takviyesi',
    status: 'matched',
    createdAt: '2023-11-23 09:15',
    amount: 400,
    fromLocation: 'Beşiktaş, İstanbul',
    vehicleInfo: 'Toyota Corolla - 34 XYZ 456',
    description: 'Akü bitti, çalıştıramıyorum',
    matchedPartner: 'Hızlı Yol Yardım'
  },
];

const AdminRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const request = MOCK_REQUESTS.find(r => r.id === id);

  if (!request) {
    return (
      <div className="p-8">
        <button onClick={() => navigate('/admin/talepler')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={20} />
          Geri Dön
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          Talep bulunamadı.
        </div>
      </div>
    );
  }

  const statusConfig = {
    open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Açık', icon: Clock },
    matched: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Eşleşti', icon: CheckCircle },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Tamamlandı', icon: CheckCircle },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'İptal', icon: XCircle }
  };

  const config = statusConfig[request.status];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <button onClick={() => navigate('/admin/talepler')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft size={20} />
        Talep Listesine Dön
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{request.serviceType}</h1>
            <p className="text-slate-500 font-mono">{request.id}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.text} font-bold`}>
            <StatusIcon size={18} />
            {config.label}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Müşteri Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <User size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Müşteri Adı</p>
                <p className="font-medium text-slate-900">{request.customerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Phone size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Telefon</p>
                <p className="font-medium text-slate-900">{request.customerPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Talep Detayları</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <MapPin size={20} className="text-slate-400 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Başlangıç Konumu</p>
                <p className="font-medium text-slate-900">{request.fromLocation}</p>
              </div>
            </div>
            {request.toLocation && (
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <MapPin size={20} className="text-slate-400 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Varış Konumu</p>
                  <p className="font-medium text-slate-900">{request.toLocation}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <Package size={20} className="text-slate-400 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Araç Bilgisi</p>
                <p className="font-medium text-slate-900">{request.vehicleInfo}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <Calendar size={20} className="text-slate-400 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Oluşturulma Tarihi</p>
                <p className="font-medium text-slate-900">{request.createdAt}</p>
              </div>
            </div>
            {request.description && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-2">Açıklama</p>
                <p className="text-slate-900">{request.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Partner & Amount */}
        {(request.matchedPartner || request.amount) && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">İşlem Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {request.matchedPartner && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle size={20} className="text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-bold">Eşleşen Partner</p>
                    <p className="font-medium text-slate-900">{request.matchedPartner}</p>
                  </div>
                </div>
              )}
              {request.amount && (
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <DollarSign size={20} className="text-purple-600" />
                  <div>
                    <p className="text-xs text-purple-600 font-bold">Tutar</p>
                    <p className="font-medium text-slate-900 text-xl">₺{request.amount.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600">
            Müşteri Profiline Git
          </button>
          {request.matchedPartner && (
            <button className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600">
              Partner Profiline Git
            </button>
          )}
          <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">
            Talebi İptal Et
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestDetailPage;
