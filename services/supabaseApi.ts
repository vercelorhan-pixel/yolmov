/**
 * YOLMOV SUPABASE API SERVICE
 * 
 * localStorage tabanlı mockApi.ts yerine gerçek Supabase PostgreSQL veritabanı kullanımı
 * 
 * ÖZELLIKLER:
 * - Gerçek zamanlı veri senkronizasyonu
 * - Row Level Security (RLS) ile güvenlik
 * - PostgreSQL ilişkisel veritabanı
 * - Dosya yükleme için Supabase Storage
 * - Auth ile kullanıcı kimlik doğrulama
 */

import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { generateUUID } from '../utils/uuid';
import type {
  Customer,
  CustomerAddress,
  CustomerNotificationPreferences,
  Notification,
  AdminUser,
  Request,
  Offer,
  CompletedJob,
  PartnerReview,
  ReviewObjection,
  PartnerDocument,
  SupportTicket,
  PartnerVehicle,
  PartnerCredit,
  CreditTransaction,
  EmptyTruckRoute,
  PartnerLeadRequest,
  ServiceAreaRequest,
  SystemLog,
  Partner,
} from '../types';

interface CustomerFavoriteRow {
  id: string;
  customer_id: string;
  partner_id: string;
  created_at: string;
  partners: {
    id: string;
    name: string;
    phone: string;
    rating?: number;
    city?: string;
    district?: string;
    service_types?: string[];
  } | null;
}

// Address row
interface CustomerAddressRow {
  id: string;
  customer_id: string;
  label: string;
  type: 'home' | 'work';
  address: string;
  city: string;
  district: string;
  created_at: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Hata yönetimi için yardımcı fonksiyon
 */
const handleError = (error: any, operation: string) => {
  console.error(`[Supabase API Error] ${operation}:`, error);
  throw new Error(`${operation} failed: ${error.message || 'Unknown error'}`);
};

/**
 * ID oluşturucu (UUID yerine kullanılabilir)
 */
const generateId = () => {
  return generateUUID();
};

/**
 * Supabase client'a mevcut kullanıcı oturumunu set eder.
 * RAW auth ile localStorage'a yazılan token'ı SDK'ya aktarır.
 * Token süresi dolmuşsa localStorage'ı temizler.
 * Hem customer hem admin session'larını destekler.
 */
const ensureAuthSession = async (): Promise<boolean> => {
  try {
    const sessionStr = localStorage.getItem('yolmov-auth-session');
    
    // Admin session'ı kontrol et (admin için farklı key kullanıyoruz)
    const adminStr = localStorage.getItem('yolmov_admin');
    
    // Partner session'ı kontrol et
    const partnerStr = localStorage.getItem('yolmov_partner');
    
    if (!sessionStr && !adminStr && !partnerStr) return false;
    
    const s = sessionStr ? JSON.parse(sessionStr) : null;
    
    // Admin session varsa, admin olarak işle
    if (adminStr) {
      // Admin için session her zaman geçerlidir (localStorage'da olduğu sürece)
      return true;
    }
    
    // Partner session varsa, partner olarak işle
    if (partnerStr) {
      // Partner için session her zaman geçerlidir (localStorage'da olduğu sürece)
      return true;
    }
    
    // Customer session kontrolü
    if (!s?.access_token || !s?.refresh_token) {
      localStorage.removeItem('yolmov-auth-session');
      return false;
    }
    
    // Token süresi dolmuş mu kontrol et
    if (s.expires_at) {
      const expiresAt = new Date(s.expires_at * 1000);
      const now = new Date();
      
      if (expiresAt <= now) {
        console.log('⏰ Session expired in ensureAuthSession, clearing...');
        localStorage.removeItem('yolmov-auth-session');
        
        // Custom event dispatch - token süresi dolduğunda Header'ı güncelle
        window.dispatchEvent(new CustomEvent('yolmov-auth-change', { 
          detail: { type: 'session-expired' } 
        }));
        
        return false;
      }
    }
    
    await supabase.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
    return true;
  } catch (e) {
    console.warn('ensureAuthSession failed', e);
    localStorage.removeItem('yolmov-auth-session');
    
    // Custom event dispatch - session hatası durumunda Header'ı güncelle
    window.dispatchEvent(new CustomEvent('yolmov-auth-change', { 
      detail: { type: 'session-error' } 
    }));
    
    return false;
  }
};

// ============================================
// AUTHENTICATION
// ============================================

export const authApi = {
  /**
   * Müşteri kaydı - Email doğrulama ile
   */
  signUpCustomer: async (email: string, password: string, customerData: Partial<Customer>) => {
    try {
      // Telefon numarası validasyonu
      if (!customerData.phone || customerData.phone.length < 10) {
        throw new Error('Telefon numarası gerekli (minimum 10 karakter)');
      }

      // 1. Auth kullanıcısı oluştur (Email confirmation otomatik gönderilir)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/email-dogrulama`,
          data: {
            user_type: 'customer',
            first_name: customerData.firstName,
            last_name: customerData.lastName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Kullanıcı oluşturulamadı');

      // 2. Customer kaydı oluştur (snake_case)
      const dbCustomer = {
        id: authData.user.id,
        first_name: customerData.firstName || '',
        last_name: customerData.lastName || '',
        phone: customerData.phone, // Artık validasyon yapıldı, kesinlikle var
        email: email,
        avatar_url: customerData.avatarUrl || null,
        city: customerData.city || null,
        district: customerData.district || null,
      };

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert(dbCustomer)
        .select()
        .single();

      if (customerError) {
        // Rollback: Auth user'ı sil
        console.error('❌ Customer insert failed, rolling back auth user:', customerError);
        await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
        
        // Detaylı hata mesajı
        if (customerError.code === '23505') {
          if (customerError.message.includes('phone')) {
            throw new Error('Bu telefon numarası zaten kayıtlı');
          }
          if (customerError.message.includes('email')) {
            throw new Error('Bu email adresi zaten kayıtlı');
          }
        }
        throw customerError;
      }

      // snake_case → camelCase dönüşümü
      const customerCamelCase: Customer = {
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        email: customer.email || undefined,
        avatarUrl: customer.avatar_url || undefined,
        city: customer.city || undefined,
        district: customer.district || undefined,
        createdAt: customer.created_at,
      };

      return { 
        user: authData.user, 
        customer: customerCamelCase,
        session: authData.session 
      };
    } catch (error) {
      handleError(error, 'Customer Sign Up');
      throw error;
    }
  },

  /**
   * Partner kaydı - Email doğrulama ile, partners tablosuna insert
   */
  signUpPartner: async (email: string, password: string, partnerData: Partial<Partner>) => {
    try {
      if (!email || !password) throw new Error('Email ve şifre gereklidir');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/email-dogrulama`,
          data: { user_type: 'partner', first_name: partnerData.first_name, last_name: partnerData.last_name }
        }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Auth kullanıcısı oluşturulamadı');

      const dbPartner = {
        id: authData.user.id,
        name: partnerData.company_name || partnerData.name || '',
        first_name: partnerData.first_name || '',
        last_name: partnerData.last_name || '',
        company_name: partnerData.company_name || '',
        tax_number: partnerData.tax_number || null,
        sector: partnerData.sector || null,
        city: partnerData.city || null,
        district: partnerData.district || null,
        phone: partnerData.phone || null,
        email: email,
        vehicle_count: partnerData.vehicle_count || 0,
        vehicle_types: partnerData.vehicle_types || null,
        service_types: partnerData.service_types || null,
        commercial_registry_url: partnerData.commercial_registry_url || null,
        vehicle_license_url: partnerData.vehicle_license_url || null,
        status: 'pending',
        rating: 0,
        completed_jobs: 0,
        credits: 0,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('partners')
        .insert(dbPartner)
        .select()
        .single();
      if (insertErr) throw insertErr;

      return { user: authData.user, partner: inserted };
    } catch (error: any) {
      console.error('❌ signUpPartner error:', error);
      throw new Error(error.message || 'Partner kaydı başarısız');
    }
  },

  /**
   * Partner giriş - email+şifre, status kontrolü
   */
  signInPartner: async (email: string, password: string) => {
    try {
      if (!email || !password) throw new Error('Email ve şifre gereklidir');
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userId = authData.user?.id;
      if (!userId) throw new Error('Kullanıcı bulunamadı');
      const { data: partner, error: pErr } = await supabase
        .from('partners')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!partner) throw new Error('Partner kaydı bulunamadı');
      if (partner.status !== 'active') {
        return { user: authData.user, session: authData.session, partner, approved: false };
      }
      // LocalStorage vb. set etmek size bağlıdır
      return { user: authData.user, session: authData.session, partner, approved: true };
    } catch (error: any) {
      console.error('❌ signInPartner error:', error);
      throw new Error(error.message || 'Partner girişi başarısız');
    }
  },

  /**
   * Partner giriş için şifresiz email sihirli link gönderimi
   */
  sendMagicLinkPartner: async (email: string) => {
    try {
      if (!email) throw new Error('Email gerekli');
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/partner`,
          data: { user_type: 'partner' }
        }
      });
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('❌ Partner magic link error:', error);
      throw new Error(error.message || 'Sihirli link gönderilemedi');
    }
  },

  /**
   * Partner aktivasyon: şifre belirleme linki gönder
   */
  sendPartnerActivationEmail: async (email: string) => {
    try {
      if (!email) throw new Error('Email gerekli');
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/sifre-olustur`
      });
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('❌ Partner activation email error:', error);
      throw new Error(error.message || 'Aktivasyon maili gönderilemedi');
    }
  },

  /**
   * Giriş yap - Email + Password
   * RAW FETCH KULLANIMI - Supabase SDK storage problemi yüzünden
   */
  signIn: async (email: string, password: string) => {
    try {
      console.log('🔐 signIn started for:', email);
      
      const authUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
      const apiKey = SUPABASE_ANON_KEY;
      
      console.log('🔐 Using RAW FETCH to Supabase auth...');
      const startTime = Date.now();
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ email, password })
      });
      
      const duration = Date.now() - startTime;
      console.log('🔐 Auth response received in', `${duration}ms`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔐 Auth failed:', errorData);
        
        if (errorData.error_description?.includes('Invalid login credentials')) {
          throw new Error('Email veya şifre hatalı');
        }
        if (errorData.error_description?.includes('Email not confirmed')) {
          throw new Error('Email adresinizi doğrulamanız gerekiyor. Lütfen mail kutunuzu kontrol edin.');
        }
        throw new Error(errorData.error_description || 'Giriş başarısız');
      }
      
      const authData = await response.json();
      console.log('🔐 Auth successful:', {
        hasAccessToken: !!authData.access_token,
        hasUser: !!authData.user,
        userId: authData.user?.id
      });
      
      if (!authData.user) {
        throw new Error('Kullanıcı bilgisi alınamadı');
      }
      
      // Session'ı manuel olarak localStorage'a kaydet
      const session = {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_in: authData.expires_in,
        expires_at: authData.expires_at,
        user: authData.user
      };
      
      localStorage.setItem('yolmov-auth-session', JSON.stringify(session));
      console.log('💾 Session saved to localStorage');
      
      // CRITICAL: Supabase SDK'ya da session'ı set et
      await supabase.auth.setSession({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token
      });
      
      // Custom event dispatch - aynı tab'da Header'ı hemen güncelle
      window.dispatchEvent(new CustomEvent('yolmov-auth-change', { 
        detail: { type: 'login', session } 
      }));
      
      // Customer kaydını kontrol et
      console.log('🔐 Checking customer record...');
      const customerResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/customers?id=eq.${authData.user.id}&select=id`,
        {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${authData.access_token}`
          }
        }
      );
      
      const customers = await customerResponse.json();
      console.log('🔐 Customer check result:', { count: customers?.length });
      
      if (!customers || customers.length === 0) {
        console.error('❌ Customer record not found');
        throw new Error('Kayıt işleminiz tamamlanmamış. Lütfen tekrar kayıt olmayı deneyin.');
      }
      
      console.log('✅ signIn successful');
      return { 
        user: authData.user, 
        session: session
      };
    } catch (error: any) {
      console.error('❌ Sign In Error:', error);
      throw error;
    }
  },

  /**
   * Admin giriş - Customer kontrolü YOK
   */
  signInAdmin: async (email: string, password: string) => {
    try {
      console.log('🔐 Admin signIn started for:', email);
      
      const authUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
      const apiKey = SUPABASE_ANON_KEY;
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error_description?.includes('Invalid login credentials')) {
          throw new Error('Email veya şifre hatalı');
        }
        if (errorData.error_description?.includes('Email not confirmed')) {
          throw new Error('Email adresinizi doğrulamanız gerekiyor. Lütfen mail kutunuzu kontrol edin.');
        }
        throw new Error(errorData.error_description || 'Giriş başarısız');
      }
      
      const authData = await response.json();
      if (!authData.user) throw new Error('Kullanıcı bilgisi alınamadı');
      
      // Session kaydet
      const session = {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_in: authData.expires_in,
        expires_at: authData.expires_at,
        user: authData.user
      };
      
      localStorage.setItem('yolmov-auth-session', JSON.stringify(session));
      
      // CRITICAL: Supabase SDK'ya da session'ı set et
      await supabase.auth.setSession({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token
      });
      
      window.dispatchEvent(new CustomEvent('yolmov-auth-change', { 
        detail: { type: 'login', session } 
      }));
      
      console.log('✅ Admin signIn successful');

      // Ensure admin_users row exists (calls serverless function with service role)
      try {
        const firstName = authData.user?.user_metadata?.first_name || 'Admin';
        const lastName = authData.user?.user_metadata?.last_name || 'User';
        const resp = await fetch('/api/bootstrap-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, firstName, lastName })
        });
        if (!resp.ok) {
          console.warn('⚠️ bootstrap-admin failed:', await resp.text().catch(() => ''));
        } else {
          console.log('✅ bootstrap-admin ensured admin_users row');
        }
      } catch (e) {
        console.warn('bootstrap-admin call error', e);
      }

      return { user: authData.user, session };
    } catch (error: any) {
      console.error('❌ Admin Sign In Error:', error);
      throw error;
    }
  },

  /**
   * Çıkış yap
   */
  signOut: async () => {
    try {
      // Manual sign out: clear local session
      localStorage.removeItem('yolmov-auth-session');
      
      // Custom event dispatch - aynı tab'da diğer bileşenleri güncelle
      window.dispatchEvent(new CustomEvent('yolmov-auth-change', { 
        detail: { type: 'logout' } 
      }));
    } catch (error) {
      handleError(error, 'Sign Out');
    }
  },

  /**
   * Mevcut kullanıcıyı getir
   */
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('❌ Get Current User Error:', error);
      return null;
    }
  },

  /**
   * Mevcut session'ı getir - Manuel localStorage okuma
   */
  getSession: async () => {
    try {
      const sessionStr = localStorage.getItem('yolmov-auth-session');
      if (!sessionStr) return null;
      
      const session = JSON.parse(sessionStr);
      
      // Token süresi dolmuş mu kontrol et
      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        console.log('⏰ Session expired, clearing...');
        localStorage.removeItem('yolmov-auth-session');
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('❌ Get Session Error:', error);
      return null;
    }
  },

  /**
   * Session state değişikliklerini dinle - Manuel storage event
   */
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'yolmov-auth-session') {
        const sessionStr = e.newValue;
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          callback('SIGNED_IN', session);
        } else {
          callback('SIGNED_OUT', null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('storage', handleStorageChange);
          }
        }
      }
    };
  },

  /**
   * Kullanıcı rolünü getir
   */
  getUserRole: async () => {
    try {
      const user = await authApi.getCurrentUser();
      if (!user) return null;
      // Önce partner kontrolü (RLS ile uyumlu, admin tablosu sorgusundan kaçınır)
      const { data: partner } = await supabase
        .from('partners')
        .select('status')
        .eq('id', user.id)
        .maybeSingle();

      if (partner) return { type: 'partner', status: (partner as any).status };

      // Customer kontrolü
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (customer) return { type: 'customer' };

      // Admin kontrolü (RLS nedeniyle 406 alırsa yok say)
      try {
        const { data: admin } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (admin) return { type: 'admin', role: (admin as any).role };
      } catch (e) {
        // ignore RLS errors for admin check in partner/customer flows
      }

      return null;
    } catch (error) {
      handleError(error, 'Get User Role');
    }
  },
};

// ============================================
// CUSTOMERS API
// ============================================

export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // snake_case → camelCase
      return (data || []).map(d => ({
        id: d.id,
        firstName: d.first_name,
        lastName: d.last_name,
        phone: d.phone,
        email: d.email,
        avatarUrl: d.avatar_url,
        city: d.city,
        district: d.district,
        createdAt: d.created_at,
      }));
    } catch (error) {
      handleError(error, 'Get All Customers');
      return [];
    }
  },

  getById: async (id: string): Promise<Customer | null> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      // snake_case → camelCase
      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        email: data.email,
        avatarUrl: data.avatar_url,
        city: data.city,
        district: data.district,
        createdAt: data.created_at,
      };
    } catch (error) {
      handleError(error, `Get Customer ${id}`);
      return null;
    }
  },

  create: async (customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
    try {
      // camelCase → snake_case dönüşümü
      const dbCustomer = {
        first_name: customer.firstName,
        last_name: customer.lastName,
        phone: customer.phone || '',
        email: customer.email || null,
        avatar_url: customer.avatarUrl || null,
        city: customer.city || null,
        district: customer.district || null,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(dbCustomer)
        .select()
        .single();

      if (error) throw error;
      
      // snake_case → camelCase dönüşümü
      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        email: data.email || undefined,
        avatarUrl: data.avatar_url || undefined,
        city: data.city || undefined,
        district: data.district || undefined,
        createdAt: data.created_at,
      };
    } catch (error) {
      handleError(error, 'Create Customer');
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    try {
      // camelCase → snake_case
      const dbUpdates: any = {};
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.district !== undefined) dbUpdates.district = updates.district;

      const { data, error } = await supabase
        .from('customers')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // snake_case → camelCase
      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        email: data.email,
        avatarUrl: data.avatar_url,
        city: data.city,
        district: data.district,
        createdAt: data.created_at,
      };
    } catch (error) {
      handleError(error, `Update Customer ${id}`);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Delete Customer ${id}`);
    }
  },
};

// (removed duplicate minimal partnersApi; using the full partnersApi below)

// ============================================
// PARTNERS API
// ============================================

export const partnersApi = {
  getAll: async (): Promise<Partner[]> => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Get All Partners');
      return [];
    }
  },

  getActive: async (): Promise<Partner[]> => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('status', 'active')
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Get Active Partners');
      return [];
    }
  },

  getById: async (id: string): Promise<Partner | null> => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, `Get Partner ${id}`);
      return null;
    }
  },

  update: async (id: string, updates: Partial<Partner>): Promise<Partner> => {
    try {
      console.log('🔄 [partnersApi.update] Updating partner:', id, updates);
      
      // Add updated_at timestamp
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const { data, error, count } = await supabase
        .from('partners')
        .update(updatesWithTimestamp)
        .eq('id', id)
        .select();

      console.log('🔄 [partnersApi.update] Result:', { data, error, count });

      if (error) {
        console.error('❌ [partnersApi.update] Error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ [partnersApi.update] No rows updated - RLS may be blocking');
        throw new Error('Partner güncellenemedi. Yetki sorunu olabilir.');
      }
      
      console.log('✅ [partnersApi.update] Success:', data[0]);
      return data[0] as Partner;
    } catch (error) {
      handleError(error, `Update Partner ${id}`);
      throw error;
    }
  },

  approve: async (id: string): Promise<Partner> => {
    return partnersApi.update(id, { status: 'active' });
  },

  suspend: async (id: string): Promise<Partner> => {
    return partnersApi.update(id, { status: 'suspended' });
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Delete Partner ${id}`);
    }
  },
};

// ============================================
// FAVORITES API
// ============================================

export const favoritesApi = {
  getByCustomerId: async (customerId: string): Promise<CustomerFavoriteRow[]> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      const { data, error } = await supabase
        .from('customer_favorites')
        .select('id, customer_id, partner_id, created_at, partners!partner_id(id, name, phone, rating, city, district, service_types)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Supabase join always returns array, we need to map to single object
      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        customer_id: item.customer_id,
        partner_id: item.partner_id,
        created_at: item.created_at,
        partners: Array.isArray(item.partners) && item.partners.length > 0 
          ? item.partners[0] 
          : null
      }));
      
      return mapped as CustomerFavoriteRow[];
    } catch (error) {
      handleError(error, 'Get Favorites');
      return [];
    }
  },
  add: async (customerId: string, partnerId: string): Promise<void> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      const { error } = await supabase
        .from('customer_favorites')
        .insert({ customer_id: customerId, partner_id: partnerId });
      if (error) throw error;
    } catch (error) {
      handleError(error, 'Add Favorite');
      throw error;
    }
  },
  remove: async (customerId: string, partnerId: string): Promise<void> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      const { error } = await supabase
        .from('customer_favorites')
        .delete()
        .eq('customer_id', customerId)
        .eq('partner_id', partnerId);
      if (error) throw error;
    } catch (error) {
      handleError(error, 'Remove Favorite');
      throw error;
    }
  }
};

// ============================================
// ADDRESSES API
// ============================================

export const addressesApi = {
  getByCustomerId: async (customerId: string): Promise<CustomerAddress[]> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: CustomerAddressRow) => ({
        id: d.id,
        customer_id: d.customer_id,
        label: d.label,
        type: d.type,
        address: d.address,
        city: d.city,
        district: d.district,
        created_at: d.created_at,
      }));
    } catch (error) {
      handleError(error, 'Get Addresses');
      return [];
    }
  },
  add: async (customerId: string, data: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at'>): Promise<CustomerAddress> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      const insertData = {
        customer_id: customerId,
        label: data.label,
        type: data.type,
        address: data.address,
        city: data.city,
        district: data.district,
      };
      const { data: row, error } = await supabase
        .from('customer_addresses')
        .insert(insertData)
        .select('*')
        .single();
      if (error) throw error;
      return {
        id: row.id,
        customer_id: row.customer_id,
        label: row.label,
        type: row.type,
        address: row.address,
        city: row.city,
        district: row.district,
        created_at: row.created_at,
      };
    } catch (error) {
      handleError(error, 'Add Address');
      throw error;
    }
  },
  remove: async (addressId: string): Promise<void> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId);
      if (error) throw error;
    } catch (error) {
      handleError(error, 'Remove Address');
      throw error;
    }
  }
};

// ============================================
// NOTIFICATIONS API
// ============================================

export const notificationsApi = {
  /**
   * Kullanıcının tüm bildirimlerini getir
   */
  getByCustomerId: async (customerId: string): Promise<Notification[]> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // snake_case → camelCase dönüşümü
      return (data || []).map(notif => ({
        id: notif.id,
        customerId: notif.customer_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        relatedId: notif.related_id,
        relatedType: notif.related_type,
        actionUrl: notif.action_url,
        createdAt: notif.created_at,
        readAt: notif.read_at,
      }));
    } catch (error) {
      handleError(error, 'Get Notifications');
      throw error;
    }
  },

  /**
   * Okunmamış bildirim sayısını getir
   */
  getUnreadCount: async (customerId: string): Promise<number> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        return 0;
      }
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('read', false);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Get Unread Count Error:', error);
      return 0;
    }
  },

  /**
   * Bildirimi okundu işaretle
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    } catch (error) {
      handleError(error, 'Mark Notification As Read');
      throw error;
    }
  },

  /**
   * Tüm bildirimleri okundu işaretle
   */
  markAllAsRead: async (customerId: string): Promise<void> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('customer_id', customerId)
        .eq('read', false);
      
      if (error) throw error;
    } catch (error) {
      handleError(error, 'Mark All Notifications As Read');
      throw error;
    }
  },

  /**
   * Yeni bildirim oluştur (genelde backend trigger'lar tarafından kullanılır)
   */
  create: async (notification: Omit<Notification, 'id' | 'createdAt' | 'readAt'>): Promise<Notification> => {
    try {
      // camelCase → snake_case dönüşümü
      const dbNotification = {
        customer_id: notification.customerId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        related_id: notification.relatedId,
        related_type: notification.relatedType,
        action_url: notification.actionUrl,
      };
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(dbNotification)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        customerId: data.customer_id,
        type: data.type,
        title: data.title,
        message: data.message,
        read: data.read,
        relatedId: data.related_id,
        relatedType: data.related_type,
        actionUrl: data.action_url,
        createdAt: data.created_at,
        readAt: data.read_at,
      };
    } catch (error) {
      handleError(error, 'Create Notification');
      throw error;
    }
  },

  /**
   * Bildirimi sil
   */
  delete: async (notificationId: string): Promise<void> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    } catch (error) {
      handleError(error, 'Delete Notification');
      throw error;
    }
  },

  /**
   * Tüm bildirimleri sil
   */
  deleteAll: async (customerId: string): Promise<void> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('customer_id', customerId);
      
      if (error) throw error;
    } catch (error) {
      handleError(error, 'Delete All Notifications');
      throw error;
    }
  },
};

// ============================================
// NOTIFICATION PREFERENCES API
// ============================================

export const notificationPreferencesApi = {
  /**
   * Müşterinin bildirim tercihlerini getir
   * Eğer kayıt yoksa, varsayılan değerlerle oluştur
   */
  getByCustomerId: async (customerId: string): Promise<CustomerNotificationPreferences> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      
      // Önce mevcut tercihleri kontrol et
      const { data, error } = await supabase
        .from('customer_notification_preferences')
        .select('*')
        .eq('customer_id', customerId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }
      
      // Eğer kayıt varsa, snake_case → camelCase dönüşümü
      if (data) {
        return {
          id: data.id,
          customerId: data.customer_id,
          emailEnabled: data.email_enabled,
          pushEnabled: data.push_enabled,
          orderUpdates: data.order_updates,
          promotions: data.promotions,
          newsletter: data.newsletter,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
      
      // Kayıt yoksa, varsayılan değerlerle oluştur
      const defaultPrefs = {
        customer_id: customerId,
        email_enabled: true,
        push_enabled: true,
        order_updates: true,
        promotions: false,
        newsletter: true,
      };
      
      const { data: newData, error: insertError } = await supabase
        .from('customer_notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      return {
        id: newData.id,
        customerId: newData.customer_id,
        emailEnabled: newData.email_enabled,
        pushEnabled: newData.push_enabled,
        orderUpdates: newData.order_updates,
        promotions: newData.promotions,
        newsletter: newData.newsletter,
        createdAt: newData.created_at,
        updatedAt: newData.updated_at,
      };
    } catch (error) {
      handleError(error, 'Get Notification Preferences');
      throw error;
    }
  },

  /**
   * Bildirim tercihlerini güncelle
   */
  update: async (
    customerId: string,
    updates: Partial<Omit<CustomerNotificationPreferences, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>
  ): Promise<CustomerNotificationPreferences> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      
      // camelCase → snake_case dönüşümü
      const dbUpdates: any = {};
      if (updates.emailEnabled !== undefined) dbUpdates.email_enabled = updates.emailEnabled;
      if (updates.pushEnabled !== undefined) dbUpdates.push_enabled = updates.pushEnabled;
      if (updates.orderUpdates !== undefined) dbUpdates.order_updates = updates.orderUpdates;
      if (updates.promotions !== undefined) dbUpdates.promotions = updates.promotions;
      if (updates.newsletter !== undefined) dbUpdates.newsletter = updates.newsletter;
      
      const { data, error } = await supabase
        .from('customer_notification_preferences')
        .update(dbUpdates)
        .eq('customer_id', customerId)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        customerId: data.customer_id,
        emailEnabled: data.email_enabled,
        pushEnabled: data.push_enabled,
        orderUpdates: data.order_updates,
        promotions: data.promotions,
        newsletter: data.newsletter,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      handleError(error, 'Update Notification Preferences');
      throw error;
    }
  },
};

// ============================================
// REQUESTS API
// ============================================

// Helper: Map TS camelCase to DB snake_case for Request
const mapRequestToDB = (request: Partial<Request>): any => {
  const dbRequest: any = {};
  if (request.customerId !== undefined) dbRequest.customer_id = request.customerId;
  if (request.customerName !== undefined) dbRequest.customer_name = request.customerName;
  if (request.serviceType !== undefined) dbRequest.service_type = request.serviceType;
  if (request.description !== undefined) dbRequest.description = request.description;
  if (request.fromLocation !== undefined) dbRequest.from_location = request.fromLocation;
  if (request.toLocation !== undefined) dbRequest.to_location = request.toLocation;
  if (request.vehicleInfo !== undefined) dbRequest.vehicle_info = request.vehicleInfo;
  if (request.status !== undefined) dbRequest.status = request.status;
  if (request.amount !== undefined) dbRequest.amount = request.amount;
  if (request.jobStage !== undefined) dbRequest.job_stage = request.jobStage;
  if (request.assignedPartnerId !== undefined) dbRequest.assigned_partner_id = request.assignedPartnerId;
  if (request.assignedPartnerName !== undefined) dbRequest.assigned_partner_name = request.assignedPartnerName;
  if (request.stageUpdatedAt !== undefined) dbRequest.stage_updated_at = request.stageUpdatedAt;
  if (request.vehicleCondition !== undefined) dbRequest.vehicle_condition = request.vehicleCondition;
  if (request.hasLoad !== undefined) dbRequest.has_load = request.hasLoad;
  if (request.loadDescription !== undefined) dbRequest.load_description = request.loadDescription;
  if (request.damagePhotoUrls !== undefined) dbRequest.damage_photo_urls = request.damagePhotoUrls;
  if (request.timing !== undefined) dbRequest.timing = request.timing;
  if (request.customerPhone !== undefined) dbRequest.customer_phone = request.customerPhone;
  if (request.fromCoordinates !== undefined) dbRequest.from_coordinates = request.fromCoordinates;
  if (request.toCoordinates !== undefined) dbRequest.to_coordinates = request.toCoordinates;
  if (request.archived !== undefined) dbRequest.archived = request.archived;
  if (request.archivedAt !== undefined) dbRequest.archived_at = request.archivedAt;
  
  // Proof photos (partner iş kanıtları)
  if ((request as any).start_proof_photo !== undefined) dbRequest.start_proof_photo = (request as any).start_proof_photo;
  if ((request as any).end_proof_photo !== undefined) dbRequest.end_proof_photo = (request as any).end_proof_photo;
  
  return dbRequest;
};

// Helper: Map DB snake_case to TS camelCase for Request
const mapRequestFromDB = (dbRequest: any): Request => ({
  id: dbRequest.id,
  customerId: dbRequest.customer_id,
  customerName: dbRequest.customer_name,
  serviceType: dbRequest.service_type,
  description: dbRequest.description,
  fromLocation: dbRequest.from_location,
  toLocation: dbRequest.to_location,
  vehicleInfo: dbRequest.vehicle_info,
  status: dbRequest.status,
  createdAt: dbRequest.created_at,
  amount: dbRequest.amount,
  jobStage: dbRequest.job_stage,
  assignedPartnerId: dbRequest.assigned_partner_id,
  assignedPartnerName: dbRequest.assigned_partner_name,
  stageUpdatedAt: dbRequest.stage_updated_at,
  vehicleCondition: dbRequest.vehicle_condition,
  hasLoad: dbRequest.has_load,
  loadDescription: dbRequest.load_description,
  damagePhotoUrls: dbRequest.damage_photo_urls,
  timing: dbRequest.timing,
  customerPhone: dbRequest.customer_phone,
  fromCoordinates: dbRequest.from_coordinates,
  toCoordinates: dbRequest.to_coordinates,
  archived: dbRequest.archived,
  archivedAt: dbRequest.archived_at,
});

export const requestsApi = {
  getAll: async (): Promise<Request[]> => {
    try {
      // Admin veya customer session'ı olabilir - kontrol etmeyelim
      await ensureAuthSession();
      
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRequestFromDB);
    } catch (error) {
      handleError(error, 'Get All Requests');
      return [];
    }
  },

  getByCustomerId: async (customerId: string, includeArchived = false): Promise<Request[]> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      let query = supabase
        .from('requests')
        .select('*')
        .eq('customer_id', customerId);

      // Varsayılan olarak arşivlenenleri gösterme
      if (!includeArchived) {
        query = query.or('archived.is.null,archived.eq.false');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRequestFromDB);
    } catch (error) {
      handleError(error, `Get Requests for Customer ${customerId}`);
      return [];
    }
  },

  getByPartnerId: async (partnerId: string): Promise<Request[]> => {
    try {
      // Partner API - Session kontrolü yok (localStorage kullanılıyor)
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('assigned_partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRequestFromDB);
    } catch (error) {
      handleError(error, `Get Requests for Partner ${partnerId}`);
      return [];
    }
  },

  getOpen: async (): Promise<Request[]> => {
    try {
      // Public API - Session kontrolü yok (hem customer hem partner kullanıyor)
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRequestFromDB);
    } catch (error) {
      handleError(error, 'Get Open Requests');
      return [];
    }
  },

  /**
   * Partner'ın hizmet bölgelerine göre filtrelenmiş açık talepleri getir
   * fromLocation alanındaki şehir bilgisine göre filtreleme yapar
   * @param serviceAreaCities - Partner'ın hizmet verdiği şehirler (örn: ["İstanbul", "Ankara"])
   */
  getOpenByServiceAreas: async (serviceAreaCities: string[]): Promise<Request[]> => {
    try {
      if (!serviceAreaCities || serviceAreaCities.length === 0) {
        console.warn('⚠️ [getOpenByServiceAreas] No service area cities provided, returning all open requests');
        return requestsApi.getOpen();
      }

      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allRequests = (data || []).map(mapRequestFromDB);
      
      // fromLocation'dan şehir bilgisini çıkart ve filtrele
      // Format genelde: "İstanbul, Kadıköy" veya "Ankara / Çankaya" veya "İzmir Konak" gibi
      const filteredRequests = allRequests.filter((req: Request) => {
        if (!req.fromLocation) return false;
        
        // Şehir adını normalize et ve fromLocation içinde ara
        const fromLocationLower = req.fromLocation.toLowerCase()
          .replace(/ı/g, 'i')
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c');
        
        return serviceAreaCities.some(city => {
          const cityLower = city.toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c');
          
          // Şehir adı fromLocation'da var mı kontrol et
          // "İstanbul, Kadıköy" → "istanbul, kadikoy" içinde "istanbul" ara
          return fromLocationLower.includes(cityLower);
        });
      });
      
      console.log(`🔍 [getOpenByServiceAreas] Filtered ${allRequests.length} → ${filteredRequests.length} requests for cities:`, serviceAreaCities);
      return filteredRequests;
    } catch (error) {
      handleError(error, 'Get Open Requests by Service Areas');
      return [];
    }
  },

  getById: async (id: string): Promise<Request | null> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? mapRequestFromDB(data) : null;
    } catch (error) {
      handleError(error, `Get Request ${id}`);
      return null;
    }
  },

  create: async (request: Omit<Request, 'id' | 'createdAt'>): Promise<Request> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      const dbRequest = mapRequestToDB(request);
      const { data, error } = await supabase
        .from('requests')
        .insert(dbRequest)
        .select()
        .single();

      if (error) throw error;
      return mapRequestFromDB(data);
    } catch (error) {
      handleError(error, 'Create Request');
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Request>): Promise<Request> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }
      const dbUpdates = mapRequestToDB(updates);
      const { data, error } = await supabase
        .from('requests')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapRequestFromDB(data);
    } catch (error) {
      handleError(error, `Update Request ${id}`);
      throw error;
    }
  },

  updateStatus: async (id: string, status: Request['status']): Promise<Request> => {
    return requestsApi.update(id, { status });
  },

  updateJobStage: async (
    id: string,
    jobStage: 0 | 1 | 2 | 3 | 4,
    assignedPartnerId?: string,
    assignedPartnerName?: string
  ): Promise<Request> => {
    return requestsApi.update(id, {
      jobStage,
      assignedPartnerId,
      assignedPartnerName,
      stageUpdatedAt: new Date().toISOString(),
    });
  },

  assignPartner: async (
    requestId: string,
    partnerId: string,
    partnerName: string
  ): Promise<Request> => {
    return requestsApi.update(requestId, {
      assignedPartnerId: partnerId,
      assignedPartnerName: partnerName,
      status: 'matched',
      jobStage: 0,
      stageUpdatedAt: new Date().toISOString(),
    });
  },

  delete: async (id: string): Promise<void> => {
    try {
      await ensureAuthSession();
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Delete Request ${id}`);
      throw error;
    }
  },

  /**
   * Talebi arşivle (soft delete)
   */
  archive: async (id: string): Promise<Request> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }

      return requestsApi.update(id, {
        archived: true,
        archivedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleError(error, `Archive Request ${id}`);
      throw error;
    }
  },

  /**
   * Talebi arşivden çıkar
   */
  unarchive: async (id: string): Promise<Request> => {
    try {
      const hasSession = await ensureAuthSession();
      if (!hasSession) {
        throw new Error('Session expired. Please login again.');
      }

      return requestsApi.update(id, {
        archived: false,
        archivedAt: undefined,
      });
    } catch (error) {
      handleError(error, `Unarchive Request ${id}`);
      throw error;
    }
  },
};

// ============================================
// OFFERS API
// ============================================

// Helper function to convert DB offer to camelCase
const convertOfferToCamelCase = (dbOffer: any): Offer => ({
  id: dbOffer.id,
  requestId: dbOffer.request_id,
  partnerId: dbOffer.partner_id,
  partnerName: dbOffer.partner_name,
  price: dbOffer.price,
  etaMinutes: dbOffer.eta_minutes,
  message: dbOffer.message,
  status: dbOffer.status,
  createdAt: dbOffer.created_at
});

export const offersApi = {
  getAll: async (): Promise<Offer[]> => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(convertOfferToCamelCase);
    } catch (error) {
      handleError(error, 'Get All Offers');
      return [];
    }
  },

  getByRequestId: async (requestId: string): Promise<Offer[]> => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('request_id', requestId)
        .order('price', { ascending: true });

      if (error) throw error;
      return (data || []).map(convertOfferToCamelCase);
    } catch (error) {
      handleError(error, `Get Offers for Request ${requestId}`);
      return [];
    }
  },

  getByPartnerId: async (partnerId: string): Promise<Offer[]> => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(convertOfferToCamelCase);
    } catch (error) {
      handleError(error, `Get Offers for Partner ${partnerId}`);
      return [];
    }
  },

  create: async (offer: Omit<Offer, 'id' | 'createdAt'>): Promise<Offer> => {
    try {
      // camelCase'i snake_case'e çevir
      const dbOffer = {
        request_id: offer.requestId,
        partner_id: offer.partnerId,
        partner_name: offer.partnerName,
        price: offer.price,
        eta_minutes: offer.etaMinutes,
        message: offer.message,
        status: offer.status
      };
      
      const { data, error } = await supabase
        .from('offers')
        .insert(dbOffer)
        .select()
        .single();

      if (error) throw error;
      
      // snake_case'i camelCase'e çevir
      return convertOfferToCamelCase(data);
    } catch (error) {
      handleError(error, 'Create Offer');
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Offer>): Promise<Offer> => {
    try {
      // camelCase updates'i snake_case'e çevir
      const dbUpdates: any = {};
      if (updates.requestId !== undefined) dbUpdates.request_id = updates.requestId;
      if (updates.partnerId !== undefined) dbUpdates.partner_id = updates.partnerId;
      if (updates.partnerName !== undefined) dbUpdates.partner_name = updates.partnerName;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.etaMinutes !== undefined) dbUpdates.eta_minutes = updates.etaMinutes;
      if (updates.message !== undefined) dbUpdates.message = updates.message;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      
      const { data, error } = await supabase
        .from('offers')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return convertOfferToCamelCase(data);
    } catch (error) {
      handleError(error, `Update Offer ${id}`);
      throw error;
    }
  },

  accept: async (offerId: string): Promise<Offer> => {
    try {
      // 1. Teklifi kabul et
      const offer = await offersApi.update(offerId, { status: 'accepted' });

      // 2. Aynı talebe ait diğer teklifleri reddet
      const { error: rejectError } = await supabase
        .from('offers')
        .update({ status: 'rejected' })
        .eq('request_id', offer.requestId)
        .neq('id', offerId);

      if (rejectError) throw rejectError;

      // 3. Talebi güncelle (eşleşti durumuna al)
      await requestsApi.assignPartner(
        offer.requestId,
        offer.partnerId,
        offer.partnerName || 'Partner'
      );

      return offer;
    } catch (error) {
      handleError(error, `Accept Offer ${offerId}`);
      throw error;
    }
  },

  reject: async (id: string): Promise<Offer> => {
    return offersApi.update(id, { status: 'rejected' });
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Delete Offer ${id}`);
    }
  },
};

// ============================================
// COMPLETED JOBS API
// ============================================

// ============================================
// COMPLETED JOBS API
// ============================================

// Helper: snake_case -> camelCase mapping for CompletedJob
const mapCompletedJobFromDB = (dbJob: any): CompletedJob => ({
  id: dbJob.id,
  requestId: dbJob.request_id,
  partnerId: dbJob.partner_id,
  partnerName: dbJob.partner_name,
  customerId: dbJob.customer_id,
  customerName: dbJob.customer_name,
  customerPhone: dbJob.customer_phone,
  serviceType: dbJob.service_type,
  startLocation: dbJob.start_location,
  endLocation: dbJob.end_location,
  distance: dbJob.distance,
  startTime: dbJob.start_time,
  completionTime: dbJob.completion_time,
  duration: dbJob.duration,
  totalAmount: dbJob.total_amount,
  commission: dbJob.commission,
  partnerEarning: dbJob.partner_earning,
  paymentMethod: dbJob.payment_method,
  rating: dbJob.rating,
  vehicleType: dbJob.vehicle_type,
  vehiclePlate: dbJob.vehicle_plate,
  status: dbJob.status
});

export const completedJobsApi = {
  getAll: async (): Promise<CompletedJob[]> => {
    try {
      const { data, error } = await supabase
        .from('completed_jobs')
        .select('*')
        .order('completion_time', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapCompletedJobFromDB);
    } catch (error) {
      handleError(error, 'Get All Completed Jobs');
      return [];
    }
  },

  getByPartnerId: async (partnerId: string): Promise<CompletedJob[]> => {
    try {
      const { data, error } = await supabase
        .from('completed_jobs')
        .select('*')
        .eq('partner_id', partnerId)
        .order('completion_time', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapCompletedJobFromDB);
    } catch (error) {
      handleError(error, `Get Completed Jobs for Partner ${partnerId}`);
      return [];
    }
  },

  getByCustomerId: async (customerId: string): Promise<CompletedJob[]> => {
    try {
      const { data, error } = await supabase
        .from('completed_jobs')
        .select('*')
        .eq('customer_id', customerId)
        .order('completion_time', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapCompletedJobFromDB);
    } catch (error) {
      handleError(error, `Get Completed Jobs for Customer ${customerId}`);
      return [];
    }
  },

  create: async (job: Omit<CompletedJob, 'id' | 'createdAt'>): Promise<CompletedJob> => {
    try {
      // camelCase -> snake_case mapping
      const dbJob = {
        request_id: job.requestId, // ✅ Migration 013
        partner_id: job.partnerId,
        partner_name: job.partnerName,
        customer_id: job.customerId,
        customer_name: job.customerName,
        customer_phone: job.customerPhone,
        service_type: job.serviceType,
        start_location: job.startLocation,
        end_location: job.endLocation,
        distance: job.distance,
        start_time: job.startTime,
        completion_time: job.completionTime,
        duration: job.duration,
        total_amount: job.totalAmount,
        commission: job.commission,
        partner_earning: job.partnerEarning,
        payment_method: job.paymentMethod,
        rating: job.rating,
        vehicle_type: job.vehicleType,
        vehicle_plate: job.vehiclePlate,
        status: job.status
      };

      const { data, error } = await supabase
        .from('completed_jobs')
        .insert(dbJob)
        .select()
        .single();

      if (error) throw error;
      return mapCompletedJobFromDB(data);
    } catch (error) {
      handleError(error, 'Create Completed Job');
      throw error;
    }
  },

  update: async (id: string, updates: Partial<CompletedJob>): Promise<CompletedJob> => {
    try {
      // camelCase -> snake_case mapping for updates
      const dbUpdates: any = {};
      if (updates.requestId !== undefined) dbUpdates.request_id = updates.requestId;
      if (updates.partnerId !== undefined) dbUpdates.partner_id = updates.partnerId;
      if (updates.partnerName !== undefined) dbUpdates.partner_name = updates.partnerName;
      if (updates.customerId !== undefined) dbUpdates.customer_id = updates.customerId;
      if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
      if (updates.customerPhone !== undefined) dbUpdates.customer_phone = updates.customerPhone;
      if (updates.serviceType !== undefined) dbUpdates.service_type = updates.serviceType;
      if (updates.startLocation !== undefined) dbUpdates.start_location = updates.startLocation;
      if (updates.endLocation !== undefined) dbUpdates.end_location = updates.endLocation;
      if (updates.distance !== undefined) dbUpdates.distance = updates.distance;
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
      if (updates.completionTime !== undefined) dbUpdates.completion_time = updates.completionTime;
      if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
      if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
      if (updates.commission !== undefined) dbUpdates.commission = updates.commission;
      if (updates.partnerEarning !== undefined) dbUpdates.partner_earning = updates.partnerEarning;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
      if (updates.vehicleType !== undefined) dbUpdates.vehicle_type = updates.vehicleType;
      if (updates.vehiclePlate !== undefined) dbUpdates.vehicle_plate = updates.vehiclePlate;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { data, error } = await supabase
        .from('completed_jobs')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapCompletedJobFromDB(data);
    } catch (error) {
      handleError(error, `Update Completed Job ${id}`);
      throw error;
    }
  },
};

// ============================================
// PARTNER REVIEWS API
// ============================================

export const partnerReviewsApi = {
  getAll: async (): Promise<PartnerReview[]> => {
    try {
      const { data, error } = await supabase
        .from('partner_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // snake_case → camelCase mapping
      return (data || []).map((r: any) => ({
        id: r.id,
        jobId: r.job_id,
        partnerId: r.partner_id,
        partnerName: r.partner_name,
        customerId: r.customer_id,
        customerName: r.customer_name,
        service: r.service,
        rating: r.rating,
        comment: r.comment,
        tags: r.tags || [],
        date: r.created_at
      }));
    } catch (error) {
      handleError(error, 'Get All Partner Reviews');
      return [];
    }
  },

  getById: async (id: string): Promise<PartnerReview | null> => {
    try {
      const { data, error } = await supabase
        .from('partner_reviews')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      // snake_case → camelCase mapping
      return {
        id: data.id,
        jobId: data.job_id,
        partnerId: data.partner_id,
        partnerName: data.partner_name,
        customerId: data.customer_id,
        customerName: data.customer_name,
        service: data.service,
        rating: data.rating,
        comment: data.comment,
        tags: data.tags || [],
        date: data.created_at
      };
    } catch (error) {
      handleError(error, `Get Review ${id}`);
      return null;
    }
  },

  getByPartnerId: async (partnerId: string): Promise<PartnerReview[]> => {
    try {
      const { data, error } = await supabase
        .from('partner_reviews')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // snake_case → camelCase mapping
      return (data || []).map((r: any) => ({
        id: r.id,
        jobId: r.job_id,
        partnerId: r.partner_id,
        partnerName: r.partner_name,
        customerId: r.customer_id,
        customerName: r.customer_name,
        service: r.service,
        rating: r.rating,
        comment: r.comment,
        tags: r.tags || [],
        date: r.created_at
      }));
    } catch (error) {
      handleError(error, `Get Reviews for Partner ${partnerId}`);
      return [];
    }
  },

  create: async (review: Omit<PartnerReview, 'id' | 'createdAt'>): Promise<PartnerReview> => {
    try {
      // camelCase → snake_case mapping
      const dbReview = {
        job_id: review.jobId,
        partner_id: review.partnerId,
        partner_name: review.partnerName,
        customer_id: review.customerId,
        customer_name: review.customerName,
        service: review.service,
        rating: review.rating,
        comment: review.comment,
        tags: review.tags,
      };
      
      const { data, error } = await supabase
        .from('partner_reviews')
        .insert(dbReview)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Create Partner Review');
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('partner_reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Delete Review ${id}`);
    }
  },
};

// ============================================
// PARTNER DOCUMENTS API
// ============================================

// snake_case -> camelCase dönüşümü
const mapDocumentFromDb = (doc: any): PartnerDocument => ({
  id: doc.id,
  partnerId: doc.partner_id,
  partnerName: doc.partner_name,
  type: doc.type,
  fileName: doc.file_name,
  fileUrl: doc.file_url,
  fileSize: doc.file_size,
  status: doc.status,
  uploadDate: doc.upload_date,
  expiryDate: doc.expiry_date,
  rejectionReason: doc.rejection_reason,
  reviewedBy: doc.reviewed_by,
  reviewedAt: doc.reviewed_at,
});

export const partnerDocumentsApi = {
  getAll: async (): Promise<PartnerDocument[]> => {
    try {
      const { data, error } = await supabase
        .from('partner_documents')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDocumentFromDb);
    } catch (error) {
      handleError(error, 'Get All Partner Documents');
      return [];
    }
  },

  getByPartnerId: async (partnerId: string): Promise<PartnerDocument[]> => {
    try {
      const { data, error } = await supabase
        .from('partner_documents')
        .select('*')
        .eq('partner_id', partnerId)
        .order('upload_date', { ascending: false});

      if (error) throw error;
      return (data || []).map(mapDocumentFromDb);
    } catch (error) {
      handleError(error, `Get Documents for Partner ${partnerId}`);
      return [];
    }
  },

  create: async (document: Omit<PartnerDocument, 'id' | 'uploadDate'>): Promise<PartnerDocument> => {
    try {
      // camelCase -> snake_case dönüşümü
      const dbDocument = {
        partner_id: document.partnerId,
        partner_name: document.partnerName,
        type: document.type,
        file_name: document.fileName,
        file_url: document.fileData || document.fileUrl,
        file_size: typeof document.fileSize === 'number' ? `${(document.fileSize / 1024).toFixed(1)} KB` : document.fileSize,
        status: document.status || 'pending',
        expiry_date: document.expiryDate,
      };

      const { data, error } = await supabase
        .from('partner_documents')
        .insert(dbDocument)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Create Partner Document');
      throw error;
    }
  },

  update: async (id: string, updates: Partial<PartnerDocument>): Promise<PartnerDocument> => {
    try {
      // camelCase -> snake_case dönüşümü
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.reviewedBy) dbUpdates.reviewed_by = updates.reviewedBy;
      if (updates.reviewedAt) dbUpdates.reviewed_at = updates.reviewedAt;
      if (updates.rejectionReason) dbUpdates.rejection_reason = updates.rejectionReason;
      if (updates.fileName) dbUpdates.file_name = updates.fileName;
      if (updates.fileUrl) dbUpdates.file_url = updates.fileUrl;
      if (updates.expiryDate) dbUpdates.expiry_date = updates.expiryDate;

      const { data, error } = await supabase
        .from('partner_documents')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, `Update Document ${id}`);
      throw error;
    }
  },

  approve: async (id: string, adminId: string): Promise<PartnerDocument> => {
    return partnerDocumentsApi.update(id, {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
    });
  },

  reject: async (id: string, adminId: string, reason: string): Promise<PartnerDocument> => {
    return partnerDocumentsApi.update(id, {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    });
  },

  /**
   * Dosya yükleme (Supabase Storage)
   */
  uploadFile: async (
    partnerId: string,
    file: File,
    documentType: string
  ): Promise<string> => {
    try {
      const fileName = `${partnerId}/${documentType}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('partner-documents')
        .upload(fileName, file);

      if (error) throw error;

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('partner-documents')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      handleError(error, 'Upload Partner Document');
      throw error;
    }
  },
};

// ============================================
// SUPPORT TICKETS API
// ============================================

export const supportTicketsApi = {
  getAll: async (): Promise<SupportTicket[]> => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Get All Support Tickets');
      return [];
    }
  },

  getByPartnerId: async (partnerId: string): Promise<SupportTicket[]> => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, `Get Tickets for Partner ${partnerId}`);
      return [];
    }
  },

  create: async (ticket: Omit<SupportTicket, 'id' | 'createdAt'>): Promise<SupportTicket> => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticket)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Create Support Ticket');
      throw error;
    }
  },

  update: async (id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, `Update Ticket ${id}`);
      throw error;
    }
  },

  resolve: async (id: string, resolution: string, adminId: string): Promise<SupportTicket> => {
    return supportTicketsApi.update(id, {
      status: 'resolved',
      resolution,
      assignedTo: adminId,
    });
  },
};

// ============================================
// PARTNER VEHICLES API
// ============================================

export const partnerVehiclesApi = {
  getAll: async (): Promise<PartnerVehicle[]> => {
    try {
      const { data, error } = await supabase
        .from('partner_vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Get All Partner Vehicles');
      return [];
    }
  },

  getByPartnerId: async (partnerId: string): Promise<PartnerVehicle[]> => {
    try {
      const { data, error } = await supabase
        .from('partner_vehicles')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, `Get Vehicles for Partner ${partnerId}`);
      return [];
    }
  },

  create: async (vehicle: Omit<PartnerVehicle, 'id' | 'createdAt'>): Promise<PartnerVehicle> => {
    try {
      const { data, error } = await supabase
        .from('partner_vehicles')
        .insert(vehicle)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Create Partner Vehicle');
      throw error;
    }
  },

  update: async (id: string, updates: Partial<PartnerVehicle>): Promise<PartnerVehicle> => {
    try {
      const { data, error } = await supabase
        .from('partner_vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, `Update Vehicle ${id}`);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('partner_vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Delete Vehicle ${id}`);
    }
  },

  // Araç istatistiklerini getir
  getVehicleStats: async (vehiclePlate: string, partnerId: string): Promise<{
    totalJobs: number;
    monthlyJobs: number;
    averageRating: number;
    totalEarnings: number;
  }> => {
    try {
      // Toplam iş sayısı
      const { data: allJobs, error: allError } = await supabase
        .from('completed_jobs')
        .select('id, rating, partner_earning, completion_time')
        .eq('vehicle_plate', vehiclePlate)
        .eq('partner_id', partnerId);

      if (allError) throw allError;

      const totalJobs = allJobs?.length || 0;

      // Bu ay yapılan işler (son 30 gün)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const monthlyJobs = allJobs?.filter(job => {
        const completionDate = new Date(job.completion_time);
        return completionDate >= thirtyDaysAgo;
      }).length || 0;

      // Ortalama puan
      const ratingsOnly = allJobs?.filter(job => job.rating).map(job => job.rating) || [];
      const averageRating = ratingsOnly.length > 0
        ? ratingsOnly.reduce((sum, rating) => sum + rating, 0) / ratingsOnly.length
        : 0;

      // Toplam kazanç
      const totalEarnings = allJobs?.reduce((sum, job) => sum + (job.partner_earning || 0), 0) || 0;

      return {
        totalJobs,
        monthlyJobs,
        averageRating: Number(averageRating.toFixed(1)),
        totalEarnings: Number(totalEarnings.toFixed(2)),
      };
    } catch (error) {
      handleError(error, `Get Vehicle Stats for ${vehiclePlate}`);
      return {
        totalJobs: 0,
        monthlyJobs: 0,
        averageRating: 0,
        totalEarnings: 0,
      };
    }
  },
};

// ============================================
// PARTNER CREDITS API
// ============================================

export const partnerCreditsApi = {
  getAll: async (): Promise<PartnerCredit[]> => {
    try {
      const { data, error } = await supabase
        .from('partner_credits')
        .select('*')
        .order('balance', { ascending: false });

      if (error) throw error;
      // Map snake_case to camelCase
      return (data || []).map((c: any) => ({
        partnerId: c.partner_id,
        partnerName: c.partner_name,
        balance: c.balance || 0,
        totalPurchased: c.total_purchased || 0,
        totalUsed: c.total_used || 0,
        lastTransaction: c.last_updated || c.updated_at || ''
      }));
    } catch (error) {
      handleError(error, 'Get All Partner Credits');
      return [];
    }
  },

  getAllTransactions: async (): Promise<CreditTransaction[]> => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map snake_case to camelCase
      return (data || []).map((t: any) => ({
        id: t.id,
        partnerId: t.partner_id,
        partnerName: t.partner_name,
        type: t.type,
        amount: t.amount,
        balanceBefore: t.balance_before,
        balanceAfter: t.balance_after,
        description: t.description,
        date: t.created_at,
        requestId: t.request_id,
        adminUser: t.admin_user
      }));
    } catch (error) {
      handleError(error, 'Get All Credit Transactions');
      return [];
    }
  },

  getByPartnerId: async (partnerId: string): Promise<PartnerCredit | null> => {
    try {
      const { data, error } = await supabase
        .from('partner_credits')
        .select('*')
        .eq('partner_id', partnerId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, `Get Credits for Partner ${partnerId}`);
      return null;
    }
  },

  addCredits: async (
    partnerId: string,
    partnerName: string,
    amount: number,
    description: string
  ): Promise<CreditTransaction> => {
    try {
      // 1. Mevcut bakiyeyi getir
      const credit = await partnerCreditsApi.getByPartnerId(partnerId);
      const balanceBefore = credit?.balance || 0;
      const balanceAfter = balanceBefore + amount;

      // 2. İşlem kaydı oluştur
      const { data: transaction, error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          partner_id: partnerId,
          partner_name: partnerName,
          type: 'purchase',
          amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      return transaction;
    } catch (error) {
      handleError(error, 'Add Partner Credits');
      throw error;
    }
  },

  useCredits: async (
    partnerId: string,
    partnerName: string,
    amount: number,
    description: string,
    requestId?: string
  ): Promise<CreditTransaction> => {
    try {
      const credit = await partnerCreditsApi.getByPartnerId(partnerId);
      const balanceBefore = credit?.balance || 0;

      if (balanceBefore < amount) {
        throw new Error('Yetersiz kredi bakiyesi');
      }

      const balanceAfter = balanceBefore - amount;

      const { data: transaction, error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          partner_id: partnerId,
          partner_name: partnerName,
          type: 'usage',
          amount: -amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description,
          request_id: requestId,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      return transaction;
    } catch (error) {
      handleError(error, 'Use Partner Credits');
      throw error;
    }
  },

  getTransactions: async (partnerId: string): Promise<CreditTransaction[]> => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, `Get Transactions for Partner ${partnerId}`);
      return [];
    }
  },

  // Admin kredi düzeltme (ekleme veya çıkarma)
  adjustCredits: async (
    partnerId: string,
    partnerName: string,
    amount: number,
    reason: string,
    adminUser?: string
  ): Promise<{ transaction: CreditTransaction; newBalance: number }> => {
    try {
      // 1. Mevcut bakiyeyi getir
      const credit = await partnerCreditsApi.getByPartnerId(partnerId);
      const balanceBefore = credit?.balance || 0;
      const balanceAfter = balanceBefore + amount;

      if (balanceAfter < 0) {
        throw new Error('Bakiye negatif olamaz');
      }

      // 2. partner_credits tablosunu upsert ile güncelle
      const { error: upsertError } = await supabase
        .from('partner_credits')
        .upsert({
          partner_id: partnerId,
          partner_name: partnerName,
          balance: balanceAfter,
          total_purchased: (credit?.total_purchased || 0) + (amount > 0 ? amount : 0),
          total_used: (credit?.total_used || 0) + (amount < 0 ? Math.abs(amount) : 0),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'partner_id'
        });

      if (upsertError) throw upsertError;

      // 3. İşlem kaydı oluştur
      const { data: transaction, error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          partner_id: partnerId,
          partner_name: partnerName,
          type: 'adjustment',
          amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Admin tarafından ${amount > 0 ? 'eklendi' : 'düşürüldü'}: ${reason}`
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      return {
        transaction: {
          id: transaction.id,
          partnerId: transaction.partner_id,
          partnerName: transaction.partner_name,
          type: transaction.type,
          amount: transaction.amount,
          balanceBefore: transaction.balance_before,
          balanceAfter: transaction.balance_after,
          description: transaction.description,
          date: transaction.created_at,
          adminUser: transaction.admin_user
        },
        newBalance: balanceAfter
      };
    } catch (error) {
      handleError(error, 'Adjust Partner Credits');
      throw error;
    }
  },
};

// ============================================
// EMPTY TRUCK ROUTES API
// ============================================

export const emptyTruckRoutesApi = {
  getAll: async (): Promise<EmptyTruckRoute[]> => {
    try {
      const { data, error } = await supabase
        .from('empty_truck_routes')
        .select('*')
        .eq('status', 'active')
        .order('departure_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Get All Empty Truck Routes');
      return [];
    }
  },

  getByPartnerId: async (partnerId: string): Promise<EmptyTruckRoute[]> => {
    try {
      const { data, error } = await supabase
        .from('empty_truck_routes')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, `Get Routes for Partner ${partnerId}`);
      return [];
    }
  },

  create: async (route: Omit<EmptyTruckRoute, 'id' | 'createdAt'>): Promise<EmptyTruckRoute> => {
    try {
      const { data, error } = await supabase
        .from('empty_truck_routes')
        .insert(route)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Create Empty Truck Route');
      throw error;
    }
  },

  update: async (id: string, updates: Partial<EmptyTruckRoute>): Promise<EmptyTruckRoute> => {
    try {
      const { data, error } = await supabase
        .from('empty_truck_routes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, `Update Route ${id}`);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('empty_truck_routes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Delete Route ${id}`);
    }
  },
};

// ============================================
// ADMIN USERS API
// ============================================

export const adminUsersApi = {
  getAll: async (): Promise<AdminUser[]> => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Get All Admin Users');
      return [];
    }
  },

  create: async (admin: Omit<AdminUser, 'id' | 'createdAt'>): Promise<AdminUser> => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert(admin)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Create Admin User');
      throw error;
    }
  },

  update: async (id: string, updates: Partial<AdminUser>): Promise<AdminUser> => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, `Update Admin User ${id}`);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Delete Admin User ${id}`);
    }
  },
};

// ============================================
// SYSTEM LOGS API
// ============================================

export const systemLogsApi = {
  create: async (log: Omit<SystemLog, 'id' | 'createdAt'>): Promise<SystemLog> => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .insert(log)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Create System Log');
      throw error;
    }
  },

  getAll: async (limit: number = 100): Promise<SystemLog[]> => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Get System Logs');
      return [];
    }
  },

  getByEntity: async (entity: string, entityId: string): Promise<SystemLog[]> => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('entity', entity)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, `Get Logs for ${entity} ${entityId}`);
      return [];
    }
  },
};

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export const realtimeApi = {
  /**
   * Taleplerdeki değişiklikleri dinle
   */
  subscribeToRequests: (callback: (payload: any) => void) => {
    const subscription = supabase
      .channel('requests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        callback
      )
      .subscribe();

    return subscription;
  },

  /**
   * Tekliflerdeki değişiklikleri dinle
   */
  subscribeToOffers: (requestId: string, callback: (payload: any) => void) => {
    const subscription = supabase
      .channel(`offers-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `request_id=eq.${requestId}`,
        },
        callback
      )
      .subscribe();

    return subscription;
  },

  /**
   * İş aşamalarındaki değişiklikleri dinle
   */
  subscribeToJobStages: (requestId: string, callback: (payload: any) => void) => {
    const subscription = supabase
      .channel(`job-stages-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${requestId}`,
        },
        callback
      )
      .subscribe();

    return subscription;
  },

  /**
   * Aboneliği iptal et
   */
  unsubscribe: (subscription: any) => {
    supabase.removeChannel(subscription);
  },
};

// ============================================
// ANALYTICS & REPORTING
// ============================================

export const analyticsApi = {
  /**
   * Partner istatistikleri view'ını kullan
   */
  getPartnerStats: async () => {
    try {
      const { data, error } = await supabase
        .from('partner_stats')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Get Partner Stats');
      return [];
    }
  },

  /**
   * Müşteri istatistikleri
   */
  getCustomerStats: async () => {
    try {
      const { data, error } = await supabase
        .from('customer_stats')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Get Customer Stats');
      return [];
    }
  },

  /**
   * Günlük istatistikler
   */
  getDailyStats: async (limit: number = 30) => {
    try {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Get Daily Stats');
      return [];
    }
  },
};

// ============================================
// SERVICE AREAS API (Hizmet Bölgeleri)
// ============================================

export const serviceAreasApi = {
  /**
   * Partner'ın tüm hizmet bölgelerini getir
   */
  getByPartnerId: async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('partner_service_areas')
        .select('*')
        .eq('partner_id', partnerId)
        .order('is_primary', { ascending: false })
        .order('city', { ascending: true });

      if (error) throw error;
      
      // snake_case → camelCase
      return (data || []).map(d => ({
        id: d.id,
        partnerId: d.partner_id,
        city: d.city,
        districts: d.districts,
        isPrimary: d.is_primary,
        priceMultiplier: d.price_multiplier,
        isActive: d.is_active,
        notes: d.notes,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    } catch (error) {
      handleError(error, 'Get Service Areas by Partner');
      return [];
    }
  },

  /**
   * Belirli bir şehirde hizmet veren partnerleri getir
   */
  getPartnersByCity: async (city: string) => {
    try {
      const { data, error } = await supabase
        .from('partner_service_areas')
        .select(`
          *,
          partners!inner (
            id, name, company_name, phone, email, rating, status, city, district, service_types, profile_photo_url, logo_url
          )
        `)
        .eq('city', city)
        .eq('is_active', true)
        .eq('partners.status', 'active')
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, `Get Partners by City: ${city}`);
      return [];
    }
  },

  /**
   * Yeni hizmet bölgesi ekle
   */
  create: async (serviceArea: {
    partnerId: string;
    city: string;
    districts?: string[];
    isPrimary?: boolean;
    priceMultiplier?: number;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('partner_service_areas')
        .insert({
          partner_id: serviceArea.partnerId,
          city: serviceArea.city,
          districts: serviceArea.districts || null,
          is_primary: serviceArea.isPrimary || false,
          price_multiplier: serviceArea.priceMultiplier || 1.00,
          notes: serviceArea.notes || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        partnerId: data.partner_id,
        city: data.city,
        districts: data.districts,
        isPrimary: data.is_primary,
        priceMultiplier: data.price_multiplier,
        isActive: data.is_active,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      handleError(error, 'Create Service Area');
      throw error;
    }
  },

  /**
   * Hizmet bölgesi güncelle
   */
  update: async (id: string, updates: {
    districts?: string[];
    isPrimary?: boolean;
    priceMultiplier?: number;
    isActive?: boolean;
    notes?: string;
  }) => {
    try {
      const dbUpdates: any = {};
      if (updates.districts !== undefined) dbUpdates.districts = updates.districts;
      if (updates.isPrimary !== undefined) dbUpdates.is_primary = updates.isPrimary;
      if (updates.priceMultiplier !== undefined) dbUpdates.price_multiplier = updates.priceMultiplier;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('partner_service_areas')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        partnerId: data.partner_id,
        city: data.city,
        districts: data.districts,
        isPrimary: data.is_primary,
        priceMultiplier: data.price_multiplier,
        isActive: data.is_active,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      handleError(error, `Update Service Area ${id}`);
      throw error;
    }
  },

  /**
   * Hizmet bölgesi sil
   */
  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from('partner_service_areas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Delete Service Area ${id}`);
      throw error;
    }
  },

  /**
   * Ana hizmet bölgesini değiştir
   */
  setPrimary: async (partnerId: string, serviceAreaId: string) => {
    try {
      // Önce tüm bölgelerin is_primary'sini false yap
      await supabase
        .from('partner_service_areas')
        .update({ is_primary: false })
        .eq('partner_id', partnerId);

      // Sonra seçilen bölgeyi primary yap
      const { error } = await supabase
        .from('partner_service_areas')
        .update({ is_primary: true })
        .eq('id', serviceAreaId);

      if (error) throw error;
    } catch (error) {
      handleError(error, 'Set Primary Service Area');
      throw error;
    }
  },
};

// ============================================
// VEHICLE RETURN ROUTES API (Boş Dönüş Rotaları)
// ============================================

export const returnRoutesApi = {
  /**
   * Partner'ın tüm boş dönüş rotalarını getir
   */
  getByPartnerId: async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_return_routes')
        .select('*')
        .eq('partner_id', partnerId)
        .order('departure_date', { ascending: true });

      if (error) throw error;
      
      // snake_case → camelCase
      return (data || []).map(d => ({
        id: d.id,
        partnerId: d.partner_id,
        vehicleId: d.vehicle_id,
        originCity: d.origin_city,
        destinationCity: d.destination_city,
        routeCities: d.route_cities,
        departureDate: d.departure_date,
        departureTime: d.departure_time,
        estimatedArrival: d.estimated_arrival,
        vehicleType: d.vehicle_type,
        vehiclePlate: d.vehicle_plate,
        driverName: d.driver_name,
        driverPhone: d.driver_phone,
        availableCapacity: d.available_capacity,
        pricePerKm: d.price_per_km,
        discountPercent: d.discount_percent,
        minPrice: d.min_price,
        status: d.status,
        notes: d.notes,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    } catch (error) {
      handleError(error, 'Get Return Routes by Partner');
      return [];
    }
  },

  /**
   * Aktif boş dönüş rotalarını getir (partner için)
   */
  getActiveByPartnerId: async (partnerId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('vehicle_return_routes')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .gte('departure_date', today)
        .order('departure_date', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(d => ({
        id: d.id,
        partnerId: d.partner_id,
        vehicleId: d.vehicle_id,
        originCity: d.origin_city,
        destinationCity: d.destination_city,
        routeCities: d.route_cities,
        departureDate: d.departure_date,
        departureTime: d.departure_time,
        estimatedArrival: d.estimated_arrival,
        vehicleType: d.vehicle_type,
        vehiclePlate: d.vehicle_plate,
        driverName: d.driver_name,
        driverPhone: d.driver_phone,
        availableCapacity: d.available_capacity,
        pricePerKm: d.price_per_km,
        discountPercent: d.discount_percent,
        minPrice: d.min_price,
        status: d.status,
        notes: d.notes,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    } catch (error) {
      handleError(error, 'Get Active Return Routes by Partner');
      return [];
    }
  },

  /**
   * Belirli bir şehirden geçen aktif rotaları getir (listeleme için)
   */
  getByCity: async (city: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('vehicle_return_routes')
        .select(`
          *,
          partners!inner (
            id, name, company_name, phone, email, rating, status, profile_photo_url, logo_url
          )
        `)
        .contains('route_cities', [city])
        .eq('status', 'active')
        .gte('departure_date', today)
        .eq('partners.status', 'active')
        .order('departure_date', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(d => ({
        id: d.id,
        partnerId: d.partner_id,
        partnerName: d.partners?.name,
        companyName: d.partners?.company_name,
        partnerRating: d.partners?.rating,
        profilePhotoUrl: d.partners?.profile_photo_url,
        logoUrl: d.partners?.logo_url,
        vehicleId: d.vehicle_id,
        originCity: d.origin_city,
        destinationCity: d.destination_city,
        routeCities: d.route_cities,
        departureDate: d.departure_date,
        departureTime: d.departure_time,
        vehicleType: d.vehicle_type,
        vehiclePlate: d.vehicle_plate,
        discountPercent: d.discount_percent,
        availableCapacity: d.available_capacity,
        status: d.status,
        createdAt: d.created_at,
      }));
    } catch (error) {
      handleError(error, `Get Return Routes by City: ${city}`);
      return [];
    }
  },

  /**
   * Yeni boş dönüş rotası ekle
   */
  create: async (route: {
    partnerId: string;
    vehicleId?: string;
    originCity: string;
    destinationCity: string;
    routeCities: string[];
    departureDate: string;
    departureTime?: string;
    estimatedArrival?: string;
    vehicleType: string;
    vehiclePlate: string;
    driverName?: string;
    driverPhone?: string;
    availableCapacity?: string;
    pricePerKm?: number;
    discountPercent?: number;
    minPrice?: number;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_return_routes')
        .insert({
          partner_id: route.partnerId,
          vehicle_id: route.vehicleId || null,
          origin_city: route.originCity,
          destination_city: route.destinationCity,
          route_cities: route.routeCities,
          departure_date: route.departureDate,
          departure_time: route.departureTime || null,
          estimated_arrival: route.estimatedArrival || null,
          vehicle_type: route.vehicleType,
          vehicle_plate: route.vehiclePlate,
          driver_name: route.driverName || null,
          driver_phone: route.driverPhone || null,
          available_capacity: route.availableCapacity || null,
          price_per_km: route.pricePerKm || null,
          discount_percent: route.discountPercent || 0,
          min_price: route.minPrice || null,
          notes: route.notes || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        partnerId: data.partner_id,
        vehicleId: data.vehicle_id,
        originCity: data.origin_city,
        destinationCity: data.destination_city,
        routeCities: data.route_cities,
        departureDate: data.departure_date,
        departureTime: data.departure_time,
        estimatedArrival: data.estimated_arrival,
        vehicleType: data.vehicle_type,
        vehiclePlate: data.vehicle_plate,
        driverName: data.driver_name,
        driverPhone: data.driver_phone,
        availableCapacity: data.available_capacity,
        pricePerKm: data.price_per_km,
        discountPercent: data.discount_percent,
        minPrice: data.min_price,
        status: data.status,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      handleError(error, 'Create Return Route');
      throw error;
    }
  },

  /**
   * Boş dönüş rotası güncelle
   */
  update: async (id: string, updates: Partial<{
    originCity: string;
    destinationCity: string;
    routeCities: string[];
    departureDate: string;
    departureTime: string;
    estimatedArrival: string;
    vehicleType: string;
    vehiclePlate: string;
    driverName: string;
    driverPhone: string;
    availableCapacity: string;
    pricePerKm: number;
    discountPercent: number;
    minPrice: number;
    status: 'active' | 'completed' | 'cancelled';
    notes: string;
  }>) => {
    try {
      const dbUpdates: any = {};
      if (updates.originCity !== undefined) dbUpdates.origin_city = updates.originCity;
      if (updates.destinationCity !== undefined) dbUpdates.destination_city = updates.destinationCity;
      if (updates.routeCities !== undefined) dbUpdates.route_cities = updates.routeCities;
      if (updates.departureDate !== undefined) dbUpdates.departure_date = updates.departureDate;
      if (updates.departureTime !== undefined) dbUpdates.departure_time = updates.departureTime;
      if (updates.estimatedArrival !== undefined) dbUpdates.estimated_arrival = updates.estimatedArrival;
      if (updates.vehicleType !== undefined) dbUpdates.vehicle_type = updates.vehicleType;
      if (updates.vehiclePlate !== undefined) dbUpdates.vehicle_plate = updates.vehiclePlate;
      if (updates.driverName !== undefined) dbUpdates.driver_name = updates.driverName;
      if (updates.driverPhone !== undefined) dbUpdates.driver_phone = updates.driverPhone;
      if (updates.availableCapacity !== undefined) dbUpdates.available_capacity = updates.availableCapacity;
      if (updates.pricePerKm !== undefined) dbUpdates.price_per_km = updates.pricePerKm;
      if (updates.discountPercent !== undefined) dbUpdates.discount_percent = updates.discountPercent;
      if (updates.minPrice !== undefined) dbUpdates.min_price = updates.minPrice;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error } = await supabase
        .from('vehicle_return_routes')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Update Return Route ${id}`);
      throw error;
    }
  },

  /**
   * Boş dönüş rotası sil
   */
  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicle_return_routes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Delete Return Route ${id}`);
      throw error;
    }
  },

  /**
   * Rotayı iptal et
   */
  cancel: async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicle_return_routes')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Cancel Return Route ${id}`);
      throw error;
    }
  },

  /**
   * Rotayı tamamlandı olarak işaretle
   */
  complete: async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicle_return_routes')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleError(error, `Complete Return Route ${id}`);
      throw error;
    }
  },
};

// ============================================
// COMBINED PARTNER SEARCH API
// ============================================

export const partnerSearchApi = {
  /**
   * Bir şehir için uygun tüm partnerleri getir (hizmet bölgesi + boş dönüş)
   */
  getAvailablePartners: async (city: string) => {
    try {
      // 1. Hizmet bölgesi olan partnerler
      const serviceAreaPartners = await serviceAreasApi.getPartnersByCity(city);
      
      // 2. Boş dönüş rotası geçen partnerler
      const returnRoutePartners = await returnRoutesApi.getByCity(city);
      
      // 3. Kombine et (duplicate'leri önle)
      const partnerIds = new Set<string>();
      const results: any[] = [];
      
      // Önce hizmet bölgesi olanları ekle
      for (const sa of serviceAreaPartners) {
        const partner = (sa as any).partners;
        if (partner && !partnerIds.has(partner.id)) {
          partnerIds.add(partner.id);
          results.push({
            partnerId: partner.id,
            partnerName: partner.name,
            companyName: partner.company_name,
            partnerRating: partner.rating,
            partnerPhone: partner.phone,
            partnerEmail: partner.email,
            serviceTypes: partner.service_types,
            profilePhotoUrl: partner.profile_photo_url,
            logoUrl: partner.logo_url,
            city: partner.city,
            district: partner.district,
            source: 'service_area',
            isPrimaryArea: sa.is_primary,
            priceMultiplier: sa.price_multiplier,
            routeId: null,
            discountPercent: null,
            departureDate: null,
          });
        }
      }
      
      // Sonra boş dönüş rotası olanları ekle (hizmet bölgesi olmayanlar)
      for (const route of returnRoutePartners) {
        if (!partnerIds.has(route.partnerId)) {
          partnerIds.add(route.partnerId);
          results.push({
            partnerId: route.partnerId,
            partnerName: route.partnerName,
            companyName: route.companyName,
            partnerRating: route.partnerRating,
            profilePhotoUrl: route.profilePhotoUrl,
            logoUrl: route.logoUrl,
            source: 'return_route',
            isPrimaryArea: false,
            priceMultiplier: 1.00,
            routeId: route.id,
            discountPercent: route.discountPercent,
            departureDate: route.departureDate,
            vehicleType: route.vehicleType,
            vehiclePlate: route.vehiclePlate,
            originCity: route.originCity,
            destinationCity: route.destinationCity,
          });
        }
      }
      
      // Rating'e göre sırala
      results.sort((a, b) => (b.partnerRating || 0) - (a.partnerRating || 0));
      
      return results;
    } catch (error) {
      handleError(error, `Get Available Partners for City: ${city}`);
      return [];
    }
  },
};

// ============================================
// PARTNER SHOWCASE (VİTRİN) API
// Partner detay sayfası için vitrin bilgileri
// ============================================

export const partnerShowcaseApi = {
  /**
   * Partner vitrin bilgilerini getir (B2C detay sayfası için)
   */
  getShowcaseData: async (partnerId: string) => {
    try {
      // Partner bilgileri + showcase alanları
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select(`
          id, name, company_name, email, phone, rating, completed_jobs, status,
          city, district, logo_url, profile_photo_url,
          showcase_description, showcase_working_hours, showcase_payment_methods,
          showcase_is_24_7, showcase_satisfaction_rate, showcase_response_time, showcase_total_reviews
        `)
        .eq('id', partnerId)
        .single();
      
      if (partnerError) throw partnerError;
      if (!partner) throw new Error('Partner not found');
      
      // Tüm araçları getir (Partner Dashboard için)
      const { data: allVehicles } = await supabase
        .from('partner_vehicles')
        .select(`
          id, partner_id, brand, model, model_name, year, type, vehicle_type, plate_number,
          image_url, front_photo_url, side_photo_url, back_photo_url, status,
          showcase_capacity, showcase_insurance_type, showcase_equipment, showcase_description, is_showcase_vehicle
        `)
        .eq('partner_id', partnerId);
      
      const vehicles = (allVehicles || []).map(v => ({
        ...v,
        plate: v.plate_number,
        partnerId: v.partner_id,
      }));
      
      // Son yorumlar
      const { data: reviews } = await supabase
        .from('partner_reviews')
        .select('id, customer_id, rating, comment, created_at')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Toplam yorum sayısı
      const { count: totalReviews } = await supabase
        .from('partner_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('partner_id', partnerId);
      
      // Müşteri isimlerini al
      const reviewsWithNames = await Promise.all((reviews || []).map(async (review) => {
        const { data: customer } = await supabase
          .from('customers')
          .select('first_name, last_name')
          .eq('id', review.customer_id)
          .single();
        
        const customerName = customer 
          ? `${customer.first_name || ''} ${(customer.last_name || '').charAt(0)}.`
          : 'Anonim';
        
        return {
          id: review.id,
          customer_name: customerName,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
        };
      }));
      
      return {
        partner,
        vehicles,
        showcaseVehicle: vehicles.find(v => v.is_showcase_vehicle) || vehicles[0] || null,
        reviews: reviewsWithNames,
        totalReviews: totalReviews || 0,
      };
    } catch (error) {
      handleError(error, `Get Showcase Data for Partner: ${partnerId}`);
      return null;
    }
  },
  
  /**
   * Partner vitrin bilgilerini güncelle (Partner Dashboard'dan)
   */
  updateShowcase: async (partnerId: string, data: {
    showcase_description?: string;
    showcase_working_hours?: string;
    showcase_payment_methods?: string[];
    showcase_is_24_7?: boolean;
    showcase_response_time?: string;
  }) => {
    try {
      await ensureAuthSession();
      
      const { data: updated, error } = await supabase
        .from('partners')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partnerId)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    } catch (error) {
      handleError(error, `Update Showcase for Partner: ${partnerId}`);
      return null;
    }
  },
  
  /**
   * Araç vitrin bilgilerini güncelle
   */
  updateVehicleShowcase: async (vehicleId: string, data: {
    showcase_capacity?: string;
    showcase_insurance_type?: string;
    showcase_equipment?: string[];
    showcase_description?: string;
    is_showcase_vehicle?: boolean;
  }) => {
    try {
      await ensureAuthSession();
      
      const { data: updated, error } = await supabase
        .from('partner_vehicles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicleId)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    } catch (error) {
      handleError(error, `Update Vehicle Showcase: ${vehicleId}`);
      return null;
    }
  },
  
  /**
   * Vitrin aracını seç (diğer araçların is_showcase_vehicle'ını false yap)
   */
  setShowcaseVehicle: async (partnerId: string, vehicleId: string) => {
    try {
      await ensureAuthSession();
      
      // Önce tüm araçların showcase'ını kaldır
      await supabase
        .from('partner_vehicles')
        .update({ is_showcase_vehicle: false })
        .eq('partner_id', partnerId);
      
      // Seçilen aracı showcase yap
      const { data, error } = await supabase
        .from('partner_vehicles')
        .update({ is_showcase_vehicle: true })
        .eq('id', vehicleId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, `Set Showcase Vehicle: ${vehicleId}`);
      return null;
    }
  },
};

// ============================================
// EXPORT ALL APIs
// ============================================

const supabaseApi = {
  auth: authApi,
  customers: customersApi,
  partners: partnersApi,
  requests: requestsApi,
  offers: offersApi,
  completedJobs: completedJobsApi,
  partnerReviews: partnerReviewsApi,
  partnerDocuments: partnerDocumentsApi,
  supportTickets: supportTicketsApi,
  partnerVehicles: partnerVehiclesApi,
  partnerCredits: partnerCreditsApi,
  emptyTruckRoutes: emptyTruckRoutesApi,
  adminUsers: adminUsersApi,
  systemLogs: systemLogsApi,
  realtime: realtimeApi,
  analytics: analyticsApi,
  favorites: favoritesApi,
  addresses: addressesApi,
  notifications: notificationsApi,
  notificationPreferences: notificationPreferencesApi,
  documents: partnerDocumentsApi,
  // NEW: Hizmet Bölgeleri ve Boş Dönüş Rotaları
  serviceAreas: serviceAreasApi,
  returnRoutes: returnRoutesApi,
  partnerSearch: partnerSearchApi,
  // NEW: Partner Showcase (Vitrin) API
  partnerShowcase: partnerShowcaseApi,
  storage: {
    /**
     * Müşteri hasar fotoğrafını Supabase Storage'a yükler
     * Bucket: request-photos (PUBLIC olmalı)
     * Dönüş: public URL
     */
    uploadCustomerPhoto: async (file: File, customerId?: string | null): Promise<string> => {
      try {
        // Session kontrolü - RLS için
        await ensureAuthSession();
        
        const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const folder = customerId || 'guest';
        const timestamp = Date.now();
        const path = `${folder}/${timestamp}_${safeName}`;
        
        console.log(`📤 Uploading to: request-photos/${path}`);
        
        // PUBLIC bucket için upsert true yapabiliriz
        const { data, error } = await supabase.storage
          .from('request-photos')
          .upload(path, file, { 
            upsert: true,
            contentType: file.type 
          });
        
        if (error) {
          console.error('Storage upload error:', error);
          throw error;
        }
        
        // Public URL al
        const { data: publicData } = supabase.storage
          .from('request-photos')
          .getPublicUrl(path);
        
        console.log(`✅ Photo uploaded: ${publicData.publicUrl}`);
        
        return publicData.publicUrl;
      } catch (error: any) {
        console.error('❌ Upload failed:', error);
        handleError(error, 'Upload Customer Photo');
        throw error;
      }
    },
    
    /**
     * Partner belgesi yükle
     * Bucket: partner-documents (PUBLIC olmalı)
     * Dönüş: { success: boolean, url?: string, error?: string }
     */
    uploadPartnerDocument: async (
      file: File,
      partnerId: string,
      requestId: string | null,
      documentType: string
    ): Promise<{ success: boolean; url?: string; error?: string }> => {
      try {
        await ensureAuthSession();
        
        const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const timestamp = Date.now();
        const path = requestId 
          ? `${partnerId}/${requestId}/${timestamp}_${safeName}`
          : `${partnerId}/${documentType}/${timestamp}_${safeName}`;
        
        console.log(`📤 Uploading partner document to: partner-documents/${path}`);
        
        const { data, error } = await supabase.storage
          .from('partner-documents')
          .upload(path, file, {
            upsert: true,
            contentType: file.type
          });
        
        if (error) {
          console.error('Partner document upload error:', error);
          return { success: false, error: error.message };
        }
        
        const { data: publicData } = supabase.storage
          .from('partner-documents')
          .getPublicUrl(path);
        
        console.log(`✅ Partner document uploaded: ${publicData.publicUrl}`);
        
        return { success: true, url: publicData.publicUrl };
      } catch (error: any) {
        console.error('❌ Partner document upload failed:', error);
        return { success: false, error: error.message };
      }
    }
  },
};

// ============================================
// CAMPAIGNS API
// ============================================

export interface CampaignDB {
  id: string;
  title: string;
  description: string;
  image_url: string;
  badge_text?: string | null;
  valid_until?: string | null;
  discount?: number | null;
  code?: string | null;
  is_active: boolean;
  sort_order: number;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignInput {
  title: string;
  description: string;
  image_url: string;
  badge_text?: string;
  valid_until?: string;
  discount?: number;
  code?: string;
  is_active?: boolean;
  sort_order?: number;
  start_date?: string;
  end_date?: string;
}

export const campaignsApi = {
  /**
   * Tüm kampanyaları getir (admin için)
   */
  getAll: async (): Promise<CampaignDB[]> => {
    try {
      await ensureAuthSession();
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      handleError(error, 'Get All Campaigns');
      throw error;
    }
  },

  /**
   * Aktif kampanyaları getir (public için)
   */
  getActive: async (): Promise<CampaignDB[]> => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Get Active Campaigns Error:', error);
      return [];
    }
  },

  /**
   * Tek kampanya getir (public)
   */
  getById: async (id: string): Promise<CampaignDB | null> => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      console.error('Get Campaign By ID Error:', error);
      return null;
    }
  },

  /**
   * Kampanya oluştur (admin)
   */
  create: async (campaign: CampaignInput): Promise<CampaignDB> => {
    try {
      await ensureAuthSession();
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          title: campaign.title,
          description: campaign.description,
          image_url: campaign.image_url,
          badge_text: campaign.badge_text || null,
          valid_until: campaign.valid_until || null,
          discount: campaign.discount || null,
          code: campaign.code || null,
          is_active: campaign.is_active ?? true,
          sort_order: campaign.sort_order ?? 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      handleError(error, 'Create Campaign');
      throw error;
    }
  },

  /**
   * Kampanya güncelle (admin)
   */
  update: async (id: string, updates: Partial<CampaignInput>): Promise<CampaignDB> => {
    try {
      await ensureAuthSession();
      
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          ...(updates.title && { title: updates.title }),
          ...(updates.description && { description: updates.description }),
          ...(updates.image_url && { image_url: updates.image_url }),
          badge_text: updates.badge_text,
          valid_until: updates.valid_until,
          discount: updates.discount,
          code: updates.code,
          ...(updates.is_active !== undefined && { is_active: updates.is_active }),
          ...(updates.sort_order !== undefined && { sort_order: updates.sort_order })
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      handleError(error, 'Update Campaign');
      throw error;
    }
  },

  /**
   * Kampanya sil (admin)
   */
  delete: async (id: string): Promise<void> => {
    try {
      await ensureAuthSession();
      
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      handleError(error, 'Delete Campaign');
      throw error;
    }
  },

  /**
   * Kampanya durumunu değiştir (admin)
   */
  toggleActive: async (id: string, isActive: boolean): Promise<CampaignDB> => {
    try {
      await ensureAuthSession();
      
      const { data, error } = await supabase
        .from('campaigns')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      handleError(error, 'Toggle Campaign Active');
      throw error;
    }
  }
};

// ============================================
// CALLS API - Yolmov Voice (WebRTC Aramalar)
// ============================================

export interface CallRecord {
  id: string;
  callerId: string;
  callerType: 'customer' | 'partner' | 'admin';
  receiverId: string;
  receiverType: 'customer' | 'partner' | 'admin';
  status: 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed' | 'failed';
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  endReason?: string;
  qualityRating?: number;
  requestId?: string;
  // Joined data
  callerName?: string;
  callerPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
}

export const callsApi = {
  /**
   * Tüm aramaları getir (Admin)
   */
  getAll: async (limit = 100): Promise<CallRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(d => ({
        id: d.id,
        callerId: d.caller_id,
        callerType: d.caller_type,
        receiverId: d.receiver_id,
        receiverType: d.receiver_type,
        status: d.status,
        startedAt: d.started_at,
        connectedAt: d.connected_at,
        endedAt: d.ended_at,
        durationSeconds: d.duration_seconds,
        endReason: d.end_reason,
        qualityRating: d.quality_rating,
        requestId: d.request_id,
      }));
    } catch (error) {
      handleError(error, 'Get All Calls');
      return [];
    }
  },

  /**
   * Partner'ın aramalarını getir
   */
  getByPartnerId: async (partnerId: string): Promise<CallRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .or(`caller_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
        .order('started_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(d => ({
        id: d.id,
        callerId: d.caller_id,
        callerType: d.caller_type,
        receiverId: d.receiver_id,
        receiverType: d.receiver_type,
        status: d.status,
        startedAt: d.started_at,
        connectedAt: d.connected_at,
        endedAt: d.ended_at,
        durationSeconds: d.duration_seconds,
        endReason: d.end_reason,
        qualityRating: d.quality_rating,
        requestId: d.request_id,
      }));
    } catch (error) {
      handleError(error, 'Get Calls by Partner');
      return [];
    }
  },

  /**
   * Customer'ın aramalarını getir
   */
  getByCustomerId: async (customerId: string): Promise<CallRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .or(`caller_id.eq.${customerId},receiver_id.eq.${customerId}`)
        .order('started_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(d => ({
        id: d.id,
        callerId: d.caller_id,
        callerType: d.caller_type,
        receiverId: d.receiver_id,
        receiverType: d.receiver_type,
        status: d.status,
        startedAt: d.started_at,
        connectedAt: d.connected_at,
        endedAt: d.ended_at,
        durationSeconds: d.duration_seconds,
        endReason: d.end_reason,
        qualityRating: d.quality_rating,
        requestId: d.request_id,
      }));
    } catch (error) {
      handleError(error, 'Get Calls by Customer');
      return [];
    }
  },

  /**
   * Arama istatistikleri (Admin Dashboard)
   */
  getStatistics: async (days = 30) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('calls')
        .select('status, duration_seconds, quality_rating')
        .gte('started_at', startDate.toISOString());

      if (error) throw error;

      const calls = data || [];
      const totalCalls = calls.length;
      const connectedCalls = calls.filter(c => c.status === 'connected' || c.status === 'ended').length;
      const missedCalls = calls.filter(c => c.status === 'missed').length;
      const rejectedCalls = calls.filter(c => c.status === 'rejected').length;
      
      const durations = calls.filter(c => c.duration_seconds && c.duration_seconds > 0).map(c => c.duration_seconds);
      const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      
      const ratings = calls.filter(c => c.quality_rating).map(c => c.quality_rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      return {
        totalCalls,
        connectedCalls,
        missedCalls,
        rejectedCalls,
        avgDurationSeconds: Math.round(avgDuration),
        avgQualityRating: Math.round(avgRating * 10) / 10,
        connectionRate: totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0,
      };
    } catch (error) {
      handleError(error, 'Get Call Statistics');
      return {
        totalCalls: 0,
        connectedCalls: 0,
        missedCalls: 0,
        rejectedCalls: 0,
        avgDurationSeconds: 0,
        avgQualityRating: 0,
        connectionRate: 0,
      };
    }
  },

  /**
   * Arama kalite puanı ver
   */
  rateCall: async (callId: string, rating: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('calls')
        .update({ quality_rating: rating })
        .eq('id', callId);

      if (error) throw error;
    } catch (error) {
      handleError(error, 'Rate Call');
    }
  }
};

export { supabaseApi, supabase };
export default supabaseApi;
