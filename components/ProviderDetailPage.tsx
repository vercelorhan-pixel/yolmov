
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Star, ShieldCheck, MapPin, Clock, 
  CreditCard, Truck, CheckCircle2, MessageSquare,
  ThumbsUp, Calendar, Navigation, Loader2, AlertCircle,
  Zap, Shield, Phone
} from 'lucide-react';
import { Provider, PartnerShowcaseData } from '../types';
import { PROVIDERS } from '../constants';
import { supabaseApi } from '../services/supabaseApi';
import { motion } from 'framer-motion';
import { CallPartnerButton } from './voice';

// Equipment labels mapping
const EQUIPMENT_LABELS: Record<string, { label: string; icon: string }> = {
  vinc: { label: 'Vinç', icon: '🏗️' },
  hidrolik_platform: { label: 'Hidrolik Platform', icon: '⬆️' },
  uzun_platform: { label: 'Uzun Platform', icon: '📏' },
  tekerleksiz_cekim: { label: 'Tekerleksiz Çekim', icon: '🔧' },
  otopark_cekimi: { label: 'Otopark Çekimi', icon: '🅿️' },
  gps_takip: { label: 'GPS Takip', icon: '📍' },
  gece_aydinlatma: { label: 'Gece Aydınlatma', icon: '💡' },
};

// Payment method labels
const PAYMENT_LABELS: Record<string, { label: string; icon: string }> = {
  nakit: { label: 'Nakit', icon: '💵' },
  kredi_karti: { label: 'Kredi Kartı', icon: '💳' },
  banka_havale: { label: 'Banka Havale/EFT', icon: '🏦' },
  firmaya_fatura: { label: 'Firmaya Fatura', icon: '📄' },
};

const ProviderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  
  // State for real data from Supabase
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showcaseData, setShowcaseData] = useState<PartnerShowcaseData | null>(null);
  
  // Try to get provider from location state (old flow for backwards compatibility)
  const providerFromState = location.state?.provider;
  
  // Load real showcase data from Supabase
  const loadShowcaseData = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseApi.partnerShowcase.getShowcaseData(id);
      
      if (data) {
        setShowcaseData(data);
      } else {
        // No real data found - will fall back to providerFromState or show error
        if (!providerFromState) {
          setError('Partner verileri bulunamadı');
        }
      }
    } catch (err) {
      console.error('Load showcase data error:', err);
      if (!providerFromState) {
        setError('Veriler yüklenirken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, [id, providerFromState]);
  
  useEffect(() => {
    // If we have state from listing, stop loading immediately for better UX
    if (providerFromState) {
      setLoading(false);
    }
    
    // Always try to load real showcase data to get full details
    if (id) {
      loadShowcaseData();
    }
  }, [id, providerFromState, loadShowcaseData]);
  
  // Loading state (only if no fallback data)
  if (loading && !providerFromState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-brand-orange animate-spin" />
          <p className="text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  // Error state (only if no fallback data)
  if (error && !showcaseData && !providerFromState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/liste')} className="text-brand-orange font-semibold">
            Listeye Dön
          </button>
        </div>
      </div>
    );
  }
  
  // Use real showcase data if available, otherwise fall back to provider from state
  const partner = showcaseData?.partner;
  const showcaseVehicle = showcaseData?.vehicles?.find(v => v.is_showcase_vehicle) || showcaseData?.vehicles?.[0];
  const reviews = showcaseData?.reviews || [];
  
  // Merge provider from state with real data for display
  const displayName = partner?.company_name || partner?.name || providerFromState?.name || 'İsimsiz Firma';
  const displayRating = partner?.rating || providerFromState?.rating || 4.5;
  const displayReviewCount = showcaseData?.totalReviews || providerFromState?.reviewCount || 0;
  // Partner profil fotoğrafı: önce profile_photo_url, sonra logo_url, sonra state'den gelen, son olarak avatar
  const displayImage = partner?.profile_photo_url || partner?.logo_url || providerFromState?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FF6B35&color=fff&size=128`;
  const displayDistance = providerFromState?.distance || '3.2 km';
  const displayEta = providerFromState?.eta || '15 dk';
  
  // Showcase specific data
  const showcaseDescription = partner?.showcase_description;
  const workingHours = partner?.showcase_is_24_7 ? '7/24 Açık' : partner?.showcase_working_hours;
  const paymentMethods = partner?.showcase_payment_methods || [];
  const responseTime = partner?.showcase_response_time;
  const satisfactionRate = partner?.showcase_satisfaction_rate;
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 md:py-10">
      <div className="container mx-auto px-4 md:px-8 lg:px-24 xl:px-32">
        
        {/* Back Navigation */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-orange font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Listeye Dön</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Route/Service Summary Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Hizmet Detayları</h2>
              
              <div className="flex flex-col md:flex-row gap-8 relative">
                {/* Vertical Line for Timeline */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100 md:hidden"></div>

                {/* Pickup */}
                <div className="flex gap-4 relative z-10">
                   <div className="flex flex-col items-center gap-1">
                      <div className="text-sm font-bold text-gray-900">00:00</div>
                      <div className="w-10 h-10 rounded-full border-2 border-brand-orange bg-white flex items-center justify-center z-10">
                         <MapPin size={18} className="text-brand-orange fill-brand-orange/20" />
                      </div>
                   </div>
                   <div className="pt-1">
                      <h3 className="font-bold text-gray-900 text-lg">Konumunuz</h3>
                      <p className="text-gray-500 text-sm">Mevcut GPS Konumu</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded">
                         {displayDistance} uzakta
                      </span>
                   </div>
                </div>

                {/* Duration - Desktop Only Visual */}
                <div className="hidden md:flex flex-1 flex-col items-center justify-center px-4">
                   <div className="text-xs font-bold text-gray-400 mb-2">{displayEta} tahmini varış</div>
                   <div className="w-full h-0.5 bg-gray-200 relative">
                      <div className="absolute right-0 -top-1.5 w-3 h-3 rounded-full bg-gray-300"></div>
                      <Truck className="absolute left-1/2 -top-3 -translate-x-1/2 text-brand-orange" size={20} />
                   </div>
                </div>

                {/* Destination (Simulated) */}
                <div className="flex gap-4 relative z-10">
                   <div className="flex flex-col items-center gap-1 md:hidden">
                      <div className="text-sm font-bold text-gray-900 text-opacity-0">00:00</div>
                      <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                         <Navigation size={18} className="text-gray-400" />
                      </div>
                   </div>
                   <div className="hidden md:flex flex-col items-center gap-1">
                      <div className="text-sm font-bold text-gray-900">~{parseInt(displayEta) + 15} dk</div>
                      <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                         <Navigation size={18} className="text-gray-400" />
                      </div>
                   </div>

                   <div className="pt-1">
                      <h3 className="font-bold text-gray-900 text-lg">En Yakın Servis</h3>
                      <p className="text-gray-500 text-sm">veya İstediğiniz Konum</p>
                   </div>
                </div>
              </div>
            </div>

            {/* 2. Provider Profile Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              <div className="relative shrink-0">
                <img 
                  src={displayImage} 
                  alt={displayName} 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-100">
                   <ShieldCheck className="text-blue-500 fill-blue-50" size={24} />
                </div>
              </div>
              
              <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <div>
                       <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h2>
                       <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-1 text-yellow-400">
                             <Star size={16} fill="currentColor" />
                             <span className="font-bold text-gray-900">{typeof displayRating === 'number' ? displayRating.toFixed(1) : displayRating}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500 text-sm underline cursor-pointer hover:text-brand-orange">
                             {displayReviewCount} değerlendirme
                          </span>
                       </div>
                    </div>
                 </div>

                 {/* Showcase Description - from real data */}
                 {showcaseDescription && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 bg-gray-50 p-4 rounded-xl">
                       {showcaseDescription}
                    </p>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                       <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                       <span>Doğrulanmış Profil</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                       <Clock size={18} className="text-blue-500 shrink-0" />
                       <span>{workingHours || '7/24 Hizmet Veriyor'}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                       <CreditCard size={18} className="text-purple-500 shrink-0" />
                       <span>
                          {paymentMethods.length > 0 
                             ? paymentMethods.map(m => PAYMENT_LABELS[m]?.label || m).slice(0, 2).join(', ')
                             : 'Kredi Kartı Geçerli'
                          }
                       </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                       {responseTime ? (
                          <>
                             <Zap size={18} className="text-green-600 shrink-0" />
                             <span>{responseTime} içinde yanıt</span>
                          </>
                       ) : satisfactionRate ? (
                          <>
                             <ThumbsUp size={18} className="text-brand-orange shrink-0" />
                             <span>%{satisfactionRate} Müşteri Memnuniyeti</span>
                          </>
                       ) : (
                          <>
                             <ThumbsUp size={18} className="text-brand-orange shrink-0" />
                             <span>%98 Müşteri Memnuniyeti</span>
                          </>
                       )}
                    </div>
                 </div>
              </div>
            </div>

            {/* 3. Vehicle Info */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
               <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  Araç Özellikleri
                  {showcaseVehicle?.is_showcase_vehicle && (
                     <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> Vitrin Aracı
                     </span>
                  )}
               </h3>
               <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3 aspect-video bg-gray-100 rounded-xl overflow-hidden relative group">
                     <img 
                        src={showcaseVehicle?.front_photo_url || "https://images.unsplash.com/photo-1605218427360-6982bc998200?auto=format&fit=crop&q=80&w=600"} 
                        alt="Tow Truck" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                     />
                     <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {showcaseVehicle ? `${showcaseVehicle.brand} ${showcaseVehicle.model}` : 'Çekici'}
                     </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Araç Tipi</p>
                        <p className="font-semibold text-gray-800">{showcaseVehicle?.vehicle_type || 'Kayar Kasa Çekici'}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Kapasite</p>
                        <p className="font-semibold text-gray-800">{showcaseVehicle?.showcase_capacity || showcaseVehicle?.capacity || '3.5 Ton\'a kadar'}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Sigorta</p>
                        <p className="font-semibold text-green-600">{showcaseVehicle?.showcase_insurance_type || 'Taşıma Kaskosu Var'}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Ekipman</p>
                        <p className="font-semibold text-gray-800">
                           {showcaseVehicle?.showcase_equipment?.length 
                              ? showcaseVehicle.showcase_equipment.slice(0, 2).map(eq => EQUIPMENT_LABELS[eq]?.label || eq).join(', ')
                              : 'Standart Ekipman'
                           }
                        </p>
                     </div>
                     <div className="col-span-2 pt-2">
                        <p className="text-gray-500 text-sm leading-relaxed">
                           {showcaseVehicle?.showcase_description || 'Aracımız son model olup, alçak şasi spor araçlar dahil tüm binek ve hafif ticari araçları hasarsız yükleme garantisi ile taşımaktadır.'}
                        </p>
                     </div>
                     {/* Equipment Tags */}
                     {showcaseVehicle?.showcase_equipment && showcaseVehicle.showcase_equipment.length > 0 && (
                        <div className="col-span-2 flex flex-wrap gap-2 pt-2">
                           {showcaseVehicle.showcase_equipment.map(eq => {
                              const info = EQUIPMENT_LABELS[eq];
                              return info ? (
                                 <span key={eq} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                                    <span>{info.icon}</span> {info.label}
                                 </span>
                              ) : null;
                           })}
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* 4. Reviews */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-gray-900">Son Değerlendirmeler</h3>
                  {displayReviewCount > 2 && (
                     <button className="text-brand-orange font-bold text-sm hover:underline">Tümünü Gör ({displayReviewCount})</button>
                  )}
               </div>
               
               {/* Real reviews from database */}
               {reviews.length > 0 ? (
                  <div className="space-y-6">
                     {reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="border-b border-gray-50 last:border-0 pb-6 last:pb-0">
                           <div className="flex justify-between mb-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                    <span className="font-bold text-gray-600 text-sm">{review.customer_name?.[0] || 'M'}</span>
                                 </div>
                                 <span className="font-bold text-sm text-gray-800">{review.customer_name || 'Müşteri'}</span>
                              </div>
                              <span className="text-xs text-gray-400">
                                 {review.created_at ? new Date(review.created_at).toLocaleDateString('tr-TR') : '-'}
                              </span>
                           </div>
                           <div className="flex text-yellow-400 mb-2">
                              {[1,2,3,4,5].map(s => (
                                 <Star 
                                    key={s} 
                                    size={12} 
                                    fill={s <= review.rating ? 'currentColor' : 'none'}
                                    className={s <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                 />
                              ))}
                           </div>
                           {review.comment && (
                              <p className="text-sm text-gray-600">{review.comment}</p>
                           )}
                        </div>
                     ))}
                  </div>
               ) : (
                  /* Fallback demo reviews if no real reviews */
               <div className="space-y-6">
                  {[1, 2].map((reviewIdx) => (
                     <div key={reviewIdx} className="border-b border-gray-50 last:border-0 pb-6 last:pb-0">
                        <div className="flex justify-between mb-2">
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                                 <img src={`https://i.pravatar.cc/150?img=${reviewIdx + 10}`} alt="User" />
                              </div>
                              <span className="font-bold text-sm text-gray-800">{reviewIdx === 1 ? 'Mehmet Y.' : 'Ayşe K.'}</span>
                           </div>
                           <span className="text-xs text-gray-400">{reviewIdx === 1 ? '2 gün önce' : '1 hafta önce'}</span>
                        </div>
                        <div className="flex text-yellow-400 mb-2">
                           {[1,2,3,4,5].map(s => <Star key={s} size={12} fill="currentColor" />)}
                        </div>
                        <p className="text-sm text-gray-600">
                           {reviewIdx === 1 
                              ? 'Çok hızlı geldiler. Aracımı özenle yüklediler. Kesinlikle tavsiye ederim, işini bilen profesyonel bir ekip.'
                              : 'Gece geç saatte aradım, hemen yola çıktılar. Fiyat da gayet makul. Teşekkürler!'
                           }
                        </p>
                     </div>
                  ))}
               </div>
               )}
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky Booking Card */}
          <div className="lg:col-span-4">
             <div className="sticky top-28 space-y-4">
                
                <div className="bg-white rounded-3xl p-6 shadow-lg shadow-brand-orange/5 border border-brand-orange/10">
                   <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Hemen Teklif Alın</h3>
                      <p className="text-sm text-gray-500">Detaylı fiyat bilgisi için teklif isteği gönderin</p>
                   </div>

                   <div className="space-y-3 mb-6 bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                         <CheckCircle2 size={16} className="text-green-500" />
                         <span>Ücretsiz Teklif</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                         <CheckCircle2 size={16} className="text-green-500" />
                         <span>Hızlı Yanıt Garantisi</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                         <CheckCircle2 size={16} className="text-green-500" />
                         <span>Net Fiyat, Ek Ücret Yok</span>
                      </div>
                   </div>

                   <button 
                      onClick={() => {
                        const customer = localStorage.getItem('yolmov_customer');
                        if (!customer) {
                          navigate('/giris-gerekli', { 
                            state: { 
                              message: 'Teklif almak için üye girişi yapmanız gerekiyor.',
                              returnUrl: '/teklif'
                            } 
                          });
                          return;
                        }
                        navigate('/teklif');
                      }}
                      className="w-full py-4 bg-brand-orange text-white rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-brand-lightOrange transition-all transform hover:-translate-y-1 active:scale-95 mb-3"
                   >
                      Teklif Al
                   </button>
                   
                   {/* Yolmov Voice - Hemen Ara Butonu */}
                   {id && (
                     <div className="mb-3">
                       <CallPartnerButton 
                         partnerId={id} 
                         partnerName={partner?.companyName || partner?.name}
                         variant="secondary"
                         size="md"
                         className="w-full"
                       />
                     </div>
                   )}
                   
                   <p className="text-xs text-center text-gray-400 px-4">
                      Teklifi onaylayana kadar herhangi bir ödeme alınmaz.
                   </p>
                </div>

                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3">
                   <MessageSquare className="text-blue-500 shrink-0 mt-1" size={20} />
                   <div>
                      <h4 className="font-bold text-sm text-blue-900">Soru Sor</h4>
                      <p className="text-xs text-blue-700 mt-1">
                         Hizmet vermeden önce sürücüyle iletişime geçebilirsiniz.
                      </p>
                      <button className="mt-2 text-xs font-bold text-blue-600 hover:underline">Mesaj Gönder</button>
                   </div>
                </div>

             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProviderDetailPage;
