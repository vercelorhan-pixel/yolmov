import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabase';

const EmailConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Email doğrulanıyor...');

  useEffect(() => {
    handleEmailConfirmation();
  }, []);

  const handleEmailConfirmation = async () => {
    try {
      // URL'den hash parametrelerini al
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (type === 'signup' && accessToken) {
        // Email doğrulama başarılı
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        if (error) throw error;

        if (user) {
          setStatus('success');
          setMessage('Email adresiniz başarıyla doğrulandı!');
          
          // 3 saniye sonra login sayfasına yönlendir
          setTimeout(() => {
            navigate('/giris/musteri');
          }, 3000);
        } else {
          throw new Error('Kullanıcı bulunamadı');
        }
      } else {
        // Geçersiz link
        setStatus('error');
        setMessage('Geçersiz doğrulama linki');
      }
    } catch (error: any) {
      console.error('❌ Email confirmation error:', error);
      setStatus('error');
      setMessage(error.message || 'Email doğrulama başarısız oldu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
              <Loader2 size={40} className="text-brand-orange animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center"
            >
              <CheckCircle2 size={40} className="text-green-600" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center"
            >
              <XCircle size={40} className="text-red-600" />
            </motion.div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {status === 'loading' && 'Doğrulanıyor...'}
          {status === 'success' && 'Başarılı! 🎉'}
          {status === 'error' && 'Hata! ❌'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8 text-lg">
          {message}
        </p>

        {/* Action Buttons */}
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-gray-500 mb-4">
              3 saniye sonra giriş sayfasına yönlendirileceksiniz...
            </p>
            <button
              onClick={() => navigate('/giris/musteri')}
              className="px-8 py-3 bg-gradient-to-r from-brand-orange to-brand-lightOrange text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              Hemen Giriş Yap
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <button
              onClick={() => navigate('/giris/musteri')}
              className="w-full px-6 py-3 bg-gradient-to-r from-brand-orange to-brand-lightOrange text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Giriş Sayfasına Dön
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              Ana Sayfaya Git
            </button>
          </motion.div>
        )}

        {/* Logo */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <span className="yolmov-logo text-2xl font-bold text-gray-800 opacity-50 block text-center">yolmov</span>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailConfirmationPage;
