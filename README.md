# sci-paper-rag

**NOTE:**
- The `standalone-desktop/` folder contains the original Streamlit app, preserved for local/desktop use (can be packaged as a desktop app).
- The `backend/` and `frontend/` folders will contain the new cloud-ready backend (FastAPI) and modern frontend (Vite+React) architecture for deployment.

---

A plug-and-play Retrieval-Augmented Generation (RAG) pipeline for scientific papers and research documents.

---

## Desktop App Packaging & Usage Instructions

### **Project Structure and Paths**
- All instructions and scripts assume you are working from the **project root** (the folder containing this README).
- Example structure:
  ```
  sci-paper-rag/
    python/
      pdf_to_jsonl_app.py
    venv/
    run_app.py
    README.md
    ...
  ```
- All commands use **relative paths** (e.g., `python/pdf_to_jsonl_app.py`).

### **How to Activate the Virtual Environment (venv)**
From the project root:
```sh
source venv/bin/activate
```

### **How the Launcher Script Works**
- The launcher (`run_app.py`) automatically detects its own location and sets the working directory to the project root, so you can run the packaged app from anywhere.

### **How to Build the Desktop App**
1. Make sure your app works with:
   ```sh
   streamlit run python/pdf_to_jsonl_app.py
   ```
2. Install PyInstaller (in your venv):
   ```sh
   pip install pyinstaller
   ```
3. Build the executable:
   ```sh
   pyinstaller --onefile --name "ragPreprocessorV1" run_app.py
   ```
4. The executable will appear in the `dist/` folder.

### **How to Run the Desktop App**
- Double-click `ragPreprocessorV1` in the `dist/` folder, or run from terminal:
  ```sh
  ./dist/ragPreprocessorV1
  ```
- The app will open in your browser at `localhost:8501`.

### **If You Move or Rename the Project**
- All scripts and commands will still work as long as you run them from the new project root.
- The launcher script is portable and will always set the working directory to the correct location.

### **Distribution Considerations**
- **Users must have the full project folder and `venv`** (or you must package all dependencies in a more advanced way).
- For non-technical users, consider creating an installer or a zip with clear instructions.
- For cross-platform support, build on each OS (macOS, Windows, Linux) or use a tool like PyInstaller on each platform.

### **Future Versions**
- Future versions may include a more portable packaging (e.g., with all dependencies bundled, or using Streamlit Desktop when available).
- The project will also support a modern backend/frontend cloud architecture for web deployment.

---

## Specialization: Research Papers (PDFs)

**sci-paper-rag** is designed specifically for the unique challenges of research papers and academic PDFs, including:

- **Complex layouts:** Handles multi-column text, tables, figures, and captions.
- **Section markers:** Detects and chunks by sections (e.g., Abstract, Methods, Results, Discussion, References).
- **Citations and references:** Recognizes in-text citations, links to reference metadata, and manages footnotes/endnotes.
- **Metadata-rich chunks:** Each chunk can include section, page number, and citation context for smarter retrieval.

---

## Development Roadmap

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

## Deploying the Streamlit App on Render

You can deploy the PDF pre-processing Streamlit app to [Render](https://render.com/) for free, with full support for system-level dependencies (like libGL, Tesseract, Poppler, etc.).

### **Requirements**
- All app code and the `Dockerfile` must be in your GitHub repository (see below).
- Your `requirements.txt` should include all Python dependencies (see `python/requirements.txt`).

### **Dockerfile**
A sample `Dockerfile` is provided in the repo root. It installs all necessary system and Python dependencies for PDF and image processing.

### **Step-by-Step Deployment**
1. **Push your latest code (including Dockerfile) to GitHub.**
2. **Sign up or log in to [Render](https://render.com/)** and connect your GitHub account.
3. **Create a new Web Service:**
   - Click "New +" → "Web Service"
   - Select your `sci-paper-rag` repo and branch
   - Set **Language** to `Docker`
   - Leave **Root Directory** blank if the Dockerfile is in the repo root; set to `sci-paper-rag` if it's in a subfolder
   - Click "Create Web Service"
4. **Wait for the build and deploy process to finish.**
5. **Access your app** via the public URL provided by Render.

### **Updating the App**
- Push changes to GitHub; Render will auto-redeploy.

### **Troubleshooting**
- If you see `failed to read dockerfile: open Dockerfile: no such file or directory`, check the Root Directory setting.
- If you see missing system libraries, ensure your Dockerfile includes all necessary `apt-get install` lines.
- For Python dependency errors, update `python/requirements.txt` and redeploy.

---

## Local Development

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
