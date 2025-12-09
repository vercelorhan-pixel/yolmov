import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CookieConsentBannerProps {
  onAccept?: () => void;
  onReject?: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept, onReject }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already responded to cookie consent
    const consentGiven = localStorage.getItem('yolmov_cookie_consent');
    if (!consentGiven) {
      // Show banner after a small delay
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('yolmov_cookie_consent', 'accepted');
    setIsVisible(false);
    if (onAccept) onAccept();
  };

  const handleReject = () => {
    localStorage.setItem('yolmov_cookie_consent', 'rejected');
    setIsVisible(false);
    if (onReject) onReject();
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-6 md:p-8">
              {/* Icon */}
              <div className="shrink-0">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Cookie size={32} className="text-brand-orange" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                  🍪 Çerez Bildirimi
                </h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  Yolmov olarak, size daha iyi bir deneyim sunmak, platformumuzu geliştirmek ve yasal yükümlülüklerimizi yerine getirmek amacıyla 
                  <strong className="text-gray-800"> çerezler ve benzer teknolojiler </strong> kullanıyoruz. 
                  Platformumuzu kullanmaya devam ederek, 
                  <button 
                    onClick={() => {
                      const event = new CustomEvent('yolmov:navigate', { detail: { page: 'privacy-policy' } });
                      window.dispatchEvent(event);
                    }}
                    className="text-brand-orange hover:underline font-bold ml-1"
                  >
                    Gizlilik Politikamızı
                  </button>
                  {' '}ve çerez kullanımını kabul etmiş olursunuz.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:shrink-0">
                <button
                  onClick={handleReject}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
                >
                  Reddet
                </button>
                <button
                  onClick={handleAccept}
                  className="px-6 py-3 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors text-sm shadow-lg whitespace-nowrap"
                >
                  Kabul Et
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </div>

            {/* KVKK Info Bar */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 md:px-8 py-3">
              <p className="text-xs text-gray-500 text-center">
                <strong className="text-gray-700">KVKK Uyarısı:</strong> Kişisel verileriniz, 
                <button 
                  onClick={() => {
                    const event = new CustomEvent('yolmov:navigate', { detail: { page: 'privacy-policy' } });
                    window.dispatchEvent(event);
                  }}
                  className="text-brand-orange hover:underline mx-1"
                >
                  6698 sayılı Kişisel Verilerin Korunması Kanunu
                </button>
                kapsamında işlenmektedir. Detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
