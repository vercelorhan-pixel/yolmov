#!/bin/bash

# Vercel Environment Variables Setup Helper
# Bu script Vercel'e gerekli environment variables'ları ekler

echo "🔧 Vercel Environment Variables Setup"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vercel CLI kontrolü
if ! command -v vercel &> /dev/null; then
  echo -e "${RED}❌ Vercel CLI is not installed${NC}"
  echo ""
  echo "Install Vercel CLI:"
  echo "  npm install -g vercel"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"
echo ""

# Login kontrolü
echo "🔐 Checking Vercel login status..."
if ! vercel whoami &> /dev/null; then
  echo -e "${YELLOW}⚠️ Not logged in to Vercel${NC}"
  echo ""
  echo "Logging in..."
  vercel login
  echo ""
fi

WHOAMI=$(vercel whoami 2>/dev/null)
echo -e "${GREEN}✅ Logged in as: $WHOAMI${NC}"
echo ""

# Supabase URL
SUPABASE_URL="https://uwslxmciglqxpvfbgjzm.supabase.co"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 1: Add SUPABASE_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Value: $SUPABASE_URL"
echo ""
read -p "Press Enter to add this variable..."

echo "$SUPABASE_URL" | vercel env add SUPABASE_URL production preview development

echo ""
echo -e "${GREEN}✅ SUPABASE_URL added${NC}"
echo ""

# Supabase Service Role Key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 2: Add SUPABASE_SERVICE_ROLE_KEY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️ IMPORTANT: This is a secret key!${NC}"
echo ""
echo "Where to find it:"
echo "  1. Go to: https://supabase.com/dashboard"
echo "  2. Select your project: uwslxmciglqxpvfbgjzm"
echo "  3. Settings > API"
echo "  4. Copy 'service_role' key (NOT 'anon public' key)"
echo ""
echo "The key starts with: eyJhbGci..."
echo "It's a long JWT token (300+ characters)"
echo ""
read -p "Press Enter when you're ready to paste the key..."

vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development

echo ""
echo -e "${GREEN}✅ SUPABASE_SERVICE_ROLE_KEY added${NC}"
echo ""

# Verify
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Listing all environment variables..."
echo ""

vercel env ls

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Trigger a redeploy:"
echo "     ${BLUE}git commit --allow-empty -m 'Trigger redeploy' && git push${NC}"
echo ""
echo "  2. Or redeploy from Vercel Dashboard:"
echo "     → Deployments > ... > Redeploy"
echo ""
echo "  3. Test the API:"
echo "     ${BLUE}bash scripts/test-partner-api.sh${NC}"
echo ""
