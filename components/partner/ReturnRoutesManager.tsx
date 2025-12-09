import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, Calendar, MapPin, ChevronRight, Loader2, ChevronDown, Search, X, Check, Percent, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CITIES_WITH_DISTRICTS } from '../../constants';
import { supabaseApi } from '../../services/supabaseApi';
import type { VehicleReturnRoute, PartnerVehicle } from '../../types';

interface ReturnRoutesManagerProps {
  partnerId: string;
  partnerVehicles: PartnerVehicle[];
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ReturnRoutesManager: React.FC<ReturnRoutesManagerProps> = ({ 
  partnerId, 
  partnerVehicles,
  onToast 
}) => {
  const [routes, setRoutes] = useState<VehicleReturnRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<VehicleReturnRoute | null>(null);
  
  // Form state
  const [originCity, setOriginCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [routeCities, setRouteCities] = useState<string[]>([]);
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [availableCapacity, setAvailableCapacity] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Dropdown state
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [originSearch, setOriginSearch] = useState('');
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [destSearch, setDestSearch] = useState('');
  const [isRouteCityOpen, setIsRouteCityOpen] = useState(false);
  const [routeCitySearch, setRouteCitySearch] = useState('');
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);

  const cities = Object.keys(CITIES_WITH_DISTRICTS).sort();
  
  const filteredOriginCities = cities.filter(c => 
    c.toLowerCase().includes(originSearch.toLowerCase())
  );
  
  const filteredDestCities = cities.filter(c => 
    c.toLowerCase().includes(destSearch.toLowerCase())
  );
  
  const filteredRouteCities = cities.filter(c => 
    c.toLowerCase().includes(routeCitySearch.toLowerCase()) &&
    !routeCities.includes(c)
  );

  useEffect(() => {
    loadRoutes();
  }, [partnerId]);

  const loadRoutes = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseApi.returnRoutes.getByPartnerId(partnerId);
      setRoutes(data);
    } catch (error) {
      console.error('Rotalar yüklenemedi:', error);
      onToast('Rotalar yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOriginCity('');
    setDestinationCity('');
    setRouteCities([]);
    setDepartureDate('');
    setDepartureTime('');
    setVehicleType('');
    setVehiclePlate('');
    setSelectedVehicleId('');
    setDriverName('');
    setDriverPhone('');
    setAvailableCapacity('');
    setDiscountPercent(0);
    setNotes('');
    setOriginSearch('');
    setDestSearch('');
    setRouteCitySearch('');
  };

  const openAddModal = () => {
    resetForm();
    setEditingRoute(null);
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDepartureDate(tomorrow.toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const openEditModal = (route: VehicleReturnRoute) => {
    setOriginCity(route.originCity);
    setDestinationCity(route.destinationCity);
    setRouteCities(route.routeCities || []);
    setDepartureDate(route.departureDate);
    setDepartureTime(route.departureTime || '');
    setVehicleType(route.vehicleType);
    setVehiclePlate(route.vehiclePlate);
    setSelectedVehicleId(route.vehicleId || '');
    setDriverName(route.driverName || '');
    setDriverPhone(route.driverPhone || '');
    setAvailableCapacity(route.availableCapacity || '');
    setDiscountPercent(route.discountPercent);
    setNotes(route.notes || '');
    setEditingRoute(route);
    setShowAddModal(true);
  };

  const handleVehicleSelect = (vehicle: PartnerVehicle) => {
    setSelectedVehicleId(vehicle.id);
    setVehiclePlate(vehicle.plate);
    setVehicleType(vehicle.type);
    setDriverName(vehicle.driver || '');
    setIsVehicleOpen(false);
  };

  const addRouteCity = (city: string) => {
    setRouteCities(prev => [...prev, city]);
    setRouteCitySearch('');
  };

  const removeRouteCity = (city: string) => {
    setRouteCities(prev => prev.filter(c => c !== city));
  };

  const moveRouteCity = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= routeCities.length) return;
    
    const newRouteCities = [...routeCities];
    [newRouteCities[index], newRouteCities[newIndex]] = [newRouteCities[newIndex], newRouteCities[index]];
    setRouteCities(newRouteCities);
  };

  const handleSave = async () => {
    if (!originCity || !destinationCity || !departureDate) {
      onToast('Lütfen zorunlu alanları doldurun (Kalkış, Varış, Tarih)', 'error');
      return;
    }

    // Build complete route cities array including origin and destination
    const fullRouteCities = [originCity, ...routeCities, destinationCity];

    setIsSaving(true);
    try {
      if (editingRoute) {
        // Update
        await supabaseApi.returnRoutes.update(editingRoute.id, {
          originCity,
          destinationCity,
          routeCities: fullRouteCities,
          departureDate,
          departureTime: departureTime || undefined,
          vehicleType,
          vehiclePlate,
          driverName: driverName || undefined,
          driverPhone: driverPhone || undefined,
          availableCapacity: availableCapacity || undefined,
          discountPercent,
          notes: notes || undefined,
        });
        onToast('Boş dönüş rotası güncellendi', 'success');
      } else {
        // Create
        await supabaseApi.returnRoutes.create({
          partnerId,
          vehicleId: selectedVehicleId || undefined,
          originCity,
          destinationCity,
          routeCities: fullRouteCities,
          departureDate,
          departureTime: departureTime || undefined,
          vehicleType,
          vehiclePlate,
          driverName: driverName || undefined,
          driverPhone: driverPhone || undefined,
          availableCapacity: availableCapacity || undefined,
          discountPercent,
          notes: notes || undefined,
        });
        onToast('Boş dönüş rotası eklendi', 'success');
      }
      
      await loadRoutes();
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      onToast(error.message || 'Kayıt sırasında hata oluştu', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (route: VehicleReturnRoute) => {
    if (!confirm('Bu rotayı iptal etmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await supabaseApi.returnRoutes.cancel(route.id);
      onToast('Rota iptal edildi', 'success');
      await loadRoutes();
    } catch (error) {
      console.error('İptal hatası:', error);
      onToast('İptal sırasında hata oluştu', 'error');
    }
  };

  const handleDelete = async (route: VehicleReturnRoute) => {
    if (!confirm('Bu rotayı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await supabaseApi.returnRoutes.delete(route.id);
      onToast('Rota silindi', 'success');
      await loadRoutes();
    } catch (error) {
      console.error('Silme hatası:', error);
      onToast('Silme sırasında hata oluştu', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      default: return status;
    }
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
          <h3 className="text-lg font-bold text-gray-900">Boş Dönüş Rotalarım</h3>
          <p className="text-sm text-gray-500 mt-1">
            Boş dönen araçlarınızı tanımlayın, güzergah üzerinden iş alın
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl font-medium hover:bg-brand-lightOrange transition-colors"
        >
          <Plus size={18} />
          Rota Ekle
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Boş Dönüş Avantajı</p>
          <p>
            Araçlarınız boş dönerken güzergah üzerindeki illerden iş alabilirsiniz. 
            Müşterilere indirimli fiyat sunarak hem siz hem müşteri kazançlı çıkar.
          </p>
        </div>
      </div>

      {/* Routes List */}
      {routes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Truck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h4 className="text-lg font-semibold text-gray-600 mb-2">
            Henüz boş dönüş rotası tanımlamadınız
          </h4>
          <p className="text-gray-500 mb-4">
            Boş dönen araçlarınız için rota tanımlayın, güzergah üzerinden iş alın
          </p>
          <button
            onClick={openAddModal}
            className="px-6 py-2 bg-brand-orange text-white rounded-xl font-medium hover:bg-brand-lightOrange transition-colors"
          >
            İlk Rotayı Ekle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Route Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(route.status)}`}>
                      {getStatusText(route.status)}
                    </span>
                    {route.discountPercent > 0 && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
                        %{route.discountPercent} İndirimli
                      </span>
                    )}
                  </div>
                  
                  {/* Route Cities */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="font-bold text-gray-900">{route.originCity}</span>
                    {route.routeCities.slice(1, -1).map((city, idx) => (
                      <React.Fragment key={idx}>
                        <ChevronRight size={16} className="text-gray-300" />
                        <span className="text-gray-600">{city}</span>
                      </React.Fragment>
                    ))}
                    <ChevronRight size={16} className="text-gray-300" />
                    <span className="font-bold text-gray-900">{route.destinationCity}</span>
                  </div>
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(route.departureDate)}
                      {route.departureTime && ` - ${route.departureTime}`}
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck size={14} />
                      {route.vehiclePlate} ({route.vehicleType})
                    </div>
                    {route.availableCapacity && (
                      <div>Kapasite: {route.availableCapacity}</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {route.status === 'active' && (
                    <>
                      <button
                        onClick={() => openEditModal(route)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleCancel(route)}
                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        title="İptal Et"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(route)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
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
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {editingRoute ? 'Boş Dönüş Rotası Düzenle' : 'Yeni Boş Dönüş Rotası'}
              </h3>

              <div className="space-y-5">
                {/* Vehicle Select */}
                {partnerVehicles.length > 0 && !editingRoute && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Araç Seçin (Opsiyonel)
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsVehicleOpen(!isVehicleOpen)}
                        className="w-full px-4 py-3 border rounded-xl text-left flex items-center justify-between bg-white cursor-pointer hover:border-brand-orange"
                      >
                        <span className={selectedVehicleId ? 'text-gray-900' : 'text-gray-400'}>
                          {selectedVehicleId 
                            ? partnerVehicles.find(v => v.id === selectedVehicleId)?.plate || 'Araç seçildi'
                            : 'Kayıtlı araçtan seç...'
                          }
                        </span>
                        <ChevronDown size={18} className="text-gray-400" />
                      </button>
                      
                      {isVehicleOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {partnerVehicles.map((vehicle) => (
                            <button
                              key={vehicle.id}
                              onClick={() => handleVehicleSelect(vehicle)}
                              className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center justify-between border-b last:border-b-0"
                            >
                              <div>
                                <div className="font-medium">{vehicle.plate}</div>
                                <div className="text-sm text-gray-500">{vehicle.type} - {vehicle.driver || 'Sürücü yok'}</div>
                              </div>
                              {selectedVehicleId === vehicle.id && (
                                <Check size={18} className="text-brand-orange" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Origin & Destination Cities */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Origin City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kalkış İli *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsOriginOpen(!isOriginOpen)}
                        className="w-full px-4 py-3 border rounded-xl text-left flex items-center justify-between bg-white cursor-pointer hover:border-brand-orange"
                      >
                        <span className={originCity ? 'text-gray-900' : 'text-gray-400'}>
                          {originCity || 'İl seçin...'}
                        </span>
                        <ChevronDown size={18} className="text-gray-400" />
                      </button>
                      
                      {isOriginOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-60 overflow-hidden">
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={originSearch}
                                onChange={(e) => setOriginSearch(e.target.value)}
                                placeholder="İl ara..."
                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="overflow-y-auto max-h-48">
                            {filteredOriginCities.map((city) => (
                              <button
                                key={city}
                                onClick={() => {
                                  setOriginCity(city);
                                  setIsOriginOpen(false);
                                  setOriginSearch('');
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

                  {/* Destination City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Varış İli *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDestOpen(!isDestOpen)}
                        className="w-full px-4 py-3 border rounded-xl text-left flex items-center justify-between bg-white cursor-pointer hover:border-brand-orange"
                      >
                        <span className={destinationCity ? 'text-gray-900' : 'text-gray-400'}>
                          {destinationCity || 'İl seçin...'}
                        </span>
                        <ChevronDown size={18} className="text-gray-400" />
                      </button>
                      
                      {isDestOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-60 overflow-hidden">
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={destSearch}
                                onChange={(e) => setDestSearch(e.target.value)}
                                placeholder="İl ara..."
                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="overflow-y-auto max-h-48">
                            {filteredDestCities.map((city) => (
                              <button
                                key={city}
                                onClick={() => {
                                  setDestinationCity(city);
                                  setIsDestOpen(false);
                                  setDestSearch('');
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
                </div>

                {/* Route Cities (Intermediate) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ara Güzergah İlleri
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Sırasıyla geçeceğiniz illeri ekleyin. Bu iller üzerinden iş alabilirsiniz.
                  </p>
                  
                  {/* Selected Route Cities */}
                  {routeCities.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {routeCities.map((city, idx) => (
                        <div 
                          key={city}
                          className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-orange-400">{idx + 1}</span>
                            <span className="text-sm font-medium text-gray-900">{city}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {idx > 0 && (
                              <button
                                onClick={() => moveRouteCity(idx, 'up')}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                ↑
                              </button>
                            )}
                            {idx < routeCities.length - 1 && (
                              <button
                                onClick={() => moveRouteCity(idx, 'down')}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                ↓
                              </button>
                            )}
                            <button
                              onClick={() => removeRouteCity(city)}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add Route City */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsRouteCityOpen(!isRouteCityOpen)}
                      className="w-full px-4 py-3 border border-dashed rounded-xl text-left flex items-center justify-center gap-2 text-gray-400 hover:border-brand-orange hover:text-brand-orange transition-colors"
                    >
                      <Plus size={18} />
                      Ara İl Ekle
                    </button>
                    
                    {isRouteCityOpen && (
                      <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={routeCitySearch}
                              onChange={(e) => setRouteCitySearch(e.target.value)}
                              placeholder="İl ara..."
                              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          {filteredRouteCities.map((city) => (
                            <button
                              key={city}
                              onClick={() => {
                                addRouteCity(city);
                                setIsRouteCityOpen(false);
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

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hareket Tarihi *
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hareket Saati
                    </label>
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                </div>

                {/* Vehicle Info */}
                {!selectedVehicleId && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Araç Tipi *
                      </label>
                      <input
                        type="text"
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        placeholder="ör. Çekici, Kamyon"
                        className="w-full px-4 py-3 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plaka *
                      </label>
                      <input
                        type="text"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                        placeholder="34 ABC 123"
                        className="w-full px-4 py-3 border rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {/* Driver Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sürücü Adı
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Sürücü adı soyadı"
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sürücü Telefonu
                    </label>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="05xx xxx xx xx"
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                </div>

                {/* Capacity & Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Boş Kapasite
                    </label>
                    <input
                      type="text"
                      value={availableCapacity}
                      onChange={(e) => setAvailableCapacity(e.target.value)}
                      placeholder="ör. 2 araç, 5 ton"
                      className="w-full px-4 py-3 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      İndirim Oranı
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                        className="flex-1 accent-brand-orange"
                      />
                      <span className="font-bold text-gray-900 w-12 text-right flex items-center gap-1">
                        <Percent size={14} />
                        {discountPercent}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Boş dönüş avantajı için müşterilere sunulacak indirim
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notlar
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ek bilgiler, özel durumlar..."
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
                  disabled={isSaving || !originCity || !destinationCity || !departureDate}
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
                      {editingRoute ? 'Güncelle' : 'Ekle'}
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

export default ReturnRoutesManager;
