/**
 * Arama Sayfası - Panik Modu Yönlendirme Hedefi
 * URL Parameters:
 * - city: şehir slug'ı
 * - service: hizmet tipi (cekici, aku, lastik, yakit, anahtar)
 * - vehicle: araç tipi (binek, suv, ticari, motor)
 * - urgent: aciliyet (true/false)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Clock, Phone, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { getCityBySlug, getServiceInfo, ServiceType } from '../lib/seoData';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // URL parametrelerini al
  const citySlug = searchParams.get('city');
  const serviceParam = searchParams.get('service') as ServiceType;
  const vehicleType = searchParams.get('vehicle');
  const isUrgent = searchParams.get('urgent') === 'true';

  const cityData = citySlug ? getCityBySlug(citySlug) : null;
  const serviceInfo = serviceParam ? getServiceInfo(serviceParam) : null;

  // Analiz simülasyonu
  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Teklif formuna yönlendir
  const handleRequestQuote = () => {
    navigate('/teklif', {
      state: {
        prefilledCity: cityData?.name,
        prefilledService: serviceParam,
        prefilledVehicle: vehicleType,
        isUrgent: isUrgent
      }
    });
  };

  if (!cityData || !serviceInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Bilgi Eksik</h2>
          <p className="text-slate-600 mb-6">Arama için yeterli bilgi bulunamadı.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-lightOrange transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header Alert */}
      {isUrgent && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle size={20} className="animate-pulse" />
              <span className="font-bold">ACİL TALEBİNİZ ÖNCELİKLE İŞLENİYOR</span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        {/* Analyzing State */}
        {isAnalyzing ? (
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-orange to-red-600 rounded-full flex items-center justify-center animate-pulse mb-4">
                <Zap size={48} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Yapay Zeka Analiz Ediyor</h2>
              <p className="text-lg text-slate-600">
                {cityData.name} bölgesinde <strong>{serviceInfo.title}</strong> hizmeti için en uygun partnerleri buluyoruz...
              </p>
            </div>

            <div className="space-y-3">
              {[
                { text: 'Konum analizi yapılıyor...', delay: 0 },
                { text: `${cityData.name} bölgesi taranıyor...`, delay: 500 },
                { text: 'Uygun partnerler bulunuyor...', delay: 1000 },
                { text: 'Fiyatlar hesaplanıyor...', delay: 1500 }
              ].map((item, index) => (
                <div
                  key={index}
                  className="text-slate-500 animate-pulse"
                  style={{ animationDelay: `${item.delay}ms` }}
                >
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      {cityData.name} {serviceInfo.title} Hizmeti
                    </h1>
                    <p className="text-slate-600">
                      {isUrgent ? 'Acil talepler için öncelikli partnerler listelendi' : 'Bölgenizde aktif partnerler bulundu'}
                    </p>
                  </div>
                </div>

                {/* Search Summary */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <MapPin size={20} className="text-brand-orange" />
                    <div>
                      <div className="text-sm text-slate-500">Konum</div>
                      <div className="font-semibold text-slate-900">{cityData.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-brand-orange" />
                    <div>
                      <div className="text-sm text-slate-500">Hizmet</div>
                      <div className="font-semibold text-slate-900">{serviceInfo.title}</div>
                    </div>
                  </div>
                  {vehicleType && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚗</span>
                      <div>
                        <div className="text-sm text-slate-500">Araç</div>
                        <div className="font-semibold text-slate-900 capitalize">{vehicleType}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Urgency Badge */}
                {isUrgent && (
                  <div className="inline-flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full border border-red-200">
                    <Clock size={16} className="text-red-600" />
                    <span className="text-sm font-semibold text-red-600">Acil Talep - 15 Dakika İçinde</span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-brand-orange to-red-600 rounded-3xl p-12 text-white text-center shadow-2xl">
                <h2 className="text-4xl font-bold mb-4">
                  {isUrgent ? '⚡ Hemen Teklif Alın!' : 'Ücretsiz Teklif Alın'}
                </h2>
                <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                  {cityData.name} bölgesinde {serviceInfo.title} hizmeti için birden fazla partnere ulaşın. 
                  {isUrgent ? ' Acil talebiniz öncelikli olarak işlenecek.' : ' En uygun fiyatı seçin.'}
                </p>

                <button
                  onClick={handleRequestQuote}
                  className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 text-xl font-bold py-5 px-10 rounded-2xl hover:bg-slate-100 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                >
                  <Phone size={28} />
                  <span>TEKLİF TALEBİ OLUŞTUR</span>
                </button>

                <p className="text-white/70 text-sm mt-6">
                  ⚡ Ortalama yanıt süresi: {isUrgent ? '5-10 dakika' : '15-20 dakika'}
                </p>
              </div>

              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle size={24} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Onaylı Partnerler</h3>
                  <p className="text-slate-600 text-sm">
                    Tüm partnerler doğrulanmış ve sigortalıdır
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <Clock size={24} className="text-green-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Hızlı Müdahale</h3>
                  <p className="text-slate-600 text-sm">
                    {isUrgent ? '15 dakika içinde' : '30 dakika içinde'} yanınızda
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp size={24} className="text-orange-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">En İyi Fiyat</h3>
                  <p className="text-slate-600 text-sm">
                    Birden fazla teklif arasından seçim yapın
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
