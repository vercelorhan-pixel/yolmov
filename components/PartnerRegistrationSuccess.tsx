import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Download, Home, LogIn, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const PartnerRegistrationSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    phone: string;
  } | null>(null);

  useEffect(() => {
    // Credentials location.state'ten gelecek
    if (location.state?.credentials) {
      setCredentials(location.state.credentials);
    } else {
      // State yoksa ana sayfaya yönlendir
      navigate('/partner-basvuru');
    }
  }, [location.state, navigate]);

  const handleDownloadCredentials = () => {
    if (!credentials) return;

    const blob = new Blob([
      `YOLMOV PARTNER ÜYELİK BİLGİLERİ\n` +
      `================================\n\n` +
      `Ad Soyad: ${credentials.firstName} ${credentials.lastName}\n` +
      `Firma: ${credentials.companyName || 'Bireysel'}\n` +
      `Telefon: ${credentials.phone}\n\n` +
      `GİRİŞ BİLGİLERİ:\n` +
      `E-posta/Kullanıcı: ${credentials.email}\n` +
      `Şifre: ${credentials.password}\n\n` +
      `Durum: Admin onayı bekleniyor\n` +
      `Kayıt Tarihi: ${new Date().toLocaleString('tr-TR')}\n\n` +
      `Not: Admin onayı sonrası https://yolmov.com/partner adresinden giriş yapabilirsiniz.`
    ], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yolmov-uyelik-${credentials.phone}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!credentials) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute top-20 left-20 w-64 h-64 bg-brand-orange rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"
        />
      </div>

      {/* Main Success Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-2xl w-full"
      >
        {/* Glass Card Effect */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          
          {/* Success Icon Header */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center relative overflow-hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-xl mb-4"
            >
              <CheckCircle2 size={48} className="text-green-500" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Sparkles size={28} />
                Kayıt Tamamlandı!
              </h1>
              <p className="text-green-50 text-lg">
                Hoş geldiniz, <strong>{credentials.firstName} {credentials.lastName}</strong>
              </p>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-20 translate-y-20" />
          </div>

          {/* Content Area */}
          <div className="p-8 md:p-12 space-y-8">
            
            {/* Status Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold text-blue-900 mb-2">📋 Sonraki Adımlar</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">1.</span>
                  <span>Admin ekibimiz başvurunuzu <strong>24 saat içinde</strong> değerlendirecek</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">2.</span>
                  <span>Onay sonrası <strong>e-posta ve SMS</strong> ile bilgilendirilecekasiniz</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">3.</span>
                  <span>Giriş bilgilerinizi aşağıdan indirerek <strong>güvenle saklayın</strong></span>
                </li>
              </ul>
            </motion.div>

            {/* Credentials Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200"
            >
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4">
                🔐 Giriş Bilgileriniz
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">
                    E-posta / Kullanıcı Adı
                  </label>
                  <div className="bg-white rounded-xl px-4 py-3 font-mono text-sm text-slate-900 border border-slate-200">
                    {credentials.email}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">
                    Şifre
                  </label>
                  <div className="bg-white rounded-xl px-4 py-3 font-mono text-sm text-slate-900 border border-slate-200">
                    {credentials.password}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-4 flex items-start gap-2">
                <span>⚠️</span>
                <span>Bu bilgileri mutlaka kaydedin! Şifrenizi sonradan göremezsiniz.</span>
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="space-y-4"
            >
              <button
                onClick={handleDownloadCredentials}
                className="w-full py-4 bg-gradient-to-r from-brand-orange to-orange-500 hover:from-orange-500 hover:to-brand-orange text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Download size={22} />
                Üyelik Bilgilerini İndir
              </button>

              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/"
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <Home size={18} />
                  Ana Sayfa
                </Link>
                
                <Link
                  to="/partner"
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <LogIn size={18} />
                  Giriş Yap
                </Link>
              </div>
            </motion.div>

            {/* Footer Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center pt-6 border-t border-slate-200"
            >
              <p className="text-sm text-slate-600">
                Sorunuz mu var? <a href="mailto:destek@yolmov.com" className="text-brand-orange font-semibold hover:underline">destek@yolmov.com</a>
              </p>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PartnerRegistrationSuccess;
