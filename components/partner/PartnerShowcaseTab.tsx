import React, { useState, useEffect, useCallback } from 'react';
import {
  Store, Save, AlertCircle, CheckCircle, Eye, Clock, CreditCard,
  Star, MessageSquare, Truck, Edit2, Loader2, Info, Camera, Shield,
  Zap, ThumbsUp, Phone, Mail, Globe, AlertTriangle, Check, X, ChevronRight,
  FileText, Award, Settings
} from 'lucide-react';
import { supabaseApi } from '../../services/supabaseApi';
import { 
  sanitizeShowcaseText, 
  containsContactInfo, 
  getContactInfoWarning 
} from '../../utils/showcaseSanitizer';
import type { Partner, PartnerVehicle, PartnerShowcaseData } from '../../types';
import { motion } from 'framer-motion';

interface PartnerShowcaseTabProps {
  partnerId: string;
  partnerData: Partial<Partner>;
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

const PartnerShowcaseTab: React.FC<PartnerShowcaseTabProps> = ({ partnerId, partnerData }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showcaseData, setShowcaseData] = useState<PartnerShowcaseData | null>(null);
  const [vehicles, setVehicles] = useState<PartnerVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'info' | 'vehicle' | 'preview'>('info');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for partner showcase
  const [formData, setFormData] = useState<ShowcaseFormData>({
    showcase_description: '',
    showcase_working_hours: '',
    showcase_payment_methods: [],
    showcase_is_24_7: false,
    showcase_satisfaction_rate: null,
    showcase_response_time: '',
  });
  
  // Form state for selected vehicle showcase
  const [vehicleFormData, setVehicleFormData] = useState<VehicleShowcaseFormData>({
    showcase_capacity: '',
    showcase_insurance_type: '',
    showcase_equipment: [],
    showcase_description: '',
  });

  // Contact info warnings
  const [descWarning, setDescWarning] = useState<string | null>(null);
  const [vehicleDescWarning, setVehicleDescWarning] = useState<string | null>(null);

  // Load showcase data
  const loadShowcaseData = useCallback(async () => {
    if (!partnerId) {
      console.log('🔴 PartnerShowcaseTab: partnerId is empty');
      return;
    }
    
    console.log('🟡 PartnerShowcaseTab: Loading showcase data for partnerId:', partnerId);
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseApi.partnerShowcase.getShowcaseData(partnerId);
      console.log('🟢 PartnerShowcaseTab: Showcase data loaded:', data);
      
      if (data) {
        setShowcaseData(data as unknown as PartnerShowcaseData);
        
        // Populate form with existing data
        setFormData({
          showcase_description: data.partner.showcase_description || '',
          showcase_working_hours: data.partner.showcase_working_hours || '',
          showcase_payment_methods: data.partner.showcase_payment_methods || [],
          showcase_is_24_7: data.partner.showcase_is_24_7 || false,
          showcase_satisfaction_rate: data.partner.showcase_satisfaction_rate || null,
          showcase_response_time: data.partner.showcase_response_time || '',
        });
        
        // Set vehicles from response
        const vehiclesList = data.vehicles || [];
        console.log('🚗 PartnerShowcaseTab: Vehicles loaded:', vehiclesList.length, vehiclesList);
        setVehicles(vehiclesList as unknown as PartnerVehicle[]);
        
        // Select showcase vehicle by default, or first vehicle
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
  }, [partnerId]);

  useEffect(() => {
    loadShowcaseData();
  }, [loadShowcaseData]);

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

  // Save partner showcase info
  const handleSavePartnerShowcase = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Sanitize text fields before saving
      const sanitizedData = {
        showcase_description: sanitizeShowcaseText(formData.showcase_description),
        showcase_working_hours: formData.showcase_working_hours,
        showcase_payment_methods: formData.showcase_payment_methods,
        showcase_is_24_7: formData.showcase_is_24_7,
        showcase_satisfaction_rate: formData.showcase_satisfaction_rate,
        showcase_response_time: formData.showcase_response_time,
      };

      const result = await supabaseApi.partnerShowcase.updateShowcase(partnerId, sanitizedData);
      
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

  // Save vehicle showcase info
  const handleSaveVehicleShowcase = async () => {
    if (!selectedVehicleId) return;
    
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Sanitize text fields
      const sanitizedData = {
        showcase_capacity: vehicleFormData.showcase_capacity,
        showcase_insurance_type: vehicleFormData.showcase_insurance_type,
        showcase_equipment: vehicleFormData.showcase_equipment,
        showcase_description: sanitizeShowcaseText(vehicleFormData.showcase_description),
      };

      const result = await supabaseApi.partnerShowcase.updateVehicleShowcase(
        selectedVehicleId, 
        sanitizedData
      );
      
      if (result) {
        setSaveSuccess(true);
        // Update local state
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
    setSaving(true);
    try {
      const result = await supabaseApi.partnerShowcase.setShowcaseVehicle(partnerId, vehicleId);
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

  // Render loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-2xl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-blue-600 animate-spin" />
          <p className="text-slate-600 font-medium">Vitrin bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Info Banner - "Bu ekran sizin vitrininiz" */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Store size={28} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              🏪 Bu Ekran Sizin Vitrininiz!
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Müşteriler taleplerinde sizin firmanızı gördüklerinde bu bilgileri görecekler. 
              Profesyonel bir tanıtım, çalışma saatleri ve ödeme yöntemleri ekleyerek 
              müşterilerin size güvenmesini sağlayın. 
              <strong className="text-white"> İyi bir vitrin = Daha fazla iş!</strong>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl">
        <button
          onClick={() => setActiveSection('info')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            activeSection === 'info' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={18} />
          <span>Firma Bilgileri</span>
        </button>
        <button
          onClick={() => setActiveSection('vehicle')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            activeSection === 'vehicle' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck size={18} />
          <span>Araç Vitrin</span>
        </button>
        <button
          onClick={() => setActiveSection('preview')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            activeSection === 'preview' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Eye size={18} />
          <span>Önizleme</span>
        </button>
      </div>

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

      {/* Partner Info Section */}
      {activeSection === 'info' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Edit2 size={20} className="text-blue-600" />
              Firma Tanıtımı
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Müşterilere kendinizi tanıtın. Tecrübeniz, özellikleriniz ve neden sizi seçmeleri gerektiğini yazın.
            </p>
            <textarea
              value={formData.showcase_description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Örn: 15 yıllık tecrübemiz ile 7/24 profesyonel çekici hizmeti sunuyoruz. Tüm araç tipleri için uygun ekipmanlara sahibiz..."
              className={`w-full h-32 border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                descWarning ? 'border-orange-300 bg-orange-50' : 'border-slate-200'
              }`}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              {descWarning ? (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {descWarning}
                </p>
              ) : (
                <p className="text-xs text-slate-400">Maksimum 500 karakter</p>
              )}
              <span className="text-xs text-slate-400">{formData.showcase_description.length}/500</span>
            </div>
          </div>

          {/* Working Hours & 24/7 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Çalışma Saatleri
            </h3>
            
            {/* 24/7 Toggle */}
            <label className="flex items-center gap-3 mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={formData.showcase_is_24_7}
                onChange={(e) => setFormData(prev => ({ ...prev, showcase_is_24_7: e.target.checked }))}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="font-bold text-blue-800 flex items-center gap-2">
                  <Zap size={16} />
                  7/24 Hizmet Veriyoruz
                </span>
                <p className="text-xs text-blue-600 mt-1">Bu seçenek işaretlenirse çalışma saatleri yerine "7/24 Açık" gösterilir</p>
              </div>
            </label>

            {/* Custom Working Hours */}
            {!formData.showcase_is_24_7 && (
              <input
                type="text"
                value={formData.showcase_working_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, showcase_working_hours: e.target.value }))}
                placeholder="Örn: Hafta içi 08:00 - 22:00, Hafta sonu 09:00 - 20:00"
                className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600" />
              Kabul Edilen Ödeme Yöntemleri
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.showcase_payment_methods.includes(method.value)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.showcase_payment_methods.includes(method.value)}
                    onChange={() => togglePaymentMethod(method.value)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-lg">{method.icon}</span>
                  <span className="font-medium text-slate-700">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Zap size={20} className="text-blue-600" />
              Ortalama Yanıt Süresi
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Müşteri taleplerine ortalama kaç dakikada yanıt veriyorsunuz?
            </p>
            <div className="grid grid-cols-4 gap-3">
              {['5 dk', '10 dk', '15 dk', '30 dk'].map((time) => (
                <button
                  key={time}
                  onClick={() => setFormData(prev => ({ ...prev, showcase_response_time: time }))}
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${
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

          {/* Save Button */}
          <button
            onClick={handleSavePartnerShowcase}
            disabled={saving}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save size={20} />
                Firma Bilgilerini Kaydet
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Vehicle Showcase Section */}
      {activeSection === 'vehicle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {vehicles.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <Truck size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Henüz Araç Eklenmemiş</h3>
              <p className="text-slate-500 text-sm mb-4">
                Vitrin aracı belirlemek için önce "Filo Yönetimi" bölümünden araç ekleyin.
              </p>
            </div>
          ) : (
            <>
              {/* Vehicle Selection */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Truck size={20} className="text-blue-600" />
                  Vitrin Aracı Seçin
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Müşterilere gösterilecek ana aracınızı seçin. Bu araç tekliflerinizde öne çıkar.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedVehicleId === vehicle.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          vehicle.is_showcase_vehicle ? 'bg-yellow-100' : 'bg-slate-100'
                        }`}>
                          {vehicle.is_showcase_vehicle ? (
                            <Star size={24} className="text-yellow-500" />
                          ) : (
                            <Truck size={24} className="text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">{vehicle.brand} {vehicle.model}</p>
                          <p className="text-sm text-slate-500">{vehicle.plate} • {vehicle.year}</p>
                        </div>
                        {vehicle.is_showcase_vehicle && (
                          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-lg">
                            Vitrin
                          </span>
                        )}
                      </div>
                      
                      {selectedVehicleId === vehicle.id && !vehicle.is_showcase_vehicle && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetShowcaseVehicle(vehicle.id);
                          }}
                          className="w-full mt-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Star size={16} />
                          Vitrin Aracı Olarak Belirle
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Vehicle Details */}
              {selectedVehicleId && (
                <>
                  {/* Vehicle Capacity */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Settings size={20} className="text-blue-600" />
                      Araç Kapasitesi
                    </h3>
                    <input
                      type="text"
                      value={vehicleFormData.showcase_capacity}
                      onChange={(e) => setVehicleFormData(prev => ({ ...prev, showcase_capacity: e.target.value }))}
                      placeholder="Örn: 3.5 ton, SUV'a kadar tüm araçlar"
                      className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Insurance Type */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Shield size={20} className="text-blue-600" />
                      Sigorta Tipi
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {['Kasko', 'Trafik', 'Full Kasko'].map((insurance) => (
                        <button
                          key={insurance}
                          onClick={() => setVehicleFormData(prev => ({ ...prev, showcase_insurance_type: insurance }))}
                          className={`py-3 px-4 rounded-xl font-medium transition-all ${
                            vehicleFormData.showcase_insurance_type === insurance
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {insurance}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Award size={20} className="text-blue-600" />
                      Ekipmanlar
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {EQUIPMENT_OPTIONS.map((eq) => (
                        <label
                          key={eq.value}
                          className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                            vehicleFormData.showcase_equipment.includes(eq.value)
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={vehicleFormData.showcase_equipment.includes(eq.value)}
                            onChange={() => toggleEquipment(eq.value)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-lg">{eq.icon}</span>
                          <span className="text-sm font-medium text-slate-700">{eq.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Description */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <MessageSquare size={20} className="text-blue-600" />
                      Araç Açıklaması
                    </h3>
                    <textarea
                      value={vehicleFormData.showcase_description}
                      onChange={(e) => handleVehicleDescriptionChange(e.target.value)}
                      placeholder="Örn: Profesyonel çekici, her türlü araç tipi için uygundur. Hidrolik platform ve gece çalışma lambası mevcuttur..."
                      className={`w-full h-24 border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        vehicleDescWarning ? 'border-orange-300 bg-orange-50' : 'border-slate-200'
                      }`}
                      maxLength={300}
                    />
                    {vehicleDescWarning && (
                      <p className="text-xs text-orange-600 flex items-center gap-1 mt-2">
                        <AlertTriangle size={14} />
                        {vehicleDescWarning}
                      </p>
                    )}
                  </div>

                  {/* Save Vehicle Button */}
                  <button
                    onClick={handleSaveVehicleShowcase}
                    disabled={saving}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Araç Bilgilerini Kaydet
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Preview Section */}
      {activeSection === 'preview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-slate-100 rounded-2xl p-4">
            <p className="text-center text-sm text-slate-500 mb-4 flex items-center justify-center gap-2">
              <Eye size={16} />
              Müşteriler profilinizi böyle görecek
            </p>
            
            {/* Preview Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 max-w-md mx-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {partnerData.company_name?.[0] || 'P'}
                  </div>
                  <div className="text-white flex-1">
                    <h3 className="text-xl font-bold">{partnerData.company_name || 'Firma Adı'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Star size={16} fill="currentColor" className="text-yellow-400" />
                      <span className="font-bold">{partnerData.rating || '4.8'}</span>
                      <span className="text-blue-200">• {showcaseData?.totalReviews || 0} değerlendirme</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Description */}
                {formData.showcase_description && (
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {formData.showcase_description}
                  </p>
                )}
                
                {/* Working Hours */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Clock size={20} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-500">Çalışma Saatleri</p>
                    <p className="font-medium text-slate-800">
                      {formData.showcase_is_24_7 ? '🟢 7/24 Açık' : formData.showcase_working_hours || 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>

                {/* Response Time */}
                {formData.showcase_response_time && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <Zap size={20} className="text-green-600" />
                    <div>
                      <p className="text-xs text-slate-500">Ortalama Yanıt</p>
                      <p className="font-medium text-green-700">{formData.showcase_response_time} içinde yanıt</p>
                    </div>
                  </div>
                )}
                
                {/* Payment Methods */}
                {formData.showcase_payment_methods.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Ödeme Yöntemleri</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.showcase_payment_methods.map((method) => {
                        const opt = PAYMENT_METHOD_OPTIONS.find(o => o.value === method);
                        return opt ? (
                          <span key={method} className="bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium">
                            {opt.icon} {opt.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
                {/* Showcase Vehicle */}
                {vehicles.find(v => v.is_showcase_vehicle) && (
                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-xs text-yellow-700 font-bold mb-2 flex items-center gap-1">
                      <Star size={14} /> Vitrin Aracı
                    </p>
                    {(() => {
                      const sv = vehicles.find(v => v.is_showcase_vehicle);
                      return sv ? (
                        <div className="flex items-center gap-3">
                          <Truck size={24} className="text-yellow-600" />
                          <div>
                            <p className="font-bold text-slate-800">{sv.brand} {sv.model}</p>
                            <p className="text-xs text-slate-500">{vehicleFormData.showcase_capacity || sv.capacity}</p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Equipment */}
                {vehicleFormData.showcase_equipment.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Ekipmanlar</p>
                    <div className="flex flex-wrap gap-2">
                      {vehicleFormData.showcase_equipment.map((eq) => {
                        const opt = EQUIPMENT_OPTIONS.find(o => o.value === eq);
                        return opt ? (
                          <span key={eq} className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-medium">
                            {opt.icon} {opt.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
              <Info size={18} />
              Vitrin İpuçları
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Profesyonel bir tanıtım yazısı güven oluşturur</li>
              <li>• 7/24 hizmet, acil durumlar için çok önemlidir</li>
              <li>• Çoklu ödeme yöntemi sunmak müşteri memnuniyetini artırır</li>
              <li>• Ekipman listesi, hangi araçlara hizmet verebileceğinizi gösterir</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PartnerShowcaseTab;
