import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Initialize clients
let supabase = null;
let openai = null;

function initializeClients() {
  if (!supabase || !openai) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!openaiApiKey) {
      throw new Error('Missing OpenAI API key');
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);
    openai = new OpenAI({ apiKey: openaiApiKey });
  }
}

export class PythonPDFProcessor {
  constructor() {
    // Initialize clients if not already done
    initializeClients();
    
    this.supabase = supabase;
    this.openai = openai;
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.scriptPath = path.join(process.cwd(), 'python', 'process_pdf.py');
  }

  /**
   * Process a PDF document using the existing Python preprocessing pipeline
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID from database
   * @param {string} filePath - File path in storage
   * @param {Object} chunkingSettings - User's chunking preferences
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async processUserPDF(userId, documentId, filePath, chunkingSettings = {}) {
    try {
      console.log(`Starting Python PDF processing for document ${documentId}`);

      // Update status to processing
      await this.updateProcessingStatus(documentId, 'processing');

      // Download PDF from storage
      const downloadResult = await this.downloadPDF(filePath);
      if (!downloadResult.success) {
        throw new Error(`Failed to download PDF: ${downloadResult.error}`);
      }

      // Save PDF to temporary file
      const tempPdfPath = await this.saveTempPDF(downloadResult.data, documentId);
      
      // Process PDF using Python script
      const processingResult = await this.runPythonProcessing(tempPdfPath, chunkingSettings);
      if (!processingResult.success) {
        throw new Error(`Python processing failed: ${processingResult.error}`);
      }

      console.log(`Python processing completed, generated ${processingResult.data.chunks.length} chunks`);

      // Generate embeddings for chunks
      const embeddingsResult = await this.generateEmbeddings(processingResult.data.chunks);
      if (!embeddingsResult.success) {
        throw new Error(`Failed to generate embeddings: ${embeddingsResult.error}`);
      }

      // Store chunks and embeddings in database
      const storageResult = await this.storeChunksAndEmbeddings(
        userId,
        documentId,
        processingResult.data.chunks,
        embeddingsResult.data.embeddings
      );

      if (!storageResult.success) {
        throw new Error(`Failed to store chunks: ${storageResult.error}`);
      }

      // Update document status and counts
      await this.updateDocumentCompletion(
        documentId, 
        processingResult.data.chunks.length, 
        embeddingsResult.data.embeddings.length
      );

      // Clean up temporary files
      await this.cleanupTempFiles(tempPdfPath);

      console.log(`PDF processing completed for document ${documentId}`);

      return {
        success: true,
        data: {
          documentId,
          totalChunks: processingResult.data.chunks.length,
          totalEmbeddings: embeddingsResult.data.embeddings.length,
          processingMethod: processingResult.data.method
        }
      };

    } catch (error) {
      console.error(`Error processing PDF for document ${documentId}:`, error);
      
      // Update status to failed
      await this.updateProcessingStatus(documentId, 'failed', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download PDF from Supabase storage
   * @param {string} filePath - File path in storage
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async downloadPDF(filePath) {
    try {
      const { data, error } = await this.supabase.storage
        .from('user-pdfs')
        .download(filePath);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error downloading PDF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save PDF buffer to temporary file
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} documentId - Document ID for filename
   * @returns {Promise<string>} - Path to temporary file
   */
  async saveTempPDF(pdfBuffer, documentId) {
    const tempDir = path.join(process.cwd(), 'temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPdfPath = path.join(tempDir, `${documentId}.pdf`);
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    return tempPdfPath;
  }

  /**
   * Run Python preprocessing script
   * @param {string} pdfPath - Path to PDF file
   * @param {Object} chunkingSettings - Chunking preferences
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async runPythonProcessing(pdfPath, chunkingSettings = {}) {
    return new Promise((resolve) => {
      const {
        chunk_method = 'By section, then tokens if too long',
        chunk_size = 300,
        overlap = 50
      } = chunkingSettings;

      // Check if Python script exists
      if (!fs.existsSync(this.scriptPath)) {
        resolve({
          success: false,
          error: `Python script not found at: ${this.scriptPath}`
        });
        return;
      }

      // Build command arguments
      const args = [
        this.scriptPath,
        pdfPath,
        '--method', chunk_method,
        '--chunk-size', chunk_size.toString(),
        '--overlap', overlap.toString()
      ];

      console.log(`Running Python script: ${this.pythonPath} ${args.join(' ')}`);

      // Run Python script
      const pythonProcess = spawn(this.pythonPath, args);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({
            success: false,
            error: `Python script failed with code ${code}: ${errorOutput}`
          });
          return;
        }

        try {
          // Parse the output (should be JSON)
          const result = JSON.parse(output);
          resolve({
            success: true,
            data: result
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: `Failed to parse Python output: ${parseError.message}. Output: ${output}`
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to start Python process: ${error.message}`
        });
      });
    });
  }

  /**
   * Generate embeddings for text chunks
   * @param {Array<{text: string, chunk_id: string, section: string, metadata: any}>} chunks - Text chunks
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async generateEmbeddings(chunks) {
    try {
      const embeddings = [];
      
      // Process chunks in batches to avoid rate limits
      const batchSize = 10;
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        const batchTexts = batch.map(chunk => chunk.text);
        
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: batchTexts
        });

        batch.forEach((chunk, batchIndex) => {
          embeddings.push({
            chunk: chunk,
            embedding: response.data[batchIndex].embedding,
            tokens: response.usage.total_tokens / batch.length // Approximate
          });
        });

        // Rate limiting - wait between batches
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        success: true,
        data: {
          embeddings: embeddings
        }
      };

    } catch (error) {
      console.error('Error generating embeddings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store chunks and embeddings in database
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @param {Array} chunks - Text chunks
   * @param {Array} embeddings - Embeddings with chunk data
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async storeChunksAndEmbeddings(userId, documentId, chunks, embeddings) {
    try {
      const chunksToInsert = embeddings.map(embedding => ({
        user_id: userId,
        filename: documentId, // We'll use document ID as filename for now
        chunk_index: parseInt(embedding.chunk.chunk_id.split('-')[1]) || 0,
        chunk_text: embedding.chunk.text,
        embedding: embedding.embedding,
        metadata: {
          ...embedding.chunk.metadata,
          section: embedding.chunk.section,
          page_number: embedding.chunk.page_number,
          chunk_id: embedding.chunk.chunk_id
        }
      }));

      const { error } = await this.supabase
        .from('pdf_chunks')
        .insert(chunksToInsert);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error storing chunks and embeddings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's chunking preferences
   * @param {string} userId - User ID
   * @returns {Promise<{chunk_method: string, chunk_size: number, overlap: number}>}
   */
  async getUserChunkingSettings(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_rag_settings')
        .select('chunk_size, overlap')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Map chunk size to chunking method
      const chunkSize = data?.chunk_size || 300;
      const overlap = data?.overlap || 50;
      
      // Determine chunking method based on user preferences
      let chunkMethod = 'By section, then tokens if too long';
      if (chunkSize < 200) {
        chunkMethod = 'By tokens (with overlap)';
      } else if (chunkSize > 800) {
        chunkMethod = 'By section';
      }

      return { 
        chunk_method: chunkMethod,
        chunk_size: chunkSize, 
        overlap: overlap 
      };
    } catch (error) {
      console.error('Error getting user chunking settings:', error);
      return { 
        chunk_method: 'By section, then tokens if too long',
        chunk_size: 300, 
        overlap: 50 
      }; // Default values
    }
  }

  /**
   * Update processing status
   * @param {string} documentId - Document ID
   * @param {string} status - New status
   * @param {string} errorMessage - Error message if status is 'failed'
   */
  async updateProcessingStatus(documentId, status, errorMessage = null) {
    try {
      const updateData = {
        processing_status: status,
        updated_at: new Date().toISOString()
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await this.supabase
        .from('user_documents')
        .update(updateData)
        .eq('id', documentId);

      if (error) {
        console.error('Error updating processing status:', error);
      }
    } catch (error) {
      console.error('Error updating processing status:', error);
    }
  }

  /**
   * Update document completion status
   * @param {string} documentId - Document ID
   * @param {number} totalChunks - Total number of chunks
   * @param {number} chunksWithEmbeddings - Number of chunks with embeddings
   */
  async updateDocumentCompletion(documentId, totalChunks, chunksWithEmbeddings) {
    try {
      const { error } = await this.supabase
        .from('user_documents')
        .update({
          processing_status: 'completed',
          total_chunks: totalChunks,
          chunks_with_embeddings: chunksWithEmbeddings,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating document completion:', error);
      }
    } catch (error) {
      console.error('Error updating document completion:', error);
    }
  }

  /**
   * Clean up temporary files
   * @param {string} tempPdfPath - Path to temporary PDF file
   */
  async cleanupTempFiles(tempPdfPath) {
    try {
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }
    } catch (error) {
      console.warn('Could not clean up temporary PDF file:', error);
    }
  }
}
