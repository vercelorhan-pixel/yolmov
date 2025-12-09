import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Lock, Building, Truck, Phone, Mail, Wrench, Map, Route, FileCheck,
  User, Edit2, Check, Loader2, AlertTriangle, FileText, Upload,
  Camera, ChevronDown, Clock, CheckCircle2, Star
} from 'lucide-react';
import { PartnerVehicle } from '../../types';
import ServiceAreasManager from './ServiceAreasManager';
import ReturnRoutesManager from './ReturnRoutesManager';
import { createPreviewUrl } from '../../utils/imageCompression';

export interface NotificationPreferences {
  new_job_push_enabled: boolean;
  new_job_sms_enabled: boolean;
  new_job_email_enabled: boolean;
  offer_status_push_enabled: boolean;
  offer_status_sms_enabled: boolean;
  offer_status_email_enabled: boolean;
  payment_push_enabled: boolean;
  payment_email_enabled: boolean;
  voice_call_push_enabled: boolean;
  voice_call_sms_enabled: boolean;
  all_notifications_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface PartnerFormData {
  company_name: string;
  tax_number: string;
  email: string;
  phone: string;
  address: string;
}

export interface CompanyFormData {
  trade_registry_number: string;
  mersis_no: string;
  tax_office: string;
  sector: string;
  foundation_year: number;
}

export interface ContactFormData {
  authorized_person: string;
  mobile_phone: string;
  landline_phone: string;
  emergency_phone: string;
  business_address: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PartnerDocument {
  id: string;
  fileName: string;
  type: string;
  status: 'approved' | 'rejected' | 'pending';
  uploadDate: string;
  fileSize: number;
  expiryDate?: string;
}

export interface DocumentDetail {
  title: string;
  type: string;
  status: 'uploaded' | 'not_uploaded' | 'pending';
  uploadDate: string;
  fileName: string;
  fileSize: string;
  expiryDate?: string;
}

export type SettingsSubTab = 'profile' | 'services' | 'documents' | 'security' | 'notifications' | 'company' | 'vehicles' | 'contact' | 'serviceAreas' | 'returnRoutes';

interface PartnerSettingsTabProps {
  // Partner Info
  CURRENT_PARTNER_ID: string;
  CURRENT_PARTNER_NAME: string;
  CURRENT_PARTNER_EMAIL: string;
  CURRENT_PARTNER_PHONE: string;
  CURRENT_PARTNER_RATING: number;
  
  // Settings State
  settingsSubTab: SettingsSubTab;
  setSettingsSubTab: (tab: SettingsSubTab) => void;
  
  // Profile State
  companyLogo: File | null;
  setCompanyLogo: (file: File | null) => void;
  profilePhoto: File | null;
  setProfilePhoto: (file: File | null) => void;
  existingLogoUrl: string;
  existingProfilePhotoUrl: string;
  isEditingProfile: boolean;
  setIsEditingProfile: (editing: boolean) => void;
  isCompressingLogo: boolean;
  isCompressingProfile: boolean;
  isSavingSettings: boolean;
  
  // Form Data
  partnerFormData: PartnerFormData;
  setPartnerFormData: (data: PartnerFormData) => void;
  companyFormData: CompanyFormData;
  setCompanyFormData: (data: CompanyFormData) => void;
  contactFormData: ContactFormData;
  setContactFormData: (data: ContactFormData) => void;
  passwordFormData: PasswordFormData;
  setPasswordFormData: (data: PasswordFormData) => void;
  
  // Notification Preferences
  notificationPreferences: NotificationPreferences;
  setNotificationPreferences: (prefs: NotificationPreferences) => void;
  isSavingNotificationPrefs: boolean;
  
  // Editing States
  isEditingCompanyInfo: boolean;
  setIsEditingCompanyInfo: (editing: boolean) => void;
  isEditingContactInfo: boolean;
  setIsEditingContactInfo: (editing: boolean) => void;
  isChangingPassword: boolean;
  
  // Saving States
  isSavingCompanyInfo: boolean;
  isSavingContactInfo: boolean;
  isSavingServices: boolean;
  
  // Services
  selectedServices: string[];
  toggleService: (service: string) => void;
  
  // Fleet
  fleet: PartnerVehicle[];
  setActiveTab: (tab: string) => void;
  
  // Documents
  documents: PartnerDocument[];
  isLoadingDocuments: boolean;
  setShowDocumentUploadModal: (show: boolean) => void;
  setSelectedDocumentDetail: (detail: DocumentDetail | null) => void;
  setShowDocumentDetailModal: (show: boolean) => void;
  
  // Credits
  credits: number;
  
  // Handlers
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProfilePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfileSettings: () => void;
  handleCancelProfileEdit: () => void;
  handleSaveCompanyInfo: () => void;
  handleCancelCompanyEdit: () => void;
  handleSaveContactInfo: () => void;
  handleCancelContactEdit: () => void;
  handlePasswordChange: () => void;
  handleSaveNotificationPreferences: () => void;
  handleSaveServices: () => void;
  
  // Toast
  showNewToast: (message: string, type?: 'success' | 'error' | 'info' | 'upload' | 'processing', duration?: number) => void;
}

const settingsMenuItems = [
  { id: 'profile', icon: User, label: 'Profil' },
  { id: 'notifications', icon: Bell, label: 'Bildirimler' },
  { id: 'security', icon: Lock, label: 'Güvenlik' },
  { id: 'company', icon: Building, label: 'Şirket Bilgileri' },
  { id: 'vehicles', icon: Truck, label: 'Araçlar' },
  { id: 'contact', icon: Phone, label: 'İletişim' },
  { id: 'services', icon: Wrench, label: 'Hizmetler' },
  { id: 'serviceAreas', icon: Map, label: 'Hizmet Bölgeleri' },
  { id: 'returnRoutes', icon: Route, label: 'Boş Dönüş Rotaları' },
  { id: 'documents', icon: FileCheck, label: 'Belgeler' },
];

const PartnerSettingsTab: React.FC<PartnerSettingsTabProps> = ({
  // Partner Info
  CURRENT_PARTNER_ID,
  CURRENT_PARTNER_NAME,
  CURRENT_PARTNER_EMAIL,
  CURRENT_PARTNER_PHONE,
  CURRENT_PARTNER_RATING,
  
  // Settings State
  settingsSubTab,
  setSettingsSubTab,
  
  // Profile State
  companyLogo,
  setCompanyLogo,
  profilePhoto,
  setProfilePhoto,
  existingLogoUrl,
  existingProfilePhotoUrl,
  isEditingProfile,
  setIsEditingProfile,
  isCompressingLogo,
  isCompressingProfile,
  isSavingSettings,
  
  // Form Data
  partnerFormData,
  setPartnerFormData,
  companyFormData,
  setCompanyFormData,
  contactFormData,
  setContactFormData,
  passwordFormData,
  setPasswordFormData,
  
  // Notification Preferences
  notificationPreferences,
  setNotificationPreferences,
  isSavingNotificationPrefs,
  
  // Editing States
  isEditingCompanyInfo,
  setIsEditingCompanyInfo,
  isEditingContactInfo,
  setIsEditingContactInfo,
  isChangingPassword,
  
  // Saving States
  isSavingCompanyInfo,
  isSavingContactInfo,
  isSavingServices,
  
  // Services
  selectedServices,
  toggleService,
  
  // Fleet
  fleet,
  setActiveTab,
  
  // Documents
  documents,
  isLoadingDocuments,
  setShowDocumentUploadModal,
  setSelectedDocumentDetail,
  setShowDocumentDetailModal,
  
  // Credits
  credits,
  
  // Handlers
  handleLogoUpload,
  handleProfilePhotoUpload,
  handleSaveProfileSettings,
  handleCancelProfileEdit,
  handleSaveCompanyInfo,
  handleCancelCompanyEdit,
  handleSaveContactInfo,
  handleCancelContactEdit,
  handlePasswordChange,
  handleSaveNotificationPreferences,
  handleSaveServices,
  
  // Toast
  showNewToast,
}) => {
  return (
    <div className="flex gap-8">
      {/* Settings Sidebar */}
      <div className="w-64 shrink-0 space-y-2">
        {/* Profile Summary Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {existingProfilePhotoUrl ? (
                <img 
                  src={existingProfilePhotoUrl} 
                  alt={CURRENT_PARTNER_NAME}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
                  {CURRENT_PARTNER_NAME.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <Check size={10} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate">{CURRENT_PARTNER_NAME}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-slate-600">{CURRENT_PARTNER_RATING.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Mail size={14} />
              <span className="truncate">{CURRENT_PARTNER_EMAIL}</span>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        {settingsMenuItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setSettingsSubTab(item.id as SettingsSubTab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${settingsSubTab === item.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <item.icon size={18} /> {item.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        {/* Profile Tab */}
        {settingsSubTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Profil Bilgileri</h2>
            
            {/* Logo & Profile Photo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Şirket Logosu */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Şirket Logosu</label>
                <div 
                  className={`relative border-2 border-dashed ${isEditingProfile ? 'border-blue-300 hover:border-blue-400' : 'border-slate-200'} rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${isEditingProfile ? 'cursor-pointer bg-blue-50/50' : 'cursor-not-allowed bg-slate-50'}`}
                  onClick={() => isEditingProfile && document.getElementById('logoInput')?.click()}
                >
                  {isCompressingLogo ? (
                    <div className="flex flex-col items-center">
                      <Loader2 size={40} className="animate-spin text-blue-600 mb-2" />
                      <span className="text-sm text-slate-500">Sıkıştırılıyor...</span>
                    </div>
                  ) : companyLogo ? (
                    <img src={createPreviewUrl(companyLogo)} alt="Logo" className="w-24 h-24 object-contain" />
                  ) : existingLogoUrl ? (
                    <img src={existingLogoUrl} alt="Logo" className="w-24 h-24 object-contain" />
                  ) : (
                    <>
                      <Camera size={40} className="text-slate-300 mb-2" />
                      <span className="text-sm text-slate-500 text-center">{isEditingProfile ? 'Logo Yükle' : 'Logo Yok'}</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    id="logoInput" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleLogoUpload}
                    disabled={!isEditingProfile}
                  />
                </div>
              </div>
              
              {/* Profil Fotoğrafı */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profil Fotoğrafı</label>
                <div 
                  className={`relative border-2 border-dashed ${isEditingProfile ? 'border-blue-300 hover:border-blue-400' : 'border-slate-200'} rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${isEditingProfile ? 'cursor-pointer bg-blue-50/50' : 'cursor-not-allowed bg-slate-50'}`}
                  onClick={() => isEditingProfile && document.getElementById('profilePhotoInput')?.click()}
                >
                  {isCompressingProfile ? (
                    <div className="flex flex-col items-center">
                      <Loader2 size={40} className="animate-spin text-blue-600 mb-2" />
                      <span className="text-sm text-slate-500">Sıkıştırılıyor...</span>
                    </div>
                  ) : profilePhoto ? (
                    <img src={createPreviewUrl(profilePhoto)} alt="Profil" className="w-24 h-24 rounded-full object-cover border-4 border-blue-200" />
                  ) : existingProfilePhotoUrl ? (
                    <img src={existingProfilePhotoUrl} alt="Profil" className="w-24 h-24 rounded-full object-cover border-4 border-blue-200" />
                  ) : (
                    <>
                      <User size={40} className="text-slate-300 mb-2" />
                      <span className="text-sm text-slate-500 text-center">{isEditingProfile ? 'Fotoğraf Yükle' : 'Fotoğraf Yok'}</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    id="profilePhotoInput" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleProfilePhotoUpload}
                    disabled={!isEditingProfile}
                  />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Şirket / İşletme Adı *</label>
                <input 
                  type="text" 
                  value={partnerFormData.company_name}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, company_name: e.target.value })}
                  disabled={!isEditingProfile}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vergi No *</label>
                <input 
                  type="text" 
                  placeholder="1234567890" 
                  value={partnerFormData.tax_number}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, tax_number: e.target.value })}
                  disabled={!isEditingProfile}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefon *</label>
                <input 
                  type="tel" 
                  placeholder="+90 5XX XXX XX XX" 
                  value={partnerFormData.phone}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, phone: e.target.value })}
                  disabled={!isEditingProfile}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-posta</label>
                <input 
                  type="email" 
                  placeholder="ornek@firma.com" 
                  value={partnerFormData.email}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, email: e.target.value })}
                  disabled={!isEditingProfile}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adres</label>
                <textarea 
                  rows={3} 
                  placeholder="İş yeri adresi..." 
                  value={partnerFormData.address}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, address: e.target.value })}
                  disabled={!isEditingProfile}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Action Buttons */}
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
                        <Check size={18} /> Bilgileri Kaydet
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {settingsSubTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Bildirim Ayarları</h2>
            
            {/* Yeni İş Talepleri */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Bell size={20} className="text-blue-600" /> Yeni İş Talepleri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                  <input 
                    type="checkbox" 
                    checked={notificationPreferences.new_job_push_enabled}
                    onChange={(e) => setNotificationPreferences({...notificationPreferences, new_job_push_enabled: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="font-medium text-slate-700">Push Bildirim</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                  <input 
                    type="checkbox" 
                    checked={notificationPreferences.new_job_sms_enabled}
                    onChange={(e) => setNotificationPreferences({...notificationPreferences, new_job_sms_enabled: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="font-medium text-slate-700">SMS</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                  <input 
                    type="checkbox" 
                    checked={notificationPreferences.new_job_email_enabled}
                    onChange={(e) => setNotificationPreferences({...notificationPreferences, new_job_email_enabled: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="font-medium text-slate-700">E-posta</span>
                </label>
              </div>
            </div>

            {/* Teklif Durumu */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Check size={20} className="text-green-600" /> Teklif Kabul/Red Bildirimleri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                  <input 
                    type="checkbox" 
                    checked={notificationPreferences.offer_status_push_enabled}
                    onChange={(e) => setNotificationPreferences({...notificationPreferences, offer_status_push_enabled: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="font-medium text-slate-700">Push Bildirim</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                  <input 
                    type="checkbox" 
                    checked={notificationPreferences.offer_status_sms_enabled}
                    onChange={(e) => setNotificationPreferences({...notificationPreferences, offer_status_sms_enabled: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="font-medium text-slate-700">SMS</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                  <input 
                    type="checkbox" 
                    checked={notificationPreferences.offer_status_email_enabled}
                    onChange={(e) => setNotificationPreferences({...notificationPreferences, offer_status_email_enabled: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="font-medium text-slate-700">E-posta</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSaveNotificationPreferences}
                disabled={isSavingNotificationPrefs}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Check size={18} /> {isSavingNotificationPrefs ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {settingsSubTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Güvenlik Ayarları</h2>
            <p className="text-sm text-slate-500">Şifrenizi güncelleyerek hesabınızı koruyun.</p>

            <div className="space-y-4">
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

        {/* Company Tab */}
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

        {/* Vehicles Tab */}
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
                            <img src={vehicle.front_photo_url} alt={vehicle.plate} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <Truck size={24} />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-slate-800">{vehicle.brand} {vehicle.model}</h3>
                          <p className="text-sm text-slate-500">{vehicle.plate}</p>
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

        {/* Contact Tab */}
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

        {/* Services Tab */}
        {settingsSubTab === 'services' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Hizmet Ayarları</h2>
            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex gap-3 text-sm text-yellow-800">
              <AlertTriangle className="shrink-0" size={20} />
              <p>Kayıt olurken seçtiğiniz hizmetler otomatik olarak aktiftir. Değişiklik yapmak için ilgili hizmeti işaretleyip kaydedin.</p>
            </div>
            <div className="space-y-4">
              {['cekici', 'aku', 'lastik', 'yakit', 'yardim'].map((serviceKey) => {
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

        {/* Service Areas Tab */}
        {settingsSubTab === 'serviceAreas' && (
          <ServiceAreasManager 
            partnerId={CURRENT_PARTNER_ID} 
            onToast={(message, type) => showNewToast(message, type)}
          />
        )}

        {/* Return Routes Tab */}
        {settingsSubTab === 'returnRoutes' && (
          <ReturnRoutesManager 
            partnerId={CURRENT_PARTNER_ID}
            partnerVehicles={fleet as PartnerVehicle[]}
            onToast={(message, type) => showNewToast(message, type)}
          />
        )}

        {/* Documents Tab */}
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
  );
};

export default PartnerSettingsTab;
