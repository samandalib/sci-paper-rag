#!/usr/bin/env node

/**
 * Simple Multi-Tenant RAG Database Setup Script
 * 
 * This script sets up the database tables using Supabase client methods.
 * 
 * Usage: node scripts/setup-multi-tenant-simple.js
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

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function checkSupabaseConnection() {
  try {
    log('Testing Supabase connection...');
    
    // Try to access a simple table to test connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist yet, which is expected
      log('Successfully connected to Supabase (tables not yet created)');
      return true;
    } else if (error) {
      throw error;
    } else {
      log('Successfully connected to Supabase');
      return true;
    }
  } catch (error) {
    log(`Failed to connect to Supabase: ${error.message}`, 'error');
    return false;
  }
}

async function createTables() {
  try {
    log('Creating tables...');
    
    // Note: We can't create tables directly via the client
    // Tables need to be created via the Supabase SQL editor
    log('Tables need to be created via Supabase SQL editor');
    log('Please run the SQL from supabase-schema-multi-tenant.sql in your Supabase dashboard');
    
    return true;
  } catch (error) {
    log(`Failed to create tables: ${error.message}`, 'error');
    return false;
  }
}

async function insertDefaultSettings() {
  try {
    log('Inserting default settings...');
    
    // Check if global_rag_settings table exists
    const { data: existingSettings, error: checkError } = await supabase
      .from('global_rag_settings')
      .select('key')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST116') {
      log('global_rag_settings table does not exist yet - skipping');
      return true;
    }
    
    // Insert default global settings
    const defaultSettings = [
      {
        key: 'default_chunk_size',
        value: '300',
        description: 'Default chunk size in tokens'
      },
      {
        key: 'default_overlap',
        value: '50',
        description: 'Default overlap between chunks'
      },
      {
        key: 'default_embedding_model',
        value: 'text-embedding-ada-002',
        description: 'Default OpenAI embedding model'
      },
      {
        key: 'default_similarity_threshold',
        value: '0.7',
        description: 'Default similarity threshold for vector search'
      }
    ];
    
    const { error: insertError } = await supabase
      .from('global_rag_settings')
      .insert(defaultSettings);
    
    if (insertError) {
      log(`Failed to insert default settings: ${insertError.message}`, 'error');
      return false;
    }
    
    log('Default settings inserted successfully');
    return true;
  } catch (error) {
    log(`Failed to insert default settings: ${error.message}`, 'error');
    return false;
  }
}

async function createTestUser() {
  try {
    log('Creating test user...');
    
    // Check if users table exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST116') {
      log('users table does not exist yet - skipping');
      return true;
    }
    
    // Create a test user
    const testUser = {
      email: 'test@example.com',
      full_name: 'Test User',
      company_name: 'Test Company',
      subscription_tier: 'free',
      max_documents: 10,
      max_storage_mb: 100,
      is_active: true
    };
    
    const { data: userData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (insertError) {
      if (insertError.code === '23505') {
        log('Test user already exists');
        return true;
      }
      log(`Failed to create test user: ${insertError.message}`, 'error');
      return false;
    }
    
    log(`Test user created successfully with ID: ${userData.id}`);
    return true;
  } catch (error) {
    log(`Failed to create test user: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  try {
    log('🚀 Starting Simple Multi-Tenant RAG Database Setup...');
    log(`📊 Target: ${config.supabase.url}`);
    
    // Check connection
    const connected = await checkSupabaseConnection();
    if (!connected) {
      log('❌ Cannot proceed without database connection', 'error');
      process.exit(1);
    }
    
    // Create tables (this will just log instructions)
    await createTables();
    
    // Insert default settings (if table exists)
    await insertDefaultSettings();
    
    // Create test user (if table exists)
    await createTestUser();
    
    log('🎉 Setup completed!');
    log('');
    log('📋 Next steps:');
    log('1. Go to your Supabase dashboard');
    log('2. Navigate to SQL Editor');
    log('3. Run the SQL from supabase-schema-multi-tenant.sql');
    log('4. Test the PDF upload functionality');
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the setup
main();
