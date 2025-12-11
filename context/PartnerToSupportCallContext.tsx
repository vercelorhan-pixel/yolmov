/**
 * ============================================
 * PARTNER → DESTEK ÇAĞRI CONTEXT
 * ============================================
 * 
 * Partnerlerin destek hattını aramasını yöneten
 * tamamen izole edilmiş Context.
 * 
 * - Öncelikli kuyruk sistemi
 * - Admin/agent atama
 * - WebRTC peer yönetimi
 * 
 * DİĞER ÇAĞRI TİPLERİNE BAĞIMLILIĞI YOK
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import SimplePeer from 'simple-peer';
import { supabase } from '../services/supabase';
import * as PartnerSupportService from '../services/calls/partnerToSupport';

// ============================================
// TİPLER
// ============================================

interface PartnerSupportCallContextType {
  // Durum
  currentCall: PartnerSupportService.PartnerSupportCall | null;
  isPartner: boolean;
  callStatus: 'idle' | 'waiting' | 'ringing' | 'connected' | 'ended';
  queuePosition: number | null;
  priorityLevel: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  
  // Fonksiyonlar (Partner)
  callSupport: (queueId?: string, priority?: number) => Promise<void>;
  endCall: () => Promise<void>;
  
  // Fonksiyonlar (Agent)
  answerPartnerSupportCall: (callId: string) => Promise<void>;
  
  // Hata durumu
  error: string | null;
}

const PartnerSupportCallContext = createContext<PartnerSupportCallContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export const PartnerSupportCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [currentCall, setCurrentCall] = useState<PartnerSupportService.PartnerSupportCall | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'waiting' | 'ringing' | 'connected' | 'ended'>('idle');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [priorityLevel, setPriorityLevel] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const subscriptionRef = useRef<any>(null);

  // ============================================
  // MİKROFON ERİŞİMİ
  // ============================================

  const getLocalStream = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      setLocalStream(stream);
      console.log('[PartnerToSupport] 🎤 Mikrofon erişimi sağlandı');
      return stream;

    } catch (err: any) {
      console.error('[PartnerToSupport] Mikrofon hatası:', err);
      setError('Mikrofon erişimi engellenmiş');
      return null;
    }
  };

  // ============================================
  // DESTEK HATTI ARAMA (PARTNER)
  // ============================================

  const callSupport = useCallback(async (queueId?: string, priority = 0) => {
    try {
      console.log('[PartnerToSupport] Partner destek hattını arıyor, öncelik:', priority);
      setError(null);
      setIsPartner(true);
      setPriorityLevel(priority);

      // 1. Mikrofon
      const stream = await getLocalStream();
      if (!stream) {
        throw new Error('Mikrofon erişimi sağlanamadı');
      }

      // 2. Partner ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Partner kimliği doğrulanamadı');
      }

      // Partner bilgisi
      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partner) {
        throw new Error('Partner bilgisi bulunamadı');
      }

      // 3. WebRTC Peer (initiator)
      const peer = new SimplePeer({
        initiator: true,
        trickle: true,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      peerRef.current = peer;

      // 4. SDP Offer
      peer.on('signal', async (data: any) => {
        if (data.type === 'offer') {
          console.log('[PartnerToSupport] SDP Offer oluşturuldu');

          // Öncelikli kuyruğa ekle
          const result = await PartnerSupportService.startPartnerToSupportCall({
            partner_id: partner.id,
            sdp_offer: data,
            queue_id: queueId,
            priority_level: priority
          });

          if (!result.success || !result.call) {
            throw new Error(result.error || 'Kuyruğa eklenemedi');
          }

          setCurrentCall(result.call);
          setCallStatus('waiting');
          setQueuePosition(result.call.queue_position || null);

          // Subscription
          subscribeToCallUpdates(result.call.id);
        }
      });

      // 5. Remote stream
      peer.on('stream', (remoteMediaStream: MediaStream) => {
        console.log('[PartnerToSupport] ✅ Agent stream alındı');
        setRemoteStream(remoteMediaStream);
        setCallStatus('connected');
      });

      // 6. Bağlantı koptu
      peer.on('close', () => {
        console.log('[PartnerToSupport] Peer kapandı');
        cleanupCall();
      });

      // 7. Hata
      peer.on('error', (err: any) => {
        console.error('[PartnerToSupport] Peer hatası:', err);
        setError('Bağlantı hatası');
        cleanupCall();
      });

    } catch (err: any) {
      console.error('[PartnerToSupport] callSupport hatası:', err);
      setError(err.message);
      cleanupCall();
    }
  }, []);

  // ============================================
  // DESTEK ARAMASINI CEVAPLAMA (AGENT)
  // ============================================

  const answerPartnerSupportCall = useCallback(async (callId: string) => {
    try {
      console.log('[PartnerToSupport] Agent partner aramasını cevaplıyor:', callId);
      setError(null);
      setIsPartner(false);

      // 1. Çağrıyı getir
      const callResult = await PartnerSupportService.getPartnerToSupportCall(callId);
      if (!callResult.success || !callResult.call) {
        throw new Error('Çağrı bulunamadı');
      }

      const call = callResult.call;
      setCurrentCall(call);
      setPriorityLevel(call.priority_level);

      // 2. Mikrofon
      const stream = await getLocalStream();
      if (!stream) {
        throw new Error('Mikrofon erişimi sağlanamadı');
      }

      // 3. WebRTC Peer (receiver)
      const peer = new SimplePeer({
        initiator: false,
        trickle: true,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      peerRef.current = peer;

      // 4. SDP Offer'ı signal
      if (call.sdp_offer) {
        peer.signal(call.sdp_offer);
      }

      // 5. SDP Answer
      peer.on('signal', async (data: any) => {
        if (data.type === 'answer') {
          console.log('[PartnerToSupport] SDP Answer oluşturuldu (partner çağrısı)');

          const result = await PartnerSupportService.answerPartnerToSupportCall({
            call_id: callId,
            sdp_answer: data
          });

          if (!result.success) {
            throw new Error(result.error || 'Cevaplama başarısız');
          }

          setCallStatus('connected');
        }
      });

      // 6. Remote stream
      peer.on('stream', (remoteMediaStream: MediaStream) => {
        console.log('[PartnerToSupport] ✅ Partner stream alındı');
        setRemoteStream(remoteMediaStream);
      });

      // 7. Bağlantı koptu
      peer.on('close', () => {
        console.log('[PartnerToSupport] Peer kapandı (agent)');
        cleanupCall();
      });

      // 8. Hata
      peer.on('error', (err: any) => {
        console.error('[PartnerToSupport] Peer hatası (agent):', err);
        setError('Bağlantı hatası');
        cleanupCall();
      });

    } catch (err: any) {
      console.error('[PartnerToSupport] answerPartnerSupportCall hatası:', err);
      setError(err.message);
      cleanupCall();
    }
  }, []);

  // ============================================
  // ARAMA SONLANDIRMA
  // ============================================

  const endCall = useCallback(async () => {
    try {
      if (!currentCall) return;

      console.log('[PartnerToSupport] Arama sonlandırılıyor');

      const reason = isPartner ? 'caller_ended' : 'receiver_ended';
      await PartnerSupportService.endPartnerToSupportCall(currentCall.id, reason);

      setCallStatus('ended');
      cleanupCall();

    } catch (err: any) {
      console.error('[PartnerToSupport] endCall hatası:', err);
      cleanupCall();
    }
  }, [currentCall, isPartner]);

  // ============================================
  // REALTIME SUBSCRIPTION
  // ============================================

  const subscribeToCallUpdates = (callId: string) => {
    console.log('[PartnerToSupport] Realtime subscription başlatılıyor:', callId);

    const channel = supabase
      .channel(`partner_support_call:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'partner_support_calls',
          filter: `id=eq.${callId}`
        },
        (payload: any) => {
          console.log('[PartnerToSupport] Realtime güncelleme:', payload);

          const updatedCall = payload.new as PartnerSupportService.PartnerSupportCall;

          // Agent atandı mı?
          if (updatedCall.status === 'ringing' && callStatus === 'waiting') {
            console.log('[PartnerToSupport] Agent atandı (partner araması)');
            setCallStatus('ringing');
          }

          // SDP Answer geldi mi?
          if (updatedCall.sdp_answer && peerRef.current && isPartner) {
            console.log('[PartnerToSupport] SDP Answer alındı');
            peerRef.current.signal(updatedCall.sdp_answer);
          }

          // Durum güncellemeleri
          if (updatedCall.status === 'timeout') {
            setError('Zaman aşımı');
            cleanupCall();
          } else if (updatedCall.status === 'ended') {
            cleanupCall();
          }

          setCurrentCall(updatedCall);
          setQueuePosition(updatedCall.queue_position || null);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  // ============================================
  // CLEANUP
  // ============================================

  const cleanupCall = useCallback(() => {
    console.log('[PartnerToSupport] Cleanup başlatılıyor');

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    setCurrentCall(null);
    setCallStatus('idle');
    setIsPartner(false);
    setQueuePosition(null);
    setPriorityLevel(0);

  }, [localStream, remoteStream]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================

  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: PartnerSupportCallContextType = {
    currentCall,
    isPartner,
    callStatus,
    queuePosition,
    priorityLevel,
    localStream,
    remoteStream,
    callSupport,
    answerPartnerSupportCall,
    endCall,
    error
  };

  return (
    <PartnerSupportCallContext.Provider value={value}>
      {children}
    </PartnerSupportCallContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const usePartnerSupportCall = () => {
  const context = useContext(PartnerSupportCallContext);
  if (context === undefined) {
    throw new Error('usePartnerSupportCall must be used within PartnerSupportCallProvider');
  }
  return context;
};
