import React, { useEffect, useState } from 'react';
import { TableSkeleton } from '../../shared/UIComponents';
import { Badge } from '../../shared/UIComponents';
import { CheckCircle2, PauseCircle, XCircle } from 'lucide-react';
import { partnersApi } from '../../../services/supabaseApi';

const statusLabel = (s?: string) => {
  switch (s) {
    case 'active': return { text: 'Aktif', variant: 'success' as const };
    case 'pending': return { text: 'Beklemede', variant: 'warning' as const };
    case 'suspended': return { text: 'Askıda', variant: 'error' as const };
    default: return { text: 'Bilinmiyor', variant: 'neutral' as const };
  }
};

const AdminPartnersTab: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Array<any>>([]);
  const [error, setError] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await partnersApi.getAll();
      const filtered = statusFilter ? data.filter((p: any) => p.status === statusFilter) : data;
      setPartners(filtered);
    } catch (e: any) {
      console.error('Partner load error:', e);
      setError(e?.message || 'Partnerler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id: string, next: 'active' | 'suspended' | 'pending') => {
    try {
      await partnersApi.update(id, { status: next });
      await load();
    } catch (e: any) {
      console.error('Status update error:', e);
      setError(e?.message || 'Durum güncellenemedi');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Partner Başvuruları</h2>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Beklemede</option>
          <option value="active">Aktif</option>
          <option value="suspended">Askıda</option>
          <option value="">Tümü</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 text-sm font-bold">Toplam: {partners.length}</div>
          <div className="divide-y divide-slate-100">
            {partners.map((p) => {
              const sl = statusLabel(p.status);
              const displayName = p.company_name || p.name || 'Partner';
              const profileImage = p.profile_photo_url || p.logo_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=64`;
              return (
                <div key={p.id} className="p-4 flex items-center gap-4">
                  <img 
                    src={profileImage} 
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-sm">{displayName}</div>
                    <div className="text-xs text-slate-500">{p.email} • {p.phone}</div>
                    <div className="text-xs text-slate-500">{p.city || '-'} / {p.district || '-'}</div>
                  </div>
                  <Badge variant={sl.variant}>{sl.text}</Badge>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1"
                      onClick={() => updateStatus(p.id, 'active')}
                      title="Onayla"
                    >
                      <CheckCircle2 size={16} /> Onayla
                    </button>
                    <button
                      className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs font-bold hover:bg-yellow-600 flex items-center gap-1"
                      onClick={() => updateStatus(p.id, 'pending')}
                      title="Beklemeye Al"
                    >
                      <PauseCircle size={16} /> Beklemede
                    </button>
                    <button
                      className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 flex items-center gap-1"
                      onClick={() => updateStatus(p.id, 'suspended')}
                      title="Askıya Al"
                    >
                      <XCircle size={16} /> Askıya Al
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPartnersTab;
