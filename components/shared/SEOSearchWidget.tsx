/**
 * SEO Search Widget - Hero-style search box for SEO pages
 * SEOServicePage ve SEOBrandPage için optimize edilmiş arama kutusu
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, ChevronDown, Check, XCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SERVICES, CITIES_WITH_DISTRICTS } from '../../constants';

interface SEOSearchWidgetProps {
  initialCity?: string;
  initialDistrict?: string;
  initialService?: string;
  onSearch?: (city: string, district: string, serviceId: string) => void;
}

const SEOSearchWidget: React.FC<SEOSearchWidgetProps> = ({
  initialCity = '',
  initialDistrict = '',
  initialService = '',
  onSearch
}) => {
  const navigate = useNavigate();

  // Location State
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationStep, setLocationStep] = useState<'city' | 'district'>('city');
  const [locationSearch, setLocationSearch] = useState('');
  
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  
  // Service State
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(initialService);

  const locationRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // City and District lists
  const cityList = Object.keys(CITIES_WITH_DISTRICTS);
  const districtList = selectedCity ? CITIES_WITH_DISTRICTS[selectedCity] : [];

  // Filter based on search
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
    setLocationSearch('');
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

  const handleSearchClick = () => {
    if (!selectedCity || !selectedDistrict || !selectedServiceId) {
      alert('Lütfen konum ve hizmet seçin.');
      return;
    }

    if (onSearch) {
      onSearch(selectedCity, selectedDistrict, selectedServiceId);
    } else {
      // Default: Navigate to listing page
      navigate('/teklif', {
        state: {
          serviceType: selectedServiceId,
          city: selectedCity,
          district: selectedDistrict
        }
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 flex flex-col md:flex-row p-3 items-center backdrop-blur-sm relative z-10">
        
        {/* 1. Location Input Section */}
        <div 
          className="relative w-full md:flex-1 group" 
          ref={locationRef}
        >
          <div 
            className={`flex items-center h-20 px-6 cursor-pointer rounded-[1.5rem] transition-all duration-200 border border-transparent ${isLocationOpen ? 'bg-white shadow-lg border-gray-100' : 'hover:bg-gray-50'}`}
            onClick={() => {
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
                />
              )}
            </div>

            {selectedCity && (
               <button 
                  onClick={handleResetLocation}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors z-20"
               >
                  <XCircle size={20} />
               </button>
            )}
          </div>

          {/* Location Dropdown */}
          <AnimatePresence>
            {isLocationOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-[110%] left-0 w-full md:min-w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[350px] overflow-y-auto z-[60] py-2"
              >
                <div className="px-2 pb-2 mb-2 border-b border-gray-50 sticky top-0 bg-white z-10">
                  {locationStep === 'district' && (
                     <button 
                       onClick={handleBackToCities}
                       className="flex items-center gap-2 text-gray-500 hover:text-brand-orange text-sm px-4 py-2 transition-colors font-medium"
                     >
                       <ChevronLeft size={16} />
                       İl Seçimine Dön ({selectedCity})
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
            {isServiceOpen && (
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
            onClick={handleSearchClick}
            aria-label="Hizmet ara ve talep oluştur"
            className="w-full md:w-auto h-16 md:h-20 px-8 text-white rounded-[1.5rem] shadow-lg shadow-orange-200 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap group"
            style={{backgroundColor: '#FF7A00'}}
          >
            <span className="font-bold text-lg">Hemen Bul</span>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Search size={18} strokeWidth={3} />
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default SEOSearchWidget;
