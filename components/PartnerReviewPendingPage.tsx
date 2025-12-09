import React from 'react';
import { Clock, Shield, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PartnerReviewPendingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto mb-4">
          <Clock size={24} />
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Üyeliğiniz İnceleniyor</h1>
        <p className="text-slate-600 text-sm mb-4">Başvurunuz başarıyla alındı ve operasyon ekibimiz tarafından inceleniyor. Onaylandığında e-posta ile bilgilendirileceksiniz.</p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6">
          <div className="flex items-center gap-2 text-slate-700 text-sm">
            <Shield size={16} className="text-slate-400" />
            Güvenlik gereği onay süreci tamamlanmadan panele erişim sağlanmamaktadır.
          </div>
          <div className="flex items-center gap-2 text-slate-700 text-sm mt-2">
            <Mail size={16} className="text-slate-400" />
            E-posta bildirimini bekleyin veya daha sonra tekrar giriş yapmayı deneyin.
          </div>
        </div>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Ana Sayfaya Dön</button>
      </div>
    </div>
  );
};

export default PartnerReviewPendingPage;
