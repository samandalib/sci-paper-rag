import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Extract user_id from authentication token
    // For now, using a mock user ID - replace with actual auth logic
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

    if (req.method === 'GET') {
      // Get user RAG settings
      const { data, error } = await supabase
        .from('user_rag_settings')
        .select('*')
        .eq('user_id', mockUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (!data) {
        // Return default settings if none exist
        return res.status(200).json({
          user_instruction: 'Answer the following question using only the provided context. If the answer is not in your context, say you don\'t know.',
          system_prompt: 'You are a helpful research assistant. Only answer using the provided context.',
          chunk_size: 300,
          overlap: 50,
          max_results: 5,
          similarity_threshold: 0.7
        });
      }

      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { user_instruction, system_prompt, chunk_size, overlap, max_results, similarity_threshold } = req.body;

      // Validate required fields
      if (!user_instruction || !system_prompt) {
        return res.status(400).json({ error: 'user_instruction and system_prompt are required' });
      }

      // Upsert user RAG settings
      const { data, error } = await supabase
        .from('user_rag_settings')
        .upsert({
          user_id: mockUserId,
          user_instruction,
          system_prompt,
          chunk_size: chunk_size || 300,
          overlap: overlap || 50,
          max_results: max_results || 5,
          similarity_threshold: similarity_threshold || 0.7,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        message: 'Settings saved successfully',
        data
      });
    }
  } catch (error) {
    console.error('Error in user-rag-settings API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
