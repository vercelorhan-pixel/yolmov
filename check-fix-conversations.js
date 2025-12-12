#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixConversations() {
  const partnerId = 'acbc5d37-b471-4b09-a01c-866fc009e8c3';
  
  console.log('🔍 Checking conversations for partner:', partnerId);
  console.log('='.repeat(60));
  
  // 1. Tüm konuşmaları listele
  const { data: allConvs, error: allError } = await supabase
    .from('conversations')
    .select('*')
    .limit(10);
    
  console.log('\n📋 All conversations in table:', allConvs?.length || 0);
  if (allConvs && allConvs.length > 0) {
    console.log('Sample conversations:');
    allConvs.forEach((c, i) => {
      console.log(`  ${i+1}. ID: ${c.id.substring(0,8)}... | partner_id: ${c.partner_id} | status: ${c.status}`);
    });
  }
  
  // 2. Bu partner için konuşmalar
  const { data: partnerConvs, error: partnerError } = await supabase
    .from('conversations')
    .select('*')
    .eq('partner_id', partnerId);
    
  console.log(`\n📌 Conversations for partner ${partnerId.substring(0,8)}...:`, partnerConvs?.length || 0);
  if (partnerConvs && partnerConvs.length > 0) {
    partnerConvs.forEach((c, i) => {
      console.log(`  ${i+1}. ID: ${c.id} | status: ${c.status} | is_unlocked: ${c.is_unlocked}`);
    });
  }
  
  // 3. Mesajları kontrol et
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('\n💬 Recent messages:', messages?.length || 0);
  if (messages && messages.length > 0) {
    messages.forEach((m, i) => {
      console.log(`  ${i+1}. conv_id: ${m.conversation_id.substring(0,8)}... | sender: ${m.sender_type} | content: ${m.content.substring(0,50)}...`);
    });
    
    // Bu mesajların conversation'larını kontrol et
    const convIds = [...new Set(messages.map(m => m.conversation_id))];
    console.log('\n🔗 Checking conversations for these messages:');
    
    for (const convId of convIds) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single();
        
      if (conv) {
        console.log(`  - Conv ${convId.substring(0,8)}... → partner_id: ${conv.partner_id} | status: ${conv.status}`);
        
        // Eğer partner_id yanlışsa düzelt
        if (conv.partner_id !== partnerId) {
          console.log(`    ⚠️ Partner ID mismatch! Fixing...`);
          
          const { error: updateError } = await supabase
            .from('conversations')
            .update({ partner_id: partnerId, status: 'active' })
            .eq('id', convId);
            
          if (updateError) {
            console.log(`    ❌ Update failed:`, updateError.message);
          } else {
            console.log(`    ✅ Updated partner_id to ${partnerId}`);
          }
        }
        
        // Eğer status active değilse düzelt
        if (conv.status !== 'active') {
          console.log(`    ⚠️ Status is not active! Fixing...`);
          
          const { error: statusError } = await supabase
            .from('conversations')
            .update({ status: 'active' })
            .eq('id', convId);
            
          if (statusError) {
            console.log(`    ❌ Status update failed:`, statusError.message);
          } else {
            console.log(`    ✅ Updated status to active`);
          }
        }
      } else {
        console.log(`  - Conv ${convId.substring(0,8)}... → NOT FOUND in conversations table!`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Check completed!');
}

checkAndFixConversations().catch(console.error);
