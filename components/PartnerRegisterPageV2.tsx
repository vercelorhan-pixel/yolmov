import React, { useState } from 'react';
import { 
   User, Briefcase, MapPin, Phone, Mail, Lock,
   CheckCircle2, ArrowRight, Truck, Wrench, 
   BatteryCharging, Disc, ShieldCheck, Zap, TrendingUp, Loader, ArrowLeft
} from 'lucide-react';
import { CITIES_WITH_DISTRICTS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePhone } from '../services/validation';
import { ErrorToast } from './shared/UIComponents';
import { sendPartnerSubmissionEmail } from '../services/email';
import PartnerHeader from './PartnerHeader';

const SECTORS = [
  { id: 'tow', label: 'Oto Çekici', icon: Truck, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'tire', label: 'Lastikçi', icon: Disc, gradient: 'from-purple-500 to-pink-500' },
  { id: 'repair', label: 'Oto Tamir', icon: Wrench, gradient: 'from-orange-500 to-red-500' },
  { id: 'battery', label: 'Akü Servisi', icon: BatteryCharging, gradient: 'from-green-500 to-emerald-500' },
];

const BENEFITS = [
  { title: 'Yüksek Kazanç', desc: 'Boş dönüşlerinizi değerlendirin, gelirinizi artırın.', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  { title: 'Hızlı Ödeme', desc: 'Tamamlanan işlerin ödemesini her hafta hesabınıza alın.', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { title: '7/24 Destek', desc: 'Operasyon ekibimiz her an yanınızda.', icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'Güvenilir Ağ', desc: 'Kurumsal ve doğrulanmış müşteri portföyü.', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
];

type Step = 'sector' | 'personal' | 'location' | 'submitting';

const PartnerRegisterPageV2: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('sector');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    sector: '',
    city: '',
    district: '',
    phone: '',
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: Step): boolean => {
    const errors: Record<string, string> = {};

    if (step === 'sector') {
      if (!formData.sector) errors.sector = 'Hizmet alanı seçiniz';
    } else if (step === 'personal') {
      if (!formData.firstName.trim()) errors.firstName = 'Ad gereklidir';
      if (!formData.lastName.trim()) errors.lastName = 'Soyad gereklidir';
      
      if (!formData.phone.trim()) {
        errors.phone = 'Telefon gereklidir';
      } else if (!validatePhone(formData.phone)) {
        errors.phone = 'Geçerli bir telefon numarası giriniz';
      }

      if (formData.email.trim() && !validateEmail(formData.email)) {
        errors.email = 'Geçerli bir e-posta adresi giriniz';
      }

      if (!formData.password.trim()) {
        errors.password = 'Şifre gereklidir';
      } else if (formData.password.length < 6) {
        errors.password = 'Şifre en az 6 karakter olmalıdır';
      }
    } else if (step === 'location') {
      if (!formData.city) errors.city = 'Şehir seçiniz';
      if (!formData.district) errors.district = 'İlçe seçiniz';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep === 'sector') {
      setCurrentStep('personal');
    } else if (currentStep === 'personal') {
      setCurrentStep('location');
    } else if (currentStep === 'location') {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 'personal') {
      setCurrentStep('sector');
    } else if (currentStep === 'location') {
      setCurrentStep('personal');
    }
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

  const handleSubmit = async () => {
    if (!validateStep('location')) {
      return;
    }

    setIsSubmitting(true);
    setCurrentStep('submitting');

    try {
      const emailForAuth = formData.email.trim() || `${formData.phone.replace(/\D/g, '')}@yolmov-temp.local`;
      
      const result = await (await import('../services/supabaseApi')).default.auth.signUpPartner(
        emailForAuth.toLowerCase(),
        formData.password,
        {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          company_name: formData.companyName.trim() || `${formData.firstName} ${formData.lastName}`.trim(),
          sector: formData.sector,
          city: formData.city,
          district: formData.district,
          phone: formData.phone.replace(/\s/g, ''),
          email: emailForAuth.toLowerCase(),
          service_types: mapSectorToServiceTypes(formData.sector),
        }
      );

      if (!result?.partner) {
        setSubmissionError('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
        setCurrentStep('location');
        return;
      }

      // Success - redirect to success page
      navigate('/partner-kayit-basarili', {
        state: {
          credentials: {
            email: emailForAuth.toLowerCase(),
            password: formData.password,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            companyName: formData.companyName.trim(),
            phone: formData.phone
          }
        }
      });

      // Best-effort email notification
      if (formData.email.trim()) {
        try {
          await sendPartnerSubmissionEmail(emailForAuth.toLowerCase(), {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            companyName: formData.companyName.trim() || `${formData.firstName} ${formData.lastName}`,
            sector: formData.sector,
            city: formData.city,
            district: formData.district,
            phone: formData.phone.replace(/\s/g, ''),
            taxNumber: '',
          });
        } catch (mailErr) {
          console.warn('✉️ E-posta bildirimi gönderilemedi:', mailErr);
        }
      }

    } catch (err: any) {
      console.error('🔴 Unexpected error:', err);
      
      if (err.message?.includes('already registered') || err.message?.includes('email')) {
        setSubmissionError('Bu telefon/e-posta ile kayıt zaten mevcut. Lütfen giriş yapın.');
      } else {
        setSubmissionError('Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
      }
      setCurrentStep('location');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepNumber = () => {
    if (currentStep === 'sector') return 1;
    if (currentStep === 'personal') return 2;
    if (currentStep === 'location') return 3;
    return 3;
  };

  const getProgressPercentage = () => {
    if (currentStep === 'sector') return 33;
    if (currentStep === 'personal') return 66;
    return 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <AnimatePresence>
        {submissionError && (
          <ErrorToast message={submissionError} onClose={() => setSubmissionError('')} />
        )}
      </AnimatePresence>

      {/* Partner Header */}
      <PartnerHeader showBackButton={currentStep === 'sector'} />

      {/* Hero Section - Compact & Modern */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615906655593-ad0386982a0f?q=80&w=2000')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-900" />
        
        <div className="container mx-auto px-6 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Partner Ol,
              <br />
              <span className="bg-gradient-to-r from-brand-orange to-orange-400 bg-clip-text text-transparent">
                Kazanmaya Başla
              </span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl">
              3 adımda kayıt ol, admin onayından sonra hemen iş almaya başla.
              <br />
              <strong className="text-white">Komisyon yok, aidat yok</strong> — sadece kazanç var.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            
            {/* LEFT: Form Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                
                {/* Progress Bar */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-600">
                      Adım {getStepNumber()} / 3
                    </span>
                    <span className="text-sm font-semibold text-brand-orange">
                      {getProgressPercentage()}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage()}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-brand-orange to-orange-400"
                    />
                  </div>
                </div>

                {/* Form Content */}
                <div className="p-8 md:p-12">
                  <AnimatePresence mode="wait">
                    
                    {/* STEP 1: Sector Selection */}
                    {currentStep === 'sector' && (
                      <motion.div
                        key="sector"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                      >
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                            Hangi hizmeti veriyorsunuz?
                          </h2>
                          <p className="text-slate-600">
                            Size uygun hizmet alanını seçin
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {SECTORS.map((sec) => (
                            <motion.div
                              key={sec.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleInputChange('sector', sec.id)}
                              className={`cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                                formData.sector === sec.id
                                  ? 'border-brand-orange shadow-lg shadow-orange-200/50'
                                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                              }`}
                            >
                              <div className="p-6 space-y-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${sec.gradient} flex items-center justify-center shadow-lg`}>
                                  <sec.icon size={28} className="text-white" strokeWidth={2} />
                                </div>
                                <h3 className="font-bold text-slate-900">{sec.label}</h3>
                              </div>
                              {formData.sector === sec.id && (
                                <div className="absolute top-3 right-3">
                                  <CheckCircle2 size={24} className="text-brand-orange" />
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                        
                        {formErrors.sector && (
                          <p className="text-red-500 text-sm font-medium">{formErrors.sector}</p>
                        )}
                      </motion.div>
                    )}

                    {/* STEP 2: Personal Info */}
                    {currentStep === 'personal' && (
                      <motion.div
                        key="personal"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                      >
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                            Sizi tanıyalım
                          </h2>
                          <p className="text-slate-600">
                            Kişisel bilgilerinizi girin
                          </p>
                        </div>

                        <div className="space-y-6">
                          {/* Name Fields */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Ad *</label>
                              <div className="relative">
                                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Adınız"
                                  value={formData.firstName}
                                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all"
                                />
                              </div>
                              {formErrors.firstName && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Soyad *</label>
                              <div className="relative">
                                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Soyadınız"
                                  value={formData.lastName}
                                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all"
                                />
                              </div>
                              {formErrors.lastName && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                              )}
                            </div>
                          </div>

                          {/* Company Name */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Firma Adı <span className="text-slate-400">(Opsiyonel)</span>
                            </label>
                            <div className="relative">
                              <Briefcase size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Firma / İşletme adı"
                                value={formData.companyName}
                                onChange={(e) => handleInputChange('companyName', e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all"
                              />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">💡 Bireysel çalışıyorsanız boş bırakabilirsiniz</p>
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Telefon *</label>
                            <div className="relative">
                              <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="tel"
                                placeholder="0532 123 45 67"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                inputMode="numeric"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all"
                              />
                            </div>
                            {formErrors.phone && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                            )}
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              E-posta <span className="text-slate-400">(Opsiyonel)</span>
                            </label>
                            <div className="relative">
                              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="email"
                                placeholder="ornek@email.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all"
                              />
                            </div>
                            {formErrors.email && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">💡 E-posta yoksa sadece telefonla kayıt olabilirsiniz</p>
                          </div>

                          {/* Password */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Şifre *</label>
                            <div className="relative">
                              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="password"
                                placeholder="En az 6 karakter"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all"
                              />
                            </div>
                            {formErrors.password && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Location */}
                    {currentStep === 'location' && (
                      <motion.div
                        key="location"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                      >
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                            Nerede hizmet veriyorsunuz?
                          </h2>
                          <p className="text-slate-600">
                            Hizmet vereceğiniz bölgeyi belirleyin
                          </p>
                        </div>

                        <div className="space-y-6">
                          {/* City */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">İl *</label>
                            <div className="relative">
                              <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <select
                                value={formData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                              >
                                <option value="">İl Seçiniz</option>
                                {Object.keys(CITIES_WITH_DISTRICTS).map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            {formErrors.city && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                            )}
                          </div>

                          {/* District */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">İlçe *</label>
                            <div className="relative">
                              <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <select
                                value={formData.district}
                                onChange={(e) => handleInputChange('district', e.target.value)}
                                disabled={!formData.city}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-orange focus:bg-white outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="">İlçe Seçiniz</option>
                                {formData.city && CITIES_WITH_DISTRICTS[formData.city].map(d => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            </div>
                            {formErrors.district && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.district}</p>
                            )}
                          </div>

                          {/* Info Box */}
                          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-blue-600" />
                              Kayıt Sonrası
                            </h4>
                            <ul className="text-sm text-blue-700 space-y-1.5">
                              <li>✓ Komisyon yok, aidat yok</li>
                              <li>✓ Belge yükleme işlemini daha sonra yapabilirsiniz</li>
                              <li>✓ Admin onayı sonrası hemen iş almaya başlayabilirsiniz</li>
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* SUBMITTING STATE */}
                    {currentStep === 'submitting' && (
                      <motion.div
                        key="submitting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-12 text-center"
                      >
                        <Loader size={48} className="mx-auto text-brand-orange animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Kaydınız oluşturuluyor...</h3>
                        <p className="text-slate-600">Lütfen bekleyin</p>
                      </motion.div>
                    )}

                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  {currentStep !== 'submitting' && (
                    <div className="flex items-center gap-4 mt-8 pt-8 border-t border-slate-100">
                      {currentStep !== 'sector' && (
                        <button
                          onClick={handleBack}
                          className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all"
                        >
                          <ArrowLeft size={18} />
                          Geri
                        </button>
                      )}
                      
                      <button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-orange to-orange-500 hover:from-orange-500 hover:to-brand-orange text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {currentStep === 'location' ? (
                          <>
                            Ücretsiz Kayıt Ol
                            <CheckCircle2 size={20} />
                          </>
                        ) : (
                          <>
                            Devam Et
                            <ArrowRight size={20} />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Benefits Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <h3 className="text-lg font-bold text-slate-900">Neden Yolmov?</h3>
                
                {BENEFITS.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-100"
                  >
                    <div className={`w-12 h-12 rounded-xl ${benefit.bg} flex items-center justify-center mb-4`}>
                      <benefit.icon size={24} className={benefit.color} strokeWidth={2} />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">{benefit.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{benefit.desc}</p>
                  </motion.div>
                ))}

                {/* Trust Badge */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-center relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-slate-400 text-xs uppercase font-bold mb-2">Güvenli Platform</p>
                    <p className="text-white font-bold text-lg">1000+ Aktif Partner</p>
                  </div>
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-brand-orange/20 rounded-full blur-2xl" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegisterPageV2;
