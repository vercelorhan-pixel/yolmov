/**
 * AdminIncomingCallToast - Admin Paneli için Gelen Çağrı Bildirimi
 * 
 * Admin kullanıcıları için fullscreen modal yerine köşede gösterilen
 * kompakt çağrı bildirimi. Admin çalışmasını kesintiye uğratmadan
 * çağrıları yönetebilir.
 * 
 * Müşteri vs Partner çağrılarını ayırt eder.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, User, Building2, X } from 'lucide-react';
import { useCall } from '../../context/CallContext';

const AdminIncomingCallToast: React.FC = () => {
  const { isIncoming, callStatus, callerInfo, currentCall, answerCall, rejectCall } = useCall();

  // Admin kontrolü
  const isAdminUser = (() => {
    try {
      const adminData = localStorage.getItem('yolmov_admin');
      return !!adminData;
    } catch {
      return false;
    }
  })();

  // Sadece admin kullanıcıları için ve gelen arama durumunda göster
  if (!isAdminUser || !isIncoming || callStatus !== 'ringing') {
    return null;
  }

  const callerName = callerInfo?.name || callerInfo?.company_name || 'Arayan';
  const callerPhone = callerInfo?.phone || '';
  const callerType = currentCall?.callerType;
  
  // Arayan tipine göre etiket
  const callerLabel = callerType === 'partner' ? 'Partner' : 'Müşteri';
  const CallerIcon = callerType === 'partner' ? Building2 : User;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, x: 100 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: -100, x: 100 }}
        className="fixed top-4 right-4 z-[9999] w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-white"
            />
            <span className="text-white font-semibold text-sm">Gelen Çağrı</span>
          </div>
          <button
            onClick={rejectCall}
            className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Caller Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <CallerIcon size={24} className="text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{callerName}</h3>
              {callerPhone && (
                <p className="text-sm text-gray-500 truncate">{callerPhone}</p>
              )}
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                callerType === 'partner' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                <CallerIcon size={10} />
                {callerLabel}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={rejectCall}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors active:scale-95"
            >
              <PhoneOff size={18} />
              <span>Reddet</span>
            </button>
            <motion.button
              onClick={answerCall}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors active:scale-95"
            >
              <Phone size={18} />
              <span>Cevapla</span>
            </motion.button>
          </div>
        </div>

        {/* Ringing Animation Bar */}
        <motion.div
          className="h-1 bg-green-500"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 30, ease: 'linear' }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminIncomingCallToast;
