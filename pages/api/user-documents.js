import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Extract user_id from authentication token
    // For now, using a mock user ID - replace with actual auth logic
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

    // Get user documents
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', mockUserId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform data to match frontend interface
    const transformedData = data.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      original_filename: doc.original_filename,
      processing_status: doc.processing_status,
      total_chunks: doc.total_chunks,
      created_at: doc.created_at,
      file_size_mb: Math.round((doc.file_size_bytes / (1024 * 1024)) * 100) / 100
    }));

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error in user-documents API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
