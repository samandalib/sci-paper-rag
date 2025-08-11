# 🚀 Multi-Tenant RAG System Setup Guide

## 🎯 **What We're Building**

A **multi-tenant SaaS RAG system** where:
- Users sign up and get their own account
- Each user has their own vector table for their PDFs
- Users get embeddable chat widgets for their websites
- Complete data isolation between users

## 🏗️ **New Architecture**

### **Multi-Tenant Structure**
```
User A → pdf_chunks (user_id = A) → Chat Widget A
User B → pdf_chunks (user_id = B) → Chat Widget B
User C → pdf_chunks (user_id = C) → Chat Widget C
```

### **Key Features**
- ✅ **User Authentication**: Signup/login system
- ✅ **Data Isolation**: Each user only sees their own data
- ✅ **Subscription Tiers**: Free, Pro, Enterprise plans
- ✅ **Embeddable Widgets**: Chat UI for user websites
- ✅ **User Dashboard**: Manage PDFs and settings per user

## 🔧 **Setup Steps**

### **1. Get Your Supabase Service Role Key**

1. Go to [https://zuhdwsnhipyyrynlmpgg.supabase.co](https://zuhdwsnhipyyrynlmpgg.supabase.co)
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. This key has admin privileges to create tables and functions

### **2. Set Environment Variables**

```bash
# Copy the environment template
cp env.example .env.local

# Edit .env.local and add your service role key
nano .env.local
```

**Required Variables:**
```bash
SUPABASE_URL=https://zuhdwsnhipyyrynlmpgg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1aGR3c25oaXB5eXJ5bmxtcGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzU0OTYsImV4cCI6MjA3MDUxMTQ5Nn0.qwWTPDVATwzNnAtSxe5LRo67wZZNZsOZdzZCazckfvE
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### **3. Set Up the Database**

```bash
# Run the multi-tenant database setup
npm run setup-multi-tenant
```

This will create:
- Users table with subscription management
- User-specific PDF chunks table
- User documents tracking table
- User-specific RAG settings
- Global RAG settings
- Vector search functions with user isolation
- Proper indexes and security policies

### **4. Verify Database Setup**

1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. You should see these tables:
   - `users`
   - `pdf_chunks`
   - `user_documents`
   - `user_rag_settings`
   - `global_rag_settings`

4. Check **Functions** section for:
   - `match_user_pdf_chunks`
   - `get_user_document_stats`

## 📊 **Database Schema Overview**

### **Core Tables**

#### **Users Table**
```sql
users (
  id, email, full_name, company_name,
  subscription_tier, max_documents, max_storage_mb,
  is_active, created_at, updated_at, last_login, settings
)
```

#### **PDF Chunks Table**
```sql
pdf_chunks (
  id, user_id, filename, chunk_index, chunk_text,
  embedding, metadata, created_at, updated_at
)
```

#### **User Documents Table**
```sql
user_documents (
  id, user_id, filename, original_filename, file_size_bytes,
  total_chunks, chunks_with_embeddings, processing_status,
  error_message, created_at, updated_at
)
```

### **Security Features**

- **Row Level Security (RLS)**: Enabled on all tables
- **User Isolation**: Users can only access their own data
- **Secure Functions**: Vector search scoped to specific users
- **Permission System**: Proper grants for authenticated users

## 🚀 **Next Development Steps**

### **Phase 1: User Authentication**
- [ ] Set up NextAuth.js or Supabase Auth
- [ ] Create signup/login pages
- [ ] Implement user session management
- [ ] Add user profile management

### **Phase 2: User Dashboard**
- [ ] Create user-specific RAG dashboard
- [ ] Implement PDF upload per user
- [ ] Add document management interface
- [ ] Create user settings page

### **Phase 3: Embeddable Widgets**
- [ ] Build embeddable chat interface
- [ ] Generate unique widget keys per user
- [ ] Create widget customization options
- [ ] Implement widget analytics

### **Phase 4: Multi-Tenant API**
- [ ] Update RAG endpoints with user scoping
- [ ] Add user authentication middleware
- [ ] Implement user-specific rate limiting
- [ ] Add subscription tier enforcement

## 🔍 **Testing the Setup**

### **1. Test Database Connection**
```bash
npm run setup-multi-tenant
```

**Expected Output:**
```
✅ Successfully connected to Supabase (tables not yet created)
✅ users table created successfully
✅ pdf_chunks table created successfully
✅ user_documents table created successfully
✅ user_rag_settings table created successfully
✅ global_rag_settings table created successfully
✅ Vector search function created successfully
🎉 Multi-Tenant RAG Database Setup Completed Successfully!
```

### **2. Verify Tables in Supabase**
- Go to **Table Editor** in your dashboard
- Check that all tables exist
- Verify the structure matches the schema

### **3. Test Vector Search Function**
- Go to **Functions** in your dashboard
- Verify `match_user_pdf_chunks` exists
- Check the function signature and permissions

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Missing SUPABASE_SERVICE_ROLE_KEY"**
- **Cause**: Environment variable not set
- **Solution**: Add your service role key to `.env.local`
- **Location**: Supabase Dashboard → Settings → API → service_role

#### **"Failed to create tables"**
- **Cause**: Insufficient permissions or connection issues
- **Solution**: Verify service role key and network connectivity
- **Alternative**: Check Supabase project status

#### **"Vector extension not enabled"**
- **Cause**: pgvector extension not enabled
- **Solution**: Enable pgvector in Supabase Dashboard → Database → Extensions

#### **"RLS policies failed"**
- **Cause**: Row Level Security setup issues
- **Solution**: Check if RLS is properly enabled on tables
- **Alternative**: Verify user authentication setup

### **Debug Commands**
```bash
# Check environment variables
echo $SUPABASE_SERVICE_ROLE_KEY

# Test database connection
npm run setup-multi-tenant

# Check Supabase dashboard for errors
# Go to Logs section for detailed error messages
```

## 📚 **API Endpoints to Update**

### **Current Endpoints (Need User Scoping)**
- `/api/rag-chat` → Add user authentication
- `/api/rag-retrieve` → Scope to user's chunks
- `/api/document-stats` → User-specific statistics

### **New Endpoints Needed**
- `/api/auth/signup` → User registration
- `/api/auth/login` → User authentication
- `/api/user/documents` → User document management
- `/api/user/widgets` → Widget configuration
- `/api/widget/chat` → Public widget chat endpoint

## 🎯 **What You Have Now**

✅ **Complete Database Schema**: Multi-tenant tables and functions  
✅ **Security Foundation**: RLS policies and user isolation  
✅ **Vector Search**: User-scoped similarity search  
✅ **Setup Scripts**: Automated database initialization  
✅ **Documentation**: Comprehensive setup and usage guides  

## 🚀 **Ready to Build!**

Your multi-tenant RAG system foundation is now complete! You can:

1. **Start Building**: Begin implementing user authentication
2. **Test Security**: Verify user data isolation works
3. **Create UI**: Build user dashboard and widget interfaces
4. **Scale Up**: Add more users and features

## 📞 **Need Help?**

- Check the Supabase dashboard for detailed error logs
- Verify all environment variables are set correctly
- Test the database setup step by step
- Review the schema and function definitions

**Happy building! 🚀**
