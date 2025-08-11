# RAG System Documentation

## 📁 **Overview**

This folder contains all documentation related to the Retrieval-Augmented Generation (RAG) system, including the pipeline, chat threads, and database setup.

## 📋 **Documentation Structure**

### **Core RAG System**
- **[RAG_PIPELINE.md](./RAG_PIPELINE.md)** - End-to-end RAG pipeline implementation and architecture
- **[RAG_CHAT_THREADS.md](./RAG_CHAT_THREADS.md)** - Thread-based conversation system and implementation
- **[SETUP_RAG_DATABASE.md](./SETUP_RAG_DATABASE.md)** - RAG database setup and configuration guide

## 🎯 **RAG System Overview**

### **Simplified Linear Pipeline**
The RAG pipeline follows a clean, linear flow that's easy to understand and monitor:

```
Browser → API Endpoints → Vector Search → OpenAI
```

### **Pipeline Components**

1. **Browser Client**
   - **Role**: User interface for chat interactions
   - **Action**: User types question in chat interface
   - **Output**: Sends query to API endpoints

2. **API Endpoints**
   - **Role**: Central orchestrator for RAG process
   - **Action**: Processes query & coordinates search
   - **Functions**: 
     - Receives user query
     - Calls OpenAI for embeddings
     - Searches vector database
     - Coordinates response generation

3. **Vector Search**
   - **Role**: Document retrieval using similarity search
   - **Action**: Finds similar document chunks
   - **Technology**: pgvector similarity search in Supabase
   - **Output**: Most relevant document chunks

4. **OpenAI API**
   - **Role**: AI processing and response generation
   - **Action**: Creates embeddings & generates answer
   - **Functions**:
     - Generates embeddings for queries
     - Creates final responses using retrieved context

## 🧵 **Thread-Based Conversation System**

### **Thread Management**
- **Session Persistence**: Conversations persist across page refreshes using localStorage
- **Context Awareness**: AI remembers previous messages and conversation flow
- **Follow-up Support**: Users can ask follow-up questions that reference previous context
- **No Database Required**: All conversation data stored locally in browser

### **API Integration**
The `/api/rag-chat` endpoint accepts conversation history:

```javascript
// Request body includes conversation history
{
  "query": "What about the second point you mentioned?",
  "history": [
    { "role": "user", "content": "What is VO₂max?", "timestamp": 1234567890 },
    { "role": "assistant", "content": "VO₂max is...", "timestamp": 1234567891 }
  ]
}
```

### **Context Optimization**
- **Smart Truncation**: Only last 20 messages sent to API to prevent token overflow
- **Context Combination**: Conversation history + RAG document chunks
- **Memory Limits**: Maximum 50 messages per conversation thread

## 🔧 **Key Components**

### **RAG Pipeline**
- **Document Upload**: Users/admins upload documents (PDFs, etc.)
- **Chunking**: Documents are split into text chunks
- **Embedding**: Each chunk is embedded using OpenAI API
- **Storage**: Chunks and embeddings are stored in Supabase (PostgreSQL with pgvector)
- **Retrieval**: On user query, similar chunks are retrieved via vector search
- **Generation**: Retrieved context is sent to OpenAI for answer generation

### **Chat Interface**
- **Professional Design**: Message bubbles with timestamps
- **Streaming Responses**: Real-time typing indicators and streaming text
- **Thread Controls**: Clear conversation functionality with message count
- **Dynamic Placeholders**: Context-aware input placeholders

## 🗄️ **Database Schema**

### **PDF Chunks Table**
```sql
CREATE TABLE public.pdf_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  filename text,
  chunk_index integer,
  chunk_text text,
  embedding USER-DEFINED,
  CONSTRAINT pdf_chunks_pkey PRIMARY KEY (id)
);
```

### **RAG Settings Table**
```sql
CREATE TABLE public.rag_settings (
  key text NOT NULL,
  value text,
  CONSTRAINT rag_settings_pkey PRIMARY KEY (key)
);
```

## 🚀 **Setup and Configuration**

### **Database Setup**
1. **Enable pgvector**: Enable vector extension in Supabase
2. **Create Tables**: Set up pdf_chunks and rag_settings tables
3. **Configure Embeddings**: Set up OpenAI API integration
4. **Test Pipeline**: Verify end-to-end functionality

### **Environment Variables**
- `OPENAI_API_KEY`: OpenAI API key for embeddings and generation
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key

## 📊 **Performance and Optimization**

### **Vector Search Optimization**
- **Indexing**: Proper indexing for vector similarity search
- **Chunking Strategy**: Optimal chunk size and overlap
- **Embedding Models**: Efficient embedding models for better performance

### **Context Management**
- **Token Limits**: Respect OpenAI token limits
- **Context Truncation**: Smart truncation of conversation history
- **Memory Management**: Efficient storage and retrieval of conversation data

## 🔍 **Troubleshooting**

### **Common Issues**
- **Embedding Failures**: Check OpenAI API key and rate limits
- **Vector Search Issues**: Verify pgvector extension and indexing
- **Context Overflow**: Monitor token usage and implement truncation
- **Performance Issues**: Optimize chunking strategy and indexing

### **Debug Tools**
- **API Logging**: Comprehensive logging for RAG pipeline
- **Vector Search Testing**: Test vector similarity search functionality
- **Context Analysis**: Monitor context usage and token consumption

## 📝 **Recent Updates**

### **Thread-Based Conversations**
- Implemented persistent conversation threads
- Added context-aware follow-up support
- Enhanced user experience with professional chat interface

### **Pipeline Optimization**
- Simplified linear pipeline architecture
- Improved error handling and logging
- Enhanced performance and reliability

### **Database Integration**
- Comprehensive RAG database setup
- Optimized vector search functionality
- Improved data storage and retrieval

## 📞 **Support**

For RAG system-related questions:
1. **Check the documentation** in this folder
2. **Review the RAG pipeline** implementation
3. **Test the chat interface** and vector search
4. **Contact the development team**

