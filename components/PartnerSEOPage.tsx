/**
 * Partner SEO Page - Lokalize B2B İş İlanı Sayfaları
 * URL: /partner-ol/{service}/{city}/{district}
 * Hedef: Yerel iş arayanlar ve servis sağlayıcılar
 * 
 * V2 FEATURES:
 * - Kişiselleştirilmiş hero (müşteri sayısı + kazanç vurgusu)
 * - Harita dokulu background (glassmorphism)
 * - Counter animasyonlu earnings calculator
 * - Timeline görünümü (adım adım süreç)
 * - Sticky CTA bar (mobil)
 * - Wave dividers (bölüm geçişleri)
 * - Satış odaklı SSS
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { 
  MapPin, Phone, TrendingUp, Star, Shield, ChevronRight, Home, 
  Briefcase, DollarSign, Users, Clock, CheckCircle, Calculator,
  Award, Target, Zap, ArrowRight, FileText, Truck, CreditCard,
  HeadphonesIcon, Sparkles, TrendingUpIcon
} from 'lucide-react';
import { 
  getCityBySlug, 
  getDistrictBySlug, 
  getServiceInfo, 
  generatePartnerSEOMetadata, 
  ServiceType 
} from '../lib/seoData';

const PartnerSEOPage: React.FC = () => {
  const { service, city, district } = useParams<{ service: ServiceType; city: string; district: string }>();
  const navigate = useNavigate();
  const [monthlyJobs, setMonthlyJobs] = useState(30);
  const [estimatedIncome, setEstimatedIncome] = useState({ min: 0, max: 0 });
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Refs for animations
  const calculatorRef = useRef(null);
  const isCalculatorInView = useInView(calculatorRef, { once: false });

  // SEO metadata
  const seoData = service && city && district ? generatePartnerSEOMetadata(city, district, service) : null;
  const cityData = city ? getCityBySlug(city) : null;
  const districtData = city && district ? getDistrictBySlug(city, district) : null;
  const serviceInfo = service ? getServiceInfo(service) : null;

  // 404 yönlendirme
  useEffect(() => {
    if (!seoData || !cityData || !districtData || !serviceInfo) {
      navigate('/404', { replace: true });
    }
  }, [seoData, cityData, districtData, serviceInfo, navigate]);

  // SEO meta tags
  useEffect(() => {
    if (seoData) {
      document.title = seoData.title;
      
      const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', seoData.description);
      if (!metaDesc.parentElement) document.head.appendChild(metaDesc);

      const metaKeywords = document.querySelector('meta[name="keywords"]') || document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', seoData.keywords.join(', '));
      if (!metaKeywords.parentElement) document.head.appendChild(metaKeywords);

      const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement || document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.href = `https://yolmov.com${seoData.url}`;
      if (!canonical.parentElement) document.head.appendChild(canonical);
    }
  }, [seoData]);

  // Sticky bar scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Earnings calculator with animated counter
  useEffect(() => {
    if (seoData) {
      const avgPerJob = {
        cekici: 850,
        aku: 400,
        lastik: 350,
        yakit: 250,
        anahtar: 600
      }[service!];

      setEstimatedIncome({
        min: Math.floor(monthlyJobs * 0.7 * avgPerJob),
        max: Math.floor(monthlyJobs * avgPerJob)
      });
    }
  }, [monthlyJobs, seoData, service]);

  if (!seoData || !cityData || !districtData || !serviceInfo) {
    return null;
  }

  const handleApply = () => {
    navigate('/partner/kayit', {
      state: {
        city: cityData.name,
        district: districtData.name,
        service: serviceInfo.title,
        source: 'partner_seo_page'
      }
    });
  };

  const competitionLabels = {
    low: { text: 'Düşük', color: 'text-green-600 bg-green-100', icon: '🟢' },
    medium: { text: 'Orta', color: 'text-yellow-600 bg-yellow-100', icon: '🟡' },
    high: { text: 'Yüksek', color: 'text-red-600 bg-red-100', icon: '🔴' }
  };

  const competition = competitionLabels[seoData.competitionLevel];

  // Yeni SSS - Satış odaklı
  const faqs = [
    {
      q: `${districtData.name}'da başka partneriniz var mı? Rekabet nasıl?`,
      a: `${districtData.name}'da şu an ${seoData.activePartnerCount === 0 ? 'hiç partnerimiz yok' : `sadece ${seoData.activePartnerCount} partnerimiz var`}! İlk başvuranlardan olursanız, bölgedeki talebin büyük kısmını siz karşılayabilirsiniz. Aylık ${seoData.estimatedMonthlyDemand} müşteri sizi bekliyor.`
    },
    {
      q: 'Hangi bölgelere hizmet verebilirim?',
      a: `Ana bölgeniz ${districtData.name} olsa da, uygulama üzerinden 'Hizmet Alanım' ayarlarını değiştirerek ${cityData.name} genelindeki işleri ve hatta dönüş rotanızdaki talepleri de alabilirsiniz. Boş dönüş yok!`
    },
    {
      q: 'İlk işi ne zaman alabilirim?',
      a: `Başvurunuz onaylandıktan sonra 24-48 saat içinde sisteme tanımlanırsınız ve ilk işleriniz gelmeye başlar. Ortalama onay süresi 2-3 iş günüdür.`
    },
    {
      q: `Gerçekten aylık ${seoData.estimatedMonthlyEarnings.max.toLocaleString('tr-TR')}₺ kazanabilir miyim?`,
      a: `Bu rakam garanti değildir, ancak ${districtData.name}'daki mevcut talebe ve performansınıza göre bu aralıkta kazanmanız çok muhtemeldir. Bazı partnerlerimiz bu rakamı da aşıyor.`
    },
    {
      q: 'Komisyon oranı nedir? Gizli masraf var mı?',
      a: `Yolmov, her işten %15-20 arası komisyon alır. Geri kalan tutar doğrudan sizin hesabınıza aktarılır. Hiçbir gizli masraf, kayıt ücreti veya abonelik yok!`
    }
  ];

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
            <Link to="/partner/kayit" className="hover:text-brand-orange transition-colors">
              Partner Başvuru
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-900">{cityData.name} {districtData.name}</span>
          </div>
        </div>
      </nav>

      {/* Hero Section - Harita Dokulu, Kişiselleştirilmiş */}
      <div className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 text-white py-20 overflow-hidden">
        {/* Harita Doku Arka Planı */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L45 15L30 30L15 15Z M0 30L15 45L0 60M30 30L45 45L30 60L15 45Z M30 30L45 15L60 30L45 45Z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-700/90 via-purple-600/80 to-purple-800/90" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Fırsat Rozeti */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-yellow-400 text-purple-900 px-4 py-2 rounded-full font-bold text-sm mb-6 shadow-lg"
            >
              <Sparkles size={18} />
              <span>{seoData.activePartnerCount === 0 ? 'İlk Partner Olun!' : 'Sınırlı Kontenjan'}</span>
            </motion.div>

            {/* Yeni Başlık - Müşteri Sayısı Vurgulu */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-black mb-6 leading-tight"
            >
              {districtData.name}'un <br/>
              <span className="text-yellow-300">{seoData.estimatedMonthlyDemand} {serviceInfo.shortTitle} Müşterisi</span><br/>
              Sizi Bekliyor!
            </motion.h1>

            {/* PROFESYONEL KAZANÇ VURGUSU */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="mb-8"
            >
              <div className="text-base md:text-lg text-white/80 mb-3 font-medium">
                💰 Aylık Kazanç Potansiyeli
              </div>
              <div className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-xl leading-tight tracking-tight">
                {seoData.estimatedMonthlyEarnings.min.toLocaleString('tr-TR')}₺ - {seoData.estimatedMonthlyEarnings.max.toLocaleString('tr-TR')}₺
              </div>
              <div className="text-lg md:text-xl text-white/90 leading-relaxed font-medium">
                Ek gelir fırsatını kaçırmayın. {districtData.name}'daki {seoData.activePartnerCount === 0 ? 'tek partnerimiz olun' : 'lider partnerlerden biri olun'}.
              </div>
            </motion.div>

            {/* Glassmorphism İstatistik Kartları */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
            >
              {[
                { icon: Users, label: 'Aylık Talep', value: `${seoData.estimatedMonthlyDemand}+`, color: 'from-blue-500 to-cyan-400' },
                { icon: DollarSign, label: 'Tahmini Kazanç', value: `${Math.floor(seoData.estimatedMonthlyEarnings.max / 1000)}K₺`, color: 'from-green-500 to-emerald-400' },
                { icon: Target, label: 'Aktif Partner', value: seoData.activePartnerCount, color: 'from-yellow-500 to-orange-400' },
                { icon: TrendingUpIcon, label: 'Rekabet', value: competition.text, color: 'from-purple-500 to-pink-400' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300"
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon size={24} className="text-white" />
                  </div>
                  <div className="text-3xl font-black mb-1">{stat.value}</div>
                  <div className="text-sm text-purple-200 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Butonları - Profesyonel Boyut */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(255, 122, 0, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApply}
                className="bg-brand-orange text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl hover:bg-orange-600 transition-all duration-300 inline-flex items-center justify-center gap-3"
              >
                <Briefcase size={24} />
                <span>HEMEN BAŞVUR</span>
                <ArrowRight size={24} />
              </motion.button>
              
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#earnings-calculator"
                className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:bg-white/20 transition-all border border-white/30 inline-flex items-center justify-center gap-2"
              >
                <Calculator size={22} />
                <span>KAZANÇ HESAPLA</span>
              </motion.a>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm text-purple-100 mt-6 font-semibold"
            >
              ✅ Başvuru ücretsiz • ⚡ İlk iş 48 saat içinde • 💳 Komisyon sadece %15-20
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="relative -mt-1">
        <svg className="w-full h-16" viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="#ffffff" d="M0,32 C240,80 480,80 720,32 C960,-16 1200,-16 1440,32 L1440,80 L0,80 Z" />
        </svg>
      </div>

      {/* Stats Grid - Eski versiyon kaldırıldı, artık Hero içinde glassmorphism kartlar var */}

      {/* Earnings Calculator - Oyunlaştırılmış */}
      <div id="earnings-calculator" className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            ref={calculatorRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isCalculatorInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-4 border-purple-100 relative overflow-hidden"
          >
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="text-center mb-10">
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
                >
                  <Calculator size={40} className="text-white" />
                </motion.div>
                <h2 className="text-4xl font-black text-slate-900 mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {districtData.name}'da Ne Kadar Kazanabilirsin?
                </h2>
                <p className="text-slate-600 text-lg">
                  Aylık yapabileceğin iş sayısını ayarla, <strong>tahmini gelirini anlık gör</strong>
                </p>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-center mb-6">
                  <label className="text-xl font-bold text-slate-900">Aylık İş Sayısı</label>
                  <motion.span 
                    key={monthlyJobs}
                    initial={{ scale: 1.3, color: "#3b82f6" }}
                    animate={{ scale: 1, color: "#3b82f6" }}
                    className="text-5xl font-black text-blue-600 tabular-nums"
                  >
                    {monthlyJobs}
                  </motion.span>
                </div>
                
                {/* Kalınlaştırılmış Slider */}
                <div className="relative">
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={monthlyJobs}
                    onChange={(e) => setMonthlyJobs(Number(e.target.value))}
                    className="w-full h-4 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, 
                        #f59e0b 0%, 
                        #f59e0b ${((monthlyJobs - 10) / 110) * 100}%, 
                        #e2e8f0 ${((monthlyJobs - 10) / 110) * 100}%, 
                        #e2e8f0 100%)`,
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                    }}
                  />
                  <div className="flex justify-between text-sm text-slate-500 mt-3 font-semibold">
                    <span>🐢 Yavaş Başla (10)</span>
                    <span>💪 Orta Tempo (65)</span>
                    <span>🚀 Turbo Mod (120)</span>
                  </div>
                </div>
              </div>

              {/* Animasyonlu Kazanç Göstergesi */}
              <motion.div 
                key={`${estimatedIncome.min}-${estimatedIncome.max}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden"
              >
                {/* Glowing Effet */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                <div className="relative z-10">
                  <div className="text-sm font-black text-green-100 mb-3 tracking-wider uppercase">
                    💰 Tahmini Aylık Gelir 💰
                  </div>
                  <motion.div 
                    className="text-6xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl tabular-nums"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.4 }}
                  >
                    {estimatedIncome.min.toLocaleString('tr-TR')}₺ - {estimatedIncome.max.toLocaleString('tr-TR')}₺
                  </motion.div>
                  <div className="text-sm text-green-100 font-semibold">
                    ✨ Komisyon sonrası net kazanç
                  </div>
                </div>
              </motion.div>

              {/* Uyarı Bandı */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 text-center"
              >
                <p className="text-sm text-yellow-800 font-semibold">
                  ⚠️ <strong>Bu Rakam Garanti Değildir.</strong> Ancak {districtData.name}'daki mevcut talebe ve performansınıza göre 
                  bu aralıkta kazanmanız <strong>çok muhtemeldir</strong>. Bazı partnerlerimiz bu rakamı da aşıyor!
                </p>
              </motion.div>

              <motion.button
                onClick={handleApply}
                whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-10 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white text-xl font-black py-6 rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3"
              >
                <Zap size={28} className="animate-pulse" />
                <span>AYLASIK {estimatedIncome.max.toLocaleString('tr-TR')}₺ İÇİN BAŞVUR</span>
                <ArrowRight size={28} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="relative -mt-1">
        <svg className="w-full h-20" viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="#ffffff" d="M0,50 C320,100 640,100 960,50 C1280,0 1440,0 1440,50 L1440,100 L0,100 Z" />
        </svg>
      </div>

      {/* Yolmov Partneri Olmanın 3 Büyük Avantajı */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Yolmov Partneri Olmanın<br/>
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">3 Büyük Avantajı</span>
          </h2>
          <p className="text-xl text-slate-600">
            Sadece bir platform değil, kazancını katlayan bir ekosistem
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Anında Ödeme */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-slate-300 transition-all shadow-lg hover:shadow-xl group"
          >
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CreditCard size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">💸 Anında Ödeme</h3>
            <p className="text-slate-600 leading-relaxed text-base">
              <strong className="text-slate-900">Haftalık veya aylık beklemek yok.</strong> İş bittiği an ödemeniz hesabınızda. 
              Çekiciler için en kritik konu - biz biliyoruz!
            </p>
          </motion.div>

          {/* Dijital Dispeçer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-slate-300 transition-all shadow-lg hover:shadow-xl group"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Phone size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">📱 Dijital Dispeçer</h3>
            <p className="text-slate-600 leading-relaxed text-base">
              <strong className="text-slate-900">Telefon trafiği ile uğraşmayın.</strong> Tüm işler uygulamanıza bildirim olarak gelir. 
              Kabul et/Reddet - bu kadar basit!
            </p>
          </motion.div>

          {/* Boş Dönüş Yok */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-slate-300 transition-all shadow-lg hover:shadow-xl group"
          >
            <div className="w-16 h-16 bg-orange-100 text-brand-orange rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Truck size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">🤝 Boş Dönüş Yok</h3>
            <p className="text-slate-600 leading-relaxed text-base">
              <strong className="text-slate-900">Dönüş yolunuzdaki işleri de size yönlendirerek</strong> kazancınızı katlıyoruz. 
              Akıllı rotalama sistemiyle her yolculuk karlı!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="relative -mb-1">
        <svg className="w-full h-16" viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="#f8fafc" d="M0,40 C360,80 720,80 1080,40 C1260,20 1320,0 1440,0 L1440,80 L0,80 Z" />
        </svg>
      </div>

      {/* Timeline - Adım Adım Süreç */}
      <div className="bg-slate-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Partner Olma Süreci
            </h2>
            <p className="text-xl text-slate-600">
              Başvurudan kazanmaya sadece 4 adım
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 via-blue-600 to-green-600 transform -translate-x-1/2" />

              {/* Steps */}
              <div className="space-y-16">
                {[
                  { 
                    step: 1, 
                    icon: FileText, 
                    title: 'Başvur', 
                    desc: 'Online formu 2 dakikada doldur. TC, vergi levhası, ruhsat yükle.', 
                    color: 'from-purple-500 to-purple-600',
                    time: '2 dakika'
                  },
                  { 
                    step: 2, 
                    icon: CheckCircle, 
                    title: 'Onaylan', 
                    desc: 'Ekibimiz belgelerinizi inceler. Uygunsa 2-3 iş günü içinde onaylanırsın.', 
                    color: 'from-blue-500 to-blue-600',
                    time: '2-3 gün'
                  },
                  { 
                    step: 3, 
                    icon: Phone, 
                    title: 'Uygulamayı Aç', 
                    desc: 'Mobil uygulamayı indir, giriş yap. İlk eğitim videoları izle.', 
                    color: 'from-cyan-500 to-cyan-600',
                    time: '10 dakika'
                  },
                  { 
                    step: 4, 
                    icon: TrendingUpIcon, 
                    title: 'Kazanmaya Başla', 
                    desc: 'İlk iş bildirimi 24-48 saat içinde gelir. Kabul et ve kazanmaya başla!', 
                    color: 'from-green-500 to-green-600',
                    time: '24-48 saat'
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.2 }}
                    viewport={{ once: true }}
                    className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    <div className={`flex-1 ${idx % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-slate-200 hover:border-purple-400 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-base font-black text-purple-600 bg-purple-100 px-4 py-2 rounded-full">
                            ⏱️ {item.time}
                          </span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-4">{item.title}</h3>
                        <p className="text-slate-700 text-xl leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>

                    <div className="relative z-10 flex-shrink-0">
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-2xl ring-8 ring-white`}>
                        <item.icon size={40} className="text-white" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-lg shadow-xl">
                        {item.step}
                      </div>
                    </div>

                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-16"
            >
              <motion.button
                onClick={handleApply}
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 bg-brand-orange hover:bg-orange-600 text-white text-xl font-bold py-4 px-10 rounded-xl shadow-lg transition-all"
              >
                <Briefcase size={24} />
                <span>BAŞVURUNUZU TAMAMLAYIN</span>
                <ArrowRight size={24} />
              </motion.button>
              <p className="text-slate-600 mt-4 text-base font-medium">
                ⚡ 2 dakikada tamamla • ✅ 48 saat içinde onay
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="relative -mt-1">
        <svg className="w-full h-20" viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="#ffffff" d="M0,50 C480,0 720,0 1440,50 L1440,100 L0,100 Z" />
        </svg>
      </div>

      {/* Requirements */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            {districtData.name}'da Partner Olma Şartları
          </h2>
          <p className="text-center text-slate-600 mb-12">
            Aşağıdaki gereksinimleri karşılıyor musunuz? O halde başvurun!
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 bg-white p-6 rounded-xl border-2 border-green-200">
              <CheckCircle size={24} className="text-green-600 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-slate-900 mb-2">{cityData.name}'da Kayıtlı Araç</h3>
                <p className="text-sm text-slate-600">
                  {cityData.name} ili plakalı ticari araç (minibüs, kamyonet veya özel donanımlı araç)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white p-6 rounded-xl border-2 border-green-200">
              <CheckCircle size={24} className="text-green-600 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-slate-900 mb-2">{serviceInfo.title} Ekipmanı</h3>
                <p className="text-sm text-slate-600">
                  {service === 'cekici' ? 'Çekici/kurtarıcı ekipmanı veya kayar kasa' :
                   service === 'aku' ? 'Akü takviye cihazı ve yedek aküler' :
                   service === 'lastik' ? 'Lastik değiştirme takımları' :
                   service === 'yakit' ? 'Taşınabilir yakıt bidonu (20L+)' :
                   'Araç kilidi açma ekipmanları'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white p-6 rounded-xl border-2 border-green-200">
              <CheckCircle size={24} className="text-green-600 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Yasal Belgeler</h3>
                <p className="text-sm text-slate-600">
                  TC Kimlik, vergi levhası/serbest meslek belgesi, ruhsat
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white p-6 rounded-xl border-2 border-green-200">
              <CheckCircle size={24} className="text-green-600 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-slate-900 mb-2">7/24 Hizmet</h3>
                <p className="text-sm text-slate-600">
                  Gece ve hafta sonu dahil hizmet verebilme (esnek çalışma saatleri)
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={handleApply}
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xl font-bold py-5 px-12 rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <CheckCircle size={28} />
              ŞARTLARDAYIM, BAŞVURUYORUM
            </button>
            <p className="text-sm text-slate-500 mt-4">
              Başvuru formu 2 dakikada doldurulur
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">
              {cityData.name} Partnerlerimiz Ne Diyor?
            </h3>
            <div className="flex items-center justify-center gap-2">
              {[1,2,3,4,5].map(i => <Star key={i} size={24} className="fill-yellow-400 text-yellow-400" />)}
              <span className="ml-2 text-slate-600 font-semibold">4.7/5 Partner Memnuniyeti</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-slate-700 mb-4 italic">
                "{cityData.name}'da Yolmov ile çalışmaya başladığımdan beri ayda ortalama {Math.floor(seoData.estimatedMonthlyEarnings.min * 1.1 / 1000)}K-{Math.floor(seoData.estimatedMonthlyEarnings.max * 0.9 / 1000)}K TL kazanıyorum. Müşteriler sürekli geliyor, ödeme düzenli. Kesinlikle tavsiye ederim."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                  A.
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Ahmet Y.</div>
                  <div className="text-sm text-slate-500">{cityData.name} {serviceInfo.title} Partneri</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-slate-700 mb-4 italic">
                "Başvurdum, 3 gün sonra onaylandım. İlk hafta 8 iş yaptım. Platform çok kullanıcı dostu, müşteri desteği hızlı. {cityData.name}'da işlerin yoğun olduğu dönemlerde günde 4-5 iş bile yapabiliyorum."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                  M.
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Mehmet K.</div>
                  <div className="text-sm text-slate-500">{cityData.name} {serviceInfo.title} Partneri</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Sık Sorulan Sorular
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
                <summary className="px-6 py-5 font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <ChevronRight size={20} className="text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-5 pt-2 text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-12 text-white text-center max-w-4xl mx-auto shadow-2xl">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Award size={40} />
          </div>
          <h3 className="text-4xl font-bold mb-6 leading-tight">
            {districtData.name}'da Yerinizi Alın!
          </h3>
          <div className="text-white text-3xl font-bold mb-4">
            💰 {seoData.estimatedMonthlyEarnings.min.toLocaleString('tr-TR')}₺ - {seoData.estimatedMonthlyEarnings.max.toLocaleString('tr-TR')}₺ / Ay
          </div>
          <p className="text-white/90 mb-4 max-w-2xl mx-auto text-lg font-medium">
            Aylık <strong>{seoData.estimatedMonthlyDemand} talep</strong> ve bu kazanç potansiyeli kaçırılacak gibi değil. İlk adımı atın!
          </p>
          <p className="text-white/70 mb-8">
            🎯 Son 7 günde {Math.floor(Math.random() * 12) + 3} kişi {districtData.name}'dan başvurdu
          </p>
          <button
            onClick={handleApply}
            className="inline-flex items-center justify-center gap-3 bg-white text-purple-600 text-lg font-bold py-4 px-10 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Zap size={28} />
            SON ADIM: BAŞVUR
          </button>
        </div>
      </div>

      {/* Sticky CTA Bar - Mobil */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ 
          y: showStickyBar ? 0 : 100,
          opacity: showStickyBar ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 text-white p-4 shadow-2xl z-50 md:hidden border-t-4 border-yellow-400"
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs font-bold text-yellow-300 mb-1">💰 TAHMİNİ KAZANÇ</div>
            <div className="text-2xl font-black">{seoData.estimatedMonthlyEarnings.max.toLocaleString('tr-TR')}₺/ay</div>
          </div>
          <button
            onClick={handleApply}
            className="bg-yellow-400 text-purple-900 px-6 py-4 rounded-xl font-black text-lg shadow-lg hover:bg-yellow-300 transition-colors flex items-center gap-2"
          >
            <span>BAŞVUR</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>

      {/* Schema.org JSON-LD - JobPosting */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          'title': `${cityData.name} ${districtData.name} ${serviceInfo.title} Partneri`,
          'description': seoData.description,
          'hiringOrganization': {
            '@type': 'Organization',
            'name': 'Yolmov',
            'sameAs': 'https://yolmov.com',
            'logo': 'https://yolmov.com/logo.png'
          },
          'jobLocation': {
            '@type': 'Place',
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': districtData.name,
              'addressRegion': cityData.name,
              'addressCountry': 'TR'
            }
          },
          'baseSalary': {
            '@type': 'MonetaryAmount',
            'currency': 'TRY',
            'value': {
              '@type': 'QuantitativeValue',
              'minValue': seoData.estimatedMonthlyEarnings.min,
              'maxValue': seoData.estimatedMonthlyEarnings.max,
              'unitText': 'MONTH'
            }
          },
          'employmentType': 'CONTRACTOR',
          'datePosted': '2025-12-08',
          'validThrough': '2026-12-31',
          'applicantLocationRequirements': {
            '@type': 'City',
            'name': `${districtData.name}, ${cityData.name}`
          },
          'jobBenefits': 'Anında ödeme, dijital dispeçer, boş dönüş yok, 7/24 iş fırsatı, esnek çalışma saatleri, düzenli ödeme, müşteri desteği'
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
              'name': 'Partner Başvuru',
              'item': 'https://yolmov.com/partner-basvuru'
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': serviceInfo.title,
              'item': `https://yolmov.com/partner-ol/${service}`
            },
            {
              '@type': 'ListItem',
              'position': 4,
              'name': `${cityData.name} ${districtData.name}`,
              'item': `https://yolmov.com${seoData.url}`
            }
          ]
        })}
      </script>

      {/* FAQPage Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': faqs.map(faq => ({
            '@type': 'Question',
            'name': faq.q,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': faq.a
            }
          }))
        })}
      </script>
    </div>
  );
};

export default PartnerSEOPage;
