import React from 'react';
import { Search, MapPin, ChevronRight, Info, ShieldAlert } from 'lucide-react';
import { CompletedJob } from '../../types';

interface PartnerHistoryTabProps {
  selectedHistoryItem: CompletedJob | null;
  setSelectedHistoryItem: (item: CompletedJob | null) => void;
  historySearch: string;
  setHistorySearch: (search: string) => void;
  historyFilter: string;
  setHistoryFilter: (filter: string) => void;
  filteredHistory: CompletedJob[];
}

const PartnerHistoryTab: React.FC<PartnerHistoryTabProps> = ({
  selectedHistoryItem,
  setSelectedHistoryItem,
  historySearch,
  setHistorySearch,
  historyFilter,
  setHistoryFilter,
  filteredHistory,
}) => {
  // Eğer detay seçiliyse, detay view göster
  if (selectedHistoryItem) {
    const item = selectedHistoryItem;
    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedHistoryItem(null)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold mb-4"
        >
          <ChevronRight size={20} className="rotate-180" /> Geri Dön
        </button>

        {/* Detail View */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                İş Detayı <span className="text-blue-600">#{item.id}</span>
              </h2>
              <p className="text-sm text-slate-500">{new Date(item.completionTime).toLocaleString('tr-TR')}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl font-bold ${item.status === 'completed' ? 'bg-green-50 text-green-700' : item.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
              {item.status === 'completed' ? '✓ Tamamlandı' : item.status === 'cancelled' ? '✗ İptal' : '↩ İade'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Finansal Detaylar</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-600">Hizmet Bedeli</span><span className="font-bold text-slate-900">₺{item.totalAmount}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-600">Komisyon (%15)</span><span className="font-bold text-red-500">-₺{item.commission}</span></div>
                <div className="flex justify-between text-base pt-3 border-t border-slate-100"><span className="font-bold text-slate-800">Toplam Kazanç</span><span className="font-bold text-green-600 text-lg">₺{item.partnerEarning}</span></div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800"><Info size={14} className="inline mr-1 mb-0.5" />Bu işlem için <strong>1 Kredi</strong> kullanılmıştır.</div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Müşteri & Rota</h3>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">{item.customerName.charAt(0)}</div>
                  <div><p className="font-bold text-slate-800">{item.customerName}</p><p className="text-xs text-slate-500">Müşteri</p></div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/50 p-2 rounded-lg"><ShieldAlert size={16} className="text-orange-500" /><span>{item.customerPhone || '05** *** ** 12'}</span><span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded ml-auto">Gizli</span></div>
              </div>
              <div>
                <div className="flex items-start gap-3 mb-3"><div className="mt-1 w-2 h-2 rounded-full bg-blue-500"></div><div><p className="text-xs text-slate-400 font-bold">BAŞLANGIÇ</p><p className="text-sm font-medium text-slate-800">{item.startLocation}</p></div></div>
                <div className="flex items-start gap-3"><div className="mt-1 w-2 h-2 rounded-full bg-slate-800"></div><div><p className="text-xs text-slate-400 font-bold">VARIŞ</p><p className="text-sm font-medium text-slate-800">{item.endLocation || 'Yerinde Hizmet'}</p></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Liste view
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="İş No, Müşteri Adı veya Plaka ara..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
          />
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shrink-0">
          {['week', 'month', 'year'].map(f => (
            <button key={f} onClick={() => setHistoryFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${historyFilter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              {f === 'week' ? 'Bu Hafta' : f === 'month' ? 'Bu Ay' : 'Bu Yıl'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-400 font-bold">
                <th className="p-4 pl-6">İş No / Tarih</th>
                <th className="p-4">Hizmet & Rota</th>
                <th className="p-4">Müşteri</th>
                <th className="p-4">Tutar</th>
                <th className="p-4">Durum</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => setSelectedHistoryItem(item)}>
                  <td className="p-4 pl-6">
                    <p className="font-bold text-slate-800 text-sm">#{item.id}</p>
                    <p className="text-xs text-slate-400">{new Date(item.completionTime).toLocaleString('tr-TR')}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800 text-sm">{item.serviceType}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> {item.startLocation} {item.endLocation ? `→ ${item.endLocation}` : ''}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">{item.customerName.charAt(0)}</div>
                      <span className="text-sm text-slate-600">{item.customerName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800">₺{item.totalAmount}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.status === 'completed' ? 'bg-green-50 text-green-700' : item.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {item.status === 'completed' ? 'Tamamlandı' : item.status === 'cancelled' ? 'İptal' : 'İade'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><ChevronRight size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartnerHistoryTab;
