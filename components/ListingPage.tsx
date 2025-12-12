
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Clock, MapPin, ShieldCheck, Search, 
  ClipboardList, ArrowRight, User, Calendar, 
  CheckCircle2, Star, ChevronRight, Map, Filter, DollarSign, X, ChevronDown,
  Navigation, Check, XCircle, ChevronLeft, Truck, BatteryCharging, Disc, Fuel, CarFront, Wrench, Loader2, Car, Route,
  Compass, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CITIES_WITH_DISTRICTS, SERVICES } from '../constants';
import { Provider, AvailablePartner } from '../types';
import { supabaseApi } from '../services/supabaseApi';
import { 
  calculateDistancesBatch, 
  getCityCoordinates, 
  reverseGeocode,
  Coordinates 
} from '../services/distanceService';

interface ListingPageProps {
  initialCity?: string;
  initialDistrict?: string;
  initialServiceId?: string;
  onNavigateToQuote: () => void;
  onProviderClick: (provider: Provider) => void;
}

// Extended provider type with match info
interface ExtendedProvider extends Provider {
  matchType?: 'service_area' | 'return_route';
  discountPercent?: number;
  routeInfo?: {
    origin?: string;
    destination?: string;
    departureDate?: string;
  };
  // 🆕 Mesafe & ETA bilgileri
  distanceKm?: number;
  distanceText?: string;
  durationMinutes?: number;
  durationText?: string;
}

const ProviderCard = ({ provider, index, onClick }: { provider: ExtendedProvider, index: number, onClick: (provider: Provider) => void }) => {
  const handleCardClick = () => {
    // Direkt detay sayfasına git (auth kontrolü yok - detay sayfasında "Teklif Al" butonunda yapılacak)
    onClick(provider);
  };

  const isReturnRoute = provider.matchType === 'return_route';
  const hasDistance = provider.distanceKm !== undefined && provider.distanceKm > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={handleCardClick}
      className={`bg-white rounded-2xl p-6 shadow-sm border transition-all cursor-pointer group flex flex-col md:flex-row items-center gap-6 md:gap-8 relative ${
        isReturnRoute 
          ? 'border-green-200 hover:border-green-400 hover:shadow-green-100' 
          : 'border-gray-100 hover:shadow-md hover:border-brand-orange/30'
      }`}
    >
      {/* Return Route Badge */}
      {isReturnRoute && (
        <div className="absolute -top-2 -right-2 md:static md:absolute md:-top-3 md:-right-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full shadow-sm">
            <Route size={12} />
            Boş Dönüş
            {provider.discountPercent && provider.discountPercent > 0 && (
              <span className="ml-1">%{provider.discountPercent} İndirim</span>
            )}
          </span>
        </div>
      )}

      {/* LEFT: Profile & Main Info */}
      <div className="flex items-center gap-4 w-full md:w-auto min-w-[240px]">
          <div className="relative shrink-0">
              <img 
              src={provider.image} 
              alt={provider.name} 
              className={`w-16 h-16 rounded-full object-cover border transition-colors ${
                isReturnRoute 
                  ? 'border-green-200 group-hover:border-green-400' 
                  : 'border-gray-100 group-hover:border-brand-orange'
              }`}
              />
              {provider.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                  <CheckCircle2 size={18} className="text-blue-500 fill-white" />
              </div>
              )}
          </div>
          <div>
              <h3 className={`text-lg font-bold transition-colors leading-tight mb-1 ${
                isReturnRoute 
                  ? 'text-gray-900 group-hover:text-green-600' 
                  : 'text-gray-900 group-hover:text-brand-orange'
              }`}>
                  {provider.name}
              </h3>
              <div className="flex items-center gap-1.5 mb-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold text-gray-800">{provider.rating}</span>
                  <span className="text-xs text-gray-400">({provider.reviewCount})</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                    {provider.serviceType}
                </span>
                {isReturnRoute && provider.routeInfo && (
                  <span className="inline-block px-2 py-0.5 bg-green-50 rounded text-[10px] font-bold text-green-600">
                    {provider.routeInfo.origin} → {provider.routeInfo.destination}
                  </span>
                )}
              </div>
          </div>
      </div>

      {/* MIDDLE: Location / Route Info + Distance/ETA */}
      <div className="flex-1 w-full md:w-auto flex items-center md:border-l md:border-gray-100 md:pl-8 py-2">
          <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
              {/* Location Info */}
              <div className="flex flex-col justify-center flex-1">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold mb-0.5">
                      {isReturnRoute ? (
                        <>
                          <Route size={14} /> Rota
                        </>
                      ) : (
                        <>
                          <Map size={14} /> Konum
                        </>
                      )}
                  </div>
                  <div className="text-gray-800 font-semibold text-sm md:text-base truncate">
                      {isReturnRoute && provider.routeInfo ? (
                        <span className="flex items-center gap-2">
                          <span>{provider.routeInfo.origin}</span>
                          <ChevronRight size={14} className="text-gray-400" />
                          <span className="text-green-600 font-bold">{provider.location}</span>
                          <ChevronRight size={14} className="text-gray-400" />
                          <span>{provider.routeInfo.destination}</span>
                        </span>
                      ) : (
                        provider.location
                      )}
                  </div>
                  {isReturnRoute && provider.routeInfo?.departureDate && (
                    <div className="text-xs text-gray-400 mt-1">
                      <Calendar size={12} className="inline mr-1" />
                      {new Date(provider.routeInfo.departureDate).toLocaleDateString('tr-TR')}
                    </div>
                  )}
              </div>
              
              {/* 🆕 Distance & ETA Badges */}
              {hasDistance && (
                <div className="flex items-center gap-2 md:border-l md:border-gray-100 md:pl-4">
                  {/* Distance Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                    <Navigation size={16} className="text-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wide">Mesafe</span>
                      <span className="text-sm font-bold text-blue-600">{provider.distanceText}</span>
                    </div>
                  </div>
                  
                  {/* ETA Badge */}
                  {provider.durationText && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 rounded-lg border border-orange-100">
                      <Clock size={16} className="text-brand-orange" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-orange-400 font-medium uppercase tracking-wide">Varış</span>
                        <span className="text-sm font-bold text-brand-orange">{provider.durationText}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
      </div>

      {/* RIGHT: Select Button */}
      <div className="w-full md:w-auto shrink-0">
          <button 
              onClick={(e) => {
                e.stopPropagation();
                onClick(provider);
              }}
              className={`w-full px-6 py-3 rounded-xl font-bold transition-colors shadow-md flex items-center justify-center gap-2 ${
                isReturnRoute 
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-100' 
                  : 'bg-brand-orange text-white hover:bg-brand-lightOrange shadow-orange-100'
              }`}
          >
              Seç <ChevronRight size={18} />
          </button>
      </div>

    </motion.div>
  );
};

const ListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialCity = searchParams.get('city') || '';
  const initialDistrict = searchParams.get('district') || '';
  const initialServiceId = searchParams.get('serviceId') || '';
  const fromHero = searchParams.get('fromHero') === '1'; // Hero'dan mı geldi?
  
  // Location State (Hero mantığı)
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationStep, setLocationStep] = useState<'city' | 'district'>('city');
  const [locationSearch, setLocationSearch] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  
  // Service State
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  
  const [sortBy, setSortBy] = useState('distance'); // Varsayılan mesafeye göre sırala
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Animation State (Hero mantığı)
  const [isSearching, setIsSearching] = useState(false);
  const [loadingText, setLoadingText] = useState('Arama başlatılıyor...');
  const [buttonRect, setButtonRect] = useState<{top: number, left: number, width: number, height: number} | null>(null);
  
  // Initial loading animation state (sayfa ilk açıldığında)
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Available Partners from API (service areas + return routes)
  const [availablePartners, setAvailablePartners] = useState<AvailablePartner[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [showEmptyRoutes, setShowEmptyRoutes] = useState(true);
  
  // Track if initial data fetch is done
  const [dataFetched, setDataFetched] = useState(false);

  // 🆕 Kullanıcı konum bilgisi (mesafe/ETA hesaplama için)
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

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

  // Filter lists
  const cityList = Object.keys(CITIES_WITH_DISTRICTS);
  const districtList = selectedCity ? CITIES_WITH_DISTRICTS[selectedCity] : [];

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

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum özelliğini desteklemiyor.');
      return;
    }

    setIsLoadingLocation(true);
    setIsLocationOpen(false);
    setLocationPermissionDenied(false);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // 🆕 Koordinatları state'e kaydet (mesafe hesaplama için)
        setUserCoordinates({ lat: latitude, lng: longitude });
        
        // SessionStorage'a da kaydet (sayfa yenilemesi için)
        sessionStorage.setItem('yolmov_user_coords', JSON.stringify({ lat: latitude, lng: longitude }));
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=tr`,
            { headers: { 'User-Agent': 'YOLMOV App' } }
          );
          
          const data = await response.json();
          const address = data.address || {};
          let city = address.province || address.state || address.city || address.town;
          let district = address.county || address.district || address.suburb || address.neighbourhood;
          
          const matchedCity = Object.keys(CITIES_WITH_DISTRICTS).find(
            c => c.toLowerCase() === city?.toLowerCase()
          );
          
          if (matchedCity) {
            handleSelectCity(matchedCity);
            const districts = CITIES_WITH_DISTRICTS[matchedCity];
            const matchedDistrict = districts.find(
              d => d.toLowerCase().includes(district?.toLowerCase()) || 
                   district?.toLowerCase().includes(d.toLowerCase())
            );
            
            if (matchedDistrict) {
              setTimeout(() => {
                handleSelectDistrict(matchedDistrict);
                setIsLoadingLocation(false);
              }, 500);
            } else {
              setLocationStep('district');
              setIsLocationOpen(true);
              setIsLoadingLocation(false);
            }
          } else {
            setIsLoadingLocation(false);
            setIsLocationOpen(true);
          }
        } catch (error) {
          alert('Konum bilgisi alınamadı. Lütfen manuel olarak seçin.');
          setIsLoadingLocation(false);
          setIsLocationOpen(true);
        }
      },
      (error) => {
        console.warn('Konum erişimi reddedildi:', error.message);
        setLocationPermissionDenied(true);
        setIsLoadingLocation(false);
        setIsLocationOpen(true);
        // Sessizce devam et - kullanıcı manuel seçebilir
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 🆕 Partner mesafelerini hesapla
  const calculatePartnerDistances = useCallback(async (
    partners: AvailablePartner[],
    userCoords: Coordinates
  ): Promise<AvailablePartner[]> => {
    if (!userCoords || partners.length === 0) return partners;
    
    setIsCalculatingDistances(true);
    
    try {
      // Partner koordinatlarını hazırla
      const partnerLocations = await Promise.all(
        partners.map(async (partner) => {
          // Önce partner'ın kendi koordinatlarına bak
          if (partner.partnerLatitude && partner.partnerLongitude) {
            return {
              partnerId: partner.partnerId,
              coordinates: { lat: partner.partnerLatitude, lng: partner.partnerLongitude }
            };
          }
          
          // Yoksa şehir/ilçe'den geocode et
          const coords = await getCityCoordinates(partner.city || '');
          if (coords) {
            return {
              partnerId: partner.partnerId,
              coordinates: coords
            };
          }
          
          return null;
        })
      );
      
      // Null olmayanları filtrele
      const validLocations = partnerLocations.filter((loc): loc is NonNullable<typeof loc> => loc !== null);
      
      if (validLocations.length === 0) {
        setIsCalculatingDistances(false);
        return partners;
      }
      
      // Batch mesafe hesaplama
      const distanceResults = await calculateDistancesBatch(userCoords, validLocations);
      
      // Sonuçları partner'lara ekle
      const updatedPartners = partners.map(partner => {
        const distance = distanceResults.get(partner.partnerId);
        if (distance && distance.success) {
          return {
            ...partner,
            distanceKm: distance.distanceKm,
            distanceText: distance.distanceText,
            durationMinutes: distance.durationMinutes,
            durationText: distance.durationText
          };
        }
        return partner;
      });
      
      setIsCalculatingDistances(false);
      return updatedPartners;
    } catch (error) {
      console.error('Mesafe hesaplama hatası:', error);
      setIsCalculatingDistances(false);
      return partners;
    }
  }, []);

  // Fetch available partners from API when city changes
  const fetchAvailablePartners = useCallback(async (city: string, district?: string, isInitial: boolean = false) => {
    if (!city) {
      setAvailablePartners([]);
      setDataFetched(true);
      return;
    }

    setIsLoadingPartners(true);
    try {
      const partners = await supabaseApi.partnerSearch.getAvailablePartners(city, district);
      
      // 🆕 Kullanıcı koordinatları varsa mesafeleri hesapla
      let partnersWithDistance = partners;
      
      // SessionStorage'dan koordinatları kontrol et
      const storedCoords = sessionStorage.getItem('yolmov_user_coords');
      let coords = userCoordinates;
      
      if (!coords && storedCoords) {
        try {
          coords = JSON.parse(storedCoords);
          setUserCoordinates(coords);
        } catch (e) {
          console.warn('Koordinat parse hatası:', e);
        }
      }
      
      if (coords && partners.length > 0) {
        partnersWithDistance = await calculatePartnerDistances(partners, coords);
      }
      
      setAvailablePartners(partnersWithDistance);
      console.log(`✅ Found ${partners.length} available partners for ${city}${district ? `, ${district}` : ''}${coords ? ' (mesafeler hesaplandı)' : ''}`);
    } catch (error) {
      console.error('❌ Error fetching available partners:', error);
      setAvailablePartners([]);
    } finally {
      setIsLoadingPartners(false);
      if (isInitial) {
        setDataFetched(true);
      }
    }
  }, [userCoordinates, calculatePartnerDistances]);

  // Animasyon başlangıç zamanını takip et
  const animationStartTimeRef = useRef<number>(0);

  // 🆕 Sayfa yüklendiğinde kullanıcı koordinatlarını kontrol et veya iste
  useEffect(() => {
    // SessionStorage'dan koordinatları kontrol et
    const storedCoords = sessionStorage.getItem('yolmov_user_coords');
    if (storedCoords) {
      try {
        const coords = JSON.parse(storedCoords);
        setUserCoordinates(coords);
        console.log('📍 Kaydedilmiş koordinatlar yüklendi:', coords);
        return; // Zaten var, tekrar isteme
      } catch (e) {
        console.warn('Koordinat parse hatası:', e);
      }
    }
    
    // Koordinat yoksa ve konum izni kontrolü
    if (navigator.geolocation && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          // İzin zaten verilmiş, koordinatları al
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
              setUserCoordinates(coords);
              sessionStorage.setItem('yolmov_user_coords', JSON.stringify(coords));
              console.log('📍 Konum alındı (granted):', coords);
            },
            () => {
              console.log('📍 Konum alınamadı');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 } // 5 dk cache
          );
        } else if (result.state === 'prompt') {
          // İzin sorulacak - kullanıcı "Konumumu Kullan" tıklarsa sorulur
          console.log('📍 Konum izni henüz sorulmadı - kullanıcı aksiyonu bekleniyor');
        } else {
          setLocationPermissionDenied(true);
          console.log('📍 Konum izni reddedilmiş');
        }
      });
    }
  }, []);

  // Initial page load with animation - API ve minimum süre birlikte bekle
  // NOT: Hero'dan geldiyse (fromHero=1), animasyonu başlatma - Hero zaten gösterdi
  useEffect(() => {
    if (initialCity && !initialLoadComplete) {
      // Hero'dan geldiyse - sessionStorage'dan veriyi oku
      if (fromHero) {
        setInitialLoadComplete(true); // Animasyon atla
        
        // sessionStorage'dan Hero'nun çektiği veriyi oku
        try {
          const cachedData = sessionStorage.getItem('yolmov_search_results');
          if (cachedData) {
            const { partners, city, district, timestamp } = JSON.parse(cachedData);
            
            // Veri 30 saniyeden eski değilse ve aynı şehir/ilçe ise kullan
            const isRecent = Date.now() - timestamp < 30000;
            const isSameLocation = city === initialCity && district === initialDistrict;
            
            if (isRecent && isSameLocation && partners) {
              console.log('✅ Using cached partners from Hero:', partners.length);
              setAvailablePartners(partners);
              sessionStorage.removeItem('yolmov_search_results'); // Temizle
              
              // URL'den fromHero parametresini temizle
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('fromHero');
              setSearchParams(newParams, { replace: true });
              return;
            }
          }
        } catch (e) {
          console.warn('Cache read error:', e);
        }
        
        // Cache yoksa veya geçersizse normal API çağrısı yap
        fetchAvailablePartners(initialCity, initialDistrict, false);
        
        // URL'den fromHero parametresini temizle (geri tuşu için)
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('fromHero');
        setSearchParams(newParams, { replace: true });
        return;
      }
      
      // Normal akış: Animasyonlu yükleme
      animationStartTimeRef.current = Date.now();
      
      // Sayfa ilk açıldığında full-screen animasyonu başlat
      setIsInitialLoading(true);
      setLoadingText("Konumunuz analiz ediliyor...");
      
      // Ekranın ortasından başla (buttonRect yerine merkez)
      setButtonRect({
        top: window.innerHeight / 2 - 25,
        left: window.innerWidth / 2 - 75,
        width: 150,
        height: 50
      });

      // Progressive text sequence
      const textTimers = [
        setTimeout(() => setLoadingText("Bölgedeki uzmanlar taranıyor..."), 800),
        setTimeout(() => setLoadingText("Müsaitlik durumları kontrol ediliyor..."), 1800),
      ];

      // API çağrısını başlat
      fetchAvailablePartners(initialCity, initialDistrict, true);
      
      // Cleanup
      return () => textTimers.forEach(clearTimeout);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece ilk mount'ta çalışsın

  // dataFetched olunca animasyonu bitir (minimum 2.5sn sonra)
  useEffect(() => {
    if (dataFetched && isInitialLoading && !initialLoadComplete) {
      // Minimum animasyon süresi için bekle
      const minAnimationTime = 2500; // 2.5 saniye minimum
      const elapsed = Date.now() - animationStartTimeRef.current;
      const remaining = Math.max(0, minAnimationTime - elapsed);
      
      const finishTimer = setTimeout(() => {
        setLoadingText("Sonuçlar hazır!");
        setTimeout(() => {
          setIsInitialLoading(false);
          setInitialLoadComplete(true);
          setButtonRect(null);
        }, 500); // "Sonuçlar hazır!" mesajını gösterdikten sonra kapat
      }, remaining);

      return () => clearTimeout(finishTimer);
    }
  }, [dataFetched, isInitialLoading, initialLoadComplete]);

  // Load partners when city/district changes (sonraki değişiklikler için - ilk yükleme hariç)
  useEffect(() => {
    // İlk yükleme zaten yukarıdaki useEffect'te yapılıyor
    if (selectedCity && initialLoadComplete) {
      fetchAvailablePartners(selectedCity, selectedDistrict);
    }
  }, [selectedCity, selectedDistrict, fetchAvailablePartners, initialLoadComplete]);

  // Convert AvailablePartner to Provider format for display
  const partnersAsProviders = useMemo((): Provider[] => {
    return availablePartners.map(partner => {
      // Partner için profil fotoğrafı veya varsayılan avatar belirle
      const displayName = partner.companyName || partner.partnerName || 'Partner';
      const profileImage = partner.profilePhotoUrl || partner.logoUrl || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FF6B35&color=fff&size=128`;
      
      return {
        id: partner.partnerId,
        name: displayName,
        slug: partner.partnerId,
        serviceType: 'nakliyat',
        rating: partner.rating || 4.5,
        reviewCount: partner.completedJobs || 0,
        location: `${partner.city || ''}${partner.district ? `, ${partner.district}` : ''}`,
        eta: partner.matchType === 'return_route' ? '1-3 saat (boş dönüş)' : '30-60 dk',
        verified: true,
        isVerified: true,
        priceRange: partner.matchType === 'return_route' && partner.discountPercent 
          ? `%${partner.discountPercent} indirimli` 
          : 'Standart',
        image: profileImage,
        description: partner.matchType === 'return_route' 
          ? `Boş dönüş rotası: ${partner.originCity || ''} → ${partner.destinationCity || ''}` 
          : partner.notes || '',
        services: [],
        founded: '',
        fleetSize: '',
        specialties: [],
        serviceAreas: [],
        reviews: [],
        // Custom fields for display
        matchType: partner.matchType,
        discountPercent: partner.discountPercent,
        routeInfo: partner.matchType === 'return_route' ? {
          origin: partner.originCity,
          destination: partner.destinationCity,
          departureDate: partner.departureDate
        } : undefined,
        // 🆕 Mesafe & ETA bilgileri
        distanceKm: partner.distanceKm,
        distanceText: partner.distanceText,
        durationMinutes: partner.durationMinutes,
        durationText: partner.durationText
      } as ExtendedProvider;
    });
  }, [availablePartners]);

  // Filtered providers based on search criteria (only API data, no mock)
  const filteredProviders = useMemo(() => {
    // Only use API partners - no mock/static data
    if (partnersAsProviders.length > 0) {
      // Filter return routes if showEmptyRoutes is false
      const apiProviders = showEmptyRoutes 
        ? partnersAsProviders 
        : partnersAsProviders.filter(p => (p as any).matchType !== 'return_route');

      // Filter by verified if needed
      const verifiedFiltered = verifiedOnly 
        ? apiProviders.filter(p => p.isVerified) 
        : apiProviders;

      // 🆕 Sıralama: mesafeye göre veya varsayılan (service_area önce)
      const sortedApiProviders = [...verifiedFiltered].sort((a, b) => {
        const aExt = a as ExtendedProvider;
        const bExt = b as ExtendedProvider;
        
        // Önce mesafeye göre sırala (eğer her ikisinde de mesafe varsa)
        if (sortBy === 'distance') {
          if (aExt.distanceKm !== undefined && bExt.distanceKm !== undefined) {
            return aExt.distanceKm - bExt.distanceKm;
          }
          // Mesafesi olan önce gelsin
          if (aExt.distanceKm !== undefined) return -1;
          if (bExt.distanceKm !== undefined) return 1;
        }
        
        // Sonra match type'a göre (service_area önce)
        const aType = aExt.matchType;
        const bType = bExt.matchType;
        if (aType === 'service_area' && bType === 'return_route') return -1;
        if (aType === 'return_route' && bType === 'service_area') return 1;
        return 0;
      });

      return sortedApiProviders;
    }

    // No API data = empty list (no mock data)
    return [];
  }, [verifiedOnly, partnersAsProviders, showEmptyRoutes, sortBy]);

  const displayProviders = filteredProviders;

  // Helper: Animasyon için icon seç (Hero ile aynı)
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

  // Handle Search Click - Hero ile aynı animasyon
  const handleSearchClick = () => {
    if (!selectedCity || !selectedDistrict) return;
    
    if (searchButtonRef.current) {
      const rect = searchButtonRef.current.getBoundingClientRect();
      setButtonRect({ 
        top: rect.top, 
        left: rect.left, 
        width: rect.width, 
        height: rect.height 
      });
    }
    
    setIsSearching(true);

    // Hero ile aynı progressive text sequence
    setLoadingText("Konumunuz analiz ediliyor...");
    
    setTimeout(() => {
      setLoadingText("Bölgedeki uzmanlar taranıyor...");
    }, 800);

    setTimeout(() => {
      setLoadingText("Müsaitlik durumları kontrol ediliyor...");
    }, 1800);

    setTimeout(() => {
      setLoadingText("Sonuçlar hazır!");
    }, 2600);

    setTimeout(() => {
      // URL güncelle ve filtrele
      const params = new URLSearchParams();
      if (selectedCity) params.set('city', selectedCity);
      if (selectedDistrict) params.set('district', selectedDistrict);
      if (selectedServiceId) params.set('serviceId', selectedServiceId);
      setSearchParams(params);
      
      setIsSearching(false);
      setButtonRect(null);
    }, 3000);
  };

  // --- NEW COMPONENTS FOR THIS DESIGN ---

  // 1. Horizontal Search Bar (Top) - Hero Mantığı
  const SearchStrip = () => {
    const handleSearch = () => {
      const params = new URLSearchParams();
      if (selectedCity) params.set('city', selectedCity);
      if (selectedDistrict) params.set('district', selectedDistrict);
      if (selectedServiceId) params.set('serviceId', selectedServiceId);
      setSearchParams(params);
    };

    return (
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-[80px] z-30 hidden md:block">
        <div className="container mx-auto px-4 md:px-8 lg:px-24 xl:px-32">
          <div className="flex items-center gap-4 h-20">
            
            {/* Location Dropdown */}
            <div ref={locationRef} className="flex-1 relative">
              <div
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <MapPin className="text-brand-orange shrink-0" size={20} />
                <div className="flex-1">
                  <div className="text-xs text-gray-400 font-bold">Neredesin?</div>
                  <div className="text-gray-800 font-semibold truncate">
                    {selectedCity && selectedDistrict 
                      ? `${selectedDistrict}, ${selectedCity}`
                      : selectedCity
                      ? selectedCity
                      : 'İl ara...'}
                  </div>
                </div>
                {(selectedCity || selectedDistrict) && (
                  <XCircle
                    size={18}
                    className="text-gray-400 hover:text-red-500 cursor-pointer"
                    onClick={handleResetLocation}
                  />
                )}
                <ChevronDown
                  className={`text-gray-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`}
                  size={18}
                />
              </div>

              {/* Location Dropdown Menu */}
              <AnimatePresence>
                {isLocationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    {/* Header with GPS */}
                    <div className="p-4 border-b border-gray-100">
                      {locationStep === 'district' && (
                        <button
                          onClick={handleBackToCities}
                          className="flex items-center gap-2 text-sm text-brand-orange hover:text-brand-lightOrange mb-3"
                        >
                          <ChevronLeft size={16} /> Şehir Seçimine Dön
                        </button>
                      )}
                      <button
                        onClick={handleUseCurrentLocation}
                        disabled={isLoadingLocation}
                        className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                      >
                        <Navigation size={16} />
                        {isLoadingLocation ? 'Konum alınıyor...' : 'Mevcut Konumumu Kullan'}
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-4 border-b border-gray-100">
                      <input
                        ref={inputRef}
                        type="text"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder={locationStep === 'city' ? 'İl ara...' : 'İlçe ara...'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none"
                      />
                    </div>

                    {/* List */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <div
                            key={item}
                            onClick={() => locationStep === 'city' ? handleSelectCity(item) : handleSelectDistrict(item)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group"
                          >
                            <span className="text-gray-700 group-hover:text-brand-orange font-medium">{item}</span>
                            {((locationStep === 'city' && item === selectedCity) || (locationStep === 'district' && item === selectedDistrict)) && (
                              <Check size={16} className="text-brand-orange" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-400">Sonuç bulunamadı</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            {/* Service Dropdown */}
            <div ref={serviceRef} className="flex-1 relative">
              <div
                onClick={() => setIsServiceOpen(!isServiceOpen)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Search className="text-brand-orange shrink-0" size={20} />
                <div className="flex-1">
                  <div className="text-xs text-gray-400 font-bold">İhtiyacın Nedir?</div>
                  <div className="text-gray-800 font-semibold truncate">
                    {selectedService?.title || 'Hizmet Seçin'}
                  </div>
                </div>
                <ChevronDown
                  className={`text-gray-400 transition-transform ${isServiceOpen ? 'rotate-180' : ''}`}
                  size={18}
                />
              </div>

              {/* Service Dropdown Menu */}
              <AnimatePresence>
                {isServiceOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    {SERVICES.map((service) => {
                      const ServiceIcon = service.icon;
                      return (
                        <div
                          key={service.id}
                          onClick={() => handleSelectService(service.id)}
                          className={`px-4 py-3 hover:bg-orange-50 cursor-pointer transition-colors flex items-center gap-3 group ${service.id === selectedServiceId ? 'bg-orange-50' : ''}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${service.id === selectedServiceId ? 'bg-brand-orange text-white' : 'bg-orange-50 text-brand-orange'}`}>
                            <ServiceIcon size={20} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-semibold ${service.id === selectedServiceId ? 'text-brand-orange' : 'text-gray-800 group-hover:text-brand-orange'}`}>
                              {service.title}
                            </div>
                            <div className="text-xs text-gray-400">{service.description}</div>
                          </div>
                          {service.id === selectedServiceId && (
                            <Check size={16} className="text-brand-orange" />
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Button */}
            <button 
              ref={searchButtonRef}
              onClick={handleSearchClick}
              disabled={!selectedCity || !selectedDistrict}
              className="bg-brand-orange hover:bg-brand-lightOrange disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md shadow-orange-100"
            >
              Hemen Bul
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 2. Sort & Filter Sidebar
  const Sidebar = () => {
    const handleClearFilters = () => {
      setVerifiedOnly(false);
      setSortBy('eta');
    };

    return (
      <div className="space-y-8">
        
        {/* Sort Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-brand-dark text-lg">Sırala</h3>
            <button 
              onClick={handleClearFilters}
              className="text-xs text-brand-orange font-semibold hover:underline"
            >
              Tümünü temizle
            </button>
          </div>
         <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
               <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sortBy === 'eta' ? 'border-brand-orange' : 'border-gray-300 group-hover:border-brand-orange'}`}>
                  {sortBy === 'eta' && <div className="w-2.5 h-2.5 rounded-full bg-brand-orange"></div>}
               </div>
               <input type="radio" name="sort" className="hidden" checked={sortBy === 'eta'} onChange={() => setSortBy('eta')} />
               <div className="flex items-center gap-2 text-gray-600 group-hover:text-brand-dark">
                  <Clock size={18} />
                  <span>En erken varış</span>
               </div>
            </label>

             <label className="flex items-center gap-3 cursor-pointer group">
               <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sortBy === 'dist' ? 'border-brand-orange' : 'border-gray-300 group-hover:border-brand-orange'}`}>
                  {sortBy === 'dist' && <div className="w-2.5 h-2.5 rounded-full bg-brand-orange"></div>}
               </div>
               <input type="radio" name="sort" className="hidden" checked={sortBy === 'dist'} onChange={() => setSortBy('dist')} />
               <div className="flex items-center gap-2 text-gray-600 group-hover:text-brand-dark">
                  <MapPin size={18} />
                  <span>Kalkış yerine yakın</span>
               </div>
            </label>
         </div>
      </div>

      <div className="w-full h-px bg-gray-200"></div>

      {/* Trust Filter */}
      <div>
         <h3 className="font-bold text-brand-dark text-lg mb-4">Güven ve Güvenlik</h3>
         <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
               <input 
                 type="checkbox" 
                 checked={verifiedOnly}
                 onChange={(e) => setVerifiedOnly(e.target.checked)}
                 className="w-5 h-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" 
               />
               <span className="text-gray-600 group-hover:text-gray-900">Doğrulanmış Profil</span>
            </div>
            <ShieldCheck size={18} className="text-brand-orange" />
         </label>
      </div>

    </div>
  );
};

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* Top Search Strip - Desktop */}
      <SearchStrip />

      {/* Mobile Search Card */}
      <div className="md:hidden bg-white shadow-sm border-b border-gray-200 sticky top-[64px] z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="space-y-3">
            {/* Location */}
            <div ref={locationRef} className="relative">
              <label className="text-xs text-gray-400 font-bold mb-1 block">Neredesin?</label>
              <div
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="w-full text-sm font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">
                  {selectedCity && selectedDistrict 
                    ? `${selectedDistrict}, ${selectedCity}`
                    : selectedCity
                    ? selectedCity
                    : 'İl ara...'}
                </span>
                <ChevronDown size={16} className={`transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Mobile Location Dropdown */}
              <AnimatePresence>
                {isLocationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-gray-100">
                      {locationStep === 'district' && (
                        <button
                          onClick={handleBackToCities}
                          className="flex items-center gap-2 text-sm text-brand-orange mb-2"
                        >
                          <ChevronLeft size={16} /> Geri
                        </button>
                      )}
                      <button
                        onClick={handleUseCurrentLocation}
                        className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg font-semibold text-sm"
                      >
                        <Navigation size={16} />
                        {isLoadingLocation ? 'Alınıyor...' : 'Konumumu Kullan'}
                      </button>
                    </div>
                    <div className="p-3 border-b border-gray-100">
                      <input
                        ref={inputRef}
                        type="text"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder={locationStep === 'city' ? 'İl ara...' : 'İlçe ara...'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredItems.map((item) => (
                        <div
                          key={item}
                          onClick={() => locationStep === 'city' ? handleSelectCity(item) : handleSelectDistrict(item)}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Service */}
            <div ref={serviceRef} className="relative">
              <label className="text-xs text-gray-400 font-bold mb-1 block">İhtiyacın Nedir?</label>
              <div
                onClick={() => setIsServiceOpen(!isServiceOpen)}
                className="w-full text-sm font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer"
              >
                <span>{selectedService?.title || 'Hizmet Seçin'}</span>
                <ChevronDown size={16} className={`transition-transform ${isServiceOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Mobile Service Dropdown */}
              <AnimatePresence>
                {isServiceOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-64 overflow-y-auto"
                  >
                    {SERVICES.map((service) => {
                      const ServiceIcon = service.icon;
                      return (
                        <div
                          key={service.id}
                          onClick={() => handleSelectService(service.id)}
                          className={`px-3 py-2 hover:bg-orange-50 cursor-pointer flex items-center gap-2 ${service.id === selectedServiceId ? 'bg-orange-50' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${service.id === selectedServiceId ? 'bg-brand-orange text-white' : 'bg-orange-50 text-brand-orange'}`}>
                            <ServiceIcon size={16} />
                          </div>
                          <div className="flex-1 text-sm font-semibold">{service.title}</div>
                          {service.id === selectedServiceId && (
                            <Check size={14} className="text-brand-orange" />
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Button */}
            <button 
              ref={searchButtonRef}
              onClick={handleSearchClick}
              disabled={!selectedCity || !selectedDistrict}
              className="w-full bg-brand-orange hover:bg-brand-lightOrange disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-orange-100"
            >
              Hemen Bul
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 lg:px-24 xl:px-32 py-8">
        
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
           <div>
              <div className="text-sm text-gray-400 mb-1">
                 {initialCity} bölgesinde
              </div>
              <h1 className="text-xl font-bold text-brand-dark">
                 {displayProviders.length} hizmet veren mevcut
              </h1>
              {/* Partner type breakdown */}
              {availablePartners.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {availablePartners.filter(p => p.matchType === 'service_area').length > 0 && (
                    <span className="text-xs px-2 py-1 bg-orange-50 text-brand-orange rounded-full font-medium">
                      {availablePartners.filter(p => p.matchType === 'service_area').length} bölge partneri
                    </span>
                  )}
                  {availablePartners.filter(p => p.matchType === 'return_route').length > 0 && (
                    <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-medium">
                      {availablePartners.filter(p => p.matchType === 'return_route').length} boş dönüş aracı
                    </span>
                  )}
                </div>
              )}
           </div>
           
           {/* 🆕 Distance/ETA Info & Sorting */}
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
             {/* Location Status Badge */}
             {userCoordinates ? (
               <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                 <Compass size={16} className="text-green-500" />
                 <span className="text-xs font-medium text-green-700">
                   Konumunuz alındı - Mesafeler gösteriliyor
                 </span>
               </div>
             ) : locationPermissionDenied ? (
               <button 
                 onClick={handleUseCurrentLocation}
                 className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition-colors"
               >
                 <AlertCircle size={16} className="text-orange-500" />
                 <span className="text-xs font-medium text-orange-700">
                   Konum izni verilmedi - Tekrar dene
                 </span>
               </button>
             ) : (
               <button 
                 onClick={handleUseCurrentLocation}
                 disabled={isLoadingLocation}
                 className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
               >
                 {isLoadingLocation ? (
                   <Loader2 size={16} className="text-blue-500 animate-spin" />
                 ) : (
                   <Navigation size={16} className="text-blue-500" />
                 )}
                 <span className="text-xs font-medium text-blue-700">
                   {isLoadingLocation ? 'Konum alınıyor...' : 'Mesafeleri göster'}
                 </span>
               </button>
             )}
             
             {/* Sort by distance option */}
             {userCoordinates && availablePartners.some(p => p.distanceKm !== undefined) && (
               <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm">
                 <label className="text-xs font-medium text-gray-500">Sırala:</label>
                 <select 
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value)}
                   className="text-sm font-medium text-gray-700 bg-transparent border-0 focus:outline-none cursor-pointer"
                 >
                   <option value="distance">Mesafe (Yakından)</option>
                   <option value="default">Varsayılan</option>
                 </select>
               </div>
             )}
           </div>
        </div>
        
        {/* Distance Calculating Indicator */}
        {isCalculatingDistances && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
            <Loader2 size={18} className="text-blue-500 animate-spin" />
            <span className="text-sm text-blue-600 font-medium">Mesafeler hesaplanıyor...</span>
          </div>
        )}
           
        {/* Empty Route Toggle */}
        {availablePartners.some(p => p.matchType === 'return_route') && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm mb-6">
            <Route size={18} className="text-green-500" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEmptyRoutes}
                onChange={(e) => setShowEmptyRoutes(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${showEmptyRoutes ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${showEmptyRoutes ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Boş Dönüş Araçlarını Göster</span>
            </label>
          </div>
        )}

        {/* Loading Indicator for Partner Search - sadece sonraki aramalar için (ilk yükleme hariç) */}
        {isLoadingPartners && initialLoadComplete && !isInitialLoading && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-sm text-blue-600 font-medium">Bölgedeki partnerler aranıyor...</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar (Left) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-32">
             <Sidebar />
          </div>

          {/* Main Content (Right) */}
          <div className="col-span-1 lg:col-span-8 space-y-4">
            
            {displayProviders.length > 0 ? (
              displayProviders.map((provider, index) => (
                <ProviderCard 
                  key={provider.id} 
                  provider={provider as ExtendedProvider} 
                  index={index} 
                  onClick={(p) => navigate(`/hizmet/${p.id}`, { state: { provider: p } })} 
                />
              ))
            ) : (
              /* --- EMPTY STATE --- */
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-sm"
               >
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Search size={40} className="text-brand-orange" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Şu an müsait araç yok
                  </h2>
                  <p className="text-gray-500 max-w-md mb-8 leading-relaxed text-sm">
                  Aradığınız kriterlere uygun hizmet veren şu anda bulunamadı. Ancak talep oluşturarak tüm firmalara bildirim gönderebilirsiniz.
                  </p>

                  <button 
                     onClick={() => {
                       const customer = localStorage.getItem('yolmov_customer');
                       if (!customer) {
                         navigate('/giris-gerekli', { 
                           state: { 
                             message: 'Teklif talebi oluşturmak için üye girişi yapmanız gerekiyor.',
                             returnUrl: '/teklif'
                           } 
                         });
                         return;
                       }
                       navigate('/teklif');
                     }}
                     className="w-full md:w-auto px-8 py-4 bg-brand-orange text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-brand-lightOrange transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                  >
                     <ClipboardList size={20} /> Hemen Ücretsiz Teklif Al
                  </button>
               </motion.div>
            )}

          </div>
        </div>
      </div>

      {/* Animation Overlay - Hero ile tamamen aynı (hem isSearching hem isInitialLoading için) */}
      {(isSearching || isInitialLoading) && buttonRect && (
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
            ease: [0.645, 0.045, 0.355, 1.000]
          }}
          className="flex flex-col items-center justify-center overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-col items-center text-white p-6 text-center w-full max-w-lg"
          >
            {/* Brand Logo */}
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
    </div>
  );
};

export default ListingPage;
