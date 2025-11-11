# Use full Python 3.11 image (more reliable for Railway)
FROM python:3.11

# Set working directory
WORKDIR /app

# Copy backend requirements first (for better caching)
COPY backend/requirements.txt .

# Upgrade pip and install dependencies
RUN python -m pip install --upgrade pip && \
    python -m pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY backend/ .

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Railway will set PORT env variable)
EXPOSE 8000

# Start command using python -m for reliability
CMD python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

