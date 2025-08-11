import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get document statistics using the database function
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_document_stats');

    if (statsError) {
      console.error('Error getting document stats:', statsError);
      return res.status(500).json({ error: 'Failed to get document statistics' });
    }

    // Get unique filenames with chunk counts
    const { data: filenamesData, error: filenamesError } = await supabase
      .rpc('get_unique_filenames');

    if (filenamesError) {
      console.error('Error getting filenames:', filenamesError);
      return res.status(500).json({ error: 'Failed to get filename information' });
    }

    // Get RAG settings for additional context
    const { data: settingsData, error: settingsError } = await supabase
      .from('rag_settings')
      .select('key, value')
      .in('key', ['chunk_size', 'overlap', 'max_results']);

    if (settingsError) {
      console.error('Error getting RAG settings:', settingsError);
      // Continue without settings
    }

    // Format the response
    const stats = statsData?.[0] || {
      total_documents: 0,
      total_chunks: 0,
      chunks_with_embeddings: 0,
      chunks_without_embeddings: 0,
      last_updated: null
    };

    const settings = settingsData?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {}) || {};

    const response = {
      documents: {
        total: parseInt(stats.total_documents) || 0,
        processed: parseInt(stats.chunks_with_embeddings) || 0,
        failed: parseInt(stats.chunks_without_embeddings) || 0,
        pending: 0, // Not implemented yet
        lastUpdated: stats.last_updated
      },
      chunks: {
        total: parseInt(stats.total_chunks) || 0,
        withEmbeddings: parseInt(stats.chunks_with_embeddings) || 0,
        withoutEmbeddings: parseInt(stats.chunks_without_embeddings) || 0
      },
      settings: {
        chunkSize: parseInt(settings.chunk_size) || 300,
        overlap: parseInt(settings.overlap) || 50,
        maxResults: parseInt(settings.max_results) || 5
      },
      files: filenamesData || []
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Unexpected error in document-stats:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.message 
    });
  }
}
