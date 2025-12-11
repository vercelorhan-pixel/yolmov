/**
 * ============================================
 * MÜŞTERİ → PARTNER ARAMA SERVİSİ
 * ============================================
 * 
 * Müşterilerin partnerleri direkt aramasını yönetir.
 * - Kredi kontrolü YOKTUR (partner cevapladığında düşer)
 * - WebRTC SDP sinyalleşmesi
 * - Arama geçmişi
 * 
 * TAM İZOLE EDİLMİŞ - Diğer çağrı tiplerine bağımlılığı YOK
 */

import { supabase } from '../supabase';

// ============================================
// TİPLER
// ============================================

export interface CustomerPartnerCall {
  id: string;
  customer_id: string;
  partner_id: string;
  sdp_offer: any;
  sdp_answer: any;
  ice_candidates: any[];
  status: 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed' | 'failed';
  started_at: string;
  connected_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  end_reason?: string;
  credit_deducted: boolean;
  quality_rating?: number;
  request_id?: string;
  created_at: string;
  updated_at: string;
}

export interface StartCallParams {
  customer_id: string;
  partner_id: string;
  sdp_offer: any;
  request_id?: string;
}

export interface AnswerCallParams {
  call_id: string;
  sdp_answer: any;
}

export interface EndCallParams {
  call_id: string;
  end_reason: 'caller_ended' | 'receiver_ended' | 'timeout' | 'error';
}

// ============================================
// ARAMA BAŞLATMA
// ============================================

/**
 * Müşteri partner'ı arar
 */
export async function startCustomerToPartnerCall(
  params: StartCallParams
): Promise<{ success: boolean; call?: CustomerPartnerCall; error?: string }> {
  try {
    console.log('[CustomerToPartner] Arama başlatılıyor:', {
      customer_id: params.customer_id,
      partner_id: params.partner_id,
      request_id: params.request_id
    });

    const { data, error } = await supabase
      .from('customer_partner_calls')
      .insert({
        customer_id: params.customer_id,
        partner_id: params.partner_id,
        sdp_offer: params.sdp_offer,
        request_id: params.request_id,
        status: 'ringing',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[CustomerToPartner] Arama başlatma hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[CustomerToPartner] ✅ Arama oluşturuldu:', data.id);
    return { success: true, call: data };

  } catch (error: any) {
    console.error('[CustomerToPartner] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ARAMA CEVAPLAMA (PARTNER)
// ============================================

/**
 * Partner aramayı cevaplar - Kredi düşer
 */
export async function answerCustomerToPartnerCall(
  params: AnswerCallParams
): Promise<{ success: boolean; call?: CustomerPartnerCall; error?: string }> {
  try {
    console.log('[CustomerToPartner] Partner aramayı cevaplıyor:', params.call_id);

    // 1. SDP answer'ı kaydet
    const { data, error } = await supabase
      .from('customer_partner_calls')
      .update({
        sdp_answer: params.sdp_answer,
        status: 'connected',
        connected_at: new Date().toISOString()
      })
      .eq('id', params.call_id)
      .select()
      .single();

    if (error) {
      console.error('[CustomerToPartner] Cevaplama hatası:', error);
      return { success: false, error: error.message };
    }

    // 2. Kredi düşümü (1 kredi)
    const creditResult = await deductPartnerCredit(data.partner_id);
    if (!creditResult.success) {
      console.warn('[CustomerToPartner] ⚠️ Kredi düşümü başarısız:', creditResult.error);
    }

    // 3. Kredi düşürüldüğünü işaretle
    await supabase
      .from('customer_partner_calls')
      .update({ credit_deducted: true })
      .eq('id', params.call_id);

    console.log('[CustomerToPartner] ✅ Arama bağlandı ve kredi düşürüldü');
    return { success: true, call: data };

  } catch (error: any) {
    console.error('[CustomerToPartner] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ARAMA SONLANDIRMA
// ============================================

/**
 * Aramayı sonlandır (caller veya receiver)
 */
export async function endCustomerToPartnerCall(
  params: EndCallParams
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[CustomerToPartner] Arama sonlandırılıyor:', {
      call_id: params.call_id,
      reason: params.end_reason
    });

    // Mevcut çağrıyı getir
    const { data: call, error: fetchError } = await supabase
      .from('customer_partner_calls')
      .select('*')
      .eq('id', params.call_id)
      .single();

    if (fetchError || !call) {
      return { success: false, error: 'Çağrı bulunamadı' };
    }

    // Süre hesapla
    const duration = call.connected_at
      ? Math.floor((Date.now() - new Date(call.connected_at).getTime()) / 1000)
      : 0;

    // Güncelle
    const { error } = await supabase
      .from('customer_partner_calls')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        end_reason: params.end_reason,
        duration_seconds: duration
      })
      .eq('id', params.call_id);

    if (error) {
      console.error('[CustomerToPartner] Sonlandırma hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[CustomerToPartner] ✅ Arama sonlandırıldı:', duration, 'saniye');
    return { success: true };

  } catch (error: any) {
    console.error('[CustomerToPartner] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ARAMA REDDETme
// ============================================

/**
 * Partner aramayı reddeder (kredi düşmez)
 */
export async function rejectCustomerToPartnerCall(
  call_id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[CustomerToPartner] Arama reddediliyor:', call_id);

    const { error } = await supabase
      .from('customer_partner_calls')
      .update({
        status: 'rejected',
        ended_at: new Date().toISOString(),
        end_reason: 'receiver_ended'
      })
      .eq('id', call_id);

    if (error) {
      console.error('[CustomerToPartner] Reddetme hatası:', error);
      return { success: false, error: error.message };
    }

    console.log('[CustomerToPartner] ✅ Arama reddedildi (kredi düşmedi)');
    return { success: true };

  } catch (error: any) {
    console.error('[CustomerToPartner] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ARAMA GEÇMİŞİ
// ============================================

/**
 * Partner'ın arama geçmişi
 */
export async function getPartnerCallHistory(
  partner_id: string,
  limit = 50
): Promise<{ success: boolean; calls?: CustomerPartnerCall[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('customer_partner_calls')
      .select('*')
      .eq('partner_id', partner_id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[CustomerToPartner] Geçmiş getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, calls: data };

  } catch (error: any) {
    console.error('[CustomerToPartner] Exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Müşterinin arama geçmişi
 */
export async function getCustomerCallHistory(
  customer_id: string,
  limit = 50
): Promise<{ success: boolean; calls?: CustomerPartnerCall[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('customer_partner_calls')
      .select('*')
      .eq('customer_id', customer_id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[CustomerToPartner] Geçmiş getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, calls: data };

  } catch (error: any) {
    console.error('[CustomerToPartner] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// TEK ARAMA BİLGİSİ
// ============================================

/**
 * Belirli bir aramayı getir
 */
export async function getCustomerToPartnerCall(
  call_id: string
): Promise<{ success: boolean; call?: CustomerPartnerCall; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('customer_partner_calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (error) {
      console.error('[CustomerToPartner] Arama getirme hatası:', error);
      return { success: false, error: error.message };
    }

    return { success: true, call: data };

  } catch (error: any) {
    console.error('[CustomerToPartner] Exception:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// KREDİ YÖNETİMİ
// ============================================

/**
 * Partner'ın kredisini 1 düşür
 */
async function deductPartnerCredit(
  partner_id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Mevcut krediyi getir
    const { data: partner, error: fetchError } = await supabase
      .from('partners')
      .select('credits')
      .eq('id', partner_id)
      .single();

    if (fetchError || !partner) {
      return { success: false, error: 'Partner bulunamadı' };
    }

    // 2. Kredi kontrolü
    if (partner.credits <= 0) {
      return { success: false, error: 'Yetersiz kredi' };
    }

    // 3. Kredi düş
    const { error: updateError } = await supabase
      .from('partners')
      .update({ credits: partner.credits - 1 })
      .eq('id', partner_id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    console.log('[CustomerToPartner] Kredi düşürüldü:', partner.credits, '→', partner.credits - 1);
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
    // Mevcut adayları getir
    const { data: call, error: fetchError } = await supabase
      .from('customer_partner_calls')
      .select('ice_candidates')
      .eq('id', call_id)
      .single();

    if (fetchError || !call) {
      return { success: false, error: 'Çağrı bulunamadı' };
    }

    // Yeni adayı ekle
    const candidates = [...(call.ice_candidates || []), candidate];

    const { error } = await supabase
      .from('customer_partner_calls')
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
