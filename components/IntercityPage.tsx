/**
 * Şehirler Arası Çekici SEO Sayfası
 * URL: /sehirlerarasi/:from/:to
 * Örnek: /sehirlerarasi/istanbul/ankara
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, Shield, ChevronRight, Home, Truck, Route, Calculator, ChevronDown, ChevronUp, ArrowRight, Map } from 'lucide-react';
import EmergencyFloatingButton from './shared/EmergencyFloatingButton';
import { CITIES_WITH_DISTRICTS, INTERCITY_ROUTES } from '../constants';

// Yardımcı fonksiyonlar
const slugify = (text: string): string => {
  const charMap: Record<string, string> = {
    'ı': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c',
    'İ': 'i', 'Ş': 's', 'Ğ': 'g', 'Ü': 'u', 'Ö': 'o', 'Ç': 'c'
  };
  return text
    .split('')
    .map(char => charMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

const getCityBySlug = (slug: string) => {
  for (const [cityName, districts] of Object.entries(CITIES_WITH_DISTRICTS)) {
    if (slugify(cityName) === slug) {
      return { name: cityName, slug, districts };
    }
  }
  return null;
};

// Şehirler arası mesafe ve fiyat tahminleri (yaklaşık)
const CITY_DISTANCES: Record<string, Record<string, { km: number; hours: number; price: number }>> = {
  'istanbul': {
    'ankara': { km: 450, hours: 5, price: 15000 },
    'izmir': { km: 480, hours: 5.5, price: 16000 },
    'antalya': { km: 700, hours: 8, price: 22000 },
    'bursa': { km: 155, hours: 2, price: 6000 },
    'adana': { km: 940, hours: 10, price: 28000 },
    'konya': { km: 660, hours: 7, price: 20000 },
    'gaziantep': { km: 1140, hours: 12, price: 35000 },
    'mersin': { km: 940, hours: 10, price: 28000 },
    'diyarbakir': { km: 1400, hours: 15, price: 42000 },
    'trabzon': { km: 1070, hours: 12, price: 32000 },
  },
  'ankara': {
    'istanbul': { km: 450, hours: 5, price: 15000 },
    'izmir': { km: 580, hours: 6.5, price: 18000 },
    'antalya': { km: 480, hours: 5.5, price: 16000 },
    'konya': { km: 260, hours: 3, price: 9000 },
    'adana': { km: 490, hours: 5.5, price: 16000 },
    'bursa': { km: 400, hours: 4.5, price: 13000 },
    'eskisehir': { km: 235, hours: 2.5, price: 8000 },
    'kayseri': { km: 320, hours: 3.5, price: 11000 },
    'samsun': { km: 420, hours: 4.5, price: 14000 },
    'trabzon': { km: 780, hours: 8.5, price: 24000 },
  },
  'izmir': {
    'istanbul': { km: 480, hours: 5.5, price: 16000 },
    'ankara': { km: 580, hours: 6.5, price: 18000 },
    'antalya': { km: 450, hours: 5, price: 15000 },
    'bursa': { km: 330, hours: 4, price: 11000 },
    'mugla': { km: 220, hours: 3, price: 8000 },
    'denizli': { km: 240, hours: 3, price: 8500 },
    'aydin': { km: 130, hours: 1.5, price: 5000 },
    'manisa': { km: 40, hours: 0.5, price: 2500 },
  }
};

// Varsayılan mesafe hesaplama (verisi olmayanlar için)
const getRouteInfo = (from: string, to: string) => {
  if (CITY_DISTANCES[from]?.[to]) {
    return CITY_DISTANCES[from][to];
  }
  if (CITY_DISTANCES[to]?.[from]) {
    return CITY_DISTANCES[to][from];
  }
  // Varsayılan tahmin
  return { km: 500, hours: 6, price: 17000 };
};

const IntercityPage: React.FC = () => {
  const { from, to } = useParams<{ from: string; to: string }>();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Verileri al
  const fromCity = from ? getCityBySlug(from) : null;
  const toCity = to ? getCityBySlug(to) : null;
  const routeInfo = from && to ? getRouteInfo(from, to) : null;

  // Sayfa bulunamadıysa 404'e yönlendir
  useEffect(() => {
    if (!fromCity || !toCity || from === to) {
      navigate('/404', { replace: true });
    }
  }, [fromCity, toCity, from, to, navigate]);

  // SEO meta etiketlerini dinamik olarak güncelle
  useEffect(() => {
    if (fromCity && toCity && routeInfo) {
      const title = `${fromCity.name} ${toCity.name} Çekici | Şehirler Arası Araç Taşıma | Yolmov`;
      const description = `${fromCity.name}'dan ${toCity.name}'a araç çekici hizmeti. ${routeInfo.km} km mesafe, ${routeInfo.hours} saat süre. ${routeInfo.price.toLocaleString()} TL'den başlayan fiyatlarla güvenli şehirler arası taşıma.`;
      const keywords = [
        `${fromCity.name} ${toCity.name} çekici`,
        `${fromCity.name} ${toCity.name} araç taşıma`,
        `şehirler arası çekici`,
        `${fromCity.name} ${toCity.name} oto kurtarma`,
        `uzun yol araç nakliyesi`,
      ];
      const url = `/sehirlerarasi/${from}/${to}`;

      document.title = title;
      
      // Meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);

      // Meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords.join(', '));

      // Canonical URL
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.href = `https://yolmov.com${url}`;

      // Open Graph
      const ogTags = [
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: `https://yolmov.com${url}` },
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
  }, [fromCity, toCity, routeInfo, from, to]);

  if (!fromCity || !toCity || !routeInfo || from === to) {
    return null;
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
        serviceType: 'cekici',
        city: fromCity.name,
        district: '',
        destination: toCity.name,
        isIntercity: true
      } 
    });
  };

  // FAQ verisi
  const faqs = [
    {
      question: `${fromCity.name}'dan ${toCity.name}'a araç çekici ücreti ne kadar?`,
      answer: `${fromCity.name}'dan ${toCity.name}'a çekici ücreti ortalama ${routeInfo.price.toLocaleString()} TL'den başlamaktadır. Araç tipi, boyutu ve ek hizmetlere göre fiyat değişebilir. Platform üzerinden kesin fiyat teklifi alabilirsiniz.`
    },
    {
      question: `${fromCity.name} ${toCity.name} arası ne kadar sürer?`,
      answer: `${fromCity.name}'dan ${toCity.name}'a araç taşıma yaklaşık ${routeInfo.hours} saat sürmektedir. Trafik ve hava koşullarına göre bu süre değişebilir.`
    },
    {
      question: `Şehirler arası çekici hizmeti sigortalı mı?`,
      answer: `Evet, Yolmov üzerinden aldığınız tüm şehirler arası çekici hizmetleri tam sigortalıdır. Taşıma sırasında oluşabilecek hasarlar güvence altındadır.`
    },
    {
      question: `${fromCity.name}'dan ${toCity.name}'a kapalı kasa çekici var mı?`,
      answer: `Evet, lüks araçlar, klasik arabalar ve özel taşıma gerektiren araçlar için kapalı kasa çekici hizmeti sunuyoruz.`
    },
    {
      question: `Aracımla birlikte ben de gidebilir miyim?`,
      answer: `Evet, çekici sürücüsü ile birlikte yolculuk edebilirsiniz. Bu hizmeti talep oluştururken belirtmeniz yeterli.`
    }
  ];

  // Popüler güzergahlar
  const popularRoutes = INTERCITY_ROUTES.highDemand
    .filter(r => r.from !== from && r.to !== to)
    .slice(0, 6);

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${fromCity.name} - ${toCity.name} Çekici Hizmeti`,
    "description": `${fromCity.name}'dan ${toCity.name}'a şehirler arası araç çekici ve taşıma hizmeti`,
    "provider": {
      "@type": "Organization",
      "name": "Yolmov",
      "url": "https://yolmov.com"
    },
    "areaServed": [
      { "@type": "City", "name": fromCity.name },
      { "@type": "City", "name": toCity.name }
    ],
    "offers": {
      "@type": "Offer",
      "price": routeInfo.price,
      "priceCurrency": "TRY"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-brand-orange flex items-center">
              <Home className="w-4 h-4 mr-1" />
              Ana Sayfa
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span>Şehirler Arası Çekici</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-brand-orange font-medium">{fromCity.name} → {toCity.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-dark via-gray-900 to-brand-dark text-white py-16 relative overflow-hidden">
        {/* Yol çizgileri efekti */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-white transform -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-yellow-400 transform -translate-y-1/2" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, #fbbf24 20px, #fbbf24 40px)' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-10 h-10 text-brand-orange" />
              <span className="bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full text-sm font-medium">
                Şehirler Arası Çekici
              </span>
            </div>
            
            {/* Güzergah Gösterimi */}
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur px-6 py-4 rounded-xl">
                <div className="text-sm text-gray-400">Kalkış</div>
                <div className="text-2xl font-bold">{fromCity.name}</div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 text-brand-orange">
                  <div className="w-8 h-0.5 bg-brand-orange"></div>
                  <ArrowRight className="w-6 h-6" />
                  <div className="w-8 h-0.5 bg-brand-orange"></div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur px-6 py-4 rounded-xl">
                <div className="text-sm text-gray-400">Varış</div>
                <div className="text-2xl font-bold">{toCity.name}</div>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {fromCity.name} {toCity.name} Çekici
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              {fromCity.name}'dan {toCity.name}'a güvenli ve sigortalı araç taşıma. 
              {routeInfo.km} km mesafe, yaklaşık {routeInfo.hours} saatte teslim.
            </p>
            
            {/* İstatistikler */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Route className="w-5 h-5 text-blue-400" />
                <span>{routeInfo.km} km</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-green-400" />
                <span>~{routeInfo.hours} saat</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5 text-yellow-400" />
                <span>Sigortalı</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRequestService}
                className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" />
                Teklif Al
              </button>
              <a
                href="tel:08503046050"
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 border border-white/30"
              >
                <Phone className="w-5 h-5" />
                0850 304 60 50
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Fiyat Kartı */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-brand-orange/10 to-brand-orange/5 rounded-2xl p-8 border border-brand-orange/20">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Mesafe</div>
                  <div className="text-3xl font-bold text-brand-dark">{routeInfo.km} km</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Tahmini Süre</div>
                  <div className="text-3xl font-bold text-brand-dark">{routeInfo.hours} saat</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Başlangıç Fiyatı</div>
                  <div className="text-3xl font-bold text-brand-orange">{routeInfo.price.toLocaleString()} ₺</div>
                </div>
              </div>
              <div className="mt-6 text-center text-sm text-gray-500">
                * Fiyatlar araç tipine, boyutuna ve ek hizmetlere göre değişebilir.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hizmet Özellikleri */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-8 text-center">
              Şehirler Arası Çekici Hizmet Özellikleri
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Tam Sigorta</h3>
                    <p className="text-gray-600 text-sm">
                      Tüm taşıma süreci boyunca aracınız sigorta güvencesi altındadır.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Kapıdan Kapıya</h3>
                    <p className="text-gray-600 text-sm">
                      Aracınızı {fromCity.name}'daki adresinizden alıp {toCity.name}'daki adresinize teslim ediyoruz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Map className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Canlı Takip</h3>
                    <p className="text-gray-600 text-sm">
                      Aracınızın konumunu anlık olarak takip edebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Profesyonel Ekip</h3>
                    <p className="text-gray-600 text-sm">
                      Deneyimli sürücüler ve profesyonel ekipmanlarla güvenli taşıma.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-8 text-center">
              Sık Sorulan Sorular
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 rounded-xl overflow-hidden"
                  itemScope
                  itemType="https://schema.org/Question"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-medium text-brand-dark" itemProp="name">{faq.question}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div 
                      className="px-5 pb-5 text-gray-600"
                      itemScope
                      itemType="https://schema.org/Answer"
                      itemProp="acceptedAnswer"
                    >
                      <span itemProp="text">{faq.answer}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ters Güzergah */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-600 mb-4">Ters yönde mi taşıma yapacaksınız?</p>
            <Link
              to={`/sehirlerarasi/${to}/${from}`}
              className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-xl text-brand-dark hover:text-brand-orange transition-colors shadow-sm"
            >
              <ArrowRight className="w-4 h-4 transform rotate-180" />
              {toCity.name} → {fromCity.name} Çekici
            </Link>
          </div>
        </div>
      </section>

      {/* Popüler Güzergahlar */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-6">
              Popüler Şehirler Arası Güzergahlar
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {popularRoutes.map((route, index) => (
                <Link
                  key={index}
                  to={`/sehirlerarasi/${route.from}/${route.to}`}
                  className="bg-gray-50 px-4 py-3 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors text-sm flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  {route.fromName} → {route.toName}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {fromCity.name}'dan {toCity.name}'a Güvenle Taşıyoruz!
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Aracınızı {routeInfo.km} km mesafeye güvenle ulaştırıyoruz. 
            Sigortalı taşıma, kapıdan kapıya hizmet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRequestService}
              className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Ücretsiz Teklif Al
            </button>
            <a
              href="tel:08503046050"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white/30"
            >
              0850 304 60 50
            </a>
          </div>
        </div>
      </section>

      <EmergencyFloatingButton />
    </div>
  );
};

export default IntercityPage;
