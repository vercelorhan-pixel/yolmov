import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'Genel',
      questions: [
        {
          q: 'Yolmov nedir?',
          a: 'Yolmov, yolda kalan araç sahiplerini en yakın ve en uygun fiyatlı yol yardım hizmet sağlayıcıları ile buluşturan dijital bir platformdur. Çekici, akü takviyesi, lastik değişimi gibi acil yol yardım hizmetlerini hızlı ve güvenilir bir şekilde almanızı sağlar.'
        },
        {
          q: 'Yolmov nasıl çalışır?',
          a: 'İhtiyacınız olan hizmeti seçin, bulunduğunuz konumu belirtin. Platformumuz size en yakın hizmet sağlayıcılardan teklifler getirir. Beğendiğiniz teklifi onaylayın ve hizmet sağlayıcı size ulaşsın. İşlem tamamlandıktan sonra ödemenizi gerçekleştirin.'
        },
        {
          q: 'Yolmov ücretsiz mi?',
          a: 'Yolmov platformunu kullanmak tamamen ücretsizdir. Sadece aldığınız yol yardım hizmeti için hizmet sağlayıcıya ödeme yaparsınız. Platform üzerinden teklif almak, karşılaştırmak ve hizmet talep etmek için herhangi bir ücret alınmaz.'
        },
        {
          q: 'Hangi şehirlerde hizmet veriyorsunuz?',
          a: 'Yolmov, Türkiye\'nin 81 ilinde aktif olarak hizmet vermektedir. Binlerce doğrulanmış partner ağımız ile nerede olursanız olun size en yakın hizmet sağlayıcıyı bulmanızı sağlıyoruz.'
        }
      ]
    },
    {
      category: 'Hizmetler',
      questions: [
        {
          q: 'Hangi hizmetleri sunuyorsunuz?',
          a: 'Çekici hizmeti, akü takviyesi, lastik değişimi, yakıt desteği ve oto kurtarma hizmetlerini sunuyoruz. Her hizmet için deneyimli ve lisanslı partner ağımız 7/24 sizlere hizmet vermektedir.'
        },
        {
          q: 'Acil durumlarda ne kadar sürede yardım alırım?',
          a: 'Ortalama yanıt süresi 15-45 dakika arasındadır. Ancak bu süre bulunduğunuz konum, trafik durumu ve hizmet yoğunluğuna göre değişiklik gösterebilir. Platform üzerinden size sunulan tekliflerde tahmini varış süresini (ETA) görebilirsiniz.'
        },
        {
          q: 'Hizmet fiyatları nasıl belirleniyor?',
          a: 'Hizmet fiyatları mesafe, araç tipi, hizmet türü ve bölgesel koşullara göre değişkenlik gösterir. Platformumuz sayesinde birden fazla hizmet sağlayıcıdan teklif alıp karşılaştırabilir, size en uygun olanı seçebilirsiniz.'
        },
        {
          q: 'Gece yarısı hizmet alabilir miyim?',
          a: 'Evet, Yolmov 7/24 aktiftir. Gece yarısı dahil her saatte hizmet talebinde bulunabilir ve en yakın müsait hizmet sağlayıcıdan destek alabilirsiniz.'
        }
      ]
    },
    {
      category: 'Ödeme',
      questions: [
        {
          q: 'Ödeme nasıl yapılır?',
          a: 'Yolmov bir aracı platformdur ve kullanıcılardan herhangi bir ödeme almaz. Hizmet bedeli doğrudan müşteri ile partner arasında halledilir. Ödeme yöntemi (nakit, kredi kartı, banka kartı) hizmet sağlayıcı partner tarafından belirlenir ve hizmet tamamlandıktan sonra doğrudan kendisine yapılır.'
        },
        {
          q: 'Platform kullanım ücreti var mı?',
          a: 'Hayır. Yolmov platformunu kullanmak tamamen ücretsizdir. Teklif almak, karşılaştırmak ve hizmet talep etmek için herhangi bir ücret ödemeniz gerekmez. Sadece aldığınız yol yardım hizmeti için partner ile anlaştığınız tutarı ödersiniz.'
        },
        {
          q: 'Fatura alabilir miyim?',
          a: 'Evet. Hizmet faturası hizmet sağlayıcı partner tarafından düzenlenir. E-fatura veya kağıt fatura tercihinizi hizmet öncesinde veya sonrasında partner ile paylaşabilirsiniz.'
        },
        {
          q: 'İptal durumunda ücret alınır mı?',
          a: 'İptal politikaları hizmet sağlayıcı partnere göre değişiklik gösterebilir. Genellikle partner yola çıkmadan önce yapılan iptallerde ücret alınmaz. Partner yola çıktıktan sonra iptal durumunda kısmi ücret talep edilebilir. Detaylar için partner ile iletişime geçmeniz önerilir.'
        }
      ]
    },
    {
      category: 'Güvenlik',
      questions: [
        {
          q: 'Hizmet sağlayıcılar güvenilir mi?',
          a: 'Tüm hizmet sağlayıcılarımız kimlik doğrulama, belge kontrolü ve referans incelemesinden geçer. Lisanslı ve sigortası olan firmaları önceliklendiriyoruz. Ayrıca kullanıcı yorumları ve puanlama sistemi ile şeffaflık sağlıyoruz.'
        },
        {
          q: 'Kişisel verilerim güvende mi?',
          a: 'Kişisel verileriniz KVKK kapsamında korunmaktadır. Verileriniz sadece hizmet sunumu amacıyla kullanılır ve üçüncü taraflarla paylaşılmaz. Gizlilik politikamızı web sitemizden inceleyebilirsiniz.'
        },
        {
          q: 'Şikayet veya sorun yaşarsam ne yapmalıyım?',
          a: 'Herhangi bir sorun yaşamanız durumunda 7/24 aktif müşteri hizmetlerimize ulaşabilirsiniz. Platform üzerinden de şikayet ve geri bildirim gönderebilirsiniz. Tüm talepleriniz en kısa sürede değerlendirilir.'
        }
      ]
    },
    {
      category: 'Partner Olmak',
      questions: [
        {
          q: 'Yolmov\'a partner nasıl olurum?',
          a: 'Web sitemizden "Partner Ol" bölümüne giderek başvuru formunu doldurabilirsiniz. Gerekli belgelerinizi yükledikten sonra ekibimiz başvurunuzu değerlendirir. Onay sürecinden sonra platforma dahil olabilirsiniz.'
        },
        {
          q: 'Partner olmanın şartları nedir?',
          a: 'Geçerli ticari faaliyet belgesi, araç ruhsatları, sigorta poliçesi ve gerekli lisanslar gerekmektedir. Ayrıca deneyim ve referanslar da değerlendirme kriterlerimiz arasındadır.'
        },
        {
          q: 'Komisyon oranları nedir?',
          a: 'Komisyon oranları hizmet türüne ve iş hacmine göre değişkenlik gösterir. Detaylı bilgi için partner başvuru sürecinde ekibimizle görüşebilirsiniz.'
        }
      ]
    }
  ];

  const filteredFAQs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const allQuestions = faqs.flatMap((cat, catIdx) =>
    cat.questions.map((q, qIdx) => ({ ...q, globalIndex: catIdx * 100 + qIdx, category: cat.category }))
  );

  const filteredAllQuestions = searchTerm
    ? allQuestions.filter(
        item =>
          item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.a.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

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
              Sıkça Sorulan Sorular
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Size Nasıl<br />
              <span className="text-brand-orange">Yardımcı Olabiliriz?</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8">
              Aklınıza takılan soruların cevaplarını burada bulabilirsiniz.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Soru ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-orange-500/50 shadow-xl"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {searchTerm ? (
            // Search Results
            <div>
              <p className="text-sm text-gray-500 mb-6">
                <strong>{filteredAllQuestions.length}</strong> sonuç bulundu
              </p>
              <div className="space-y-4">
                {filteredAllQuestions.map((item, idx) => (
                  <motion.div
                    key={item.globalIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenIndex(openIndex === item.globalIndex ? null : item.globalIndex)}
                      className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <span className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-1 block">
                          {item.category}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900">{item.q}</h3>
                      </div>
                      <div className="shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                        {openIndex === item.globalIndex ? (
                          <ChevronUp size={20} className="text-brand-orange" />
                        ) : (
                          <ChevronDown size={20} className="text-brand-orange" />
                        )}
                      </div>
                    </button>
                    <AnimatePresence>
                      {openIndex === item.globalIndex && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            // Category View
            <div className="space-y-12">
              {filteredFAQs.map((category, catIdx) => (
                <div key={category.category}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {catIdx + 1}
                    </div>
                    {category.category}
                  </h2>
                  <div className="space-y-4">
                    {category.questions.map((item, qIdx) => {
                      const globalIndex = catIdx * 100 + qIdx;
                      return (
                        <motion.div
                          key={globalIndex}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: qIdx * 0.05 }}
                          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenIndex(openIndex === globalIndex ? null : globalIndex)}
                            className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                          >
                            <h3 className="flex-1 text-lg font-bold text-gray-900">{item.q}</h3>
                            <div className="shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                              {openIndex === globalIndex ? (
                                <ChevronUp size={20} className="text-brand-orange" />
                              ) : (
                                <ChevronDown size={20} className="text-brand-orange" />
                              )}
                            </div>
                          </button>
                          <AnimatePresence>
                            {openIndex === globalIndex && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                                  {item.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Sorunuz Cevapsız mı Kaldı?</h2>
          <p className="text-gray-600 mb-8">
            Müşteri hizmetlerimiz 7/24 hizmetinizde. Bize ulaşmaktan çekinmeyin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors">
              Canlı Destek
            </button>
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
              İletişim Formu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
