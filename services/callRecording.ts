/**
 * Yolmov Voice - Çift Akış Ses Kayıt Servisi (Dual-Stream Recording)
 * 
 * MİMARİ:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                     CANLIVE GÖRÜŞME                         │
 * │              WebRTC HD Audio (48 kHz)                       │
 * │           Kullanıcı Deneyimi - Maksimum Kalite              │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    ARŞİV KAYDI                              │
 * │            Opus Codec (12-16 kbps)                          │
 * │         Maliyet Odaklı - 1 saat = ~5 MB                     │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * KAZANIM:
 * - Kullanıcı HD kalitede konuşur (gecikme/kalite kaybı yok)
 * - Arşiv %80 daha küçük boyutta saklanır
 * - 500 MB ile ~100 saat kayıt (ücretsiz tier yeterli)
 */

import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export interface RecordingOptions {
  callId: string;
  callerId: string;
  callerType: 'customer' | 'partner' | 'admin';
  callerName?: string;
  receiverId: string;
  receiverType: 'customer' | 'partner' | 'admin';
  receiverName?: string;
  requestId?: string;
}

export interface RecordingState {
  isRecording: boolean;
  recordingId?: string;
  startTime?: number;
  duration: number;
  fileSize: number;
}

export interface CallRecording {
  id: string;
  callId: string;
  callerId: string;
  callerName?: string;
  receiverId: string;
  receiverName?: string;
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  durationSeconds: number;
  status: 'recording' | 'processing' | 'ready' | 'failed' | 'deleted';
  createdAt: string;
  playCount: number;
}

// ============================================
// OPUS CODEC AYARLARI (Maliyet Optimizasyonu)
// ============================================

// Düşük bitrate = Küçük dosya = Az maliyet
// İnsan sesi için 12-16 kbps yeterli (telsiz kalitesi)
const OPUS_CONFIG = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 16000,  // 16 kbps - Telsiz/GSM kalitesi
  sampleRate: 16000,          // 16 kHz - Ses için yeterli
  channels: 1,                // Mono - Boyutu yarıya indirir
};

// Fallback MIME types (tarayıcı desteği için)
const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

// ============================================
// KAYIT YÖNETİCİSİ SINIFI
// ============================================

class CallRecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingState: RecordingState = {
    isRecording: false,
    duration: 0,
    fileSize: 0,
  };
  private options: RecordingOptions | null = null;
  private durationInterval: number | null = null;
  private startTime: number = 0;

  /**
   * Desteklenen MIME type'ı bul
   */
  private getSupportedMimeType(): string {
    for (const mimeType of SUPPORTED_MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('🎙️ [Recording] Using MIME type:', mimeType);
        return mimeType;
      }
    }
    console.warn('🎙️ [Recording] No supported MIME type found, using default');
    return '';
  }

  /**
   * Kaydı başlat
   * Her iki akışı (local + remote) birleştirerek kaydeder
   */
  async startRecording(
    localStream: MediaStream,
    remoteStream: MediaStream,
    options: RecordingOptions
  ): Promise<string | null> {
    try {
      this.options = options;
      console.log('🎙️ [Recording] Starting dual-stream recording for call:', options.callId);

      // AudioContext ile akışları birleştir
      const audioContext = new AudioContext({ sampleRate: OPUS_CONFIG.sampleRate });
      const destination = audioContext.createMediaStreamDestination();

      // Local stream (arayan)
      if (localStream.getAudioTracks().length > 0) {
        const localSource = audioContext.createMediaStreamSource(localStream);
        const localGain = audioContext.createGain();
        localGain.gain.value = 1.0;
        localSource.connect(localGain);
        localGain.connect(destination);
      }

      // Remote stream (aranan)
      if (remoteStream.getAudioTracks().length > 0) {
        const remoteSource = audioContext.createMediaStreamSource(remoteStream);
        const remoteGain = audioContext.createGain();
        remoteGain.gain.value = 1.0;
        remoteSource.connect(remoteGain);
        remoteGain.connect(destination);
      }

      // Birleştirilmiş stream
      const combinedStream = destination.stream;

      // MediaRecorder oluştur (Opus sıkıştırma ile)
      const mimeType = this.getSupportedMimeType();
      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: OPUS_CONFIG.audioBitsPerSecond,
      };
      
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      this.mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
      this.audioChunks = [];

      // Veri geldiğinde
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.recordingState.fileSize += event.data.size;
          console.log('🎙️ [Recording] Chunk received:', event.data.size, 'bytes');
        }
      };

      // Kayıt durdurulduğunda
      this.mediaRecorder.onstop = async () => {
        console.log('🎙️ [Recording] MediaRecorder stopped');
        await this.processAndUpload();
      };

      // Hata durumunda
      this.mediaRecorder.onerror = (event: any) => {
        console.error('🎙️ [Recording] Error:', event.error);
        this.handleRecordingError(event.error?.message || 'Recording error');
      };

      // DB'de kayıt oluştur
      const { data: recording, error: dbError } = await supabase
        .from('call_recordings')
        .insert({
          call_id: options.callId,
          caller_id: options.callerId,
          caller_type: options.callerType,
          caller_name: options.callerName || 'Arayan',
          receiver_id: options.receiverId,
          receiver_type: options.receiverType,
          receiver_name: options.receiverName || 'Partner',
          file_path: '', // Upload sonrası güncellenecek
          file_name: `call_${options.callId}.webm`,
          duration_seconds: 0,
          sample_rate: OPUS_CONFIG.sampleRate,
          bitrate: OPUS_CONFIG.audioBitsPerSecond,
          channels: OPUS_CONFIG.channels,
          status: 'recording',
          request_id: options.requestId || null,
        })
        .select()
        .single();

      if (dbError) {
        console.error('🎙️ [Recording] DB error:', dbError);
        return null;
      }

      // calls tablosunu güncelle
      await supabase
        .from('calls')
        .update({ 
          recording_id: recording.id,
          is_recorded: true 
        })
        .eq('id', options.callId);

      // Kaydı başlat (her 1 saniyede bir veri al)
      this.mediaRecorder.start(1000);
      this.startTime = Date.now();
      
      // Süre sayacı
      this.durationInterval = window.setInterval(() => {
        this.recordingState.duration = Math.floor((Date.now() - this.startTime) / 1000);
      }, 1000);

      this.recordingState = {
        isRecording: true,
        recordingId: recording.id,
        startTime: this.startTime,
        duration: 0,
        fileSize: 0,
      };

      console.log('🎙️ [Recording] Started successfully, recording ID:', recording.id);
      return recording.id;

    } catch (error) {
      console.error('🎙️ [Recording] Failed to start:', error);
      return null;
    }
  }

  /**
   * Kaydı durdur
   */
  async stopRecording(): Promise<{ storagePath: string; fileSize: number } | null> {
    console.log('🎙️ [Recording] Stopping...');

    // İşaretçileri temizle
    const wasRecording = this.recordingState.isRecording;
    this.recordingState.isRecording = false;

    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    // MediaRecorder'ı durdur
    if (this.mediaRecorder) {
      // Event listener'ları temizle (chunk üretmeyi durdur)
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.onerror = null;
      
      if (this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch (e) {
          console.warn('🎙️ [Recording] MediaRecorder stop error:', e);
        }
      }
      this.mediaRecorder = null;
    }
    
    // Sadece kayıt yapılıyorduysa upload et
    if (wasRecording && this.audioChunks.length > 0) {
      // 🔥 Direkt processAndUpload çağır - onstop event'ine güvenme!
      return await this.processAndUpload();
    } else {
      console.log('🎙️ [Recording] Nothing to upload');
      this.cleanup();
      return null;
    }
  }

  /**
   * Kayıt durumu
   */
  getState(): RecordingState {
    return { ...this.recordingState };
  }

  /**
   * Kaydı işle ve Supabase Storage'a yükle
   */
  private async processAndUpload(): Promise<{ storagePath: string; fileSize: number } | null> {
    if (!this.options || !this.recordingState.recordingId || this.audioChunks.length === 0) {
      console.warn('🎙️ [Recording] No data to process');
      return null;
    }

    try {
      console.log('🎙️ [Recording] Processing and uploading...');

      // Status güncelle
      await supabase
        .from('call_recordings')
        .update({ status: 'processing' })
        .eq('id', this.recordingState.recordingId);

      // Blob oluştur
      const mimeType = this.getSupportedMimeType() || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      const fileSize = audioBlob.size;
      
      // Dosya yolu oluştur (yıl/ay klasörleme)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const fileName = `call_${this.options.callId}_${Date.now()}.webm`;
      const filePath = `${year}/${month}/${fileName}`;

      console.log('🎙️ [Recording] Uploading to:', filePath, 'Size:', fileSize, 'bytes');

      // Supabase Storage'a yükle
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('call-recordings')
        .upload(filePath, audioBlob, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Sıkıştırma oranı hesapla
      // HD WAV: 48kHz * 16bit * 2ch = ~350 kbps
      // Opus: 16 kbps = ~21x sıkıştırma
      const originalSizeEstimate = this.recordingState.duration * 350000 / 8; // bytes
      const compressionRatio = originalSizeEstimate / fileSize;

      // DB güncelle
      const { error: updateError } = await supabase
        .from('call_recordings')
        .update({
          file_path: filePath,
          file_name: fileName,
          file_size_bytes: fileSize,
          duration_seconds: this.recordingState.duration,
          original_size_bytes: Math.round(originalSizeEstimate),
          compression_ratio: Math.round(compressionRatio * 100) / 100,
          status: 'ready',
        })
        .eq('id', this.recordingState.recordingId);

      if (updateError) {
        throw updateError;
      }

      console.log('🎙️ [Recording] Upload successful!');
      console.log('📊 Duration:', this.recordingState.duration, 'seconds');
      console.log('📊 File size:', Math.round(fileSize / 1024), 'KB');
      console.log('📊 Compression ratio:', compressionRatio.toFixed(1), 'x');

      // Sonucu sakla
      const result = { storagePath: filePath, fileSize };
      
      // Temizle
      this.cleanup();
      
      return result;

    } catch (error: any) {
      console.error('🎙️ [Recording] Upload failed:', error);
      await this.handleRecordingError(error.message);
      return null;
    }
  }

  /**
   * Hata durumunu işle
   */
  private async handleRecordingError(errorMessage: string): Promise<void> {
    if (this.recordingState.recordingId) {
      await supabase
        .from('call_recordings')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', this.recordingState.recordingId);
    }
    this.cleanup();
  }

  /**
   * Kaynakları temizle
   */
  private cleanup(): void {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.options = null;
    this.recordingState = {
      isRecording: false,
      duration: 0,
      fileSize: 0,
    };
  }
}

// Singleton instance
const recordingManager = new CallRecordingManager();

// ============================================
// EXPORT EDİLEN FONKSİYONLAR
// ============================================

/**
 * Çağrı kaydını başlat
 */
export async function startCallRecording(
  localStream: MediaStream,
  remoteStream: MediaStream,
  options: RecordingOptions
): Promise<string | null> {
  return recordingManager.startRecording(localStream, remoteStream, options);
}

/**
 * Çağrı kaydını durdur
 */
export async function stopCallRecording(): Promise<{ storagePath: string; fileSize: number } | null> {
  return recordingManager.stopRecording();
}

/**
 * Kayıt durumunu al
 */
export function getRecordingState(): RecordingState {
  return recordingManager.getState();
}

// ============================================
// ADMIN API FONKSİYONLARI
// ============================================

/**
 * Çağrı kayıtlarını listele (Admin)
 */
export async function getCallRecordings(options?: {
  limit?: number;
  status?: 'ready' | 'failed' | 'all';
  partnerId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<CallRecording[]> {
  try {
    let query = supabase
      .from('call_recordings')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    } else {
      query = query.limit(100);
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options?.partnerId) {
      query = query.eq('receiver_id', options.partnerId);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(r => ({
      id: r.id,
      callId: r.call_id,
      callerId: r.caller_id,
      callerName: r.caller_name,
      receiverId: r.receiver_id,
      receiverName: r.receiver_name,
      filePath: r.file_path,
      fileName: r.file_name,
      fileSizeBytes: r.file_size_bytes,
      durationSeconds: r.duration_seconds,
      status: r.status,
      createdAt: r.created_at,
      playCount: r.play_count,
    }));

  } catch (error) {
    console.error('❌ [Recording API] getCallRecordings error:', error);
    return [];
  }
}

/**
 * Kayıt dinleme URL'i al (Signed URL - 1 saat geçerli)
 */
export async function getRecordingPlaybackUrl(recordingId: string): Promise<string | null> {
  try {
    // Kayıt bilgisini al
    const { data: recording, error: fetchError } = await supabase
      .from('call_recordings')
      .select('file_path, id')
      .eq('id', recordingId)
      .single();

    if (fetchError || !recording) {
      console.error('❌ [Recording API] Recording not found:', fetchError);
      return null;
    }

    // Signed URL oluştur (1 saat geçerli)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('call-recordings')
      .createSignedUrl(recording.file_path, 3600);

    if (urlError || !urlData) {
      console.error('❌ [Recording API] Signed URL error:', urlError);
      return null;
    }

    // Play count artır
    await supabase
      .from('call_recordings')
      .update({ 
        play_count: (await supabase.from('call_recordings').select('play_count').eq('id', recordingId).single()).data?.play_count + 1 || 1,
        last_played_at: new Date().toISOString(),
      })
      .eq('id', recordingId);

    return urlData.signedUrl;

  } catch (error) {
    console.error('❌ [Recording API] getRecordingPlaybackUrl error:', error);
    return null;
  }
}

/**
 * Kayıt istatistiklerini al
 */
export async function getRecordingStats(): Promise<{
  totalRecordings: number;
  totalDurationSeconds: number;
  totalSizeBytes: number;
  avgCompressionRatio: number;
  thisMonthRecordings: number;
  thisMonthSizeBytes: number;
}> {
  try {
    const { data: allRecordings, error: allError } = await supabase
      .from('call_recordings')
      .select('duration_seconds, file_size_bytes, compression_ratio, created_at')
      .eq('status', 'ready')
      .is('deleted_at', null);

    if (allError) throw allError;

    const recordings = allRecordings || [];
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const thisMonthRecordings = recordings.filter(r => 
      r.created_at?.startsWith(thisMonth)
    );

    return {
      totalRecordings: recordings.length,
      totalDurationSeconds: recordings.reduce((sum, r) => sum + (r.duration_seconds || 0), 0),
      totalSizeBytes: recordings.reduce((sum, r) => sum + (r.file_size_bytes || 0), 0),
      avgCompressionRatio: recordings.length > 0 
        ? recordings.reduce((sum, r) => sum + (r.compression_ratio || 0), 0) / recordings.length 
        : 0,
      thisMonthRecordings: thisMonthRecordings.length,
      thisMonthSizeBytes: thisMonthRecordings.reduce((sum, r) => sum + (r.file_size_bytes || 0), 0),
    };

  } catch (error) {
    console.error('❌ [Recording API] getRecordingStats error:', error);
    return {
      totalRecordings: 0,
      totalDurationSeconds: 0,
      totalSizeBytes: 0,
      avgCompressionRatio: 0,
      thisMonthRecordings: 0,
      thisMonthSizeBytes: 0,
    };
  }
}

/**
 * Kaydı sil (soft delete)
 */
export async function deleteRecording(recordingId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('call_recordings')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString() 
      })
      .eq('id', recordingId);

    if (error) throw error;
    return true;

  } catch (error) {
    console.error('❌ [Recording API] deleteRecording error:', error);
    return false;
  }
}

export default recordingManager;
