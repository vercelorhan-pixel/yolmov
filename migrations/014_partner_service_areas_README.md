# Migration 014: Partner Hizmet Bölgeleri ve Araç Dönüş Rotaları

## Açıklama

Bu migration, partner hizmet bölgelerini ve araç boş dönüş rotalarını yönetmek için gerekli tabloları oluşturur.

## Yeni Tablolar

### 1. `partner_service_areas`
Partner'ların hangi illere hizmet verdiğini tanımlar.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| partner_id | UUID | Partner referansı |
| city | VARCHAR(100) | İl adı |
| districts | TEXT[] | Hizmet verilen ilçeler (NULL = tüm il) |
| is_primary | BOOLEAN | Ana hizmet bölgesi mi? |
| price_multiplier | DECIMAL(3,2) | Bölgeye özel fiyat çarpanı |
| is_active | BOOLEAN | Aktif mi? |

### 2. `vehicle_return_routes`
Boş dönen araçların güzergah bilgilerini tutar.

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| partner_id | UUID | Partner referansı |
| vehicle_id | UUID | Araç referansı (opsiyonel) |
| origin_city | VARCHAR(100) | Başlangıç şehri |
| destination_city | VARCHAR(100) | Hedef şehri |
| route_cities | TEXT[] | Geçilen iller sırasıyla |
| departure_date | DATE | Hareket tarihi |
| discount_percent | INTEGER | İndirim yüzdesi (0-100) |
| status | route_status | active, completed, cancelled |

## Yeni Fonksiyonlar

1. `get_partners_by_service_area(city)` - Belirli bir şehirde hizmet veren partnerleri döndürür
2. `get_return_routes_by_city(city)` - Belirli bir şehirden geçen boş dönüş rotalarını döndürür
3. `get_available_partners_for_city(city)` - Kombine sorgu (hizmet bölgesi + boş dönüş)

## Kullanım Örnekleri

```sql
-- İstanbul'da hizmet veren partnerler
SELECT * FROM get_partners_by_service_area('İstanbul');

-- Antalya'dan geçen boş dönüş rotaları
SELECT * FROM get_return_routes_by_city('Antalya');

-- Tüm uygun partnerler (hizmet + boş dönüş)
SELECT * FROM get_available_partners_for_city('Bursa');
```

## Çalıştırma

```bash
# Supabase SQL Editor'de çalıştırın
# veya
psql -h <host> -U <user> -d <database> -f migrations/014_partner_service_areas.sql
```

## Geri Alma (Rollback)

```sql
DROP FUNCTION IF EXISTS get_available_partners_for_city;
DROP FUNCTION IF EXISTS get_return_routes_by_city;
DROP FUNCTION IF EXISTS get_partners_by_service_area;
DROP TABLE IF EXISTS vehicle_return_routes CASCADE;
DROP TABLE IF EXISTS partner_service_areas CASCADE;
```
