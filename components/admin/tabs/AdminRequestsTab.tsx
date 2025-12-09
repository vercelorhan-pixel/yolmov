/**
 * Admin Partner Requests Tab
 * 3 alt sekme: Lead Talepleri, Alan Genişletme, Destek Talepleri
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Phone, AlertTriangle, CheckCircle, XCircle, Eye, Clock, TrendingUp } from 'lucide-react';
import { useAdminFilter } from '../hooks/useAdminFilter';
import EmptyState from '../ui/EmptyState';
import StatusBadge from '../ui/StatusBadge';

// Interfaces
interface PartnerLeadRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'lead_purchase';
  serviceArea: string;
  serviceType: string;
  creditCost: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
  customerInfo?: {
    name: string;
    phone: string;
    location: string;
  };
}

interface ServiceAreaRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'area_expansion';
  currentAreas: string[];
  requestedAreas: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
}

interface PartnerSupportRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  requestType: 'support' | 'billing' | 'technical' | 'feature';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  attachments?: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  resolution?: string;
}

interface Props {
  leadRequests: PartnerLeadRequest[];
  areaRequests: ServiceAreaRequest[];
  supportRequests: PartnerSupportRequest[];
}

const AdminRequestsTab: React.FC<Props> = ({ leadRequests, areaRequests, supportRequests }) => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'lead' | 'area' | 'support'>('lead');

  const leadFilter = useAdminFilter<PartnerLeadRequest>(
    leadRequests,
    { searchKeys: ['partnerName', 'serviceArea', 'serviceType'], statusKey: 'status' }
  );

  const areaFilter = useAdminFilter<ServiceAreaRequest>(
    areaRequests,
    { searchKeys: ['partnerName'], statusKey: 'status' }
  );

  const supportFilter = useAdminFilter<PartnerSupportRequest>(
    supportRequests,
    { searchKeys: ['partnerName', 'subject', 'description'], statusKey: 'status' }
  );

  const leadStats = {
    total: leadRequests.length,
    pending: leadRequests.filter(r => r.status === 'pending').length,
    approved: leadRequests.filter(r => r.status === 'approved').length,
    rejected: leadRequests.filter(r => r.status === 'rejected').length,
  };

  const areaStats = {
    total: areaRequests.length,
    pending: areaRequests.filter(r => r.status === 'pending').length,
    approved: areaRequests.filter(r => r.status === 'approved').length,
    rejected: areaRequests.filter(r => r.status === 'rejected').length,
  };

  const supportStats = {
    total: supportRequests.length,
    open: supportRequests.filter(r => r.status === 'open').length,
    inProgress: supportRequests.filter(r => r.status === 'in_progress').length,
    resolved: supportRequests.filter(r => r.status === 'resolved').length,
    closed: supportRequests.filter(r => r.status === 'closed').length,
    urgent: supportRequests.filter(r => r.priority === 'urgent').length,
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'cekici': 'Çekici',
      'aku': 'Akü Takviyesi',
      'lastik': 'Lastik Değişimi',
      'yakit': 'Yakıt Desteği',
    };
    return labels[type] || type;
  };

  const getSupportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'support': 'Genel Destek',
      'billing': 'Ödeme/Fatura',
      'technical': 'Teknik',
      'feature': 'Özellik Talebi',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'urgent': 'Acil',
      'high': 'Yüksek',
      'medium': 'Orta',
      'low': 'Düşük',
    };
    return labels[priority] || priority;
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('lead')}
          className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
            activeSubTab === 'lead' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Phone size={20} />
          Lead Talepleri
          {leadStats.pending > 0 && (
            <span className={`px-2 py-1 rounded-full text-xs font-black ${activeSubTab === 'lead' ? 'bg-white text-blue-600' : 'bg-orange-500 text-white'}`}>
              {leadStats.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('area')}
          className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
            activeSubTab === 'area' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <MapPin size={20} />
          Alan Genişletme
          {areaStats.pending > 0 && (
            <span className={`px-2 py-1 rounded-full text-xs font-black ${activeSubTab === 'area' ? 'bg-white text-green-600' : 'bg-orange-500 text-white'}`}>
              {areaStats.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('support')}
          className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
            activeSubTab === 'support' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <AlertTriangle size={20} />
          Destek
          {supportStats.urgent > 0 && (
            <span className={`px-2 py-1 rounded-full text-xs font-black ${activeSubTab === 'support' ? 'bg-white text-purple-600' : 'bg-red-500 text-white'}`}>
              {supportStats.urgent}
            </span>
          )}
        </button>
      </div>

      {/* LEAD REQUESTS */}
      {activeSubTab === 'lead' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <Phone size={20} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Toplam</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{leadStats.total}</p>
            </div>
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock size={20} className="text-orange-600" />
                <span className="text-xs font-bold text-orange-600">Bekleyen</span>
              </div>
              <p className="text-2xl font-black text-orange-700">{leadStats.pending}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-xs font-bold text-green-600">Onaylanan</span>
              </div>
              <p className="text-2xl font-black text-green-700">{leadStats.approved}</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <XCircle size={20} className="text-red-600" />
                <span className="text-xs font-bold text-red-600">Reddedilen</span>
              </div>
              <p className="text-2xl font-black text-red-700">{leadStats.rejected}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Partner, bölge veya hizmet ara..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={leadFilter.searchTerm}
                onChange={(e) => leadFilter.setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={leadFilter.filterType}
              onChange={(e) => leadFilter.setFilterType(e.target.value)}
            >
              <option value="">Tüm Durumlar</option>
              <option value="pending">Bekleyen</option>
              <option value="approved">Onaylanan</option>
              <option value="rejected">Reddedilen</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {leadFilter.filtered.length === 0 ? (
              <EmptyState title="Lead Talebi Yok" description="Arama kriterine uygun lead talebi bulunamadı." />
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Partner</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Bölge & Hizmet</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Maliyet</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Durum</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Tarih</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadFilter.filtered.map((request) => (
                    <tr 
                      key={request.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/talepler/lead/${request.id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{request.partnerName}</p>
                        <p className="text-xs text-slate-500">{request.partnerId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{request.serviceArea}</p>
                        <p className="text-xs text-slate-500">{getServiceTypeLabel(request.serviceType)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                          {request.creditCost} Kredi
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge 
                          type="request" 
                          status={request.status} 
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{request.createdAt}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/talepler/lead/${request.id}`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* AREA EXPANSION REQUESTS */}
      {activeSubTab === 'area' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <MapPin size={20} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Toplam</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{areaStats.total}</p>
            </div>
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock size={20} className="text-orange-600" />
                <span className="text-xs font-bold text-orange-600">Bekleyen</span>
              </div>
              <p className="text-2xl font-black text-orange-700">{areaStats.pending}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-xs font-bold text-green-600">Onaylanan</span>
              </div>
              <p className="text-2xl font-black text-green-700">{areaStats.approved}</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <XCircle size={20} className="text-red-600" />
                <span className="text-xs font-bold text-red-600">Reddedilen</span>
              </div>
              <p className="text-2xl font-black text-red-700">{areaStats.rejected}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Partner ara..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={areaFilter.searchTerm}
                onChange={(e) => areaFilter.setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-green-500 outline-none"
              value={areaFilter.filterType}
              onChange={(e) => areaFilter.setFilterType(e.target.value)}
            >
              <option value="">Tüm Durumlar</option>
              <option value="pending">Bekleyen</option>
              <option value="approved">Onaylanan</option>
              <option value="rejected">Reddedilen</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {areaFilter.filtered.length === 0 ? (
              <EmptyState title="Alan Talebi Yok" description="Arama kriterine uygun alan genişletme talebi bulunamadı." />
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Partner</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Mevcut Bölgeler</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">İstenen Bölgeler</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Durum</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Tarih</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {areaFilter.filtered.map((request) => (
                    <tr 
                      key={request.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/talepler/alan/${request.id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{request.partnerName}</p>
                        <p className="text-xs text-slate-500">{request.partnerId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {request.currentAreas.slice(0, 2).map((area, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                              {area}
                            </span>
                          ))}
                          {request.currentAreas.length > 2 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                              +{request.currentAreas.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {request.requestedAreas.slice(0, 2).map((area, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                              {area}
                            </span>
                          ))}
                          {request.requestedAreas.length > 2 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                              +{request.requestedAreas.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge 
                          type="request" 
                          status={request.status} 
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{request.createdAt}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/talepler/alan/${request.id}`); }}
                          className="p-2 text-slate-400 hover:text-green-600 bg-slate-50 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUPPORT REQUESTS */}
      {activeSubTab === 'support' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle size={20} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Toplam</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{supportStats.total}</p>
            </div>
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock size={20} className="text-orange-600" />
                <span className="text-xs font-bold text-orange-600">Açık</span>
              </div>
              <p className="text-2xl font-black text-orange-700">{supportStats.open}</p>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp size={20} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-600">İşlemde</span>
              </div>
              <p className="text-2xl font-black text-blue-700">{supportStats.inProgress}</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-xs font-bold text-green-600">Çözüldü</span>
              </div>
              <p className="text-2xl font-black text-green-700">{supportStats.resolved}</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle size={20} className="text-red-600" />
                <span className="text-xs font-bold text-red-600">Acil</span>
              </div>
              <p className="text-2xl font-black text-red-700">{supportStats.urgent}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Partner, konu veya açıklama ara..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                value={supportFilter.searchTerm}
                onChange={(e) => supportFilter.setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-purple-500 outline-none"
              value={supportFilter.filterType}
              onChange={(e) => supportFilter.setFilterType(e.target.value)}
            >
              <option value="">Tüm Durumlar</option>
              <option value="open">Açık</option>
              <option value="in_progress">İşlemde</option>
              <option value="resolved">Çözüldü</option>
              <option value="closed">Kapatıldı</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {supportFilter.filtered.length === 0 ? (
              <EmptyState title="Destek Talebi Yok" description="Arama kriterine uygun destek talebi bulunamadı." />
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Partner</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Konu & Tip</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Öncelik</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Durum</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Atanan</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Tarih</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supportFilter.filtered.map((request) => (
                    <tr 
                      key={request.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/talepler/destek/${request.id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{request.partnerName}</p>
                        <p className="text-xs text-slate-500">{request.partnerId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{request.subject}</p>
                        <p className="text-xs text-slate-500">{getSupportTypeLabel(request.requestType)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(request.priority)}`}>
                          {getPriorityLabel(request.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge 
                          type="support" 
                          status={request.status} 
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {request.assignedTo || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{request.createdAt}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/talepler/destek/${request.id}`); }}
                          className="p-2 text-slate-400 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestsTab;
