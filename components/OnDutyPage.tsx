/**
 * Nöbetçi Servis SEO Sayfası
 * URL: /nobetci/:service/:city/:district
 * Örnek: /nobetci/lastikci/istanbul/kadikoy
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, Shield, ChevronRight, Home, Moon, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import EmergencyFloatingButton from './shared/EmergencyFloatingButton';
import { ON_DUTY_SERVICES, CITIES_WITH_DISTRICTS } from '../constants';

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

const getOnDutyService = (slug: string) => {
  return ON_DUTY_SERVICES.find(s => s.slug === slug) || null;
};

// Servis detayları
const SERVICE_DETAILS: Record<string, { icon: string; description: string; avgPrice: number; responseTime: string }> = {
  'lastikci': {
    icon: '🛞',
    description: 'Gece lastik patlaması, lastik değişimi ve yedek lastik montajı',
    avgPrice: 150,
    responseTime: '15-25 dakika'
  },
  'aku': {
    icon: '🔋',
    description: 'Gece akü takviyesi, akü değişimi ve şarj hizmeti',
    avgPrice: 200,
    responseTime: '10-20 dakika'
  },
  'cekici': {
    icon: '🚛',
    description: 'Gece oto çekici, yol yardım ve araç kurtarma hizmeti',
    avgPrice: 500,
    responseTime: '15-30 dakika'
  },
  'oto-elektrik': {
    icon: '⚡',
    description: 'Gece oto elektrik arızası, sigorta değişimi ve elektrik tamiri',
    avgPrice: 250,
    responseTime: '20-30 dakika'
  },
  'cam': {
    icon: '🪟',
    description: 'Gece oto cam tamiri, cam çatlağı onarımı ve acil cam değişimi',
    avgPrice: 300,
    responseTime: '25-40 dakika'
  }
};

const OnDutyPage: React.FC = () => {
  const { service, city, district } = useParams<{ service: string; city: string; district: string }>();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Verileri al
  const serviceData = service ? getOnDutyService(service) : null;
  const serviceDetails = service ? SERVICE_DETAILS[service] : null;
  const cityData = city ? getCityBySlug(city) : null;
  const districtData = city && district ? getDistrictBySlug(city, district) : null;

  // Sayfa bulunamadıysa 404'e yönlendir
  useEffect(() => {
    if (!serviceData || !serviceDetails || !cityData || !districtData) {
      navigate('/404', { replace: true });
    }
  }, [serviceData, serviceDetails, cityData, districtData, navigate]);

  // SEO meta etiketlerini dinamik olarak güncelle
  useEffect(() => {
    if (serviceData && serviceDetails && cityData && districtData) {
      const title = `${districtData.name} ${serviceData.name} | 7/24 Açık | ${cityData.name} | Yolmov`;
      const description = `${cityData.name} ${districtData.name} ${serviceData.name.toLowerCase()} 7/24 açık! ${serviceDetails.description}. Gece gündüz hizmet, hemen ara ${serviceDetails.responseTime} içinde yanınızda.`;
      const keywords = [
        `${districtData.name} ${serviceData.name.toLowerCase()}`,
        `${cityData.name} nöbetçi ${service}`,
        `24 saat ${service}`,
        `gece ${service}`,
        `${districtData.name} 7/24 ${service}`,
      ];
      const url = `/nobetci/${service}/${city}/${district}`;

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
  }, [serviceData, serviceDetails, cityData, districtData, service, city, district]);

  if (!serviceData || !serviceDetails || !cityData || !districtData) {
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
        serviceType: service === 'cekici' ? 'cekici' : service === 'aku' ? 'aku' : service === 'lastikci' ? 'lastik' : 'cekici',
        city: cityData.name,
        district: districtData.name
      } 
    });
  };

  // FAQ verisi
  const faqs = [
    {
      question: `${districtData.name} ${serviceData.name} şu an açık mı?`,
      answer: `Evet! ${districtData.name} ${serviceData.name} hizmeti 7 gün 24 saat açıktır. Gece yarısı bile arayabilirsiniz, ${serviceDetails.responseTime} içinde yanınızda oluruz.`
    },
    {
      question: `${districtData.name} ${serviceData.name} ücreti ne kadar?`,
      answer: `${districtData.name} için ${serviceData.name.toLowerCase()} ücreti ortalama ${serviceDetails.avgPrice} TL'den başlamaktadır. Gece tarifesi gündüz tarifesiyle aynıdır, ek ücret alınmaz.`
    },
    {
      question: `Gece ${serviceData.name.toLowerCase()} ne kadar sürede gelir?`,
      answer: `${districtData.name} bölgesinde gece saatlerinde ortalama ${serviceDetails.responseTime} içinde yanınıza ulaşırız. Trafik az olduğu için genellikle daha hızlı varırız.`
    },
    {
      question: `${serviceData.name} için kredi kartı geçerli mi?`,
      answer: `Evet, nakit ve kredi kartı ile ödeme yapabilirsiniz. Ayrıca havale/EFT seçeneği de mevcuttur.`
    },
    {
      question: `En yakın ${serviceData.name.toLowerCase()} nerede?`,
      answer: `Yolmov üzerinden talepinizi oluşturduğunuzda, size en yakın ${serviceData.name.toLowerCase()} hizmeti veren partner otomatik olarak yönlendirilir.`
    }
  ];

  // İlgili ilçeler
  const relatedDistricts = cityData.districts
    .filter((d: string) => slugify(d) !== district)
    .slice(0, 6);

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `${districtData.name} ${serviceData.name}`,
    "description": serviceDetails.description,
    "openingHours": "Mo-Su 00:00-24:00",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": districtData.name,
      "addressRegion": cityData.name,
      "addressCountry": "TR"
    },
    "priceRange": `${serviceDetails.avgPrice} TL+`
  };

  // Şu anki saat
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 22 || currentHour < 6;

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
            <span>Nöbetçi Servisler</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span>{serviceData.name}</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to={`/nobetci/${service}/${city}/${slugify(cityData.districts[0])}`} className="hover:text-brand-orange">
              {cityData.name}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-brand-orange font-medium">{districtData.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section - Gece teması */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-brand-dark text-white py-16 relative overflow-hidden">
        {/* Yıldız efekti */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{serviceDetails.icon}</span>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                7/24 AÇIK
              </span>
              {isNight && (
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Moon className="w-3 h-3" />
                  Gece Hizmeti Aktif
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {districtData.name} {serviceData.name}
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              {cityData.name} {districtData.name} {serviceDetails.description.toLowerCase()}. 
              Gece gündüz fark etmez, {serviceDetails.responseTime} içinde yanınızdayız!
            </p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-green-400" />
                <span>7/24 Açık</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>{serviceDetails.responseTime}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>Güvenilir Servis</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRequestService}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 animate-pulse"
              >
                <AlertTriangle className="w-5 h-5" />
                ACİL YARDIM AL
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

      {/* Acil Uyarı */}
      <section className="bg-yellow-50 border-y border-yellow-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">
              Yolda kaldıysanız panik yapmayın! Güvenli bir yere çekilin ve hemen bizi arayın.
            </p>
          </div>
        </div>
      </section>

      {/* Fiyat ve Süre Bilgisi */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-8 h-8 text-green-600" />
                  <h3 className="text-xl font-bold text-green-800">Ortalama Varış Süresi</h3>
                </div>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {serviceDetails.responseTime}
                </div>
                <p className="text-green-700 text-sm">
                  {districtData.name} bölgesi için tahmini süre
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="w-8 h-8 text-blue-600" />
                  <h3 className="text-xl font-bold text-blue-800">Başlangıç Fiyatı</h3>
                </div>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {serviceDetails.avgPrice} ₺
                </div>
                <p className="text-blue-700 text-sm">
                  Gece/gündüz aynı fiyat, ek ücret yok
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Neden Biz */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-8 text-center">
              Neden {districtData.name} {serviceData.name} İçin Yolmov?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Gerçek 7/24 Hizmet</h3>
                    <p className="text-gray-600 text-sm">
                      Gece 3'te de sizi yarı yolda bırakmayız. Tüm partnerlerimiz nöbetçi sistemle çalışır.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Hızlı Müdahale</h3>
                    <p className="text-gray-600 text-sm">
                      {districtData.name} bölgesinde {serviceDetails.responseTime} içinde yanınızda oluruz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark mb-1">Güvenilir Partnerler</h3>
                    <p className="text-gray-600 text-sm">
                      Tüm {serviceData.name.toLowerCase()} partnerlerimiz doğrulanmış ve sigortalıdır.
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
                    <h3 className="font-semibold text-brand-dark mb-1">Sabit Fiyat</h3>
                    <p className="text-gray-600 text-sm">
                      Gece tarifesi yok! Gece gündüz aynı fiyatla hizmet alırsınız.
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
              {cityData.name} Diğer İlçelerde {serviceData.name}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {relatedDistricts.map((d: string) => (
                <Link
                  key={d}
                  to={`/nobetci/${service}/${city}/${slugify(d)}`}
                  className="bg-white px-4 py-3 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors text-sm flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {d}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Diğer Nöbetçi Servisler */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-6">
              {districtData.name} Diğer Nöbetçi Servisler
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ON_DUTY_SERVICES
                .filter(s => s.slug !== service)
                .map(s => (
                  <Link
                    key={s.slug}
                    to={`/nobetci/${s.slug}/${city}/${district}`}
                    className="bg-gray-50 px-4 py-3 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors text-sm flex items-center gap-2"
                  >
                    <span>{SERVICE_DETAILS[s.slug]?.icon || '🔧'}</span>
                    {s.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Moon className="w-8 h-8" />
            <h2 className="text-3xl font-bold">
              Gece Gündüz Yanınızdayız!
            </h2>
          </div>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            {districtData.name} {serviceData.name} için hemen arayın. 
            {serviceDetails.responseTime} içinde yanınızda olalım.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRequestService}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Hemen Yardım Al
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

export default OnDutyPage;
