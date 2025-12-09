/**
 * Activity Tracker Service
 * Kullanıcı ve partner aktivitelerini takip eden servis
 */

import { supabase } from './supabase';

export interface ActivityLog {
  id?: string;
  userId?: string;
  userType: 'customer' | 'partner' | 'admin' | 'anonymous';
  userEmail?: string;
  userName?: string;
  activityType: 'page_view' | 'login' | 'logout' | 'request_create' | 'offer_create' | 'offer_accept' | 'job_complete' | 'signup' | 'button_click' | 'form_submit';
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
  createdAt?: string;
}

export interface UserSession {
  id?: string;
  userId: string;
  userType: 'customer' | 'partner' | 'admin';
  userEmail?: string;
  sessionToken?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, any>;
  startedAt?: string;
  lastActivityAt?: string;
  endedAt?: string;
  isActive?: boolean;
}

// Tarayıcı bilgisini parse et
function parseUserAgent(ua: string): { browser: string; os: string; deviceType: 'desktop' | 'mobile' | 'tablet' } {
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';

  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browser = 'Opera';
  }

  // OS detection
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS')) {
    os = 'macOS';
  } else if (ua.includes('Linux') && !ua.includes('Android')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
    deviceType = 'mobile';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
    deviceType = ua.includes('iPad') ? 'tablet' : 'mobile';
  }

  // Device type refinement
  if (ua.includes('Mobile')) {
    deviceType = 'mobile';
  } else if (ua.includes('Tablet')) {
    deviceType = 'tablet';
  }

  return { browser, os, deviceType };
}

// Session ID oluştur veya mevcut olanı al
function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem('yolmov_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('yolmov_session_id', sessionId);
  }
  return sessionId;
}

// Anonim kullanıcı için kalıcı ID oluştur veya al
function getAnonymousUserId(): string {
  let anonId = localStorage.getItem('yolmov_anon_id');
  if (!anonId) {
    anonId = `anon_${crypto.randomUUID()}`;
    localStorage.setItem('yolmov_anon_id', anonId);
  }
  return anonId;
}

// IP adresini al (cache ile)
let cachedIp: string | null = null;
async function getIpAddress(): Promise<string | null> {
  if (cachedIp) return cachedIp;
  
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      cache: 'force-cache'
    });
    const data = await response.json();
    cachedIp = data.ip;
    return cachedIp;
  } catch (e) {
    console.warn('IP adresi alınamadı:', e);
    return null;
  }
}

// Mevcut kullanıcı bilgisini al
function getCurrentUser(): { userId?: string; userType: 'customer' | 'partner' | 'admin' | 'anonymous'; userEmail?: string; userName?: string } {
  try {
    // Admin kontrolü
    const adminStr = localStorage.getItem('yolmov_admin');
    if (adminStr) {
      const admin = JSON.parse(adminStr);
      return {
        userId: admin.id,
        userType: 'admin',
        userEmail: admin.email,
        userName: admin.name
      };
    }

    // Partner kontrolü
    const partnerStr = localStorage.getItem('yolmov_partner');
    if (partnerStr) {
      const partner = JSON.parse(partnerStr);
      return {
        userId: partner.id,
        userType: 'partner',
        userEmail: partner.email,
        userName: partner.name || partner.company_name
      };
    }

    // Customer kontrolü
    const customerStr = localStorage.getItem('yolmov_customer');
    if (customerStr) {
      const customer = JSON.parse(customerStr);
      return {
        userId: customer.id,
        userType: 'customer',
        userEmail: customer.email,
        userName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
      };
    }

    // Auth session kontrolü
    const sessionStr = localStorage.getItem('yolmov-auth-session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session.user) {
        return {
          userId: session.user.id,
          userType: 'customer',
          userEmail: session.user.email
        };
      }
    }
  } catch (e) {
    console.warn('Error getting current user:', e);
  }

  // Anonim kullanıcı için benzersiz ID oluştur
  return { 
    userType: 'anonymous',
    userId: getAnonymousUserId()
  };
}

// Aktivite kaydet
export async function trackActivity(
  activityType: ActivityLog['activityType'],
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const userAgent = navigator.userAgent;
    const { browser, os, deviceType } = parseUserAgent(userAgent);
    const user = getCurrentUser();
    const sessionId = getOrCreateSessionId();
    
    // IP adresini asenkron al
    const ipAddress = await getIpAddress();

    const activityLog: Record<string, any> = {
      user_id: user.userId || null,
      user_type: user.userType,
      user_email: user.userEmail || null,
      user_name: user.userName || null,
      activity_type: activityType,
      page_url: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_type: deviceType,
      browser: browser,
      os: os,
      metadata: metadata || {},
      session_id: sessionId
    };

    const { error } = await supabase
      .from('activity_logs')
      .insert(activityLog);

    if (error) {
      console.warn('⚠️ Activity log insert failed:', error.message);
    } else {
      console.log(`📊 Activity tracked: ${activityType}`);
    }
  } catch (e) {
    // Aktivite takibi başarısız olsa bile uygulamayı kırma
    console.warn('Activity tracking failed:', e);
  }
}

// Sayfa görüntüleme takibi
export function trackPageView(pageTitle?: string): void {
  trackActivity('page_view', { title: pageTitle || document.title });
}

// Kullanıcı giriş takibi
export function trackLogin(userType: 'customer' | 'partner' | 'admin', email: string): void {
  trackActivity('login', { userType, email });
}

// Kullanıcı çıkış takibi
export function trackLogout(): void {
  trackActivity('logout');
}

// Form gönderimi takibi
export function trackFormSubmit(formName: string, success: boolean): void {
  trackActivity('form_submit', { formName, success });
}

// Buton tıklama takibi
export function trackButtonClick(buttonName: string, context?: string): void {
  trackActivity('button_click', { buttonName, context });
}

// Aktivite loglarını getir (Admin için)
export async function getActivityLogs(options?: {
  limit?: number;
  userType?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ActivityLog[]> {
  try {
    console.log('🔍 [ActivityTracker] Fetching activity logs with options:', options);
    
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.userType) {
      query = query.eq('user_type', options.userType);
    }
    if (options?.activityType) {
      query = query.eq('activity_type', options.activityType);
    }
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data, error } = await query;

    console.log('🔍 [ActivityTracker] Query result:', { 
      dataCount: data?.length || 0, 
      error: error?.message || null,
      errorCode: error?.code || null
    });

    if (error) throw error;

    return (data || []).map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      userType: log.user_type,
      userEmail: log.user_email,
      userName: log.user_name,
      activityType: log.activity_type,
      pageUrl: log.page_url,
      pageTitle: log.page_title,
      referrer: log.referrer,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      deviceType: log.device_type,
      browser: log.browser,
      os: log.os,
      metadata: log.metadata,
      sessionId: log.session_id,
      createdAt: log.created_at
    }));
  } catch (error) {
    console.error('❌ Activity logs fetch failed:', error);
    return [];
  }
}

// Aktivite istatistiklerini getir
export async function getActivityStats(): Promise<{
  // Debug: Query başlangıcı
  // console.log('🔍 [ActivityTracker] Fetching activity stats...');
  totalPageViews: number;
  uniqueVisitors: number;
  todayPageViews: number;
  todayUniqueVisitors: number;
  topPages: { pageUrl: string; count: number }[];
  userTypeBreakdown: { userType: string; count: number }[];
  deviceBreakdown: { deviceType: string; count: number }[];
}> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Toplam sayfa görüntüleme
    const { count: totalPageViews } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'page_view');

    // Unique visitors (distinct user_id veya session_id)
    const { data: uniqueData } = await supabase
      .from('activity_logs')
      .select('session_id')
      .eq('activity_type', 'page_view');
    const uniqueVisitors = new Set(uniqueData?.map(d => d.session_id)).size;

    // Bugünkü sayfa görüntüleme
    const { count: todayPageViews } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'page_view')
      .gte('created_at', today);

    // Bugünkü unique visitors
    const { data: todayUniqueData } = await supabase
      .from('activity_logs')
      .select('session_id')
      .eq('activity_type', 'page_view')
      .gte('created_at', today);
    const todayUniqueVisitors = new Set(todayUniqueData?.map(d => d.session_id)).size;

    // En çok ziyaret edilen sayfalar - RPC fonksiyonu olmayabilir, doğrudan sorgu yapalım
    let topPagesData: { pageUrl: string; count: number }[] = [];
    try {
      const { data: topPagesRaw } = await supabase
        .from('activity_logs')
        .select('page_url')
        .eq('activity_type', 'page_view')
        .limit(1000);
      
      if (topPagesRaw) {
        const pageCounts = topPagesRaw.reduce((acc, item) => {
          acc.set(item.page_url, (acc.get(item.page_url) || 0) + 1);
          return acc;
        }, new Map<string, number>());
        
        topPagesData = Array.from(pageCounts.entries())
          .map(([pageUrl, count]) => ({ pageUrl, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }
    } catch (e) {
      console.warn('Top pages query failed:', e);
    }
    
    // User type breakdown
    const { data: userTypeData } = await supabase
      .from('activity_logs')
      .select('user_type')
      .eq('activity_type', 'page_view');
    
    const userTypeBreakdown = Array.from(
      (userTypeData || []).reduce((acc, item) => {
        acc.set(item.user_type, (acc.get(item.user_type) || 0) + 1);
        return acc;
      }, new Map<string, number>())
    ).map(([userType, count]) => ({ userType, count }));

    // Device breakdown
    const { data: deviceData } = await supabase
      .from('activity_logs')
      .select('device_type')
      .eq('activity_type', 'page_view');
    
    const deviceBreakdown = Array.from(
      (deviceData || []).reduce((acc, item) => {
        acc.set(item.device_type || 'unknown', (acc.get(item.device_type || 'unknown') || 0) + 1);
        return acc;
      }, new Map<string, number>())
    ).map(([deviceType, count]) => ({ deviceType, count }));

    return {
      totalPageViews: totalPageViews || 0,
      uniqueVisitors,
      todayPageViews: todayPageViews || 0,
      todayUniqueVisitors,
      topPages: topPagesData || [],
      userTypeBreakdown,
      deviceBreakdown
    };
  } catch (error) {
    console.error('❌ Activity stats fetch failed:', error);
    return {
      totalPageViews: 0,
      uniqueVisitors: 0,
      todayPageViews: 0,
      todayUniqueVisitors: 0,
      topPages: [],
      userTypeBreakdown: [],
      deviceBreakdown: []
    };
  }
}

export default {
  trackActivity,
  trackPageView,
  trackLogin,
  trackLogout,
  trackFormSubmit,
  trackButtonClick,
  getActivityLogs,
  getActivityStats
};
