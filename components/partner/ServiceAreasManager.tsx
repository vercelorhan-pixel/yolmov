import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Home, Check, X, Loader2, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CITIES_WITH_DISTRICTS } from '../../constants';
import { supabaseApi } from '../../services/supabaseApi';
import type { PartnerServiceArea } from '../../types';

interface ServiceAreasManagerProps {
  partnerId: string;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ServiceAreasManager: React.FC<ServiceAreasManagerProps> = ({ partnerId, onToast }) => {
  const [serviceAreas, setServiceAreas] = useState<PartnerServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArea, setEditingArea] = useState<PartnerServiceArea | null>(null);
  
  // Form state
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [isPrimary, setIsPrimary] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Dropdown state
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');

  const cities = Object.keys(CITIES_WITH_DISTRICTS).sort();
  const districts = selectedCity ? CITIES_WITH_DISTRICTS[selectedCity] || [] : [];
  
  const filteredCities = cities.filter(c => 
    c.toLowerCase().includes(citySearch.toLowerCase())
  );
  
  const filteredDistricts = districts.filter(d => 
    d.toLowerCase().includes(districtSearch.toLowerCase())
  );

  useEffect(() => {
    loadServiceAreas();
  }, [partnerId]);

  const loadServiceAreas = async () => {
    setIsLoading(true);
    try {
      const areas = await supabaseApi.serviceAreas.getByPartnerId(partnerId);
      setServiceAreas(areas);
    } catch (error) {
      console.error('Hizmet bölgeleri yüklenemedi:', error);
      onToast('Hizmet bölgeleri yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCity('');
    setSelectedDistricts([]);
    setIsPrimary(false);
    setPriceMultiplier(1.0);
    setNotes('');
    setCitySearch('');
    setDistrictSearch('');
  };

  const openAddModal = () => {
    resetForm();
    setEditingArea(null);
    setShowAddModal(true);
  };

  const openEditModal = (area: PartnerServiceArea) => {
    setSelectedCity(area.city);
    setSelectedDistricts(area.districts || []);
    setIsPrimary(area.isPrimary);
    setPriceMultiplier(area.priceMultiplier);
    setNotes(area.notes || '');
    setEditingArea(area);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!selectedCity) {
      onToast('Lütfen bir il seçin', 'error');
      return;
    }

    // Check for duplicate
    const duplicate = serviceAreas.find(
      a => a.city === selectedCity && (!editingArea || a.id !== editingArea.id)
    );
    if (duplicate) {
      onToast('Bu il zaten eklenmiş', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingArea) {
        // Update
        await supabaseApi.serviceAreas.update(editingArea.id, {
          districts: selectedDistricts.length > 0 ? selectedDistricts : undefined,
          isPrimary,
          priceMultiplier,
          notes: notes || undefined,
        });
        onToast('Hizmet bölgesi güncellendi', 'success');
      } else {
        // Create
        await supabaseApi.serviceAreas.create({
          partnerId,
          city: selectedCity,
          districts: selectedDistricts.length > 0 ? selectedDistricts : undefined,
          isPrimary,
          priceMultiplier,
          notes: notes || undefined,
        });
        onToast('Hizmet bölgesi eklendi', 'success');
      }
      
      await loadServiceAreas();
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      onToast(error.message || 'Kayıt sırasında hata oluştu', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (area: PartnerServiceArea) => {
    if (!confirm(`${area.city} hizmet bölgesini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await supabaseApi.serviceAreas.delete(area.id);
      onToast('Hizmet bölgesi silindi', 'success');
      await loadServiceAreas();
    } catch (error) {
      console.error('Silme hatası:', error);
      onToast('Silme sırasında hata oluştu', 'error');
    }
  };

  const handleSetPrimary = async (area: PartnerServiceArea) => {
    try {
      await supabaseApi.serviceAreas.setPrimary(partnerId, area.id);
      onToast(`${area.city} ana hizmet bölgesi olarak ayarlandı`, 'success');
      await loadServiceAreas();
    } catch (error) {
      console.error('Ana bölge ayarlama hatası:', error);
      onToast('Ayarlama sırasında hata oluştu', 'error');
    }
  };

  const toggleDistrict = (district: string) => {
    setSelectedDistricts(prev => 
      prev.includes(district) 
        ? prev.filter(d => d !== district)
        : [...prev, district]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Hizmet Bölgelerim</h3>
          <p className="text-sm text-gray-500 mt-1">
            Hangi illere hizmet verdiğinizi belirleyin
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl font-medium hover:bg-brand-lightOrange transition-colors"
        >
          <Plus size={18} />
          Bölge Ekle
        </button>
      </div>

      {/* Service Areas List */}
      {serviceAreas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h4 className="text-lg font-semibold text-gray-600 mb-2">
            Henüz hizmet bölgesi tanımlamadınız
          </h4>
          <p className="text-gray-500 mb-4">
            Müşterilerinizin sizi bulabilmesi için hizmet verdiğiniz illeri ekleyin
          </p>
          <button
            onClick={openAddModal}
            className="px-6 py-2 bg-brand-orange text-white rounded-xl font-medium hover:bg-brand-lightOrange transition-colors"
          >
            İlk Bölgeyi Ekle
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {serviceAreas.map((area) => (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-5 border-2 transition-all ${
                area.isPrimary 
                  ? 'border-brand-orange shadow-lg shadow-orange-100' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {area.isPrimary ? (
                    <Home className="w-5 h-5 text-brand-orange" />
                  ) : (
                    <MapPin className="w-5 h-5 text-gray-400" />
                  )}
                  <h4 className="font-bold text-gray-900">{area.city}</h4>
                </div>
                {area.isPrimary && (
                  <span className="text-xs font-bold text-brand-orange bg-orange-50 px-2 py-1 rounded-full">
                    Ana Bölge
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">İlçeler: </span>
                  {area.districts && area.districts.length > 0 
                    ? area.districts.slice(0, 3).join(', ') + (area.districts.length > 3 ? ` +${area.districts.length - 3}` : '')
                    : 'Tüm İl'
                  }
                </div>
                {area.priceMultiplier !== 1.0 && (
                  <div>
                    <span className="font-medium">Fiyat Çarpanı: </span>
                    {area.priceMultiplier}x
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                {!area.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(area)}
                    className="flex-1 text-xs font-medium text-gray-600 hover:text-brand-orange py-2 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    Ana Bölge Yap
                  </button>
                )}
                <button
                  onClick={() => openEditModal(area)}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(area)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {editingArea ? 'Hizmet Bölgesi Düzenle' : 'Yeni Hizmet Bölgesi'}
              </h3>

              <div className="space-y-5">
                {/* City Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İl Seçin *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => !editingArea && setIsCityOpen(!isCityOpen)}
                      disabled={!!editingArea}
                      className={`w-full px-4 py-3 border rounded-xl text-left flex items-center justify-between ${
                        editingArea ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-brand-orange'
                      }`}
                    >
                      <span className={selectedCity ? 'text-gray-900' : 'text-gray-400'}>
                        {selectedCity || 'İl seçin...'}
                      </span>
                      <ChevronDown size={18} className="text-gray-400" />
                    </button>
                    
                    {isCityOpen && (
                      <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              placeholder="İl ara..."
                              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          {filteredCities.map((city) => (
                            <button
                              key={city}
                              onClick={() => {
                                setSelectedCity(city);
                                setSelectedDistricts([]);
                                setIsCityOpen(false);
                                setCitySearch('');
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-orange-50 text-sm"
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Districts Multi-Select */}
                {selectedCity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İlçeler (Opsiyonel)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Boş bırakırsanız tüm il kapsamında hizmet vereceğiniz anlaşılır
                    </p>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDistrictOpen(!isDistrictOpen)}
                        className="w-full px-4 py-3 border rounded-xl text-left flex items-center justify-between bg-white cursor-pointer hover:border-brand-orange"
                      >
                        <span className={selectedDistricts.length > 0 ? 'text-gray-900' : 'text-gray-400'}>
                          {selectedDistricts.length > 0 
                            ? `${selectedDistricts.length} ilçe seçildi`
                            : 'Tüm İl (seçim yapılmadı)'
                          }
                        </span>
                        <ChevronDown size={18} className="text-gray-400" />
                      </button>
                      
                      {isDistrictOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-60 overflow-hidden">
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={districtSearch}
                                onChange={(e) => setDistrictSearch(e.target.value)}
                                placeholder="İlçe ara..."
                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="overflow-y-auto max-h-48">
                            {filteredDistricts.map((district) => (
                              <button
                                key={district}
                                onClick={() => toggleDistrict(district)}
                                className="w-full px-4 py-2 text-left hover:bg-orange-50 text-sm flex items-center justify-between"
                              >
                                <span>{district}</span>
                                {selectedDistricts.includes(district) && (
                                  <Check size={16} className="text-brand-orange" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Districts Tags */}
                    {selectedDistricts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedDistricts.map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-brand-orange text-xs rounded-lg"
                          >
                            {d}
                            <button
                              onClick={() => toggleDistrict(d)}
                              className="hover:text-red-500"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Ana Hizmet Bölgesi</span>
                    <p className="text-xs text-gray-500">Bu bölge listelerde öncelikli gösterilir</p>
                  </div>
                </label>

                {/* Price Multiplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiyat Çarpanı
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={priceMultiplier}
                      onChange={(e) => setPriceMultiplier(parseFloat(e.target.value))}
                      className="flex-1 accent-brand-orange"
                    />
                    <span className="font-bold text-gray-900 w-12 text-right">
                      {priceMultiplier.toFixed(1)}x
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    1.0x = Standart fiyat. Uzak bölgeler için artırabilirsiniz.
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notlar (Opsiyonel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bu bölge için özel notlarınız..."
                    rows={2}
                    className="w-full px-4 py-3 border rounded-xl resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !selectedCity}
                  className="flex-1 px-4 py-3 bg-brand-orange text-white rounded-xl font-medium hover:bg-brand-lightOrange transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {editingArea ? 'Güncelle' : 'Ekle'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceAreasManager;
