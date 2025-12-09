import React from 'react';
import { Truck, Battery, Wrench, Fuel, LifeBuoy, Clock, Shield, DollarSign, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const ServicesPage: React.FC = () => {
  const services = [
    {
      icon: Truck,
      title: 'Çekici Hizmeti',
      desc: 'Aracınız çalışmıyorsa, istediğiniz adrese güvenli şekilde çekici ile taşıma hizmeti.',
      features: ['7/24 Ulaşılabilir', 'Sigortalı Taşıma', 'Hızlı Müdahale', 'Şeffaf Fiyatlandırma'],
      icon_bg: 'bg-orange-100',
      icon_color: 'text-brand-orange'
    },
    {
      icon: Battery,
      title: 'Akü Takviyesi',
      desc: 'Aküsü biten aracınıza anında akü takviye hizmeti ile yola devam edin.',
      features: ['15 Dakikada Çözüm', 'Profesyonel Ekip', 'Güvenli Takviye', 'Uygun Fiyat'],
      icon_bg: 'bg-blue-100',
      icon_color: 'text-blue-600'
    },
    {
      icon: Wrench,
      title: 'Lastik Değişimi',
      desc: 'Patlayen veya hasar gören lastiğinizi yol kenarında profesyonelce değiştiriyoruz.',
      features: ['Hızlı Servis', 'Tüm Araç Tipleri', 'Güvenli Uygulama', 'Anında Çözüm'],
      icon_bg: 'bg-green-100',
      icon_color: 'text-green-600'
    },
    {
      icon: Fuel,
      title: 'Yakıt Desteği',
      desc: 'Yakıtınız bittiyse, bulunduğunuz noktaya yakıt getirme hizmeti sunuyoruz.',
      features: ['Hızlı Teslimat', 'Kaliteli Yakıt', 'Güvenli Nakliye', 'Acil Durum Çözümü'],
      icon_bg: 'bg-yellow-100',
      icon_color: 'text-yellow-600'
    },
    {
      icon: LifeBuoy,
      title: 'Oto Kurtarma',
      desc: 'Kazaya karışan veya hasar gören aracınız için kapsamlı oto kurtarma hizmeti.',
      features: ['Deneyimli Ekip', 'Özel Ekipman', 'Sigorta Desteği', 'Kapsamlı Hizmet'],
      icon_bg: 'bg-red-100',
      icon_color: 'text-red-600'
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: '7/24 Hızlı Müdahale',
      desc: 'Gece-gündüz her an, nerede olursanız olun yanınızdayız.'
    },
    {
      icon: Shield,
      title: 'Güvenilir Partnerler',
      desc: 'Doğrulanmış ve lisanslı hizmet sağlayıcılarımızla çalışıyoruz.'
    },
    {
      icon: DollarSign,
      title: 'Şeffaf Fiyatlandırma',
      desc: 'Gizli maliyet yok, teklif aldıktan sonra karar verirsiniz.'
    },
    {
      icon: MapPin,
      title: 'Geniş Hizmet Ağı',
      desc: 'Türkiye\'nin 81 ilinde binlerce noktada hizmet veriyoruz.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm font-bold uppercase tracking-wider mb-6">
              Hizmetlerimiz
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Yolda Kalmak Artık<br />
              <span className="text-brand-orange">Sorun Değil</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Aracınızın başına ne gelirse gelsin, Yolmov ile en yakın ve en uygun çözümü bulun.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`w-16 h-16 ${service.icon_bg} rounded-2xl flex items-center justify-center mb-6`}>
                  <service.icon size={32} className={service.icon_color} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.desc}</p>
                
                <ul className="space-y-2 mb-6">
                  {service.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-orange"></div>
                      {feature}
                    </li>
                  ))}
                </ul>

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
                  className="w-full px-6 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                >
                  Hizmet Talep Et
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Neden Yolmov?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Dijital platformumuz ile geleneksel yol yardım hizmetlerinden daha hızlı, daha güvenilir ve daha ekonomik çözümler sunuyoruz.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon size={32} className="text-brand-orange" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 bg-gradient-to-br from-brand-orange to-orange-600">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            Hemen Hizmet Alın
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            İhtiyacınıza uygun hizmeti seçin, en yakın sağlayıcıdan teklif alın.
          </p>
          <button 
            onClick={() => {
              const event = new CustomEvent('yolmov:navigate', { detail: { page: 'quote' } });
              window.dispatchEvent(event);
            }}
            className="px-8 py-4 bg-white text-brand-orange rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Hizmet Talep Et
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
