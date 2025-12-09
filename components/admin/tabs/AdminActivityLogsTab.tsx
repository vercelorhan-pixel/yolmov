/**
 * Admin Activity Logs Tab
 * Kullanıcı ve partner aktivite loglarını görüntüleme
 */

import React, { useState, useEffect } from 'react';
import { Activity, Eye, Users, Globe, Monitor, Smartphone, Tablet, Clock, RefreshCw, Filter, Search, User, Building, Shield, HelpCircle } from 'lucide-react';
import { getActivityLogs, getActivityStats, type ActivityLog } from '../../../services/activityTracker';

const AdminActivityLogsTab: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPageViews: 0,
    uniqueVisitors: 0,
    todayPageViews: 0,
    todayUniqueVisitors: 0,
    topPages: [] as { pageUrl: string; count: number }[],
    userTypeBreakdown: [] as { userType: string; count: number }[],
    deviceBreakdown: [] as { deviceType: string; count: number }[]
  });

  // Filtreler
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    loadData();
  }, [userTypeFilter, activityTypeFilter, dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Tarih filtresi hesapla
      let startDate: string | undefined;
      const now = new Date();
      if (dateFilter === 'today') {
        startDate = now.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString();
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString();
      }

      const [logsData, statsData] = await Promise.all([
        getActivityLogs({
          limit: 500,
          userType: userTypeFilter !== 'all' ? userTypeFilter : undefined,
          activityType: activityTypeFilter !== 'all' ? activityTypeFilter : undefined,
          startDate
        }),
        getActivityStats()
      ]);

      setActivities(logsData);
      setStats(statsData);
    } catch (error) {
      console.error('❌ Activity verisi yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        activity.pageUrl?.toLowerCase().includes(search) ||
        activity.userEmail?.toLowerCase().includes(search) ||
        activity.userName?.toLowerCase().includes(search) ||
        activity.browser?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'customer': return <User size={14} className="text-blue-600" />;
      case 'partner': return <Building size={14} className="text-green-600" />;
      case 'admin': return <Shield size={14} className="text-purple-600" />;
      default: return <HelpCircle size={14} className="text-slate-400" />;
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'customer': return 'Müşteri';
      case 'partner': return 'Partner';
      case 'admin': return 'Admin';
      default: return 'Anonim';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'page_view': 'Sayfa Görüntüleme',
      'login': 'Giriş',
      'logout': 'Çıkış',
      'request_create': 'Talep Oluşturma',
      'offer_create': 'Teklif Gönderme',
      'offer_accept': 'Teklif Kabul',
      'job_complete': 'İş Tamamlama',
      'signup': 'Kayıt',
      'button_click': 'Buton Tıklama',
      'form_submit': 'Form Gönderme'
    };
    return labels[type] || type;
  };

  const getDeviceIcon = (deviceType: string | undefined) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone size={14} className="text-slate-500" />;
      case 'tablet': return <Tablet size={14} className="text-slate-500" />;
      default: return <Monitor size={14} className="text-slate-500" />;
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-slate-600">Aktiviteler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Aktivite Takibi</h2>
          <p className="text-slate-500 mt-1">Kullanıcı ve partner aktivitelerini izleyin</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Yenile
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Eye size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Toplam Görüntüleme</p>
              <p className="text-2xl font-black text-slate-900">{stats.totalPageViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Tekil Ziyaretçi</p>
              <p className="text-2xl font-black text-slate-900">{stats.uniqueVisitors.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Activity size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Bugün Görüntüleme</p>
              <p className="text-2xl font-black text-slate-900">{stats.todayPageViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Globe size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Bugün Tekil</p>
              <p className="text-2xl font-black text-slate-900">{stats.todayUniqueVisitors.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User Type Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Kullanıcı Tipi Dağılımı</h3>
          <div className="space-y-2">
            {stats.userTypeBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getUserTypeIcon(item.userType)}
                  <span className="text-sm text-slate-600">{getUserTypeLabel(item.userType)}</span>
                </div>
                <span className="font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
            {stats.userTypeBreakdown.length === 0 && (
              <p className="text-sm text-slate-400">Veri yok</p>
            )}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Cihaz Dağılımı</h3>
          <div className="space-y-2">
            {stats.deviceBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(item.deviceType)}
                  <span className="text-sm text-slate-600 capitalize">{item.deviceType || 'Bilinmiyor'}</span>
                </div>
                <span className="font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
            {stats.deviceBreakdown.length === 0 && (
              <p className="text-sm text-slate-400">Veri yok</p>
            )}
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">En Çok Ziyaret Edilen</h3>
          <div className="space-y-2">
            {stats.topPages.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 truncate max-w-[150px]" title={item.pageUrl}>
                  {item.pageUrl}
                </span>
                <span className="font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
            {stats.topPages.length === 0 && (
              <p className="text-sm text-slate-400">Veri yok</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Sayfa, email veya kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-w-[150px]"
          >
            <option value="all">Tüm Kullanıcılar</option>
            <option value="customer">Müşteriler</option>
            <option value="partner">Partnerler</option>
            <option value="admin">Adminler</option>
            <option value="anonymous">Anonim</option>
          </select>

          <select
            value={activityTypeFilter}
            onChange={(e) => setActivityTypeFilter(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-w-[180px]"
          >
            <option value="all">Tüm Aktiviteler</option>
            <option value="page_view">Sayfa Görüntüleme</option>
            <option value="login">Giriş</option>
            <option value="logout">Çıkış</option>
            <option value="signup">Kayıt</option>
            <option value="request_create">Talep Oluşturma</option>
            <option value="offer_create">Teklif Gönderme</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-w-[150px]"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="today">Bugün</option>
            <option value="week">Son 7 Gün</option>
            <option value="month">Son 30 Gün</option>
          </select>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Kullanıcı</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Aktivite</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Sayfa</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Cihaz</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tarayıcı</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Activity size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Aktivite bulunamadı</p>
                    <p className="text-sm">Filtreleri değiştirerek tekrar deneyin</p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getUserTypeIcon(activity.userType)}
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {activity.userName || activity.userEmail || 'Anonim'}
                          </p>
                          <p className="text-xs text-slate-500">{getUserTypeLabel(activity.userType)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {getActivityTypeLabel(activity.activityType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600 max-w-[200px] truncate block" title={activity.pageUrl}>
                        {activity.pageUrl || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {getDeviceIcon(activity.deviceType)}
                        <span className="text-xs text-slate-500">{activity.os}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{activity.browser}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        {formatDate(activity.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Toplam {filteredActivities.length} aktivite gösteriliyor
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLogsTab;
