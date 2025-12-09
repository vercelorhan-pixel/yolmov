import React, { useState } from 'react';
import { Calendar, Download, BarChart3 } from 'lucide-react';

const AdminReportsTab: React.FC = () => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [type, setType] = useState('Finansal');

  const isInvalidRange = Boolean(start && end && start > end);

  const downloadQuickReport = (period: 'daily' | 'weekly' | 'monthly') => {
    const today = new Date();
    const periodMap = {
      daily: 'gunluk',
      weekly: 'haftalik',
      monthly: 'aylik'
    };
    const filename = `yolmov-${periodMap[period]}-rapor-${today.toISOString().split('T')[0]}.csv`;
    
    const headers = ['Tarih', 'İşlem Sayısı', 'Toplam Gelir', 'Partner Sayısı', 'Müşteri Sayısı'];
    const rows = [[
      today.toLocaleDateString('tr-TR'),
      period === 'daily' ? '24' : period === 'weekly' ? '187' : '892',
      '₺45,600',
      '12',
      '45'
    ]];
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="panel-reports" role="tabpanel" aria-labelledby="reports">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Günlük Rapor', value: 24, color: 'blue', btn: 'blue', period: 'daily' as const }, 
          { label: 'Haftalık Rapor', value: 187, color: 'orange', btn: 'orange', period: 'weekly' as const }, 
          { label: 'Aylık Rapor', value: 892, color: 'green', btn: 'green', period: 'monthly' as const }
        ].map(r => (
          <div key={r.label} className="bg-white rounded-2xl border border-slate-200 p-6" role="region" aria-label={r.label}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-600">{r.label}</h3>
              <Calendar size={20} className="text-slate-400" />
            </div>
            <p className="text-3xl font-black text-slate-900 mb-2">{r.value}</p>
            <p className="text-xs text-slate-500">Tamamlanan işlem</p>
            <button 
              onClick={() => downloadQuickReport(r.period)}
              className={`mt-4 w-full px-4 py-2 bg-${r.btn}-50 text-${r.btn}-600 rounded-xl text-sm font-bold hover:bg-${r.btn}-100 flex items-center justify-center gap-2`} 
              aria-label={`${r.label} indir`}
            >
              <Download size={16} /> İndir
            </button>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6" role="form" aria-label="Özel Rapor Oluştur">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Özel Rapor Oluştur</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="start">Başlangıç</label>
            <input id="start" type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="end">Bitiş</label>
            <input id="end" type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="reportType">Rapor Tipi</label>
            <select id="reportType" value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
              <option>Tüm</option>
              <option>Finansal</option>
              <option>Kullanıcı</option>
              <option>Partner</option>
              <option>İşlem</option>
            </select>
          </div>
        </div>
        {isInvalidRange && <p className="text-xs text-red-600 mb-3" role="alert">Başlangıç tarihi bitiş tarihinden büyük olamaz.</p>}
        <button
          disabled={isInvalidRange || !start || !end}
          className={`w-full px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isInvalidRange || !start || !end ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          aria-disabled={isInvalidRange || !start || !end}
          aria-label="Rapor oluştur"
        >
          <BarChart3 size={20} /> Rapor Oluştur
        </button>
      </div>
    </div>
  );
};

export default AdminReportsTab;
