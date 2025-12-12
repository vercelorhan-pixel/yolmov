import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import HowItWorks from './components/HowItWorks';
import Advantages from './components/Advantages';
import Campaigns from './components/Campaigns';
import Footer from './components/Footer';
import CookieConsentBanner from './components/CookieConsentBanner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { trackPageView } from './services/activityTrackerV2';

// Yolmov Voice - Sesli Arama Sistemi
import { CallProvider } from './context/CallContext';
import { CustomerPartnerCallProvider } from './context/CustomerToPartnerCallContext';
import { CustomerSupportCallProvider } from './context/CustomerToSupportCallContext';
import { PartnerSupportCallProvider } from './context/PartnerToSupportCallContext';
import { IncomingCallModal, ActiveCallUI, CallStatusIndicator, OutgoingCallUI, CallSupportButton } from './components/voice';

// Lazy load pages for better performance
const AboutPage = React.lazy(() => import('./components/AboutPage'));
const ServicesPage = React.lazy(() => import('./components/ServicesPage'));
const FAQPage = React.lazy(() => import('./components/FAQPage'));
const ContactPage = React.lazy(() => import('./components/ContactPage'));
const CareerPage = React.lazy(() => import('./components/CareerPage'));
const BlogPage = React.lazy(() => import('./components/BlogPage'));
const CampaignsPage = React.lazy(() => import('./components/CampaignsPage'));
const CampaignDetailPage = React.lazy(() => import('./components/CampaignDetailPage'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const AuthRequiredPage = React.lazy(() => import('./components/AuthRequiredPage'));
const PartnerRegisterPage = React.lazy(() => import('./components/PartnerRegisterPage'));
const PartnerRegisterPageV2 = React.lazy(() => import('./components/PartnerRegisterPageV2'));
const PartnerRegistrationSuccess = React.lazy(() => import('./components/PartnerRegistrationSuccess'));
const PartnerDashboard = React.lazy(() => import('./components/PartnerDashboard'));
const PartnerMessagesInbox = React.lazy(() => import('./components/partner/PartnerMessagesInbox'));
const PartnerChatPage = React.lazy(() => import('./components/partner/PartnerChatPage'));
const CustomerMessagesPage = React.lazy(() => import('./components/CustomerMessagesPage'));
const CustomerProfilePage = React.lazy(() => import('./components/CustomerProfilePage'));
const CustomerRequestsPage = React.lazy(() => import('./components/CustomerRequestsPage'));
const OffersPanel = React.lazy(() => import('./components/OffersPanel'));
const QuotePage = React.lazy(() => import('./components/QuotePage'));
const ListingPage = React.lazy(() => import('./components/ListingPage'));
const ProviderDetailPage = React.lazy(() => import('./components/ProviderDetailPage'));
const AdminLoginPage = React.lazy(() => import('./components/AdminLoginPage'));
const AdminSignupPage = React.lazy(() => import('./components/admin/AdminSignupPage'));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const AdminSystemLogs = React.lazy(() => import('./components/AdminSystemLogs'));
const AdminUserDetailPage = React.lazy(() => import('./components/admin/pages/AdminUserDetailPage'));
const AdminPartnerDetailPage = React.lazy(() => import('./components/admin/pages/AdminPartnerDetailPage'));
const AdminRequestDetailPage = React.lazy(() => import('./components/admin/pages/AdminRequestDetailPage'));
const AdminOfferDetailPage = React.lazy(() => import('./components/admin/pages/AdminOfferDetailPage'));
const AdminFleetDetailPage = React.lazy(() => import('./components/admin/pages/AdminFleetDetailPage'));
const AdminReviewDetailPage = React.lazy(() => import('./components/admin/AdminReviewDetailPage'));
const AdminLeadRequestDetailPage = React.lazy(() => import('./components/admin/pages/AdminLeadRequestDetailPage'));
const AdminAreaRequestDetailPage = React.lazy(() => import('./components/admin/pages/AdminAreaRequestDetailPage'));
const AdminSupportRequestDetailPage = React.lazy(() => import('./components/admin/pages/AdminSupportRequestDetailPage'));
const NotificationTestPage = React.lazy(() => import('./components/NotificationTestPage'));
const EmailConfirmationPage = React.lazy(() => import('./components/EmailConfirmationPage'));
const PrivacyPolicyPage = React.lazy(() => import('./components/PrivacyPolicyPage'));
const TermsOfServicePage = React.lazy(() => import('./components/TermsOfServicePage'));
const NotFoundPage = React.lazy(() => import('./components/NotFoundPage'));
const SEOServicePage = React.lazy(() => import('./components/SEOServicePage'));
const SEOStatsPage = React.lazy(() => import('./components/SEOStatsPage'));
const SEOBrandPage = React.lazy(() => import('./components/SEOBrandPage'));
const PartnerSEOPage = React.lazy(() => import('./components/PartnerSEOPage'));
const PriceCalculatorWizard = React.lazy(() => import('./components/PriceCalculatorWizard'));
const PasswordSetupPage = React.lazy(() => import('./components/PasswordSetupPage'));
const PartnerReviewPendingPage = React.lazy(() => import('./components/PartnerReviewPendingPage'));

// Yeni SEO Sayfaları - Kahin Stratejileri
const SpecialVehiclePage = React.lazy(() => import('./components/SpecialVehiclePage'));
const OnDutyPage = React.lazy(() => import('./components/OnDutyPage'));
const IntercityPage = React.lazy(() => import('./components/IntercityPage'));
const SpecialLocationPage = React.lazy(() => import('./components/SpecialLocationPage'));
const PricingPage = React.lazy(() => import('./components/PricingPage'));

// Loading component for Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-orange"></div>
  </div>
);

// Home page component
const HomePage = () => {
  const navigate = useNavigate();
  
  const handleSearch = (city: string, district: string, serviceId: string) => {
    // Direkt listeleme sayfasına git (giriş kontrolü yok)
    // fromHero=1 parametresi ListingPage'e Hero'dan geldiğimizi söyler (tekrar animasyon yapmasın)
    navigate(`/liste?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}&serviceId=${encodeURIComponent(serviceId)}&fromHero=1`);
  };
  
  return (
    <>
      <Hero onSearch={handleSearch} />
      <ServicesSection />
      <HowItWorks />
      <Advantages />
      <Campaigns />
    </>
  );
};

// Layout wrapper component to handle Header/Footer visibility
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Hide header/footer on these routes
  const hideHeaderFooter = ['/partner', '/admin', '/admin/giris', '/admin/sistem-loglari'].some(
    path => location.pathname === path || location.pathname.startsWith(path + '/')
  );

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-brand-dark selection:bg-brand-orange selection:text-white">
      {!hideHeaderFooter && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {!hideHeaderFooter && <Footer />}
      <CookieConsentBanner />
    </div>
  );
};

// Sayfa gezinme takibi komponenti
const PageViewTracker: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Her sayfa değişikliğinde aktivite kaydet
    trackPageView(document.title);
  }, [location.pathname]);
  
  return null;
};

// !! FLOATING CALL BUTTON KALDIRILDI !!
// Artık sayfa bazlı call butonları kullanılacak:
// - ContactPage (İletişim)
// - Footer
// - Partner Dashboard

function App() {
  const [isCallMinimized, setIsCallMinimized] = useState(false);

  return (
    <BrowserRouter>
      <CallProvider>
        <CustomerPartnerCallProvider>
          <CustomerSupportCallProvider>
            <PartnerSupportCallProvider>
              <PageViewTracker />
              <ErrorBoundary>
                <AppLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <ErrorBoundary>
                      <Routes>
            {/* Home */}
            <Route path="/" element={<HomePage />} />
            
            {/* Static Pages */}
            <Route path="/hakkimizda" element={<AboutPage />} />
            <Route path="/hizmetler" element={<ServicesPage />} />
            <Route path="/sss" element={<FAQPage />} />
            <Route path="/iletisim" element={<ContactPage />} />
            <Route path="/kariyer" element={<CareerPage />} />
            <Route path="/blog" element={<BlogPage />} />
            
            {/* Campaigns */}
            <Route path="/kampanyalar" element={<CampaignsPage />} />
            <Route path="/kampanya/:id" element={<CampaignDetailPage />} />
            
            {/* Auth & Registration */}
            <Route path="/giris-gerekli" element={<AuthRequiredPage />} />
            <Route path="/giris/musteri" element={<LoginPage userType="customer" />} />
            <Route path="/giris/partner" element={<LoginPage userType="partner" />} />
            <Route path="/partner/kayit" element={<PartnerRegisterPageV2 />} />
            <Route path="/partner-kayit-basarili" element={<PartnerRegistrationSuccess />} />
            <Route path="/email-dogrulama" element={<EmailConfirmationPage />} />
            
            {/* Partner Dashboard */}
            <Route path="/partner" element={<PartnerDashboard />} />
            <Route path="/partner/inceleniyor" element={<PartnerReviewPendingPage />} />
            <Route path="/partner/mesajlar" element={<PartnerMessagesInbox />} />
            <Route path="/partner/mesajlar/:conversationId" element={<PartnerChatPage />} />
            <Route path="/sifre-olustur" element={<PasswordSetupPage />} />
            
            {/* Customer - Protected Routes */}
            <Route path="/musteri/profil" element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />
            <Route path="/musteri/teklifler" element={<ProtectedRoute><OffersPanel /></ProtectedRoute>} />
            <Route path="/musteri/taleplerim" element={<ProtectedRoute><CustomerRequestsPage /></ProtectedRoute>} />
            <Route path="/musteri/mesajlar" element={<ProtectedRoute><CustomerMessagesPage /></ProtectedRoute>} />
            
            {/* Quote & Listing */}
            <Route path="/liste" element={<ListingPage />} />
            <Route path="/hizmet/:id" element={<ProviderDetailPage />} />
            
            {/* Protected Routes - Quote & Calculator */}
            <Route path="/teklif" element={<ProtectedRoute><QuotePage /></ProtectedRoute>} />
            <Route path="/fiyat-hesapla" element={<ProtectedRoute><PriceCalculatorWizard /></ProtectedRoute>} />
            
            {/* Admin Routes - Protected */}
            <Route path="/admin/giris" element={<AdminLoginPage />} />
            <Route path="/admin/kayit" element={<AdminSignupPage />} />
            <Route path="/operasyon/kayit" element={<AdminSignupPage />} />
            
            {/* Protected Admin Dashboard Routes */}
            <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/kullanicilar" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/kullanicilar/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/partnerler" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/partnerler/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/partner-onay" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/talepler" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/musteri-talepleri" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/musteri-talepleri/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/teklifler" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/teklifler/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/raporlar" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/belgeler" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/filo" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/filo/:vehicleId" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/degerlendirmeler" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/degerlendirmeler/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/finansal" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/krediler" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/is-gecmisi" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/admin-kullanicilari" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/partner-vitrin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/hizmet-bolgeleri" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/kampanyalar" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/aktivite" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/cagri-merkezi" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/canli-gorusmeler" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/cagri-kayitlari" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            
            {/* Detail Routes */}
            <Route path="/admin/talepler/lead/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/talepler/alan/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/talepler/destek/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            
            <Route path="/admin/sistem-loglari" element={<AdminProtectedRoute><AdminSystemLogs /></AdminProtectedRoute>} />
            
            {/* Special Pages */}
            <Route path="/bildirim-test" element={<NotificationTestPage />} />
            <Route path="/seo-istatistikler" element={<SEOStatsPage />} />
            <Route path="/gizlilik-politikasi" element={<PrivacyPolicyPage />} />
            <Route path="/kullanim-kosullari" element={<TermsOfServicePage />} />
            
            {/* Legacy /operasyon redirect */}
            <Route path="/operasyon" element={<AdminLoginPage />} />
            
            {/* Partner SEO Pages - B2B iş ilanı sayfaları (ÖNCE OLMALI) */}
            <Route path="/partner-ol/:service/:city/:district" element={<PartnerSEOPage />} />
            
            {/* Yeni SEO Sayfaları - Kahin Stratejileri */}
            {/* Özel Araç Taşıma: /tasima/is-makinesi/zonguldak/gokcebey */}
            <Route path="/tasima/:vehicleType/:city/:district" element={<SpecialVehiclePage />} />
            
            {/* Nöbetçi Servisler: /nobetci/lastikci/istanbul/kadikoy */}
            <Route path="/nobetci/:service/:city/:district" element={<OnDutyPage />} />
            
            {/* Şehirler Arası Çekici: /sehirlerarasi/istanbul/ankara */}
            <Route path="/sehirlerarasi/:from/:to" element={<IntercityPage />} />
            
            {/* Özel Lokasyonlar: /lokasyon/istanbul-havalimani */}
            <Route path="/lokasyon/:slug" element={<SpecialLocationPage />} />
            
            {/* Fiyat Sayfaları: /fiyat/cekici/istanbul */}
            <Route path="/fiyat/:service/:city" element={<PricingPage />} />
            
            {/* SEO Service Pages - Dinamik il/ilçe/hizmet sayfaları */}
            <Route path="/:service/:city/:district" element={<SEOServicePage />} />
            
            {/* SEO Brand Pages - Marka bazlı yol yardım sayfaları */}
            <Route path="/marka/:brandSlug" element={<SEOBrandPage />} />
            
            {/* 404 - Must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
              </ErrorBoundary>
            </Suspense>
                </AppLayout>
                
                {/* Yolmov Voice - Global Arama UI */}
                <IncomingCallModal />
                <OutgoingCallUI />
                <ActiveCallUI 
                  minimized={isCallMinimized} 
                  onMinimize={() => setIsCallMinimized(true)}
                  onMaximize={() => setIsCallMinimized(false)}
                />
                <CallStatusIndicator onClick={() => setIsCallMinimized(false)} />
                
                
                {/* Floating Support Call Button - KALDIRILDI (Sayfa bazlı butonlar kullanılacak) */}
                
              </ErrorBoundary>
            </PartnerSupportCallProvider>
          </CustomerSupportCallProvider>
        </CustomerPartnerCallProvider>
      </CallProvider>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
