/**
 * Emergency Floating Button - Modern WhatsApp-style FAB
 * Sadece SEO sayfalarında görünür (SEOServicePage, SEOBrandPage)
 */

import React, { useState } from 'react';
import { AlertCircle, X, Clock, Car, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface EmergencyFloatingButtonProps {
  city?: string;
  district?: string;
  service?: string;
  brand?: string;
}

type UrgencyLevel = 'urgent' | 'normal' | null;
type VehicleType = 'sedan' | 'suv' | 'commercial' | 'motorcycle' | null;

const EmergencyFloatingButton: React.FC<EmergencyFloatingButtonProps> = ({
  city,
  district,
  service,
  brand
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [urgency, setUrgency] = useState<UrgencyLevel>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>(null);

  const handleUrgencySelect = (level: UrgencyLevel) => {
    setUrgency(level);
    setStep(2);
  };

  const handleVehicleSelect = (type: VehicleType) => {
    setVehicleType(type);
    setStep(3);
  };

  const handleSubmit = () => {
    // State ile teklif formuna yönlendir
    navigate('/teklif', {
      state: {
        city,
        district,
        service: service || 'cekici',
        vehicleBrand: brand,
        vehicleType,
        urgency,
        source: 'emergency_button'
      }
    });
  };

  const resetFlow = () => {
    setIsOpen(false);
    setStep(1);
    setUrgency(null);
    setVehicleType(null);
  };

  return (
    <>
      {/* Floating Button - Sağ Alt Köşe */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-full shadow-2xl transition-all"
            style={{
              boxShadow: '0 10px 40px rgba(220, 38, 38, 0.4)'
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <AlertCircle size={24} />
            </motion.div>
            <span className="text-base">🚨 ACİL YARDIM</span>
            
            {/* Pulse Ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-red-600 opacity-75"
              animate={{ scale: [1, 1.3, 1.3], opacity: [0.75, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-up Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetFlow}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <AlertCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Acil Yardım</h2>
                    <p className="text-sm text-slate-600">Yolmov Dijital Dispeçer</p>
                  </div>
                </div>
                <button
                  onClick={resetFlow}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="px-6 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">Adım {step}/3</span>
                  <span className="text-xs text-slate-500">{Math.round((step / 3) * 100)}% Tamamlandı</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / 3) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-red-500 to-red-600"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-8 overflow-y-auto max-h-[calc(85vh-140px)]">
                {/* Step 1: Urgency */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      Durum ne kadar acil?
                    </h3>
                    <p className="text-slate-600 mb-6">
                      {city && district ? (
                        <>{city} {district} bölgesinde en uygun hizmeti bulalım</>
                      ) : (
                        <>Size en uygun hizmeti bulalım</>
                      )}
                    </p>

                    <button
                      onClick={() => handleUrgencySelect('urgent')}
                      className="w-full group relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                          🔥
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-bold text-lg mb-1">ÇOK ACİL</div>
                          <div className="text-sm text-white/90">Ortalama 10-15 dakika içinde</div>
                        </div>
                        <ArrowRight size={24} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>

                    <button
                      onClick={() => handleUrgencySelect('normal')}
                      className="w-full group relative overflow-hidden bg-white border-2 border-slate-200 hover:border-slate-300 p-6 rounded-2xl transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                          <Clock size={28} className="text-slate-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-bold text-lg mb-1 text-slate-900">Normal</div>
                          <div className="text-sm text-slate-600">Ortalama 25-35 dakika içinde</div>
                        </div>
                        <ArrowRight size={24} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  </motion.div>
                )}

                {/* Step 2: Vehicle Type */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      Aracınızın tipi nedir?
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Doğru ekipmanla gelmeleri için bilgilendirin
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleVehicleSelect('sedan')}
                        className="group bg-white border-2 border-slate-200 hover:border-blue-500 p-5 rounded-2xl transition-all hover:shadow-lg"
                      >
                        <div className="text-4xl mb-3">🚘</div>
                        <div className="font-bold text-slate-900">Sedan</div>
                        <div className="text-xs text-slate-500 mt-1">Binek araç</div>
                      </button>

                      <button
                        onClick={() => handleVehicleSelect('suv')}
                        className="group bg-white border-2 border-slate-200 hover:border-blue-500 p-5 rounded-2xl transition-all hover:shadow-lg"
                      >
                        <div className="text-4xl mb-3">🚙</div>
                        <div className="font-bold text-slate-900">SUV/Jip</div>
                        <div className="text-xs text-slate-500 mt-1">Yüksek şase</div>
                      </button>

                      <button
                        onClick={() => handleVehicleSelect('commercial')}
                        className="group bg-white border-2 border-slate-200 hover:border-blue-500 p-5 rounded-2xl transition-all hover:shadow-lg"
                      >
                        <div className="text-4xl mb-3">🚐</div>
                        <div className="font-bold text-slate-900">Ticari</div>
                        <div className="text-xs text-slate-500 mt-1">Minibüs/Kamyonet</div>
                      </button>

                      <button
                        onClick={() => handleVehicleSelect('motorcycle')}
                        className="group bg-white border-2 border-slate-200 hover:border-blue-500 p-5 rounded-2xl transition-all hover:shadow-lg"
                      >
                        <div className="text-4xl mb-3">🏍️</div>
                        <div className="font-bold text-slate-900">Motor</div>
                        <div className="text-xs text-slate-500 mt-1">Motosiklet</div>
                      </button>
                    </div>

                    <button
                      onClick={() => setStep(1)}
                      className="w-full mt-4 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    >
                      ← Geri Dön
                    </button>
                  </motion.div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                      >
                        <CheckCircle size={40} className="text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">
                        Hazırız!
                      </h3>
                      <p className="text-slate-600">
                        Bilgileriniz alındı, size en uygun seçenekleri gösterelim
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Bölge:</span>
                        <span className="font-bold text-slate-900">
                          {city && district ? `${city}, ${district}` : 'Belirtilmedi'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Hizmet:</span>
                        <span className="font-bold text-slate-900">
                          {service === 'cekici' ? '🚗 Çekici' : 
                           service === 'aku' ? '🔋 Akü' :
                           service === 'lastik' ? '🛞 Lastik' :
                           service === 'yakit' ? '⛽ Yakıt' :
                           service === 'anahtar' ? '🔑 Anahtar' : 'Genel'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Aciliyet:</span>
                        <span className="font-bold text-slate-900">
                          {urgency === 'urgent' ? '🔥 Çok Acil (15dk)' : '⏱️ Normal (30dk)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Araç:</span>
                        <span className="font-bold text-slate-900">
                          {vehicleType === 'sedan' ? '🚘 Sedan' :
                           vehicleType === 'suv' ? '🚙 SUV/Jip' :
                           vehicleType === 'commercial' ? '🚐 Ticari' :
                           '🏍️ Motor'}
                        </span>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={handleSubmit}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-3"
                      >
                        <span className="text-lg">TEKLİF AL</span>
                        <ArrowRight size={24} />
                      </button>
                      
                      <button
                        onClick={() => setStep(2)}
                        className="w-full py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                      >
                        ← Bilgileri Düzenle
                      </button>
                    </div>

                    <p className="text-xs text-center text-slate-500 mt-4">
                      Teklif almak ücretsizdir. Kredi kartı bilgisi gerekmez.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmergencyFloatingButton;
