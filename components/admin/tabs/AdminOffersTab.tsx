import React from 'react';
import { Search, Eye } from 'lucide-react';
import { useAdminFilter } from '../hooks/useAdminFilter';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';

export interface OfferLog {
  id: string;
  partnerId: string;
  partnerName: string;
  requestId: string;
  price: number;
  status: 'sent' | 'accepted' | 'rejected';
  createdAt: string;
}

interface AdminOffersTabProps {
  data: OfferLog[];
  onViewOffer: (offer: OfferLog) => void;
}

const AdminOffersTab: React.FC<AdminOffersTabProps> = ({ data, onViewOffer }) => {
  const { filtered, searchTerm, setSearchTerm, filterType, setFilterType } = useAdminFilter<OfferLog>(data, {
    searchKeys: ['id', 'partnerName'],
    statusKey: 'status'
  });

  return (
    <div className="space-y-6" id="panel-offers" role="tabpanel" aria-labelledby="offers">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            aria-label="Teklif arama"
            placeholder="Teklif ara..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          aria-label="Teklif durum filtresi"
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="sent">Gönderildi</option>
          <option value="accepted">Kabul Edildi</option>
          <option value="rejected">Reddedildi</option>
        </select>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" role="region" aria-label="Teklif listesi">
        {filtered.length === 0 ? (
          <EmptyState title="Teklif Yok" description="Kriterlere uyan teklif bulunamadı." />
        ) : (
          <table className="w-full" role="table">
            <thead className="bg-slate-50 border-b border-slate-200" role="rowgroup">
              <tr role="row">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase" role="columnheader">Teklif ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase" role="columnheader">Partner</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase" role="columnheader">Talep</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase" role="columnheader">Fiyat</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase" role="columnheader">Durum</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase" role="columnheader">Tarih</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase" role="columnheader">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" role="rowgroup">
              {filtered.map(offer => (
                <tr key={offer.id} className="hover:bg-slate-50" role="row">
                  <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900" role="cell">{offer.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-900" role="cell">{offer.partnerName}</td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-600" role="cell">{offer.requestId}</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600" role="cell">₺{offer.price}</td>
                  <td className="px-6 py-4" role="cell"><StatusBadge type="offer" status={offer.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-600" role="cell">{offer.createdAt}</td>
                  <td className="px-6 py-4 text-right" role="cell">
                    <button onClick={() => onViewOffer(offer)} className="p-2 text-slate-400 hover:text-blue-600" aria-label={`Teklif ${offer.id} detay`}><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOffersTab;
