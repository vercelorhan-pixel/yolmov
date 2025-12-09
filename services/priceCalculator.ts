/**
 * ============================================
 * Yolmov Dinamik Fiyatlandırma Motoru
 * ============================================
 * 
 * Formül:
 * Fiyat = (Baz Ücret + Mesafe Ücreti) × Çarpanlar
 * 
 * Özellikler:
 * - Veritabanından dinamik config
 * - Mesafe bazlı kademeli fiyatlama
 * - Zaman, araç, durum çarpanları
 * - %5 esneklik marjı (min-max aralığı)
 */

import type { 
  PricingConfig, 
  PriceCalculationInput, 
  PriceEstimate,
  RouteData 
} from '../types';

// ============================================
// PRICING CONFIG CACHE
// ============================================

let cachedConfig: PricingConfig | null = null;
let configCacheTime: number = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 dakika

/**
 * Supabase'den pricing config çek (cache ile)
 */
export async function getPricingConfig(): Promise<PricingConfig> {
  const now = Date.now();
  
  // Cache kontrolü
  if (cachedConfig && (now - configCacheTime) < CONFIG_CACHE_TTL) {
    console.log('💰 Using cached pricing config');
    return cachedConfig;
  }

  try {
    console.log('🌐 Fetching pricing config from Supabase...');
    
    const { data, error } = await (window as any).supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error('Pricing config not found');
    }

    // snake_case → camelCase mapping
    cachedConfig = {
      id: data.id,
      baseFee: parseFloat(data.base_fee),
      shortDistanceLimit: data.short_distance_limit,
      mediumDistanceLimit: data.medium_distance_limit,
      shortDistanceRate: parseFloat(data.short_distance_rate),
      mediumDistanceRate: parseFloat(data.medium_distance_rate),
      longDistanceRate: parseFloat(data.long_distance_rate),
      nightMultiplier: parseFloat(data.night_multiplier),
      weekendMultiplier: parseFloat(data.weekend_multiplier),
      sedanMultiplier: parseFloat(data.sedan_multiplier),
      suvMultiplier: parseFloat(data.suv_multiplier),
      minibusMultiplier: parseFloat(data.minibus_multiplier),
      luxuryMultiplier: parseFloat(data.luxury_multiplier),
      brokenVehicleMultiplier: parseFloat(data.broken_vehicle_multiplier),
      ditchMultiplier: parseFloat(data.ditch_multiplier),
      accidentMultiplier: parseFloat(data.accident_multiplier),
      hasLoadMultiplier: parseFloat(data.has_load_multiplier),
      urgentMultiplier: parseFloat(data.urgent_multiplier),
      priceFlexibilityPercent: parseFloat(data.price_flexibility_percent),
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
      notes: data.notes
    };

    configCacheTime = now;
    return cachedConfig;

  } catch (error) {
    console.error('❌ Error fetching pricing config:', error);
    
    // Fallback: Default config
    console.warn('⚠️ Using default fallback pricing config');
    return getDefaultPricingConfig();
  }
}

/**
 * Fallback: Varsayılan fiyatlandırma (DB erişimi olmadan)
 */
function getDefaultPricingConfig(): PricingConfig {
  return {
    id: 0,
    baseFee: 800,
    shortDistanceLimit: 15,
    mediumDistanceLimit: 100,
    shortDistanceRate: 0,
    mediumDistanceRate: 25,
    longDistanceRate: 15,
    nightMultiplier: 1.15,
    weekendMultiplier: 1.05,
    sedanMultiplier: 1.00,
    suvMultiplier: 1.10,
    minibusMultiplier: 1.20,
    luxuryMultiplier: 1.15,
    brokenVehicleMultiplier: 1.10,
    ditchMultiplier: 2.00,
    accidentMultiplier: 1.20,
    hasLoadMultiplier: 1.05,
    urgentMultiplier: 1.20,
    priceFlexibilityPercent: 100,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// ============================================
// PRICE CALCULATION ENGINE
// ============================================

/**
 * Ana fiyat hesaplama fonksiyonu
 */
export async function calculatePrice(
  input: PriceCalculationInput,
  route: RouteData
): Promise<PriceEstimate> {
  const config = await getPricingConfig();
  
  // 1. Baz ücret
  const baseFee = config.baseFee;
  
  // 2. Mesafe ücreti (kademeli)
  const distanceBreakdown = calculateDistanceCharge(input.distance, config);
  const distanceCharge = 
    distanceBreakdown.shortCharge + 
    distanceBreakdown.mediumCharge + 
    distanceBreakdown.longCharge;
  
  // 3. Ara toplam
  const subtotal = baseFee + distanceCharge;
  
  // 4. Çarpanları hesapla
  const multipliers = calculateMultipliers(input, config);
  const totalMultiplier = multipliers.reduce((acc, m) => acc * m.value, 1);
  
  // 5. Net fiyat
  const finalPrice = Math.round(subtotal * totalMultiplier);
  
  // 6. Esneklik marjı (%5)
  const flexibilityAmount = Math.round((finalPrice * config.priceFlexibilityPercent) / 100);
  const minPrice = finalPrice - flexibilityAmount;
  const maxPrice = finalPrice + flexibilityAmount;
  
  // 7. Sonuç
  const estimate: PriceEstimate = {
    basePrice: baseFee,
    distanceCharge,
    subtotal,
    totalMultiplier: parseFloat(totalMultiplier.toFixed(2)),
    finalPrice,
    minPrice,
    maxPrice,
    breakdown: {
      baseFee,
      distanceBreakdown,
      appliedMultipliers: multipliers
    },
    calculatedAt: new Date().toISOString(),
    route
  };
  
  console.log('💰 Price calculation complete:', estimate);
  return estimate;
}

/**
 * Mesafe bazlı ücret hesapla (kademeli)
 */
function calculateDistanceCharge(
  totalKm: number,
  config: PricingConfig
): {
  shortKm: number;
  mediumKm: number;
  longKm: number;
  shortCharge: number;
  mediumCharge: number;
  longCharge: number;
} {
  let remainingKm = totalKm;
  
  // 0-15 KM (Kısa mesafe - genelde 0 TL/KM)
  const shortKm = Math.min(remainingKm, config.shortDistanceLimit);
  const shortCharge = shortKm * config.shortDistanceRate;
  remainingKm -= shortKm;
  
  // 16-100 KM (Orta mesafe - 50 TL/KM)
  const mediumLimit = config.mediumDistanceLimit - config.shortDistanceLimit;
  const mediumKm = Math.min(remainingKm, mediumLimit);
  const mediumCharge = mediumKm * config.mediumDistanceRate;
  remainingKm -= mediumKm;
  
  // 100+ KM (Uzun mesafe - 33 TL/KM)
  const longKm = remainingKm;
  const longCharge = longKm * config.longDistanceRate;
  
  return {
    shortKm: parseFloat(shortKm.toFixed(2)),
    mediumKm: parseFloat(mediumKm.toFixed(2)),
    longKm: parseFloat(longKm.toFixed(2)),
    shortCharge: Math.round(shortCharge),
    mediumCharge: Math.round(mediumCharge),
    longCharge: Math.round(longCharge)
  };
}

/**
 * Tüm çarpanları hesapla ve açıklamalarını döndür
 */
function calculateMultipliers(
  input: PriceCalculationInput,
  config: PricingConfig
): Array<{ name: string; value: number; reason: string }> {
  const multipliers: Array<{ name: string; value: number; reason: string }> = [];
  
  // 1. Araç tipi
  if (input.vehicleType === 'sedan') {
    multipliers.push({
      name: 'Sedan',
      value: config.sedanMultiplier,
      reason: 'Standart araç çekme'
    });
  } else if (input.vehicleType === 'suv') {
    multipliers.push({
      name: 'SUV/4x4',
      value: config.suvMultiplier,
      reason: 'Daha ağır araç (+%15)'
    });
  } else if (input.vehicleType === 'minibus') {
    multipliers.push({
      name: 'Minibüs/Ticari',
      value: config.minibusMultiplier,
      reason: 'Büyük araç (+%30)'
    });
  }
  
  // 2. Lüks araç
  if (input.isLuxury) {
    multipliers.push({
      name: 'Lüks Araç',
      value: config.luxuryMultiplier,
      reason: 'Özel ekipman gerekiyor (+%20)'
    });
  }
  
  // 3. Araç durumu
  if (input.vehicleCondition === 'broken') {
    multipliers.push({
      name: 'Arızalı Araç',
      value: config.brokenVehicleMultiplier,
      reason: 'Ek dikkat gerektiriyor (+%15)'
    });
  } else if (input.vehicleCondition === 'accident') {
    multipliers.push({
      name: 'Kaza Durumu',
      value: config.accidentMultiplier,
      reason: 'Hasar tespiti gerekiyor (+%25)'
    });
  } else if (input.vehicleCondition === 'ditch') {
    multipliers.push({
      name: 'Şarampole Düşme',
      value: config.ditchMultiplier,
      reason: 'Özel kurtarma ekipmanı (+%100)'
    });
  }
  
  // 4. Yük taşıma
  if (input.hasLoad) {
    multipliers.push({
      name: 'Yük Taşıma',
      value: config.hasLoadMultiplier,
      reason: 'Eşya nakli hizmeti (+%10)'
    });
  }
  
  // 5. Aciliyet (timing: 'now')
  if (input.timing === 'now') {
    multipliers.push({
      name: 'Acil Hizmet',
      value: config.urgentMultiplier,
      reason: 'Hemen müdahale (+%30)'
    });
  }
  
  // 6. Gece saati kontrolü
  if (input.requestTime) {
    const hour = input.requestTime.getHours();
    if (hour >= 22 || hour < 6) {
      multipliers.push({
        name: 'Gece Hizmeti',
        value: config.nightMultiplier,
        reason: '22:00-06:00 arası (+%25)'
      });
    }
  }
  
  // 7. Hafta sonu
  if (input.isWeekend) {
    multipliers.push({
      name: 'Hafta Sonu',
      value: config.weekendMultiplier,
      reason: 'Cumartesi/Pazar (+%10)'
    });
  }
  
  return multipliers;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Tarih hafta sonu mu kontrolü
 */
export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Pazar veya Cumartesi
}

/**
 * Gece saati mi kontrolü
 */
export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 6;
}

/**
 * Fiyat estimate'i kullanıcı dostu metne çevir
 */
export function formatPriceEstimate(estimate: PriceEstimate): string {
  const lines: string[] = [];
  
  lines.push(`💰 Tahmini Tutar: ${estimate.minPrice.toLocaleString('tr-TR')} - ${estimate.maxPrice.toLocaleString('tr-TR')} TL`);
  lines.push('');
  lines.push('📊 Detaylı Hesaplama:');
  lines.push(`  • Açılış Ücreti: ${estimate.basePrice.toLocaleString('tr-TR')} TL`);
  
  if (estimate.breakdown.distanceBreakdown.shortKm > 0) {
    lines.push(`  • İlk ${estimate.breakdown.distanceBreakdown.shortKm} KM: ${estimate.breakdown.distanceBreakdown.shortCharge.toLocaleString('tr-TR')} TL`);
  }
  if (estimate.breakdown.distanceBreakdown.mediumKm > 0) {
    lines.push(`  • ${estimate.breakdown.distanceBreakdown.mediumKm} KM (Orta): ${estimate.breakdown.distanceBreakdown.mediumCharge.toLocaleString('tr-TR')} TL`);
  }
  if (estimate.breakdown.distanceBreakdown.longKm > 0) {
    lines.push(`  • ${estimate.breakdown.distanceBreakdown.longKm} KM (Uzun): ${estimate.breakdown.distanceBreakdown.longCharge.toLocaleString('tr-TR')} TL`);
  }
  
  lines.push(`  • Ara Toplam: ${estimate.subtotal.toLocaleString('tr-TR')} TL`);
  
  if (estimate.breakdown.appliedMultipliers.length > 0) {
    lines.push('');
    lines.push('🔧 Uygulanan Çarpanlar:');
    estimate.breakdown.appliedMultipliers.forEach(m => {
      lines.push(`  • ${m.name} (x${m.value}): ${m.reason}`);
    });
    lines.push(`  • Toplam Çarpan: x${estimate.totalMultiplier}`);
  }
  
  lines.push('');
  lines.push(`✅ Net Tutar: ${estimate.finalPrice.toLocaleString('tr-TR')} TL`);
  
  return lines.join('\n');
}

/**
 * Hızlı fiyat tahmin aracı (UI'da anlık gösterim için)
 */
export async function quickPriceEstimate(distanceKm: number): Promise<{ min: number; max: number }> {
  const config = await getPricingConfig();
  
  // Basit hesaplama (çarpansız)
  const distanceBreakdown = calculateDistanceCharge(distanceKm, config);
  const basePrice = config.baseFee + 
    distanceBreakdown.shortCharge + 
    distanceBreakdown.mediumCharge + 
    distanceBreakdown.longCharge;
  
  // Ortalama çarpan tahmini (x1.2)
  const avgPrice = Math.round(basePrice * 1.2);
  
  const flex = Math.round((avgPrice * config.priceFlexibilityPercent) / 100);
  
  return {
    min: avgPrice - flex,
    max: avgPrice + flex
  };
}

/**
 * Cache temizleme (Admin panel için)
 */
export function clearPricingCache(): void {
  cachedConfig = null;
  configCacheTime = 0;
  console.log('✅ Pricing cache cleared');
}
