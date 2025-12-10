/**
 * Yolmov Voice - Giden Arama UI
 * 
 * Müşteri arama yaptığında gösterilen tam ekran UI.
 * Partner'ın cevaplamasını beklerken gösterilir.
 * 
 * Fullscreen API kullanılarak gerçek tam ekran modu aktif edilir.
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, User, X, Loader2 } from 'lucide-react';
import { useCall } from '../../context/CallContext';

// Fullscreen API helper
const enterFullscreen = async (element: HTMLElement | null) => {
  if (!element) return;
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
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

const OutgoingCallUI: React.FC = () => {
  const { callStatus, currentCall, endCall, error, isIncoming } = useCall();
  const [dots, setDots] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Partner mı kontrol et (mor tema için)
  const isPartnerUser = (() => {
    try {
      const partnerData = localStorage.getItem('yolmov_partner');
      return !!partnerData;
    } catch {
      return false;
    }
  })();
  
  // Admin'e mi arıyoruz?
  const isCallingAdmin = currentCall?.receiverType === 'admin';
  
  // Tema renkleri - partner->admin mor, diğerleri turuncu
  const themeColors = (isPartnerUser && isCallingAdmin) ? {
    gradientFrom: 'from-purple-900',
    gradientVia: 'via-purple-800',
    accent: 'text-purple-400',
    pulseColor: 'bg-purple-500',
    pulseColor2: 'bg-purple-400',
    avatarFrom: 'from-purple-600',
    avatarTo: 'to-purple-700'
  } : {
    gradientFrom: 'from-orange-900',
    gradientVia: 'via-orange-800',
    accent: 'text-orange-400',
    pulseColor: 'bg-orange-500',
    pulseColor2: 'bg-orange-400',
    avatarFrom: 'from-orange-600',
    avatarTo: 'to-orange-700'
  };

  // Fullscreen mode - arama başladığında aktif et
  useEffect(() => {
    if (callStatus === 'calling' && !isIncoming) {
      enterFullscreen(document.documentElement);
    }
    return () => {
      // Arama bittiğinde fullscreen'den çık
      if (callStatus !== 'calling' && callStatus !== 'connected') {
        exitFullscreen();
      }
    };
  }, [callStatus, isIncoming]);

  // Animasyonlu noktalar
  useEffect(() => {
    if (callStatus === 'calling') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [callStatus]);

  // Sadece giden arama (calling) durumunda ve gelen arama değilse göster
  if (callStatus !== 'calling' || isIncoming) return null;

  const handleEndCall = async () => {
    await exitFullscreen();
    endCall();
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[9999] bg-gradient-to-b ${themeColors.gradientFrom} ${themeColors.gradientVia} to-slate-900 flex flex-col items-center justify-between py-12 px-6`}
      >
        {/* Üst Kısım - Yolmov Voice Badge */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
            <Phone size={14} className={themeColors.accent} />
            <span className="text-white/80 text-sm font-medium">Yolmov Voice</span>
          </div>
          
          {/* Hata mesajı */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 px-4 py-2 bg-red-500/20 rounded-lg"
            >
              <span className="text-red-300 text-sm">{error}</span>
            </motion.div>
          )}
        </div>

        {/* Orta Kısım - Aranan Bilgisi */}
        <div className="flex flex-col items-center text-center">
          {/* Animasyonlu Avatar */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative mb-8"
          >
            {/* Pulse Efekti */}
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`absolute inset-0 w-32 h-32 rounded-full ${themeColors.pulseColor}`}
            />
            <motion.div
              animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className={`absolute inset-0 w-32 h-32 rounded-full ${themeColors.pulseColor2}`}
            />
            
            {/* Avatar */}
            <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${themeColors.avatarFrom} ${themeColors.avatarTo} flex items-center justify-center text-white shadow-2xl border-4 border-white/10`}>
              <User size={56} strokeWidth={1.5} />
            </div>
          </motion.div>

          {/* İsim */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white mb-2"
          >
            {currentCall?.receiverName || (currentCall?.receiverType === 'admin' ? 'Yolmov Destek' : 'Partner')}
          </motion.h2>

          {/* Aranıyor Animasyonu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 mt-4"
          >
            <Loader2 size={20} className={`${themeColors.accent} animate-spin`} />
            <span className="text-white/70 text-lg">
              {currentCall?.receiverType === 'admin' ? 'Destek hattı aranıyor' : 'Aranıyor'}{dots}
            </span>
          </motion.div>

          {/* Bilgilendirme */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/40 text-sm mt-8 max-w-xs"
          >
            {currentCall?.receiverType === 'admin' 
              ? 'Yolmov temsilcisi cevapladığında görüşme başlayacak'
              : 'Partner cevapladığında görüşme başlayacak'}
          </motion.p>
        </div>

        {/* Alt Kısım - Kapat Butonu */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <button
            onClick={handleEndCall}
            className="group w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all active:scale-95"
          >
            <PhoneOff size={32} className="text-white" />
          </button>
          <span className="text-white/50 text-sm">Aramayı İptal Et</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OutgoingCallUI;
