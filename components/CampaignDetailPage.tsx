import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, MapPin, Clock, Gift, CheckCircle, Percent, Copy, Check, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';
import { campaignsApi, CampaignDB } from '../services/supabaseApi';
import CountdownTimer from './shared/CountdownTimer';

const CampaignDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const data = await campaignsApi.getById(id);
        setCampaign(data);
      } catch (e) {
        console.error('Kampanya yüklenemedi:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const copyCode = () => {
    if (campaign?.code) {
      navigator.clipboard.writeText(campaign.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const shareOnSocial = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const url = window.location.href;
    const text = `${campaign?.title} - Yolmov Kampanyası`;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };
    
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="relative h-[400px] md:h-[500px] bg-slate-200 animate-pulse"></div>
        <div className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-3xl p-8 md:p-12 animate-pulse">
              <div className="h-8 w-64 bg-slate-200 rounded mb-4"></div>
              <div className="h-4 w-full bg-slate-200 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Gift size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-gray-600 mb-4">Kampanya bulunamadı</p>
          <button onClick={() => navigate('/kampanyalar')} className="text-brand-orange font-semibold">Kampanyalara Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - Simplified */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <button 
            onClick={() => navigate('/kampanyalar')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-orange font-semibold mb-4"
          >
            <ArrowLeft size={18}/> Kampanyalara Dön
          </button>
          
          {campaign.badge_text && (
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider rounded-lg mb-3">
              {campaign.badge_text}
            </span>
          )}
          
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900">
            {campaign.title}
          </h1>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Campaign Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Main Image */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <img 
                  src={campaign.image_url} 
                  alt={campaign.title}
                  className="w-full h-[400px] object-cover"
                />
              </div>

              {/* Campaign Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
            
                {/* Campaign Highlights */}
                {(campaign.discount || campaign.code) && (
                  <div className="flex flex-wrap items-center gap-4">
                    {campaign.discount && (
                      <div className="flex items-center gap-3 bg-orange-50 px-4 py-3 rounded-xl border border-orange-200">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Percent size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">İndirim Oranı</p>
                          <p className="text-xl font-bold text-orange-600">%{campaign.discount}</p>
                        </div>
                      </div>
                    )}
                    
                    {campaign.code && (
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-xs text-gray-600 font-medium mb-2">Kampanya Kodu</p>
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300">
                          <span className="font-mono text-lg font-bold text-gray-900 flex-1">{campaign.code}</span>
                          <button 
                            onClick={copyCode}
                            className="p-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
                            title="Kopyala"
                          >
                            {codeCopied ? <Check size={18} /> : <Copy size={18} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Kampanya Detayları</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {campaign.description}
                  </p>
                </section>

                <section className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-brand-orange" />
                    Kampanya Avantajları
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange mt-0.5">✓</span>
                      <span>Yolmov kullanıcılarına özel indirim fırsatı</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange mt-0.5">✓</span>
                      <span>7/24 kesintisiz hizmet desteği</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange mt-0.5">✓</span>
                      <span>Güvenilir ve doğrulanmış hizmet sağlayıcılar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-orange mt-0.5">✓</span>
                      <span>Anında teklif alma ve karşılaştırma imkanı</span>
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-gray-900 mb-3">Kampanya Koşulları</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-gray-600">
                    <p>• Kampanya Yolmov platformu üzerinden yapılan hizmet taleplerinde geçerlidir.</p>
                    <p>• İndirimler partner firmalar tarafından uygulanır.</p>
                    <p>• Yolmov, kampanya koşullarında değişiklik yapma hakkını saklı tutar.</p>
                    <p>• Detaylı bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.</p>
                  </div>
                </section>

                <div className="pt-4">
                  <button 
                    onClick={() => {
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
                      navigate('/teklif');
                    }}
                    className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Hemen Teklif Al
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Widget */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Countdown Widget */}
              {campaign.end_date && campaign.is_active && (
                <div className="sticky top-4">
                  <CountdownTimer endDate={campaign.end_date} variant="widget" />
                </div>
              )}

              {/* Share Widget */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Share2 size={18} className="text-brand-orange" />
                  Sayfayı Paylaş
                </h3>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => shareOnSocial('facebook')}
                    className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
                  >
                    <Facebook size={24} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Facebook</span>
                  </button>
                  
                  <button
                    onClick={() => shareOnSocial('twitter')}
                    className="flex flex-col items-center gap-2 p-3 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors border border-sky-200"
                  >
                    <Twitter size={24} className="text-sky-600" />
                    <span className="text-xs font-medium text-sky-700">Twitter</span>
                  </button>
                  
                  <button
                    onClick={() => shareOnSocial('linkedin')}
                    className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
                  >
                    <Linkedin size={24} className="text-blue-700" />
                    <span className="text-xs font-medium text-blue-800">LinkedIn</span>
                  </button>
                </div>
              </div>

              {/* Valid Until Info */}
              {campaign.valid_until && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Calendar size={20} className="text-gray-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Kampanya Geçerlilik</p>
                      <p className="font-bold text-gray-900">{campaign.valid_until}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailPage;
