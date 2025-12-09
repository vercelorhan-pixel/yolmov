/**
 * Admin Customer Requests Tab
 * Müşteri teklif talepleri sekmesi (B2C)
 */

import React, { useState } from 'react';
import { Users, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminFilter } from '../hooks/useAdminFilter';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';

interface CustomerRequestLog {
  id: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  location: string;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
  amount?: number;
}

interface AdminCustomerRequestsTabProps {
  requests: CustomerRequestLog[];
}

const AdminCustomerRequestsTab: React.FC<AdminCustomerRequestsTabProps> = ({ requests }) => {
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequestLog | null>(null);
  
  const {
    searchTerm,
    setSearchTerm,
    filterType: selectedStatus,
    setFilterType: setSelectedStatus,
    filtered: filteredData
  } = useAdminFilter(requests, {
    searchKeys: ['customerName', 'serviceType', 'location', 'id'],
    statusKey: 'status'
  });

  const stats = {
    total: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    matched: requests.filter(r => r.status === 'matched').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'towing': 'Çekici',
      'battery': 'Akü Takviye',
      'fuel': 'Yakıt',
      'locksmith': 'Anahtar',
      'tire': 'Lastik',
      'winch': 'Vinç',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-bold mb-1">Toplam</p>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 p-4">
          <p className="text-xs text-yellow-700 font-bold mb-1">Açık</p>
          <p className="text-3xl font-black text-yellow-900">{stats.open}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-4">
          <p className="text-xs text-blue-700 font-bold mb-1">Eşleşti</p>
          <p className="text-3xl font-black text-blue-900">{stats.matched}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-4">
          <p className="text-xs text-green-700 font-bold mb-1">Tamamlandı</p>
          <p className="text-3xl font-black text-green-900">{stats.completed}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-bold mb-1">İptal</p>
          <p className="text-3xl font-black text-slate-700">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Müşteri, hizmet veya konum ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-w-[180px]"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="open">Açık</option>
            <option value="matched">Eşleşti</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase">ID</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase">Müşteri</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase">Hizmet</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase">Konum</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase">Tutar</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase">Durum</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase">Tarih</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-700 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12">
                    <EmptyState
                      title="Talep Bulunamadı"
                      description={searchTerm || selectedStatus !== 'all' ? 'Arama kriterlerinize uygun talep yok.' : 'Henüz müşteri talebi yok.'}
                    />
                  </td>
                </tr>
              ) : (
                filteredData.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-600">{request.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
                          {request.customerName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{request.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900">{getServiceTypeLabel(request.serviceType)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{request.location}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.amount ? (
                        <span className="font-bold text-green-700">₺{request.amount.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge type="request" status={request.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{request.createdAt}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/admin/musteri-talepleri/${request.id}`)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Detayları Görüntüle"
                      >
                        <Eye size={18} className="text-slate-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900">Talep Detayları</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-bold mb-1">Talep ID</p>
                  <p className="font-mono text-sm text-slate-900">{selectedRequest.id}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-bold mb-1">Durum</p>
                  <StatusBadge type="request" status={selectedRequest.status} />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-bold mb-1">Müşteri</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                    {selectedRequest.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{selectedRequest.customerName}</p>
                    <p className="text-xs text-slate-500">{selectedRequest.customerId}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-bold mb-1">Hizmet Tipi</p>
                <p className="text-lg font-bold text-slate-900">{getServiceTypeLabel(selectedRequest.serviceType)}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-bold mb-1">Konum</p>
                <p className="text-sm text-slate-900">{selectedRequest.location}</p>
              </div>

              {selectedRequest.amount && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-green-700 font-bold mb-1">Tutar</p>
                  <p className="text-2xl font-black text-green-900">₺{selectedRequest.amount.toLocaleString()}</p>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-bold mb-1">Oluşturulma Tarihi</p>
                <p className="text-sm text-slate-900">{selectedRequest.createdAt}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomerRequestsTab;
