import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Gift, Percent, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { campaignsApi, CampaignDB } from '../services/supabaseApi';

interface CampaignsPageProps {
  onBack?: () => void;
}

const CampaignsPage: React.FC<CampaignsPageProps> = ({ onBack }) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - Simplified */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-orange font-semibold mb-4"
          >
            <ArrowLeft size={18}/> Ana Sayfa
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">
                Kampanyalar
              </h1>
              <p className="text-gray-600">
                Yolmov kullanıcılarına özel avantajlar ve indirimler
              </p>
            </div>
            
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-xl border border-orange-200">
              <Gift size={20} className="text-brand-orange" />
              <span className="text-sm font-semibold text-gray-700">
                {campaigns.length} Aktif Kampanya
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[420px] bg-slate-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20">
              <Gift size={64} className="mx-auto text-slate-300 mb-6" />
              <h2 className="text-2xl font-bold text-slate-700 mb-4">Aktif Kampanya Bulunmuyor</h2>
              <p className="text-slate-500 mb-8">Şu anda aktif bir kampanya yok. Yakında yeni kampanyalar için geri gelin!</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((camp, index) => (
                <motion.div
                  key={camp.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/kampanya/${camp.id}`)}
                  className="group bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-orange-200"
                >
                  {/* Image Section with Badge */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={camp.image_url} 
                      alt={camp.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    {/* Badge */}
                    {camp.badge_text && (
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg">
                          {camp.badge_text}
                        </span>
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    {camp.discount && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-yellow-400 text-gray-900 px-3 py-2 rounded-xl shadow-lg">
                          <div className="flex items-center gap-1">
                            <Percent size={16} className="font-bold" />
                            <span className="text-lg font-black">{camp.discount}</span>
                          </div>
                          <div className="text-[10px] font-bold uppercase text-center">İndirim</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-orange transition-colors">
                        {camp.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {camp.description}
                      </p>
                    </div>
                    
                    {/* Info Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {camp.valid_until && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar size={14} />
                          <span>{camp.valid_until}</span>
                        </div>
                      )}
                      
                      <span className="text-sm font-bold text-brand-orange group-hover:underline">
                        Detaylı Gör →
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
