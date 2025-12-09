/**
 * Admin Lead Request Detail Page
 * Partner lead satın alma talebi detay ve onay sayfası
 * - Manuel admin onaylı sistem
 * - Kredi kontrolü
 * - Müşteri bilgisi onay sonrası görünsün
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, CheckCircle, XCircle, AlertTriangle, CreditCard, User, Calendar, Clock } from 'lucide-react';

interface PartnerLeadRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'lead_purchase';
  serviceArea: string;
  serviceType: string;
  creditCost: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
  customerInfo?: {
    name: string;
    phone: string;
    location: string;
  };
}

interface PartnerInfo {
  id: string;
  name: string;
  credits: number;
  email: string;
  phone: string;
}

// MOCK DATA
const MOCK_LEAD_REQUESTS: PartnerLeadRequest[] = [
  {
    id: 'LREQ-001',
    partnerId: 'PTR-001',
    partnerName: 'Yılmaz Oto Kurtarma',
    requestType: 'lead_purchase',
    serviceArea: 'Kadıköy, İstanbul',
    serviceType: 'cekici',
    creditCost: 1,
    status: 'approved',
    createdAt: '2024-11-26 14:30',
    resolvedAt: '2024-11-26 15:00',
    resolvedBy: 'Admin User',
    adminNotes: 'Onaylandı, 1 kredi düşüldü',
    customerInfo: {
      name: 'Mehmet Demir',
      phone: '0532 111 22 33',
      location: 'Kadıköy Moda Caddesi, İstanbul'
    }
  },
  {
    id: 'LREQ-002',
    partnerId: 'PTR-002',
    partnerName: 'Hızlı Yol Yardım',
    requestType: 'lead_purchase',
    serviceArea: 'Beşiktaş, İstanbul',
    serviceType: 'aku',
    creditCost: 1,
    status: 'pending',
    createdAt: '2024-11-27 09:15',
  },
  {
    id: 'LREQ-003',
    partnerId: 'PTR-003',
    partnerName: 'Mega Çekici',
    requestType: 'lead_purchase',
    serviceArea: 'Bornova, İzmir',
    serviceType: 'lastik',
    creditCost: 1,
    status: 'pending',
    createdAt: '2024-11-27 10:30',
  },
];

const MOCK_PARTNERS: PartnerInfo[] = [
  { id: 'PTR-001', name: 'Yılmaz Oto Kurtarma', credits: 25, email: 'yilmaz@partner.com', phone: '0532 XXX XX 01' },
  { id: 'PTR-002', name: 'Hızlı Yol Yardım', credits: 50, email: 'hizli@partner.com', phone: '0533 XXX XX 02' },
  { id: 'PTR-003', name: 'Mega Çekici', credits: 0, email: 'mega@partner.com', phone: '0534 XXX XX 03' }, // Yetersiz kredi
];

const AdminLeadRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<PartnerLeadRequest | null>(
    MOCK_LEAD_REQUESTS.find(r => r.id === id) || null
  );
  const [adminNotes, setAdminNotes] = useState(request?.adminNotes || '');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Lead Talebi Bulunamadı</h2>
          <button onClick={() => navigate('/admin/talepler')} className="text-blue-600 font-bold hover:underline">
            Talep listesine dön
          </button>
        </div>
      </div>
    );
  }

  const partner = MOCK_PARTNERS.find(p => p.id === request.partnerId);
  const hasEnoughCredits = partner && partner.credits >= request.creditCost;

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'cekici': 'Çekici',
      'aku': 'Akü Takviyesi',
      'lastik': 'Lastik Değişimi',
      'yakit': 'Yakıt Desteği',
    };
    return labels[type] || type;
  };

  const handleApprove = () => {
    if (!hasEnoughCredits) {
      alert('❌ Partner kredi bakiyesi yetersiz!');
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setRequest({
        ...request,
        status: 'approved',
        resolvedAt: new Date().toLocaleString('tr-TR'),
        resolvedBy: 'Admin User',
        adminNotes: adminNotes || 'Onaylandı, 1 kredi düşüldü',
        customerInfo: {
          name: 'Ayşe Yılmaz',
          phone: '05XX XXX XX XX',
          location: `${request.serviceArea} - Test Mahallesi, No: 123`
        }
      });
      setIsProcessing(false);
      alert('✅ Lead talebi onaylandı! Kredi düşüldü, müşteri bilgisi partnere gönderildi.');
    }, 1500);
  };

  const handleReject = () => {
    if (!adminNotes.trim()) {
      alert('❌ Lütfen red sebebini belirtin.');
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setRequest({
        ...request,
        status: 'rejected',
        resolvedAt: new Date().toLocaleString('tr-TR'),
        resolvedBy: 'Admin User',
        adminNotes
      });
      setIsProcessing(false);
      alert('❌ Lead talebi reddedildi.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/talepler')}
            className="p-3 bg-white rounded-xl hover:bg-slate-100 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-900">Lead Satın Alma Talebi</h1>
            <p className="text-slate-500">{request.id}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold ${
            request.status === 'approved' ? 'bg-green-100 text-green-700' :
            request.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {request.status === 'approved' ? 'Onaylandı' :
             request.status === 'rejected' ? 'Reddedildi' :
             'Bekliyor'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Partner Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
                  {request.partnerName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{request.partnerName}</h3>
                  <p className="text-sm text-slate-500">{request.partnerId}</p>
                </div>
              </div>

              {partner && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="font-medium text-slate-900">{partner.email}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Telefon</p>
                    <p className="font-medium text-slate-900">{partner.phone}</p>
                  </div>
                  <div className={`rounded-xl p-4 ${hasEnoughCredits ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={16} className={hasEnoughCredits ? 'text-green-600' : 'text-red-600'} />
                      <p className="text-xs font-bold text-slate-500">Kredi Bakiyesi</p>
                    </div>
                    <p className={`text-2xl font-black ${hasEnoughCredits ? 'text-green-700' : 'text-red-700'}`}>
                      {partner.credits} Kredi
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={16} className="text-blue-600" />
                      <p className="text-xs font-bold text-slate-500">Gerekli Kredi</p>
                    </div>
                    <p className="text-2xl font-black text-blue-700">{request.creditCost} Kredi</p>
                  </div>
                </div>
              )}
            </div>

            {/* Request Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Talep Detayları</h3>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={18} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-500">Hizmet Bölgesi</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{request.serviceArea}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={18} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-500">Hizmet Tipi</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{getServiceTypeLabel(request.serviceType)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={18} className="text-slate-400" />
                      <p className="text-xs font-bold text-slate-500">Talep Tarihi</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{request.createdAt}</p>
                  </div>

                  {request.resolvedAt && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={18} className="text-slate-400" />
                        <p className="text-xs font-bold text-slate-500">Çözüm Tarihi</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{request.resolvedAt}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Info (Only if approved) */}
            {request.status === 'approved' && request.customerInfo && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-300 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User size={24} className="text-green-700" />
                  <h3 className="text-xl font-bold text-green-900">Müşteri Bilgileri</h3>
                  <span className="ml-auto px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-black">
                    Onaylı
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/80 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-bold mb-1">Ad Soyad</p>
                    <p className="text-lg font-black text-green-900">{request.customerInfo.name}</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-bold mb-1">Telefon</p>
                    <p className="text-lg font-black text-green-900">{request.customerInfo.phone}</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-bold mb-1">Konum</p>
                    <p className="text-sm font-bold text-green-900">{request.customerInfo.location}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Credit Warning */}
            {!hasEnoughCredits && request.status === 'pending' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={20} className="text-red-600" />
                  <h4 className="font-bold text-red-900">Yetersiz Kredi!</h4>
                </div>
                <p className="text-sm text-red-700">
                  Partner kredi bakiyesi yetersiz. Talep onaylanamaz.
                </p>
              </div>
            )}

            {/* Admin Notes */}
            {request.status === 'pending' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-3">Admin Notları</h4>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="İsteğe bağlı not ekleyin..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={4}
                />
              </div>
            )}

            {/* Actions */}
            {request.status === 'pending' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-4">İşlemler</h4>
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={!hasEnoughCredits || isProcessing}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    {isProcessing ? (
                      'İşleniyor...'
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Onayla & Kredi Düş
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="w-full px-6 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    {isProcessing ? (
                      'İşleniyor...'
                    ) : (
                      <>
                        <XCircle size={20} />
                        Reddet
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Resolution Info */}
            {request.status !== 'pending' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-4">Çözüm Bilgileri</h4>
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Çözümleyen</p>
                    <p className="font-bold text-slate-900">{request.resolvedBy || '-'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Tarih</p>
                    <p className="font-bold text-slate-900">{request.resolvedAt || '-'}</p>
                  </div>
                  {request.adminNotes && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Admin Notları</p>
                      <p className="text-sm text-slate-900">{request.adminNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeadRequestDetailPage;
