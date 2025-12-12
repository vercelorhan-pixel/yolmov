-- ============================================
-- Fix Conversations RLS Policies
-- Date: 2025-12-12
-- Purpose: Allow customers to create new conversations (B2C messaging)
-- 
-- Issue: Customers get "new row violates row-level security policy" 
--        when trying to send messages to partners
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can create conversations" ON conversations;
DROP POLICY IF EXISTS "Partners can create conversations" ON conversations;
DROP POLICY IF EXISTS "Customers can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Partners can update their conversations" ON conversations;

-- ============================================
-- INSERT Policies (Allow creating conversations)
-- ============================================

-- Customers can create new conversations where they are the customer
CREATE POLICY "Customers can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Partners can also create conversations (for B2B use case)
CREATE POLICY "Partners can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = partner_id);

-- ============================================
-- UPDATE Policies (Allow updating conversation status)
-- ============================================

-- Customers can update their own conversations (mark as read, archive, etc.)
CREATE POLICY "Customers can update their conversations"
ON conversations FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Partners can update conversations where they are the partner
-- (mark as read, unlock, etc.)
CREATE POLICY "Partners can update their conversations"
ON conversations FOR UPDATE
USING (auth.uid() = partner_id)
WITH CHECK (auth.uid() = partner_id);

-- ============================================
-- Verification
-- ============================================

-- Test: Check if policies exist
SELECT 
    tablename, 
    policyname, 
    cmd, -- SELECT, INSERT, UPDATE, DELETE
    qual, -- USING clause
    with_check -- WITH CHECK clause
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY cmd, policyname;

-- Expected output:
-- | tablename     | policyname                              | cmd    | qual                              | with_check                        |
-- |---------------|-----------------------------------------|--------|-----------------------------------|-----------------------------------|
-- | conversations | Customers can view their conversations  | SELECT | (auth.uid() = customer_id)        | NULL                              |
-- | conversations | Partners can view their conversations   | SELECT | (partner_id = auth.uid())         | NULL                              |
-- | conversations | Customers can create conversations      | INSERT | NULL                              | (auth.uid() = customer_id)        |
-- | conversations | Partners can create conversations       | INSERT | NULL                              | (auth.uid() = partner_id)         |
-- | conversations | Customers can update their conversations| UPDATE | (auth.uid() = customer_id)        | (auth.uid() = customer_id)        |
-- | conversations | Partners can update their conversations | UPDATE | (auth.uid() = partner_id)         | (auth.uid() = partner_id)         |
