import React from 'react';
import { 
  Bell, CheckCircle, Truck, Star, Settings, Coins
} from 'lucide-react';
import { JobRequest, CompletedJob } from '../../types';

// Empty Truck type
interface EmptyTruck {
  id: string;
  vehicle: string;
  date: string;
  origin: string;
  destinations: string[];
}

// Review type
interface Review {
  id: string;
  rating: number;
  [key: string]: any;
}

// Props Interface
export interface PartnerHomeTabProps {
  requests: JobRequest[];
  partnerHistory: CompletedJob[];
  emptyTrucks: EmptyTruck[];
  reviews: Review[];
  
  // Tab Change Handler
  handleTabChange: (tab: string) => void;
  setActiveTab: (tab: string) => void;
  setShowAddCreditModal: (show: boolean) => void;
}

const PartnerHomeTab: React.FC<PartnerHomeTabProps> = ({
  requests,
  partnerHistory,
  emptyTrucks,
  reviews,
  handleTabChange,
  setActiveTab,
  setShowAddCreditModal,
}) => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleTabChange('requests')}
          className="bg-slate-800 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Bell size={24} className="opacity-80" />
            <span className="text-3xl font-black">{requests.length}</span>
          </div>
          <p className="text-sm font-bold opacity-80">Yeni İş Talebi</p>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className="bg-slate-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={24} className="opacity-80" />
            <span className="text-3xl font-black">{partnerHistory.filter(h => h.status === 'completed').length}</span>
          </div>
          <p className="text-sm font-bold opacity-80">Tamamlanan İş</p>
        </button>

        <button
          onClick={() => handleTabChange('emptyTrucks')}
          className="bg-slate-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Truck size={24} className="opacity-80" />
            <span className="text-3xl font-black">{emptyTrucks.length}</span>
          </div>
          <p className="text-sm font-bold opacity-80">Boş Araç</p>
        </button>

        <button
          onClick={() => handleTabChange('reviews')}
          className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Star size={24} className="opacity-80" fill="currentColor" />
            <span className="text-3xl font-black">{reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) : '-'}</span>
          </div>
          <p className="text-sm font-bold opacity-80">Ortalama Puan ({reviews.length})</p>
        </button>
      </div>

      {/* Recent Jobs & Empty Trucks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Star size={20} className="text-yellow-500" fill="currentColor" /> Yeni İşler
            </h3>
            <button
              onClick={() => setActiveTab('newJobs')}
              className="text-sm text-blue-600 font-bold hover:text-blue-700"
            >
              Tümünü Gör →
            </button>
          </div>
          <div className="space-y-3">
            {requests.slice(0, 3).map(job => (
              <div key={job.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-sm">{job.serviceType}</span>
                  <span className="text-xs text-slate-500">{job.distance}</span>
                </div>
                <p className="text-xs text-slate-600">{job.location}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Empty Trucks */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Truck size={20} className="text-orange-600" /> Boş Dönen Araçlar
            </h3>
            <button
              onClick={() => setActiveTab('emptyTrucks')}
              className="text-sm text-blue-600 font-bold hover:text-blue-700"
            >
              Tümünü Gör →
            </button>
          </div>
          <div className="space-y-3">
            {emptyTrucks.slice(0, 3).map(truck => (
              <div key={truck.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-orange-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-sm">{truck.vehicle}</span>
                  <span className="text-xs text-slate-500">{truck.date}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {truck.origin} → {truck.destinations[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-6">Hızlı İşlemler</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('newJobs')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 transition-all text-center"
          >
            <Star size={32} className="mx-auto mb-2 text-yellow-400" />
            <p className="text-sm font-bold">Yeni İşler</p>
          </button>
          <button
            onClick={() => setActiveTab('emptyTrucks')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 transition-all text-center"
          >
            <Truck size={32} className="mx-auto mb-2 text-orange-400" />
            <p className="text-sm font-bold">Boş Araç Ekle</p>
          </button>
          <button
            onClick={() => setShowAddCreditModal(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 transition-all text-center"
          >
            <Coins size={32} className="mx-auto mb-2 text-green-400" />
            <p className="text-sm font-bold">Kredi Yükle</p>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 transition-all text-center"
          >
            <Settings size={32} className="mx-auto mb-2 text-purple-400" />
            <p className="text-sm font-bold">Ayarlar</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerHomeTab;
