/**
 * Admin Support Request Detail Page
 * Partner destek talebi detay, atama ve çözüm sayfası
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Calendar, Clock, User, FileText } from 'lucide-react';

interface PartnerSupportRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'support' | 'billing' | 'technical' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  attachments?: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolution?: string;
}

// MOCK DATA
const MOCK_SUPPORT_REQUESTS: PartnerSupportRequest[] = [
  {
    id: 'SREQ-001',
    partnerId: 'PTR-003',
    partnerName: 'Mega Çekici',
    requestType: 'billing',
    priority: 'high',
    subject: 'Ödeme sistemi sorunu',
    description: 'Son 3 gündür ödeme çekme işlemi gerçekleştiremiyorum. Bakiye görünüyor ama çekim yapamıyorum.',
    status: 'in_progress',
    createdAt: '2024-11-27 08:30',
    updatedAt: '2024-11-27 09:00',
    assignedTo: 'Admin User',
  },
  {
    id: 'SREQ-002',
    partnerId: 'PTR-001',
    partnerName: 'Yılmaz Oto Kurtarma',
    requestType: 'technical',
    priority: 'medium',
    subject: 'Mobil uygulama GPS sorunu',
    description: 'Mobil uygulamada konum paylaşımı zaman zaman kopuyor.',
    status: 'resolved',
    createdAt: '2024-11-25 14:15',
    updatedAt: '2024-11-26 10:00',
    assignedTo: 'Tech Support',
    resolution: 'GPS izinleri yeniden ayarlandı. Uygulama güncellemesi yayınlandı.'
  },
  {
    id: 'SREQ-003',
    partnerId: 'PTR-002',
    partnerName: 'Hızlı Yol Yardım',
    requestType: 'feature',
    priority: 'low',
    subject: 'Toplu SMS gönderme özelliği',
    description: 'Müşterilere kampanya duyurusu için toplu SMS gönderebilir miyiz?',
    status: 'open',
    createdAt: '2024-11-26 16:00',
    updatedAt: '2024-11-26 16:00',
  },
];

const AdminSupportRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<PartnerSupportRequest | null>(
    MOCK_SUPPORT_REQUESTS.find(r => r.id === id) || null
  );
  const [assignedTo, setAssignedTo] = useState(request?.assignedTo || '');
  const [resolution, setResolution] = useState(request?.resolution || '');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Destek Talebi Bulunamadı</h2>
          <button onClick={() => navigate('/admin/talepler')} className="text-blue-600 font-bold hover:underline">
            Talep listesine dön
          </button>
        </div>
      </div>
    );
  }

  const getSupportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'support': 'Genel Destek',
      'billing': 'Ödeme/Fatura',
      'technical': 'Teknik',
      'feature': 'Özellik Talebi',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'urgent': 'Acil',
      'high': 'Yüksek',
      'medium': 'Orta',
      'low': 'Düşük',
    };
    return labels[priority] || priority;
  };

  const handleAssign = () => {
    if (!assignedTo.trim()) {
      alert('❌ Lütfen atanacak kişiyi belirtin.');
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      setRequest({
        ...request,
        status: 'in_progress',
        assignedTo,
        updatedAt: new Date().toLocaleString('tr-TR')
      });
      setIsProcessing(false);
      alert(`✅ Talep ${assignedTo} kişisine atandı.`);
    }, 1000);
  };

  const handleResolve = () => {
    if (!resolution.trim()) {
      alert('❌ Lütfen çözüm açıklaması girin.');
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      setRequest({
        ...request,
        status: 'resolved',
        resolution,
        updatedAt: new Date().toLocaleString('tr-TR')
      });
      setIsProcessing(false);
      alert('✅ Destek talebi çözüldü olarak işaretlendi.');
    }, 1000);
  };

  const handleClose = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setRequest({
        ...request,
        status: 'closed',
        updatedAt: new Date().toLocaleString('tr-TR')
      });
      setIsProcessing(false);
      alert('📁 Destek talebi kapatıldı.');
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
            <h1 className="text-3xl font-black text-slate-900">Destek Talebi</h1>
            <p className="text-slate-500">{request.id}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold ${
            request.status === 'resolved' ? 'bg-green-100 text-green-700' :
            request.status === 'closed' ? 'bg-slate-100 text-slate-700' :
            request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {request.status === 'resolved' ? 'Çözüldü' :
             request.status === 'closed' ? 'Kapatıldı' :
             request.status === 'in_progress' ? 'İşlemde' :
             'Açık'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Partner Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xl font-bold">
                  {request.partnerName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{request.partnerName}</h3>
                  <p className="text-sm text-slate-500">{request.partnerId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-3 border-2 ${getPriorityColor(request.priority)}`}>
                  <p className="text-xs font-bold mb-1">Öncelik</p>
                  <p className="text-lg font-black">{getPriorityLabel(request.priority)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-bold mb-1">Tip</p>
                  <p className="text-lg font-bold text-slate-900">{getSupportTypeLabel(request.requestType)}</p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Talep Detayları</h3>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-bold mb-2">Konu</p>
                  <p className="text-lg font-bold text-slate-900">{request.subject}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-bold mb-2">Açıklama</p>
                  <p className="text-sm text-slate-900 leading-relaxed">{request.description}</p>
                </div>

                {request.attachments && request.attachments.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-bold mb-2">Ekler</p>
                    <div className="flex flex-wrap gap-2">
                      {request.attachments.map((file, idx) => (
                        <span key={idx} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-2">
                          <FileText size={14} />
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resolution */}
            {request.status === 'resolved' && request.resolution && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-300 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={24} className="text-green-700" />
                  <h3 className="text-xl font-bold text-green-900">Çözüm</h3>
                </div>
                <div className="bg-white/80 rounded-xl p-4">
                  <p className="text-sm text-green-900">{request.resolution}</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Zaman Çizelgesi</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Calendar size={18} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Oluşturulma</p>
                    <p className="font-bold text-slate-900">{request.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <Clock size={18} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Son Güncelleme</p>
                    <p className="font-bold text-slate-900">{request.updatedAt}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Assignment */}
            {request.status !== 'closed' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-3">Atama</h4>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Atanacak kişi..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none mb-3"
                />
                <button
                  onClick={handleAssign}
                  disabled={isProcessing || request.status === 'resolved'}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <User size={18} />
                  Ata
                </button>
              </div>
            )}

            {/* Resolution */}
            {request.status === 'in_progress' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-3">Çözüm</h4>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Çözüm açıklaması..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none mb-3"
                  rows={4}
                />
                <button
                  onClick={handleResolve}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Çözüldü
                </button>
              </div>
            )}

            {/* Close */}
            {request.status === 'resolved' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-4">Talebi Kapat</h4>
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-xl font-bold hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Kapat
                </button>
              </div>
            )}

            {/* Info */}
            {request.assignedTo && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-4">Atanan</h4>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
                    <p className="font-bold text-blue-900">{request.assignedTo}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSupportRequestDetailPage;
