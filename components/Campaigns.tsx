
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { campaignsApi, CampaignDB } from '../services/supabaseApi';

const Campaigns: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignDB[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await campaignsApi.getActive();
        setCampaigns(data);
      } catch (e) {
        console.error('Kampanyalar yüklenemedi:', e);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth / 2 : current.offsetWidth / 2;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Kampanya yoksa bölümü gösterme
  if (!loading && campaigns.length === 0) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <section className="py-20 bg-white border-t border-gray-100 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32">
          <div className="animate-pulse">
            <div className="h-4 w-24 bg-slate-200 rounded mb-4"></div>
            <div className="h-8 w-64 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 w-96 bg-slate-200 rounded mb-10"></div>
            <div className="flex gap-6">
              <div className="min-w-[85vw] md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.33%-16px)] h-[450px] bg-slate-200 rounded-3xl"></div>
              <div className="min-w-[85vw] md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.33%-16px)] h-[450px] bg-slate-200 rounded-3xl"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white border-t border-gray-100 overflow-hidden" aria-label="Fırsatlar ve Kampanyalar bölümü">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="font-bold uppercase tracking-wider text-xs md:text-sm mb-2 block" style={{color: '#FF7A00'}}>
              Avantajlar
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-dark">
              Fırsatlar ve Kampanyalar
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl">
              Yolmov kullanıcılarına özel indirimler, iş birlikleri ve mevsimsel avantajları keşfedin.
            </p>
          </div>
          
          {/* Navigation Buttons (Desktop) */}
          <div className="hidden md:flex gap-3">
            <button 
              onClick={() => scroll('left')}
              aria-label="Önceki kampanyalar"
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-white hover:border-brand-orange transition-all"
              style={{hover: {backgroundColor: '#FF6B35'}}}
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => scroll('right')}
              aria-label="Sonraki kampanyalar"
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-white hover:border-brand-orange transition-all"
              style={{hover: {backgroundColor: '#FF6B35'}}}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {campaigns.map((camp, index) => (
            <motion.div 
              key={camp.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/kampanya/${camp.id}`)}
              className="min-w-[85vw] md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.33%-16px)] snap-center group relative h-[450px] rounded-3xl overflow-hidden cursor-pointer shadow-md"
            >
              {/* Background Image with Zoom Effect */}
              <img 
                src={camp.image_url} 
                alt={camp.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-between">
                <div className="flex justify-start">
                  {camp.badge_text && (
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-white/30 shadow-sm">
                      {camp.badge_text}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-3 leading-tight group-hover:text-brand-orange transition-colors">
                    {camp.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-6 line-clamp-2 leading-relaxed">
                    {camp.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-white font-bold text-sm group/btn">
                    <span className="border-b-2 border-white/30 group-hover/btn:border-brand-orange pb-1 transition-colors">
                      Detaylı Bilgi
                    </span>
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* "See All" Card */}
           <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: campaigns.length * 0.1 }}
              onClick={() => navigate('/kampanyalar')}
              className="min-w-[85vw] md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.33%-16px)] snap-center bg-gray-50 rounded-3xl flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 hover:border-brand-orange hover:bg-orange-50 transition-all cursor-pointer group h-[450px]"
            >
              <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ArrowRight size={32} className="text-brand-orange" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-brand-orange transition-colors">Tüm Kampanyalar</h3>
              <p className="text-gray-500 text-center text-base max-w-xs">
                Geçmiş ve gelecek tüm fırsatları incelemek için tıklayın.
              </p>
            </motion.div>
        </div>

      </div>
    </section>
  );
};

export default Campaigns;
