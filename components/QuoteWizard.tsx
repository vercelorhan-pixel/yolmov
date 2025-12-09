
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Truck, 
  Bus, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  User, 
  Phone, 
  ShieldCheck,
  Info,
  CheckCircle2,
  Navigation,
  Upload,
  X,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { CITIES_WITH_DISTRICTS } from '../constants';
import { compressImage, isImageFile } from '../utils/imageCompression';
import { supabaseApi } from '../services/supabaseApi';
import Toast from './shared/Toast';
import { useToast } from '../utils/useToast';

const STEPS = [
  { id: 1, title: 'Araç Bilgileri' },
  { id: 2, title: 'Konum Bilgisi' },
  { id: 3, title: 'Ek Bilgiler' },
  { id: 4, title: 'Özet & İletişim' },
  { id: 5, title: 'Onay' }
];

const VEHICLE_TYPES = [
  { id: 'sedan', label: 'Otomobil', icon: Car },
  { id: 'suv', label: 'Arazi, SUV', icon: Car },
  { id: 'minibus', label: 'Minibüs', icon: Bus },
  { id: 'truck', label: 'Kamyon', icon: Truck },
];

const QuoteWizard: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const customer = React.useMemo(() => {
    const saved = localStorage.getItem('yolmov_customer');
    return saved ? JSON.parse(saved) : null;
  }, []);
  React.useEffect(() => {
    // Oturum tokenını Supabase SDK'ya aktarıp RLS hatalarını önle
    (async () => {
      try {
        await supabaseApi.auth.getSession();
        // Ayrıca storage ve requests çağrılarında ensureAuthSession zaten var
      } catch (e) {
        console.warn('Auth session prepare failed', e);
      }
    })();
  }, []);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationLoadingText, setLocationLoadingText] = useState('Konum alınıyor...');
  
  // Form Data State
  const [formData, setFormData] = useState({
    vehicleType: '',
    vehicleCategory: 'binek', // binek, ticari, kamyonet, tır
    make: '',
    model: '',
    year: '',
    serviceType: 'towing', // towing (Taşınacak - Çekici)
    fromCity: '',
    fromDistrict: '',
    fromAddress: '',
    fromCoordinates: { lat: 0, lon: 0 }, // GPS koordinatları
    toCity: '',
    toDistrict: '',
    toAddress: '',
    toCoordinates: { lat: 0, lon: 0 },
    condition: 'broken', // running (Çalışır) or broken (Arızalı/Kazalı)
    timing: 'now', // now, week, later
    hasLoad: false, // Yük var mı?
    loadDescription: '', // Yük açıklaması
    note: '',
    damagePhotos: [] as File[], // Hasar fotoğrafları (ZORUNLU)
    useRegisteredContact: true,
    firstName: '',
    lastName: '',
    phone: '',
    createdAt: new Date().toISOString(), // Oluşturma tarihi
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 saat geçerli
  });

  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  const validateStep = (step: number) => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    if (step === 1) {
      if (!formData.vehicleType) newErrors.vehicleType = true;
      if (!formData.make) newErrors.make = true;
      if (!formData.model) newErrors.model = true;
      if (!formData.year) newErrors.year = true;
    }

    if (step === 2) {
      if (!formData.fromCity) newErrors.fromCity = true;
      if (!formData.fromDistrict) newErrors.fromDistrict = true;
      // For towing service, destination is required
      if (formData.serviceType === 'towing') {
        if (!formData.toCity) newErrors.toCity = true;
        if (!formData.toDistrict) newErrors.toDistrict = true;
      }
    }

    if (step === 3) {
      // Fotoğraf zorunlu
      if (formData.damagePhotos.length === 0) {
        newErrors.damagePhotos = true;
      }
    }

    if (step === 4) {
      // Only validate manual contact if not using registered contact
      if (!formData.useRegisteredContact) {
        if (!formData.firstName) newErrors.firstName = true;
        if (!formData.lastName) newErrors.lastName = true;
        if (!formData.phone) newErrors.phone = true;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    } else {
      setErrors({});
    }

    return isValid;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4) {
        // Üye girişi kontrolü - ZORUNLU
        if (!customer || !customer.id) {
          navigate('/giris-gerekli', { 
            state: { 
              message: 'Teklif talebi oluşturmak için üye girişi yapmanız gerekiyor.',
              returnUrl: '/teklif'
            } 
          });
          return;
        }
        
        // Submit to Supabase
        setIsSubmitting(true);
        
        try {
          // Get customer info - artık kesinlikle var
          const customerName = formData.useRegisteredContact
            ? `${customer.firstName} ${customer.lastName}`
            : `${formData.firstName} ${formData.lastName}`;
          
          const customerPhone = formData.useRegisteredContact
            ? customer.phone
            : formData.phone;
          
          // customer_id artık kesinlikle var (giriş yapmış)
          const customerId = customer.id;
          
          // Build service type from formData
          const serviceTypeMap: Record<string, string> = {
            'towing': 'cekici',
            'battery': 'aku',
            'fuel': 'yakit',
            'tire': 'lastik',
            'locksmith': 'anahtar'
          };
          
          // Build from location
          const fromLocation = [
            formData.fromAddress,
            formData.fromDistrict,
            formData.fromCity
          ].filter(Boolean).join(', ');
          
          // Build to location (if exists)
          const toLocation = formData.toCity ? [
            formData.toAddress,
            formData.toDistrict,
            formData.toCity
          ].filter(Boolean).join(', ') : null;
          
          // Vehicle info
          const vehicleInfo = `${formData.make} ${formData.model} ${formData.year}`;
          
          // Build description
          const description = [
            `${formData.make} ${formData.model} (${formData.year})`,
            formData.condition === 'broken' ? 'Arızalı/Kazalı' : 'Çalışır durumda',
            formData.hasLoad ? `Yük var: ${formData.loadDescription}` : '',
            formData.note || ''
          ].filter(Boolean).join(' - ');
          
          // Upload photos to Supabase Storage
          let photoUrls: string[] = [];
          if (formData.damagePhotos.length > 0) {
            console.log('📸 Uploading photos to Supabase Storage...');
            
            for (const photo of formData.damagePhotos) {
              try {
                const photoUrl = await supabaseApi.storage.uploadCustomerPhoto(photo, customerId);
                photoUrls.push(photoUrl);
              } catch (error: any) {
                console.error('Photo upload failed:', error);
                // RLS hatası detaylı loglama
                if (error?.message?.includes('row-level security')) {
                  console.error('⚠️ RLS Policy Error: Storage bucket policies may be missing. Check Supabase Dashboard.');
                }
                // Continue with other photos - fotoğraf zorunlu değil
              }
            }
            
            console.log(`✅ ${photoUrls.length} photos uploaded successfully`);
          }
          
          // Create request in Supabase
          const newRequest = await supabaseApi.requests.create({
            customerId: customerId,
            customerName: customerName,
            customerPhone: customerPhone,
            serviceType: serviceTypeMap[formData.serviceType] || 'cekici',
            description,
            fromLocation: fromLocation,
            toLocation: toLocation,
            vehicleInfo: vehicleInfo,
            vehicleCondition: formData.condition as 'running' | 'broken',
            hasLoad: formData.hasLoad,
            loadDescription: formData.loadDescription || undefined,
            timing: formData.timing as 'now' | 'week' | 'later',
            damagePhotoUrls: photoUrls.length > 0 ? photoUrls : undefined,
            fromCoordinates: formData.fromCoordinates.lat !== 0 
              ? `${formData.fromCoordinates.lat},${formData.fromCoordinates.lon}` 
              : undefined,
            toCoordinates: formData.toCoordinates.lat !== 0 
              ? `${formData.toCoordinates.lat},${formData.toCoordinates.lon}` 
              : undefined,
            status: 'open',
          });
          
          console.log('✅ Teklif talebi oluşturuldu:', newRequest);
          
          // Save request ID for tracking
          localStorage.setItem('yolmov_last_request_id', newRequest.id);
          
          setIsSubmitting(false);
          setCurrentStep(5);
        } catch (error: any) {
          console.error('❌ Talep oluşturma hatası:', error);
          setIsSubmitting(false);
          
          // Hata mesajını kullanıcıya göster
          let errorMessage = 'Talep oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
          
          if (error?.message?.includes('customer_id')) {
            errorMessage = '🔒 Üye girişi gerekli. Lütfen giriş yapın.';
            setTimeout(() => navigate('/giris/musteri'), 2000);
          } else if (error?.message?.includes('from_coordinates')) {
            errorMessage = 'Konum bilgileri kaydedilemedi. Lütfen konum seçiminizi kontrol edin.';
          } else if (error?.message?.includes('row-level security')) {
            errorMessage = 'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.';
            setTimeout(() => navigate('/giris/musteri'), 2000);
          }
          
          alert(errorMessage);
        }
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const currentPhotos = formData.damagePhotos;
    
    // Maximum 5 fotoğraf
    if (currentPhotos.length + newFiles.length > 5) {
      alert('En fazla 5 fotoğraf yükleyebilirsiniz');
      return;
    }

    try {
      setIsCompressingPhoto(true);

      // Tüm fotoğrafları sıkıştır
      const compressedFiles: File[] = [];
      const newPreviewUrls: string[] = [];

      for (const file of newFiles) {
        if (!isImageFile(file)) {
          alert('Lütfen sadece görsel dosyası yükleyin (JPG, PNG, vb.)');
          continue;
        }

        // Her dosyayı sıkıştır
        const result = await compressImage(file);
        compressedFiles.push(result.compressedFile);
        newPreviewUrls.push(URL.createObjectURL(result.compressedFile));

        console.log(`Fotoğraf sıkıştırıldı: ${file.name}`, {
          original: result.originalSize,
          compressed: result.compressedSize,
          ratio: result.compressionRatio
        });
      }

      // Preview URL'leri ve dosyaları ekle
      setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls]);
      updateData('damagePhotos', [...currentPhotos, ...compressedFiles]);
      
      // Hata varsa kaldır
      if (errors.damagePhotos) {
        setErrors(prev => ({ ...prev, damagePhotos: false }));
      }

      showToast(
        `${compressedFiles.length} fotoğraf işleniyor...`,
        'processing',
        2000
      );
    } catch (error) {
      console.error('Photo compression error:', error);
      showToast('Fotoğraflar işlenirken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.damagePhotos.filter((_, i) => i !== index);
    const newPreviews = photoPreviewUrls.filter((_, i) => i !== index);
    
    // Memory leak önleme
    URL.revokeObjectURL(photoPreviewUrls[index]);
    
    setPhotoPreviewUrls(newPreviews);
    updateData('damagePhotos', newPhotos);
  };

  const updateData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum özelliğini desteklemiyor.');
      return;
    }

    console.log('🌍 Konum servisi isteniyor (QuoteWizard)...');
    setIsLoadingLocation(true);
    setLocationLoadingText('GPS konumunuz alınıyor...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('✅ Konum alındı:', position.coords);
        setLocationLoadingText('Adres bilgileri çözülüyor...');
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding with Nominatim (free, no API key needed)
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
          
          // Extract city and district from address
          const address = data.address || {};
          let city = address.province || address.state || address.city || address.town;
          let district = address.county || address.district || address.suburb || address.neighbourhood;
          
          console.log('🏙️ Tespit edilen şehir:', city, '/ İlçe:', district);
          
          // Match city with our CITIES_WITH_DISTRICTS
          const matchedCity = Object.keys(CITIES_WITH_DISTRICTS).find(
            c => c.toLowerCase() === city?.toLowerCase()
          );
          
          if (matchedCity) {
            console.log('✅ Şehir eşleşti:', matchedCity);
            updateData('fromCity', matchedCity);
            updateData('fromCoordinates', { lat: latitude, lon: longitude });
            
            // Try to match district
            const districts = CITIES_WITH_DISTRICTS[matchedCity];
            const matchedDistrict = districts.find(
              d => d.toLowerCase().includes(district?.toLowerCase()) || 
                   district?.toLowerCase().includes(d.toLowerCase())
            );
            
            if (matchedDistrict) {
              console.log('✅ İlçe eşleşti:', matchedDistrict);
              setLocationLoadingText('Konum başarıyla belirlendi!');
              setTimeout(() => {
                updateData('fromDistrict', matchedDistrict);
                setIsLoadingLocation(false);
              }, 500);
            } else {
              console.warn('⚠️ İlçe eşleşmedi, manuel seçim gerekli');
              setIsLoadingLocation(false);
            }
          } else {
            console.warn('⚠️ Şehir sistemde bulunamadı:', city);
            setIsLoadingLocation(false);
          }
        } catch (error) {
          console.error('❌ Reverse geocoding error:', error);
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        let errorMessage = 'Konum erişimi reddedildi veya alınamadı.';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini açın.';
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
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Render Functions for Each Step
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Araç Tipi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {VEHICLE_TYPES.map((type) => (
            <div 
              key={type.id}
              onClick={() => updateData('vehicleType', type.id)}
              className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all relative ${
                formData.vehicleType === type.id 
                  ? 'border-brand-orange bg-orange-50 text-brand-orange' 
                  : errors.vehicleType 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-100 hover:border-gray-200 bg-white text-gray-500'
              }`}
            >
              <type.icon size={32} strokeWidth={1.5} />
              <span className="text-xs font-bold text-center">{type.label}</span>
              {formData.vehicleType === type.id && (
                <div className="absolute top-2 right-2 text-brand-orange">
                  <CheckCircle2 size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
        {errors.vehicleType && <p className="text-red-500 text-xs mt-1">Lütfen araç tipi seçiniz.</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Araç Kategorisi</label>
          <select 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none"
            value={formData.vehicleCategory}
            onChange={(e) => updateData('vehicleCategory', e.target.value)}
          >
            <option value="binek">Binek (Otomobil)</option>
            <option value="ticari">Ticari Araç</option>
            <option value="kamyonet">Kamyonet</option>
            <option value="tır">Tır / Çekici</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Araç Markası</label>
          <select 
            className={`w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none ${errors.make ? 'border-red-300' : 'border-gray-200'}`}
            value={formData.make}
            onChange={(e) => updateData('make', e.target.value)}
          >
            <option value="">Seçiniz</option>
            <option value="bmw">BMW</option>
            <option value="mercedes">Mercedes</option>
            <option value="audi">Audi</option>
            <option value="ford">Ford</option>
            <option value="toyota">Toyota</option>
            <option value="honda">Honda</option>
            <option value="volkswagen">Volkswagen</option>
            <option value="renault">Renault</option>
            <option value="fiat">Fiat</option>
          </select>
          {errors.make && <p className="text-red-500 text-xs mt-1">Marka seçimi zorunludur.</p>}
        </div>
        <div>
           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Araç Modeli</label>
           <input 
             type="text" 
             placeholder="Örn: 320i, Corolla"
             className={`w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none ${errors.model ? 'border-red-300' : 'border-gray-200'}`}
             value={formData.model}
             onChange={(e) => updateData('model', e.target.value)}
           />
           {errors.model && <p className="text-red-500 text-xs mt-1">Model bilgisi zorunludur.</p>}
        </div>
        <div>
           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Üretim Yılı</label>
           <select 
             className={`w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none ${errors.year ? 'border-red-300' : 'border-gray-200'}`}
             value={formData.year}
             onChange={(e) => updateData('year', e.target.value)}
           >
             <option value="">Seçiniz</option>
             {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
               <option key={year} value={year}>{year}</option>
             ))}
           </select>
           {errors.year && <p className="text-red-500 text-xs mt-1">Yıl seçimi zorunludur.</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
         <h3 className="text-lg font-bold text-gray-900 mb-4">Hizmet Tercihi</h3>
         <div className="flex bg-gray-100 p-1 rounded-xl w-full max-w-md mx-auto md:mx-0">
            <button
               onClick={() => updateData('serviceType', 'towing')}
               className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  formData.serviceType === 'towing' ? 'bg-white shadow-sm text-brand-orange' : 'text-gray-500'
               }`}
            >
               Taşınacak (Çekici)
            </button>
         </div>
      </div>

      <div className="space-y-6">
        {/* FROM LOCATION */}
        <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={18} className="text-brand-orange" />
              Nereden Alınacak?
            </h4>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLoadingLocation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Navigation size={16} className={isLoadingLocation ? 'animate-spin' : ''} />
              {isLoadingLocation ? 'Alınıyor...' : 'Mevcut Konumu Kullan'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">İl</label>
              <select 
                className={`w-full p-3 bg-white border rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none ${errors.fromCity ? 'border-red-300' : 'border-gray-200'}`}
                value={formData.fromCity}
                onChange={(e) => {
                  updateData('fromCity', e.target.value);
                  updateData('fromDistrict', '');
                }}
              >
                <option value="">İl Seçiniz</option>
                {Object.keys(CITIES_WITH_DISTRICTS).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.fromCity && <p className="text-red-500 text-xs mt-1">İl seçimi zorunludur</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">İlçe</label>
              <select 
                className={`w-full p-3 bg-white border rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none ${errors.fromDistrict ? 'border-red-300' : 'border-gray-200'}`}
                value={formData.fromDistrict}
                onChange={(e) => updateData('fromDistrict', e.target.value)}
                disabled={!formData.fromCity}
              >
                <option value="">İlçe Seçiniz</option>
                {formData.fromCity && CITIES_WITH_DISTRICTS[formData.fromCity].map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              {errors.fromDistrict && <p className="text-red-500 text-xs mt-1">İlçe seçimi zorunludur</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Detaylı Adres <span className="text-gray-400 normal-case">(İsteğe Bağlı)</span>
            </label>
            <textarea
              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none resize-none"
              rows={2}
              placeholder="Mahalle, sokak, bina no..."
              value={formData.fromAddress}
              onChange={(e) => updateData('fromAddress', e.target.value)}
            />
          </div>
        </div>

        {/* TO LOCATION */}
        {formData.serviceType === 'towing' && (
           <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-blue-50 p-6 rounded-2xl space-y-4"
           >
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Navigation size={18} className="text-blue-600" />
                Nereye Taşınacak?
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">İl</label>
                  <select 
                    className={`w-full p-3 bg-white border rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none ${errors.toCity ? 'border-red-300' : 'border-gray-200'}`}
                    value={formData.toCity}
                    onChange={(e) => {
                      updateData('toCity', e.target.value);
                      updateData('toDistrict', '');
                    }}
                  >
                    <option value="">İl Seçiniz</option>
                    {Object.keys(CITIES_WITH_DISTRICTS).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.toCity && <p className="text-red-500 text-xs mt-1">İl seçimi zorunludur</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">İlçe</label>
                  <select 
                    className={`w-full p-3 bg-white border rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none ${errors.toDistrict ? 'border-red-300' : 'border-gray-200'}`}
                    value={formData.toDistrict}
                    onChange={(e) => updateData('toDistrict', e.target.value)}
                    disabled={!formData.toCity}
                  >
                    <option value="">İlçe Seçiniz</option>
                    {formData.toCity && CITIES_WITH_DISTRICTS[formData.toCity].map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  {errors.toDistrict && <p className="text-red-500 text-xs mt-1">İlçe seçimi zorunludur</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Detaylı Adres <span className="text-gray-400 normal-case">(İsteğe Bağlı)</span>
                </label>
                <textarea
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none resize-none"
                  rows={2}
                  placeholder="Servis, oto galeri adresi..."
                  value={formData.toAddress}
                  onChange={(e) => updateData('toAddress', e.target.value)}
                />
              </div>
           </motion.div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Araç Fotoğrafları - ZORUNLU */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <ImageIcon size={20} className="text-brand-orange" />
          Araç Fotoğrafları <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">Hasarlı aracın fotoğraflarını yükleyin (En az 1, en fazla 5 fotoğraf - Max 5MB)</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Preview'lar */}
          {photoPreviewUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img 
                src={url} 
                alt={`Hasar ${index + 1}`}
                className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          
          {/* Upload Button */}
          {formData.damagePhotos.length < 5 && (
            <label className={`border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-all ${
              errors.damagePhotos ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-brand-orange hover:bg-orange-50'
            } ${isCompressingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isCompressingPhoto ? (
                <>
                  <Loader2 size={24} className="text-brand-orange animate-spin mb-2" />
                  <span className="text-xs font-medium text-brand-orange">İşleniyor...</span>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-xs font-medium text-gray-500">Fotoğraf Ekle</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoUpload}
                disabled={isCompressingPhoto}
                className="hidden"
              />
            </label>
          )}
        </div>
        {errors.damagePhotos && (
          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
            <AlertTriangle size={14} />
            En az 1 fotoğraf yüklemeniz zorunludur
          </p>
        )}
      </div>

      <div>
         <h3 className="text-lg font-bold text-gray-900 mb-4">Araç Durumu</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all ${formData.condition === 'running' ? 'border-brand-orange bg-orange-50 ring-1 ring-brand-orange' : 'border-gray-200 hover:border-gray-300'}`}>
               <input 
                  type="radio" 
                  name="condition" 
                  className="text-brand-orange focus:ring-brand-orange w-5 h-5"
                  checked={formData.condition === 'running'}
                  onChange={() => updateData('condition', 'running')} 
               />
               <span className="font-medium text-gray-700">Yürür / Çalışır Durumda</span>
            </label>
            <label className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all ${formData.condition === 'broken' ? 'border-brand-orange bg-orange-50 ring-1 ring-brand-orange' : 'border-gray-200 hover:border-gray-300'}`}>
               <input 
                  type="radio" 
                  name="condition" 
                  className="text-brand-orange focus:ring-brand-orange w-5 h-5"
                  checked={formData.condition === 'broken'}
                  onChange={() => updateData('condition', 'broken')} 
               />
               <span className="font-medium text-gray-700">Arızalı / Kazalı</span>
            </label>
         </div>
      </div>

      {/* Yük Durumu */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Yük Durumu</h3>
        <label className="flex items-center gap-3 mb-3">
          <input 
            type="checkbox"
            checked={formData.hasLoad}
            onChange={(e) => updateData('hasLoad', e.target.checked)}
            className="w-5 h-5 text-brand-orange focus:ring-brand-orange rounded"
          />
          <span className="text-gray-700 font-medium">Araçta yük var</span>
        </label>
        
        {formData.hasLoad && (
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Yük Açıklaması</label>
            <textarea 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none min-h-[80px]"
              placeholder="Yükün cinsini ve ağırlığını belirtin (Örn: İnşaat malzemesi, 500kg)"
              value={formData.loadDescription}
              onChange={(e) => updateData('loadDescription', e.target.value)}
            ></textarea>
          </div>
        )}
      </div>

      <div>
         <h3 className="text-lg font-bold text-gray-900 mb-4">Ne Zaman?</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['Hemen (Acil)', 'Bu Hafta', 'İleri Tarihli'].map((t, i) => {
               const val = i === 0 ? 'now' : i === 1 ? 'week' : 'later';
               return (
                  <button
                     key={val}
                     onClick={() => updateData('timing', val)}
                     className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                        formData.timing === val 
                           ? 'bg-brand-orange text-white border-brand-orange shadow-md' 
                           : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                     }`}
                  >
                     {t}
                  </button>
               );
            })}
         </div>
      </div>

      <div>
         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ek Açıklama</label>
         <textarea 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none min-h-[100px]"
            placeholder="Örn: Araç şarampole yuvarlandı, lastik patlak, anahtar yok, araç ticari amaçlı kullanılıyor vb."
            value={formData.note}
            onChange={(e) => updateData('note', e.target.value)}
         ></textarea>
         <p className="text-xs text-gray-500 mt-1">* Ticari araç ise ve yük varsa mutlaka belirtiniz</p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
       <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
          <h3 className="text-brand-orange font-bold mb-4 flex items-center gap-2">
             <Info size={18} /> Talep Özeti
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
             <div className="flex justify-between border-b border-orange-100 pb-2">
                <span className="text-gray-500">Talep Tarihi:</span>
                <span className="font-bold">{new Date(formData.createdAt).toLocaleString('tr-TR')}</span>
             </div>
             <div className="flex justify-between border-b border-orange-100 pb-2">
                <span className="text-gray-500">Geçerlilik:</span>
                <span className="font-bold">{new Date(formData.validUntil).toLocaleString('tr-TR')}</span>
             </div>
             <div className="flex justify-between border-b border-orange-100 pb-2">
                <span className="text-gray-500">Araç:</span>
                <span className="font-bold">{formData.make} {formData.model} ({formData.year})</span>
             </div>
             <div className="flex justify-between border-b border-orange-100 pb-2">
                <span className="text-gray-500">Kategori:</span>
                <span className="font-bold">
                  {formData.vehicleCategory === 'binek' ? 'Binek' : 
                   formData.vehicleCategory === 'ticari' ? 'Ticari' :
                   formData.vehicleCategory === 'kamyonet' ? 'Kamyonet' : 'Tır/Çekici'}
                </span>
             </div>
             <div className="flex justify-between border-b border-orange-100 pb-2">
                <span className="text-gray-500">Hizmet:</span>
                <span className="font-bold">Çekici Hizmeti</span>
             </div>
             <div className="flex justify-between border-b border-orange-100 pb-2">
                <span className="text-gray-500">Nereden:</span>
                <span className="font-bold text-right">
                   {formData.fromDistrict}, {formData.fromCity}
                   {formData.fromCoordinates.lat !== 0 && (
                     <span className="block text-xs text-gray-500">
                       📍 {formData.fromCoordinates.lat.toFixed(6)}, {formData.fromCoordinates.lon.toFixed(6)}
                     </span>
                   )}
                </span>
             </div>
             {formData.toCity && (
               <div className="flex justify-between border-b border-orange-100 pb-2">
                  <span className="text-gray-500">Nereye:</span>
                  <span className="font-bold text-right">
                     {formData.toDistrict}, {formData.toCity}
                  </span>
               </div>
             )}
             {formData.hasLoad && (
               <div className="flex justify-between border-b border-orange-100 pb-2">
                  <span className="text-gray-500">Yük:</span>
                  <span className="font-bold text-right">{formData.loadDescription || 'Var'}</span>
               </div>
             )}
             <div className="flex justify-between border-b border-orange-100 pb-2">
                <span className="text-gray-500">Fotoğraf:</span>
                <span className="font-bold">{formData.damagePhotos.length} adet</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-500">Zamanlama:</span>
                <span className="font-bold">
                   {formData.timing === 'now' ? 'Hemen (Acil)' : formData.timing === 'week' ? 'Bu Hafta' : 'İleri Tarihli'}
                </span>
             </div>
          </div>
       </div>

       <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">İletişim Bilgileri</h3>
          
          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useRegisteredContact}
                  onChange={(e) => {
                    updateData('useRegisteredContact', e.target.checked);
                    if (e.target.checked) {
                      // Clear manual contact fields when switching to registered
                      updateData('firstName', '');
                      updateData('lastName', '');
                      updateData('phone', '');
                    }
                  }}
                  className="w-5 h-5 text-brand-orange focus:ring-brand-orange rounded"
                />
                <div>
                  <p className="font-bold text-gray-900">Kayıtlı İletişim Bilgilerimi Kullan</p>
                  <p className="text-xs text-gray-600">Hesabınızdaki bilgiler kullanılacak</p>
                </div>
              </label>
              <ShieldCheck size={20} className="text-blue-600" />
            </div>
          </div>

          {!formData.useRegisteredContact && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <p className="text-sm text-gray-500 mb-4">Araç başındaki kişinin bilgilerini girin:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      className={`w-full p-3 pl-10 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none ${errors.firstName ? 'border-red-300' : 'border-gray-200'}`}
                      placeholder="Adınız"
                      value={formData.firstName}
                      onChange={(e) => updateData('firstName', e.target.value)}
                    />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">Ad zorunludur</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Soyad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      className={`w-full p-3 pl-10 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none ${errors.lastName ? 'border-red-300' : 'border-gray-200'}`}
                      placeholder="Soyadınız"
                      value={formData.lastName}
                      onChange={(e) => updateData('lastName', e.target.value)}
                    />
                  </div>
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">Soyad zorunludur</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Telefon</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel" 
                    className={`w-full p-3 pl-10 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none ${errors.phone ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="05XX XXX XX XX"
                    value={formData.phone}
                    onChange={(e) => updateData('phone', e.target.value)}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">Telefon numarası zorunludur</p>}
              </div>
            </motion.div>
          )}
       </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="text-center py-12 px-6">
      <motion.div 
         initial={{ scale: 0 }}
         animate={{ scale: 1 }}
         className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600"
      >
         <CheckCircle2 size={48} />
      </motion.div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">İşlem Başarılı!</h2>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
         Teklif talebiniz hizmet sağlayıcılara iletildi. Gelen teklifleri inceleyip size en uygun olanı seçebilirsiniz.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
        <button 
           onClick={() => customer ? navigate('/musteri/teklifler') : navigate('/giris/musteri')}
           className="flex-1 px-6 py-4 bg-brand-orange text-white rounded-xl font-bold hover:bg-brand-lightOrange transition-colors shadow-lg"
        >
           Tekliflerimi Gör
        </button>
        <button 
           onClick={() => navigate('/')}
           className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
           Ana Sayfa
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-white rounded-3xl shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden">
      {/* Header / Progress Bar */}
      <div className="bg-gray-50 border-b border-gray-200 p-6">
         {currentStep === 5 ? (
            <div className="text-center font-bold text-green-600 text-xl">İşlem Başarılı</div>
         ) : (
            <div className="flex items-center justify-between relative">
               {/* Progress Line */}
               <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
               <div 
                  className="absolute top-1/2 left-0 h-1 bg-brand-orange -z-10 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / (STEPS.length - 2)) * 100}%` }}
               ></div>

               {STEPS.slice(0, 4).map((step) => (
                  <div key={step.id} className="flex flex-col items-center gap-2 bg-gray-50 px-2">
                     <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                           step.id <= currentStep 
                              ? 'bg-brand-orange text-white shadow-lg shadow-orange-200' 
                              : 'bg-gray-200 text-gray-500'
                        }`}
                     >
                        {step.id < currentStep ? <Check size={14} /> : step.id}
                     </div>
                     <span className={`hidden md:block text-[10px] font-bold uppercase tracking-wider ${step.id <= currentStep ? 'text-brand-orange' : 'text-gray-400'}`}>
                        {step.title}
                     </span>
                  </div>
               ))}
            </div>
         )}
      </div>

      {/* Content Area */}
      <div className="p-6 md:p-10 min-h-[400px]">
         <AnimatePresence mode="wait">
            <motion.div
               key={currentStep}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3 }}
            >
               {currentStep === 1 && renderStep1()}
               {currentStep === 2 && renderStep2()}
               {currentStep === 3 && renderStep3()}
               {currentStep === 4 && renderStep4()}
               {currentStep === 5 && renderStep5()}
            </motion.div>
         </AnimatePresence>
      </div>

      {/* Footer Actions */}
      {currentStep < 5 && (
         <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <button 
               onClick={handleBack}
               disabled={currentStep === 1}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${
                  currentStep === 1 
                     ? 'text-gray-300 cursor-not-allowed' 
                     : 'text-gray-600 hover:bg-gray-200 bg-white border border-gray-200'
               }`}
            >
               <ChevronLeft size={18} /> Geri
            </button>

            <button 
              onClick={handleNext}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-70 ${
                customer && customer.id 
                 ? 'bg-brand-orange text-white shadow-orange-200 hover:bg-brand-lightOrange hover:-translate-y-0.5' 
                 : 'bg-gray-300 text-gray-700 cursor-pointer'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Gönderiliyor...' 
                : currentStep === 4 
                 ? (customer && customer.id ? 'Teklif Al' : 'Giriş Yap ve Devam Et') 
                 : 'Devam Et'}
              {!isSubmitting && <ChevronRight size={18} />}
            </button>
         </div>
      )}
      
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

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={hideToast}
        isVisible={toast.isVisible}
      />
    </div>
  );
};

export default QuoteWizard;
