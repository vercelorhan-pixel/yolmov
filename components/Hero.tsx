
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, Navigation, ChevronDown, Check, XCircle, ChevronLeft, Car, Truck, BatteryCharging, Disc, Fuel, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVICES, CITIES_WITH_DISTRICTS } from '../constants';
import { supabaseApi } from '../services/supabaseApi';

// Hero Background Image - Kış Görseli
const HERO_IMAGE = "/assets/1765057362098_kis-2.webp";

interface HeroProps {
  onSearch?: (city: string, district: string, serviceId: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  // Location State
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationStep, setLocationStep] = useState<'city' | 'district'>('city');
  const [locationSearch, setLocationSearch] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationLoadingText, setLocationLoadingText] = useState('Konum alınıyor...');
  
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  
  // Service State
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // Animation State
  const [isSearching, setIsSearching] = useState(false);
  const [loadingText, setLoadingText] = useState('Arama başlatılıyor...');
  const [buttonRect, setButtonRect] = useState<{top: number, left: number, width: number, height: number} | null>(null);

  const locationRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (serviceRef.current && !serviceRef.current.contains(event.target as Node)) {
        setIsServiceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine what list to show based on step
  const cityList = Object.keys(CITIES_WITH_DISTRICTS);
  const districtList = selectedCity ? CITIES_WITH_DISTRICTS[selectedCity] : [];

  // Filter list based on user input
  const filteredItems = locationStep === 'city'
    ? cityList.filter(c => c.toLocaleLowerCase('tr').includes(locationSearch.toLocaleLowerCase('tr')))
    : districtList.filter(d => d.toLocaleLowerCase('tr').includes(locationSearch.toLocaleLowerCase('tr')));

  const selectedService = SERVICES.find(s => s.id === selectedServiceId);

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    setIsServiceOpen(false);
  };

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setLocationStep('district');
    setLocationSearch('');
    inputRef.current?.focus();
  };

  const handleSelectDistrict = (district: string) => {
    setSelectedDistrict(district);
    setLocationSearch(''); // Clear search to show value nicely
    setIsLocationOpen(false);
  };

  const handleResetLocation = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedCity('');
    setSelectedDistrict('');
    setLocationStep('city');
    setLocationSearch('');
    setIsLocationOpen(true);
    inputRef.current?.focus();
  };

  const handleBackToCities = () => {
    setLocationStep('city');
    setSelectedDistrict('');
    setSelectedCity('');
    setLocationSearch('');
    inputRef.current?.focus();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum özelliğini desteklemiyor.');
      return;
    }

    console.log('🌍 Konum servisi isteniyor (Hero)...');
    setIsLoadingLocation(true);
    setLocationLoadingText('GPS konumunuz alınıyor...');
    setIsLocationOpen(false);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('✅ Konum alındı:', position.coords);
        setLocationLoadingText('Adres bilgileri çözülüyor...');
        const { latitude, longitude } = position.coords;
        
        try {
          console.log('🔍 Reverse geocoding başlatılıyor...');
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=tr`,
            {
              headers: {
                'User-Agent': 'YOLMOV App'
              }
            }
          );
          
          if (!response.ok) {
            throw new Error('Geocoding API hatası');
          }
          
          const data = await response.json();
          console.log('📍 Geocoding sonucu:', data);
          setLocationLoadingText('Şehir ve ilçe eşleştiriliyor...');
          
          const address = data.address || {};
          let city = address.province || address.state || address.city || address.town;
          let district = address.county || address.district || address.suburb || address.neighbourhood;
          
          console.log('🏙️ Tespit edilen şehir:', city, '/ İlçe:', district);
          
          const matchedCity = Object.keys(CITIES_WITH_DISTRICTS).find(
            c => c.toLowerCase() === city?.toLowerCase()
          );
          
          if (matchedCity) {
            console.log('✅ Şehir eşleşti:', matchedCity);
            handleSelectCity(matchedCity);
            
            const districts = CITIES_WITH_DISTRICTS[matchedCity];
            const matchedDistrict = districts.find(
              d => d.toLowerCase().includes(district?.toLowerCase()) || 
                   district?.toLowerCase().includes(d.toLowerCase())
            );
            
            if (matchedDistrict) {
              console.log('✅ İlçe eşleşti:', matchedDistrict);
              setLocationLoadingText('Konum başarıyla belirlendi!');
              setTimeout(() => {
                handleSelectDistrict(matchedDistrict);
                setIsLoadingLocation(false);
              }, 500);
            } else {
              console.warn('⚠️ İlçe eşleşmedi, şehir seçildi');
              setLocationStep('district');
              setIsLocationOpen(true);
              setIsLoadingLocation(false);
            }
          } else {
            console.warn('⚠️ Şehir sistemde bulunamadı:', city);
            setIsLoadingLocation(false);
            setIsLocationOpen(true);
          }
        } catch (error) {
          console.error('❌ Reverse geocoding error:', error);
          alert('Konum bilgisi alınamadı. Lütfen manuel olarak seçin.');
          setIsLoadingLocation(false);
          setIsLocationOpen(true);
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        let errorMessage = 'Konum erişimi reddedildi.';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Konum izni reddedildi. Tarayıcı ayarlarından konum iznini açın.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Konum bilgisi kullanılamıyor. GPS/Wi-Fi açık olduğundan emin olun.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Konum tespiti zaman aşımına uğradı. Tekrar deneyin.';
            break;
        }
        
        console.error('Konum hatası:', errorMessage);
        setIsLoadingLocation(false);
        setIsLocationOpen(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleSearchClick = async () => {
    if (searchButtonRef.current) {
      // 1. Get button position for animation start
      const rect = searchButtonRef.current.getBoundingClientRect();
      setButtonRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      
      // 2. Start Animation
      setIsSearching(true);

      // 3. Progressive Text Sequence
      setLoadingText("Konumunuz analiz ediliyor...");
      
      const textTimer1 = setTimeout(() => {
        setLoadingText("Bölgedeki uzmanlar taranıyor...");
      }, 800);

      const textTimer2 = setTimeout(() => {
        setLoadingText("Müsaitlik durumları kontrol ediliyor...");
      }, 1800);

      // 4. API çağrısı - sonuç gelene kadar bekle
      const minAnimationTime = 2500; // Minimum 2.5 saniye animasyon
      const startTime = Date.now();
      
      try {
        // Partner verilerini önceden çek ve sessionStorage'a kaydet
        const partners = await supabaseApi.partnerSearch.getAvailablePartners(selectedCity, selectedDistrict);
        
        // Sonuçları sessionStorage'a kaydet (ListingPage okuyacak)
        sessionStorage.setItem('yolmov_search_results', JSON.stringify({
          partners,
          city: selectedCity,
          district: selectedDistrict,
          timestamp: Date.now()
        }));
        
        // Minimum süre dolmadıysa bekle
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minAnimationTime - elapsed);
        
        await new Promise(resolve => setTimeout(resolve, remaining));
        
        // "Sonuçlar hazır!" mesajını göster
        setLoadingText("Sonuçlar hazır!");
        
        // Kısa bir süre sonra navigate et
        setTimeout(() => {
          clearTimeout(textTimer1);
          clearTimeout(textTimer2);
          if (onSearch) {
            onSearch(selectedCity, selectedDistrict, selectedServiceId);
          }
        }, 400);
        
      } catch (error) {
        console.error('Partner arama hatası:', error);
        // Hata olsa bile devam et
        setLoadingText("Sonuçlar hazır!");
        setTimeout(() => {
          clearTimeout(textTimer1);
          clearTimeout(textTimer2);
          if (onSearch) {
            onSearch(selectedCity, selectedDistrict, selectedServiceId);
          }
        }, 400);
      }
    }
  };

  // Helper to get the right icon for animation
  const getAnimationIcon = () => {
    if (!selectedServiceId) return <Car size={64} className="text-white" strokeWidth={1.5} />;
    switch(selectedServiceId) {
      case 'tow': return <Truck size={64} className="text-white" strokeWidth={1.5} />;
      case 'battery': return <BatteryCharging size={64} className="text-white" strokeWidth={1.5} />;
      case 'tire': return <Disc size={64} className="text-white" strokeWidth={1.5} />;
      case 'fuel': return <Fuel size={64} className="text-white" strokeWidth={1.5} />;
      default: return <Car size={64} className="text-white" strokeWidth={1.5} />;
    }
  };

  return (
    <section className="relative w-full min-h-[700px] flex items-center z-30">
      
      {/* Full Screen Transition Overlay */}
      {isSearching && buttonRect && (
        <motion.div
          initial={{ 
            position: 'fixed',
            top: buttonRect.top,
            left: buttonRect.left,
            width: buttonRect.width,
            height: buttonRect.height,
            borderRadius: '1.5rem',
            backgroundColor: '#FF7A00',
            zIndex: 9999,
            opacity: 1
          }}
          animate={{ 
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            borderRadius: 0,
          }}
          transition={{ 
            duration: 0.6, 
            ease: [0.645, 0.045, 0.355, 1.000] // cubic-bezier for smooth expansion
          }}
          className="flex flex-col items-center justify-center overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-col items-center text-white p-6 text-center w-full max-w-lg"
          >
            {/* Brand Logo in Loader */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-10"
            >
              <h1 className="yolmov-logo text-5xl font-bold text-white">yolmov</h1>
            </motion.div>

            {/* Premium Animation: Driving Effect */}
            <div className="relative w-full h-40 flex items-center justify-center mb-8 overflow-hidden">
              
              {/* Pulse Effect behind car */}
              <div className="absolute w-32 h-32 bg-white/10 rounded-full animate-ping opacity-20"></div>
              <div className="absolute w-48 h-48 bg-white/5 rounded-full animate-ping opacity-10 delay-150"></div>

              {/* Moving Road Lines */}
              <div className="absolute bottom-10 w-[200%] flex gap-12 animate-move-left opacity-30">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="w-16 h-1 bg-white rounded-full"></div>
                ))}
              </div>

              {/* Bouncing Vehicle */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
              >
                {getAnimationIcon()}
                {/* Shadow under car */}
                <div className="absolute -bottom-2 left-2 right-2 h-1.5 bg-black/20 rounded-[100%] blur-sm"></div>
              </motion.div>

              {/* Passing Wind Lines */}
              <motion.div 
                className="absolute top-10 right-10 w-10 h-0.5 bg-white/40 rounded-full"
                animate={{ x: [50, -100], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
              />
              <motion.div 
                className="absolute bottom-12 right-0 w-16 h-0.5 bg-white/30 rounded-full"
                animate={{ x: [50, -100], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.1 }}
              />
            </div>
            
            {/* Progressive Text */}
            <div className="h-20 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={loadingText}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-3xl md:text-4xl font-display font-bold tracking-tight leading-tight text-white"
                >
                  {loadingText}
                </motion.p>
              </AnimatePresence>
            </div>
            
            <motion.div 
              className="w-64 h-1.5 bg-black/10 rounded-full mt-8 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div 
                className="h-full bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.8, ease: "easeInOut" }}
              />
            </motion.div>

          </motion.div>
        </motion.div>
      )}

      {/* Background Image (Static) with overflow hidden to contain image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={HERO_IMAGE}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Yolmov Kış Manzarası"
        />
        {/* Hafif overlay - sadece okunabilirlik için */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>
      </div>
      
      <div className="container mx-auto px-6 md:px-12 lg:px-24 xl:px-32 relative z-20 pt-4 md:pt-10 pb-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-4 md:mb-10"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-white leading-tight mb-1 md:mb-6 tracking-tight" style={{textShadow: '0 4px 12px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)'}}>
              Yolda Kaldığınızda <br className="hidden md:block" />
              <span className="inline-block mt-1 md:mt-2" style={{color: '#FF7A00', textShadow: '0 4px 12px rgba(255,122,0,0.6), 0 2px 4px rgba(0,0,0,0.4)'}}>Yanınızdayız.</span>
            </h1>
            <p className="text-sm md:text-lg text-white max-w-xl mx-auto font-medium leading-snug" style={{textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}>
              Çekici, akü takviyesi, yakıt, lastik ve yol yardım hizmetlerine tek tıkla, güvenle ulaşın.
            </p>
          </motion.div>

          {/* Search Bar Container */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-5xl relative z-50"
          >
            {/* White Card - Added relative z-50 to act as stacking parent */}
            <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/20 flex flex-col md:flex-row p-3 items-center backdrop-blur-sm bg-white/95 relative z-50">
              
              {/* 1. Location Input Section */}
              <div 
                className="relative w-full md:flex-1 group" 
                ref={locationRef}
              >
                <div 
                  className={`flex items-center h-20 px-6 cursor-pointer rounded-[1.5rem] transition-all duration-200 border border-transparent ${isLocationOpen ? 'bg-white shadow-lg border-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    if (isSearching) return;
                    setIsLocationOpen(true);
                    setIsServiceOpen(false);
                    inputRef.current?.focus();
                  }}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors ${isLocationOpen ? 'bg-brand-orange text-white' : 'bg-orange-50 text-brand-orange'}`}>
                    <MapPin size={22} strokeWidth={2.5} />
                  </div>
                  
                  <div className="flex-1 flex flex-col items-start overflow-hidden">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      {selectedCity && locationStep === 'district' ? 'Hangi İlçe?' : 'Neredesin?'}
                    </label>
                    
                    {!isLocationOpen && selectedCity ? (
                       <div className="w-full text-gray-800 font-bold text-lg truncate">
                          {selectedCity} {selectedDistrict ? `/ ${selectedDistrict}` : ''}
                       </div>
                    ) : (
                      <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-transparent border-none p-0 text-gray-800 font-bold text-lg placeholder-gray-300 focus:ring-0 leading-tight truncate"
                        placeholder={locationStep === 'city' ? "İl ara..." : `${selectedCity} > İlçe ara...`}
                        value={locationSearch}
                        onChange={(e) => {
                          setLocationSearch(e.target.value);
                          if (!isLocationOpen) setIsLocationOpen(true);
                        }}
                        onFocus={() => setIsLocationOpen(true)}
                        autoComplete="off"
                        disabled={isSearching}
                      />
                    )}
                  </div>

                  {selectedCity && (
                     <button 
                        onClick={handleResetLocation}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors z-20"
                        disabled={isSearching}
                     >
                        <XCircle size={20} />
                     </button>
                  )}
                </div>

                {/* Location Dropdown */}
                <AnimatePresence>
                  {isLocationOpen && !isSearching && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[110%] left-0 w-full md:min-w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[350px] overflow-y-auto z-[60] py-2 scrollbar-thin scrollbar-thumb-gray-200"
                    >
                      <div className="px-2 pb-2 mb-2 border-b border-gray-50 sticky top-0 bg-white z-10 flex flex-col gap-1">
                        {locationStep === 'district' && (
                           <button 
                             onClick={handleBackToCities}
                             className="flex items-center gap-2 text-gray-500 hover:text-brand-orange text-sm px-4 py-2 transition-colors font-medium"
                           >
                             <ChevronLeft size={16} />
                             İl Seçimine Dön ({selectedCity})
                           </button>
                        )}

                        {locationStep === 'city' && (
                          <button 
                            className="w-full flex items-center gap-3 text-brand-orange font-semibold p-3 hover:bg-orange-50 rounded-xl transition-colors text-sm disabled:opacity-50"
                            onClick={handleUseCurrentLocation}
                            disabled={isLoadingLocation}
                          >
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <Navigation size={14} fill="currentColor" className={isLoadingLocation ? 'animate-spin' : ''} />
                            </div>
                            {isLoadingLocation ? 'Konum Alınıyor...' : 'Mevcut Konumumu Kullan'}
                          </button>
                        )}
                      </div>
                      
                      <div className="px-2">
                        <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                           {locationStep === 'city' ? 'Şehirler' : `${selectedCity} İlçeleri`}
                        </div>

                        {filteredItems.length > 0 ? (
                          filteredItems.map((item) => (
                            <div 
                              key={item}
                              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-xl flex items-center justify-between group transition-colors mb-1 
                                ${(locationStep === 'city' && selectedCity === item) || (locationStep === 'district' && selectedDistrict === item) ? 'bg-gray-50' : ''}`}
                              onClick={() => {
                                if (locationStep === 'city') {
                                  handleSelectCity(item);
                                } else {
                                  handleSelectDistrict(item);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-brand-orange transition-colors"></div>
                                <span className={`text-sm font-medium ${(locationStep === 'city' && selectedCity === item) || (locationStep === 'district' && selectedDistrict === item) ? 'text-brand-orange' : 'text-gray-700'}`}>
                                  {item}
                                </span>
                              </div>
                              {((locationStep === 'city' && selectedCity === item) || (locationStep === 'district' && selectedDistrict === item)) && <Check size={18} className="text-brand-orange" />}
                            </div>
                          ))
                        ) : (
                           <div className="p-8 text-center text-gray-400 text-sm">
                              Sonuç bulunamadı.
                           </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider (Desktop Only) */}
              <div className="hidden md:block w-[1px] h-12 bg-gray-100 mx-2"></div>

              {/* 2. Service Selection Section */}
              <div 
                className="relative w-full md:flex-1 group border-t border-gray-100 md:border-0" 
                ref={serviceRef}
              >
                <div 
                  className={`flex items-center h-20 px-6 cursor-pointer rounded-[1.5rem] transition-all duration-200 border border-transparent ${isServiceOpen ? 'bg-white shadow-lg border-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    if (isSearching) return;
                    setIsServiceOpen(!isServiceOpen);
                    setIsLocationOpen(false);
                  }}
                >
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors ${isServiceOpen ? 'bg-brand-orange text-white' : 'bg-orange-50 text-brand-orange'}`}>
                    {selectedService ? <selectedService.icon size={22} strokeWidth={2.5} /> : <Search size={22} strokeWidth={2.5} />}
                  </div>

                  <div className="flex-1 flex flex-col items-start">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">İhtiyacın Nedir?</label>
                     <div className="flex items-center justify-between w-full pr-2">
                        <span className={`text-lg font-bold truncate ${selectedService ? 'text-gray-800' : 'text-gray-300'}`}>
                           {selectedService ? selectedService.title : 'Hizmet Seçin'}
                        </span>
                        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isServiceOpen ? 'rotate-180 text-brand-orange' : ''}`} />
                     </div>
                  </div>
                </div>

                {/* Service Dropdown */}
                <AnimatePresence>
                  {isServiceOpen && !isSearching && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[110%] left-0 md:-left-12 w-full md:w-[120%] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60]"
                    >
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                        {SERVICES.map((service) => (
                           <div 
                              key={service.id}
                              onClick={() => handleSelectService(service.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent hover:border-orange-100 hover:bg-orange-50/50 ${selectedServiceId === service.id ? 'bg-orange-50 border-orange-200' : ''}`}
                           >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${selectedServiceId === service.id ? 'bg-brand-orange text-white' : 'bg-white text-brand-orange'}`}>
                                 <service.icon size={18} />
                              </div>
                              <div className="flex-1">
                                 <h4 className={`text-sm font-bold ${selectedServiceId === service.id ? 'text-brand-orange' : 'text-gray-800'}`}>
                                    {service.title}
                                 </h4>
                                 <p className="text-[11px] text-gray-400 line-clamp-1 leading-normal mt-0.5">{service.description}</p>
                              </div>
                              {selectedServiceId === service.id && <Check size={16} className="text-brand-orange" />}
                           </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Action Button */}
              <div className="p-2 w-full md:w-auto">
                <button 
                  ref={searchButtonRef}
                  onClick={handleSearchClick}
                  disabled={isSearching}
                  aria-label="Hizmet ara ve talep oluştur"
                  className="w-full md:w-auto h-16 md:h-20 px-8 text-white rounded-[1.5rem] shadow-lg shadow-orange-200 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap group disabled:opacity-0"
                  style={{backgroundColor: '#FF7A00'}}
                >
                  <span className="font-bold text-lg">Hemen Bul</span>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Search size={18} strokeWidth={3} />
                  </div>
                </button>
              </div>

            </div>

          </motion.div>

        </div>
      </div>
      
      {/* Loading Overlay - Konum Yükleme Ekranı */}
      <AnimatePresence>
        {isLoadingLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-3xl p-10 flex flex-col items-center shadow-2xl max-w-md mx-4"
            >
              <div className="relative mb-6">
                <Loader2 className="animate-spin text-brand-orange" size={64} strokeWidth={2.5} />
                <div className="absolute inset-0 rounded-full border-4 border-orange-100 animate-pulse"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Konumunuz Belirleniyor
              </h3>
              <p className="text-lg text-gray-600 text-center">
                {locationLoadingText}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add Tailwind keyframes for the moving road effect */}
      <style>{`
        @keyframes move-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-move-left {
          animation: move-left 1s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;
