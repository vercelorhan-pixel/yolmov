import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Upload, Image as ImageIcon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'upload' | 'processing';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose, 
  isVisible 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'info':
        return <Info className="text-blue-500" size={20} />;
      case 'upload':
        return <Upload className="text-brand-orange" size={20} />;
      case 'processing':
        return <ImageIcon className="text-brand-orange animate-pulse" size={20} />;
      default:
        return <CheckCircle2 className="text-green-500" size={20} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'upload':
      case 'processing':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      case 'upload':
      case 'processing':
        return 'text-orange-800';
      default:
        return 'text-green-800';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed top-4 right-4 z-[10000] max-w-md"
        >
          <div className={`${getBackgroundColor()} border rounded-xl shadow-lg p-4 flex items-start gap-3`}>
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <p className={`${getTextColor()} flex-1 text-sm font-medium leading-relaxed`}>
              {message}
            </p>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
