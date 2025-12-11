/**
 * ============================================
 * MÜŞTERİ → DESTEK ÇAĞRI CONTEXT
 * ============================================
 * 
 * Müşterilerin destek hattını aramasını yöneten
 * tamamen izole edilmiş Context.
 * 
 * - Kuyruk sistemi
 * - Admin/agent atama
 * - WebRTC peer yönetimi
 * 
 * DİĞER ÇAĞRI TİPLERİNE BAĞIMLILIĞI YOK
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import SimplePeer from 'simple-peer';
import { supabase } from '../services/supabase';
import * as CustomerSupportService from '../services/calls/customerToSupport';

// ============================================
// TİPLER
// ============================================

interface CustomerSupportCallContextType {
  // Durum
  currentCall: CustomerSupportService.CustomerSupportCall | null;
  isCustomer: boolean;
  callStatus: 'idle' | 'waiting' | 'ringing' | 'connected' | 'ended';
  queuePosition: number | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  
  // Fonksiyonlar (Customer)
  callSupport: (queueId?: string) => Promise<void>;
  endCall: () => Promise<void>;
  
  // Fonksiyonlar (Agent)
  answerSupportCall: (callId: string) => Promise<void>;
  
  // Hata durumu
  error: string | null;
}

const CustomerSupportCallContext = createContext<CustomerSupportCallContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export const CustomerSupportCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [currentCall, setCurrentCall] = useState<CustomerSupportService.CustomerSupportCall | null>(null);
  const [isCustomer, setIsCustomer] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'waiting' | 'ringing' | 'connected' | 'ended'>('idle');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
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
      console.log('[CustomerToSupport] 🎤 Mikrofon erişimi sağlandı');
      return stream;

    } catch (err: any) {
      console.error('[CustomerToSupport] Mikrofon hatası:', err);
      setError('Mikrofon erişimi engellenmiş');
      return null;
    }
  };

  // ============================================
  // DESTEK HATTI ARAMA (CUSTOMER)
  // ============================================

  const callSupport = useCallback(async (queueId?: string) => {
    try {
      console.log('[CustomerToSupport] Destek hattı aranıyor');
      setError(null);
      setIsCustomer(true);

      // 1. Mikrofon
      const stream = await getLocalStream();
      if (!stream) {
        throw new Error('Mikrofon erişimi sağlanamadı');
      }

      // 2. Customer ID
      const { data: { user } } = await supabase.auth.getUser();
      const customerId = user?.id || `anon_${Date.now()}`;

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
          console.log('[CustomerToSupport] SDP Offer oluşturuldu');

          // Kuyruğa ekle
          const result = await CustomerSupportService.startCustomerToSupportCall({
            customer_id: customerId,
            sdp_offer: data,
            queue_id: queueId
          });

          if (!result.success || !result.call) {
            throw new Error(result.error || 'Kuyruğa eklenemedi');
          }

          setCurrentCall(result.call);
          setCallStatus('waiting');
          setQueuePosition(result.call.queue_position || null);

          // Subscription (agent atama & answer dinle)
          subscribeToCallUpdates(result.call.id);
        }
      });

      // 5. Remote stream
      peer.on('stream', (remoteMediaStream: MediaStream) => {
        console.log('[CustomerToSupport] ✅ Agent stream alındı');
        setRemoteStream(remoteMediaStream);
        setCallStatus('connected');
      });

      // 6. Bağlantı koptu
      peer.on('close', () => {
        console.log('[CustomerToSupport] Peer kapandı');
        cleanupCall();
      });

      // 7. Hata
      peer.on('error', (err: any) => {
        console.error('[CustomerToSupport] Peer hatası:', err);
        setError('Bağlantı hatası');
        cleanupCall();
      });

    } catch (err: any) {
      console.error('[CustomerToSupport] callSupport hatası:', err);
      setError(err.message);
      cleanupCall();
    }
  }, []);

  // ============================================
  // DESTEK ARAMASINI CEVAPLAMA (AGENT)
  // ============================================

  const answerSupportCall = useCallback(async (callId: string) => {
    try {
      console.log('[CustomerToSupport] Agent aramayı cevaplıyor:', callId);
      setError(null);
      setIsCustomer(false);

      // 1. Çağrıyı getir
      const callResult = await CustomerSupportService.getCustomerToSupportCall(callId);
      if (!callResult.success || !callResult.call) {
        throw new Error('Çağrı bulunamadı');
      }

      const call = callResult.call;
      setCurrentCall(call);

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
          console.log('[CustomerToSupport] SDP Answer oluşturuldu');

          const result = await CustomerSupportService.answerCustomerToSupportCall({
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
        console.log('[CustomerToSupport] ✅ Customer stream alındı');
        setRemoteStream(remoteMediaStream);
      });

      // 7. Bağlantı koptu
      peer.on('close', () => {
        console.log('[CustomerToSupport] Peer kapandı (agent)');
        cleanupCall();
      });

      // 8. Hata
      peer.on('error', (err: any) => {
        console.error('[CustomerToSupport] Peer hatası (agent):', err);
        setError('Bağlantı hatası');
        cleanupCall();
      });

    } catch (err: any) {
      console.error('[CustomerToSupport] answerSupportCall hatası:', err);
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

      console.log('[CustomerToSupport] Arama sonlandırılıyor');

      const reason = isCustomer ? 'caller_ended' : 'receiver_ended';
      await CustomerSupportService.endCustomerToSupportCall(currentCall.id, reason);

      setCallStatus('ended');
      cleanupCall();

    } catch (err: any) {
      console.error('[CustomerToSupport] endCall hatası:', err);
      cleanupCall();
    }
  }, [currentCall, isCustomer]);

  // ============================================
  // REALTIME SUBSCRIPTION
  // ============================================

  const subscribeToCallUpdates = (callId: string) => {
    console.log('[CustomerToSupport] Realtime subscription başlatılıyor:', callId);

    const channel = supabase
      .channel(`customer_support_call:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer_support_calls',
          filter: `id=eq.${callId}`
        },
        (payload: any) => {
          console.log('[CustomerToSupport] Realtime güncelleme:', payload);

          const updatedCall = payload.new as CustomerSupportService.CustomerSupportCall;

          // Agent atandı mı? (waiting → ringing)
          if (updatedCall.status === 'ringing' && callStatus === 'waiting') {
            console.log('[CustomerToSupport] Agent atandı, çalıyor...');
            setCallStatus('ringing');
          }

          // SDP Answer geldi mi?
          if (updatedCall.sdp_answer && peerRef.current && isCustomer) {
            console.log('[CustomerToSupport] SDP Answer alındı');
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
    console.log('[CustomerToSupport] Cleanup başlatılıyor');

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
    setIsCustomer(false);
    setQueuePosition(null);

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

  const value: CustomerSupportCallContextType = {
    currentCall,
    isCustomer,
    callStatus,
    queuePosition,
    localStream,
    remoteStream,
    callSupport,
    answerSupportCall,
    endCall,
    error
  };

  return (
    <CustomerSupportCallContext.Provider value={value}>
      {children}
    </CustomerSupportCallContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useCustomerSupportCall = () => {
  const context = useContext(CustomerSupportCallContext);
  if (context === undefined) {
    throw new Error('useCustomerSupportCall must be used within CustomerSupportCallProvider');
  }
  return context;
};
