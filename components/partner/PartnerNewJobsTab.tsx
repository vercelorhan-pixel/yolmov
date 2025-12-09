import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, Navigation, Clock, AlertTriangle, LayoutList, Truck, Wrench,
  DollarSign, Send, ArrowRight, Loader2, X, CheckCircle, Star
} from 'lucide-react';
import { JobRequest, Request, Offer } from '../../types';

interface PartnerNewJobsTabProps {
  requests: JobRequest[];
  customerRequests: Request[];
  partnerServiceAreas: string[];
  serviceAreasLoaded: boolean;
  newJobsFilter: 'all' | 'nearest' | 'urgent';
  setNewJobsFilter: (filter: 'all' | 'nearest' | 'urgent') => void;
  unlockedJobs: string[];
  offeringJobId: string | null;
  offerError: string | null;
  myOffers: Offer[];
  setSelectedJobForDetail: (job: JobRequest | null) => void;
  setSelectedJobForQuote: (job: JobRequest | null) => void;
  setQuotePrice: (price: string) => void;
  setActiveTab: (tab: string) => void;
  handleOpenCustomerOfferModal: (request: Request) => void;
  handleStartOperation: (job: JobRequest) => void;
  handleCancelOffer: (offerId: string) => void;
}

const PartnerNewJobsTab: React.FC<PartnerNewJobsTabProps> = ({
  requests,
  customerRequests,
  partnerServiceAreas,
  serviceAreasLoaded,
  newJobsFilter,
  setNewJobsFilter,
  unlockedJobs,
  offeringJobId,
  offerError,
  myOffers,
  setSelectedJobForDetail,
  setSelectedJobForQuote,
  setQuotePrice,
  setActiveTab,
  handleOpenCustomerOfferModal,
  handleStartOperation,
  handleCancelOffer,
}) => {
  // Convert B2C requests to JobRequest format, keep reference to original
  const b2cJobRequests: (JobRequest & { _originalRequest?: Request })[] = customerRequests.map(req => ({
    id: req.id,
    serviceType: req.serviceType === 'cekici' ? 'Çekici Hizmeti' :
                 req.serviceType === 'aku' ? 'Akü Takviyesi' :
                 req.serviceType === 'lastik' ? 'Lastik Değişimi' :
                 req.serviceType === 'yakit' ? 'Yakıt Desteği' : 'Yol Yardımı',
    location: req.fromLocation,
    dropoffLocation: req.toLocation,
    distance: '~5 km', // Mock distance
    price: req.amount || 500, // Estimated
    timestamp: new Date(req.createdAt).toLocaleString('tr-TR'),
    customerName: req.customerName || 'B2C Müşteri',
    vehicleInfo: req.vehicleInfo || 'Belirtilmedi',
    urgency: 'normal' as const,
    notes: req.description,
    _originalRequest: req // Keep reference to original B2C request
  }));

  // Combine mock requests with B2C requests
  const allRequests: (JobRequest & { _originalRequest?: Request })[] = [...requests, ...b2cJobRequests];

  const filteredNewJobs = allRequests.filter(req => {
    if (newJobsFilter === 'nearest') return parseFloat(req.distance) < 10;
    if (newJobsFilter === 'urgent') return req.urgency === 'high';
    return true;
  });

  // Handler for offer button - routes to correct modal based on job type
  const handleOfferClick = (job: JobRequest & { _originalRequest?: Request }) => {
    if (job._originalRequest) {
      // B2C request - use customer offer modal
      handleOpenCustomerOfferModal(job._originalRequest);
    } else {
      // Mock job - use regular quote modal
      setSelectedJobForQuote(job);
      setQuotePrice(job.estimatedPrice?.toString() || '');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Hizmet Bölgesi Bilgisi */}
      {partnerServiceAreas.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-blue-800">Hizmet Bölgeniz:</span>
                {partnerServiceAreas.map((city, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    {city}
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Sadece bu bölgelerdeki iş talepleri gösterilmektedir
              </p>
            </div>
          </div>
        </div>
      )}
      
      {partnerServiceAreas.length === 0 && serviceAreasLoaded && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">Hizmet Bölgesi Tanımlı Değil</p>
              <p className="text-xs text-amber-600 mt-1">
                Ayarlar → Hizmet Bölgeleri'nden bölgenizi tanımlayın
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Tümü', icon: LayoutList },
            { id: 'nearest', label: 'En Yakın', icon: Navigation },
            { id: 'urgent', label: 'Acil İşler', icon: AlertTriangle },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setNewJobsFilter(filter.id as 'all' | 'nearest' | 'urgent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                newJobsFilter === filter.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }`}
            >
              <filter.icon size={16} /> {filter.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock size={16} />
          <span>{filteredNewJobs.length} Yeni İş</span>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredNewJobs.map(job => {
          const isUnlocked = unlockedJobs.includes(job.id);
          const isOffering = offeringJobId === job.id;
          const hasError = offerError === job.id;
          
          // Check if partner has already sent an offer for this job
          const myOfferForThisJob = myOffers.find(offer => 
            offer.requestId === job.id && 
            (offer.status === 'sent' || offer.status === 'accepted')
          );
          const hasPendingOffer = myOfferForThisJob && myOfferForThisJob.status === 'sent';
          const hasAcceptedOffer = myOfferForThisJob && myOfferForThisJob.status === 'accepted';
          
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-xl ${
                isUnlocked || hasAcceptedOffer ? 'border-green-300 bg-green-50/50' : 
                hasPendingOffer ? 'border-blue-300 bg-blue-50/50' :
                hasError ? 'border-red-300 bg-red-50/50' : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isUnlocked || hasAcceptedOffer ? 'bg-green-100 text-green-600' : 
                    hasPendingOffer ? 'bg-blue-100 text-blue-600' :
                    job._originalRequest ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {job.serviceType.includes('Çekici') ? <Truck size={24} /> : <Wrench size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{job.serviceType}</h3>
                    <p className="text-xs text-slate-500">#{job.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasPendingOffer && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock size={12} /> Beklemede
                    </span>
                  )}
                  {hasAcceptedOffer && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} /> Kabul Edildi
                    </span>
                  )}
                  {job._originalRequest && (
                    <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-full">
                      B2C
                    </span>
                  )}
                  {job.urgency === 'high' && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <AlertTriangle size={12} /> ACİL
                    </span>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3 mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Alınacak Konum</p>
                    <p className="font-bold text-slate-800">{job.location}</p>
                    <p className="text-xs text-blue-600 mt-1">📍 {job.distance} uzakta</p>
                  </div>
                </div>
                {job.dropoffLocation && (
                  <div className="flex items-start gap-2">
                    <Navigation size={16} className="text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Teslim Noktası</p>
                      <p className="font-bold text-slate-800">{job.dropoffLocation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-slate-600">{job.timestamp}</span>
                </div>
                {job.estimatedPrice && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={14} className="text-green-600" />
                    <span className="font-bold text-green-600">~₺{job.estimatedPrice}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedJobForDetail(job)}
                  className="flex-1 py-2 border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:border-blue-300 hover:text-blue-600 transition-all"
                >
                  İncele
                </button>
                
                {/* Teklif durumuna göre buton göster */}
                {hasPendingOffer ? (
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-200">
                      <Clock size={14} /> Teklif Değerlendiriliyor
                    </div>
                    <button
                      onClick={() => setActiveTab('offers')}
                      className="py-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Teklifimi Görüntüle →
                    </button>
                  </div>
                ) : hasAcceptedOffer ? (
                  <button
                    onClick={() => handleStartOperation(job)}
                    className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    Operasyonu Başlat <ArrowRight size={16} />
                  </button>
                ) : isUnlocked ? (
                  <button
                    onClick={() => handleStartOperation(job)}
                    className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    Operasyonu Başlat <ArrowRight size={16} />
                  </button>
                ) : isOffering ? (
                  <div className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-100">
                    <Loader2 size={14} className="animate-spin" /> Değerlendiriliyor...
                  </div>
                ) : hasError ? (
                  <div className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-red-100">
                    <AlertTriangle size={14} /> Ret Edildi
                  </div>
                ) : (
                  <button
                    onClick={() => handleOfferClick(job)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={16} /> Teklif Ver
                  </button>
                )}
              </div>
              
              {/* Teklif Bilgisi */}
              {myOfferForThisJob && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-600">Gönderdiğiniz Teklif</p>
                    {myOfferForThisJob.status === 'sent' && (
                      <span className="text-xs text-blue-600">⏳ Değerlendiriliyor</span>
                    )}
                    {myOfferForThisJob.status === 'accepted' && (
                      <span className="text-xs text-green-600">✅ Kabul Edildi</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} className="text-green-600" />
                      <span className="font-bold text-slate-900">₺{myOfferForThisJob.price}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-blue-600" />
                      <span className="text-slate-700">{myOfferForThisJob.etaMinutes} dk</span>
                    </div>
                    {myOfferForThisJob.status === 'sent' && (
                      <button
                        onClick={() => handleCancelOffer(myOfferForThisJob.id)}
                        className="ml-auto text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <X size={12} /> İptal Et
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredNewJobs.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Yeni İş Bulunamadı</h3>
          <p className="text-slate-500">Seçili filtreye uygun iş talebi yok</p>
        </div>
      )}
    </div>
  );
};

export default PartnerNewJobsTab;
