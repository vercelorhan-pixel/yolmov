
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, List, History, Wallet, Settings, LogOut, 
  Bell, ChevronRight, MapPin, Clock, DollarSign, CheckCircle, 
  XCircle, Navigation, Phone, User, Shield, Filter, ArrowRight, Map,
  Camera, MessageSquare, AlertTriangle, Check, Coins, Lock, Unlock,
  Loader2, FileText, Download, Search, Calendar, ChevronDown, X,
  Receipt, Eye, EyeOff, ShieldAlert, TrendingUp, ArrowUpRight, 
  ArrowDownLeft, CreditCard, Banknote, Landmark, Copy, PieChart, Info,
  UserCog, FileCheck, Upload, Trash2, Save, Briefcase, Mail,
  Truck, Headphones, Plus, PenTool, Wrench, LifeBuoy, Route, MoreHorizontal,
  Grid, LayoutList, Zap, Send, Star, ThumbsUp, ThumbsDown, Building, ShieldCheck, 
  CheckCircle2, HelpCircle, Edit2, AlertCircle, Store, Menu, Home
} from 'lucide-react';
import { JobRequest, Request, CompletedJob, PartnerVehicle } from '../types';
import { CITIES_WITH_DISTRICTS } from '../constants';
import { supabaseApi, authApi, supabase } from '../services/supabaseApi';
import { requestNotificationPermission, saveFCMToken } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import PartnerOfferHistory from './PartnerOfferHistory';
import PartnerPayments from './PartnerPayments';
import PartnerDocuments from './PartnerDocuments';
import ServiceAreasManager from './partner/ServiceAreasManager';
import ReturnRoutesManager from './partner/ReturnRoutesManager';
import PartnerShowcaseTab from './partner/PartnerShowcaseTab';
import PartnerCallHistory from './partner/PartnerCallHistory';
import PartnerFleetTab from './partner/PartnerFleetTab';
import PartnerReviewsTab from './partner/PartnerReviewsTab';
import PartnerSupportTab from './partner/PartnerSupportTab';
import PartnerHomeTab from './partner/PartnerHomeTab';
import PartnerWalletTab from './partner/PartnerWalletTab';
import PartnerHistoryTab from './partner/PartnerHistoryTab';
import PartnerAcceptedJobsTab from './partner/PartnerAcceptedJobsTab';
import PartnerMyOffersTab from './partner/PartnerMyOffersTab';
import PartnerServiceRoutesTab from './partner/PartnerServiceRoutesTab';
import PartnerNewJobsTab from './partner/PartnerNewJobsTab';
import PartnerSettingsTab, { SettingsSubTab } from './partner/PartnerSettingsTab';
import PartnerMessagesInbox from './partner/PartnerMessagesInbox';
import { compressImage, isImageFile, createPreviewUrl } from '../utils/imageCompression';
import Toast from './shared/Toast';
import { useToast } from '../utils/useToast';

// Transactions will be loaded from Supabase

const CREDIT_PACKAGES = [
  { id: 1, credits: 10, price: 150, label: 'Başlangıç', recommended: false },
  { id: 2, credits: 50, price: 600, label: 'Profesyonel', recommended: true },
  { id: 3, credits: 100, price: 1000, label: 'Avantajlı', recommended: false },
];

// Fleet data will be loaded from Supabase

// Support tickets will be loaded from Supabase

// Empty truck routes will be loaded from Supabase

const POSITIVE_RATING_TAGS = [
  'Kibar Müşteri', 'Sorunsuz Ödeme', 'Bahşiş Bıraktı', 'Konum Doğruydu', 'Anlayışlı', 'İletişim Kolaydı'
];

const NEGATIVE_RATING_TAGS = [
  'İletişim Zor', 'Geç Geldi', 'Ödeme Sorunu', 'Konum Hatalı', 'Kaba Davranış', 'Bekletti'
];

// Reviews will be loaded from Supabase

const PartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast: newToast, showToast: showNewToast, hideToast: hideNewToast } = useToast();
  
  // Get partner info from localStorage
  const partnerData = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
  const CURRENT_PARTNER_ID = partnerData.id || partnerData.partner_id || '';
  const CURRENT_PARTNER_NAME = partnerData.company_name || partnerData.name || 'Partner';
  const CURRENT_PARTNER_PHONE = partnerData.phone || '';
  const CURRENT_PARTNER_EMAIL = partnerData.email || '';
  const CURRENT_PARTNER_RATING = partnerData.rating || 0;
  
  // All hooks must be at the top before any conditional returns
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [accessChecked, setAccessChecked] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<'active' | 'pending' | 'suspended' | undefined>(undefined);
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [activeJob, setActiveJob] = useState<JobRequest | null>(null);
  
  // Mobile Menu State
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Credit & Unlock System State
  const [credits, setCredits] = useState(0); // Will be loaded from Supabase
  const [unlockedJobs, setUnlockedJobs] = useState<string[]>([]);

  // Navigation & Location State
  const [testLocation, setTestLocation] = useState({ lat: 41.0082, lng: 28.9784, name: 'Taksim Meydanı, İstanbul' }); // Test konumu
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [navigationStarted, setNavigationStarted] = useState(false);

  // Quote / Offer State
  const [selectedJobForQuote, setSelectedJobForQuote] = useState<JobRequest | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  
  const [offeringJobId, setOfferingJobId] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

   // Customer Requests (B2C) offer flow demo
   const DEMO_CUSTOMER_ID = 'demo-customer';
   const [customerRequests, setCustomerRequests] = useState<Request[]>([]);
   const [selectedRequestForOffer, setSelectedRequestForOffer] = useState<Request | null>(null);
   const [offerPrice, setOfferPrice] = useState('');
   const [offerEta, setOfferEta] = useState('');
   const [offerMessage, setOfferMessage] = useState('');
   const [myOffers, setMyOffers] = useState<any[]>([]); // Partner'ın gönderdiği teklifler
   const [showOfferSuccessModal, setShowOfferSuccessModal] = useState(false);
   const [lastCreatedOffer, setLastCreatedOffer] = useState<any>(null);
   const [acceptedJobs, setAcceptedJobs] = useState<Request[]>([]); // Kabul edilmiş, başlatılmamış işler
   
   // Partner Service Areas - Hizmet Bölgeleri
   const [partnerServiceAreas, setPartnerServiceAreas] = useState<string[]>([]); // Partner'ın hizmet verdiği şehirler
   const [serviceAreasLoaded, setServiceAreasLoaded] = useState(false);
   
   // Toast Notification State
   const [toast, setToast] = useState<{
     show: boolean;
     type: 'success' | 'error' | 'info';
     title: string;
     message: string;
   }>({ show: false, type: 'info', title: '', message: '' });

  // Active Job Workflow State
  const [jobStage, setJobStage] = useState<0 | 1 | 2 | 3 | 4>(0); 
  const [hasStartProof, setHasStartProof] = useState(false);
  const [hasEndProof, setHasEndProof] = useState(false);
  const [startProofImage, setStartProofImage] = useState<File | null>(null);
  const [endProofImage, setEndProofImage] = useState<File | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  // Rating State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Review Objection State
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [showObjectionPage, setShowObjectionPage] = useState(false); // Tam sayfa modu için
  const [objectionReason, setObjectionReason] = useState('');
  const [objectionDetails, setObjectionDetails] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null); // Yıldız filtresi için

  // Filter State
  const [filterMode, setFilterMode] = useState<'all' | 'nearest' | 'highest_price' | 'urgent'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // History State
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('month');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<CompletedJob | null>(null);
  const [partnerHistory, setPartnerHistory] = useState<CompletedJob[]>([]);

  // Wallet State
  const [walletFilter, setWalletFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Settings State
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('profile');
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);
  const [isCompressingProfile, setIsCompressingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string>('');
  const [existingProfilePhotoUrl, setExistingProfilePhotoUrl] = useState<string>('');
  
  // Settings Form State
  const [partnerFormData, setPartnerFormData] = useState({
    company_name: '',
    tax_number: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Password Change State
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Company Info State
  const [companyFormData, setCompanyFormData] = useState({
    trade_registry_number: '',
    mersis_no: '',
    tax_office: '',
    sector: '',
    foundation_year: new Date().getFullYear(),
  });
  const [isSavingCompanyInfo, setIsSavingCompanyInfo] = useState(false);
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false);

  // Contact Info State
  const [contactFormData, setContactFormData] = useState({
    authorized_person: '',
    mobile_phone: '',
    landline_phone: '',
    emergency_phone: '',
    business_address: '',
  });
  const [isSavingContactInfo, setIsSavingContactInfo] = useState(false);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);

  // Services State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSavingServices, setIsSavingServices] = useState(false);

  // Vehicle Add Modal State
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: '',
    driver: '',
    // Showcase fields
    showcase_capacity: '',
    showcase_insurance_type: '',
    showcase_equipment: [] as string[],
    showcase_description: '',
    is_showcase_vehicle: false,
  });
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [vehicleFrontPhoto, setVehicleFrontPhoto] = useState<File | null>(null);
  const [vehicleSidePhoto, setVehicleSidePhoto] = useState<File | null>(null);
  const [vehicleBackPhoto, setVehicleBackPhoto] = useState<File | null>(null);
  const [isCompressingVehicleFront, setIsCompressingVehicleFront] = useState(false);
  const [isCompressingVehicleSide, setIsCompressingVehicleSide] = useState(false);
  const [isCompressingVehicleBack, setIsCompressingVehicleBack] = useState(false);

  // Vehicle Edit State
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // Araç açıklama validasyon fonksiyonu
  const validateVehicleDescription = (text: string): string => {
    // Telefon numarası pattern'leri (5xx xxx xx xx, 0xxx xxx xx xx, +90, vb.)
    const phonePattern = /(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}|\d{4}\s?\d{3}\s?\d{2}\s?\d{2}/g;
    
    // E-mail pattern
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // URL pattern (http, https, www)
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|tr|io|co|info|biz|edu|gov)[^\s]*)/g;
    
    // Sosyal medya kullanıcı adı pattern (@username)
    const socialPattern = /@[a-zA-Z0-9_]+/g;
    
    let cleanedText = text;
    
    // Tespit edilen kalıpları temizle
    if (phonePattern.test(cleanedText)) {
      cleanedText = cleanedText.replace(phonePattern, '[telefon kaldırıldı]');
    }
    if (emailPattern.test(cleanedText)) {
      cleanedText = cleanedText.replace(emailPattern, '[e-mail kaldırıldı]');
    }
    if (urlPattern.test(cleanedText)) {
      cleanedText = cleanedText.replace(urlPattern, '[link kaldırıldı]');
    }
    if (socialPattern.test(cleanedText)) {
      cleanedText = cleanedText.replace(socialPattern, '[kullanıcı adı kaldırıldı]');
    }
    
    return cleanedText;
  };

  // Document Upload Modal State
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState<string | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  // Document Detail Modal State
  const [showDocumentDetailModal, setShowDocumentDetailModal] = useState(false);
  const [selectedDocumentDetail, setSelectedDocumentDetail] = useState<{
    title: string;
    type: string;
    status: 'uploaded' | 'pending' | 'not_uploaded';
    uploadDate?: string;
    expiryDate?: string;
    fileSize?: string;
    fileName?: string;
    count?: number;
  } | null>(null);

  // Support State - Yeni Talep Oluşturma
  const [showNewTicketPage, setShowNewTicketPage] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // Fleet State - Yeni Araç Ekleme
  const [showNewVehiclePage, setShowNewVehiclePage] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [fleet, setFleet] = useState<any[]>([]);
  const [selectedVehicleForSettings, setSelectedVehicleForSettings] = useState<any>(null);
  const [showVehicleEditPage, setShowVehicleEditPage] = useState(false);
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState<any>(null);
  const [vehicleStats, setVehicleStats] = useState<{
    totalJobs: number;
    monthlyJobs: number;
    averageRating: number;
    totalEarnings: number;
  } | null>(null);
  const [loadingVehicleStats, setLoadingVehicleStats] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedReviewForObjection, setSelectedReviewForObjection] = useState<any>(null);

  // Document Upload Handler
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDocType) {
      setDocumentUploadError('Lütfen önce belge türünü seçin.');
      return;
    }
    if (!e.target.files || !e.target.files.length) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setDocumentUploadError('Dosya boyutu 5MB\'den büyük olamaz.');
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
      return;
    }
    
    setUploadingDocument(true);
    setDocumentUploadError(null);
    
    try {
      let finalFile = file;
      
      // Eğer görsel dosyası ise sıkıştır
      if (isImageFile(file)) {
        const result = await compressImage(file);
        finalFile = result.compressedFile;
        console.log(`📄 Belge sıkıştırıldı: ${result.compressionRatio.toFixed(1)}% küçültüldü`);
      }
      
      const partnerData = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
      const partnerId = partnerData.id || '';
      
      // Belge türü mapping
      const docTypeMap: Record<string, 'license' | 'insurance' | 'registration' | 'tax' | 'identity'> = {
        'K1/K2 Belgesi': 'license',
        'K1 Belgesi': 'license',
        'K2 Belgesi': 'license',
        'Kasko Poliçesi': 'insurance',
        'Trafik Sigortası': 'insurance',
        'Araç Ruhsatı': 'registration',
        'Vergi Levhası': 'tax',
        'Kimlik Fotokopisi': 'identity',
        'Ehliyet Fotokopisi': 'identity'
      };
      
      const documentType = docTypeMap[selectedDocType] || 'registration';
      
      // Supabase Storage'a yükle
      const uploadResult = await supabaseApi.storage.uploadPartnerDocument(
        finalFile,
        partnerId,
        null, // request_id yok, partner belgesi
        documentType
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error('Belge yüklenemedi');
      }

      // Belgeyi veritabanına kaydet
      await supabaseApi.documents.create({
        partnerId: partnerId,
        partnerName: partnerData.name || CURRENT_PARTNER_NAME,
        type: documentType,
        fileName: finalFile.name,
        fileData: uploadResult.url,
        fileSize: finalFile.size,
        status: 'pending'
      });
      
      console.log('📄 [PartnerDashboard] Document uploaded:', uploadResult.url);
      
      showNewToast(`${selectedDocType} yüklendi! Admin onayına gönderildi.`, 'success');
      setUploadingDocument(false);
      setShowDocumentUploadModal(false);
      setSelectedDocType('');
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    } catch (error) {
      console.error('❌ Belge yükleme hatası:', error);
      setDocumentUploadError('Belge yüklenirken hata oluştu. Lütfen tekrar deneyin.');
      setUploadingDocument(false);
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    }
  };
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleDriver, setVehicleDriver] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [isCompressingVehicle, setIsCompressingVehicle] = useState(false);

  // Route / Empty Leg State
  const [activeRoutes, setActiveRoutes] = useState<any[]>([]);
  
  // Route Autocomplete States
  const [routeOrigin, setRouteOrigin] = useState('');
  const [originSearch, setOriginSearch] = useState('');
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  
  const [routeDestinations, setRouteDestinations] = useState<string[]>([]);
  const [destSearch, setDestSearch] = useState('');
  const [isDestOpen, setIsDestOpen] = useState(false);
  
  const [routeDate, setRouteDate] = useState('');
  const [routeTime, setRouteTime] = useState('');
  
  const [routeVehicle, setRouteVehicle] = useState('');
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);
  
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);

  // Empty Trucks State
  const [emptyTruckType, setEmptyTruckType] = useState<'intercity' | 'intracity'>('intercity');
  const [showMatchesModal, setShowMatchesModal] = useState(false);
  const [selectedTruckForMatches, setSelectedTruckForMatches] = useState<any | null>(null);
  const [emptyTruckOrigin, setEmptyTruckOrigin] = useState('');
  const [emptyTruckDestination, setEmptyTruckDestination] = useState('');
  const [emptyTruckDate, setEmptyTruckDate] = useState('');
  const [emptyTruckTime, setEmptyTruckTime] = useState('');
  const [emptyTruckVehicle, setEmptyTruckVehicle] = useState('');
  const [emptyTrucks, setEmptyTrucks] = useState<any[]>([]);

  // New Jobs State
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobRequest | null>(null);
  const [newJobsFilter, setNewJobsFilter] = useState<'all' | 'nearest' | 'urgent'>('all');

  // Notification Preferences State
  const [notificationPreferences, setNotificationPreferences] = useState({
    // Yeni İş Talepleri
    new_job_push_enabled: true,
    new_job_sms_enabled: true,
    new_job_email_enabled: false,
    // Teklif Kabul/Red
    offer_status_push_enabled: true,
    offer_status_sms_enabled: false,
    offer_status_email_enabled: false,
    // Ödeme & Cüzdan
    payment_push_enabled: true,
    payment_email_enabled: true,
    // Sesli Arama
    voice_call_push_enabled: true,
    voice_call_sms_enabled: false,
    // Genel
    all_notifications_enabled: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00:00',
    quiet_hours_end: '08:00:00',
  });
  const [isSavingNotificationPrefs, setIsSavingNotificationPrefs] = useState(false);
  const [notificationPrefsLoaded, setNotificationPrefsLoaded] = useState(false);

  const cityList = Object.keys(CITIES_WITH_DISTRICTS);

  // Partner panelindeyiz - diğer rol oturumlarını temizle (çakışmayı önle)
  useEffect(() => {
    if (CURRENT_PARTNER_ID) {
      localStorage.removeItem('yolmov_admin');
      localStorage.removeItem('yolmov_customer');
      localStorage.removeItem('yolmov_anonymous_caller_id');
      console.log('🔐 [PartnerDashboard] Cleared other role sessions, partner active');
    }
  }, [CURRENT_PARTNER_ID]);

  // URL yönetimi için useEffect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  // Tab değiştiğinde URL'i güncelle
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  // Partner form verilerini localStorage'dan yükle
  useEffect(() => {
    if (!CURRENT_PARTNER_ID) {
      console.warn('⚠️ Partner ID not found in localStorage');
      return;
    }

    const loadedPartnerData = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
    
    setPartnerFormData({
      company_name: loadedPartnerData.company_name || loadedPartnerData.name || '',
      tax_number: loadedPartnerData.tax_number || '',
      email: loadedPartnerData.email || '',
      phone: loadedPartnerData.phone || '',
      address: loadedPartnerData.address || '',
    });

    // Mevcut logo ve profil fotoğrafını yükle
    setExistingLogoUrl(loadedPartnerData.logo_url || '');
    setExistingProfilePhotoUrl(loadedPartnerData.profile_photo_url || '');

    // Company bilgilerini yükle
    setCompanyFormData({
      trade_registry_number: loadedPartnerData.trade_registry_number || '',
      mersis_no: loadedPartnerData.mersis_no || '',
      tax_office: loadedPartnerData.tax_office || '',
      sector: loadedPartnerData.sector || '',
      foundation_year: loadedPartnerData.foundation_year || new Date().getFullYear(),
    });

    // Contact bilgilerini yükle
    setContactFormData({
      authorized_person: loadedPartnerData.authorized_person || '',
      mobile_phone: loadedPartnerData.mobile_phone || loadedPartnerData.phone || '',
      landline_phone: loadedPartnerData.landline_phone || '',
      emergency_phone: loadedPartnerData.emergency_phone || '',
      business_address: loadedPartnerData.business_address || loadedPartnerData.address || '',
    });

    // Services'i yükle
    setSelectedServices(loadedPartnerData.service_types || []);
  }, [CURRENT_PARTNER_ID]);

  // Kredi bakiyesini yükle ve realtime güncelle
  useEffect(() => {
    console.log('🔍 [Credits] CURRENT_PARTNER_ID:', CURRENT_PARTNER_ID);
    console.log('🔍 [Credits] partnerData:', partnerData);
    
    if (!CURRENT_PARTNER_ID) {
      console.warn('⚠️ [Credits] Partner ID bulunamadı!');
      return;
    }
    
    const loadCredits = async () => {
      try {
        console.log('💰 [Credits] Loading credits for partner:', CURRENT_PARTNER_ID);
        const creditData = await supabaseApi.partnerCredits.getByPartnerId(CURRENT_PARTNER_ID);
        console.log('💰 [Credits] Response from API:', creditData);
        
        if (creditData) {
          setCredits(creditData.balance || 0);
          console.log('✅ [Credits] Partner credits loaded:', creditData.balance);
        } else {
          console.warn('⚠️ [Credits] No credit data found for partner');
        }
      } catch (error) {
        console.error('❌ [Credits] Error loading credits:', error);
      }
    };
    
    loadCredits(); // İlk yükleme
    
    // Her 10 saniyede bir kredi güncellemelerini kontrol et
    const interval = setInterval(loadCredits, 10000);
    
    return () => clearInterval(interval);
  }, [CURRENT_PARTNER_ID]);

  // FCM Push Notification Token Kaydı - Partner login olduğunda
  useEffect(() => {
    if (!CURRENT_PARTNER_ID) return;
    
    const registerFCMToken = async () => {
      try {
        console.log('🔔 [FCM] Requesting notification permission for partner:', CURRENT_PARTNER_ID);
        const token = await requestNotificationPermission();
        
        if (token) {
          console.log('✅ [FCM] Token received, saving to database...');
          await saveFCMToken(CURRENT_PARTNER_ID, token);
          console.log('✅ [FCM] Token saved successfully');
        } else {
          console.warn('⚠️ [FCM] Permission denied or token not received');
        }
      } catch (error) {
        console.error('❌ [FCM] Error registering push notification:', error);
      }
    };
    
    // Biraz bekleyip FCM kaydını yap (sayfa yüklendikten sonra)
    const timeout = setTimeout(registerFCMToken, 2000);
    return () => clearTimeout(timeout);
  }, [CURRENT_PARTNER_ID]);

  // Bildirim Tercihlerini Yükle
  useEffect(() => {
    if (!CURRENT_PARTNER_ID || notificationPrefsLoaded) return;
    
    const loadNotificationPreferences = async () => {
      try {
        console.log('🔔 [Notifications] Loading preferences for partner:', CURRENT_PARTNER_ID);
        const { data, error } = await supabase
          .from('partner_notification_preferences')
          .select('*')
          .eq('partner_id', CURRENT_PARTNER_ID)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
          console.error('❌ [Notifications] Error loading preferences:', error);
          return;
        }
        
        if (data) {
          console.log('✅ [Notifications] Preferences loaded:', data);
          setNotificationPreferences({
            new_job_push_enabled: data.new_job_push_enabled ?? true,
            new_job_sms_enabled: data.new_job_sms_enabled ?? true,
            new_job_email_enabled: data.new_job_email_enabled ?? false,
            offer_status_push_enabled: data.offer_status_push_enabled ?? true,
            offer_status_sms_enabled: data.offer_status_sms_enabled ?? false,
            offer_status_email_enabled: data.offer_status_email_enabled ?? false,
            payment_push_enabled: data.payment_push_enabled ?? true,
            payment_email_enabled: data.payment_email_enabled ?? true,
            voice_call_push_enabled: data.voice_call_push_enabled ?? true,
            voice_call_sms_enabled: data.voice_call_sms_enabled ?? false,
            all_notifications_enabled: data.all_notifications_enabled ?? true,
            quiet_hours_enabled: data.quiet_hours_enabled ?? false,
            quiet_hours_start: data.quiet_hours_start ?? '22:00:00',
            quiet_hours_end: data.quiet_hours_end ?? '08:00:00',
          });
        } else {
          console.log('📝 [Notifications] No preferences found, creating defaults...');
          // Varsayılan tercihleri oluştur
          const { error: insertError } = await supabase
            .from('partner_notification_preferences')
            .insert([{ partner_id: CURRENT_PARTNER_ID }]);
          
          if (insertError) {
            console.error('❌ [Notifications] Error creating default preferences:', insertError);
          } else {
            console.log('✅ [Notifications] Default preferences created');
          }
        }
        
        setNotificationPrefsLoaded(true);
      } catch (error) {
        console.error('❌ [Notifications] Unexpected error:', error);
      }
    };
    
    loadNotificationPreferences();
  }, [CURRENT_PARTNER_ID, notificationPrefsLoaded]);

  // Araçları yükle
  useEffect(() => {
    if (!CURRENT_PARTNER_ID) return;
    
    const loadVehicles = async () => {
      try {
        const vehicles = await supabaseApi.partnerVehicles.getByPartnerId(CURRENT_PARTNER_ID);
        setFleet(vehicles);
      } catch (error) {
        console.error('Error loading vehicles:', error);
      }
    };
    loadVehicles();
  }, [CURRENT_PARTNER_ID]);

  // Belgeleri yükle
  useEffect(() => {
    if (!CURRENT_PARTNER_ID) return;
    
    const loadDocuments = async () => {
      setIsLoadingDocuments(true);
      try {
        const docs = await supabaseApi.partnerDocuments.getByPartnerId(CURRENT_PARTNER_ID);
        setDocuments(docs);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setIsLoadingDocuments(false);
      }
    };
    loadDocuments();
  }, [CURRENT_PARTNER_ID]);

  // Settings kaydetme fonksiyonu
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await supabaseApi.partners.update(CURRENT_PARTNER_ID, partnerFormData);
      // localStorage'ı güncelle
      const updatedPartner = { ...partnerData, ...partnerFormData };
      localStorage.setItem('yolmov_partner', JSON.stringify(updatedPartner));
      showNewToast('Bilgileriniz güncellendi!', 'success');
    } catch (error) {
      console.error('Settings save error:', error);
      alert('❌ Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Şifre değiştirme fonksiyonu
  const handlePasswordChange = async () => {
    // Validasyonlar
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      alert('⚠️ Lütfen tüm alanları doldurun.');
      return;
    }

    if (passwordFormData.newPassword.length < 8) {
      alert('⚠️ Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      alert('⚠️ Yeni şifreler eşleşmiyor!');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Supabase auth ile şifre güncelleme
      const { error } = await supabase.auth.updateUser({
        password: passwordFormData.newPassword
      });

      if (error) throw error;

      // Formu temizle
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      showNewToast('Şifreniz güncellendi!', 'success');
    } catch (error: any) {
      console.error('Password change error:', error);
      alert(`❌ Şifre değiştirme hatası: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Bildirim Tercihlerini Kaydet
  const handleSaveNotificationPreferences = async () => {
    if (!CURRENT_PARTNER_ID) {
      alert('❌ Partner ID bulunamadı.');
      return;
    }

    setIsSavingNotificationPrefs(true);
    try {
      console.log('🔔 [Notifications] Saving preferences for partner:', CURRENT_PARTNER_ID);
      console.log('📝 [Notifications] Data to save:', notificationPreferences);
      
      const { data, error } = await supabase
        .from('partner_notification_preferences')
        .upsert(
          {
            partner_id: CURRENT_PARTNER_ID,
            ...notificationPreferences,
          },
          {
            onConflict: 'partner_id',
          }
        )
        .select();

      if (error) {
        console.error('❌ [Notifications] Error saving preferences:', error);
        throw error;
      }

      console.log('✅ [Notifications] Preferences saved successfully:', data);
      showNewToast('Bildirim tercihleri kaydedildi!', 'success');
    } catch (error: any) {
      console.error('❌ [Notifications] Save error:', error);
      alert(`❌ Kaydetme hatası: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsSavingNotificationPrefs(false);
    }
  };

  // Şirket bilgilerini kaydetme fonksiyonu
  const handleSaveCompanyInfo = async () => {
    if (!isEditingCompanyInfo) {
      setIsEditingCompanyInfo(true);
      return;
    }

    setIsSavingCompanyInfo(true);
    try {
      await supabaseApi.partners.update(CURRENT_PARTNER_ID, companyFormData);
      // localStorage'ı güncelle
      const updatedPartner = { ...partnerData, ...companyFormData };
      localStorage.setItem('yolmov_partner', JSON.stringify(updatedPartner));
      setIsEditingCompanyInfo(false);
      showNewToast('Şirket bilgileriniz güncellendi!', 'success');
    } catch (error) {
      console.error('Company info save error:', error);
      alert('❌ Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSavingCompanyInfo(false);
    }
  };

  // Şirket bilgileri düzenlemeyi iptal et
  const handleCancelCompanyEdit = () => {
    setIsEditingCompanyInfo(false);
    // Form verilerini eski haline döndür
    const loadedPartnerData = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
    setCompanyFormData({
      trade_registry_number: loadedPartnerData.trade_registry_number || '',
      mersis_no: loadedPartnerData.mersis_no || '',
      tax_office: loadedPartnerData.tax_office || '',
      sector: loadedPartnerData.sector || '',
      foundation_year: loadedPartnerData.foundation_year || new Date().getFullYear(),
    });
  };

  // Profil bilgilerini kaydetme (Logo + Profil Fotoğrafı + Form Data)
  const handleSaveProfileSettings = async () => {
    if (!isEditingProfile) {
      setIsEditingProfile(true);
      return;
    }

    setIsSavingSettings(true);
    try {
      let logoUrl = existingLogoUrl;
      let profilePhotoUrl = existingProfilePhotoUrl;

      // Logo yüklenmişse Supabase'e upload et
      if (companyLogo) {
        const uploadResult = await supabaseApi.storage.uploadPartnerDocument(
          companyLogo,
          CURRENT_PARTNER_ID,
          null,
          'logo'
        );
        if (uploadResult.success && uploadResult.url) {
          logoUrl = uploadResult.url;
        }
      }

      // Profil fotoğrafı yüklenmişse Supabase'e upload et
      if (profilePhoto) {
        const uploadResult = await supabaseApi.storage.uploadPartnerDocument(
          profilePhoto,
          CURRENT_PARTNER_ID,
          null,
          'profile_photo'
        );
        if (uploadResult.success && uploadResult.url) {
          profilePhotoUrl = uploadResult.url;
        }
      }

      // Database'i güncelle
      await supabaseApi.partners.update(CURRENT_PARTNER_ID, {
        ...partnerFormData,
        logo_url: logoUrl,
        profile_photo_url: profilePhotoUrl,
      });

      // localStorage'ı güncelle
      const updatedPartner = {
        ...partnerData,
        ...partnerFormData,
        logo_url: logoUrl,
        profile_photo_url: profilePhotoUrl,
      };
      localStorage.setItem('yolmov_partner', JSON.stringify(updatedPartner));

      // State'i güncelle
      setExistingLogoUrl(logoUrl);
      setExistingProfilePhotoUrl(profilePhotoUrl);
      setCompanyLogo(null);
      setProfilePhoto(null);
      setIsEditingProfile(false);

      showNewToast('Profil bilgileriniz güncellendi!', 'success');
    } catch (error) {
      console.error('Profile save error:', error);
      alert('❌ Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Profil düzenlemeyi iptal et
  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setCompanyLogo(null);
    setProfilePhoto(null);
    
    // Form verilerini eski haline döndür
    const loadedPartnerData = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
    setPartnerFormData({
      company_name: loadedPartnerData.company_name || loadedPartnerData.name || '',
      tax_number: loadedPartnerData.tax_number || '',
      email: loadedPartnerData.email || '',
      phone: loadedPartnerData.phone || '',
      address: loadedPartnerData.address || '',
    });
  };

  // İletişim bilgilerini kaydetme fonksiyonu
  const handleSaveContactInfo = async () => {
    if (!isEditingContactInfo) {
      setIsEditingContactInfo(true);
      return;
    }

    setIsSavingContactInfo(true);
    try {
      await supabaseApi.partners.update(CURRENT_PARTNER_ID, contactFormData);
      // localStorage'ı güncelle
      const updatedPartner = { ...partnerData, ...contactFormData };
      localStorage.setItem('yolmov_partner', JSON.stringify(updatedPartner));
      setIsEditingContactInfo(false);
      showNewToast('İletişim bilgileriniz güncellendi!', 'success');
    } catch (error) {
      console.error('Contact info save error:', error);
      alert('❌ Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSavingContactInfo(false);
    }
  };

  // İletişim bilgileri düzenlemeyi iptal et
  const handleCancelContactEdit = () => {
    setIsEditingContactInfo(false);
    // Form verilerini eski haline döndür
    const loadedPartnerData = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
    setContactFormData({
      authorized_person: loadedPartnerData.authorized_person || '',
      mobile_phone: loadedPartnerData.mobile_phone || '',
      landline_phone: loadedPartnerData.landline_phone || '',
      emergency_phone: loadedPartnerData.emergency_phone || '',
      business_address: loadedPartnerData.business_address || '',
    });
  };

  // Hizmet ayarlarını kaydetme fonksiyonu
  const handleSaveServices = async () => {
    setIsSavingServices(true);
    try {
      await supabaseApi.partners.update(CURRENT_PARTNER_ID, { service_types: selectedServices });
      // localStorage'ı güncelle
      const updatedPartner = { ...partnerData, service_types: selectedServices };
      localStorage.setItem('yolmov_partner', JSON.stringify(updatedPartner));
      showNewToast('Hizmet ayarlarınız güncellendi!', 'success');
    } catch (error) {
      console.error('Services save error:', error);
      alert('❌ Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSavingServices(false);
    }
  };

  // Hizmet seçimi toggle fonksiyonu
  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  // Yeni araç ekleme fonksiyonu
  const handleAddVehicle = async () => {
    if (!newVehicleData.plate || !newVehicleData.brand || !newVehicleData.model || !newVehicleData.type) {
      alert('⚠️ Lütfen tüm zorunlu alanları doldurun (Plaka, Marka, Model, Tip).');
      return;
    }

    if (!vehicleFrontPhoto || !vehicleSidePhoto || !vehicleBackPhoto) {
      alert('⚠️ Lütfen araç görsellerini yükleyin (Ön, Yan, Arka).');
      return;
    }

    setIsAddingVehicle(true);
    try {
      // Görselleri Supabase Storage'a yükle
      const frontUpload = await supabaseApi.storage.uploadPartnerDocument(
        vehicleFrontPhoto,
        CURRENT_PARTNER_ID,
        null,
        `vehicle_photos/front`
      );

      const sideUpload = await supabaseApi.storage.uploadPartnerDocument(
        vehicleSidePhoto,
        CURRENT_PARTNER_ID,
        null,
        `vehicle_photos/side`
      );

      const backUpload = await supabaseApi.storage.uploadPartnerDocument(
        vehicleBackPhoto,
        CURRENT_PARTNER_ID,
        null,
        `vehicle_photos/back`
      );

      if (!frontUpload.success || !sideUpload.success || !backUpload.success) {
        throw new Error('Görsel yükleme başarısız oldu');
      }

      const vehicleData: any = {
        partner_id: CURRENT_PARTNER_ID,
        partner_name: CURRENT_PARTNER_NAME,
        plate_number: newVehicleData.plate,
        type: newVehicleData.type, // ✅ DB'de kolon adı 'type'
        brand: newVehicleData.brand,
        model: newVehicleData.model,
        year: newVehicleData.year,
        driver: newVehicleData.driver || CURRENT_PARTNER_NAME,
        status: 'active',
        registration_date: new Date().toISOString().split('T')[0],
        front_photo_url: frontUpload.url,
        side_photo_url: sideUpload.url,
        back_photo_url: backUpload.url,
        // Showcase fields
        showcase_capacity: newVehicleData.showcase_capacity || null,
        showcase_insurance_type: newVehicleData.showcase_insurance_type || null,
        showcase_equipment: newVehicleData.showcase_equipment || [],
        showcase_description: newVehicleData.showcase_description || null,
        is_showcase_vehicle: newVehicleData.is_showcase_vehicle || false,
      };

      console.log('🚗 Vehicle Data to be saved:', vehicleData);
      const newVehicle = await supabaseApi.partnerVehicles.create(vehicleData);
      console.log('✅ Vehicle created successfully:', newVehicle);
      setFleet([...fleet, newVehicle]);
      
      // Formu temizle ve modalı kapat
      setNewVehicleData({
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        type: '',
        driver: '',
        showcase_capacity: '',
        showcase_insurance_type: '',
        showcase_equipment: [],
        showcase_description: '',
        is_showcase_vehicle: false,
      });
      setVehicleFrontPhoto(null);
      setVehicleSidePhoto(null);
      setVehicleBackPhoto(null);
      setShowAddVehicleModal(false);
      
      showNewToast('Araç başarıyla eklendi!', 'success');
    } catch (error) {
      console.error('Vehicle add error:', error);
      alert('❌ Araç eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsAddingVehicle(false);
    }
  };

  // Araç ön görsel upload
  const handleVehicleFrontPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      alert('Lütfen sadece görsel dosyası yükleyin (JPG, PNG)');
      return;
    }

    try {
      setIsCompressingVehicleFront(true);
      const result = await compressImage(file);
      setVehicleFrontPhoto(result.compressedFile);
      showNewToast('Ön görsel işleniyor...', 'processing', 1500);
    } catch (error) {
      console.error('Front photo compression error:', error);
      alert('❌ Görsel işlenirken hata oluştu.');
    } finally {
      setIsCompressingVehicleFront(false);
    }
  };

  // Araç yan görsel upload
  const handleVehicleSidePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      alert('Lütfen sadece görsel dosyası yükleyin (JPG, PNG)');
      return;
    }

    try {
      setIsCompressingVehicleSide(true);
      const result = await compressImage(file);
      setVehicleSidePhoto(result.compressedFile);
      showNewToast('Yan görsel işleniyor...', 'processing', 1500);
    } catch (error) {
      console.error('Side photo compression error:', error);
      alert('❌ Görsel işlenirken hata oluştu.');
    } finally {
      setIsCompressingVehicleSide(false);
    }
  };

  // Araç arka görsel upload
  const handleVehicleBackPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      alert('Lütfen sadece görsel dosyası yükleyin (JPG, PNG)');
      return;
    }

    try {
      setIsCompressingVehicleBack(true);
      const result = await compressImage(file);
      setVehicleBackPhoto(result.compressedFile);
      showNewToast('Arka görsel işleniyor...', 'processing', 1500);
    } catch (error) {
      console.error('Back photo compression error:', error);
      alert('❌ Görsel işlenirken hata oluştu.');
    } finally {
      setIsCompressingVehicleBack(false);
    }
  };

  // Araç düzenleme fonksiyonu
  const handleEditVehicle = async () => {
    if (!editingVehicleId || !newVehicleData.plate || !newVehicleData.brand || !newVehicleData.model || !newVehicleData.type) {
      alert('⚠️ Lütfen tüm zorunlu alanları doldurun (Plaka, Marka, Model, Tip).');
      return;
    }

    setIsAddingVehicle(true);
    try {
      const vehicleData: any = {
        plate_number: newVehicleData.plate,
        type: newVehicleData.type,
        brand: newVehicleData.brand,
        model: newVehicleData.model,
        year: newVehicleData.year,
        driver: newVehicleData.driver || CURRENT_PARTNER_NAME,
        // Showcase fields
        showcase_capacity: newVehicleData.showcase_capacity || null,
        showcase_insurance_type: newVehicleData.showcase_insurance_type || null,
        showcase_equipment: newVehicleData.showcase_equipment || [],
        showcase_description: newVehicleData.showcase_description || null,
        is_showcase_vehicle: newVehicleData.is_showcase_vehicle || false,
      };

      // Yeni fotoğraflar yüklendiyse ekle
      if (vehicleFrontPhoto) {
        const frontUpload = await supabaseApi.storage.uploadPartnerDocument(
          vehicleFrontPhoto,
          CURRENT_PARTNER_ID,
          null,
          `vehicle_photos/front`
        );
        if (frontUpload.success) vehicleData.front_photo_url = frontUpload.url;
      }

      if (vehicleSidePhoto) {
        const sideUpload = await supabaseApi.storage.uploadPartnerDocument(
          vehicleSidePhoto,
          CURRENT_PARTNER_ID,
          null,
          `vehicle_photos/side`
        );
        if (sideUpload.success) vehicleData.side_photo_url = sideUpload.url;
      }

      if (vehicleBackPhoto) {
        const backUpload = await supabaseApi.storage.uploadPartnerDocument(
          vehicleBackPhoto,
          CURRENT_PARTNER_ID,
          null,
          `vehicle_photos/back`
        );
        if (backUpload.success) vehicleData.back_photo_url = backUpload.url;
      }

      console.log('📝 Updating vehicle:', editingVehicleId, vehicleData);
      const updatedVehicle = await supabaseApi.partnerVehicles.update(editingVehicleId, vehicleData);
      console.log('✅ Vehicle updated successfully:', updatedVehicle);
      
      // Fleet listesini güncelle
      setFleet(fleet.map(v => v.id === editingVehicleId ? updatedVehicle : v));
      
      // Formu temizle ve modalı kapat
      setNewVehicleData({
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        type: '',
        driver: '',
        showcase_capacity: '',
        showcase_insurance_type: '',
        showcase_equipment: [],
        showcase_description: '',
        is_showcase_vehicle: false,
      });
      setVehicleFrontPhoto(null);
      setVehicleSidePhoto(null);
      setVehicleBackPhoto(null);
      setEditingVehicleId(null);
      setShowEditVehicleModal(false);
      
      showNewToast('Araç güncellendi!', 'success');
    } catch (error) {
      console.error('Vehicle update error:', error);
      alert('❌ Araç güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsAddingVehicle(false);
    }
  };

  // Refs for click-outside detection in Custom Dropdowns
  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const vehicleRef = useRef<HTMLDivElement>(null);

  // Access check effect
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const role = await authApi.getUserRole();
        if (role?.type === 'partner') {
          setPartnerStatus((role.status as any) || 'pending');
        } else {
          setPartnerStatus(undefined);
        }
      } catch (e) {
        setPartnerStatus(undefined);
      } finally {
        setAccessChecked(true);
      }
    };
    checkAccess();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setIsOriginOpen(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setIsDestOpen(false);
      }
      if (vehicleRef.current && !vehicleRef.current.contains(event.target as Node)) {
        setIsVehicleOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Partner'ın hizmet bölgelerini yükle
  useEffect(() => {
    const loadServiceAreas = async () => {
      if (!CURRENT_PARTNER_ID) return;
      
      try {
        const areas = await supabaseApi.serviceAreas.getByPartnerId(CURRENT_PARTNER_ID);
        if (areas && areas.length > 0) {
          // Sadece aktif bölgelerdeki şehirleri al
          const cities = areas
            .filter(area => area.isActive !== false)
            .map(area => area.city);
          setPartnerServiceAreas([...new Set(cities)]); // Unique şehirler
          console.log('📍 [PartnerDashboard] Loaded service areas:', cities);
        } else {
          // Hizmet bölgesi tanımlı değilse, partner'ın kendi şehrini kullan
          const partnerCity = partnerData.city || partnerData.sehir;
          if (partnerCity) {
            setPartnerServiceAreas([partnerCity]);
            console.log('📍 [PartnerDashboard] Using partner city as service area:', partnerCity);
          } else {
            console.warn('⚠️ [PartnerDashboard] No service areas found for partner');
          }
        }
        setServiceAreasLoaded(true);
      } catch (error) {
        console.error('Error loading service areas:', error);
        setServiceAreasLoaded(true);
      }
    };
    
    loadServiceAreas();
  }, [CURRENT_PARTNER_ID]);

  // Load open customer requests filtered by partner's service areas
  // Real-time subscription ile anlık güncelleme
  useEffect(() => {
    // Service areas yüklenene kadar bekle
    if (!serviceAreasLoaded) return;
    
    const loadRequests = async () => {
      try {
        let reqs: Request[];
        
        if (partnerServiceAreas.length > 0) {
          // Partner'ın hizmet bölgelerine göre filtrelenmiş talepleri getir
          reqs = await supabaseApi.requests.getOpenByServiceAreas(partnerServiceAreas);
          console.log(`🔄 [PartnerDashboard] Loaded ${reqs.length} requests for service areas:`, partnerServiceAreas);
        } else {
          // Hizmet bölgesi tanımlı değilse tüm talepleri göster (uyarı ile)
          reqs = await supabaseApi.requests.getOpen();
          console.warn('⚠️ [PartnerDashboard] No service areas defined, showing all requests:', reqs.length);
        }
        
        setCustomerRequests(reqs);
      } catch (error) {
        console.error('Error loading requests:', error);
      }
    };
    
    loadRequests();
    
    // Polling için interval (gerçek zamanlı güncelleme için)
    const interval = setInterval(loadRequests, 30000); // 30 saniyede bir
    
    return () => {
      clearInterval(interval);
    };
  }, [serviceAreasLoaded, partnerServiceAreas]);

  // Partner'ın gönderdiği teklifleri yükle
  const loadMyOffers = async () => {
    if (!CURRENT_PARTNER_ID) return;
    
    try {
      const offers = await supabaseApi.offers.getByPartnerId(CURRENT_PARTNER_ID);
      setMyOffers(offers);
      console.log('📨 [PartnerDashboard] Loaded partner offers:', offers.length);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  // Partner'a yapılan değerlendirmeleri yükle
  const loadReviews = async () => {
    if (!CURRENT_PARTNER_ID) return;
    
    try {
      const partnerReviews = await supabaseApi.partnerReviews.getByPartnerId(CURRENT_PARTNER_ID);
      if (partnerReviews && Array.isArray(partnerReviews)) {
        // DB'den gelen veriyi UI formatına dönüştür
        const formattedReviews = partnerReviews.map((r: any) => ({
          id: r.id,
          jobId: r.jobId,
          customerName: r.customerName || 'Müşteri',
          customerPhone: r.customerPhone || '',
          rating: r.rating,
          comment: r.comment || '',
          tags: r.tags || [],
          service: r.service || 'Çekici Hizmeti',
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('tr-TR') : ''
        }));
        setReviews(formattedReviews);
        console.log('⭐ [PartnerDashboard] Loaded reviews:', formattedReviews.length);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  // Kabul edilmiş işleri yükle (matched status, job_stage = 0)
  const loadAcceptedJobs = async () => {
    if (!CURRENT_PARTNER_ID) return;
    
    try {
      const partner = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
      const allRequests = await supabaseApi.requests.getByPartnerId(partner.id);
      
      if (allRequests && Array.isArray(allRequests)) {
        // Status=matched ve job_stage=0 olan işleri filtrele (kabul edilmiş ama henüz başlatılmamış)
        const accepted = allRequests.filter((r: Request) => 
          r.status === 'matched' && (r.jobStage === 0 || r.jobStage === null)
        );
        setAcceptedJobs(accepted);
        console.log('✅ [PartnerDashboard] Loaded accepted jobs:', accepted.length);
      }
    } catch (error) {
      console.error('Error loading accepted jobs:', error);
    }
  };

  // Teklifleri ilk yüklemede ve periyodik olarak yükle
  useEffect(() => {
    loadMyOffers();
    loadAcceptedJobs(); // Kabul edilmiş işleri de yükle
    loadReviews(); // Değerlendirmeleri yükle
    
    // Her 15 saniyede bir teklifleri ve kabul edilmiş işleri güncelle
    const interval = setInterval(() => {
      loadMyOffers();
      loadAcceptedJobs();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [CURRENT_PARTNER_ID]);

  // Real-time bildirim sistemi - Teklif kabul/red edildiğinde
  useEffect(() => {
    if (!CURRENT_PARTNER_ID) return;

    console.log('🔔 [Notifications] Setting up real-time offer notifications for partner:', CURRENT_PARTNER_ID);

    // Supabase real-time subscription
    const channel = supabase
      .channel('partner-offers-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'offers',
          filter: `partner_id=eq.${CURRENT_PARTNER_ID}`
        },
        (payload) => {
          console.log('🔔 [Notifications] Offer status changed:', payload);
          
          const newOffer = payload.new as any;
          const oldOffer = payload.old as any;
          
          // Durum değişikliğini kontrol et
          if (oldOffer.status !== newOffer.status) {
            if (newOffer.status === 'accepted') {
              // TEKLİF KABUL EDİLDİ!
              showOfferAcceptedNotification(newOffer);
              playNotificationSound();
            } else if (newOffer.status === 'rejected') {
              // Teklif reddedildi
              showOfferRejectedNotification(newOffer);
            }
            
            // Listeyi yenile
            loadMyOffers();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 [Notifications] Unsubscribing from real-time notifications');
      supabase.removeChannel(channel);
    };
  }, [CURRENT_PARTNER_ID]);

  // Bildirim gösterme fonksiyonları
  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 5000); // 5 saniye sonra kapat
  };

  const showOfferAcceptedNotification = (offer: any) => {
    // Toast göster
    showToast(
      'success',
      '🎉 Teklif Kabul Edildi!',
      `₺${offer.price} tutarındaki teklifiniz kabul edildi. Hemen yola çıkabilirsiniz!`
    );

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🎉 Teklif Kabul Edildi!', {
        body: `₺${offer.price} tutarındaki teklifiniz kabul edildi. Hemen yola çıkabilirsiniz!`,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `offer-${offer.id}`,
        requireInteraction: true,
      });
      
      notification.onclick = () => {
        window.focus();
        setActiveTab('offers');
        notification.close();
      };
    }
  };

  const showOfferRejectedNotification = (offer: any) => {
    // Toast göster
    showToast(
      'error',
      '❌ Teklif Reddedildi',
      `₺${offer.price} tutarındaki teklifiniz reddedildi. Başka işlere teklif verebilirsiniz.`
    );

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('❌ Teklif Reddedildi', {
        body: `₺${offer.price} tutarındaki teklifiniz reddedildi.`,
        icon: '/logo.png',
        tag: `offer-${offer.id}`,
      });
    }
  };

  // Bildirim sesi çalma
  const playNotificationSound = () => {
    try {
      // Başarı sesi için HTML5 Audio API
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRA0OVqzn7a5aFgpDm9/0wmwiBjSD0PPYiTcIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606OynVRQKRp/g8r5sIQUxh9Hz04IzBh5uw+/jmUQNDlas5+2uWhYKQ5vf9MJsIgY0g9Dz2Ik3CBlou+3nn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBACA==');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Sound play error:', err));
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  // Browser notification izni iste (component mount olduğunda)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📱 Notification permission:', permission);
      });
    }
  }, []);

  // Teklifi iptal et
  const handleCancelOffer = async (offerId: string) => {
    if (!confirm('Bu teklifi iptal etmek istediğinizden emin misiniz?')) return;
    
    try {
      await supabaseApi.offers.update(offerId, { status: 'withdrawn' });
      showNewToast('Teklif iptal edildi.', 'success');
      loadMyOffers(); // Listeyi yenile
    } catch (error) {
      console.error('Error canceling offer:', error);
      alert('❌ Teklif iptal edilirken hata oluştu.');
    }
  };

  // Aktif işin iptal edilip edilmediğini kontrol et
  useEffect(() => {
    if (!activeJob || !(activeJob as any)._originalRequest) return;
    
    const checkActiveJobStatus = async () => {
      const originalRequest = (activeJob as any)._originalRequest as Request;
      
      try {
        const result = await supabaseApi.requests.getById(originalRequest.id);
        if (!result || result.status === 'cancelled') {
          if (result?.status === 'cancelled') {
            alert('⚠️ Müşteri bu işi iptal etti!');
            setActiveJob(null);
            setActiveTab('requests');
            setJobStage(0);
          }
        }
      } catch (error) {
        console.error('Error checking job status:', error);
      }
    };
    
    const interval = setInterval(checkActiveJobStatus, 5000); // 5 saniyede bir
    return () => clearInterval(interval);
  }, [activeJob]);
  
  // Partner geçmiş işlerini yükle
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const partner = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
        const result = await supabaseApi.requests.getByPartnerId(partner.id);
        if (result && Array.isArray(result)) {
          // Tamamlanmış işleri filtrele
          const completedJobs = result.filter((r: Request) => r.status === 'completed');
          setPartnerHistory(completedJobs as any[]);
          console.log('📋 [PartnerDashboard] Loaded partner history:', completedJobs.length);
        }
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };
    
    loadHistory(); // İlk yükleme
    
    // İş tamamlandığında yenilemek için 30 saniyede bir kontrol
    const interval = setInterval(loadHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  // Araç istatistiklerini yükle
  useEffect(() => {
    const loadVehicleStats = async () => {
      if (selectedVehicleForSettings && showVehicleEditPage) {
        setLoadingVehicleStats(true);
        try {
          const stats = await supabaseApi.partnerVehicles.getVehicleStats(
            selectedVehicleForSettings.plate_number,
            CURRENT_PARTNER_ID
          );
          setVehicleStats(stats);
          console.log('📊 [Vehicle Stats]', stats);
        } catch (error) {
          console.error('Error loading vehicle stats:', error);
        } finally {
          setLoadingVehicleStats(false);
        }
      }
    };

    loadVehicleStats();
  }, [selectedVehicleForSettings, showVehicleEditPage]);

  // Early returns after all hooks
  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 text-sm">Erişim kontrolü yapılıyor...</div>
      </div>
    );
  }

  // Partner ID yoksa login'e yönlendir
  if (!CURRENT_PARTNER_ID) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Oturum Bulunamadı</h2>
          <p className="text-sm text-slate-600 mb-6">
            Partner bilgileriniz yüklenemedi. Lütfen tekrar giriş yapın.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('yolmov_partner');
              navigate('/partner/login');
            }}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  if (partnerStatus && partnerStatus !== 'active') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-yellow-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Hesabınız İnceleniyor</h2>
          <p className="text-sm text-slate-600 mb-4">
            Başvurunuz alınmıştır. Operasyon ekibimiz en kısa sürede değerlendirecektir. Durumunuz: <span className="font-bold">{partnerStatus}</span>.
          </p>
          <button
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold"
            onClick={() => navigate('/')}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  // Filter Logic
  const filteredRequests = requests.filter(req => {
    if (filterMode === 'urgent') return req.urgency === 'high';
    return true;
  }).sort((a, b) => {
    if (filterMode === 'highest_price') return b.price - a.price;
    if (filterMode === 'nearest') return parseFloat(a.distance) - parseFloat(b.distance);
    return 0;
  });

  const filteredHistory = partnerHistory.filter(item => 
    (item.id.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.customerName.toLowerCase().includes(historySearch.toLowerCase())) &&
    item.status === 'completed'
  );

  // Toast notification render
  const renderToast = () => {
    if (!toast.show) return null;

    const bgColors = {
      success: 'bg-gradient-to-r from-green-500 to-emerald-500',
      error: 'bg-gradient-to-r from-red-500 to-rose-500',
      info: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    };

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ'
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -50, x: 50 }}
          className="fixed top-4 right-4 z-[9999] max-w-md"
        >
          <div className={`${bgColors[toast.type]} rounded-xl shadow-2xl p-4 text-white`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                {icons[toast.type]}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1">{toast.title}</h3>
                <p className="text-sm text-white/90">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Step 1: Open Modal
  const handleOpenQuoteModal = (job: JobRequest) => {
    if (credits <= 0) {
      alert("Yetersiz bakiye! Teklif vermek için kredi yükleyiniz.");
      return;
    }
    setSelectedJobForQuote(job);
    setQuotePrice('');
    setQuoteNote('');
  };

   const handleOpenCustomerOfferModal = (req: Request) => {
      if (credits <= 0) {
         alert('Yetersiz bakiye! Teklif vermek için kredi yükleyiniz.');
         return;
      }
      setSelectedRequestForOffer(req);
      setOfferPrice('');
      setOfferEta('');
      setOfferMessage('');
   };

  // Step 2: Submit Quote -> Start Simulation
  const handleSubmitQuote = () => {
     if (!selectedJobForQuote || !quotePrice) return;

     const jobId = selectedJobForQuote.id;
     
     // Close modal
     setSelectedJobForQuote(null);

     // Start loading state on card
     setOfferingJobId(jobId);
     setOfferError(null);

     // Simulation: Customer Reviewing Offer
    setTimeout(() => {
      const isOfferAccepted = Math.random() > 0.3; // 70% chance of acceptance
      if (isOfferAccepted) {
        setCredits(prev => prev - 1);
        setUnlockedJobs(prev => [...prev, jobId]);
        setOfferingJobId(null);
      } else {
        setOfferError(jobId);
        setOfferingJobId(null);
        setTimeout(() => {
           // Remove job from list after rejection (simulating customer chose someone else)
           setRequests(prev => prev.filter(r => r.id !== jobId));
           setOfferError(null);
        }, 3000);
      }
    }, 2500);
  };

  const handleSubmitCustomerOffer = async () => {
    if (!selectedRequestForOffer || !offerPrice) return;
    
    try {
      console.log('🟢 [PartnerDashboard] Creating offer for request:', selectedRequestForOffer.id);
      
      // Get partner info from localStorage
      const partner = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
      
      // Create offer in Supabase
      const createdOffer = await supabaseApi.offers.create({
        requestId: selectedRequestForOffer.id,
        partnerId: partner.id,
        partnerName: partner.name || CURRENT_PARTNER_NAME,
        price: parseFloat(offerPrice),
        etaMinutes: offerEta ? parseInt(offerEta) : 30,
        message: offerMessage || undefined,
        status: 'sent'
      });
      
      console.log('✅ [PartnerDashboard] Offer created:', createdOffer);
      
      // Kredi kullan
      try {
        await supabaseApi.partnerCredits.useCredits(
          partner.id,
          partner.name || CURRENT_PARTNER_NAME,
          1,
          `Teklif gönderildi: ${selectedRequestForOffer.id}`,
          selectedRequestForOffer.id
        );
        console.log('💰 Credit deducted successfully');
      } catch (creditError) {
        console.error('⚠️ Credit deduction failed:', creditError);
        // Kredi düşme hatası olsa bile teklif gönderildi
      }
      
      // Başarı modal'ını göster
      setLastCreatedOffer(createdOffer);
      setShowOfferSuccessModal(true);
      
      setSelectedRequestForOffer(null);
      setOfferPrice('');
      setOfferEta('');
      setOfferMessage('');
      
      // Teklifleri yeniden yükle
      loadMyOffers();
    } catch (error) {
      console.error('❌ [PartnerDashboard] Offer creation failed:', error);
      alert('Teklif gönderilemedi. Lütfen tekrar deneyin.');
    }
  };  const handleStartOperation = async (job: JobRequest) => {
    try {
      // B2C iş ise Supabase'de işi başlat
      if ((job as any)._originalRequest) {
        const originalRequest = (job as any)._originalRequest as Request;
        const partner = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
        
        // Update request status to in_progress and set job_stage to 1
        await supabaseApi.requests.update(originalRequest.id, {
          status: 'in_progress',
          jobStage: 1, // Yola çıkıldı
          assignedPartnerId: partner.id,
          assignedPartnerName: partner.name || CURRENT_PARTNER_NAME
        });
        
        console.log('🚀 [PartnerDashboard] Job started:', originalRequest.id);
        
        // Kabul edilenlerden kaldır, aktif işleri yenile
        setAcceptedJobs(prev => prev.filter(r => r.id !== originalRequest.id));
        loadAcceptedJobs(); // Yeniden yükle
      }
      
      setActiveJob(job);
      setRequests(prev => prev.filter(r => r.id !== job.id));
      setJobStage(1); // İş başlatıldığında stage 1'den başlasın (Yola çıkıldı)
      setHasStartProof(false);
      setHasEndProof(false);
      setActiveTab('active');
      setTestLocation({ lat: 41.0082, lng: 28.9784, name: 'Taksim Meydanı, İstanbul' });
      setNavigationStarted(false);
    } catch (error) {
      console.error('❌ Job start failed:', error);
      alert('İş başlatılamadı. Lütfen tekrar deneyin.');
    }
  };

  const advanceJobStage = async () => {
    // Stage 0: Navigasyon başlatma kontrolü
    if (jobStage === 0 && !navigationStarted) {
      handleStartNavigation();
      return;
    }
    if (jobStage === 2 && !hasStartProof) {
       alert("Lütfen hizmete başlamadan önce kanıt fotoğrafı yükleyin.");
       return;
    }
    if (jobStage === 3 && !hasEndProof) {
       alert("Lütfen görevi tamamlamadan önce bitiş fotoğrafı yükleyin.");
       return;
    }
    if (jobStage === 3) {
       // Stage 3 is "Görevi Tamamla". After this, show rating modal instead of resetting immediately
       setShowRatingModal(true);
       return;
    }
    if (jobStage < 4) {
      const nextStage = (jobStage + 1) as 0 | 1 | 2 | 3 | 4;
      
      try {
        // B2C iş ise, Supabase'de aşamayı güncelle
        if (activeJob && (activeJob as any)._originalRequest) {
          const originalRequest = (activeJob as any)._originalRequest as Request;
          
          await supabaseApi.requests.update(originalRequest.id, {
            jobStage: nextStage
          });
          
          console.log('📍 [PartnerDashboard] Job stage updated:', originalRequest.id, 'stage:', nextStage);
        }
        
        setJobStage(nextStage);
      } catch (error) {
        console.error('❌ Stage update failed:', error);
        alert('Aşama güncellenemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  const handleFinishJob = async () => {
    // B2C iş ise, request'i 'completed' olarak işaretle
    if (activeJob && (activeJob as any)._originalRequest) {
      const originalRequest = (activeJob as any)._originalRequest as Request;
      
      try {
        // Request'i 'completed' durumuna güncelle
        await supabaseApi.requests.update(originalRequest.id, {
          status: 'completed',
          jobStage: 4
        });

        // Kabul edilmiş offer'ı bul
        const offersResult = await supabaseApi.offers.getByRequestId(originalRequest.id);
        let acceptedOffer: any = null;
        if (offersResult && Array.isArray(offersResult)) {
          acceptedOffer = offersResult.find((o: any) => o.status === 'accepted');
          if (acceptedOffer) {
            console.log('✅ Offer completed:', acceptedOffer.id);
          }
        }

        // ✅ KRİTİK: completed_jobs kaydı oluştur (partner_reviews için gerekli)
        const partner = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
        const now = new Date().toISOString();
        const startTime = originalRequest.stageUpdatedAt || originalRequest.createdAt;
        const durationMinutes = Math.round((new Date(now).getTime() - new Date(startTime).getTime()) / 60000);
        
        console.log('🔵 [PartnerDashboard] Creating completed job:', {
          requestId: originalRequest.id,
          partnerId: partner.id,
          customerId: originalRequest.customerId
        });
        
        const completedJob = await supabaseApi.completedJobs.create({
          requestId: originalRequest.id, // ✅ request_id kolonu (migration 013)
          partnerId: partner.id,
          partnerName: partner.name || partner.companyName,
          customerId: originalRequest.customerId,
          customerName: originalRequest.customerName || 'Müşteri',
          customerPhone: originalRequest.customerPhone || '',
          serviceType: originalRequest.serviceType,
          startLocation: originalRequest.fromLocation,
          endLocation: originalRequest.toLocation || originalRequest.fromLocation,
          distance: 0, // Hesaplanamıyor, sonra eklenebilir
          startTime: startTime,
          completionTime: now,
          duration: durationMinutes,
          totalAmount: acceptedOffer?.price || originalRequest.amount || 0,
          commission: Math.round((acceptedOffer?.price || originalRequest.amount || 0) * 0.15),
          partnerEarning: Math.round((acceptedOffer?.price || originalRequest.amount || 0) * 0.85),
          paymentMethod: 'nakit',
          vehicleType: originalRequest.vehicleInfo?.split(' - ')[0] || 'Bilinmiyor',
          vehiclePlate: originalRequest.vehicleInfo?.split(' - ')[1] || '',
          status: 'completed'
        });

        console.log('✅ [PartnerDashboard] Completed job created:', completedJob);
        console.log('✅ [PartnerDashboard] B2C request completed:', originalRequest.id);
      } catch (error) {
        console.error('❌ Job completion failed:', error);
        alert('İş tamamlanırken hata oluştu. Lütfen tekrar deneyin.');
        return;
      }
    }
    
    setShowRatingModal(false);
    setActiveJob(null);
    setActiveTab('requests');
    setJobStage(0);
    setRatingScore(0);
    setSelectedTags([]);
  };

  const handleOpenObjection = (review: any) => {
    setSelectedReviewForObjection(review);
    setShowObjectionPage(true); // Modal yerine tam sayfa
    setObjectionReason('');
    setObjectionDetails('');
  };

  const handleSubmitObjection = () => {
    if (!objectionReason || !objectionDetails.trim()) {
      alert('Lütfen itiraz nedenini seçin ve detayları yazın.');
      return;
    }
    
    if (!selectedReviewForObjection) {
      alert('Değerlendirme seçilmedi.');
      return;
    }
    
    // Partner bilgilerini al
    const partnerId = 'PTR-001'; // TODO: Gerçek partner ID'si session'dan alınacak
    const partnerName = 'Demo Partner';
    
    try {
      // İtiraz gönder (backend entegrasyonu yapılacak)
      console.log('✅ İtiraz Gönderildi:', {
        reviewId: selectedReviewForObjection.id,
        partnerId,
        partnerName,
        reason: `${objectionReason}: ${objectionDetails}`
      });
      
      showNewToast('İtirazınız gönderildi. En kısa sürede incelenecektir.', 'success');
      setShowObjectionPage(false);
      setSelectedReviewForObjection(null);
      setObjectionReason('');
      setObjectionDetails('');
    } catch (error) {
      console.error('❌ İtiraz gönderme hatası:', error);
      alert('İtiraz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Fotoğraf yükleme ve sıkıştırma fonksiyonları
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'start' | 'end'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      alert('Lütfen sadece görsel dosyası yükleyin (JPG, PNG, vb.)');
      return;
    }

    setIsCompressingImage(true);

    try {
      const result = await compressImage(file);
      
      // Fotoğrafı Supabase Storage'a yükle
      if (activeJob && (activeJob as any)._originalRequest) {
        const originalRequest = (activeJob as any)._originalRequest as Request;
        const partnerStorageData = localStorage.getItem('yolmov_partner');
        const partnerId = partnerStorageData ? JSON.parse(partnerStorageData).id : '';
        
        const uploadResult = await supabaseApi.storage.uploadPartnerDocument(
          result.compressedFile,
          partnerId,
          originalRequest.id,
          type === 'start' ? 'job_start_proof' : 'job_end_proof'
        );

        if (!uploadResult.success || !uploadResult.url) {
          throw new Error('Fotoğraf yüklenemedi');
        }

        // İş kanıtını requests tablosuna kaydet
        const updateData: any = {};
        if (type === 'start') {
          updateData.start_proof_photo = uploadResult.url;
        } else {
          updateData.end_proof_photo = uploadResult.url;
        }

        await supabaseApi.requests.update(originalRequest.id, updateData);
        
        console.log(`📸 [PartnerDashboard] ${type} proof uploaded:`, uploadResult.url);
      }
      
      if (type === 'start') {
        setStartProofImage(result.compressedFile);
        setHasStartProof(true);
      } else {
        setEndProofImage(result.compressedFile);
        setHasEndProof(true);
      }

      showNewToast('Profil fotoğrafı işleniyor...', 'processing', 2000);
    } catch (error) {
      alert('❌ Fotoğraf yüklenirken hata oluştu. Lütfen tekrar deneyin.');
      console.error(error);
    } finally {
      setIsCompressingImage(false);
    }
  };

  // Company logo upload handler
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      alert('Lütfen sadece görsel dosyası yükleyin (JPG, PNG, vb.)');
      return;
    }

    try {
      setIsCompressingLogo(true);
      const result = await compressImage(file);
      setCompanyLogo(result.compressedFile);
      alert(`✅ Logo hazır. "Değişiklikleri Kaydet" butonuna basın.`);
    } catch (error) {
      console.error('Logo compression error:', error);
      alert('❌ Logo işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsCompressingLogo(false);
    }
  };

  // Profile photo upload handler
  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      alert('Lütfen sadece görsel dosyası yükleyin (JPG, PNG, vb.)');
      return;
    }

    try {
      setIsCompressingProfile(true);
      const result = await compressImage(file);
      setProfilePhoto(result.compressedFile);
      alert(`✅ Profil fotoğrafı hazır. "Değişiklikleri Kaydet" butonuna basın.`);
    } catch (error) {
      console.error('Profile photo compression error:', error);
      alert('❌ Profil fotoğrafı işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsCompressingProfile(false);
    }
  };

  // Vehicle photo upload handler
  const handleVehiclePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      alert('Lütfen sadece görsel dosyası yükleyin (JPG, PNG, vb.)');
      return;
    }

    try {
      setIsCompressingVehicle(true);
      const result = await compressImage(file);
      setVehiclePhoto(result.compressedFile);

      showNewToast('Araç fotoğrafı işleniyor...', 'processing', 2000);
    } catch (error) {
      console.error('Vehicle photo compression error:', error);
      alert('❌ Araç fotoğrafı işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsCompressingVehicle(false);
    }
  };

  const handleStartNavigation = () => {
    // Cihaz konumunu al (simulasyon)
    const deviceLoc = { 
      lat: 41.0082 + (Math.random() - 0.5) * 0.05, 
      lng: 28.9784 + (Math.random() - 0.5) * 0.05, 
      name: 'Mevcut Konumunuz' 
    };
    setDeviceLocation(deviceLoc);
    setNavigationStarted(true);
    setShowNavigationModal(true);
  };

  const handleOpenInGoogleMaps = () => {
    const destination = `${testLocation.lat},${testLocation.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  };

  const getStageLabel = () => {
    switch(jobStage) {
      case 0: return navigationStarted ? "Konuma Vardım" : "Navigasyonu Başlat";
      case 1: return "Konuma Vardım";
      case 2: return "Hizmeti Başlat";
      case 3: return "Görevi Tamamla";
      default: return "";
    }
  };

  const addDestination = (dest: string) => {
    if (dest && !routeDestinations.includes(dest)) {
      setRouteDestinations([...routeDestinations, dest]);
      setDestSearch('');
      setIsDestOpen(false);
    }
  };

  const removeDestination = (dest: string) => {
    setRouteDestinations(routeDestinations.filter(d => d !== dest));
  };

  const handleEditRoute = (route: any) => {
    setEditingRouteId(route.id);
    setRouteOrigin(route.origin);
    setOriginSearch(route.origin);
    setRouteDestinations(route.destinations);
    setRouteDate(route.date);
    setRouteTime(route.time);
    setRouteVehicle(route.vehicle);
  };

  const cancelEdit = () => {
    setEditingRouteId(null);
    setRouteOrigin('');
    setOriginSearch('');
    setRouteDestinations([]);
    setRouteDate('');
    setRouteTime('');
    setRouteVehicle('');
    setDestSearch('');
  };

  const handleAddRoute = () => {
     if (!routeOrigin || routeDestinations.length === 0 || !routeDate || !routeTime || !routeVehicle) {
        alert("Lütfen güzergah, tarih, saat ve araç bilgilerini eksiksiz doldurun.");
        return;
     }

     if (editingRouteId) {
        setActiveRoutes(prev => prev.map(r => r.id === editingRouteId ? {
            ...r,
            origin: routeOrigin,
            destinations: routeDestinations,
            date: routeDate,
            time: routeTime,
            vehicle: routeVehicle
        } : r));
        setEditingRouteId(null);
        alert("Rota başarıyla güncellendi.");
     } else {
        const newRoute = {
            id: Date.now(),
            origin: routeOrigin,
            destinations: routeDestinations,
            date: routeDate,
            time: routeTime,
            vehicle: routeVehicle,
            matches: Math.floor(Math.random() * 5), // Mock matching jobs
            type: 'intercity' as 'intercity' | 'intracity'
        };
        setActiveRoutes([newRoute, ...activeRoutes]);
        alert("Yeni rota oluşturuldu.");
     }
     
     // Reset
     cancelEdit();
  };

  const handleRemoveRoute = (id: number) => {
     setActiveRoutes(activeRoutes.filter(r => r.id !== id));
  };

  // --- RENDERERS ---

  const renderRatingModal = () => {
    const activeTags = ratingScore >= 4 ? POSITIVE_RATING_TAGS : NEGATIVE_RATING_TAGS;
    
    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }} 
         animate={{ opacity: 1, scale: 1 }} 
         className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="bg-slate-50 p-6 border-b border-slate-100 text-center">
           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-3 shadow-inner">
              {activeJob?.customerName.charAt(0)}
           </div>
           <h2 className="text-xl font-bold text-slate-800">Görevi Tamamladın!</h2>
           <p className="text-slate-500 text-sm">Müşteriyi değerlendirerek sistemi iyileştirmemize yardım et.</p>
        </div>
        
        <div className="p-6 flex flex-col items-center">
           <div className="flex gap-2 mb-6">
              {[1,2,3,4,5].map(score => (
                 <button 
                   key={score} 
                   onClick={() => {
                      setRatingScore(score);
                      setSelectedTags([]); // Reset tags when score changes
                   }}
                   className="transition-transform hover:scale-110 focus:outline-none"
                 >
                    <Star 
                      size={36} 
                      className={`${score <= ratingScore ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 fill-slate-50'}`} 
                      strokeWidth={1.5}
                    />
                 </button>
              ))}
           </div>
           
           {ratingScore > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                 {activeTags.map(tag => (
                    <button
                       key={tag}
                       onClick={() => {
                          if(selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
                          else setSelectedTags([...selectedTags, tag]);
                       }}
                       className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedTags.includes(tag) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}
                    >
                       {tag}
                    </button>
                 ))}
              </div>
           )}

           <textarea 
              placeholder="Müşteri veya süreç hakkında eklemek istediklerin..."
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-6 resize-none h-24"
           ></textarea>

           <button 
              onClick={handleFinishJob}
              disabled={ratingScore === 0}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
           >
              <Check size={18} /> Değerlendir ve Bitir
           </button>
        </div>
      </motion.div>
    </div>
  );
  };

  const renderNavigationModal = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Route size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Navigasyon Başlatıldı</h2>
                  <p className="text-sm text-blue-100">Müşteri konumuna gidiyorsunuz</p>
                </div>
              </div>
              <button
                onClick={() => setShowNavigationModal(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Location Info */}
            <div className="space-y-3">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Navigation size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-green-600 uppercase">Başlangıç Noktanız</p>
                    <p className="font-bold text-slate-900">{deviceLocation?.name || 'Konum alınıyor...'}</p>
                    {deviceLocation && (
                      <p className="text-xs text-slate-500 mt-1">
                        {deviceLocation.lat.toFixed(6)}, {deviceLocation.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-0.5 h-8 bg-gradient-to-b from-green-300 to-blue-300"></div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-600 uppercase">Hedef Konum</p>
                    <p className="font-bold text-slate-900">{testLocation.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {testLocation.lat.toFixed(6)}, {testLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Distance Info */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Tahmini Mesafe</p>
                <p className="text-2xl font-black text-slate-900">{activeJob?.distance || '2.5 km'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Tahmini Süre</p>
                <p className="text-2xl font-black text-blue-600">8-12 dk</p>
              </div>
            </div>

            {/* Navigation Options */}
            <div className="space-y-3">
              <button
                onClick={handleOpenInGoogleMaps}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <Navigation size={20} /> Google Haritalar'da Aç
              </button>
              
              <button
                onClick={() => {
                  setShowNavigationModal(false);
                  // Navigasyon başlatıldı olarak işaretle
                }}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Yerleşik Haritayı Kullan
              </button>

              <button
                onClick={() => setShowNavigationModal(false)}
                className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };
  
  const renderDocumentUploadModal = () => {
    const DOCUMENT_TYPES = [
      { value: 'trade_registry', label: 'Ticaret Sicil Belgesi' },
      { value: 'signature', label: 'İmza Sirküleri' },
      { value: 'vehicle_registration', label: 'Araç Ruhsatı' },
      { value: 'insurance', label: 'Sorumluluk Sigortası' },
      { value: 'tax_plate', label: 'Vergi Levhası' },
      { value: 'other', label: 'Diğer' },
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Upload size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Belge Yükle</h2>
                  <p className="text-sm text-blue-100">Evraklarınızı yükleyin</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDocumentUploadModal(false);
                  setSelectedDocType('');
                  setDocumentUploadError(null);
                  if (documentInputRef.current) {
                    documentInputRef.current.value = '';
                  }
                }}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Document Type Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Belge Türü <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => {
                  setSelectedDocType(e.target.value);
                  setDocumentUploadError(null);
                }}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                <option value="">Belge türünü seçin</option>
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.label}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Dosya Seçin
              </label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                selectedDocType 
                  ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer' 
                  : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
              }`}>
                {uploadingDocument ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 size={40} className="text-blue-600 animate-spin" />
                    <p className="text-sm font-bold text-blue-700">Yükleniyor...</p>
                    <p className="text-xs text-slate-500">Lütfen bekleyin</p>
                  </div>
                ) : (
                  <label className={selectedDocType ? 'cursor-pointer' : 'cursor-not-allowed'}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <FileText size={32} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-1">
                          Dosya seçmek için tıklayın
                        </p>
                        <p className="text-xs text-slate-500">
                          PDF, JPG, PNG • Maksimum 5MB
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleDocumentUpload}
                      disabled={!selectedDocType || uploadingDocument}
                      className="hidden"
                      ref={documentInputRef}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Error Message */}
            {documentUploadError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700 mb-1">Hata</p>
                  <p className="text-xs text-red-600">{documentUploadError}</p>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-800 mb-1">Önemli Notlar</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Belgeleriniz 24 saat içinde incelenecektir</li>
                    <li>• Fotoğraflar net ve okunaklı olmalıdır</li>
                    <li>• Geçerlilik tarihi güncel olmalıdır</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDocumentUploadModal(false);
                  setSelectedDocType('');
                  setDocumentUploadError(null);
                  if (documentInputRef.current) {
                    documentInputRef.current.value = '';
                  }
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };
  
  const renderDocumentDetailModal = () => {
    if (!selectedDocumentDetail) return null;

    const getStatusBadge = () => {
      switch (selectedDocumentDetail.status) {
        case 'uploaded':
          return (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-200 rounded-xl">
              <CheckCircle2 size={18} className="text-green-600" />
              <span className="text-sm font-bold text-green-700">Yüklendi ve Onaylandı</span>
            </div>
          );
        case 'pending':
          return (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <Clock size={18} className="text-yellow-600" />
              <span className="text-sm font-bold text-yellow-700">İnceleme Bekliyor</span>
            </div>
          );
        case 'not_uploaded':
          return (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-xl">
              <AlertTriangle size={18} className="text-red-600" />
              <span className="text-sm font-bold text-red-700">Henüz Yüklenmedi</span>
            </div>
          );
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileCheck size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedDocumentDetail.title}</h2>
                  <p className="text-sm text-white/80">Belge Detayları</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDocumentDetailModal(false);
                  setSelectedDocumentDetail(null);
                }}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              {getStatusBadge()}
            </div>

            {/* Document Info */}
            <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Belge Türü</p>
                  <p className="text-sm font-bold text-slate-900">{selectedDocumentDetail.title}</p>
                </div>
                {selectedDocumentDetail.uploadDate && (
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-1">Yüklenme Tarihi</p>
                    <p className="text-sm font-bold text-slate-900">{selectedDocumentDetail.uploadDate}</p>
                  </div>
                )}
              </div>

              {selectedDocumentDetail.expiryDate && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-bold mb-1">Son Geçerlilik Tarihi</p>
                  <p className="text-sm font-bold text-slate-900">{selectedDocumentDetail.expiryDate}</p>
                </div>
              )}

              {selectedDocumentDetail.fileName && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-bold mb-1">Dosya Adı</p>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={16} className="text-slate-400" />
                    {selectedDocumentDetail.fileName}
                  </p>
                </div>
              )}

              {selectedDocumentDetail.fileSize && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-bold mb-1">Dosya Boyutu</p>
                  <p className="text-sm font-bold text-slate-900">{selectedDocumentDetail.fileSize}</p>
                </div>
              )}

              {selectedDocumentDetail.count && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-bold mb-1">Yüklenen Belge Sayısı</p>
                  <p className="text-sm font-bold text-slate-900">{selectedDocumentDetail.count} Adet</p>
                </div>
              )}
            </div>

            {/* Info Messages */}
            {selectedDocumentDetail.status === 'uploaded' && selectedDocumentDetail.expiryDate && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-800 mb-1">Belge Aktif</p>
                    <p className="text-xs text-green-700">
                      Bu belge {selectedDocumentDetail.expiryDate} tarihine kadar geçerlidir. Süre dolmadan yenilemeyi unutmayın.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedDocumentDetail.status === 'not_uploaded' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-800 mb-1">Belge Eksik</p>
                    <p className="text-xs text-red-700">
                      Bu belgenin yüklenmesi zorunludur. Lütfen en kısa sürede yükleyiniz.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedDocumentDetail.status === 'pending' && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-yellow-800 mb-1">İnceleme Aşamasında</p>
                    <p className="text-xs text-yellow-700">
                      Belgeniz admin ekibi tarafından inceleniyor. 24 saat içinde sonuç bildirilecektir.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {selectedDocumentDetail.status === 'uploaded' && (
                <>
                  <button className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                    <Eye size={18} /> Görüntüle
                  </button>
                  <button className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                    <Download size={18} /> İndir
                  </button>
                  <button 
                    onClick={() => {
                      setShowDocumentDetailModal(false);
                      setSelectedDocumentDetail(null);
                      setShowDocumentUploadModal(true);
                      setSelectedDocType(selectedDocumentDetail.title);
                    }}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload size={18} /> Yenile
                  </button>
                </>
              )}
              
              {selectedDocumentDetail.status === 'not_uploaded' && (
                <button 
                  onClick={() => {
                    setShowDocumentDetailModal(false);
                    setSelectedDocumentDetail(null);
                    setShowDocumentUploadModal(true);
                    setSelectedDocType(selectedDocumentDetail.title);
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={18} /> Hemen Yükle
                </button>
              )}

              {selectedDocumentDetail.status === 'pending' && (
                <button 
                  onClick={() => {
                    setShowDocumentDetailModal(false);
                    setSelectedDocumentDetail(null);
                  }}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Tamam
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };
  
  const renderJobDetailModal = () => {
    if (!selectedJobForDetail) return null;
    const job = selectedJobForDetail;
    const isUnlocked = unlockedJobs.includes(job.id);
    
    // Check if partner has an accepted offer for this job
    const hasAcceptedOffer = (job as any)._hasAcceptedOffer || isUnlocked;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold">{job.serviceType}</h2>
              <button
                onClick={() => setSelectedJobForDetail(null)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-white/80">İş Detayları - #{job.id}</p>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Location Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <MapPin size={20} className="text-blue-600 mt-1" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Alınacak Konum</p>
                  {hasAcceptedOffer ? (
                    <p className="font-bold text-slate-800 text-lg">{job.location}</p>
                  ) : (
                    <p className="font-bold text-slate-600 text-lg">📍 {job.location.split(',').slice(-2).join(',').trim()}</p>
                  )}
                  <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                    <Navigation size={14} /> {job.distance} uzaklıkta
                  </p>
                  {!hasAcceptedOffer && (
                    <p className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded">🔒 Tam adres teklif kabul edildikten sonra görünür olacak</p>
                  )}
                </div>
              </div>

              {job.dropoffLocation && (
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                  <Navigation size={20} className="text-green-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Teslim Noktası</p>
                    {hasAcceptedOffer ? (
                      <p className="font-bold text-slate-800 text-lg">{job.dropoffLocation}</p>
                    ) : (
                      <p className="font-bold text-slate-600 text-lg">📍 {job.dropoffLocation.split(',').slice(-2).join(',').trim()}</p>
                    )}
                    {!hasAcceptedOffer && (
                      <p className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded">🔒 Tam adres teklif kabul edildikten sonra görünür olacak</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Job Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Hizmet Türü</p>
                <p className="font-bold text-slate-800">{job.serviceType}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Araç Bilgisi</p>
                <p className="font-bold text-slate-800">{job.vehicleInfo}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Zaman</p>
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  <Clock size={16} /> {job.timestamp}
                </p>
              </div>
              {job.estimatedPrice && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-xs font-bold text-green-700 uppercase mb-2">Tahmini Ücret</p>
                  <p className="font-black text-green-700 text-2xl">₺{job.estimatedPrice}</p>
                </div>
              )}
            </div>

            {/* Urgency Badge */}
            {job.urgency === 'high' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle size={24} className="text-red-600" />
                <div>
                  <p className="font-bold text-red-800">ACİL TALEP</p>
                  <p className="text-sm text-red-600">Bu iş için hızlı yanıt bekleniyor</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {job.notes && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-xs font-bold text-yellow-800 uppercase mb-2">Notlar</p>
                <p className="text-sm text-slate-700">{job.notes}</p>
              </div>
            )}

            {/* B2C Genişletilmiş Bilgiler - Sadece _originalRequest varsa */}
            {(job as any)._originalRequest && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-600 uppercase">Detaylı Müşteri Bilgileri</h4>
                
                {/* Araç Durumu */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Araç Durumu</p>
                    <p className={`font-bold ${(job as any)._originalRequest.vehicleCondition === 'broken' ? 'text-red-600' : 'text-green-600'}`}>
                      {(job as any)._originalRequest.vehicleCondition === 'broken' ? '🔴 Arızalı/Kazalı' : '🟢 Çalışır Durumda'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Zamanlama</p>
                    <p className="font-bold text-slate-800">
                      {(job as any)._originalRequest.timing === 'now' && '⚡ Hemen'}
                      {(job as any)._originalRequest.timing === 'week' && '📅 Bu Hafta'}
                      {(job as any)._originalRequest.timing === 'later' && '🗓️ Daha Sonra'}
                    </p>
                  </div>
                </div>

                {/* Yük Bilgisi */}
                {(job as any)._originalRequest.hasLoad && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 uppercase mb-2">⚠️ Yük Bilgisi</p>
                    <p className="font-bold text-amber-700">Araçta yük bulunuyor</p>
                    {(job as any)._originalRequest.loadDescription && (
                      <p className="text-sm text-amber-600 mt-1">{(job as any)._originalRequest.loadDescription}</p>
                    )}
                  </div>
                )}

                {/* Hasar Fotoğrafları */}
                {(job as any)._originalRequest.damagePhotoUrls && (job as any)._originalRequest.damagePhotoUrls.length > 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-xs font-bold text-slate-600 uppercase mb-3">📷 Hasar Fotoğrafları ({(job as any)._originalRequest.damagePhotoUrls.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(job as any)._originalRequest.damagePhotoUrls.slice(0, 6).map((url: string, idx: number) => (
                        <img 
                          key={idx} 
                          src={url} 
                          alt={`Hasar ${idx + 1}`} 
                          className="w-full h-20 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80"
                          onClick={() => window.open(url, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Müşteri İletişim - Sadece teklif kabul edildiyse göster */}
                {(job as any)._originalRequest.customerPhone && hasAcceptedOffer && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-green-700 uppercase mb-1">Müşteri Telefonu</p>
                      <p className="font-bold text-green-800">{(job as any)._originalRequest.customerPhone}</p>
                    </div>
                    <a 
                      href={`tel:${(job as any)._originalRequest.customerPhone}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 flex items-center gap-2"
                    >
                      <Phone size={16} /> Ara
                    </a>
                  </div>
                )}
                
                {/* Telefon numarası gizli mesajı */}
                {(job as any)._originalRequest.customerPhone && !hasAcceptedOffer && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone size={20} className="text-orange-600" />
                      <p className="text-sm font-bold text-orange-800">🔒 Müşteri İletişim Bilgileri Gizli</p>
                    </div>
                    <p className="text-xs text-orange-600">Telefon numarası teklifiniz kabul edildikten sonra görünür olacaktır.</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 flex-shrink-0">
              {!hasAcceptedOffer && (
                <button
                  onClick={() => {
                    setSelectedJobForQuote(job);
                    setQuotePrice(job.estimatedPrice?.toString() || '');
                    setSelectedJobForDetail(null);
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Teklif Gönder
                </button>
              )}
              <button
                onClick={() => setSelectedJobForDetail(null)}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Kapat
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };
  
  const renderQuoteModal = () => {
    if (!selectedJobForQuote) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6"
         >
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h2 className="text-xl font-bold text-slate-800">Teklif Ver</h2>
                  <p className="text-xs text-slate-500">#{selectedJobForQuote.id} - {selectedJobForQuote.serviceType}</p>
               </div>
               <button onClick={() => setSelectedJobForQuote(null)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shrink-0 shadow-sm"><MapPin size={20} /></div>
                  <div>
                     <p className="text-xs font-bold text-blue-400 uppercase">Mesafe</p>
                     <p className="text-sm font-bold text-slate-800">{selectedJobForQuote.distance} uzaklıkta</p>
                  </div>
               </div>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Bu iş için müşteriye sunacağınız KDV dahil toplam tutarı giriniz.
               </p>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Teklif Tutarı (₺)</label>
                  <div className="relative">
                     <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                     <input 
                        type="number" 
                        autoFocus
                        placeholder="0.00" 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xl font-bold text-slate-900 focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                     />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Not (Opsiyonel)</label>
                  <textarea 
                     placeholder="Örn: 15 dk içinde araç başında olurum." 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-0 outline-none resize-none h-24"
                     value={quoteNote}
                     onChange={(e) => setQuoteNote(e.target.value)}
                  ></textarea>
               </div>
            </div>

            <div className="mt-8 flex gap-3">
               <button onClick={() => setSelectedJobForQuote(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">İptal</button>
               <button 
                  onClick={handleSubmitQuote}
                  disabled={!quotePrice}
                  className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                  Teklifi Gönder
               </button>
            </div>
         </motion.div>
      </div>
    );
  };

  // Teklif başarı modal'ı
  const renderOfferSuccessModal = () => {
    if (!showOfferSuccessModal || !lastCreatedOffer) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Teklif Gönderildi!</h2>
            <p className="text-sm text-white/90">Teklifiniz müşteriye iletildi</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900 font-bold mb-2">⏳ Değerlendirme Aşamasında</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Teklifiniz müşteri tarafından değerlendiriliyor. Müşteri yanıt verdiğinde bildirim alacaksınız.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Teklif Tutarı</span>
                <span className="font-bold text-slate-900">₺{lastCreatedOffer.price}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Tahmini Varış</span>
                <span className="font-bold text-slate-900">{lastCreatedOffer.etaMinutes} dakika</span>
              </div>
              {lastCreatedOffer.message && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-500 block mb-1">Mesajınız</span>
                  <p className="text-sm text-slate-800">{lastCreatedOffer.message}</p>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <Info size={16} className="mt-0.5 shrink-0" />
                <span>
                  Teklifinizi "Gönderilen Tekliflerim" bölümünden takip edebilir veya iptal edebilirsiniz.
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={() => {
                setShowOfferSuccessModal(false);
                setActiveTab('offers');
              }}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              Tekliflerimi Gör
            </button>
            <button
              onClick={() => setShowOfferSuccessModal(false)}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all"
            >
              Tamam
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

   const renderCustomerOfferModal = () => {
      if (!selectedRequestForOffer) return null;
      return (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6"
            >
               <div className="flex justify-between items-center mb-6">
                  <div>
                     <h2 className="text-xl font-bold text-slate-800">Müşteri Talebine Teklif Ver</h2>
                     <p className="text-xs text-slate-500">#{selectedRequestForOffer.id} - {selectedRequestForOffer.serviceType}</p>
                  </div>
                  <button onClick={() => setSelectedRequestForOffer(null)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600"><X size={20} /></button>
               </div>

               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Teklif Tutarı (₺)</label>
                     <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                           type="number"
                           autoFocus
                           placeholder="0.00"
                           className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-xl font-bold text-slate-900 focus:border-blue-500 focus:ring-0 outline-none transition-colors"
                           value={offerPrice}
                           onChange={(e) => setOfferPrice(e.target.value)}
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">ETA (dk)</label>
                        <input
                           type="number"
                           placeholder="30"
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none"
                           value={offerEta}
                           onChange={(e) => setOfferEta(e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Hizmet Türü</label>
                        <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">{selectedRequestForOffer.serviceType}</div>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Mesaj (Opsiyonel)</label>
                     <textarea
                        placeholder="Örn: 20 dk içinde araç başında olurum."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-0 outline-none resize-none h-24"
                        value={offerMessage}
                        onChange={(e) => setOfferMessage(e.target.value)}
                     ></textarea>
                  </div>
               </div>

               <div className="mt-8 flex gap-3">
                  <button onClick={() => setSelectedRequestForOffer(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">İptal</button>
                  <button
                     onClick={handleSubmitCustomerOffer}
                     disabled={!offerPrice}
                     className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                     Teklifi Gönder
                  </button>
               </div>
            </motion.div>
         </div>
      );
   };

  const renderAddCreditModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6">
         <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800">Kredi Yükle</h3><button onClick={() => setShowAddCreditModal(false)}><X size={24} className="text-slate-400" /></button></div>
         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-blue-800 flex gap-3"><Info size={20} className="shrink-0" /><p>1 Kredi = 1 İş Kabulü. Kredileriniz hesabınıza anında tanımlanır ve süresizdir.</p></div>
         <div className="space-y-3 mb-6">
            {CREDIT_PACKAGES.map(pkg => (
               <div key={pkg.id} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${pkg.recommended ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                  <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${pkg.recommended ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'}`}><Coins size={20} /></div><div><p className="font-bold text-slate-900">{pkg.label}</p><p className="text-xs text-slate-500">{pkg.credits} Kredi</p></div></div>
                  <div className="text-right"><p className="font-bold text-lg text-slate-900">₺{pkg.price}</p>{pkg.recommended && <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full">Önerilen</span>}</div>
               </div>
            ))}
         </div>
         <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2"><CreditCard size={18} /> Ödeme Yap ve Yükle</button>
      </motion.div>
    </div>
  );

  const renderEmptyTrucksTab = () => {
    return (
      <div className="p-4 md:p-6">
        <ReturnRoutesManager 
          partnerId={CURRENT_PARTNER_ID}
          partnerVehicles={fleet as PartnerVehicle[]}
          onToast={(message, type) => showNewToast(message, type)}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* MOBILE SLIDE-OUT MENU OVERLAY */}
      {showMobileMenu && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
      
      {/* SIDEBAR - Desktop: visible, Mobile: slide-out drawer */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-screen z-50
        w-72 lg:w-64 bg-slate-900 text-white 
        flex flex-col justify-between shrink-0 
        transition-transform duration-300 ease-out
        ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
      `}>
        <div>
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
            <span className="yolmov-logo text-2xl font-bold text-white">
              yolmov
            </span>
            <button 
              onClick={() => setShowMobileMenu(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="mt-4 px-3 pb-4 space-y-6">
            {/* İŞ YÖNETİMİ */}
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">İş Yönetimi</p>
              <div className="space-y-1">
                {[
                  { id: 'home', label: 'Ana Sayfa', icon: LayoutDashboard },
                  { id: 'requests', label: 'İş Talepleri', icon: Bell, badge: requests.length > 0 ? requests.length : null },
                  { id: 'accepted', label: 'Kabul Edilenler', icon: CheckCircle2 },
                  { id: 'offers', label: 'Gönderilen Teklifler', icon: Send },
                  { id: 'active', label: 'Aktif Görev', icon: Navigation, pulse: !!activeJob },
                  { id: 'history', label: 'Geçmiş İşler', icon: History },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { handleTabChange(item.id); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <item.icon size={18} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>}
                    {item.pulse && <span className="ml-auto w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>}
                  </button>
                ))}
              </div>
            </div>

            {/* FİLO & OPERASYON */}
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Filo & Operasyon</p>
              <div className="space-y-1">
                {[
                  { id: 'fleet', label: 'Filo Yönetimi', icon: Truck },
                  { id: 'emptyTrucks', label: 'Boş Dönen Araçlar', icon: Route },
                  { id: 'showcase', label: 'Vitrin Ayarları', icon: Building },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { handleTabChange(item.id); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <item.icon size={18} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* FİNANS */}
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Finans</p>
              <div className="space-y-1">
                {[
                  { id: 'wallet', label: 'Finansal Durum', icon: Wallet },
                  { id: 'payments', label: 'Ödemeler', icon: Receipt },
                  { id: 'offer_history', label: 'Teklif Geçmişi', icon: FileText },
                  { id: 'calls', label: 'Aramalar', icon: Phone },
                  { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { handleTabChange(item.id); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <item.icon size={18} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* HESAP */}
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Hesap</p>
              <div className="space-y-1">
                {[
                  { id: 'documents', label: 'Belgelerim', icon: FileCheck },
                  { id: 'reviews', label: 'Değerlendirmeler', icon: Star },
                  { id: 'support', label: 'Destek Merkezi', icon: Headphones },
                  { id: 'settings', label: 'Ayarlar', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { handleTabChange(item.id); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <item.icon size={18} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-xl p-3 mb-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Bakiye</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white flex items-center gap-2">
                <Coins size={16} className="text-yellow-400" /> {credits} Kredi
              </span>
              <button onClick={() => setShowAddCreditModal(true)} className="text-xs bg-blue-600 px-3 py-1.5 rounded-lg text-white hover:bg-blue-500 transition-colors font-medium">
                Yükle
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              handleTabChange('settings');
              setSettingsSubTab('profile');
              setShowMobileMenu(false);
            }}
            className="w-full text-left flex items-center gap-3 mb-4 px-2 hover:bg-slate-800 rounded-lg p-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border-2 border-slate-600 shrink-0">
              <img src={existingProfilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(CURRENT_PARTNER_NAME)}&background=FF6B35&color=fff&size=128`} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold truncate">{CURRENT_PARTNER_NAME}</p>
              <div className="flex items-center text-xs text-yellow-500">
                <span>★ {CURRENT_PARTNER_RATING || 0}</span>
                <span className="text-slate-500 ml-1">({partnerHistory.length} İş)</span>
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-medium">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden relative pb-20 lg:pb-0">
        {/* TOP HEADER */}
        <header className="h-14 lg:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-20">
          {/* Mobile: Logo */}
          <div className="lg:hidden">
            <span className="yolmov-logo text-xl font-bold text-slate-800">yo</span>
          </div>
          
          {/* Desktop: Page Title */}
          <h1 className="hidden lg:block text-xl font-bold text-slate-800">
            {activeTab === 'home' && 'Ana Sayfa'}
            {activeTab === 'showcase' && 'Vitrin'}
            {activeTab === 'newJobs' && 'Yeni İş Talepleri'}
            {activeTab === 'requests' && 'İş Talepleri'}
            {activeTab === 'accepted' && 'Kabul Edilenler'}
            {activeTab === 'offers' && 'Tekliflerim'}
            {activeTab === 'active' && 'Aktif Görev'}
            {activeTab === 'emptyTrucks' && 'Boş Araçlar'}
            {activeTab === 'offer_history' && 'Teklif Geçmişi'}
            {activeTab === 'payments' && 'Ödemeler'}
            {activeTab === 'documents' && 'Belgelerim'}
            {activeTab === 'wallet' && 'Finans'}
            {activeTab === 'history' && 'Geçmiş'}
            {activeTab === 'reviews' && 'Değerlendirmeler'}
            {activeTab === 'settings' && 'Ayarlar'}
            {activeTab === 'fleet' && 'Filo Yönetimi'}
            {activeTab === 'support' && 'Destek'}
            {activeTab === 'calls' && 'Aramalar'}
            {activeTab === 'service_routes' && 'Rotalar'}
            {activeTab === 'messages' && 'Mesajlar'}
          </h1>
          
          {/* Mobile: Page Title (center) */}
          <h1 className="lg:hidden text-sm font-bold text-slate-800 absolute left-1/2 -translate-x-1/2">
            {activeTab === 'home' && 'Ana Sayfa'}
            {activeTab === 'showcase' && 'Vitrin'}
            {activeTab === 'requests' && 'İş Talepleri'}
            {activeTab === 'accepted' && 'Kabul Edilenler'}
            {activeTab === 'offers' && 'Tekliflerim'}
            {activeTab === 'active' && 'Aktif Görev'}
            {activeTab === 'emptyTrucks' && 'Boş Araçlar'}
            {activeTab === 'offer_history' && 'Geçmiş'}
            {activeTab === 'payments' && 'Ödemeler'}
            {activeTab === 'documents' && 'Belgeler'}
            {activeTab === 'wallet' && 'Finans'}
            {activeTab === 'history' && 'Geçmiş'}
            {activeTab === 'reviews' && 'Puanlar'}
            {activeTab === 'settings' && 'Ayarlar'}
            {activeTab === 'fleet' && 'Filo'}
            {activeTab === 'support' && 'Destek'}
            {activeTab === 'more' && 'Menü'}
          </h1>
          
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            {/* Aktif/Pasif Durumu */}
            <div className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-full border transition-colors ${isOnline ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-slate-200'}`}>
              <span className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span className="text-xs lg:text-sm font-semibold text-slate-700">{isOnline ? 'Aktif' : 'Pasif'}</span>
              <button onClick={() => setIsOnline(!isOnline)} className="hidden lg:inline text-xs text-blue-600 font-semibold hover:underline ml-1">Değiştir</button>
            </div>
            {/* Mobile: Credits */}
            <button 
              onClick={() => setShowAddCreditModal(true)}
              className="lg:hidden flex items-center gap-1 px-2 py-1.5 bg-slate-100 rounded-full"
            >
              <Coins size={14} className="text-yellow-500" />
              <span className="text-xs font-bold text-slate-700">{credits}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          {/* Render Content Based on Active Tab */}
          {activeTab === 'home' && (
            <PartnerHomeTab
              requests={requests}
              partnerHistory={partnerHistory}
              emptyTrucks={emptyTrucks}
              reviews={reviews}
              handleTabChange={handleTabChange}
              setActiveTab={setActiveTab}
              setShowAddCreditModal={setShowAddCreditModal}
            />
          )}
          {activeTab === 'showcase' && <PartnerShowcaseTab partnerId={CURRENT_PARTNER_ID} partnerData={partnerData} />}
          {activeTab === 'requests' && (
            <PartnerNewJobsTab
              requests={requests}
              customerRequests={customerRequests}
              partnerServiceAreas={partnerServiceAreas}
              serviceAreasLoaded={serviceAreasLoaded}
              newJobsFilter={newJobsFilter}
              setNewJobsFilter={setNewJobsFilter}
              unlockedJobs={unlockedJobs}
              offeringJobId={offeringJobId}
              offerError={offerError}
              myOffers={myOffers}
              setSelectedJobForDetail={setSelectedJobForDetail}
              setSelectedJobForQuote={setSelectedJobForQuote}
              setQuotePrice={setQuotePrice}
              setActiveTab={setActiveTab}
              handleOpenCustomerOfferModal={handleOpenCustomerOfferModal}
              handleStartOperation={handleStartOperation}
              handleCancelOffer={handleCancelOffer}
            />
          )}
          {activeTab === 'newJobs' && (
            <PartnerNewJobsTab
              requests={requests}
              customerRequests={customerRequests}
              partnerServiceAreas={partnerServiceAreas}
              serviceAreasLoaded={serviceAreasLoaded}
              newJobsFilter={newJobsFilter}
              setNewJobsFilter={setNewJobsFilter}
              unlockedJobs={unlockedJobs}
              offeringJobId={offeringJobId}
              offerError={offerError}
              myOffers={myOffers}
              setSelectedJobForDetail={setSelectedJobForDetail}
              setSelectedJobForQuote={setSelectedJobForQuote}
              setQuotePrice={setQuotePrice}
              setActiveTab={setActiveTab}
              handleOpenCustomerOfferModal={handleOpenCustomerOfferModal}
              handleStartOperation={handleStartOperation}
              handleCancelOffer={handleCancelOffer}
            />
          )}
          {activeTab === 'accepted' && (
            <PartnerAcceptedJobsTab
              acceptedJobs={acceptedJobs}
              setActiveTab={setActiveTab}
              handleStartOperation={handleStartOperation}
            />
          )}
          {activeTab === 'offers' && (
            <PartnerMyOffersTab
              myOffers={myOffers}
              setActiveTab={setActiveTab}
              handleCancelOffer={handleCancelOffer}
            />
          )}
          {activeTab === 'emptyTrucks' && renderEmptyTrucksTab()}
          {activeTab === 'active' && (
            <div className="h-full flex flex-col lg:flex-row">
               {activeJob ? (
                 <>
                  <div className="flex-1 bg-slate-900 relative overflow-hidden min-h-[400px]">
                     <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
                     <svg className="absolute inset-0 w-full h-full pointer-events-none z-0"><path d="M 200 150 Q 400 100 600 300 T 900 400" fill="none" stroke="#3B82F6" strokeWidth="6" strokeDasharray="10 5" className="animate-pulse" /><circle cx="200" cy="150" r="80" fill="#3B82F6" fillOpacity="0.1" className="animate-ping" /></svg>
                     <div className="absolute top-[150px] left-[200px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"><div className="w-12 h-12 bg-blue-600 rounded-full border-4 border-slate-900 shadow-xl flex items-center justify-center text-white z-10"><Navigation size={20} fill="currentColor" /></div><div className="bg-slate-900 text-white text-xs px-2 py-1 rounded mt-2 font-bold">Siz</div></div>
                     <div className="absolute top-[300px] left-[600px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"><div className="w-10 h-10 bg-orange-500 rounded-full border-4 border-slate-900 shadow-xl flex items-center justify-center text-white z-10"><User size={18} fill="currentColor" /></div><div className="bg-slate-900 text-white text-xs px-2 py-1 rounded mt-2 font-bold">{activeJob.customerName}</div></div>
                     {activeJob.dropoffLocation && (<div className="absolute top-[400px] left-[900px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"><div className="w-10 h-10 bg-green-500 rounded-full border-4 border-slate-900 shadow-xl flex items-center justify-center text-white z-10"><MapPin size={18} fill="currentColor" /></div><div className="bg-slate-900 text-white text-xs px-2 py-1 rounded mt-2 font-bold">Varış</div></div>)}
                  </div>
                  <div className="w-full lg:w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20">
                     <div className="p-6 border-b border-slate-100"><div className="flex justify-between items-start mb-2"><h2 className="text-xl font-bold text-slate-900">{activeJob.serviceType}</h2><span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">#{activeJob.id}</span></div><p className="text-sm text-slate-500">{activeJob.location} {activeJob.dropoffLocation && `➔ ${activeJob.dropoffLocation}`}</p></div>
                     <div className="p-6 bg-blue-50 border-y border-blue-100"><div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl font-bold text-blue-600 shadow-sm">{activeJob.customerName.charAt(0)}</div><div><h3 className="font-bold text-slate-900">{activeJob.customerName}</h3><p className="text-sm text-slate-500">{activeJob.vehicleInfo}</p></div></div><div className="grid grid-cols-2 gap-3"><button className="flex items-center justify-center gap-2 bg-white py-3 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"><Phone size={16} className="text-green-600" /> Ara</button><button className="flex items-center justify-center gap-2 bg-white py-3 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"><MessageSquare size={16} className="text-blue-600" /> Mesaj</button></div></div>
                     <div className="flex-1 p-6 overflow-y-auto">
                        <div className="relative space-y-8 pl-6 border-l-2 border-slate-100 ml-3 mb-8">{[{ id: 0, label: 'Kabul Edildi', time: '10:30' }, { id: 1, label: 'Yola Çıkıldı', time: jobStage >= 1 ? '10:32' : '-' }, { id: 2, label: 'Konuma Varıldı', time: jobStage >= 2 ? '10:45' : '-' }, { id: 3, label: 'Hizmet Tamamlandı', time: jobStage >= 3 ? '11:15' : '-' }].map((step) => (<div key={step.id} className="relative"><div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-[3px] border-white shadow-sm transition-colors ${jobStage >= step.id ? 'bg-green-500' : 'bg-slate-200'}`}></div><div className="flex justify-between items-center"><p className={`text-sm font-bold ${jobStage >= step.id ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p><span className="text-xs text-slate-400">{step.time}</span></div></div>))}</div>
                        
                        {jobStage === 2 && !hasStartProof && (
                          <div className="mb-6 bg-orange-50 p-4 rounded-xl border border-dashed border-orange-300 text-center animate-pulse">
                            <Camera className="mx-auto text-orange-400 mb-2" size={24} />
                            <p className="text-sm font-bold text-orange-700 mb-1">Başlangıç Fotoğrafı Zorunlu</p>
                            <p className="text-xs text-orange-600 mb-3">Hizmete başlamadan önce aracın durumunu belgeleyin.</p>
                            {isCompressingImage ? (
                              <div className="flex items-center justify-center gap-2 text-orange-600">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs font-bold">İşleniyor...</span>
                              </div>
                            ) : (
                              <label className="inline-block bg-white border border-orange-200 text-orange-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-50 shadow-sm cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) => handleImageUpload(e, 'start')}
                                  className="hidden"
                                />
                                <Camera size={14} className="inline mr-1" /> Fotoğraf Çek / Yükle
                              </label>
                            )}
                          </div>
                        )}
                        
                        {jobStage === 3 && !hasEndProof && (
                          <div className="mb-6 bg-green-50 p-4 rounded-xl border border-dashed border-green-300 text-center animate-pulse">
                            <Camera className="mx-auto text-green-400 mb-2" size={24} />
                            <p className="text-sm font-bold text-green-700 mb-1">Hizmet Kanıtı Zorunlu</p>
                            <p className="text-xs text-green-600 mb-3">Tamamlamadan önce bitmiş işin fotoğrafını yükleyin.</p>
                            {isCompressingImage ? (
                              <div className="flex items-center justify-center gap-2 text-green-600">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs font-bold">İşleniyor...</span>
                              </div>
                            ) : (
                              <label className="inline-block bg-white border border-green-200 text-green-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-50 shadow-sm cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) => handleImageUpload(e, 'end')}
                                  className="hidden"
                                />
                                <Camera size={14} className="inline mr-1" /> Fotoğraf Çek / Yükle
                              </label>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-auto"><button onClick={advanceJobStage} className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 ${jobStage === 0 ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : jobStage === 1 ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : jobStage === 2 ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}>{getStageLabel()} <ArrowRight size={20} /></button><button onClick={() => setActiveJob(null)} className="w-full mt-3 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">Acil Durum / İptal</button></div>
                     </div>
                  </div>
                 </>
               ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white"><div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Navigation size={40} className="text-slate-300" /></div><h2 className="text-2xl font-bold text-slate-700">Aktif Görev Bulunamadı</h2><p className="text-slate-400 mt-2 mb-8">Lütfen talep havuzundan bir iş kabul edin.</p><button onClick={() => handleTabChange('requests')} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">İş Listesine Dön</button></div>
               )}
            </div>
          )}
          {activeTab === 'offer_history' && <PartnerOfferHistory />}
          {activeTab === 'payments' && <PartnerPayments />}
          {activeTab === 'documents' && <PartnerDocuments />}
          {activeTab === 'calls' && <PartnerCallHistory />}
          {activeTab === 'history' && (
            <PartnerHistoryTab
              selectedHistoryItem={selectedHistoryItem}
              setSelectedHistoryItem={setSelectedHistoryItem}
              historySearch={historySearch}
              setHistorySearch={setHistorySearch}
              historyFilter={historyFilter}
              setHistoryFilter={setHistoryFilter}
              filteredHistory={filteredHistory}
            />
          )}
          {activeTab === 'reviews' && (
            <PartnerReviewsTab
              reviews={reviews}
              ratingFilter={ratingFilter}
              setRatingFilter={setRatingFilter}
              showObjectionPage={showObjectionPage}
              setShowObjectionPage={setShowObjectionPage}
              selectedReviewForObjection={selectedReviewForObjection}
              setSelectedReviewForObjection={setSelectedReviewForObjection}
              objectionReason={objectionReason}
              setObjectionReason={setObjectionReason}
              objectionDetails={objectionDetails}
              setObjectionDetails={setObjectionDetails}
              handleSubmitObjection={handleSubmitObjection}
              handleOpenObjection={handleOpenObjection}
            />
          )}
          {activeTab === 'wallet' && (
            <PartnerWalletTab
              credits={credits}
              transactions={transactions}
              walletFilter={walletFilter}
              setWalletFilter={setWalletFilter}
              setShowAddCreditModal={setShowAddCreditModal}
            />
          )}
          {activeTab === 'messages' && (
            <div className="p-6">
              <PartnerMessagesInbox partnerCredit={credits} />
            </div>
          )}
          {activeTab === 'settings' && (
            <PartnerSettingsTab
              CURRENT_PARTNER_ID={CURRENT_PARTNER_ID}
              CURRENT_PARTNER_NAME={CURRENT_PARTNER_NAME}
              CURRENT_PARTNER_EMAIL={CURRENT_PARTNER_EMAIL}
              CURRENT_PARTNER_PHONE={CURRENT_PARTNER_PHONE}
              CURRENT_PARTNER_RATING={CURRENT_PARTNER_RATING}
              settingsSubTab={settingsSubTab}
              setSettingsSubTab={setSettingsSubTab}
              companyLogo={companyLogo}
              setCompanyLogo={setCompanyLogo}
              profilePhoto={profilePhoto}
              setProfilePhoto={setProfilePhoto}
              existingLogoUrl={existingLogoUrl}
              existingProfilePhotoUrl={existingProfilePhotoUrl}
              isEditingProfile={isEditingProfile}
              setIsEditingProfile={setIsEditingProfile}
              isCompressingLogo={isCompressingLogo}
              isCompressingProfile={isCompressingProfile}
              isSavingSettings={isSavingSettings}
              partnerFormData={partnerFormData}
              setPartnerFormData={setPartnerFormData}
              companyFormData={companyFormData}
              setCompanyFormData={setCompanyFormData}
              contactFormData={contactFormData}
              setContactFormData={setContactFormData}
              passwordFormData={passwordFormData}
              setPasswordFormData={setPasswordFormData}
              notificationPreferences={notificationPreferences}
              setNotificationPreferences={setNotificationPreferences}
              isSavingNotificationPrefs={isSavingNotificationPrefs}
              isEditingCompanyInfo={isEditingCompanyInfo}
              setIsEditingCompanyInfo={setIsEditingCompanyInfo}
              isEditingContactInfo={isEditingContactInfo}
              setIsEditingContactInfo={setIsEditingContactInfo}
              isChangingPassword={isChangingPassword}
              isSavingCompanyInfo={isSavingCompanyInfo}
              isSavingContactInfo={isSavingContactInfo}
              isSavingServices={isSavingServices}
              selectedServices={selectedServices}
              toggleService={toggleService}
              fleet={fleet}
              setActiveTab={setActiveTab}
              documents={documents}
              isLoadingDocuments={isLoadingDocuments}
              setShowDocumentUploadModal={setShowDocumentUploadModal}
              setSelectedDocumentDetail={setSelectedDocumentDetail}
              setShowDocumentDetailModal={setShowDocumentDetailModal}
              credits={credits}
              handleLogoUpload={handleLogoUpload}
              handleProfilePhotoUpload={handleProfilePhotoUpload}
              handleSaveProfileSettings={handleSaveProfileSettings}
              handleCancelProfileEdit={handleCancelProfileEdit}
              handleSaveCompanyInfo={handleSaveCompanyInfo}
              handleCancelCompanyEdit={handleCancelCompanyEdit}
              handleSaveContactInfo={handleSaveContactInfo}
              handleCancelContactEdit={handleCancelContactEdit}
              handlePasswordChange={handlePasswordChange}
              handleSaveNotificationPreferences={handleSaveNotificationPreferences}
              handleSaveServices={handleSaveServices}
              showNewToast={showNewToast}
            />
          )}
          {activeTab === 'fleet' && (
            <PartnerFleetTab
              fleet={fleet}
              partnerHistory={partnerHistory}
              partnerName={CURRENT_PARTNER_NAME}
              showVehicleEditPage={showVehicleEditPage}
              setShowVehicleEditPage={setShowVehicleEditPage}
              selectedVehicleForSettings={selectedVehicleForSettings}
              setSelectedVehicleForSettings={setSelectedVehicleForSettings}
              selectedVehicleForHistory={selectedVehicleForHistory}
              setSelectedVehicleForHistory={setSelectedVehicleForHistory}
              vehicleStats={vehicleStats}
              loadingVehicleStats={loadingVehicleStats}
              setShowAddVehicleModal={setShowAddVehicleModal}
            />
          )}
          {activeTab === 'support' && (
            <PartnerSupportTab
              tickets={tickets}
              partnerId={CURRENT_PARTNER_ID}
              partnerName={CURRENT_PARTNER_NAME}
              showNewTicketPage={showNewTicketPage}
              setShowNewTicketPage={setShowNewTicketPage}
              ticketSubject={ticketSubject}
              setTicketSubject={setTicketSubject}
              ticketCategory={ticketCategory}
              setTicketCategory={setTicketCategory}
              ticketDescription={ticketDescription}
              setTicketDescription={setTicketDescription}
            />
          )}
        </main>
      </div>
      <AnimatePresence>{showAddCreditModal && renderAddCreditModal()}</AnimatePresence>
      <AnimatePresence>{selectedJobForQuote && renderQuoteModal()}</AnimatePresence>
      <AnimatePresence>{selectedRequestForOffer && renderCustomerOfferModal()}</AnimatePresence>
      <AnimatePresence>{showOfferSuccessModal && renderOfferSuccessModal()}</AnimatePresence>
      <AnimatePresence>{showRatingModal && renderRatingModal()}</AnimatePresence>
      <AnimatePresence>{selectedJobForDetail && renderJobDetailModal()}</AnimatePresence>
      <AnimatePresence>{showNavigationModal && renderNavigationModal()}</AnimatePresence>
      <AnimatePresence>{showDocumentUploadModal && renderDocumentUploadModal()}</AnimatePresence>
      <AnimatePresence>{showDocumentDetailModal && renderDocumentDetailModal()}</AnimatePresence>
      
      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col my-8">
            {/* Header - Sabit */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-2xl font-bold text-slate-800">Yeni Araç Ekle</h2>
              <button 
                onClick={() => setShowAddVehicleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content - Scroll edilebilir */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Araç Görselleri */}
                <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 mb-3">
                  <Camera size={20} />
                  <h3 className="font-bold text-sm">Araç Görselleri (Plaka Okunabilir Olmalı)</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Ön Görsel */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">Ön Görsel *</label>
                    <div className="relative aspect-video bg-white rounded-lg border-2 border-dashed border-slate-300 overflow-hidden">
                      {vehicleFrontPhoto ? (
                        <img 
                          src={createPreviewUrl(vehicleFrontPhoto)} 
                          alt="Ön" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                          <Camera size={24} />
                          <span className="text-xs mt-1">Ön</span>
                        </div>
                      )}
                    </div>
                    <label className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer block text-center">
                      {isCompressingVehicleFront ? 'İşleniyor...' : 'Ön Yükle'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleVehicleFrontPhoto}
                        disabled={isCompressingVehicleFront}
                      />
                    </label>
                  </div>

                  {/* Yan Görsel */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">Yan Görsel *</label>
                    <div className="relative aspect-video bg-white rounded-lg border-2 border-dashed border-slate-300 overflow-hidden">
                      {vehicleSidePhoto ? (
                        <img 
                          src={createPreviewUrl(vehicleSidePhoto)} 
                          alt="Yan" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                          <Camera size={24} />
                          <span className="text-xs mt-1">Yan</span>
                        </div>
                      )}
                    </div>
                    <label className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer block text-center">
                      {isCompressingVehicleSide ? 'İşleniyor...' : 'Yan Yükle'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleVehicleSidePhoto}
                        disabled={isCompressingVehicleSide}
                      />
                    </label>
                  </div>

                  {/* Arka Görsel */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">Arka Görsel *</label>
                    <div className="relative aspect-video bg-white rounded-lg border-2 border-dashed border-slate-300 overflow-hidden">
                      {vehicleBackPhoto ? (
                        <img 
                          src={createPreviewUrl(vehicleBackPhoto)} 
                          alt="Arka" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                          <Camera size={24} />
                          <span className="text-xs mt-1">Arka</span>
                        </div>
                      )}
                    </div>
                    <label className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer block text-center">
                      {isCompressingVehicleBack ? 'İşleniyor...' : 'Arka Yükle'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleVehicleBackPhoto}
                        disabled={isCompressingVehicleBack}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plaka *</label>
                <input 
                  type="text" 
                  placeholder="34 ABC 123" 
                  value={newVehicleData.plate}
                  onChange={(e) => setNewVehicleData({ ...newVehicleData, plate: e.target.value })}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marka *</label>
                  <input 
                    type="text" 
                    placeholder="Mercedes" 
                    value={newVehicleData.brand}
                    onChange={(e) => setNewVehicleData({ ...newVehicleData, brand: e.target.value })}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model *</label>
                  <input 
                    type="text" 
                    placeholder="Actros" 
                    value={newVehicleData.model}
                    onChange={(e) => setNewVehicleData({ ...newVehicleData, model: e.target.value })}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yıl</label>
                  <input 
                    type="number" 
                    placeholder="2020" 
                    value={newVehicleData.year}
                    onChange={(e) => setNewVehicleData({ ...newVehicleData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tip *</label>
                  <select 
                    value={newVehicleData.type}
                    onChange={(e) => setNewVehicleData({ ...newVehicleData, type: e.target.value })}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Seçiniz</option>
                    <option value="cekici">Çekici</option>
                    <option value="vinc">Vinç</option>
                    <option value="kurtarici">Kurtarıcı</option>
                    <option value="servis">Servis Aracı</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sürücü</label>
                <input 
                  type="text" 
                  placeholder="Sürücü adı (opsiyonel)" 
                  value={newVehicleData.driver}
                  onChange={(e) => setNewVehicleData({ ...newVehicleData, driver: e.target.value })}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
                <p className="text-xs text-slate-500 italic">Boş bırakılırsa şirket adı kullanılır</p>
              </div>

              {/* Vitrin Bilgileri Bölümü */}
              <div className="space-y-3 p-4 bg-purple-50 rounded-xl border border-purple-100 mt-4">
                <div className="flex items-center gap-2 text-purple-700 mb-3">
                  <Store size={20} />
                  <h3 className="font-bold text-sm">Vitrin Bilgileri (B2C Müşterilere Gösterilecek)</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kapasite</label>
                    <select 
                      value={newVehicleData.showcase_capacity}
                      onChange={(e) => setNewVehicleData({ ...newVehicleData, showcase_capacity: e.target.value })}
                      className="w-full p-3 bg-white rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    >
                      <option value="">Seçiniz</option>
                      <option value="3.5_ton">3.5 Ton'a kadar</option>
                      <option value="7.5_ton">7.5 Ton'a kadar</option>
                      <option value="15_ton">15 Ton'a kadar</option>
                      <option value="25_ton">25 Ton'a kadar</option>
                      <option value="40_ton">40 Ton ve üzeri</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sigorta Tipi</label>
                    <select 
                      value={newVehicleData.showcase_insurance_type}
                      onChange={(e) => setNewVehicleData({ ...newVehicleData, showcase_insurance_type: e.target.value })}
                      className="w-full p-3 bg-white rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    >
                      <option value="">Seçiniz</option>
                      <option value="tasima_kaskosu">Taşıma Kaskosu Var</option>
                      <option value="sorumluluk">Sorumluluk Sigortası</option>
                      <option value="tam_kapsamli">Tam Kapsamlı</option>
                      <option value="yok">Sigorta Yok</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ekipman</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'vinc', label: 'Vinç' },
                      { value: 'hidrolik_platform', label: 'Hidrolik Platform' },
                      { value: 'uzun_platform', label: 'Uzun Platform' },
                      { value: 'tekerleksiz_cekim', label: 'Tekerleksiz Çekim' },
                      { value: 'gps_takip', label: 'GPS Takip' },
                    ].map(equip => (
                      <button
                        key={equip.value}
                        type="button"
                        onClick={() => {
                          const current = newVehicleData.showcase_equipment || [];
                          const updated = current.includes(equip.value)
                            ? current.filter(e => e !== equip.value)
                            : [...current, equip.value];
                          setNewVehicleData({ ...newVehicleData, showcase_equipment: updated });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          (newVehicleData.showcase_equipment || []).includes(equip.value)
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        {equip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Araç Açıklaması (Vitrin)</label>
                  <textarea
                    placeholder="Örn: Aracımız son model olup, alçak şasi spor araçlar dahil tüm binek ve hafif ticari araçları hasarsız yükleme garantisi ile taşımaktadır."
                    value={newVehicleData.showcase_description}
                    onChange={(e) => {
                      const validated = validateVehicleDescription(e.target.value);
                      setNewVehicleData({ ...newVehicleData, showcase_description: validated });
                    }}
                    rows={3}
                    className="w-full p-3 bg-white rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none"
                  />
                  <p className="text-xs text-red-500 font-medium">⚠️ Telefon, e-mail, web adresi ve sosyal medya bilgisi otomatik olarak silinir.</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-100 rounded-xl">
                  <input
                    type="checkbox"
                    id="is_showcase_vehicle"
                    checked={newVehicleData.is_showcase_vehicle}
                    onChange={(e) => setNewVehicleData({ ...newVehicleData, is_showcase_vehicle: e.target.checked })}
                    className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="is_showcase_vehicle" className="text-sm font-medium text-purple-800">
                    Bu aracı vitrin aracı olarak belirle (Müşterilere bu araç gösterilecek)
                  </label>
                </div>
              </div>
              </div>
            </div>

            {/* Footer - Sabit */}
            <div className="flex gap-3 p-6 border-t border-slate-100 flex-shrink-0">
              <button 
                onClick={() => setShowAddVehicleModal(false)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all"
              >
                İptal
              </button>
              <button 
                onClick={handleAddVehicle}
                disabled={isAddingVehicle}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
              >
                {isAddingVehicle ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditVehicleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col my-8">
            {/* Header - Sabit */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-2xl font-bold text-slate-800">Araç Düzenle</h2>
              <button 
                onClick={() => {
                  setShowEditVehicleModal(false);
                  setEditingVehicleId(null);
                  setVehicleFrontPhoto(null);
                  setVehicleSidePhoto(null);
                  setVehicleBackPhoto(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content - Scroll edilebilir */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Fotoğraf Güncelleme (Opsiyonel) */}
                <div className="space-y-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 text-amber-700 mb-3">
                  <Camera size={20} />
                  <h3 className="font-bold text-sm">Araç Fotoğraflarını Güncelle (Opsiyonel)</h3>
                </div>
                <p className="text-xs text-amber-600 mb-3">Sadece değiştirmek istediğiniz fotoğrafları yükleyin</p>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Ön Görsel */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">Ön Görsel</label>
                    <div className="relative aspect-video bg-white rounded-lg border-2 border-dashed border-slate-300 overflow-hidden">
                      {vehicleFrontPhoto ? (
                        <img 
                          src={createPreviewUrl(vehicleFrontPhoto)} 
                          alt="Ön" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                          <Camera size={24} />
                          <span className="text-xs mt-1">Ön</span>
                        </div>
                      )}
                    </div>
                    <label className="bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 cursor-pointer block text-center">
                      {isCompressingVehicleFront ? 'İşleniyor...' : 'Yükle'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleVehicleFrontPhoto}
                        disabled={isCompressingVehicleFront}
                      />
                    </label>
                  </div>

                  {/* Yan Görsel */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">Yan Görsel</label>
                    <div className="relative aspect-video bg-white rounded-lg border-2 border-dashed border-slate-300 overflow-hidden">
                      {vehicleSidePhoto ? (
                        <img 
                          src={createPreviewUrl(vehicleSidePhoto)} 
                          alt="Yan" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                          <Camera size={24} />
                          <span className="text-xs mt-1">Yan</span>
                        </div>
                      )}
                    </div>
                    <label className="bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 cursor-pointer block text-center">
                      {isCompressingVehicleSide ? 'İşleniyor...' : 'Yükle'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleVehicleSidePhoto}
                        disabled={isCompressingVehicleSide}
                      />
                    </label>
                  </div>

                  {/* Arka Görsel */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">Arka Görsel</label>
                    <div className="relative aspect-video bg-white rounded-lg border-2 border-dashed border-slate-300 overflow-hidden">
                      {vehicleBackPhoto ? (
                        <img 
                          src={createPreviewUrl(vehicleBackPhoto)} 
                          alt="Arka" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                          <Camera size={24} />
                          <span className="text-xs mt-1">Arka</span>
                        </div>
                      )}
                    </div>
                    <label className="bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 cursor-pointer block text-center">
                      {isCompressingVehicleBack ? 'İşleniyor...' : 'Yükle'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleVehicleBackPhoto}
                        disabled={isCompressingVehicleBack}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plaka *</label>
                <input 
                  type="text" 
                  placeholder="34 ABC 123" 
                  value={newVehicleData.plate}
                  onChange={(e) => setNewVehicleData({ ...newVehicleData, plate: e.target.value })}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marka *</label>
                  <input 
                    type="text" 
                    placeholder="Mercedes" 
                    value={newVehicleData.brand}
                    onChange={(e) => setNewVehicleData({ ...newVehicleData, brand: e.target.value })}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model *</label>
                  <input 
                    type="text" 
                    placeholder="Actros" 
                    value={newVehicleData.model}
                    onChange={(e) => setNewVehicleData({ ...newVehicleData, model: e.target.value })}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yıl</label>
                  <input 
                    type="number" 
                    placeholder="2020" 
                    value={newVehicleData.year}
                    onChange={(e) => setNewVehicleData({ ...newVehicleData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tip *</label>
                  <select 
                    value={newVehicleData.type}
                    onChange={(e) => setNewVehicleData({ ...newVehicleData, type: e.target.value })}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Seçiniz</option>
                    <option value="cekici">Çekici</option>
                    <option value="vinc">Vinç</option>
                    <option value="kurtarici">Kurtarıcı</option>
                    <option value="servis">Servis Aracı</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sürücü</label>
                <input 
                  type="text" 
                  placeholder="Sürücü adı (opsiyonel)" 
                  value={newVehicleData.driver}
                  onChange={(e) => setNewVehicleData({ ...newVehicleData, driver: e.target.value })}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
                <p className="text-xs text-slate-500 italic">Boş bırakılırsa şirket adı kullanılır</p>
              </div>

              {/* Vitrin Bilgileri Bölümü - Edit Modal */}
              <div className="space-y-3 p-4 bg-purple-50 rounded-xl border border-purple-100 mt-4">
                <div className="flex items-center gap-2 text-purple-700 mb-3">
                  <Store size={20} />
                  <h3 className="font-bold text-sm">Vitrin Bilgileri (B2C Müşterilere Gösterilecek)</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kapasite</label>
                    <select 
                      value={newVehicleData.showcase_capacity}
                      onChange={(e) => setNewVehicleData({ ...newVehicleData, showcase_capacity: e.target.value })}
                      className="w-full p-3 bg-white rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    >
                      <option value="">Seçiniz</option>
                      <option value="3.5_ton">3.5 Ton'a kadar</option>
                      <option value="7.5_ton">7.5 Ton'a kadar</option>
                      <option value="15_ton">15 Ton'a kadar</option>
                      <option value="25_ton">25 Ton'a kadar</option>
                      <option value="40_ton">40 Ton ve üzeri</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sigorta Tipi</label>
                    <select 
                      value={newVehicleData.showcase_insurance_type}
                      onChange={(e) => setNewVehicleData({ ...newVehicleData, showcase_insurance_type: e.target.value })}
                      className="w-full p-3 bg-white rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    >
                      <option value="">Seçiniz</option>
                      <option value="tasima_kaskosu">Taşıma Kaskosu Var</option>
                      <option value="sorumluluk">Sorumluluk Sigortası</option>
                      <option value="tam_kapsamli">Tam Kapsamlı</option>
                      <option value="yok">Sigorta Yok</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ekipman</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'vinc', label: 'Vinç' },
                      { value: 'hidrolik_platform', label: 'Hidrolik Platform' },
                      { value: 'uzun_platform', label: 'Uzun Platform' },
                      { value: 'tekerleksiz_cekim', label: 'Tekerleksiz Çekim' },
                      { value: 'gps_takip', label: 'GPS Takip' },
                    ].map(equip => (
                      <button
                        key={equip.value}
                        type="button"
                        onClick={() => {
                          const current = newVehicleData.showcase_equipment || [];
                          const updated = current.includes(equip.value)
                            ? current.filter(e => e !== equip.value)
                            : [...current, equip.value];
                          setNewVehicleData({ ...newVehicleData, showcase_equipment: updated });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          (newVehicleData.showcase_equipment || []).includes(equip.value)
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        {equip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Araç Açıklaması (Vitrin)</label>
                  <textarea
                    placeholder="Örn: Aracımız son model olup, alçak şasi spor araçlar dahil tüm binek ve hafif ticari araçları hasarsız yükleme garantisi ile taşımaktadır."
                    value={newVehicleData.showcase_description}
                    onChange={(e) => {
                      const validated = validateVehicleDescription(e.target.value);
                      setNewVehicleData({ ...newVehicleData, showcase_description: validated });
                    }}
                    rows={3}
                    className="w-full p-3 bg-white rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none"
                  />
                  <p className="text-xs text-red-500 font-medium">⚠️ Telefon, e-mail, web adresi ve sosyal medya bilgisi otomatik olarak silinir.</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-100 rounded-xl">
                  <input
                    type="checkbox"
                    id="edit_is_showcase_vehicle"
                    checked={newVehicleData.is_showcase_vehicle}
                    onChange={(e) => setNewVehicleData({ ...newVehicleData, is_showcase_vehicle: e.target.checked })}
                    className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="edit_is_showcase_vehicle" className="text-sm font-medium text-purple-800">
                    Bu aracı vitrin aracı olarak belirle
                  </label>
                </div>
              </div>
              </div>
            </div>

            {/* Footer - Sabit */}
            <div className="flex gap-3 p-6 border-t border-slate-100 flex-shrink-0">
              <button 
                onClick={() => {
                  setShowEditVehicleModal(false);
                  setEditingVehicleId(null);
                  setVehicleFrontPhoto(null);
                  setVehicleSidePhoto(null);
                  setVehicleBackPhoto(null);
                }}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all"
              >
                İptal
              </button>
              <button 
                onClick={handleEditVehicle}
                disabled={isAddingVehicle}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
              >
                {isAddingVehicle ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {renderToast()}
      
      {/* New Toast Component */}
      <Toast
        message={newToast.message}
        type={newToast.type}
        duration={newToast.duration}
        onClose={hideNewToast}
        isVisible={newToast.isVisible}
      />
      
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {(() => {
            const bottomNavItems = [
              { id: 'home', label: 'Ana Sayfa', icon: Home },
              { id: 'requests', label: 'İş Talepleri', icon: Bell, badge: requests.length > 0 ? requests.length : null },
              { id: 'fleet', label: 'Filo', icon: Truck },
              { id: 'wallet', label: 'Finans', icon: Wallet },
            ];
            
            const moreMenuTabs = ['showcase', 'settings', 'support', 'documents', 'history', 'reviews', 'emptyTrucks', 'offers', 'accepted', 'active', 'payments'];
            const isMoreActive = moreMenuTabs.includes(activeTab);
            
            return (
              <>
                {bottomNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                      activeTab === item.id 
                        ? 'text-blue-600' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div className="relative">
                      <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${activeTab === item.id ? 'font-bold' : ''}`}>
                      {item.label}
                    </span>
                    {activeTab === item.id && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full" />
                    )}
                  </button>
                ))}
                
                {/* More Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                    isMoreActive 
                      ? 'text-blue-600' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Menu size={22} strokeWidth={isMoreActive ? 2.5 : 2} />
                  <span className={`text-[10px] mt-1 font-medium ${isMoreActive ? 'font-bold' : ''}`}>
                    Daha Fazla
                  </span>
                  {isMoreActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full" />
                  )}
                </button>
              </>
            );
          })()}
        </div>
      </nav>
    </div>
  );
};

export default PartnerDashboard;
