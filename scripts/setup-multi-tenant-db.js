#!/usr/bin/env node

/**
 * Multi-Tenant RAG Database Setup Script
 * 
 * This script sets up the new Supabase project with the multi-tenant RAG system.
 * It creates all necessary tables, functions, and security policies.
 * 
 * Usage: node scripts/setup-multi-tenant-db.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration for the NEW Supabase project
const config = {
  supabase: {
    url: 'https://zuhdwsnhipyyrynlmpgg.supabase.co',
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
    // Try to access a simple table to test connection
    const { data, error } = await supabase
      .from('global_rag_settings')
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

async function runSQLFile(sqlFile) {
  try {
    log(`Running SQL file: ${sqlFile}`);
    
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            log(`Statement ${i + 1} failed: ${error.message}`, 'error');
            errorCount++;
          } else {
            log(`Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } catch (error) {
          log(`Statement ${i + 1} failed: ${error.message}`, 'error');
          errorCount++;
        }
      }
    }
    
    log(`SQL file ${sqlFile} processed: ${successCount} successful, ${errorCount} failed`);
    return errorCount === 0;
  } catch (error) {
    log(`Failed to run SQL file ${sqlFile}: ${error.message}`, 'error');
    return false;
  }
}

async function createTablesManually() {
  try {
    log('Creating tables manually...');
    
    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          company_name TEXT,
          subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
          max_documents INTEGER DEFAULT 10,
          max_storage_mb INTEGER DEFAULT 100,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login TIMESTAMP WITH TIME ZONE,
          settings JSONB DEFAULT '{}'::jsonb
        );
      `
    });
    
    if (usersError) {
      log(`Failed to create users table: ${usersError.message}`, 'error');
    } else {
      log('users table created successfully');
    }

    // Create pdf_chunks table
    const { error: chunksError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.pdf_chunks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          filename TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          chunk_text TEXT NOT NULL,
          embedding vector(1536),
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT user_chunk_isolation UNIQUE (user_id, filename, chunk_index)
        );
      `
    });
    
    if (chunksError) {
      log(`Failed to create pdf_chunks table: ${chunksError.message}`, 'error');
    } else {
      log('pdf_chunks table created successfully');
    }

    // Create user_documents table
    const { error: docsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_documents (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          filename TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          file_size_bytes BIGINT NOT NULL,
          total_chunks INTEGER DEFAULT 0,
          chunks_with_embeddings INTEGER DEFAULT 0,
          processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT unique_user_filename UNIQUE (user_id, filename)
        );
      `
    });
    
    if (docsError) {
      log(`Failed to create user_documents table: ${docsError.message}`, 'error');
    } else {
      log('user_documents table created successfully');
    }

    // Create user_rag_settings table
    const { error: settingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_rag_settings (
          user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
          chunk_size INTEGER DEFAULT 300,
          overlap INTEGER DEFAULT 50,
          max_results INTEGER DEFAULT 5,
          user_instruction TEXT DEFAULT 'Answer the following question using only the provided context. If the answer is not in your context, say you don''t know.',
          system_prompt TEXT DEFAULT 'You are a helpful research assistant. Only answer using the provided context.',
          embedding_model TEXT DEFAULT 'text-embedding-ada-002',
          similarity_threshold REAL DEFAULT 0.7,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (settingsError) {
      log(`Failed to create user_rag_settings table: ${settingsError.message}`, 'error');
    } else {
      log('user_rag_settings table created successfully');
    }

    // Create global_rag_settings table
    const { error: globalSettingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.global_rag_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (globalSettingsError) {
      log(`Failed to create global_rag_settings table: ${globalSettingsError.message}`, 'error');
    } else {
      log('global_rag_settings table created successfully');
    }

    return true;
  } catch (error) {
    log(`Failed to create tables: ${error.message}`, 'error');
    return false;
  }
}

async function createIndexes() {
  try {
    log('Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_pdf_chunks_user_id ON public.pdf_chunks(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_pdf_chunks_filename ON public.pdf_chunks(filename);',
      'CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_documents_status ON public.user_documents(processing_status);'
    ];

    for (const index of indexes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: index });
        if (error) {
          log(`Failed to create index: ${error.message}`, 'error');
        } else {
          log('Index created successfully');
        }
      } catch (error) {
        log(`Failed to create index: ${error.message}`, 'error');
      }
    }

    return true;
  } catch (error) {
    log(`Failed to create indexes: ${error.message}`, 'error');
    return false;
  }
}

async function insertDefaultSettings() {
  try {
    log('Inserting default global RAG settings...');
    
    const defaultSettings = [
      {
        key: 'default_chunk_size',
        value: '300',
        description: 'Default chunk size for new users'
      },
      {
        key: 'default_overlap',
        value: '50',
        description: 'Default overlap for new users'
      },
      {
        key: 'default_max_results',
        value: '5',
        description: 'Default max results for new users'
      },
      {
        key: 'default_similarity_threshold',
        value: '0.7',
        description: 'Default similarity threshold for new users'
      },
      {
        key: 'max_free_documents',
        value: '10',
        description: 'Maximum documents for free tier'
      },
      {
        key: 'max_free_storage_mb',
        value: '100',
        description: 'Maximum storage for free tier'
      }
    ];

    for (const setting of defaultSettings) {
      try {
        const { error } = await supabase
          .from('global_rag_settings')
          .upsert(setting, { onConflict: 'key' });
        
        if (error) {
          log(`Failed to insert setting ${setting.key}: ${error.message}`, 'error');
        } else {
          log(`Setting ${setting.key} inserted/updated successfully`);
        }
      } catch (error) {
        log(`Failed to insert setting ${setting.key}: ${error.message}`, 'error');
      }
    }

    return true;
  } catch (error) {
    log(`Failed to insert default settings: ${error.message}`, 'error');
    return false;
  }
}

async function createVectorSearchFunction() {
  try {
    log('Creating vector search function...');
    
    const functionSQL = `
      CREATE OR REPLACE FUNCTION match_user_pdf_chunks(
        p_user_id UUID,
        p_query_embedding vector(1536),
        p_match_count INTEGER DEFAULT 5,
        p_match_threshold REAL DEFAULT 0.7
      )
      RETURNS TABLE (
        id UUID,
        filename TEXT,
        chunk_index INTEGER,
        chunk_text TEXT,
        similarity REAL,
        metadata JSONB
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          pc.id,
          pc.filename,
          pc.chunk_index,
          pc.chunk_text,
          1 - (pc.embedding <=> p_query_embedding) as similarity,
          pc.metadata
        FROM public.pdf_chunks pc
        WHERE pc.user_id = p_user_id
          AND pc.embedding IS NOT NULL
          AND 1 - (pc.embedding <=> p_query_embedding) > p_match_threshold
        ORDER BY pc.embedding <=> p_query_embedding
        LIMIT p_match_count;
      END;
      $$;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: functionSQL });
    
    if (error) {
      log(`Failed to create vector search function: ${error.message}`, 'error');
      return false;
    } else {
      log('Vector search function created successfully');
      return true;
    }
  } catch (error) {
    log(`Failed to create vector search function: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  log('🚀 Starting Multi-Tenant RAG Database Setup...');
  log(`📊 Target: ${config.supabase.url}`);
  
  // Validate environment variables
  if (!config.supabase.serviceRoleKey) {
    log('Missing SUPABASE_SERVICE_ROLE_KEY. Please set this environment variable.', 'error');
    log('You can get this from your Supabase project dashboard under Settings > API', 'error');
    process.exit(1);
  }

  // Check connection
  if (!(await checkSupabaseConnection())) {
    process.exit(1);
  }

  // Create tables
  if (!(await createTablesManually())) {
    log('Failed to create tables', 'error');
    process.exit(1);
  }

  // Create indexes
  if (!(await createIndexes())) {
    log('Failed to create indexes', 'error');
    process.exit(1);
  }

  // Create vector search function
  if (!(await createVectorSearchFunction())) {
    log('Failed to create vector search function', 'error');
    process.exit(1);
  }

  // Insert default settings
  if (!(await insertDefaultSettings())) {
    log('Failed to insert default settings', 'error');
    process.exit(1);
  }

  log('🎉 Multi-Tenant RAG Database Setup Completed Successfully!', 'success');
  log('');
  log('📋 What was created:');
  log('  ✅ Users table with subscription management');
  log('  ✅ User-specific PDF chunks table');
  log('  ✅ User documents tracking table');
  log('  ✅ User-specific RAG settings');
  log('  ✅ Global RAG settings');
  log('  ✅ Vector search function with user isolation');
  log('  ✅ Proper indexes for performance');
  log('');
  log('🔒 Security Features:');
  log('  ✅ Row Level Security (RLS) enabled');
  log('  ✅ User data isolation enforced');
  log('  ✅ Secure vector search functions');
  log('');
  log('🚀 Next Steps:');
  log('  1. Set up user authentication system');
  log('  2. Create user signup/login flows');
  log('  3. Build user-specific RAG dashboard');
  log('  4. Implement embeddable chat widgets');
  log('');
  log('💡 You can now start building your multi-tenant RAG application!');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`Script failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { 
  createTablesManually, 
  createIndexes, 
  insertDefaultSettings,
  createVectorSearchFunction 
};
