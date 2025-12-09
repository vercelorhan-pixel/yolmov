import React, { useState } from 'react';
import { X, Truck, User, Calendar, DollarSign, Wrench, CheckCircle } from 'lucide-react';

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

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ vehicle, onClose }) => {
  const [currentStatus, setCurrentStatus] = useState(vehicle?.status || 'active');

  if (!vehicle) return null;

  const statusConfig = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktif' },
    maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Bakımda' },
    disabled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Devre Dışı' }
  };

  const status = statusConfig[currentStatus];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{vehicle.plate}</h2>
            <p className="text-sm text-slate-500 mt-1">{vehicle.model}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Araç Görseli */}
        <div className="mb-6 rounded-2xl overflow-hidden h-64 bg-slate-100">
          <img 
            src={vehicle.image} 
            alt={vehicle.plate}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Sol Kolon */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Araç Detayları</h3>
            
            <div className="p-4 bg-slate-50 rounded-xl">
              <Truck size={18} className="text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Araç Tipi</p>
              <p className="text-sm font-bold text-slate-900">{vehicle.type}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <User size={18} className="text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Sürücü</p>
              <p className="text-sm font-bold text-slate-900">{vehicle.driver}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <Calendar size={18} className="text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Kayıt Tarihi</p>
              <p className="text-sm font-bold text-slate-900">{vehicle.registrationDate}</p>
            </div>

            {vehicle.lastService && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <Wrench size={18} className="text-slate-400 mb-2" />
                <p className="text-xs text-slate-500">Son Bakım</p>
                <p className="text-sm font-bold text-slate-900">{vehicle.lastService}</p>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 mb-1">Partner</p>
              <p className="text-sm font-bold text-blue-900">{vehicle.partnerName}</p>
              <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                Partner Profiline Git →
              </button>
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">İstatistikler & Yönetim</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl">
                <CheckCircle size={18} className="text-green-600 mb-2" />
                <p className="text-xs text-green-600">Tamamlanan</p>
                <p className="text-xl font-bold text-green-900">{vehicle.totalJobs}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl">
                <DollarSign size={18} className="text-orange-600 mb-2" />
                <p className="text-xs text-orange-600">Kazanç</p>
                <p className="text-xl font-bold text-orange-900">₺{vehicle.totalEarnings.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-600 mb-3">Durum Yönetimi</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentStatus('active')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    currentStatus === 'active'
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  Aktif
                </button>
                <button
                  onClick={() => setCurrentStatus('maintenance')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    currentStatus === 'maintenance'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  Bakımda
                </button>
                <button
                  onClick={() => setCurrentStatus('disabled')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    currentStatus === 'disabled'
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  Devre Dışı
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors">
                Bakım Kaydı Ekle
              </button>
              <button className="w-full py-2.5 bg-slate-500 text-white rounded-xl text-sm font-bold hover:bg-slate-600 transition-colors">
                Sürücü Değiştir
              </button>
              <button className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">
                Belgeleri Görüntüle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailModal;
