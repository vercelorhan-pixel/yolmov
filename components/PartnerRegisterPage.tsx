
import React, { useState } from 'react';
import { 
   User, Briefcase, MapPin, Phone, Mail, Lock,
   CheckCircle2, ArrowRight, Truck, Wrench, 
   BatteryCharging, Disc, ShieldCheck, Zap, TrendingUp, Loader
} from 'lucide-react';
import { CITIES_WITH_DISTRICTS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { validateEmail, validatePhone, validateTCOrVKN } from '../services/validation';
import { compressImage } from '../utils/imageCompression';
import { SuccessToast, ErrorToast } from './shared/UIComponents';
import { sendPartnerSubmissionEmail } from '../services/email';

const SECTORS = [
  { id: 'tow', label: 'Oto Çekici', icon: Truck },
  { id: 'tire', label: 'Lastikçi', icon: Disc },
  { id: 'repair', label: 'Oto Tamir', icon: Wrench },
  { id: 'battery', label: 'Akü Servisi', icon: BatteryCharging },
];

const BENEFITS = [
  { title: 'Yüksek Kazanç', desc: 'Boş dönüşlerinizi değerlendirin, gelirinizi artırın.', icon: TrendingUp },
  { title: 'Hızlı Ödeme', desc: 'Tamamlanan işlerin ödemesini her hafta hesabınıza alın.', icon: Zap },
  { title: '7/24 Destek', desc: 'Operasyon ekibimiz her an yanınızda.', icon: Phone },
  { title: 'Güvenilir Ağ', desc: 'Kurumsal ve doğrulanmış müşteri portföyü.', icon: ShieldCheck },
];

const PartnerRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    taxNumber: '',
    sector: '',
    city: '',
    district: '',
    phone: '',
    email: '',
    vehicleCount: '',
    vehicleTypes: '',
      password: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
   const [successMessage, setSuccessMessage] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{
    commercialRegistry?: string;
    vehicleLicense?: string;
  }>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim()) errors.firstName = 'Ad gereklidir';
    if (!formData.lastName.trim()) errors.lastName = 'Soyad gereklidir';
    if (!formData.companyName.trim()) errors.companyName = 'Şirket adı gereklidir';
    if (!formData.sector) errors.sector = 'Hizmet alanı seçiniz';
    if (!formData.city) errors.city = 'Şehir seçiniz';
    if (!formData.district) errors.district = 'İlçe seçiniz';

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'E-posta gereklidir';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Telefon gereklidir';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Geçerli bir telefon numarası giriniz (örn: 0532 123 45 67)';
    }

    // Tax number or TC validation (10 or 11 digits)
         // Password validation
         if (!formData.password.trim()) {
            errors.password = 'Şifre gereklidir';
         } else if (formData.password.length < 6) {
            errors.password = 'Şifre en az 6 karakter olmalıdır';
         }
    if (!formData.taxNumber.trim()) {
      errors.taxNumber = 'TC Kimlik No veya Vergi Kimlik No gereklidir';
    } else {
      const validation = validateTCOrVKN(formData.taxNumber);
      if (!validation.isValid) {
        errors.taxNumber = validation.message;
      }
    }

    // Vehicle count validation
    if (!formData.vehicleCount.trim()) {
      errors.vehicleCount = 'Araç sayısı gereklidir';
    } else if (parseInt(formData.vehicleCount) < 1) {
      errors.vehicleCount = 'En az 1 araç olmalıdır';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const mapSectorToServiceTypes = (sector: string): string[] => {
    const mapping: Record<string, string[]> = {
      'tow': ['cekici'],
      'tire': ['lastik'],
      'repair': ['tamir'],
      'battery': ['aku'],
    };
    return mapping[sector] || ['cekici'];
  };

  const handleDocumentUpload = async (docType: 'commercialRegistry' | 'vehicleLicense', file: File) => {
    setUploadingDoc(docType);
    
    try {
      // 1. Compress image
      const result = await compressImage(file);
      const compressedFile = result.compressedFile;

      // 2. Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${docType}/${fileName}`; // Simplified path (no nested partner-documents)

      // 3. Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('partner-documents')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

         if (error) {
            console.error('🔴 Upload error:', error);
            setSubmissionError('Belge yükleme başarısız. Lütfen tekrar deneyin.');
            return;
         }

      // 4. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('partner-documents')
        .getPublicUrl(filePath);

      // 5. Save URL to state
      setUploadedDocs(prev => ({
        ...prev,
        [docType]: publicUrl
      }));

         setSuccessMessage(`Belge başarıyla yüklendi! (%${result.compressionRatio.toFixed(1)} sıkıştırma)`);
    } catch (err) {
      console.error('🔴 Document upload error:', err);
         setSubmissionError('Belge yükleme sırasında bir hata oluştu.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const triggerFileInput = (docType: 'commercialRegistry' | 'vehicleLicense') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleDocumentUpload(docType, file);
      }
    };
    input.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError('');

    if (!validateForm()) {
      setSubmissionError('Lütfen tüm zorunlu alanları doğru şekilde doldurunuz.');
      return;
    }

    setIsSubmitting(true);

      try {
         const result = await (await import('../services/supabaseApi')).default.auth.signUpPartner(
            formData.email.trim().toLowerCase(),
            formData.password,
            {
               first_name: formData.firstName.trim(),
               last_name: formData.lastName.trim(),
               company_name: formData.companyName.trim(),
               tax_number: formData.taxNumber.trim(),
               sector: formData.sector,
               city: formData.city,
               district: formData.district,
               phone: formData.phone.replace(/\s/g, ''),
               email: formData.email.trim().toLowerCase(),
               vehicle_count: parseInt(formData.vehicleCount),
               vehicle_types: formData.vehicleTypes.trim() || 'Genel hizmet aracı',
               service_types: mapSectorToServiceTypes(formData.sector),
               commercial_registry_url: uploadedDocs.commercialRegistry || null,
               vehicle_license_url: uploadedDocs.vehicleLicense || null,
            }
         );

         if (!result?.partner) {
        console.error('🔴 Supabase Error:', error);
        
        if (error.code === '23505') {
          // Unique constraint violation
          if (error.message.includes('email')) {
            setSubmissionError('Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.');
          } else if (error.message.includes('tax_number')) {
            setSubmissionError('Bu vergi numarası zaten kayıtlı.');
          } else {
            setSubmissionError('Bu bilgilerle kayıt zaten mevcut.');
          }
        } else {
          setSubmissionError('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
        }
        return;
      }

      console.log('✅ Partner başvurusu başarılı:', result?.partner);
         // Success toast
         setSuccessMessage('Kayıt tamamlandı! E-posta doğrulama linki gönderildi. Onay sonrası giriş yapabilirsiniz.');

         // Transactional email (best-effort; non-blocking)
         try {
            await sendPartnerSubmissionEmail(formData.email.trim().toLowerCase(), {
               firstName: formData.firstName.trim(),
               lastName: formData.lastName.trim(),
               companyName: formData.companyName.trim(),
               sector: formData.sector,
               city: formData.city,
               district: formData.district,
               phone: formData.phone.replace(/\s/g, ''),
               taxNumber: formData.taxNumber.trim(),
            });
         } catch (mailErr) {
            console.warn('✉️ E-posta bildirimi gönderilemedi:', mailErr);
         }
      
      // Clear form
      setFormData({
            firstName: '', lastName: '', companyName: '', taxNumber: '',
            sector: '', city: '', district: '', phone: '', email: '',
            vehicleCount: '', vehicleTypes: '', password: '',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      console.error('🔴 Unexpected error:', err);
      setSubmissionError('Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
         <AnimatePresence>
            {successMessage && (
               <SuccessToast message={successMessage} onClose={() => setSuccessMessage('')} />
            )}
            {submissionError && (
               <ErrorToast message={submissionError} onClose={() => setSubmissionError('')} />
            )}
         </AnimatePresence>
      
      {/* Hero Background Area */}
      <div className="bg-slate-900 h-[550px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
            <img 
               src="https://images.unsplash.com/photo-1615906655593-ad0386982a0f?q=80&w=2000&auto=format&fit=crop" 
               alt="Background" 
               className="w-full h-full object-cover"
            />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/60 to-gray-50"></div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10 pt-16 text-center">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
           >
              <span className="inline-block py-1 px-3 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-sm">
                 Partner Programı
              </span>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 leading-tight">
                 İşinizi Büyütmenin <br />
                 <span className="text-brand-orange">En Akıllı Yolu</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                 Yolmov iş ortağı olun, binlerce potansiyel müşteriye anında ulaşın. 
                 Komisyon yok, sürpriz yok, sadece kazanç var.
              </p>
           </motion.div>
        </div>
      </div>

      {/* Main Content - Floating Card Layout */}
      <div className="container mx-auto px-4 md:px-8 -mt-32 pb-20 relative z-20">
         <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden flex flex-col lg:flex-row">
            
            {/* LEFT: Form Section */}
            <div className="lg:w-7/12 p-8 md:p-12 lg:p-16">
               <div className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Başvuru Formu</h2>
                  <p className="text-slate-500 text-sm">Aşağıdaki bilgileri eksiksiz doldurarak aramıza katılın.</p>
               </div>

               <form className="space-y-8" onSubmit={handleSubmit}>
                  
                  {/* 1. Sektör Seçimi (Visual) */}
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Hizmet Verdiğiniz Sektör</label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SECTORS.map((sec) => (
                           <div 
                              key={sec.id}
                              onClick={() => handleInputChange('sector', sec.id)}
                              className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 group ${formData.sector === sec.id ? 'border-brand-orange bg-orange-50 text-brand-orange' : 'border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                           >
                              <sec.icon size={28} className={`mb-2 transition-colors ${formData.sector === sec.id ? 'text-brand-orange' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={1.5} />
                              <span className="text-xs font-bold">{sec.label}</span>
                           </div>
                        ))}
                     </div>
                     {formErrors.sector && (
                        <p className="text-red-500 text-xs font-medium mt-2">{formErrors.sector}</p>
                     )}
                  </div>

                  {/* 2. Kişisel Bilgiler */}
                  <div className="space-y-4">
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Yetkili Bilgileri</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <User size={18} className="text-slate-400" />
                              <input 
                                 type="text" 
                                 placeholder="Adınız" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.firstName}
                                 onChange={(e) => handleInputChange('firstName', e.target.value)}
                              />
                           </div>
                           {formErrors.firstName && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.firstName}</p>
                           )}
                        </div>
                        <div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <User size={18} className="text-slate-400" />
                              <input 
                                 type="text" 
                                 placeholder="Soyadınız" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.lastName}
                                 onChange={(e) => handleInputChange('lastName', e.target.value)}
                              />
                           </div>
                           {formErrors.lastName && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.lastName}</p>
                           )}
                        </div>
                        <div className="md:col-span-2">
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <Briefcase size={18} className="text-slate-400" />
                              <input 
                                 type="text" 
                                 placeholder="Firma / İşletme Adı" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.companyName}
                                 onChange={(e) => handleInputChange('companyName', e.target.value)}
                              />
                           </div>
                           {formErrors.companyName && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.companyName}</p>
                           )}
                        </div>
                        <div className="md:col-span-2">
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <Briefcase size={18} className="text-slate-400" />
                              <input 
                                 type="text" 
                                 placeholder="TC Kimlik No (11 hane) veya Vergi No (10 hane)" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.taxNumber}
                                 onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                                 maxLength={11}
                              />
                           </div>
                           {formErrors.taxNumber && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.taxNumber}</p>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* 3. İletişim ve Konum */}
                  <div className="space-y-4">
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">İletişim & Bölge</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <Phone size={18} className="text-slate-400" />
                              <input 
                                 type="tel" 
                                 placeholder="Cep Telefonu (5XX...)" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.phone}
                                 onChange={(e) => handleInputChange('phone', e.target.value)}
                              />
                           </div>
                           {formErrors.phone && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.phone}</p>
                           )}
                        </div>
                        <div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <Mail size={18} className="text-slate-400" />
                              <input 
                                 type="email" 
                                 placeholder="E-posta Adresi" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.email}
                                 onChange={(e) => handleInputChange('email', e.target.value)}
                              />
                           </div>
                           {formErrors.email && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.email}</p>
                           )}
                        </div>
                        <div className="md:col-span-2">
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <Lock size={18} className="text-slate-400" />
                              <input 
                                 type="password" 
                                 placeholder="Şifre (en az 6 karakter)" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.password}
                                 onChange={(e) => handleInputChange('password', e.target.value)}
                              />
                           </div>
                           {formErrors.password && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.password}</p>
                           )}
                        </div>
                        <div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <MapPin size={18} className="text-slate-400" />
                              <select 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 cursor-pointer"
                                 value={formData.city}
                                 onChange={(e) => handleInputChange('city', e.target.value)}
                              >
                                 <option value="">İl Seçiniz</option>
                                 {Object.keys(CITIES_WITH_DISTRICTS).map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                           </div>
                           {formErrors.city && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.city}</p>
                           )}
                        </div>
                        <div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <MapPin size={18} className="text-slate-400" />
                              <select 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800"
                                 value={formData.district}
                                 onChange={(e) => handleInputChange('district', e.target.value)}
                                 disabled={!formData.city}
                              >
                                 <option value="" className="text-slate-400">İlçe Seçiniz</option>
                                 {formData.city && CITIES_WITH_DISTRICTS[formData.city].map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                           </div>
                           {formErrors.district && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.district}</p>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* 4. Araç & Ekipman Bilgileri */}
                  <div className="space-y-4">
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Araç & Ekipman</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <Truck size={18} className="text-slate-400" />
                              <input 
                                 type="number" 
                                 placeholder="Araç Sayısı" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.vehicleCount}
                                 onChange={(e) => handleInputChange('vehicleCount', e.target.value)}
                              />
                           </div>
                           {formErrors.vehicleCount && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.vehicleCount}</p>
                           )}
                        </div>
                        <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                           <Wrench size={18} className="text-slate-400" />
                           <input 
                              type="text" 
                              placeholder="Araç Tipleri (örn: Çekici, Tamirat)" 
                              className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                              value={formData.vehicleTypes}
                              onChange={(e) => handleInputChange('vehicleTypes', e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs text-blue-700 font-medium mb-2">📄 Belge Yükleme (Opsiyonel)</p>
                        <div className="flex flex-col gap-2">
                           <button 
                              type="button"
                              onClick={() => triggerFileInput('commercialRegistry')}
                              disabled={uploadingDoc === 'commercialRegistry'}
                              className="px-4 py-2 bg-white border border-blue-300 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                           >
                              {uploadingDoc === 'commercialRegistry' ? (
                                <>
                                  <Loader size={14} className="animate-spin" />
                                  Yükleniyor...
                                </>
                              ) : uploadedDocs.commercialRegistry ? (
                                <>
                                  <CheckCircle2 size={14} className="text-green-600" />
                                  Ticari Sicil Gazetesi ✓
                                </>
                              ) : (
                                'Ticari Sicil Gazetesi Yükle'
                              )}
                           </button>
                           <button 
                              type="button"
                              onClick={() => triggerFileInput('vehicleLicense')}
                              disabled={uploadingDoc === 'vehicleLicense'}
                              className="px-4 py-2 bg-white border border-blue-300 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                           >
                              {uploadingDoc === 'vehicleLicense' ? (
                                <>
                                  <Loader size={14} className="animate-spin" />
                                  Yükleniyor...
                                </>
                              ) : uploadedDocs.vehicleLicense ? (
                                <>
                                  <CheckCircle2 size={14} className="text-green-600" />
                                  Araç Ruhsatı ✓
                                </>
                              ) : (
                                'Ruhsat Fotokopisi Yükle'
                              )}
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Submission Error Message */}
                  {submissionError && (
                     <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-700 text-sm font-medium">{submissionError}</p>
                     </div>
                  )}

                  {/* Submit Button */}
                  <button 
                     type="submit"
                     disabled={isSubmitting}
                     className={`w-full py-4 rounded-xl font-bold shadow-xl transition-all transform flex items-center justify-center gap-3 text-lg ${
                        isSubmitting 
                           ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                           : 'bg-brand-orange hover:bg-brand-lightOrange text-white shadow-orange-200 hover:-translate-y-1 active:scale-95'
                     }`}
                  >
                     {isSubmitting ? (
                        <>
                           <Loader size={22} className="animate-spin" />
                           Başvuru Gönderiliyor...
                        </>
                     ) : (
                        <>
                           Başvuruyu Tamamla <ArrowRight size={22} />
                        </>
                     )}
                  </button>
                  <p className="text-center text-xs text-slate-400">
                     Başvurarak <a href="#" className="underline hover:text-slate-600">İş Ortaklığı Sözleşmesi</a>'ni kabul etmiş olursunuz.
                  </p>

               </form>
            </div>

            {/* RIGHT: Benefits Section */}
            <div className="lg:w-5/12 bg-slate-50 p-8 md:p-12 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col justify-center">
               <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Neden Yolmov?</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                     Binlerce mutlu iş ortağımız arasına katılarak işletmenizi bir sonraki seviyeye taşıyın.
                  </p>
               </div>

               <div className="space-y-6">
                  {BENEFITS.map((benefit, idx) => (
                     <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
                           <benefit.icon size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                           <h4 className="text-sm font-bold text-slate-900 mb-1">{benefit.title}</h4>
                           <p className="text-xs text-slate-500 leading-relaxed">{benefit.desc}</p>
                        </div>
                     </div>
                  ))}
               </div>

               <div className="mt-10 bg-slate-900 rounded-2xl p-6 text-center relative overflow-hidden">
                  <div className="relative z-10">
                     <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Partner Başvurusu</p>
                     <p className="text-lg font-bold text-white">Platform üzerinden başvurunuzu tamamlayın</p>
                  </div>
                  {/* Decor */}
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
};

export default PartnerRegisterPage;
