
import React, { useState } from 'react';
import { 
   User, Briefcase, MapPin, Phone, Mail, Lock,
   CheckCircle2, ArrowRight, Truck, Wrench, 
   BatteryCharging, Disc, ShieldCheck, Zap, TrendingUp, Loader
} from 'lucide-react';
import { CITIES_WITH_DISTRICTS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { validateEmail, validatePhone } from '../services/validation';
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
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // ✅ SADELEŞT İRİLMİŞ VALİDASYON - Sadece kritik alanlar
    if (!formData.firstName.trim()) errors.firstName = 'Ad gereklidir';
    if (!formData.lastName.trim()) errors.lastName = 'Soyad gereklidir';
    if (!formData.sector) errors.sector = 'Hizmet alanı seçiniz';
    if (!formData.city) errors.city = 'Şehir seçiniz';
    if (!formData.district) errors.district = 'İlçe seçiniz';

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Telefon gereklidir';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Geçerli bir telefon numarası giriniz (örn: 0532 123 45 67)';
    }

    // Email validation (opsiyonel - telefon ile de kayıt olabilir)
    if (formData.email.trim() && !validateEmail(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    // Password validation
    if (!formData.password.trim()) {
      errors.password = 'Şifre gereklidir';
    } else if (formData.password.length < 6) {
      errors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    // ❌ TCKN/Vergi No KALDIRILDI - Panel'den eklenecek
    // ❌ Araç sayısı ZORUNLU DEĞİL - Varsayılan 1
    // ❌ Belge yükleme ZORUNLU DEĞİL - Admin onayından sonra

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

  // ❌ BELGE YÜKLEME FONKSİYONLARI KALDIRILDI
  // Artık ilk kayıt sırasında belge yükleme yapılmıyor
  // Belgeler admin onayından sonra partner panelinden eklenecek

  const [registeredCredentials, setRegisteredCredentials] = useState<{email: string; password: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError('');

    if (!validateForm()) {
      setSubmissionError('Lütfen tüm zorunlu alanları doğru şekilde doldurunuz.');
      return;
    }

    setIsSubmitting(true);

      try {
         // Email yoksa telefon kullan (email format)
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
           return;
         }

         console.log('✅ Partner başvurusu başarılı:', result?.partner);
         
         // ✅ Kullanıcı bilgilerini kaydet (indirme için)
         setRegisteredCredentials({
           email: emailForAuth.toLowerCase(),
           password: formData.password
         });

         // Success toast
         setSuccessMessage('🎉 Kayıt tamamlandı! Üyelik bilgilerinizi indirin ve admin onayını bekleyin.');

         // Transactional email (best-effort; non-blocking)
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
      
         // ❌ FORM TEMİZLENMİYOR - Kullanıcı bilgilerini görebilsin

    } catch (err: any) {
      console.error('🔴 Unexpected error:', err);
      
      if (err.message?.includes('already registered') || err.message?.includes('email')) {
        setSubmissionError('Bu telefon/e-posta ile kayıt zaten mevcut. Lütfen giriş yapın.');
      } else {
        setSubmissionError('Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
      }
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
                 Hemen Partner Ol, <br />
                 <span className="text-brand-orange">İş Yakalamaya Başla</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                 30 saniyede kayıt ol, admin onayından sonra anında iş almaya başla. 
                 <strong className="text-white">Komisyon yok, aidat yok</strong>, sadece kazanç var.
              </p>
              
              {/* 🔥 FOMO BANNER - Aciliyet yaratır */}
              <div className="mt-6 inline-block bg-yellow-500 text-slate-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl animate-pulse">
                 ⚡ Bugün Kayıt Olanlar İlk 3 İş İçin Yolmov Komisyonu Ödemez!
              </div>
           </motion.div>
        </div>
      </div>

      {/* Main Content - Floating Card Layout */}
      <div className="container mx-auto px-4 md:px-8 -mt-32 pb-20 relative z-20">
         <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden flex flex-col lg:flex-row">
            
            {/* LEFT: Form Section */}
            <div className="lg:w-7/12 p-8 md:p-12 lg:p-16">
               {/* ✅ KAYIT BAŞARILI - ÜYELİK BİLGİLERİ İNDİRME */}
               {registeredCredentials && (
                  <div className="mb-8 bg-green-50 border-2 border-green-300 rounded-2xl p-6">
                     <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                           <CheckCircle2 size={28} />
                        </div>
                        <div className="flex-1">
                           <h3 className="text-lg font-bold text-green-900 mb-2">🎉 Kayıt Tamamlandı!</h3>
                           <p className="text-sm text-green-700 mb-4">
                              Admin onayı sonrası giriş yapabilirsiniz. Bilgilerinizi unutmamak için indirin:
                           </p>
                           <div className="bg-white rounded-xl p-4 mb-4 border border-green-200">
                              <p className="text-xs text-slate-600 mb-1"><strong>E-posta/Kullanıcı Adı:</strong></p>
                              <p className="font-mono text-sm text-slate-900 mb-3">{registeredCredentials.email}</p>
                              <p className="text-xs text-slate-600 mb-1"><strong>Şifre:</strong></p>
                              <p className="font-mono text-sm text-slate-900">{registeredCredentials.password}</p>
                           </div>
                           <button
                              onClick={() => {
                                 const blob = new Blob([
                                    `YOLMOV PARTNER ÜYELİK BİLGİLERİ\n` +
                                    `================================\n\n` +
                                    `Ad Soyad: ${formData.firstName} ${formData.lastName}\n` +
                                    `Firma: ${formData.companyName || 'Bireysel'}\n` +
                                    `Telefon: ${formData.phone}\n\n` +
                                    `GİRİŞ BİLGİLERİ:\n` +
                                    `E-posta/Kullanıcı: ${registeredCredentials.email}\n` +
                                    `Şifre: ${registeredCredentials.password}\n\n` +
                                    `Durum: Admin onayı bekleniyor\n` +
                                    `Kayıt Tarihi: ${new Date().toLocaleString('tr-TR')}\n\n` +
                                    `Not: Admin onayı sonrası https://yolmov.com/partner adresinden giriş yapabilirsiniz.`
                                 ], { type: 'text/plain' });
                                 const url = URL.createObjectURL(blob);
                                 const a = document.createElement('a');
                                 a.href = url;
                                 a.download = `yolmov-uyelik-${formData.phone}.txt`;
                                 a.click();
                                 URL.revokeObjectURL(url);
                              }}
                              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                           >
                              📥 Üyelik Bilgilerini İndir
                           </button>
                        </div>
                     </div>
                  </div>
               )}

               <div className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Hızlı Kayıt</h2>
                  <p className="text-slate-500 text-sm">30 saniyede tamamla, hemen iş almaya başla.</p>
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

                  {/* 2. Kişisel Bilgiler (SADELEŞ TİRİLDİ) */}
                  <div className="space-y-4">
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Kişisel Bilgiler</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <User size={18} className="text-slate-400" />
                              <input 
                                 type="text" 
                                 placeholder="Adınız *" 
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
                                 placeholder="Soyadınız *" 
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
                                 placeholder="Firma / İşletme Adı (Opsiyonel)" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.companyName}
                                 onChange={(e) => handleInputChange('companyName', e.target.value)}
                              />
                           </div>
                           <p className="text-xs text-slate-500 mt-1">💡 Bireysel çalışıyorsanız boş bırakabilirsiniz</p>
                        </div>
                     </div>
                  </div>

                  {/* 3. İletişim ve Konum */}
                  <div className="space-y-4">
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">İletişim & Bölge</label>
                     <div className="grid grid-cols-1 gap-4">
                        <div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <Phone size={18} className="text-slate-400" />
                              <input 
                                 type="tel" 
                                 placeholder="Cep Telefonu (5XX XXX XX XX) *" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.phone}
                                 onChange={(e) => handleInputChange('phone', e.target.value)}
                                 inputMode="numeric"
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
                                 placeholder="E-posta (Varsa - Opsiyonel)" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.email}
                                 onChange={(e) => handleInputChange('email', e.target.value)}
                              />
                           </div>
                           {formErrors.email && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.email}</p>
                           )}
                           <p className="text-xs text-slate-500 mt-1">💡 E-posta yoksa sadece telefonla kayıt olabilirsiniz</p>
                        </div>
                        <div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                              <Lock size={18} className="text-slate-400" />
                              <input 
                                 type="password" 
                                 placeholder="Şifre Oluştur (en az 6 karakter) *" 
                                 className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                                 value={formData.password}
                                 onChange={(e) => handleInputChange('password', e.target.value)}
                              />
                           </div>
                           {formErrors.password && (
                              <p className="text-red-500 text-xs font-medium mt-1">{formErrors.password}</p>
                           )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <div className="bg-slate-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-brand-orange/50 focus-within:bg-white transition-all flex items-center gap-3">
                                 <MapPin size={18} className="text-slate-400" />
                                 <select 
                                    className="bg-transparent w-full outline-none text-sm font-medium text-slate-800 cursor-pointer"
                                    value={formData.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                 >
                                    <option value="">İl Seçiniz *</option>
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
                                    <option value="" className="text-slate-400">İlçe Seçiniz *</option>
                                    {formData.city && CITIES_WITH_DISTRICTS[formData.city].map(d => <option key={d} value={d}>{d}</option>)}
                                 </select>
                              </div>
                              {formErrors.district && (
                                 <p className="text-red-500 text-xs font-medium mt-1">{formErrors.district}</p>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* ❌ ARAÇ & BELGE BÖLÜMÜ KALDIRILDI - Sadeleştirme için */}
                  {/* Araç detayları ve belgeler admin onayından SONRA panel'den eklenecek */}

                  {/* Submission Error Message */}
                  {submissionError && (
                     <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-700 text-sm font-medium">{submissionError}</p>
                     </div>
                  )}

                  {/* Submit Button */}
                  <button 
                     type="submit"
                     disabled={isSubmitting || !!registeredCredentials}
                     className={`w-full py-4 rounded-xl font-bold shadow-xl transition-all transform flex items-center justify-center gap-3 text-lg ${
                        isSubmitting || registeredCredentials
                           ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                           : 'bg-brand-orange hover:bg-brand-lightOrange text-white shadow-orange-200 hover:-translate-y-1 active:scale-95'
                     }`}
                  >
                     {isSubmitting ? (
                        <>
                           <Loader size={22} className="animate-spin" />
                           Kayıt Yapılıyor...
                        </>
                     ) : registeredCredentials ? (
                        <>
                           <CheckCircle2 size={22} />
                           Kayıt Tamamlandı ✓
                        </>
                     ) : (
                        <>
                           Ücretsiz Hesabımı Oluştur 🚀
                        </>
                     )}
                  </button>
                  
                  {!registeredCredentials && (
                     <div className="text-center space-y-2">
                        <p className="text-xs text-green-600 font-bold">
                           ✓ Komisyon yok, aidat yok, kayıt tamamen ücretsiz
                        </p>
                        <p className="text-xs text-slate-500">
                           ✓ Belge yükleme işlemini daha sonra yapabilirsiniz
                        </p>
                        <p className="text-xs text-slate-400">
                           Kayıt olarak <a href="#" className="underline hover:text-slate-600">İş Ortaklığı Sözleşmesi</a>'ni kabul etmiş olursunuz.
                        </p>
                     </div>
                  )}

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
