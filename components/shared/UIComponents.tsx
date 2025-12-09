import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => {
  return (
    <Loader2 size={size} className={`animate-spin ${className}`} />
  );
};

export const FullPageSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={48} className="text-orange-500" />
        <p className="text-sm text-slate-600 font-medium">Yükleniyor...</p>
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-slate-200 rounded-xl"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-slate-200 rounded w-full"></div>
        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
        <div className="h-3 bg-slate-200 rounded w-4/6"></div>
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 p-4 border-b border-slate-200">
        <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              <div className="h-2 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div className="h-8 bg-slate-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon, title, description, action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {icon && (
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-slate-700 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 max-w-md mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Bir Hata Oluştu', message, onRetry }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center"
    >
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <h3 className="text-lg font-bold text-red-900 mb-2">{title}</h3>
      <p className="text-sm text-red-700 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
        >
          Tekrar Dene
        </button>
      )}
    </motion.div>
  );
};

export const SuccessToast: React.FC<{ message: string; onClose?: () => void }> = ({ message, onClose }) => {
  React.useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
    >
      <span className="text-xl">✓</span>
      <span className="font-medium">{message}</span>
    </motion.div>
  );
};

export const ErrorToast: React.FC<{ message: string; onClose?: () => void }> = ({ message, onClose }) => {
  React.useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
    >
      <span className="text-xl">✕</span>
      <span className="font-medium">{message}</span>
    </motion.div>
  );
};

export const Badge: React.FC<{
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ variant = 'neutral', children, size = 'md' }) => {
  const variants = {
    success: 'bg-green-100 text-green-700 border-green-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
};
