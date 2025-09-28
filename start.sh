#!/usr/bin/env bash
set -euo pipefail


# Kill any process using port 8000
if lsof -i :8000 -t >/dev/null; then
  kill $(lsof -i :8000 -t)
fi

# Start backend on 0.0.0.0:8000
cd backend
export NODE_ENV="production"
# Set Puppeteer environment variables
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
export PUPPETEER_SKIP_DOWNLOAD=true

if command -v gunicorn >/dev/null 2>&1; then
  gunicorn app:app -b 0.0.0.0:8000 &
else
  python app.py &
fi

# Start frontend on $PORT (Render provides PORT)
cd ..
export PORT="${PORT:-3000}"
export NODE_ENV="production"
exec npm run start -- -p "$PORT"
