/**
 * ============================================
 * PARTNER → DESTEK ARAMA SERVİSİ
 * ============================================
 * 
 * Partnerlerin destek hattını aramasını yönetir.
 * - Öncelikli kuyruk sistemi (partner aramalarına öncelik)
 * - Admin/agent atama
 * - Partner özel notlar
 * 
 * TAM İZOLE EDİLMİŞ - Diğer çağrı tiplerine bağımlılığı YOK
 */

import { supabase } from '../supabase';

// ============================================
// TİPLER
// ============================================

export interface PartnerSupportCall {
  id: string;
  partner_id: string;
  admin_id?: string;
  queue_id?: string;
  queue_position?: number;
  wait_time_seconds?: number;
  sdp_offer: any;
  sdp_answer: any;
  ice_candidates: any[];
  status: 'waiting' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed' | 'failed' | 'timeout';
  started_at: string;
  assigned_at?: string;
  connected_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  end_reason?: string;
  quality_rating?: number;
  priority_level: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StartPartnerSupportCallParams {
  partner_id: string;
  sdp_offer: any;
  queue_id?: string;
  priority_level?: number;
}

export interface AssignCallParams {
  call_id: string;
  admin_id: string;
}

export interface AnswerCallParams {
  call_id: string;
  sdp_answer: any;
}

// ============================================
// PARTNER DESTEK ARAMA BAŞLATMA
// ============================================

/**
 * Partner destek hattını arar - Öncelikli kuyruğa girer
 */
export async function startPartnerToSupportCall(
  params: StartPartnerSupportCallParams
): Promise<{ success: boolean; call?: PartnerSupportCall; error?: string }> {
  try {
    console.log('[PartnerToSupport] Partner destek arıyor:', {
      partner_id: params.partner_id,
      priority: params.priority_level || 0
    });

    // Varsayılan kuyruk: partner aramaları
    let queueId = params.queue_id;
    if (!queueId) {
      const { data: defaultQueue } = await supabase
        .from('call_queues')
        .select('id')
        .eq('slug', 'partner-calls')
        .single();
      
      queueId = defaultQueue?.id;
    }

    const { data, error } = await supabase
      .from('partner_support_calls')
      .insert({
        partner_id: params.partner_id,
        sdp_offer: params.sdp_offer,
        queue_id: queueId,
        priority_level: params.priority_level || 0,
        status: 'waiting',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[PartnerToSupport] Arama başlatma hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[PartnerToSupport] ✅ Öncelikli kuyruğa eklendi:', {
      call_id: data.id,
      position: data.queue_position,
      priority: data.priority_level
    });

    return { success: true, call: data };

  } catch (error: any) {
    console.error('[PartnerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ADMIN ATAMA
// ============================================

/**
 * Müsait bir agent'ı partner çağrısına atar
 */
export async function assignPartnerSupportCall(
  params: AssignCallParams
): Promise<{ success: boolean; call?: PartnerSupportCall; error?: string }> {
  try {
    console.log('[PartnerToSupport] Agent atanıyor:', {
      call_id: params.call_id,
      admin_id: params.admin_id
    });

    const { data: call, error: fetchError } = await supabase
      .from('partner_support_calls')
      .select('started_at')
      .eq('id', params.call_id)
      .single();

    if (fetchError || !call) {
      return { success: false, error: 'Çağrı bulunamadı' };
    }

    const waitTime = Math.floor(
      (Date.now() - new Date(call.started_at).getTime()) / 1000
    );

    const { data, error } = await supabase
      .from('partner_support_calls')
      .update({
        admin_id: params.admin_id,
        assigned_at: new Date().toISOString(),
        wait_time_seconds: waitTime,
        status: 'ringing'
      })
      .eq('id', params.call_id)
      .select()
      .single();

    if (error) {
      console.error('[PartnerToSupport] Atama hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[PartnerToSupport] ✅ Agent atandı (partner çağrısı)');
    return { success: true, call: data };

  } catch (error: any) {
    console.error('[PartnerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// OTOMATİK AGENT ATAMA (ÖNCELİKLİ)
// ============================================

/**
 * Partner için öncelikli agent ataması
 */
export async function autoAssignPartnerSupportCall(
  call_id: string
): Promise<{ success: boolean; call?: PartnerSupportCall; error?: string }> {
  try {
    console.log('[PartnerToSupport] Öncelikli otomatik atama:', call_id);

    // Müsait agent bul (partner çağrıları için)
    const { data: availableAgent, error: agentError } = await supabase
      .from('call_agents')
      .select('agent_id')
      .eq('is_available', true)
      .order('last_call_at', { ascending: true, nullsFirst: true })
      .limit(1)
      .single();

    if (agentError || !availableAgent) {
      console.warn('[PartnerToSupport] Müsait agent yok');
      return { success: false, error: 'Şu anda müsait agent bulunmuyor' };
    }

    return await assignPartnerSupportCall({
      call_id,
      admin_id: availableAgent.agent_id
    });

  } catch (error: any) {
    console.error('[PartnerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ARAMA CEVAPLAMA (AGENT)
// ============================================

/**
 * Agent partner aramasını cevaplar
 */
export async function answerPartnerToSupportCall(
  params: AnswerCallParams
): Promise<{ success: boolean; call?: PartnerSupportCall; error?: string }> {
  try {
    console.log('[PartnerToSupport] Agent partner aramasını cevaplıyor:', params.call_id);

    const { data, error } = await supabase
      .from('partner_support_calls')
      .update({
        sdp_answer: params.sdp_answer,
        status: 'connected',
        connected_at: new Date().toISOString()
      })
      .eq('id', params.call_id)
      .select()
      .single();

    if (error) {
      console.error('[PartnerToSupport] Cevaplama hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[PartnerToSupport] ✅ Partner araması bağlandı');
    return { success: true, call: data };

  } catch (error: any) {
    console.error('[PartnerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ARAMA SONLANDIRMA
// ============================================

/**
 * Partner destek aramasını sonlandır
 */
export async function endPartnerToSupportCall(
  call_id: string,
  end_reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PartnerToSupport] Partner araması sonlandırılıyor:', call_id);

    const { data: call, error: fetchError } = await supabase
      .from('partner_support_calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (fetchError || !call) {
      return { success: false, error: 'Çağrı bulunamadı' };
    }

    const duration = call.connected_at
      ? Math.floor((Date.now() - new Date(call.connected_at).getTime()) / 1000)
      : 0;

    const { error } = await supabase
      .from('partner_support_calls')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        end_reason,
        duration_seconds: duration
      })
      .eq('id', call_id);

    if (error) {
      console.error('[PartnerToSupport] Sonlandırma hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[PartnerToSupport] ✅ Partner araması sonlandırıldı:', duration, 'saniye');
    return { success: true };

  } catch (error: any) {
    console.error('[PartnerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// KUYRUK YÖNETİMİ
// ============================================

/**
 * Bekleyen partner çağrılarını getir (öncelik sırasına göre)
 */
export async function getWaitingPartnerCalls(
  queue_id?: string
): Promise<{ success: boolean; calls?: PartnerSupportCall[]; error?: string }> {
  try {
    let query = supabase
      .from('partner_support_calls')
      .select('*')
      .eq('status', 'waiting')
      .order('priority_level', { ascending: false }) // Yüksek öncelik önce
      .order('queue_position', { ascending: true });

    if (queue_id) {
      query = query.eq('queue_id', queue_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PartnerToSupport] Kuyruk getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, calls: data };

  } catch (error: any) {
    console.error('[PartnerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Agent'a atanmış aktif partner çağrılarını getir
 */
export async function getAgentActivePartnerCalls(
  admin_id: string
): Promise<{ success: boolean; calls?: PartnerSupportCall[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('partner_support_calls')
      .select('*')
      .eq('admin_id', admin_id)
      .in('status', ['ringing', 'connected'])
      .order('started_at', { ascending: false });

    if (error) {
      console.error('[PartnerToSupport] Agent partner çağrıları getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, calls: data };

  } catch (error: any) {
    console.error('[PartnerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ARAMA GEÇMİŞİ
// ============================================

/**
 * Partner'ın destek arama geçmişi
 */
export async function getPartnerSupportHistory(
  partner_id: string,
  limit = 50
): Promise<{ success: boolean; calls?: PartnerSupportCall[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('partner_support_calls')
      .select('*')
      .eq('partner_id', partner_id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[PartnerToSupport] Geçmiş getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, calls: data };

  } catch (error: any) {
    console.error('[PartnerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Belirli bir partner destek aramasını getir
 */
export async function getPartnerToSupportCall(
  call_id: string
): Promise<{ success: boolean; call?: PartnerSupportCall; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('partner_support_calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (error) {
      console.error('[PartnerToSupport] Arama getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, call: data };

  } catch (error: any) {
    console.error('[PartnerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ÖNCELİK YÖNETİMİ
// ============================================

/**
 * Çağrı önceliğini güncelle (acil durumlarda)
 */
export async function updateCallPriority(
  call_id: string,
  priority_level: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('partner_support_calls')
      .update({ priority_level })
      .eq('id', call_id);

    if (error) {
      return { success: false, error: error.message };
    }

    console.log('[PartnerToSupport] Öncelik güncellendi:', priority_level);
    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// NOTLAR VE KALİTE
// ============================================

/**
 * Partner araması için agent notu
 */
export async function addPartnerCallNotes(
  call_id: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('partner_support_calls')
      .update({ notes })
      .eq('id', call_id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Partner kalite puanı
 */
export async function ratePartnerCall(
  call_id: string,
  rating: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating 1-5 arasında olmalı' };
    }

    const { error } = await supabase
      .from('partner_support_calls')
      .update({ quality_rating: rating })
      .eq('id', call_id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// ICE CANDIDATE YÖNETİMİ
// ============================================

/**
 * ICE candidate ekle
 */
export async function addIceCandidate(
  call_id: string,
  candidate: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: call, error: fetchError } = await supabase
      .from('partner_support_calls')
      .select('ice_candidates')
      .eq('id', call_id)
      .single();

    if (fetchError || !call) {
      return { success: false, error: 'Çağrı bulunamadı' };
    }

    const candidates = [...(call.ice_candidates || []), candidate];

    const { error } = await supabase
      .from('partner_support_calls')
      .update({ ice_candidates: candidates })
      .eq('id', call_id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
