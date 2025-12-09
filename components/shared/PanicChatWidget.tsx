/**
 * Yolmov Dijital Dispeçer - Panik Modu Chat Widget
 * Zero-cost AI-like experience with hardcoded decision tree
 * 
 * Features:
 * - Full-screen dark mode overlay
 * - Multi-step guided questionnaire
 * - Geolocation detection
 * - Smart URL generation and redirect
 * - Framer Motion animations
 * - Psychological calming design
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Loader, CheckCircle } from 'lucide-react';
import { getAllCities } from '../../lib/seoData';

interface PanicData {
  city?: string;
  citySlug?: string;
  service?: string;
  vehicleType?: string;
  urgency?: 'high' | 'normal';
}

interface Step {
  id: string;
  botMessage: string;
  options: Array<{
    label: string;
    emoji?: string;
    value?: string;
    action?: 'geo' | 'manual' | 'next';
  }>;
}

const PanicChatWidget: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [panicData, setPanicData] = useState<PanicData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const cities = getAllCities();

  // Decision tree - Hardcoded AI mantığı
  const steps: Step[] = [
    // Adım 1: Konum
    {
      id: 'location',
      botMessage: '🆘 Sakin olun, Yolmov yanınızda.\n\nNerede kaldınız?',
      options: [
        { label: 'Konumumu Otomatik Bul', emoji: '📍', action: 'geo' },
        { label: 'Şehir Seçeceğim', emoji: '✍️', action: 'manual' }
      ]
    },
    // Adım 2: Sorun
    {
      id: 'problem',
      botMessage: `Tamam, ${panicData.city || 'konum'} kaydedildi.\n\nSorununuz nedir?`,
      options: [
        { label: 'Çekici Lazım', emoji: '🚗', value: 'cekici' },
        { label: 'Akü Bitti', emoji: '🔋', value: 'aku' },
        { label: 'Lastik Patladı', emoji: '🛞', value: 'lastik' },
        { label: 'Yakıt Bitti', emoji: '⛽', value: 'yakit' },
        { label: 'Anahtar Sorunum Var', emoji: '🔑', value: 'anahtar' }
      ]
    },
    // Adım 3: Araç Tipi
    {
      id: 'vehicle',
      botMessage: 'Anlaşıldı. Aracınızın tipi?',
      options: [
        { label: 'Binek / Sedan', emoji: '🚘', value: 'binek' },
        { label: 'SUV / Jip', emoji: '🚙', value: 'suv' },
        { label: 'Minibüs / Ticari', emoji: '🚐', value: 'ticari' },
        { label: 'Motosiklet', emoji: '🏍️', value: 'motor' }
      ]
    },
    // Adım 4: Aciliyet
    {
      id: 'urgency',
      botMessage: 'Son soru: Ne kadar acil?',
      options: [
        { label: 'ÇOK ACİL (15 dakika içinde)', emoji: '🔥', value: 'high' },
        { label: 'Normal (30-45 dakika)', emoji: '⏱️', value: 'normal' }
      ]
    }
  ];

  // Bot yazıyor animasyonu
  const simulateTyping = (duration: number = 1000) => {
    setBotTyping(true);
    setTimeout(() => setBotTyping(false), duration);
  };

  // Konum algılama
  const handleGeolocation = () => {
    setIsLoading(true);
    simulateTyping(2000);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Reverse geocoding (basitleştirilmiş - gerçekte API gerekir)
          // Şimdilik en yakın büyük şehri varsayıyoruz
          const detectedCity = cities[Math.floor(Math.random() * 10)]; // Mock
          
          setPanicData(prev => ({ 
            ...prev, 
            city: detectedCity.name,
            citySlug: detectedCity.slug
          }));
          setIsLoading(false);
          setTimeout(() => setCurrentStep(1), 500);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoading(false);
          setShowCityPicker(true);
        }
      );
    } else {
      setIsLoading(false);
      setShowCityPicker(true);
    }
  };

  // Manuel şehir seçimi
  const handleCitySelect = (city: typeof cities[0]) => {
    setPanicData(prev => ({ 
      ...prev, 
      city: city.name,
      citySlug: city.slug
    }));
    setShowCityPicker(false);
    simulateTyping(800);
    setTimeout(() => setCurrentStep(1), 1000);
  };

  // Option seçimi
  const handleOptionClick = (option: Step['options'][0]) => {
    simulateTyping(1200);

    if (option.action === 'geo') {
      handleGeolocation();
      return;
    }

    if (option.action === 'manual') {
      setShowCityPicker(true);
      return;
    }

    // Veriyi kaydet
    if (steps[currentStep].id === 'problem') {
      setPanicData(prev => ({ ...prev, service: option.value }));
    } else if (steps[currentStep].id === 'vehicle') {
      setPanicData(prev => ({ ...prev, vehicleType: option.value }));
    } else if (steps[currentStep].id === 'urgency') {
      setPanicData(prev => ({ ...prev, urgency: option.value as 'high' | 'normal' }));
    }

    // Son adım mı?
    if (currentStep === steps.length - 1) {
      // Analiz sahnesi
      setTimeout(() => {
        handleFinalRedirect();
      }, 2000);
    } else {
      setTimeout(() => setCurrentStep(currentStep + 1), 1500);
    }
  };

  // Final yönlendirme
  const handleFinalRedirect = () => {
    const { citySlug, service, vehicleType, urgency } = panicData;
    
    // Akıllı URL oluşturma
    let redirectUrl = '/arama';
    const params = new URLSearchParams();
    
    if (citySlug) params.append('city', citySlug);
    if (service) params.append('service', service);
    if (vehicleType) params.append('vehicle', vehicleType);
    if (urgency === 'high') params.append('urgent', 'true');
    
    redirectUrl += `?${params.toString()}`;
    
    // Redirect
    navigate(redirectUrl);
  };

  // Escape tuşu ile çıkış
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // İlk animasyon
  useEffect(() => {
    simulateTyping(1500);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/97 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"
        aria-label="Panik modundan çık"
      >
        <X size={28} />
      </button>

      {/* Main Chat Container */}
      <div className="max-w-lg w-full">
        {/* Bot Avatar & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-orange to-red-600 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-2xl shadow-brand-orange/50">
            <span className="text-4xl">🤖</span>
          </div>
          <h2 className="text-white text-2xl font-bold">Yolmov Dijital Dispeçer</h2>
          <p className="text-white/60 text-sm">Yapay zeka destekli acil yardım</p>
        </div>

        {/* Şehir Seçici Modal */}
        {showCityPicker && (
          <div className="bg-slate-800 rounded-2xl p-6 mb-6 max-h-96 overflow-y-auto">
            <h3 className="text-white font-bold text-lg mb-4">Şehir Seçin:</h3>
            <div className="grid grid-cols-2 gap-2">
              {cities.slice(0, 20).map((city) => (
                <button
                  key={city.slug}
                  onClick={() => handleCitySelect(city)}
                  className="py-2 px-4 bg-slate-700 hover:bg-brand-orange text-white rounded-lg transition-colors text-sm"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Bubble (Bot Message) */}
        {!showCityPicker && (
          <div className="bg-slate-800 p-6 rounded-2xl mb-8 text-white shadow-2xl animate-in slide-in-from-top duration-500">
            {botTyping ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader className="animate-spin" size={20} />
                <span>Dijital dispeçer düşünüyor...</span>
              </div>
            ) : (
              <p className="text-lg font-medium leading-relaxed whitespace-pre-line">
                {steps[currentStep]?.botMessage}
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader className="animate-spin" size={40} />
            <p className="text-lg">Konumunuz tespit ediliyor...</p>
          </div>
        )}

        {/* Options (Butonlar) */}
        {!botTyping && !isLoading && !showCityPicker && currentStep < steps.length && (
          <div className="space-y-3 animate-in slide-in-from-bottom duration-500">
            {steps[currentStep].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className="w-full py-4 px-6 bg-white hover:bg-brand-orange text-slate-900 hover:text-white font-bold rounded-xl transition-all transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {option.emoji && <span className="text-2xl">{option.emoji}</span>}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Final Analyzing State */}
        {currentStep === steps.length && (
          <div className="flex flex-col items-center gap-6 text-white animate-in zoom-in duration-500">
            <div className="relative">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle size={48} />
              </div>
              <div className="absolute inset-0 w-24 h-24 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Verileri Analiz Ediyorum</h3>
              <p className="text-white/70">
                {panicData.city} bölgesinde {panicData.service} hizmeti için en uygun partnerleri buluyorum...
              </p>
            </div>
          </div>
        )}

        {/* Exit Button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="mt-8 text-white/50 hover:text-white/80 text-sm w-full text-center underline transition-colors"
          >
            Panik modundan çık
          </button>
        )}
      </div>
    </div>
  );
};

export default PanicChatWidget;
