import React from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy load components for better performance
const HomePage = React.lazy(() => import('../components/Hero').then(m => ({ default: () => <>{m.default}</>})));
const AboutPage = React.lazy(() => import('../components/AboutPage'));
const ServicesPage = React.lazy(() => import('../components/ServicesPage'));
const FAQPage = React.lazy(() => import('../components/FAQPage'));
const ContactPage = React.lazy(() => import('../components/ContactPage'));
const CareerPage = React.lazy(() => import('../components/CareerPage'));
const BlogPage = React.lazy(() => import('../components/BlogPage'));
const CampaignsPage = React.lazy(() => import('../components/CampaignsPage'));
const CampaignDetailPage = React.lazy(() => import('../components/CampaignDetailPage'));

const LoginPage = React.lazy(() => import('../components/LoginPage'));
const PartnerRegisterPage = React.lazy(() => import('../components/PartnerRegisterPage'));
const PartnerDashboard = React.lazy(() => import('../components/PartnerDashboard'));

const CustomerProfilePage = React.lazy(() => import('../components/CustomerProfilePage'));
const OffersPanel = React.lazy(() => import('../components/OffersPanel'));

const QuoteWizard = React.lazy(() => import('../components/QuoteWizard'));
const ListingPage = React.lazy(() => import('../components/ListingPage'));
const ProviderDetailPage = React.lazy(() => import('../components/ProviderDetailPage'));

const AdminLoginPage = React.lazy(() => import('../components/AdminLoginPage'));
const AdminDashboard = React.lazy(() => import('../components/admin/AdminDashboard'));
const AdminSystemLogs = React.lazy(() => import('../components/AdminSystemLogs'));

const NotificationTestPage = React.lazy(() => import('../components/NotificationTestPage'));
const PrivacyPolicyPage = React.lazy(() => import('../components/PrivacyPolicyPage'));
const TermsOfServicePage = React.lazy(() => import('../components/TermsOfServicePage'));
const NotFoundPage = React.lazy(() => import('../components/NotFoundPage'));
const SearchPage = React.lazy(() => import('../components/SearchPage'));

/**
 * URL Yapısı:
 * 
 * / - Ana Sayfa
 * /hakkimizda - Hakkımızda
 * /hizmetler - Hizmetler
 * /sss - SSS
 * /iletisim - İletişim
 * /kariyer - Kariyer
 * /blog - Blog
 * /kampanyalar - Kampanyalar
 * /kampanya/:id - Kampanya Detay
 * 
 * /giris/musteri - Müşteri Girişi
 * /giris/partner - Partner Girişi
 * /partner/kayit - Partner Kayıt
 * /partner - Partner Dashboard
 * 
 * /musteri/profil - Müşteri Profili
 * /musteri/teklifler - Müşteri Teklifleri
 * 
 * /teklif - Teklif Sihirbazı
 * /liste - Hizmet Listesi
 * /hizmet/:id - Hizmet Sağlayıcı Detay
 * 
 * /admin/giris - Admin Girişi
 * /admin - Admin Dashboard
 * /admin/sistem-loglari - Sistem Logları
 * 
 * /bildirim-test - Bildirim Test (Internal)
 * /gizlilik-politikasi - Gizlilik Politikası
 * /kullanim-kosullari - Kullanım Koşulları
 */

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/hakkimizda',
    element: <AboutPage />,
  },
  {
    path: '/hizmetler',
    element: <ServicesPage />,
  },
  {
    path: '/sss',
    element: <FAQPage />,
  },
  {
    path: '/iletisim',
    element: <ContactPage />,
  },
  {
    path: '/kariyer',
    element: <CareerPage />,
  },
  {
    path: '/blog',
    element: <BlogPage />,
  },
  {
    path: '/kampanyalar',
    element: <CampaignsPage />,
  },
  {
    path: '/kampanya/:id',
    element: <CampaignDetailPage />,
  },
  
  // Search & Panic Mode
  {
    path: '/arama',
    element: <SearchPage />,
  },
  
  // Auth & Registration
  {
    path: '/giris/musteri',
    element: <LoginPage userType="customer" />,
  },
  {
    path: '/giris/partner',
    element: <LoginPage userType="partner" />,
  },
  {
    path: '/partner/kayit',
    element: <PartnerRegisterPage />,
  },
  
  // Partner Dashboard
  {
    path: '/partner',
    element: <PartnerDashboard />,
  },
  
  // Customer
  {
    path: '/musteri/profil',
    element: <CustomerProfilePage />,
  },
  {
    path: '/musteri/teklifler',
    element: <OffersPanel />,
  },
  
  // Quote & Listing
  {
    path: '/teklif',
    element: <QuoteWizard />,
  },
  {
    path: '/liste',
    element: <ListingPage />,
  },
  {
    path: '/hizmet/:id',
    element: <ProviderDetailPage />,
  },
  
  // Admin
  {
    path: '/admin/giris',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: <AdminDashboard />,
  },
  {
    path: '/admin/sistem-loglari',
    element: <AdminSystemLogs />,
  },
  
  // Special Pages
  {
    path: '/bildirim-test',
    element: <NotificationTestPage />,
  },
  {
    path: '/gizlilik-politikasi',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/kullanim-kosullari',
    element: <TermsOfServicePage />,
  },
  
  // 404 - Must be last
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
