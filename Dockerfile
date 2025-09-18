# Multi-process container: Flask backend + Next.js frontend (Node also available if needed)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PUPPETEER_SKIP_DOWNLOAD=false \
    PUPPETEER_CACHE_DIR=/root/.cache/puppeteer

# Install system deps for Puppeteer + Node.js
RUN apt-get update && apt-get install -y \
    ca-certificates curl gnupg \
    fonts-liberation \
    libasound2 libatk1.0-0 libatk-bridge2.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 \
    libfontconfig1 libglib2.0-0 libgtk-3-0 \
    libnspr4 libnss3 libpango-1.0-0 libx11-6 libx11-xcb1 \
    libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
    libxrandr2 libxrender1 libxshmfence1 lsb-release \
    xdg-utils wget \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend Python deps
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt \
    && pip install --no-cache-dir gunicorn

# Copy full app code
COPY . .

# Install frontend deps and build Next.js
RUN npm config set legacy-peer-deps true \
    && npm install --no-audit --no-fund \
    && npm run build

ENV PORT=3000
EXPOSE 3000

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]

