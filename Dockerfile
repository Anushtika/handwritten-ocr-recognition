# Use python:3.11-slim as the base image
FROM python:3.11-slim

# Set the working directory to /app
WORKDIR /app

# Copy pyproject.toml and poetry.lock to the working directory
COPY pyproject.toml poetry.lock /app/

# Install Poetry and project dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    tesseract-ocr && \
    pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi && \
    apt-get remove -y build-essential && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code to the working directory
COPY . /app

# Expose port 5000
EXPOSE 5000

# Set the entry point to gunicorn --bind 0.0.0.0:5000 main:app
ENTRYPOINT ["gunicorn", "--bind", "0.0.0.0:5000", "main:app"]
