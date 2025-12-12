
import { LucideIcon } from 'lucide-react';

// ============================================
// UI & NAVIGATION TYPES
// ============================================

export interface NavItem {
  label: string;
  href: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Step {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Advantage {
  id: string;
  title: string;
  icon: LucideIcon;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  badgeText: string;
  image: string;
}

export interface Provider {
  id: string;
  name: string;
  serviceType: string;
  rating: number;
  reviewCount: number;
  distance: string; // e.g. "2.5 km"
  eta: string; // e.g. "15 dk"
  priceStart: number;
  isVerified: boolean;
  location: string;
  image: string;
}

// Favori sağlayıcılar için hafif partner özeti
export interface FavoritePartner {
  id: string;
  name: string;
  rating?: number;
  services?: string[];
  phone?: string;
  image?: string;
  location?: string;
}

export interface CustomerFavorite {
  id: string;          // favorite row id
  customerId: string;  // customer (auth user) id
  partnerId: string;   // partner id
  createdAt: string;   // eklenme zamanı
  partner?: FavoritePartner; // join edilmiş partner bilgisi
}

// ============================================
// PARTNER (B2B) TYPES
// ============================================

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating?: number;
  completed_jobs?: number;
  credits?: number;
  status?: string;
  city?: string;
  district?: string;
  service_types?: string[];
  created_at: string;
  updated_at?: string;
  
  // Extended registration fields
  first_name?: string;
  last_name?: string;
  company_name?: string;
  tax_number?: string;
  trade_registry_number?: string;
  mersis_no?: string;
  tax_office?: string;
  sector?: string;
  foundation_year?: number;
  vehicle_count?: number;
  vehicle_types?: string;
  commercial_registry_url?: string;
  vehicle_license_url?: string;
  address?: string;
  
  // Settings profile fields
  logo_url?: string;
  profile_photo_url?: string;
  
  // Contact information
  authorized_person?: string;
  mobile_phone?: string;
  landline_phone?: string;
  emergency_phone?: string;
  business_address?: string;
  
  // Showcase (Vitrin) fields - B2C kullanıcılara gösterilir
  showcase_description?: string;
  showcase_working_hours?: string;
  showcase_payment_methods?: string[];
  showcase_is_24_7?: boolean;
  showcase_satisfaction_rate?: number;
  showcase_response_time?: string;
  showcase_total_reviews?: number;
}

// Partner Araç Vitrin Bilgileri
export interface PartnerVehicleShowcase {
  id: string;
  partner_id: string;
  brand?: string;
  model?: string;
  model_name?: string;
  year?: number;
  type?: string;
  vehicle_type?: string;
  plate_number?: string;
  image_url?: string;
  front_photo_url?: string;
  side_photo_url?: string;
  back_photo_url?: string;
  capacity?: string;
  
  // Showcase fields
  showcase_capacity?: string;
  showcase_insurance_type?: string;
  showcase_equipment?: string[];
  showcase_description?: string;
  is_showcase_vehicle?: boolean;
}

// Partner Detay Sayfası için tam veri yapısı
export interface PartnerShowcaseData {
  partner: Partial<Partner>;
  vehicles: PartnerVehicle[];
  showcaseVehicle?: PartnerVehicleShowcase;
  reviews: PartnerReviewForShowcase[];
  totalReviews: number;
}

export interface PartnerReviewForShowcase {
  id: string;
  customer_name: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface JobRequest {
  id: string;
  serviceType: string;
  location: string;
  dropoffLocation?: string; // New: Destination address
  distance: string;
  price: number; // Estimated earnings
  timestamp: string;
  customerName: string;
  vehicleInfo: string;
  urgency: 'high' | 'normal';
  expiresIn?: number; // New: Seconds left to accept
  estimatedPrice?: number; // Estimated price for customer
  notes?: string; // Additional notes
  _originalRequest?: any; // B2C request details (for extended info)
}

// ============================================
// CUSTOMER (B2C) TYPES
// ============================================

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  city?: string;
  district?: string;
  createdAt?: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  type: 'home' | 'work';
  address: string;
  city: string;
  district: string;
  created_at?: string;
}

// B2C Request (Talep) yapısı - TEK KAYNAK
export interface Request {
  id: string;
  customerId: string;
  customerName?: string; // Admin görüntülemesi için
  serviceType: string; // cekici | aku | lastik | yakit | yardim
  description: string;
  fromLocation: string;
  toLocation?: string;
  vehicleInfo?: string;
  status: 'open' | 'matched' | 'completed' | 'cancelled' | 'in_progress';
  createdAt: string;
  amount?: number; // Tamamlanan işler için tutar
  
  // İş takibi alanları (Partner yola çıktığında doldurulur)
  jobStage?: 0 | 1 | 2 | 3 | 4; // 0: Yola çıkıldı, 1: Varış, 2: Yükleme, 3: Teslimat, 4: Tamamlandı
  assignedPartnerId?: string; // İşi üstlenen partner ID
  assignedPartnerName?: string; // İşi üstlenen partner adı
  stageUpdatedAt?: string; // Son aşama güncellemesi
  
  // Genişletilmiş alanlar (QuoteWizard'dan)
  vehicleCondition?: 'running' | 'broken'; // Araç çalışır/arızalı durumu
  hasLoad?: boolean; // Yük var mı?
  loadDescription?: string; // Yük açıklaması
  damagePhotoUrls?: string[]; // Hasar fotoğrafları (base64 veya URL)
  timing?: 'now' | 'week' | 'later'; // Zamanlama
  customerPhone?: string; // Müşteri telefonu
  fromCoordinates?: string; // GPS koordinatları "lat,lon" formatında
  toCoordinates?: string; // GPS koordinatları "lat,lon" formatında
  
  // Arşivleme
  archived?: boolean; // Arşivlendi mi?
  archivedAt?: string; // Ne zaman arşivlendi?
}

// B2B Offer (Teklif) yapısı
export interface Offer {
  id: string;
  requestId: string;
  partnerId: string;
  partnerName?: string;
  price: number;
  etaMinutes: number;
  message?: string;
  status: 'sent' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
}

// ============================================
// ADMIN TYPES
// ============================================

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  SUPPORT = 'support',
  FINANCE = 'finance',
  OPERATIONS = 'operations',
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  createdAt: string;
}

export interface SystemLog {
  id: string;
  adminId: string;
  adminName: string;
  action: 'approve' | 'reject' | 'delete' | 'update' | 'create';
  entity: 'user' | 'partner' | 'request' | 'offer' | 'document';
  entityId: string;
  details: string;
  timestamp: string;
}

// Admin tarafından görüntülenen müşteri talepleri (Request'ten türetilir)
export interface CustomerRequestLog {
  id: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  location: string;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
  amount?: number;
  description?: string;
  vehicleInfo?: string;
  toLocation?: string;
}

// ============================================
// PARTNER REQUEST TYPES (B2B Admin İşlemleri)
// ============================================

export interface PartnerLeadRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'lead_purchase';
  serviceArea: string;
  serviceType: string;
  creditCost: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
  customerInfo?: {
    name: string;
    phone: string;
    location: string;
  };
}

export interface ServiceAreaRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'area_expansion';
  currentAreas: string[];
  requestedAreas: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
}

export interface PartnerSupportRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'support' | 'billing' | 'technical' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  attachments?: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolution?: string;
}

// ============================================
// DOCUMENT & REVIEW TYPES
// ============================================

export interface PartnerDocument {
  id: string;
  partnerId: string;
  partnerName: string;
  type: 'license' | 'insurance' | 'registration' | 'tax' | 'identity';
  fileName: string;
  fileUrl?: string;
  fileSize: number;
  status: 'pending' | 'approved' | 'rejected';
  uploadDate: string;
  expiryDate?: string;
  rejectionReason?: string;
  fileData?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface PartnerReview {
  id: string;
  jobId: string;
  partnerId: string;
  partnerName: string;
  customerId: string;
  customerName: string;
  service: string;
  rating: number;
  comment: string;
  tags: string[];
  date: string;
  objection?: {
    id: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
  };
}

export interface ReviewObjection {
  id: string;
  reviewId: string;
  partnerId: string;
  partnerName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
}

// ============================================
// SUPPORT & TICKET TYPES
// ============================================

export interface SupportTicket {
  id: string;
  partnerId: string;
  partnerName: string;
  category: 'general' | 'technical' | 'billing' | 'account' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolution?: string;
  attachments?: string[];
}

// ============================================
// VEHICLE & FLEET TYPES
// ============================================

export interface PartnerVehicle {
  id: string;
  partnerId: string;
  partnerName: string;
  plate: string;
  brand?: string;
  model: string;
  year?: number;
  type: string;
  vehicle_type?: string;
  driver: string;
  status: 'active' | 'maintenance' | 'disabled';
  registrationDate: string;
  lastService?: string;
  totalJobs: number;
  totalEarnings: number;
  image?: string;
  front_photo_url?: string;
  side_photo_url?: string;
  back_photo_url?: string;
  capacity?: string;
  // Showcase fields
  showcase_capacity?: string;
  showcase_insurance_type?: string;
  showcase_equipment?: string[];
  showcase_description?: string;
  is_showcase_vehicle?: boolean;
}

// ============================================
// CREDIT & FINANCIAL TYPES
// ============================================

export interface PartnerCredit {
  partnerId: string;
  partnerName: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  lastTransaction: string;
}

export interface CreditTransaction {
  id: string;
  partnerId: string;
  partnerName: string;
  type: 'purchase' | 'usage' | 'adjustment' | 'refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  date: string;
  requestId?: string;
  adminUser?: string;
}

// ============================================
// SERVICE AREA TYPES (Hizmet Bölgeleri)
// ============================================

export interface PartnerServiceArea {
  id: string;
  partnerId: string;
  city: string;                          // İl adı
  districts?: string[];                   // Hizmet verilen ilçeler (undefined = tüm il)
  isPrimary: boolean;                    // Ana hizmet bölgesi mi?
  priceMultiplier: number;               // Bölgeye özel fiyat çarpanı (1.00 = standart)
  isActive: boolean;                     // Aktif mi?
  notes?: string;                        // Ek notlar
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// VEHICLE RETURN ROUTES (Boş Dönüş Rotaları)
// ============================================

export interface VehicleReturnRoute {
  id: string;
  partnerId: string;
  partnerName?: string;                   // Join ile gelen
  vehicleId?: string;                     // Araç referansı (opsiyonel)
  
  // Rota Bilgileri
  originCity: string;                     // Başlangıç şehri (mevcut konum)
  destinationCity: string;                // Hedef şehri (ana hizmet bölgesi)
  routeCities: string[];                  // Geçilen iller sırasıyla ["Antalya", "Burdur", "Isparta", "Afyon", "Kütahya"]
  
  // Zamanlama
  departureDate: string;                  // YYYY-MM-DD
  departureTime?: string;                 // HH:mm
  estimatedArrival?: string;              // ISO datetime
  
  // Araç Bilgileri
  vehicleType: string;
  vehiclePlate: string;
  driverName?: string;
  driverPhone?: string;
  availableCapacity?: string;             // Boş kapasite açıklaması
  
  // Fiyatlandırma
  pricePerKm?: number;
  discountPercent: number;                // Boş dönüş indirimi (0-100)
  minPrice?: number;
  
  // Durum
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  
  createdAt: string;
  updatedAt?: string;
}

// Listeleme sayfasında kullanılacak partner sonucu
export interface AvailablePartner {
  partnerId: string;
  partnerName: string;
  partnerRating?: number;
  source: 'service_area' | 'return_route'; // Nasıl eşleşti?
  routeId?: string;                        // Boş dönüş ise route ID
  discountPercent?: number;                // Boş dönüş indirimi
  isPrimaryArea?: boolean;                 // Ana hizmet bölgesi mi?
  departureDate?: string;                  // Boş dönüş tarihi
  
  // Mesafe & ETA bilgileri (distanceService ile hesaplanır)
  distanceKm?: number;                     // Mesafe (km)
  distanceText?: string;                   // "12.5 km" formatında
  durationMinutes?: number;                // Varış süresi (dakika)
  durationText?: string;                   // "~15 dk" formatında
  partnerLatitude?: number;                // Partner enlem koordinatı
  partnerLongitude?: number;               // Partner boylam koordinatı
  
  // Partner ek bilgileri (listing için)
  companyName?: string;
  partnerPhone?: string;
  partnerEmail?: string;
  serviceTypes?: string[];
  profilePhotoUrl?: string;
  logoUrl?: string;
  city?: string;
  district?: string;
  priceMultiplier?: number;
  vehicleType?: string;
  vehiclePlate?: string;
  originCity?: string;
  destinationCity?: string;
  notes?: string;
  rating?: number;
  completedJobs?: number;
  matchType?: 'service_area' | 'return_route';
}

// ============================================
// ROUTE & LOGISTICS TYPES (Legacy - Backward Compatibility)
// ============================================

export interface EmptyTruckRoute {
  id: string;
  partnerId: string;
  partnerName: string;
  fromCity: string;
  toCity: string;
  departureDate: string;
  vehicleType: string;
  vehiclePlate: string;
  availableCapacity: string;
  pricePerKm?: number;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

// ============================================
// JOB & HISTORY TYPES
// ============================================

export interface CompletedJob {
  id: string;
  requestId?: string; // ✅ Migration 013: transport_requests ile ilişki
  partnerId: string;
  partnerName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  startLocation: string;
  endLocation?: string;
  distance?: number;
  startTime: string;
  completionTime: string;
  duration: number;
  totalAmount: number;
  commission: number;
  partnerEarning: number;
  paymentMethod: 'kredi_karti' | 'nakit' | 'havale';
  rating?: number;
  vehicleType: string;
  vehiclePlate: string;
  status: 'completed' | 'cancelled' | 'refunded';
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  customerId: string;
  type: 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'request_matched' | 
        'request_cancelled' | 'profile_updated' | 'system' | 'payment_received' | 
        'service_started' | 'service_completed';
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;       // request_id, offer_id, etc.
  relatedType?: string;     // 'request', 'offer', 'payment', etc.
  actionUrl?: string;       // URL to navigate when clicked
  createdAt: string;
  readAt?: string;
}

// ============================================
// NOTIFICATION PREFERENCES TYPES
// ============================================

export interface CustomerNotificationPreferences {
  id: string;
  customerId: string;
  // Bildirim Kanalları
  emailEnabled: boolean;
  pushEnabled: boolean;
  // Bildirim Türleri
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PRICE CALCULATOR TYPES (Dinamik Fiyatlandırma Motoru)
// ============================================

export interface PricingConfig {
  id: number;
  // Baz Ücretler
  baseFee: number;
  // Mesafe Limitleri
  shortDistanceLimit: number;
  mediumDistanceLimit: number;
  // KM Başı Ücretler
  shortDistanceRate: number;
  mediumDistanceRate: number;
  longDistanceRate: number;
  // Zaman Çarpanları
  nightMultiplier: number;
  weekendMultiplier: number;
  // Araç Tipi Çarpanları
  sedanMultiplier: number;
  suvMultiplier: number;
  minibusMultiplier: number;
  luxuryMultiplier: number;
  // Durum Çarpanları
  brokenVehicleMultiplier: number;
  ditchMultiplier: number;
  accidentMultiplier: number;
  // Ek Hizmet Çarpanları
  hasLoadMultiplier: number;
  urgentMultiplier: number;
  // Esneklik
  priceFlexibilityPercent: number;
  // Meta
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  notes?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPoint {
  coords: Coordinates;
  address?: string;
  name?: string;
}

export interface RouteData {
  distance: number; // KM cinsinden
  duration: number; // Saniye cinsinden
  geometry?: Array<[number, number]>; // Polyline koordinatları [lat, lng]
  fromCache?: boolean;
}

export interface PriceCalculationInput {
  // Rota Bilgileri
  startLocation: LocationPoint;
  endLocation: LocationPoint;
  distance: number; // KM
  
  // Araç Bilgileri
  vehicleType: 'sedan' | 'suv' | 'minibus';
  vehicleCondition: 'working' | 'broken' | 'accident' | 'ditch';
  isLuxury?: boolean;
  
  // Talep Bilgileri
  timing: 'now' | 'week' | 'later'; // 'now' = urgent
  hasLoad: boolean;
  requestTime?: Date; // Gece/gündüz kontrolü için
  isWeekend?: boolean;
}

export interface PriceEstimate {
  // Net Hesaplama
  basePrice: number;
  distanceCharge: number;
  subtotal: number;
  totalMultiplier: number;
  finalPrice: number;
  
  // Fiyat Aralığı
  minPrice: number;
  maxPrice: number;
  
  // Detaylı Açıklama
  breakdown: {
    baseFee: number;
    distanceBreakdown: {
      shortKm: number;
      mediumKm: number;
      longKm: number;
      shortCharge: number;
      mediumCharge: number;
      longCharge: number;
    };
    appliedMultipliers: Array<{
      name: string;
      value: number;
      reason: string;
    }>;
  };
  
  // Meta
  calculatedAt: string;
  route: RouteData;
}

export interface NominatimSearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    district?: string;
    country?: string;
  };
}

export interface RouteCache {
  id: number;
  routeHash: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distanceKm: number;
  durationSeconds: number;
  routeGeometry?: Array<[number, number]>;
  hitCount: number;
  lastUsedAt: string;
  createdAt: string;
  expiresAt: string;
}

