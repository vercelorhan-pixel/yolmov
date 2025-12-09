/**
 * API Service
 * Backend entegrasyonu için hazır fetch wrapper
 * Hata yönetimi, auth headers ve retry mekanizması ile
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds

interface ApiConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Auth token'ı localStorage'dan al
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('yolmov_auth_token');
};

/**
 * Auth token'ı kaydet
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('yolmov_auth_token', token);
};

/**
 * Auth token'ı temizle
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem('yolmov_auth_token');
};

/**
 * Timeout ile fetch
 */
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('İstek zaman aşımına uğradı', 408, 'TIMEOUT');
    }
    throw error;
  }
};

/**
 * Ana API çağrı fonksiyonu
 */
export const apiCall = async <T = any>(
  endpoint: string,
  config: ApiConfig = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = API_TIMEOUT,
    retry = 0,
  } = config;

  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetchWithTimeout(url, options, timeout);

    // Token geçersizse logout
    if (response.status === 401) {
      clearAuthToken();
      window.location.href = '/login';
      throw new ApiError('Oturum süresi doldu', 401, 'UNAUTHORIZED');
    }

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Bir hata oluştu',
        response.status,
        data.code
      );
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    // Retry mekanizması
    if (retry > 0 && error instanceof ApiError && error.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
      return apiCall<T>(endpoint, { ...config, retry: retry - 1 });
    }

    // Hata döndür
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Bağlantı hatası oluştu',
    };
  }
};

/**
 * Hazır API metodları
 */
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiCall('/auth/login', { method: 'POST', body: { email, password } }),
  
  register: (data: any) =>
    apiCall('/auth/register', { method: 'POST', body: data }),
  
  logout: () =>
    apiCall('/auth/logout', { method: 'POST' }),
  
  verifyEmail: (token: string) =>
    apiCall('/auth/verify-email', { method: 'POST', body: { token } }),
  
  resetPassword: (email: string) =>
    apiCall('/auth/reset-password', { method: 'POST', body: { email } }),

  // User
  getProfile: () =>
    apiCall('/user/profile'),
  
  updateProfile: (data: any) =>
    apiCall('/user/profile', { method: 'PUT', body: data }),

  // Requests
  createRequest: (data: any) =>
    apiCall('/requests', { method: 'POST', body: data }),
  
  getRequests: (params?: any) =>
    apiCall(`/requests${params ? '?' + new URLSearchParams(params) : ''}`),
  
  getRequestById: (id: string) =>
    apiCall(`/requests/${id}`),
  
  updateRequest: (id: string, data: any) =>
    apiCall(`/requests/${id}`, { method: 'PUT', body: data }),

  // Offers
  createOffer: (data: any) =>
    apiCall('/offers', { method: 'POST', body: data }),
  
  getOffers: (params?: any) =>
    apiCall(`/offers${params ? '?' + new URLSearchParams(params) : ''}`),
  
  acceptOffer: (id: string) =>
    apiCall(`/offers/${id}/accept`, { method: 'POST' }),
  
  rejectOffer: (id: string) =>
    apiCall(`/offers/${id}/reject`, { method: 'POST' }),

  // Partners
  getPartners: (params?: any) =>
    apiCall(`/partners${params ? '?' + new URLSearchParams(params) : ''}`),
  
  getPartnerById: (id: string) =>
    apiCall(`/partners/${id}`),
  
  updatePartner: (id: string, data: any) =>
    apiCall(`/partners/${id}`, { method: 'PUT', body: data }),
  
  uploadDocument: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return fetch(`${API_BASE_URL}/partners/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    }).then(res => res.json());
  },

  // Admin
  getDashboardStats: () =>
    apiCall('/admin/stats'),
  
  getUsers: (params?: any) =>
    apiCall(`/admin/users${params ? '?' + new URLSearchParams(params) : ''}`),
  
  approveUser: (id: string) =>
    apiCall(`/admin/users/${id}/approve`, { method: 'POST' }),
  
  rejectUser: (id: string) =>
    apiCall(`/admin/users/${id}/reject`, { method: 'POST' }),
  
  getLogs: (params?: any) =>
    apiCall(`/admin/logs${params ? '?' + new URLSearchParams(params) : ''}`),
  
  exportData: (type: 'users' | 'partners' | 'requests', format: 'csv' | 'excel') =>
    apiCall(`/admin/export/${type}?format=${format}`),

  // Notifications
  getNotifications: () =>
    apiCall('/notifications'),
  
  markNotificationRead: (id: string) =>
    apiCall(`/notifications/${id}/read`, { method: 'POST' }),
  
  markAllNotificationsRead: () =>
    apiCall('/notifications/read-all', { method: 'POST' }),
};

export default api;
