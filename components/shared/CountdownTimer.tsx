import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string; // ISO format date string
  onExpire?: () => void;
  variant?: 'default' | 'widget'; // widget: ucuzabilet tarzı kompakt tasarım
}

/**
 * Geri sayım sayacı komponenti
 * Kampanya bitiş tarihine kadar kalan süreyi gösterir
 */
const CountdownTimer: React.FC<CountdownTimerProps> = ({ endDate, onExpire, variant = 'default' }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    // İlk hesaplama
    calculateTimeLeft();

    // Her saniye güncelle
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate, onExpire]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg border border-gray-200">
        <Clock size={20} className="text-gray-400" />
        <span className="text-gray-600 font-medium">Kampanya sona erdi</span>
      </div>
    );
  }

  // Widget variant (ucuzabilet tarzı - kompakt, sarı arka plan)
  if (variant === 'widget') {
    return (
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl p-6 shadow-lg">
        <div className="text-center mb-4">
          <h3 className="text-white font-bold text-lg mb-1">Kalan Süre:</h3>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/95 backdrop-blur rounded-xl p-3 text-center shadow-md">
            <div className="text-3xl font-black text-orange-600">{timeLeft.days}</div>
            <div className="text-xs font-bold text-gray-700 mt-1 uppercase">Gün</div>
          </div>
          
          <div className="bg-white/95 backdrop-blur rounded-xl p-3 text-center shadow-md">
            <div className="text-3xl font-black text-orange-600">{timeLeft.hours}</div>
            <div className="text-xs font-bold text-gray-700 mt-1 uppercase">Sa</div>
          </div>
          
          <div className="bg-white/95 backdrop-blur rounded-xl p-3 text-center shadow-md">
            <div className="text-3xl font-black text-orange-600">{timeLeft.minutes}</div>
            <div className="text-xs font-bold text-gray-700 mt-1 uppercase">Dk</div>
          </div>
          
          <div className="bg-white/95 backdrop-blur rounded-xl p-3 text-center shadow-md">
            <div className="text-3xl font-black text-orange-600">{timeLeft.seconds}</div>
            <div className="text-xs font-bold text-gray-700 mt-1 uppercase">Sn</div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <Clock size={20} className="text-red-600" />
        <span className="text-gray-700 font-semibold">Kampanya Bitiş Süresi</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white rounded-lg p-3 text-center border border-red-100">
          <div className="text-2xl font-bold text-red-600">{timeLeft.days}</div>
          <div className="text-xs text-gray-600 mt-1">Gün</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center border border-red-100">
          <div className="text-2xl font-bold text-red-600">{timeLeft.hours}</div>
          <div className="text-xs text-gray-600 mt-1">Saat</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center border border-red-100">
          <div className="text-2xl font-bold text-red-600">{timeLeft.minutes}</div>
          <div className="text-xs text-gray-600 mt-1">Dakika</div>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center border border-red-100">
          <div className="text-2xl font-bold text-red-600">{timeLeft.seconds}</div>
          <div className="text-xs text-gray-600 mt-1">Saniye</div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
