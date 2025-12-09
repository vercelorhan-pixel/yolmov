import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Number */}
          <div className="relative mb-8">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[150px] md:text-[200px] font-display font-bold text-brand-orange leading-none"
            >
              404
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <Search size={80} className="text-white/10" />
            </motion.div>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500/20 rounded-full border-2 border-orange-500/30">
              <AlertCircle size={40} className="text-brand-orange" />
            </div>
          </motion.div>

          {/* Title & Description */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
              Sayfa Bulunamadı
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-lg mx-auto">
              Aradığınız sayfa mevcut değil, taşınmış ya da silinmiş olabilir. Ana sayfaya dönebilirsiniz.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <Home size={20} />
              Ana Sayfaya Dön
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-8 py-4 bg-white/10 text-white rounded-xl font-bold border-2 border-white/20 hover:bg-white/20 transition-all"
            >
              Geri Dön
            </button>
          </motion.div>

          {/* Decorative Elements */}
          <div className="mt-16 flex justify-center gap-3">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="w-2 h-2 bg-brand-orange rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
