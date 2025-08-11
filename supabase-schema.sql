-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the pdf_chunks table for storing document chunks and embeddings
CREATE TABLE IF NOT EXISTS public.pdf_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  chunk_index integer NOT NULL,
  chunk_text text NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-ada-002 dimension
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT pdf_chunks_pkey PRIMARY KEY (id)
);

-- Create the rag_settings table for configuration
CREATE TABLE IF NOT EXISTS public.rag_settings (
  key text NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rag_settings_pkey PRIMARY KEY (key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_filename ON public.pdf_chunks(filename);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_embedding ON public.pdf_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_created_at ON public.pdf_chunks(created_at);

-- Create the match_pdf_chunks function for vector similarity search
CREATE OR REPLACE FUNCTION match_pdf_chunks(
  query_embedding vector(1536),
  match_count integer DEFAULT 5,
  match_threshold real DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  filename text,
  chunk_index integer,
  chunk_text text,
  similarity real,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.filename,
    pc.chunk_index,
    pc.chunk_text,
    1 - (pc.embedding <=> query_embedding) as similarity,
    pc.metadata
  FROM public.pdf_chunks pc
  WHERE pc.embedding IS NOT NULL
    AND 1 - (pc.embedding <=> query_embedding) > match_threshold
  ORDER BY pc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Insert default RAG settings
INSERT INTO public.rag_settings (key, value, description) VALUES
  ('chunk_size', '300', 'Number of tokens per document chunk'),
  ('overlap', '50', 'Number of overlapping tokens between chunks'),
  ('max_results', '5', 'Maximum number of chunks to retrieve per query'),
  ('user_instruction', 'Answer the following question using only the provided context. If the answer is not in your context, say you don''t know.', 'Instruction prepended to user queries'),
  ('system_prompt', 'You are a helpful research assistant. Only answer using the provided context.', 'System prompt for OpenAI'),
  ('embedding_model', 'text-embedding-ada-002', 'OpenAI embedding model to use')
ON CONFLICT (key) DO NOTHING;

-- Create a function to get document statistics
CREATE OR REPLACE FUNCTION get_document_stats()
RETURNS TABLE (
  total_documents bigint,
  total_chunks bigint,
  chunks_with_embeddings bigint,
  chunks_without_embeddings bigint,
  last_updated timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT filename) as total_documents,
    COUNT(*) as total_chunks,
    COUNT(*) FILTER (WHERE embedding IS NOT NULL) as chunks_with_embeddings,
    COUNT(*) FILTER (WHERE embedding IS NULL) as chunks_without_embeddings,
    MAX(updated_at) as last_updated
  FROM public.pdf_chunks;
END;
$$;

-- Create a function to get unique filenames
CREATE OR REPLACE FUNCTION get_unique_filenames()
RETURNS TABLE (
  filename text,
  chunk_count bigint,
  has_embeddings boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.filename,
    COUNT(*) as chunk_count,
    BOOL_AND(pc.embedding IS NOT NULL) as has_embeddings
  FROM public.pdf_chunks pc
  GROUP BY pc.filename
  ORDER BY pc.filename;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.pdf_chunks TO anon, authenticated;
GRANT ALL ON public.rag_settings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_pdf_chunks(vector(1536), integer, real) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_document_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_unique_filenames() TO anon, authenticated;
