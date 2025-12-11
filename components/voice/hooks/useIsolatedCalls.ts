/**
 * YOLMOV Voice - İzole Çağrı Hook'ları
 * 
 * Her çağrı tipi için ayrı hook sağlar:
 * 1. useCustomerToPartnerCall - Müşteri → Partner direkt araması
 * 2. useCustomerToSupportCall - Müşteri → Destek Hattı (queue ile)
 * 3. usePartnerToSupportCall - Partner → Destek Hattı (queue ile)
 * 
 * Bu hook'lar CallContext'i sarmalar ve her akış için
 * uygun parametreleri otomatik olarak geçirir.
 */

import { useCallback } from 'react';
import { useCall } from '../../../context/CallContext';
import callCenterService from '../../../services/callCenterService';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface CustomerToPartnerCallHook {
  // Çağrı durumu
  callStatus: ReturnType<typeof useCall>['callStatus'];
  isIncoming: boolean;
  currentCall: ReturnType<typeof useCall>['currentCall'];
  error: string | null;
  callDuration: number;
  
  // Aksiyonlar
  callPartner: (partnerId: string, partnerName?: string) => Promise<void>;
  endCall: () => Promise<void>;
  
  // Ses kontrolleri
  isMuted: boolean;
  toggleMute: () => void;
  isSpeakerOn: boolean;
  toggleSpeaker: () => void;
}

export interface CustomerToSupportCallHook {
  callStatus: ReturnType<typeof useCall>['callStatus'];
  currentCall: ReturnType<typeof useCall>['currentCall'];
  error: string | null;
  callDuration: number;
  
  // Aksiyonlar - Queue sistemi ile
  callSupport: (params: {
    callerName?: string;
    callerPhone?: string;
    callerMessage?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  endCall: () => Promise<void>;
  
  // Ses kontrolleri
  isMuted: boolean;
  toggleMute: () => void;
}

export interface PartnerToSupportCallHook {
  callStatus: ReturnType<typeof useCall>['callStatus'];
  currentCall: ReturnType<typeof useCall>['currentCall'];
  error: string | null;
  callDuration: number;
  
  // Aksiyonlar - Partner-specific queue
  callSupport: () => Promise<{ success: boolean; error?: string }>;
  endCall: () => Promise<void>;
  
  // Ses kontrolleri
  isMuted: boolean;
  toggleMute: () => void;
}

// =====================================================
// HOOK 1: Customer → Partner (Direkt Arama)
// =====================================================

/**
 * Müşterinin partner'ı doğrudan araması için hook.
 * 
 * Özellikler:
 * - Queue sistemi KULLANILMAZ
 * - Partner cevapladığında 1 kredi düşer
 * - Direkt WebRTC bağlantısı
 * 
 * Kullanım:
 * ```tsx
 * const { callPartner, callStatus, endCall } = useCustomerToPartnerCall();
 * 
 * const handleCall = () => {
 *   callPartner('partner-uuid', 'ABC Nakliyat');
 * };
 * ```
 */
export function useCustomerToPartnerCall(): CustomerToPartnerCallHook {
  const ctx = useCall();
  
  const callPartner = useCallback(async (partnerId: string, partnerName?: string) => {
    console.log('📞 [Customer→Partner] Initiating direct call to partner:', partnerId);
    await ctx.startCall(partnerId, 'partner', undefined, partnerName);
  }, [ctx]);
  
  return {
    callStatus: ctx.callStatus,
    isIncoming: ctx.isIncoming,
    currentCall: ctx.currentCall,
    error: ctx.error,
    callDuration: ctx.callDuration,
    callPartner,
    endCall: ctx.endCall,
    isMuted: ctx.isMuted,
    toggleMute: ctx.toggleMute,
    isSpeakerOn: ctx.isSpeakerOn,
    toggleSpeaker: ctx.toggleSpeaker,
  };
}

// =====================================================
// HOOK 2: Customer → Support (Queue ile)
// =====================================================

/**
 * Müşterinin destek hattını araması için hook.
 * 
 * Özellikler:
 * - Queue sistemi KULLANILIR (general-support)
 * - Admin otomatik atanır
 * - Kredi kontrolü YOK
 * 
 * Kullanım:
 * ```tsx
 * const { callSupport, callStatus, error } = useCustomerToSupportCall();
 * 
 * const handleCall = async () => {
 *   const result = await callSupport({
 *     callerName: 'Ahmet Yılmaz',
 *     callerPhone: '05551234567',
 *   });
 *   if (!result.success) {
 *     alert(result.error);
 *   }
 * };
 * ```
 */
export function useCustomerToSupportCall(): CustomerToSupportCallHook {
  const ctx = useCall();
  
  const callSupport = useCallback(async (params: {
    callerName?: string;
    callerPhone?: string;
    callerMessage?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    console.log('📞 [Customer→Support] Initiating support call via queue');
    
    try {
      // 1. Kuyruğa ekle
      const assignment = await callCenterService.addToQueue({
        queueSlug: 'general-support',
        sourceType: 'web-contact',
        sourcePage: window.location.pathname,
        callerName: params.callerName,
        callerPhone: params.callerPhone,
        callerMessage: params.callerMessage,
      });
      
      if (!assignment) {
        return { success: false, error: 'Çağrı kuyruğa eklenemedi' };
      }
      
      console.log('📞 [Customer→Support] Added to queue:', assignment.id);
      
      // 2. Agent atandıysa WebRTC başlat
      if (assignment.status === 'ringing' && assignment.assigned_agent_id) {
        const callData = await callCenterService.getCallById(assignment.call_id!);
        
        if (callData?.receiver_id) {
          console.log('📞 [Customer→Support] Starting WebRTC to agent:', callData.receiver_id);
          await ctx.startCall(callData.receiver_id, 'admin', assignment.call_id!, 'Yolmov Destek');
          return { success: true };
        }
        
        return { success: false, error: 'Agent bilgisi alınamadı' };
      }
      
      return { success: false, error: 'Şu an tüm temsilcilerimiz meşgul' };
      
    } catch (err: any) {
      console.error('📞 [Customer→Support] Error:', err);
      if (err.message?.includes('NO_AVAILABLE_AGENT')) {
        return { success: false, error: 'Müsait temsilci bulunmuyor' };
      }
      return { success: false, error: 'Bağlantı kurulamadı' };
    }
  }, [ctx]);
  
  return {
    callStatus: ctx.callStatus,
    currentCall: ctx.currentCall,
    error: ctx.error,
    callDuration: ctx.callDuration,
    callSupport,
    endCall: ctx.endCall,
    isMuted: ctx.isMuted,
    toggleMute: ctx.toggleMute,
  };
}

// =====================================================
// HOOK 3: Partner → Support (Partner-specific Queue)
// =====================================================

/**
 * Partner'ın destek hattını araması için hook.
 * 
 * Özellikler:
 * - Queue sistemi KULLANILIR (partner-calls)
 * - Partner bilgileri localStorage'dan alınır
 * - Öncelikli agent atama
 * 
 * Kullanım:
 * ```tsx
 * const { callSupport, callStatus, error } = usePartnerToSupportCall();
 * 
 * const handleCall = async () => {
 *   const result = await callSupport();
 *   if (!result.success) {
 *     alert(result.error);
 *   }
 * };
 * ```
 */
export function usePartnerToSupportCall(): PartnerToSupportCallHook {
  const ctx = useCall();
  
  const callSupport = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    console.log('📞 [Partner→Support] Initiating partner support call via queue');
    
    // Partner bilgilerini localStorage'dan al
    const getPartnerInfo = () => {
      try {
        const partnerData = localStorage.getItem('yolmov_partner');
        if (partnerData) {
          const partner = JSON.parse(partnerData);
          return {
            id: partner.id || partner.partner_id,
            name: partner.company_name || partner.name || 'Partner',
            phone: partner.phone || '',
          };
        }
      } catch {}
      return null;
    };
    
    const partnerInfo = getPartnerInfo();
    if (!partnerInfo) {
      return { success: false, error: 'Partner bilgileri bulunamadı. Lütfen tekrar giriş yapın.' };
    }
    
    try {
      // 1. Partner-calls kuyruğuna ekle
      const assignment = await callCenterService.addToQueue({
        queueSlug: 'partner-calls',
        sourceType: 'partner-direct',
        sourcePage: '/partner/support',
        callerName: partnerInfo.name,
        callerPhone: partnerInfo.phone,
      });
      
      if (!assignment) {
        return { success: false, error: 'Çağrı kuyruğa eklenemedi' };
      }
      
      console.log('📞 [Partner→Support] Added to queue:', assignment.id);
      
      // 2. Agent atandıysa WebRTC başlat
      if (assignment.status === 'ringing' && assignment.assigned_agent_id) {
        const callData = await callCenterService.getCallById(assignment.call_id!);
        
        if (callData?.receiver_id) {
          console.log('📞 [Partner→Support] Starting WebRTC to agent:', callData.receiver_id);
          await ctx.startCall(callData.receiver_id, 'admin', assignment.call_id!, 'Yolmov Partner Destek');
          return { success: true };
        }
        
        return { success: false, error: 'Agent bilgisi alınamadı' };
      }
      
      return { success: false, error: 'Şu an tüm temsilcilerimiz meşgul' };
      
    } catch (err: any) {
      console.error('📞 [Partner→Support] Error:', err);
      if (err.message?.includes('NO_AVAILABLE_AGENT')) {
        return { success: false, error: 'Müsait temsilci bulunmuyor' };
      }
      return { success: false, error: 'Bağlantı kurulamadı' };
    }
  }, [ctx]);
  
  return {
    callStatus: ctx.callStatus,
    currentCall: ctx.currentCall,
    error: ctx.error,
    callDuration: ctx.callDuration,
    callSupport,
    endCall: ctx.endCall,
    isMuted: ctx.isMuted,
    toggleMute: ctx.toggleMute,
  };
}

// =====================================================
// EXPORT
// =====================================================

export default {
  useCustomerToPartnerCall,
  useCustomerToSupportCall,
  usePartnerToSupportCall,
};
