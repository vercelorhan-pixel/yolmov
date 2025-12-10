/**
 * CallSupportButton - Web Sitesi için Destek Hattı Arama Butonu
 * 
 * Kullanıcıların web sitesinden Yolmov destek hattını aramasını sağlar.
 * Çağrı, admin paneldeki çağrı merkezine (queue) yönlendirilir.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Loader2, User, MessageSquare, Headphones } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import callCenterService, { QueueSourceType } from '../../services/callCenterService';

interface CallSupportButtonProps {
  variant?: 'primary' | 'secondary' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  queueSlug?: string; // Varsayılan: 'general-support'
  sourceType?: QueueSourceType;
  sourcePage?: string;
  className?: string;
  label?: string;
}

const CallSupportButton: React.FC<CallSupportButtonProps> = ({
  variant = 'primary',
  size = 'md',
  queueSlug = 'general-support',
  sourceType = 'web-contact',
  sourcePage,
  className = '',
  label = 'Bizi Arayın',
}) => {
  const { startCall, callStatus } = useCall();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleStartCall = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Çağrıyı kuyruğa ekle ve uygun agent var mı kontrol et
      const assignment = await callCenterService.addToQueue({
        queueSlug,
        sourceType,
        sourcePage: sourcePage || window.location.pathname,
        callerName: formData.name || undefined,
        callerPhone: formData.phone || undefined,
        callerMessage: formData.message || undefined,
      });

      if (!assignment) {
        throw new Error('Çağrı kuyruğa eklenemedi');
      }

      console.log('📞 [CallSupport] Added to queue:', assignment.id);

      // 2. Assignment durumuna göre işlem yap
      if (assignment.status === 'ringing' && assignment.assigned_agent_id) {
        // Agent atandı - Şimdi WebRTC aramasını başlat!
        // calls tablosundan receiver_id'yi al (admin_id olarak set edilmiş olmalı)
        const callData = await callCenterService.getCallById(assignment.call_id!);
        
        if (callData?.receiver_id) {
          console.log('✅ [CallSupport] Starting WebRTC call to agent:', callData.receiver_id);
          console.log('✅ [CallSupport] Using existing call_id:', assignment.call_id);
          
          // WebRTC aramasını başlat - Mevcut call_id'yi kullan, yeni kayıt oluşturma
          // Bu mikrofon izni isteyecek ve OutgoingCallUI gösterecek
          await startCall(callData.receiver_id, 'admin', assignment.call_id!);
          setShowModal(false);
        } else {
          throw new Error('Agent bilgisi alınamadı');
        }
      } else {
        // Uygun agent yok - kuyrukta beklet
        setError('Şu an tüm temsilcilerimiz meşgul. Lütfen kısa bir süre sonra tekrar deneyin veya mesaj bırakın.');
      }

    } catch (err) {
      console.error('Call start error:', err);
      setError('Bağlantı kurulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-brand-orange text-white hover:bg-brand-lightOrange shadow-lg shadow-orange-200',
    secondary: 'bg-white text-brand-orange border-2 border-brand-orange hover:bg-orange-50',
    floating: 'bg-brand-orange text-white hover:bg-brand-lightOrange shadow-xl fixed bottom-6 right-6 z-50 rounded-full !p-4',
  };

  // Floating variant
  if (variant === 'floating') {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className={`${variantClasses.floating} ${className}`}
          title="Bizi Arayın"
        >
          <Phone size={24} />
        </motion.button>

        <CallModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onCall={handleStartCall}
          loading={loading}
          error={error}
          formData={formData}
          setFormData={setFormData}
          callStatus={callStatus}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={callStatus !== 'idle'}
        className={`
          flex items-center justify-center gap-2 rounded-xl font-semibold transition-all
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${callStatus !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <Phone size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />
        {label}
      </button>

      <CallModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onCall={handleStartCall}
        loading={loading}
        error={error}
        formData={formData}
        setFormData={setFormData}
        callStatus={callStatus}
      />
    </>
  );
};

// =====================================================
// CALL MODAL
// =====================================================

interface CallModalProps {
  show: boolean;
  onClose: () => void;
  onCall: () => void;
  loading: boolean;
  error: string | null;
  formData: { name: string; phone: string; message: string };
  setFormData: React.Dispatch<React.SetStateAction<{ name: string; phone: string; message: string }>>;
  callStatus: string;
}

const CallModal: React.FC<CallModalProps> = ({
  show,
  onClose,
  onCall,
  loading,
  error,
  formData,
  setFormData,
  callStatus,
}) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-orange to-orange-500 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Headphones size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Yolmov Destek</h3>
                  <p className="text-sm text-white/80">7/24 Canlı Destek</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {callStatus !== 'idle' && callStatus !== 'ended' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="text-green-600 animate-pulse" size={32} />
                </div>
                <h4 className="text-lg font-bold text-gray-900">Arama Devam Ediyor</h4>
                <p className="text-gray-500 mt-2">Temsilcimize bağlanıyorsunuz...</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-sm">
                  Sorularınız için bizi hemen arayabilirsiniz. İsteğe bağlı olarak bilgilerinizi 
                  bırakabilirsiniz.
                </p>

                {/* Optional Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adınız (İsteğe bağlı)
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ahmet Yılmaz"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-orange-100 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon (İsteğe bağlı)
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0532 XXX XX XX"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-orange-100 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konu (İsteğe bağlı)
                    </label>
                    <div className="relative">
                      <MessageSquare size={18} className="absolute left-3 top-3 text-gray-400" />
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Nasıl yardımcı olabiliriz?"
                        rows={2}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-orange focus:ring-2 focus:ring-orange-100 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Call Button */}
                <button
                  onClick={onCall}
                  disabled={loading}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Bağlanıyor...
                    </>
                  ) : (
                    <>
                      <Phone size={20} />
                      Hemen Ara
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-400">
                  Bu görüşme kalite standartları gereği kayıt altına alınmaktadır.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallSupportButton;
