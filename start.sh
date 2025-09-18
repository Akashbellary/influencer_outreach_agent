#!/usr/bin/env bash
set -euo pipefail

# Start backend on 0.0.0.0:8000
cd /app/backend
export NODE_ENV="production"
if command -v gunicorn >/dev/null 2>&1; then
  gunicorn app:app -b 0.0.0.0:8000 &
else
  python app.py &
fi

# Start frontend on $PORT (Render provides PORT)
cd /app
export PORT="${PORT:-3000}"
export NODE_ENV="production"
exec npm run start -- -p "$PORT"
