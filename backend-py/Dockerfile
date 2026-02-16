# Base stage
FROM python:3.11-slim as python-base

ENV PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1 \
  # pip
  PIP_NO_CACHE_DIR=off \
  PIP_DISABLE_PIP_VERSION_CHECK=on \
  PIP_DEFAULT_TIMEOUT=100

WORKDIR /app

# Builder stage
FROM python-base as builder-base
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Development stage
FROM python-base as development
COPY --from=builder-base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder-base /usr/local/bin /usr/local/bin
COPY . .
# Keep the seed command, enabling reload for dev
CMD ["sh", "-c", "python seed.py && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]

# Production stage
FROM python-base as production
COPY --from=builder-base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder-base /usr/local/bin /usr/local/bin
COPY . .

# Create non-root user for security
RUN addgroup --system --gid 1001 python && adduser --system --uid 1001 python --ingroup python
USER python

CMD ["sh", "-c", "python seed.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
