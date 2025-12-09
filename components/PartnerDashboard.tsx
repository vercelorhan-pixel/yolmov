
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
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'services' | 'documents' | 'security' | 'notifications' | 'company' | 'vehicles' | 'contact'>('profile');
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
          customerName: originalRequest.customerName,
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

  const renderHistoryTab = () => {
    // Eğer detay seçiliyse, detay view göster
    if (selectedHistoryItem) {
      const item = selectedHistoryItem;
      return (
        <div className="p-4 md:p-6 space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedHistoryItem(null)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold mb-4"
          >
            <ChevronRight size={20} className="rotate-180" /> Geri Dön
          </button>

          {/* Detail View */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  İş Detayı <span className="text-blue-600">#{item.id}</span>
                </h2>
                <p className="text-sm text-slate-500">{new Date(item.completionTime).toLocaleString('tr-TR')}</p>
              </div>
              <div className={`px-4 py-2 rounded-xl font-bold ${item.status === 'completed' ? 'bg-green-50 text-green-700' : item.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                {item.status === 'completed' ? '✓ Tamamlandı' : item.status === 'cancelled' ? '✗ İptal' : '↩ İade'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Finansal Detaylar</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Hizmet Bedeli</span><span className="font-bold text-slate-900">₺{item.totalAmount}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Komisyon (%15)</span><span className="font-bold text-red-500">-₺{item.commission}</span></div>
                  <div className="flex justify-between text-base pt-3 border-t border-slate-100"><span className="font-bold text-slate-800">Toplam Kazanç</span><span className="font-bold text-green-600 text-lg">₺{item.partnerEarning}</span></div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800"><Info size={14} className="inline mr-1 mb-0.5" />Bu işlem için <strong>1 Kredi</strong> kullanılmıştır.</div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Müşteri & Rota</h3>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">{item.customerName.charAt(0)}</div>
                    <div><p className="font-bold text-slate-800">{item.customerName}</p><p className="text-xs text-slate-500">Müşteri</p></div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/50 p-2 rounded-lg"><ShieldAlert size={16} className="text-orange-500" /><span>{item.customerPhone || '05** *** ** 12'}</span><span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded ml-auto">Gizli</span></div>
                </div>
                <div>
                  <div className="flex items-start gap-3 mb-3"><div className="mt-1 w-2 h-2 rounded-full bg-blue-500"></div><div><p className="text-xs text-slate-400 font-bold">BAŞLANGIÇ</p><p className="text-sm font-medium text-slate-800">{item.startLocation}</p></div></div>
                  <div className="flex items-start gap-3"><div className="mt-1 w-2 h-2 rounded-full bg-slate-800"></div><div><p className="text-xs text-slate-400 font-bold">VARIŞ</p><p className="text-sm font-medium text-slate-800">{item.endLocation || 'Yerinde Hizmet'}</p></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Liste view
    return (
    <div className="p-4 md:p-6 space-y-6">
       <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <input 
               type="text" 
               placeholder="İş No, Müşteri Adı veya Plaka ara..." 
               className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={historySearch}
               onChange={(e) => setHistorySearch(e.target.value)}
             />
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shrink-0">
             {['week', 'month', 'year'].map(f => (
                <button key={f} onClick={() => setHistoryFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${historyFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                   {f === 'week' ? 'Bu Hafta' : f === 'month' ? 'Bu Ay' : 'Bu Yıl'}
                </button>
             ))}
          </div>
       </div>

       <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-400 font-bold">
                      <th className="p-4 pl-6">İş No / Tarih</th>
                      <th className="p-4">Hizmet & Rota</th>
                      <th className="p-4">Müşteri</th>
                      <th className="p-4">Tutar</th>
                      <th className="p-4">Durum</th>
                      <th className="p-4"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredHistory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => setSelectedHistoryItem(item)}>
                         <td className="p-4 pl-6">
                            <p className="font-bold text-slate-800 text-sm">#{item.id}</p>
                            <p className="text-xs text-slate-400">{new Date(item.completionTime).toLocaleString('tr-TR')}</p>
                         </td>
                         <td className="p-4">
                            <p className="font-bold text-slate-800 text-sm">{item.serviceType}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> {item.startLocation} {item.endLocation ? `→ ${item.endLocation}` : ''}</p>
                         </td>
                         <td className="p-4">
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">{item.customerName.charAt(0)}</div>
                               <span className="text-sm text-slate-600">{item.customerName}</span>
                            </div>
                         </td>
                         <td className="p-4">
                            <span className="font-bold text-slate-800">₺{item.totalAmount}</span>
                         </td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.status === 'completed' ? 'bg-green-50 text-green-700' : item.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                               {item.status === 'completed' ? 'Tamamlandı' : item.status === 'cancelled' ? 'İptal' : 'İade'}
                            </span>
                         </td>
                         <td className="p-4 text-right">
                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><ChevronRight size={18} /></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
    );
  };

  const renderWalletTab = () => (
    <div className="p-4 md:p-6 space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} /></div>
             <p className="text-slate-400 text-sm font-medium mb-1">Toplam Bakiye (Kredi)</p>
             <h2 className="text-4xl font-bold mb-4">{credits} <span className="text-lg font-normal text-slate-400">Kredi</span></h2>
             <button onClick={() => setShowAddCreditModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-900/50 flex items-center gap-2">
                <Plus size={16} /> Kredi Yükle
             </button>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                <span className="text-slate-500 text-sm font-bold">Bu Ay Kazanç</span>
             </div>
             <h3 className="text-2xl font-bold text-slate-800">₺12,450.00</h3>
             <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1"><ArrowUpRight size={12} /> %12 artış</p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={20} /></div>
                <span className="text-slate-500 text-sm font-bold">Tamamlanan İş</span>
             </div>
             <h3 className="text-2xl font-bold text-slate-800">42 Adet</h3>
             <p className="text-xs text-slate-400 font-bold mt-1">Son 30 gün</p>
          </div>
       </div>

       <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-lg text-slate-800">Hesap Hareketleri</h3>
             <div className="flex gap-2">
                {['all', 'income', 'expense'].map(f => (
                   <button key={f} onClick={() => setWalletFilter(f as any)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${walletFilter === f ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                      {f === 'all' ? 'Tümü' : f === 'income' ? 'Gelirler' : 'Giderler'}
                   </button>
                ))}
             </div>
          </div>
          <div className="space-y-4">
             {transactions.filter(t => walletFilter === 'all' || t.type === walletFilter).length > 0 ? (
               transactions.filter(t => walletFilter === 'all' || t.type === walletFilter).map(trx => (
                <div key={trx.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                         {trx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                         <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{trx.title}</p>
                         <p className="text-xs text-slate-400">{trx.date}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`font-bold ${trx.type === 'income' ? 'text-green-600' : 'text-slate-800'}`}>
                         {trx.type === 'income' ? '+' : '-'}{trx.isCredit ? `${trx.amount} Kredi` : `₺${trx.amount}`}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{trx.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}</p>
                   </div>
                </div>
               ))
             ) : (
               <div className="text-center py-12">
                 <Wallet size={48} className="mx-auto text-slate-300 mb-4" />
                 <p className="text-slate-500 font-medium">Henüz işlem kaydı yok</p>
                 <p className="text-xs text-slate-400 mt-2">İşlemleriniz burada görünecek</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );

  const renderFleetTab = () => {
    // Yeni araç ekleme sayfası
    // Araç Düzenleme Tam Sayfa Ekranı
    if (showVehicleEditPage && selectedVehicleForSettings) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    setShowVehicleEditPage(false);
                    setSelectedVehicleForSettings(null);
                  }}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-all"
                >
                  <ChevronDown size={20} className="rotate-90" />
                  <span>Filo Yönetimine Dön</span>
                </button>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${selectedVehicleForSettings.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {selectedVehicleForSettings.status === 'active' ? '🟢 Aktif' : '🟠 Bakımda'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                  {selectedVehicleForSettings.front_photo_url ? (
                    <img src={selectedVehicleForSettings.front_photo_url} alt={selectedVehicleForSettings.plate_number} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Truck size={48} className="text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-black text-slate-900 mb-2">{selectedVehicleForSettings.plate_number}</h1>
                  <p className="text-xl text-slate-600 mb-4">{selectedVehicleForSettings.brand} {selectedVehicleForSettings.model}</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-blue-50 px-4 py-2 rounded-xl">
                      <span className="text-xs text-blue-600 font-bold uppercase">Araç Tipi</span>
                      <p className="text-sm font-bold text-blue-900">{selectedVehicleForSettings.type}</p>
                    </div>
                    <div className="bg-purple-50 px-4 py-2 rounded-xl">
                      <span className="text-xs text-purple-600 font-bold uppercase">Model Yılı</span>
                      <p className="text-sm font-bold text-purple-900">{selectedVehicleForSettings.year}</p>
                    </div>
                    <div className="bg-amber-50 px-4 py-2 rounded-xl">
                      <span className="text-xs text-amber-600 font-bold uppercase">Sürücü</span>
                      <p className="text-sm font-bold text-amber-900">{selectedVehicleForSettings.driver}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sol Kolon - Araç Bilgileri */}
              <div className="lg:col-span-2 space-y-6">
                {/* Temel Bilgiler */}
                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Truck size={20} className="text-white" />
                    </div>
                    Araç Bilgileri
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plaka</label>
                      <input
                        type="text"
                        defaultValue={selectedVehicleForSettings.plate_number}
                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Araç Tipi</label>
                      <select
                        defaultValue={selectedVehicleForSettings.type}
                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="cekici">Çekici</option>
                        <option value="vinc">Vinç</option>
                        <option value="kurtarici">Kurtarıcı</option>
                        <option value="servis">Servis Aracı</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marka</label>
                      <input
                        type="text"
                        defaultValue={selectedVehicleForSettings.brand}
                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model</label>
                      <input
                        type="text"
                        defaultValue={selectedVehicleForSettings.model}
                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model Yılı</label>
                      <input
                        type="number"
                        defaultValue={selectedVehicleForSettings.year}
                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sürücü</label>
                      <input
                        type="text"
                        defaultValue={selectedVehicleForSettings.driver}
                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Araç Durumu</label>
                      <select
                        defaultValue={selectedVehicleForSettings.status}
                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="active">🟢 Aktif</option>
                        <option value="maintenance">🟠 Bakımda</option>
                        <option value="inactive">⚫ Pasif</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Araç Görselleri */}
                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                    Araç Görselleri
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">Ön Görünüm</label>
                      <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border-4 border-slate-200 relative group">
                        {selectedVehicleForSettings.front_photo_url ? (
                          <>
                            <img src={selectedVehicleForSettings.front_photo_url} alt="Ön" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm">Değiştir</button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Camera size={32} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">Yan Görünüm</label>
                      <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border-4 border-slate-200 relative group">
                        {selectedVehicleForSettings.side_photo_url ? (
                          <>
                            <img src={selectedVehicleForSettings.side_photo_url} alt="Yan" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm">Değiştir</button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Camera size={32} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">Arka Görünüm</label>
                      <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border-4 border-slate-200 relative group">
                        {selectedVehicleForSettings.back_photo_url ? (
                          <>
                            <img src={selectedVehicleForSettings.back_photo_url} alt="Arka" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm">Değiştir</button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Camera size={32} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vitrin Bilgileri (Showcase) */}
                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                      <Store size={20} className="text-white" />
                    </div>
                    Vitrin Bilgileri (Müşterilere Gösterilir)
                  </h2>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Info size={20} className="text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">Bu bilgiler müşteri vitrininizde görünecektir</p>
                        <p className="text-xs text-amber-600 mt-1">Hizmet sağlayıcı profilinizde bu araç bilgileri müşterilere gösterilir.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kapasite</label>
                      <select
                        defaultValue={selectedVehicleForSettings.showcase_capacity || ''}
                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
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
                        defaultValue={selectedVehicleForSettings.showcase_insurance_type || ''}
                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      >
                        <option value="">Seçiniz</option>
                        <option value="tasima_kaskosu">Taşıma Kaskosu Var</option>
                        <option value="sorumluluk">Sorumluluk Sigortası</option>
                        <option value="tam_kapsamli">Tam Kapsamlı</option>
                        <option value="yok">Sigorta Yok</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ekipman</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'vinc', label: 'Vinç' },
                          { value: 'hidrolik_platform', label: 'Hidrolik Platform' },
                          { value: 'uzun_platform', label: 'Uzun Platform' },
                          { value: 'tekerleksiz_cekim', label: 'Tekerleksiz Çekim' },
                          { value: 'gps_takip', label: 'GPS Takip' },
                          { value: 'gece_aydinlatma', label: 'Gece Aydınlatma' },
                        ].map(equip => (
                          <span
                            key={equip.value}
                            className={`px-4 py-2 rounded-xl text-sm font-bold ${
                              (selectedVehicleForSettings.showcase_equipment || []).includes(equip.value)
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {equip.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Araç Açıklaması (Vitrin)</label>
                      <textarea
                        defaultValue={selectedVehicleForSettings.showcase_description || ''}
                        placeholder="Örn: Aracımız son model olup, alçak şasi spor araçlar dahil tüm binek ve hafif ticari araçları hasarsız yükleme garantisi ile taşımaktadır."
                        rows={4}
                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                      />
                      <p className="text-xs text-slate-500">Bu açıklama müşterilere gösterilecektir. Telefon, email veya sosyal medya bilgisi girmeyin.</p>
                    </div>

                    <div className="md:col-span-2">
                      <div className={`flex items-center gap-3 p-4 rounded-xl ${
                        selectedVehicleForSettings.is_showcase_vehicle 
                          ? 'bg-green-100 border-2 border-green-300' 
                          : 'bg-slate-100 border-2 border-slate-200'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedVehicleForSettings.is_showcase_vehicle 
                            ? 'bg-green-500 text-white' 
                            : 'bg-slate-300 text-slate-500'
                        }`}>
                          {selectedVehicleForSettings.is_showcase_vehicle ? <Check size={14} /> : null}
                        </div>
                        <span className={`font-bold ${
                          selectedVehicleForSettings.is_showcase_vehicle 
                            ? 'text-green-800' 
                            : 'text-slate-600'
                        }`}>
                          {selectedVehicleForSettings.is_showcase_vehicle 
                            ? '✓ Bu araç vitrin aracı olarak belirlendi' 
                            : 'Bu araç vitrin aracı olarak belirlenmedi'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sağ Kolon - İstatistikler & Hızlı İşlemler */}
              <div className="space-y-6">
                {/* İstatistikler */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-xl p-6 text-white">
                  <h3 className="text-xl font-black mb-6">Araç İstatistikleri</h3>
                  {loadingVehicleStats ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={32} className="animate-spin text-white" />
                    </div>
                  ) : vehicleStats ? (
                    <div className="space-y-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="text-sm text-blue-100 mb-1">Toplam İş</div>
                        <div className="text-3xl font-black">{vehicleStats.totalJobs}</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="text-sm text-blue-100 mb-1">Son 30 Gün</div>
                        <div className="text-3xl font-black">{vehicleStats.monthlyJobs}</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="text-sm text-blue-100 mb-1">Ortalama Puan</div>
                        <div className="text-3xl font-black">
                          {vehicleStats.averageRating > 0 ? `${vehicleStats.averageRating} ⭐` : 'Henüz yok'}
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="text-sm text-blue-100 mb-1">Toplam Kazanç</div>
                        <div className="text-2xl font-black">₺{vehicleStats.totalEarnings.toLocaleString('tr-TR')}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-blue-100 text-sm">
                      Veri yüklenemedi
                    </div>
                  )}
                </div>

                {/* Hızlı İşlemler */}
                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <h3 className="text-xl font-black text-slate-900 mb-4">Hızlı İşlemler</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-3">
                      <Calendar size={20} />
                      İş Geçmişini Gör
                    </button>
                    <button className="w-full bg-blue-500 text-white p-4 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center gap-3">
                      <FileText size={20} />
                      Belgeleri Görüntüle
                    </button>
                    <button className="w-full bg-red-500 text-white p-4 rounded-xl font-bold hover:bg-red-600 transition-all flex items-center gap-3">
                      <AlertCircle size={20} />
                      Aracı Devre Dışı Bırak
                    </button>
                  </div>
                </div>

                {/* Kaydet Butonu */}
                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <button
                    onClick={() => {
                      alert('✅ Araç bilgileri başarıyla güncellendi!');
                      setShowVehicleEditPage(false);
                      setSelectedVehicleForSettings(null);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-5 rounded-2xl font-black text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-3"
                  >
                    <Save size={24} />
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Fleet Management artık modal kullanıyor (showAddVehicleModal)

    // Ana filo sayfası
    return (
    <div className="space-y-4 lg:space-y-6">
       {/* Header - Desktop'ta normal, mobilde gizli (header'da var) */}
       <div className="hidden lg:flex justify-between items-center p-4 lg:p-0">
          <div>
             <h2 className="text-xl font-bold text-slate-800">Araç Filosu</h2>
             <p className="text-sm text-slate-500">Kayıtlı araçlarınızı yönetin ve durumlarını izleyin.</p>
          </div>
          <button
             onClick={() => setShowAddVehicleModal(true)}
             className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 flex items-center gap-2"
          >
             <Plus size={16} /> Yeni Araç Ekle
          </button>
       </div>

       {/* Mobile: Özet Bilgi */}
       <div className="lg:hidden px-4 pt-2">
         <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 text-white">
           <div>
             <p className="text-xs text-slate-400">Toplam Araç</p>
             <p className="text-2xl font-black">{fleet.length}</p>
           </div>
           <div className="flex gap-3">
             <div className="text-center">
               <p className="text-xs text-green-400">Aktif</p>
               <p className="text-lg font-bold">{fleet.filter(v => v.status === 'active').length}</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-orange-400">Bakım</p>
               <p className="text-lg font-bold">{fleet.filter(v => v.status !== 'active').length}</p>
             </div>
           </div>
         </div>
       </div>

       {/* Araç Kartları */}
       <div className="px-4 lg:px-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {fleet.length > 0 ? (
            <>
              {fleet.map(vehicle => (
             <div key={vehicle.id} className="bg-white rounded-2xl lg:rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                {/* Araç Görseli */}
                <div className="h-36 lg:h-40 bg-slate-100 relative">
                   {vehicle.front_photo_url ? (
                     <img src={vehicle.front_photo_url} alt={vehicle.plate_number} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                       <Truck size={48} className="text-slate-300" />
                     </div>
                   )}
                   <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${vehicle.status === 'active' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {vehicle.status === 'active' ? 'Aktif' : 'Bakımda'}
                   </div>
                </div>
                
                {/* Araç Bilgileri */}
                <div className="p-4 lg:p-5">
                   {/* Plaka ve Marka */}
                   <div className="flex justify-between items-start mb-3">
                      <div>
                         <h3 className="font-black text-slate-900 text-lg lg:text-xl tracking-wide">{vehicle.plate_number}</h3>
                         <p className="text-sm text-slate-500">{vehicle.brand} {vehicle.model}</p>
                      </div>
                      {/* Ayarlar - Daha büyük tıklanabilir alan */}
                      <button 
                        onClick={() => {
                          setSelectedVehicleForSettings(vehicle);
                          setShowVehicleEditPage(true);
                        }} 
                        className="p-3 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors -mr-1"
                      >
                        <Settings size={18} />
                      </button>
                   </div>
                   
                   {/* Detay Bilgiler */}
                   <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-slate-100">
                         <span className="text-slate-500">Araç Tipi</span>
                         <span className="font-semibold text-slate-800 capitalize">{vehicle.type}</span>
                      </div>
                      <div className="flex justify-between py-2">
                         <span className="text-slate-500">Sürücü</span>
                         <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                           <User size={14} className="text-slate-400" /> 
                           {vehicle.driver || CURRENT_PARTNER_NAME}
                         </span>
                      </div>
                   </div>
                   
                   {/* Aksiyon Butonları - Mobilde iki buton yan yana */}
                   <div className="mt-4 pt-2 flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedVehicleForSettings(vehicle);
                          setShowVehicleEditPage(true);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit2 size={14} /> Düzenle
                      </button>
                      <button 
                        onClick={() => setSelectedVehicleForHistory(vehicle)} 
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <History size={14} /> Geçmiş
                      </button>
                   </div>
                </div>
             </div>
          ))}
              {/* Desktop: Add New Card Placeholder */}
              <button 
                onClick={() => setShowAddVehicleModal(true)}
                className="hidden lg:flex bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all min-h-[300px] gap-3"
              >
                 <div className="w-12 h-12 rounded-full bg-white border-2 border-current flex items-center justify-center"><Plus size={24} /></div>
                 <span className="font-bold">Yeni Araç Tanımla</span>
              </button>
            </>
          ) : (
            <div className="col-span-full text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Truck size={64} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-bold text-lg mb-2">Henüz araç eklenmemiş</p>
              <p className="text-xs text-slate-400 mb-6">Filonuza ilk aracınızı ekleyin</p>
              <button
                onClick={() => setShowAddVehicleModal(true)}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 inline-flex items-center gap-2"
              >
                <Plus size={16} /> Yeni Araç Ekle
              </button>
            </div>
          )}
       </div>

       {/* Mobile FAB - Floating Action Button */}
       <button
         onClick={() => setShowAddVehicleModal(true)}
         className="lg:hidden fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-300 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-30"
       >
         <Plus size={24} strokeWidth={2.5} />
       </button>

       {/* Vehicle Settings Modal */}
       {/* Vehicle History Modal */}
       {selectedVehicleForHistory && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedVehicleForHistory(null)}>
           <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">Araç Geçmişi</h2>
                 <p className="text-sm text-gray-500 mt-1">{selectedVehicleForHistory.plate} - Tamamlanan İşler</p>
               </div>
               <button onClick={() => setSelectedVehicleForHistory(null)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                 <X size={20} />
               </button>
             </div>

             <div className="space-y-3">
               {partnerHistory.slice(0, 5).map((job, idx) => (
                 <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-300 transition-all">
                   <div className="flex items-start justify-between mb-3">
                     <div>
                       <h3 className="font-bold text-gray-900">#{job.id}</h3>
                       <p className="text-sm text-gray-500">{new Date(job.completionTime).toLocaleString('tr-TR')}</p>
                     </div>
                     <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                       Tamamlandı
                     </span>
                   </div>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div>
                       <p className="text-gray-500">Hizmet</p>
                       <p className="font-bold text-gray-900">{job.serviceType}</p>
                     </div>
                     <div>
                       <p className="text-gray-500">Müşteri</p>
                       <p className="font-bold text-gray-900">{job.customerName}</p>
                     </div>
                     <div>
                       <p className="text-gray-500">Rota</p>
                       <p className="font-bold text-gray-900">{job.startLocation} {job.endLocation ? `→ ${job.endLocation}` : ''}</p>
                     </div>
                     <div>
                       <p className="text-gray-500">Kazanç</p>
                       <p className="font-bold text-green-600">₺{job.partnerEarning}</p>
                     </div>
                   </div>
                 </div>
               ))}
             </div>

             <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
               <p className="text-sm text-blue-700">
                 <strong>Toplam {partnerHistory.length} iş</strong> bu araçla tamamlandı. Detaylı rapor için "Geçmiş İşler" sekmesini kullanabilirsiniz.
               </p>
             </div>
           </div>
         </div>
       )}
    </div>
    );
  };

  const renderServiceRoutesTab = () => {
      const filteredOriginCities = cityList.filter(c => c.toLowerCase().includes(originSearch.toLowerCase()));
      const filteredDestCities = cityList.filter(c => c.toLowerCase().includes(destSearch.toLowerCase()));
      const selectedVehicleData = fleet.find(v => v.plate === routeVehicle);

      return (
         <div className="p-4 md:p-6 space-y-6">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg shadow-slate-900/20">
               <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-2">{editingRouteId ? 'Rotayı Düzenle' : 'Boş Dönüş & Hizmet Rotaları'}</h2>
                  <p className="text-slate-100 max-w-xl text-sm mb-6">
                     {editingRouteId 
                        ? 'Mevcut rotadaki bilgileri güncelleyin.' 
                        : 'Dönüş yolunda veya belirli tarihlerde gideceğiniz güzergahları ekleyin, o rotadaki iş fırsatlarını size öncelikli olarak ve indirimli sunalım.'}
                  </p>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 grid grid-cols-1 md:grid-cols-4 gap-4">
                     
                     {/* Origin Autocomplete */}
                     <div className="space-y-1 relative" ref={originRef}>
                        <label className="text-[10px] font-bold uppercase text-blue-200 flex items-center gap-1">
                           <MapPin size={10} /> Kalkış (Nereden)
                        </label>
                        <div className="relative group">
                           <input 
                              type="text"
                              className="w-full bg-white/90 hover:bg-white border-0 rounded-xl text-slate-900 text-sm py-3 px-4 pl-10 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm transition-all placeholder-slate-400 font-medium"
                              placeholder="Şehir Ara..."
                              value={originSearch}
                              onChange={(e) => {
                                 setOriginSearch(e.target.value);
                                 if (!isOriginOpen) setIsOriginOpen(true);
                              }}
                              onFocus={() => setIsOriginOpen(true)}
                           />
                           <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 opacity-50 group-focus-within:opacity-100 transition-opacity" size={16} />
                           {originSearch && (
                               <button onClick={() => { setOriginSearch(''); setRouteOrigin(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 bg-white/50 rounded-full transition-colors">
                                   <X size={14} />
                               </button>
                           )}
                        </div>
                        <AnimatePresence>
                           {isOriginOpen && (
                              <motion.div 
                                 initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                 className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto"
                              >
                                 {filteredOriginCities.length > 0 ? filteredOriginCities.map(city => (
                                    <button 
                                       key={city}
                                       onClick={() => {
                                          setRouteOrigin(city);
                                          setOriginSearch(city);
                                          setIsOriginOpen(false);
                                       }}
                                       className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-2"
                                    >
                                       <MapPin size={14} className="text-slate-300" />
                                       {city}
                                    </button>
                                 )) : (
                                     <div className="p-4 text-center text-xs text-slate-400">Şehir bulunamadı.</div>
                                 )}
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>

                     {/* Vehicle Selector (Custom) */}
                     <div className="space-y-1 relative" ref={vehicleRef}>
                        <label className="text-[10px] font-bold uppercase text-blue-200 flex items-center gap-1">
                           <Truck size={10} /> Araç Seçimi
                        </label>
                        <button 
                           onClick={() => setIsVehicleOpen(!isVehicleOpen)}
                           className="w-full bg-white/90 hover:bg-white border-0 rounded-xl text-slate-900 text-sm py-2.5 px-4 focus:ring-2 focus:ring-blue-400 outline-none flex items-center justify-between shadow-sm transition-all h-[46px]"
                        >
                            {selectedVehicleData ? (
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={selectedVehicleData.image} alt="v" className="w-6 h-6 rounded-md object-cover ring-1 ring-slate-200" />
                                    <div className="flex flex-col items-start leading-none">
                                       <span className="truncate font-bold text-xs">{selectedVehicleData.plate}</span>
                                       <span className="text-[10px] text-slate-500">{selectedVehicleData.model}</span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-slate-400 text-sm">Araç Seçiniz</span>
                            )}
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isVehicleOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                           {isVehicleOpen && (
                              <motion.div 
                                 initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                 className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl overflow-hidden z-50"
                              >
                                 {fleet.map(v => (
                                    <button 
                                       key={v.id}
                                       onClick={() => {
                                          setRouteVehicle(v.plate);
                                          setIsVehicleOpen(false);
                                       }}
                                       className={`w-full text-left p-2.5 flex items-center gap-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors ${routeVehicle === v.plate ? 'bg-blue-50' : ''}`}
                                    >
                                        <img src={v.image} alt={v.plate} className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-100" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{v.plate}</p>
                                            <p className="text-xs text-slate-500">{v.model}</p>
                                        </div>
                                        {routeVehicle === v.plate && <Check size={16} className="ml-auto text-blue-600" />}
                                    </button>
                                 ))}
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>

                     {/* Date & Time */}
                     <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-blue-200 flex items-center gap-1">
                           <Calendar size={10} /> Tarih & Saat
                        </label>
                        <input 
                           type="datetime-local" 
                           className="w-full bg-white/90 hover:bg-white border-0 rounded-xl text-slate-900 text-sm py-3 px-4 focus:ring-2 focus:ring-blue-400 outline-none shadow-sm transition-all font-medium h-[46px]"
                           value={routeDate && routeTime ? `${routeDate}T${routeTime}` : ''}
                           onChange={(e) => {
                              const val = e.target.value;
                              if(val) {
                                    setRouteDate(val.split('T')[0]);
                                    setRouteTime(val.split('T')[1]);
                              }
                           }}
                        />
                     </div>

                     {/* Destinations Autocomplete */}
                     <div className="space-y-1 md:col-span-4 relative" ref={destRef}>
                        <label className="text-[10px] font-bold uppercase text-blue-200 flex items-center gap-1">
                           <Navigation size={10} /> Güzergah / Varışlar (Nereye)
                        </label>
                        <div className="flex gap-2 relative group">
                           <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    placeholder="Şehir ekle..." 
                                    className="w-full bg-white/90 hover:bg-white border-0 rounded-xl text-slate-900 text-sm py-3 px-4 pl-10 focus:ring-2 focus:ring-blue-400 outline-none placeholder-slate-400 shadow-sm transition-all font-medium"
                                    value={destSearch}
                                    onChange={(e) => {
                                        setDestSearch(e.target.value);
                                        if (!isDestOpen) setIsDestOpen(true);
                                    }}
                                    onFocus={() => setIsDestOpen(true)}
                                />
                                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 opacity-50 group-focus-within:opacity-100 transition-opacity" size={16} />
                                 <AnimatePresence>
                                    {isDestOpen && destSearch && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                            className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto"
                                        >
                                            {filteredDestCities.length > 0 ? filteredDestCities.map(city => (
                                                <button 
                                                    key={city}
                                                    onClick={() => addDestination(city)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                                >
                                                    <span className="flex items-center gap-2"><MapPin size={14} className="text-slate-300" /> {city}</span>
                                                    <Plus size={14} className="text-slate-300 group-hover:text-blue-500" />
                                                </button>
                                            )) : (
                                                <div className="p-4 text-center text-xs text-slate-400">Şehir bulunamadı.</div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                           </div>
                        </div>
                        {routeDestinations.length > 0 && (
                           <div className="flex flex-wrap gap-2 mt-2">
                              {routeDestinations.map(d => (
                                 <span key={d} className="bg-blue-800/50 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 border border-blue-400/30 shadow-sm backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                                    {d} <button onClick={() => removeDestination(d)} className="hover:text-red-300 transition-colors bg-black/10 rounded-full p-0.5"><X size={10} /></button>
                                 </span>
                              ))}
                           </div>
                        )}
                     </div>

                     {/* Actions */}
                     <div className="md:col-span-4 flex justify-end pt-4 gap-3 border-t border-white/10 mt-2">
                        {editingRouteId && (
                           <button onClick={cancelEdit} className="bg-white/10 border border-white/30 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all">
                                 İptal
                           </button>
                        )}
                        <button onClick={handleAddRoute} className="bg-white text-blue-700 px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 shadow-lg transition-all transform active:scale-95 flex items-center gap-2">
                           <Save size={18} /> {editingRouteId ? 'Değişiklikleri Kaydet' : 'Rotayı Kaydet'}
                        </button>
                     </div>
                  </div>
               </div>
               <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                  <Map size={300} />
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="font-bold text-slate-800 text-lg ml-1 flex items-center gap-2">
                  <Route size={20} className="text-blue-600" /> Aktif Rotalarım
               </h3>
               {activeRoutes.length > 0 ? (
                  activeRoutes.map(route => (
                     <div key={route.id} className={`bg-white rounded-2xl border p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm transition-all group hover:shadow-md ${editingRouteId === route.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                        <div className="flex items-start gap-4">
                           <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-100 transition-colors">
                                 <Route size={24} />
                           </div>
                           <div>
                                 <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <h4 className="font-bold text-slate-900 text-lg">{route.origin}</h4>
                                    <ArrowRight size={16} className="text-slate-300" />
                                    <div className="flex flex-wrap gap-1">
                                       {route.destinations.map((d: string, i: number) => (
                                          <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-sm font-medium">{d}</span>
                                       ))}
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded"><Calendar size={12} className="text-slate-400" /> {route.date}</span>
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded"><Clock size={12} className="text-slate-400" /> {route.time}</span>
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded"><Truck size={12} className="text-slate-400" /> {route.vehicle}</span>
                                 </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-50 pt-3 md:pt-0 mt-1 md:mt-0">
                           {route.matches > 0 && (
                                 <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-pulse">
                                    <Zap size={14} fill="currentColor" /> {route.matches} İş Eşleşti
                                 </div>
                           )}
                           <div className="flex ml-auto md:ml-0 gap-2">
                                 <button onClick={() => handleEditRoute(route)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100">
                                    <PenTool size={18} />
                                 </button>
                                 <button onClick={() => handleRemoveRoute(route.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100">
                                    <Trash2 size={18} />
                                 </button>
                           </div>
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Route size={32} className="opacity-50" />
                     </div>
                     <p className="font-medium text-slate-500">Henüz kayıtlı rota bulunmuyor.</p>
                     <p className="text-xs mt-1 text-slate-400">Yeni rota ekleyerek iş fırsatlarını yakalayın.</p>
                  </div>
               )}
            </div>
         </div>
      );
  };

  // ============== DEĞERLENDİRMELER TAB ==============
  const renderReviewsTab = () => {
    // İtiraz Et Tam Sayfa
    if (showObjectionPage && selectedReviewForObjection) {
      return (
        <div className="p-4 md:p-6 h-full">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <button
                onClick={() => {
                  setShowObjectionPage(false);
                  setSelectedReviewForObjection(null);
                  setObjectionReason('');
                  setObjectionDetails('');
                }}
                className="mb-4 text-sm flex items-center gap-2 hover:text-red-100 transition-colors"
              >
                <ChevronDown size={16} className="rotate-90" /> Geri Dön
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Değerlendirmeye İtiraz</h2>
                  <p className="text-sm text-red-100">İş No: #{selectedReviewForObjection.jobId}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Review Info */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                    ?
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                      <h3 className="font-bold text-slate-900 text-lg">Müşteri ***</h3>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={18} 
                            fill={i < selectedReviewForObjection.rating ? "#ef4444" : "none"} 
                            className={i < selectedReviewForObjection.rating ? "text-red-500" : "text-slate-300"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 mb-3 leading-relaxed bg-white p-3 rounded-lg">
                      "{selectedReviewForObjection.comment}"
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-slate-500">{selectedReviewForObjection.date}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-medium">{selectedReviewForObjection.service}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Objection Reason */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">İtiraz Nedeni *</label>
                <select
                  value={objectionReason}
                  onChange={(e) => setObjectionReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                >
                  <option value="">Seçiniz...</option>
                  <option value="wrong_job">Yanlış İş Kaydı</option>
                  <option value="false_claim">Haksız İddia</option>
                  <option value="customer_mistake">Müşteri Hatası</option>
                  <option value="technical_issue">Teknik Sorun</option>
                  <option value="unfair_rating">Adaletsiz Puanlama</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              {/* Objection Details */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Açıklama & Kanıtlar *</label>
                <textarea
                  value={objectionDetails}
                  onChange={(e) => setObjectionDetails(e.target.value)}
                  placeholder="İtirazınızı detaylı olarak açıklayın. Varsa fotoğraf, mesaj ekran görüntüsü gibi kanıtlarınızı açıklayın."
                  rows={10}
                  maxLength={500}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">{objectionDetails.length}/500 karakter</p>
              </div>

              {/* Warning Box */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 flex items-start gap-3">
                <Info size={22} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-2">⚠️ Önemli Bilgilendirme</p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    İtirazınız ekibimiz tarafından <strong>3 iş günü içinde</strong> incelenecektir. İtiraz haklı bulunursa değerlendirme ortalamanızdan çıkarılır. Ancak haksız itirazlar hesabınıza uyarı olarak işlenir.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowObjectionPage(false);
                    setSelectedReviewForObjection(null);
                    setObjectionReason('');
                    setObjectionDetails('');
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmitObjection}
                  disabled={!objectionReason || !objectionDetails.trim()}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> İtiraz Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Ana değerlendirmeler sayfası
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    
    // Filtrelenmiş reviews
    const filteredReviews = ratingFilter 
      ? reviews.filter(r => {
          if (ratingFilter === 2) return r.rating <= 2;
          return r.rating === ratingFilter;
        })
      : reviews;
    
    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Müşteri Değerlendirmeleri</h2>
            <p className="text-sm text-slate-500">Aldığınız puanlar ve yorumlar</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Star size={24} fill="currentColor" className="text-yellow-400" />
              <span className="text-3xl font-bold">{avgRating.toFixed(1)}</span>
            </div>
            <p className="text-xs text-slate-300">{reviews.length} Değerlendirme</p>
          </div>
        </div>

        {/* Stats - Tıklanabilir Filtreler */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setRatingFilter(null)}
            className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
              ratingFilter === null ? 'border-slate-400 shadow-md' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} fill="#64748b" className="text-slate-500" />
              <span className="text-xs font-bold text-slate-500">Tümü</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{reviews.length}</p>
          </button>
          <button
            onClick={() => setRatingFilter(5)}
            className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
              ratingFilter === 5 ? 'border-green-400 shadow-md' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} fill="#22c55e" className="text-green-500" />
              <span className="text-xs font-bold text-slate-500">5 Yıldız</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{reviews.filter(r => r.rating === 5).length}</p>
          </button>
          <button
            onClick={() => setRatingFilter(4)}
            className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
              ratingFilter === 4 ? 'border-blue-400 shadow-md' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} fill="#3b82f6" className="text-blue-500" />
              <span className="text-xs font-bold text-slate-500">4 Yıldız</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{reviews.filter(r => r.rating === 4).length}</p>
          </button>
          <button
            onClick={() => setRatingFilter(3)}
            className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
              ratingFilter === 3 ? 'border-amber-400 shadow-md' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} fill="#f59e0b" className="text-amber-500" />
              <span className="text-xs font-bold text-slate-500">3 Yıldız</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{reviews.filter(r => r.rating === 3).length}</p>
          </button>
          <button
            onClick={() => setRatingFilter(2)}
            className={`bg-white rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
              ratingFilter === 2 ? 'border-red-400 shadow-md' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} fill="#ef4444" className="text-red-500" />
              <span className="text-xs font-bold text-slate-500">≤2 Yıldız</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{reviews.filter(r => r.rating <= 2).length}</p>
          </button>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length > 0 ? (
            filteredReviews.map(review => {
            const isLowRating = review.rating < 3;
            const displayName = isLowRating ? 'Müşteri ***' : review.customerName;
            const displayPhone = isLowRating ? '**********' : review.customerPhone;
            
            return (
              <motion.div 
                key={review.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border-2 p-4 md:p-6 transition-all hover:shadow-md ${
                  isLowRating ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
                }`}
              >
                {/* Desktop Layout */}
                <div className="hidden md:flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                      isLowRating ? 'bg-red-500' : 'bg-slate-700'
                    }`}>
                      {isLowRating ? '?' : review.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{displayName}</h3>
                      <p className="text-xs text-slate-500">{review.date} • {review.service}</p>
                      {isLowRating ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                          <ShieldAlert size={12} />
                          Bilgiler gizlendi
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">{displayPhone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={18} 
                        fill={i < review.rating ? "#FFA500" : "none"} 
                        className={i < review.rating ? "text-orange-500" : "text-slate-300"}
                      />
                    ))}
                  </div>
                </div>

                {/* Mobile Layout - Avatar üstte */}
                <div className="md:hidden flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0 ${
                    isLowRating ? 'bg-red-500' : 'bg-slate-700'
                  }`}>
                    {isLowRating ? '?' : review.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">{review.date} • {review.service}</p>
                    {isLowRating && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                        <ShieldAlert size={12} />
                        Bilgiler gizlendi
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-700 mb-4 leading-relaxed">{review.comment}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {review.tags.map((tag: string, idx: number) => (
                    <span 
                      key={idx} 
                      className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                        POSITIVE_RATING_TAGS.includes(tag)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Mobile - İsim, telefon ve yıldızlar alt kısımda */}
                <div className="md:hidden space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{displayName}</h3>
                      {!isLowRating && (
                        <p className="text-xs text-slate-400 mt-0.5">{displayPhone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={16} 
                          fill={i < review.rating ? "#FFA500" : "none"} 
                          className={i < review.rating ? "text-orange-500" : "text-slate-300"}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* İş No ve İtiraz Et butonu */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 md:border-t-0 md:pt-0 mt-4 md:mt-0">
                  <span className="text-xs text-slate-400 font-mono">İş No: #{review.jobId}</span>
                  {isLowRating && (
                    <button 
                      onClick={() => handleOpenObjection(review)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <HelpCircle size={14} /> İtiraz Et
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl">
              <Star size={64} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-bold text-lg mb-2">Henüz değerlendirme yok</p>
              <p className="text-xs text-slate-400">Tamamladığınız işlerden sonra müşteri değerlendirmeleri burada görünecek</p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
          <div className="flex gap-3">
            <Info size={22} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-bold mb-2">📋 Düşük Puanlı Değerlendirmeler Hakkında</p>
              <p className="leading-relaxed">3 yıldız ve altı puan alan işlerde müşteri bilgileri (isim ve telefon) gizlenir. Bu puanlar ortalamanıza dahildir ancak iletişim bilgilerine erişiminiz kısıtlanır. Bu, her iki tarafın da güvenliği için alınan bir önlemdir.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSupportTab = () => {
    // Yeni talep oluşturma sayfası
    if (showNewTicketPage) {
      return (
        <div className="p-4 md:p-6 h-full">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <button
                onClick={() => {
                  setShowNewTicketPage(false);
                  setTicketSubject('');
                  setTicketCategory('');
                  setTicketDescription('');
                }}
                className="mb-4 text-sm flex items-center gap-2 hover:text-blue-100 transition-colors"
              >
                <ChevronDown size={16} className="rotate-90" /> Geri Dön
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Yeni Destek Talebi</h2>
                  <p className="text-sm text-blue-100">Sorununuzu detaylı olarak açıklayın</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Kategori *</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Seçiniz...</option>
                  <option value="technical">Teknik Sorun</option>
                  <option value="customer_complaint">Müşteri Şikayeti</option>
                  <option value="account">Hesap İşlemleri</option>
                  <option value="document">Belge & Onay</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Konu *</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Örn: Uygulamada teknik bir sorun yaşıyorum"
                  maxLength={100}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">{ticketSubject.length}/100 karakter</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Açıklama *</label>
                <textarea
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Sorununuzu detaylı olarak açıklayın. Gerekirse iş numarası, tarih gibi bilgileri ekleyin."
                  rows={8}
                  maxLength={1000}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">{ticketDescription.length}/1000 karakter</p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-900 mb-1">Destek Süresi</p>
                  <p className="text-xs text-blue-700">
                    Talepler genellikle 2-4 iş saati içinde yanıtlanır.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewTicketPage(false);
                    setTicketSubject('');
                    setTicketCategory('');
                    setTicketDescription('');
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    if (!ticketCategory || !ticketSubject.trim() || !ticketDescription.trim()) {
                      alert('Lütfen tüm zorunlu alanları doldurun.');
                      return;
                    }
                    // Destek talebi console'a logla (API bağlantısı sonrası eklenecek)
                    console.log('Destek Talebi:', {
                      partnerId: CURRENT_PARTNER_ID,
                      partnerName: CURRENT_PARTNER_NAME,
                      category: ticketCategory,
                      subject: ticketSubject,
                      description: ticketDescription
                    });
                    setShowNewTicketPage(false);
                    setTicketSubject('');
                    setTicketCategory('');
                    setTicketDescription('');
                    alert('Destek talebiniz başarıyla oluşturuldu.');
                  }}
                  disabled={!ticketCategory || !ticketSubject.trim() || !ticketDescription.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Talep Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const renderTicketDetailModal = () => {
        if (!selectedTicket) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Destek Talebi Detayı</h2>
                                <p className="text-sm text-white/80">Talep No: #{selectedTicket.id}</p>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <p><span className="font-bold">Konu:</span> {selectedTicket.subject}</p>
                        <p><span className="font-bold">Tarih:</span> {selectedTicket.date}</p>
                        <p><span className="font-bold">Durum:</span> {selectedTicket.status}</p>
                        <p className="mt-4 pt-4 border-t border-slate-200"><span className="font-bold">Detaylar:</span></p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.</p>
                    </div>
                </motion.div>
            </div>
        );
    };

    // Ana destek sayfası
    return (
     <div className="p-4 md:p-6 h-full flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4"><Headphones size={24} /></div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Canlı Destek</h3>
              <p className="text-slate-500 text-sm mb-6">Operasyonel sorunlar için 7/24 temsilcilerimize bağlanın.</p>
              <button className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">Sohbeti Başlat</button>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><FileText size={24} /></div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Talep Oluştur</h3>
              <p className="text-slate-500 text-sm mb-6">Finansal konular veya şikayetler için bilet oluşturun.</p>
              <button
                 onClick={() => setShowNewTicketPage(true)}
                 className="w-full py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-xl font-bold hover:border-blue-200 hover:text-blue-600 transition-colors"
              >
                 Yeni Bilet Aç
              </button>
           </div>
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
           <h3 className="font-bold text-slate-800 mb-4">Geçmiş Taleplerim</h3>
           <div className="space-y-2">
              {tickets.length > 0 ? (
                tickets.map(ticket => (
                 <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                       <div>
                          <p className="font-bold text-slate-800 text-sm">{ticket.subject} <span className="text-slate-400 font-normal">#{ticket.id}</span></p>
                          <p className="text-xs text-slate-500">{ticket.date}</p>
                       </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                       {ticket.status === 'open' ? 'Açık' : 'Çözüldü'}
                    </div>
                 </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Headphones size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">Henüz destek talebi yok</p>
                  <p className="text-xs text-slate-400 mt-2">Sorularınız veya sorunlarınız için yukarıdan talep oluşturabilirsiniz</p>
                </div>
              )}
           </div>
        </div>
        <AnimatePresence>
            {selectedTicket && renderTicketDetailModal()}
        </AnimatePresence>
     </div>
    );
  };

  // ============== KABUL EDİLEN İŞLER TAB ==============
  const renderAcceptedJobsTab = () => {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Kabul Edilen İşler</h1>
          <p className="text-sm text-slate-600">Teklifiniz kabul edildi! İşe başlamak için "Operasyonu Başlat" butonuna basın</p>
        </div>

        {acceptedJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Kabul Edilmiş İş Yok</h3>
            <p className="text-sm text-slate-600 mb-4">Müşteriler tekliflerinizi kabul ettiğinde burada görünecek</p>
            <button
              onClick={() => setActiveTab('requests')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              İş Taleplerini Gör
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {acceptedJobs.map((request) => {
              const jobRequest: JobRequest = {
                id: request.id,
                customerName: request.customerName || 'Müşteri',
                phone: request.customerPhone || '',
                location: request.fromLocation || '',
                dropoffLocation: request.toLocation || '',
                vehicleInfo: request.vehicleInfo || 'Araç bilgisi yok',
                serviceType: request.serviceType === 'cekici' ? 'Çekici' : 
                            request.serviceType === 'vinc' ? 'Vinç' : 'Hizmet',
                urgency: 'medium',
                distance: '0 km',
                estimatedPrice: request.amount?.toString() || '0',
                description: request.description || '',
                _originalRequest: request,
              };

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border-2 border-green-200 shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={24} className="text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{jobRequest.serviceType}</h3>
                          <p className="text-sm text-slate-500">{jobRequest.customerName}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        ✅ Kabul Edildi
                      </span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-700">Nereden:</p>
                          <p className="text-slate-600">{jobRequest.location}</p>
                        </div>
                      </div>
                      {jobRequest.dropoffLocation && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-slate-700">Nereye:</p>
                            <p className="text-slate-600">{jobRequest.dropoffLocation}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Truck size={16} className="text-slate-500" />
                        <p className="text-slate-600">{jobRequest.vehicleInfo}</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleStartOperation(jobRequest)}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <ArrowRight size={18} />
                        Operasyonu Başlat
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============== GÖNDERİLEN TEKLİFLER TAB ==============
  const renderMyOffersTab = () => {
    const sentOffers = myOffers.filter(o => o.status === 'sent');
    const acceptedOffers = myOffers.filter(o => o.status === 'accepted');
    const rejectedOffers = myOffers.filter(o => o.status === 'rejected');
    const withdrawnOffers = myOffers.filter(o => o.status === 'withdrawn');

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'sent':
          return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">⏳ Beklemede</span>;
        case 'accepted':
          return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✅ Kabul Edildi</span>;
        case 'rejected':
          return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">❌ Reddedildi</span>;
        case 'withdrawn':
          return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">🚫 İptal Edildi</span>;
        default:
          return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{status}</span>;
      }
    };

    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Gönderilen Tekliflerim</h1>
          <p className="text-sm text-slate-600">Müşterilere gönderdiğiniz teklifleri takip edin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-bold mb-1">Beklemede</p>
            <p className="text-2xl font-black text-blue-700">{sentOffers.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs text-green-600 font-bold mb-1">Kabul Edildi</p>
            <p className="text-2xl font-black text-green-700">{acceptedOffers.length}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs text-red-600 font-bold mb-1">Reddedildi</p>
            <p className="text-2xl font-black text-red-700">{rejectedOffers.length}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600 font-bold mb-1">İptal Edildi</p>
            <p className="text-2xl font-black text-gray-700">{withdrawnOffers.length}</p>
          </div>
        </div>

        {/* Offers List */}
        {myOffers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Henüz Teklif Göndermediniz</h3>
            <p className="text-sm text-slate-600 mb-4">İş taleplerine teklif göndererek kazanmaya başlayın</p>
            <button
              onClick={() => setActiveTab('requests')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              İş Taleplerini Gör
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myOffers.map((offer) => {
              const canCancel = offer.status === 'sent';
              
              return (
                <div key={offer.id} className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Left: Offer Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <Truck size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900">Teklif #{offer.id.slice(0, 8)}</h3>
                            {getStatusBadge(offer.status)}
                          </div>
                          <p className="text-xs text-slate-500">
                            Talep: #{offer.requestId.slice(0, 8)} • {new Date(offer.createdAt).toLocaleDateString('tr-TR')} {new Date(offer.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {offer.message && (
                        <div className="ml-13 p-3 bg-slate-50 rounded-lg mb-3">
                          <p className="text-xs text-slate-600">{offer.message}</p>
                        </div>
                      )}

                      <div className="ml-13 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-green-600" />
                          <span className="font-bold text-slate-900">₺{offer.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-600" />
                          <span className="text-sm text-slate-600">{offer.etaMinutes} dakika</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex lg:flex-col gap-2">
                      {canCancel && (
                        <button
                          onClick={() => handleCancelOffer(offer.id)}
                          className="flex-1 lg:w-32 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <X size={16} />
                          <span>İptal Et</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Info */}
                  {offer.status === 'sent' && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-blue-600 flex items-center gap-2">
                        <Info size={14} />
                        Müşteri teklifinizi değerlendiriyor. Bildirim geldiğinde haberdar olacaksınız.
                      </p>
                    </div>
                  )}
                  {offer.status === 'accepted' && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-green-600 flex items-center gap-2">
                        <CheckCircle size={14} />
                        Tebrikler! Teklifiniz kabul edildi. Müşteriyle iletişime geçebilirsiniz.
                      </p>
                    </div>
                  )}
                  {offer.status === 'rejected' && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-red-600 flex items-center gap-2">
                        <XCircle size={14} />
                        Teklifiniz reddedildi. Başka işlere teklif verebilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============== YENİ İŞLER TAB ==============
  const renderNewJobsTab = () => {
    // Convert B2C requests to JobRequest format, keep reference to original
    const b2cJobRequests: (JobRequest & { _originalRequest?: Request })[] = customerRequests.map(req => ({
      id: req.id,
      serviceType: req.serviceType === 'cekici' ? 'Çekici Hizmeti' :
                   req.serviceType === 'aku' ? 'Akü Takviyesi' :
                   req.serviceType === 'lastik' ? 'Lastik Değişimi' :
                   req.serviceType === 'yakit' ? 'Yakıt Desteği' : 'Yol Yardımı',
      location: req.fromLocation,
      dropoffLocation: req.toLocation,
      distance: '~5 km', // Mock distance
      price: req.amount || 500, // Estimated
      timestamp: new Date(req.createdAt).toLocaleString('tr-TR'),
      customerName: req.customerName || 'B2C Müşteri',
      vehicleInfo: req.vehicleInfo || 'Belirtilmedi',
      urgency: 'normal' as const,
      notes: req.description,
      _originalRequest: req // Keep reference to original B2C request
    }));

    // Combine mock requests with B2C requests
    const allRequests: (JobRequest & { _originalRequest?: Request })[] = [...requests, ...b2cJobRequests];

    const filteredNewJobs = allRequests.filter(req => {
      if (newJobsFilter === 'nearest') return parseFloat(req.distance) < 10;
      if (newJobsFilter === 'urgent') return req.urgency === 'high';
      return true;
    });

    // Handler for offer button - routes to correct modal based on job type
    const handleOfferClick = (job: JobRequest & { _originalRequest?: Request }) => {
      if (job._originalRequest) {
        // B2C request - use customer offer modal
        handleOpenCustomerOfferModal(job._originalRequest);
      } else {
        // Mock job - use regular quote modal
        setSelectedJobForQuote(job);
        setQuotePrice(job.estimatedPrice?.toString() || '');
      }
    };

    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Hizmet Bölgesi Bilgisi */}
        {partnerServiceAreas.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                <MapPin size={20} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-blue-800">Hizmet Bölgeniz:</span>
                  {partnerServiceAreas.map((city, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                      {city}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Sadece bu bölgelerdeki iş talepleri gösterilmektedir
                </p>
              </div>
            </div>
          </div>
        )}
        
        {partnerServiceAreas.length === 0 && serviceAreasLoaded && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">Hizmet Bölgesi Tanımlı Değil</p>
                <p className="text-xs text-amber-600 mt-1">
                  Ayarlar → Hizmet Bölgeleri'nden bölgenizi tanımlayın
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'Tümü', icon: LayoutList },
              { id: 'nearest', label: 'En Yakın', icon: Navigation },
              { id: 'urgent', label: 'Acil İşler', icon: AlertTriangle },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setNewJobsFilter(filter.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  newJobsFilter === filter.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                }`}
              >
                <filter.icon size={16} /> {filter.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock size={16} />
            <span>{filteredNewJobs.length} Yeni İş</span>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredNewJobs.map(job => {
            const isUnlocked = unlockedJobs.includes(job.id);
            const isOffering = offeringJobId === job.id;
            const hasError = offerError === job.id;
            
            // Check if partner has already sent an offer for this job
            const myOfferForThisJob = myOffers.find(offer => 
              offer.requestId === job.id && 
              (offer.status === 'sent' || offer.status === 'accepted')
            );
            const hasPendingOffer = myOfferForThisJob && myOfferForThisJob.status === 'sent';
            const hasAcceptedOffer = myOfferForThisJob && myOfferForThisJob.status === 'accepted';
            
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-xl ${
                  isUnlocked || hasAcceptedOffer ? 'border-green-300 bg-green-50/50' : 
                  hasPendingOffer ? 'border-blue-300 bg-blue-50/50' :
                  hasError ? 'border-red-300 bg-red-50/50' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isUnlocked || hasAcceptedOffer ? 'bg-green-100 text-green-600' : 
                      hasPendingOffer ? 'bg-blue-100 text-blue-600' :
                      job._originalRequest ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {job.serviceType.includes('Çekici') ? <Truck size={24} /> : <Wrench size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{job.serviceType}</h3>
                      <p className="text-xs text-slate-500">#{job.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasPendingOffer && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Clock size={12} /> Beklemede
                      </span>
                    )}
                    {hasAcceptedOffer && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={12} /> Kabul Edildi
                      </span>
                    )}
                    {job._originalRequest && (
                      <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-full">
                        B2C
                      </span>
                    )}
                    {job.urgency === 'high' && (
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle size={12} /> ACİL
                      </span>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Alınacak Konum</p>
                      <p className="font-bold text-slate-800">{job.location}</p>
                      <p className="text-xs text-blue-600 mt-1">📍 {job.distance} uzakta</p>
                    </div>
                  </div>
                  {job.dropoffLocation && (
                    <div className="flex items-start gap-2">
                      <Navigation size={16} className="text-green-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Teslim Noktası</p>
                        <p className="font-bold text-slate-800">{job.dropoffLocation}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-slate-600">{job.timestamp}</span>
                  </div>
                  {job.estimatedPrice && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign size={14} className="text-green-600" />
                      <span className="font-bold text-green-600">~₺{job.estimatedPrice}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedJobForDetail(job)}
                    className="flex-1 py-2 border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:border-blue-300 hover:text-blue-600 transition-all"
                  >
                    İncele
                  </button>
                  
                  {/* Teklif durumuna göre buton göster */}
                  {hasPendingOffer ? (
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-200">
                        <Clock size={14} /> Teklif Değerlendiriliyor
                      </div>
                      <button
                        onClick={() => setActiveTab('offers')}
                        className="py-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Teklifimi Görüntüle →
                      </button>
                    </div>
                  ) : hasAcceptedOffer ? (
                    <button
                      onClick={() => handleStartOperation(job)}
                      className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    >
                      Operasyonu Başlat <ArrowRight size={16} />
                    </button>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleStartOperation(job)}
                      className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      Operasyonu Başlat <ArrowRight size={16} />
                    </button>
                  ) : isOffering ? (
                    <div className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-100">
                      <Loader2 size={14} className="animate-spin" /> Değerlendiriliyor...
                    </div>
                  ) : hasError ? (
                    <div className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-red-100">
                      <AlertTriangle size={14} /> Ret Edildi
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOfferClick(job)}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={16} /> Teklif Ver
                    </button>
                  )}
                </div>
                
                {/* Teklif Bilgisi */}
                {myOfferForThisJob && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-600">Gönderdiğiniz Teklif</p>
                      {myOfferForThisJob.status === 'sent' && (
                        <span className="text-xs text-blue-600">⏳ Değerlendiriliyor</span>
                      )}
                      {myOfferForThisJob.status === 'accepted' && (
                        <span className="text-xs text-green-600">✅ Kabul Edildi</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-green-600" />
                        <span className="font-bold text-slate-900">₺{myOfferForThisJob.price}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-blue-600" />
                        <span className="text-slate-700">{myOfferForThisJob.etaMinutes} dk</span>
                      </div>
                      {myOfferForThisJob.status === 'sent' && (
                        <button
                          onClick={() => handleCancelOffer(myOfferForThisJob.id)}
                          className="ml-auto text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                        >
                          <X size={12} /> İptal Et
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {filteredNewJobs.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Yeni İş Bulunamadı</h3>
            <p className="text-slate-500">Seçili filtreye uygun iş talebi yok</p>
          </div>
        )}
      </div>
    );
  };

  // ============== BOŞ DÖNEN ARAÇLAR TAB ==============
  const renderEmptyTrucksTab = () => {
    return (
      <div className="p-4 md:p-6">
        <ReturnRoutesManager 
          partnerId={CURRENT_PARTNER_ID}
          partnerVehicles={fleet as PartnerVehicle[]}
          onToast={showToast}
        />
      </div>
    );
  };

  // ============== ANA SAYFA TAB ==============
  const renderHomeTab = () => (
    <div className="p-4 md:p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleTabChange('requests')}
          className="bg-slate-800 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Bell size={24} className="opacity-80" />
            <span className="text-3xl font-black">{requests.length}</span>
          </div>
          <p className="text-sm font-bold opacity-80">Yeni İş Talebi</p>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className="bg-slate-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={24} className="opacity-80" />
            <span className="text-3xl font-black">{partnerHistory.filter(h => h.status === 'completed').length}</span>
          </div>
          <p className="text-sm font-bold opacity-80">Tamamlanan İş</p>
        </button>

        <button
          onClick={() => handleTabChange('emptyTrucks')}
          className="bg-slate-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Truck size={24} className="opacity-80" />
            <span className="text-3xl font-black">{emptyTrucks.length}</span>
          </div>
          <p className="text-sm font-bold opacity-80">Boş Araç</p>
        </button>

        <button
          onClick={() => handleTabChange('reviews')}
          className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Star size={24} className="opacity-80" fill="currentColor" />
            <span className="text-3xl font-black">{reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) : '-'}</span>
          </div>
          <p className="text-sm font-bold opacity-80">Ortalama Puan ({reviews.length})</p>
        </button>
      </div>

      {/* Recent Jobs & Empty Trucks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Star size={20} className="text-yellow-500" fill="currentColor" /> Yeni İşler
            </h3>
            <button
              onClick={() => setActiveTab('newJobs')}
              className="text-sm text-blue-600 font-bold hover:text-blue-700"
            >
              Tümünü Gör →
            </button>
          </div>
          <div className="space-y-3">
            {requests.slice(0, 3).map(job => (
              <div key={job.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-sm">{job.serviceType}</span>
                  <span className="text-xs text-slate-500">{job.distance}</span>
                </div>
                <p className="text-xs text-slate-600">{job.location}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Empty Trucks */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Truck size={20} className="text-orange-600" /> Boş Dönen Araçlar
            </h3>
            <button
              onClick={() => setActiveTab('emptyTrucks')}
              className="text-sm text-blue-600 font-bold hover:text-blue-700"
            >
              Tümünü Gör →
            </button>
          </div>
          <div className="space-y-3">
            {emptyTrucks.slice(0, 3).map(truck => (
              <div key={truck.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-orange-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-sm">{truck.vehicle}</span>
                  <span className="text-xs text-slate-500">{truck.date}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {truck.origin} → {truck.destinations[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-6">Hızlı İşlemler</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('newJobs')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 transition-all text-center"
          >
            <Star size={32} className="mx-auto mb-2 text-yellow-400" />
            <p className="text-sm font-bold">Yeni İşler</p>
          </button>
          <button
            onClick={() => setActiveTab('emptyTrucks')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 transition-all text-center"
          >
            <Truck size={32} className="mx-auto mb-2 text-orange-400" />
            <p className="text-sm font-bold">Boş Araç Ekle</p>
          </button>
          <button
            onClick={() => setShowAddCreditModal(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 transition-all text-center"
          >
            <Coins size={32} className="mx-auto mb-2 text-green-400" />
            <p className="text-sm font-bold">Kredi Yükle</p>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 transition-all text-center"
          >
            <Settings size={32} className="mx-auto mb-2 text-purple-400" />
            <p className="text-sm font-bold">Ayarlar</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
     <div className="p-4 md:p-6 space-y-6">
        {/* Profil Özeti Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* Firma Adı Kartı */}
           <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Briefcase size={20} />
                 </div>
                 <div className="flex-1">
                    <p className="text-xs font-bold opacity-80">Firma Adı</p>
                    <p className="text-lg font-black">{CURRENT_PARTNER_NAME}</p>
                 </div>
              </div>
           </div>

           {/* İletişim Kartı */}
           <div className="bg-slate-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Phone size={20} />
                 </div>
                 <div className="flex-1">
                    <p className="text-xs font-bold opacity-80">İletişim</p>
                    <p className="text-sm font-bold">Platform Mesajları</p>
                    <p className="text-xs opacity-80 truncate">Bildirimler açık</p>
                 </div>
              </div>
           </div>

           {/* Kredi Kartı */}
           <div className="bg-slate-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <DollarSign size={20} />
                 </div>
                 <div className="flex-1">
                    <p className="text-xs font-bold opacity-80">Kredi Hakkı</p>
                    <p className="text-2xl font-black">{credits}</p>
                 </div>
              </div>
           </div>

           {/* Puan Kartı */}
           <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Star size={20} fill="currentColor" />
                 </div>
                 <div className="flex-1">
                    <p className="text-xs font-bold opacity-80">Firma Puanı</p>
                    <div className="flex items-center gap-2">
                       <p className="text-2xl font-black">{CURRENT_PARTNER_RATING || 0}</p>
                       <div className="flex">
                          {[...Array(5)].map((_, i) => (
                             <Star key={i} size={12} fill={i < Math.round(CURRENT_PARTNER_RATING || 0) ? "currentColor" : "none"} className="opacity-80" />
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Ana İçerik: Sidebar + Detay */}
        <div className="flex flex-col md:flex-row gap-6">
           {/* Sol Sidebar - Menü */}
           <div className="w-full md:w-64 shrink-0 space-y-1">
              {[
                 { id: 'profile', label: 'Firma Bilgileri', icon: Briefcase },
                 { id: 'notifications', label: 'Bildirim Ayarları', icon: Bell },
                 { id: 'security', label: 'Şifre Değiştir', icon: Lock },
                 { id: 'company', label: 'Şirket Bilgileri', icon: Building },
                 { id: 'vehicles', label: 'Araç Bilgileri', icon: Truck },
                 { id: 'contact', label: 'İletişim Bilgileri', icon: Phone },
                 { id: 'services', label: 'Hizmet Ayarları', icon: Wrench },
                 { id: 'serviceAreas', label: 'Hizmet Bölgeleri', icon: Map },
                 { id: 'returnRoutes', label: 'Boş Dönüş Rotaları', icon: Route },
                 { id: 'documents', label: 'Belgeler', icon: FileCheck },
              ].map(item => (
                 <button 
                   key={item.id}
                   onClick={() => setSettingsSubTab(item.id as any)}
                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsSubTab === item.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                 >
                    <item.icon size={18} /> {item.label}
                 </button>
              ))}
           </div>

           {/* Sağ İçerik Alanı */}
           <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
              {settingsSubTab === 'profile' && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h2 className="text-2xl font-bold text-slate-800">Firma Profil Bilgileri</h2>
                       <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                          <CheckCircle2 size={16} /> Doğrulanmış
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200">
                       <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 overflow-hidden shadow-md">
                          {companyLogo ? (
                            <img 
                              src={createPreviewUrl(companyLogo)} 
                              alt="Firma Logosu" 
                              className="w-full h-full object-cover"
                            />
                          ) : existingLogoUrl ? (
                            <img 
                              src={existingLogoUrl} 
                              alt="Firma Logosu" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera size={32} className="text-slate-400" />
                          )}
                       </div>
                       <div className="flex-1">
                          <h3 className="font-bold text-slate-800 mb-1">Firma Logosu</h3>
                          <p className="text-sm text-slate-500 mb-3">Profesyonel bir görünüm için firma logonuzu yükleyin</p>
                          {isEditingProfile && (
                            <label className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all cursor-pointer inline-flex items-center gap-2">
                              {isCompressingLogo ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  İşleniyor...
                                </>
                              ) : (
                                <>
                                  <Upload size={16} />
                                  Logo Yükle
                                </>
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleLogoUpload}
                                disabled={isCompressingLogo}
                              />
                            </label>
                          )}
                          <p className="text-xs text-slate-400 mt-2">PNG, JPG (Max. 2MB)</p>
                       </div>
                    </div>

                    {/* Profil Fotoğrafı Alanı */}
                    <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-slate-50 to-purple-50 rounded-2xl border border-slate-200">
                       <div className="w-24 h-24 rounded-full bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 overflow-hidden shadow-md">
                          {profilePhoto ? (
                            <img 
                              src={createPreviewUrl(profilePhoto)} 
                              alt="Profil Fotoğrafı" 
                              className="w-full h-full object-cover"
                            />
                          ) : existingProfilePhotoUrl ? (
                            <img 
                              src={existingProfilePhotoUrl} 
                              alt="Profil Fotoğrafı" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={32} className="text-slate-400" />
                          )}
                       </div>
                       <div className="flex-1">
                          <h3 className="font-bold text-slate-800 mb-1">Profil Fotoğrafı</h3>
                          <p className="text-sm text-slate-500 mb-3">Hesabınız için profil fotoğrafı ekleyin</p>
                          {isEditingProfile && (
                            <label className="bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all cursor-pointer inline-flex items-center gap-2">
                              {isCompressingProfile ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  İşleniyor...
                                </>
                              ) : (
                                <>
                                  <Upload size={16} />
                                  Fotoğraf Yükle
                                </>
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleProfilePhotoUpload}
                                disabled={isCompressingProfile}
                              />
                            </label>
                          )}
                          <p className="text-xs text-slate-400 mt-2">PNG, JPG (Max. 2MB)</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Firma Adı *</label>
                          <input 
                            type="text" 
                            value={partnerFormData.company_name}
                            onChange={(e) => setPartnerFormData({...partnerFormData, company_name: e.target.value})}
                            disabled={!isEditingProfile}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vergi/TC Numarası *</label>
                          <input 
                            type="text" 
                            value={partnerFormData.tax_number}
                            onChange={(e) => setPartnerFormData({...partnerFormData, tax_number: e.target.value})}
                            disabled={!isEditingProfile}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-Posta Adresi *</label>
                          <input 
                            type="email" 
                            value={partnerFormData.email}
                            onChange={(e) => setPartnerFormData({...partnerFormData, email: e.target.value})}
                            placeholder="ornek@firma.com" 
                            disabled={!isEditingProfile}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefon Numarası *</label>
                          <input 
                            type="tel" 
                            value={partnerFormData.phone}
                            onChange={(e) => setPartnerFormData({...partnerFormData, phone: e.target.value})}
                            placeholder="05XX XXX XX XX" 
                            disabled={!isEditingProfile}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adres</label>
                          <textarea 
                            rows={3} 
                            value={partnerFormData.address}
                            onChange={(e) => setPartnerFormData({...partnerFormData, address: e.target.value})}
                            placeholder="Adresinizi giriniz" 
                            disabled={!isEditingProfile}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                          ></textarea>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                       {!isEditingProfile ? (
                         <button 
                           onClick={() => setIsEditingProfile(true)}
                           className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                         >
                           <Edit2 size={18} /> Düzenle
                         </button>
                       ) : (
                         <>
                           <button 
                             onClick={handleCancelProfileEdit}
                             className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all"
                           >
                             İptal
                           </button>
                           <button 
                             onClick={handleSaveProfileSettings}
                             disabled={isSavingSettings}
                             className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              {isSavingSettings ? (
                                <>
                                  <Loader2 size={18} className="animate-spin" /> Kaydediliyor...
                                </>
                              ) : (
                                <>
                                  <Check size={18} /> Değişiklikleri Kaydet
                                </>
                              )}
                           </button>
                         </>
                       )}
                    </div>
                 </div>
              )}

              {settingsSubTab === 'notifications' && (
                 <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Bildirim Tercihleri</h2>
                    <p className="text-sm text-slate-500">Hangi durumlarda bildirim almak istediğinizi seçin</p>

                    <div className="space-y-4">
                       {/* Yeni İş Bildirimleri */}
                       <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-md">
                                   <Bell size={20} />
                                </div>
                                <div>
                                   <h3 className="font-bold text-slate-800">Yeni İş Talepleri</h3>
                                   <p className="text-xs text-slate-600">Konumunuza yakın yeni işler için anlık bildirim</p>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-3 ml-15">
                             <label className="flex items-center justify-between p-3 bg-white rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                <span className="text-sm font-bold text-slate-700">Push Bildirimi</span>
                                <input 
                                  type="checkbox" 
                                  checked={notificationPreferences.new_job_push_enabled}
                                  onChange={(e) => setNotificationPreferences({...notificationPreferences, new_job_push_enabled: e.target.checked})}
                                  className="w-5 h-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500" 
                                />
                             </label>
                             <label className="flex items-center justify-between p-3 bg-white rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                <span className="text-sm font-bold text-slate-700">SMS Bildirimi</span>
                                <input 
                                  type="checkbox" 
                                  checked={notificationPreferences.new_job_sms_enabled}
                                  onChange={(e) => setNotificationPreferences({...notificationPreferences, new_job_sms_enabled: e.target.checked})}
                                  className="w-5 h-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500" 
                                />
                             </label>
                             <label className="flex items-center justify-between p-3 bg-white rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                <span className="text-sm font-bold text-slate-700">E-posta Bildirimi</span>
                                <input 
                                  type="checkbox" 
                                  checked={notificationPreferences.new_job_email_enabled}
                                  onChange={(e) => setNotificationPreferences({...notificationPreferences, new_job_email_enabled: e.target.checked})}
                                  className="w-5 h-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500" 
                                />
                             </label>
                          </div>
                       </div>

                       {/* Teklif Durumu */}
                       <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-white shadow-md">
                                   <CheckCircle2 size={20} />
                                </div>
                                <div>
                                   <h3 className="font-bold text-slate-800">Teklif Kabul/Red</h3>
                                   <p className="text-xs text-slate-600">Tekliflerinizin durumu değiştiğinde</p>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-3 ml-15">
                             <label className="flex items-center justify-between p-3 bg-white rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                <span className="text-sm font-bold text-slate-700">Push Bildirimi</span>
                                <input 
                                  type="checkbox" 
                                  checked={notificationPreferences.offer_status_push_enabled}
                                  onChange={(e) => setNotificationPreferences({...notificationPreferences, offer_status_push_enabled: e.target.checked})}
                                  className="w-5 h-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500" 
                                />
                             </label>
                             <label className="flex items-center justify-between p-3 bg-white rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                <span className="text-sm font-bold text-slate-700">SMS Bildirimi</span>
                                <input 
                                  type="checkbox" 
                                  checked={notificationPreferences.offer_status_sms_enabled}
                                  onChange={(e) => setNotificationPreferences({...notificationPreferences, offer_status_sms_enabled: e.target.checked})}
                                  className="w-5 h-5 rounded border-slate-300 text-slate-600 focus:ring-slate-500" 
                                />
                             </label>
                          </div>
                       </div>

                       {/* Ödeme Bildirimleri */}
                       <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center text-white shadow-md">
                                   <DollarSign size={20} />
                                </div>
                                <div>
                                   <h3 className="font-bold text-slate-800">Ödeme & Cüzdan</h3>
                                   <p className="text-xs text-slate-600">Ödeme alındığında veya kredi değişiminde</p>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-3 ml-15">
                             <label className="flex items-center justify-between p-3 bg-white rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                <span className="text-sm font-bold text-slate-700">Push Bildirimi</span>
                                <input 
                                  type="checkbox" 
                                  checked={notificationPreferences.payment_push_enabled}
                                  onChange={(e) => setNotificationPreferences({...notificationPreferences, payment_push_enabled: e.target.checked})}
                                  className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                                />
                             </label>
                             <label className="flex items-center justify-between p-3 bg-white rounded-xl cursor-pointer hover:bg-purple-50 transition-colors">
                                <span className="text-sm font-bold text-slate-700">E-posta Bildirimi</span>
                                <input 
                                  type="checkbox" 
                                  checked={notificationPreferences.payment_email_enabled}
                                  onChange={(e) => setNotificationPreferences({...notificationPreferences, payment_email_enabled: e.target.checked})}
                                  className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                                />
                             </label>
                          </div>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                       <button 
                         onClick={handleSaveNotificationPreferences}
                         disabled={isSavingNotificationPrefs}
                         className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          {isSavingNotificationPrefs ? (
                            <>
                              <Loader2 size={18} className="animate-spin" /> Kaydediliyor...
                            </>
                          ) : (
                            <>
                              <Check size={18} /> Tercihleri Kaydet
                            </>
                          )}
                       </button>
                    </div>
                 </div>
              )}

              {settingsSubTab === 'security' && (
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                          <Lock size={24} />
                       </div>
                       <div>
                          <h2 className="text-2xl font-bold text-slate-800">Şifre Değiştir</h2>
                          <p className="text-sm text-slate-500">Hesap güvenliğiniz için düzenli olarak şifrenizi güncelleyin</p>
                       </div>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3 text-sm text-yellow-800">
                       <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                       <div>
                          <p className="font-bold mb-1">Güçlü Şifre Önerileri:</p>
                          <ul className="text-xs space-y-1 ml-4 list-disc">
                             <li>En az 8 karakter uzunluğunda olmalı</li>
                             <li>Büyük ve küçük harf içermeli</li>
                             <li>En az 1 rakam ve 1 özel karakter bulunmalı</li>
                          </ul>
                       </div>
                    </div>

                    <div className="space-y-4 max-w-md">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mevcut Şifre *</label>
                          <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={passwordFormData.currentPassword}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yeni Şifre *</label>
                          <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={passwordFormData.newPassword}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yeni Şifre Tekrar *</label>
                          <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={passwordFormData.confirmPassword}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                          />
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                       <button 
                         onClick={() => setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                         className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all"
                       >
                         İptal
                       </button>
                       <button 
                         onClick={handlePasswordChange}
                         disabled={isChangingPassword}
                         className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2 disabled:opacity-50"
                       >
                          <Lock size={18} /> {isChangingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                       </button>
                    </div>
                 </div>
              )}

              {settingsSubTab === 'company' && (
                 <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Şirket Bilgileri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticaret Sicil No</label>
                          <input 
                            type="text" 
                            placeholder="12345/6789" 
                            value={companyFormData.trade_registry_number}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, trade_registry_number: e.target.value })}
                            disabled={!isEditingCompanyInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mersis No</label>
                          <input 
                            type="text" 
                            placeholder="0123456789012345" 
                            value={companyFormData.mersis_no}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, mersis_no: e.target.value })}
                            disabled={!isEditingCompanyInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vergi Dairesi</label>
                          <input 
                            type="text" 
                            placeholder="Kadıköy" 
                            value={companyFormData.tax_office}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, tax_office: e.target.value })}
                            disabled={!isEditingCompanyInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faaliyet Alanı</label>
                          <select 
                            value={companyFormData.sector}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, sector: e.target.value })}
                            disabled={!isEditingCompanyInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                             <option value="">Seçiniz</option>
                             <option value="Oto Kurtarma & Yol Yardım">Oto Kurtarma & Yol Yardım</option>
                             <option value="Çekici Hizmeti">Çekici Hizmeti</option>
                             <option value="Genel Araç Servisi">Genel Araç Servisi</option>
                          </select>
                       </div>
                       <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kuruluş Yılı</label>
                          <input 
                            type="number" 
                            placeholder="2015" 
                            value={companyFormData.foundation_year}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, foundation_year: parseInt(e.target.value) || new Date().getFullYear() })}
                            disabled={!isEditingCompanyInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                       {!isEditingCompanyInfo ? (
                         <button 
                           onClick={() => setIsEditingCompanyInfo(true)}
                           className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                         >
                           <Edit2 size={18} /> Düzenle
                         </button>
                       ) : (
                         <>
                           <button 
                             onClick={handleCancelCompanyEdit}
                             className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all"
                           >
                             İptal
                           </button>
                           <button 
                             onClick={handleSaveCompanyInfo}
                             disabled={isSavingCompanyInfo}
                             className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              {isSavingCompanyInfo ? (
                                <>
                                  <Loader2 size={18} className="animate-spin" /> Kaydediliyor...
                                </>
                              ) : (
                                <>
                                  <Check size={18} /> Bilgileri Kaydet
                                </>
                              )}
                           </button>
                         </>
                       )}
                    </div>
                 </div>
              )}

              {settingsSubTab === 'vehicles' && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h2 className="text-2xl font-bold text-slate-800">Araç Filosu Bilgileri</h2>
                       <button 
                         onClick={() => setActiveTab('fleet')}
                         className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                       >
                          <Truck size={16} /> Filo Yönetimine Git
                       </button>
                    </div>
                    <p className="text-sm text-slate-500">Araç ekleme ve düzenleme için <strong>"Filo Yönetimi"</strong> sekmesini kullanın. Burada kayıtlı araçlarınızı görüntüleyebilirsiniz.</p>
                    
                    {fleet.length === 0 ? (
                      <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Truck size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Henüz kayıtlı araç yok</h3>
                        <p className="text-sm text-slate-500 mb-4">Filo yönetiminize başlamak için Filo Yönetimi sekmesinden araç ekleyin</p>
                        <button 
                          onClick={() => setActiveTab('fleet')}
                          className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
                        >
                          <Truck size={16} /> Filo Yönetimine Git
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                       {fleet.map(vehicle => (
                          <div key={vehicle.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl hover:shadow-md transition-all">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   {vehicle.front_photo_url ? (
                                     <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-blue-200">
                                       <img src={vehicle.front_photo_url} alt={vehicle.plate_number} className="w-full h-full object-cover" />
                                     </div>
                                   ) : (
                                     <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                        <Truck size={24} />
                                     </div>
                                   )}
                                   <div>
                                      <h3 className="font-bold text-slate-800">{vehicle.brand} {vehicle.model}</h3>
                                      <p className="text-sm text-slate-500">{vehicle.plate_number}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                         <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${vehicle.status === 'active' ? 'bg-green-100 text-green-700' : vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {vehicle.status === 'active' ? 'Aktif' : vehicle.status === 'maintenance' ? 'Bakımda' : 'Pasif'}
                                         </span>
                                      </div>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => setActiveTab('fleet')}
                                  className="text-blue-600 hover:text-blue-700 font-bold text-sm px-4 py-2 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1"
                                >
                                  Detay <ChevronDown size={16} className="-rotate-90" />
                                </button>
                             </div>
                          </div>
                       ))}
                      </div>
                    )}
                 </div>
              )}

              {settingsSubTab === 'contact' && (
                 <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">İletişim Bilgileri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yetkili Kişi Adı *</label>
                          <input 
                            type="text" 
                            value={contactFormData.authorized_person}
                            onChange={(e) => setContactFormData({ ...contactFormData, authorized_person: e.target.value })}
                            disabled={!isEditingContactInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cep Telefonu *</label>
                          <input 
                            type="tel" 
                            placeholder="05XX XXX XX XX" 
                            value={contactFormData.mobile_phone}
                            onChange={(e) => setContactFormData({ ...contactFormData, mobile_phone: e.target.value })}
                            disabled={!isEditingContactInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sabit Telefon</label>
                          <input 
                            type="tel" 
                            placeholder="+90 216 XXX XX XX" 
                            value={contactFormData.landline_phone}
                            onChange={(e) => setContactFormData({ ...contactFormData, landline_phone: e.target.value })}
                            disabled={!isEditingContactInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Acil Durum Telefonu</label>
                          <input 
                            type="tel" 
                            placeholder="+90 5XX XXX XX XX" 
                            value={contactFormData.emergency_phone}
                            onChange={(e) => setContactFormData({ ...contactFormData, emergency_phone: e.target.value })}
                            disabled={!isEditingContactInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-posta Adresi *</label>
                          <input 
                            type="email" 
                            placeholder="ornek@firma.com" 
                            value={partnerFormData.email}
                            onChange={(e) => setPartnerFormData({ ...partnerFormData, email: e.target.value })}
                            disabled={!isEditingContactInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                          />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">İş Yeri Adresi *</label>
                          <textarea 
                            rows={3} 
                            value={contactFormData.business_address}
                            onChange={(e) => setContactFormData({ ...contactFormData, business_address: e.target.value })}
                            disabled={!isEditingContactInfo}
                            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                       </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                       {!isEditingContactInfo ? (
                         <button 
                           onClick={() => setIsEditingContactInfo(true)}
                           className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                         >
                           <Edit2 size={18} /> Düzenle
                         </button>
                       ) : (
                         <>
                           <button 
                             onClick={handleCancelContactEdit}
                             className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all"
                           >
                             İptal
                           </button>
                           <button 
                             onClick={handleSaveContactInfo}
                             disabled={isSavingContactInfo}
                             className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              {isSavingContactInfo ? (
                                <>
                                  <Loader2 size={18} className="animate-spin" /> Kaydediliyor...
                                </>
                              ) : (
                                <>
                                  <Check size={18} /> Bilgileri Kaydet
                                </>
                              )}
                           </button>
                         </>
                       )}
                    </div>
                 </div>
              )}

              {settingsSubTab === 'services' && (
                 <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Hizmet Ayarları</h2>
                    <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex gap-3 text-sm text-yellow-800">
                       <AlertTriangle className="shrink-0" size={20} />
                       <p>Kayıt olurken seçtiğiniz hizmetler otomatik olarak aktiftir. Değişiklik yapmak için ilgili hizmeti işaretleyip kaydedin.</p>
                    </div>
                    <div className="space-y-4">
                       {['cekici', 'aku', 'lastik', 'yakit', 'yardim'].map((serviceKey, idx) => {
                         const serviceNames = {
                           'cekici': 'Oto Çekici',
                           'aku': 'Akü Takviye',
                           'lastik': 'Lastik Değişimi',
                           'yakit': 'Yakıt İkmali',
                           'yardim': 'Genel Yol Yardım'
                         };
                         return (
                          <div key={serviceKey} className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 transition-all">
                             <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox" 
                                  checked={selectedServices.includes(serviceKey)}
                                  onChange={() => toggleService(serviceKey)}
                                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                                />
                                <span className="font-bold text-slate-700">{serviceNames[serviceKey as keyof typeof serviceNames]}</span>
                             </div>
                          </div>
                         );
                       })}
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                       <button 
                         onClick={handleSaveServices}
                         disabled={isSavingServices}
                         className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
                       >
                          <Check size={18} /> {isSavingServices ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                       </button>
                    </div>
                 </div>
              )}

              {/* Hizmet Bölgeleri Tab */}
              {settingsSubTab === 'serviceAreas' && (
                <ServiceAreasManager 
                  partnerId={CURRENT_PARTNER_ID} 
                  onToast={(message, type) => showNewToast(message, type)}
                />
              )}

              {/* Boş Dönüş Rotaları Tab */}
              {settingsSubTab === 'returnRoutes' && (
                <ReturnRoutesManager 
                  partnerId={CURRENT_PARTNER_ID}
                  partnerVehicles={fleet as PartnerVehicle[]}
                  onToast={(message, type) => showNewToast(message, type)}
                />
              )}

              {settingsSubTab === 'documents' && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h2 className="text-2xl font-bold text-slate-800">Belgeler & Dökümanlar</h2>
                       <button 
                          onClick={() => setShowDocumentUploadModal(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                       >
                          <Upload size={16} /> Belge Yükle
                       </button>
                    </div>

                    {isLoadingDocuments ? (
                      <div className="p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">Belgeler yükleniyor...</p>
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Henüz yüklenmiş belge yok</h3>
                        <p className="text-sm text-slate-500 mb-4">Belgelerinizi yükleyerek işlemlere başlayın</p>
                        <button 
                          onClick={() => setShowDocumentUploadModal(true)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                        >
                          + İlk Belgeyi Yükle
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map(doc => (
                          <div 
                            key={doc.id}
                            onClick={() => {
                              setSelectedDocumentDetail({
                                title: doc.fileName,
                                type: doc.type,
                                status: doc.status === 'approved' ? 'uploaded' : doc.status === 'rejected' ? 'not_uploaded' : 'pending',
                                uploadDate: new Date(doc.uploadDate).toLocaleDateString('tr-TR'),
                                fileName: doc.fileName,
                                fileSize: `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB`,
                                expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('tr-TR') : undefined,
                              });
                              setShowDocumentDetailModal(true);
                            }}
                            className="p-5 border-2 border-dashed border-slate-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                doc.status === 'approved' ? 'bg-green-100 text-green-600' : 
                                doc.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                                'bg-yellow-100 text-yellow-600'
                              }`}>
                                <FileText size={20} />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-800">{doc.fileName}</h3>
                                <p className="text-xs text-slate-500">{doc.type.toUpperCase()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              {doc.status === 'approved' ? (
                                <>
                                  <CheckCircle2 size={16} className="text-green-600" />
                                  <span className="text-xs font-bold text-green-600">Onaylandı</span>
                                </>
                              ) : doc.status === 'rejected' ? (
                                <>
                                  <AlertTriangle size={16} className="text-red-600" />
                                  <span className="text-xs font-bold text-red-600">Reddedildi</span>
                                </>
                              ) : (
                                <>
                                  <Clock size={16} className="text-yellow-600" />
                                  <span className="text-xs font-bold text-yellow-600">İnceleniyor</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              )}
           </div>
        </div>
     </div>
  );

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
          {activeTab === 'home' && renderHomeTab()}
          {activeTab === 'showcase' && <PartnerShowcaseTab partnerId={CURRENT_PARTNER_ID} partnerData={partnerData} />}
          {activeTab === 'requests' && renderNewJobsTab()}
          {activeTab === 'newJobs' && renderNewJobsTab()}
          {activeTab === 'accepted' && renderAcceptedJobsTab()}
          {activeTab === 'offers' && renderMyOffersTab()}
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
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'reviews' && renderReviewsTab()}
          {activeTab === 'wallet' && renderWalletTab()}
          {activeTab === 'settings' && renderSettingsTab()}
          {activeTab === 'fleet' && renderFleetTab()}
          {activeTab === 'support' && renderSupportTab()}
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
