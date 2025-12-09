#!/bin/bash
# Supabase SQL Migration Runner via Management API
# Kullanım: ./scripts/supabase-sql.sh <migration_file.sql>
# veya:    ./scripts/supabase-sql.sh "SQL QUERY HERE"

set -e

# .env.local dosyasından değişkenleri yükle
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

PROJECT_REF="uwslxmciglqxpvfbgjzm"
ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-sbp_7d909969341105d3218f00ae9150474309577882}"

# Argüman kontrolü
if [ -z "$1" ]; then
    echo "❌ Kullanım:"
    echo "  ./scripts/supabase-sql.sh <migration_file.sql>  # SQL dosyası çalıştır"
    echo "  ./scripts/supabase-sql.sh \"SELECT * FROM ...\"   # Direkt SQL çalıştır"
    echo ""
    echo "Mevcut migration dosyaları:"
    ls -1 migrations/*.sql 2>/dev/null || echo "  (hiç migration dosyası yok)"
    exit 1
fi

# Dosya mı yoksa direkt SQL mi?
if [ -f "$1" ]; then
    SQL_CONTENT=$(cat "$1")
    echo "📄 SQL dosyası okunuyor: $1"
else
    SQL_CONTENT="$1"
    echo "💬 Direkt SQL çalıştırılıyor..."
fi

echo "🚀 Supabase'e gönderiliyor..."
echo ""

# Management API ile SQL çalıştır
RESPONSE=$(curl -s -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg sql "$SQL_CONTENT" '{query: $sql}')")

# Sonucu kontrol et
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ Hata:"
    echo "$RESPONSE" | jq -r '.error // .message // .'
    exit 1
else
    echo "✅ Başarılı!"
    echo ""
    # Eğer sonuç varsa göster
    if [ "$(echo "$RESPONSE" | jq 'length')" != "0" ] && [ "$RESPONSE" != "[]" ]; then
        echo "📊 Sonuç:"
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    fi
fi
