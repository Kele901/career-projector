#!/usr/bin/env bash
set -euo pipefail

# Cloud Agent bootstrap for the CV Career Recommender (FastAPI backend + Vite/React frontend).
# Idempotent: safe to run repeatedly against cached state.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ensurepip is required to create Python virtual environments; the slim base image omits it.
if ! python3 -c "import ensurepip" >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq python3-venv
fi

# Backend: virtual environment + dependencies + local env file.
cd "$repo_root/backend"
python3 -m venv venv
./venv/bin/python -m pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

if [ ! -f .env ]; then
  cp env.example .env
  ./venv/bin/python - <<'PY'
import re, secrets, pathlib
env = pathlib.Path(".env")
text = env.read_text()
text = re.sub(r"SECRET_KEY=.*", "SECRET_KEY=" + secrets.token_hex(32), text)
env.write_text(text)
PY
fi

# Frontend: install node dependencies.
cd "$repo_root/frontend"
npm install
