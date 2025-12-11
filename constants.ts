
import { 
  Truck, 
  BatteryCharging, 
  Disc, 
  Fuel, 
  Wrench, 
  CarFront, 
  MapPin, 
  Search, 
  PhoneCall, 
  ShieldCheck, 
  Clock, 
  Users 
} from 'lucide-react';
import { ServiceCategory, Step, Advantage, Campaign, Provider, JobRequest } from './types';

// LocalStorage Keys - Centralized to avoid namespace collisions
export const STORAGE_KEYS = {
  // User Data
  customer: 'yolmov_customer',
  partner: 'yolmov_partner',
  admin: 'yolmov_admin',
  
  // Application Data
  requests: 'yolmov_requests',
  offers: 'yolmov_offers',
  notifications: 'yolmov_notifications',
  
  // Demo & Init
  demoInitialized: 'yolmov_demo_initialized',
  
  // Preferences
  theme: 'yolmov_theme',
  language: 'yolmov_language'
} as const;

// ============================================
// SERVICE TYPE ENUM (Database Sync)
// ============================================
// ⚠️ UYARI: Bu değerler PostgreSQL enum service_type ile TAMAMEN eşleşmelidir
// Veritabanı: supabase/MASTER_SCHEMA.sql -> CREATE TYPE service_type AS ENUM (...)
// Güncelleme: sql-queries/fix-service-type-enum.sql

export const SERVICE_TYPES = {
  CEKICI: 'cekici',      // Çekici hizmeti
  AKU: 'aku',            // Akü takviyesi
  LASTIK: 'lastik',      // Lastik değişimi
  YAKIT: 'yakit',        // Yakıt desteği
  YARDIM: 'yardim',      // Genel yol yardımı
  TAMIR: 'tamir',        // Oto tamir (2025-12-11 eklendi)
  ANAHTAR: 'anahtar',    // Anahtar çilingir (rezerve)
} as const;

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];

// Frontend sector → Database service_type mapping
export const SECTOR_TO_SERVICE_TYPE: Record<string, ServiceType> = {
  'tow': SERVICE_TYPES.CEKICI,
  'tire': SERVICE_TYPES.LASTIK,
  'repair': SERVICE_TYPES.TAMIR,
  'battery': SERVICE_TYPES.AKU,
  'fuel': SERVICE_TYPES.YAKIT,
  'locksmith': SERVICE_TYPES.ANAHTAR,
};

export const SERVICES: ServiceCategory[] = [
  {
    id: 'tow',
    title: 'Çekici Hizmeti',
    description: 'Aracınız bozulduğunda veya kaza durumunda en yakın çekici.',
    icon: Truck
  },
  {
    id: 'battery',
    title: 'Akü Takviyesi',
    description: 'Akünüz mü bitti? Hızlıca takviye veya değişim desteği.',
    icon: BatteryCharging
  },
  {
    id: 'tire',
    title: 'Lastik Değişimi',
    description: 'Lastiğiniz patladıysa yerinde değişim veya tamir.',
    icon: Disc
  },
  {
    id: 'fuel',
    title: 'Yakıt Getirme',
    description: 'Yolda yakıtınız bittiyse size en yakın istasyondan yakıt.',
    icon: Fuel
  },
  {
    id: 'rescue',
    title: 'Araç Kurtarma',
    description: 'Zorlu koşullarda yolda kalan aracınız için kurtarma.',
    icon: CarFront
  },
  {
    id: 'general',
    title: 'Genel Yol Yardım',
    description: 'Anahtar kaybı ve diğer teknik sorunlar için destek.',
    icon: Wrench
  }
];

export const HOW_IT_WORKS_STEPS: Step[] = [
  {
    id: 1,
    title: 'Konumunu Belirt',
    description: 'GPS üzerinden konumunu paylaş veya adresi manuel gir.',
    icon: MapPin
  },
  {
    id: 2,
    title: 'Hizmeti Seç',
    description: 'İhtiyacın olan yol yardım hizmetini kategorilerden seç.',
    icon: Search
  },
  {
    id: 3,
    title: 'Yardım Yola Çıksın',
    description: 'En yakın uzman ekipten teklif al ve onayla.',
    icon: Truck
  }
];

export const ADVANTAGES: Advantage[] = [
  { id: 'trust', title: 'Güvenilir Hizmet', icon: ShieldCheck },
  { id: 'network', title: 'Doğrulanmış Acente Ağı', icon: Users },
  { id: 'speed', title: 'Hızlı Erişim', icon: Clock },
  { id: 'support', title: '7/24 Canlı Destek', icon: PhoneCall },
];

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'winter',
    title: 'Kış Bakım Fırsatı',
    description: 'Kış lastiği değişimlerinde %20 indirim fırsatını kaçırmayın.',
    badgeText: '%20 İndirim',
    image: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'first',
    title: 'İlk Kullanıma Özel',
    description: 'Uygulamayı indirin, ilk çekici hizmetinde 100 TL indirim kazanın.',
    badgeText: '100 TL Hediye',
    image: 'https://images.unsplash.com/photo-1625231273630-14578da6f35a?q=80&w=1000&auto=format&fit=crop'
  }
];

export const CITIES_WITH_DISTRICTS: Record<string, string[]> = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Adıyaman": ["Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Merkez", "Samsat", "Sincik", "Tut"],
  "Afyonkarahisar": ["Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut"],
  "Ağrı": ["Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Merkez", "Patnos", "Taşlıçay", "Tutak"],
  "Aksaray": ["Ağaçören", "Eskil", "Gülağaç", "Güzelyurt", "Merkez", "Ortaköy", "Sarıyahşi", "Sultanhanı"],
  "Amasya": ["Göynücek", "Gümüşhacıköy", "Hamamözü", "Merkez", "Merzifon", "Suluova", "Taşova"],
  "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kalecik", "Kahramankazan", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  "Ardahan": ["Çıldır", "Damal", "Göle", "Hanak", "Merkez", "Posof"],
  "Artvin": ["Ardanuç", "Arhavi", "Borçka", "Hopa", "Kemalpaşa", "Merkez", "Murgul", "Şavşat", "Yusufeli"],
  "Aydın": ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"],
  "Balıkesir": ["Altınyayla", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"],
  "Bartın": ["Amasra", "Kurucaşile", "Merkez", "Ulus"],
  "Batman": ["Beşiri", "Gercüş", "Hasankeyf", "Kozluk", "Merkez", "Sason"],
  "Bayburt": ["Aydıntepe", "Demirözü", "Merkez"],
  "Bilecik": ["Bozüyük", "Gölpazarı", "İnhisar", "Merkez", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"],
  "Bingöl": ["Adaklı", "Genç", "Karlıova", "Kiğı", "Merkez", "Solhan", "Yayladere", "Yedisu"],
  "Bitlis": ["Adilcevaz", "Ahlat", "Güroymak", "Hizan", "Merkez", "Mutki", "Tatvan"],
  "Bolu": ["Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Merkez", "Mudurnu", "Seben", "Yeniçağa"],
  "Burdur": ["Ağlasun", "Altınyayla", "Bucak", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Merkez", "Tefenni", "Yeşilova"],
  "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
  "Çanakkale": ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Merkez", "Yenice"],
  "Çankırı": ["Atkaracalar", "Bayramören", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Merkez", "Orta", "Şabanözü", "Yapraklı"],
  "Çorum": ["Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Merkez", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"],
  "Denizli": ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkezefendi", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"],
  "Diyarbakır": ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"],
  "Düzce": ["Akçakoca", "Cumayeri", "Çilimli", "Gölyaka", "Gümüşova", "Kaynaşlı", "Merkez", "Yığılca"],
  "Edirne": ["Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Meriç", "Merkez", "Süloğlu", "Uzunköprü"],
  "Elazığ": ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Karakoçan", "Keban", "Kovancılar", "Maden", "Merkez", "Palu", "Sivrice"],
  "Erzincan": ["Çayırlı", "İliç", "Kemah", "Kemaliye", "Merkez", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"],
  "Erzurum": ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"],
  "Eskişehir": ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"],
  "Gaziantep": ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"],
  "Giresun": ["Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Görele", "Güce", "Keşap", "Merkez", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"],
  "Gümüşhane": ["Kelkit", "Köse", "Kürtün", "Merkez", "Şiran", "Torul"],
  "Hakkari": ["Çukurca", "Derecik", "Merkez", "Şemdinli", "Yüksekova"],
  "Hatay": ["Altınözü", "Antakya", "Arsuz", "Belen", "Defne", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"],
  "Iğdır": ["Aralık", "Karakoyunlu", "Merkez", "Tuzluca"],
  "Isparta": ["Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Keçiborlu", "Merkez", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Yenişarbademli"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
  "Kahramanmaraş": ["Afşin", "Andırın", "Çağlayancerit", "Dulkadiroğlu", "Ekinözü", "Elbistan", "Göksun", "Nurhak", "Onikişubat", "Pazarcık", "Türkoğlu"],
  "Karabük": ["Eflani", "Eskipazar", "Merkez", "Ovacık", "Safranbolu", "Yenice"],
  "Karaman": ["Ayrancı", "Başyayla", "Ermenek", "Kazımkarabekir", "Merkez", "Sarıveliler"],
  "Kars": ["Akyaka", "Arpaçay", "Digor", "Kağızman", "Merkez", "Sarıkamış", "Selim", "Susuz"],
  "Kastamonu": ["Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Cide", "Çatalzeytin", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Küre", "Merkez", "Pınarbaşı", "Seydiler", "Şenpazar", "Taşköprü", "Tosya"],
  "Kayseri": ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"],
  "Kırıkkale": ["Bahşılı", "Balışeyh", "Çelebi", "Delice", "Karakeçili", "Keskin", "Merkez", "Sulakyurt", "Yahşihan"],
  "Kırklareli": ["Babaeski", "Demirköy", "Kofçaz", "Lüleburgaz", "Merkez", "Pehlivanköy", "Pınarhisar", "Vize"],
  "Kırşehir": ["Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Merkez", "Mucur"],
  "Kilis": ["Elbeyli", "Merkez", "Musabeyli", "Polateli"],
  "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
  "Konya": ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"],
  "Kütahya": ["Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Merkez", "Pazarlar", "Simav", "Şaphane", "Tavşanlı"],
  "Malatya": ["Akçadağ", "Arapgir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Pütürge", "Yazıhan", "Yeşilyurt"],
  "Manisa": ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"],
  "Mardin": ["Artuklu", "Dargeçit", "Derik", "Kızıltepe", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"],
  "Mersin": ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"],
  "Muğla": ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"],
  "Muş": ["Bulanık", "Hasköy", "Korkut", "Malazgirt", "Merkez", "Varto"],
  "Nevşehir": ["Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Merkez", "Ürgüp"],
  "Niğde": ["Altunhisar", "Bor", "Çamardı", "Çiftlik", "Merkez", "Ulukışla"],
  "Ordu": ["Akkuş", "Altınordu", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye"],
  "Osmaniye": ["Bahçe", "Düziçi", "Hasanbeyli", "Kadirli", "Merkez", "Sumbas", "Toprakkale"],
  "Rize": ["Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Merkez", "Pazar"],
  "Sakarya": ["Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"],
  "Samsun": ["19 Mayıs", "Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "İlkadım", "Kavak", "Ladik", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"],
  "Siirt": ["Baykan", "Eruh", "Kurtalan", "Merkez", "Pervari", "Şirvan", "Tillo"],
  "Sinop": ["Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Merkez", "Saraydüzü", "Türkeli"],
  "Sivas": ["Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gölova", "Gürün", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Merkez", "Suşehri", "Şarkışla", "Ulaş", "Yıldızeli", "Zara"],
  "Şanlıurfa": ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"],
  "Şırnak": ["Beytüşşebap", "Cizre", "Güçlükonak", "İdil", "Merkez", "Silopi", "Uludere"],
  "Tekirdağ": ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Süleymanpaşa", "Şarköy"],
  "Tokat": ["Almus", "Artova", "Başçiftlik", "Erbaa", "Merkez", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Turhal", "Yeşilyurt", "Zile"],
  "Trabzon": ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"],
  "Tunceli": ["Çemişgezek", "Hozat", "Mazgirt", "Merkez", "Nazımiye", "Ovacık", "Pertek", "Pülümür"],
  "Uşak": ["Banaz", "Eşme", "Karahallı", "Merkez", "Sivaslı", "Ulubey"],
  "Van": ["Bahçesaray", "Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Muradiye", "Özalp", "Saray", "Tuşba"],
  "Yalova": ["Altınova", "Armutlu", "Çınarcık", "Çiftlikköy", "Merkez", "Termal"],
  "Yozgat": ["Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadışehri", "Merkez", "Saraykent", "Sarıkaya", "Sorgun", "Şefaatli", "Yenifakılı", "Yerköy"],
  "Zonguldak": ["Alaplı", "Çaycuma", "Devrek", "Ereğli", "Gökçebey", "Kilimli", "Kozlu", "Merkez"]
};

// Mock Provider Data
export const PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Yılmaz Oto Kurtarma',
    serviceType: 'Çekici Hizmeti',
    rating: 4.8,
    reviewCount: 124,
    distance: '2.5 km',
    eta: '15 dk',
    priceStart: 500,
    isVerified: true,
    location: 'Kadıköy / İstanbul',
    image: 'https://images.unsplash.com/photo-1625231273630-14578da6f35a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '2',
    name: 'Jet Akü Servisi',
    serviceType: 'Akü Takviyesi',
    rating: 4.9,
    reviewCount: 85,
    distance: '1.2 km',
    eta: '10 dk',
    priceStart: 350,
    isVerified: true,
    location: 'Beşiktaş / İstanbul',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '3',
    name: 'Güven Lastik & Yol Yardım',
    serviceType: 'Lastik Değişimi',
    rating: 4.6,
    reviewCount: 210,
    distance: '5.0 km',
    eta: '25 dk',
    priceStart: 400,
    isVerified: false,
    location: 'Ümraniye / İstanbul',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '4',
    name: 'Ankara Merkez Çekici',
    serviceType: 'Çekici Hizmeti',
    rating: 4.7,
    reviewCount: 96,
    distance: '3.8 km',
    eta: '20 dk',
    priceStart: 600,
    isVerified: true,
    location: 'Çankaya / Ankara',
    image: 'https://images.unsplash.com/photo-1562969838-37e1cb9114b8?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '5',
    name: 'Mobil Yakıt Destek',
    serviceType: 'Yakıt Getirme',
    rating: 4.9,
    reviewCount: 45,
    distance: '10 km',
    eta: '30 dk',
    priceStart: 250,
    isVerified: true,
    location: 'Bornova / İzmir',
    image: 'https://images.unsplash.com/photo-1527016021513-b09f58528427?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '6',
    name: 'Gece Nöbetçi Tamirci',
    serviceType: 'Genel Yol Yardım',
    rating: 4.5,
    reviewCount: 32,
    distance: '8.5 km',
    eta: '40 dk',
    priceStart: 450,
    isVerified: false,
    location: 'Nilüfer / Bursa',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=400'
  }
];

// Mock Partner Request Data
// Partner requests will be loaded from Supabase dynamically

// ============================================================================
// 🚀 YENİ PROGRAMATIK SEO STRATEJİLERİ
// ============================================================================

// 1. ŞEHİRLER ARASI ÇEKİCİ (High Ticket - 20K-50K TL) 🚛
// Format: /sehirler-arasi-cekici/{kalkis-ili}-{varis-ili}
export const INTERCITY_ROUTES = {
  // Ana güzergahlar (En çok talep gören)
  highDemand: [
    { from: 'istanbul', to: 'ankara', fromName: 'İstanbul', toName: 'Ankara' },
    { from: 'istanbul', to: 'izmir', fromName: 'İstanbul', toName: 'İzmir' },
    { from: 'istanbul', to: 'antalya', fromName: 'İstanbul', toName: 'Antalya' },
    { from: 'ankara', to: 'izmir', fromName: 'Ankara', toName: 'İzmir' },
    { from: 'ankara', to: 'antalya', fromName: 'Ankara', toName: 'Antalya' },
    { from: 'izmir', to: 'antalya', fromName: 'İzmir', toName: 'Antalya' },
  ],
  // Tüm iller için dinamik kombinasyon yapılabilir
  generateAll: true, // 81x80 = 6,480 sayfa
};

// 2. ÖZEL ARAÇ & LÜKS TAŞIMA (Niş Pazar - 5K-10K TL) 🏎️
// Format: /tasima/{arac-tipi}/{il}/{ilce}
export const SPECIAL_VEHICLE_TYPES = [
  {
    id: 'tekne',
    name: 'Tekne Taşıma',
    slug: 'tekne',
    description: 'Tekne, yat ve deniz aracı taşıma hizmeti',
    avgPrice: 8000,
    icon: '⛵',
    targetCities: ['mugla', 'antalya', 'izmir', 'istanbul'], // Kıyı şehirleri
  },
  {
    id: 'forklift',
    name: 'Forklift Taşıma',
    slug: 'forklift',
    description: 'İş makinesi ve forklift nakliyesi',
    avgPrice: 6500,
    icon: '🏗️',
    targetCities: ['kocaeli', 'bursa', 'ankara', 'istanbul', 'izmir'], // Sanayi şehirleri
  },
  {
    id: 'karavan',
    name: 'Karavan Taşıma',
    slug: 'karavan',
    description: 'Karavan ve motorhome çekici hizmeti',
    avgPrice: 5500,
    icon: '🚐',
    targetCities: ['antalya', 'mugla', 'aydin', 'izmir'], // Turizm bölgeleri
  },
  {
    id: 'motosiklet',
    name: 'Motosiklet Çekici',
    slug: 'motosiklet',
    description: 'Motorsiklet ve ATV taşıma',
    avgPrice: 2500,
    icon: '🏍️',
    targetCities: ['istanbul', 'ankara', 'izmir', 'antalya'], // Büyük şehirler
  },
  {
    id: 'klasik-arac',
    name: 'Klasik Araç Taşıma',
    slug: 'klasik-arac',
    description: 'Antika ve koleksiyon araç nakliyesi',
    avgPrice: 9000,
    icon: '🚗',
    targetCities: ['istanbul', 'ankara', 'izmir'], // Koleksiyoner şehirler
  },
  {
    id: 'is-makinesi',
    name: 'İş Makinesi Taşıma',
    slug: 'is-makinesi',
    description: 'Vinç, greyder, kazıcı taşıma',
    avgPrice: 12000,
    icon: '🚜',
    targetCities: ['ankara', 'istanbul', 'izmir', 'kocaeli', 'bursa'], // Sanayi
  },
];

// 3. NÖBETÇİ SERVİSLER (Aciliyet - %100 Conversion) 🌙
// Format: /nobetci/{hizmet}/{il}/{ilce}
export const ON_DUTY_SERVICES = [
  { id: 'lastikci', name: 'Nöbetçi Lastikçi', slug: 'lastikci' },
  { id: 'aku', name: 'Nöbetçi Akü', slug: 'aku' },
  { id: 'cekici', name: 'Nöbetçi Çekici', slug: 'cekici' },
  { id: 'oto-elektrik', name: 'Nöbetçi Oto Elektrik', slug: 'oto-elektrik' },
  { id: 'cam', name: 'Nöbetçi Cam Tamiri', slug: 'cam' },
];

// 4. ÖZEL LOKASYONLAR (Mikro Hedefleme) 🏭
// Format: /cekici/{ozel-lokasyon}
export const SPECIAL_LOCATIONS = [
  // Otoyollar
  { slug: 'tem-otoyolu', name: 'TEM Otoyolu', city: 'İstanbul', type: 'highway' },
  { slug: 'kuzey-marmara-otoyolu', name: 'Kuzey Marmara Otoyolu', city: 'İstanbul', type: 'highway' },
  { slug: 'o-3-otoyolu', name: 'O-3 Otoyolu (Avrupa)', city: 'İstanbul', type: 'highway' },
  { slug: 'o-4-otoyolu', name: 'O-4 Otoyolu', city: 'İstanbul', type: 'highway' },
  { slug: 'ankara-izmir-otoyolu', name: 'Ankara-İzmir Otoyolu', city: 'Ankara', type: 'highway' },
  
  // Havalimanları
  { slug: 'istanbul-havalimani', name: 'İstanbul Havalimanı', city: 'İstanbul', type: 'airport' },
  { slug: 'sabiha-gokcen', name: 'Sabiha Gökçen Havalimanı', city: 'İstanbul', type: 'airport' },
  { slug: 'esenboga-havalimani', name: 'Esenboğa Havalimanı', city: 'Ankara', type: 'airport' },
  { slug: 'izmir-adnan-menderes', name: 'İzmir Adnan Menderes Havalimanı', city: 'İzmir', type: 'airport' },
  { slug: 'antalya-havalimani', name: 'Antalya Havalimanı', city: 'Antalya', type: 'airport' },
  
  // Sanayi Bölgeleri
  { slug: 'ostim-sanayi', name: 'OSTİM Sanayi Sitesi', city: 'Ankara', type: 'industrial' },
  { slug: 'ikitelli-osb', name: 'İkitelli OSB', city: 'İstanbul', type: 'industrial' },
  { slug: 'dudullu-osb', name: 'Dudullu OSB', city: 'İstanbul', type: 'industrial' },
  { slug: 'gebze-osb', name: 'Gebze Organize Sanayi', city: 'Kocaeli', type: 'industrial' },
  { slug: 'ege-serbest-bolge', name: 'Ege Serbest Bölgesi', city: 'İzmir', type: 'industrial' },
  
  // Oto Sanayi Siteleri
  { slug: 'maslak-oto-sanayi', name: 'Maslak Oto Sanayi', city: 'İstanbul', type: 'automotive' },
  { slug: 'mecidiyekoy-oto-sanayi', name: 'Mecidiyeköy Oto Sanayi', city: 'İstanbul', type: 'automotive' },
  { slug: 'topkapi-oto-sanayi', name: 'Topkapı Oto Sanayi', city: 'İstanbul', type: 'automotive' },
  { slug: 'kozyatagi-oto-sanayi', name: 'Kozyatağı Oto Sanayi', city: 'İstanbul', type: 'automotive' },
];

// 5. FİYAT SAYFALARI (Bilgi Arayanlar) 🏷️
// Format: /fiyatlari/{hizmet}/{il}/{yil}
export const PRICING_SERVICES = [
  { id: 'cekici', name: 'Çekici Fiyatları', slug: 'cekici' },
  { id: 'oto-kurtarma', name: 'Oto Kurtarma Fiyatları', slug: 'oto-kurtarma' },
  { id: 'lastik-degisimi', name: 'Lastik Değişimi Fiyatları', slug: 'lastik-degisimi' },
  { id: 'aku-takviyesi', name: 'Akü Takviyesi Fiyatları', slug: 'aku-takviyesi' },
  { id: 'sehirler-arasi', name: 'Şehirler Arası Çekici Fiyatları', slug: 'sehirler-arasi' },
  { id: 'yakit-yardimi', name: 'Yakıt Yardımı Fiyatları', slug: 'yakit-yardimi' },
];

export const PRICING_YEAR = 2025;

// ============================================================================
// SAYFA SAYISI HESAPLAMALARı
// ============================================================================
// 1. Şehirler Arası: 81 x 80 = 6,480 sayfa
// 2. Özel Araç: 6 tip x 973 ilçe = 5,838 sayfa
// 3. Nöbetçi: 5 hizmet x 973 ilçe = 4,865 sayfa
// 4. Özel Lokasyonlar: 20 lokasyon = 20 sayfa
// 5. Fiyat: 6 hizmet x 81 il = 486 sayfa
// ============================================================================
// YENİ TOPLAM: 17,689 sayfa
// MEVCUT: 9,766 sayfa
// GRAND TOTAL: 27,455 sayfa 🚀
// ============================================================================

