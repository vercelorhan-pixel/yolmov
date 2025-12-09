/**
 * Validation Service
 * Form ve veri validasyon yardımcıları
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * E-posta validasyonu
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Telefon numarası validasyonu (Türkiye formatı)
 */
export const validatePhone = (phone: string): boolean => {
  // 0532 123 45 67 veya 05321234567 veya +905321234567
  const phoneRegex = /^(\+90|0)?5\d{9}$/;
  const cleanPhone = phone.replace(/\s/g, '');
  return phoneRegex.test(cleanPhone);
};

/**
 * TC Kimlik No validasyonu
 */
export const validateTCKimlik = (tc: string): boolean => {
  if (tc.length !== 11) return false;
  if (tc[0] === '0') return false;
  if (!/^\d+$/.test(tc)) return false;

  const digits = tc.split('').map(Number);
  
  // İlk 10 hanenin toplamının birler basamağı 11. haneye eşit olmalı
  const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sum10 % 10 !== digits[10]) return false;

  // 1,3,5,7,9. hanelerin toplamının 7 katından 2,4,6,8. hanelerin toplamı çıkarıldığında
  // elde edilen sonucun birler basamağı 10. haneye eşit olmalı
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const check = (oddSum * 7 - evenSum) % 10;
  if (check !== digits[9]) return false;

  return true;
};

/**
 * Vergi Kimlik Numarası (VKN) validasyonu (10 haneli)
 * Algoritma: T.C. Gelir İdaresi Başkanlığı standardına göre
 */
export const validateVergiNo = (value: string): boolean => {
  // 1. Temel Kontroller
  if (!value || value.length !== 10) return false;
  if (!/^[0-9]+$/.test(value)) return false;

  const digits = value.split('').map(Number);
  let sum = 0;

  // 2. Algoritma Döngüsü (İlk 9 hane için)
  for (let i = 0; i < 9; i++) {
    const d = digits[i];
    // Formül: (hane + (9 - index)) % 10
    let tmp = (d + (9 - i)) % 10;
    
    // Eğer sonuç 0 değilse 2^(9-i) ile çarpıp mod 9 al
    if (tmp !== 0) {
      tmp = (tmp * Math.pow(2, 9 - i)) % 9;
      // Mod 9 sonucunda 0 çıkarsa 9 olarak kabul edilir (Vergi dairesi algoritması)
      if (tmp === 0) tmp = 9;
    }
    
    sum += tmp;
  }

  // 3. Son Haneyi Kontrol Et
  const lastDigit = (10 - (sum % 10)) % 10;
  
  return lastDigit === digits[9];
};

/**
 * TC veya VKN Otomatik Doğrulama (10 veya 11 hane)
 */
export const validateTCOrVKN = (value: string): { isValid: boolean; type: 'TC' | 'VKN' | 'unknown'; message: string } => {
  if (!value) {
    return { isValid: false, type: 'unknown', message: 'Kimlik/Vergi numarası gereklidir' };
  }

  // 11 haneli ise TC kontrolü
  if (value.length === 11) {
    const isValid = validateTCKimlik(value);
    return {
      isValid,
      type: 'TC',
      message: isValid ? 'Geçerli TC Kimlik No' : 'Geçersiz TC Kimlik Numarası'
    };
  }
  
  // 10 haneli ise VKN kontrolü
  if (value.length === 10) {
    const isValid = validateVergiNo(value);
    return {
      isValid,
      type: 'VKN',
      message: isValid ? 'Geçerli Vergi Kimlik No' : 'Geçersiz Vergi Kimlik Numarası'
    };
  }

  return {
    isValid: false,
    type: 'unknown',
    message: 'TC Kimlik No (11 hane) veya Vergi Kimlik No (10 hane) giriniz'
  };
};

/**
 * Şifre güçlülük kontrolü
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} => {
  if (password.length < 6) {
    return {
      isValid: false,
      strength: 'weak',
      message: 'Şifre en az 6 karakter olmalıdır',
    };
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score >= 5) {
    strength = 'strong';
  } else if (score >= 3) {
    strength = 'medium';
  }

  return {
    isValid: score >= 3,
    strength,
    message:
      strength === 'strong'
        ? 'Güçlü şifre'
        : strength === 'medium'
        ? 'Orta güçlükte şifre'
        : 'Zayıf şifre - En az 8 karakter, büyük/küçük harf ve rakam kullanın',
  };
};

/**
 * Plaka validasyonu (Türkiye formatı)
 */
export const validatePlate = (plate: string): boolean => {
  // 34 ABC 123 veya 34ABC123
  const plateRegex = /^(0[1-9]|[1-7][0-9]|8[01])\s?[A-Z]{1,3}\s?\d{2,4}$/i;
  return plateRegex.test(plate);
};

/**
 * IBAN validasyonu (Türkiye)
 */
export const validateIBAN = (iban: string): boolean => {
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
  if (!cleanIBAN.startsWith('TR')) return false;
  if (cleanIBAN.length !== 26) return false;
  if (!/^TR\d{24}$/.test(cleanIBAN)) return false;
  return true;
};

/**
 * URL validasyonu
 */
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Boş değer kontrolü
 */
export const isNotEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Minimum uzunluk kontrolü
 */
export const minLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

/**
 * Maximum uzunluk kontrolü
 */
export const maxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

/**
 * Sayı aralığı kontrolü
 */
export const inRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Login form validasyonu
 */
export const validateLoginForm = (
  email: string,
  password: string
): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!isNotEmpty(email)) {
    errors.email = 'E-posta adresi gereklidir';
  } else if (!validateEmail(email)) {
    errors.email = 'Geçerli bir e-posta adresi giriniz';
  }

  if (!isNotEmpty(password)) {
    errors.password = 'Şifre gereklidir';
  } else if (!minLength(password, 6)) {
    errors.password = 'Şifre en az 6 karakter olmalıdır';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Register form validasyonu
 */
export const validateRegisterForm = (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!isNotEmpty(data.name)) {
    errors.name = 'Ad Soyad gereklidir';
  } else if (!minLength(data.name, 3)) {
    errors.name = 'Ad Soyad en az 3 karakter olmalıdır';
  }

  if (!isNotEmpty(data.email)) {
    errors.email = 'E-posta adresi gereklidir';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Geçerli bir e-posta adresi giriniz';
  }

  if (!isNotEmpty(data.phone)) {
    errors.phone = 'Telefon numarası gereklidir';
  } else if (!validatePhone(data.phone)) {
    errors.phone = 'Geçerli bir telefon numarası giriniz (örn: 0532 123 45 67)';
  }

  const passwordCheck = validatePasswordStrength(data.password);
  if (!passwordCheck.isValid) {
    errors.password = passwordCheck.message;
  }

  if (data.password !== data.passwordConfirm) {
    errors.passwordConfirm = 'Şifreler eşleşmiyor';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Partner register form validasyonu
 */
export const validatePartnerForm = (data: {
  companyName: string;
  email: string;
  phone: string;
  taxNumber: string;
  address: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!isNotEmpty(data.companyName)) {
    errors.companyName = 'Şirket adı gereklidir';
  }

  if (!isNotEmpty(data.email)) {
    errors.email = 'E-posta adresi gereklidir';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Geçerli bir e-posta adresi giriniz';
  }

  if (!isNotEmpty(data.phone)) {
    errors.phone = 'Telefon numarası gereklidir';
  } else if (!validatePhone(data.phone)) {
    errors.phone = 'Geçerli bir telefon numarası giriniz';
  }

  if (!isNotEmpty(data.taxNumber)) {
    errors.taxNumber = 'Vergi numarası gereklidir';
  } else if (!validateVergiNo(data.taxNumber)) {
    errors.taxNumber = 'Geçerli bir vergi numarası giriniz (10 haneli)';
  }

  if (!isNotEmpty(data.address)) {
    errors.address = 'Adres gereklidir';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  validateEmail,
  validatePhone,
  validateTCKimlik,
  validateVergiNo,
  validatePasswordStrength,
  validatePlate,
  validateIBAN,
  validateURL,
  isNotEmpty,
  minLength,
  maxLength,
  inRange,
  validateLoginForm,
  validateRegisterForm,
  validatePartnerForm,
};
