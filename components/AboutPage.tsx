import React from 'react';
import { Heart, Shield, Users, TrendingUp, Award, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const AboutPage: React.FC = () => {
  const values = [
    { icon: Heart, title: 'Müşteri Odaklılık', desc: 'Her zaman müşterilerimizin ihtiyaçlarını ön planda tutarız.' },
    { icon: Shield, title: 'Güvenilirlik', desc: 'Doğrulanmış ve güvenilir hizmet sağlayıcılarımızla çalışırız.' },
    { icon: Users, title: 'Profesyonellik', desc: 'Deneyimli ekibimiz ile 7/24 profesyonel destek sağlarız.' },
    { icon: TrendingUp, title: 'İnovasyon', desc: 'Teknoloji ile yol yardım sektörünü dönüştürüyoruz.' }
  ];

  const stats = [
    { number: '50,000+', label: 'Mutlu Müşteri' },
    { number: '500+', label: 'Partner İş Ortağı' },
    { number: '81', label: 'İlde Hizmet' },
    { number: '24/7', label: 'Kesintisiz Destek' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm font-bold uppercase tracking-wider mb-6">
              Hakkımızda
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Türkiye'nin En Güvenilir<br />
              <span className="text-brand-orange">Yol Yardım Platformu</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Yolmov, yolda kalan araç sahiplerini en yakın ve en uygun hizmet sağlayıcıları ile buluşturan 
              dijital platformdur. Amacımız, her zaman güvenli ve hızlı bir yolculuk deneyimi sunmaktır.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <h3 className="text-4xl md:text-5xl font-black text-brand-orange mb-2">{stat.number}</h3>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Target size={32} className="text-brand-orange" />
                <h2 className="text-3xl font-display font-bold text-gray-900">Misyonumuz</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                Yolda kalan her sürücüye, nerede olursa olsun, en hızlı ve en uygun fiyatlı çözümü sunmak. 
                Teknoloji ile geleneksel yol yardım hizmetlerini modernize ederek, şeffaf, güvenilir ve 
                kullanıcı dostu bir platform oluşturmak.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Aynı zamanda, küçük ve orta ölçekli yol yardım firmalarına dijital dönüşüm imkanı sunarak, 
                onların daha geniş bir müşteri kitlesine ulaşmasını sağlıyoruz.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 md:p-12"
            >
              <Award size={48} className="text-brand-orange mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Vizyonumuz</h3>
              <p className="text-gray-700 leading-relaxed">
                Türkiye'nin her köşesinde, her araç sahibinin ilk tercihi olmak. Yol yardım sektöründe 
                standartları belirleyen, müşteri memnuniyetini ve teknolojik yeniliği ön planda tutan 
                lider platform konumuna ulaşmak.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20 bg-white px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Değerlerimiz</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Yolmov olarak, her kararımızda ve eylemimizde bu temel değerlere bağlı kalıyoruz.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-4">
                  <value.icon size={28} className="text-brand-orange" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Ekibimiz</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            Otomotiv, teknoloji ve müşteri hizmetleri alanlarında uzman bir ekip ile hizmetinizdeyiz.
          </p>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-8">
            <p className="text-lg text-gray-700 font-medium mb-4">
              🚀 <strong>50+ profesyonel</strong> ile Türkiye genelinde kesintisiz hizmet sunuyoruz.
            </p>
            <p className="text-sm text-gray-600">
              Müşteri hizmetlerinden yazılım geliştirmeye, operasyondan finans yönetimine kadar 
              her alanda deneyimli ekibimiz, sizin için çalışıyor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
