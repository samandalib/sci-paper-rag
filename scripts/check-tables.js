#!/usr/bin/env node

/**
 * Check what tables exist in the database
 * 
 * Usage: node scripts/check-tables.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuration
const config = {
  supabase: {
    url: process.env.SUPABASE_URL || 'https://zuhdwsnhipyyrynlmpgg.supabase.co',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
};

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

async function checkTables() {
  try {
    console.log('🔍 Checking what tables exist in the database...');
    
    // List of tables to check
    const tablesToCheck = [
      'users',
      'pdf_chunks', 
      'user_documents',
      'user_rag_settings',
      'global_rag_settings',
      'user_chat_sessions',
      'chat_messages',
      'user_widgets',
      'widget_analytics'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`❌ ${tableName}: Table does not exist`);
          } else {
            console.log(`⚠️  ${tableName}: Error checking table - ${error.message}`);
          }
        } else {
          console.log(`✅ ${tableName}: Table exists`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: Exception - ${err.message}`);
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('Tables marked with ❌ need to be created via SQL Editor');
    console.log('Tables marked with ✅ are ready to use');
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

// Run the check
checkTables();
