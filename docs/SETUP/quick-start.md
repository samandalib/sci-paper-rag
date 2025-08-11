# 🚀 Quick Start Guide - Get Running in 5 Minutes

This guide will get your multi-tenant RAG system up and running quickly. Follow these steps in order.

## ⚡ **Prerequisites (2 minutes)**

### **1. Required Accounts**
- ✅ **Supabase**: [https://zuhdwsnhipyyrynlmpgg.supabase.co](https://zuhdwsnhipyyrynlmpgg.supabase.co)
- ✅ **OpenAI**: [https://platform.openai.com](https://platform.openai.com) (for API key)

### **2. Required Software**
- ✅ **Node.js 18+**: [https://nodejs.org](https://nodejs.org)
- ✅ **Python 3.8+**: [https://python.org](https://python.org)
- ✅ **Git**: [https://git-scm.com](https://git-scm.com)

## 🔑 **Get Your API Keys (1 minute)**

### **Supabase Service Role Key**
1. Go to [https://zuhdwsnhipyyrynlmpgg.supabase.co](https://zuhdwsnhipyyrynlmpgg.supabase.co)
2. Click **Settings** → **API** in the left sidebar
3. Copy the **service_role** key (not the anon key)
4. Keep this safe - you'll need it for database setup

### **OpenAI API Key**
1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Navigate to **API Keys**
3. Create a new secret key
4. Copy and save the key

## 🗄️ **Database Setup (1 minute)**

### **1. Enable Vector Extension**
1. In Supabase dashboard, go to **Database** → **Extensions**
2. Find `vector` and click **Enable** if not already enabled
3. Verify `uuid-ossp` is also enabled

### **2. Run Database Schema**
1. Go to **SQL Editor** in Supabase
2. Create a **New Query**
3. Copy the entire schema from [Database Schema](../ARCHITECTURE/database.md)
4. Click **Run** and wait for completion

**Expected Result**: 8 tables created, 3 functions created, RLS policies enabled

## ⚙️ **Local Environment Setup (1 minute)**

### **1. Clone and Setup**
```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd sci-paper-rag

# Install dependencies
npm install

# Install Python dependencies
cd python && pip install -r requirements.txt && cd ..
```

### **2. Environment Configuration**
```bash
# Copy environment template
cp env.example .env.local

# Edit with your keys
nano .env.local
```

**Required Variables:**
```bash
SUPABASE_URL=https://zuhdwsnhipyyrynlmpgg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aGR3c25oaXB5eXJ5bmxtcGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzU0OTYsImV4cCI6MjA3MDUxMTQ5Nn0.qwWTPDVATwzNnAtSxe5LRo67wZZNZsOZdzZCazckfvE
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## 🚀 **Start the System (1 minute)**

### **1. Start Next.js App**
```bash
# Terminal 1: Start the main application
npm run dev
```

**Expected**: App running at `http://localhost:3000`

### **2. Start Streamlit (Optional)**
```bash
# Terminal 2: Start PDF preprocessing (optional)
npm run streamlit
```

**Expected**: Streamlit app running at `http://localhost:8501`

## ✅ **Verify Everything Works**

### **1. Check Database Connection**
- Go to `http://localhost:3000`
- Navigate to `/admin/rag` (if implemented)
- Verify no database connection errors

### **2. Test PDF Processing**
- Use the Streamlit app to upload a test PDF
- Verify the file processes without errors
- Check that chunks appear in your database

### **3. Test RAG Chat**
- Go to the main page chat interface
- Ask a question about your uploaded documents
- Verify you get AI-generated responses

## 🚨 **Troubleshooting Quick Fixes**

### **"Database Connection Failed"**
- ✅ Check your `.env.local` file
- ✅ Verify Supabase project is active
- ✅ Check service role key is correct

### **"Vector Extension Not Found"**
- ✅ Enable vector extension in Supabase
- ✅ Check you're on a Pro plan or higher

### **"OpenAI API Error"**
- ✅ Verify OpenAI API key is correct
- ✅ Check your OpenAI account has credits
- ✅ Verify API key has proper permissions

### **"Tables Don't Exist"**
- ✅ Run the database schema SQL
- ✅ Check for SQL errors in Supabase logs
- ✅ Verify all tables were created successfully

## 🎯 **What You Have Now**

✅ **Multi-tenant database** with user isolation  
✅ **Vector search capabilities** with pgvector  
✅ **PDF processing pipeline** with Streamlit  
✅ **RAG chat interface** with OpenAI integration  
✅ **User authentication foundation** ready for implementation  
✅ **Embeddable widget system** architecture in place  

## 🚀 **Next Steps**

1. **Implement User Authentication**: Set up signup/login system
2. **Build User Dashboard**: Create user-specific PDF management
3. **Create Embeddable Widgets**: Build chat widgets for user websites
4. **Add Subscription Management**: Implement billing and usage limits

## 📚 **Need More Help?**

- **Setup Issues**: Check [Environment Setup](./environment.md)
- **Database Problems**: Review [Database Setup](./database.md)
- **Architecture Questions**: Read [System Overview](../ARCHITECTURE/overview.md)
- **Development**: Follow [Development Setup](../DEVELOPMENT/setup.md)

---

**⏱️ Total Time**: ~5 minutes  
**🔗 Next**: [Environment Setup](./environment.md) | [Development Setup](../DEVELOPMENT/setup.md)  
**📅 Last Updated**: December 2024
