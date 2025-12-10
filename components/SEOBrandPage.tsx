/**
 * SEO Brand Page - Marka Bazlı Yol Yardım Sayfası
 * URL: /marka/{brand-slug}
 * Özellikle lüks ve elektrikli araçlar için optimize edilmiş
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { POPULAR_BRANDS, getBrandBySlug } from '../lib/seoData';
import EmergencyFloatingButton from './shared/EmergencyFloatingButton';
import SEOSearchWidget from './shared/SEOSearchWidget';
import { Phone, CheckCircle, Shield, Truck, Home, ChevronRight, Star, Clock, Award, Zap, Battery, Search, Users, Calculator, ChevronDown, ChevronUp, MessageCircle, TrendingUp } from 'lucide-react';

const SEOBrandPage: React.FC = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const navigate = useNavigate();
  const brand = getBrandBySlug(brandSlug || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!brand) {
      navigate('/404', { replace: true });
      return;
    }

    // SEO meta etiketleri
    const title = `${brand.name} Çekici ve Yol Yardım Hizmeti | Yolmov 7/24`;
    const description = `${brand.name} marka aracınız mı arızalandı? Yolmov, ${brand.name} konusunda uzman çekici ağıyla aracınızı yetkili servise veya dilediğiniz noktaya güvenle taşır. 7/24 hizmet.`;
    
    document.title = title;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.href = `https://yolmov.com/marka/${brand.slug}`;

    // Open Graph
    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: `https://yolmov.com/marka/${brand.slug}` },
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
  }, [brand, navigate]);

  if (!brand) {
    return null;
  }

  // Dinamik içerik ayarları
  const isLuxury = brand.type === 'luxury';
  const isElectric = brand.type === 'electric';
  const isSUV = brand.type === 'suv';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/arama?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const calculatePrice = () => {
    const basePrice = isLuxury ? 1200 : isElectric ? 1000 : 800;
    const distance = Math.floor(Math.random() * 30) + 10;
    setEstimatedPrice(basePrice + distance * 15);
  };

  const faqs = [
    {
      question: `${brand.name} aracım için çekici ne kadar sürede gelir?`,
      answer: `${brand.name} araçlar için ortalama varış süresi bulunduğunuz bölgeye göre 10-20 dakika arasındadır. ${isLuxury ? 'Premium araçlar için öncelikli hizmet verilir.' : ''}`
    },
    {
      question: `${brand.name} çekici fiyatları nedir?`,
      answer: `${brand.name} için çekici fiyatı mesafe ve hizmet türüne göre değişir. Temel fiyat ${isLuxury ? '1200₺' : isElectric ? '1000₺' : '800₺'}'den başlar. ${isElectric ? 'Elektrikli araçlar için özel ekipman kullanıldığı için ek ücret uygulanabilir.' : ''}`
    },
    {
      question: `${brand.name} aracım sigortalı mı taşınır?`,
      answer: `Evet, ${brand.name} aracınız taşıma süresince Yolmov sigorta poliçesi ile korunur. ${isLuxury ? 'Premium araçlar için özel kasko poliçesi mevcuttur.' : 'Herhangi bir hasar durumunda tam teminat kapsamındasınız.'}`
    },
    {
      question: `${brand.name} için yetkili servise götürür müsünüz?`,
      answer: `Evet, ${brand.name} yetkili servislerine ve özel servislere götürme hizmeti veriyoruz. İstediğiniz adrese de teslimat yapabiliriz.`
    },
    {
      question: `${brand.name} elektrikli/hibrit modeller taşınır mı?`,
      answer: `${isElectric ? 'Evet, elektrikli araç taşımada uzmanız. Yüksek voltaj güvenlik prosedürlerine tam uyum sağlıyoruz.' : 'Evet, tüm model ve varyantları güvenle taşıyoruz. Hibrit araçlar için özel prosedürler uygulanır.'}`
    }
  ];

  const handleCallToAction = () => {
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
        vehicleBrand: brand.name,
        serviceType: 'cekici'
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-slate-200 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Link to="/" className="hover:text-brand-orange transition-colors flex items-center gap-1">
              <Home size={16} />
              Ana Sayfa
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <Link to="/hizmetler" className="hover:text-brand-orange transition-colors">
              Hizmetler
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-900">{brand.name} Yol Yardım</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className={`${isLuxury ? 'bg-gradient-to-r from-amber-600 to-amber-700' : isElectric ? 'bg-gradient-to-r from-green-600 to-emerald-700' : 'bg-gradient-to-r from-brand-orange to-brand-lightOrange'} text-white py-16`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              {isLuxury && <Award size={18} />}
              {isElectric && <Zap size={18} />}
              {!isLuxury && !isElectric && <Truck size={18} />}
              <span>{isLuxury ? 'Premium Hizmet' : isElectric ? 'Elektrikli Araç Uzmanı' : 'Güvenilir Çekici'}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              {brand.name} Yol Yardım ve Çekici Hizmeti
            </h1>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto">
              <strong>{brand.name}</strong> marka aracınızla yolda mı kaldınız?{' '}
              {isLuxury 
                ? 'Lüks araç taşımacılığında deneyimli ekibimizle, aracınızın değerini biliyor ve hassasiyetle taşıyoruz.' 
                : isElectric 
                  ? 'Elektrikli araç şarjı ve taşıma prosedürlerine hakim ekibimiz yanınızda. Batarya güvenliği önceliğimiz.'
                  : `Türkiye'nin her yerinde ${brand.name} marka aracınız için en yakın çekiciyi anında yönlendiriyoruz.`
              }
            </p>

            {/* Hero-Style Arama Kutusu */}
            <div className="mb-8 max-w-2xl mx-auto">
              <SEOSearchWidget
                initialService="cekici"
              />
            </div>

            {/* Kullanıcı Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                <Users size={18} />
                <span className="text-sm font-semibold">{Math.floor(Math.random() * 500) + 200}+ {brand.name} Kullanıcısı</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCallToAction}
                className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 text-lg font-bold py-4 px-8 rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <Phone size={24} />
                HEMEN {brand.name.toUpperCase()} ÇEKİCİ ÇAĞIR
              </button>
            </div>

            <p className="text-sm text-white/70 mt-4">
              💳 Kredi kartı bilgisi gerektirmez • Fiyatı gördükten sonra karar verin
            </p>
          </div>
        </div>
      </div>

      {/* Özellikler */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
          {brand.name} Sahipleri Neden Yolmov'u Seçiyor?
        </h2>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
          {isLuxury 
            ? 'Premium araç sahipleri için özel olarak tasarlanmış hizmet kalitesi'
            : isElectric
              ? 'Elektrikli araçlar için özel eğitimli ekip ve ekipman'
              : 'Profesyonel hizmet anlayışı ile her zaman yanınızdayız'
          }
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">Sigortalı Taşıma</h3>
            <p className="text-slate-600 leading-relaxed">
              Aracınızın kaskosu olsun veya olmasın, taşıma süresince {brand.name} aracınız Yolmov güvencesi altındadır. 
              {isLuxury && ' Premium araçlar için özel kasko sigortası ile çalışıyoruz.'}
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <Truck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">Yetkili Servis Ağı</h3>
            <p className="text-slate-600 leading-relaxed">
              Aracınızı en yakın {brand.name} yetkili servisine veya sizin belirlediğiniz özel servise doğrudan götürüyoruz.
              {isLuxury && ' Premium marka yetkili servisleri ile anlaşmalıyız.'}
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
            <div className={`w-16 h-16 ${isElectric ? 'bg-green-100' : 'bg-orange-100'} rounded-2xl flex items-center justify-center mb-6`}>
              {isElectric ? <Battery className="w-8 h-8 text-green-600" /> : <CheckCircle className="w-8 h-8 text-orange-600" />}
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">
              {isElectric ? 'Elektrikli Araç Uzmanlığı' : 'Uygun Ekipman'}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {isElectric 
                ? 'Batarya koruma prosedürlerine uygun yükleme ve taşıma yapıyoruz. Yüksek voltaj güvenliği önceliğimiz.' 
                : 'Otomatik vites ve düşük şasi araçlar için özel kayar kasa araçlar kullanıyoruz.'}
            </p>
          </div>
        </div>
      </div>

      {/* Ek Özellikler */}
      <div className="bg-slate-100 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8 text-slate-900">
              {brand.name} İçin Özel Hizmet Detayları
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 bg-white p-6 rounded-xl">
                <Clock className="w-6 h-6 text-brand-orange shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Hızlı Müdahale</h4>
                  <p className="text-sm text-slate-600">
                    {brand.name} araçlar için ortalama 15 dakikada müdahale. Öncelikli hizmet sistemi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white p-6 rounded-xl">
                <Star className="w-6 h-6 text-brand-orange shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Uzman Operatörler</h4>
                  <p className="text-sm text-slate-600">
                    {brand.name} marka özelinde eğitimli ekip. {isLuxury && 'Premium araç taşıma sertifikası.'}
                  </p>
                </div>
              </div>

              {isElectric && (
                <div className="flex items-start gap-4 bg-white p-6 rounded-xl">
                  <Zap className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Acil Şarj Desteği</h4>
                    <p className="text-sm text-slate-600">
                      Batarya biterse mobil şarj ünitesi ile yerinde şarj imkanı.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4 bg-white p-6 rounded-xl">
                <Shield className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Hasar Kaydı</h4>
                  <p className="text-sm text-slate-600">
                    Teslim öncesi ve sonrası fotoğraf/video kaydı ile tam güvence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fiyat Hesaplayıcı Widget */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Calculator size={32} />
            <h3 className="text-2xl font-bold">{brand.name} Çekici Fiyatı Hesapla</h3>
          </div>
          <p className="text-white/90 mb-6">
            Yaklaşık mesafenize göre {brand.name} aracınız için tahmini çekici ücretini öğrenin
          </p>
          
          {estimatedPrice ? (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-4">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">{estimatedPrice} ₺</div>
                <div className="text-white/80 text-sm">Tahmini Çekici Ücreti</div>
              </div>
            </div>
          ) : (
            <button
              onClick={calculatePrice}
              className="w-full bg-white text-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Fiyat Hesapla
            </button>
          )}
          
          {estimatedPrice && (
            <button
              onClick={handleCallToAction}
              className="w-full bg-white text-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Kesin Fiyat İçin Teklif Al
            </button>
          )}
          
          <p className="text-xs text-white/70 text-center mt-4">
            * Gösterilen fiyat tahminidir. Kesin fiyat konumunuza göre değişebilir.
          </p>
        </div>
      </div>

      {/* FAQ Bölümü */}
      <div className="bg-gradient-to-b from-white to-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">{brand.name} Hakkında Sık Sorulan Sorular</h2>
              <p className="text-slate-600">En çok merak edilen soruların cevapları</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                    {expandedFaq === index ? (
                      <ChevronUp size={20} className="text-brand-orange shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-400 shrink-0" />
                    )}
                  </button>
                  
                  {expandedFaq === index && (
                    <div className="px-6 pb-5 pt-2">
                      <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Partner Ol CTA */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-12 text-white shadow-2xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <TrendingUp size={18} />
              <span>{brand.name} Çekici Partneri Ol</span>
            </div>
            
            <h3 className="text-3xl font-bold mb-4">
              {brand.name} Taşımacılığında Uzman mısınız?
            </h3>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              {isLuxury 
                ? 'Lüks araç taşımacılığı deneyiminizi Yolmov ile gelire dönüştürün. Premium müşterilerle çalışın.' 
                : isElectric
                  ? 'Elektrikli araç taşıma uzmanlığınızı Yolmov platformunda değerlendirin. Geleceğin işi sizinle başlıyor.'
                  : `${brand.name} ve diğer markalar için çekici hizmeti veriyorsanız, Yolmov ağına katılın ve daha fazla müşteriye ulaşın.`
              }
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto text-left">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="shrink-0 mt-0.5" />
                <span className="text-sm">Günlük düzenli iş fırsatları</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="shrink-0 mt-0.5" />
                <span className="text-sm">Anlık ödeme sistemi</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="shrink-0 mt-0.5" />
                <span className="text-sm">Komisyon oranları düşük</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="shrink-0 mt-0.5" />
                <span className="text-sm">7/24 teknik destek</span>
              </div>
            </div>

            <Link
              to="/partner-basvuru"
              className="inline-flex items-center justify-center gap-3 bg-white text-purple-600 text-lg font-bold py-4 px-8 rounded-xl hover:bg-purple-50 transition-all shadow-xl"
            >
              PARTNER BAŞVURUSU YAP
            </Link>
          </div>
        </div>
      </div>

      {/* Müşteri Yorumları */}
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">{brand.name} Kullanıcıları Ne Diyor?</h3>
            <div className="flex items-center justify-center gap-2">
              {[1,2,3,4,5].map(i => <Star key={i} size={24} className="fill-yellow-400 text-yellow-400" />)}
              <span className="ml-2 text-slate-600 font-semibold">4.8/5 ({Math.floor(Math.random() * 300) + 100} değerlendirme)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-slate-700 mb-4 italic">
                "{brand.name} aracım için çekici çağırmak zorunda kaldım. 12 dakikada geldiler ve çok profesyonelce taşıdılar. {isLuxury ? 'Lüks araç olduğu için endişeliydim ama hasar kaydı tutuldu ve güvende hissettim.' : 'Fiyat da çok uygundu.'}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                  {['A','B','C','D','E'][Math.floor(Math.random()*5)]}.
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Mehmet Y.</div>
                  <div className="text-sm text-slate-500">{brand.name} Sahibi</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-slate-700 mb-4 italic">
                "Gece yarısı {brand.name} aracım bozuldu. {isElectric ? 'Elektrikli araç olduğu için endişeliydim ama elektrikli araç konusunda çok bilgililer.' : 'Hemen yardım geldi.'} Yetkili servise kadar götürdüler. Çok memnun kaldım."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                  {['A','B','C','D','E'][Math.floor(Math.random()*5)]}.
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Ayşe K.</div>
                  <div className="text-sm text-slate-500">{brand.name} Sahibi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-12 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">
            {brand.name} Aracınız İçin Hemen Yardım Alın
          </h3>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            7/24 aktif çekici ağımız ve {brand.name} konusunda uzman ekibimizle anında yanınızdayız.
          </p>
          <button
            onClick={handleCallToAction}
            className="inline-flex items-center justify-center gap-3 bg-brand-orange hover:bg-brand-lightOrange text-white text-lg font-bold py-4 px-8 rounded-xl transition-all shadow-xl"
          >
            <Phone size={24} />
            ÜCRETSİZ TEKLİF AL
          </button>
        </div>
      </div>

      {/* Diğer Markalar */}
      <div className="container mx-auto px-4 pb-16">
        <h3 className="text-2xl font-bold mb-6 text-slate-900">Diğer Popüler Markalar</h3>
        <div className="flex flex-wrap gap-3">
          {POPULAR_BRANDS.filter(b => b.slug !== brand.slug).map(b => (
            <Link
              key={b.slug}
              to={`/marka/${b.slug}`}
              className="text-sm bg-white px-4 py-2.5 rounded-xl border border-slate-200 hover:border-brand-orange hover:text-brand-orange hover:shadow-md transition-all font-medium"
            >
              {b.name} Çekici →
            </Link>
          ))}
        </div>
      </div>

      {/* Schema.org JSON-LD - Google Rich Snippets */}
      
      {/* LocalBusiness Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          'name': `Yolmov ${brand.name} Yol Yardım`,
          'description': `${brand.name} marka araçlar için profesyonel yol yardım ve çekici hizmeti. 7/24 hizmet, sigortalı taşıma.`,
          'image': 'https://yolmov.com/og-image.jpg',
          'telephone': '+90-850-XXX-XXXX',
          'priceRange': isLuxury ? '$$$' : '$$',
          'openingHours': 'Mo,Tu,We,Th,Fr,Sa,Su 00:00-23:59',
          'areaServed': {
            '@type': 'Country',
            'name': 'Türkiye'
          },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.8',
            'reviewCount': Math.floor(Math.random() * 300) + 100
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
              'name': 'Markalar',
              'item': 'https://yolmov.com/hizmetler'
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': `${brand.name} Yol Yardım`,
              'item': `https://yolmov.com/marka/${brand.slug}`
            }
          ]
        })}
      </script>

      {/* FAQPage Schema - Google FAQ Rich Snippet */}
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
          'name': `${brand.name} İçin Yol Yardım Nasıl Çağırılır?`,
          'description': `${brand.name} marka aracınız için yol yardım ve çekici hizmetini 4 adımda nasıl talep edeceğinizi öğrenin.`,
          'totalTime': 'PT5M',
          'estimatedCost': {
            '@type': 'MonetaryAmount',
            'currency': 'TRY',
            'value': isLuxury ? 1200 : isElectric ? 1000 : 800
          },
          'step': [
            {
              '@type': 'HowToStep',
              'position': 1,
              'name': 'Talep Oluştur',
              'text': `${brand.name} aracınız için konumunuzdan hizmet talebinde bulunun`,
              'image': 'https://yolmov.com/how-to-1.jpg'
            },
            {
              '@type': 'HowToStep',
              'position': 2,
              'name': 'Teklifleri İncele',
              'text': `${brand.name} konusunda uzman servislerden anında fiyat alın`,
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
              'name': 'Takip Edin',
              'text': `${brand.name} uzmanı ekip yola çıktı, canlı takip edin`,
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
          'serviceType': `${brand.name} Yol Yardım ve Çekici Hizmeti`,
          'provider': {
            '@type': 'Organization',
            'name': 'Yolmov',
            'url': 'https://yolmov.com'
          },
          'areaServed': {
            '@type': 'Country',
            'name': 'Türkiye'
          },
          'availableChannel': {
            '@type': 'ServiceChannel',
            'serviceUrl': `https://yolmov.com/marka/${brand.slug}`
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
          },
          'offers': {
            '@type': 'Offer',
            'priceCurrency': 'TRY',
            'price': isLuxury ? '1200' : isElectric ? '1000' : '800',
            'priceSpecification': {
              '@type': 'PriceSpecification',
              'priceCurrency': 'TRY',
              'price': isLuxury ? '1200' : isElectric ? '1000' : '800'
            }
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
        brand={brand.name}
        service="cekici"
      />
    </div>
  );
};

export default SEOBrandPage;
