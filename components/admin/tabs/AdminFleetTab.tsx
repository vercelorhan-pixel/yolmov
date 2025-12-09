import React, { useState, useEffect } from 'react';
import { Truck, Eye, Search, Filter, Calendar, User, Building, CheckCircle2, AlertTriangle, Ban, Wrench, RefreshCcw } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import { supabaseApi } from '../../../services/supabaseApi';
import type { PartnerVehicle, Partner } from '../../../types';

// Extended vehicle interface for admin view with partner name
interface AdminVehicle extends Omit<PartnerVehicle, 'partnerId' | 'partnerName'> {
  partnerId: string;
  partnerName: string;
}

interface AdminFleetTabProps {
  onShowVehicleDetail?: (vehicleId: string) => void;
}

export const AdminFleetTab: React.FC<AdminFleetTabProps> = ({ onShowVehicleDetail }) => {
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Load vehicles and partners data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load vehicles and partners in parallel
      const [vehiclesData, partnersData] = await Promise.all([
        supabaseApi.partnerVehicles.getAll(),
        supabaseApi.partners.getAll()
      ]);

      // Create a map of partner id to partner name for quick lookup
      const partnerMap = new Map<string, string>();
      partnersData.forEach(p => partnerMap.set(p.id, p.name || p.company_name || 'Bilinmeyen'));

      // Map vehicles with partner names
      const mappedVehicles: AdminVehicle[] = vehiclesData.map(v => ({
        ...v,
        partnerId: v.partnerId || (v as any).partner_id || '',
        partnerName: v.partnerName || partnerMap.get(v.partnerId || (v as any).partner_id) || 'Bilinmeyen Partner'
      }));

      setVehicles(mappedVehicles);
      setPartners(partnersData);
    } catch (err) {
      console.error('Fleet data load error:', err);
      setError('Araç verileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    // Status filter
    if (selectedStatus !== 'all' && vehicle.status !== selectedStatus) return false;

    // Partner filter
    if (selectedPartner !== 'all' && vehicle.partnerId !== selectedPartner) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const searchFields = [
        vehicle.plate,
        vehicle.partnerName,
        vehicle.brand,
        vehicle.model,
        vehicle.driver,
        vehicle.type
      ].filter(Boolean);

      if (!searchFields.some(field => field?.toLowerCase().includes(search))) {
        return false;
      }
    }

    // Date filter
    if (dateStart || dateEnd) {
      const registrationDate = new Date(vehicle.registrationDate);
      if (dateStart && registrationDate < new Date(dateStart)) return false;
      if (dateEnd && registrationDate > new Date(dateEnd)) return false;
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    disabled: vehicles.filter(v => v.status === 'disabled').length
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'maintenance': return <Wrench className="w-4 h-4 text-yellow-500" />;
      case 'disabled': return <Ban className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'disabled': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadData}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Araç</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aktif</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Wrench className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bakımda</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <Ban className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Devre Dışı</p>
              <p className="text-2xl font-bold text-red-600">{stats.disabled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Plaka, firma, marka, model veya sürücü ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="maintenance">Bakımda</option>
                <option value="disabled">Devre Dışı</option>
              </select>
            </div>
          </div>

          {/* Partner Filter */}
          <div className="w-full lg:w-56">
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">Tüm Partnerler</option>
                {partners.map(partner => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name || partner.company_name || 'Bilinmeyen'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Yenile</span>
          </button>
        </div>
      </div>

      {/* Vehicle List */}
      {filteredVehicles.length === 0 ? (
        <EmptyState
          title="Araç Bulunamadı"
          description={searchTerm || selectedStatus !== 'all' || selectedPartner !== 'all'
            ? "Arama kriterlerinize uygun araç bulunamadı."
            : "Henüz kayıtlı araç bulunmuyor."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Vehicle Image or Placeholder */}
              <div className="h-40 bg-gray-100 relative">
                {vehicle.image || vehicle.front_photo_url ? (
                  <img
                    src={vehicle.image || vehicle.front_photo_url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Truck className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <StatusBadge 
                    type="vehicle"
                    status={vehicle.status}
                  />
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="p-4 space-y-3">
                {/* Plate & Model */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{vehicle.plate}</h3>
                    <p className="text-sm text-gray-600">
                      {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {vehicle.type || vehicle.vehicle_type || 'Kamyon'}
                  </span>
                </div>

                {/* Partner & Driver */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>{vehicle.partnerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{vehicle.driver || 'Sürücü atanmamış'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Kayıt: {formatDate(vehicle.registrationDate)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{vehicle.totalJobs || 0}</p>
                    <p className="text-xs text-gray-500">Toplam İş</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(vehicle.totalEarnings)}</p>
                    <p className="text-xs text-gray-500">Kazanç</p>
                  </div>
                  {onShowVehicleDetail && (
                    <button
                      onClick={() => onShowVehicleDetail(vehicle.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Detay
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        {filteredVehicles.length === vehicles.length
          ? `Toplam ${vehicles.length} araç`
          : `${filteredVehicles.length} / ${vehicles.length} araç gösteriliyor`
        }
      </div>
    </div>
  );
};

// Vehicle type for external use
export type Vehicle = AdminVehicle;

export default AdminFleetTab;
