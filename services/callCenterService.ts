/**
 * YOLMOV Çağrı Merkezi Servisi
 * 
 * Çağrı havuzları, agent yönetimi ve çağrı dağıtımı için servis.
 * 
 * Özellikler:
 * - Çağrı havuzları (General Support, Partner Calls, Emergency)
 * - Agent durumu yönetimi (online/offline/busy)
 * - Otomatik çağrı dağıtımı (round-robin)
 * - Realtime çağrı kuyruğu
 */

import { supabase } from './supabase';
import { generateUUID } from '../utils/uuid';

// =====================================================
// TYPES
// =====================================================

export interface CallQueue {
  id: string;
  name: string;
  slug: string;
  description?: string;
  queue_type: 'general' | 'partner' | 'emergency' | 'vip';
  priority: number;
  working_hours?: Record<string, { start: string; end: string }>;
  max_wait_time_seconds: number;
  auto_distribute: boolean;
  distribution_strategy: 'round-robin' | 'least-busy' | 'random';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CallAgent {
  id: string;
  admin_id: string;
  display_name?: string;
  extension?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  status_changed_at: string;
  current_call_id?: string;
  calls_handled_today: number;
  avg_call_duration_today: number;
  assigned_queues: string[];
  priority: number;
  max_concurrent_calls: number;
  auto_accept_calls: boolean;
  ring_timeout_seconds: number;
  last_call_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  admin_name?: string;
  admin_email?: string;
  admin_role?: string;
}

export interface CallQueueAssignment {
  id: string;
  call_id?: string;
  queue_id: string;
  assigned_agent_id?: string;
  source_type: 'web-contact' | 'partner-direct' | 'emergency-button' | 'header-call';
  source_page?: string;
  caller_name?: string;
  caller_phone?: string;
  caller_email?: string;
  caller_message?: string;
  target_partner_id?: string;
  status: 'waiting' | 'ringing' | 'answered' | 'completed' | 'abandoned' | 'missed';
  queued_at: string;
  assigned_at?: string;
  answered_at?: string;
  completed_at?: string;
  wait_duration?: number;
  ring_duration?: number;
  talk_duration?: number;
  agent_notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined fields
  queue_name?: string;
  queue_slug?: string;
  agent_name?: string;
  partner_name?: string;
}

export type QueueSourceType = 'web-contact' | 'partner-direct' | 'emergency-button' | 'header-call';

// =====================================================
// QUEUE MANAGEMENT
// =====================================================

/**
 * Tüm çağrı havuzlarını getir
 */
export async function getCallQueues(): Promise<CallQueue[]> {
  try {
    const { data, error } = await supabase
      .from('call_queues')
      .select('*')
      .order('priority', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('❌ [CallCenter] getCallQueues error:', err);
    return [];
  }
}

/**
 * Havuz slug'ına göre getir
 */
export async function getQueueBySlug(slug: string): Promise<CallQueue | null> {
  try {
    const { data, error } = await supabase
      .from('call_queues')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (error) return null;
    return data;
  } catch (err) {
    console.error('❌ [CallCenter] getQueueBySlug error:', err);
    return null;
  }
}

// =====================================================
// AGENT MANAGEMENT
// =====================================================

/**
 * Tüm çağrı ajanlarını getir (admin bilgileriyle)
 */
export async function getCallAgents(): Promise<CallAgent[]> {
  try {
    const { data, error } = await supabase
      .from('call_agents')
      .select(`
        *,
        admin_users!inner (
          name,
          email,
          role,
          status
        )
      `)
      .order('priority', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(agent => ({
      ...agent,
      admin_name: agent.admin_users?.name,
      admin_email: agent.admin_users?.email,
      admin_role: agent.admin_users?.role,
    }));
  } catch (err) {
    console.error('❌ [CallCenter] getCallAgents error:', err);
    return [];
  }
}

/**
 * Aktif (online) ajanları getir - belirli bir havuz için
 */
export async function getAvailableAgents(queueSlug: string): Promise<CallAgent[]> {
  try {
    const agents = await getCallAgents();
    
    return agents.filter(agent => 
      agent.status === 'online' &&
      !agent.current_call_id &&
      agent.assigned_queues?.includes(queueSlug)
    );
  } catch (err) {
    console.error('❌ [CallCenter] getAvailableAgents error:', err);
    return [];
  }
}

/**
 * Admin kullanıcıyı agent olarak kaydet/güncelle
 */
export async function registerAsAgent(adminId: string, displayName?: string): Promise<CallAgent | null> {
  try {
    // Önce mevcut kaydı kontrol et
    const { data: existing } = await supabase
      .from('call_agents')
      .select('*')
      .eq('admin_id', adminId)
      .single();
    
    if (existing) {
      // Güncelle
      const { data, error } = await supabase
        .from('call_agents')
        .update({ 
          display_name: displayName || existing.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('admin_id', adminId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
    
    // Yeni kayıt
    const { data, error } = await supabase
      .from('call_agents')
      .insert({
        admin_id: adminId,
        display_name: displayName,
        status: 'offline',
        assigned_queues: ['general-support'],
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('❌ [CallCenter] registerAsAgent error:', err);
    return null;
  }
}

/**
 * Agent durumunu güncelle
 */
export async function updateAgentStatus(
  adminId: string, 
  status: 'online' | 'busy' | 'away' | 'offline'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('call_agents')
      .update({ 
        status,
        status_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('admin_id', adminId);
    
    if (error) throw error;
    console.log(`✅ [CallCenter] Agent status updated: ${status}`);
    return true;
  } catch (err) {
    console.error('❌ [CallCenter] updateAgentStatus error:', err);
    return false;
  }
}

/**
 * Agent'ın aktif çağrısını ayarla
 */
export async function setAgentCurrentCall(adminId: string, callId: string | null): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('call_agents')
      .update({ 
        current_call_id: callId,
        status: callId ? 'busy' : 'online',
        status_changed_at: new Date().toISOString(),
        last_call_at: callId ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('admin_id', adminId);
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('❌ [CallCenter] setAgentCurrentCall error:', err);
    return false;
  }
}

// =====================================================
// CALL QUEUE OPERATIONS
// =====================================================

/**
 * Çağrıyı kuyruğa ekle
 */
export async function addToQueue(params: {
  queueSlug: string;
  sourceType: QueueSourceType;
  sourcePage?: string;
  callerName?: string;
  callerPhone?: string;
  callerEmail?: string;
  callerMessage?: string;
  targetPartnerId?: string;
}): Promise<CallQueueAssignment | null> {
  try {
    console.log('🔍 [CallCenter] addToQueue called with:', {
      queueSlug: params.queueSlug,
      sourceType: params.sourceType,
      sourcePage: params.sourcePage
    });
    
    // Havuzu bul
    const queue = await getQueueBySlug(params.queueSlug);
    if (!queue) {
      console.error('❌ [CallCenter] Queue not found:', params.queueSlug);
      
      // Fallback: Tüm kuyruklari listele
      const allQueues = await getCallQueues();
      console.log('📋 [CallCenter] Available queues:', allQueues.map(q => q.slug));
      
      // Eğer hiç queue yoksa, migration çalışmamış demektir
      if (allQueues.length === 0) {
        throw new Error('MIGRATION_NOT_RUN: Call center tables are not initialized. Please run migration 027.');
      }
      
      // İlk aktif kuyruğu kullan (fallback)
      const fallbackQueue = allQueues.find(q => q.is_active);
      if (!fallbackQueue) {
        throw new Error('NO_ACTIVE_QUEUE: No active queue found.');
      }
      
      console.warn('⚠️ [CallCenter] Using fallback queue:', fallbackQueue.slug);
      // Fallback queue ile devam et
      const queueToUse = fallbackQueue;
      
      console.log('📝 [CallCenter] Adding to queue with data:', {
        queue_id: queueToUse.id,
        source_type: params.sourceType,
        source_page: params.sourcePage,
        caller_name: params.callerName,
        caller_phone: params.callerPhone
      });
      
      // Kuyruğa ekle
      const { data, error } = await supabase
        .from('call_queue_assignments')
        .insert({
          queue_id: queueToUse.id,
          source_type: params.sourceType,
          source_page: params.sourcePage || null,
          caller_name: params.callerName || null,
          caller_phone: params.callerPhone || null,
          caller_email: params.callerEmail || null,
          caller_message: params.callerMessage || null,
          target_partner_id: params.targetPartnerId || null,
          status: 'waiting',
          queued_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ [CallCenter] Supabase insert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log(`✅ [CallCenter] Call added to queue: ${queueToUse.name}`);
      return data;
    }
    
    console.log('📝 [CallCenter] Adding to queue with data:', {
      queue_id: queue.id,
      source_type: params.sourceType,
      source_page: params.sourcePage,
      caller_name: params.callerName,
      caller_phone: params.callerPhone
    });
    
    // Kuyruğa ekle
    const { data, error } = await supabase
      .from('call_queue_assignments')
      .insert({
        queue_id: queue.id,
        source_type: params.sourceType,
        source_page: params.sourcePage || null,
        caller_name: params.callerName || null,
        caller_phone: params.callerPhone || null,
        caller_email: params.callerEmail || null,
        caller_message: params.callerMessage || null,
        target_partner_id: params.targetPartnerId || null,
        status: 'waiting',
        queued_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ [CallCenter] Supabase insert error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log(`✅ [CallCenter] Call added to queue: ${queue.name}`);
    
    // Otomatik dağıtım aktifse, uygun agent'a ata
    if (queue.auto_distribute) {
      const assigned = await distributeCallToAgent(data.id, params.queueSlug);
      if (assigned) {
        return { ...data, assigned_agent_id: assigned.id };
      }
    }
    
    return data;
  } catch (err) {
    console.error('❌ [CallCenter] addToQueue error:', err);
    return null;
  }
}

/**
 * Çağrıyı uygun agent'a dağıt (round-robin)
 */
async function distributeCallToAgent(assignmentId: string, queueSlug: string): Promise<CallAgent | null> {
  try {
    const availableAgents = await getAvailableAgents(queueSlug);
    
    if (availableAgents.length === 0) {
      console.log('⚠️ [CallCenter] No available agents for queue:', queueSlug);
      return null;
    }
    
    // Round-robin: En uzun süredir çağrı almamış agent'ı seç
    const sortedAgents = availableAgents.sort((a, b) => {
      const aTime = a.last_call_at ? new Date(a.last_call_at).getTime() : 0;
      const bTime = b.last_call_at ? new Date(b.last_call_at).getTime() : 0;
      return aTime - bTime;
    });
    
    const selectedAgent = sortedAgents[0];
    
    // Assignment'ı güncelle
    const { error } = await supabase
      .from('call_queue_assignments')
      .update({
        assigned_agent_id: selectedAgent.id,
        assigned_at: new Date().toISOString(),
        status: 'ringing',
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId);
    
    if (error) throw error;
    
    console.log(`✅ [CallCenter] Call assigned to agent: ${selectedAgent.admin_name}`);
    return selectedAgent;
  } catch (err) {
    console.error('❌ [CallCenter] distributeCallToAgent error:', err);
    return null;
  }
}

/**
 * Çağrı durumunu güncelle
 */
export async function updateQueueAssignmentStatus(
  assignmentId: string,
  status: CallQueueAssignment['status'],
  extras?: {
    agentNotes?: string;
    callId?: string;
  }
): Promise<boolean> {
  try {
    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString()
    };
    
    // Durum bazlı zaman damgaları
    switch (status) {
      case 'answered':
        updates.answered_at = new Date().toISOString();
        break;
      case 'completed':
      case 'abandoned':
      case 'missed':
        updates.completed_at = new Date().toISOString();
        break;
    }
    
    if (extras?.agentNotes) {
      updates.agent_notes = extras.agentNotes;
    }
    
    if (extras?.callId) {
      updates.call_id = extras.callId;
    }
    
    const { error } = await supabase
      .from('call_queue_assignments')
      .update(updates)
      .eq('id', assignmentId);
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('❌ [CallCenter] updateQueueAssignmentStatus error:', err);
    return false;
  }
}

/**
 * Kuyrukta bekleyen çağrıları getir
 */
export async function getWaitingCalls(queueSlug?: string): Promise<CallQueueAssignment[]> {
  try {
    let query = supabase
      .from('call_queue_assignments')
      .select(`
        *,
        call_queues!inner (name, slug, priority),
        call_agents (display_name, admin_id),
        partners (company_name)
      `)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });
    
    if (queueSlug) {
      query = query.eq('call_queues.slug', queueSlug);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      queue_name: item.call_queues?.name,
      queue_slug: item.call_queues?.slug,
      agent_name: item.call_agents?.display_name,
      partner_name: item.partners?.company_name,
    }));
  } catch (err) {
    console.error('❌ [CallCenter] getWaitingCalls error:', err);
    return [];
  }
}

/**
 * Tüm aktif çağrıları getir (waiting + ringing + answered)
 */
export async function getActiveCalls(): Promise<CallQueueAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('call_queue_assignments')
      .select(`
        *,
        call_queues (name, slug, priority),
        call_agents (display_name, admin_id),
        partners (company_name)
      `)
      .in('status', ['waiting', 'ringing', 'answered'])
      .order('queued_at', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      queue_name: item.call_queues?.name,
      queue_slug: item.call_queues?.slug,
      agent_name: item.call_agents?.display_name,
      partner_name: item.partners?.company_name,
    }));
  } catch (err) {
    console.error('❌ [CallCenter] getActiveCalls error:', err);
    return [];
  }
}

/**
 * Çağrı geçmişini getir (filtreleme ve sayfalama ile)
 */
export async function getCallHistory(params?: {
  queueSlug?: string;
  agentId?: string;
  status?: CallQueueAssignment['status'];
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: CallQueueAssignment[]; total: number }> {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('call_queue_assignments')
      .select(`
        *,
        call_queues (name, slug),
        call_agents (display_name, admin_id),
        partners (company_name),
        calls (
          id,
          duration_seconds,
          call_recordings (id, storage_path, duration_seconds)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (params?.queueSlug) {
      query = query.eq('call_queues.slug', params.queueSlug);
    }
    
    if (params?.agentId) {
      query = query.eq('assigned_agent_id', params.agentId);
    }
    
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    
    if (params?.startDate) {
      query = query.gte('created_at', params.startDate);
    }
    
    if (params?.endDate) {
      query = query.lte('created_at', params.endDate);
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    const mapped = (data || []).map(item => ({
      ...item,
      queue_name: item.call_queues?.name,
      queue_slug: item.call_queues?.slug,
      agent_name: item.call_agents?.display_name,
      partner_name: item.partners?.company_name,
    }));
    
    return { data: mapped, total: count || 0 };
  } catch (err) {
    console.error('❌ [CallCenter] getCallHistory error:', err);
    return { data: [], total: 0 };
  }
}

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

/**
 * Çağrı kuyruğu değişikliklerini dinle
 */
export function subscribeToQueueChanges(
  callback: (assignment: CallQueueAssignment) => void
): () => void {
  const channel = supabase
    .channel('call_queue_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'call_queue_assignments'
      },
      (payload) => {
        console.log('📞 [CallCenter] Queue change:', payload.eventType);
        callback(payload.new as CallQueueAssignment);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Agent durumu değişikliklerini dinle
 */
export function subscribeToAgentChanges(
  callback: (agent: CallAgent) => void
): () => void {
  const channel = supabase
    .channel('call_agent_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'call_agents'
      },
      (payload) => {
        console.log('📞 [CallCenter] Agent change:', payload.eventType);
        callback(payload.new as CallAgent);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// =====================================================
// STATISTICS
// =====================================================

/**
 * Çağrı merkezi istatistiklerini getir
 */
export async function getCallCenterStats(): Promise<{
  totalAgents: number;
  onlineAgents: number;
  waitingCalls: number;
  activeCalls: number;
  todayCompleted: number;
  avgWaitTime: number;
  avgTalkTime: number;
}> {
  try {
    // Agent sayıları
    const { data: agents } = await supabase
      .from('call_agents')
      .select('status');
    
    const totalAgents = agents?.length || 0;
    const onlineAgents = agents?.filter(a => a.status === 'online' || a.status === 'busy').length || 0;
    
    // Bekleyen çağrılar
    const { count: waitingCount } = await supabase
      .from('call_queue_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');
    
    // Aktif çağrılar
    const { count: activeCount } = await supabase
      .from('call_queue_assignments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ringing', 'answered']);
    
    // Bugün tamamlanan
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount } = await supabase
      .from('call_queue_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', today.toISOString());
    
    // Ortalama süreler (son 100 çağrıdan)
    const { data: recentCalls } = await supabase
      .from('call_queue_assignments')
      .select('wait_duration, talk_duration')
      .eq('status', 'completed')
      .not('wait_duration', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(100);
    
    let avgWaitTime = 0;
    let avgTalkTime = 0;
    
    if (recentCalls && recentCalls.length > 0) {
      const totalWait = recentCalls.reduce((sum, c) => sum + (c.wait_duration || 0), 0);
      const totalTalk = recentCalls.reduce((sum, c) => sum + (c.talk_duration || 0), 0);
      avgWaitTime = Math.round(totalWait / recentCalls.length);
      avgTalkTime = Math.round(totalTalk / recentCalls.length);
    }
    
    return {
      totalAgents,
      onlineAgents,
      waitingCalls: waitingCount || 0,
      activeCalls: activeCount || 0,
      todayCompleted: todayCount || 0,
      avgWaitTime,
      avgTalkTime,
    };
  } catch (err) {
    console.error('❌ [CallCenter] getCallCenterStats error:', err);
    return {
      totalAgents: 0,
      onlineAgents: 0,
      waitingCalls: 0,
      activeCalls: 0,
      todayCompleted: 0,
      avgWaitTime: 0,
      avgTalkTime: 0,
    };
  }
}

export default {
  // Queues
  getCallQueues,
  getQueueBySlug,
  // Agents
  getCallAgents,
  getAvailableAgents,
  registerAsAgent,
  updateAgentStatus,
  setAgentCurrentCall,
  // Queue Operations
  addToQueue,
  updateQueueAssignmentStatus,
  getWaitingCalls,
  getActiveCalls,
  getCallHistory,
  // Subscriptions
  subscribeToQueueChanges,
  subscribeToAgentChanges,
  // Stats
  getCallCenterStats,
};
