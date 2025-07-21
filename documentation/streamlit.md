# Streamlit PDF Pre-processing App Documentation

## Purpose
This Streamlit app is designed to help users extract and chunk text from research paper PDFs as a first step in building a Retrieval-Augmented Generation (RAG) database. Users can preprocess their PDFs locally, then upload the resulting chunked JSONL files to an Admin dashboard for ingestion into the RAG system.

## Features
- **Multi-file PDF upload** with drag-and-drop interface.
- **Per-file extraction** to JSONL format (one JSON object per extracted element).
- **Global chunking settings**: Set chunking method, chunk size, and overlap for all files at once.
- **Per-file chunking options**: Override global settings for individual files if needed.
- **Visual step indicators** for extraction and chunking.
- **Download buttons**:
  - Download original extracted JSONL (tertiary color button)
  - Download chunked JSONL (secondary color button, now appears above preview)
- **Preview of first 3 chunks** after chunking.
- **Robust error handling** for scanned/image-only PDFs.
- **Modern, clean UI** with clear messaging and collapsible "About this tool" section.

## Workflow
1. **Upload PDF(s)** using the drag-and-drop box below the page title.
2. For each file:
   - Click **Process** (gray/secondary button) to extract text to JSONL.
   - Download the extracted JSONL (tertiary button) if desired.
   - Use the **File Chunking Options** expander to set chunking method, size, and overlap (defaults to global settings, but can be customized per file).
   - Click **Chunk & Preview** to generate chunks.
   - Download the chunked JSONL (secondary button, above preview).
   - Preview the first 3 chunks in the UI.
3. **Upload the chunked JSONL files** to your Admin dashboard for ingestion into the RAG database.

## UI Details
- **Global Chunking Settings**: At the top, in a collapsible expander. Lets you set chunking method, chunk size, and overlap for all files. "Apply to All Files" copies these settings to every file.
- **Per-file Containers**: Each uploaded PDF gets its own container with:
  - File name
  - Step indicator (Step 1: Extract JSONL → Step 2: Chunk JSONL)
  - Process/Extract button (secondary/gray)
  - Download JSONL button (tertiary)
  - Extraction status
  - File Chunking Options expander (shows if settings are customized)
  - Chunk & Preview button
  - Download Chunked JSONL button (secondary, above preview)
  - Preview of first 3 chunks
- **About this tool**: Collapsible section with detailed notes and next steps.

## Button Colors
- **Process/Extract**: Secondary (gray)
- **Download JSONL**: Tertiary
- **Download Chunked JSONL**: Secondary (blue/gray, above preview)

## Error Handling
- If extraction fails (e.g., scanned PDF), a clear error message is shown with tips for using OCR tools to convert the file.

## Requirements
- Python 3.8+
- `streamlit`, `unstructured`, `tiktoken`, and other dependencies (see `requirements.txt`)

## How to Run
1. Activate your Python virtual environment.
2. Install dependencies: `pip install -r requirements.txt`
3. Run the app: `streamlit run python/pdf_to_jsonl_app.py`

## Next Steps
- Upload your chunked JSONL files to the Admin dashboard for embedding and storage in the RAG database.
- Use the RAG system to enable advanced search and question-answering over your research papers.

---

*Developed for the sci-paper-rag pipeline. Powered by [unstructured](https://github.com/Unstructured-IO/unstructured) and Streamlit.* 