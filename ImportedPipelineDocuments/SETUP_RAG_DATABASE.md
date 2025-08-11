# 🚀 RAG Admin Setup Guide

## **📋 Prerequisites**
- Access to your Supabase project dashboard
- Existing RAG pipeline with `pdf_chunks` table
- Admin privileges to run SQL commands

## **🔍 Current RAG Infrastructure**

Your app already has a working RAG pipeline with:

### **✅ Existing Components:**
- **API Endpoints**: `/api/rag-chat` and `/api/rag-retrieve`
- **Database Table**: `pdf_chunks` with embeddings
- **Vector Search**: `match_pdf_chunks` function
- **PDF Processing**: `pdf-chunk-embed-upload.cjs` script

### **📊 What the Admin Interface Shows:**

#### **Overview Tab:**
- **Document Stats**: Real counts from existing `pdf_chunks` table
- **Embedding Stats**: Real counts of chunks with embeddings
- **Chat Stats**: Mock data (chat history not tracked yet)
- **System Health**: Mock data (system monitoring not implemented yet)

#### **Documents Tab:**
- List of actual documents from `pdf_chunks` table
- Real embedding counts per document
- Document processing status

#### **Chats Tab:**
- Mock chat data (chat history tracking not implemented yet)
- TODO: Integrate with actual chat history

#### **Settings Tab:**
- Current RAG configuration values
- TODO: Make settings configurable

## **🔧 Step 1: Verify Existing Setup**

1. **Check Supabase Dashboard**
   - Go to your project at https://supabase.com/dashboard
   - Navigate to "Table Editor"
   - Verify `pdf_chunks` table exists

2. **Check pgvector Extension**
   - Go to "Database" → "Extensions"
   - Ensure "pgvector" is enabled

3. **Verify RPC Function**
   - Go to "Database" → "Functions"
   - Check that `match_pdf_chunks` function exists

## **✅ Step 2: Test the Admin Interface**

1. **Access Admin Page**
   - Go to `http://localhost:5174/admin/rag`
   - Sign in with admin email (`hesam.andalib@gmail.com` or `road265.life@gmail.com`)

2. **Check Real Data**
   - **Overview Tab**: Should show real document and embedding counts
   - **Documents Tab**: Should list actual PDF files from your system
   - **Chats Tab**: Shows mock data for now
   - **Settings Tab**: Shows current RAG configuration

## **🔍 Expected Results**

### **If You Have PDFs Processed:**
- **Document Stats**: Shows actual number of unique PDF files
- **Embedding Stats**: Shows total chunks and successful embeddings
- **Documents List**: Shows your actual PDF filenames with chunk counts

### **If No PDFs Processed Yet:**
- All counts will be 0
- Documents list will be empty
- This is normal - you need to process PDFs first

## **📈 Next Steps for Full Integration**

### **1. Process Some PDFs (if not done already):**
```bash
# Place PDFs in /pdfs directory
# Run the processing script
node scripts/pdf-chunk-embed-upload.cjs
```

### **2. Test RAG Chat:**
- Use your existing `/RagAIAssistantHero` component
- Verify that chat works with your processed documents

### **3. Enhance Admin Features:**
- **Chat History**: Track actual chat conversations
- **System Health**: Monitor real system metrics
- **Settings**: Make RAG parameters configurable
- **File Upload**: Add UI for uploading new PDFs

## **🚨 Troubleshooting**

### **"Access Denied" Error:**
- Make sure you're signed in with an admin email
- Check that you're accessing `/admin/rag` route

### **Empty Data:**
- Verify that `pdf_chunks` table has data
- Check that PDFs have been processed with `pdf-chunk-embed-upload.cjs`

### **"Table not found" Error:**
- Ensure `pdf_chunks` table exists in your Supabase project
- Check that pgvector extension is enabled

### **Vector Search Issues:**
- Verify `match_pdf_chunks` function exists
- Check that embeddings are properly stored in the table

## **🔗 Useful Files**

- **RAG API**: `api/rag-chat.js` and `api/rag-retrieve.js`
- **PDF Processing**: `scripts/pdf-chunk-embed-upload.cjs`
- **Admin Interface**: `client/pages/admin/RagAdmin.tsx`
- **Admin API**: `client/lib/api/rag-admin.ts`

## **📊 Current Status**

✅ **Working**: Document stats, embedding stats, document listing  
🔄 **Mock Data**: Chat history, system health  
📝 **TODO**: Chat tracking, system monitoring, settings storage

---

**The admin interface is now connected to your existing RAG infrastructure!** It will show real data from your `pdf_chunks` table and help you monitor your RAG pipeline. 