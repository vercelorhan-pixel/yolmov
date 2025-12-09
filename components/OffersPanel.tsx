import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, Request, Offer } from '../types';
import supabaseApi from '../services/supabaseApi';
import { ArrowLeft, MapPin, CheckCircle2, XCircle, Clock, Handshake, FilePlus, Check, X, RefreshCcw, Eye, User, Phone, Navigation, ShieldCheck, DollarSign, Ban, Star, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusBadge = (status: Request['status']) => {
  const base = 'text-xs px-2 py-1 rounded font-bold';
  switch (status) {
    case 'open': return base + ' bg-blue-50 text-blue-600';
    case 'matched': return base + ' bg-green-50 text-green-600';
    case 'in_progress': return base + ' bg-yellow-50 text-yellow-600';
    case 'completed': return base + ' bg-gray-100 text-gray-600';
    case 'cancelled': return base + ' bg-red-50 text-red-600';
    default: return base + ' bg-gray-50 text-gray-500';
  }
};

const offerStatusBadge = (status: Offer['status']) => {
  const base = 'text-[10px] px-2 py-0.5 rounded font-bold';
  switch (status) {
    case 'sent': return base + ' bg-blue-50 text-blue-600';
    case 'accepted': return base + ' bg-green-50 text-green-600';
    case 'rejected': return base + ' bg-red-50 text-red-600';
    case 'withdrawn': return base + ' bg-gray-100 text-gray-500';
    default: return base + ' bg-gray-50 text-gray-500';
  }
};

const OffersPanel: React.FC = () => {
  const navigate = useNavigate();
  
  // Supabase session'dan customer al
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Manuel session kontrolü - localStorage
  useEffect(() => {
    const checkSession = async () => {
      try {
        // localStorage'dan session oku
        const sessionStr = localStorage.getItem('yolmov-auth-session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session?.user?.id) {
            const customerData = await supabaseApi.customers.getById(session.user.id);
            setCustomer(customerData);
          } else {
            navigate('/giris/musteri');
          }
        } else {
          // Session yok - giriş sayfasına yönlendir
          navigate('/giris/musteri');
        }
      } catch (error) {
        console.error('Session kontrol hatası:', error);
        navigate('/giris/musteri');
      } finally {
        setSessionLoading(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  
  // Yeni state'ler: İptal ve Değerlendirme
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [requestToCancel, setRequestToCancel] = useState<Request | null>(null);
  const [requestToRate, setRequestToRate] = useState<Request | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      if (customer) {
        console.log('🔵 [OffersPanel] Customer ID:', customer.id);
        const customerRequests = await supabaseApi.requests.getByCustomerId(customer.id);
        console.log('🔵 [OffersPanel] Loaded Requests:', customerRequests);
        setRequests(customerRequests);
      }
    };
    
    loadRequests();
    
    // Real-time subscription - Talep değişikliklerini dinle
    const subscription = supabaseApi.realtime.subscribeToRequests((payload) => {
      console.log('🔵 [OffersPanel] Request update:', payload);
      if (payload.eventType === 'UPDATE' && payload.new.customer_id === customer?.id) {
        // Seçili request güncellendi
        if (selectedRequest?.id === payload.new.id) {
          setSelectedRequest(payload.new);
        }
        // Request listesini yenile
        loadRequests();
      }
    });
    
    return () => {
      supabaseApi.realtime.unsubscribe(subscription);
    };
  }, [customer?.id]);

  const loadOffers = async (req: Request) => {
    setSelectedRequest(req);
    setLoadingOffers(true);
    console.log('🟡 [OffersPanel] Loading offers for request:', req.id);
    
    try {
      const requestOffers = await supabaseApi.offers.getByRequestId(req.id);
      console.log('🟡 [OffersPanel] Found offers:', requestOffers);
      setOffers(requestOffers);
      
      // Real-time subscription - Yeni teklifleri dinle
      const offerSubscription = supabaseApi.realtime.subscribeToOffers(req.id, (payload) => {
        console.log('🟡 [OffersPanel] Offer update:', payload);
        if (payload.eventType === 'INSERT') {
          setOffers(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setOffers(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
        }
      });
    } catch (error) {
      console.error('Failed to load offers:', error);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleAccept = async (offerId: string) => {
    try {
      await supabaseApi.offers.accept(offerId);
      if (selectedRequest && customer) {
        const updatedOffers = await supabaseApi.offers.getByRequestId(selectedRequest.id);
        setOffers(updatedOffers);
        const updatedRequests = await supabaseApi.requests.getByCustomerId(customer.id);
        setRequests(updatedRequests);
      }
    } catch (error) {
      console.error('Failed to accept offer:', error);
      alert('Teklif kabul edilemedi.');
    }
  };

  const handleReject = async (offerId: string) => {
    try {
      await supabaseApi.offers.reject(offerId);
      if (selectedRequest) {
        const updatedOffers = await supabaseApi.offers.getByRequestId(selectedRequest.id);
        setOffers(updatedOffers);
      }
    } catch (error) {
      console.error('Failed to reject offer:', error);
      alert('Teklif reddedilemedi.');
    }
  };

  // Müşteri talep iptal handler'ı
  const handleCancelRequest = (req: Request) => {
    setRequestToCancel(req);
    setShowCancelConfirm(true);
  };

  const confirmCancelRequest = async () => {
    if (!requestToCancel || !customer) return;
    
    try {
      if (requestToCancel.status !== 'open') {
        alert('Bu talep iptal edilemez. Sadece açık talepler iptal edilebilir.');
        return;
      }
      
      await supabaseApi.requests.updateStatus(requestToCancel.id, 'cancelled');
      const updatedRequests = await supabaseApi.requests.getByCustomerId(customer.id);
      setRequests(updatedRequests);
      
      if (selectedRequest?.id === requestToCancel.id) {
        setSelectedRequest(null);
        setOffers([]);
      }
      
      alert('Talep iptal edildi.');
    } catch (error) {
      console.error('Failed to cancel request:', error);
      alert('Talep iptal edilemedi.');
    } finally {
      setShowCancelConfirm(false);
      setRequestToCancel(null);
    }
  };

  // Müşteri değerlendirme handler'ı
  const handleOpenRating = (req: Request) => {
    setRequestToRate(req);
    setRatingValue(0);
    setRatingComment('');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!requestToRate || ratingValue === 0) {
      alert('Lütfen bir puan seçin.');
      return;
    }
    
    try {
      // Partner bilgisini request'ten al
      const partnerId = requestToRate.assignedPartnerId || '';
      const partnerName = requestToRate.assignedPartnerName || 'Partner';
      
      if (!partnerId) {
        alert('Partner bilgisi bulunamadı.');
        return;
      }
      
      // ⚠️ KRİTİK: partner_reviews.job_id, completed_jobs.id referansı alır
      // Önce bu request için completed_job kaydını bulmalıyız
      const completedJobs = await supabaseApi.completedJobs.getByCustomerId(customer?.id || '');
      
      console.log('🔵 [OffersPanel] Looking for completed job:', {
        requestId: requestToRate.id,
        customerId: customer?.id,
        totalCompletedJobs: completedJobs.length
      });
      
      // Request ID'ye göre completed job bul
      // NOT: completed_jobs.request_id kolonu migration ile eklenmiş olmalı
      const completedJob = completedJobs.find((job: any) => {
        console.log('🔍 Checking job:', {
          jobId: job.id,
          jobRequestId: job.request_id || job.requestId,
          targetRequestId: requestToRate.id,
          match: (job.request_id === requestToRate.id) || (job.requestId === requestToRate.id)
        });
        
        // Eğer request_id kolonu varsa kullan
        if (job.request_id) {
          return job.request_id === requestToRate.id;
        }
        if (job.requestId) {
          return job.requestId === requestToRate.id;
        }
        // Yoksa customer_id, partner_id ve tarih ile eşleştirmeye çalış
        return job.partner_id === partnerId && 
               job.customer_id === customer?.id &&
               Math.abs(new Date(job.completion_time).getTime() - new Date(requestToRate.createdAt).getTime()) < 24 * 60 * 60 * 1000;
      });
      
      if (!completedJob) {
        console.error('❌ Completed job not found for request:', requestToRate.id);
        console.error('Available completed jobs:', completedJobs);
        alert('Bu iş için tamamlama kaydı bulunamadı. Lütfen daha sonra tekrar deneyin.');
        return;
      }
      
      console.log('✅ Found completed job:', completedJob);
      
      // supabaseApi.partnerReviews kullanarak kaydet
      await supabaseApi.partnerReviews.create({
        jobId: completedJob.id, // ✅ completed_jobs.id kullan
        partnerId: partnerId,
        partnerName: partnerName,
        customerId: customer?.id || '',
        customerName: `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim(),
        service: requestToRate.serviceType,
        rating: ratingValue,
        comment: ratingComment,
        tags: [] // Müşteri tarafında tag seçimi yok şu an
      });
      
      alert('Değerlendirmeniz için teşekkürler!');
      setShowRatingModal(false);
      setRequestToRate(null);
    } catch (error) {
      console.error('Rating error:', error);
      alert('Değerlendirme kaydedilemedi.');
    }
  };

  // Loading state
  if (sessionLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Not logged in state (fallback)
  if (!customer) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Oturum bulunamadı</p>
          <button 
            onClick={() => navigate('/giris/musteri')}
            className="px-6 py-3 bg-brand-orange text-white rounded-xl font-bold"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/musteri/profil')} className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-orange text-sm font-bold"><ArrowLeft size={18}/> Geri</button>
          <h1 className="text-2xl font-display font-bold text-gray-900">Talepler & Teklifler</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Requests List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Taleplerim</h2>
                <button onClick={async () => {
                  if (customer) {
                    const updatedRequests = await supabaseApi.requests.getByCustomerId(customer.id);
                    setRequests(updatedRequests);
                  }
                }} className="text-xs font-bold flex items-center gap-1 text-gray-500 hover:text-brand-orange"><RefreshCcw size={14}/> Yenile</button>
              </div>
              {requests.length === 0 && (
                <div className="text-center py-12">
                  <FilePlus size={42} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-sm text-gray-500 mb-2">Henüz bir talep oluşturmadınız.</p>
                  <p className="text-xs text-gray-400">Quote sihirbazından veya geçici seed ile örnek talep ekleyebilirsiniz.</p>
                </div>
              )}
              <div className="space-y-3">
                {requests.map(r => (
                  <div key={r.id} className={`p-4 rounded-xl border transition-all group ${selectedRequest?.id === r.id ? 'border-brand-orange bg-orange-50/60' : 'border-gray-100 hover:border-brand-orange hover:bg-orange-50/40'}`}> 
                    <div onClick={() => loadOffers(r)} className="cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm text-gray-800 group-hover:text-brand-orange capitalize">{r.serviceType}</p>
                          <p className="text-xs text-gray-400 mt-0.5">#{r.id} • {new Date(r.createdAt).toLocaleString('tr-TR')}</p>
                        </div>
                        <span className={statusBadge(r.status)}>
                          {r.status === 'open' && 'Açık'}
                          {r.status === 'matched' && 'Eşleşti'}
                          {r.status === 'in_progress' && 'Yolda'}
                          {r.status === 'completed' && 'Tamamlandı'}
                          {r.status === 'cancelled' && 'İptal'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{r.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500">
                        <MapPin size={12} className="text-brand-orange" /> {r.fromLocation} {r.toLocation && (<><span className="text-gray-400">→</span> {r.toLocation}</>)}
                      </div>
                    </div>
                    {/* Action Buttons - İptal ve Değerlendirme */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      {r.status === 'open' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCancelRequest(r); }}
                          className="flex-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-100"
                        >
                          <Ban size={12}/> İptal Et
                        </button>
                      )}
                      {r.status === 'completed' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenRating(r); }}
                          className="flex-1 px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-bold flex items-center justify-center gap-1 hover:bg-yellow-100"
                        >
                          <Star size={12}/> Değerlendir
                        </button>
                      )}
                      {r.status === 'cancelled' && (
                        <span className="flex-1 px-3 py-2 text-center text-xs text-gray-400">İptal edildi</span>
                      )}
                      {r.status === 'matched' && (
                        <span className="flex-1 px-3 py-2 text-center text-xs text-blue-500 font-bold">Partner eşleşti</span>
                      )}
                      {r.status === 'in_progress' && (
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="text-xs text-yellow-600 font-bold text-center">
                            🚚 {r.assignedPartnerName || 'Partner'} yolda
                          </span>
                          {r.jobStage !== undefined && (
                            <div className="flex items-center gap-1 justify-center">
                              {[0,1,2,3,4].map(s => (
                                <div key={s} className={`w-6 h-1.5 rounded-full ${s <= (r.jobStage || 0) ? 'bg-yellow-500' : 'bg-gray-200'}`} />
                              ))}
                            </div>
                          )}
                          <span className="text-[10px] text-gray-500 text-center">
                            {r.jobStage === 0 && 'Yola çıktı'}
                            {r.jobStage === 1 && 'Konuma vardı'}
                            {r.jobStage === 2 && 'Yükleme yapılıyor'}
                            {r.jobStage === 3 && 'Teslimat yolunda'}
                            {r.jobStage === 4 && 'Tamamlandı'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Offers Panel */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">{selectedRequest ? 'Teklifler' : 'Bir talep seçin'}</h2>
                {selectedRequest && <span className={statusBadge(selectedRequest.status)}>{selectedRequest.status}</span>}
              </div>

              {!selectedRequest && (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                  <Handshake size={48} className="mb-4 text-gray-300" />
                  <p className="text-sm">Soldan bir talep seçerek gelen teklifleri görüntüleyin.</p>
                </div>
              )}

              {selectedRequest && loadingOffers && (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 animate-pulse">
                  <Clock size={42} className="mb-4 text-gray-300" />
                  <p className="text-sm">Teklifler yükleniyor...</p>
                </div>
              )}

              {selectedRequest && !loadingOffers && offers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                  <XCircle size={48} className="mb-4 text-gray-300" />
                  <p className="text-sm">Bu talep için henüz teklif gelmedi.</p>
                  <p className="text-xs text-gray-400 mt-1">Partnerler teklif verdiğinde burada gözükecek.</p>
                </div>
              )}

              {selectedRequest && !loadingOffers && offers.length > 0 && (
                <div className="space-y-3">
                  {offers.map(of => (
                    <div key={of.id} className="p-4 rounded-xl border border-gray-100 hover:border-brand-orange hover:bg-orange-50/40 transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm text-gray-800">Partner #{of.partnerId}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Teklif ID: {of.id}</p>
                        </div>
                        <span className={offerStatusBadge(of.status)}>{of.status}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="text-sm font-bold text-brand-orange">₺{of.price}</div>
                        <div className="text-xs text-gray-500">ETA: {of.etaMinutes} dk</div>
                      </div>
                      {of.message && <p className="text-xs text-gray-600 mt-2 line-clamp-2">"{of.message}"</p>}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setSelectedOffer(of)} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center gap-1 hover:bg-blue-100">
                          <Eye size={14}/> Detay
                        </button>
                        {of.status === 'sent' && (
                          <>
                            <button onClick={() => handleAccept(of.id)} className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-green-700"><Check size={14}/> Kabul</button>
                            <button onClick={() => handleReject(of.id)} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1 hover:bg-gray-200"><X size={14}/> Red</button>
                          </>
                        )}
                        {of.status === 'accepted' && (
                          <div className="flex items-center gap-1 text-green-600 text-xs font-bold"><CheckCircle2 size={16}/> Kabul edildi</div>
                        )}
                        {of.status === 'rejected' && (
                          <div className="flex items-center gap-1 text-red-600 text-xs font-bold"><XCircle size={16}/> Reddedildi</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Offer Detail Modal */}
      <AnimatePresence>
        {selectedOffer && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedOffer(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-orange to-orange-500 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Teklif Detayları</h3>
                    <p className="text-sm text-white/80 mt-1">#{selectedOffer.id}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOffer(null)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Partner Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
                    <User size={24} className="text-brand-orange" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Partner #{selectedOffer.partnerId}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <ShieldCheck size={12} className="text-green-500" /> Doğrulanmış Hizmet Sağlayıcı
                    </p>
                  </div>
                </div>

                {/* Price & ETA */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-green-600" />
                      <p className="text-xs font-bold text-green-600 uppercase">Teklif Fiyatı</p>
                    </div>
                    <p className="text-2xl font-bold text-green-700">₺{selectedOffer.price}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-blue-600" />
                      <p className="text-xs font-bold text-blue-600 uppercase">Varış Süresi</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{selectedOffer.etaMinutes} dk</p>
                  </div>
                </div>

                {/* Message */}
                {selectedOffer.message && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Partner Mesajı</p>
                    <p className="text-sm text-gray-700">"{selectedOffer.message}"</p>
                  </div>
                )}

                {/* Request Info */}
                {selectedRequest && (
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-3">Talep Bilgileri</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Navigation size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-gray-500 text-xs">Hizmet Türü</p>
                          <p className="font-bold text-gray-800 capitalize">{selectedRequest.serviceType}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-gray-500 text-xs">Konum</p>
                          <p className="font-bold text-gray-800">{selectedRequest.fromLocation}</p>
                          {selectedRequest.toLocation && (
                            <p className="text-gray-600 text-xs mt-1">→ {selectedRequest.toLocation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  <span className={offerStatusBadge(selectedOffer.status) + ' text-sm px-4 py-2'}>
                    {selectedOffer.status === 'sent' && 'Beklemede'}
                    {selectedOffer.status === 'accepted' && 'Kabul Edildi'}
                    {selectedOffer.status === 'rejected' && 'Reddedildi'}
                    {selectedOffer.status === 'withdrawn' && 'Geri Çekildi'}
                  </span>
                </div>

                {/* Actions */}
                {selectedOffer.status === 'sent' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => {
                        handleReject(selectedOffer.id);
                        setSelectedOffer(null);
                      }}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      Reddet
                    </button>
                    <button 
                      onClick={() => {
                        handleAccept(selectedOffer.id);
                        setSelectedOffer(null);
                      }}
                      className="flex-[2] px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg"
                    >
                      Teklifi Kabul Et
                    </button>
                  </div>
                )}

                {selectedOffer.status === 'accepted' && (
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <p className="text-sm font-bold text-green-700 mb-2">✓ Teklif Kabul Edildi</p>
                    <p className="text-xs text-green-600">Partner ile iletişim kurabilirsiniz.</p>
                    <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2 mx-auto">
                      <Phone size={14} /> İletişime Geç
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && requestToCancel && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Talebi İptal Et</h3>
                <p className="text-sm text-gray-600 mb-6">
                  <strong className="text-gray-800">#{requestToCancel.id}</strong> numaralı talebi iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
                  >
                    Vazgeç
                  </button>
                  <button 
                    onClick={confirmCancelRequest}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                  >
                    İptal Et
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && requestToRate && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRatingModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Hizmeti Değerlendir</h3>
                <p className="text-sm text-gray-600 mb-4">
                  <strong className="capitalize">{requestToRate.serviceType}</strong> hizmeti için puanınızı verin
                </p>
                
                {/* Star Rating */}
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingValue(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star 
                        size={36} 
                        className={star <= ratingValue ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>

                {/* Comment */}
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Yorumunuzu yazın (opsiyonel)"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                  rows={3}
                />

                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setShowRatingModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
                  >
                    Vazgeç
                  </button>
                  <button 
                    onClick={handleSubmitRating}
                    disabled={ratingValue === 0}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold ${ratingValue > 0 ? 'bg-brand-orange text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    Gönder
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OffersPanel;
