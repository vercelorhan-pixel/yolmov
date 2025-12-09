/**
 * Admin Çağrı Merkezi - Canlı Görüşmeler
 * 
 * Aktif aramalar (ringing, connected) gerçek zamanlı izlenir.
 */

import React, { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, User, Building, Volume2, XCircle } from 'lucide-react';
import { supabase } from '../../../services/supabase';

interface ActiveCall {
  id: string;
  caller_id: string;
  receiver_id: string;
  caller_type: 'customer' | 'partner' | 'admin';
  receiver_type: 'customer' | 'partner' | 'admin';
  status: 'ringing' | 'connected';
  started_at: string;
  connected_at?: string;
  caller_name?: string;
  receiver_name?: string;
}

const AdminActiveCallsTab: React.FC = () => {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [callDurations, setCallDurations] = useState<Record<string, number>>({});

  // Aktif aramaları yükle
  const loadActiveCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .in('status', ['ringing', 'connected'])
        .order('started_at', { ascending: false });

      if (error) throw error;

      // Caller ve receiver isimlerini çek
      const callsWithNames = await Promise.all(
        (data || []).map(async (call) => {
          let callerName = 'Bilinmeyen';
          let receiverName = 'Bilinmeyen';

          // Caller ismi
          if (call.caller_id.startsWith('anon_')) {
            callerName = 'Anonim Müşteri';
          } else if (call.caller_type === 'customer') {
            const { data: customer } = await supabase
              .from('customers')
              .select('first_name, last_name')
              .eq('id', call.caller_id)
              .single();
            callerName = customer ? `${customer.first_name} ${customer.last_name}` : 'Müşteri';
          } else if (call.caller_type === 'partner') {
            const { data: partner } = await supabase
              .from('partners')
              .select('company_name')
              .eq('id', call.caller_id)
              .single();
            callerName = partner?.company_name || 'Partner';
          }

          // Receiver ismi
          if (call.receiver_type === 'partner') {
            const { data: partner } = await supabase
              .from('partners')
              .select('company_name')
              .eq('id', call.receiver_id)
              .single();
            receiverName = partner?.company_name || 'Partner';
          } else if (call.receiver_type === 'customer') {
            const { data: customer } = await supabase
              .from('customers')
              .select('first_name, last_name')
              .eq('id', call.receiver_id)
              .single();
            receiverName = customer ? `${customer.first_name} ${customer.last_name}` : 'Müşteri';
          }

          return {
            ...call,
            caller_name: callerName,
            receiver_name: receiverName,
          };
        })
      );

      setActiveCalls(callsWithNames);
    } catch (err) {
      console.error('❌ [AdminActiveCalls] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription
  useEffect(() => {
    loadActiveCalls();

    const channel = supabase
      .channel('admin_active_calls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => {
        loadActiveCalls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Süre hesaplama
  useEffect(() => {
    const interval = setInterval(() => {
      const newDurations: Record<string, number> = {};
      activeCalls.forEach((call) => {
        const startTime = new Date(call.connected_at || call.started_at).getTime();
        const now = Date.now();
        newDurations[call.id] = Math.floor((now - startTime) / 1000);
      });
      setCallDurations(newDurations);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCalls]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const endCall = async (callId: string) => {
    try {
      await supabase
        .from('calls')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', callId);
    } catch (err) {
      console.error('❌ End call error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (activeCalls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Phone size={64} className="mb-4 opacity-30" />
        <p className="text-lg font-medium">Şu anda aktif arama yok</p>
        <p className="text-sm">Aramalar başladığında burada görünecek</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Canlı Görüşmeler</h2>
          <p className="text-slate-600 mt-1">{activeCalls.length} aktif arama</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-700 font-medium text-sm">CANLI</span>
        </div>
      </div>

      {/* Calls List */}
      <div className="grid gap-4">
        {activeCalls.map((call) => (
          <div
            key={call.id}
            className={`p-6 rounded-xl border-2 transition-all ${
              call.status === 'connected'
                ? 'bg-green-50 border-green-300'
                : 'bg-orange-50 border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left - Call Info */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    call.status === 'connected' ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                >
                  <Phone className="text-white" size={24} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <PhoneOutgoing size={16} className="text-slate-600" />
                    <span className="font-bold text-slate-800">{call.caller_name}</span>
                    <span className="text-slate-400">→</span>
                    <PhoneIncoming size={16} className="text-slate-600" />
                    <span className="font-bold text-slate-800">{call.receiver_name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    {call.status === 'connected' ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span className="font-mono">{formatDuration(callDurations[call.id] || 0)}</span>
                        </div>
                        <span className="text-green-600 font-medium">● Görüşme Devam Ediyor</span>
                      </>
                    ) : (
                      <span className="text-orange-600 font-medium">🔔 Çalıyor...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition-colors"
                  title="Dinle (Yakında)"
                >
                  <Volume2 size={18} />
                  <span className="text-sm font-medium">Dinle</span>
                </button>
                <button
                  onClick={() => endCall(call.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 transition-colors"
                >
                  <XCircle size={18} />
                  <span className="text-sm font-medium">Sonlandır</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminActiveCallsTab;
