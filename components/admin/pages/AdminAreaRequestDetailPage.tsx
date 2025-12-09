/**
 * Admin Area Expansion Request Detail Page
 * Partner hizmet alanı genişletme talebi detay ve onay sayfası
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, XCircle, Calendar, Clock, Building } from 'lucide-react';

interface ServiceAreaRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'area_expansion';
  currentAreas: string[];
  requestedAreas: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
}

// MOCK DATA
const MOCK_AREA_REQUESTS: ServiceAreaRequest[] = [
  {
    id: 'AREQ-001',
    partnerId: 'PTR-002',
    partnerName: 'Hızlı Yol Yardım',
    requestType: 'area_expansion',
    currentAreas: ['Çankaya, Ankara', 'Keçiören, Ankara'],
    requestedAreas: ['Mamak, Ankara', 'Etimesgut, Ankara'],
    reason: 'Filomuz bu bölgelere yeterli. 2 yeni araç ekledik.',
    status: 'pending',
    createdAt: '2024-11-26 11:00',
  },
  {
    id: 'AREQ-002',
    partnerId: 'PTR-001',
    partnerName: 'Yılmaz Oto Kurtarma',
    requestType: 'area_expansion',
    currentAreas: ['Kadıköy, İstanbul', 'Maltepe, İstanbul'],
    requestedAreas: ['Beşiktaş, İstanbul', 'Şişli, İstanbul'],
    reason: 'Avrupa yakasında da hizmet vermek istiyoruz.',
    status: 'approved',
    createdAt: '2024-11-24 14:20',
    resolvedAt: '2024-11-25 09:00',
    resolvedBy: 'Admin User',
    adminNotes: 'Filo kapasitesi yeterli, onaylandı.'
  },
  {
    id: 'AREQ-003',
    partnerId: 'PTR-003',
    partnerName: 'Mega Çekici',
    requestType: 'area_expansion',
    currentAreas: ['Bornova, İzmir'],
    requestedAreas: ['Karşıyaka, İzmir', 'Konak, İzmir', 'Çiğli, İzmir'],
    reason: 'İzmir genelinde hizmet kapsamını genişletmek istiyoruz.',
    status: 'rejected',
    createdAt: '2024-11-20 16:45',
    resolvedAt: '2024-11-21 10:00',
    resolvedBy: 'Admin User',
    adminNotes: 'Filo kapasitesi yetersiz. En az 2 araç daha eklemeniz gerekiyor.'
  },
];

const AdminAreaRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceAreaRequest | null>(
    MOCK_AREA_REQUESTS.find(r => r.id === id) || null
  );
  const [adminNotes, setAdminNotes] = useState(request?.adminNotes || '');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Alan Talebi Bulunamadı</h2>
          <button onClick={() => navigate('/admin/talepler')} className="text-blue-600 font-bold hover:underline">
            Talep listesine dön
          </button>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setRequest({
        ...request,
        status: 'approved',
        resolvedAt: new Date().toLocaleString('tr-TR'),
        resolvedBy: 'Admin User',
        adminNotes: adminNotes || 'Onaylandı, hizmet alanları güncellendi.'
      });
      setIsProcessing(false);
      alert('✅ Hizmet alanı genişletme talebi onaylandı!');
    }, 1000);
  };

  const handleReject = () => {
    if (!adminNotes.trim()) {
      alert('❌ Lütfen red sebebini belirtin.');
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      setRequest({
        ...request,
        status: 'rejected',
        resolvedAt: new Date().toLocaleString('tr-TR'),
        resolvedBy: 'Admin User',
        adminNotes
      });
      setIsProcessing(false);
      alert('❌ Hizmet alanı genişletme talebi reddedildi.');
    }, 1000);
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
            <h1 className="text-3xl font-black text-slate-900">Hizmet Alanı Genişletme Talebi</h1>
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xl font-bold">
                  {request.partnerName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{request.partnerName}</h3>
                  <p className="text-sm text-slate-500">{request.partnerId}</p>
                </div>
              </div>
            </div>

            {/* Current Areas */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building size={20} className="text-slate-600" />
                <h3 className="text-xl font-bold text-slate-900">Mevcut Hizmet Bölgeleri</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {request.currentAreas.map((area, idx) => (
                  <span key={idx} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* Requested Areas */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={20} className="text-green-700" />
                <h3 className="text-xl font-bold text-green-900">İstenen Yeni Bölgeler</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {request.requestedAreas.map((area, idx) => (
                  <span key={idx} className="px-4 py-2 bg-green-200 text-green-900 rounded-xl text-sm font-black">
                    {area}
                  </span>
                ))}
              </div>
              <div className="bg-white/80 rounded-xl p-4">
                <p className="text-xs font-bold text-green-700 mb-2">Gerekçe</p>
                <p className="text-sm text-green-900">{request.reason}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Zaman Çizelgesi</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Calendar size={18} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Talep Tarihi</p>
                    <p className="font-bold text-slate-900">{request.createdAt}</p>
                  </div>
                </div>
                {request.resolvedAt && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <Clock size={18} className="text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Çözüm Tarihi</p>
                      <p className="font-bold text-slate-900">{request.resolvedAt}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Admin Notes */}
            {request.status === 'pending' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-3">Admin Notları</h4>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Onay/red gerekçesi yazın..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
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
                    disabled={isProcessing}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    {isProcessing ? 'İşleniyor...' : (
                      <>
                        <CheckCircle size={20} />
                        Onayla
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="w-full px-6 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    {isProcessing ? 'İşleniyor...' : (
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

export default AdminAreaRequestDetailPage;
