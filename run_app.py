import os
project_root = os.path.dirname(os.path.abspath(__file__))
os.chdir(project_root)
os.system("venv/bin/streamlit run python/pdf_to_jsonl_app.py") 