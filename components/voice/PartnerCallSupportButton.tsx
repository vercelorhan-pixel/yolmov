/**
 * PartnerCallSupportButton - Partner için Admin Destek Hattı Arama Butonu
 * 
 * Partner'ların admin destek hattını araması için özel buton.
 * Mor/mavi tema ile B2C butonundan ayrılır.
 * Partner bilgileri otomatik olarak localStorage'dan alınır.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Loader2, Headphones, AlertCircle } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import callCenterService from '../../services/callCenterService';

interface PartnerCallSupportButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const PartnerCallSupportButton: React.FC<PartnerCallSupportButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  label = 'Destek Hattını Ara',
}) => {
  const { startCall, callStatus } = useCall();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Partner bilgilerini localStorage'dan al
  const getPartnerInfo = () => {
    try {
      const partnerData = localStorage.getItem('yolmov_partner');
      if (partnerData) {
        const partner = JSON.parse(partnerData);
        return {
          id: partner.id || partner.partner_id,
          name: partner.company_name || partner.name || 'Partner',
          phone: partner.phone || '',
        };
      }
    } catch {}
    return null;
  };

  const handleStartCall = async () => {
    const partnerInfo = getPartnerInfo();
    if (!partnerInfo) {
      setError('Partner bilgileri bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    setLoading(true);
    setError(null);
    setShowConfirm(false);

    try {
      // 1. Çağrıyı partner-calls kuyruğuna ekle
      const assignment = await callCenterService.addToQueue({
        queueSlug: 'partner-calls',
        sourceType: 'partner-direct',
        sourcePage: '/partner/support',
        callerName: partnerInfo.name,
        callerPhone: partnerInfo.phone,
      });

      if (!assignment) {
        throw new Error('Çağrı kuyruğa eklenemedi');
      }

      console.log('📞 [PartnerCallSupport] Added to queue:', assignment.id);

      // 2. Agent atandıysa WebRTC başlat
      if (assignment.status === 'ringing' && assignment.assigned_agent_id) {
        const callData = await callCenterService.getCallById(assignment.call_id!);
        
        if (callData?.receiver_id) {
          console.log('✅ [PartnerCallSupport] Starting WebRTC call to agent:', callData.receiver_id);
          
          // WebRTC aramasını başlat
          await startCall(callData.receiver_id, 'admin', assignment.call_id!, 'Yolmov Partner Destek');
        } else {
          throw new Error('Agent bilgisi alınamadı');
        }
      } else {
        setError('Şu an tüm temsilcilerimiz meşgul. Lütfen kısa bir süre sonra tekrar deneyin.');
      }

    } catch (err: any) {
      console.error('Partner call start error:', err);
      if (err.message?.includes('NO_AVAILABLE_AGENT')) {
        setError('Şu anda müsait temsilci bulunmuyor. Lütfen birkaç dakika sonra tekrar deneyin.');
      } else {
        setError('Bağlantı kurulamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3',
    lg: 'px-6 py-4 text-lg',
  };

  // Variant classes - Mor/Mavi tema (Partner için)
  const variantClasses = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200',
    secondary: 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50',
  };

  const isInCall = callStatus === 'calling' || callStatus === 'connected' || callStatus === 'ringing';

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowConfirm(true)}
        disabled={loading || isInCall}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
          rounded-xl font-bold flex items-center justify-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
        `}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Bağlanıyor...</span>
          </>
        ) : isInCall ? (
          <>
            <Phone size={18} className="animate-pulse" />
            <span>Görüşmede</span>
          </>
        ) : (
          <>
            <Headphones size={18} />
            <span>{label}</span>
          </>
        )}
      </motion.button>

      {/* Onay Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Headphones size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Partner Destek Hattı</h2>
                      <p className="text-sm text-purple-200">Yolmov operasyon ekibi</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                <div className="bg-purple-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-purple-800">
                    <strong>Partner Destek Hattı</strong>'nı arayarak operasyonel sorunlarınız, 
                    müşteri şikayetleri veya teknik konularda yardım alabilirsiniz.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    İptal
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartCall}
                    disabled={loading}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Bağlanıyor...</span>
                      </>
                    ) : (
                      <>
                        <Phone size={18} />
                        <span>Şimdi Ara</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PartnerCallSupportButton;
