-- Customer Favorites Table Migration
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. customer_favorites tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, partner_id) -- Bir müşteri aynı partner'ı birden fazla kez favorilere ekleyemez
);

-- 2. Index'ler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer_id 
  ON public.customer_favorites(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_favorites_partner_id 
  ON public.customer_favorites(partner_id);

CREATE INDEX IF NOT EXISTS idx_customer_favorites_created_at 
  ON public.customer_favorites(created_at DESC);

-- 3. Row Level Security (RLS) aktif et
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Kullanıcılar sadece kendi favorilerini görebilir
CREATE POLICY "Users can view own favorites"
  ON public.customer_favorites
  FOR SELECT
  USING (auth.uid() = customer_id);

-- 5. RLS Policy: Kullanıcılar kendi favorilerini ekleyebilir
CREATE POLICY "Users can insert own favorites"
  ON public.customer_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- 6. RLS Policy: Kullanıcılar kendi favorilerini silebilir
CREATE POLICY "Users can delete own favorites"
  ON public.customer_favorites
  FOR DELETE
  USING (auth.uid() = customer_id);

-- 7. Yorum ekle
COMMENT ON TABLE public.customer_favorites IS 'Müşterilerin favori hizmet sağlayıcıları';
