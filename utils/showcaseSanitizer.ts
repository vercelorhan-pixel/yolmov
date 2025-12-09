/**
 * Showcase Text Sanitization Utility
 * Partner vitrin metinlerinden telefon, email ve URL'leri temizler
 * Bu sayede B2C kullanıcılar direkt iletişime geçemez
 */

// Telefon numarası desenleri (Türkiye ve uluslararası)
const PHONE_PATTERNS = [
  /(\+?90)?[\s.-]?\(?0?\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{3})[\s.-]?([0-9]{2})[\s.-]?([0-9]{2})/g, // Türk telefonu
  /\b0?5[0-9]{2}[\s.-]?[0-9]{3}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}\b/g, // 05XX XXX XX XX
  /\b\+?[0-9]{10,15}\b/g, // Genel uluslararası
  /\b[0-9]{3}[\s.-][0-9]{3}[\s.-][0-9]{4}\b/g, // XXX-XXX-XXXX
  /\b[0-9]{4}[\s.-][0-9]{3}[\s.-][0-9]{2}[\s.-][0-9]{2}\b/g, // XXXX-XXX-XX-XX
];

// Email deseni
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// URL desenleri
const URL_PATTERNS = [
  /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi, // http:// veya https://
  /www\.[^\s<>"{}|\\^`[\]]+/gi, // www.
  /[a-zA-Z0-9-]+\.(com|net|org|tr|co|io|me|info|biz|edu|gov|web|app|site|online|shop|store)(\.[a-zA-Z]{2,})?/gi, // domain.tld
];

// Sosyal medya kullanıcı adları
const SOCIAL_MEDIA_PATTERNS = [
  /@[a-zA-Z0-9_]{3,30}/g, // @username
  /instagram\.?:?\s*[a-zA-Z0-9._]+/gi,
  /twitter\.?:?\s*[a-zA-Z0-9._]+/gi,
  /facebook\.?:?\s*[a-zA-Z0-9._]+/gi,
  /whatsapp\.?:?\s*[0-9+\s-]+/gi,
  /telegram\.?:?\s*[a-zA-Z0-9._]+/gi,
];

/**
 * Metindeki tüm iletişim bilgilerini temizler
 * @param text - Temizlenecek metin
 * @param replacement - Yerine konacak metin (varsayılan: '***')
 * @returns Temizlenmiş metin
 */
export function sanitizeShowcaseText(text: string, replacement: string = '***'): string {
  if (!text || typeof text !== 'string') return text;
  
  let sanitized = text;
  
  // Telefon numaralarını temizle
  PHONE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, replacement);
  });
  
  // Email adreslerini temizle
  sanitized = sanitized.replace(EMAIL_PATTERN, replacement);
  
  // URL'leri temizle
  URL_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, replacement);
  });
  
  // Sosyal medya referanslarını temizle
  SOCIAL_MEDIA_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, replacement);
  });
  
  // Ardışık *** temizle
  sanitized = sanitized.replace(/(\*{3}\s*){2,}/g, replacement + ' ');
  
  return sanitized.trim();
}

/**
 * Metnin iletişim bilgisi içerip içermediğini kontrol eder
 * @param text - Kontrol edilecek metin
 * @returns true eğer iletişim bilgisi varsa
 */
export function containsContactInfo(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  // Telefon kontrolü
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(text)) return true;
    pattern.lastIndex = 0; // Reset regex state
  }
  
  // Email kontrolü
  if (EMAIL_PATTERN.test(text)) return true;
  EMAIL_PATTERN.lastIndex = 0;
  
  // URL kontrolü
  for (const pattern of URL_PATTERNS) {
    if (pattern.test(text)) return true;
    pattern.lastIndex = 0;
  }
  
  // Sosyal medya kontrolü
  for (const pattern of SOCIAL_MEDIA_PATTERNS) {
    if (pattern.test(text)) return true;
    pattern.lastIndex = 0;
  }
  
  return false;
}

/**
 * İletişim bilgisi bulunursa uyarı mesajı döner
 * @param text - Kontrol edilecek metin
 * @returns Uyarı mesajı veya null
 */
export function getContactInfoWarning(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  
  const warnings: string[] = [];
  
  // Telefon kontrolü
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push('telefon numarası');
      break;
    }
    pattern.lastIndex = 0;
  }
  
  // Email kontrolü
  if (EMAIL_PATTERN.test(text)) {
    warnings.push('e-posta adresi');
  }
  EMAIL_PATTERN.lastIndex = 0;
  
  // URL kontrolü
  for (const pattern of URL_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push('web adresi');
      break;
    }
    pattern.lastIndex = 0;
  }
  
  if (warnings.length === 0) return null;
  
  return `Metin ${warnings.join(', ')} içeriyor. Lütfen iletişim bilgilerini kaldırın.`;
}

/**
 * Form submit öncesi validation için kullanılır
 * @param fields - Kontrol edilecek alan değerleri
 * @returns Hatalı alanlar ve mesajları
 */
export function validateShowcaseFields(fields: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const warning = getContactInfoWarning(value);
    if (warning) {
      errors[fieldName] = warning;
    }
  }
  
  return errors;
}

export default {
  sanitizeShowcaseText,
  containsContactInfo,
  getContactInfoWarning,
  validateShowcaseFields,
};
