import streamlit as st
import tempfile
import os
import json
import tiktoken
from unstructured.partition.pdf import partition_pdf

st.set_page_config(page_title="Pre-process pdf research papers for RAG database", layout="centered")
st.markdown("<h1 style='margin-bottom:0.2em;'>Pre-process PDF Research Papers for RAG Database</h1>", unsafe_allow_html=True)
st.caption("Step 1: Extract and chunk your research papers for RAG. Step 2: Upload the chunked files to your Admin dashboard.")

# Add a global Clear All Memory button at the top
if st.button("🧹 Clear All Memory", key="clear_all_memory"):
    keys_to_clear = [k for k in st.session_state.keys() if k.startswith("session_") or k.startswith("jsonl_") or k.startswith("count_") or k.startswith("error_") or k.startswith("chunks_") or k.startswith("file_chunk_settings_") or k.startswith("downloaded_file_")]
    for k in keys_to_clear:
        del st.session_state[k]
    st.success("All file data and memory cleared.")
    st.rerun()

# Show a persistent message if a file was just downloaded and cleared
if 'last_downloaded_file' in st.session_state:
    st.info(f"File '{st.session_state['last_downloaded_file']}' was downloaded and cleared from memory. To process it again, please re-upload.")
    del st.session_state['last_downloaded_file']

# About this tool toggle
if 'show_about' not in st.session_state:
    st.session_state['show_about'] = False
if st.button("ℹ️ About this tool", key="about_btn"):
    st.session_state['show_about'] = not st.session_state['show_about']
if st.session_state['show_about']:
    st.markdown("""
    <div style='background:#f3f4f6; border-radius:10px; padding:1.2em; margin-bottom:1em;'>
    *This is the **first step** toward building a Retrieval-Augmented Generation (RAG) database from your research papers.*

    **What happens here:**
    - Extract structured, section-aware text from your PDF research papers and save as JSONL files.
    - Chunk the extracted text for downstream embedding and retrieval.

    **Next steps:**
    1. **Upload your chunked JSONL files to the Admin dashboard** to ingest them into the RAG database.
    2. **Embedding & Storage:** The dashboard will handle embedding and storage in a vector database (e.g., Supabase with pgvector).
    3. **RAG Pipeline:** Use the database to enable advanced search and question-answering over your research papers.

    ---
    **Note:** This tool is for digital (text-based) research PDFs only. **Scanned PDFs (image-only) are not supported.**
    If you upload a scanned PDF, extraction will fail. To convert a scanned PDF to a compatible format, use OCR tools like [Adobe Acrobat OCR](https://helpx.adobe.com/acrobat/using/scan-documents-pdf.html), [online OCR services](https://www.onlineocr.net/), or [Tesseract OCR](https://github.com/tesseract-ocr/tesseract).
    </div>
    """, unsafe_allow_html=True)

# Global chunking settings
if 'global_chunk_method' not in st.session_state:
    st.session_state['global_chunk_method'] = "By section, then tokens if too long"
if 'global_chunk_size' not in st.session_state:
    st.session_state['global_chunk_size'] = 300
if 'global_overlap' not in st.session_state:
    st.session_state['global_overlap'] = 50

with st.expander("🌐 Global Chunking Settings", expanded=False):
    global_chunk_method = st.selectbox(
        "Chunking method (applies to all files unless overridden)",
        ["By section", "By tokens (with overlap)", "By section, then tokens if too long"],
        index=["By section", "By tokens (with overlap)", "By section, then tokens if too long"].index(st.session_state['global_chunk_method']),
        key="global_chunk_method_select"
    )
    st.caption("""
    **Chunking method:**
    - *By section*: Each section (e.g., Introduction, Methods) is a chunk. Fastest, but may create very large or small chunks depending on section length.
    - *By tokens (with overlap)*: Splits text into fixed-size chunks (e.g., 300 tokens) with optional overlap. More uniform, but may split sections mid-sentence.
    - *By section, then tokens if too long*: Chunks by section, but splits long sections into smaller token-based chunks. Recommended for most research papers.
    """)
    global_chunk_size = st.number_input(
        "Chunk size (tokens)", min_value=50, max_value=2000, value=st.session_state['global_chunk_size'], step=50, key="global_chunk_size_input"
    )
    st.caption(f"""
    **Chunk size:**
    - *Smaller values* (e.g., 100-200): More, shorter chunks. Increases recall (more context per query), but may increase processing time and storage. May improve answer accuracy for short, focused questions.
    - *Larger values* (e.g., 500-1000): Fewer, longer chunks. Faster to process and store, but may reduce retrieval precision and increase LLM context window usage. May be better for broad or summary questions.
    - *Default (300)*: Good balance for most scientific papers and OpenAI models.
    """)
    global_overlap = st.number_input(
        "Chunk overlap (tokens)", min_value=0, max_value=global_chunk_size-1, value=st.session_state['global_overlap'], step=10, key="global_overlap_input"
    )
    st.caption(f"""
    **Chunk overlap:**
    - *Higher overlap* (e.g., 50-100): Chunks share more content. Reduces risk of splitting important context, but increases processing time and storage.
    - *Lower overlap* (e.g., 0-20): Chunks are more distinct. Faster and smaller, but may miss context at chunk boundaries.
    - *Default (50)*: Recommended for most use cases.
    """)
    if st.button("Apply to All Files", key="apply_global_chunking"):
        st.session_state['global_chunk_method'] = global_chunk_method
        st.session_state['global_chunk_size'] = global_chunk_size
        st.session_state['global_overlap'] = global_overlap
        # Set all per-file settings to global
        if 'file_chunk_settings' not in st.session_state:
            st.session_state['file_chunk_settings'] = {}
        for k in st.session_state.keys():
            if k.startswith('file_chunk_settings_'):
                st.session_state[k] = {
                    'chunk_method': global_chunk_method,
                    'chunk_size': global_chunk_size,
                    'overlap': global_overlap
                }

uploaded_files = st.file_uploader("Upload PDF(s)", type=["pdf"], accept_multiple_files=True)

if uploaded_files:
    for idx, uploaded_file in enumerate(uploaded_files):
        with st.container():
            base_name = os.path.splitext(uploaded_file.name)[0]
            jsonl_filename = f"{base_name}.jsonl"
            extract_key = f"extract_{uploaded_file.name}_{idx}"
            download_key = f"download_{uploaded_file.name}_{idx}"
            session_key = f"session_{uploaded_file.name}_{idx}"
            file_chunk_key = f"file_chunk_settings_{session_key}"

            st.markdown(f"<div style='font-size:1.1em;font-weight:600;margin-bottom:0.2em;'>{uploaded_file.name}</div>", unsafe_allow_html=True)

            # Step indicator
            step = st.session_state[session_key] if session_key in st.session_state else "idle"
            if step in ["idle", "extracting", "error"]:
                st.markdown("""
                <div style='margin-bottom:0.5em;'>
                <span style='font-weight:bold; color:#2563eb;'>Step 1: Extract JSONL</span> &rarr; <span style='color:#9ca3af;'>Step 2: Chunk JSONL</span>
                </div>
                """, unsafe_allow_html=True)
            elif step == "done":
                st.markdown("""
                <div style='margin-bottom:0.5em;'>
                <span style='color:#9ca3af;'>Step 1: Extract JSONL</span> &rarr; <span style='font-weight:bold; color:#2563eb;'>Step 2: Chunk JSONL</span>
                </div>
                """, unsafe_allow_html=True)

            if session_key not in st.session_state:
                st.session_state[session_key] = "idle"
                st.session_state[f"jsonl_{session_key}"] = None
                st.session_state[f"count_{session_key}"] = 0
                st.session_state[f"error_{session_key}"] = None
                st.session_state[f"chunks_{session_key}"] = None
            if file_chunk_key not in st.session_state:
                st.session_state[file_chunk_key] = {
                    'chunk_method': st.session_state['global_chunk_method'],
                    'chunk_size': st.session_state['global_chunk_size'],
                    'overlap': st.session_state['global_overlap']
                }

            cols = st.columns([1, 1, 2])
            with cols[0]:
                if st.session_state[session_key] == "idle":
                    if st.button("🔍 Process", key=extract_key, type="secondary", help="Extract text from PDF"):
                        st.session_state[session_key] = "extracting"
                        st.rerun()
                elif st.session_state[session_key] == "done":
                    if st.button("🔄 Re-process", key=f"re_{extract_key}", type="secondary", help="Re-extract if needed"):
                        st.session_state[session_key] = "idle"
                        st.session_state[f"jsonl_{session_key}"] = None
                        st.session_state[f"count_{session_key}"] = 0
                        st.session_state[f"error_{session_key}"] = None
                        st.session_state[f"chunks_{session_key}"] = None
                        st.rerun()
            with cols[1]:
                if st.session_state[session_key] == "done":
                    st.download_button(
                        label="⬇️ Download JSONL",
                        data=st.session_state[f"jsonl_{session_key}"] or "",
                        file_name=jsonl_filename,
                        mime="application/json",
                        key=download_key,
                        type="tertiary",
                        help="Download extracted JSONL file."
                    )
            with cols[2]:
                if st.session_state[session_key] == "done":
                    st.success(f"{st.session_state[f'count_{session_key}']} elements extracted.", icon="✅")

            if st.session_state[session_key] == "extracting":
                with st.spinner("Extracting..."):
                    try:
                        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
                            tmp_pdf.write(uploaded_file.read())
                            tmp_pdf_path = tmp_pdf.name
                        elements = partition_pdf(tmp_pdf_path, infer_table_structure=False, ocr_strategy="none")
                        jsonl_lines = []
                        for el in elements:
                            record = {
                                "text": el.text,
                                "section": getattr(el.metadata, 'section', None),
                                "category": getattr(el, 'category', None),
                                "page_number": getattr(el.metadata, 'page_number', None),
                                "type": getattr(el, 'category', None),
                                "metadata": el.metadata.to_dict() if hasattr(el, 'metadata') else {},
                            }
                            jsonl_lines.append(json.dumps(record, ensure_ascii=False))
                        jsonl_content = "\n".join(jsonl_lines)
                        st.session_state[f"jsonl_{session_key}"] = jsonl_content
                        st.session_state[f"count_{session_key}"] = len(jsonl_lines)
                        st.session_state[session_key] = "done"
                        st.session_state[f"error_{session_key}"] = None
                        if os.path.exists(tmp_pdf_path):
                            os.remove(tmp_pdf_path)
                        # Remove the original PDF from memory after processing
                        uploaded_file = None
                        st.rerun()
                    except Exception as e:
                        st.session_state[f"error_{session_key}"] = str(e)
                        st.session_state[session_key] = "error"
                        st.rerun()
            elif st.session_state[session_key] == "done":
                with st.expander("⚙️ File Chunking Options" + ("  (customized)" if st.session_state[file_chunk_key]['chunk_method'] != st.session_state['global_chunk_method'] or st.session_state[file_chunk_key]['chunk_size'] != st.session_state['global_chunk_size'] or st.session_state[file_chunk_key]['overlap'] != st.session_state['global_overlap'] else ""), expanded=False):
                    chunk_method = st.selectbox(
                        "Chunking method",
                        ["By section", "By tokens (with overlap)", "By section, then tokens if too long"],
                        index=["By section", "By tokens (with overlap)", "By section, then tokens if too long"].index(st.session_state[file_chunk_key]['chunk_method']),
                        key=f"chunk_method_{idx}"
                    )
                    st.caption("""
                    **Chunking method:**
                    - *By section*: Each section (e.g., Introduction, Methods) is a chunk. Fastest, but may create very large or small chunks depending on section length.
                    - *By tokens (with overlap)*: Splits text into fixed-size chunks (e.g., 300 tokens) with optional overlap. More uniform, but may split sections mid-sentence.
                    - *By section, then tokens if too long*: Chunks by section, but splits long sections into smaller token-based chunks. Recommended for most research papers.
                    """)
                    chunk_size = st.number_input(
                        "Chunk size (tokens)", min_value=50, max_value=2000, value=st.session_state[file_chunk_key]['chunk_size'], step=50, key=f"chunk_size_{idx}"
                    )
                    st.caption(f"""
                    **Chunk size:**
                    - *Smaller values* (e.g., 100-200): More, shorter chunks. Increases recall (more context per query), but may increase processing time and storage. May improve answer accuracy for short, focused questions.
                    - *Larger values* (e.g., 500-1000): Fewer, longer chunks. Faster to process and store, but may reduce retrieval precision and increase LLM context window usage. May be better for broad or summary questions.
                    - *Default (300)*: Good balance for most scientific papers and OpenAI models.
                    """)
                    overlap = st.number_input(
                        "Chunk overlap (tokens)", min_value=0, max_value=chunk_size-1, value=st.session_state[file_chunk_key]['overlap'], step=10, key=f"overlap_{idx}"
                    )
                    st.caption(f"""
                    **Chunk overlap:**
                    - *Higher overlap* (e.g., 50-100): Chunks share more content. Reduces risk of splitting important context, but increases processing time and storage.
                    - *Lower overlap* (e.g., 0-20): Chunks are more distinct. Faster and smaller, but may miss context at chunk boundaries.
                    - *Default (50)*: Recommended for most use cases.
                    """)
                    # Save per-file settings if changed
                    if (chunk_method != st.session_state[file_chunk_key]['chunk_method'] or
                        chunk_size != st.session_state[file_chunk_key]['chunk_size'] or
                        overlap != st.session_state[file_chunk_key]['overlap']):
                        st.session_state[file_chunk_key] = {
                            'chunk_method': chunk_method,
                            'chunk_size': chunk_size,
                            'overlap': overlap
                        }
                    if st.button("Chunk & Preview", key=f"chunk_btn_{idx}"):
                        elements = [json.loads(line) for line in st.session_state[f"jsonl_{session_key}"].splitlines()]
                        chunks = []
                        enc = tiktoken.get_encoding("cl100k_base")
                        chunk_id = 0
                        for el in elements:
                            text = el["text"]
                            section = el.get("section", "Unknown")
                            tokens = enc.encode(text)
                            if chunk_method == "By section":
                                chunks.append({
                                    "chunk_id": f"{base_name}-{chunk_id}",
                                    "text": text,
                                    "section": section,
                                    "page_number": el.get("page_number"),
                                    "metadata": el.get("metadata", {})
                                })
                                chunk_id += 1
                            else:
                                # By tokens (with overlap)
                                for start in range(0, len(tokens), chunk_size - overlap):
                                    end = min(start + chunk_size, len(tokens))
                                    chunk_tokens = tokens[start:end]
                                    chunk_text = enc.decode(chunk_tokens)
                                    chunks.append({
                                        "chunk_id": f"{base_name}-{chunk_id}",
                                        "text": chunk_text,
                                        "section": section,
                                        "page_number": el.get("page_number"),
                                        "metadata": el.get("metadata", {})
                                    })
                                    chunk_id += 1
                        st.session_state[f"chunks_{session_key}"] = chunks
                    if st.session_state.get(f"chunks_{session_key}"):
                        chunks = st.session_state[f"chunks_{session_key}"]
                        chunked_jsonl = "\n".join(json.dumps(c, ensure_ascii=False) for c in chunks)
                        # Download button with memory cleanup after download
                        if st.download_button(
                            label="⬇️ Download Chunked JSONL",
                            data=chunked_jsonl,
                            file_name=f"{base_name}_chunked.jsonl",
                            mime="application/json",
                            key=f"download_chunked_{idx}",
                            type="secondary"
                        ):
                            # Clear all session state for this file after download
                            for k in [
                                f"session_{uploaded_file.name}_{idx}",
                                f"jsonl_{uploaded_file.name}_{idx}",
                                f"count_{uploaded_file.name}_{idx}",
                                f"error_{uploaded_file.name}_{idx}",
                                f"chunks_{uploaded_file.name}_{idx}",
                                f"file_chunk_settings_{uploaded_file.name}_{idx}"
                            ]:
                                if k in st.session_state:
                                    del st.session_state[k]
                            st.session_state['last_downloaded_file'] = uploaded_file.name
                            st.rerun()
                        st.markdown("**Preview of first 3 chunks:**")
                        for c in chunks[:3]:
                            st.code(json.dumps(c, ensure_ascii=False, indent=2), language="json")
            elif st.session_state[session_key] == "error":
                st.error(f"❌ Extraction failed. This is likely a scanned PDF (image-only) or a corrupted file.\n\n**How to fix:**\n- Use an OCR tool (e.g., Adobe Acrobat OCR, [onlineocr.net](https://www.onlineocr.net/), or Tesseract) to convert the scanned PDF to a text-based PDF.\n- Then re-upload the converted file.\n\n**Error details:** {st.session_state[f'error_{session_key}']}", icon="🚫")

st.markdown("""---
<small>Developed for the sci-paper-rag pipeline. Powered by [unstructured](https://github.com/Unstructured-IO/unstructured) and Streamlit.</small>""", unsafe_allow_html=True) 