/**
 * Admin Çağrı Merkezi - Çağrı Kayıtları
 * 
 * Geçmiş tüm aramaları listeler (ended, rejected, missed).
 */

import React, { useState, useEffect } from 'react';
import { Phone, Filter, Search, Download, Calendar, Clock, CheckCircle, XCircle, PhoneMissed, Play, Pause, Volume2, Download as DownloadIcon, Mic } from 'lucide-react';
import { supabase } from '../../../services/supabase';

interface CallLog {
  id: string;
  caller_id: string;
  receiver_id: string;
  caller_type: 'customer' | 'partner' | 'admin';
  receiver_type: 'customer' | 'partner' | 'admin';
  status: 'ended' | 'rejected' | 'missed';
  started_at: string;
  ended_at?: string;
  connected_at?: string;
  end_reason?: string;
  caller_name?: string;
  receiver_name?: string;
  duration_seconds?: number;
  is_recorded?: boolean;
  recording_id?: string;
}

interface CallRecording {
  id: string;
  call_id: string;
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  duration_seconds: number;
  status: 'recording' | 'processing' | 'ready' | 'failed' | 'deleted';
  compression_ratio: number;
  play_count: number;
}

const AdminCallLogsTab: React.FC = () => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ended' | 'rejected' | 'missed'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  
  // 🎙️ Recording state
  const [recordings, setRecordings] = useState<Map<string, CallRecording>>(new Map());
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioRef] = useState<HTMLAudioElement>(new Audio());
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    ended: 0,
    rejected: 0,
    missed: 0,
    avgDuration: 0,
    recordedCalls: 0,
  });

  // 🎙️ Load recordings from database
  const loadRecordings = async (calls: CallLog[]) => {
    try {
      const recordingIds = calls.map(c => c.recording_id).filter(Boolean) as string[];
      if (recordingIds.length === 0) return;

      const { data, error } = await supabase
        .from('call_recordings')
        .select('*')
        .in('id', recordingIds)
        .eq('status', 'ready');

      if (error) throw error;

      const recordingMap = new Map<string, CallRecording>();
      (data || []).forEach((rec) => {
        recordingMap.set(rec.call_id, rec);
      });
      setRecordings(recordingMap);
    } catch (err) {
      console.error('❌ [AdminCallLogs] Load recordings error:', err);
    }
  };

  // 🎙️ Play/Pause recording
  const togglePlayRecording = async (callId: string, recordingId: string) => {
    try {
      const recording = recordings.get(callId);
      if (!recording) return;

      if (playingCallId === callId && isPlaying) {
        // Pause current
        audioRef.pause();
        setIsPlaying(false);
        return;
      }

      // Load new recording
      if (playingCallId !== callId) {
        // Get signed URL from Supabase Storage
        const { data, error } = await supabase.storage
          .from('call-recordings')
          .createSignedUrl(recording.file_path, 3600); // 1 hour expiry

        if (error) throw error;
        if (!data?.signedUrl) throw new Error('No signed URL');

        audioRef.src = data.signedUrl;
        audioRef.load();
        
        // Increment play count
        await supabase
          .from('call_recordings')
          .update({ 
            play_count: recording.play_count + 1,
            last_played_at: new Date().toISOString(),
          })
          .eq('id', recordingId);
      }

      audioRef.play();
      setPlayingCallId(callId);
      setIsPlaying(true);
    } catch (err) {
      console.error('❌ [AdminCallLogs] Play recording error:', err);
      alert('Kayıt oynatılamadı: ' + (err as Error).message);
    }
  };

  // 🎙️ Download recording
  const downloadRecording = async (callId: string) => {
    try {
      const recording = recordings.get(callId);
      if (!recording) return;

      const { data, error } = await supabase.storage
        .from('call-recordings')
        .download(recording.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = recording.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ [AdminCallLogs] Download error:', err);
      alert('Kayıt indirilemedi: ' + (err as Error).message);
    }
  };

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef;
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setPlayingCallId(null);
      setCurrentTime(0);
    };
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [audioRef]);

  const loadCallLogs = async () => {
    try {
      let query = supabase
        .from('calls')
        .select('*')
        .in('status', ['ended', 'rejected', 'missed'])
        .order('started_at', { ascending: false })
        .limit(100);

      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        if (dateFilter === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (dateFilter === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        }
        query = query.gte('started_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Load names
      const logsWithNames = await Promise.all(
        (data || []).map(async (call) => {
          let callerName = 'Bilinmeyen';
          let receiverName = 'Bilinmeyen';
          let durationSeconds = 0;

          if (call.connected_at && call.ended_at) {
            durationSeconds = Math.floor(
              (new Date(call.ended_at).getTime() - new Date(call.connected_at).getTime()) / 1000
            );
          }

          // Caller name
          if (call.caller_id.startsWith('anon_')) {
            callerName = 'Anonim Müşteri';
          } else if (call.caller_type === 'customer') {
            const { data: customer } = await supabase
              .from('customers')
              .select('first_name, last_name')
              .eq('id', call.caller_id)
              .single();
            callerName = customer ? `${customer.first_name} ${customer.last_name}` : 'Müşteri';
          } else if (call.caller_type === 'partner') {
            const { data: partner } = await supabase
              .from('partners')
              .select('company_name')
              .eq('id', call.caller_id)
              .single();
            callerName = partner?.company_name || 'Partner';
          }

          // Receiver name
          if (call.receiver_type === 'partner') {
            const { data: partner } = await supabase
              .from('partners')
              .select('company_name')
              .eq('id', call.receiver_id)
              .single();
            receiverName = partner?.company_name || 'Partner';
          } else if (call.receiver_type === 'customer') {
            const { data: customer } = await supabase
              .from('customers')
              .select('first_name, last_name')
              .eq('id', call.receiver_id)
              .single();
            receiverName = customer ? `${customer.first_name} ${customer.last_name}` : 'Müşteri';
          }

          return {
            ...call,
            caller_name: callerName,
            receiver_name: receiverName,
            duration_seconds: durationSeconds,
          };
        })
      );

      setCallLogs(logsWithNames);

      // Calculate stats
      const total = logsWithNames.length;
      const ended = logsWithNames.filter((c) => c.status === 'ended').length;
      const rejected = logsWithNames.filter((c) => c.status === 'rejected').length;
      const missed = logsWithNames.filter((c) => c.status === 'missed').length;
      const recordedCalls = logsWithNames.filter((c) => c.is_recorded).length;
      const totalDuration = logsWithNames
        .filter((c) => c.duration_seconds)
        .reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
      const avgDuration = ended > 0 ? Math.floor(totalDuration / ended) : 0;

      setStats({ total, ended, rejected, missed, avgDuration, recordedCalls });
      
      // 🎙️ Load recordings for recorded calls
      await loadRecordings(logsWithNames.filter(c => c.is_recorded && c.recording_id));
    } catch (err) {
      console.error('❌ [AdminCallLogs] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCallLogs();
  }, [dateFilter]);

  const filteredLogs = callLogs.filter((log) => {
    // Status filter
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        log.caller_name?.toLowerCase().includes(search) ||
        log.receiver_name?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ended':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle size={14} />
            Tamamlandı
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle size={14} />
            Reddedildi
          </span>
        );
      case 'missed':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
            <PhoneMissed size={14} />
            Cevapsız
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Çağrı Kayıtları</h2>
        <p className="text-slate-600 mt-1">Geçmiş tüm aramalar</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-slate-600 text-sm mb-1">Toplam Arama</div>
          <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <div className="text-green-600 text-sm mb-1">Tamamlandı</div>
          <div className="text-2xl font-bold text-green-700">{stats.ended}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <div className="text-red-600 text-sm mb-1">Reddedildi</div>
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <div className="text-orange-600 text-sm mb-1">Cevapsız</div>
          <div className="text-2xl font-bold text-orange-700">{stats.missed}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="text-blue-600 text-sm mb-1">Ort. Süre</div>
          <div className="text-2xl font-bold text-blue-700">{formatDuration(stats.avgDuration)}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
          <div className="text-purple-600 text-sm mb-1 flex items-center gap-1">
            <Mic size={14} />
            Kayıtlı
          </div>
          <div className="text-2xl font-bold text-purple-700">{stats.recordedCalls}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="İsim veya şirket ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="ended">Tamamlandı</option>
          <option value="rejected">Reddedildi</option>
          <option value="missed">Cevapsız</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as any)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">Tüm Zamanlar</option>
          <option value="today">Bugün</option>
          <option value="week">Son 7 Gün</option>
          <option value="month">Son 30 Gün</option>
        </select>
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Arayan</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Aranan</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Durum</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Süre</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Tarih</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">🎙️ Kayıt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  Kayıt bulunamadı
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const recording = recordings.get(log.id);
                const isThisPlaying = playingCallId === log.id && isPlaying;
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">{log.caller_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">{log.receiver_name}</td>
                    <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                      {log.duration_seconds ? formatDuration(log.duration_seconds) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(log.started_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      {log.is_recorded && recording ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => togglePlayRecording(log.id, recording.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isThisPlaying
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={isThisPlaying ? 'Duraklat' : 'Oynat'}
                          >
                            {isThisPlaying ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <button
                            onClick={() => downloadRecording(log.id)}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            title="İndir"
                          >
                            <DownloadIcon size={16} />
                          </button>
                          <div className="text-xs text-slate-500">
                            {(recording.file_size_bytes / 1024 / 1024).toFixed(1)} MB
                          </div>
                        </div>
                      ) : log.is_recorded ? (
                        <span className="text-xs text-orange-600">İşleniyor...</span>
                      ) : (
                        <span className="text-xs text-slate-400">Kayıt yok</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 🎙️ Global Audio Player (şu an oynatılan) */}
      {playingCallId && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="text-purple-600" size={20} />
              <div className="text-sm font-semibold text-slate-800">Kayıt Oynatıcı</div>
            </div>
            <button
              onClick={() => {
                audioRef.pause();
                setPlayingCallId(null);
                setIsPlaying(false);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
          
          {(() => {
            const log = callLogs.find(c => c.id === playingCallId);
            const recording = recordings.get(playingCallId);
            if (!log || !recording) return null;
            
            return (
              <>
                <div className="text-xs text-slate-600 mb-3">
                  <div className="font-medium">{log.caller_name} → {log.receiver_name}</div>
                  <div className="text-slate-400">{new Date(log.started_at).toLocaleString('tr-TR')}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePlayRecording(playingCallId, recording.id)}
                      className="p-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max={audioRef.duration || 0}
                        value={currentTime}
                        onChange={(e) => {
                          audioRef.currentTime = parseFloat(e.target.value);
                        }}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      {formatDuration(Math.floor(currentTime))} / {formatDuration(recording.duration_seconds)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Opus {(recording.compression_ratio).toFixed(1)}x sıkıştırma</span>
                    <span>{recording.play_count} kez dinlendi</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AdminCallLogsTab;
