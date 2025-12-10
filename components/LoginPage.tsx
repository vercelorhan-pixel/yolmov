
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, ArrowRight, Star, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer } from '../types';
import supabaseApi from '../services/supabaseApi';
import { notifyWelcome } from '../services/notifications';

interface LoginPageProps {
  userType: 'customer' | 'partner';
}

// Test credentials
const TEST_CREDENTIALS = {
  customer: { phone: '05XX1234567', password: '123456' },
  partner: { phone: '05XX9876543', password: 'partner123' }
};

const LoginPage: React.FC<LoginPageProps> = ({ userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // returnUrl'i state'ten alalım
  const returnUrl = location.state?.returnUrl || '/musteri/profil';
  
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isCustomer = userType === 'customer';

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    console.log('🔵 handleSubmit called', { mode, isCustomer, email, password: password ? '***' : 'empty' });
    
    setError('');
    setLoading(true);
    
    try {
      if (mode === 'register' && isCustomer) {
        // ✅ YENİ MÜŞTERİ KAYDI - Supabase Auth ile
        console.log('📝 Register mode');
        
        if (!email || !firstName || !lastName || !password || !phone) {
          setError('Lütfen tüm alanları doldurun');
          setLoading(false);
          return;
        }

        if (phone.length < 10) {
          setError('Telefon numarası en az 10 karakter olmalıdır');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Şifre en az 6 karakter olmalıdır');
          setLoading(false);
          return;
        }
        
        // Supabase Auth SignUp
        console.log('🔄 Calling signUpCustomer...');
        const result = await supabaseApi.auth.signUpCustomer(email, password, {
          firstName,
          lastName,
          phone,
        });
        console.log('✅ SignUp result:', result);
        
        // Hoş geldin bildirimi gönder (user ID varsa)
        if (result?.user?.id) {
          try {
            await notifyWelcome(result.user.id);
            console.log('✅ Welcome notification sent');
          } catch (notifError) {
            console.error('⚠️ Welcome notification failed:', notifError);
          }
        }
        
        // Email confirmation mesajı göster
        setError('');
        alert(`✅ Kayıt başarılı!\n\n📧 ${email} adresinize doğrulama maili gönderildi.\n\nLütfen mailinizi kontrol edin ve doğrulama linkine tıklayın.`);
        
        // Login moduna geç
        setMode('login');
        setPassword('');
        
      } else if (mode === 'login' && isCustomer) {
        // ✅ MÜŞTERİ GİRİŞİ - Supabase Auth ile
        console.log('🔑 Login mode - Customer');
        
        if (!email || !password) {
          setError('Lütfen email ve şifrenizi girin');
          setLoading(false);
          return;
        }
        
        // Supabase Auth SignIn
        console.log('🔄 Calling signIn...');
        const { user, session } = await supabaseApi.auth.signIn(email, password);
        console.log('✅ SignIn result:', { user: user?.id, session: !!session });
        
        if (!user) {
          setError('Giriş başarısız');
          setLoading(false);
          return;
        }

        // Customer bilgilerini DB'den çek
        console.log('🔄 Getting customer data...');
        const customerData = await supabaseApi.customers.getById(user.id);
        console.log('✅ Customer data:', customerData);
        
        if (!customerData) {
          setError('Müşteri bilgileri bulunamadı');
          setLoading(false);
          return;
        }
        // LocalStorage'a kaydet (QuoteWizard ve diğer sayfalar kullanıyor)
        try {
          // Diğer rol oturumlarını temizle - çakışmayı önle
          localStorage.removeItem('yolmov_admin');
          localStorage.removeItem('yolmov_partner');
          
          localStorage.setItem('yolmov_customer', JSON.stringify(customerData));
        } catch {}
        
        // returnUrl'e yönlendir (varsa /teklif gibi, yoksa /musteri/profil)
        console.log('🚀 Navigating to:', returnUrl);
        navigate(returnUrl);
        
      } else {
        // ✅ Partner login: email+şifre; onay durumuna göre yönlendirme
        console.log('🔑 Login mode - Partner (password)');
        if (!email || !password) {
          setError('Lütfen email ve şifrenizi girin');
          setLoading(false);
          return;
        }
        const { approved, partner } = await supabaseApi.auth.signInPartner(email, password);
        if (!approved) {
          navigate('/partner/inceleniyor');
          return;
        }
        // Diğer rol oturumlarını temizle - çakışmayı önle
        localStorage.removeItem('yolmov_admin');
        localStorage.removeItem('yolmov_customer');
        localStorage.removeItem('yolmov_anonymous_caller_id');
        
        localStorage.setItem('yolmov_partner', JSON.stringify(partner));
        navigate('/partner');
      }
    } catch (err: any) {
      console.error('❌ Submit error:', err);
      setError(err.message || 'İşlem başarısız!');
    } finally {
      console.log('🏁 handleSubmit finished');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-3xl ${isCustomer ? 'bg-brand-orange/5' : 'bg-blue-600/5'}`}></div>
         <div className={`absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full blur-3xl ${isCustomer ? 'bg-yellow-500/5' : 'bg-teal-500/5'}`}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-[1100px] min-h-[600px] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10"
      >
        
        {/* LEFT SIDE: Visual & Brand Area (45%) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-gray-900 text-white p-12 flex-col justify-between overflow-hidden">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={isCustomer 
                ? "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1920&auto=format&fit=crop" 
                : "https://images.unsplash.com/photo-1613214149922-f1809c99e35f?q=80&w=1920&auto=format&fit=crop"
              }
              alt="Background" 
              className="w-full h-full object-cover opacity-40"
            />
            <div className={`absolute inset-0 bg-gradient-to-b ${isCustomer ? 'from-brand-orange/80 to-gray-900/90' : 'from-blue-600/80 to-gray-900/90'} mix-blend-multiply`}></div>
          </div>

          <div className="relative z-10">
            <div className="mb-8">
              <span className="yolmov-logo text-5xl font-bold text-white block mb-6">
                yolmov
              </span>
              <span className="hidden"
              />
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-display font-bold leading-tight mb-6">
                {isCustomer ? "Yolculuğunuz Güvende." : "İş Ortağı Portalı"}
              </h2>
              <p className="text-white/80 text-lg leading-relaxed font-light">
                {isCustomer 
                  ? "7/24 yol yardım desteği ile Türkiye'nin her yerinde yanınızdayız. Tek tıkla çekici, lastik ve akü hizmeti."
                  : "İşlerinizi cebinizden yönetin. Talep takibi, bakiye sorgulama ve filo yönetimi tek ekranda."
                }
              </p>
            </motion.div>
          </div>

          {/* Testimonial / Stats */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#FFC107" className="text-[#FFC107]" />)}
            </div>
            <p className="text-sm italic text-white/90 mb-4">
              "{isCustomer ? "Gece yarısı yolda kaldım, 15 dakikada geldiler. Harika bir deneyimdi." : "Yolmov sayesinde iş hacmimiz %40 arttı. Ödemeler düzenli ve sistem çok kolay."}"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&auto=format&fit=crop&q=60" alt="User" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold">{isCustomer ? "Ahmet Yılmaz" : "Oto Kurtarma Ltd."}</p>
                <p className="text-[10px] text-white/60">{isCustomer ? "Yolmov Üyesi" : "Yolmov Partneri"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Form Area (55%) */}
        <div className="col-span-1 lg:col-span-7 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
          
          {/* Header Text */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${isCustomer ? 'bg-orange-50 text-brand-orange' : 'bg-blue-50 text-blue-600'}`}>
               {isCustomer ? <Lock size={24} /> : <Briefcase size={24} />}
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
              {mode === 'login' ? 'Tekrar Hoş Geldiniz!' : 'Hesap Oluşturun'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isCustomer 
                ? (mode === 'login' ? 'Yola devam etmek için giriş yapın.' : 'Hızlıca üye olun, yolda kalmayın.')
                : 'Partner girişi: E-posta ve şifre ile giriş yapın.'}
            </p>
          </div>

          {/* Top Switch (Only for Customers) */}
          {isCustomer && (
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gray-100 p-1.5 rounded-2xl flex w-full max-w-xs relative">
                <motion.div 
                  className="absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-sm"
                  initial={false}
                  animate={{ 
                    left: mode === 'login' ? '6px' : '50%', 
                    width: 'calc(50% - 6px)' 
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button 
                  onClick={() => setMode('login')}
                  className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors duration-300 ${mode === 'login' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Giriş Yap
                </button>
                <button 
                  onClick={() => setMode('register')}
                  className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors duration-300 ${mode === 'register' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Kayıt Ol
                </button>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <form className="space-y-5 max-w-sm mx-auto w-full" onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Email Field */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    E-posta
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isCustomer ? 'text-gray-400 group-focus-within:text-brand-orange' : 'text-gray-400 group-focus-within:text-blue-600'}`}>
                      <Phone size={18} />
                    </div>
                    <input
                      type="email"
                      className={`block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white transition-all outline-none focus:ring-2 ${isCustomer ? 'focus:ring-brand-orange/20 focus:border-brand-orange' : 'focus:ring-blue-600/20 focus:border-blue-600'}`}
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Name Fields - Only for Register */}
                {mode === 'register' && isCustomer && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                          Ad
                        </label>
                        <input
                          type="text"
                          className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white transition-all outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                          placeholder="Adınız"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                          Soyad
                        </label>
                        <input
                          type="text"
                          className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white transition-all outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                          placeholder="Soyadınız"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Phone Field */}
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                        Telefon
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-gray-400 group-focus-within:text-brand-orange">
                          <Phone size={18} />
                        </div>
                        <input
                          type="tel"
                          className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white transition-all outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                          placeholder="05321234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          pattern="[0-9]{10,11}"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                    Şifre
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isCustomer ? 'text-gray-400 group-focus-within:text-brand-orange' : 'text-gray-400 group-focus-within:text-blue-600'}`}>
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`block w-full pl-11 pr-11 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white transition-all outline-none focus:ring-2 ${isCustomer ? 'focus:ring-brand-orange/20 focus:border-brand-orange' : 'focus:ring-blue-600/20 focus:border-blue-600'}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                {/* Extra Fields for Register Mode (Customer) */}
                {mode === 'register' && isCustomer && (
                   <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-start gap-3 pt-2"
                   >
                      <div className="pt-0.5">
                         <input type="checkbox" id="terms" className="w-4 h-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" />
                      </div>
                      <label htmlFor="terms" className="text-xs text-gray-500 leading-snug">
                         <a href="#" className="font-bold text-brand-orange hover:underline">Kullanım Koşulları</a>'nı ve <a href="#" className="font-bold text-brand-orange hover:underline">Gizlilik Politikası</a>'nı okudum, onaylıyorum.
                      </label>
                   </motion.div>
                )}

                {/* Forgot Password Link (Login Only) */}
                {mode === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button type="button" className={`text-xs font-bold hover:underline ${isCustomer ? 'text-brand-orange' : 'text-blue-600'}`}>
                      Şifremi Unuttum
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                
                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-xs">
                  {isCustomer ? (
                    <>
                      <p className="font-bold mb-1">Test Girişi (Müşteri):</p>
                      <p>Tel: {TEST_CREDENTIALS.customer.phone}</p>
                      <p>Şifre: {TEST_CREDENTIALS.customer.password}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold mb-1">Partner Akışı:</p>
                      <p>Kayıt sırasında şifre belirleyin. Email doğrulayın. Admin onayı sonrası giriş yapabilirsiniz.</p>
                    </>
                  )}
                </div>

                {/* Action Button */}
                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                     isCustomer 
                     ? 'bg-gradient-to-r from-brand-orange to-brand-lightOrange shadow-orange-200' 
                     : 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-200'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </motion.div>
            </AnimatePresence>
          </form>
          
          {/* Partner Link in Partner Mode */}
          {!isCustomer && (
             <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                   Hesabınız yok mu? <button onClick={() => navigate('/partner/kayit')} className="text-blue-600 font-bold hover:underline">Başvuru Formunu Doldurun</button>
                </p>
             </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
