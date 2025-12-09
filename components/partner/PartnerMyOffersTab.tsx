import React from 'react';
import { Truck, Send, DollarSign, Clock, X, Info, CheckCircle, XCircle } from 'lucide-react';

interface Offer {
  id: string;
  requestId: string;
  status: 'sent' | 'accepted' | 'rejected' | 'withdrawn';
  price: number;
  etaMinutes: number;
  message?: string;
  createdAt: string;
}

interface PartnerMyOffersTabProps {
  myOffers: Offer[];
  setActiveTab: (tab: string) => void;
  handleCancelOffer: (offerId: string) => void;
}

const PartnerMyOffersTab: React.FC<PartnerMyOffersTabProps> = ({
  myOffers,
  setActiveTab,
  handleCancelOffer,
}) => {
  const sentOffers = myOffers.filter(o => o.status === 'sent');
  const acceptedOffers = myOffers.filter(o => o.status === 'accepted');
  const rejectedOffers = myOffers.filter(o => o.status === 'rejected');
  const withdrawnOffers = myOffers.filter(o => o.status === 'withdrawn');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">⏳ Beklemede</span>;
      case 'accepted':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✅ Kabul Edildi</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">❌ Reddedildi</span>;
      case 'withdrawn':
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">🚫 İptal Edildi</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Gönderilen Tekliflerim</h1>
        <p className="text-sm text-slate-600">Müşterilere gönderdiğiniz teklifleri takip edin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-bold mb-1">Beklemede</p>
          <p className="text-2xl font-black text-blue-700">{sentOffers.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 font-bold mb-1">Kabul Edildi</p>
          <p className="text-2xl font-black text-green-700">{acceptedOffers.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 font-bold mb-1">Reddedildi</p>
          <p className="text-2xl font-black text-red-700">{rejectedOffers.length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-600 font-bold mb-1">İptal Edildi</p>
          <p className="text-2xl font-black text-gray-700">{withdrawnOffers.length}</p>
        </div>
      </div>

      {/* Offers List */}
      {myOffers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Henüz Teklif Göndermediniz</h3>
          <p className="text-sm text-slate-600 mb-4">İş taleplerine teklif göndererek kazanmaya başlayın</p>
          <button
            onClick={() => setActiveTab('requests')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >
            İş Taleplerini Gör
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myOffers.map((offer) => {
            const canCancel = offer.status === 'sent';
            
            return (
              <div key={offer.id} className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Left: Offer Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Truck size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">Teklif #{offer.id.slice(0, 8)}</h3>
                          {getStatusBadge(offer.status)}
                        </div>
                        <p className="text-xs text-slate-500">
                          Talep: #{offer.requestId.slice(0, 8)} • {new Date(offer.createdAt).toLocaleDateString('tr-TR')} {new Date(offer.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {offer.message && (
                      <div className="ml-13 p-3 bg-slate-50 rounded-lg mb-3">
                        <p className="text-xs text-slate-600">{offer.message}</p>
                      </div>
                    )}

                    <div className="ml-13 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-green-600" />
                        <span className="font-bold text-slate-900">₺{offer.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-600" />
                        <span className="text-sm text-slate-600">{offer.etaMinutes} dakika</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOffer(offer.id)}
                        className="flex-1 lg:w-32 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={16} />
                        <span>İptal Et</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Info */}
                {offer.status === 'sent' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-blue-600 flex items-center gap-2">
                      <Info size={14} />
                      Müşteri teklifinizi değerlendiriyor. Bildirim geldiğinde haberdar olacaksınız.
                    </p>
                  </div>
                )}
                {offer.status === 'accepted' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-green-600 flex items-center gap-2">
                      <CheckCircle size={14} />
                      Tebrikler! Teklifiniz kabul edildi. Müşteriyle iletişime geçebilirsiniz.
                    </p>
                  </div>
                )}
                {offer.status === 'rejected' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-red-600 flex items-center gap-2">
                      <XCircle size={14} />
                      Teklifiniz reddedildi. Başka işlere teklif verebilirsiniz.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PartnerMyOffersTab;
