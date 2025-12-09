// Demo data initialization service
import { seedDemoNotifications } from './notifications';

export const initDemoData = () => {
  const initialized = localStorage.getItem('yolmov_demo_initialized');
  
  if (!initialized) {
    console.log('🚀 Initializing demo data...');
    
    // Seed notifications
    seedDemoNotifications();
    
    // Seed demo requests
    seedDemoRequests();
    
    // Seed demo offers
    seedDemoOffers();
    
    // Mark as initialized
    localStorage.setItem('yolmov_demo_initialized', 'true');
    
    console.log('✅ Demo data initialized successfully');
  }
};

export const seedDemoRequests = () => {
  const existingRequests = localStorage.getItem('yolmov_requests');
  
  if (!existingRequests) {
    const demoRequests = [
      {
        id: 'req-1',
        customerId: 'demo-customer-1',
        customerName: 'Ahmet Yılmaz',
        customerPhone: '0532 XXX XX XX',
        serviceType: 'Çekici Hizmeti',
        location: 'Levent, Beşiktaş, İstanbul',
        locationDetails: 'TEM Otoyolu Fatih Sultan Mehmet Köprüsü Öncesi',
        vehiclePlate: '34 ABC 123',
        vehicleBrand: 'Volkswagen',
        vehicleModel: 'Passat',
        vehicleYear: '2019',
        description: 'Motor arızası nedeniyle yolda kaldım. Çekici ihtiyacım var.',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        coordinates: { lat: 41.0782, lng: 29.0100 }
      },
      {
        id: 'req-2',
        customerId: 'demo-customer-2',
        customerName: 'Ayşe Demir',
        customerPhone: '0543 XXX XX XX',
        serviceType: 'Akü Takviyesi',
        location: 'Kadıköy, İstanbul',
        locationDetails: 'Moda Caddesi No: 45',
        vehiclePlate: '34 XYZ 789',
        vehicleBrand: 'Ford',
        vehicleModel: 'Focus',
        vehicleYear: '2020',
        description: 'Akü bitti, takviye gerekiyor.',
        status: 'pending',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        coordinates: { lat: 40.9886, lng: 29.0311 }
      },
      {
        id: 'req-3',
        customerId: 'demo-customer-3',
        customerName: 'Mehmet Kaya',
        customerPhone: '0555 XXX XX XX',
        serviceType: 'Lastik Değişimi',
        location: 'Bakırköy, İstanbul',
        locationDetails: 'E5 Karayolu Bakırköy Mevkii',
        vehiclePlate: '34 DEF 456',
        vehicleBrand: 'Renault',
        vehicleModel: 'Megane',
        vehicleYear: '2021',
        description: 'Lastik patladı, yedek lastik takılması gerekiyor.',
        status: 'active',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        coordinates: { lat: 40.9789, lng: 28.8691 }
      }
    ];
    
    localStorage.setItem('yolmov_requests', JSON.stringify(demoRequests));
    console.log('✅ Demo requests seeded:', demoRequests.length);
  }
};

export const seedDemoOffers = () => {
  const existingOffers = localStorage.getItem('yolmov_offers');
  
  if (!existingOffers) {
    const demoOffers = [
      {
        id: 'offer-1',
        requestId: 'req-1',
        partnerId: 'partner-1',
        partnerName: 'Hızlı Çekici Hizmetleri',
        partnerRating: 4.8,
        price: 850,
        eta: '15 dakika',
        description: 'Profesyonel ekip, modern ekipman ile hizmetinizdeyiz.',
        status: 'pending',
        createdAt: new Date(Date.now() - 3000000).toISOString()
      },
      {
        id: 'offer-2',
        requestId: 'req-1',
        partnerId: 'partner-2',
        partnerName: 'Express Yol Yardım',
        partnerRating: 4.9,
        price: 900,
        eta: '20 dakika',
        description: 'Alanında uzman ekibimizle yanınızdayız.',
        status: 'pending',
        createdAt: new Date(Date.now() - 2700000).toISOString()
      },
      {
        id: 'offer-3',
        requestId: 'req-2',
        partnerId: 'partner-3',
        partnerName: 'Güvenli Oto Servis',
        partnerRating: 4.7,
        price: 200,
        eta: '10 dakika',
        description: 'Akü takviyesi konusunda uzmanız.',
        status: 'accepted',
        createdAt: new Date(Date.now() - 6000000).toISOString()
      }
    ];
    
    localStorage.setItem('yolmov_offers', JSON.stringify(demoOffers));
    console.log('✅ Demo offers seeded:', demoOffers.length);
  }
};

export const resetDemoData = () => {
  localStorage.removeItem('yolmov_demo_initialized');
  localStorage.removeItem('yolmov_requests');
  localStorage.removeItem('yolmov_offers');
  localStorage.removeItem('yolmov_notifications');
  console.log('🗑️ Demo data reset complete');
};
