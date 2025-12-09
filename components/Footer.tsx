import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white pt-16 pb-8">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Column */}
          <div>
            <div className="mb-6 cursor-pointer" onClick={() => handleNavigation('/')}>
              <span className="yolmov-logo text-3xl font-bold text-white block mb-4">
                yolmov
              </span>
              <span className="hidden"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Yolda kaldığınız her an yanınızdayız. Modern, hızlı ve güvenilir yol yardım platformu.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white/90">Kurumsal</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <button onClick={() => handleNavigation('/hakkimizda')} className="hover:text-brand-orange transition-colors text-left">
                  Hakkımızda
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/hizmetler')} className="hover:text-brand-orange transition-colors text-left">
                  Hizmetler
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/kariyer')} className="hover:text-brand-orange transition-colors text-left">
                  Kariyer
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/blog')} className="hover:text-brand-orange transition-colors text-left">
                  Blog
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/iletisim')} className="hover:text-brand-orange transition-colors text-left">
                  İletişim
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white/90">Hizmetler</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {['Çekici Hizmeti', 'Akü Takviyesi', 'Lastik Değişimi', 'Yakıt Desteği', 'Oto Kurtarma'].map(link => (
                <li key={link}>
                  <button onClick={() => handleNavigation('/hizmetler')} className="hover:text-brand-orange transition-colors text-left">
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white/90">Bize Ulaşın</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-orange shrink-0" />
                <span>Platform üzerinden 7/24 hizmet talebinde bulunabilirsiniz</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} Yolmov Teknoloji A.Ş. Tüm hakları saklıdır.
          </p>
          <div className="flex space-x-6 text-xs text-gray-500">
            <button 
              onClick={() => handleNavigation('/gizlilik-politikasi')}
              className="hover:text-white transition-colors"
            >
              Gizlilik Politikası
            </button>
            <button 
              onClick={() => handleNavigation('/kullanim-kosullari')}
              className="hover:text-white transition-colors"
            >
              Kullanım Koşulları
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;