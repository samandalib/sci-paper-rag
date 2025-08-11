# 🚀 Sci-Paper RAG - Complete System

A comprehensive Retrieval-Augmented Generation (RAG) system for scientific papers, combining PDF preprocessing, intelligent chunking, vector search, and AI-powered chat.

## ✨ **What This System Does**

### **Complete RAG Pipeline**
1. **PDF Processing**: Upload and extract text from research papers
2. **Intelligent Chunking**: Split documents into optimal chunks with overlap
3. **Vector Embeddings**: Generate embeddings using OpenAI's latest models
4. **Vector Storage**: Store in Supabase with pgvector for similarity search
5. **AI Chat Interface**: Thread-based conversations with persistent memory
6. **Admin Dashboard**: Real-time monitoring and configuration

### **Key Features**
- **PDF Preprocessing**: Streamlit app for drag-and-drop PDF processing
- **Smart Chunking**: Configurable chunk sizes and overlap strategies
- **Vector Search**: Semantic similarity search across document chunks
- **Thread Memory**: Persistent conversations with context awareness
- **Real-time Admin**: Live monitoring and configuration updates
- **Professional UI**: Modern, responsive design with Tailwind CSS

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PDF Upload    │    │  Text Chunking  │    │   Embeddings    │
│   (Streamlit)   │───▶│   (Python)      │───▶│   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vector DB     │    │   RAG API       │    │   Chat UI       │
│   (Supabase)    │◀───│   (Next.js)     │◀───│   (React)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 **Project Structure**

```
sci-paper-rag/
├── 📁 python/                          # PDF preprocessing (Streamlit)
│   ├── pdf_to_jsonl_app.py            # Main Streamlit app
│   ├── pdf_to_jsonl.py                # CLI script
│   └── requirements.txt                # Python dependencies
├── 📁 client/                          # Next.js frontend
│   ├── components/                     # React components
│   │   ├── RagAIAssistantHero.tsx     # Main chat interface
│   │   └── RagAdmin.tsx               # Admin dashboard
│   ├── lib/                           # Utility libraries
│   │   ├── chat-thread.ts             # Thread management
│   │   └── api/                       # API utilities
│   └── pages/                         # Next.js pages
│       ├── index.tsx                  # Landing page
│       └── admin/                     # Admin pages
├── 📁 api/                            # Next.js API routes
│   ├── rag-chat.js                    # Main RAG chat endpoint
│   ├── rag-retrieve.js                # Vector search endpoint
│   └── document-stats.js              # Document statistics
├── 📁 scripts/                        # Database and processing scripts
│   ├── setup-database.js              # Database initialization
│   └── pdf-chunk-embed-upload.cjs     # PDF processing pipeline
├── 📁 ImportedPipeLineFiles/          # Temporary files (will be removed)
├── supabase-schema.sql                # Database schema
├── package.json                       # Node.js dependencies
├── next.config.js                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
└── README_COMPLETE.md                 # This file
```

## 🚀 **Quick Start**

### **1. Prerequisites**
- Node.js 18+ and npm
- Python 3.8+ and pip
- Supabase account and project
- OpenAI API key

### **2. Environment Setup**
```bash
# Clone the repository
git clone <your-repo-url>
cd sci-paper-rag

# Install Node.js dependencies
npm install

# Install Python dependencies
cd python
pip install -r requirements.txt
cd ..

# Copy environment template
cp env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

### **3. Database Setup**
```bash
# Set up Supabase database
npm run setup-db

# Or manually run the SQL schema
# Copy supabase-schema.sql content to your Supabase SQL editor
```

### **4. Start the System**
```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start Streamlit app (optional)
npm run streamlit

# Open http://localhost:3000 in your browser
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### **RAG Settings (Configurable via Admin)**
- **Chunk Size**: Number of tokens per chunk (default: 300)
- **Overlap**: Overlapping tokens between chunks (default: 50)
- **Max Results**: Maximum chunks to retrieve (default: 5)
- **User Instruction**: Prompt template for queries
- **System Prompt**: OpenAI system message
- **Embedding Model**: OpenAI embedding model

## 📚 **Usage Guide**

### **1. PDF Processing**
1. **Via Streamlit**: Run `npm run streamlit` and use the web interface
2. **Via Script**: Place PDFs in `./pdfs` directory and run `npm run process-pdfs`
3. **Output**: PDFs are chunked, embedded, and stored in Supabase

### **2. Chat Interface**
1. **Access**: Go to the main page and scroll to the chat section
2. **Ask Questions**: Type questions about your uploaded papers
3. **Thread Memory**: Conversations persist across page refreshes
4. **Context**: AI uses retrieved document chunks for answers

### **3. Admin Dashboard**
1. **Access**: Navigate to `/admin/rag`
2. **Monitor**: View document stats, embedding counts, and system health
3. **Configure**: Update RAG parameters and prompt templates
4. **Test**: Run pipeline tests and view detailed logs

## 🔄 **Workflow Examples**

### **Complete Research Paper Processing**
```bash
# 1. Upload PDFs via Streamlit or place in ./pdfs directory
# 2. Process PDFs with embeddings
npm run process-pdfs

# 3. Start the chat interface
npm run dev

# 4. Ask questions about your papers
# 5. Monitor and configure via admin dashboard
```

### **Custom Chunking Strategy**
```bash
# 1. Update RAG settings via admin dashboard
# 2. Re-process PDFs with new settings
npm run process-pdfs

# 3. Test new configuration in chat interface
```

## 🧪 **Testing & Development**

### **Development Commands**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database operations
npm run setup-db
npm run process-pdfs
```

### **Testing the Pipeline**
1. **Upload Test PDFs**: Use the Streamlit interface
2. **Check Database**: Verify chunks and embeddings in Supabase
3. **Test Chat**: Ask questions about your test documents
4. **Monitor Admin**: Check system health and statistics

## 🚨 **Troubleshooting**

### **Common Issues**

#### **PDF Processing Fails**
- **Cause**: Scanned PDFs (image-only)
- **Solution**: Use OCR tools to convert to text-based PDFs
- **Alternative**: Check PDF format and try different files

#### **Embedding Generation Fails**
- **Cause**: OpenAI API key issues or rate limits
- **Solution**: Verify API key and check OpenAI dashboard
- **Alternative**: Check network connectivity

#### **Vector Search Issues**
- **Cause**: pgvector extension not enabled
- **Solution**: Enable pgvector in Supabase dashboard
- **Alternative**: Check database schema and functions

#### **Chat Interface Not Working**
- **Cause**: Missing environment variables or API endpoints
- **Solution**: Verify .env.local configuration
- **Alternative**: Check browser console for errors

### **Debug Commands**
```bash
# Check database connection
npm run setup-db

# Test PDF processing
npm run process-pdfs

# Verify environment variables
echo $SUPABASE_URL
echo $OPENAI_API_KEY
```

## 📈 **Performance & Optimization**

### **Chunking Strategy**
- **Small Chunks (100-200 tokens)**: Better recall, more context per query
- **Large Chunks (500-1000 tokens)**: Faster processing, better for broad questions
- **Optimal**: 300 tokens with 50 overlap (default)

### **Vector Search Optimization**
- **Indexing**: pgvector ivfflat index for similarity search
- **Threshold**: Configurable similarity threshold (default: 0.7)
- **Results**: Limit results to prevent context overflow

### **Memory Management**
- **Thread Limits**: Maximum 50 messages per conversation
- **Context Truncation**: Last 20 messages sent to API
- **Storage**: localStorage for conversation persistence

## 🔮 **Future Enhancements**

### **Planned Features**
- [ ] **Multi-Thread Support**: Multiple conversation threads
- [ ] **Advanced Analytics**: Document usage and query patterns
- [ ] **Export Functionality**: Download conversations and reports
- [ ] **User Management**: Multi-user support with permissions
- [ ] **Advanced Search**: Hybrid vector + keyword search
- [ ] **Document Versioning**: Track document updates and changes

### **Performance Improvements**
- [ ] **Caching**: Redis for frequent queries and embeddings
- [ ] **Batch Processing**: Optimize PDF processing pipeline
- [ ] **Async Operations**: Background processing for large files
- [ ] **CDN Integration**: Optimize static asset delivery

## 🤝 **Contributing**

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### **Code Standards**
- **TypeScript**: Use strict typing for all new code
- **React**: Follow functional component patterns
- **Styling**: Use Tailwind CSS classes
- **Testing**: Include tests for new features

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 **Acknowledgments**

- **OpenAI**: For embedding and completion APIs
- **Supabase**: For vector database and hosting
- **Unstructured**: For PDF text extraction
- **Next.js**: For the React framework
- **Tailwind CSS**: For the design system

## 📞 **Support**

### **Getting Help**
1. **Check Documentation**: Review this README and code comments
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Create Issue**: Provide detailed error information and steps to reproduce
4. **Community**: Join discussions in project discussions

### **Useful Resources**
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**🎉 You now have a complete, production-ready RAG system for scientific papers!**

The system combines the best of both worlds:
- **PDF Preprocessing**: Your existing Streamlit app for document preparation
- **RAG Pipeline**: Complete AI-powered question-answering system
- **Professional UI**: Modern, responsive interface for users and admins
- **Scalable Architecture**: Ready for production deployment

Start by setting up your environment variables, running the database setup, and processing your first PDFs. Then enjoy intelligent conversations with your research papers! 🚀
