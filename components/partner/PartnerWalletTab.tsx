import React from 'react';
import { 
  Wallet, Plus, TrendingUp, ArrowUpRight, ArrowDownLeft, Briefcase
} from 'lucide-react';

// Transaction type
interface Transaction {
  id: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  status: 'completed' | 'pending';
  isCredit?: boolean;
}

// Props Interface
export interface PartnerWalletTabProps {
  credits: number;
  transactions: Transaction[];
  walletFilter: 'all' | 'income' | 'expense';
  setWalletFilter: (filter: 'all' | 'income' | 'expense') => void;
  setShowAddCreditModal: (show: boolean) => void;
}

const PartnerWalletTab: React.FC<PartnerWalletTabProps> = ({
  credits,
  transactions,
  walletFilter,
  setWalletFilter,
  setShowAddCreditModal,
}) => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} /></div>
          <p className="text-slate-400 text-sm font-medium mb-1">Toplam Bakiye (Kredi)</p>
          <h2 className="text-4xl font-bold mb-4">{credits} <span className="text-lg font-normal text-slate-400">Kredi</span></h2>
          <button onClick={() => setShowAddCreditModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-900/50 flex items-center gap-2">
            <Plus size={16} /> Kredi Yükle
          </button>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
            <span className="text-slate-500 text-sm font-bold">Bu Ay Kazanç</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">₺12,450.00</h3>
          <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1"><ArrowUpRight size={12} /> %12 artış</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={20} /></div>
            <span className="text-slate-500 text-sm font-bold">Tamamlanan İş</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">42 Adet</h3>
          <p className="text-xs text-slate-400 font-bold mt-1">Son 30 gün</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-800">Hesap Hareketleri</h3>
          <div className="flex gap-2">
            {(['all', 'income', 'expense'] as const).map(f => (
              <button key={f} onClick={() => setWalletFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${walletFilter === f ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                {f === 'all' ? 'Tümü' : f === 'income' ? 'Gelirler' : 'Giderler'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {transactions.filter(t => walletFilter === 'all' || t.type === walletFilter).length > 0 ? (
            transactions.filter(t => walletFilter === 'all' || t.type === walletFilter).map(trx => (
              <div key={trx.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {trx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{trx.title}</p>
                    <p className="text-xs text-slate-400">{trx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${trx.type === 'income' ? 'text-green-600' : 'text-slate-800'}`}>
                    {trx.type === 'income' ? '+' : '-'}{trx.isCredit ? `${trx.amount} Kredi` : `₺${trx.amount}`}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{trx.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Wallet size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Henüz işlem kaydı yok</p>
              <p className="text-xs text-slate-400 mt-2">İşlemleriniz burada görünecek</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerWalletTab;
