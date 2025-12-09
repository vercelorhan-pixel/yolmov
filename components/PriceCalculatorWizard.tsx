/**
 * ============================================
 * Price Calculator Wizard
 * ============================================
 * 
 * Dinamik fiyat hesaplama aracı
 * - OSRM ile rota hesaplama
 * - Interaktif harita (React-Leaflet)
 * - Anlık fiyat tahmini
 * - QuoteWizard benzeri UX
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Truck, 
  Bus, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  AlertTriangle, 
  Navigation,
  Calculator,
  Info,
  CheckCircle2,
  Loader2,
  Search,
  TrendingUp
} from 'lucide-react';
import type { 
  PriceCalculationInput, 
  PriceEstimate, 
  LocationPoint, 
  RouteData 
} from '../types';
import { calculateRoute, geocodeAddress, geocodeAddressMultiple, TURKISH_CITIES } from '../services/routingService';
import { calculatePrice, quickPriceEstimate, isWeekend, isNightTime } from '../services/priceCalculator';
import { RouteMap } from './shared/RouteMap';

const STEPS = [
  { id: 1, title: 'Araç ve Konum' },
  { id: 2, title: 'Detaylar' },
  { id: 3, title: 'Fiyat Hesabı' }
];

const VEHICLE_TYPES = [
  { id: 'sedan', label: 'Sedan', icon: Car, description: 'Standart binek araç' },
  { id: 'suv', label: 'SUV/4x4', icon: Car, description: 'Arazi aracı (+%15)' },
  { id: 'minibus', label: 'Minibüs/Ticari', icon: Bus, description: 'Büyük araç (+%30)' }
];

const VEHICLE_CONDITIONS = [
  { id: 'working', label: '🟢 Çalışır Durumda', description: 'Motor çalışıyor' },
  { id: 'broken', label: '🟡 Arızalı', description: 'Motor arızalı (+%15)' },
  { id: 'accident', label: '🔴 Kaza Durumu', description: 'Hasarlı araç (+%25)' },
  { id: 'ditch', label: '⚫ Şarampole Düşmüş', description: 'Özel kurtarma (+%100)' }
];

const TIMING_OPTIONS = [
  { id: 'now', label: '⚡ Hemen', description: 'Acil hizmet (+%30)' },
  { id: 'week', label: '📅 Bu Hafta', description: 'Normal hizmet' },
  { id: 'later', label: '🗓️ Daha Sonra', description: 'Planlı hizmet' }
];

export function PriceCalculatorWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form Data
  const [vehicleType, setVehicleType] = useState<'sedan' | 'suv' | 'minibus'>('sedan');
  const [isLuxury, setIsLuxury] = useState(false);
  const [vehicleCondition, setVehicleCondition] = useState<'working' | 'broken' | 'accident' | 'ditch'>('working');
  const [timing, setTiming] = useState<'now' | 'week' | 'later'>('now');
  const [hasLoad, setHasLoad] = useState(false);
  
  // Location State
  const [startLocation, setStartLocation] = useState<LocationPoint | null>(null);
  const [endLocation, setEndLocation] = useState<LocationPoint | null>(null);
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [endSearchQuery, setEndSearchQuery] = useState('');
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingEnd, setIsSearchingEnd] = useState(false);
  
  // Location Suggestions (Autocomplete)
  const [startSuggestions, setStartSuggestions] = useState<LocationPoint[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<LocationPoint[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  
  // Route & Price State
  const [route, setRoute] = useState<RouteData | null>(null);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [quickPrice, setQuickPrice] = useState<{ min: number; max: number } | null>(null);

  // Auto-calculate quick price when route changes
  useEffect(() => {
    if (route) {
      quickPriceEstimate(route.distance).then(setQuickPrice);
    }
  }, [route]);

  // ============================================
  // GEOCODING HANDLERS
  // ============================================

  const handleSearchStart = async () => {
    if (!startSearchQuery.trim()) {
      setErrors({ ...errors, startLocation: 'Lütfen bir adres girin' });
      return;
    }

    setIsSearchingStart(true);
    setErrors({ ...errors, startLocation: '' });
    setShowStartSuggestions(false);

    try {
      console.log('🔎 Başlangıç araması:', startSearchQuery);
      
      // Birden fazla sonuç al (kullanıcı seçsin)
      const results = await geocodeAddressMultiple(startSearchQuery, 'tr', 5);
      
      console.log('📊 Sonuç sayısı:', results.length);
      
      if (results.length === 0) {
        setErrors({ 
          ...errors, 
          startLocation: `"${startSearchQuery}" için sonuç bulunamadı. Yazımı kontrol edin veya şehir ekleyin (örn: "Balıkesir, Gömeç")` 
        });
      } else if (results.length === 1) {
        // Tek sonuç varsa direkt seç
        setStartLocation(results[0]);
        console.log('✅ Start location:', results[0]);
      } else {
        // Birden fazla sonuç varsa dropdown göster
        setStartSuggestions(results);
        setShowStartSuggestions(true);
        console.log(`🔍 ${results.length} sonuç bulundu:`, results);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setErrors({ ...errors, startLocation: 'Adres arama hatası. Lütfen tekrar deneyin.' });
    } finally {
      setIsSearchingStart(false);
    }
  };

  const handleSearchEnd = async () => {
    if (!endSearchQuery.trim()) {
      setErrors({ ...errors, endLocation: 'Lütfen bir adres girin' });
      return;
    }

    setIsSearchingEnd(true);
    setErrors({ ...errors, endLocation: '' });
    setShowEndSuggestions(false);

    try {
      console.log('🔎 Bitiş araması:', endSearchQuery);
      
      // Birden fazla sonuç al
      const results = await geocodeAddressMultiple(endSearchQuery, 'tr', 5);
      
      console.log('📊 Sonuç sayısı:', results.length);
      
      if (results.length === 0) {
        setErrors({ 
          ...errors, 
          endLocation: `"${endSearchQuery}" için sonuç bulunamadı. Yazımı kontrol edin veya şehir ekleyin (örn: "Balıkesir, Gömeç")` 
        });
      } else if (results.length === 1) {
        // Tek sonuç varsa direkt seç
        setEndLocation(results[0]);
        console.log('✅ End location:', results[0]);
      } else {
        // Birden fazla sonuç varsa dropdown göster
        setEndSuggestions(results);
        setShowEndSuggestions(true);
        console.log(`🔍 ${results.length} sonuç bulundu:`, results);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setErrors({ ...errors, endLocation: 'Adres arama hatası. Lütfen tekrar deneyin.' });
    } finally {
      setIsSearchingEnd(false);
    }
  };

  // ============================================
  // ROUTE CALCULATION
  // ============================================

  const handleCalculateRoute = async () => {
    if (!startLocation || !endLocation) {
      setErrors({ route: 'Lütfen hem başlangıç hem de bitiş noktası seçin' });
      return;
    }

    setIsCalculating(true);
    setErrors({});

    try {
      const calculatedRoute = await calculateRoute(
        startLocation.coords,
        endLocation.coords,
        true // use cache
      );

      setRoute(calculatedRoute);
      console.log('✅ Route calculated:', calculatedRoute);

      // Otomatik adım geçişi
      setCurrentStep(2);

    } catch (error) {
      console.error('Route calculation error:', error);
      setErrors({ route: 'Rota hesaplanamadı. Lütfen tekrar deneyin.' });
    } finally {
      setIsCalculating(false);
    }
  };

  // ============================================
  // PRICE CALCULATION
  // ============================================

  const handleCalculatePrice = async () => {
    if (!startLocation || !endLocation || !route) {
      setErrors({ price: 'Önce rota hesaplanmalı' });
      return;
    }

    setIsCalculating(true);
    setErrors({});

    try {
      const input: PriceCalculationInput = {
        startLocation,
        endLocation,
        distance: route.distance,
        vehicleType,
        vehicleCondition,
        isLuxury,
        timing,
        hasLoad,
        requestTime: new Date(),
        isWeekend: isWeekend()
      };

      const estimate = await calculatePrice(input, route);
      setPriceEstimate(estimate);
      console.log('✅ Price calculated:', estimate);

      setCurrentStep(3);

    } catch (error) {
      console.error('Price calculation error:', error);
      setErrors({ price: 'Fiyat hesaplanamadı. Lütfen tekrar deneyin.' });
    } finally {
      setIsCalculating(false);
    }
  };

  // ============================================
  // VALIDATION
  // ============================================

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!startLocation) newErrors.startLocation = 'Başlangıç noktası seçilmeli';
      if (!endLocation) newErrors.endLocation = 'Bitiş noktası seçilmeli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      handleCalculateRoute();
    } else if (currentStep === 2) {
      handleCalculatePrice();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setStartLocation(null);
    setEndLocation(null);
    setRoute(null);
    setPriceEstimate(null);
    setQuickPrice(null);
    setStartSearchQuery('');
    setEndSearchQuery('');
    setVehicleType('sedan');
    setVehicleCondition('working');
    setTiming('now');
    setHasLoad(false);
    setIsLuxury(false);
    setErrors({});
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Anlık Fiyat Hesaplama
          </h1>
          <p className="text-lg text-slate-600">
            Yol yardım hizmeti için şeffaf ve anında fiyat teklifi
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all ${
                    currentStep >= step.id
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-110'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-3 text-left">
                  <p
                    className={`text-sm font-bold ${
                      currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-16 h-1 mx-4 rounded-full transition-all ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          <AnimatePresence mode="wait">
            {/* STEP 1: Araç ve Konum */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  📍 Başlangıç ve Bitiş Noktaları
                </h2>

                {/* Start Location Search */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-2 text-green-600" />
                    Başlangıç Noktası
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={startSearchQuery}
                        onChange={(e) => setStartSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchStart()}
                        placeholder="Örn: Balıkesir, Gömeç veya Kadıköy, İstanbul"
                        className={`w-full px-4 py-3 border-2 rounded-xl ${
                          errors.startLocation ? 'border-red-500' : 'border-gray-200'
                        }`}
                      />
                      
                      {/* Suggestions Dropdown */}
                      {showStartSuggestions && startSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <p className="text-xs font-bold text-gray-500 px-3 py-1">
                              {startSuggestions.length} sonuç bulundu - Birini seçin:
                            </p>
                            {startSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setStartLocation(suggestion);
                                  setShowStartSuggestions(false);
                                  setStartSearchQuery(suggestion.address || '');
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {suggestion.address?.split(',')[0] || 'Konum'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {suggestion.address || 'Adres bilgisi yok'}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleSearchStart}
                      disabled={isSearchingStart}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSearchingStart ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.startLocation && (
                    <p className="text-red-600 text-sm mt-1">{errors.startLocation}</p>
                  )}
                  {startLocation && !showStartSuggestions && (
                    <p className="text-green-600 text-sm mt-2">
                      ✅ {startLocation.address}
                    </p>
                  )}
                </div>

                {/* End Location Search */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    <Navigation className="inline w-4 h-4 mr-2 text-red-600" />
                    Bitiş Noktası
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={endSearchQuery}
                        onChange={(e) => setEndSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchEnd()}
                        placeholder="Örn: Balıkesir, Gömeç veya Beşiktaş, İstanbul"
                        className={`w-full px-4 py-3 border-2 rounded-xl ${
                          errors.endLocation ? 'border-red-500' : 'border-gray-200'
                        }`}
                      />
                      
                      {/* Suggestions Dropdown */}
                      {showEndSuggestions && endSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <p className="text-xs font-bold text-gray-500 px-3 py-1">
                              {endSuggestions.length} sonuç bulundu - Birini seçin:
                            </p>
                            {endSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setEndLocation(suggestion);
                                  setShowEndSuggestions(false);
                                  setEndSearchQuery(suggestion.address || '');
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <Navigation className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {suggestion.address?.split(',')[0] || 'Konum'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {suggestion.address || 'Adres bilgisi yok'}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleSearchEnd}
                      disabled={isSearchingEnd}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50"
                    >
                      {isSearchingEnd ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.endLocation && (
                    <p className="text-red-600 text-sm mt-1">{errors.endLocation}</p>
                  )}
                  {endLocation && !showEndSuggestions && (
                    <p className="text-red-600 text-sm mt-2">
                      ✅ {endLocation.address}
                    </p>
                  )}
                </div>

                {/* Map Preview */}
                <RouteMap
                  startLocation={startLocation}
                  endLocation={endLocation}
                  route={route}
                  height="300px"
                  className="mb-6"
                />

                {/* Popular Cities Quick Select */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm font-bold text-blue-900 mb-2">
                    💡 Popüler Şehirler
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TURKISH_CITIES.slice(0, 8).map((city) => (
                      <button
                        key={city}
                        onClick={() => setStartSearchQuery(city)}
                        className="px-3 py-1 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {errors.route && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700">{errors.route}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: Detaylar */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  🚗 Araç ve Hizmet Detayları
                </h2>

                {/* Route Summary */}
                {route && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-bold">📏 Mesafe</p>
                        <p className="text-2xl font-bold text-blue-900">{route.distance} KM</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 font-bold">⏱️ Süre</p>
                        <p className="text-2xl font-bold text-blue-900">
                          ~{Math.round(route.duration / 60)} dk
                        </p>
                      </div>
                      {quickPrice && (
                        <div>
                          <p className="text-sm text-blue-700 font-bold">💰 Tahmini</p>
                          <p className="text-xl font-bold text-blue-900">
                            {quickPrice.min.toLocaleString()} - {quickPrice.max.toLocaleString()} ₺
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vehicle Type */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    🚗 Araç Tipi
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {VEHICLE_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setVehicleType(type.id as any)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          vehicleType === type.id
                            ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <type.icon className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-bold text-sm">{type.label}</p>
                        <p className="text-xs text-gray-600">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Luxury Toggle */}
                <div className="mb-6">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-yellow-500">
                    <input
                      type="checkbox"
                      checked={isLuxury}
                      onChange={(e) => setIsLuxury(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-bold text-slate-900">💎 Lüks Araç</p>
                      <p className="text-sm text-gray-600">Özel ekipman gerekli (+%20)</p>
                    </div>
                  </label>
                </div>

                {/* Vehicle Condition */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    ⚠️ Araç Durumu
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {VEHICLE_CONDITIONS.map((cond) => (
                      <button
                        key={cond.id}
                        onClick={() => setVehicleCondition(cond.id as any)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          vehicleCondition === cond.id
                            ? 'border-blue-600 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <p className="font-bold text-sm mb-1">{cond.label}</p>
                        <p className="text-xs text-gray-600">{cond.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timing */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    ⏰ Zaman Tercihi
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {TIMING_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setTiming(opt.id as any)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          timing === opt.id
                            ? 'border-blue-600 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <p className="font-bold text-sm mb-1">{opt.label}</p>
                        <p className="text-xs text-gray-600">{opt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Has Load */}
                <div className="mb-6">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-amber-500">
                    <input
                      type="checkbox"
                      checked={hasLoad}
                      onChange={(e) => setHasLoad(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-bold text-slate-900">📦 Yük Taşıma</p>
                      <p className="text-sm text-gray-600">Araçta eşya nakli var (+%10)</p>
                    </div>
                  </label>
                </div>

                {/* Time Notifications */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    <Info className="inline w-4 h-4 mr-2" />
                    {isNightTime() && <span className="font-bold">🌙 Gece saati tespit edildi (+%25)</span>}
                    {isWeekend() && <span className="font-bold ml-2">📅 Hafta sonu (+%10)</span>}
                    {!isNightTime() && !isWeekend() && <span>Standart mesai saati</span>}
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Fiyat Sonucu */}
            {currentStep === 3 && priceEstimate && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-2xl">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Fiyat Hesaplaması Tamamlandı
                  </h2>
                  <p className="text-lg text-slate-600">
                    Dinamik fiyatlandırma motorumuz size en şeffaf teklifi sunuyor
                  </p>
                </div>

                {/* Price Range */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 mb-8 text-white shadow-2xl">
                  <p className="text-sm uppercase tracking-wide mb-2 opacity-90">
                    Tahmini Hizmet Bedeli
                  </p>
                  <p className="text-5xl font-bold mb-4">
                    {priceEstimate.minPrice.toLocaleString()} - {priceEstimate.maxPrice.toLocaleString()} ₺
                  </p>
                  <p className="text-sm opacity-75">
                    Net Tutar: {priceEstimate.finalPrice.toLocaleString()} ₺ (±%{priceEstimate.breakdown.baseFee})
                  </p>
                </div>

                {/* Breakdown */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Detaylı Hesaplama
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Açılış Ücreti</span>
                      <span className="font-bold">{priceEstimate.breakdown.baseFee.toLocaleString()} ₺</span>
                    </div>

                    {priceEstimate.breakdown.distanceBreakdown.shortKm > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          İlk {priceEstimate.breakdown.distanceBreakdown.shortKm} KM
                        </span>
                        <span className="font-bold">
                          {priceEstimate.breakdown.distanceBreakdown.shortCharge.toLocaleString()} ₺
                        </span>
                      </div>
                    )}

                    {priceEstimate.breakdown.distanceBreakdown.mediumKm > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {priceEstimate.breakdown.distanceBreakdown.mediumKm} KM (Orta Mesafe)
                        </span>
                        <span className="font-bold">
                          {priceEstimate.breakdown.distanceBreakdown.mediumCharge.toLocaleString()} ₺
                        </span>
                      </div>
                    )}

                    {priceEstimate.breakdown.distanceBreakdown.longKm > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {priceEstimate.breakdown.distanceBreakdown.longKm} KM (Uzun Mesafe)
                        </span>
                        <span className="font-bold">
                          {priceEstimate.breakdown.distanceBreakdown.longCharge.toLocaleString()} ₺
                        </span>
                      </div>
                    )}

                    <div className="border-t-2 border-gray-300 pt-3 flex justify-between">
                      <span className="text-gray-600">Ara Toplam</span>
                      <span className="font-bold">{priceEstimate.subtotal.toLocaleString()} ₺</span>
                    </div>
                  </div>
                </div>

                {/* Multipliers */}
                {priceEstimate.breakdown.appliedMultipliers.length > 0 && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
                    <h3 className="font-bold text-amber-900 mb-4">
                      🔧 Uygulanan Çarpanlar
                    </h3>
                    <div className="space-y-2">
                      {priceEstimate.breakdown.appliedMultipliers.map((mult, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-bold text-amber-900">{mult.name}</span>
                            <span className="text-amber-700 ml-2">({mult.reason})</span>
                          </div>
                          <span className="font-bold text-amber-900">x{mult.value}</span>
                        </div>
                      ))}
                      <div className="border-t-2 border-amber-300 pt-2 flex justify-between">
                        <span className="font-bold text-amber-900">Toplam Çarpan</span>
                        <span className="text-lg font-bold text-amber-900">
                          x{priceEstimate.totalMultiplier}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Route Info */}
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h3 className="font-bold text-blue-900 mb-4">📍 Rota Bilgileri</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Toplam Mesafe</span>
                      <span className="font-bold text-blue-900">{priceEstimate.route.distance} KM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Tahmini Süre</span>
                      <span className="font-bold text-blue-900">
                        ~{Math.round(priceEstimate.route.duration / 60)} dakika
                      </span>
                    </div>
                    {priceEstimate.route.fromCache && (
                      <p className="text-xs text-blue-600 mt-2">⚡ Hızlı hesaplama (önbellekten)</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-4">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                  >
                    🔄 Yeni Hesaplama
                  </button>
                  <button
                    onClick={() => {
                      // QuoteWizard'a yönlendir (pre-fill ile)
                      window.location.href = '/quote';
                    }}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all"
                  >
                    ✅ Teklif Al
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {currentStep < 3 && (
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Geri
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isCalculating || (currentStep === 1 && (!startLocation || !endLocation))}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Hesaplanıyor...
                  </>
                ) : (
                  <>
                    {currentStep === 1 ? 'Rota Hesapla' : 'Fiyat Hesapla'}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            💡 <strong>Bilgi:</strong> Fiyatlar anlık olarak hesaplanır ve 24 saat geçerlidir.
          </p>
          <p className="mt-2">
            🗺️ Harita verisi: OpenStreetMap • Rota motoru: OSRM
          </p>
        </div>
      </div>
    </div>
  );
}

export default PriceCalculatorWizard;
