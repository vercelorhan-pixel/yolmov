/**
 * Yolmov Voice - Arama Durumu Göstergesi
 * 
 * Arama yapılırken veya gelen arama varken gösterilen küçük gösterge.
 * Header veya floating olarak kullanılabilir.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneIncoming, PhoneCall, X } from 'lucide-react';
import { useCall } from '../../context/CallContext';

interface CallStatusIndicatorProps {
  onClick?: () => void;
}

const CallStatusIndicator: React.FC<CallStatusIndicatorProps> = ({ onClick }) => {
  const { callStatus, isIncoming, currentCall, endCall, callDuration } = useCall();

  // Arama yoksa gösterme
  if (callStatus === 'idle' || callStatus === 'ended') return null;

  // Süreyi formatla
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Duruma göre renk ve ikon
  const getStatusConfig = () => {
    if (isIncoming && callStatus === 'ringing') {
      return {
        bg: 'bg-blue-500',
        icon: PhoneIncoming,
        text: 'Gelen Arama',
        animate: true,
      };
    }
    if (callStatus === 'calling') {
      return {
        bg: 'bg-yellow-500',
        icon: Phone,
        text: 'Aranıyor...',
        animate: true,
      };
    }
    if (callStatus === 'connected') {
      return {
        bg: 'bg-green-500',
        icon: PhoneCall,
        text: formatDuration(callDuration),
        animate: false,
      };
    }
    return null;
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={onClick}
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[9990]
        ${config.bg} rounded-full px-4 py-2 shadow-lg cursor-pointer
        flex items-center gap-2
      `}
    >
      <motion.div
        animate={config.animate ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Icon size={18} className="text-white" />
      </motion.div>
      <span className="text-white font-medium text-sm">{config.text}</span>
      
      {callStatus === 'connected' && (
        <button
          onClick={(e) => { e.stopPropagation(); endCall(); }}
          className="ml-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <X size={14} className="text-white" />
        </button>
      )}
    </motion.div>
  );
};

export default CallStatusIndicator;
