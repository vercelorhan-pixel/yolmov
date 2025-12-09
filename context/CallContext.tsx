/**
 * Yolmov Voice - WebRTC Sesli Arama Sistemi
 * 
 * Bu context, uygulama genelinde sesli arama özelliğini yönetir.
 * - Müşteri → Partner araması
 * - Gelen arama bildirimleri
 * - P2P WebRTC bağlantısı (simple-peer)
 * - Supabase Realtime ile sinyal iletimi
 * - Çift Akış Kayıt: HD canlı görüşme + Opus arşiv
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
// @ts-ignore
import Peer from 'simple-peer';
import { startCallRecording, stopCallRecording, getRecordingState, type RecordingState } from '../services/callRecording';

// =====================================================
// TYPES
// =====================================================

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';

export interface CallInfo {
  id: string;
  callerId: string;
  callerName?: string;
  callerPhone?: string;
  callerType: 'customer' | 'partner' | 'admin';
  receiverId: string;
  receiverName?: string;
  receiverType: 'customer' | 'partner' | 'admin';
  status: CallStatus;
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface CallContextType {
  // Durum
  callStatus: CallStatus;
  isIncoming: boolean;
  currentCall: CallInfo | null;
  callerInfo: any;
  error: string | null;
  
  // Aksiyonlar
  startCall: (receiverId: string, receiverType?: 'customer' | 'partner' | 'admin') => Promise<void>;
  answerCall: () => Promise<void>;
  answerCallById: (callId: string) => Promise<void>; // Yeni: ID ile cevapla
  rejectCall: () => Promise<void>;
  rejectCallById: (callId: string) => Promise<void>; // Yeni: ID ile reddet
  endCall: () => Promise<void>;
  
  // Ses kontrolleri
  isMuted: boolean;
  toggleMute: () => void;
  isSpeakerOn: boolean;
  toggleSpeaker: () => void;
  
  // Süre
  callDuration: number;
  
  // Kayıt durumu (Çift Akış Mimarisi)
  isRecording: boolean;
  recordingState: RecordingState | null;
  
  // Audio refs (internal)
  localAudioRef: React.RefObject<HTMLAudioElement>;
  remoteAudioRef: React.RefObject<HTMLAudioElement>;
}

const CallContext = createContext<CallContextType | null>(null);

// =====================================================
// PROVIDER
// =====================================================

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Durum
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isIncoming, setIsIncoming] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallInfo | null>(null);
  const [callerInfo, setCallerInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  
  // Kayıt durumu (Çift Akış Mimarisi)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  // Refs
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerRef = useRef<InstanceType<typeof Peer> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mevcut kullanıcı bilgisi (customer, partner veya anonim olabilir)
  const getCurrentUser = useCallback(() => {
    // ÖNCE partner kontrol et (partner dashboard'daysa partner olarak işlem yap)
    const partnerStr = localStorage.getItem('yolmov_partner');
    if (partnerStr) {
      try {
        const partner = JSON.parse(partnerStr);
        // partner.id veya partner.partner_id olabilir
        const partnerId = partner.id || partner.partner_id;
        console.log('📞 [CallContext] getCurrentUser - Partner found:', partnerId);
        return { id: partnerId, type: 'partner' as const, name: partner.company_name || partner.name, phone: partner.phone };
      } catch (e) {
        console.error('📞 [CallContext] Error parsing partner data:', e);
      }
    }
    
    // Sonra customer kontrol et
    const customerStr = localStorage.getItem('yolmov_customer');
    if (customerStr) {
      try {
        const customer = JSON.parse(customerStr);
        console.log('📞 [CallContext] getCurrentUser - Customer found:', customer.id);
        return { id: customer.id, type: 'customer' as const, name: customer.name, phone: customer.phone };
      } catch (e) {
        console.error('📞 [CallContext] Error parsing customer data:', e);
      }
    }
    
    // Anonim kullanıcı için geçici ID oluştur (üye girişi gerektirmez)
    let anonymousId = localStorage.getItem('yolmov_anonymous_caller_id');
    if (!anonymousId) {
      anonymousId = 'anon_' + crypto.randomUUID();
      localStorage.setItem('yolmov_anonymous_caller_id', anonymousId);
    }
    console.log('📞 [CallContext] getCurrentUser - Anonymous:', anonymousId);
    return { id: anonymousId, type: 'customer' as const, name: 'Anonim Arayan', isAnonymous: true };
  }, []);

  // =====================================================
  // REALTIME SUBSCRIPTION - Gelen Aramalar
  // =====================================================
  
  useEffect(() => {
    console.log('📞 [CallContext] Setting up realtime subscription (global channel)');
    
    // Global channel - tüm call insertleri dinle, filter etme
    const channel = supabase
      .channel('calls_global_incoming')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
        },
        async (payload) => {
          const newCall = payload.new as any;
          
          // Her yeni call geldiğinde GÜNCEL user'ı al
          const currentUser = getCurrentUser();
          if (!currentUser) {
            console.log('📞 [CallContext] No user found, ignoring call');
            return;
          }
          
          console.log('📞 [CallContext] New call detected:', newCall.id, 'receiver:', newCall.receiver_id, 'my id:', currentUser.id);
          
          // Bu arama bana mı geliyor? (receiver_id kontrolü)
          if (newCall.receiver_id !== currentUser.id) {
            console.log('📞 [CallContext] Call not for me, ignoring');
            return;
          }
          
          // Sadece 'ringing' durumundaki aramaları al
          if (newCall.status !== 'ringing') return;
          
          console.log('📞 [CallContext] Incoming call FOR ME!', newCall);
          
          // Caller bilgilerini çek (anonim olabilir)
          let callerData = null;
          if (newCall.caller_id.startsWith('anon_')) {
            // Anonim arayan
            callerData = { name: 'Anonim Arayan', phone: null };
          } else if (newCall.caller_type === 'customer') {
            const { data } = await supabase
              .from('customers')
              .select('id, first_name, last_name, phone')
              .eq('id', newCall.caller_id)
              .single();
            if (data) {
              callerData = { 
                name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Müşteri',
                phone: data.phone 
              };
            }
          } else if (newCall.caller_type === 'partner') {
            const { data } = await supabase
              .from('partners')
              .select('id, company_name, phone')
              .eq('id', newCall.caller_id)
              .single();
            if (data) {
              callerData = { name: data.company_name, phone: data.phone };
            }
          }
          
          setIsIncoming(true);
          setCallStatus('ringing');
          setCallerInfo(callerData);
          setCurrentCall({
            id: newCall.id,
            callerId: newCall.caller_id,
            callerName: callerData?.name || 'Arayan',
            callerPhone: callerData?.phone,
            callerType: newCall.caller_type,
            receiverId: newCall.receiver_id,
            receiverType: newCall.receiver_type,
            status: 'ringing',
            startedAt: newCall.started_at,
          });
          callIdRef.current = newCall.id;
          
          // Zil sesi çal
          playRingtone();
        }
      )
      .subscribe((status) => {
        console.log('📞 [CallContext] Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency - subscription sadece mount'ta kurulur, içinde güncel user'ı alırız

  // =====================================================
  // SDP ANSWER DİNLEME - Arama başlatan için
  // =====================================================
  
  useEffect(() => {
    // callIdRef.current kullanmak yerine, subscription içinde GÜNCEL değeri alalım
    if (callStatus !== 'calling') return;

    console.log('📞 [CallContext] Setting up SDP answer listener...');
    
    const channel = supabase
      .channel(`call_updates_global`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
        },
        (payload) => {
          const updatedCall = payload.new as any;
          
          // Bu bizim aramımız mı? REF'ten güncel ID'yi al
          const myCurrentCallId = callIdRef.current;
          if (!myCurrentCallId || updatedCall.id !== myCurrentCallId) {
            console.log(`📞 [CallContext] Update received for call ${updatedCall.id}, but my call is ${myCurrentCallId} - ignoring`);
            return;
          }
          
          console.log('📞 [CallContext] ✅ My call updated:', updatedCall.status, 'has answer:', !!updatedCall.sdp_answer);
          
          // Arama reddedildi veya cevapsız
          if (updatedCall.status === 'rejected' || updatedCall.status === 'missed') {
            handleCallEnded(updatedCall.status);
            return;
          }
          
          // SDP Answer geldi - bağlantıyı tamamla
          if (updatedCall.sdp_answer && peerRef.current) {
            console.log('📞 [CallContext] Got SDP answer from partner, signaling peer...');
            try {
              // Peer zaten connected mı kontrol et
              if (!peerRef.current.destroyed && !peerRef.current.connected) {
                peerRef.current.signal(updatedCall.sdp_answer);
                console.log('📞 [CallContext] ✅ SDP answer signaled to peer!');
              } else {
                console.log('📞 [CallContext] Peer already connected or destroyed, skipping signal');
              }
            } catch (err) {
              console.error('📞 [CallContext] ❌ Error signaling peer:', err);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📞 [CallContext] SDP answer subscription status:', status);
      });

    return () => {
      console.log('📞 [CallContext] Removing SDP answer subscription');
      supabase.removeChannel(channel);
    };
  }, [callStatus]);

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================
  
  const playRingtone = () => {
    // Browser'da zil sesi (TODO: özel ses dosyası eklenebilir)
    try {
      const audio = new Audio('/sounds/ringtone.mp3');
      audio.loop = true;
      audio.play().catch(() => {});
      // Ringtone ref sakla - cevaplandığında durdur
      (window as any).__yolmov_ringtone = audio;
    } catch {}
  };
  
  const stopRingtone = () => {
    try {
      const audio = (window as any).__yolmov_ringtone;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        delete (window as any).__yolmov_ringtone;
      }
    } catch {}
  };
  
  const startDurationTimer = () => {
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);
  };
  
  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };
  
  const cleanupCall = async () => {
    // 🎙️ KAYDI DURDUR ve Supabase'e yükle
    if (isRecording) {
      try {
        console.log('🎙️ [CallContext] Stopping recording and uploading...');
        const result = await stopCallRecording();
        if (result) {
          console.log('🎙️ [CallContext] Recording uploaded:', result.storagePath);
        }
      } catch (err) {
        console.warn('🎙️ [CallContext] Recording stop error:', err);
      }
      setIsRecording(false);
      setRecordingState(null);
    }
    
    // Peer bağlantısını kapat
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    // Media stream'i durdur
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Zil sesini durdur
    stopRingtone();
    
    // Timer'ı durdur
    stopDurationTimer();
    
    // State'leri sıfırla
    setCallStatus('idle');
    setIsIncoming(false);
    setCurrentCall(null);
    setCallerInfo(null);
    setError(null);
    setIsMuted(false);
    setCallDuration(0);
    callIdRef.current = null;
  };
  
  const handleCallEnded = async (reason: string) => {
    console.log('📞 [CallContext] Call ended:', reason);
    await cleanupCall();
    setCallStatus('ended');
    
    // 2 saniye sonra idle'a dön
    setTimeout(() => {
      setCallStatus('idle');
    }, 2000);
  };

  // =====================================================
  // ARAMA BAŞLAT (Müşteri → Partner)
  // Üye girişi gerektirmez - anonim kullanıcılar da arayabilir
  // Partner aramayı cevaplayınca 1 kredi düşer
  // =====================================================
  
  const startCall = async (receiverId: string, receiverType: 'customer' | 'partner' | 'admin' = 'partner') => {
    const user = getCurrentUser(); // Her zaman bir user döner (anonim dahil)
    
    try {
      setCallStatus('calling');
      setError(null);
      
      console.log('📞 [CallContext] Starting call to:', receiverId);
      
      // 1. Mikrofon izni al
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      localStreamRef.current = stream;
      
      // Local audio'yu bağla (muted - kendi sesimizi duymayız)
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
      }
      
      // 2. WebRTC Peer oluştur (Initiator)
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });
      
      peerRef.current = peer;
      
      // 3. Signal event - SDP offer'ı veritabanına yaz
      peer.on('signal', async (data) => {
        console.log('📞 [CallContext] Got SDP offer, saving to DB...');
        
        const { data: call, error: callError } = await supabase
          .from('calls')
          .insert({
            caller_id: user.id,
            caller_type: user.type,
            receiver_id: receiverId,
            receiver_type: receiverType,
            status: 'ringing',
            sdp_offer: data,
          })
          .select()
          .single();
          
        if (callError) {
          console.error('📞 [CallContext] Error creating call:', callError);
          setError('Arama başlatılamadı');
          cleanupCall();
          return;
        }
        
        callIdRef.current = call.id;
        setCurrentCall({
          id: call.id,
          callerId: user.id,
          callerName: user.name,
          callerType: user.type,
          receiverId: receiverId,
          receiverType: receiverType,
          status: 'calling',
          startedAt: call.started_at,
        });
        
        // Partner'a push notification gönder (offline olsa bile ulaşsın)
        if (receiverType === 'partner') {
          console.log('🔔 [CallContext] Sending push notification to partner:', receiverId);
          try {
            await fetch('/api/send-call-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                partnerId: receiverId,
                callerName: user.name || 'Müşteri',
                callerPhone: user.phone || '',
                callId: call.id,
              }),
            });
            console.log('✅ [CallContext] Push notification sent');
          } catch (pushError) {
            console.warn('⚠️ [CallContext] Push notification failed:', pushError);
            // Push hatası aramayı durdurmaz, devam et
          }
        }
      });
      
      // 4. Bağlantı kuruldu
      peer.on('connect', () => {
        console.log('📞 [CallContext] Peer connected!');
        setCallStatus('connected');
        startDurationTimer();
        
        // DB'yi güncelle
        if (callIdRef.current) {
          supabase
            .from('calls')
            .update({ 
              status: 'connected',
              connected_at: new Date().toISOString()
            })
            .eq('id', callIdRef.current)
            .then(() => {});
        }
      });
      
      // 5. Karşı tarafın sesini al ve KAYIT BAŞLAT
      peer.on('stream', (remoteStream) => {
        console.log('📞 [CallContext] Got remote stream');
        remoteStreamRef.current = remoteStream;
        
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
        
        // 🎙️ ÇİFT AKIŞ KAYIT: HD görüşme + Opus arşiv
        // Görüşme bağlandığında kayıt başlat
        if (localStreamRef.current && callIdRef.current) {
          console.log('🎙️ [CallContext] Starting call recording...');
          startCallRecording(
            localStreamRef.current,
            remoteStream,
            {
              callId: callIdRef.current,
              callerId: user.id,
              callerType: user.type,
              callerName: user.name,
              receiverId: receiverId,
              receiverType: receiverType,
              receiverName: 'Partner', // TODO: Partner ismini al
            }
          ).then((recordingId) => {
            if (recordingId) {
              setIsRecording(true);
              setRecordingState(getRecordingState());
              console.log('🎙️ [CallContext] Recording started:', recordingId);
            }
          }).catch((err) => {
            console.warn('🎙️ [CallContext] Recording failed to start:', err);
          });
        }
      });
      
      // 6. Hata
      peer.on('error', (err) => {
        console.error('📞 [CallContext] Peer error:', err);
        setError('Bağlantı hatası');
        handleCallEnded('error');
      });
      
      // 7. Bağlantı kapandı
      peer.on('close', () => {
        console.log('📞 [CallContext] Peer closed');
        handleCallEnded('peer_closed');
      });
      
      // 30 saniye cevapsız timeout
      setTimeout(() => {
        if (callStatus === 'calling' && callIdRef.current) {
          console.log('📞 [CallContext] Call timeout - no answer');
          supabase
            .from('calls')
            .update({ status: 'missed', ended_at: new Date().toISOString() })
            .eq('id', callIdRef.current)
            .then(() => {});
          handleCallEnded('timeout');
        }
      }, 30000);
      
    } catch (err: any) {
      console.error('📞 [CallContext] Error starting call:', err);
      setError(err.message || 'Mikrofon erişimi reddedildi');
      cleanupCall();
    }
  };

  // =====================================================
  // ARAMAYI CEVAPLA (Partner)
  // Partner aramayı cevapladığında 1 kredi düşer
  // =====================================================
  
  const answerCall = async () => {
    if (!callIdRef.current || !currentCall) {
      setError('Geçersiz arama');
      return;
    }
    
    const user = getCurrentUser();
    
    // Partner için kredi kontrolü
    if (user?.type === 'partner' && !user.isAnonymous) {
      try {
        // Mevcut kredi bakiyesini kontrol et
        const { data: creditData } = await supabase
          .from('partner_credits')
          .select('balance')
          .eq('partner_id', user.id)
          .maybeSingle();
        
        const currentBalance = creditData?.balance || 0;
        
        if (currentBalance < 1) {
          setError('Yetersiz kredi! Aramayı cevaplayabilmek için en az 1 krediniz olmalı.');
          // Aramayı reddet (yetersiz bakiye)
          await supabase
            .from('calls')
            .update({ 
              status: 'rejected',
              ended_at: new Date().toISOString(),
              end_reason: 'insufficient_credits'
            })
            .eq('id', callIdRef.current);
          cleanupCall();
          return;
        }
        
        console.log('💰 [CallContext] Partner has', currentBalance, 'credits, deducting 1...');
        
        // 1 kredi düş
        const { error: deductError } = await supabase
          .from('partner_credits')
          .update({ 
            balance: currentBalance - 1,
            updated_at: new Date().toISOString()
          })
          .eq('partner_id', user.id);
        
        if (deductError) {
          console.error('💰 [CallContext] Credit deduction failed:', deductError);
          // Kredi düşürme başarısız olsa bile aramaya devam et (sonra düzeltilir)
        } else {
          console.log('💰 [CallContext] Credit deducted! New balance:', currentBalance - 1);
          
          // Kredi işlem kaydı oluştur
          // Partner adını bulmaya çalış
          const { data: partnerData } = await supabase
            .from('partners')
            .select('company_name')
            .eq('id', user.id)
            .single();
          
          const { error: txError } = await supabase
            .from('credit_transactions')
            .insert({
              partner_id: user.id,
              partner_name: partnerData?.company_name || 'Partner',
              amount: -1,
              type: 'usage', // 'call_answered' enum'da yok, 'usage' kullan
              balance_before: currentBalance,
              balance_after: currentBalance - 1,
              description: `Gelen arama cevaplanıp - Arayan: ${callerInfo?.name || 'Anonim'}`
            });
          
          if (txError) {
            console.error('💰 [CallContext] Credit transaction log failed:', txError);
          } else {
            console.log('💰 [CallContext] Credit transaction logged');
          }
        }
      } catch (creditError) {
        console.error('💰 [CallContext] Credit check error:', creditError);
        // Hata olsa bile aramaya devam et
      }
    }
    
    try {
      stopRingtone();
      setIsIncoming(false);
      setCallStatus('connected');
      
      console.log('📞 [CallContext] Answering call:', callIdRef.current);
      
      // 1. Mikrofon izni al
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      localStreamRef.current = stream;
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
      }
      
      // 2. Arama kaydını çek (SDP Offer için)
      const { data: callData, error: fetchError } = await supabase
        .from('calls')
        .select('*')
        .eq('id', callIdRef.current)
        .single();
        
      if (fetchError || !callData?.sdp_offer) {
        setError('Arama verisi alınamadı');
        cleanupCall();
        return;
      }
      
      // 3. WebRTC Peer oluştur (Receiver)
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });
      
      peerRef.current = peer;
      
      // 4. Signal event - SDP answer'ı veritabanına yaz
      peer.on('signal', async (data) => {
        console.log('📞 [CallContext] Got SDP answer, saving to DB...');
        
        await supabase
          .from('calls')
          .update({ 
            sdp_answer: data, 
            status: 'connected',
            connected_at: new Date().toISOString()
          })
          .eq('id', callIdRef.current);
      });
      
      // 5. Bağlantı kuruldu
      peer.on('connect', () => {
        console.log('📞 [CallContext] Peer connected!');
        startDurationTimer();
      });
      
      // 6. Karşı tarafın sesini al ve KAYIT BAŞLAT (Partner tarafı)
      peer.on('stream', (remoteStream) => {
        console.log('📞 [CallContext] Got remote stream');
        remoteStreamRef.current = remoteStream;
        
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
        
        // 🎙️ ÇİFT AKIŞ KAYIT: Partner tarafında da kayıt başlat
        // Not: Kayıt her iki tarafta da olabilir ama biz sadece bir kopyayı saklıyoruz
        if (localStreamRef.current && callIdRef.current && currentCall) {
          console.log('🎙️ [CallContext] Starting call recording (receiver side)...');
          const user = getCurrentUser();
          startCallRecording(
            localStreamRef.current,
            remoteStream,
            {
              callId: callIdRef.current,
              callerId: currentCall.callerId,
              callerType: currentCall.callerType,
              callerName: currentCall.callerName,
              receiverId: user.id,
              receiverType: user.type,
              receiverName: user.name,
            }
          ).then((recordingId) => {
            if (recordingId) {
              setIsRecording(true);
              setRecordingState(getRecordingState());
              console.log('🎙️ [CallContext] Recording started (receiver):', recordingId);
            }
          }).catch((err) => {
            console.warn('🎙️ [CallContext] Recording failed to start:', err);
          });
        }
      });
      
      // 7. Hata
      peer.on('error', (err) => {
        console.error('📞 [CallContext] Peer error:', err);
        setError('Bağlantı hatası');
        handleCallEnded('error');
      });
      
      // 8. Bağlantı kapandı
      peer.on('close', () => {
        console.log('📞 [CallContext] Peer closed');
        handleCallEnded('peer_closed');
      });
      
      // 9. Gelen SDP Offer'ı signal et
      peer.signal(callData.sdp_offer);
      
    } catch (err: any) {
      console.error('📞 [CallContext] Error answering call:', err);
      setError(err.message || 'Mikrofon erişimi reddedildi');
      cleanupCall();
    }
  };

  // =====================================================
  // ARAMAYI ID İLE CEVAPLA (Liste'den cevaplama için)
  // =====================================================
  
  const answerCallById = async (callId: string) => {
    console.log('📞 [CallContext] answerCallById:', callId);
    
    // Call ID'yi set et
    callIdRef.current = callId;
    
    // Arama verisini çek
    const { data: callData, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();
      
    if (fetchError || !callData) {
      console.error('📞 [CallContext] Call not found:', fetchError);
      setError('Arama bulunamadı');
      return;
    }
    
    // Caller info set et
    setCallerInfo({ name: 'Arayan', phone: null });
    setCurrentCall({
      id: callData.id,
      callerId: callData.caller_id,
      callerName: 'Arayan',
      callerType: callData.caller_type,
      receiverId: callData.receiver_id,
      receiverType: callData.receiver_type,
      status: 'ringing',
      startedAt: callData.started_at,
    });
    
    // Şimdi normal answerCall çağır
    await answerCall();
  };

  // =====================================================
  // ARAMAYI ID İLE REDDET
  // =====================================================
  
  const rejectCallById = async (callId: string) => {
    console.log('📞 [CallContext] rejectCallById:', callId);
    
    await supabase
      .from('calls')
      .update({ 
        status: 'rejected',
        ended_at: new Date().toISOString(),
        end_reason: 'receiver_rejected'
      })
      .eq('id', callId);
    
    cleanupCall();
  };

  // =====================================================
  // ARAMAYI REDDET
  // =====================================================
  
  const rejectCall = async () => {
    if (!callIdRef.current) return;
    
    console.log('📞 [CallContext] Rejecting call:', callIdRef.current);
    
    stopRingtone();
    
    await supabase
      .from('calls')
      .update({ 
        status: 'rejected',
        ended_at: new Date().toISOString(),
        end_reason: 'receiver_rejected'
      })
      .eq('id', callIdRef.current);
    
    cleanupCall();
  };

  // =====================================================
  // ARAMAYI SONLANDIR
  // =====================================================
  
  const endCall = async () => {
    if (!callIdRef.current) {
      cleanupCall();
      return;
    }
    
    const user = getCurrentUser();
    console.log('📞 [CallContext] Ending call:', callIdRef.current);
    
    await supabase
      .from('calls')
      .update({ 
        status: 'ended',
        ended_at: new Date().toISOString(),
        end_reason: user?.type === 'customer' ? 'caller_ended' : 'receiver_ended',
        duration_seconds: callDuration
      })
      .eq('id', callIdRef.current);
    
    handleCallEnded('user_ended');
  };

  // =====================================================
  // SES KONTROLLERİ
  // =====================================================
  
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };
  
  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================
  
  return (
    <CallContext.Provider
      value={{
        callStatus,
        isIncoming,
        currentCall,
        callerInfo,
        error,
        startCall,
        answerCall,
        answerCallById,
        rejectCall,
        rejectCallById,
        endCall,
        isMuted,
        toggleMute,
        isSpeakerOn,
        toggleSpeaker,
        callDuration,
        localAudioRef,
        remoteAudioRef,
        isRecording, // 🎙️ Kayıt durumu
        recordingState, // 🎙️ Detaylı kayıt bilgisi
      }}
    >
      {children}
      
      {/* Görünmez Audio Elementleri */}
      <audio ref={localAudioRef} autoPlay muted playsInline style={{ display: 'none' }} />
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
    </CallContext.Provider>
  );
};

// =====================================================
// HOOK
// =====================================================

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export default CallContext;
