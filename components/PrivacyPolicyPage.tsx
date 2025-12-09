import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const PrivacyPolicyPage: React.FC = () => {
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
              <Shield size={32} className="text-orange-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Gizlilik Politikası
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Kişisel verilerinizin korunması bizim için önceliklidir.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Giriş</h2>
              <p className="text-gray-600 leading-relaxed">
                Yolmov olarak, kullanıcılarımızın gizliliğini korumayı ve kişisel verilerini 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") 
                kapsamında güvenli bir şekilde işlemeyi taahhüt ediyoruz. Bu Gizlilik Politikası, platformumuz üzerinden toplanan kişisel verilerin 
                nasıl işlendiğini, saklandığını ve korunduğunu açıklamaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Veri Sorumlusu</h2>
              <p className="text-gray-600 leading-relaxed mb-2">
                KVKK uyarınca veri sorumlusu sıfatıyla Yolmov, kişisel verilerinizi aşağıda açıklanan kapsamda işlemektedir.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700">
                <p><strong>Şirket Adı:</strong> Yolmov Teknoloji A.Ş.</p>
                <p><strong>Platform:</strong> www.yolmov.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Toplanan Kişisel Veriler</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platformumuz üzerinden aşağıdaki kişisel veriler toplanmaktadır:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span><strong>Kimlik Bilgileri:</strong> Ad, soyad</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span><strong>İletişim Bilgileri:</strong> Platform üzerinden iletişim mesajları</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span><strong>Konum Bilgileri:</strong> Hizmet talebinde bulunduğunuz konum (il, ilçe, detaylı adres)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, çerez verileri, cihaz bilgileri</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span><strong>Müşteri İşlem Bilgileri:</strong> Hizmet talep bilgileri, teklif geçmişi, işlem kayıtları</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Kişisel Verilerin İşlenme Amaçları</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Yol yardım hizmetlerinin sunulması ve koordinasyonu</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Hizmet sağlayıcılar ile müşterilerin eşleştirilmesi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Müşteri destek hizmetlerinin sağlanması</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Platform güvenliğinin sağlanması</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Yasal yükümlülüklerin yerine getirilmesi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Hizmet kalitesinin iyileştirilmesi ve analiz çalışmaları</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Kişisel Verilerin Aktarımı</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda aşağıdaki taraflarla paylaşılabilir:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Platformumuzda kayıtlı hizmet sağlayıcılar (partnerler)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Teknik altyapı ve bulut hizmeti sağlayıcıları</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Yasal yükümlülükler çerçevesinde yetkili kamu kurum ve kuruluşları</span>
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Kişisel verileriniz yurt dışına aktarılmamaktadır. Ancak kullanılan bazı bulut hizmetleri yurt dışı sunucularda 
                barındırılabilir; bu durumda verileriniz KVKK'nın 9. maddesi kapsamında yeterli koruma sağlayan ülkelere veya 
                uygun güvenceler altında aktarılır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Kişisel Verilerin Saklanması ve Güvenliği</h2>
              <p className="text-gray-600 leading-relaxed">
                Kişisel verileriniz, işleme amaçlarının gerektirdiği süre boyunca ve yasal saklama yükümlülüklerine uygun olarak saklanır. 
                Verilerinizin güvenliğini sağlamak için güncel teknik ve idari güvenlik önlemleri alınmaktadır. Yetkisiz erişim, kayıp, 
                değişiklik veya ifşaya karşı verilerinizi korumak için şifreleme, güvenlik duvarları ve erişim kontrolleri kullanılmaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Çerezler (Cookies)</h2>
              <p className="text-gray-600 leading-relaxed">
                Platformumuz, kullanıcı deneyimini iyileştirmek, site trafiğini analiz etmek ve güvenliği sağlamak amacıyla çerezler 
                kullanmaktadır. Çerez kullanımı hakkında detaylı bilgi için lütfen Çerez Politikamızı inceleyiniz. Tarayıcı ayarlarınızdan 
                çerezleri yönetebilir veya reddedebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. KVKK Kapsamındaki Haklarınız</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                KVKK'nın 11. maddesi uyarınca, kişisel verilerinizle ilgili olarak aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Kişisel verilerinizin işlenip işlenmediğini öğrenme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Aktarıldığı üçüncü kişilere yukarıda sayılan işlemlerin bildirilmesini isteme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>İşlenen verilerin otomatik sistemler ile analiz edilmesi sonucu aleyhinize bir sonuç doğması halinde itiraz etme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange mt-1">•</span>
                  <span>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</span>
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Bu haklarınızı kullanmak için platform üzerinden yazılı olarak başvuruda bulunabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Değişiklikler</h2>
              <p className="text-gray-600 leading-relaxed">
                Bu Gizlilik Politikası, yasal düzenlemelerdeki değişiklikler veya şirket politikalarındaki güncellemeler doğrultusunda 
                zaman zaman revize edilebilir. Önemli değişiklikler platform üzerinden duyurulacaktır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. İletişim</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Gizlilik Politikamız ile ilgili sorularınız için:
              </p>
              <div className="bg-orange-50 rounded-xl p-4 text-sm text-gray-700 space-y-1">
                <p><strong>İletişim:</strong> Platform üzerinden mesaj gönderebilirsiniz</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
