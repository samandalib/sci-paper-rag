#!/usr/bin/env node

/**
 * PDF Chunk, Embed, and Upload Script
 * 
 * This script processes PDF files by:
 * 1. Chunking them into smaller text pieces
 * 2. Generating embeddings using OpenAI API
 * 3. Uploading chunks and embeddings to Supabase
 * 
 * Usage: node scripts/pdf-chunk-embed-upload.cjs [pdf-directory]
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Configuration, OpenAIApi } = require('openai');
const { partitionPdf } = require('unstructured');

// Configuration
const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-ada-002',
  },
  chunking: {
    chunkSize: 300,
    overlap: 50,
  },
  pdfs: {
    directory: process.argv[2] || './pdfs',
    extensions: ['.pdf'],
  },
};

// Initialize clients
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
const openai = new OpenAIApi(new Configuration({ apiKey: config.openai.apiKey }));

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

async function generateEmbedding(text) {
  try {
    const response = await openai.createEmbedding({
      input: text,
      model: config.openai.model,
    });
    
    return response.data.data[0].embedding;
  } catch (error) {
    log(`Failed to generate embedding: ${error.message}`, 'error');
    throw error;
  }
}

async function uploadChunkToSupabase(filename, chunkIndex, chunkText, embedding) {
  try {
    const { data, error } = await supabase
      .from('pdf_chunks')
      .insert({
        filename,
        chunk_index: chunkIndex,
        chunk_text: chunkText,
        embedding,
        metadata: {
          chunk_size: chunkText.length,
          processed_at: new Date().toISOString(),
        },
      });

    if (error) throw error;
    return data;
  } catch (error) {
    log(`Failed to upload chunk to Supabase: ${error.message}`, 'error');
    throw error;
  }
}

async function processPDF(filePath) {
  const filename = path.basename(filePath);
  log(`Processing PDF: ${filename}`);

  try {
    // Extract text from PDF using unstructured
    const elements = await partitionPdf(filePath, {
      inferTableStructure: false,
      ocrStrategy: 'none',
    });

    // Extract text content
    const textContent = elements
      .map(el => el.text)
      .filter(text => text && text.trim())
      .join('\n\n');

    if (!textContent.trim()) {
      log(`No text content found in ${filename}`, 'error');
      return { success: false, chunks: 0, error: 'No text content' };
    }

    // Chunk the text
    const chunks = chunkText(textContent, config.chunking.chunkSize, config.chunking.overlap);
    log(`Created ${chunks.length} chunks for ${filename}`);

    // Process each chunk
    let successfulChunks = 0;
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        
        // Generate embedding
        const embedding = await generateEmbedding(chunk);
        
        // Upload to Supabase
        await uploadChunkToSupabase(filename, i, chunk, embedding);
        
        successfulChunks++;
        log(`Processed chunk ${i + 1}/${chunks.length} for ${filename}`);
        
        // Rate limiting - small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        log(`Failed to process chunk ${i + 1} for ${filename}: ${error.message}`, 'error');
      }
    }

    log(`Successfully processed ${successfulChunks}/${chunks.length} chunks for ${filename}`, 'success');
    return { success: true, chunks: successfulChunks };

  } catch (error) {
    log(`Failed to process PDF ${filename}: ${error.message}`, 'error');
    return { success: false, chunks: 0, error: error.message };
  }
}

async function getPDFFiles(directory) {
  try {
    const files = fs.readdirSync(directory);
    return files
      .filter(file => config.pdfs.extensions.includes(path.extname(file).toLowerCase()))
      .map(file => path.join(directory, file));
  } catch (error) {
    log(`Failed to read directory ${directory}: ${error.message}`, 'error');
    return [];
  }
}

async function main() {
  log('Starting PDF processing pipeline...');
  
  // Validate environment variables
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    log('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', 'error');
    process.exit(1);
  }
  
  if (!config.openai.apiKey) {
    log('Missing OpenAI API key. Please set OPENAI_API_KEY', 'error');
    process.exit(1);
  }

  // Check if PDF directory exists
  if (!fs.existsSync(config.pdfs.directory)) {
    log(`PDF directory does not exist: ${config.pdfs.directory}`, 'error');
    log('Creating directory...');
    fs.mkdirSync(config.pdfs.directory, { recursive: true });
  }

  // Get PDF files
  const pdfFiles = await getPDFFiles(config.pdfs.directory);
  
  if (pdfFiles.length === 0) {
    log(`No PDF files found in ${config.pdfs.directory}`, 'error');
    log('Please place PDF files in the directory and run the script again.');
    process.exit(1);
  }

  log(`Found ${pdfFiles.length} PDF files to process`);

  // Process each PDF
  const results = [];
  for (const pdfFile of pdfFiles) {
    const result = await processPDF(pdfFile);
    results.push({ file: path.basename(pdfFile), ...result });
  }

  // Summary
  log('\n=== Processing Summary ===');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalChunks = successful.reduce((sum, r) => sum + r.chunks, 0);

  log(`✅ Successfully processed: ${successful.length} files`);
  log(`❌ Failed to process: ${failed.length} files`);
  log(`📄 Total chunks created: ${totalChunks}`);

  if (failed.length > 0) {
    log('\nFailed files:');
    failed.forEach(f => log(`  - ${f.file}: ${f.error}`));
  }

  log('\nProcessing complete!');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`Script failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { processPDF, chunkText, generateEmbedding };
