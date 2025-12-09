/**
 * Admin Activity Logs Tab V2
 * Gelişmiş kullanıcı ve partner aktivite loglarını görüntüleme
 * 
 * Özellikler:
 * - Trafik kaynakları analizi
 * - Sayfa süresi ve scroll derinliği
 * - Bounce rate
 * - Referrer bilgisi
 * - Kullanıcı yolculuğu
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, Eye, Users, Globe, Monitor, Smartphone, Tablet, Clock, RefreshCw, 
  Search, User, Building, Shield, HelpCircle, Timer, MousePointer, 
  TrendingUp, ExternalLink, Percent, ArrowRight, ChevronDown, ChevronUp,
  MapPin, Zap
} from 'lucide-react';
import { getActivityLogs, getActivityStats, type ActivityLog } from '../../../services/activityTrackerV2';

const AdminActivityLogsTab: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [stats, setStats] = useState({
    totalPageViews: 0,
    uniqueVisitors: 0,
    todayPageViews: 0,
    todayUniqueVisitors: 0,
    avgSessionDuration: 0,
    avgScrollDepth: 0,
    bounceRate: 0,
    topPages: [] as { pageUrl: string; count: number; avgDuration: number }[],
    trafficSources: [] as { source: string; count: number; percentage: number }[],
    userTypeBreakdown: [] as { userType: string; count: number }[],
    deviceBreakdown: [] as { deviceType: string; count: number }[]
  });

  // Filtreler
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [trafficSourceFilter, setTrafficSourceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  useEffect(() => {
    loadData();
  }, [userTypeFilter, activityTypeFilter, trafficSourceFilter, dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
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
          trafficSource: trafficSourceFilter !== 'all' ? trafficSourceFilter : undefined,
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
        activity.browser?.toLowerCase().includes(search) ||
        activity.referrer?.toLowerCase().includes(search) ||
        activity.trafficSource?.toLowerCase().includes(search)
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
      'page_exit': 'Sayfa Çıkış',
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

  const getTrafficSourceIcon = (source: string | undefined) => {
    if (!source) return <Globe size={14} className="text-slate-400" />;
    
    const sourceLC = source.toLowerCase();
    if (sourceLC.includes('google')) return <span className="text-sm">🔍</span>;
    if (sourceLC.includes('facebook') || sourceLC.includes('instagram')) return <span className="text-sm">📘</span>;
    if (sourceLC.includes('twitter') || sourceLC === 't.co') return <span className="text-sm">🐦</span>;
    if (sourceLC === 'direct') return <span className="text-sm">🎯</span>;
    if (sourceLC.includes('whatsapp')) return <span className="text-sm">💬</span>;
    return <ExternalLink size={14} className="text-slate-400" />;
  };

  const getTrafficSourceLabel = (source: string | undefined) => {
    if (!source || source === 'direct') return 'Direkt';
    if (source === 'google') return 'Google';
    return source.charAt(0).toUpperCase() + source.slice(1);
  };

  const getDeviceIcon = (deviceType: string | undefined) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone size={14} className="text-slate-500" />;
      case 'tablet': return <Tablet size={14} className="text-slate-500" />;
      default: return <Monitor size={14} className="text-slate-500" />;
    }
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds || seconds === 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}dk ${secs}s`;
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

  const formatReferrer = (referrer: string | undefined) => {
    if (!referrer) return 'Direkt giriş';
    try {
      const url = new URL(referrer);
      return url.hostname;
    } catch {
      return referrer;
    }
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
          <h2 className="text-2xl font-black text-slate-900">Aktivite Takibi V2</h2>
          <p className="text-slate-500 mt-1">Gelişmiş kullanıcı analizi ve trafik kaynakları</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Yenile
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Eye size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Görüntüleme</p>
              <p className="text-xl font-black text-slate-900">{stats.totalPageViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Ziyaretçi</p>
              <p className="text-xl font-black text-slate-900">{stats.uniqueVisitors.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Activity size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Bugün</p>
              <p className="text-xl font-black text-slate-900">{stats.todayPageViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Timer size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Ort. Süre</p>
              <p className="text-xl font-black text-slate-900">{formatDuration(stats.avgSessionDuration)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 rounded-lg">
              <MousePointer size={18} className="text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Scroll</p>
              <p className="text-xl font-black text-slate-900">{stats.avgScrollDepth}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <Percent size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Bounce</p>
              <p className="text-xl font-black text-slate-900">{stats.bounceRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">Bugün Tekil</p>
              <p className="text-xl font-black text-slate-900">{stats.todayUniqueVisitors}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Traffic Sources */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Globe size={16} />
            Trafik Kaynakları
          </h3>
          <div className="space-y-2">
            {stats.trafficSources.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTrafficSourceIcon(item.source)}
                  <span className="text-sm text-slate-600">{getTrafficSourceLabel(item.source)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{item.count}</span>
                  <span className="text-xs text-slate-400">({item.percentage}%)</span>
                </div>
              </div>
            ))}
            {stats.trafficSources.length === 0 && (
              <p className="text-sm text-slate-400">Veri yok</p>
            )}
          </div>
        </div>

        {/* User Type Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Users size={16} />
            Kullanıcı Tipleri
          </h3>
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
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Monitor size={16} />
            Cihazlar
          </h3>
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

        {/* Top Pages with Duration */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            Popüler Sayfalar
          </h3>
          <div className="space-y-2">
            {stats.topPages.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 truncate max-w-[120px]" title={item.pageUrl}>
                  {item.pageUrl}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{item.count}</span>
                  <span className="text-xs text-slate-400">({formatDuration(item.avgDuration)})</span>
                </div>
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
              placeholder="Sayfa, referrer, kaynak veya kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-w-[130px]"
          >
            <option value="all">Tüm Kullanıcılar</option>
            <option value="customer">Müşteriler</option>
            <option value="partner">Partnerler</option>
            <option value="admin">Adminler</option>
            <option value="anonymous">Anonim</option>
          </select>

          <select
            value={trafficSourceFilter}
            onChange={(e) => setTrafficSourceFilter(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-w-[130px]"
          >
            <option value="all">Tüm Kaynaklar</option>
            <option value="google">Google</option>
            <option value="direct">Direkt</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
          </select>

          <select
            value={activityTypeFilter}
            onChange={(e) => setActivityTypeFilter(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-w-[150px]"
          >
            <option value="all">Tüm Aktiviteler</option>
            <option value="page_view">Sayfa Görüntüleme</option>
            <option value="login">Giriş</option>
            <option value="logout">Çıkış</option>
            <option value="signup">Kayıt</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none min-w-[130px]"
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
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Sayfa</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Kaynak</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Referrer</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Süre</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Scroll</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Cihaz</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tarih</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <Activity size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Aktivite bulunamadı</p>
                    <p className="text-sm">Filtreleri değiştirerek tekrar deneyin</p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr 
                    key={activity.id} 
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      activity.isLandingPage ? 'bg-green-50/30' : ''
                    } ${activity.isBounce ? 'bg-red-50/30' : ''}`}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setShowDetailPanel(true);
                    }}
                  >
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
                      <div className="flex items-center gap-1">
                        {activity.isLandingPage && (
                          <span className="text-xs bg-green-100 text-green-700 px-1 rounded">LP</span>
                        )}
                        <span className="text-sm text-slate-600 max-w-[180px] truncate block" title={activity.pageUrl}>
                          {activity.pageUrl || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {getTrafficSourceIcon(activity.trafficSource)}
                        <span className="text-sm text-slate-600">
                          {getTrafficSourceLabel(activity.trafficSource)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 max-w-[120px] truncate block" title={activity.referrer || ''}>
                        {formatReferrer(activity.referrer)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        (activity.durationSeconds || 0) > 60 ? 'text-green-600' : 
                        (activity.durationSeconds || 0) > 30 ? 'text-blue-600' : 'text-slate-600'
                      }`}>
                        {formatDuration(activity.durationSeconds)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              (activity.scrollDepth || 0) > 75 ? 'bg-green-500' :
                              (activity.scrollDepth || 0) > 50 ? 'bg-blue-500' :
                              (activity.scrollDepth || 0) > 25 ? 'bg-yellow-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${activity.scrollDepth || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{activity.scrollDepth || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {getDeviceIcon(activity.deviceType)}
                        <span className="text-xs text-slate-500">{activity.browser}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Clock size={12} className="text-slate-400" />
                        {formatDate(activity.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronDown size={16} className="text-slate-400" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Toplam {filteredActivities.length} aktivite gösteriliyor
          </p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">LP = Landing Page</span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Kırmızı = Bounce</span>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {showDetailPanel && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailPanel(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Aktivite Detayı</h3>
              <button onClick={() => setShowDetailPanel(false)} className="text-slate-400 hover:text-slate-600">
                <ChevronUp size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Kullanıcı</p>
                  <div className="flex items-center gap-2">
                    {getUserTypeIcon(selectedActivity.userType)}
                    <span className="font-medium">{selectedActivity.userName || selectedActivity.userEmail || 'Anonim'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">User ID</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">{selectedActivity.userId || '-'}</code>
                </div>
              </div>

              {/* Page Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Sayfa URL</p>
                  <code className="text-sm bg-slate-100 px-2 py-1 rounded block truncate">{selectedActivity.pageUrl}</code>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Sayfa Başlığı</p>
                  <span className="text-sm">{selectedActivity.pageTitle || '-'}</span>
                </div>
              </div>

              {/* Traffic Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Trafik Kaynağı</p>
                  <div className="flex items-center gap-2">
                    {getTrafficSourceIcon(selectedActivity.trafficSource)}
                    <span>{getTrafficSourceLabel(selectedActivity.trafficSource)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Ortam</p>
                  <span>{selectedActivity.trafficMedium || '-'}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Referrer</p>
                  <span className="text-sm truncate block">{selectedActivity.referrer || 'Direkt'}</span>
                </div>
              </div>

              {/* UTM Parameters */}
              {(selectedActivity.utmSource || selectedActivity.utmCampaign) && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-700 font-bold mb-2">UTM Parametreleri</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div><span className="text-blue-600">Source:</span> {selectedActivity.utmSource || '-'}</div>
                    <div><span className="text-blue-600">Medium:</span> {selectedActivity.utmMedium || '-'}</div>
                    <div><span className="text-blue-600">Campaign:</span> {selectedActivity.utmCampaign || '-'}</div>
                    <div><span className="text-blue-600">Term:</span> {selectedActivity.utmTerm || '-'}</div>
                    <div><span className="text-blue-600">Content:</span> {selectedActivity.utmContent || '-'}</div>
                  </div>
                </div>
              )}

              {/* Performance */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Timer size={20} className="mx-auto text-purple-600 mb-1" />
                  <p className="text-xs text-slate-500">Süre</p>
                  <p className="font-bold">{formatDuration(selectedActivity.durationSeconds)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <MousePointer size={20} className="mx-auto text-cyan-600 mb-1" />
                  <p className="text-xs text-slate-500">Scroll</p>
                  <p className="font-bold">{selectedActivity.scrollDepth || 0}%</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Zap size={20} className={`mx-auto mb-1 ${selectedActivity.isLandingPage ? 'text-green-600' : 'text-slate-400'}`} />
                  <p className="text-xs text-slate-500">Landing</p>
                  <p className="font-bold">{selectedActivity.isLandingPage ? 'Evet' : 'Hayır'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <ArrowRight size={20} className={`mx-auto mb-1 ${selectedActivity.isBounce ? 'text-red-600' : 'text-slate-400'}`} />
                  <p className="text-xs text-slate-500">Bounce</p>
                  <p className="font-bold">{selectedActivity.isBounce ? 'Evet' : 'Hayır'}</p>
                </div>
              </div>

              {/* Device Info */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Cihaz</p>
                  <div className="flex items-center gap-1">
                    {getDeviceIcon(selectedActivity.deviceType)}
                    <span className="capitalize">{selectedActivity.deviceType}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Tarayıcı</p>
                  <span>{selectedActivity.browser}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">OS</p>
                  <span>{selectedActivity.os}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">IP</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">{selectedActivity.ipAddress || '-'}</code>
                </div>
              </div>

              {/* Screen Info */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Ekran</p>
                  <span className="text-sm">{selectedActivity.screenResolution || '-'}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Viewport</p>
                  <span className="text-sm">{selectedActivity.viewportSize || '-'}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Dil</p>
                  <span className="text-sm">{selectedActivity.language || '-'}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">Bağlantı</p>
                  <span className="text-sm">{selectedActivity.connectionType || '-'}</span>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={16} />
                  <span>Kayıt: {formatDate(selectedActivity.createdAt)}</span>
                  <span className="text-slate-300">|</span>
                  <span>Session: {selectedActivity.sessionId?.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityLogsTab;
