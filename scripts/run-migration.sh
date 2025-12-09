#!/bin/bash
# Supabase Migration Runner Script
# Kullanım: ./scripts/run-migration.sh <migration_file.sql>

set -e

# .env.local dosyasından değişkenleri yükle
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Argüman kontrolü
if [ -z "$1" ]; then
    echo "❌ Kullanım: ./scripts/run-migration.sh <migration_file.sql>"
    echo ""
    echo "Örnekler:"
    echo "  ./scripts/run-migration.sh migrations/014_partner_service_areas.sql"
    echo "  ./scripts/run-migration.sh migrations/015_new_feature.sql"
    echo ""
    echo "Mevcut migration dosyaları:"
    ls -1 migrations/*.sql 2>/dev/null || echo "  (hiç migration dosyası yok)"
    exit 1
fi

MIGRATION_FILE="$1"

# Dosya var mı kontrol et
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Hata: '$MIGRATION_FILE' dosyası bulunamadı!"
    exit 1
fi

echo "🚀 Migration çalıştırılıyor: $MIGRATION_FILE"
echo "📊 Hedef: $SUPABASE_PROJECT_URL"
echo ""

# Supabase CLI ile migration çalıştır
npx supabase db push --linked --file "$MIGRATION_FILE" 2>/dev/null || {
    # Eğer db push çalışmazsa, doğrudan psql ile dene
    echo "⚠️  Supabase CLI ile çalışmadı, direkt SQL çalıştırılıyor..."
    
    # psql ile çalıştır
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" -f "$MIGRATION_FILE"
}

echo ""
echo "✅ Migration başarıyla tamamlandı!"
