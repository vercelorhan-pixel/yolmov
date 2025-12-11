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
import { generateUUID } from '../utils/uuid';

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
  startCall: (receiverId: string, receiverType?: 'customer' | 'partner' | 'admin', existingCallId?: string, receiverName?: string) => Promise<void>;
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
  
  // =====================================================
  // HELPER: Çağrı tipi etiketi (log için)
  // =====================================================
  const getCallTypeLabel = (callerType: string, receiverType: string): string => {
    if (callerType === 'customer' && receiverType === 'partner') {
      return 'Customer→Partner';
    } else if (callerType === 'customer' && receiverType === 'admin') {
      return 'Customer→Support';
    } else if (callerType === 'partner' && receiverType === 'admin') {
      return 'Partner→Support';
    } else {
      return `${callerType}→${receiverType}`;
    }
  };
  
  // =====================================================
  // SAYFA YENİLEME ENGELLEME - Çağrı sırasında
  // =====================================================
  
  useEffect(() => {
    // Çağrı aktifse (calling, ringing, connected) sayfa yenilemeyi engelle
    const isCallActive = callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connected';
    
    if (isCallActive) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Aktif bir görüşmeniz var. Sayfayı kapatırsanız görüşme sonlanacak.';
        return e.returnValue;
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      console.log('🔒 [CallContext] Page reload protection enabled');
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        console.log('🔓 [CallContext] Page reload protection disabled');
      };
    }
  }, [callStatus]);
  
  // Mevcut kullanıcı bilgisi (admin, customer, partner veya anonim olabilir)
  const getCurrentUser = useCallback(() => {
    // Debug: Tüm localStorage durumunu logla
    const hasAdmin = !!localStorage.getItem('yolmov_admin');
    const hasPartner = !!localStorage.getItem('yolmov_partner');
    const hasCustomer = !!localStorage.getItem('yolmov_customer');
    console.log('📞 [CallContext] getCurrentUser check - admin:', hasAdmin, 'partner:', hasPartner, 'customer:', hasCustomer);
    
    // ÖNCE admin kontrol et (admin dashboard'daysa admin olarak işlem yap)
    const adminStr = localStorage.getItem('yolmov_admin');
    if (adminStr) {
      try {
        const admin = JSON.parse(adminStr);
        if (admin && admin.id) {
          console.log('📞 [CallContext] getCurrentUser - Admin found:', admin.id);
          return { id: admin.id, type: 'admin' as const, name: admin.name || admin.email, email: admin.email };
        }
      } catch (e) {
        console.error('📞 [CallContext] Error parsing admin data:', e);
        // Bozuk veriyi temizle
        localStorage.removeItem('yolmov_admin');
      }
    }
    
    // Sonra partner kontrol et (partner dashboard'daysa partner olarak işlem yap)
    const partnerStr = localStorage.getItem('yolmov_partner');
    if (partnerStr) {
      try {
        const partner = JSON.parse(partnerStr);
        // partner.id veya partner.partner_id olabilir
        const partnerId = partner.id || partner.partner_id;
        if (partnerId) {
          console.log('📞 [CallContext] getCurrentUser - Partner found:', partnerId);
          return { id: partnerId, type: 'partner' as const, name: partner.company_name || partner.name, phone: partner.phone };
        }
      } catch (e) {
        console.error('📞 [CallContext] Error parsing partner data:', e);
        // Bozuk veriyi temizle
        localStorage.removeItem('yolmov_partner');
      }
    }
    
    // Sonra customer kontrol et
    const customerStr = localStorage.getItem('yolmov_customer');
    if (customerStr) {
      try {
        const customer = JSON.parse(customerStr);
        if (customer && customer.id) {
          console.log('📞 [CallContext] getCurrentUser - Customer found:', customer.id);
          return { id: customer.id, type: 'customer' as const, name: customer.name, phone: customer.phone };
        }
      } catch (e) {
        console.error('📞 [CallContext] Error parsing customer data:', e);
        // Bozuk veriyi temizle
        localStorage.removeItem('yolmov_customer');
      }
    }
    
    // Anonim kullanıcı için geçici ID oluştur (üye girişi gerektirmez)
    let anonymousId = localStorage.getItem('yolmov_anonymous_caller_id');
    if (!anonymousId) {
      anonymousId = 'anon_' + generateUUID();
      localStorage.setItem('yolmov_anonymous_caller_id', anonymousId);
    }
    console.log('📞 [CallContext] getCurrentUser - Anonymous:', anonymousId);
    return { id: anonymousId, type: 'customer' as const, name: 'Anonim Arayan', isAnonymous: true };
  }, []);

  // =====================================================
  // REALTIME SUBSCRIPTION - Gelen Aramalar
  // =====================================================
  
  useEffect(() => {
    // ⚠️ KRITIK: CallContext artık SADECE ADMIN kullanıcılar için çalışacak!
    // Partner ve Customer için yeni izole context'ler kullanılıyor:
    // - CustomerToPartnerCallContext
    // - CustomerToSupportCallContext  
    // - PartnerToSupportCallContext
    
    const isAdminUser = (() => {
      try {
        const adminData = localStorage.getItem('yolmov_admin');
        return !!adminData;
      } catch {
        return false;
      }
    })();
    
    if (!isAdminUser) {
      console.log('📞 [CallContext] Skipping - only active for ADMIN users. Partners/Customers use isolated contexts.');
      return;
    }
    
    // Kullanıcı bilgisini subscription kurulmadan önce al
    const currentUser = getCurrentUser();
    if (!currentUser?.id) {
      console.log('📞 [CallContext] No user found, skipping realtime subscription');
      return;
    }
    
    console.log('📞 [CallContext] Setting up realtime subscription for ADMIN user:', currentUser.id, 'type:', currentUser.type);
    
    // Filtrelenmiş channel - SADECE bu kullanıcıya gelen aramaları dinle
    // NOT: Supabase Realtime filter birden fazla kolon desteklemiyor, 
    // bu yüzden receiver_type kontrolünü callback içinde yapıyoruz
    const channel = supabase
      .channel(`calls_incoming_${currentUser.id}_${currentUser.type}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        async (payload) => {
          const newCall = payload.new as any;
          
          // 🛡️ GÜVENLİK KONTROLÜ 1: receiver_id eşleşmeli
          if (newCall.receiver_id !== currentUser.id) {
            console.log('📞 [CallContext] Call receiver_id mismatch, ignoring');
            return;
          }
          
          // 🛡️ GÜVENLİK KONTROLÜ 2: receiver_type da eşleşmeli!
          // Bu, Partner'ın Admin çağrısını veya Admin'in Partner çağrısını almasını engeller
          if (newCall.receiver_type !== currentUser.type) {
            console.log('📞 [CallContext] Call receiver_type mismatch:', newCall.receiver_type, '!==', currentUser.type, '- ignoring');
            return;
          }
          
          // Sadece 'ringing' durumundaki aramaları al
          if (newCall.status !== 'ringing') return;
          
          // 📝 Çağrı tipine göre log prefix belirle
          const callTypeLabel = getCallTypeLabel(newCall.caller_type, newCall.receiver_type);
          console.log(`📞 [${callTypeLabel}] Incoming call FOR ME!`, newCall.id);
          
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
  
  // SDP answer polling ref - subscription yedeği olarak
  const sdpPollingRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // callIdRef.current kullanmak yerine, subscription içinde GÜNCEL değeri alalım
    if (callStatus !== 'calling') return;
    
    const currentCallId = callIdRef.current;
    if (!currentCallId) {
      console.log('📞 [CallContext] No call ID yet, waiting...');
      return;
    }

    console.log('📞 [CallContext] Setting up SDP answer listener for call:', currentCallId);
    
    // Unique channel ID - her arama için farklı
    const channelId = `call_answer_${currentCallId}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${currentCallId}`
        },
        (payload) => {
          const updatedCall = payload.new as any;
          
          console.log('📞 [CallContext] ✅ My call updated:', updatedCall.status, 'has answer:', !!updatedCall.sdp_answer);
          
          // Arama reddedildi veya cevapsız
          if (updatedCall.status === 'rejected' || updatedCall.status === 'missed') {
            handleCallEnded(updatedCall.status);
            return;
          }
          
          // SDP Answer geldi - bağlantıyı tamamla
          if (updatedCall.sdp_answer && peerRef.current) {
            console.log('📞 [CallContext] Got SDP answer, signaling peer...');
            console.log('📞 [CallContext] Peer state - destroyed:', peerRef.current.destroyed, 'connected:', peerRef.current.connected);
            try {
              // Peer destroyed olmamalı - connected kontrolü GEREKSIZ (henüz signal edilmedi!)
              if (!peerRef.current.destroyed) {
                console.log('📞 [CallContext] 🔥 Signaling SDP answer to peer NOW...');
                peerRef.current.signal(updatedCall.sdp_answer);
                console.log('📞 [CallContext] ✅ SDP answer signaled successfully!');
                
                // Polling'i durdur
                if (sdpPollingRef.current) {
                  clearInterval(sdpPollingRef.current);
                  sdpPollingRef.current = null;
                  console.log('📞 [CallContext] Polling stopped');
                }
              } else {
                console.error('📞 [CallContext] ❌ Peer already destroyed, cannot signal!');
              }
            } catch (err) {
              console.error('📞 [CallContext] ❌ Error signaling peer:', err);
            }
          } else {
            console.warn('📞 [CallContext] ⚠️ Cannot signal - answer:', !!updatedCall.sdp_answer, 'peer:', !!peerRef.current);
          }
        }
      )
      .subscribe((status) => {
        console.log('📞 [CallContext] SDP answer subscription status:', status);
      });

    // FALLBACK: Polling mekanizması - subscription çalışmazsa 2sn'de bir kontrol et
    const pollForAnswer = async () => {
      if (!currentCallId || callStatus !== 'calling') return;
      
      try {
        const { data } = await supabase
          .from('calls')
          .select('sdp_answer, status')
          .eq('id', currentCallId)
          .single();
        
        if (data?.status === 'rejected' || data?.status === 'missed') {
          handleCallEnded(data.status);
          return;
        }
        
        if (data?.sdp_answer && peerRef.current && !peerRef.current.destroyed) {
          console.log('📞 [CallContext] 🔄 Polling found SDP answer, signaling peer...');
          peerRef.current.signal(data.sdp_answer);
          console.log('📞 [CallContext] ✅ SDP answer signaled via polling!');
          
          // Polling'i durdur
          if (sdpPollingRef.current) {
            clearInterval(sdpPollingRef.current);
            sdpPollingRef.current = null;
          }
        }
      } catch (err) {
        console.warn('📞 [CallContext] Polling error:', err);
      }
    };
    
    // 2 saniyede bir poll et
    sdpPollingRef.current = setInterval(pollForAnswer, 2000);
    // İlk poll hemen yap
    setTimeout(pollForAnswer, 500);

    return () => {
      console.log('📞 [CallContext] Removing SDP answer subscription');
      supabase.removeChannel(channel);
      
      // Polling'i temizle
      if (sdpPollingRef.current) {
        clearInterval(sdpPollingRef.current);
        sdpPollingRef.current = null;
      }
    };
  }, [callStatus]);

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================
  
  /**
   * Safari uyumlu Audio oynatma helper
   * Safari, kullanıcı etkileşimi olmadan ses çalmayı engelleyebilir
   */
  const createSafariCompatibleAudio = (src: string): HTMLAudioElement => {
    const audio = new Audio();
    
    // Safari için webkit prefix
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    
    // Preload ve format
    audio.preload = 'auto';
    
    // WAV ve MP3 desteği - Safari WAV'ı tercih eder
    const extension = src.split('.').pop()?.toLowerCase();
    if (extension === 'wav') {
      audio.src = src;
    } else {
      // MP3 fallback
      audio.src = src;
    }
    
    return audio;
  };

  /**
   * Partner için gelen arama zil sesi
   * mixkit-happy-bells-notification-937.wav
   */
  const playRingtone = () => {
    try {
      // Safari uyumlu audio oluştur
      const audio = createSafariCompatibleAudio('/sounds/mixkit-happy-bells-notification-937.wav');
      audio.loop = true;
      audio.volume = 1.0;
      
      // Safari için user gesture sonrası başlatma
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('🔊 [CallContext] Ringtone autoplay blocked (Safari?):', err.message);
          // Safari engellerse, bir sonraki user gesture'da tekrar dene
          document.addEventListener('click', function playOnClick() {
            audio.play().catch(() => {});
            document.removeEventListener('click', playOnClick);
          }, { once: true });
        });
      }
      
      // Ringtone ref sakla - cevaplandığında durdur
      (window as any).__yolmov_ringtone = audio;
      console.log('🔊 [CallContext] Ringtone started (partner incoming call)');
    } catch (err) {
      console.warn('🔊 [CallContext] Ringtone error:', err);
    }
  };
  
  const stopRingtone = () => {
    try {
      const audio = (window as any).__yolmov_ringtone;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = ''; // Safari memory cleanup
        delete (window as any).__yolmov_ringtone;
        console.log('🔊 [CallContext] Ringtone stopped');
      }
    } catch {}
  };

  /**
   * Müşteri için çağrı beklerken çalan ses
   * mixkit-magic-marimba-2820.wav - çağrı cevaplanana kadar loop
   */
  const playWaitingTone = () => {
    try {
      const audio = createSafariCompatibleAudio('/sounds/mixkit-magic-marimba-2820.wav');
      audio.loop = true;
      audio.volume = 0.7;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('🔊 [CallContext] Waiting tone autoplay blocked:', err.message);
        });
      }
      
      (window as any).__yolmov_waiting_tone = audio;
      console.log('🔊 [CallContext] Waiting tone started (customer calling)');
    } catch (err) {
      console.warn('🔊 [CallContext] Waiting tone error:', err);
    }
  };

  const stopWaitingTone = () => {
    try {
      const audio = (window as any).__yolmov_waiting_tone;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        delete (window as any).__yolmov_waiting_tone;
        console.log('🔊 [CallContext] Waiting tone stopped');
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
  
  // 🛡️ Çift çağrı koruması için ref
  const isCleaningUpRef = useRef(false);
  const hasEndedRef = useRef(false);
  
  const cleanupCall = async () => {
    // 🛡️ Çift çağrı koruması
    if (isCleaningUpRef.current) {
      console.log('🛡️ [CallContext] cleanupCall already in progress, skipping...');
      return;
    }
    isCleaningUpRef.current = true;
    
    console.log('🧹 [CallContext] cleanupCall started...');
    
    // 🔊 Tüm sesleri durdur
    stopRingtone();
    stopWaitingTone();
    
    // 🎙️ KAYDI DURDUR ve Supabase'e yükle
    // NOT: isRecording state yerine getRecordingState() kullan (daha güvenilir)
    const currentRecordingState = getRecordingState();
    if (currentRecordingState.isRecording || currentRecordingState.recordingId) {
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
      try {
        peerRef.current.destroy();
      } catch (e) {
        // Peer zaten kapalı olabilir
      }
      peerRef.current = null;
    }
    
    // Media stream'i durdur
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      localStreamRef.current = null;
    }
    
    // Remote stream'i temizle
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      remoteStreamRef.current = null;
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
    
    // 🛡️ Korumayı kaldır
    isCleaningUpRef.current = false;
    hasEndedRef.current = false;
    
    console.log('🧹 [CallContext] cleanupCall completed');
  };
  
  const handleCallEnded = async (reason: string) => {
    // 🛡️ Çift çağrı koruması
    if (hasEndedRef.current) {
      console.log('🛡️ [CallContext] Call already ended, ignoring:', reason);
      return;
    }
    hasEndedRef.current = true;
    
    console.log('📞 [CallContext] Call ended:', reason);
    
    // Önce status'u ended yap
    setCallStatus('ended');
    
    // Cleanup yap
    await cleanupCall();
    
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
  
  const startCall = async (receiverId: string, receiverType: 'customer' | 'partner' | 'admin' = 'partner', existingCallId?: string, receiverName?: string) => {
    const user = getCurrentUser(); // Her zaman bir user döner (anonim dahil)
    
    // 📝 Çağrı tipi etiketi (log için)
    const callTypeLabel = getCallTypeLabel(user.type, receiverType);
    
    // receiverName yoksa, receiverType'a göre varsayılan isim belirle
    const displayName = receiverName || (receiverType === 'admin' ? 'Yolmov Destek' : receiverType === 'partner' ? 'Partner' : 'Müşteri');
    
    // 🔧 CRITICAL FIX: Eğer mevcut call ID varsa, HER ŞEYDEN ÖNCE ref'i set et!
    // Bu olmadan signal event'i geldiğinde yeni kayıt oluşturulur ve çift call olur
    if (existingCallId) {
      callIdRef.current = existingCallId;
      console.log(`📞 [${callTypeLabel}] ✅ Using EXISTING call ID (queue):`, existingCallId);
    } else {
      console.log(`📞 [${callTypeLabel}] No existing call ID - will create NEW record`);
    }
    
    try {
      setCallStatus('calling');
      setError(null);
      
      // Hemen currentCall'ı set et - UI'da doğru isim görünsün (SDP offer'ı bekleme)
      setCurrentCall({
        id: existingCallId || '',
        callerId: user.id,
        callerName: user.name,
        callerType: user.type as 'customer' | 'partner' | 'admin',
        receiverId: receiverId,
        receiverName: displayName,
        receiverType: receiverType,
        status: 'calling',
        startedAt: new Date().toISOString(),
      });
      
      console.log(`📞 [${callTypeLabel}] Starting call to:`, receiverId, 'displayName:', displayName);
      
      // 2. Mikrofon izni al
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      localStreamRef.current = stream;
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
      }
      
      // 🔊 1. KAYIT UYARISI SESİNİ OYNAT - Kullanıcı mikrofon izninden sonra duyar
      // Kalite standartları gereği görüşme öncesi kullanıcıya bilgi verilmeli
      console.log(`🔊 [${callTypeLabel}] Playing call recording notice...`);
      
      try {
        // Safari uyumlu audio oluştur
        const noticeAudio = createSafariCompatibleAudio('/sounds/call-recording-notice.mp3');
        let audioLoaded = false;
        
        // 1. Önce public klasöründen dene
        try {
          await new Promise((resolve, reject) => {
            noticeAudio.oncanplaythrough = () => resolve(true);
            noticeAudio.onerror = () => reject(new Error('Local audio not found'));
            setTimeout(() => reject(new Error('Audio load timeout')), 2000);
          });
          audioLoaded = true;
          console.log('🔊 [CallContext] Notice audio loaded from /sounds/');
        } catch (localError) {
          console.log('🔊 [CallContext] Local audio not found, trying Supabase...');
          
          // 2. Supabase Storage'dan dene
          const { data: noticeData, error: noticeError } = await supabase.storage
            .from('call-recordings')
            .createSignedUrl('notice-audio.mp3', 60);
          
          if (!noticeError && noticeData?.signedUrl) {
            noticeAudio.src = noticeData.signedUrl;
            await new Promise((resolve, reject) => {
              noticeAudio.oncanplaythrough = () => resolve(true);
              noticeAudio.onerror = () => reject(new Error('Supabase audio failed'));
              setTimeout(() => reject(new Error('Supabase audio timeout')), 3000);
            });
            audioLoaded = true;
            console.log('🔊 [CallContext] Notice audio loaded from Supabase');
          }
        }
        
        if (audioLoaded) {
          await noticeAudio.play();
          console.log('🔊 [CallContext] Notice audio playing...');
          
          // Ses süresine göre bekle (max 10 saniye)
          const audioDuration = noticeAudio.duration || 9;
          const waitTime = Math.min(audioDuration * 1000, 10000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          noticeAudio.pause();
          noticeAudio.currentTime = 0;
          console.log('🔊 [CallContext] Notice audio finished');
        } else {
          // 3. FALLBACK: Web Speech API ile sesli uyarı
          console.log('🔊 [CallContext] Using Web Speech API fallback...');
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
              'Bu görüşme kalite standartları gereği kayıt altına alınmaktadır. Lütfen bekleyiniz.'
            );
            utterance.lang = 'tr-TR';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            // Konuşmayı başlat ve bitene kadar bekle
            await new Promise<void>((resolve) => {
              utterance.onend = () => resolve();
              utterance.onerror = () => resolve(); // Hata olsa da devam et
              window.speechSynthesis.speak(utterance);
              
              // Maksimum 8 saniye bekle
              setTimeout(resolve, 8000);
            });
            console.log('🔊 [CallContext] Speech synthesis finished');
          } else {
            console.warn('🔊 [CallContext] No audio system available');
            // Ses sistemi yoksa sadece 2 saniye bekle (bağlantı gecikmesini maskelemek için)
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (err) {
        console.warn('🔊 [CallContext] Notice audio failed, continuing:', err);
        // Ses çalmazsa da aramaya devam et
      }
      
      // 🔊 Müşteri için bekleme sesi başlat (çağrı cevaplanana kadar)
      playWaitingTone();
      
      // Local audio'yu bağla (muted - kendi sesimizi duymayız)
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true;
      }
      
      // 3. WebRTC Peer oluştur (Initiator)
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
      
      // 4. Signal event - SDP offer'ı veritabanına yaz
      peer.on('signal', async (data) => {
        console.log('📞 [CallContext] Got SDP offer, saving to DB...');
        
        let call: any;
        let callError: any;
        
        // Mevcut call ID varsa UPDATE, yoksa INSERT
        if (callIdRef.current) {
          console.log('📞 [CallContext] Updating existing call with SDP offer:', callIdRef.current);
          
          // Önce UPDATE yap (select olmadan)
          const updateResult = await supabase
            .from('calls')
            .update({
              sdp_offer: data,
              status: 'ringing',
            })
            .eq('id', callIdRef.current);
          
          if (updateResult.error) {
            console.error('📞 [CallContext] Update error:', updateResult.error);
            callError = updateResult.error;
          } else {
            // Sonra SELECT yap
            const selectResult = await supabase
              .from('calls')
              .select('*')
              .eq('id', callIdRef.current)
              .maybeSingle();
            
            call = selectResult.data;
            callError = selectResult.error;
          }
        } else {
          console.log('📞 [CallContext] Creating new call record...');
          const result = await supabase
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
          call = result.data;
          callError = result.error;
        }
          
        if (callError || !call) {
          console.error('📞 [CallContext] Error saving call:', callError);
          setError('Arama başlatılamadı');
          await cleanupCall();
          return;
        }
        
        callIdRef.current = call.id;
        setCurrentCall({
          id: call.id,
          callerId: user.id,
          callerName: user.name,
          callerType: user.type,
          receiverId: receiverId,
          receiverName: displayName,
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
      
      // 5. Bağlantı kuruldu
      peer.on('connect', () => {
        console.log('📞 [CallContext] Peer connected!');
        setCallStatus('connected');
        startDurationTimer();
        
        // 🔊 Çağrı cevaplandı - waiting tone'u durdur
        stopWaitingTone();
        
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
      
      // 6. Karşı tarafın sesini al ve KAYIT BAŞLAT
      peer.on('stream', (remoteStream) => {
        console.log('📞 [CallContext] Got remote stream');
        remoteStreamRef.current = remoteStream;
        
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
        
        // 🎙️ ÇİFT AKIŞ KAYIT: HD görüşme + Opus arşiv + Uyarı Sesi
        // Görüşme bağlandığında kayıt başlat (uyarı sesi de kaydedilecek)
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
      
      // 9. SDP Answer dinleme - REMOVED (duplikasyon)
      // useEffect içinde zaten SDP answer subscription var (callStatus === 'calling' ile aktif)
      // Bu kod gereksiz subscription yaratıyor ve kaldırıldı.
      // useEffect subscription hem realtime hem polling ile SDP answer'ı yakalıyor.
      
      console.log('📞 [CallContext] ✅ Peer setup complete - SDP answer via useEffect subscription');
      
      // 10. 30 saniye cevapsız timeout
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
      await cleanupCall();
    }
  };

  // =====================================================
  // ARAMAYI CEVAPLA (Partner veya Admin)
  // Partner aramayı cevapladığında 1 kredi düşer
  // Admin cevapladığında kredi düşmez
  // =====================================================
  
  const answerCall = async () => {
    if (!callIdRef.current || !currentCall) {
      setError('Geçersiz arama');
      return;
    }
    
    const user = getCurrentUser();
    
    // 📝 Çağrı tipi etiketi (log için)
    const callTypeLabel = getCallTypeLabel(currentCall.callerType, user.type);
    console.log(`📞 [${callTypeLabel}] Answering call:`, callIdRef.current);
    
    // Partner için kredi kontrolü (Customer→Partner aramasında)
    // Admin cevaplarken (Customer→Support veya Partner→Support) kredi düşmez!
    if (user?.type === 'partner' && !user.isAnonymous && currentCall.receiverType === 'partner') {
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
          await cleanupCall();
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
        await cleanupCall();
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
      await cleanupCall();
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
    
    await cleanupCall();
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
    
    await cleanupCall();
  };

  // =====================================================
  // ARAMAYI SONLANDIR
  // =====================================================
  
  const endCall = async () => {
    if (!callIdRef.current) {
      await cleanupCall();
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
