import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, AlertCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6 text-sm font-bold"
            >
              <ArrowLeft size={18}/> Geri Dön
            </button>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText size={32} className="text-orange-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Kullanım Koşulları
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Yolmov platformunu kullanarak aşağıdaki şartları kabul etmiş olursunuz.
            </p>
            <p className="text-sm text-slate-400 mt-4">Son Güncellenme: 25 Kasım 2025</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Kabul ve Onay</h2>
              <p className="text-gray-600 leading-relaxed">
                Yolmov platformunu ("Platform") kullanarak, işbu Kullanım Koşullarını ("Koşullar") okuduğunuzu, anladığınızı ve 
                kabul ettiğinizi beyan edersiniz. Bu Koşulları kabul etmiyorsanız, lütfen Platformu kullanmayınız.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Tanımlar</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span><strong>Platform:</strong> Yolmov web sitesi ve mobil uygulamaları</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span><strong>Kullanıcı:</strong> Platformu kullanan müşteriler ve hizmet sağlayıcılar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span><strong>Müşteri:</strong> Yol yardım hizmeti talep eden kişi veya kuruluşlar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span><strong>Partner:</strong> Platform üzerinden hizmet sunan yol yardım sağlayıcıları</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span><strong>Hizmet:</strong> Çekici, akü takviyesi, lastik değişimi vb. yol yardım hizmetleri</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Platform Hizmetleri</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Yolmov, yol yardım hizmeti arayan müşteriler ile hizmet sağlayıcıları buluşturan bir dijital aracı platformdur. 
                Platform aşağıdaki hizmetleri sunar:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Yol yardım hizmeti taleplerinin alınması ve yönlendirilmesi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Müşteri ve hizmet sağlayıcıların eşleştirilmesi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Teklif alma ve karşılaştırma imkanı</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>İletişim ve koordinasyon desteği</span>
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                <strong>Önemli Not:</strong> Yolmov, yol yardım hizmetini doğrudan sunmamaktadır. Platform, müşteriler ve 
                bağımsız hizmet sağlayıcılar arasında aracılık yapar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Kullanıcı Hesabı ve Güvenlik</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platform üzerinde işlem yapmak için kullanıcı hesabı oluşturmanız gerekebilir. Kullanıcı olarak:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Doğru, güncel ve eksiksiz bilgi sağlamakla yükümlüsünüz</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Hesap bilgilerinizin gizliliğini korumaktan sorumlusunuz</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Hesabınız üzerinden gerçekleştirilen tüm işlemlerden sorumlusunuz</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Yetkisiz erişim veya güvenlik ihlali durumunda derhal platformu bilgilendirmelisiniz</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Ödeme ve Faturalama</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                <strong>Önemli:</strong> Yolmov platformu kullanımı ücretsizdir. Ödeme işlemleri müşteri ile hizmet sağlayıcı arasında doğrudan gerçekleştirilir.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Hizmet bedeli, müşteri ile partner arasında anlaşılan fiyat üzerinden ödenir</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Ödeme yöntemleri (nakit, kredi kartı, vb.) hizmet sağlayıcı tarafından belirlenir</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Yolmov, ödeme işlemlerinde taraf değildir ve fiyatlandırmadan sorumlu tutulamaz</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Fatura ve mali belge talepleri doğrudan hizmet sağlayıcıya yönlendirilmelidir</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Sorumluluklar ve Garanti Reddi</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Yolmov, platform olarak aşağıdaki konularda sorumluluk kabul etmemektedir:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Hizmet sağlayıcıların sunduğu hizmetin kalitesi, zamanlaması veya sonucu</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Müşteri ile partner arasındaki anlaşmazlıklar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Hizmet sırasında meydana gelen kazalar, hasarlar veya kayıplar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Üçüncü tarafların neden olduğu kesintiler veya hizmet aksama</span>
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Platform, "olduğu gibi" sunulmaktadır. Kesintisiz, hatasız veya güvenli hizmet garantisi verilmemektedir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Kullanıcı Davranış Kuralları</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platform kullanırken aşağıdaki davranışlardan kaçınmalısınız:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Yanıltıcı, yanlış veya eksik bilgi sağlamak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Platform güvenliğini tehlikeye atacak davranışlarda bulunmak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Başka kullanıcıların hesaplarını kötüye kullanmak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Spam, taciz veya uygunsuz içerik paylaşmak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Platformu yasadışı amaçlarla kullanmak</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Fikri Mülkiyet Hakları</h2>
              <p className="text-gray-600 leading-relaxed">
                Platform üzerindeki tüm içerik, tasarım, logo, yazılım ve materyaller Yolmov'a aittir ve telif hakkı yasaları ile korunmaktadır. 
                Kullanıcılar, bu içerikleri izinsiz kopyalayamaz, dağıtamaz veya ticari amaçla kullanamazlar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Hesap Askıya Alma ve Sonlandırma</h2>
              <p className="text-gray-600 leading-relaxed">
                Yolmov, bu Koşulları ihlal eden, platformu kötüye kullanan veya başkalarına zarar veren kullanıcıların hesaplarını 
                uyarı vermeksizin askıya alabilir veya kalıcı olarak sonlandırabilir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Değişiklikler ve Güncellemeler</h2>
              <p className="text-gray-600 leading-relaxed">
                Yolmov, bu Kullanım Koşullarını istediği zaman değiştirme hakkını saklı tutar. Önemli değişiklikler platform üzerinden 
                duyurulacaktır. Güncellemelerden sonra platformu kullanmaya devam etmeniz, yeni koşulları kabul ettiğiniz anlamına gelir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Uyuşmazlık Çözümü ve Yargı</h2>
              <p className="text-gray-600 leading-relaxed">
                Bu Koşullardan kaynaklanan uyuşmazlıkların çözümünde Türkiye Cumhuriyeti yasaları uygulanır. İstanbul Mahkemeleri ve 
                İcra Daireleri yetkilidir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. İletişim</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kullanım Koşulları ile ilgili sorularınız için:
              </p>
              <div className="bg-orange-50 rounded-xl p-4 text-sm text-gray-700 space-y-1">
                <p><strong>İletişim:</strong> Platform üzerinden mesaj gönderebilirsiniz</p>
              </div>
            </section>

            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Yolmov platformunu kullanarak, yukarıdaki tüm koşulları okuduğunuzu ve kabul ettiğinizi onaylarsınız.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
