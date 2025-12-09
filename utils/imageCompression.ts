import imageCompression from 'browser-image-compression';

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Görsel sıkıştırma fonksiyonu
 * @param imageFile - Sıkıştırılacak görsel dosyası
 * @returns Sıkıştırılmış dosya ve istatistikler
 */
export const compressImage = async (imageFile: File): Promise<CompressionResult> => {
  // Sıkıştırma ayarları
  const options = {
    maxSizeMB: 1,              // Hedef maksimum boyut (MB)
    maxWidthOrHeight: 1920,    // Maksimum genişlik/yükseklik (piksel)
    useWebWorker: true,        // Performans için web worker
    initialQuality: 0.7,       // Sıkıştırma kalitesi (0-1 arası)
    fileType: imageFile.type,  // Orijinal dosya tipini koru
  };

  try {
    const compressedFile = await imageCompression(imageFile, options);
    
    const originalSize = imageFile.size;
    const compressedSize = compressedFile.size;
    const compressionRatio = ((1 - (compressedSize / originalSize)) * 100);

    console.log('✅ Sıkıştırma Başarılı:', {
      original: formatFileSize(originalSize),
      compressed: formatFileSize(compressedSize),
      saved: `${compressionRatio.toFixed(1)}%`
    });

    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio
    };
  } catch (error) {
    console.error('❌ Sıkıştırma hatası:', error);
    throw new Error('Görsel sıkıştırılamadı. Lütfen tekrar deneyin.');
  }
};

/**
 * Dosya boyutunu okunabilir formata çevirir (KB/MB)
 */
export const formatFileSize = (sizeInBytes: number): string => {
  if (!sizeInBytes) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
  return parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Dosyanın görsel olup olmadığını kontrol eder
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Görsel önizleme URL'i oluşturur
 */
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Önizleme URL'ini temizler (memory leak önleme)
 */
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};
