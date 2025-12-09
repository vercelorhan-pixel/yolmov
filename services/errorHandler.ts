/**
 * Error Handler Service
 * Global hata yönetimi ve kullanıcıya Toast ile bildirim
 */

export type ErrorType = 'error' | 'warning' | 'info' | 'success';

export interface ErrorDetails {
  message: string;
  type: ErrorType;
  code?: string;
  details?: any;
}

// Toast callback fonksiyonu (UIComponents'ten Toast kullanacak)
let toastCallback: ((message: string, type: ErrorType, duration?: number) => void) | null = null;

/**
 * Toast callback'ini kaydet
 */
export const registerToastHandler = (
  callback: (message: string, type: ErrorType, duration?: number) => void
): void => {
  toastCallback = callback;
};

/**
 * Toast göster
 */
const showToast = (message: string, type: ErrorType = 'error', duration: number = 5000): void => {
  if (toastCallback) {
    toastCallback(message, type, duration);
  } else {
    // Fallback: console'a yaz
    console[type === 'error' ? 'error' : 'log'](message);
  }
};

/**
 * API hatasını işle ve kullanıcıya göster
 */
export const handleApiError = (error: any, customMessage?: string): void => {
  let message = customMessage || 'Bir hata oluştu';
  let type: ErrorType = 'error';

  if (error?.message) {
    message = error.message;
  }

  if (error?.status) {
    switch (error.status) {
      case 400:
        message = 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.';
        type = 'warning';
        break;
      case 401:
        message = 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
        type = 'warning';
        break;
      case 403:
        message = 'Bu işlem için yetkiniz yok.';
        type = 'warning';
        break;
      case 404:
        message = 'Aradığınız kayıt bulunamadı.';
        type = 'warning';
        break;
      case 408:
        message = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
        type = 'error';
        break;
      case 429:
        message = 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.';
        type = 'warning';
        break;
      case 500:
      case 502:
      case 503:
        message = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        type = 'error';
        break;
      default:
        message = error.message || 'Bir hata oluştu';
    }
  }

  showToast(message, type);
};

/**
 * Form validation hatasını işle
 */
export const handleValidationError = (errors: Record<string, string>): void => {
  const firstError = Object.values(errors)[0];
  if (firstError) {
    showToast(firstError, 'warning', 4000);
  }
};

/**
 * Network hatasını işle
 */
export const handleNetworkError = (): void => {
  showToast(
    'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
    'error',
    5000
  );
};

/**
 * Success mesajı göster
 */
export const showSuccess = (message: string, duration: number = 3000): void => {
  showToast(message, 'success', duration);
};

/**
 * Info mesajı göster
 */
export const showInfo = (message: string, duration: number = 4000): void => {
  showToast(message, 'info', duration);
};

/**
 * Warning mesajı göster
 */
export const showWarning = (message: string, duration: number = 4000): void => {
  showToast(message, 'warning', duration);
};

/**
 * Error mesajı göster
 */
export const showError = (message: string, duration: number = 5000): void => {
  showToast(message, 'error', duration);
};

/**
 * Try-catch wrapper ile hata yönetimi
 */
export const withErrorHandler = async <T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, errorMessage);
    return null;
  }
};

export default {
  handleApiError,
  handleValidationError,
  handleNetworkError,
  showSuccess,
  showInfo,
  showWarning,
  showError,
  withErrorHandler,
  registerToastHandler,
};
