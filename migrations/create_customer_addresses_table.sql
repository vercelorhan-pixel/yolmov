-- Customer Addresses Table Migration
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. customer_addresses tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('home', 'work')),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index'ler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id 
  ON public.customer_addresses(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_created_at 
  ON public.customer_addresses(created_at DESC);

-- 3. Row Level Security (RLS) aktif et
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Kullanıcılar sadece kendi adreslerini görebilir
CREATE POLICY "Users can view own addresses"
  ON public.customer_addresses
  FOR SELECT
  USING (auth.uid() = customer_id);

-- 5. RLS Policy: Kullanıcılar kendi adreslerini ekleyebilir
CREATE POLICY "Users can insert own addresses"
  ON public.customer_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- 6. RLS Policy: Kullanıcılar kendi adreslerini silebilir
CREATE POLICY "Users can delete own addresses"
  ON public.customer_addresses
  FOR DELETE
  USING (auth.uid() = customer_id);

-- 7. RLS Policy: Kullanıcılar kendi adreslerini güncelleyebilir
CREATE POLICY "Users can update own addresses"
  ON public.customer_addresses
  FOR UPDATE
  USING (auth.uid() = customer_id);

-- 8. Yorum ekle
COMMENT ON TABLE public.customer_addresses IS 'Müşterilerin kayıtlı adresleri (Ev, İş vb.)';
