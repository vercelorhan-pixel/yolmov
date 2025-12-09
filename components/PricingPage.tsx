/**
 * Fiyat SEO Sayfası
 * URL: /fiyat/:service/:city
 * Örnek: /fiyat/cekici/istanbul
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, ChevronRight, Home, Calculator, TrendingUp, ChevronDown, ChevronUp, Info, CheckCircle } from 'lucide-react';
import EmergencyFloatingButton from './shared/EmergencyFloatingButton';
import { PRICING_SERVICES, PRICING_YEAR, CITIES_WITH_DISTRICTS } from '../constants';

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

const getPricingService = (slug: string) => {
  return PRICING_SERVICES.find(s => s.slug === slug) || null;
};

// Fiyat tablosu verileri
const PRICE_DATA: Record<string, { base: number; perKm: number; night: number; ranges: { label: string; price: string }[] }> = {
  'cekici': {
    base: 500,
    perKm: 15,
    night: 100,
    ranges: [
      { label: '0-10 km', price: '500 - 650 ₺' },
      { label: '10-25 km', price: '650 - 875 ₺' },
      { label: '25-50 km', price: '875 - 1.250 ₺' },
      { label: '50-100 km', price: '1.250 - 2.000 ₺' },
      { label: '100+ km', price: '2.000 ₺+' },
    ]
  },
  'oto-kurtarma': {
    base: 600,
    perKm: 18,
    night: 150,
    ranges: [
      { label: 'Standart Kurtarma', price: '600 - 900 ₺' },
      { label: 'Hendek/Çukur', price: '900 - 1.500 ₺' },
      { label: 'Ters Dönmüş Araç', price: '1.500 - 2.500 ₺' },
      { label: 'Su/Sel Kurtarma', price: '2.000 - 3.500 ₺' },
      { label: 'Ağır Vasıta', price: '3.000 ₺+' },
    ]
  },
  'lastik-degisimi': {
    base: 100,
    perKm: 5,
    night: 50,
    ranges: [
      { label: 'Yedek Lastik Montajı', price: '100 - 150 ₺' },
      { label: 'Lastik Tamiri', price: '75 - 125 ₺' },
      { label: 'Lastik Değişimi (İş Başı)', price: '150 - 250 ₺' },
      { label: 'Dört Lastik Değişimi', price: '400 - 600 ₺' },
      { label: 'Run-Flat Lastik', price: '200 - 350 ₺' },
    ]
  },
  'aku-takviyesi': {
    base: 150,
    perKm: 5,
    night: 50,
    ranges: [
      { label: 'Akü Takviyesi', price: '150 - 200 ₺' },
      { label: 'Akü Şarj', price: '100 - 150 ₺' },
      { label: 'Akü Değişimi (İş Başı)', price: '200 - 300 ₺' },
      { label: 'Akü + Montaj', price: '500 - 1.200 ₺' },
      { label: 'Premium Akü + Montaj', price: '1.200 - 2.500 ₺' },
    ]
  },
  'sehirler-arasi': {
    base: 5000,
    perKm: 12,
    night: 500,
    ranges: [
      { label: '0-200 km', price: '5.000 - 8.000 ₺' },
      { label: '200-400 km', price: '8.000 - 12.000 ₺' },
      { label: '400-600 km', price: '12.000 - 18.000 ₺' },
      { label: '600-1000 km', price: '18.000 - 28.000 ₺' },
      { label: '1000+ km', price: '28.000 ₺+' },
    ]
  },
  'yakit-yardimi': {
    base: 80,
    perKm: 5,
    night: 30,
    ranges: [
      { label: 'Yakıt Getirme (Hizmet)', price: '80 - 120 ₺' },
      { label: '5 Litre Benzin', price: '300 - 350 ₺' },
      { label: '10 Litre Benzin', price: '550 - 650 ₺' },
      { label: '5 Litre Dizel', price: '280 - 320 ₺' },
      { label: '10 Litre Dizel', price: '500 - 600 ₺' },
    ]
  },
};

const PricingPage: React.FC = () => {
  const { service, city } = useParams<{ service: string; city: string }>();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Verileri al
  const serviceData = service ? getPricingService(service) : null;
  const cityData = city ? getCityBySlug(city) : null;
  const priceData = service ? PRICE_DATA[service] : null;

  // Sayfa bulunamadıysa 404'e yönlendir
  useEffect(() => {
    if (!serviceData || !cityData || !priceData) {
      navigate('/404', { replace: true });
    }
  }, [serviceData, cityData, priceData, navigate]);

  // SEO meta etiketlerini dinamik olarak güncelle
  useEffect(() => {
    if (serviceData && cityData && priceData) {
      const title = `${cityData.name} ${serviceData.name} ${PRICING_YEAR} | Güncel Fiyat Listesi | Yolmov`;
      const description = `${cityData.name} ${serviceData.name.toLowerCase()} ${PRICING_YEAR} güncel fiyat listesi. ${priceData.base} TL'den başlayan fiyatlarla 7/24 hizmet. Hemen teklif alın!`;
      const keywords = [
        `${cityData.name} ${serviceData.name.toLowerCase()}`,
        `${serviceData.name.toLowerCase()} ${PRICING_YEAR}`,
        `${cityData.name} çekici fiyat`,
        `${serviceData.name.toLowerCase()} ne kadar`,
        `${cityData.name} yol yardım fiyatları`,
      ];
      const url = `/fiyat/${service}/${city}`;

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
    }
  }, [serviceData, cityData, priceData, service, city]);

  if (!serviceData || !cityData || !priceData) {
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
        serviceType: service === 'sehirler-arasi' ? 'cekici' : service,
        city: cityData.name,
        district: ''
      } 
    });
  };

  // FAQ verisi
  const faqs = [
    {
      question: `${cityData.name} ${serviceData.name.toLowerCase()} ne kadar?`,
      answer: `${cityData.name} için ${serviceData.name.toLowerCase()} ${priceData.base} TL'den başlamaktadır. Mesafe, araç tipi ve hizmet saatine göre fiyat değişebilir. Kesin fiyat için platform üzerinden teklif alabilirsiniz.`
    },
    {
      question: `${serviceData.name} gece tarifesi var mı?`,
      answer: `Evet, gece saatlerinde (22:00-07:00) ${priceData.night} TL ek ücret uygulanabilir. Ancak bazı partnerlerimiz 7/24 sabit fiyat sunmaktadır.`
    },
    {
      question: `${serviceData.name} km başına ne kadar?`,
      answer: `${cityData.name} için ${serviceData.name.toLowerCase()} km başına ortalama ${priceData.perKm} TL ücret alınmaktadır. Bu ücret mesafeye göre değişkenlik gösterebilir.`
    },
    {
      question: `${cityData.name} en ucuz ${serviceData.name.toLowerCase()} hangisi?`,
      answer: `Yolmov üzerinden birden fazla partnerden teklif alarak en uygun fiyatı bulabilirsiniz. Fiyatlar partner, mesafe ve araç tipine göre değişir.`
    },
    {
      question: `${serviceData.name} için kredi kartı geçerli mi?`,
      answer: `Evet, nakit, kredi kartı ve havale/EFT ile ödeme yapabilirsiniz. Bazı partnerlerimiz taksit imkanı da sunmaktadır.`
    }
  ];

  // Diğer şehirler
  const otherCities = Object.keys(CITIES_WITH_DISTRICTS)
    .filter(c => slugify(c) !== city)
    .slice(0, 8);

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${cityData.name} ${serviceData.name}`,
    "description": `${cityData.name} ${serviceData.name.toLowerCase()} hizmeti`,
    "provider": {
      "@type": "Organization",
      "name": "Yolmov",
      "url": "https://yolmov.com"
    },
    "areaServed": {
      "@type": "City",
      "name": cityData.name
    },
    "offers": {
      "@type": "Offer",
      "price": priceData.base,
      "priceCurrency": "TRY",
      "priceValidUntil": `${PRICING_YEAR}-12-31`
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
            <span>Fiyatlar</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span>{serviceData.name}</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-brand-orange font-medium">{cityData.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-dark to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="w-10 h-10 text-brand-orange" />
              <span className="bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full text-sm font-medium">
                {PRICING_YEAR} Güncel Fiyatlar
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {cityData.name} {serviceData.name}
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              {cityData.name} {serviceData.name.toLowerCase()} {PRICING_YEAR} yılı güncel fiyat listesi. 
              {priceData.base} TL'den başlayan fiyatlarla kaliteli hizmet.
            </p>
            
            {/* Ana Fiyat */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8 inline-block">
              <div className="text-sm text-gray-400 mb-1">Başlangıç Fiyatı</div>
              <div className="text-5xl font-bold text-brand-orange">{priceData.base} ₺</div>
              <div className="text-sm text-gray-400 mt-1">ve üzeri</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRequestService}
                className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" />
                Kesin Fiyat Al
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

      {/* Fiyat Tablosu */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-8 text-center">
              {cityData.name} {serviceData.name} Fiyat Tablosu
            </h2>
            
            <div className="bg-gray-50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-brand-dark text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Hizmet Tipi</th>
                    <th className="px-6 py-4 text-right">Fiyat Aralığı</th>
                  </tr>
                </thead>
                <tbody>
                  {priceData.ranges.map((range, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-gray-700">{range.label}</td>
                      <td className="px-6 py-4 text-right font-semibold text-brand-dark">{range.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-start gap-3 bg-blue-50 p-4 rounded-xl">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Not:</strong> Fiyatlar tahmini değerlerdir ve araç tipi, mesafe, saat dilimine göre değişebilir. 
                Kesin fiyat için platform üzerinden teklif alınız.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ek Bilgiler */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-8 text-center">
              Fiyatı Etkileyen Faktörler
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Mesafe</h3>
                    <p className="text-gray-600 text-sm">
                      Km başına ortalama {priceData.perKm} TL ücret eklenir. Uzun mesafelerde paket fiyat sunulabilir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Saat Dilimi</h3>
                    <p className="text-gray-600 text-sm">
                      Gece saatlerinde (22:00-07:00) {priceData.night} TL ek ücret uygulanabilir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Araç Tipi</h3>
                    <p className="text-gray-600 text-sm">
                      SUV, ticari araç veya ağır vasıtalar için fiyatlar farklılık gösterebilir.
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
                    <h3 className="font-semibold text-brand-dark mb-1">Ek Hizmetler</h3>
                    <p className="text-gray-600 text-sm">
                      Kapalı kasa, sigorta, yolcu taşıma gibi ek hizmetler için ek ücret alınır.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Neden Yolmov */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-8 text-center">
              Neden Yolmov'dan Teklif Almalısınız?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-brand-orange" />
                </div>
                <h3 className="font-semibold text-brand-dark mb-2">Rekabetçi Fiyat</h3>
                <p className="text-gray-600 text-sm">Birden fazla partnerden teklif alarak en uygun fiyatı bulun</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-brand-dark mb-2">Şeffaf Fiyatlama</h3>
                <p className="text-gray-600 text-sm">Gizli ücret yok, tüm maliyetler önceden belirtilir</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-brand-dark mb-2">Güvenilir Partnerler</h3>
                <p className="text-gray-600 text-sm">Doğrulanmış ve sigortalı hizmet sağlayıcılar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-8 text-center">
              Sık Sorulan Sorular
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl overflow-hidden"
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

      {/* Diğer Şehirler */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-6">
              Diğer Şehirlerde {serviceData.name}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {otherCities.map(c => (
                <Link
                  key={c}
                  to={`/fiyat/${service}/${slugify(c)}`}
                  className="bg-gray-50 px-4 py-3 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors text-sm flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Diğer Fiyat Sayfaları */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-6">
              {cityData.name} Diğer Hizmet Fiyatları
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRICING_SERVICES
                .filter(s => s.slug !== service)
                .map(s => (
                  <Link
                    key={s.slug}
                    to={`/fiyat/${s.slug}/${city}`}
                    className="bg-white px-4 py-3 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors text-sm flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    {s.name}
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
            {cityData.name} {serviceData.name} İçin Kesin Fiyat Alın!
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Tahmini fiyatlar yerine kesin fiyat için hemen teklif isteyin. 
            Birden fazla partnerden teklif alarak en uygun fiyatı bulun.
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

export default PricingPage;
