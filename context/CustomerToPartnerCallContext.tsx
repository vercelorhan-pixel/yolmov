/**
 * ============================================
 * MÜŞTERİ → PARTNER ÇAĞRI CONTEXT
 * ============================================
 * 
 * Müşterilerin partnerleri direkt aramasını yöneten
 * tamamen izole edilmiş Context.
 * 
 * - WebRTC peer yönetimi (simple-peer)
 * - SDP sinyalleşmesi (Supabase realtime)
 * - Kredi kontrolü
 * 
 * DİĞER ÇAĞRI TİPLERİNE BAĞIMLILIĞI YOK
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import SimplePeer from 'simple-peer';
import { supabase } from '../services/supabase';
import * as CustomerPartnerService from '../services/calls/customerToPartner';

// ============================================
// TİPLER
// ============================================

interface CustomerPartnerCallContextType {
  // Durum
  currentCall: CustomerPartnerService.CustomerPartnerCall | null;
  isInitiator: boolean;
  callStatus: 'idle' | 'ringing' | 'connected' | 'ended';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  
  // Fonksiyonlar
  startCall: (partnerId: string, requestId?: string) => Promise<void>;
  answerCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  
  // Hata durumu
  error: string | null;
}

const CustomerPartnerCallContext = createContext<CustomerPartnerCallContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export const CustomerPartnerCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [currentCall, setCurrentCall] = useState<CustomerPartnerService.CustomerPartnerCall | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
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
      console.log('[CustomerToPartner] 🎤 Mikrofon erişimi sağlandı');
      return stream;

    } catch (err: any) {
      console.error('[CustomerToPartner] Mikrofon hatası:', err);
      setError('Mikrofon erişimi engellenmiş');
      return null;
    }
  };

  // ============================================
  // ARAMA BAŞLATMA (CUSTOMER)
  // ============================================

  const startCall = useCallback(async (partnerId: string, requestId?: string) => {
    try {
      console.log('[CustomerToPartner] Arama başlatılıyor:', partnerId);
      setError(null);
      setIsInitiator(true);

      // 1. Mikrofon erişimi
      const stream = await getLocalStream();
      if (!stream) {
        throw new Error('Mikrofon erişimi sağlanamadı');
      }

      // 2. Customer ID (anonim veya auth)
      const { data: { user } } = await supabase.auth.getUser();
      const customerId = user?.id || `anon_${Date.now()}`;

      // 3. WebRTC Peer oluştur (initiator)
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

      // 4. SDP Offer hazır olduğunda
      peer.on('signal', async (data: any) => {
        if (data.type === 'offer') {
          console.log('[CustomerToPartner] SDP Offer oluşturuldu');

          // Veritabanına kaydet
          const result = await CustomerPartnerService.startCustomerToPartnerCall({
            customer_id: customerId,
            partner_id: partnerId,
            sdp_offer: data,
            request_id: requestId
          });

          if (!result.success || !result.call) {
            throw new Error(result.error || 'Arama başlatılamadı');
          }

          setCurrentCall(result.call);
          setCallStatus('ringing');

          // 5. SDP Answer'ı dinle
          subscribeToCallUpdates(result.call.id);
        }
      });

      // 6. Remote stream gelince
      peer.on('stream', (remoteMediaStream: MediaStream) => {
        console.log('[CustomerToPartner] ✅ Remote stream alındı');
        setRemoteStream(remoteMediaStream);
        setCallStatus('connected');
      });

      // 7. Bağlantı koptu
      peer.on('close', () => {
        console.log('[CustomerToPartner] Peer bağlantısı kapandı');
        cleanupCall();
      });

      // 8. Hata
      peer.on('error', (err: any) => {
        console.error('[CustomerToPartner] Peer hatası:', err);
        setError('Bağlantı hatası');
        cleanupCall();
      });

    } catch (err: any) {
      console.error('[CustomerToPartner] startCall hatası:', err);
      setError(err.message);
      cleanupCall();
    }
  }, []);

  // ============================================
  // ARAMA CEVAPLAMA (PARTNER)
  // ============================================

  const answerCall = useCallback(async (callId: string) => {
    try {
      console.log('[CustomerToPartner] Partner aramayı cevaplıyor:', callId);
      setError(null);
      setIsInitiator(false);

      // 1. Çağrıyı getir
      const callResult = await CustomerPartnerService.getCustomerToPartnerCall(callId);
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

      // 4. SDP Offer'ı signal ile gönder
      if (call.sdp_offer) {
        peer.signal(call.sdp_offer);
      }

      // 5. SDP Answer hazır
      peer.on('signal', async (data: any) => {
        if (data.type === 'answer') {
          console.log('[CustomerToPartner] SDP Answer oluşturuldu');

          // Veritabanına kaydet (KREDİ DÜŞER!)
          const result = await CustomerPartnerService.answerCustomerToPartnerCall({
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
        console.log('[CustomerToPartner] ✅ Remote stream alındı (partner)');
        setRemoteStream(remoteMediaStream);
      });

      // 7. Bağlantı koptu
      peer.on('close', () => {
        console.log('[CustomerToPartner] Peer kapandı (partner)');
        cleanupCall();
      });

      // 8. Hata
      peer.on('error', (err: any) => {
        console.error('[CustomerToPartner] Peer hatası (partner):', err);
        setError('Bağlantı hatası');
        cleanupCall();
      });

    } catch (err: any) {
      console.error('[CustomerToPartner] answerCall hatası:', err);
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

      console.log('[CustomerToPartner] Arama sonlandırılıyor');

      const reason = isInitiator ? 'caller_ended' : 'receiver_ended';
      await CustomerPartnerService.endCustomerToPartnerCall({
        call_id: currentCall.id,
        end_reason: reason
      });

      setCallStatus('ended');
      cleanupCall();

    } catch (err: any) {
      console.error('[CustomerToPartner] endCall hatası:', err);
      cleanupCall();
    }
  }, [currentCall, isInitiator]);

  // ============================================
  // ARAMA REDDETME (PARTNER)
  // ============================================

  const rejectCall = useCallback(async (callId: string) => {
    try {
      console.log('[CustomerToPartner] Arama reddediliyor');

      await CustomerPartnerService.rejectCustomerToPartnerCall(callId);
      cleanupCall();

    } catch (err: any) {
      console.error('[CustomerToPartner] rejectCall hatası:', err);
      cleanupCall();
    }
  }, []);

  // ============================================
  // REALTIME SUBSCRIPTION (SDP Answer dinle)
  // ============================================

  const subscribeToCallUpdates = (callId: string) => {
    console.log('[CustomerToPartner] Realtime subscription başlatılıyor:', callId);

    const channel = supabase
      .channel(`customer_partner_call:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer_partner_calls',
          filter: `id=eq.${callId}`
        },
        (payload: any) => {
          console.log('[CustomerToPartner] Realtime güncelleme:', payload);

          const updatedCall = payload.new as CustomerPartnerService.CustomerPartnerCall;

          // SDP Answer geldi mi?
          if (updatedCall.sdp_answer && peerRef.current && isInitiator) {
            console.log('[CustomerToPartner] SDP Answer alındı, signaling...');
            peerRef.current.signal(updatedCall.sdp_answer);
          }

          // Durum güncellemesi
          if (updatedCall.status === 'rejected') {
            setError('Arama reddedildi');
            cleanupCall();
          } else if (updatedCall.status === 'ended') {
            cleanupCall();
          }

          setCurrentCall(updatedCall);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  // ============================================
  // CLEANUP
  // ============================================

  const cleanupCall = useCallback(() => {
    console.log('[CustomerToPartner] Cleanup başlatılıyor');

    // Peer bağlantısını kapat
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Stream'leri kapat
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    // Subscription'ı kapat
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    setCurrentCall(null);
    setCallStatus('idle');
    setIsInitiator(false);

  }, [localStream, remoteStream]);

  // ============================================
  // PARTNER IÇIN GELEN ARAMA DİNLEME
  // ============================================

  useEffect(() => {
    // SADECE PARTNER KULLANICILARI İÇİN AKTIF
    const isPartnerUser = (() => {
      try {
        const partnerData = localStorage.getItem('yolmov_partner');
        return !!partnerData;
      } catch {
        return false;
      }
    })();

    if (!isPartnerUser) {
      console.log('[CustomerToPartner] Customer user detected, skipping incoming call listener');
      return;
    }

    // Partner ID'yi kontrol et
    const checkPartner = async () => {
      // Önce localStorage'dan kontrol et (daha hızlı)
      try {
        const partnerData = localStorage.getItem('yolmov_partner');
        if (partnerData) {
          const parsed = JSON.parse(partnerData);
          if (parsed.id) {
            console.log('[CustomerToPartner] Partner ID from localStorage:', parsed.id);
            return parsed.id;
          }
        }
      } catch (e) {
        console.log('[CustomerToPartner] localStorage parse error, checking database');
      }

      // localStorage'da yoksa veritabanından kontrol et
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[CustomerToPartner] No auth user found');
        return null;
      }

      // Partner tablosunda id = auth.uid() (user_id kolonu yok!)
      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('id', user.id)
        .single();

      if (partner?.id) {
        console.log('[CustomerToPartner] Partner ID from database:', partner.id);
        return partner.id;
      }

      console.log('[CustomerToPartner] User is not a partner');
      return null;
    };

    let incomingChannel: any = null;

    const setupIncomingCallListener = async () => {
      const partnerId = await checkPartner();
      if (!partnerId) {
        console.log('[CustomerToPartner] Partner ID bulunamadı');
        return;
      }

      console.log('[CustomerToPartner] ✅ Partner gelen arama dinleniyor:', partnerId);

      // Partner'a gelen yeni aramaları dinle
      incomingChannel = supabase
        .channel(`partner_incoming_calls:${partnerId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'customer_partner_calls',
            filter: `partner_id=eq.${partnerId}`
          },
          (payload: any) => {
            const newCall = payload.new as CustomerPartnerService.CustomerPartnerCall;
            
            console.log('[CustomerToPartner] 🔔 GELEN ARAMA!', newCall);

            // Sadece ringing durumundaki aramaları al
            if (newCall.status === 'ringing') {
              setCurrentCall(newCall);
              setCallStatus('ringing');
              setIsInitiator(false);

              // Bu aramayı dinlemeye başla
              subscribeToCallUpdates(newCall.id);
            }
          }
        )
        .subscribe((status) => {
          console.log('[CustomerToPartner] Partner subscription status:', status);
        });
    };

    setupIncomingCallListener();

    return () => {
      if (incomingChannel) {
        supabase.removeChannel(incomingChannel);
        console.log('[CustomerToPartner] Partner incoming call listener removed');
      }
    };
  }, []);

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

  const value: CustomerPartnerCallContextType = {
    currentCall,
    isInitiator,
    callStatus,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall,
    rejectCall,
    error
  };

  return (
    <CustomerPartnerCallContext.Provider value={value}>
      {children}
    </CustomerPartnerCallContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useCustomerPartnerCall = () => {
  const context = useContext(CustomerPartnerCallContext);
  if (context === undefined) {
    throw new Error('useCustomerPartnerCall must be used within CustomerPartnerCallProvider');
  }
  return context;
};
