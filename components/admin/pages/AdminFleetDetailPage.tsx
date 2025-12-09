/**
 * Admin Fleet Detail Page
 * Araç detay sayfası - Modal yerine URL-based page
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, User, Calendar, Wrench, MapPin, DollarSign, CheckCircle, XCircle, Eye } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

interface Vehicle {
  id: string;
  partnerId: string;
  partnerName: string;
  plate: string;
  model: string;
  type: string;
  driver: string;
  status: 'active' | 'maintenance' | 'disabled';
  registrationDate: string;
  lastService?: string;
  totalJobs: number;
  totalEarnings: number;
  image: string;
}

// MOCK DATA - Gerçek projede API'den gelecek
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'VEH-001',
    partnerId: 'PTR-001',
    partnerName: 'Yılmaz Oto Kurtarma',
    plate: '34 AB 1234',
    model: '2020 Ford F-Max',
    type: 'Kayar Kasa',
    driver: 'Mehmet Yıldız',
    status: 'active',
    registrationDate: '2023-09-10',
    lastService: '2024-10-15',
    totalJobs: 128,
    totalEarnings: 45600,
    image: 'https://images.unsplash.com/photo-1605218427360-6982bc998200?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'VEH-002',
    partnerId: 'PTR-001',
    partnerName: 'Yılmaz Oto Kurtarma',
    plate: '34 CD 5678',
    model: '2019 Mercedes Atego',
    type: 'Platform',
    driver: 'Ali Kaya',
    status: 'active',
    registrationDate: '2023-09-10',
    lastService: '2024-11-05',
    totalJobs: 95,
    totalEarnings: 32400,
    image: 'https://images.unsplash.com/photo-1586015604658-650561417675?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'VEH-003',
    partnerId: 'PTR-002',
    partnerName: 'Hızlı Yol Yardım',
    plate: '34 XY 9988',
    model: '2018 Isuzu NPR',
    type: 'Ahtapot Vinç',
    driver: 'Ahmet Demir',
    status: 'maintenance',
    registrationDate: '2023-08-20',
    lastService: '2024-11-20',
    totalJobs: 203,
    totalEarnings: 78900,
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'VEH-004',
    partnerId: 'PTR-002',
    partnerName: 'Hızlı Yol Yardım',
    plate: '06 ZZ 4321',
    model: '2021 Iveco Daily',
    type: 'Çekici',
    driver: 'Selin Yılmaz',
    status: 'active',
    registrationDate: '2023-08-20',
    lastService: '2024-09-12',
    totalJobs: 167,
    totalEarnings: 56700,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'VEH-005',
    partnerId: 'PTR-003',
    partnerName: 'Mega Çekici',
    plate: '35 TT 7890',
    model: '2017 MAN TGX',
    type: 'Ağır Çekici',
    driver: 'Burak Özkan',
    status: 'disabled',
    registrationDate: '2024-02-15',
    lastService: '2024-08-20',
    totalJobs: 45,
    totalEarnings: 18900,
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'VEH-006',
    partnerId: 'PTR-003',
    partnerName: 'Mega Çekici',
    plate: '35 MM 1122',
    model: '2022 Renault Trucks D',
    type: 'Platform',
    driver: 'Zeynep Aydın',
    status: 'active',
    registrationDate: '2024-02-15',
    lastService: '2024-11-10',
    totalJobs: 44,
    totalEarnings: 16200,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800',
  },
];

const AdminFleetDetailPage: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  
  const vehicle = MOCK_VEHICLES.find(v => v.id === vehicleId);
  const [currentStatus, setCurrentStatus] = useState(vehicle?.status || 'active');

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Truck size={64} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Araç Bulunamadı</h2>
          <p className="text-slate-500 mb-6">Bu ID'ye sahip araç kaydı bulunmuyor.</p>
          <button
            onClick={() => navigate('/admin/filo')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
          >
            Filo Yönetimine Dön
          </button>
        </div>
      </div>
    );
  }

  const handleStatusChange = (newStatus: 'active' | 'maintenance' | 'disabled') => {
    setCurrentStatus(newStatus);
    // Gerçek projede API çağrısı yapılacak
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/filo')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{vehicle.plate}</h1>
                <p className="text-sm text-slate-500">{vehicle.model}</p>
              </div>
            </div>
            <StatusBadge type="vehicle" status={currentStatus} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Vehicle Image & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Image */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <img 
                src={vehicle.image} 
                alt={vehicle.model} 
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Vehicle Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Araç Bilgileri</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={16} className="text-slate-400" />
                    <p className="text-xs text-slate-500">Plaka</p>
                  </div>
                  <p className="font-bold text-slate-900">{vehicle.plate}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={16} className="text-slate-400" />
                    <p className="text-xs text-slate-500">Model</p>
                  </div>
                  <p className="font-bold text-slate-900">{vehicle.model}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={16} className="text-slate-400" />
                    <p className="text-xs text-slate-500">Araç Tipi</p>
                  </div>
                  <p className="font-bold text-slate-900">{vehicle.type}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-slate-400" />
                    <p className="text-xs text-slate-500">Sürücü</p>
                  </div>
                  <p className="font-bold text-slate-900">{vehicle.driver}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-slate-400" />
                    <p className="text-xs text-slate-500">Kayıt Tarihi</p>
                  </div>
                  <p className="font-bold text-slate-900">{vehicle.registrationDate}</p>
                </div>
                {vehicle.lastService && (
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench size={16} className="text-yellow-600" />
                      <p className="text-xs text-yellow-600">Son Bakım</p>
                    </div>
                    <p className="font-bold text-yellow-900">{vehicle.lastService}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Partner Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Partner Bilgileri</h2>
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{vehicle.partnerName}</p>
                  <p className="text-xs text-slate-500">{vehicle.partnerId}</p>
                </div>
                <button
                  onClick={() => navigate(`/admin/partner/${vehicle.partnerId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
                >
                  <Eye size={16} />
                  Partner Detay
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">İstatistikler</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-blue-600" />
                    <p className="text-xs text-blue-600">Tamamlanan İş</p>
                  </div>
                  <p className="text-3xl font-black text-blue-700">{vehicle.totalJobs}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={16} className="text-green-600" />
                    <p className="text-xs text-green-600">Toplam Kazanç</p>
                  </div>
                  <p className="text-3xl font-black text-green-700">₺{vehicle.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Durum Yönetimi</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleStatusChange('active')}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    currentStatus === 'active'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  <CheckCircle size={18} />
                  Aktif
                </button>
                <button
                  onClick={() => handleStatusChange('maintenance')}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    currentStatus === 'maintenance'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                  }`}
                >
                  <Wrench size={18} />
                  Bakımda
                </button>
                <button
                  onClick={() => handleStatusChange('disabled')}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    currentStatus === 'disabled'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <XCircle size={18} />
                  Devre Dışı
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Hızlı İşlemler</h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200">
                  Bakım Kaydı Ekle
                </button>
                <button className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200">
                  Sürücü Değiştir
                </button>
                <button className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200">
                  Belgeleri Görüntüle
                </button>
                <button className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100">
                  Aracı Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFleetDetailPage;
