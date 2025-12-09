import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, Star, TrendingUp, Package, Truck, CreditCard, CheckCircle, XCircle } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  completedJobs: number;
  credits: number;
  status: 'active' | 'pending' | 'suspended';
  joinDate: string;
  city?: string;
  address?: string;
  vehicleCount?: number;
  totalEarned?: number;
}

const MOCK_PARTNERS: Partner[] = [
  { id: 'PTR-001', name: 'Yılmaz Oto Kurtarma', email: 'yilmaz@partner.com', phone: '0532 XXX XX 01', rating: 4.9, completedJobs: 128, credits: 25, status: 'active', joinDate: '2023-09-10', city: 'İstanbul', address: 'Kadıköy', vehicleCount: 5, totalEarned: 15600 },
  { id: 'PTR-002', name: 'Hızlı Yol Yardım', email: 'hizli@partner.com', phone: '0533 XXX XX 02', rating: 4.7, completedJobs: 203, credits: 50, status: 'active', joinDate: '2023-08-20', city: 'Ankara', address: 'Çankaya', vehicleCount: 8, totalEarned: 28900 },
  { id: 'PTR-003', name: 'Mega Çekici', email: 'mega@partner.com', phone: '0534 XXX XX 03', rating: 4.5, completedJobs: 89, credits: 10, status: 'pending', joinDate: '2023-10-05', city: 'İzmir', address: 'Bornova', vehicleCount: 3, totalEarned: 9200 },
];

const AdminPartnerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'fleet' | 'earnings' | 'history'>('info');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  
  const partner = MOCK_PARTNERS.find(p => p.id === id);

  const handleToggleStatus = () => {
    alert(`Partner durumu değiştirildi: ${partner?.status === 'active' ? 'Askıya alındı' : 'Aktif edildi'}`);
  };

  const handleEditInfo = () => {
    setShowEditModal(true);
  };

  const handleLoadCredit = () => {
    setShowCreditModal(true);
  };

  if (!partner) {
    return (
      <div className="p-8">
        <button onClick={() => navigate('/admin/partnerler')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={20} />
          Geri Dön
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          Partner bulunamadı.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <button onClick={() => navigate('/admin/partnerler')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft size={20} />
        Partner Listesine Dön
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {partner.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{partner.name}</h1>
              <p className="text-slate-500">{partner.id}</p>
              <div className="flex items-center gap-2 mt-2">
                <Star size={18} className="text-yellow-500 fill-yellow-500" />
                <span className="text-lg font-bold text-slate-900">{partner.rating}</span>
                <span className="text-slate-500 text-sm">({partner.completedJobs} iş)</span>
              </div>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
            partner.status === 'active' ? 'bg-green-100 text-green-700' : 
            partner.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {partner.status === 'active' ? 'Aktif' : partner.status === 'pending' ? 'Onay Bekliyor' : 'Askıda'}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle size={20} />
              <span className="text-sm font-bold">Tamamlanan</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{partner.completedJobs}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 mb-2">
              <DollarSign size={20} />
              <span className="text-sm font-bold">Toplam Kazanç</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">₺{partner.totalEarned?.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-2 text-orange-700 mb-2">
              <CreditCard size={20} />
              <span className="text-sm font-bold">Kredi</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{partner.credits}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Truck size={20} />
              <span className="text-sm font-bold">Araç Sayısı</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{partner.vehicleCount}</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('info')}
          className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeSubTab === 'info' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Acente Bilgileri
        </button>
        <button
          onClick={() => setActiveSubTab('fleet')}
          className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeSubTab === 'fleet' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Filo Yönetimi
        </button>
        <button
          onClick={() => setActiveSubTab('earnings')}
          className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeSubTab === 'earnings' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Kazanç Detayları
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeSubTab === 'history' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          İş Geçmişi
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        {activeSubTab === 'info' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">İletişim Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Mail size={20} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">{partner.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Phone size={20} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Telefon</p>
                  <p className="font-medium text-slate-900">{partner.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <MapPin size={20} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Adres</p>
                  <p className="font-medium text-slate-900">{partner.address}, {partner.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Calendar size={20} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Kayıt Tarihi</p>
                  <p className="font-medium text-slate-900">{partner.joinDate}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={handleEditInfo}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600"
              >
                Bilgileri Düzenle
              </button>
              <button 
                onClick={handleLoadCredit}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600"
              >
                Kredi Yükle
              </button>
              <button 
                onClick={handleToggleStatus}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
              >
                {partner.status === 'active' ? 'Askıya Al' : 'Aktif Et'}
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'fleet' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Filo Araçları</h2>
            <div className="text-slate-500">Filo yönetimi detayları burada görüntülenecek...</div>
          </div>
        )}

        {activeSubTab === 'earnings' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Kazanç Raporu</h2>
            <div className="text-slate-500">Kazanç detayları burada görüntülenecek...</div>
          </div>
        )}

        {activeSubTab === 'history' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">İş Geçmişi</h2>
            <div className="text-slate-500">İş geçmişi burada görüntülenecek...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPartnerDetailPage;
