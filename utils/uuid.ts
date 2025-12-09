/**
 * Safari uyumlu UUID oluşturucu
 * crypto.randomUUID() Safari 15.4+ gerektirir
 * Bu polyfill eski Safari sürümlerinde de çalışır
 */

export function generateUUID(): string {
  // Modern tarayıcılar için native API
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Safari'de bazı durumlarda hata verebilir, fallback'e geç
    }
  }
  
  // Polyfill - eski Safari ve diğer tarayıcılar için
  // RFC 4122 version 4 UUID formatı
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    
    // Version 4 UUID için bit ayarları
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
    
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  
  // Son çare - Math.random() ile (daha az güvenli ama çalışır)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default generateUUID;
