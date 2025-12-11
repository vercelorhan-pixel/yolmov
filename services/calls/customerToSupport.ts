/**
 * ============================================
 * MÜŞTERİ → DESTEK ARAMA SERVİSİ
 * ============================================
 * 
 * Müşterilerin destek hattını aramasını yönetir.
 * - Kuyruk sistemi kullanır
 * - Admin/agent atama
 * - Bekleme süresi takibi
 * 
 * TAM İZOLE EDİLMİŞ - Diğer çağrı tiplerine bağımlılığı YOK
 */

import { supabase } from '../supabase';

// ============================================
// TİPLER
// ============================================

export interface CustomerSupportCall {
  id: string;
  customer_id: string;
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
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StartSupportCallParams {
  customer_id: string;
  sdp_offer: any;
  queue_id?: string;
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
// DESTEK HATTI ARAMA BAŞLATMA
// ============================================

/**
 * Müşteri destek hattını arar - Kuyruğa girer
 */
export async function startCustomerToSupportCall(
  params: StartSupportCallParams
): Promise<{ success: boolean; call?: CustomerSupportCall; error?: string }> {
  try {
    console.log('[CustomerToSupport] Destek hattı aranıyor:', {
      customer_id: params.customer_id,
      queue_id: params.queue_id
    });

    // Varsayılan kuyruk: genel destek
    let queueId = params.queue_id;
    if (!queueId) {
      const { data: defaultQueue } = await supabase
        .from('call_queues')
        .select('id')
        .eq('slug', 'general-support')
        .single();
      
      queueId = defaultQueue?.id;
    }

    const { data, error } = await supabase
      .from('customer_support_calls')
      .insert({
        customer_id: params.customer_id,
        sdp_offer: params.sdp_offer,
        queue_id: queueId,
        status: 'waiting',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[CustomerToSupport] Arama başlatma hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[CustomerToSupport] ✅ Kuyruğa eklendi:', {
      call_id: data.id,
      position: data.queue_position
    });

    return { success: true, call: data };

  } catch (error: any) {
    console.error('[CustomerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ADMIN ATAMA
// ============================================

/**
 * Müsait bir agent'ı çağrıya atar
 */
export async function assignCustomerSupportCall(
  params: AssignCallParams
): Promise<{ success: boolean; call?: CustomerSupportCall; error?: string }> {
  try {
    console.log('[CustomerToSupport] Agent atanıyor:', {
      call_id: params.call_id,
      admin_id: params.admin_id
    });

    // Bekleme süresini hesapla
    const { data: call, error: fetchError } = await supabase
      .from('customer_support_calls')
      .select('started_at')
      .eq('id', params.call_id)
      .single();

    if (fetchError || !call) {
      return { success: false, error: 'Çağrı bulunamadı' };
    }

    const waitTime = Math.floor(
      (Date.now() - new Date(call.started_at).getTime()) / 1000
    );

    // Agent'ı ata
    const { data, error } = await supabase
      .from('customer_support_calls')
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
      console.error('[CustomerToSupport] Atama hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[CustomerToSupport] ✅ Agent atandı, çalıyor');
    return { success: true, call: data };

  } catch (error: any) {
    console.error('[CustomerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// OTOMATİK AGENT ATAMA
// ============================================

/**
 * Müsait agent'ı bulup otomatik atar
 */
export async function autoAssignCustomerSupportCall(
  call_id: string
): Promise<{ success: boolean; call?: CustomerSupportCall; error?: string }> {
  try {
    console.log('[CustomerToSupport] Otomatik agent atama:', call_id);

    // Müsait agent bul
    const { data: availableAgent, error: agentError } = await supabase
      .from('call_agents')
      .select('agent_id')
      .eq('is_available', true)
      .order('last_call_at', { ascending: true, nullsFirst: true })
      .limit(1)
      .single();

    if (agentError || !availableAgent) {
      console.warn('[CustomerToSupport] Müsait agent yok');
      return { success: false, error: 'Şu anda müsait agent bulunmuyor' };
    }

    // Agent'ı ata
    return await assignCustomerSupportCall({
      call_id,
      admin_id: availableAgent.agent_id
    });

  } catch (error: any) {
    console.error('[CustomerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ARAMA CEVAPLAMA (AGENT)
// ============================================

/**
 * Agent aramayı cevaplar
 */
export async function answerCustomerToSupportCall(
  params: AnswerCallParams
): Promise<{ success: boolean; call?: CustomerSupportCall; error?: string }> {
  try {
    console.log('[CustomerToSupport] Agent aramayı cevaplıyor:', params.call_id);

    const { data, error } = await supabase
      .from('customer_support_calls')
      .update({
        sdp_answer: params.sdp_answer,
        status: 'connected',
        connected_at: new Date().toISOString()
      })
      .eq('id', params.call_id)
      .select()
      .single();

    if (error) {
      console.error('[CustomerToSupport] Cevaplama hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[CustomerToSupport] ✅ Arama bağlandı');
    return { success: true, call: data };

  } catch (error: any) {
    console.error('[CustomerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ARAMA SONLANDIRMA
// ============================================

/**
 * Destek aramasını sonlandır
 */
export async function endCustomerToSupportCall(
  call_id: string,
  end_reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[CustomerToSupport] Arama sonlandırılıyor:', call_id);

    const { data: call, error: fetchError } = await supabase
      .from('customer_support_calls')
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
      .from('customer_support_calls')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        end_reason,
        duration_seconds: duration
      })
      .eq('id', call_id);

    if (error) {
      console.error('[CustomerToSupport] Sonlandırma hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[CustomerToSupport] ✅ Arama sonlandırıldı:', duration, 'saniye');
    return { success: true };

  } catch (error: any) {
    console.error('[CustomerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// KUYRUK YÖNETİMİ
// ============================================

/**
 * Bekleyen çağrıları getir (admin paneli için)
 */
export async function getWaitingCalls(
  queue_id?: string
): Promise<{ success: boolean; calls?: CustomerSupportCall[]; error?: string }> {
  try {
    let query = supabase
      .from('customer_support_calls')
      .select('*')
      .eq('status', 'waiting')
      .order('queue_position', { ascending: true });

    if (queue_id) {
      query = query.eq('queue_id', queue_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CustomerToSupport] Kuyruk getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, calls: data };

  } catch (error: any) {
    console.error('[CustomerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Agent'a atanmış aktif çağrıları getir
 */
export async function getAgentActiveCalls(
  admin_id: string
): Promise<{ success: boolean; calls?: CustomerSupportCall[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('customer_support_calls')
      .select('*')
      .eq('admin_id', admin_id)
      .in('status', ['ringing', 'connected'])
      .order('started_at', { ascending: false });

    if (error) {
      console.error('[CustomerToSupport] Agent çağrıları getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, calls: data };

  } catch (error: any) {
    console.error('[CustomerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ARAMA GEÇMİŞİ
// ============================================

/**
 * Müşterinin destek arama geçmişi
 */
export async function getCustomerSupportHistory(
  customer_id: string,
  limit = 50
): Promise<{ success: boolean; calls?: CustomerSupportCall[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('customer_support_calls')
      .select('*')
      .eq('customer_id', customer_id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[CustomerToSupport] Geçmiş getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, calls: data };

  } catch (error: any) {
    console.error('[CustomerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Belirli bir destek aramasını getir
 */
export async function getCustomerToSupportCall(
  call_id: string
): Promise<{ success: boolean; call?: CustomerSupportCall; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('customer_support_calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (error) {
      console.error('[CustomerToSupport] Arama getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, call: data };

  } catch (error: any) {
    console.error('[CustomerToSupport] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// NOTLAR VE KALİTE
// ============================================

/**
 * Agent notu ekle
 */
export async function addCallNotes(
  call_id: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('customer_support_calls')
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
 * Kalite puanı ekle
 */
export async function rateCall(
  call_id: string,
  rating: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating 1-5 arasında olmalı' };
    }

    const { error } = await supabase
      .from('customer_support_calls')
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
      .from('customer_support_calls')
      .select('ice_candidates')
      .eq('id', call_id)
      .single();

    if (fetchError || !call) {
      return { success: false, error: 'Çağrı bulunamadı' };
    }

    const candidates = [...(call.ice_candidates || []), candidate];

    const { error } = await supabase
      .from('customer_support_calls')
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
