import React, { useState } from 'react';
import { X, Mail, Phone, Star, DollarSign, Briefcase, CreditCard } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  completedJobs: number;
  credits: number;
  status: 'active' | 'pending' | 'suspended';
}

interface PartnerDetailModalProps {
  partner: Partner | null;
  onClose: () => void;
}

const PartnerDetailModal: React.FC<PartnerDetailModalProps> = ({ partner, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'fleet' | 'earnings' | 'history'>('info');

  if (!partner) return null;

  const statusConfig = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktif' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Onay Bekliyor' },
    suspended: { bg: 'bg-red-100', text: 'text-red-700', label: 'Askıda' }
  };

  const status = statusConfig[partner.status];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
              {partner.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{partner.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} className={i <= Math.floor(partner.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'} />
                  ))}
                  <span className="text-sm font-bold text-slate-700 ml-1">{partner.rating}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <Briefcase size={20} className="text-blue-600 mb-2" />
            <p className="text-xs text-blue-600 mb-1">Tamamlanan</p>
            <p className="text-xl font-bold text-blue-900">{partner.completedJobs}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <DollarSign size={20} className="text-green-600 mb-2" />
            <p className="text-xs text-green-600 mb-1">Kazanç</p>
            <p className="text-xl font-bold text-green-900">₺45,000</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl">
            <CreditCard size={20} className="text-orange-600 mb-2" />
            <p className="text-xs text-orange-600 mb-1">Kredi</p>
            <p className="text-xl font-bold text-orange-900">{partner.credits}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <Star size={20} className="text-purple-600 mb-2" />
            <p className="text-xs text-purple-600 mb-1">Araç Sayısı</p>
            <p className="text-xl font-bold text-purple-900">3</p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {[
            { id: 'info', label: 'Bilgiler' },
            { id: 'fleet', label: 'Filo' },
            { id: 'earnings', label: 'Kazançlar' },
            { id: 'history', label: 'Geçmiş' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeSubTab === tab.id 
                  ? 'text-orange-600 border-orange-600' 
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeSubTab === 'info' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Mail size={20} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">E-posta</p>
                  <p className="text-sm font-medium text-slate-900">{partner.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Phone size={20} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Telefon</p>
                  <p className="text-sm font-medium text-slate-900">{partner.phone}</p>
                </div>
              </div>
            </div>

            {/* İşlem Butonları */}
            <div className="flex gap-3 pt-4">
              <button className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors">
                Bilgileri Düzenle
              </button>
              <button className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors">
                Kredi Yükle
              </button>
              <button className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                partner.status === 'active' 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}>
                {partner.status === 'active' ? 'Askıya Al' : 'Aktif Et'}
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'fleet' && (
          <div className="text-center py-12 text-slate-500">
            Filo bilgileri burada görüntülenecek
          </div>
        )}

        {activeSubTab === 'earnings' && (
          <div className="text-center py-12 text-slate-500">
            Kazanç detayları burada görüntülenecek
          </div>
        )}

        {activeSubTab === 'history' && (
          <div className="text-center py-12 text-slate-500">
            İş geçmişi burada görüntülenecek
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerDetailModal;
