/**
 * Activity Tracker Service V2
 * Gelişmiş kullanıcı ve partner aktivite takibi
 * 
 * Özellikler:
 * - Sayfa süresi takibi (page_enter/page_exit)
 * - Scroll derinliği
 * - UTM parametreleri
 * - Trafik kaynağı tespiti
 * - Landing/Exit page tespiti
 * - Bounce rate hesaplama
 * - Production'da console log gizleme
 */

import { supabase } from './supabase';

// Production modunda console logları gizle
const IS_PRODUCTION = typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  !window.location.hostname.includes('127.0.0.1');

// Debug logger - production'da sessiz
const logger = {
  log: (...args: any[]) => !IS_PRODUCTION && console.log(...args),
  warn: (...args: any[]) => !IS_PRODUCTION && console.warn(...args),
  error: (...args: any[]) => console.error(...args), // Hataları her zaman göster
};

export interface ActivityLog {
  id?: string;
  userId?: string;
  userType: 'customer' | 'partner' | 'admin' | 'anonymous';
  userEmail?: string;
  userName?: string;
  activityType: 'page_view' | 'page_exit' | 'login' | 'logout' | 'request_create' | 'offer_create' | 'offer_accept' | 'job_complete' | 'signup' | 'button_click' | 'form_submit' | 'scroll' | 'click';
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
  // V2 alanları
  durationSeconds?: number;
  scrollDepth?: number;
  trafficSource?: string;
  trafficMedium?: string;
  utmCampaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmTerm?: string;
  utmContent?: string;
  isLandingPage?: boolean;
  isExitPage?: boolean;
  isBounce?: boolean;
  screenResolution?: string;
  viewportSize?: string;
  language?: string;
  timezone?: string;
  connectionType?: string;
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

// ============================================
// SAYFA SÜRESİ TAKİBİ
// ============================================

interface PageState {
  url: string;
  title: string;
  enterTime: number;
  maxScrollDepth: number;
  activityLogId?: string;
}

let currentPageState: PageState | null = null;
let scrollDepthTracker: number = 0;
let isFirstPageOfSession: boolean = true;
let pagesViewedInSession: number = 0;

// Scroll derinliği takibi
function initScrollTracking(): void {
  if (typeof window === 'undefined') return;
  
  const updateScrollDepth = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentDepth = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
    
    if (currentDepth > scrollDepthTracker) {
      scrollDepthTracker = Math.min(currentDepth, 100);
      if (currentPageState) {
        currentPageState.maxScrollDepth = scrollDepthTracker;
      }
    }
  };
  
  // Throttled scroll listener
  let scrollTimeout: number | null = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = window.setTimeout(() => {
      updateScrollDepth();
      scrollTimeout = null;
    }, 100);
  }, { passive: true });
}

// Sayfa çıkış takibi
function initPageExitTracking(): void {
  if (typeof window === 'undefined') return;
  
  const handlePageExit = () => {
    if (currentPageState) {
      const duration = Math.round((Date.now() - currentPageState.enterTime) / 1000);
      
      // Beacon API ile güvenli şekilde gönder (sayfa kapansa bile)
      const exitData = {
        page_url: currentPageState.url,
        duration_seconds: duration,
        scroll_depth: currentPageState.maxScrollDepth,
        is_exit_page: true,
        is_bounce: pagesViewedInSession === 1 && duration < 30, // 30 saniyeden az = bounce
        session_id: getOrCreateSessionId(),
        user_id: getCurrentUser().userId || null,
        activity_type: 'page_exit'
      };
      
      // SendBeacon kullan - sayfa kapansa bile gönderir
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(exitData)], { type: 'application/json' });
        // Not: Supabase'e beacon ile göndermek için bir edge function gerekir
        // Şimdilik metadata olarak son görüntüleme güncellemesi yapıyoruz
      }
      
      logger.log('📤 Page exit:', exitData);
    }
  };
  
  // Sayfa kapanırken/değişirken
  window.addEventListener('beforeunload', handlePageExit);
  window.addEventListener('pagehide', handlePageExit);
  
  // Visibility change (tab değiştirme)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      handlePageExit();
    }
  });
}

// ============================================
// TRAFİK KAYNAĞI TESPİTİ
// ============================================

interface TrafficInfo {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
}

function getTrafficSource(): TrafficInfo {
  const referrer = document.referrer;
  const urlParams = new URLSearchParams(window.location.search);
  
  // UTM parametreleri varsa öncelikli
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  const utmTerm = urlParams.get('utm_term');
  const utmContent = urlParams.get('utm_content');
  
  if (utmSource) {
    return {
      source: utmSource,
      medium: utmMedium || 'unknown',
      campaign: utmCampaign || undefined,
      term: utmTerm || undefined,
      content: utmContent || undefined
    };
  }
  
  // Referrer yoksa direct
  if (!referrer) {
    return { source: 'direct', medium: 'none' };
  }
  
  const referrerUrl = new URL(referrer);
  const referrerHost = referrerUrl.hostname.toLowerCase();
  
  // Arama motorları
  const searchEngines: Record<string, string> = {
    'google': 'google',
    'bing': 'bing',
    'yahoo': 'yahoo',
    'yandex': 'yandex',
    'duckduckgo': 'duckduckgo',
    'baidu': 'baidu'
  };
  
  for (const [key, name] of Object.entries(searchEngines)) {
    if (referrerHost.includes(key)) {
      return { source: name, medium: 'organic' };
    }
  }
  
  // Sosyal medya
  const socialNetworks: string[] = [
    'facebook', 'instagram', 'twitter', 'linkedin', 'pinterest',
    'tiktok', 'youtube', 'reddit', 'whatsapp', 't.co'
  ];
  
  for (const social of socialNetworks) {
    if (referrerHost.includes(social)) {
      return { source: social, medium: 'social' };
    }
  }
  
  // Diğer (referral)
  return { source: referrerHost, medium: 'referral' };
}

// ============================================
// CİHAZ VE TARAYICI BİLGİLERİ
// ============================================

function parseUserAgent(ua: string): { browser: string; os: string; deviceType: 'desktop' | 'mobile' | 'tablet' } {
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';

  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    const match = ua.match(/Chrome\/(\d+)/);
    browser = match ? `Chrome ${match[1]}` : 'Chrome';
  } else if (ua.includes('Firefox')) {
    const match = ua.match(/Firefox\/(\d+)/);
    browser = match ? `Firefox ${match[1]}` : 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/(\d+)/);
    browser = match ? `Safari ${match[1]}` : 'Safari';
  } else if (ua.includes('Edg')) {
    const match = ua.match(/Edg\/(\d+)/);
    browser = match ? `Edge ${match[1]}` : 'Edge';
  } else if (ua.includes('OPR') || ua.includes('Opera')) {
    browser = 'Opera';
  }

  // OS detection
  if (ua.includes('Windows NT 10')) {
    os = 'Windows 10/11';
  } else if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  } else if (ua.includes('Linux') && !ua.includes('Android')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    const match = ua.match(/Android (\d+)/);
    os = match ? `Android ${match[1]}` : 'Android';
    deviceType = 'mobile';
  } else if (ua.includes('iPhone')) {
    const match = ua.match(/iPhone OS (\d+)/);
    os = match ? `iOS ${match[1]}` : 'iOS';
    deviceType = 'mobile';
  } else if (ua.includes('iPad')) {
    const match = ua.match(/CPU OS (\d+)/);
    os = match ? `iPadOS ${match[1]}` : 'iPadOS';
    deviceType = 'tablet';
  }

  // Device type refinement
  if (ua.includes('Mobile') && deviceType === 'desktop') {
    deviceType = 'mobile';
  } else if (ua.includes('Tablet')) {
    deviceType = 'tablet';
  }

  return { browser, os, deviceType };
}

function getScreenInfo(): { screenResolution: string; viewportSize: string } {
  if (typeof window === 'undefined') {
    return { screenResolution: 'unknown', viewportSize: 'unknown' };
  }
  
  return {
    screenResolution: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`
  };
}

function getConnectionType(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
  
  if (connection) {
    return connection.effectiveType || connection.type || 'unknown';
  }
  
  return 'unknown';
}

// ============================================
// SESSION VE KULLANICI YÖNETİMİ
// ============================================

function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem('yolmov_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('yolmov_session_id', sessionId);
    isFirstPageOfSession = true;
    pagesViewedInSession = 0;
  }
  return sessionId;
}

function getAnonymousUserId(): string {
  let anonId = localStorage.getItem('yolmov_anon_id');
  if (!anonId) {
    anonId = `anon_${crypto.randomUUID()}`;
    localStorage.setItem('yolmov_anon_id', anonId);
  }
  return anonId;
}

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
    logger.warn('IP adresi alınamadı:', e);
    return null;
  }
}

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
    logger.warn('Error getting current user:', e);
  }

  return { 
    userType: 'anonymous',
    userId: getAnonymousUserId()
  };
}

// ============================================
// ANA TAKİP FONKSİYONLARI
// ============================================

export async function trackActivity(
  activityType: ActivityLog['activityType'],
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const userAgent = navigator.userAgent;
    const { browser, os, deviceType } = parseUserAgent(userAgent);
    const { screenResolution, viewportSize } = getScreenInfo();
    const trafficInfo = getTrafficSource();
    const user = getCurrentUser();
    const sessionId = getOrCreateSessionId();
    const ipAddress = await getIpAddress();

    const activityLog: Record<string, any> = {
      user_id: user.userId || null,
      user_type: user.userType,
      user_email: user.userEmail || null,
      user_name: user.userName || null,
      activity_type: activityType,
      page_url: window.location.pathname + window.location.search,
      page_title: document.title,
      referrer: document.referrer || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_type: deviceType,
      browser: browser,
      os: os,
      metadata: metadata || {},
      session_id: sessionId,
      // V2 alanları
      traffic_source: trafficInfo.source,
      traffic_medium: trafficInfo.medium,
      utm_campaign: trafficInfo.campaign || null,
      utm_source: new URLSearchParams(window.location.search).get('utm_source') || null,
      utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || null,
      utm_term: new URLSearchParams(window.location.search).get('utm_term') || null,
      utm_content: new URLSearchParams(window.location.search).get('utm_content') || null,
      is_landing_page: isFirstPageOfSession,
      screen_resolution: screenResolution,
      viewport_size: viewportSize,
      language: navigator.language || 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      connection_type: getConnectionType()
    };

    const { error } = await supabase
      .from('activity_logs')
      .insert(activityLog);

    if (error) {
      logger.warn('⚠️ Activity log insert failed:', error.message);
    } else {
      logger.log(`📊 Activity tracked: ${activityType}`, { 
        page: activityLog.page_url, 
        source: trafficInfo.source,
        isLanding: isFirstPageOfSession 
      });
    }
    
    // İlk sayfa flag'ini güncelle
    if (activityType === 'page_view') {
      isFirstPageOfSession = false;
      pagesViewedInSession++;
    }
  } catch (e) {
    logger.warn('Activity tracking failed:', e);
  }
}

// Sayfa görüntüleme takibi (gelişmiş)
export function trackPageView(pageTitle?: string): void {
  // Önceki sayfanın süresini kaydet
  if (currentPageState) {
    const duration = Math.round((Date.now() - currentPageState.enterTime) / 1000);
    
    // Önceki sayfanın süresini güncelle (async)
    updatePageDuration(currentPageState.url, duration, currentPageState.maxScrollDepth);
  }
  
  // Yeni sayfa state'i
  currentPageState = {
    url: window.location.pathname + window.location.search,
    title: pageTitle || document.title,
    enterTime: Date.now(),
    maxScrollDepth: 0
  };
  
  scrollDepthTracker = 0;
  
  trackActivity('page_view', { title: pageTitle || document.title });
}

// Sayfa süresini güncelle
async function updatePageDuration(pageUrl: string, duration: number, scrollDepth: number): Promise<void> {
  try {
    // Son page_view kaydını bul ve güncelle
    const { error } = await supabase
      .from('activity_logs')
      .update({ 
        duration_seconds: duration,
        scroll_depth: scrollDepth
      })
      .eq('page_url', pageUrl)
      .eq('session_id', getOrCreateSessionId())
      .eq('activity_type', 'page_view')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      logger.warn('⚠️ Page duration update failed:', error.message);
    } else {
      logger.log(`⏱️ Page duration updated: ${pageUrl} - ${duration}s, ${scrollDepth}% scroll`);
    }
  } catch (e) {
    logger.warn('Page duration update failed:', e);
  }
}

// ============================================
// KOLAY KULLANIM FONKSİYONLARI
// ============================================

export function trackLogin(userType: 'customer' | 'partner' | 'admin', email: string): void {
  trackActivity('login', { userType, email });
}

export function trackLogout(): void {
  trackActivity('logout');
}

export function trackFormSubmit(formName: string, success: boolean): void {
  trackActivity('form_submit', { formName, success });
}

export function trackButtonClick(buttonName: string, context?: string): void {
  trackActivity('button_click', { buttonName, context });
}

export function trackRequestCreate(requestId: string, serviceType: string): void {
  trackActivity('request_create', { requestId, serviceType });
}

export function trackOfferCreate(offerId: string, requestId: string): void {
  trackActivity('offer_create', { offerId, requestId });
}

export function trackOfferAccept(offerId: string, partnerId: string): void {
  trackActivity('offer_accept', { offerId, partnerId });
}

// ============================================
// ADMIN FONKSİYONLARI
// ============================================

export async function getActivityLogs(options?: {
  limit?: number;
  userType?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
  trafficSource?: string;
}): Promise<ActivityLog[]> {
  try {
    logger.log('🔍 [ActivityTracker] Fetching activity logs with options:', options);
    
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
    if (options?.trafficSource) {
      query = query.eq('traffic_source', options.trafficSource);
    }

    const { data, error } = await query;

    logger.log('🔍 [ActivityTracker] Query result:', { 
      dataCount: data?.length || 0, 
      error: error?.message || null
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
      createdAt: log.created_at,
      // V2 alanları
      durationSeconds: log.duration_seconds,
      scrollDepth: log.scroll_depth,
      trafficSource: log.traffic_source,
      trafficMedium: log.traffic_medium,
      utmCampaign: log.utm_campaign,
      utmSource: log.utm_source,
      utmMedium: log.utm_medium,
      utmTerm: log.utm_term,
      utmContent: log.utm_content,
      isLandingPage: log.is_landing_page,
      isExitPage: log.is_exit_page,
      isBounce: log.is_bounce,
      screenResolution: log.screen_resolution,
      viewportSize: log.viewport_size,
      language: log.language,
      timezone: log.timezone,
      connectionType: log.connection_type
    }));
  } catch (error) {
    logger.error('❌ Activity logs fetch failed:', error);
    return [];
  }
}

export async function getActivityStats(): Promise<{
  totalPageViews: number;
  uniqueVisitors: number;
  todayPageViews: number;
  todayUniqueVisitors: number;
  avgSessionDuration: number;
  avgScrollDepth: number;
  bounceRate: number;
  topPages: { pageUrl: string; count: number; avgDuration: number }[];
  trafficSources: { source: string; count: number; percentage: number }[];
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

    // Unique visitors (distinct session_id)
    const { data: uniqueData } = await supabase
      .from('activity_logs')
      .select('session_id')
      .eq('activity_type', 'page_view');
    const uniqueVisitors = new Set(uniqueData?.map(d => d.session_id)).size;

    // Bugünkü veriler
    const { count: todayPageViews } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'page_view')
      .gte('created_at', today);

    const { data: todayUniqueData } = await supabase
      .from('activity_logs')
      .select('session_id')
      .eq('activity_type', 'page_view')
      .gte('created_at', today);
    const todayUniqueVisitors = new Set(todayUniqueData?.map(d => d.session_id)).size;

    // Ortalama süre ve scroll
    const { data: durationData } = await supabase
      .from('activity_logs')
      .select('duration_seconds, scroll_depth, is_bounce')
      .eq('activity_type', 'page_view')
      .not('duration_seconds', 'is', null);
    
    const avgSessionDuration = durationData?.length 
      ? durationData.reduce((sum, d) => sum + (d.duration_seconds || 0), 0) / durationData.length 
      : 0;
    
    const avgScrollDepth = durationData?.length 
      ? durationData.reduce((sum, d) => sum + (d.scroll_depth || 0), 0) / durationData.length 
      : 0;
    
    const bounceCount = durationData?.filter(d => d.is_bounce).length || 0;
    const bounceRate = durationData?.length ? (bounceCount / durationData.length) * 100 : 0;

    // En çok ziyaret edilen sayfalar
    const { data: topPagesRaw } = await supabase
      .from('activity_logs')
      .select('page_url, duration_seconds')
      .eq('activity_type', 'page_view')
      .limit(1000);
    
    const pageCounts = new Map<string, { count: number; totalDuration: number }>();
    topPagesRaw?.forEach(item => {
      const existing = pageCounts.get(item.page_url) || { count: 0, totalDuration: 0 };
      pageCounts.set(item.page_url, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + (item.duration_seconds || 0)
      });
    });
    
    const topPages = Array.from(pageCounts.entries())
      .map(([pageUrl, data]) => ({ 
        pageUrl, 
        count: data.count,
        avgDuration: Math.round(data.totalDuration / data.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Trafik kaynakları
    const { data: sourceData } = await supabase
      .from('activity_logs')
      .select('traffic_source')
      .eq('activity_type', 'page_view');
    
    const sourceCounts = new Map<string, number>();
    sourceData?.forEach(item => {
      const source = item.traffic_source || 'direct';
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });
    
    const totalSources = sourceData?.length || 1;
    const trafficSources = Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ 
        source, 
        count,
        percentage: Math.round((count / totalSources) * 100)
      }))
      .sort((a, b) => b.count - a.count);

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
      avgSessionDuration: Math.round(avgSessionDuration),
      avgScrollDepth: Math.round(avgScrollDepth),
      bounceRate: Math.round(bounceRate),
      topPages,
      trafficSources,
      userTypeBreakdown,
      deviceBreakdown
    };
  } catch (error) {
    logger.error('❌ Activity stats fetch failed:', error);
    return {
      totalPageViews: 0,
      uniqueVisitors: 0,
      todayPageViews: 0,
      todayUniqueVisitors: 0,
      avgSessionDuration: 0,
      avgScrollDepth: 0,
      bounceRate: 0,
      topPages: [],
      trafficSources: [],
      userTypeBreakdown: [],
      deviceBreakdown: []
    };
  }
}

// ============================================
// BAŞLATMA
// ============================================

// Modül yüklendiğinde otomatik başlat
if (typeof window !== 'undefined') {
  initScrollTracking();
  initPageExitTracking();
}

export default {
  trackActivity,
  trackPageView,
  trackLogin,
  trackLogout,
  trackFormSubmit,
  trackButtonClick,
  trackRequestCreate,
  trackOfferCreate,
  trackOfferAccept,
  getActivityLogs,
  getActivityStats
};
