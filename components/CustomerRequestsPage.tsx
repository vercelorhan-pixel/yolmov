import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, RefreshCw, Car, MapPin, Calendar, 
  XCircle, Star, Home, List, Plus, MessageCircle, User
} from 'lucide-react';
import { Request, Customer } from '../types';
import { supabaseApi } from '../services/supabaseApi';

interface RequestWithDetails extends Request {
  vehicleInfo?: string;
  statusText?: string;
  statusColor?: string;
}

const CustomerRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Session kontrolü
      const session = await supabaseApi.auth.getSession();
      if (!session?.user) {
        navigate('/giris/musteri');
        return;
      }

      // Customer bilgilerini al
      const customerData = await supabaseApi.customers.getById(session.user.id);
      if (!customerData) {
        navigate('/giris/musteri');
        return;
      }
      setCustomer(customerData);

      // Talepleri al
      const customerRequests = await supabaseApi.requests.getByCustomerId(session.user.id);
      
      // Talepleri düzenle ve sırala (en yeni en üstte)
      const formattedRequests = customerRequests
        .map(req => ({
          ...req,
          statusText: getStatusText(req.status),
          statusColor: getStatusColor(req.status),
        }))
        .sort((a, b) => {
          // Önce duruma göre sırala (open > pending > completed > cancelled)
          const statusOrder: Record<string, number> = { 
            'open': 0, 
            'pending': 1, 
            'completed': 2, 
            'cancelled': 3 
          };
          const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
          if (statusDiff !== 0) return statusDiff;
          
          // Sonra tarihe göre (yeni en üstte)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      
      setRequests(formattedRequests);
      
      // Okunmamış bildirim var mı kontrol et (mock - gerçek implementasyon için notification API gerekli)
      // setHasUnreadNotifications(true);
      
    } catch (error) {
      console.error('❌ Veri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Bu talebi iptal etmek istediğinizden emin misiniz?')) return;
    
    try {
      await supabaseApi.requests.update(requestId, { status: 'cancelled' });
      await loadData(); // Listeyi yenile
    } catch (error) {
      console.error('❌ Talep iptal edilemedi:', error);
      alert('Talep iptal edilirken bir hata oluştu.');
    }
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'open': 'Açık',
      'pending': 'Beklemede',
      'completed': 'Tamamlandı',
      'cancelled': 'İptal Edildi',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'open': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'completed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (firstName?: string): string => {
    if (!firstName) return 'M';
    return firstName.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-brand-orange transition-colors p-2 -ml-2"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-brand-orange">yolmov</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              {hasUnreadNotifications && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <div className="h-8 w-8 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold text-sm">
              {getInitials(customer?.firstName)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Taleplerim</h2>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-sm text-brand-orange font-medium hover:text-orange-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <List size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-bold text-lg text-gray-900 mb-2">Henüz Talep Yok</h3>
            <p className="text-gray-500 text-sm mb-4">
              Yol yardım hizmetleri için talep oluşturabilirsiniz.
            </p>
            <button
              onClick={() => navigate('/teklif')}
              className="px-6 py-2.5 bg-brand-orange text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Talep Oluştur
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request, index) => (
              <div
                key={request.id}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
                  request.status === 'open'
                    ? 'border-brand-orange'
                    : 'border-gray-100 hover:border-gray-200'
                } ${request.status === 'completed' ? 'opacity-75' : ''}`}
              >
                {/* Header */}
                <div className={`${request.status === 'open' ? 'mb-3' : 'flex justify-between items-start mb-3'}`}>
                  {request.status === 'open' && (
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${request.statusColor}`}>
                        {request.statusText}
                      </span>
                    </div>
                  )}
                  
                  <div className={request.status === 'open' ? 'pr-16' : ''}>
                    <h3 className="font-bold text-lg mb-1 text-gray-900">
                      {request.serviceType || 'Hizmet'}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      #{request.id.substring(0, 16)}... • {formatDate(request.createdAt)}
                    </p>
                  </div>
                  
                  {request.status !== 'open' && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${request.statusColor}`}>
                      {request.statusText}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {/* Vehicle Info */}
                  {request.vehicleInfo && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car 
                        size={16} 
                        className={request.status === 'open' ? 'text-brand-orange' : 'text-gray-400'} 
                      />
                      <span className="text-gray-900">{request.vehicleInfo}</span>
                      {request.vehicleCondition && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-gray-600 text-xs">
                            {request.vehicleCondition === 'running' ? 'Çalışır' : 'Arızalı'}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin 
                      size={16} 
                      className={`mt-0.5 flex-shrink-0 ${request.status === 'open' ? 'text-brand-orange' : 'text-gray-400'}`} 
                    />
                    <div className="flex flex-col">
                      <span className="text-gray-900">
                        {request.fromLocation}
                      </span>
                      {request.toLocation && (
                        <>
                          <span className="text-xs text-gray-400 rotate-90 w-4 text-center my-[-4px]">➜</span>
                          <span className="text-gray-900">
                            {request.toLocation}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-gray-100">
                  {request.status === 'open' && (
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      className="w-full py-2.5 rounded-lg bg-red-50 text-red-600 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                      <XCircle size={18} />
                      İptal Et
                    </button>
                  )}
                  
                  {request.status === 'completed' && (
                    <button
                      onClick={() => navigate(`/musteri/degerlendirme/${request.id}`)}
                      className="w-full py-2.5 rounded-lg bg-yellow-50 text-yellow-700 font-medium text-sm flex items-center justify-center gap-2 hover:bg-yellow-100 transition-colors"
                    >
                      <Star size={18} />
                      Değerlendir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-brand-orange transition-colors"
          >
            <Home size={24} />
            <span className="text-[10px] font-medium">Anasayfa</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-brand-orange">
            <List size={24} />
            <span className="text-[10px] font-medium">Taleplerim</span>
          </button>
          
          <div className="relative -top-5">
            <button 
              onClick={() => navigate('/teklif')}
              className="w-14 h-14 bg-brand-orange rounded-full flex items-center justify-center text-white shadow-lg hover:bg-orange-600 transition-colors"
            >
              <Plus size={30} />
            </button>
          </div>
          
          <button 
            onClick={() => navigate('/musteri/mesajlar')}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-brand-orange transition-colors"
          >
            <MessageCircle size={24} />
            <span className="text-[10px] font-medium">Mesajlar</span>
          </button>
          
          <button 
            onClick={() => navigate('/musteri/profil')}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-brand-orange transition-colors"
          >
            <User size={24} />
            <span className="text-[10px] font-medium">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default CustomerRequestsPage;
