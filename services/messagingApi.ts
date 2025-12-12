import { supabase } from './supabase';
import { Conversation, Message, Transaction, MessageTemplate } from '../types';

// ============================================
// MESSAGING API
// ============================================

export const messagingApi = {
  // -----------------------------------------
  // CONVERSATIONS
  // -----------------------------------------
  
  /**
   * Müşteri tarafından yeni konuşma başlat
   */
  async createConversation(data: {
    customerId: string;
    partnerId: string;
    serviceType?: string;
    initialMessage: string;
    customerLocation?: string;
    customerLocationLat?: number;
    customerLocationLng?: number;
  }): Promise<Conversation> {
    console.log('🔧 [createConversation] Creating with:', {
      customerId: data.customerId,
      partnerId: data.partnerId,
      serviceType: data.serviceType,
    });
    
    // 1. Konuşma oluştur
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        customer_id: data.customerId,
        partner_id: data.partnerId,
        service_type: data.serviceType,
        customer_location: data.customerLocation,
        customer_location_lat: data.customerLocationLat,
        customer_location_lng: data.customerLocationLng,
        is_unlocked: false,
        unlock_price: 50, // Default price
        status: 'active',
      })
      .select()
      .single();

    if (convError) {
      console.error('❌ [createConversation] Error creating conversation:', convError);
      throw convError;
    }
    
    console.log('✅ [createConversation] Conversation created:', conversation.id, 'partner_id:', conversation.partner_id);

    // 2. İlk mesajı ekle
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: data.customerId,
        sender_type: 'customer',
        content: data.initialMessage,
        is_system_message: false,
      });

    if (msgError) throw msgError;

    return this.mapConversation(conversation);
  },

  /**
   * Partnerin konuşmaları listele (kilitli/açık tümü)
   */
  async getPartnerConversations(partnerId: string): Promise<Conversation[]> {
    console.log('📨 [getPartnerConversations] Fetching for partner:', partnerId);
    
    // Önce tüm konuşmaları kontrol et (debug)
    const { data: allConvs } = await supabase
      .from('conversations')
      .select('id, partner_id, customer_id, status')
      .limit(10);
    console.log('🔍 [DEBUG] All conversations sample:', allConvs?.map(c => ({ 
      id: c.id?.substring(0,8), 
      partner: c.partner_id?.substring(0,8), 
      status: c.status 
    })));
    
    // Konuşmaları al - partner_id ile (status filtresi yok)
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          content,
          content_masked,
          sender_type,
          created_at
        )
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [getPartnerConversations] Error:', error);
      throw error;
    }

    console.log('✅ [getPartnerConversations] Found conversations:', data?.length || 0);
    
    // Eğer konuşma bulunamadıysa, messages tablosundan kontrol et
    if (!data || data.length === 0) {
      console.log('🔍 [getPartnerConversations] No conversations found, checking messages...');
      
      // Bu partner'a gelen mesajları kontrol et (messages tablosunda)
      const { data: orphanMessages } = await supabase
        .from('messages')
        .select('conversation_id')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (orphanMessages && orphanMessages.length > 0) {
        console.log('⚠️ [getPartnerConversations] Found orphan messages:', orphanMessages.length);
        
        // Bu conversation'ların detaylarını kontrol et
        const convIds = [...new Set(orphanMessages.map(m => m.conversation_id))];
        for (const convId of convIds) {
          const { data: conv } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', convId)
            .single();
            
          if (conv) {
            console.log(`📌 Conv ${convId.substring(0,8)}: partner_id=${conv.partner_id?.substring(0,8)}, target=${partnerId.substring(0,8)}`);
          }
        }
      }
    }

    // Customer bilgilerini ayrı çek
    const conversationsWithCustomers = await Promise.all(
      data.map(async (conv) => {
        let customerName = 'Müşteri';
        let customerPhone = undefined;

        try {
          // customer_id ile customers tablosundan bilgi çek
          const { data: customerData } = await supabase
            .from('customers')
            .select('first_name, last_name, phone')
            .eq('id', conv.customer_id)
            .single();

          if (customerData) {
            customerName = `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() || 'Müşteri';
            customerPhone = customerData.phone;
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch customer info:', err);
        }

        return {
          ...this.mapConversation(conv),
          customerName,
          customerPhone,
          lastMessage: conv.messages?.[0] ? this.mapMessage(conv.messages[0]) : undefined,
        };
      })
    );

    return conversationsWithCustomers;
  },

  /**
   * Müşterinin konuşmaları listele
   */
  async getCustomerConversations(customerId: string): Promise<Conversation[]> {
    console.log('📨 [getCustomerConversations] Fetching for customer:', customerId);
    
    // Konuşmaları al
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          content,
          sender_type,
          created_at
        )
      `)
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('❌ [getCustomerConversations] Error:', error);
      throw error;
    }

    console.log('✅ [getCustomerConversations] Found conversations:', data?.length || 0);

    // Partner bilgilerini ayrı çek
    const conversationsWithPartners = await Promise.all(
      data.map(async (conv) => {
        let partnerName = 'Partner';
        let partnerPhone = undefined;

        try {
          // partner_id ile partners tablosundan bilgi çek
          const { data: partnerData } = await supabase
            .from('partners')
            .select('name, company_name, phone')
            .eq('id', conv.partner_id)
            .single();

          if (partnerData) {
            partnerName = partnerData.company_name || partnerData.name || 'Partner';
            partnerPhone = partnerData.phone;
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch partner info:', err);
        }

        return {
          ...this.mapConversation(conv),
          partnerName,
          partnerPhone,
          lastMessage: conv.messages?.[0] ? this.mapMessage(conv.messages[0]) : undefined,
        };
      })
    );

    return conversationsWithPartners;
  },

  /**
   * Tek bir konuşmayı detaylı getir
   */
  async getConversationById(conversationId: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    return this.mapConversation(data);
  },

  /**
   * Partner konuşma kilidini aç (KRİTİK FEATURE - PARA KAZANMA)
   */
  async unlockConversation(
    conversationId: string,
    partnerId: string,
    partnerUserId: string
  ): Promise<{ success: boolean; message: string; newBalance?: number }> {
    try {
      // 1. Konuşma bilgisini al
      const conversation = await this.getConversationById(conversationId);

      // 2. Zaten açık mı kontrol et
      if (conversation.isUnlocked) {
        return { success: false, message: 'Bu konuşma zaten açılmış.' };
      }

      // 3. Partner kredi bakiyesini kontrol et
      const balance = await this.getPartnerCreditBalance(partnerId);
      
      if (balance < conversation.unlockPrice) {
        return { 
          success: false, 
          message: `Yetersiz kredi. Gerekli: ${conversation.unlockPrice}, Mevcut: ${balance}` 
        };
      }

      // 4. Kredi düş - partner_credits tablosunu güncelle
      const newBalance = balance - conversation.unlockPrice;
      
      const { error: creditError } = await supabase
        .from('partner_credits')
        .update({ 
          balance: newBalance,
          total_spent: supabase.rpc ? undefined : newBalance // total_spent güncelleme opsiyonel
        })
        .eq('partner_id', partnerId);
      
      if (creditError) {
        console.error('❌ Credit update error:', creditError);
        throw creditError;
      }

      // 5. Transaction kaydı oluştur (tarihçe için)
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          partner_id: partnerId,
          type: 'CHAT_UNLOCK',
          amount: -conversation.unlockPrice,
          balance_after: newBalance,
          description: `Konuşma kilidi açıldı: ${conversationId}`,
          metadata: { conversation_id: conversationId },
          status: 'completed',
        });

      if (transactionError) {
        console.warn('⚠️ Transaction log error (non-critical):', transactionError);
        // Transaction hatası kritik değil, devam et
      }

      // 6. Konuşmayı güncelle
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
          unlocked_by: partnerUserId,
        })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      console.log('✅ [unlockConversation] Success! New balance:', newBalance);
      
      return { 
        success: true, 
        message: 'Konuşma başarıyla açıldı!', 
        newBalance 
      };

    } catch (error: any) {
      console.error('❌ Unlock error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Konuşmayı arşivle
   */
  async archiveConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'archived' })
      .eq('id', conversationId);

    if (error) throw error;
  },

  // -----------------------------------------
  // MESSAGES
  // -----------------------------------------

  /**
   * Konuşmadaki tüm mesajları getir
   */
  async getMessages(conversationId: string, limit = 100): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data.map(this.mapMessage);
  },

  /**
   * Yeni mesaj gönder
   */
  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    senderType: 'customer' | 'partner' | 'admin';
    content: string;
    attachmentUrls?: string[];
  }): Promise<Message> {
    // Hassas bilgileri maskele (telefon, email)
    const maskedContent = this.maskSensitiveInfo(data.content);

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: data.conversationId,
        sender_id: data.senderId,
        sender_type: data.senderType,
        content: data.content,
        content_masked: maskedContent,
        attachment_urls: data.attachmentUrls,
        is_system_message: false,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapMessage(message);
  },

  /**
   * Mesajı okundu olarak işaretle
   */
  async markAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw error;
  },

  /**
   * Konuşmadaki tüm okunmamış mesajları okundu yap
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    // Karşı tarafın mesajlarını okundu yap
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    // Unread count'u sıfırla
    const { data: conv } = await supabase
      .from('conversations')
      .select('customer_id, partner_id')
      .eq('id', conversationId)
      .single();

    if (conv) {
      const isCustomer = conv.customer_id === userId;
      await supabase
        .from('conversations')
        .update({
          [isCustomer ? 'customer_unread_count' : 'partner_unread_count']: 0,
        })
        .eq('id', conversationId);
    }
  },

  // -----------------------------------------
  // CREDITS & TRANSACTIONS
  // -----------------------------------------

  /**
   * Partner kredi bakiyesini getir
   */
  async getPartnerCreditBalance(partnerId: string): Promise<number> {
    // partner_credits tablosundan doğrudan bakiyeyi al
    const { data, error } = await supabase
      .from('partner_credits')
      .select('balance')
      .eq('partner_id', partnerId)
      .single();

    if (error) {
      console.error('❌ [getPartnerCreditBalance] Error:', error);
      // Fallback: transactions tablosundan hesapla
      const { data: txData } = await supabase
        .from('transactions')
        .select('balance_after')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return txData?.balance_after || 0;
    }

    console.log('💰 [getPartnerCreditBalance] Balance from partner_credits:', data?.balance);
    return data?.balance || 0;
  },

  /**
   * Partner transaction geçmişini getir
   */
  async getPartnerTransactions(partnerId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(this.mapTransaction);
  },

  /**
   * Partner'e kredi ekle (Admin veya ödeme sonrası)
   */
  async addCreditsToPartner(
    partnerId: string,
    amount: number,
    description: string,
    metadata?: any
  ): Promise<Transaction> {
    const currentBalance = await this.getPartnerCreditBalance(partnerId);
    const newBalance = currentBalance + amount;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        partner_id: partnerId,
        type: 'CREDIT_PURCHASE',
        amount: amount,
        balance_after: newBalance,
        description,
        metadata,
        status: 'completed',
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapTransaction(data);
  },

  // -----------------------------------------
  // MESSAGE TEMPLATES
  // -----------------------------------------

  /**
   * Şablonları getir
   */
  async getTemplates(userType: 'customer' | 'partner'): Promise<MessageTemplate[]> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_type', userType)
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (error) throw error;
    return data.map(this.mapTemplate);
  },

  // -----------------------------------------
  // REAL-TIME SUBSCRIPTIONS
  // -----------------------------------------

  /**
   * Konuşmadaki yeni mesajları dinle
   */
  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(this.mapMessage(payload.new));
        }
      )
      .subscribe();
  },

  /**
   * Partner için yeni konuşmaları dinle
   */
  subscribeToPartnerConversations(
    partnerId: string,
    callback: (conversation: Conversation) => void
  ) {
    return supabase
      .channel(`conversations:${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `partner_id=eq.${partnerId}`,
        },
        (payload) => {
          callback(this.mapConversation(payload.new));
        }
      )
      .subscribe();
  },

  // -----------------------------------------
  // HELPERS
  // -----------------------------------------

  /**
   * Telefon ve email'leri maskele
   */
  maskSensitiveInfo(text: string): string {
    // Telefon: 0532 123 45 67 -> 0*** *** ** **
    text = text.replace(/0[0-9]{3}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}/g, '0*** *** ** **');
    text = text.replace(/\+90\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}/g, '+90 *** *** ** **');
    
    // Email: test@example.com -> t***@example.com
    text = text.replace(/([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1***@$2');
    
    return text;
  },

  /**
   * Snake_case'i camelCase'e çevir
   */
  mapConversation(data: any): Conversation {
    return {
      id: data.id,
      customerId: data.customer_id,
      partnerId: data.partner_id,
      serviceType: data.service_type,
      isUnlocked: data.is_unlocked,
      unlockPrice: data.unlock_price,
      unlockedAt: data.unlocked_at,
      unlockedBy: data.unlocked_by,
      lastMessageAt: data.last_message_at,
      customerUnreadCount: data.customer_unread_count,
      partnerUnreadCount: data.partner_unread_count,
      status: data.status,
      customerLocation: data.customer_location,
      customerLocationLat: data.customer_location_lat,
      customerLocationLng: data.customer_location_lng,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  mapMessage(data: any): Message {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      senderType: data.sender_type,
      content: data.content,
      contentMasked: data.content_masked,
      attachmentUrls: data.attachment_urls,
      isRead: data.is_read,
      readAt: data.read_at,
      isSystemMessage: data.is_system_message,
      isDeleted: data.is_deleted,
      createdAt: data.created_at,
    };
  },

  mapTransaction(data: any): Transaction {
    return {
      id: data.id,
      partnerId: data.partner_id,
      type: data.type,
      amount: data.amount,
      balanceAfter: data.balance_after,
      description: data.description,
      metadata: data.metadata,
      status: data.status,
      createdAt: data.created_at,
    };
  },

  mapTemplate(data: any): MessageTemplate {
    return {
      id: data.id,
      userType: data.user_type,
      title: data.title,
      content: data.content,
      category: data.category,
      isActive: data.is_active,
      usageCount: data.usage_count,
      createdAt: data.created_at,
    };
  },
};

export default messagingApi;
