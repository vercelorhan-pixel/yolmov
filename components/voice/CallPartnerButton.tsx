/**
 * Yolmov Voice - Partner'ı Ara Butonu
 * 
 * Müşterinin partner detay sayfasında kullanacağı arama butonu.
 * Arama durumuna göre farklı görünümler gösterir.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneCall, PhoneOff, Loader2 } from 'lucide-react';
import { useCustomerPartnerCall } from '../../context/CustomerToPartnerCallContext';

interface CallPartnerButtonProps {
  partnerId: string;
  partnerName?: string;
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CallPartnerButton: React.FC<CallPartnerButtonProps> = ({
  partnerId,
  partnerName,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const { callStatus, startCall, endCall, currentCall } = useCustomerPartnerCall();

  // Bu partner için aktif arama var mı?
  const isCallingThisPartner = currentCall?.partner_id === partnerId;
  const isInActiveCall = callStatus === 'connected' || callStatus === 'calling';

  // Butona tıklama
  const handleClick = () => {
    if (isCallingThisPartner && callStatus === 'calling') {
      // Aramayı iptal et
      endCall();
    } else if (!isInActiveCall) {
      // Yeni arama başlat
      startCall(partnerId);
    }
  };

  // Buton durumuna göre içerik
  const getButtonContent = () => {
    if (isCallingThisPartner) {
      if (callStatus === 'calling') {
        return (
          <>
            <Loader2 size={iconSize} className="animate-spin" />
            <span>Aranıyor...</span>
          </>
        );
      }
      if (callStatus === 'connected') {
        return (
          <>
            <PhoneCall size={iconSize} className="animate-pulse" />
            <span>Görüşmede</span>
          </>
        );
      }
    }

    return (
      <>
        <Phone size={iconSize} />
        <span>Hemen Ara</span>
      </>
    );
  };

  // Buton stilleri
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-5 py-3 text-base gap-2',
    lg: 'px-6 py-4 text-lg gap-2.5',
  };

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;

  const variantClasses = {
    primary: isCallingThisPartner && callStatus === 'calling'
      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
      : isCallingThisPartner && callStatus === 'connected'
        ? 'bg-green-500 hover:bg-green-600 text-white'
        : 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50',
    minimal: 'bg-transparent text-orange-600 hover:bg-orange-50',
  };

  // Disabled durumu - başka bir aramadaysa
  const isDisabled = isInActiveCall && !isCallingThisPartner;

  return (
    <motion.button
      onClick={handleClick}
      disabled={isDisabled}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center font-bold rounded-xl transition-all
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {getButtonContent()}
    </motion.button>
  );
};

export default CallPartnerButton;
