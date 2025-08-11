# Retrieval-Augmented Generation (RAG) Pipeline

This document describes the end-to-end RAG pipeline implemented in this app.

## 🎯 **Simplified Linear Pipeline**

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

### **Pipeline Flow**

1. **User Query**: User types question in chat interface
2. **API Processing**: API endpoints receive query and coordinate the search
3. **Vector Search**: System finds similar document chunks using embeddings
4. **AI Response**: OpenAI generates final answer using retrieved context

## 🧵 **Thread-Based Conversation System**

The RAG pipeline now supports **thread-based conversations** that provide persistent conversation memory for enhanced user experience.

### **Thread Management**
- **Session Persistence**: Conversations persist across page refreshes using localStorage
- **Context Awareness**: AI remembers previous messages and conversation flow
- **Follow-up Support**: Users can ask follow-up questions that reference previous context
- **No Database Required**: All conversation data stored locally in browser

### **API Integration**
The `/api/rag-chat` endpoint now accepts conversation history:

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

### **User Experience**
- **Chat Interface**: Professional message bubbles with timestamps
- **Streaming Responses**: Real-time typing indicators and streaming text
- **Thread Controls**: Clear conversation functionality with message count
- **Dynamic Placeholders**: Context-aware input placeholders

For detailed implementation, see `RAG_CHAT_THREADS.md`.

## Overview
- **Document Upload:** Users/admins upload documents (PDFs, etc.)
- **Chunking:** Documents are split into text chunks
- **Embedding:** Each chunk is embedded using OpenAI API
- **Storage:** Chunks and embeddings are stored in Supabase (PostgreSQL with pgvector)
- **Retrieval:** On user query, similar chunks are retrieved via vector search
- **Generation:** Retrieved context is sent to OpenAI for answer generation

## Pipeline Steps
1. **Upload**: User uploads document via UI
2. **Chunking**: Server splits document into overlapping text chunks
3. **Embedding**: Each chunk is embedded (OpenAI API)
4. **Storage**: Chunks + embeddings saved in `pdf_chunks` table
5. **Query**: User submits a question
6. **Vector Search**: Find similar chunks using pgvector
7. **RAG API**: Send context + question to OpenAI, return answer

## API Endpoints

### Relationship Between `/api/rag-retrieve` and `/api/rag-chat`
- `/api/rag-retrieve` is responsible for **finding the most relevant document chunks** for a user’s query using vector search. It does not call OpenAI or generate answers; it only returns the best context chunks from your database.
- `/api/rag-chat` is the **main endpoint for RAG-based chat**. It:
  1. Calls the same vector search logic as `/api/rag-retrieve` (sometimes by calling the endpoint, sometimes by calling the same function in code).
  2. Takes the retrieved chunks and sends them, along with the user’s question, to the OpenAI API for answer generation.
  3. Returns the generated answer, the context used, and optionally the sources.
- **Typical Flow:**
  1. User asks a question (via chat UI)
  2. `/api/rag-chat` is called
  3. `/api/rag-chat` runs a vector search (internally or via `/api/rag-retrieve`) to get relevant chunks
  4. `/api/rag-chat` sends the chunks + question to OpenAI (completion API)
  5. OpenAI returns an answer
  6. `/api/rag-chat` returns the answer, context, and sources to the frontend

### `/api/rag-chat`
- **Purpose:** Main endpoint for RAG-based chat/completion.
- **Input (POST):**
  - `query`: User's question (string)
  - `history`: (optional) Previous chat messages (array)
- **Process:**
  1. Receives user query (and optional chat history)
  2. Runs vector search to find relevant document chunks
  3. Sends context + query to OpenAI API for answer generation
- **Output (JSON):**
  - `answer`: Generated answer (string)
  - `context`: Chunks used (array)
  - `sources`: (optional) Source document info

### `/api/rag-retrieve`
- **Purpose:** Retrieve relevant document chunks for a query (no generation)
- **Input (POST):**
  - `query`: User's question (string)
- **Process:**
  1. Runs vector search in Supabase/pgvector
  2. Returns top-N most similar chunks
- **Output (JSON):**
  - `chunks`: Array of relevant text chunks
  - `scores`: Similarity scores

#### Supabase Configuration Values Used in Backend

The `/api/rag-retrieve` backend uses several configuration values stored in the `rag_settings` table in Supabase. These values are fetched dynamically and control the behavior of the retrieval and generation pipeline:

- **chunk_size**: Number of tokens (or characters) per document chunk. Controls how documents are split for embedding and retrieval.
- **overlap**: Number of tokens (or characters) that overlap between consecutive chunks. Helps preserve context across chunk boundaries.
- **max_results**: Maximum number of chunks to retrieve for each user query. Limits the context sent to the LLM.
- **user_instruction**: The instruction prepended to the user query and context, guiding the LLM on how to answer.
- **system_prompt**: The system message sent to OpenAI, setting the assistant's behavior and role.
- **embedding_model** (optional): The OpenAI embedding model to use for chunk embeddings (e.g., `text-embedding-ada-002`).

These values can be updated from the RAG Admin Dashboard and are used live by the backend for every request, enabling rapid iteration and tuning of the RAG pipeline.

### `/api/document-stats`
- **Purpose:** Get statistics about uploaded documents and embeddings
- **Input (GET):** None
- **Process:**
  1. Counts unique documents, processed chunks, embeddings, etc.
- **Output (JSON):**
  - `total`: Number of unique documents
  - `processed`: Number processed
  - `failed`: Number failed
  - `pending`: Number pending
  - `lastUpdated`: Timestamp

---
## Mermaid Diagram
```mermaid
graph TD
  A[User Uploads Document] --> B[Chunking]
  B --> C[Embedding (OpenAI)]
  C --> D[Store in Supabase]
  D --> E[Vector Search]
  E --> F[OpenAI Completion]
  F --> G[Response to User]
```

---
See also: `OPENAI_SETUP.md`, `supabase-schema.sql`, and RAG admin UI. 

---

## Enhancement Roadmap (Checklist)

A prioritized list of improvements to make the RAG pipeline more efficient and responses better:

### [ ] 1. **Improve Chunking Strategy**
- Experiment with chunk size and overlap for optimal context
- Remove boilerplate and irrelevant text from chunks

### [ ] 2. **Add and Use Metadata in Vector Search**
- Store metadata (document type, section, tags, date, etc.) in `pdf_chunks`
- Filter or boost results using metadata relevant to the query

### [ ] 3. **Upgrade Embeddings**
- Use the latest OpenAI embedding model (e.g., `text-embedding-3-large`)
- Re-embed data if upgrading models or preprocessing
- Consider domain-adapted embeddings if available

### [ ] 4. **Hybrid Search**
- Combine vector similarity with keyword (full-text) search for better recall/precision

### [ ] 5. **Prompt Engineering**
- Refine prompts sent to OpenAI for clarity, context, and formatting
- Use system instructions to guide style and answer format
- Include chat history for conversational context

### [ ] 6. **Optimize Top-K and Context Window**
- Tune the number of chunks (`match_count`) and context length sent to OpenAI
- Summarize or select the most relevant sentences if context is too long

### [ ] 7. **User Feedback Loop**
- Allow users to rate or flag answers
- Use feedback to improve retrieval and prompt design

### [ ] 8. **Batching, Caching, and Async Processing**
- Batch embedding requests
- Cache frequent queries and results
- Use background jobs for heavy tasks

### [ ] 9. **Security and Privacy**
- Scrub PII before storing or sending to OpenAI
- Enforce access control on sensitive data

---

Work through this checklist to systematically enhance your RAG pipeline from highest to lowest impact. 

---

## RAG Admin Dashboard

The RAG Admin Dashboard is a dedicated interface for monitoring, testing, and configuring the Retrieval-Augmented Generation pipeline.

### **Purpose**
- Provide real-time visibility into the health and connectivity of all RAG pipeline components.
- Allow admins to test the pipeline end-to-end and view detailed logs.
- Enable live editing of key RAG parameters and prompt templates without code changes.

### **Main Features**
- **Pipeline Visualization:**
  - Interactive diagram showing each pipeline checkpoint (Browser, Supabase, OpenAI, RAG API, Vector Search).
  - Color-coded status for each component (connected, error, testing, etc.) using the app's theme.
  - Animated SVG lines for connection status.
- **Real-Time Status & Logs:**
  - Run pipeline tests and see step-by-step logs of requests, responses, and errors.
  - View the current status of each component and connection.
- **Editable Settings:**
  - Change chunk size, overlap, and max results directly from the dashboard.
  - (Optionally) Edit the embedding model.
  - All changes are saved to Supabase and used live by the backend.
- **Prompt Template Editor:**
  - Edit the system prompt and user instruction used for RAG chat completions.
  - Changes are immediately reflected in the pipeline.
- **Modern UI/UX:**
  - Fully responsive, theme-aware (light/dark), and consistent with the rest of the app.
  - Uses Tailwind CSS and custom UI components for a clean, professional look.

### **How It Helps**
- **Rapid iteration:** Change RAG parameters and prompts without redeploying code.
- **Debugging:** Instantly see which part of the pipeline is failing and why.
- **Transparency:** All pipeline activity and configuration is visible in one place.

---

For implementation details, see `client/pages/admin/RagAdmin.tsx` and related API utilities. 