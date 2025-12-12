/**
 * Distance & ETA Service
 * 
 * OpenStreetMap tabanlı ücretsiz mesafe ve ETA hesaplama servisi
 * OSRM (Open Source Routing Machine) kullanır
 * 
 * API: https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distanceKm: number;
  distanceText: string;
  durationMinutes: number;
  durationText: string;
  success: boolean;
  error?: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  city?: string;
  district?: string;
  success: boolean;
  error?: string;
}

// OSRM API Rate limiting için
let lastOSRMCall = 0;
const OSRM_RATE_LIMIT_MS = 100; // 100ms minimum arası (saniyede 10 istek max)

/**
 * İki koordinat arası mesafe ve ETA hesapla (OSRM)
 */
export const calculateDistance = async (
  from: Coordinates,
  to: Coordinates
): Promise<DistanceResult> => {
  try {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastOSRMCall;
    if (timeSinceLastCall < OSRM_RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, OSRM_RATE_LIMIT_MS - timeSinceLastCall));
    }
    lastOSRMCall = Date.now();

    // OSRM API - koordinatlar lon,lat sırasıyla
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      // Fallback: Haversine formülü ile kuş uçuşu mesafe
      const straightLine = haversineDistance(from, to);
      const estimatedRoad = straightLine * 1.3; // Yol faktörü ~%30
      const estimatedDuration = (estimatedRoad / 60) * 60; // ~60 km/h ortalama
      
      return {
        distanceKm: Math.round(estimatedRoad * 10) / 10,
        distanceText: formatDistance(estimatedRoad),
        durationMinutes: Math.round(estimatedDuration),
        durationText: formatDuration(estimatedDuration),
        success: true,
      };
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000; // metre -> km
    const durationMinutes = route.duration / 60; // saniye -> dakika

    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      distanceText: formatDistance(distanceKm),
      durationMinutes: Math.round(durationMinutes),
      durationText: formatDuration(durationMinutes),
      success: true,
    };
  } catch (error) {
    console.error('Distance calculation error:', error);
    
    // Fallback: Haversine formülü
    try {
      const straightLine = haversineDistance(from, to);
      const estimatedRoad = straightLine * 1.3;
      const estimatedDuration = (estimatedRoad / 60) * 60;
      
      return {
        distanceKm: Math.round(estimatedRoad * 10) / 10,
        distanceText: formatDistance(estimatedRoad),
        durationMinutes: Math.round(estimatedDuration),
        durationText: formatDuration(estimatedDuration),
        success: true,
      };
    } catch {
      return {
        distanceKm: 0,
        distanceText: 'Hesaplanamadı',
        durationMinutes: 0,
        durationText: '-',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
};

/**
 * Birden fazla partner için mesafe hesapla (batch)
 */
export const calculateDistancesBatch = async (
  userLocation: Coordinates,
  partnerLocations: { partnerId: string; coordinates: Coordinates }[]
): Promise<Map<string, DistanceResult>> => {
  const results = new Map<string, DistanceResult>();
  
  // Paralel hesaplama için chunklara böl (rate limit aşmamak için)
  const chunkSize = 5;
  const chunks: typeof partnerLocations[] = [];
  
  for (let i = 0; i < partnerLocations.length; i += chunkSize) {
    chunks.push(partnerLocations.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (partner) => {
      const result = await calculateDistance(userLocation, partner.coordinates);
      return { partnerId: partner.partnerId, result };
    });

    const chunkResults = await Promise.all(promises);
    chunkResults.forEach(({ partnerId, result }) => {
      results.set(partnerId, result);
    });
  }

  return results;
};

/**
 * Şehir/İlçe adından koordinat getir (Nominatim geocoding)
 */
export const geocodeAddress = async (
  city: string,
  district?: string
): Promise<GeocodeResult> => {
  try {
    const query = district ? `${district}, ${city}, Turkey` : `${city}, Turkey`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=tr`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Yolmov-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      // İlçe bulunamazsa sadece şehir dene
      if (district) {
        return geocodeAddress(city);
      }
      throw new Error('Location not found');
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
      city,
      district,
      success: true,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      lat: 0,
      lng: 0,
      displayName: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Koordinattan adres getir (Reverse geocoding)
 */
export const reverseGeocode = async (
  coordinates: Coordinates
): Promise<GeocodeResult> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.lat}&lon=${coordinates.lng}&format=json&accept-language=tr`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Yolmov-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.error) {
      throw new Error(data?.error || 'Location not found');
    }

    const address = data.address || {};
    const city = address.province || address.state || address.city || '';
    const district = address.town || address.county || address.suburb || address.district || '';

    return {
      lat: coordinates.lat,
      lng: coordinates.lng,
      displayName: data.display_name,
      city,
      district,
      success: true,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      lat: coordinates.lat,
      lng: coordinates.lng,
      displayName: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Haversine formülü ile kuş uçuşu mesafe (km)
 */
export const haversineDistance = (
  from: Coordinates,
  to: Coordinates
): number => {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lng - from.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

// Yardımcı fonksiyonlar
const toRad = (deg: number): number => deg * (Math.PI / 180);

const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `~${Math.round(minutes)} dk`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `~${hours} saat`;
  }
  return `~${hours} sa ${mins} dk`;
};

// Türkiye'nin başlıca şehirlerinin koordinatları (cache için)
export const CITY_COORDINATES: Record<string, Coordinates> = {
  'İstanbul': { lat: 41.0082, lng: 28.9784 },
  'Ankara': { lat: 39.9334, lng: 32.8597 },
  'İzmir': { lat: 38.4237, lng: 27.1428 },
  'Bursa': { lat: 40.1885, lng: 29.0610 },
  'Antalya': { lat: 36.8969, lng: 30.7133 },
  'Adana': { lat: 37.0000, lng: 35.3213 },
  'Konya': { lat: 37.8746, lng: 32.4932 },
  'Gaziantep': { lat: 37.0662, lng: 37.3833 },
  'Mersin': { lat: 36.8000, lng: 34.6333 },
  'Kayseri': { lat: 38.7312, lng: 35.4787 },
  'Eskişehir': { lat: 39.7767, lng: 30.5206 },
  'Samsun': { lat: 41.2928, lng: 36.3313 },
  'Denizli': { lat: 37.7765, lng: 29.0864 },
  'Trabzon': { lat: 41.0015, lng: 39.7178 },
  'Erzurum': { lat: 39.9055, lng: 41.2658 },
  'Diyarbakır': { lat: 37.9144, lng: 40.2306 },
  'Malatya': { lat: 38.3552, lng: 38.3095 },
  'Van': { lat: 38.5012, lng: 43.3729 },
  'Kütahya': { lat: 39.4242, lng: 29.9833 },
  'Manisa': { lat: 38.6191, lng: 27.4289 },
  'Sakarya': { lat: 40.6940, lng: 30.4358 },
  'Balıkesir': { lat: 39.6484, lng: 27.8826 },
  'Tekirdağ': { lat: 41.0087, lng: 27.5119 },
  'Kocaeli': { lat: 40.8533, lng: 29.8815 },
  'Aydın': { lat: 37.8560, lng: 27.8416 },
  'Muğla': { lat: 37.2153, lng: 28.3636 },
  'Hatay': { lat: 36.2024, lng: 36.1605 },
  'Kahramanmaraş': { lat: 37.5753, lng: 36.9228 },
  'Şanlıurfa': { lat: 37.1591, lng: 38.7969 },
  'Elazığ': { lat: 38.6810, lng: 39.2264 },
  'Sivas': { lat: 39.7477, lng: 37.0179 },
  'Afyonkarahisar': { lat: 38.7507, lng: 30.5567 },
  'Çorum': { lat: 40.5506, lng: 34.9556 },
  'Tokat': { lat: 40.3167, lng: 36.5500 },
  'Yozgat': { lat: 39.8181, lng: 34.8147 },
  'Aksaray': { lat: 38.3687, lng: 34.0370 },
  'Nevşehir': { lat: 38.6244, lng: 34.7239 },
  'Niğde': { lat: 37.9667, lng: 34.6833 },
  'Kırşehir': { lat: 39.1425, lng: 34.1709 },
  'Karaman': { lat: 37.1759, lng: 33.2287 },
  'Isparta': { lat: 37.7648, lng: 30.5566 },
  'Burdur': { lat: 37.7203, lng: 30.2908 },
  'Uşak': { lat: 38.6823, lng: 29.4082 },
  'Bilecik': { lat: 40.0567, lng: 30.0665 },
  'Bolu': { lat: 40.7355, lng: 31.6061 },
  'Çankırı': { lat: 40.6013, lng: 33.6134 },
  'Kastamonu': { lat: 41.3887, lng: 33.7827 },
  'Zonguldak': { lat: 41.4564, lng: 31.7987 },
  'Karabük': { lat: 41.2061, lng: 32.6204 },
  'Bartın': { lat: 41.6344, lng: 32.3375 },
  'Sinop': { lat: 42.0231, lng: 35.1531 },
  'Ordu': { lat: 40.9839, lng: 37.8764 },
  'Giresun': { lat: 40.9128, lng: 38.3895 },
  'Rize': { lat: 41.0201, lng: 40.5234 },
  'Artvin': { lat: 41.1828, lng: 41.8183 },
  'Gümüşhane': { lat: 40.4386, lng: 39.5086 },
  'Bayburt': { lat: 40.2552, lng: 40.2249 },
  'Ağrı': { lat: 39.7191, lng: 43.0503 },
  'Kars': { lat: 40.6085, lng: 43.0975 },
  'Ardahan': { lat: 41.1105, lng: 42.7022 },
  'Iğdır': { lat: 39.9167, lng: 44.0333 },
  'Muş': { lat: 38.9462, lng: 41.7539 },
  'Bitlis': { lat: 38.4000, lng: 42.1167 },
  'Siirt': { lat: 37.9333, lng: 41.9500 },
  'Batman': { lat: 37.8812, lng: 41.1351 },
  'Şırnak': { lat: 37.5164, lng: 42.4611 },
  'Hakkari': { lat: 37.5833, lng: 43.7333 },
  'Mardin': { lat: 37.3212, lng: 40.7245 },
  'Adıyaman': { lat: 37.7648, lng: 38.2786 },
  'Kilis': { lat: 36.7184, lng: 37.1212 },
  'Osmaniye': { lat: 37.0746, lng: 36.2477 },
  'Düzce': { lat: 40.8438, lng: 31.1565 },
  'Yalova': { lat: 40.6500, lng: 29.2667 },
  'Kırklareli': { lat: 41.7333, lng: 27.2167 },
  'Edirne': { lat: 41.6771, lng: 26.5557 },
  'Çanakkale': { lat: 40.1553, lng: 26.4142 },
  'Tunceli': { lat: 39.1079, lng: 39.5401 },
  'Bingöl': { lat: 38.8854, lng: 40.4980 },
};

/**
 * Şehir koordinatını hızlı getir (cache veya API)
 */
export const getCityCoordinates = async (city: string): Promise<Coordinates | null> => {
  // Önce cache'e bak
  if (CITY_COORDINATES[city]) {
    return CITY_COORDINATES[city];
  }
  
  // Cache'de yoksa Nominatim'den getir
  const result = await geocodeAddress(city);
  if (result.success) {
    // Cache'e ekle
    CITY_COORDINATES[city] = { lat: result.lat, lng: result.lng };
    return { lat: result.lat, lng: result.lng };
  }
  
  return null;
};

export default {
  calculateDistance,
  calculateDistancesBatch,
  geocodeAddress,
  reverseGeocode,
  haversineDistance,
  getCityCoordinates,
  CITY_COORDINATES,
};
