import React, { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Clock, User, Calendar, Star, TrendingUp, Coins, X, Filter, Search, PhoneCall, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabaseApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '../../context/CallContext';

interface Call {
  id: string;
  caller_id: string;
  receiver_id: string;
  status: 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed' | 'failed';
  started_at: string;
  connected_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  quality_rating: number | null;
  end_reason: string | null;
  credit_deducted: boolean;
  caller_name?: string;
  caller_phone?: string;
}

interface CallStats {
  total_calls: number;
  connected_calls: number;
  missed_calls: number;
  rejected_calls: number;
  avg_duration_seconds: number;
  avg_quality_rating: number;
  credits_spent: number;
}

const PartnerCallHistory: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'connected' | 'missed' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Call context for answering/rejecting
  const { answerCall, answerCallById, rejectCall, rejectCallById, callStatus, isIncoming, currentCall } = useCall();

  // Get partner ID from localStorage
  const partnerData = JSON.parse(localStorage.getItem('yolmov_partner') || '{}');
  const partnerId = partnerData.id || partnerData.partner_id || '';
  
  // Debug log
  console.log('📞 [PartnerCallHistory] partnerId:', partnerId, 'isIncoming:', isIncoming, 'callStatus:', callStatus);

  useEffect(() => {
    if (partnerId) {
      loadCalls();
      loadStats();
      
      // Realtime subscription for new calls
      const channel = supabase
        .channel('partner_calls_realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'calls',
          },
          (payload) => {
            console.log('📞 [PartnerCallHistory] Realtime update:', payload);
            // Reload calls when any change happens
            loadCalls();
            loadStats();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [partnerId, filter]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('calls')
        .select('*')
        .eq('receiver_id', partnerId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        if (filter === 'connected') {
          query = query.in('status', ['connected', 'ended']);
        } else {
          query = query.eq('status', filter);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading calls:', error);
        return;
      }

      setCalls(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('status, duration_seconds, quality_rating, credit_deducted')
        .eq('receiver_id', partnerId);

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      if (data) {
        const totalCalls = data.length;
        const connectedCalls = data.filter(c => c.status === 'connected' || c.status === 'ended').length;
        const missedCalls = data.filter(c => c.status === 'missed').length;
        const rejectedCalls = data.filter(c => c.status === 'rejected').length;
        
        const durations = data.filter(c => c.duration_seconds && c.duration_seconds > 0).map(c => c.duration_seconds!);
        const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        
        const ratings = data.filter(c => c.quality_rating).map(c => c.quality_rating!);
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        
        const creditsSpent = data.filter(c => c.credit_deducted).length;

        setStats({
          total_calls: totalCalls,
          connected_calls: connectedCalls,
          missed_calls: missedCalls,
          rejected_calls: rejectedCalls,
          avg_duration_seconds: avgDuration,
          avg_quality_rating: avgRating,
          credits_spent: creditsSpent
        });
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Bugün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Dün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getStatusInfo = (status: string, creditDeducted: boolean) => {
    switch (status) {
      case 'connected':
      case 'ended':
        return {
          icon: <PhoneIncoming className="text-green-500" size={18} />,
          label: 'Cevaplandı',
          color: 'bg-green-50 text-green-700 border-green-200',
          badge: creditDeducted ? '1 kredi' : null
        };
      case 'missed':
        return {
          icon: <PhoneMissed className="text-orange-500" size={18} />,
          label: 'Cevapsız',
          color: 'bg-orange-50 text-orange-700 border-orange-200',
          badge: null
        };
      case 'rejected':
        return {
          icon: <PhoneOff className="text-red-500" size={18} />,
          label: 'Reddedildi',
          color: 'bg-red-50 text-red-700 border-red-200',
          badge: null
        };
      case 'ringing':
        return {
          icon: <Phone className="text-blue-500 animate-pulse" size={18} />,
          label: 'Çalıyor',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          badge: null
        };
      default:
        return {
          icon: <Phone className="text-slate-400" size={18} />,
          label: 'Bilinmiyor',
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          badge: null
        };
    }
  };

  const getCallerDisplay = (call: Call) => {
    // Anonim arayan kontrolü
    if (call.caller_id.startsWith('anon_')) {
      return {
        name: 'Anonim Arayan',
        phone: call.caller_id.replace('anon_', '').substring(0, 8) + '...',
        isAnonymous: true
      };
    }
    return {
      name: call.caller_name || 'Müşteri',
      phone: call.caller_phone || '-',
      isAnonymous: false
    };
  };

  const filteredCalls = calls.filter(call => {
    if (!searchQuery) return true;
    const caller = getCallerDisplay(call);
    return caller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           caller.phone.includes(searchQuery);
  });
  
  // Aktif gelen arama var mı?
  const activeRingingCall = calls.find(c => c.status === 'ringing');

  return (
    <div className="space-y-6">
      {/* Aktif Gelen Arama Banner */}
      {(isIncoming && callStatus === 'ringing') || activeRingingCall ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Phone size={32} className="text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold">Gelen Arama!</h3>
                <p className="text-white/80">
                  {currentCall?.callerName || activeRingingCall?.caller_name || 'Anonim Arayan'} sizi arıyor
                </p>
                <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                  <Coins size={14} />
                  Cevaplamak 1 kredi harcar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  if (currentCall) {
                    answerCall();
                  } else if (activeRingingCall) {
                    // WebRTC ile cevapla
                    await answerCallById(activeRingingCall.id);
                    loadCalls();
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-xl font-bold hover:bg-green-50 transition-colors"
              >
                <PhoneCall size={20} />
                Cevapla
              </button>
              <button
                onClick={async () => {
                  if (currentCall) {
                    rejectCall();
                  } else if (activeRingingCall) {
                    await rejectCallById(activeRingingCall.id);
                    loadCalls();
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                <PhoneOff size={20} />
                Reddet
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Phone className="text-blue-600" size={28} />
            Arama Geçmişi
          </h2>
          <p className="text-slate-500 mt-1">Yolmov Voice üzerinden gelen aramalar</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total_calls}</p>
                <p className="text-xs text-slate-500">Toplam Arama</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <PhoneIncoming size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.connected_calls}</p>
                <p className="text-xs text-slate-500">Cevaplanan</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <PhoneMissed size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.missed_calls}</p>
                <p className="text-xs text-slate-500">Cevapsız</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Coins size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.credits_spent}</p>
                <p className="text-xs text-slate-500">Harcanan Kredi</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Additional Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Ortalama Görüşme Süresi</p>
                <p className="text-2xl font-bold mt-1">{formatDuration(Math.round(stats.avg_duration_seconds))}</p>
              </div>
              <Clock size={32} className="text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Ortalama Kalite Puanı</p>
                <p className="text-2xl font-bold mt-1 flex items-center gap-1">
                  {stats.avg_quality_rating > 0 ? stats.avg_quality_rating.toFixed(1) : '-'}
                  <Star size={20} className="text-amber-200" />
                </p>
              </div>
              <TrendingUp size={32} className="text-amber-200" />
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Arayan ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'connected', label: 'Cevaplanan' },
            { id: 'missed', label: 'Cevapsız' },
            { id: 'rejected', label: 'Reddedilen' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                filter === f.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Call List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Aramalar yükleniyor...</p>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz arama yok</h3>
            <p className="text-slate-500">
              {filter === 'all' 
                ? 'Müşteriler sizi aradığında burada görünecek.' 
                : 'Bu filtreye uygun arama bulunamadı.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCalls.map((call) => {
              const statusInfo = getStatusInfo(call.status, call.credit_deducted);
              const caller = getCallerDisplay(call);
              
              return (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Caller Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      caller.isAnonymous ? 'bg-slate-100' : 'bg-blue-100'
                    }`}>
                      <User size={24} className={caller.isAnonymous ? 'text-slate-400' : 'text-blue-600'} />
                    </div>

                    {/* Call Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">{caller.name}</span>
                        {caller.isAnonymous && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">Anonim</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                        <span>•</span>
                        <span>{formatDate(call.started_at)}</span>
                        {call.duration_seconds && call.duration_seconds > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatDuration(call.duration_seconds)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Credit Badge */}
                    {call.credit_deducted && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Coins size={14} className="text-yellow-600" />
                        <span className="text-xs font-semibold text-yellow-700">-1</span>
                      </div>
                    )}

                    {/* Quality Rating */}
                    {call.quality_rating && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold text-amber-700">{call.quality_rating}</span>
                      </div>
                    )}

                    {/* Status Badge or Action Buttons */}
                    {call.status === 'ringing' ? (
                      <div className="flex items-center gap-2">
                        {/* Cevapla butonu */}
                        <button
                          onClick={async () => {
                            // WebRTC ile cevapla
                            await answerCallById(call.id);
                            loadCalls();
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                        >
                          <PhoneCall size={14} />
                          Cevapla
                        </button>
                        {/* Reddet butonu */}
                        <button
                          onClick={async () => {
                            await rejectCallById(call.id);
                            loadCalls();
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                        >
                          <PhoneOff size={14} />
                          Reddet
                        </button>
                      </div>
                    ) : (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="p-2 bg-blue-100 rounded-lg h-fit">
            <Phone size={18} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800">Yolmov Voice Hakkında</h4>
            <p className="text-sm text-blue-700 mt-1">
              Müşteriler profilinizden sizi doğrudan arayabilir. Aramayı cevapladığınızda 1 kredi düşer.
              Cevapsız ve reddedilen aramalarda kredi düşmez.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerCallHistory;
