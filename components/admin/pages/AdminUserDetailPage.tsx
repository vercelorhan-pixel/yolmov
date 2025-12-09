import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, Package, Star } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'customer' | 'partner';
  status: 'active' | 'suspended';
  joinDate: string;
  city?: string;
  totalSpent?: number;
  totalEarned?: number;
}

const MOCK_USERS: User[] = [
  { id: 'USR-001', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', phone: '0532 111 22 33', type: 'customer', status: 'active', joinDate: '2023-10-15', city: 'İstanbul', totalSpent: 2400 },
  { id: 'USR-002', name: 'Selin Kaya', email: 'selin@example.com', phone: '05XX XXX XX XX', type: 'customer', status: 'active', joinDate: '2023-11-01', city: 'Ankara', totalSpent: 800 },
];

const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  
  const user = MOCK_USERS.find(u => u.id === id);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleToggleSuspend = () => {
    alert(`Kullanıcı durumu değiştirildi: ${user?.status === 'active' ? 'Askıya alındı' : 'Aktif edildi'}`);
  };

  if (!user) {
    return (
      <div className="p-8">
        <button onClick={() => navigate('/admin/kullanicilar')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={20} />
          Geri Dön
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          Kullanıcı bulunamadı.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <button onClick={() => navigate('/admin/kullanicilar')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft size={20} />
        Kullanıcı Listesine Dön
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-slate-500">{user.id}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
            user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {user.status === 'active' ? 'Aktif' : 'Askıda'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Mail size={20} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Phone size={20} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Telefon</p>
              <p className="font-medium text-slate-900">{user.phone}</p>
            </div>
          </div>
          {user.city && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <MapPin size={20} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Şehir</p>
                <p className="font-medium text-slate-900">{user.city}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Calendar size={20} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Kayıt Tarihi</p>
              <p className="font-medium text-slate-900">{user.joinDate}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Package size={20} />
              <span className="text-sm font-bold">Tip</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{user.type === 'customer' ? 'Müşteri' : 'Partner'}</p>
          </div>
          {user.totalSpent && (
            <div className="bg-green-50 rounded-xl p-6">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <DollarSign size={20} />
                <span className="text-sm font-bold">Toplam Harcama</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">₺{user.totalSpent.toLocaleString()}</p>
            </div>
          )}
          {user.totalEarned && (
            <div className="bg-purple-50 rounded-xl p-6">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Star size={20} />
                <span className="text-sm font-bold">Toplam Kazanç</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">₺{user.totalEarned.toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleEdit}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600"
          >
            Düzenle
          </button>
          <button 
            onClick={handleToggleSuspend}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
          >
            {user.status === 'active' ? 'Askıya Al' : 'Aktif Et'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
