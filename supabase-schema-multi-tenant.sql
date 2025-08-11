-- Multi-Tenant RAG System Database Schema
-- For Supabase Project: https://zuhdwsnhipyyrynlmpgg.supabase.co

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- USER MANAGEMENT & AUTHENTICATION
-- =====================================================

-- Users table for authentication and user management
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

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

-- =====================================================
-- USER-SPECIFIC VECTOR TABLES
-- =====================================================

-- Main PDF chunks table with user isolation
CREATE TABLE IF NOT EXISTS public.pdf_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-ada-002 dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only access their own chunks
  CONSTRAINT user_chunk_isolation UNIQUE (user_id, filename, chunk_index)
);

-- User documents table for tracking uploaded files
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
  
  -- Ensure unique filenames per user
  CONSTRAINT unique_user_filename UNIQUE (user_id, filename)
);

-- =====================================================
-- RAG CONFIGURATION & SETTINGS
-- =====================================================

-- User-specific RAG settings
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

-- Global RAG settings (fallback defaults)
CREATE TABLE IF NOT EXISTS public.global_rag_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CHAT & CONVERSATION MANAGEMENT
-- =====================================================

-- User chat sessions
CREATE TABLE IF NOT EXISTS public.user_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages with user isolation
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chat_session_id UUID NOT NULL REFERENCES public.user_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_chunks JSONB, -- Store which chunks were used for the response
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EMBEDDABLE WIDGET CONFIGURATION
-- =====================================================

-- User widget configurations
CREATE TABLE IF NOT EXISTS public.user_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  widget_name TEXT NOT NULL,
  widget_key TEXT UNIQUE NOT NULL, -- Unique identifier for the widget
  is_active BOOLEAN DEFAULT true,
  appearance_settings JSONB DEFAULT '{}'::jsonb, -- Colors, fonts, etc.
  welcome_message TEXT DEFAULT 'Hello! Ask me anything about your documents.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Widget usage analytics
CREATE TABLE IF NOT EXISTS public.widget_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  widget_id UUID NOT NULL REFERENCES public.user_widgets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'chat_started', 'question_asked', 'response_generated'
  event_data JSONB,
  visitor_ip INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User isolation indexes
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_user_id ON public.pdf_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_filename ON public.pdf_chunks(filename);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_embedding ON public.pdf_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Document tracking indexes
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON public.user_documents(processing_status);

-- Chat and session indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_sessions_user_id ON public.user_chat_sessions(user_id);

-- Widget indexes
CREATE INDEX IF NOT EXISTS idx_user_widgets_user_id ON public.user_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_widgets_key ON public.user_widgets(widget_key);

-- =====================================================
-- FUNCTIONS FOR VECTOR SEARCH
-- =====================================================

-- User-scoped vector search function
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
  -- Ensure user can only search their own chunks
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

-- Get user document statistics
CREATE OR REPLACE FUNCTION get_user_document_stats(p_user_id UUID)
RETURNS TABLE (
  total_documents BIGINT,
  total_chunks BIGINT,
  chunks_with_embeddings BIGINT,
  chunks_without_embeddings BIGINT,
  total_storage_mb BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ud.filename) as total_documents,
    COUNT(pc.id) as total_chunks,
    COUNT(*) FILTER (WHERE pc.embedding IS NOT NULL) as chunks_with_embeddings,
    COUNT(*) FILTER (WHERE pc.embedding IS NULL) as chunks_without_embeddings,
    COALESCE(SUM(ud.file_size_bytes) / 1024 / 1024, 0) as total_storage_mb,
    MAX(ud.updated_at) as last_updated
  FROM public.user_documents ud
  LEFT JOIN public.pdf_chunks pc ON ud.user_id = pc.user_id AND ud.filename = pc.filename
  WHERE ud.user_id = p_user_id;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rag_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- PDF chunks isolation
CREATE POLICY "Users can only access own chunks" ON public.pdf_chunks
  FOR ALL USING (auth.uid() = user_id);

-- User documents isolation
CREATE POLICY "Users can only access own documents" ON public.user_documents
  FOR ALL USING (auth.uid() = user_id);

-- RAG settings isolation
CREATE POLICY "Users can only access own RAG settings" ON public.user_rag_settings
  FOR ALL USING (auth.uid() = user_id);

-- Chat sessions isolation
CREATE POLICY "Users can only access own chat sessions" ON public.user_chat_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own chat messages" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- Widget isolation
CREATE POLICY "Users can only access own widgets" ON public.user_widgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own widget analytics" ON public.widget_analytics
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default global RAG settings
INSERT INTO public.global_rag_settings (key, value, description) VALUES
  ('default_chunk_size', '300', 'Default chunk size for new users'),
  ('default_overlap', '50', 'Default overlap for new users'),
  ('default_max_results', '5', 'Default max results for new users'),
  ('default_similarity_threshold', '0.7', 'Default similarity threshold for new users'),
  ('max_free_documents', '10', 'Maximum documents for free tier'),
  ('max_free_storage_mb', '100', 'Maximum storage for free tier')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdf_chunks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_rag_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_widgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.widget_analytics TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION match_user_pdf_chunks(UUID, vector(1536), INTEGER, REAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_document_stats(UUID) TO authenticated;

-- Grant read access to global settings for all users
GRANT SELECT ON public.global_rag_settings TO authenticated;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_chunks_updated_at BEFORE UPDATE ON public.pdf_chunks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_documents_updated_at BEFORE UPDATE ON public.user_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_rag_settings_updated_at BEFORE UPDATE ON public.user_rag_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_chat_sessions_updated_at BEFORE UPDATE ON public.user_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_widgets_updated_at BEFORE UPDATE ON public.user_widgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.users IS 'User accounts and subscription information';
COMMENT ON TABLE public.pdf_chunks IS 'User-specific PDF text chunks with embeddings';
COMMENT ON TABLE public.user_documents IS 'User document metadata and processing status';
COMMENT ON TABLE public.user_rag_settings IS 'User-specific RAG configuration';
COMMENT ON TABLE public.user_chat_sessions IS 'User chat conversation sessions';
COMMENT ON TABLE public.chat_messages IS 'Individual chat messages with context';
COMMENT ON TABLE public.user_widgets IS 'User embeddable chat widget configurations';
COMMENT ON TABLE public.widget_analytics IS 'Widget usage analytics and metrics';

COMMENT ON FUNCTION match_user_pdf_chunks IS 'User-scoped vector similarity search';
COMMENT ON FUNCTION get_user_document_stats IS 'Get user document statistics and storage usage';
