import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, DollarSign, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  type: 'customer' | 'partner';
  status: 'active' | 'suspended';
  joinDate: string;
  totalSpent?: number;
  totalEarned?: number;
}

interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {user.status === 'active' ? 'Aktif' : 'Askıya Alındı'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* İletişim Bilgileri */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Mail size={20} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">E-posta</p>
              <p className="text-sm font-medium text-slate-900">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Phone size={20} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Telefon</p>
              <p className="text-sm font-medium text-slate-900">05XX XXX XX XX</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <MapPin size={20} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Şehir</p>
              <p className="text-sm font-medium text-slate-900">İstanbul</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Calendar size={20} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Kayıt Tarihi</p>
              <p className="text-sm font-medium text-slate-900">{user.joinDate}</p>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600 mb-1">Kullanıcı Tipi</p>
            <p className="text-lg font-bold text-blue-900">{user.type === 'customer' ? 'Müşteri' : 'Partner'}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-xs text-green-600 mb-1">Toplam Harcama</p>
            <p className="text-lg font-bold text-green-900">₺{(user.totalSpent || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl">
            <p className="text-xs text-orange-600 mb-1">Toplam Kazanç</p>
            <p className="text-lg font-bold text-orange-900">₺{(user.totalEarned || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* İşlem Butonları */}
        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors">
            Düzenle
          </button>
          <button className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
            user.status === 'active' 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}>
            {user.status === 'active' ? 'Askıya Al' : 'Aktif Et'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
