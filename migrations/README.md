# Database Migrations

Bu klasör Supabase veritabanı migration SQL dosyalarını içerir.

## Kullanım

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **SQL Editor** seçin
4. **New Query** butonuna tıklayın
5. İlgili SQL dosyasının içeriğini kopyalayıp yapıştırın
6. **Run** butonuna basın

## Migration Dosyaları

### `create_customer_favorites_table.sql`
- **Tablo:** `customer_favorites`
- **Açıklama:** Müşterilerin favori hizmet sağlayıcıları
- **Alan Yapısı:**
  - `id`: UUID (Primary Key)
  - `customer_id`: UUID (customers tablosuna foreign key)
  - `partner_id`: UUID (partners tablosuna foreign key)
  - `created_at`: TIMESTAMPTZ - Oluşturulma zamanı
- **RLS Policies:** Kullanıcılar sadece kendi favorilerini görebilir/düzenleyebilir
- **Constraint:** Bir müşteri aynı partner'ı birden fazla kez favorilere ekleyemez

### `create_customer_addresses_table.sql`
- **Tablo:** `customer_addresses`
- **Açıklama:** Müşterilerin kayıtlı adreslerini saklar (Ev, İş vb.)
- **Alan Yapısı:**
  - `id`: UUID (Primary Key)
  - `customer_id`: UUID (customers tablosuna foreign key)
  - `label`: VARCHAR(100) - Adres etiketi (ör: "Ev", "İş")
  - `type`: VARCHAR(20) - 'home' veya 'work'
  - `address`: TEXT - Detaylı adres
  - `city`: VARCHAR(100) - Şehir
  - `district`: VARCHAR(100) - İlçe
  - `created_at`: TIMESTAMPTZ - Oluşturulma zamanı
- **RLS Policies:** Kullanıcılar sadece kendi adreslerini görebilir/düzenleyebilir

## Önemli Notlar

- Her migration dosyası **sadece bir kez** çalıştırılmalıdır
- Migration çalıştırmadan önce mutlaka yedek alın
- RLS (Row Level Security) politikaları güvenlik için kritik öneme sahiptir
- Migration hata verirse, Supabase logs'unda detayları kontrol edin

## Sıralama

Migration'ları aşağıdaki sırada çalıştırın:

1. ✅ `create_customer_favorites_table.sql` - Favori hizmet sağlayıcılar tablosu
2. ✅ `create_customer_addresses_table.sql` - Kayıtlı adresler tablosu
