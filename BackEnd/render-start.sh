#!/usr/bin/env bash
set -euo pipefail

echo "[render] Running database migrations..."
alembic upgrade head

echo "[render] Starting FastAPI..."
uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
