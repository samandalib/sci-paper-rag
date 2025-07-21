# Use a slim Python image
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy your app code
COPY . /app

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r python/requirements.txt

# Expose the port Streamlit uses
EXPOSE 8080

# Run Streamlit on the correct port for Cloud Run
CMD ["streamlit", "run", "python/pdf_to_jsonl_app.py", "--server.port=8080", "--server.address=0.0.0.0"] 