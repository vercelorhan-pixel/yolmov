#!/bin/bash

# Partner Registration API Test Script
# Bu script Vercel deployment'ında environment variables kontrolü yapar

echo "🧪 Partner Registration API Test"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test URL'leri
PROD_URL="https://yolmov.com"
API_ENDPOINT="/api/create-partner-user"

echo "📍 Testing: $PROD_URL$API_ENDPOINT"
echo ""

# Test data
TEST_DATA='{
  "email": "test.partner.'$(date +%s)'@example.com",
  "password": "TestPass123!",
  "first_name": "Test",
  "last_name": "Partner",
  "company_name": "Test Company",
  "phone": "+905551234567",
  "city": "İstanbul",
  "district": "Kadıköy"
}'

echo "📤 Sending test request..."
echo ""

# API çağrısı yap
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  "$PROD_URL$API_ENDPOINT")

# HTTP status code'u ayır
HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "📥 Response:"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

# Status code kontrolü
echo "📊 HTTP Status: $HTTP_STATUS"
echo ""

# Sonuç analizi
if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ SUCCESS: API is working correctly!${NC}"
  echo ""
  echo "Partner registration is functional."
  exit 0
elif [ "$HTTP_STATUS" = "500" ]; then
  echo -e "${RED}❌ ERROR 500: Server configuration error${NC}"
  echo ""
  echo "This error typically means:"
  echo "  1. SUPABASE_SERVICE_ROLE_KEY is missing in Vercel"
  echo "  2. SUPABASE_URL is not configured"
  echo ""
  echo "📋 Action Required:"
  echo "  → Go to Vercel Dashboard"
  echo "  → Settings > Environment Variables"
  echo "  → Add missing variables (see PARTNER_REGISTRATION_ENV_FIX.md)"
  echo ""
  
  # Error details kontrolü
  if echo "$HTTP_BODY" | grep -q "SUPABASE_SERVICE_ROLE_KEY"; then
    echo -e "${YELLOW}⚠️ SUPABASE_SERVICE_ROLE_KEY is missing!${NC}"
  fi
  if echo "$HTTP_BODY" | grep -q "SUPABASE_URL"; then
    echo -e "${YELLOW}⚠️ SUPABASE_URL is missing!${NC}"
  fi
  
  exit 1
elif [ "$HTTP_STATUS" = "409" ]; then
  echo -e "${YELLOW}⚠️ CONFLICT: Email or phone already registered${NC}"
  echo ""
  echo "API is working, but test user already exists."
  echo "This is expected if you run the test multiple times."
  exit 0
elif [ "$HTTP_STATUS" = "400" ]; then
  echo -e "${RED}❌ BAD REQUEST: Validation error${NC}"
  echo ""
  echo "Check the request data format."
  exit 1
else
  echo -e "${RED}❌ UNEXPECTED ERROR${NC}"
  echo ""
  echo "HTTP Status: $HTTP_STATUS"
  echo "Response: $HTTP_BODY"
  exit 1
fi
