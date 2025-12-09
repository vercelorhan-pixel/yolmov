import React from 'react';
import { X, DollarSign, Clock, User, Phone, FileText, Calendar } from 'lucide-react';

interface OfferLog {
  id: string;
  partnerId: string;
  partnerName: string;
  requestId: string;
  price: number;
  status: 'sent' | 'accepted' | 'rejected';
  createdAt: string;
}

interface OfferDetailModalProps {
  offer: OfferLog | null;
  onClose: () => void;
}

const OfferDetailModal: React.FC<OfferDetailModalProps> = ({ offer, onClose }) => {
  if (!offer) return null;

  const statusConfig = {
    sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Gönderildi' },
    accepted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Kabul Edildi' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Reddedildi' }
  };

  const status = statusConfig[offer.status];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Teklif Detayları</h2>
            <p className="text-sm text-slate-500 mt-1">#{offer.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Fiyat Kartı */}
        <div className="mb-6 p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Teklif Tutarı</p>
              <p className="text-4xl font-bold">₺{offer.price}</p>
            </div>
            <DollarSign size={48} className="opacity-20" />
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
            <Clock size={16} />
            <span>Tahmini Süre: 30-45 dk</span>
          </div>
        </div>

        {/* Durum */}
        <div className="mb-6">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        {/* Partner Bilgileri */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-xl">
            <User size={18} className="text-slate-400 mb-2" />
            <p className="text-xs text-slate-500">Partner</p>
            <p className="text-sm font-bold text-slate-900">{offer.partnerName}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <Phone size={18} className="text-slate-400 mb-2" />
            <p className="text-xs text-slate-500">Telefon</p>
            <p className="text-sm font-bold text-slate-900">0532 XXX XX XX</p>
          </div>
        </div>

        {/* Talep Bilgileri */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <FileText size={18} className="text-blue-600 mb-2" />
            <p className="text-xs text-blue-600">Talep ID</p>
            <p className="text-sm font-bold text-blue-900">{offer.requestId}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <Calendar size={18} className="text-green-600 mb-2" />
            <p className="text-xs text-green-600">Oluşturma</p>
            <p className="text-sm font-bold text-green-900">{offer.createdAt}</p>
          </div>
        </div>

        {/* İşlem Butonları */}
        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">
            Partner Profiline Git
          </button>
          <button className="flex-1 py-3 bg-slate-500 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors">
            Talep Detayına Git
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferDetailModal;
