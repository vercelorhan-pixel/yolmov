/**
 * Admin Users Management Tab
 * Admin kullanıcıları ve rol yönetimi - Supabase entegrasyonu
 */

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, Trash2, Shield, Mail, Calendar, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { AdminRole } from '../../../types';
import { useAdminFilter } from '../hooks/useAdminFilter';
import EmptyState from '../ui/EmptyState';
import { supabase } from '../../../services/supabase';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLogin?: string;
}

interface AdminFormData {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  status: 'active' | 'disabled';
}

const AdminUsersTab: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<AdminFormData>({
    name: '',
    email: '',
    password: '',
    role: AdminRole.SUPPORT,
    status: 'active'
  });

  const { filtered, searchTerm, setSearchTerm, filterType, setFilterType } = useAdminFilter<AdminUser>(
    adminUsers,
    {
      searchKeys: ['name', 'email'],
      statusKey: 'status'
    }
  );

  // Admin kullanıcılarını yükle
  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // DB'den gelen veriyi dönüştür
      const mapped = (data || []).map((u: any) => ({
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'Admin',
        email: u.email,
        role: u.role || AdminRole.SUPPORT,
        status: u.status || 'active',
        createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '-',
        lastLogin: u.last_login ? new Date(u.last_login).toLocaleString('tr-TR') : '-'
      }));
      
      setAdminUsers(mapped);
    } catch (err: any) {
      console.error('❌ Admin kullanıcıları yüklenemedi:', err);
      setError('Admin kullanıcıları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: AdminRole.SUPPORT,
      status: 'active'
    });
    setShowPassword(false);
    setError(null);
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Tüm alanları doldurunuz');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      // 1. Serverless function ile kullanıcı oluştur (Email onayı gerektirmez)
      // Bu yöntem Service Role Key kullanarak direkt onaylanmış kullanıcı oluşturur
      const response = await fetch('/api/create-admin-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Fallback: Eğer API çalışmazsa (örn: local dev env vars yoksa) eski yöntemi dene
        if (result.error?.includes('Missing Supabase keys') || response.status === 404) {
          console.warn('⚠️ API kullanılamadı, client-side signUp deneniyor...');
          await fallbackClientSignUp();
          return;
        }
        throw new Error(result.error || 'Admin oluşturulamadı');
      }
      
      const newAdmin = result.user;

      // Listeyi güncelle
      setAdminUsers(prev => [{
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status,
        createdAt: new Date().toLocaleDateString('tr-TR'),
        lastLogin: '-'
      }, ...prev]);

      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      console.error('❌ Admin ekleme hatası:', err);
      if (err.message?.includes('already registered')) {
        setError('Bu email adresi zaten kayıtlı');
      } else {
        setError(err.message || 'Admin eklenirken hata oluştu');
      }
    } finally {
      setSaving(false);
    }
  };

  // Fallback: Client-side kayıt (Email onayı gerektirebilir)
  const fallbackClientSignUp = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            user_type: 'admin',
            name: formData.name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Kullanıcı oluşturulamadı');

      // 2. admin_users tablosuna kaydet
      const { data: newAdmin, error: insertError } = await supabase
        .from('admin_users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          status: formData.status
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAdminUsers(prev => [{
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status,
        createdAt: new Date().toLocaleDateString('tr-TR'),
        lastLogin: '-'
      }, ...prev]);

      setShowAddModal(false);
      resetForm();
      alert('Kullanıcı oluşturuldu ancak email onayı gerekebilir (Local Dev Modu).');
    } catch (err: any) {
      throw err;
    }
  };
    } catch (err: any) {
      console.error('❌ Admin ekleme hatası:', err);
      if (err.message?.includes('already registered')) {
        setError('Bu email adresi zaten kayıtlı');
      } else {
        setError(err.message || 'Admin eklenirken hata oluştu');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({
          name: formData.name,
          role: formData.role,
          status: formData.status
        })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Listeyi güncelle
      setAdminUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, name: formData.name, role: formData.role, status: formData.status }
          : u
      ));

      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (err: any) {
      console.error('❌ Admin güncelleme hatası:', err);
      setError(err.message || 'Admin güncellenirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.role === AdminRole.SUPER_ADMIN) {
      alert('Süper Admin kullanıcısı silinemez.');
      return;
    }
    
    if (!confirm(`${user.name} kullanıcısı silinecek. Onaylıyor musunuz?`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;
      
      setAdminUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err: any) {
      console.error('❌ Admin silme hatası:', err);
      alert('Admin silinirken hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    }
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Düzenleme modunda şifre değiştirmiyoruz
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
    setError(null);
  };

  const stats = {
    total: adminUsers.length,
    active: adminUsers.filter(u => u.status === 'active').length,
    superAdmin: adminUsers.filter(u => u.role === AdminRole.SUPER_ADMIN).length,
    finance: adminUsers.filter(u => u.role === AdminRole.FINANCE).length,
    operations: adminUsers.filter(u => u.role === AdminRole.OPERATIONS).length,
    support: adminUsers.filter(u => u.role === AdminRole.SUPPORT).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-600" size={32} />
        <span className="ml-3 text-slate-600">Admin kullanıcıları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Admin Kullanıcıları</h2>
          <p className="text-slate-500 mt-1">Sistem yöneticilerini ve rollerini yönetin</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
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
                        <p className="text-xs text-slate-500">{user.id.substring(0, 8)}...</p>
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
                        onClick={() => openEditModal(user)}
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

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Yeni Admin Ekle</h2>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ad Soyad *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Admin adı"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">E-posta *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="admin@ornek.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Şifre *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="En az 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as AdminRole }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value={AdminRole.SUPPORT}>Destek</option>
                  <option value={AdminRole.OPERATIONS}>Operasyon</option>
                  <option value={AdminRole.FINANCE}>Finans</option>
                  <option value={AdminRole.SUPER_ADMIN}>Süper Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Durum</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'disabled' }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="active">Aktif</option>
                  <option value="disabled">Devre Dışı</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddUser}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                {saving ? 'Ekleniyor...' : 'Admin Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Admin Düzenle</h2>
              <button
                onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ad Soyad</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">E-posta</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">E-posta değiştirilemez</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as AdminRole }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  disabled={selectedUser.role === AdminRole.SUPER_ADMIN}
                >
                  <option value={AdminRole.SUPPORT}>Destek</option>
                  <option value={AdminRole.OPERATIONS}>Operasyon</option>
                  <option value={AdminRole.FINANCE}>Finans</option>
                  <option value={AdminRole.SUPER_ADMIN}>Süper Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Durum</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'disabled' }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  disabled={selectedUser.role === AdminRole.SUPER_ADMIN}
                >
                  <option value="active">Aktif</option>
                  <option value="disabled">Devre Dışı</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleEditUser}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Edit size={18} />}
                {saving ? 'Kaydediliyor...' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
