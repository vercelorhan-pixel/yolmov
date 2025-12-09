/**
 * SEO Optimized Service Page Component
 * Dinamik il/ilçe/hizmet sayfaları için
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, Shield, ChevronRight, Home, Search, Users, TrendingUp, MessageCircle, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import EmergencyFloatingButton from './shared/EmergencyFloatingButton';
import { getCityBySlug, getDistrictBySlug, getServiceInfo, generateSEOMetadata, ServiceType } from '../lib/seoData';

const SEOServicePage: React.FC = () => {
  const { service, city, district } = useParams<{ service: ServiceType; city: string; district: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  // SEO metadata
  const seoData = service && city && district ? generateSEOMetadata(city, district, service) : null;
  const cityData = city ? getCityBySlug(city) : null;
  const districtData = city && district ? getDistrictBySlug(city, district) : null;
  const serviceInfo = service ? getServiceInfo(service) : null;

  // Sayfa bulunamadıysa 404'e yönlendir
  useEffect(() => {
    if (!seoData || !cityData || !districtData || !serviceInfo) {
      navigate('/404', { replace: true });
    }
  }, [seoData, cityData, districtData, serviceInfo, navigate]);

  // SEO meta etiketlerini dinamik olarak güncelle
  useEffect(() => {
    if (seoData) {
      document.title = seoData.title;
      
      // Meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', seoData.description);

      // Meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', seoData.keywords.join(', '));

      // Canonical URL
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.href = `https://yolmov.com${seoData.url}`;

      // Open Graph
      const ogTags = [
        { property: 'og:title', content: seoData.title },
        { property: 'og:description', content: seoData.description },
        { property: 'og:url', content: `https://yolmov.com${seoData.url}` },
        { property: 'og:type', content: 'website' }
      ];

      ogTags.forEach(({ property, content }) => {
        let ogTag = document.querySelector(`meta[property="${property}"]`);
        if (!ogTag) {
          ogTag = document.createElement('meta');
          ogTag.setAttribute('property', property);
          document.head.appendChild(ogTag);
        }
        ogTag.setAttribute('content', content);
      });
    }
  }, [seoData]);

  if (!seoData || !cityData || !districtData || !serviceInfo) {
    return null; // Yönlendirme sırasında boş döndür
  }

  const handleRequestService = () => {
    const customerStr = localStorage.getItem('yolmov_customer');
    if (!customerStr) {
      navigate('/giris-gerekli', {
        state: {
          message: 'Teklif talebi oluşturmak için üye girişi yapmanız gerekiyor.',
          returnUrl: '/teklif'
        }
      });
      return;
    }
    navigate('/teklif', { 
      state: { 
        serviceType: service,
        city: cityData.name,
        district: districtData.name
      } 
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/arama?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // FAQ verisi - Google FAQ Snippet için
  const faqs = [
    {
      question: `${districtData.name} ${serviceInfo.shortTitle} ne kadar sürede gelir?`,
      answer: `${districtData.name} bölgesinde ortalama 15 dakika içinde yanınıza ulaşırız. Trafik yoğunluğuna göre bu süre 10-20 dakika arasında değişebilir.`
    },
    {
      question: `${districtData.name} ${serviceInfo.shortTitle} ücreti ne kadar?`,
      answer: `${districtData.name} için ${serviceInfo.shortTitle} ücreti konumunuza ve mesafeye göre değişir. Platform üzerinden anında fiyat teklifi alabilir, en uygun fiyatı seçebilirsiniz. Ortalama ${getServiceBasePrice(service)} TL'den başlayan fiyatlarla hizmet verilmektedir.`
    },
    {
      question: `${districtData.name} ${serviceInfo.shortTitle} 7/24 çalışıyor mu?`,
      answer: `Evet, Yolmov ${cityData.name} ${districtData.name} bölgesinde 7 gün 24 saat kesintisiz hizmet vermektedir. Gece yarısı bile arayabilirsiniz.`
    },
    {
      question: `${districtData.name} ${serviceInfo.shortTitle} nasıl çağırırım?`,
      answer: `Yolmov web sitesi veya mobil uygulaması üzerinden konumunuzu paylaşarak hemen talep oluşturabilirsiniz. Birkaç dakika içinde size yakın servislerden teklif almaya başlarsınız.`
    },
    {
      question: `${districtData.name} ${serviceInfo.shortTitle} güvenilir mi?`,
      answer: `Yolmov, tüm ${serviceInfo.shortTitle} hizmeti veren partnerleri doğrular, sigorta belgelerini kontrol eder ve müşteri yorumlarını takip eder. Sadece güvenilir ve deneyimli servislerle çalışırız.`
    }
  ];

  // Fiyat tahmini
  function getServiceBasePrice(serviceType: ServiceType): string {
    const prices: Record<ServiceType, string> = {
      'cekici': '500',
      'aku': '150',
      'lastik': '100',
      'yakit': '80',
      'anahtar': '200'
    };
    return prices[serviceType];
  }

  // Basit fiyat hesaplayıcı
  const calculatePrice = () => {
    const basePrice = parseInt(getServiceBasePrice(service!));
    const distance = Math.floor(Math.random() * 20) + 5; // 5-25 km arası
    const calculated = basePrice + (distance * 10);
    setEstimatedPrice(calculated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Breadcrumb - SEO için kritik */}
      <nav className="bg-white border-b border-slate-200 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Link to="/" className="hover:text-brand-orange transition-colors flex items-center gap-1">
              <Home size={16} />
              Ana Sayfa
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <Link to={`/${service}`} className="hover:text-brand-orange transition-colors">
              {serviceInfo.title}
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <Link to={`/${service}/${city}`} className="hover:text-brand-orange transition-colors">
              {cityData.name}
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-900">{districtData.name}</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-orange to-brand-lightOrange text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">{serviceInfo.icon}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">
                {districtData.name} {serviceInfo.shortTitle}
              </h1>
              <p className="text-orange-100 text-lg mt-1">
                {cityData.name} - {serviceInfo.title}
              </p>
            </div>
          </div>
          
          {/* Arama Kutusu */}
          <form onSubmit={handleSearch} className="mt-6 mb-4">
            <div className="relative max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${cityData.name} başka bir bölge veya hizmet ara...`}
                className="w-full py-4 px-6 pr-12 rounded-2xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-orange text-white p-2.5 rounded-xl hover:bg-orange-600 transition-colors"
              >
                <Search size={24} />
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Clock size={18} />
              <span className="font-semibold">15 Dakikada Varış</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Shield size={18} />
              <span className="font-semibold">7/24 Hizmet</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Star size={18} fill="currentColor" />
              <span className="font-semibold">Güvenilir Partnerler</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Users size={18} />
              <span className="font-semibold">{Math.floor(Math.random() * 500) + 1000}+ Kullanıcı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sol Kolon - İçerik */}
          <div className="md:col-span-2 space-y-6">
            {/* Ana Açıklama */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {districtData.name} Bölgesinde {serviceInfo.title}
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-slate-700 leading-relaxed">
                  <strong>{cityData.name} {districtData.name}</strong> bölgesinde aracınız mı arızalandı? 
                  Yolmov geniş hizmet ağıyla {districtData.name} genelinde size en yakın {serviceInfo.description} 
                  saniyeler içinde yönlendirir. 7/24 aktif nöbetçi ekiplerimiz sayesinde ortalama 15 dakikada yanınızdayız.
                </p>
                
                <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
                  Neden Yolmov {districtData.name}?
                </h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>{districtData.name} içinde</strong> ortalama 15 dakikada varış garantisi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Sabit ve şeffaf fiyat - <strong>gizli ücret yok</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span><strong>7/24 {cityData.name}</strong> geneli aktif nöbetçi servisler</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Doğrulanmış ve <strong>sigortalı partnerler</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Canlı konum takibi ve <strong>anlık iletişim</strong></span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
                  Nasıl Çalışır?
                </h3>
                <ol className="space-y-3 text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                    <span><strong>Talep Oluştur:</strong> {districtData.name} konumunuzdan hizmet talebinde bulunun</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                    <span><strong>Teklifleri İncele:</strong> En yakın servislerden anında fiyat alın</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                    <span><strong>Onaylayın:</strong> Size en uygun teklifi seçin ve onaylayın</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-brand-orange text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
                    <span><strong>Rahatlayın:</strong> Ekip yola çıktı, canlı takip edin</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 text-white shadow-xl">
              <h3 className="text-2xl font-bold mb-4">
                🚨 Acil {serviceInfo.title} Lazım mı?
              </h3>
              <p className="text-green-50 mb-6">
                {districtData.name} bölgesinde şu anda hizmet verebilecek {Math.floor(Math.random() * 8) + 3} aktif servis var. 
                Hemen talep oluşturun, 15 dakikada yanınızda olalım!
              </p>
              <button
                onClick={handleRequestService}
                className="w-full py-4 px-6 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all shadow-lg flex items-center justify-center gap-2 text-lg"
              >
                <Phone size={24} />
                HEMEN {districtData.name.toUpperCase()} {serviceInfo.shortTitle.toUpperCase()} ÇAĞIR
              </button>
              <p className="text-xs text-green-100 mt-3 text-center">
                💳 Kredi kartı bilgisi gerektirmez • Fiyatı gördükten sonra karar verin
              </p>
            </div>

            {/* Fiyat Hesaplayıcı Widget */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Calculator size={28} className="text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Tahmini Fiyat Hesapla</h3>
              </div>
              <p className="text-gray-700 mb-4">
                {districtData.name} bölgesinde {serviceInfo.shortTitle} hizmeti için yaklaşık fiyat öğrenin.
              </p>
              {estimatedPrice ? (
                <div className="bg-white rounded-2xl p-6 mb-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">Tahmini Ücret</p>
                  <p className="text-4xl font-black text-blue-600">{estimatedPrice} ₺</p>
                  <p className="text-xs text-gray-500 mt-2">*Mesafe ve duruma göre değişkenlik gösterebilir</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 mb-4 text-center text-gray-500">
                  <Calculator size={48} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Hesaplamak için butona tıklayın</p>
                </div>
              )}
              <button
                onClick={calculatePrice}
                className="w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
              >
                Fiyat Hesapla
              </button>
              <p className="text-xs text-gray-600 mt-3 text-center">
                Gerçek fiyat için teklif talep edin
              </p>
            </div>

            {/* FAQ Bölümü - Google Snippet için kritik */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Sıkça Sorulan Sorular
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                      {expandedFaq === index ? (
                        <ChevronUp size={20} className="text-brand-orange flex-shrink-0" />
                      ) : (
                        <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-5 py-4 bg-slate-50 text-slate-700 border-t border-slate-200">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Partner Ol CTA */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={32} />
                <h3 className="text-2xl font-bold">
                  {districtData.name} Bölgesinde Partner misiniz?
                </h3>
              </div>
              <p className="text-purple-100 mb-6 leading-relaxed">
                {cityData.name} {districtData.name} bölgesinde {serviceInfo.shortTitle} hizmeti mi veriyorsunuz? 
                Yolmov ile işinizi büyütün, daha fazla müşteriye ulaşın!
              </p>
              <ul className="space-y-2 mb-6 text-purple-50">
                <li className="flex items-start gap-2">
                  <span className="text-purple-200">✓</span>
                  <span>Her gün yeni müşteri fırsatları</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-200">✓</span>
                  <span>Komisyon ödemesi yok, sadece abonelik</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-200">✓</span>
                  <span>Dijital altyapı ve müşteri yönetimi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-200">✓</span>
                  <span>7/24 teknik destek</span>
                </li>
              </ul>
              <Link
                to="/partner-basvuru"
                className="block w-full py-4 px-6 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg text-center text-lg"
              >
                PARTNER BAŞVURUSU YAP
              </Link>
              <p className="text-xs text-purple-200 mt-3 text-center">
                Onay süreci 24 saat • Ücretsiz eğitim ve kurulum
              </p>
            </div>

            {/* Sosyal Kanıt */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-3xl p-8 border-2 border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle size={28} className="text-orange-600" />
                <h3 className="text-xl font-bold text-gray-900">Müşteri Yorumları</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Murat K.</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    "{districtData.name}'da gece yarısı aracım arızalandı, 20 dakikada geldiler. Çok memnun kaldım!"
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Ayşe D.</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    "Fiyatlar çok uygun ve şeffaf. {cityData.name}'da en iyi hizmet kesinlikle!"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Kolon - İlgili Linkler */}
          <div className="space-y-6">
            {/* Aynı İldeki Diğer İlçeler */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-brand-orange" />
                {cityData.name} Diğer Bölgeler
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cityData.districts
                  .filter(d => d.slug !== districtData.slug)
                  .slice(0, 15)
                  .map((d) => (
                    <Link
                      key={d.slug}
                      to={`/${service}/${cityData.slug}/${d.slug}`}
                      className="block text-sm text-slate-700 hover:text-brand-orange hover:bg-orange-50 px-3 py-2 rounded-lg transition-all"
                    >
                      {d.name} {serviceInfo.shortTitle} →
                    </Link>
                  ))}
              </div>
              {cityData.districts.length > 15 && (
                <button className="w-full mt-3 text-sm text-brand-orange font-semibold hover:underline">
                  Tümünü Gör ({cityData.districts.length - 15} daha)
                </button>
              )}
            </div>

            {/* Diğer Hizmetler */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">
                {districtData.name} Diğer Hizmetler
              </h3>
              <div className="space-y-2">
                {(['cekici', 'aku', 'lastik', 'yakit', 'anahtar'] as ServiceType[])
                  .filter(s => s !== service)
                  .map((s) => {
                    const otherService = getServiceInfo(s);
                    return (
                      <Link
                        key={s}
                        to={`/${s}/${cityData.slug}/${districtData.slug}`}
                        className="block text-sm text-slate-700 hover:text-brand-orange hover:bg-orange-50 px-3 py-2 rounded-lg transition-all flex items-center gap-2"
                      >
                        <span>{otherService.icon}</span>
                        <span>{otherService.title}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* İletişim */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl p-6 text-white">
              <h3 className="font-bold mb-3">Hızlı Hizmet</h3>
              <p className="text-slate-300 text-sm mb-4">
                7/24 platform üzerinden anında teklif alabilirsiniz.
              </p>
              <button
                onClick={() => {
                  const event = new CustomEvent('yolmov:navigate', { detail: { page: 'quote' } });
                  window.dispatchEvent(event);
                }}
                className="flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-3 px-4 rounded-xl hover:bg-slate-100 transition-all w-full"
              >
                <Phone size={20} />
                Teklif Al
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schema.org JSON-LD - SEO & Google Snippets */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          'name': `Yolmov ${districtData.name} ${serviceInfo.title}`,
          'description': seoData.description,
          'image': 'https://yolmov.com/og-image.jpg',
          'telephone': '+90-850-XXX-XXXX',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': districtData.name,
            'addressRegion': cityData.name,
            'addressCountry': 'TR'
          },
          'priceRange': '$$',
          'openingHours': 'Mo,Tu,We,Th,Fr,Sa,Su 00:00-23:59',
          'areaServed': {
            '@type': 'City',
            'name': cityData.name
          },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.8',
            'reviewCount': Math.floor(Math.random() * 500) + 200
          }
        })}
      </script>

      {/* BreadcrumbList Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Ana Sayfa',
              'item': 'https://yolmov.com'
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': serviceInfo.title,
              'item': `https://yolmov.com/${service}`
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': cityData.name,
              'item': `https://yolmov.com/${service}/${city}`
            },
            {
              '@type': 'ListItem',
              'position': 4,
              'name': districtData.name,
              'item': `https://yolmov.com${seoData.url}`
            }
          ]
        })}
      </script>

      {/* FAQ Schema - Google FAQ Rich Snippet */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': faqs.map(faq => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': faq.answer
            }
          }))
        })}
      </script>

      {/* HowTo Schema - Google HowTo Rich Snippet */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          'name': `${districtData.name} ${serviceInfo.shortTitle} Nasıl Çağırılır?`,
          'description': `${cityData.name} ${districtData.name} bölgesinde ${serviceInfo.title} hizmetini 4 adımda nasıl talep edeceğinizi öğrenin.`,
          'totalTime': 'PT5M',
          'estimatedCost': {
            '@type': 'MonetaryAmount',
            'currency': 'TRY',
            'value': getServiceBasePrice(service!)
          },
          'step': [
            {
              '@type': 'HowToStep',
              'position': 1,
              'name': 'Talep Oluştur',
              'text': `${districtData.name} konumunuzdan hizmet talebinde bulunun`,
              'image': 'https://yolmov.com/how-to-1.jpg'
            },
            {
              '@type': 'HowToStep',
              'position': 2,
              'name': 'Teklifleri İncele',
              'text': 'En yakın servislerden anında fiyat alın',
              'image': 'https://yolmov.com/how-to-2.jpg'
            },
            {
              '@type': 'HowToStep',
              'position': 3,
              'name': 'Onaylayın',
              'text': 'Size en uygun teklifi seçin ve onaylayın',
              'image': 'https://yolmov.com/how-to-3.jpg'
            },
            {
              '@type': 'HowToStep',
              'position': 4,
              'name': 'Rahatlayın',
              'text': 'Ekip yola çıktı, canlı takip edin',
              'image': 'https://yolmov.com/how-to-4.jpg'
            }
          ]
        })}
      </script>

      {/* Service Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          'serviceType': serviceInfo.title,
          'provider': {
            '@type': 'Organization',
            'name': 'Yolmov',
            'url': 'https://yolmov.com'
          },
          'areaServed': {
            '@type': 'City',
            'name': `${cityData.name} ${districtData.name}`
          },
          'availableChannel': {
            '@type': 'ServiceChannel',
            'serviceUrl': `https://yolmov.com${seoData.url}`
          },
          'hoursAvailable': {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday'
            ],
            'opens': '00:00',
            'closes': '23:59'
          }
        })}
      </script>

      {/* Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          'name': 'Yolmov',
          'url': 'https://yolmov.com',
          'logo': 'https://yolmov.com/logo.png',
          'description': 'Türkiye\'nin en hızlı yol yardım platformu',
          'contactPoint': {
            '@type': 'ContactPoint',
            'telephone': '+90-850-XXX-XXXX',
            'contactType': 'customer service',
            'areaServed': 'TR',
            'availableLanguage': 'Turkish'
          },
          'sameAs': [
            'https://www.facebook.com/yolmov',
            'https://www.instagram.com/yolmov',
            'https://www.twitter.com/yolmov',
            'https://www.linkedin.com/company/yolmov'
          ]
        })}
      </script>

      {/* Emergency Floating Button */}
      <EmergencyFloatingButton
        city={cityData.name}
        district={districtData.name}
        service={service!}
      />
    </div>
  );
};

export default SEOServicePage;
