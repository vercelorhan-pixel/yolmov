/**
 * Admin System Logs Component
 * Tüm admin işlemlerinin log kaydı ve takibi
 */

import React, { useState } from 'react';
import { Shield, User, FileText, CheckCircle, XCircle, Trash2, Edit, Plus, Calendar, Filter, Search, Eye } from 'lucide-react';
import { SystemLog, AdminRole } from '../types';

// MOCK DATA
const MOCK_LOGS: SystemLog[] = [
  {
    id: 'LOG-1234',
    adminId: 'ADM-001',
    adminName: 'Ahmet Admin',
    action: 'approve',
    entity: 'partner',
    entityId: 'PTR-5678',
    details: 'Oto Kurtarma A.Ş. partneri onaylandı',
    timestamp: '2023-11-23 14:30:25',
  },
  {
    id: 'LOG-1233',
    adminId: 'ADM-002',
    adminName: 'Ayşe Support',
    action: 'reject',
    entity: 'document',
    entityId: 'DOC-8901',
    details: 'Ruhsat belgesi reddedildi - Belge okunaklı değil',
    timestamp: '2023-11-23 13:15:10',
  },
  {
    id: 'LOG-1232',
    adminId: 'ADM-001',
    adminName: 'Ahmet Admin',
    action: 'delete',
    entity: 'user',
    entityId: 'USR-4567',
    details: 'Spam kullanıcı hesabı silindi',
    timestamp: '2023-11-23 11:45:00',
  },
  {
    id: 'LOG-1231',
    adminId: 'ADM-003',
    adminName: 'Mehmet Finance',
    action: 'update',
    entity: 'offer',
    entityId: 'OFF-7890',
    details: 'Teklif fiyatı düzeltildi: 850₺ → 800₺',
    timestamp: '2023-11-23 10:20:15',
  },
  {
    id: 'LOG-1230',
    adminId: 'ADM-002',
    adminName: 'Ayşe Support',
    action: 'approve',
    entity: 'user',
    entityId: 'USR-3456',
    details: 'Yeni müşteri kaydı onaylandı',
    timestamp: '2023-11-23 09:00:00',
  },
  {
    id: 'LOG-1229',
    adminId: 'ADM-001',
    adminName: 'Ahmet Admin',
    action: 'create',
    entity: 'request',
    entityId: 'REQ-2345',
    details: 'Manuel acil yardım talebi oluşturuldu',
    timestamp: '2023-11-22 18:30:00',
  },
];

export const AdminSystemLogs: React.FC = () => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | SystemLog['action']>('all');
  const [entityFilter, setEntityFilter] = useState<'all' | SystemLog['entity']>('all');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const filteredLogs = MOCK_LOGS.filter(log => {
    const matchesSearch = 
      log.adminName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity === entityFilter;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const getActionBadge = (action: SystemLog['action']) => {
    const config = {
      approve: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle, label: 'Onaylandı' },
      reject: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Reddedildi' },
      delete: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Trash2, label: 'Silindi' },
      update: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Edit, label: 'Güncellendi' },
      create: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Plus, label: 'Oluşturuldu' },
    };
    const { bg, text, border, icon: Icon, label } = config[action];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
        <Icon size={12} />
        {label}
      </span>
    );
  };

  const getEntityLabel = (entity: SystemLog['entity']) => {
    const labels = {
      user: 'Kullanıcı',
      partner: 'Partner',
      request: 'Talep',
      offer: 'Teklif',
      document: 'Belge',
    };
    return labels[entity];
  };

  const stats = {
    total: MOCK_LOGS.length,
    today: MOCK_LOGS.filter(log => log.timestamp.includes('2023-11-23')).length,
    approvals: MOCK_LOGS.filter(log => log.action === 'approve').length,
    rejections: MOCK_LOGS.filter(log => log.action === 'reject').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Toplam Log</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Bugünkü İşlemler</p>
              <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Onaylar</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvals}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Redler</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejections}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Log ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tüm İşlemler</option>
              <option value="approve">Onaylar</option>
              <option value="reject">Redler</option>
              <option value="delete">Silme</option>
              <option value="update">Güncelleme</option>
              <option value="create">Oluşturma</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tüm Varlıklar</option>
              <option value="user">Kullanıcı</option>
              <option value="partner">Partner</option>
              <option value="request">Talep</option>
              <option value="offer">Teklif</option>
              <option value="document">Belge</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Log ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Admin</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">İşlem</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Varlık</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Detay</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Zaman</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Görüntüle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-700">{log.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Shield size={14} className="text-orange-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{log.adminName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-700">{getEntityLabel(log.entity)}</span>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <p className="text-sm text-gray-600 truncate">{log.details}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{log.timestamp}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors mx-auto"
                    >
                      <Eye size={16} className="text-gray-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Log Bulunamadı</h3>
            <p className="text-gray-500">Arama kriterlerinize uygun log kaydı bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Log Detayları</h2>
              <button onClick={() => setSelectedLog(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Log ID</span>
                <span className="font-mono font-semibold">{selectedLog.id}</span>
              </div>

              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Admin</span>
                <span className="font-semibold">{selectedLog.adminName}</span>
              </div>

              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">İşlem Tipi</span>
                {getActionBadge(selectedLog.action)}
              </div>

              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Varlık Tipi</span>
                <span className="font-semibold">{getEntityLabel(selectedLog.entity)}</span>
              </div>

              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Varlık ID</span>
                <span className="font-mono font-semibold">{selectedLog.entityId}</span>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-1 font-semibold">İşlem Detayı:</p>
                <p className="text-gray-700">{selectedLog.details}</p>
              </div>

              <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Zaman Damgası</span>
                <span className="font-semibold">{selectedLog.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystemLogs;
