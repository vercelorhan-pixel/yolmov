
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuoteWizard from './QuoteWizard';
import { 
  ShieldCheck, Clock, Users, ArrowLeft, 
  Activity, Zap, Map, ChevronDown, HelpCircle,
  CheckCircle2, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MOCK DATA FOR LIVE ACTIVITY ---
const RECENT_ACTIVITIES = [
  { id: 1, user: "Ahmet Y.", loc: "İstanbul, Kadıköy", action: "Çekici Teklifi Aldı", time: "Az önce" },
  { id: 2, user: "Selin K.", loc: "Ankara, Çankaya", action: "Akü Takviyesi İstedi", time: "2 dk önce" },
  { id: 3, user: "Mehmet D.", loc: "İzmir, Bornova", action: "Lastik Değişimi Tamamlandı", time: "5 dk önce" },
  { id: 4, user: "Caner T.", loc: "Bursa, Nilüfer", action: "Oto Kurtarma Teklifi Aldı", time: "8 dk önce" },
  { id: 5, user: "Zeynep A.", loc: "Antalya, Muratpaşa", action: "Yakıt Desteği Yola Çıktı", time: "12 dk önce" },
];

// --- MOCK DATA FOR FAQ ---
const FAQS = [
  { q: "Teklif almak ücretli mi?", a: "Hayır, Yolmov üzerinden teklif oluşturmak tamamen ücretsizdir." },
  { q: "Ne kadar sürede geri dönüş alırım?", a: "Talebinizi oluşturduktan sonra sistemimiz bölgedeki en yakın sağlayıcılara bildirim gönderir. Ortalama 3-5 dakika içinde dönüş alırsınız." },
  { q: "Gelen çekici güvenilir mi?", a: "Evet. Sistemimizdeki tüm hizmet verenler kimlik, ruhsat ve yetki belgesi doğrulamalarından geçmiştir." },
  { q: "Ödemeyi nasıl yapacağım?", a: "Ödemeyi hizmeti aldıktan sonra gelen ekibe Nakit veya Kredi Kartı ile yapabilirsiniz. Bazı durumlarda online ödeme seçeneği de sunulabilir." },
];

// --- SUB-COMPONENTS ---

const RecentActivityWidget = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % RECENT_ACTIVITIES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 overflow-hidden relative">
      <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
        <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
          <Activity size={16} className="text-green-500" />
          Canlı İşlem Akışı
        </h3>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      </div>
      
      <div className="h-[60px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
             <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                   {RECENT_ACTIVITIES[currentIndex].user.charAt(0)}
                </div>
                <div>
                   <p className="text-xs text-gray-500 mb-0.5">{RECENT_ACTIVITIES[currentIndex].user} • <span className="text-gray-400">{RECENT_ACTIVITIES[currentIndex].loc}</span></p>
                   <p className="text-sm font-bold text-gray-800 leading-tight">{RECENT_ACTIVITIES[currentIndex].action}</p>
                   <p className="text-[10px] text-green-600 font-medium mt-1">{RECENT_ACTIVITIES[currentIndex].time}</p>
                </div>
             </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const OperationStatusWidget = () => {
  return (
    <div className="bg-gray-900 text-white rounded-2xl shadow-lg p-5 relative overflow-hidden group">
      {/* Abstract Map BG */}
      <div className="absolute inset-0 opacity-20">
         <svg className="w-full h-full" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
               <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1"/>
               </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
         </svg>
      </div>
      
      <div className="relative z-10">
         <div className="flex items-center justify-between mb-6">
            <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-green-400 border border-white/10">
               Sistem Aktif
            </div>
            <Zap size={16} className="text-yellow-400 fill-yellow-400" />
         </div>
         
         <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl font-display font-bold">42</span>
            <span className="text-sm text-gray-400 mb-1.5">Araç</span>
         </div>
         <p className="text-xs text-gray-400">Bölgenizdeki aktif çekici sayısı</p>
         
         <div className="mt-4 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-[85%] rounded-full animate-pulse"></div>
         </div>
         <p className="text-[10px] text-gray-500 mt-1 text-right">Yoğunluk: Yüksek</p>
      </div>
    </div>
  );
};

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
         <HelpCircle size={20} className="text-brand-orange" /> Sıkça Sorulan Sorular
      </h3>
      <div className="space-y-2">
         {FAQS.map((faq, idx) => (
            <div key={idx} className="border-b border-gray-50 last:border-0">
               <button 
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between py-3 text-left hover:text-brand-orange transition-colors"
               >
                  <span className="text-sm font-medium text-gray-700">{faq.q}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
               </button>
               <AnimatePresence>
                  {openIndex === idx && (
                     <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                     >
                        <p className="text-xs text-gray-500 pb-4 leading-relaxed">
                           {faq.a}
                        </p>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         ))}
      </div>
    </div>
  );
};

const QuotePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 md:px-8 relative">
      {/* Technical Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        
        {/* Mobile Back Button */}
        <button 
           onClick={() => navigate('/')}
           className="lg:hidden flex items-center gap-2 text-gray-500 hover:text-brand-orange font-medium mb-6 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
        >
           <ArrowLeft size={18} /> Ana Sayfa
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           {/* LEFT SIDEBAR (30%) */}
           <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-24">
              
              {/* Header for Desktop */}
              <div className="mb-6">
                 <h1 className="text-3xl font-display font-bold text-gray-900 leading-tight">
                    Hızlı Teklif Al <br />
                    <span className="text-brand-orange">Yola Devam Et</span>
                 </h1>
                 <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                    Aracınızın durumunu bildirin, bölgedeki uzmanlardan anında fiyat alın.
                 </p>
              </div>

              <OperationStatusWidget />
              <RecentActivityWidget />

              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
                       <ShieldCheck size={20} />
                    </div>
                    <div>
                       <h4 className="font-bold text-sm text-gray-900">Güvenli İşlem</h4>
                       <p className="text-[10px] text-gray-500">Verileriniz 256-bit SSL ile korunur.</p>
                    </div>
                 </div>
                 <div className="flex -space-x-2 ml-2">
                    {[1,2,3,4].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                       </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                       +2k
                    </div>
                 </div>
                 <p className="text-[10px] text-gray-500 mt-2 ml-1">Bugün 2.400+ kişi teklif aldı.</p>
              </div>

           </div>

           {/* RIGHT CONTENT (70%) */}
           <div className="col-span-1 lg:col-span-8">
              {/* Mobile Header */}
              <div className="lg:hidden mb-6">
                 <h1 className="text-2xl font-display font-bold text-gray-900">Hızlı Teklif Al</h1>
                 <p className="text-gray-500 text-sm mt-1">Uzman ekiplerden 5 dakikada fiyat alın.</p>
              </div>

              {/* Main Form Wizard */}
              <QuoteWizard />

              {/* FAQ Section (Below Form) */}
              <FaqSection />
           </div>

        </div>
      </div>
    </div>
  );
};

export default QuotePage;
