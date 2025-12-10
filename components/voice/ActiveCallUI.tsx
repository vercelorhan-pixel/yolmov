/**
 * Yolmov Voice - Aktif Görüşme UI
 * 
 * Görüşme devam ederken gösterilen ekran.
 * Süre, ses kontrolleri ve kapatma butonu içerir.
 * 
 * Fullscreen API kullanılarak gerçek tam ekran modu aktif edilir.
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, User, Clock, X, Minimize2 } from 'lucide-react';
import { useCall } from '../../context/CallContext';

// Fullscreen API helper
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

interface ActiveCallUIProps {
  minimized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

const ActiveCallUI: React.FC<ActiveCallUIProps> = ({ minimized = false, onMinimize, onMaximize }) => {
  const { 
    callStatus, 
    currentCall, 
    callerInfo,
    isIncoming,
    endCall, 
    isMuted, 
    toggleMute, 
    isSpeakerOn, 
    toggleSpeaker,
    callDuration 
  } = useCall();

  // Görüşme bittiğinde fullscreen'den çık
  useEffect(() => {
    if (callStatus === 'ended' || callStatus === 'idle') {
      exitFullscreen();
    }
  }, [callStatus]);

  // Sadece bağlı durumda göster
  if (callStatus !== 'connected') return null;

  // Süreyi formatla
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Görüşmeyi sonlandır ve fullscreen'den çık
  const handleEndCall = async () => {
    await exitFullscreen();
    endCall();
  };

  // Karşı tarafın bilgisi - giden/gelen aramaya göre farklı göster
  // Giden arama (biz aradık): receiverName göster
  // Gelen arama (bizi aradılar): callerInfo göster
  const otherPartyName = isIncoming
    ? (callerInfo?.name || callerInfo?.company_name || currentCall?.callerName || 'Arayan')
    : (currentCall?.receiverName || (currentCall?.receiverType === 'admin' ? 'Yolmov Destek' : 'Partner'));

  // Minimize mod - küçük floating bar
  if (minimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={onMaximize}
        className="fixed bottom-20 left-4 right-4 z-[9998] bg-green-600 rounded-2xl p-4 shadow-2xl cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Phone size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{otherPartyName}</p>
              <p className="text-white/70 text-xs flex items-center gap-1">
                <Clock size={12} />
                {formatDuration(callDuration)}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleEndCall(); }}
            className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center"
          >
            <PhoneOff size={18} className="text-white" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Tam ekran mod
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-gradient-to-b from-green-900 via-green-800 to-slate-900 flex flex-col items-center justify-between py-12 px-6"
      >
        {/* Üst Kısım - Minimize ve Süre */}
        <div className="w-full flex items-center justify-between">
          <button
            onClick={onMinimize}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Minimize2 size={20} className="text-white" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-sm font-medium">Görüşme Devam Ediyor</span>
          </div>

          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Orta Kısım - Kullanıcı Bilgisi */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-6">
            {/* Ses dalgası animasyonu */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 w-32 h-32 rounded-full bg-green-400"
            />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white shadow-2xl border-4 border-green-400/30">
              <User size={56} strokeWidth={1.5} />
            </div>
          </div>

          {/* İsim */}
          <h2 className="text-3xl font-bold text-white mb-2">
            {otherPartyName}
          </h2>

          {/* Süre */}
          <div className="flex items-center gap-2 text-white/70 text-xl">
            <Clock size={20} />
            <span className="font-mono">{formatDuration(callDuration)}</span>
          </div>
        </div>

        {/* Alt Kısım - Kontroller */}
        <div className="flex flex-col items-center gap-8">
          {/* Ses Kontrolleri */}
          <div className="flex items-center gap-6">
            {/* Mikrofon */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isMuted 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Hoparlör */}
            <button
              onClick={toggleSpeaker}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                !isSpeakerOn 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
          </div>

          {/* Kapat Butonu */}
          <button
            onClick={handleEndCall}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors active:scale-95"
          >
            <PhoneOff size={32} className="text-white" />
          </button>

          <span className="text-white/50 text-sm">Görüşmeyi Sonlandır</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActiveCallUI;
