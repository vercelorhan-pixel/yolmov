# 🚗 YOLMOV - Türkiye'nin Yol Yardım Platformu

<div align="center">
  <img src="https://raw.githubusercontent.com/yosoyorhan/repo2/refs/heads/main/yolmov-logo-cutter.png" alt="YOLMOV Logo" width="200"/>
  
  <p align="center">
    <strong>Yolda kaldığınız her an yanınızdayız!</strong><br />
    Modern, hızlı ve güvenilir yol yardım çözümü
  </p>

  <p align="center">
    <a href="#özellikler">Özellikler</a> •
    <a href="#kurulum">Kurulum</a> •
    <a href="#kullanım">Kullanım</a> •
    <a href="#demo-kullanıcılar">Demo</a> •
    <a href="#teknoloji-stack">Teknoloji</a>
  </p>
</div>

---

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
- [Kullanım Kılavuzu](#kullanım)
- [Demo Kullanıcılar](#demo-kullanıcılar)
- [Teknoloji Stack](#teknoloji-stack)
- [Proje Yapısı](#proje-yapısı)
- [Ekran Görüntüleri](#ekran-görüntüleri)
- [Lisans](#lisans)

---

## ✨ Özellikler

### 🎯 B2C (Müşteri) Özellikleri
- **Anında Yol Yardım Talebi**: Konum tabanlı hızlı talep oluşturma
- **Çoklu Teklif Sistemi**: Birden fazla servis sağlayıcıdan teklif alma
- **Gerçek Zamanlı Bildirimler**: Anlık teklif ve durum güncellemeleri
- **Müşteri Profili**: Talep geçmişi, araç bilgileri, kişisel ayarlar
- **Şeffaf Fiyatlandırma**: Net ve anlaşılır fiyat teklifleri
- **5 Ana Hizmet**: Çekici, Akü Takviyesi, Lastik Değişimi, Yakıt Desteği, Oto Kurtarma

### 💼 B2B (Partner) Özellikleri
- **Partner Dashboard**: Kapsamlı iş yönetim paneli
- **Talep Yönetimi**: Gelen talepleri görüntüleme ve teklif gönderme
- **Otomatik Fiyatlandırma**: Mesafe ve hizmet tipine göre dinamik fiyatlama
- **İstatistikler**: Gelir, tamamlanan işler, müşteri memnuniyeti
- **Profil Yönetimi**: Şirket bilgileri, araç filosu, hizmet bölgeleri

### ⚙️ Admin Panel
- **Kullanıcı Yönetimi**: Müşteri ve partner onay/reddetme
- **Sistem İzleme**: Toplam istatistikler ve performans metrikleri
- **Talep/Teklif Yönetimi**: Tüm işlemlerin merkezi kontrolü
- **Güvenli Erişim**: `/operasyon` URL ile özel admin girişi

### 🌐 Kurumsal Sayfalar
- **Hakkımızda**: Misyon, vizyon, değerler, ekip
- **Hizmetler**: Detaylı hizmet açıklamaları ve fiyatlandırma
- **Blog**: Araç bakımı, sürüş ipuçları, haberler
- **Kariyer**: Açık pozisyonlar ve başvuru formu
- **İletişim**: İletişim formu, harita, sosyal medya
- **SSS**: Kategorize edilmiş sık sorulan sorular

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+ 
- npm veya yarn

### Adım Adım Kurulum

1. **Repository'yi Klonlayın**
```bash
git clone https://github.com/kullanici-adi/yolmov.git
cd yolmov
```

2. **Bağımlılıkları Yükleyin**
```bash
npm install
```

3. **Geliştirme Sunucusunu Başlatın**
```bash
npm run dev
```

4. **Tarayıcınızda Açın**
```
http://localhost:5173
```

### Production Build

```bash
# Build oluştur
npm run build

# Build'i test et
npm run preview
```

---

## 📖 Kullanım

### Müşteri Akışı
1. Ana sayfada **"Hemen Yardım İste"** butonuna tıklayın
2. Hizmet tipini seçin (Çekici, Akü, Lastik vb.)
3. Konum ve araç bilgilerinizi girin
4. Partnerlerden gelen teklifleri karşılaştırın
5. En uygun teklifi kabul edin
6. Servis sağlayıcısı size ulaşsın!

### Partner Akışı
1. **"Partner Ol"** butonuyla kayıt olun
2. Şirket ve araç bilgilerinizi doldurun
3. Dashboard'dan gelen talepleri görüntüleyin
4. İlgilendiğiniz taleplere teklif gönderin
5. Kabul edilen teklifleri yerine getirin

### Admin Erişimi
- URL'ye `/operasyon` yazarak admin girişine ulaşın
- Demo: `admin@yolmov.com` / `admin123`

---

## 🎭 Demo Kullanıcılar

### Müşteri Hesabı
- **Email**: `demo@example.com`
- **Şifre**: `demo123`
- **Özellikler**: Aktif talepler, teklif geçmişi, profil yönetimi

### Partner Hesabı
- **Email**: `partner@example.com`
- **Şifre**: `partner123`
- **Özellikler**: Talep listesi, teklif gönderme, istatistikler

### Admin Hesabı
- **Email**: `admin@yolmov.com`
- **Şifre**: `admin123`
- **Erişim**: `yoursite.com/operasyon`

---

## 🛠 Teknoloji Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool ve dev server
- **Tailwind CSS**: Utility-first CSS
- **Framer Motion**: Animations
- **Lucide React**: Icon library

### State Management
- **React Hooks**: useState, useEffect
- **LocalStorage**: Persistent data storage

### Routing
- **Manual State-Based**: Custom routing logic

### Design System
- **Design Tokens**: Centralized theme configuration
- **Component Library**: Reusable UI components
- **Responsive Design**: Mobile-first approach

---

## 📁 Proje Yapısı

```
yolmov/
├── components/           # React components
│   ├── AboutPage.tsx
│   ├── AdminDashboard.tsx
│   ├── BlogPage.tsx
│   ├── CareerPage.tsx
│   ├── ContactPage.tsx
│   ├── CustomerProfilePage.tsx
│   ├── FAQPage.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── NotFoundPage.tsx
│   ├── PartnerDashboard.tsx
│   ├── ServicesPage.tsx
│   └── shared/           # Shared components
│       ├── NotificationCenter.tsx
│       └── UIComponents.tsx
├── services/             # Business logic
│   ├── demoData.ts       # Demo data initialization
│   ├── mockApi.ts        # Mock API calls
│   └── notifications.ts  # Notification service
├── App.tsx               # Main app component
├── constants.ts          # App constants & config
├── types.ts              # TypeScript types
├── index.html            # HTML template
└── package.json          # Dependencies

```

---

## 📸 Ekran Görüntüleri

### Ana Sayfa
Modern hero bölümü, hizmet kartları, nasıl çalışır, avantajlar

### Müşteri Dashboard
Profil yönetimi, aktif talepler, teklif karşılaştırma

### Partner Dashboard
Gelen talepler, teklif gönderme, istatistikler

### Admin Panel
Kullanıcı yönetimi, sistem metrikleri, talep/teklif kontrolü

---

## 🔧 Özelleştirme

### Renk Teması
`tailwind.config` içindeki `brand` renklerini değiştirin:
```javascript
colors: {
  brand: {
    orange: '#FF7A00',
    lightOrange: '#FF9A2A',
    dark: '#333333',
    light: '#F5F5F5'
  }
}
```

### Demo Verileri
`services/demoData.ts` dosyasından demo kullanıcıları ve talepleri düzenleyin

### LocalStorage Keys
`constants.ts` içindeki `STORAGE_KEYS` objesini kullanın

---

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📜 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 📞 İletişim

**YOLMOV Teknoloji A.Ş.**
- Website: https://yolmov.com
- Email: destek@yolmov.com
- Phone: 0850 XXX XX XX

---

<div align="center">
  <p>⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!</p>
  <p>Made with ❤️ by YOLMOV Team</p>
</div>

