import { BarChart3, Users, Shield, FileText, DollarSign, PieChart, FileCheck, Truck, Star, Wallet, History, CreditCard, UserCheck, Settings, Calculator, MapPin, Store, Gift, Activity, PhoneIncoming, Smile, ShieldCheck, Tag, Tags, Megaphone, Eye } from 'lucide-react';
import { AdminRole } from '../../types';

export interface AdminTabDef {
  id: 'overview' | 'reports' | 'active-calls' | 'call-logs' | 'partner-approval' | 'partners' | 'users' | 'admin-users' | 'customer-requests' | 'offers' | 'job-history' | 'fleet' | 'financial' | 'credits' | 'campaigns' | 'pricing' | 'partner-showcase' | 'service-areas' | 'documents' | 'reviews' | 'activity-logs';
  label: string;
  icon: any;
  category: 'dashboard' | 'call-center' | 'management' | 'operations' | 'finance' | 'system';
  allowedRoles?: AdminRole[];
}

export const adminTabs: AdminTabDef[] = [
  // DASHBOARD (Kokpit)
  { id: 'overview', label: 'Genel Bakış', icon: BarChart3, category: 'dashboard' },
  { id: 'reports', label: 'Detaylı Raporlar', icon: PieChart, category: 'dashboard', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.FINANCE] },
  
  // ÇAĞRI MERKEZİ (Call Center)
  { id: 'active-calls', label: 'Canlı Görüşmeler', icon: Activity, category: 'call-center', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.SUPPORT] },
  { id: 'call-logs', label: 'Çağrı Kayıtları', icon: PhoneIncoming, category: 'call-center', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.SUPPORT] },
  
  // YÖNETİM (Management)
  { id: 'partner-approval', label: 'Partner Onay', icon: UserCheck, category: 'management', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS] },
  { id: 'partners', label: 'Partnerler', icon: Users, category: 'management' },
  { id: 'users', label: 'Müşteriler', icon: Smile, category: 'management' },
  { id: 'admin-users', label: 'Adminler', icon: ShieldCheck, category: 'management', allowedRoles: [AdminRole.SUPER_ADMIN] },
  
  // OPERASYON (Operations)
  { id: 'customer-requests', label: 'İş Talepleri', icon: MapPin, category: 'operations' },
  { id: 'offers', label: 'Verilen Teklifler', icon: Tag, category: 'operations', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.FINANCE] },
  { id: 'job-history', label: 'İş Geçmişi', icon: History, category: 'operations' },
  { id: 'fleet', label: 'Tüm Filo', icon: Truck, category: 'operations', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS] },
  
  // FİNANS & BÜYÜME (Finance & Growth)
  { id: 'financial', label: 'Kasa / Finans', icon: Wallet, category: 'finance', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.FINANCE] },
  { id: 'credits', label: 'Kredi İşlemleri', icon: CreditCard, category: 'finance', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.FINANCE] },
  { id: 'campaigns', label: 'Kampanyalar', icon: Megaphone, category: 'finance', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS] },
  { id: 'pricing', label: 'Fiyat Listesi', icon: Tags, category: 'finance', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.FINANCE] },
  
  // SİSTEM (System)
  { id: 'activity-logs', label: 'Aktivite Takibi', icon: Eye, category: 'system', allowedRoles: [AdminRole.SUPER_ADMIN] },
  { id: 'partner-showcase', label: 'Vitrin Düzeni', icon: Store, category: 'system', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS] },
  { id: 'service-areas', label: 'Hizmet Bölgeleri', icon: MapPin, category: 'system', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS] },
  { id: 'documents', label: 'Belge Yönetimi', icon: FileCheck, category: 'system', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS] },
  { id: 'reviews', label: 'Yorumlar', icon: Star, category: 'system', allowedRoles: [AdminRole.SUPER_ADMIN, AdminRole.SUPPORT] },
];
