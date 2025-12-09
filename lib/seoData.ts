/**
 * SEO Data Generator
 * Türkiye'nin tüm il ve ilçeleri için SEO metadataları ve slug'lar
 */

import { CITIES_WITH_DISTRICTS } from '../constants';

export type ServiceType = 'cekici' | 'aku' | 'lastik' | 'yakit' | 'anahtar';

export interface CityData {
  plate: string;
  name: string;
  slug: string;
  districts: DistrictData[];
}

export interface DistrictData {
  name: string;
  slug: string;
}

export interface SEOPage {
  city: string;
  citySlug: string;
  district: string;
  districtSlug: string;
  service: ServiceType;
  title: string;
  description: string;
  keywords: string[];
  url: string;
}

// Türkçe karakterleri URL-friendly hale getir
export function slugify(text: string): string {
  const trMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u'
  };

  return text
    .split('')
    .map(char => trMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Tüm şehirleri CityData formatına dönüştür
export function getAllCities(): CityData[] {
  const plateCodes: Record<string, string> = {
    'Adana': '01', 'Adıyaman': '02', 'Afyonkarahisar': '03', 'Ağrı': '04',
    'Amasya': '05', 'Ankara': '06', 'Antalya': '07', 'Artvin': '08',
    'Aydın': '09', 'Balıkesir': '10', 'Bilecik': '11', 'Bingöl': '12',
    'Bitlis': '13', 'Bolu': '14', 'Burdur': '15', 'Bursa': '16',
    'Çanakkale': '17', 'Çankırı': '18', 'Çorum': '19', 'Denizli': '20',
    'Diyarbakır': '21', 'Edirne': '22', 'Elazığ': '23', 'Erzincan': '24',
    'Erzurum': '25', 'Eskişehir': '26', 'Gaziantep': '27', 'Giresun': '28',
    'Gümüşhane': '29', 'Hakkari': '30', 'Hatay': '31', 'Isparta': '32',
    'Mersin': '33', 'İstanbul': '34', 'İzmir': '35', 'Kars': '36',
    'Kastamonu': '37', 'Kayseri': '38', 'Kırklareli': '39', 'Kırşehir': '40',
    'Kocaeli': '41', 'Konya': '42', 'Kütahya': '43', 'Malatya': '44',
    'Manisa': '45', 'Kahramanmaraş': '46', 'Mardin': '47', 'Muğla': '48',
    'Muş': '49', 'Nevşehir': '50', 'Niğde': '51', 'Ordu': '52',
    'Rize': '53', 'Sakarya': '54', 'Samsun': '55', 'Siirt': '56',
    'Sinop': '57', 'Sivas': '58', 'Tekirdağ': '59', 'Tokat': '60',
    'Trabzon': '61', 'Tunceli': '62', 'Şanlıurfa': '63', 'Uşak': '64',
    'Van': '65', 'Yozgat': '66', 'Zonguldak': '67', 'Aksaray': '68',
    'Bayburt': '69', 'Karaman': '70', 'Kırıkkale': '71', 'Batman': '72',
    'Şırnak': '73', 'Bartın': '74', 'Ardahan': '75', 'Iğdır': '76',
    'Yalova': '77', 'Karabük': '78', 'Kilis': '79', 'Osmaniye': '80',
    'Düzce': '81'
  };

  return Object.entries(CITIES_WITH_DISTRICTS).map(([cityName, districts]) => ({
    plate: plateCodes[cityName] || '00',
    name: cityName,
    slug: slugify(cityName),
    districts: districts.map(districtName => ({
      name: districtName,
      slug: slugify(districtName)
    }))
  }));
}

// Slug'a göre şehir bul
export function getCityBySlug(slug: string): CityData | null {
  const cities = getAllCities();
  return cities.find(city => city.slug === slug) || null;
}

// Slug'a göre ilçe bul
export function getDistrictBySlug(citySlug: string, districtSlug: string): DistrictData | null {
  const city = getCityBySlug(citySlug);
  if (!city) return null;
  return city.districts.find(d => d.slug === districtSlug) || null;
}

// Hizmet tipi için başlık ve açıklama oluştur
export function getServiceInfo(serviceType: ServiceType) {
  const serviceMap = {
    'cekici': {
      title: 'Çekici Hizmeti',
      shortTitle: 'Çekici',
      description: 'Oto kurtarıcı ve çekici hizmeti',
      icon: '🚛',
      keywords: ['çekici', 'oto kurtarıcı', 'araç çekme', 'yol yardım']
    },
    'aku': {
      title: 'Akü Takviyesi',
      shortTitle: 'Akü',
      description: 'Akü takviye ve değişim hizmeti',
      icon: '🔋',
      keywords: ['akü takviye', 'akü değişimi', 'akü servisi', 'marş problemi']
    },
    'lastik': {
      title: 'Lastik Değişimi',
      shortTitle: 'Lastik',
      description: 'Lastik değişim ve tamir hizmeti',
      icon: '🛞',
      keywords: ['lastik değişimi', 'patlak lastik', 'lastik tamiri', 'stepne']
    },
    'yakit': {
      title: 'Yakıt Desteği',
      shortTitle: 'Yakıt',
      description: 'Yakıt bitme desteği',
      icon: '⛽',
      keywords: ['yakıt', 'benzin bitti', 'mazot desteği', 'yakıt getirme']
    },
    'anahtar': {
      title: 'Anahtar Çilingir',
      shortTitle: 'Anahtar',
      description: 'Araç kilit açma hizmeti',
      icon: '🔑',
      keywords: ['çilingir', 'araç kilidi', 'anahtar', 'kilit açma']
    }
  };

  return serviceMap[serviceType];
}

// SEO metadata oluştur
export function generateSEOMetadata(
  citySlug: string,
  districtSlug: string,
  serviceType: ServiceType
): SEOPage | null {
  const city = getCityBySlug(citySlug);
  const district = getDistrictBySlug(citySlug, districtSlug);
  const service = getServiceInfo(serviceType);

  if (!city || !district) return null;

  const title = `${district.name} ${service.shortTitle} - ${city.name} ${service.title} | Yolmov 7/24`;
  const description = `${district.name}, ${city.name} bölgesinde yolda mı kaldınız? Yolmov ile ${district.name} en yakın ${service.description} hemen çağırın. 7/24 hizmet, uygun fiyat, 15 dakikada yanınızda.`;

  const keywords = [
    `${district.name} ${service.shortTitle}`,
    `${city.name} ${service.shortTitle}`,
    `${district.name} ${service.title}`,
    ...service.keywords.map(kw => `${district.name} ${kw}`),
    ...service.keywords.map(kw => `${city.name} ${kw}`),
    '7/24 yol yardım',
    'hızlı servis'
  ];

  const url = `/${serviceType}/${citySlug}/${districtSlug}`;

  return {
    city: city.name,
    citySlug,
    district: district.name,
    districtSlug,
    service: serviceType,
    title,
    description,
    keywords,
    url
  };
}

// Tüm SEO sayfalarını oluştur (sitemap için)
export function generateAllSEOPages(): SEOPage[] {
  const cities = getAllCities();
  const services: ServiceType[] = ['cekici', 'aku', 'lastik', 'yakit', 'anahtar'];
  const pages: SEOPage[] = [];

  cities.forEach(city => {
    city.districts.forEach(district => {
      services.forEach(service => {
        const seoPage = generateSEOMetadata(city.slug, district.slug, service);
        if (seoPage) {
          pages.push(seoPage);
        }
      });
    });
  });

  return pages;
}

// İstatistik: Kaç sayfa oluşturulacak?
export function getSEOStats() {
  const cities = getAllCities();
  const totalDistricts = cities.reduce((sum, city) => sum + city.districts.length, 0);
  const servicesCount = 5; // cekici, aku, lastik, yakit, anahtar
  const totalPages = totalDistricts * servicesCount;

  return {
    totalCities: cities.length,
    totalDistricts,
    servicesPerDistrict: servicesCount,
    totalPages,
    estimatedIndexingTime: `${Math.ceil(totalPages / 100)} gün (günde 100 sayfa indeksleme)`
  };
}

// ==========================================
// MARKA BAZLI SEO SİSTEMİ
// ==========================================

export interface CarBrand {
  name: string;
  slug: string;
  type: "standard" | "luxury" | "electric" | "suv";
}

export const POPULAR_BRANDS: CarBrand[] = [
  // En Çok Satanlar
  { name: "Fiat", slug: "fiat", type: "standard" },
  { name: "Renault", slug: "renault", type: "standard" },
  { name: "Volkswagen", slug: "volkswagen", type: "standard" },
  { name: "Ford", slug: "ford", type: "standard" },
  { name: "Toyota", slug: "toyota", type: "standard" },
  { name: "Hyundai", slug: "hyundai", type: "standard" },
  { name: "Opel", slug: "opel", type: "standard" },
  { name: "Peugeot", slug: "peugeot", type: "standard" },
  { name: "Honda", slug: "honda", type: "standard" },
  { name: "Citroën", slug: "citroen", type: "standard" },
  { name: "Dacia", slug: "dacia", type: "standard" },
  { name: "Skoda", slug: "skoda", type: "standard" },
  { name: "Kia", slug: "kia", type: "standard" },
  { name: "Seat", slug: "seat", type: "standard" },
  { name: "Nissan", slug: "nissan", type: "standard" },
  
  // Lüks / Premium
  { name: "BMW", slug: "bmw", type: "luxury" },
  { name: "Mercedes-Benz", slug: "mercedes", type: "luxury" },
  { name: "Audi", slug: "audi", type: "luxury" },
  { name: "Volvo", slug: "volvo", type: "luxury" },
  { name: "Land Rover", slug: "land-rover", type: "luxury" },
  { name: "Porsche", slug: "porsche", type: "luxury" },
  
  // Elektrikli / Özel İlgi
  { name: "Tesla", slug: "tesla", type: "electric" },
  { name: "Togg", slug: "togg", type: "electric" },
  { name: "Chery", slug: "chery", type: "suv" },
];

export const getBrandBySlug = (slug: string): CarBrand | null => {
  return POPULAR_BRANDS.find((b) => b.slug === slug) || null;
};

// ==========================================
// PARTNER SEO SİSTEMİ (B2B)
// ==========================================

export interface PartnerSEOPage {
  city: string;
  citySlug: string;
  district: string;
  districtSlug: string;
  service: ServiceType;
  title: string;
  description: string;
  keywords: string[];
  url: string;
  // Ek partner-specific data
  estimatedMonthlyDemand: number;
  estimatedMonthlyEarnings: { min: number; max: number };
  competitionLevel: 'low' | 'medium' | 'high';
  activePartnerCount: number;
}

// Şehir tipine göre tahmini talep hesapla
function estimateDemand(cityName: string, districtName: string, service: ServiceType): number {
  // Büyük şehirler
  const majorCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
  // Orta şehirler
  const mediumCities = ['Adana', 'Gaziantep', 'Konya', 'Kayseri', 'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun'];
  
  let baseMultiplier = 1;
  
  if (majorCities.includes(cityName)) {
    baseMultiplier = 3.5;
  } else if (mediumCities.includes(cityName)) {
    baseMultiplier = 2;
  } else {
    baseMultiplier = 1;
  }
  
  // Hizmet tipine göre çarpan
  const serviceMultipliers: Record<ServiceType, number> = {
    cekici: 1.2,
    aku: 0.9,
    lastik: 0.8,
    yakit: 0.6,
    anahtar: 0.7
  };
  
  // İlçe adına göre küçük varyasyon (merkez ilçeler daha fazla)
  const districtBonus = districtName.toLowerCase().includes('merkez') ? 1.3 : 1;
  
  // Base talep (aylık)
  const baseDemand = 25;
  
  return Math.round(baseDemand * baseMultiplier * serviceMultipliers[service] * districtBonus);
}

// Tahmini kazanç hesapla
function estimateEarnings(service: ServiceType, monthlyDemand: number): { min: number; max: number } {
  // Hizmet başına ortalama kazanç
  const avgEarningsPerJob: Record<ServiceType, number> = {
    cekici: 850,
    aku: 400,
    lastik: 350,
    yakit: 250,
    anahtar: 600
  };
  
  const avgEarning = avgEarningsPerJob[service];
  
  // Konservatif tahmin: Talebin %30-60'ını alabilir
  const minJobs = Math.floor(monthlyDemand * 0.3);
  const maxJobs = Math.floor(monthlyDemand * 0.6);
  
  return {
    min: minJobs * avgEarning,
    max: maxJobs * avgEarning
  };
}

// Rekabet seviyesi hesapla
function estimateCompetition(cityName: string, monthlyDemand: number): 'low' | 'medium' | 'high' {
  const majorCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
  
  if (majorCities.includes(cityName)) {
    return monthlyDemand > 100 ? 'high' : 'medium';
  }
  
  if (monthlyDemand > 60) return 'medium';
  return 'low';
}

// Aktif partner sayısı tahmini
function estimateActivePartners(monthlyDemand: number, competition: 'low' | 'medium' | 'high'): number {
  const competitionMultipliers = { low: 0.3, medium: 0.5, high: 0.8 };
  const basePartners = monthlyDemand / 20; // Her 20 talebe 1 partner
  
  return Math.max(1, Math.floor(basePartners * competitionMultipliers[competition]));
}

// Partner SEO metadata oluştur
export function generatePartnerSEOMetadata(
  city: string,
  district: string,
  service: ServiceType
): PartnerSEOPage | null {
  const cityData = getCityBySlug(city);
  const districtData = cityData ? getDistrictBySlug(city, district) : null;
  const serviceInfo = getServiceInfo(service);

  if (!cityData || !districtData || !serviceInfo) {
    return null;
  }

  const monthlyDemand = estimateDemand(cityData.name, districtData.name, service);
  const earnings = estimateEarnings(service, monthlyDemand);
  const competition = estimateCompetition(cityData.name, monthlyDemand);
  const activePartners = estimateActivePartners(monthlyDemand, competition);

  const url = `/partner-ol/${service}/${city}/${district}`;
  const title = `${cityData.name} ${districtData.name} ${serviceInfo.title} Partneri Ol | Yolmov İş İlanı`;
  const description = `${cityData.name} ${districtData.name}'da ${serviceInfo.title} partneri olarak ayda ${earnings.min.toLocaleString('tr-TR')}₺ - ${earnings.max.toLocaleString('tr-TR')}₺ kazanın. Hemen başvurun, 7/24 iş fırsatı. ${monthlyDemand} aylık talep!`;

  const keywords = [
    `${districtData.name} ${serviceInfo.shortTitle} partner`,
    `${cityData.name} ${serviceInfo.shortTitle} iş ilanı`,
    `${districtData.name} ${serviceInfo.shortTitle} franchise`,
    `${cityData.name} yol yardım partner`,
    `${districtData.name} ${serviceInfo.shortTitle} kazanç`,
    `${serviceInfo.shortTitle} işi ${cityData.name}`,
    `yolmov partner ${districtData.name}`,
    `${cityData.name} ${districtData.name} ek gelir`
  ];

  return {
    city: cityData.name,
    citySlug: city,
    district: districtData.name,
    districtSlug: district,
    service,
    title,
    description,
    keywords,
    url,
    estimatedMonthlyDemand: monthlyDemand,
    estimatedMonthlyEarnings: earnings,
    competitionLevel: competition,
    activePartnerCount: activePartners
  };
}

// Tüm partner SEO sayfalarını oluştur
export function generateAllPartnerSEOPages(): PartnerSEOPage[] {
  const pages: PartnerSEOPage[] = [];
  const cities = getAllCities();
  const services: ServiceType[] = ['cekici', 'aku', 'lastik', 'yakit', 'anahtar'];

  cities.forEach(city => {
    city.districts.forEach(district => {
      services.forEach(service => {
        const page = generatePartnerSEOMetadata(city.slug, district.slug, service);
        if (page) {
          pages.push(page);
        }
      });
    });
  });

  return pages;
}

// Partner SEO istatistikleri
export function getPartnerSEOStats() {
  const cities = getAllCities();
  const totalDistricts = cities.reduce((sum, city) => sum + city.districts.length, 0);
  const servicesCount = 5;
  const totalPages = totalDistricts * servicesCount;

  return {
    totalCities: cities.length,
    totalDistricts,
    servicesPerDistrict: servicesCount,
    totalPartnerPages: totalPages,
    estimatedIndexingTime: `${Math.ceil(totalPages / 100)} gün (günde 100 sayfa indeksleme)`,
    estimatedMonthlyApplicants: Math.floor(totalPages * 0.02) // %2 conversion estimate
  };
}

