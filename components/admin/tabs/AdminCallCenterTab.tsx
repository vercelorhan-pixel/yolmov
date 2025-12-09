/**
 * Admin Çağrı Merkezi Tab
 * 
 * Çağrı merkezi operasyon paneli:
 * - Agent durumu yönetimi (online/offline)
 * - Aktif çağrılar ve kuyruk görünümü
 * - Çağrı cevaplama/reddetme
 * - İstatistikler
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneCall, PhoneOff, PhoneIncoming, PhoneMissed,
  Users, Clock, Activity, Headphones, UserCheck,
  Play, Pause, Volume2, VolumeX, RefreshCw, Filter,
  CheckCircle2, XCircle, AlertCircle, Loader2
} from 'lucide-react';
import callCenterService, {
  CallAgent,
  CallQueueAssignment,
  CallQueue
} from '../../../services/callCenterService';
import { useCall } from '../../../context/CallContext';

// =====================================================
// TYPES
// =====================================================

interface CallCenterStats {
  totalAgents: number;
  onlineAgents: number;
  waitingCalls: number;
  activeCalls: number;
  todayCompleted: number;
  avgWaitTime: number;
  avgTalkTime: number;
}

// =====================================================
// HELPER COMPONENTS
// =====================================================

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}> = ({ label, value, icon: Icon, color, subtext }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
        <Icon size={20} className="text-white" />
      </div>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
    <p className="text-sm text-gray-600">{label}</p>
    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
  </div>
);

const AgentStatusBadge: React.FC<{ status: CallAgent['status'] }> = ({ status }) => {
  const config = {
    online: { color: 'bg-green-100 text-green-700', label: 'Çevrimiçi' },
    busy: { color: 'bg-red-100 text-red-700', label: 'Meşgul' },
    away: { color: 'bg-yellow-100 text-yellow-700', label: 'Uzakta' },
    offline: { color: 'bg-gray-100 text-gray-500', label: 'Çevrimdışı' },
  };
  
  const { color, label } = config[status];
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

const QueueStatusBadge: React.FC<{ status: CallQueueAssignment['status'] }> = ({ status }) => {
  const config = {
    waiting: { color: 'bg-yellow-100 text-yellow-700', label: 'Bekliyor' },
    ringing: { color: 'bg-blue-100 text-blue-700', label: 'Çalıyor' },
    answered: { color: 'bg-green-100 text-green-700', label: 'Görüşmede' },
    completed: { color: 'bg-gray-100 text-gray-600', label: 'Tamamlandı' },
    abandoned: { color: 'bg-red-100 text-red-700', label: 'İptal' },
    missed: { color: 'bg-orange-100 text-orange-700', label: 'Cevapsız' },
  };
  
  const { color, label } = config[status];
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTime = (date: string): string => {
  return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const AdminCallCenterTab: React.FC = () => {
  // Current admin
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [currentAgent, setCurrentAgent] = useState<CallAgent | null>(null);
  
  // Data
  const [stats, setStats] = useState<CallCenterStats | null>(null);
  const [agents, setAgents] = useState<CallAgent[]>([]);
  const [activeCalls, setActiveCalls] = useState<CallQueueAssignment[]>([]);
  const [queues, setQueues] = useState<CallQueue[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentStatusLoading, setAgentStatusLoading] = useState(false);
  
  // Call context for answering calls
  const { answerCallById, rejectCallById } = useCall();
  
  // =====================================================
  // DATA LOADING
  // =====================================================
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load admin from localStorage
      const adminStr = localStorage.getItem('yolmov_admin');
      if (adminStr) {
        const admin = JSON.parse(adminStr);
        setCurrentAdmin(admin);
      }
      
      // Load all data in parallel
      const [statsData, agentsData, activeCallsData, queuesData] = await Promise.all([
        callCenterService.getCallCenterStats(),
        callCenterService.getCallAgents(),
        callCenterService.getActiveCalls(),
        callCenterService.getCallQueues(),
      ]);
      
      setStats(statsData);
      setAgents(agentsData);
      setActiveCalls(activeCallsData);
      setQueues(queuesData);
      
      // Find current agent
      if (currentAdmin) {
        const myAgent = agentsData.find(a => a.admin_id === currentAdmin.id);
        setCurrentAgent(myAgent || null);
      }
      
    } catch (err) {
      console.error('Load error:', err);
      setError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [currentAdmin]);
  
  useEffect(() => {
    loadData();
    
    // Subscribe to realtime changes
    const unsubQueue = callCenterService.subscribeToQueueChanges((assignment) => {
      // Refresh active calls on change
      callCenterService.getActiveCalls().then(setActiveCalls);
      callCenterService.getCallCenterStats().then(setStats);
    });
    
    const unsubAgent = callCenterService.subscribeToAgentChanges((agent) => {
      // Refresh agents on change
      callCenterService.getCallAgents().then(setAgents);
    });
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => {
      unsubQueue();
      unsubAgent();
      clearInterval(interval);
    };
  }, [loadData]);
  
  // =====================================================
  // AGENT ACTIONS
  // =====================================================
  
  const handleToggleAgentStatus = async () => {
    if (!currentAdmin) return;
    
    setAgentStatusLoading(true);
    try {
      // Register as agent if not exists
      if (!currentAgent) {
        await callCenterService.registerAsAgent(currentAdmin.id, currentAdmin.name);
      }
      
      // Toggle status
      const newStatus = currentAgent?.status === 'online' ? 'offline' : 'online';
      await callCenterService.updateAgentStatus(currentAdmin.id, newStatus);
      
      // Refresh
      const updatedAgents = await callCenterService.getCallAgents();
      setAgents(updatedAgents);
      setCurrentAgent(updatedAgents.find(a => a.admin_id === currentAdmin.id) || null);
      
    } catch (err) {
      console.error('Toggle status error:', err);
    } finally {
      setAgentStatusLoading(false);
    }
  };
  
  const handleAnswerCall = async (assignment: CallQueueAssignment) => {
    if (!assignment.call_id) return;
    
    try {
      // Update assignment status
      await callCenterService.updateQueueAssignmentStatus(assignment.id, 'answered');
      
      // Answer the call via CallContext
      await answerCallById(assignment.call_id);
      
      // Set agent as busy
      if (currentAdmin) {
        await callCenterService.setAgentCurrentCall(currentAdmin.id, assignment.call_id);
      }
      
      // Refresh
      loadData();
    } catch (err) {
      console.error('Answer call error:', err);
    }
  };
  
  const handleRejectCall = async (assignment: CallQueueAssignment) => {
    if (!assignment.call_id) return;
    
    try {
      // Update assignment status
      await callCenterService.updateQueueAssignmentStatus(assignment.id, 'missed');
      
      // Reject the call
      await rejectCallById(assignment.call_id);
      
      // Refresh
      loadData();
    } catch (err) {
      console.error('Reject call error:', err);
    }
  };
  
  // =====================================================
  // RENDER
  // =====================================================
  
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Headphones className="text-brand-orange" />
            Çağrı Merkezi
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gelen çağrıları yönetin ve müşterilere destek sağlayın
          </p>
        </div>
        
        {/* Agent Status Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Yenile"
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
          
          <button
            onClick={handleToggleAgentStatus}
            disabled={agentStatusLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              currentAgent?.status === 'online'
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {agentStatusLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : currentAgent?.status === 'online' ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Çevrimiçi
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Çevrimdışı
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard
            label="Toplam Agent"
            value={stats.totalAgents}
            icon={Users}
            color="bg-slate-500"
          />
          <StatCard
            label="Çevrimiçi"
            value={stats.onlineAgents}
            icon={UserCheck}
            color="bg-green-500"
          />
          <StatCard
            label="Bekleyen"
            value={stats.waitingCalls}
            icon={PhoneIncoming}
            color="bg-yellow-500"
          />
          <StatCard
            label="Aktif Görüşme"
            value={stats.activeCalls}
            icon={PhoneCall}
            color="bg-blue-500"
          />
          <StatCard
            label="Bugün Tamamlanan"
            value={stats.todayCompleted}
            icon={CheckCircle2}
            color="bg-emerald-500"
          />
          <StatCard
            label="Ort. Bekleme"
            value={formatDuration(stats.avgWaitTime)}
            icon={Clock}
            color="bg-orange-500"
          />
          <StatCard
            label="Ort. Görüşme"
            value={formatDuration(stats.avgTalkTime)}
            icon={Activity}
            color="bg-purple-500"
          />
        </div>
      )}
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Calls / Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <PhoneIncoming size={18} className="text-brand-orange" />
                Aktif Çağrılar
                {activeCalls.length > 0 && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
                    {activeCalls.length}
                  </span>
                )}
              </h3>
            </div>
            
            <div className="divide-y divide-gray-50">
              {activeCalls.length === 0 ? (
                <div className="py-12 text-center">
                  <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Şu an aktif çağrı yok</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Yeni çağrılar burada görünecek
                  </p>
                </div>
              ) : (
                activeCalls.map((call) => (
                  <motion.div
                    key={call.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {call.caller_name || 'Anonim Arayan'}
                          </span>
                          <QueueStatusBadge status={call.status} />
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {call.caller_phone && (
                            <span>{call.caller_phone}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(call.queued_at)}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                            {call.queue_name}
                          </span>
                        </div>
                        
                        {call.target_partner_id && (
                          <p className="text-xs text-blue-600 mt-1">
                            → Partner: {call.partner_name || call.target_partner_id}
                          </p>
                        )}
                        
                        {call.caller_message && (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            "{call.caller_message}"
                          </p>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      {call.status === 'waiting' || call.status === 'ringing' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAnswerCall(call)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            title="Cevapla"
                          >
                            <Phone size={18} />
                          </button>
                          <button
                            onClick={() => handleRejectCall(call)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            title="Reddet"
                          >
                            <PhoneOff size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <PhoneCall size={18} className="animate-pulse" />
                          <span className="text-sm font-medium">Görüşmede</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Agents List */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-brand-orange" />
                Ajanlar
              </h3>
            </div>
            
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {agents.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Henüz agent yok</p>
                </div>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-3 flex items-center justify-between ${
                      agent.admin_id === currentAdmin?.id ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {agent.display_name || agent.admin_name}
                        {agent.admin_id === currentAdmin?.id && (
                          <span className="ml-1 text-xs text-orange-500">(Sen)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Bugün: {agent.calls_handled_today} çağrı
                      </p>
                    </div>
                    <AgentStatusBadge status={agent.status} />
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Queues */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={18} className="text-brand-orange" />
                Çağrı Havuzları
              </h3>
            </div>
            
            <div className="divide-y divide-gray-50">
              {queues.map((queue) => (
                <div key={queue.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{queue.name}</p>
                      <p className="text-xs text-gray-500">{queue.description}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${
                      queue.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCallCenterTab;
