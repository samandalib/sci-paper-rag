# sci-paper-rag

A plug-and-play Retrieval-Augmented Generation (RAG) pipeline for scientific papers and research documents.

---

## Specialization: Research Papers (PDFs)

**sci-paper-rag** is designed specifically for the unique challenges of research papers and academic PDFs, including:

- **Complex layouts:** Handles multi-column text, tables, figures, and captions.
- **Section markers:** Detects and chunks by sections (e.g., Abstract, Methods, Results, Discussion, References).
- **Citations and references:** Recognizes in-text citations, links to reference metadata, and manages footnotes/endnotes.
- **Metadata-rich chunks:** Each chunk can include section, page number, and citation context for smarter retrieval and answer generation.
- **Pluggable PDF parsing:** Designed to support advanced PDF parsers for layout-aware extraction.

This specialization enables more accurate, context-aware retrieval and generation for scientific and technical documents.

---

## Features
- Document chunking, embedding, and storage
- Vector search retrieval (Supabase/pgvector)
- Configurable prompt templates and chunking settings
- OpenAI integration for answer generation
- API-ready: easily add `/rag-retrieve` and `/rag-chat` endpoints
- Designed for easy integration into any TypeScript/Node.js project

## Directory Structure

```
sci-paper-rag/
  python/
    pdf_to_jsonl.py           # CLI script for PDF extraction
    pdf_to_jsonl_app.py       # Streamlit app for PDF upload/extraction
    requirements.txt          # Python dependencies
  src/
    ...                      # TypeScript modules (chunking, embedding, etc.)
  README.md
  package.json
```

---

## Development Roadmap (Hybrid Pipeline)

### 1. PDF Extraction & Preprocessing (Python)
- **Tool:** `unstructured` (open-source)
- **Interface:**
  - CLI script for power users
  - **Streamlit app** for non-technical users (drag-and-drop PDF upload, download JSONL output)
- **Output:** JSONL file with section, text, page, and metadata for each chunk/element
- **Optional:** Integrate `scispacy` for NER/abbreviation expansion

### 2. Chunking & Ingestion (TypeScript/Node.js)
- **Reads** the JSONL output from Python
- **Performs** token-aware chunking with overlap
- **Attaches/extends** metadata as needed

### 3. Embedding & Storage
- **Embeds** chunks using open-source models (InstructorXL) or free-tier APIs
- **Stores** in a vector DB (Qdrant, Chroma, or Supabase/pgvector)
- **Supports** metadata filtering and hybrid search

### 4. Retrieval, Reranking, and Answer Generation
- **Handles** query expansion, synonym/abbreviation handling, and NER
- **Performs** hybrid search (vector + keyword + metadata)
- **Reranks** results for best relevance
- **Uses** prompt engineering for evidence-based, citation-rich answers

### 5. UI/UX & Feedback (Optional)
- **Streamlit app** for PDF upload and extraction
- **Example React/Next.js UI** for search and answer display
- **Feedback loop** for continuous improvement

---

## Status
**In development.** This library is being extracted from a production RAG pipeline and will be published as a standalone package.
