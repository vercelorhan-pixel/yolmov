import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../services/supabase';

const AdminSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !firstName || !lastName) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      // Önce serverless bootstrap (service role varsa RLS'yi aşar)
      try {
        const resp = await fetch('/api/bootstrap-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, firstName, lastName })
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data.ok) {
          setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
          setTimeout(() => navigate('/operasyon'), 1500);
          return;
        }
        console.warn('Bootstrap failed, trying client-side:', data);
      } catch (err) {
        console.warn('Bootstrap endpoint error:', err);
      }

      // 1) Client-side auth signup (anon key)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { user_type: 'admin', first_name: firstName, last_name: lastName },
        }
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error('Kullanıcı oluşturulamadı');

      // 2) Insert admin_users with super_admin role (RLS: bootstrap policy gerektirir)
      const { error: dbError } = await supabase
        .from('admin_users')
        .insert({ 
          id: userId, 
          name: `${firstName} ${lastName}`, 
          email, 
          role: 'super_admin',
          permissions: ['all']
        });
      if (dbError) throw dbError;

      setSuccess('Kayıt başarılı! Admin paneline yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/admin'), 1500);
    } catch (err: any) {
      setError(err?.message || 'Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Admin Kayıt</h1>
        <p className="text-sm text-slate-600 mb-6">İlk kayıt SUPER ADMIN yetkisiyle oluşturulacak.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2">
            <UserIcon size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Ad"
              className="w-full bg-transparent outline-none text-sm"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2">
            <UserIcon size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Soyad"
              className="w-full bg-transparent outline-none text-sm"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2">
            <Mail size={16} className="text-slate-400" />
            <input
              type="email"
              placeholder="E-posta"
              className="w-full bg-transparent outline-none text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2">
            <Lock size={16} className="text-slate-400" />
            <input
              type="password"
              placeholder="Şifre"
              className="w-full bg-transparent outline-none text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white ${loading ? 'bg-slate-300' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            {loading ? (<><Loader2 className="animate-spin" size={16} />&nbsp;Kayıt Yapılıyor...</>) : 'Kayıt Ol'}
          </button>

          <p className="text-center text-xs text-slate-400 mt-2">
            Zaten hesabınız var mı? <a className="underline" href="/admin/giris">Giriş Yap</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminSignupPage;
