import React from 'react';
import { X, User, Phone, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';

interface RequestLog {
  id: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
  amount?: number;
}

interface RequestDetailModalProps {
  request: RequestLog | null;
  onClose: () => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, onClose }) => {
  if (!request) return null;

  const statusConfig = {
    open: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Açık' },
    matched: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Eşleşti' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Tamamlandı' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'İptal' }
  };

  const status = statusConfig[request.status];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Talep Detayları</h2>
            <p className="text-sm text-slate-500 mt-1">#{request.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Durum Badge */}
        <div className="mb-6">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        {/* Müşteri Bilgileri */}
        <div className="mb-6 p-4 bg-slate-50 rounded-xl">
          <h3 className="text-sm font-bold text-slate-600 mb-3">Müşteri Bilgileri</h3>
          <div className="flex items-center gap-3">
            <User size={18} className="text-slate-400" />
            <p className="text-sm font-medium text-slate-900">{request.customerName}</p>
          </div>
        </div>

        {/* Talep Detayları */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <FileText size={20} className="text-blue-600 mb-2" />
            <p className="text-xs text-blue-600 mb-1">Hizmet Türü</p>
            <p className="text-lg font-bold text-blue-900">{request.serviceType}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <Calendar size={20} className="text-green-600 mb-2" />
            <p className="text-xs text-green-600 mb-1">Oluşturma Tarihi</p>
            <p className="text-lg font-bold text-green-900">{request.createdAt}</p>
          </div>
          {request.amount && (
            <div className="p-4 bg-orange-50 rounded-xl col-span-2">
              <DollarSign size={20} className="text-orange-600 mb-2" />
              <p className="text-xs text-orange-600 mb-1">Tutar</p>
              <p className="text-2xl font-bold text-orange-900">₺{request.amount}</p>
            </div>
          )}
        </div>

        {/* Açıklama */}
        <div className="mb-6 p-4 bg-slate-50 rounded-xl">
          <h3 className="text-sm font-bold text-slate-600 mb-2">Açıklama</h3>
          <p className="text-sm text-slate-700">
            Kadıköy - Beşiktaş arası araç çekme hizmeti talep edilmiştir. Araç başlatılamıyor.
          </p>
        </div>

        {/* İşlem Butonları */}
        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">
            Müşteri Profiline Git
          </button>
          {request.status === 'open' && (
            <button className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors">
              Talebi İptal Et
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
