/**
 * ============================================
 * Yolmov Routing Service (OSRM & Nominatim)
 * ============================================
 * 
 * Açık kaynak harita servisleri:
 * - OSRM: Rota hesaplama (sürüş mesafesi)
 * - Nominatim: Geocoding (adres → koordinat)
 * 
 * ⚠️ Rate Limits:
 * - OSRM Public: ~5 req/sec (demo sunucu)
 * - Nominatim: Max 1 req/sec (TOS)
 * 
 * 🔄 Fallback: Supabase cache kullanılıyor
 */

import type { 
  Coordinates, 
  LocationPoint, 
  RouteData, 
  NominatimSearchResult,
  RouteCache 
} from '../types';
import { supabaseApi } from './supabaseApi';

// ============================================
// CONSTANTS
// ============================================

const OSRM_BASE_URL = 'https://router.project-osrm.org';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Global rate limiter (Nominatim için)
let lastNominatimCall = 0;
const NOMINATIM_DELAY = 1100; // 1.1 saniye (güvenli margin)

const waitForNominatim = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - lastNominatimCall;
  if (timeSinceLastCall < NOMINATIM_DELAY) {
    const waitTime = NOMINATIM_DELAY - timeSinceLastCall;
    console.log(`⏳ Nominatim rate limit: ${waitTime}ms bekleniyor...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastNominatimCall = Date.now();
};

// Rate limiting için basit delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// MD5 hash (basit cache key için)
const hashRoute = (start: Coordinates, end: Coordinates): string => {
  const str = `${start.latitude.toFixed(6)},${start.longitude.toFixed(6)}-${end.latitude.toFixed(6)},${end.longitude.toFixed(6)}`;
  // Basit hash (production'da crypto.subtle kullanılabilir)
  return btoa(str).replace(/[^a-zA-Z0-9]/g, '');
};

// ============================================
// OSRM ROUTE CALCULATION
// ============================================

/**
 * İki nokta arası rota hesapla
 * @returns RouteData (distance KM, duration saniye, geometry)
 */
export async function calculateRoute(
  start: Coordinates,
  end: Coordinates,
  useCache: boolean = true
): Promise<RouteData> {
  try {
    // 1. Cache kontrolü
    if (useCache) {
      const cached = await getRouteFromCache(start, end);
      if (cached) {
        console.log('🎯 Route cache hit!');
        return {
          distance: cached.distanceKm,
          duration: cached.durationSeconds,
          geometry: cached.routeGeometry,
          fromCache: true
        };
      }
    }

    // 2. OSRM API çağrısı
    console.log('🌐 Fetching route from OSRM...');
    const url = `${OSRM_BASE_URL}/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Yolmov/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000; // metre → KM
    const durationSeconds = route.duration;
    
    // GeoJSON coordinates → [lat, lng] array
    const geometry: Array<[number, number]> = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]] // [lng, lat] → [lat, lng]
    );

    const routeData: RouteData = {
      distance: parseFloat(distanceKm.toFixed(2)),
      duration: Math.round(durationSeconds),
      geometry,
      fromCache: false
    };

    // 3. Cache'e kaydet
    if (useCache) {
      await saveRouteToCache(start, end, routeData);
    }

    return routeData;

  } catch (error) {
    console.error('❌ OSRM calculateRoute error:', error);
    
    // Fallback: Kuş uçuşu mesafe (Haversine formula)
    const fallbackDistance = calculateHaversineDistance(start, end);
    console.warn(`⚠️ Using fallback distance: ${fallbackDistance} KM`);
    
    return {
      distance: fallbackDistance,
      duration: Math.round(fallbackDistance * 90), // ~40 km/h ortalama
      geometry: undefined,
      fromCache: false
    };
  }
}

/**
 * Haversine Formula (Kuş uçuşu mesafe)
 * Fallback için kullanılır
 */
function calculateHaversineDistance(start: Coordinates, end: Coordinates): number {
  const R = 6371; // Dünya yarıçapı (KM)
  const dLat = toRad(end.latitude - start.latitude);
  const dLon = toRad(end.longitude - start.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(start.latitude)) * 
    Math.cos(toRad(end.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2));
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ============================================
// NOMINATIM GEOCODING
// ============================================

/**
 * Adres metni → Koordinat (Geocoding)
 * ⚠️ Rate Limit: 1 req/sec (Nominatim TOS)
 * 
 * Türkiye için otomatik ", Turkey" eklenir (disambiguation için)
 */
export async function geocodeAddress(
  address: string,
  countryCode: string = 'tr' // Türkiye'ye öncelik
): Promise<LocationPoint | null> {
  try {
    // Global rate limiting
    await waitForNominatim();

    // İlk harfi büyük yap
    let enhancedQuery = address.trim();

    // Türkiye için otomatik ", Turkey" ekleme (disambiguation)
    if (countryCode === 'tr' && !enhancedQuery.toLowerCase().includes('turkey') && !enhancedQuery.toLowerCase().includes('türkiye')) {
      enhancedQuery = `${enhancedQuery}, Turkey`;
    }

    const params = new URLSearchParams({
      q: enhancedQuery,
      format: 'json',
      limit: '5',
      addressdetails: '1',
      'accept-language': 'tr'
    });

    const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Yolmov/1.0 (contact@yolmov.com)',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results: NominatimSearchResult[] = await response.json();

    if (!results || results.length === 0) {
      console.warn('⚠️ No geocoding results for:', enhancedQuery);
      return null;
    }

    // İlk sonucu kullan (Nominatim relevance score'a göre sıralar)
    const result = results[0];
    
    console.log(`🗺️ Geocoding: "${address}" → ${result.display_name} (${results.length} sonuç)`);
    
    return {
      coords: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      },
      address: result.display_name,
      name: address
    };

  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return null;
  }
}

/**
 * Adres metni → Birden fazla konum önerisi (Autocomplete için)
 * ⚠️ Rate Limit: 1 req/sec (Nominatim TOS)
 */
export async function geocodeAddressMultiple(
  address: string,
  countryCode: string = 'tr',
  limit: number = 5
): Promise<LocationPoint[]> {
  try {
    // Global rate limiting (1 req/sec)
    await waitForNominatim();

    // Türkiye için otomatik ", Turkey" ekleme
    let enhancedQuery = address.trim();
    
    if (countryCode === 'tr' && !enhancedQuery.toLowerCase().includes('turkey') && !enhancedQuery.toLowerCase().includes('türkiye')) {
      enhancedQuery = `${enhancedQuery}, Turkey`;
    }

    // URL encode (Türkçe karakter desteği)
    // NOT: countrycodes parametresi bazen küçük ilçeleri filtreliyor, kaldırıldı
    const params = new URLSearchParams({
      q: enhancedQuery,
      format: 'json',
      limit: limit.toString(),
      addressdetails: '1',
      'accept-language': 'tr'
    });

    const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;

    console.log('🔍 Nominatim Request:', { 
      originalQuery: address, 
      enhancedQuery, 
      encodedUrl: url 
    });

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Yolmov/1.0 (contact@yolmov.com)',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      console.error('❌ Nominatim API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Response body:', errorText);
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results: NominatimSearchResult[] = await response.json();

    console.log('📍 Nominatim Response:', { 
      query: address, 
      resultCount: results.length,
      results: results.map(r => ({ 
        name: r.display_name, 
        lat: r.lat, 
        lon: r.lon 
      }))
    });

    if (!results || results.length === 0) {
      console.warn('⚠️ No geocoding results for:', enhancedQuery);
      return [];
    }

    console.log(`🗺️ Geocoding: "${address}" → ${results.length} sonuç bulundu`);
    
    return results.map(result => ({
      coords: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      },
      address: result.display_name,
      name: address
    }));

  } catch (error) {
    console.error('❌ Geocoding multiple error:', error);
    return [];
  }
}

/**
 * Koordinat → Adres metni (Reverse Geocoding)
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  try {
    await waitForNominatim(); // Global rate limiting

    const params = new URLSearchParams({
      lat: coords.latitude.toString(),
      lon: coords.longitude.toString(),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'tr'
    });

    const url = `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Yolmov/1.0 (contact@yolmov.com)',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim reverse API error: ${response.status}`);
    }

    const result: NominatimSearchResult = await response.json();
    return result.display_name || null;

  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Türkiye için popüler şehirler (Autocomplete için)
 */
export const TURKISH_CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya',
  'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli',
  'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri',
  'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın',
  'Kütahya', 'Denizli', 'Sakarya', 'Eskişehir', 'Tekirdağ',
  'Muğla', 'Malatya', 'Erzurum', 'Trabzon', 'Elazığ',
  // Kütahya ilçeleri
  'Tavşanlı', 'Simav', 'Gediz', 'Emet',
  // Balıkesir ilçeleri  
  'Gömeç', 'Edremit', 'Ayvalık', 'Bandırma'
];

// ============================================
// SUPABASE CACHE OPERATIONS
// ============================================

async function getRouteFromCache(
  start: Coordinates,
  end: Coordinates
): Promise<RouteCache | null> {
  try {
    const hash = hashRoute(start, end);
    
    // Supabase'den cache oku
    const { data, error } = await (window as any).supabase
      .from('route_cache')
      .select('*')
      .eq('route_hash', hash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    // Hit count artır
    await (window as any).supabase
      .from('route_cache')
      .update({ 
        hit_count: data.hit_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', data.id);

    return {
      id: data.id,
      routeHash: data.route_hash,
      startLat: data.start_lat,
      startLng: data.start_lng,
      endLat: data.end_lat,
      endLng: data.end_lng,
      distanceKm: parseFloat(data.distance_km),
      durationSeconds: data.duration_seconds,
      routeGeometry: data.route_geometry,
      hitCount: data.hit_count,
      lastUsedAt: data.last_used_at,
      createdAt: data.created_at,
      expiresAt: data.expires_at
    };

  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function saveRouteToCache(
  start: Coordinates,
  end: Coordinates,
  route: RouteData
): Promise<void> {
  try {
    const hash = hashRoute(start, end);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 gün TTL

    await (window as any).supabase
      .from('route_cache')
      .insert({
        route_hash: hash,
        start_lat: start.latitude,
        start_lng: start.longitude,
        end_lat: end.latitude,
        end_lng: end.longitude,
        distance_km: route.distance,
        duration_seconds: route.duration,
        route_geometry: route.geometry,
        expires_at: expiresAt.toISOString()
      });

    console.log('✅ Route saved to cache');

  } catch (error) {
    // Cache hatası kritik değil, devam et
    console.warn('⚠️ Cache save error (non-critical):', error);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Koordinat geçerliliğini kontrol et
 */
export function validateCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= -90 && coords.latitude <= 90 &&
    coords.longitude >= -180 && coords.longitude <= 180
  );
}

/**
 * İki koordinat arasındaki mesafeyi hızlıca tahmin et (cache check için)
 */
export function estimateDistance(start: Coordinates, end: Coordinates): number {
  return calculateHaversineDistance(start, end);
}

/**
 * Türkiye sınırları içinde mi kontrolü
 */
export function isInTurkey(coords: Coordinates): boolean {
  // Türkiye koordinat sınırları (yaklaşık)
  return (
    coords.latitude >= 36 && coords.latitude <= 42 &&
    coords.longitude >= 26 && coords.longitude <= 45
  );
}
