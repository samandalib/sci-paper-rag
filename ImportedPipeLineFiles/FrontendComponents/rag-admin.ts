import { supabase } from "@/lib/supabase";

export interface DocumentStats {
  total: number;
  processed: number;
  failed: number;
  pending: number;
  lastUpdated: string;
}

export interface EmbeddingStats {
  total: number;
  successful: number;
  failed: number;
  averageProcessingTime: number;
  lastBatchProcessed: string;
}

export interface ChatStats {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  successRate: number;
  lastActivity: string;
}

export interface SystemHealth {
  status: "healthy" | "warning" | "error";
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

export interface Document {
  id: string;
  name: string;
  status: "processed" | "processing" | "failed" | "pending";
  size: string;
  uploadedAt: string;
  embeddings: number;
  userId?: string;
  fileType?: string;
  errorMessage?: string;
}

export interface ChatActivity {
  id: string;
  user: string;
  message: string;
  responseTime: number;
  status: "success" | "failed" | "timeout";
  timestamp: string;
  documentsRetrieved?: number;
  tokensUsed?: number;
}

// Real Supabase API calls - using existing RAG infrastructure
export const ragAdminApi = {
  // Get document statistics from existing pdf_chunks table
  async getDocumentStats(): Promise<DocumentStats> {
    try {
      // Use pagination to get ALL filenames
      let allFilenames: string[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: filenames, error } = await supabase
          .from('pdf_chunks')
          .select('filename')
          .order('filename')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) {
          console.error('Error fetching filenames page', page, ':', error);
          throw error;
        }
        
        if (filenames && filenames.length > 0) {
          allFilenames = allFilenames.concat(filenames.map(f => f.filename));
          page++;
        } else {
          hasMore = false;
        }
      }
      
      const uniqueDocuments = [...new Set(allFilenames)];
      
      return {
        total: uniqueDocuments.length,
        processed: uniqueDocuments.length,
        failed: 0,
        pending: 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get document stats:', error);
      return {
        total: 0,
        processed: 0,
        failed: 0,
        pending: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  },

  // Get embedding statistics from existing pdf_chunks table
  async getEmbeddingStats(): Promise<EmbeddingStats> {
    try {
      // Use count queries instead of fetching all data
      const { count: totalChunks, error: countError } = await supabase
        .from('pdf_chunks')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error counting total chunks:', countError);
        throw countError;
      }
      
      // Count chunks with embeddings
      const { count: successfulEmbeddings, error: embedError } = await supabase
        .from('pdf_chunks')
        .select('embedding', { count: 'exact', head: true })
        .not('embedding', 'is', null);
      
      if (embedError) {
        console.error('Error counting embeddings:', embedError);
        throw embedError;
      }
      
      const total = totalChunks || 0;
      const successful = successfulEmbeddings || 0;
      const failed = total - successful;
      
      return {
        total,
        successful,
        failed,
        averageProcessingTime: 0, // We don't track processing time in current system
        lastBatchProcessed: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get embedding stats:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        averageProcessingTime: 0,
        lastBatchProcessed: new Date().toISOString()
      };
    }
  },

  // Get chat statistics - using mock data since we don't track chat history yet
  async getChatStats(): Promise<ChatStats> {
    try {
      // For now, return mock data since the current RAG system doesn't track chat history
      // TODO: Implement chat history tracking in the RAG pipeline
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageResponseTime: 0,
        successRate: 100, // Assume 100% success rate for now
        lastActivity: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get chat stats:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageResponseTime: 0,
        successRate: 0,
        lastActivity: new Date().toISOString()
      };
    }
  },

  // Get system health - using mock data since we don't track system health yet
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // For now, return mock data since we don't track system health yet
      // TODO: Implement system health monitoring
      return {
        status: "healthy" as const,
        uptime: "7d 14h 32m",
        memoryUsage: 67,
        cpuUsage: 23,
        activeConnections: 12
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        status: "error" as const,
        uptime: "0d 0h 0m",
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0
      };
    }
  },

  // Get recent documents from existing pdf_chunks table
  async getRecentDocuments(limit: number = 10): Promise<Document[]> {
    try {
      // Get unique filenames first
      const { data: filenames, error: filenameError } = await supabase
        .from('pdf_chunks')
        .select('filename')
        .order('filename');
      
      if (filenameError) {
        console.error('Error fetching filenames:', filenameError);
        throw filenameError;
      }
      
      const uniqueFilenames = [...new Set(filenames?.map(d => d.filename) || [])];
      
      // For each unique filename, get the chunk count
      const documents = [];
      for (const filename of uniqueFilenames.slice(0, limit)) {
        const { count: chunkCount, error: countError } = await supabase
          .from('pdf_chunks')
          .select('*', { count: 'exact', head: true })
          .eq('filename', filename);
        
        if (countError) {
          console.error(`Error counting chunks for ${filename}:`, countError);
          continue;
        }
        
        // Count embeddings for this file
        const { count: embeddingCount, error: embedError } = await supabase
          .from('pdf_chunks')
          .select('embedding', { count: 'exact', head: true })
          .eq('filename', filename)
          .not('embedding', 'is', null);
        
        if (embedError) {
          console.error(`Error counting embeddings for ${filename}:`, embedError);
          continue;
        }
        
        documents.push({
          id: filename,
          name: filename,
          status: 'processed' as const,
          size: 'Unknown', // We don't store file size in current system
          uploadedAt: new Date().toISOString(), // Use current time since we don't have created_at
          embeddings: embeddingCount || 0,
          errorMessage: undefined
        });
      }
      
      return documents;
    } catch (error) {
      console.error('Failed to get recent documents:', error);
      return [];
    }
  },

  // Get recent chat activity - using mock data since we don't track chat history yet
  async getRecentChats(limit: number = 10): Promise<ChatActivity[]> {
    try {
      // For now, return mock data since the current RAG system doesn't track chat history
      // TODO: Implement chat history tracking in the RAG pipeline
      return [
        {
          id: "mock-chat-001",
          user: "road265.life@gmail.com",
          message: "What is the best protocol for improving VO2 max?",
          responseTime: 1.2,
          status: "success" as const,
          timestamp: new Date().toISOString(),
          documentsRetrieved: 3,
          tokensUsed: 245
        },
        {
          id: "mock-chat-002", 
          user: "road265.life@gmail.com",
          message: "How often should I train for optimal results?",
          responseTime: 2.1,
          status: "success" as const,
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          documentsRetrieved: 2,
          tokensUsed: 189
        }
      ].slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent chats:', error);
      return [];
    }
  },

  // Upload a new document
  async uploadDocument(file: File): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
      // TODO: Implement actual file upload to Supabase storage
      console.log("Uploading document:", file.name);
      
      // Mock successful upload
      return {
        success: true,
        documentId: `doc_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed"
      };
    }
  },

  // Reprocess a failed document
  async reprocessDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement document reprocessing
      console.log("Reprocessing document:", documentId);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Reprocessing failed"
      };
    }
  },

  // Delete a document
  async deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement document deletion
      console.log("Deleting document:", documentId);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Deletion failed"
      };
    }
  },

  // Update RAG settings - using mock implementation since we don't have settings table yet
  async updateSettings(settings: {
    embeddingModel?: string;
    chunkSize?: number;
    overlap?: number;
    maxResults?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, just log the settings since we don't have a settings table yet
      // TODO: Implement settings storage in Supabase
      console.log("Updating RAG settings:", settings);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Settings update failed"
      };
    }
  },

  // Get RAG settings - using default values from existing RAG system
  async getSettings(): Promise<{
    embeddingModel: string;
    chunkSize: number;
    overlap: number;
    maxResults: number;
  }> {
    try {
      // Return default settings based on existing RAG system configuration
      return {
        embeddingModel: "text-embedding-ada-002", // From rag-retrieve.js
        chunkSize: 1000, // Default chunk size
        overlap: 200, // Default overlap
        maxResults: 5 // From rag-retrieve.js match_count
      };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {
        embeddingModel: "text-embedding-ada-002",
        chunkSize: 1000,
        overlap: 200,
        maxResults: 5
      };
    }
  }
}; 

// Fetch prompt templates from rag_settings
export async function getPromptTemplates() {
  const { data, error } = await supabase
    .from('rag_settings')
    .select('key, value')
    .in('key', ['user_instruction', 'system_prompt']);
  if (error || !data) throw error;
  return {
    userInstruction: data.find(d => d.key === 'user_instruction')?.value || '',
    systemPrompt: data.find(d => d.key === 'system_prompt')?.value || ''
  };
}

// Update prompt templates in rag_settings
export async function updatePromptTemplates({ userInstruction, systemPrompt }: { userInstruction?: string, systemPrompt?: string }) {
  let error = null;
  if (userInstruction !== undefined) {
    const { error: e } = await supabase
      .from('rag_settings')
      .update({ value: userInstruction })
      .eq('key', 'user_instruction');
    if (e) error = e;
  }
  if (systemPrompt !== undefined) {
    const { error: e } = await supabase
      .from('rag_settings')
      .update({ value: systemPrompt })
      .eq('key', 'system_prompt');
    if (e) error = e;
  }
  return { success: !error, error };
} 

// Fetch chunking and retrieval settings from rag_settings
export async function getSettings() {
  const { data, error } = await supabase
    .from('rag_settings')
    .select('key, value')
    .in('key', ['chunk_size', 'overlap', 'max_results']);
  if (error || !data) throw error;
  return {
    chunkSize: Number(data.find(d => d.key === 'chunk_size')?.value || 500),
    overlap: Number(data.find(d => d.key === 'overlap')?.value || 50),
    maxResults: Number(data.find(d => d.key === 'max_results')?.value || 5),
  };
}

export async function updateSettings({ chunkSize, overlap, maxResults }: { chunkSize?: number, overlap?: number, maxResults?: number }) {
  let error = null;
  if (chunkSize !== undefined) {
    const { error: e } = await supabase
      .from('rag_settings')
      .update({ value: String(chunkSize) })
      .eq('key', 'chunk_size');
    if (e) error = e;
  }
  if (overlap !== undefined) {
    const { error: e } = await supabase
      .from('rag_settings')
      .update({ value: String(overlap) })
      .eq('key', 'overlap');
    if (e) error = e;
  }
  if (maxResults !== undefined) {
    const { error: e } = await supabase
      .from('rag_settings')
      .update({ value: String(maxResults) })
      .eq('key', 'max_results');
    if (e) error = e;
  }
  return { success: !error, error };
} 