/**
 * Özel Lokasyon SEO Sayfası
 * URL: /lokasyon/:slug
 * Örnek: /lokasyon/istanbul-havalimani
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, Shield, ChevronRight, Home, Truck, Plane, Factory, Car, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import EmergencyFloatingButton from './shared/EmergencyFloatingButton';
import { SPECIAL_LOCATIONS } from '../constants';

// Lokasyon tipine göre ikon
const getLocationIcon = (type: string) => {
  switch (type) {
    case 'airport': return Plane;
    case 'highway': return Navigation;
    case 'industrial': return Factory;
    case 'automotive': return Car;
    default: return MapPin;
  }
};

// Lokasyon tipine göre renk
const getLocationColor = (type: string) => {
  switch (type) {
    case 'airport': return 'blue';
    case 'highway': return 'green';
    case 'industrial': return 'purple';
    case 'automotive': return 'orange';
    default: return 'gray';
  }
};

// Lokasyon tipine göre başlık
const getLocationTypeTitle = (type: string) => {
  switch (type) {
    case 'airport': return 'Havalimanı';
    case 'highway': return 'Otoyol';
    case 'industrial': return 'Sanayi Bölgesi';
    case 'automotive': return 'Oto Sanayi';
    default: return 'Özel Lokasyon';
  }
};

const SpecialLocationPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Lokasyon verisini al
  const locationData = SPECIAL_LOCATIONS.find(l => l.slug === slug);
  const LocationIcon = locationData ? getLocationIcon(locationData.type) : MapPin;
  const locationColor = locationData ? getLocationColor(locationData.type) : 'gray';

  // Sayfa bulunamadıysa 404'e yönlendir
  useEffect(() => {
    if (!locationData) {
      navigate('/404', { replace: true });
    }
  }, [locationData, navigate]);

  // SEO meta etiketlerini dinamik olarak güncelle
  useEffect(() => {
    if (locationData) {
      const title = `${locationData.name} Çekici | 7/24 Yol Yardım | Yolmov`;
      const description = `${locationData.name} çekici ve yol yardım hizmeti. ${locationData.city} ${getLocationTypeTitle(locationData.type)} bölgesinde 7/24 oto kurtarma, lastik yardımı, akü takviyesi. Hızlı müdahale!`;
      const keywords = [
        `${locationData.name} çekici`,
        `${locationData.name} yol yardım`,
        `${locationData.name} oto kurtarma`,
        `${locationData.city} ${getLocationTypeTitle(locationData.type).toLowerCase()} çekici`,
        `${locationData.name} acil yardım`,
      ];
      const url = `/lokasyon/${slug}`;

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
  }, [locationData, slug]);

  if (!locationData) {
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
        city: locationData.city,
        district: '',
        specialLocation: locationData.name
      } 
    });
  };

  // FAQ verisi
  const faqs = [
    {
      question: `${locationData.name} çekici ne kadar sürede gelir?`,
      answer: `${locationData.name} bölgesinde çekicilerimiz ortalama 15-25 dakika içinde yanınıza ulaşır. Bölgeye yakın partnerlerimiz sayesinde hızlı müdahale sağlıyoruz.`
    },
    {
      question: `${locationData.name} çekici ücreti ne kadar?`,
      answer: `${locationData.name} bölgesinde çekici ücreti 500 TL'den başlamaktadır. Mesafe ve araç tipine göre fiyat değişebilir. Platform üzerinden anında teklif alabilirsiniz.`
    },
    {
      question: `${locationData.name} bölgesinde 7/24 çekici var mı?`,
      answer: `Evet, ${locationData.name} bölgesinde 7 gün 24 saat çekici hizmeti sunuyoruz. Gece gündüz fark etmez, her zaman yanınızdayız.`
    },
    {
      question: `${locationData.name} yakınında lastik patlarsa ne yapmalıyım?`,
      answer: `Güvenli bir şekilde yol kenarına çekilin, dörtlülerinizi açın ve Yolmov'u arayın. ${locationData.name} bölgesine en yakın lastikçimiz hemen yola çıkar.`
    },
    {
      question: `${locationData.name} bölgesinde akü takviyesi yapılıyor mu?`,
      answer: `Evet, ${locationData.name} bölgesinde akü takviyesi, akü değişimi ve şarj hizmeti sunuyoruz. 10-20 dakika içinde yanınızda oluruz.`
    }
  ];

  // Aynı tipteki diğer lokasyonlar
  const relatedLocations = SPECIAL_LOCATIONS
    .filter(l => l.type === locationData.type && l.slug !== slug)
    .slice(0, 4);

  // Aynı şehirdeki diğer lokasyonlar
  const sameCityLocations = SPECIAL_LOCATIONS
    .filter(l => l.city === locationData.city && l.slug !== slug)
    .slice(0, 4);

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `${locationData.name} Çekici Hizmeti`,
    "description": `${locationData.name} çekici ve yol yardım hizmeti`,
    "openingHours": "Mo-Su 00:00-24:00",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": locationData.name,
      "addressRegion": locationData.city,
      "addressCountry": "TR"
    }
  };

  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', gradient: 'from-blue-900 to-blue-800' },
    green: { bg: 'bg-green-100', text: 'text-green-600', gradient: 'from-green-900 to-green-800' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', gradient: 'from-purple-900 to-purple-800' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', gradient: 'from-orange-900 to-orange-800' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600', gradient: 'from-gray-900 to-gray-800' },
  };

  const colors = colorClasses[locationColor as keyof typeof colorClasses] || colorClasses.gray;

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
            <span>Özel Lokasyonlar</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span>{getLocationTypeTitle(locationData.type)}</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-brand-orange font-medium">{locationData.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className={`bg-gradient-to-br ${colors.gradient} text-white py-16`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                <LocationIcon className={`w-6 h-6 ${colors.text}`} />
              </div>
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                {getLocationTypeTitle(locationData.type)}
              </span>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                7/24 Aktif
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {locationData.name} Çekici
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              {locationData.city} {locationData.name} bölgesinde 7/24 çekici, yol yardım ve oto kurtarma hizmeti. 
              Hızlı müdahale, güvenilir servis.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-green-400" />
                <span>15-25 dk Varış</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>Sigortalı Hizmet</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <MapPin className="w-5 h-5 text-yellow-400" />
                <span>{locationData.city}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRequestService}
                className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-5 h-5" />
                Çekici Çağır
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

      {/* Hizmetler */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark mb-8 text-center">
              {locationData.name} Yol Yardım Hizmetleri
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-14 h-14 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-7 h-7 text-brand-orange" />
                </div>
                <h3 className="font-semibold text-brand-dark mb-2">Çekici</h3>
                <p className="text-gray-600 text-sm">Oto kurtarma ve çekme</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔋</span>
                </div>
                <h3 className="font-semibold text-brand-dark mb-2">Akü Takviyesi</h3>
                <p className="text-gray-600 text-sm">Akü şarj ve değişim</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛞</span>
                </div>
                <h3 className="font-semibold text-brand-dark mb-2">Lastik Yardımı</h3>
                <p className="text-gray-600 text-sm">Lastik değişimi</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⛽</span>
                </div>
                <h3 className="font-semibold text-brand-dark mb-2">Yakıt Yardımı</h3>
                <p className="text-gray-600 text-sm">Acil yakıt ikmali</p>
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

      {/* Aynı Şehirdeki Lokasyonlar */}
      {sameCityLocations.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-brand-dark mb-6">
                {locationData.city} Diğer Lokasyonlar
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sameCityLocations.map(loc => {
                  const LocIcon = getLocationIcon(loc.type);
                  return (
                    <Link
                      key={loc.slug}
                      to={`/lokasyon/${loc.slug}`}
                      className="bg-gray-50 px-4 py-3 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors text-sm flex items-center gap-2"
                    >
                      <LocIcon className="w-4 h-4" />
                      {loc.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Benzer Lokasyonlar */}
      {relatedLocations.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-brand-dark mb-6">
                Diğer {getLocationTypeTitle(locationData.type)} Lokasyonları
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {relatedLocations.map(loc => {
                  const LocIcon = getLocationIcon(loc.type);
                  return (
                    <Link
                      key={loc.slug}
                      to={`/lokasyon/${loc.slug}`}
                      className="bg-white px-4 py-3 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors text-sm flex items-center gap-2"
                    >
                      <LocIcon className="w-4 h-4" />
                      {loc.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-brand-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {locationData.name} Yolda Kaldınız mı?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            {locationData.name} bölgesinde 7/24 çekici ve yol yardım hizmeti sunuyoruz. 
            Hemen arayın, 15-25 dakika içinde yanınızda olalım.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRequestService}
              className="bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
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

export default SpecialLocationPage;
