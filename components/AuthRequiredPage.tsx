import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthRequiredPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Nereden geldiğimizi state'ten alalım
  const message = location.state?.message || 'Bu işlemi yapmak için üye girişi yapmanız gerekiyor.';
  const returnUrl = location.state?.returnUrl || '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Lock Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-brand-orange/20 rounded-full blur-xl"></div>
            <div className="relative bg-white rounded-full p-6 shadow-lg">
              <Lock className="text-brand-orange" size={64} />
            </div>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
            Üye Girişi Gerekli
          </h1>
          
          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            {message}
          </p>

          <div className="space-y-3">
            {/* Giriş Yap Butonu */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/giris/musteri', { state: { returnUrl } })}
              className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-brand-lightOrange transition-all flex items-center justify-center gap-3 group"
            >
              <LogIn size={20} />
              <span>Giriş Yap</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Üye Ol Butonu */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/giris/musteri', { state: { returnUrl } })}
              className="w-full bg-white text-brand-orange py-4 rounded-xl font-bold border-2 border-brand-orange hover:bg-orange-50 transition-all flex items-center justify-center gap-3 group"
            >
              <UserPlus size={20} />
              <span>Üye Ol</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Geri Dön */}
            <button
              onClick={() => navigate(-1)}
              className="w-full text-gray-500 py-3 rounded-xl font-medium hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              Geri Dön
            </button>
          </div>
        </motion.div>

        {/* Alt Bilgi */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-500 text-sm mt-6"
        >
          Yolmov hesabınızla tüm hizmetlere erişebilirsiniz
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AuthRequiredPage;
