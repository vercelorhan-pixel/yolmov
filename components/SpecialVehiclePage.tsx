/**
 * Özel Araç Taşıma SEO Sayfası
 * URL: /tasima/:vehicleType/:city/:district
 * Örnek: /tasima/is-makinesi/zonguldak/gokcebey
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, Shield, ChevronRight, Home, Truck, Package, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import EmergencyFloatingButton from './shared/EmergencyFloatingButton';
import { SPECIAL_VEHICLE_TYPES, CITIES_WITH_DISTRICTS } from '../constants';

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

const getDistrictBySlug = (citySlug: string, districtSlug: string) => {
  const city = getCityBySlug(citySlug);
  if (!city) return null;
  
  const districtName = city.districts.find((d: string) => slugify(d) === districtSlug);
  if (districtName) {
    return { name: districtName, slug: districtSlug };
  }
  return null;
};

const getVehicleType = (slug: string) => {
  return SPECIAL_VEHICLE_TYPES.find(v => v.slug === slug) || null;
};

const SpecialVehiclePage: React.FC = () => {
  const { vehicleType, city, district } = useParams<{ vehicleType: string; city: string; district: string }>();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Verileri al
  const vehicleData = vehicleType ? getVehicleType(vehicleType) : null;
  const cityData = city ? getCityBySlug(city) : null;
  const districtData = city && district ? getDistrictBySlug(city, district) : null;

  // Sayfa bulunamadıysa 404'e yönlendir
  useEffect(() => {
    if (!vehicleData || !cityData || !districtData) {
      navigate('/404', { replace: true });
    }
  }, [vehicleData, cityData, districtData, navigate]);

  // SEO meta etiketlerini dinamik olarak güncelle
  useEffect(() => {
    if (vehicleData && cityData && districtData) {
      const title = `${districtData.name} ${vehicleData.name} | ${cityData.name} | Yolmov`;
      const description = `${cityData.name} ${districtData.name} ${vehicleData.name.toLowerCase()} hizmeti. ${vehicleData.description}. 7/24 profesyonel taşıma, sigortalı nakliye. Hemen teklif alın!`;
      const keywords = [
        `${districtData.name} ${vehicleData.name.toLowerCase()}`,
        `${cityData.name} ${vehicleData.name.toLowerCase()}`,
        `${vehicleData.name.toLowerCase()} hizmeti`,
        `${vehicleData.name.toLowerCase()} fiyatları`,
        `${districtData.name} nakliye`,
      ];
      const url = `/tasima/${vehicleType}/${city}/${district}`;

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
  }, [vehicleData, cityData, districtData, vehicleType, city, district]);

  if (!vehicleData || !cityData || !districtData) {
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
        city: cityData.name,
        district: districtData.name,
        vehicleType: vehicleData.name
      } 
    });
  };

  // FAQ verisi
  const faqs = [
    {
      question: `${districtData.name} ${vehicleData.name} ücreti ne kadar?`,
      answer: `${districtData.name} için ${vehicleData.name.toLowerCase()} ücreti mesafeye ve araç tipine göre değişir. Ortalama ${vehicleData.avgPrice.toLocaleString()} TL'den başlayan fiyatlarla hizmet verilmektedir. Platform üzerinden anında fiyat teklifi alabilirsiniz.`
    },
    {
      question: `${vehicleData.name} hizmeti sigortalı mı?`,
      answer: `Evet, Yolmov üzerinden aldığınız tüm ${vehicleData.name.toLowerCase()} hizmetleri sigortalıdır. Taşıma sırasında oluşabilecek hasarlar güvence altındadır.`
    },
    {
      question: `${districtData.name} ${vehicleData.name} ne kadar sürede gelir?`,
      answer: `${districtData.name} bölgesinde ortalama 30-60 dakika içinde ekiplerimiz yanınıza ulaşır. Özel araç taşıma için genellikle randevulu çalışılmaktadır.`
    },
    {
      question: `${vehicleData.name} için özel ekipman gerekli mi?`,
      answer: `${vehicleData.description}. Partnerlerimiz bu tip taşımalar için gerekli özel ekipmana sahiptir: hidrolik rampalar, güvenli sabitleme sistemleri ve kapalı kasa araçlar.`
    },
    {
      question: `${cityData.name} dışına ${vehicleData.name.toLowerCase().replace('taşıma', '').replace('çekici', '')} taşıyabilir misiniz?`,
      answer: `Evet, şehirler arası ${vehicleData.name.toLowerCase()} hizmeti de sunuyoruz. Türkiye'nin her yerine güvenli taşıma yapılmaktadır.`
    }
  ];

  // İlgili ilçeler
  const relatedDistricts = cityData.districts
    .filter((d: string) => slugify(d) !== district)
    .slice(0, 6);

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${districtData.name} ${vehicleData.name}`,
    "description": vehicleData.description,
    "provider": {
      "@type": "Organization",
      "name": "Yolmov",
      "url": "https://yolmov.com"
    },
    "areaServed": {
      "@type": "City",
      "name": `${cityData.name}, ${districtData.name}`
    },
    "offers": {
      "@type": "Offer",
      "price": vehicleData.avgPrice,
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
            <span>Özel Araç Taşıma</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span>{vehicleData.name}</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to={`/tasima/${vehicleType}/${city}/${slugify(cityData.districts[0])}`} className="hover:text-brand-orange">
              {cityData.name}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-brand-orange font-medium">{districtData.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-dark to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{vehicleData.icon}</span>
              <span className="bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full text-sm font-medium">
                Özel Taşıma Hizmeti
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {districtData.name} {vehicleData.name}
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              {cityData.name} {districtData.name} {vehicleData.description.toLowerCase()}. 
              Profesyonel ekip, sigortalı taşıma, uygun fiyat garantisi.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Sigortalı Taşıma</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>7/24 Hizmet</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Star className="w-5 h-5 text-yellow-400" />
                <span>Uzman Ekip</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRequestService}
                className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-5 h-5" />
                Hemen Teklif Al
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

      {/* Fiyat Bilgisi */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-brand-orange/10 to-brand-orange/5 rounded-2xl p-8 border border-brand-orange/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark mb-2">
                    {districtData.name} {vehicleData.name} Fiyatları
                  </h2>
                  <p className="text-gray-600">
                    Mesafe ve araç tipine göre fiyatlar değişkenlik gösterir
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">Başlangıç Fiyatı</div>
                  <div className="text-4xl font-bold text-brand-orange">
                    {vehicleData.avgPrice.toLocaleString()} ₺
                  </div>
                  <div className="text-sm text-gray-500">ve üzeri</div>
                </div>
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
              {vehicleData.name} Hizmet Özellikleri
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Özel Ekipman</h3>
                    <p className="text-gray-600 text-sm">
                      {vehicleData.name} için özel tasarlanmış platformlar ve sabitleme sistemleri
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Tam Sigorta</h3>
                    <p className="text-gray-600 text-sm">
                      Taşıma sırasında oluşabilecek tüm hasarlar sigorta kapsamında
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Deneyimli Sürücüler</h3>
                    <p className="text-gray-600 text-sm">
                      {vehicleData.name.toLowerCase()} konusunda uzmanlaşmış profesyonel ekip
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Kapalı Kasa</h3>
                    <p className="text-gray-600 text-sm">
                      Hava koşullarından etkilenmeden güvenli taşıma imkanı
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

      {/* Diğer İlçeler */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-6">
              {cityData.name} Diğer İlçelerde {vehicleData.name}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {relatedDistricts.map((d: string) => (
                <Link
                  key={d}
                  to={`/tasima/${vehicleType}/${city}/${slugify(d)}`}
                  className="bg-white px-4 py-3 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors text-sm flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {d} {vehicleData.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Diğer Araç Tipleri */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-6">
              {districtData.name} Diğer Özel Taşıma Hizmetleri
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SPECIAL_VEHICLE_TYPES
                .filter(v => v.slug !== vehicleType)
                .map(v => (
                  <Link
                    key={v.slug}
                    to={`/tasima/${v.slug}/${city}/${district}`}
                    className="bg-gray-50 px-4 py-3 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors text-sm flex items-center gap-2"
                  >
                    <span>{v.icon}</span>
                    {v.name}
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
            {districtData.name} {vehicleData.name} Hizmeti İçin Hemen Arayın!
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Profesyonel ekibimiz {vehicleData.name.toLowerCase()} için yanınızda. 
            Güvenli, sigortalı ve uygun fiyatlı hizmet.
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

export default SpecialVehiclePage;
