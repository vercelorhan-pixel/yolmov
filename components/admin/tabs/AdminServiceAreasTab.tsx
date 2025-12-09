import React, { useState, useEffect } from 'react';
import { MapPin, Route, Truck, Search, Eye, ChevronRight, Calendar, Loader2, CheckCircle2, XCircle, AlertCircle, Filter, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseApi } from '../../../services/supabaseApi';

interface Partner {
  id: string;
  name: string;
  company_name?: string;
  email: string;
  phone: string;
  city?: string;
  district?: string;
  status?: string;
  rating?: number;
}

interface ServiceArea {
  id: string;
  partnerId: string;
  city: string;
  districts?: string[];
  isPrimary: boolean;
  priceMultiplier: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

interface ReturnRoute {
  id: string;
  partnerId: string;
  partnerName?: string;
  originCity: string;
  destinationCity: string;
  routeCities: string[];
  departureDate: string;
  departureTime?: string;
  vehicleType: string;
  vehiclePlate: string;
  discountPercent: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

const AdminServiceAreasTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'areas' | 'routes'>('areas');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [returnRoutes, setReturnRoutes] = useState<ReturnRoute[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      loadPartnerData(selectedPartner.id);
    }
  }, [selectedPartner]);

  const loadPartners = async () => {
    setIsLoadingPartners(true);
    try {
      const data = await supabaseApi.partners.getAll();
      setPartners(data.filter(p => p.status === 'active'));
    } catch (error) {
      console.error('Partnerler yüklenemedi:', error);
    } finally {
      setIsLoadingPartners(false);
    }
  };

  const loadPartnerData = async (partnerId: string) => {
    setIsLoadingData(true);
    try {
      const [areas, routes] = await Promise.all([
        supabaseApi.serviceAreas.getByPartnerId(partnerId),
        supabaseApi.returnRoutes.getByPartnerId(partnerId),
      ]);
      setServiceAreas(areas);
      setReturnRoutes(routes);
    } catch (error) {
      console.error('Partner verileri yüklenemedi:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const filteredPartners = partners.filter(p => {
    const matchSearch = searchTerm === '' || 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchSearch;
  });

  const filteredRoutes = returnRoutes.filter(r => {
    const matchCity = cityFilter === '' || 
      r.routeCities.some(c => c.toLowerCase().includes(cityFilter.toLowerCase()));
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchCity && matchStatus;
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hizmet Bölgeleri & Rotalar</h2>
          <p className="text-gray-500 mt-1">Partner hizmet bölgelerini ve boş dönüş rotalarını yönetin</p>
        </div>
        <button
          onClick={loadPartners}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} />
          Yenile
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('areas')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'areas'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin size={18} />
          Hizmet Bölgeleri
        </button>
        <button
          onClick={() => setActiveSubTab('routes')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeSubTab === 'routes'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Route size={18} />
          Boş Dönüş Rotaları
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partner List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Partner ara..."
                className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            {isLoadingPartners ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Partner bulunamadı
              </div>
            ) : (
              filteredPartners.map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedPartner?.id === partner.id ? 'bg-orange-50 border-l-4 border-l-brand-orange' : ''
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {partner.company_name || partner.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <MapPin size={12} />
                    {partner.city || 'Şehir belirtilmemiş'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          {!selectedPartner ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Eye size={48} className="mb-4" />
              <p className="text-lg font-medium">Partner seçin</p>
              <p className="text-sm mt-1">Detayları görüntülemek için sol listeden bir partner seçin</p>
            </div>
          ) : isLoadingData ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
            </div>
          ) : activeSubTab === 'areas' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedPartner.company_name || selectedPartner.name} - Hizmet Bölgeleri
                </h3>
                <span className="text-sm text-gray-500">{serviceAreas.length} bölge</span>
              </div>

              {serviceAreas.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Henüz hizmet bölgesi tanımlanmamış</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {serviceAreas.map((area) => (
                    <div
                      key={area.id}
                      className={`p-4 rounded-xl border-2 ${
                        area.isPrimary 
                          ? 'border-brand-orange bg-orange-50' 
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{area.city}</span>
                          {area.isPrimary && (
                            <span className="text-xs font-bold text-brand-orange bg-white px-2 py-0.5 rounded-full">
                              Ana Bölge
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          area.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {area.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">İlçeler: </span>
                        {area.districts && area.districts.length > 0 
                          ? area.districts.join(', ')
                          : 'Tüm İl'
                        }
                      </div>
                      {area.priceMultiplier !== 1.0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Fiyat Çarpanı: </span>
                          {area.priceMultiplier}x
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedPartner.company_name || selectedPartner.name} - Boş Dönüş Rotaları
                </h3>
                <span className="text-sm text-gray-500">{returnRoutes.length} rota</span>
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    placeholder="Şehir ara..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </div>

              {filteredRoutes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Route className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Boş dönüş rotası bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRoutes.map((route) => (
                    <div
                      key={route.id}
                      className="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(route.status)}`}>
                            {getStatusText(route.status)}
                          </span>
                          {route.discountPercent > 0 && (
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
                              %{route.discountPercent} İndirimli
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(route.createdAt)}
                        </span>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="font-bold text-gray-900">{route.originCity}</span>
                        {route.routeCities.slice(1, -1).map((city, idx) => (
                          <React.Fragment key={idx}>
                            <ChevronRight size={14} className="text-gray-300" />
                            <span className="text-gray-600">{city}</span>
                          </React.Fragment>
                        ))}
                        <ChevronRight size={14} className="text-gray-300" />
                        <span className="font-bold text-gray-900">{route.destinationCity}</span>
                      </div>

                      {/* Meta */}
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{partners.length}</div>
              <div className="text-sm text-gray-500">Aktif Partner</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {selectedPartner ? serviceAreas.filter(a => a.isActive).length : '-'}
              </div>
              <div className="text-sm text-gray-500">Aktif Bölge</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Route className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {selectedPartner ? returnRoutes.filter(r => r.status === 'active').length : '-'}
              </div>
              <div className="text-sm text-gray-500">Aktif Rota</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {selectedPartner 
                  ? returnRoutes.filter(r => r.status === 'active' && r.discountPercent > 0).length 
                  : '-'
                }
              </div>
              <div className="text-sm text-gray-500">İndirimli Rota</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminServiceAreasTab;
