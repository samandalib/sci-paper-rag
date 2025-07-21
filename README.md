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
  src/
    chunking.ts      # Document chunking logic
    embedding.ts     # Embedding logic (OpenAI)
    retrieval.ts     # Vector search logic
    prompts.ts       # Prompt assembly and templates
    openai.ts        # OpenAI API wrapper
    config.ts        # Config loader (Supabase/.env)
    types.ts         # Shared types/interfaces
    index.ts         # Main entry point
  test/
    ...              # Unit and integration tests
  README.md
  package.json
```

## Usage (Coming Soon)
- Import the library into your backend
- Configure with your Supabase and OpenAI keys
- Use the provided API handlers or call the core functions directly

## Status
**In development.** This library is being extracted from a production RAG pipeline and will be published as a standalone package.
