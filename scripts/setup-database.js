#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script sets up the Supabase database with the required schema for the RAG system.
 * It creates tables, functions, and initial data.
 * 
 * Usage: node scripts/setup-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
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
    const { data, error } = await supabase.from('rag_settings').select('count').limit(1);
    if (error) throw error;
    log('Successfully connected to Supabase');
    return true;
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
      .filter(stmt => stmt.length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            log(`Statement ${i + 1} failed: ${error.message}`, 'error');
            // Continue with other statements
          } else {
            log(`Statement ${i + 1} executed successfully`);
          }
        } catch (error) {
          log(`Statement ${i + 1} failed: ${error.message}`, 'error');
        }
      }
    }
    
    log(`SQL file ${sqlFile} processed`);
    return true;
  } catch (error) {
    log(`Failed to run SQL file ${sqlFile}: ${error.message}`, 'error');
    return false;
  }
}

async function createTables() {
  try {
    log('Creating tables...');
    
    // Create pdf_chunks table
    const { error: chunksError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.pdf_chunks (
          id uuid NOT NULL DEFAULT gen_random_uuid(),
          filename text NOT NULL,
          chunk_index integer NOT NULL,
          chunk_text text NOT NULL,
          embedding vector(1536),
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          metadata jsonb DEFAULT '{}'::jsonb,
          CONSTRAINT pdf_chunks_pkey PRIMARY KEY (id)
        );
      `
    });
    
    if (chunksError) {
      log(`Failed to create pdf_chunks table: ${chunksError.message}`, 'error');
    } else {
      log('pdf_chunks table created successfully');
    }

    // Create rag_settings table
    const { error: settingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.rag_settings (
          key text NOT NULL,
          value text NOT NULL,
          description text,
          updated_at timestamp with time zone DEFAULT now(),
          CONSTRAINT rag_settings_pkey PRIMARY KEY (key)
        );
      `
    });
    
    if (settingsError) {
      log(`Failed to create rag_settings table: ${settingsError.message}`, 'error');
    } else {
      log('rag_settings table created successfully');
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
      'CREATE INDEX IF NOT EXISTS idx_pdf_chunks_filename ON public.pdf_chunks(filename);',
      'CREATE INDEX IF NOT EXISTS idx_pdf_chunks_created_at ON public.pdf_chunks(created_at);'
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
    log('Inserting default RAG settings...');
    
    const defaultSettings = [
      {
        key: 'chunk_size',
        value: '300',
        description: 'Number of tokens per document chunk'
      },
      {
        key: 'overlap',
        value: '50',
        description: 'Number of overlapping tokens between chunks'
      },
      {
        key: 'max_results',
        value: '5',
        description: 'Maximum number of chunks to retrieve per query'
      },
      {
        key: 'user_instruction',
        value: 'Answer the following question using only the provided context. If the answer is not in your context, say you don\'t know.',
        description: 'Instruction prepended to user queries'
      },
      {
        key: 'system_prompt',
        value: 'You are a helpful research assistant. Only answer using the provided context.',
        description: 'System prompt for OpenAI'
      },
      {
        key: 'embedding_model',
        value: 'text-embedding-ada-002',
        description: 'OpenAI embedding model to use'
      }
    ];

    for (const setting of defaultSettings) {
      try {
        const { error } = await supabase
          .from('rag_settings')
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

async function main() {
  log('Starting database setup...');
  
  // Validate environment variables
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    log('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', 'error');
    process.exit(1);
  }

  // Check connection
  if (!(await checkSupabaseConnection())) {
    process.exit(1);
  }

  // Create tables
  if (!(await createTables())) {
    log('Failed to create tables', 'error');
    process.exit(1);
  }

  // Create indexes
  if (!(await createIndexes())) {
    log('Failed to create indexes', 'error');
    process.exit(1);
  }

  // Insert default settings
  if (!(await insertDefaultSettings())) {
    log('Failed to insert default settings', 'error');
    process.exit(1);
  }

  log('Database setup completed successfully!', 'success');
  log('You can now run the PDF processing script to start using the RAG system.');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`Script failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { createTables, createIndexes, insertDefaultSettings };
