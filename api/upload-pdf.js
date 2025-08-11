import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { PythonPDFProcessor } from '../services/python-pdf-processor.js';

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Supabase client inside the handler to ensure environment variables are loaded
let supabase = null;
let openaiApiKey = null;

function initializeClients() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    openaiApiKey = process.env.OPENAI_API_KEY;

    // Debug environment variables
    console.log('Environment variables check:');
    console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
    console.log('OPENAI_API_KEY:', openaiApiKey ? '✅ Set' : '❌ Missing');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize clients
    initializeClients();
    
    // Test Supabase connection
    console.log('Testing Supabase connection...');
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.log('Supabase auth test error:', error);
      } else {
        console.log('Supabase auth test successful');
      }
    } catch (authError) {
      console.log('Supabase auth test exception:', authError);
    }

    // Test storage bucket access
    console.log('Testing storage bucket access...');
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.log('Storage bucket test error:', bucketError);
      } else {
        console.log('Storage buckets available:', buckets?.map(b => b.name));
      }
    } catch (storageError) {
      console.log('Storage bucket test exception:', storageError);
    }

    // Ensure storage bucket exists
    async function ensureStorageBucket() {
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
          console.log('Error listing buckets:', bucketError);
          return false;
        }
        
        const bucketExists = buckets?.some(b => b.name === 'user-pdfs');
        if (!bucketExists) {
          console.log('Creating user-pdfs bucket...');
          const { error: createError } = await supabase.storage.createBucket('user-pdfs', {
            public: false,
            allowedMimeTypes: ['application/pdf'],
            fileSizeLimit: 10485760 // 10MB
          });
          
          if (createError) {
            console.log('Error creating bucket:', createError);
            return false;
          }
          console.log('user-pdfs bucket created successfully');
        } else {
          console.log('user-pdfs bucket already exists');
        }
        return true;
      } catch (error) {
        console.log('Error ensuring bucket exists:', error);
        return false;
      }
    }
    
    // TODO: Extract user_id from authentication token
    // For now, using the test user ID that exists in the database
    const mockUserId = '2343b8ad-cf33-4c83-aede-54bf23d4aaad';

    // Parse form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedExtensions: ['.pdf'],
      uploadDir: '/tmp',
      keepExtensions: true,
      multiples: false, // Ensure single file
    });

    console.log('Formidable config:', {
      maxFileSize: form.maxFileSize,
      allowedExtensions: form.allowedExtensions,
      uploadDir: form.uploadDir,
      keepExtensions: form.keepExtensions
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Formidable parsing error:', err);
          reject(err);
        } else {
          console.log('Formidable parsing successful');
          resolve([fields, files]);
        }
      });
    });

    // Debug logging
    console.log('Form fields:', fields);
    console.log('Form files:', files);
    console.log('Files keys:', Object.keys(files));

    const file = files.pdf;
    
    if (!file) {
      console.log('No file found in files.pdf');
      console.log('Available files:', files);
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    // Handle case where formidable returns an array
    const actualFile = Array.isArray(file) ? file[0] : file;
    
    if (!actualFile) {
      console.log('No actual file found after array handling');
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    // Debug file object
    console.log('Actual file object:', actualFile);
    console.log('File mimetype:', actualFile.mimetype);
    console.log('File size:', actualFile.size);
    console.log('File originalFilename:', actualFile.originalFilename);

    // More flexible file type validation
    const isValidPdf = actualFile.mimetype === 'application/pdf' || 
                      actualFile.originalFilename?.toLowerCase().endsWith('.pdf') ||
                      actualFile.filepath?.toLowerCase().endsWith('.pdf');

    if (!isValidPdf) {
      console.log('File validation failed');
      console.log('Mimetype:', actualFile.mimetype);
      console.log('Original filename:', actualFile.originalFilename);
      console.log('Filepath:', actualFile.filepath);
      return res.status(400).json({ 
        error: 'Only PDF files are allowed',
        details: {
          mimetype: actualFile.mimetype,
          filename: actualFile.originalFilename,
          filepath: actualFile.filepath
        }
      });
    }

    // Validate file size
    if (actualFile.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must be less than 10MB' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = actualFile.originalFilename || 'document.pdf';
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const uniqueFilename = `${baseName}_${timestamp}${extension}`;
    
    // Create user-specific file path
    const filePath = `${mockUserId}/${uniqueFilename}`;

    // Read file buffer
    const fileBuffer = fs.readFileSync(actualFile.filepath);

    // Ensure storage bucket exists before uploading
    const bucketReady = await ensureStorageBucket();
    if (!bucketReady) {
      return res.status(500).json({ error: 'Failed to prepare storage bucket' });
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-pdfs')
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    // Create database record
    const { data: dbData, error: dbError } = await supabase
      .from('user_documents')
      .insert({
        user_id: mockUserId,
        filename: uniqueFilename,
        original_filename: originalName,
        file_size_bytes: actualFile.size,
        processing_status: 'pending',
        total_chunks: 0,
        chunks_with_embeddings: 0
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('user-pdfs').remove([filePath]);
      return res.status(500).json({ error: 'Failed to create database record' });
    }

    // Clean up temporary file
    fs.unlinkSync(actualFile.filepath);

    // Trigger Python PDF processing asynchronously
    try {
      const processor = new PythonPDFProcessor();
      
      // Get user's chunking preferences
      const userSettings = await processor.getUserChunkingSettings(mockUserId);
      
      // Start processing in background (don't await to avoid blocking response)
      processor.processUserPDF(mockUserId, dbData.id, filePath, userSettings)
        .then(result => {
          if (result.success) {
            console.log(`PDF processing completed for document ${dbData.id}:`, result.data);
          } else {
            console.error(`PDF processing failed for document ${dbData.id}:`, result.error);
          }
        })
        .catch(error => {
          console.error(`PDF processing error for document ${dbData.id}:`, error);
        });
      
    } catch (processingError) {
      console.error('Error starting PDF processing:', processingError);
      // Don't fail the upload if processing setup fails
      // The file is uploaded and can be processed later
    }

    return res.status(200).json({
      message: 'PDF uploaded successfully and processing started',
      data: {
        id: dbData.id,
        filename: uniqueFilename,
        original_filename: originalName,
        file_size_mb: Math.round((actualFile.size / (1024 * 1024)) * 100) / 100,
        processing_status: 'pending',
        created_at: dbData.created_at
      }
    });

  } catch (error) {
    console.error('Error in upload-pdf API:', error);
    
    // Clean up any temporary files
    if (req.files) {
      Object.values(req.files).forEach(file => {
        if (file.filepath && fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
