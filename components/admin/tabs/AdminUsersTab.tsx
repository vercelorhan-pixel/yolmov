/**
 * Admin Users Management Tab
 * Admin kullanıcıları ve rol yönetimi
 */

import React, { useState } from 'react';
import { Search, UserPlus, Edit, Trash2, Shield, Mail, Calendar, Eye } from 'lucide-react';
import { AdminRole } from '../../../types';
import { useAdminFilter } from '../hooks/useAdminFilter';
import EmptyState from '../ui/EmptyState';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLogin?: string;
}

// MOCK DATA
const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'ADM-001',
    name: 'Süper Admin',
    email: 'admin@platform',
    role: AdminRole.SUPER_ADMIN,
    status: 'active',
    createdAt: '2023-01-01',
    lastLogin: '2024-11-27 10:30',
  },
  {
    id: 'ADM-002',
    name: 'Finans Müdürü',
    email: 'finans@platform',
    role: AdminRole.FINANCE,
    status: 'active',
    createdAt: '2023-03-15',
    lastLogin: '2024-11-26 16:45',
  },
  {
    id: 'ADM-003',
    name: 'Operasyon Yöneticisi',
    email: 'operasyon@platform',
    role: AdminRole.OPERATIONS,
    status: 'active',
    createdAt: '2023-05-20',
    lastLogin: '2024-11-27 09:15',
  },
  {
    id: 'ADM-004',
    name: 'Destek Ekibi',
    email: 'destek.ekibi@platform',
    role: AdminRole.SUPPORT,
    status: 'active',
    createdAt: '2023-07-10',
    lastLogin: '2024-11-27 08:00',
  },
];

const AdminUsersTab: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(MOCK_ADMIN_USERS);
  const [showAddModal, setShowAddModal] = useState(false);

  const { filtered, searchTerm, setSearchTerm, filterType, setFilterType } = useAdminFilter<AdminUser>(
    adminUsers,
    {
      searchKeys: ['name', 'email'],
      statusKey: 'status'
    }
  );

  const getRoleLabel = (role: AdminRole) => {
    const labels: Record<AdminRole, string> = {
      [AdminRole.SUPER_ADMIN]: 'Süper Admin',
      [AdminRole.FINANCE]: 'Finans',
      [AdminRole.OPERATIONS]: 'Operasyon',
      [AdminRole.SUPPORT]: 'Destek',
    };
    return labels[role];
  };

  const getRoleColor = (role: AdminRole) => {
    switch (role) {
      case AdminRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case AdminRole.FINANCE:
        return 'bg-green-100 text-green-700 border-green-200';
      case AdminRole.OPERATIONS:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case AdminRole.SUPPORT:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleAddUser = () => {
    alert('Admin kullanıcı ekleme özelliği yakında eklenecek.');
  };

  const handleEditUser = (user: AdminUser) => {
    alert(`${user.name} düzenleme özelliği yakında eklenecek.`);
  };

  const handleDeleteUser = (user: AdminUser) => {
    if (user.role === AdminRole.SUPER_ADMIN) {
      alert('Süper Admin kullanıcısı silinemez.');
      return;
    }
    if (confirm(`${user.name} kullanıcısı silinecek. Onaylıyor musunuz?`)) {
      setAdminUsers(adminUsers.filter(u => u.id !== user.id));
      alert('Kullanıcı silindi.');
    }
  };

  const stats = {
    total: adminUsers.length,
    active: adminUsers.filter(u => u.status === 'active').length,
    superAdmin: adminUsers.filter(u => u.role === AdminRole.SUPER_ADMIN).length,
    finance: adminUsers.filter(u => u.role === AdminRole.FINANCE).length,
    operations: adminUsers.filter(u => u.role === AdminRole.OPERATIONS).length,
    support: adminUsers.filter(u => u.role === AdminRole.SUPPORT).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Admin Kullanıcıları</h2>
          <p className="text-slate-500 mt-1">Sistem yöneticilerini ve rollerini yönetin</p>
        </div>
        <button
          onClick={handleAddUser}
          className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <UserPlus size={20} />
          Yeni Admin Ekle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-bold mb-1">Toplam</p>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-xs text-green-700 font-bold mb-1">Aktif</p>
          <p className="text-3xl font-black text-green-900">{stats.active}</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
          <p className="text-xs text-purple-700 font-bold mb-1">Süper Admin</p>
          <p className="text-3xl font-black text-purple-900">{stats.superAdmin}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-xs text-green-700 font-bold mb-1">Finans</p>
          <p className="text-3xl font-black text-green-900">{stats.finance}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <p className="text-xs text-blue-700 font-bold mb-1">Operasyon</p>
          <p className="text-3xl font-black text-blue-900">{stats.operations}</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
          <p className="text-xs text-orange-700 font-bold mb-1">Destek</p>
          <p className="text-3xl font-black text-orange-900">{stats.support}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Admin ara..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="disabled">Devre Dışı</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="Admin Kullanıcı Yok"
            description={searchTerm || filterType ? 'Arama kriterine uygun admin bulunamadı.' : 'Henüz admin kullanıcı yok.'}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Admin</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">E-posta</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Durum</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Son Giriş</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-slate-400" />
                      <span className="text-sm text-slate-600">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(user.role)}`}>
                      <Shield size={12} className="inline mr-1" />
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'active' ? 'Aktif' : 'Devre Dışı'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      {user.lastLogin || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit size={18} />
                      </button>
                      {user.role !== AdminRole.SUPER_ADMIN && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Rol Açıklamaları</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} className="text-purple-600" />
              <span className="font-bold text-purple-900">Süper Admin</span>
            </div>
            <p className="text-sm text-slate-600">Tüm yetkilere sahip. Sistem genelinde her işlemi yapabilir.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} className="text-green-600" />
              <span className="font-bold text-green-900">Finans</span>
            </div>
            <p className="text-sm text-slate-600">Finansal işlemler, teklifler, krediler ve raporları yönetir.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} className="text-blue-600" />
              <span className="font-bold text-blue-900">Operasyon</span>
            </div>
            <p className="text-sm text-slate-600">Filo yönetimi, belgeler ve operasyonel işlemler için yetki.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} className="text-orange-600" />
              <span className="font-bold text-orange-900">Destek</span>
            </div>
            <p className="text-sm text-slate-600">Müşteri ve partner destek talepleri, değerlendirmeler için yetki.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersTab;
