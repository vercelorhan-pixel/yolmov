/**
 * Yolmov Voice - Gelen Arama Modal'ı
 * 
 * Partner'ın ekranına düşen tam ekran gelen arama bildirimi.
 * WhatsApp/Telefon uygulaması tarzında tasarım.
 * 
 * ÖNEMLİ: Aramayı cevaplamak 1 kredi harcar!
 * 
 * Fullscreen API kullanılarak gerçek tam ekran modu aktif edilir.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, User, MapPin, Truck, Coins } from 'lucide-react';
import { useCall } from '../../context/CallContext';

// Fullscreen API helper
const enterFullscreen = async () => {
  try {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      await (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      await (elem as any).msRequestFullscreen();
    }
  } catch (err) {
    console.log('Fullscreen not supported or denied');
  }
};

const exitFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if ((document as any).webkitFullscreenElement) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).msFullscreenElement) {
      await (document as any).msExitFullscreen();
    }
  } catch (err) {
    console.log('Exit fullscreen failed');
  }
};

const IncomingCallModal: React.FC = () => {
  const { isIncoming, callStatus, callerInfo, answerCall, rejectCall, error } = useCall();

  // Debug log
  console.log('📞 [IncomingCallModal] isIncoming:', isIncoming, 'callStatus:', callStatus, 'callerInfo:', callerInfo);

  // Admin kullanıcıları için bu modal'ı gösterme - adminler toast notification alacak
  const isAdminUser = (() => {
    try {
      const adminData = localStorage.getItem('yolmov_admin');
      return !!adminData;
    } catch {
      return false;
    }
  })();

  // Fullscreen mode - gelen arama olduğunda aktif et (sadece partner için)
  useEffect(() => {
    if (isIncoming && callStatus === 'ringing' && !isAdminUser) {
      enterFullscreen();
    }
  }, [isIncoming, callStatus, isAdminUser]);

  // Admin kullanıcıları için gösterme - AdminIncomingCallToast kullanacaklar
  if (isAdminUser) {
    console.log('📞 [IncomingCallModal] Admin user detected, skipping fullscreen modal');
    return null;
  }

  // Sadece gelen arama durumunda göster
  if (!isIncoming || callStatus !== 'ringing') return null;

  const callerName = callerInfo?.name || callerInfo?.company_name || 'Müşteri';
  const callerPhone = callerInfo?.phone || '';

  const handleReject = async () => {
    await exitFullscreen();
    rejectCall();
  };

  const handleAnswer = async () => {
    // Cevaplama sonrasında fullscreen kalır (ActiveCallUI devam eder)
    answerCall();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-between py-12 px-6"
      >
        {/* Üst Kısım - Yolmov Voice Badge */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
            <Phone size={14} className="text-green-400" />
            <span className="text-white/80 text-sm font-medium">Yolmov Voice</span>
          </div>
        </div>

        {/* Orta Kısım - Arayan Bilgisi */}
        <div className="flex flex-col items-center text-center">
          {/* Animasyonlu Avatar */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative mb-8"
          >
            {/* Pulse Efekti */}
            <div className="absolute inset-0 w-36 h-36 rounded-full bg-green-500/20 animate-ping" />
            <div className="absolute inset-2 w-32 h-32 rounded-full bg-green-500/30 animate-pulse" />
            
            {/* Avatar */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white shadow-2xl border-4 border-white/10">
              <User size={56} strokeWidth={1.5} />
            </div>
          </motion.div>

          {/* İsim ve Bilgiler */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white mb-2"
          >
            {callerName}
          </motion.h2>
          
          {callerPhone && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-white/60 mb-4"
            >
              {callerPhone}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full"
          >
            <Truck size={16} className="text-orange-400" />
            <span className="text-orange-300 text-sm font-medium">Yol Yardım Talebi</span>
          </motion.div>

          {/* Aranıyor Animasyonu */}
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white/50 text-lg mt-8"
          >
            Müşteri arıyor...
          </motion.p>
          
          {/* Kredi Uyarısı */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full"
          >
            <Coins size={14} className="text-yellow-400" />
            <span className="text-yellow-300 text-xs font-medium">Cevaplamak 1 kredi harcar</span>
          </motion.div>
        </div>

        {/* Alt Kısım - Aksiyon Butonları */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-12"
        >
          {/* Reddet Butonu */}
          <button
            onClick={handleReject}
            className="group flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform group-hover:scale-110 group-active:scale-95">
              <PhoneOff size={28} className="text-white" />
            </div>
            <span className="text-white/60 text-sm font-medium">Reddet</span>
          </button>

          {/* Cevapla Butonu */}
          <button
            onClick={handleAnswer}
            className="group flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 transition-transform group-hover:scale-110 group-active:scale-95"
            >
              <Phone size={36} className="text-white" />
            </motion.div>
            <span className="text-white/60 text-sm font-medium">Cevapla</span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallModal;
