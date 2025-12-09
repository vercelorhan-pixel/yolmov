import React, { useState, useEffect, useCallback } from 'react';
import {
  Store, Search, Save, AlertCircle, CheckCircle, Eye, Clock, CreditCard,
  Star, MessageSquare, Truck, Edit2, Loader2, Info, Shield, X,
  Zap, ThumbsUp, ChevronRight, ArrowLeft, User, Building, FileText, Award
} from 'lucide-react';
import { supabaseApi } from '../../../services/supabaseApi';
import { 
  sanitizeShowcaseText, 
  containsContactInfo, 
  getContactInfoWarning 
} from '../../../utils/showcaseSanitizer';
import type { Partner, PartnerVehicle, PartnerShowcaseData } from '../../../types';
import { motion } from 'framer-motion';

interface AdminPartnerShowcaseTabProps {
  // Optional: pre-selected partner ID
  preSelectedPartnerId?: string;
}

interface ShowcaseFormData {
  showcase_description: string;
  showcase_working_hours: string;
  showcase_payment_methods: string[];
  showcase_is_24_7: boolean;
  showcase_satisfaction_rate: number | null;
  showcase_response_time: string;
}

interface VehicleShowcaseFormData {
  showcase_capacity: string;
  showcase_insurance_type: string;
  showcase_equipment: string[];
  showcase_description: string;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'nakit', label: 'Nakit', icon: '💵' },
  { value: 'kredi_karti', label: 'Kredi Kartı', icon: '💳' },
  { value: 'banka_havale', label: 'Banka Havale/EFT', icon: '🏦' },
  { value: 'firmaya_fatura', label: 'Firmaya Fatura', icon: '📄' },
];

const EQUIPMENT_OPTIONS = [
  { value: 'vinc', label: 'Vinç', icon: '🏗️' },
  { value: 'hidrolik_platform', label: 'Hidrolik Platform', icon: '⬆️' },
  { value: 'uzun_platform', label: 'Uzun Platform', icon: '📏' },
  { value: 'tekerleksiz_cekim', label: 'Tekerleksiz Çekim', icon: '🔧' },
  { value: 'otopark_cekimi', label: 'Otopark Çekimi', icon: '🅿️' },
  { value: 'gps_takip', label: 'GPS Takip', icon: '📍' },
  { value: 'gece_aydinlatma', label: 'Gece Aydınlatma', icon: '💡' },
];

const AdminPartnerShowcaseTab: React.FC<AdminPartnerShowcaseTabProps> = ({ preSelectedPartnerId }) => {
  // State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(preSelectedPartnerId || null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showcaseData, setShowcaseData] = useState<PartnerShowcaseData | null>(null);
  const [vehicles, setVehicles] = useState<PartnerVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ShowcaseFormData>({
    showcase_description: '',
    showcase_working_hours: '',
    showcase_payment_methods: [],
    showcase_is_24_7: false,
    showcase_satisfaction_rate: null,
    showcase_response_time: '',
  });
  
  const [vehicleFormData, setVehicleFormData] = useState<VehicleShowcaseFormData>({
    showcase_capacity: '',
    showcase_insurance_type: '',
    showcase_equipment: [],
    showcase_description: '',
  });

  // Contact info warnings
  const [descWarning, setDescWarning] = useState<string | null>(null);
  const [vehicleDescWarning, setVehicleDescWarning] = useState<string | null>(null);

  // Load partners list
  useEffect(() => {
    const loadPartners = async () => {
      setLoadingPartners(true);
      try {
        const allPartners = await supabaseApi.partners.getAll();
        // Only show active partners
        const activePartners = allPartners.filter(p => p.status === 'active');
        setPartners(activePartners);
      } catch (err) {
        console.error('Error loading partners:', err);
      } finally {
        setLoadingPartners(false);
      }
    };
    loadPartners();
  }, []);

  // Load showcase data for selected partner
  const loadShowcaseData = useCallback(async () => {
    if (!selectedPartnerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseApi.partnerShowcase.getShowcaseData(selectedPartnerId);
      
      if (data) {
        setShowcaseData(data as unknown as PartnerShowcaseData);
        
        setFormData({
          showcase_description: data.partner.showcase_description || '',
          showcase_working_hours: data.partner.showcase_working_hours || '',
          showcase_payment_methods: data.partner.showcase_payment_methods || [],
          showcase_is_24_7: data.partner.showcase_is_24_7 || false,
          showcase_satisfaction_rate: data.partner.showcase_satisfaction_rate || null,
          showcase_response_time: data.partner.showcase_response_time || '',
        });
        
        const vehiclesList = data.vehicles || [];
        setVehicles(vehiclesList as unknown as PartnerVehicle[]);
        
        const showcaseVehicle = vehiclesList.find((v: any) => v.is_showcase_vehicle);
        if (showcaseVehicle) {
          setSelectedVehicleId(showcaseVehicle.id);
          setVehicleFormData({
            showcase_capacity: showcaseVehicle.showcase_capacity || '',
            showcase_insurance_type: showcaseVehicle.showcase_insurance_type || '',
            showcase_equipment: showcaseVehicle.showcase_equipment || [],
            showcase_description: showcaseVehicle.showcase_description || '',
          });
        } else if (vehiclesList.length > 0) {
          setSelectedVehicleId(vehiclesList[0].id);
        }
      }
    } catch (err) {
      console.error('Showcase data load error:', err);
      setError('Vitrin verileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [selectedPartnerId]);

  useEffect(() => {
    if (selectedPartnerId) {
      loadShowcaseData();
    }
  }, [selectedPartnerId, loadShowcaseData]);

  // Handle vehicle selection change
  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        setVehicleFormData({
          showcase_capacity: vehicle.showcase_capacity || '',
          showcase_insurance_type: vehicle.showcase_insurance_type || '',
          showcase_equipment: vehicle.showcase_equipment || [],
          showcase_description: vehicle.showcase_description || '',
        });
      }
    }
  }, [selectedVehicleId, vehicles]);

  // Handle text input with contact info detection
  const handleDescriptionChange = (value: string) => {
    if (containsContactInfo(value)) {
      setDescWarning(getContactInfoWarning(value));
    } else {
      setDescWarning(null);
    }
    setFormData(prev => ({ ...prev, showcase_description: value }));
  };

  const handleVehicleDescriptionChange = (value: string) => {
    if (containsContactInfo(value)) {
      setVehicleDescWarning(getContactInfoWarning(value));
    } else {
      setVehicleDescWarning(null);
    }
    setVehicleFormData(prev => ({ ...prev, showcase_description: value }));
  };

  // Save partner showcase
  const handleSavePartnerShowcase = async () => {
    if (!selectedPartnerId) return;
    
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const sanitizedData = {
        showcase_description: sanitizeShowcaseText(formData.showcase_description),
        showcase_working_hours: formData.showcase_working_hours,
        showcase_payment_methods: formData.showcase_payment_methods,
        showcase_is_24_7: formData.showcase_is_24_7,
        showcase_satisfaction_rate: formData.showcase_satisfaction_rate,
        showcase_response_time: formData.showcase_response_time,
      };

      const result = await supabaseApi.partnerShowcase.updateShowcase(selectedPartnerId, sanitizedData);
      
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError('Kayıt sırasında bir hata oluştu.');
      }
    } catch (err) {
      console.error('Save partner showcase error:', err);
      setError('Kayıt sırasında bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  // Save vehicle showcase
  const handleSaveVehicleShowcase = async () => {
    if (!selectedVehicleId) return;
    
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const sanitizedData = {
        showcase_capacity: vehicleFormData.showcase_capacity,
        showcase_insurance_type: vehicleFormData.showcase_insurance_type,
        showcase_equipment: vehicleFormData.showcase_equipment,
        showcase_description: sanitizeShowcaseText(vehicleFormData.showcase_description),
      };

      const result = await supabaseApi.partnerShowcase.updateVehicleShowcase(selectedVehicleId, sanitizedData);
      
      if (result) {
        setSaveSuccess(true);
        setVehicles(prev => prev.map(v => 
          v.id === selectedVehicleId ? { ...v, ...sanitizedData } : v
        ));
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError('Araç bilgileri kaydedilirken hata oluştu.');
      }
    } catch (err) {
      console.error('Save vehicle showcase error:', err);
      setError('Araç bilgileri kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  // Set showcase vehicle
  const handleSetShowcaseVehicle = async (vehicleId: string) => {
    if (!selectedPartnerId) return;
    
    setSaving(true);
    try {
      const result = await supabaseApi.partnerShowcase.setShowcaseVehicle(selectedPartnerId, vehicleId);
      if (result) {
        setVehicles(prev => prev.map(v => ({
          ...v,
          is_showcase_vehicle: v.id === vehicleId
        })));
        setSelectedVehicleId(vehicleId);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Set showcase vehicle error:', err);
      setError('Vitrin aracı belirlenirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle payment method
  const togglePaymentMethod = (method: string) => {
    setFormData(prev => ({
      ...prev,
      showcase_payment_methods: prev.showcase_payment_methods.includes(method)
        ? prev.showcase_payment_methods.filter(m => m !== method)
        : [...prev.showcase_payment_methods, method]
    }));
  };

  // Toggle equipment
  const toggleEquipment = (eq: string) => {
    setVehicleFormData(prev => ({
      ...prev,
      showcase_equipment: prev.showcase_equipment.includes(eq)
        ? prev.showcase_equipment.filter(e => e !== eq)
        : [...prev.showcase_equipment, eq]
    }));
  };

  // Filter partners
  const filteredPartners = partners.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.company_name?.toLowerCase().includes(term)) ||
      (p.name?.toLowerCase().includes(term)) ||
      (p.email?.toLowerCase().includes(term))
    );
  });

  // Get selected partner info
  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  return (
    <div className="p-4 lg:p-6">
      {/* Partner Selection */}
      {!selectedPartnerId ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Store size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Partner Vitrin Yönetimi</h2>
              <p className="text-slate-500">Partner seçin ve vitrin bilgilerini düzenleyin</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Partner ara (isim, firma, email)..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Partners List */}
          {loadingPartners ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-blue-600 animate-spin" />
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <Shield size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Partner Bulunamadı</h3>
              <p className="text-slate-500">Arama kriterlerinize uygun aktif partner yok.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredPartners.map(partner => (
                  <button
                    key={partner.id}
                    onClick={() => setSelectedPartnerId(partner.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {partner.company_name?.[0] || partner.name?.[0] || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {partner.company_name || partner.name}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{partner.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {partner.showcase_description ? (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">
                          Vitrin Var
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-lg">
                          Vitrin Yok
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-bold text-slate-900">
                          {partner.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <ChevronRight size={20} className="text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Partner Showcase Edit */
        <div className="space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                setSelectedPartnerId(null);
                setShowcaseData(null);
                setVehicles([]);
                setSelectedVehicleId(null);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-slate-600" />
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedPartner?.company_name || selectedPartner?.name} - Vitrin Düzenle
              </h2>
              <p className="text-slate-500">{selectedPartner?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedPartner?.rating && (
                <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-3 py-1.5 rounded-lg">
                  <Star size={16} fill="currentColor" />
                  <span className="font-bold text-slate-900">{selectedPartner.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={48} className="text-blue-600 animate-spin" />
                <p className="text-slate-600 font-medium">Vitrin bilgileri yükleniyor...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={20} />
                  <p className="text-red-700 text-sm">{error}</p>
                  <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Success Alert */}
              {saveSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <CheckCircle className="text-green-500 shrink-0" size={20} />
                  <p className="text-green-700 text-sm font-medium">Değişiklikler başarıyla kaydedildi!</p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Partner Info */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Building size={20} className="text-blue-600" />
                      Firma Tanıtımı
                    </h3>
                    <textarea
                      value={formData.showcase_description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      placeholder="Firma tanıtım metni..."
                      className={`w-full h-32 border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        descWarning ? 'border-orange-300 bg-orange-50' : 'border-slate-200'
                      }`}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-2">
                      {descWarning ? (
                        <p className="text-xs text-orange-600">{descWarning}</p>
                      ) : (
                        <p className="text-xs text-slate-400">Max 500 karakter</p>
                      )}
                      <span className="text-xs text-slate-400">{formData.showcase_description.length}/500</span>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Clock size={20} className="text-blue-600" />
                      Çalışma Saatleri
                    </h3>
                    <label className="flex items-center gap-3 mb-4 p-4 bg-blue-50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showcase_is_24_7}
                        onChange={(e) => setFormData(prev => ({ ...prev, showcase_is_24_7: e.target.checked }))}
                        className="w-5 h-5 rounded text-blue-600"
                      />
                      <span className="font-bold text-blue-800">7/24 Hizmet</span>
                    </label>
                    {!formData.showcase_is_24_7 && (
                      <input
                        type="text"
                        value={formData.showcase_working_hours}
                        onChange={(e) => setFormData(prev => ({ ...prev, showcase_working_hours: e.target.value }))}
                        placeholder="Örn: Hafta içi 08:00 - 22:00"
                        className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <CreditCard size={20} className="text-blue-600" />
                      Ödeme Yöntemleri
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {PAYMENT_METHOD_OPTIONS.map((method) => (
                        <label
                          key={method.value}
                          className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${
                            formData.showcase_payment_methods.includes(method.value)
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.showcase_payment_methods.includes(method.value)}
                            onChange={() => togglePaymentMethod(method.value)}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <span>{method.icon}</span>
                          <span className="text-sm font-medium">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Response Time */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Zap size={20} className="text-blue-600" />
                      Yanıt Süresi
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {['5 dk', '10 dk', '15 dk', '30 dk'].map((time) => (
                        <button
                          key={time}
                          onClick={() => setFormData(prev => ({ ...prev, showcase_response_time: time }))}
                          className={`py-2 px-3 rounded-lg font-medium text-sm ${
                            formData.showcase_response_time === time
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save Partner Button */}
                  <button
                    onClick={handleSavePartnerShowcase}
                    disabled={saving}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    Firma Bilgilerini Kaydet
                  </button>
                </div>

                {/* Right Column: Vehicle Info */}
                <div className="space-y-6">
                  {vehicles.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                      <Truck size={48} className="mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-bold text-slate-700 mb-2">Araç Bulunamadı</h3>
                      <p className="text-slate-500 text-sm">Bu partnerin kayıtlı aracı yok.</p>
                    </div>
                  ) : (
                    <>
                      {/* Vehicle Selection */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Truck size={20} className="text-blue-600" />
                          Vitrin Aracı
                        </h3>
                        <div className="space-y-2">
                          {vehicles.map((vehicle) => (
                            <div
                              key={vehicle.id}
                              onClick={() => setSelectedVehicleId(vehicle.id)}
                              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${
                                selectedVehicleId === vehicle.id
                                  ? 'bg-blue-50 border-blue-300'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {vehicle.is_showcase_vehicle ? (
                                  <Star size={20} className="text-yellow-500" fill="currentColor" />
                                ) : (
                                  <Truck size={20} className="text-slate-400" />
                                )}
                                <div>
                                  <p className="font-bold text-slate-800">{vehicle.brand} {vehicle.model}</p>
                                  <p className="text-xs text-slate-500">{vehicle.plate}</p>
                                </div>
                              </div>
                              {!vehicle.is_showcase_vehicle && selectedVehicleId === vehicle.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetShowcaseVehicle(vehicle.id);
                                  }}
                                  className="text-xs bg-yellow-500 text-white px-2 py-1 rounded font-bold"
                                >
                                  Vitrin Yap
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedVehicleId && (
                        <>
                          {/* Vehicle Capacity */}
                          <div className="bg-white rounded-2xl p-6 border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <FileText size={20} className="text-blue-600" />
                              Araç Detayları
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-bold text-slate-600 mb-2 block">Kapasite</label>
                                <input
                                  type="text"
                                  value={vehicleFormData.showcase_capacity}
                                  onChange={(e) => setVehicleFormData(prev => ({ ...prev, showcase_capacity: e.target.value }))}
                                  placeholder="Örn: 3.5 ton, SUV'a kadar"
                                  className="w-full border border-slate-200 rounded-xl p-3 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-bold text-slate-600 mb-2 block">Sigorta</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {['Kasko', 'Trafik', 'Full Kasko'].map((ins) => (
                                    <button
                                      key={ins}
                                      onClick={() => setVehicleFormData(prev => ({ ...prev, showcase_insurance_type: ins }))}
                                      className={`py-2 rounded-lg text-sm font-medium ${
                                        vehicleFormData.showcase_insurance_type === ins
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {ins}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Equipment */}
                          <div className="bg-white rounded-2xl p-6 border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <Award size={20} className="text-blue-600" />
                              Ekipmanlar
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                              {EQUIPMENT_OPTIONS.map((eq) => (
                                <label
                                  key={eq.value}
                                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm ${
                                    vehicleFormData.showcase_equipment.includes(eq.value)
                                      ? 'bg-blue-50 border-blue-300'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={vehicleFormData.showcase_equipment.includes(eq.value)}
                                    onChange={() => toggleEquipment(eq.value)}
                                    className="w-4 h-4 rounded text-blue-600"
                                  />
                                  <span>{eq.icon}</span>
                                  <span className="font-medium">{eq.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Vehicle Description */}
                          <div className="bg-white rounded-2xl p-6 border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <MessageSquare size={20} className="text-blue-600" />
                              Araç Açıklaması
                            </h3>
                            <textarea
                              value={vehicleFormData.showcase_description}
                              onChange={(e) => handleVehicleDescriptionChange(e.target.value)}
                              placeholder="Araç açıklaması..."
                              className={`w-full h-24 border rounded-xl p-3 text-sm resize-none ${
                                vehicleDescWarning ? 'border-orange-300 bg-orange-50' : 'border-slate-200'
                              }`}
                              maxLength={300}
                            />
                            {vehicleDescWarning && (
                              <p className="text-xs text-orange-600 mt-1">{vehicleDescWarning}</p>
                            )}
                          </div>

                          {/* Save Vehicle Button */}
                          <button
                            onClick={handleSaveVehicleShowcase}
                            disabled={saving}
                            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Araç Bilgilerini Kaydet
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPartnerShowcaseTab;
