#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConversations() {
  console.log('🔍 Checking conversations table...\n');
  
  // Tüm konuşmaları getir
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Found', conversations?.length || 0, 'conversations\n');
  
  if (conversations && conversations.length > 0) {
    console.log('📋 Sample conversation:');
    console.log(JSON.stringify(conversations[0], null, 2));
    console.log('\n');
    
    // Mesajları kontrol et
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversations[0].id)
      .limit(3);
      
    console.log('💬 Messages for first conversation:', messages?.length || 0);
    if (messages && messages.length > 0) {
      console.log(JSON.stringify(messages[0], null, 2));
    }
  }
}

checkConversations().then(() => {
  console.log('\n✅ Check completed!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
