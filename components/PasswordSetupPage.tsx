import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../services/supabase';

const PasswordSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'recover' | 'ready'>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('recover');
      }
    });
    // Try to mark ready if already in recovery session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus('recover');
    }).catch(() => {});
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    if (!password || password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      alert('Şifre oluşturma başarılı!');
      navigate('/partner');
    } catch (err: any) {
      setError(err.message || 'Şifre oluşturma başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Lock size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Şifre Oluştur</h1>
        </div>
        <p className="text-sm text-slate-600 mb-4">E-postanıza gelen aktivasyon bağlantısını açtınız. Lütfen yeni şifrenizi belirleyin.</p>
        {status !== 'recover' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-lg text-sm mb-4">
            Bağlantı geçerliyse otomatik olarak etkinleşir. Eğer sorun yaşıyorsanız e-postanızdaki linke yeniden tıklayın.
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Yeni Şifre</label>
            <input type="password" className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Şifre Tekrar</label>
            <input type="password" className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">
            {loading ? 'İşleniyor...' : 'Şifreyi Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordSetupPage;
