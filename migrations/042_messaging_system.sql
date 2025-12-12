-- ============================================
-- Messaging & Credit-Based Communication System
-- Date: 2025-12-12
-- Purpose: Enable secure customer-partner messaging with paywall mechanism
-- ============================================

-- 1. Conversations Table (Chat Threads)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    service_type VARCHAR(50), -- Hangi hizmet için (cekici, aku, lastik, yakit, yardim)
    
    -- Kilit Mekanizması (Paywall)
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlock_price INTEGER DEFAULT 50, -- Kredi cinsinden
    unlocked_at TIMESTAMP WITH TIME ZONE,
    unlocked_by UUID REFERENCES auth.users(id), -- Kilidi kim açtı (partner_id)
    
    -- İstatistikler
    last_message_at TIMESTAMP WITH TIME ZONE,
    customer_unread_count INTEGER DEFAULT 0,
    partner_unread_count INTEGER DEFAULT 0,
    
    -- Durum
    status VARCHAR(20) DEFAULT 'active', -- active, archived, blocked
    
    -- Metadata
    customer_location TEXT, -- Müşteri konumu (İlçe/İl)
    customer_location_lat DECIMAL(10, 8),
    customer_location_lng DECIMAL(11, 8),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Messages Table (Chat Content)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'customer', 'partner', 'admin'
    
    -- Content
    content TEXT NOT NULL,
    content_masked TEXT, -- Kilitli durumda gösterilecek maskelenmiş içerik
    
    -- Attachments (Future)
    attachment_urls TEXT[], -- Resim/dosya URL'leri
    
    -- Read Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Flags
    is_system_message BOOLEAN DEFAULT FALSE, -- Sistem mesajı mı?
    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Credit Transactions için yeni tip ekle (mevcut transactions tablosuna)
-- NOT: Eğer transactions tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'CREDIT_PURCHASE', 'CHAT_UNLOCK', 'REFUND', vb.
    amount INTEGER NOT NULL, -- Pozitif: eklenen, Negatif: harcanan
    balance_after INTEGER NOT NULL, -- İşlem sonrası bakiye
    description TEXT,
    metadata JSONB, -- Ek bilgiler (conversation_id, customer_name, vb.)
    status VARCHAR(20) DEFAULT 'completed', -- completed, pending, failed, refunded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Message Templates (Hazır Şablonlar)
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_type VARCHAR(20) NOT NULL, -- 'customer', 'partner'
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50), -- 'greeting', 'location', 'price_inquiry', vb.
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Blocked Contacts (Engelleme Sistemi)
CREATE TABLE IF NOT EXISTS blocked_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_partner ON conversations(partner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_unlocked ON conversations(is_unlocked);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = FALSE;

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_partner ON transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update conversation's last_message_at when new message arrives
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Trigger: Increment unread count based on sender
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sender_type = 'customer' THEN
        UPDATE conversations
        SET partner_unread_count = partner_unread_count + 1
        WHERE id = NEW.conversation_id;
    ELSIF NEW.sender_type = 'partner' THEN
        UPDATE conversations
        SET customer_unread_count = customer_unread_count + 1
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_unread_count
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_unread_count();

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_contacts ENABLE ROW LEVEL SECURITY;

-- Conversations: Customers can see their own conversations
CREATE POLICY "Customers can view their conversations"
ON conversations FOR SELECT
USING (auth.uid() = customer_id);

-- Conversations: Partners can see conversations (even if locked)
CREATE POLICY "Partners can view their conversations"
ON conversations FOR SELECT
USING (
    partner_id = auth.uid()
);

-- Messages: Users can see messages from unlocked conversations or their own
CREATE POLICY "Users can view messages from their conversations"
ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE customer_id = auth.uid() 
        OR (
            partner_id = auth.uid()
            AND is_unlocked = TRUE
        )
    )
);

-- Messages: Users can insert messages to their conversations
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() 
    AND conversation_id IN (
        SELECT id FROM conversations 
        WHERE customer_id = auth.uid() 
        OR partner_id = auth.uid()
    )
);

-- Transactions: Partners can view their own transactions
CREATE POLICY "Partners can view their transactions"
ON transactions FOR SELECT
USING (
    partner_id = auth.uid()
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Mask sensitive information (phone, email) in message content
CREATE OR REPLACE FUNCTION mask_sensitive_content(text_content TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Telefon numaralarını maskele: 0532 123 45 67 -> 0532 *** ** **
    text_content := regexp_replace(text_content, '0[0-9]{3}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}', '0*** *** ** **', 'g');
    text_content := regexp_replace(text_content, '\+90\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}', '+90 *** *** ** **', 'g');
    
    -- Email adreslerini maskele: test@example.com -> t***@example.com
    text_content := regexp_replace(text_content, '([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', '\1***@\2', 'g');
    
    RETURN text_content;
END;
$$ LANGUAGE plpgsql;

-- Function: Get partner's credit balance
CREATE OR REPLACE FUNCTION get_partner_credit_balance(p_partner_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO current_balance
    FROM transactions
    WHERE partner_id = p_partner_id;
    
    RETURN current_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA: Message Templates
-- ============================================

-- Sadece tablo boşsa template'leri ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM message_templates LIMIT 1) THEN
        INSERT INTO message_templates (user_type, title, content, category) VALUES
        -- Customer Templates
        ('customer', 'Acil Yardım', 'Merhaba, aracım yolda kaldı ve acil yardıma ihtiyacım var. Konumumu paylaşıyorum.', 'emergency'),
        ('customer', 'Fiyat Sorgusu', 'Merhaba, hizmetiniz için fiyat bilgisi alabilir miyim?', 'price_inquiry'),
        ('customer', 'Konum Paylaşımı', 'Tam konumum: [konum eklenecek]', 'location'),

        -- Partner Templates
        ('partner', 'Yolda', 'Merhaba, siparişiniz için yola çıktım. Yaklaşık [XX] dakika içinde orada olacağım.', 'eta'),
        ('partner', 'Teklif', 'Merhaba, hizmet bedelim [XXXX] TL. Kabul ederseniz hemen yola çıkabilirim.', 'quote'),
        ('partner', 'Detay İsteği', 'Merhaba, size daha iyi yardımcı olabilmem için aracınızın markası ve konumunuz hakkında bilgi verebilir misiniz?', 'info_request');
    END IF;
END $$;

-- ============================================
-- INITIAL CREDITS for Testing (Optional)
-- ============================================

-- Tüm mevcut partnerlere 100 kredi hediye et (test için)
-- INSERT INTO transactions (partner_id, type, amount, balance_after, description)
-- SELECT id, 'CREDIT_GIFT', 100, 100, 'Mesajlaşma sistemi açılış hediyesi'
-- FROM partners;

COMMENT ON TABLE conversations IS 'Customer-Partner konuşma başlıkları';
COMMENT ON TABLE messages IS 'Mesaj içerikleri';
COMMENT ON TABLE transactions IS 'Partner kredi işlemleri';
COMMENT ON TABLE message_templates IS 'Hazır mesaj şablonları';
COMMENT ON COLUMN conversations.is_unlocked IS 'Partner mesajı görmek için kredi harcadı mı?';
COMMENT ON COLUMN conversations.unlock_price IS 'Bu konuşmayı açmanın bedeli (kredi)';
