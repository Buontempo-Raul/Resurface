#!/bin/bash
# Start Resurface — backend (FastAPI) + frontend (Vite) + public tunnel (localtunnel)

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}' || hostname -I 2>/dev/null | awk '{print $1}')
BACKEND="$ROOT/deepfake-detector-backend"
FRONTEND="$ROOT/deepfake-detector-frontend"
LOG_DIR="$ROOT/.logs"

mkdir -p "$LOG_DIR"

# ── Kill anything already on the ports ───────────────────────────────────────
for PORT in 8000 3000; do
  PID=$(lsof -ti :"$PORT" 2>/dev/null)
  if [ -n "$PID" ]; then
    echo "Stopping process on port $PORT (PID $PID)..."
    kill "$PID" 2>/dev/null
    sleep 1
  fi
done

# ── Backend ──────────────────────────────────────────────────────────────────
echo "Starting backend..."
cd "$BACKEND"
nohup uvicorn main:app --host 0.0.0.0 --port 8000 \
  > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait until the backend responds (up to 60 s — models take a moment to load)
echo -n "Waiting for backend to load models"
for i in $(seq 1 60); do
  if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
    echo " ready."
    break
  fi
  echo -n "."
  sleep 1
done

# ── Frontend ─────────────────────────────────────────────────────────────────
echo "Starting frontend..."
cd "$FRONTEND"
nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait until Vite is up
echo -n "Waiting for frontend"
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo " ready."
    break
  fi
  echo -n "."
  sleep 1
done

# ── Public tunnel (Cloudflare TryCloudflare) ─────────────────────────────────
echo "Starting public tunnel..."
cloudflared tunnel --url http://localhost:3000 > "$LOG_DIR/tunnel.log" 2>&1 &
TUNNEL_PID=$!

# Wait for cloudflared to print its URL (up to 20 s)
PUBLIC_URL=""
for i in $(seq 1 20); do
  PUBLIC_URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' "$LOG_DIR/tunnel.log" 2>/dev/null | head -1)
  if [ -n "$PUBLIC_URL" ]; then
    break
  fi
  sleep 1
done

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "✅ Resurface is running!"
echo ""
echo "   Local"
echo "     Frontend : http://localhost:3000"
echo "     Backend  : http://localhost:8000"
echo "     API docs : http://localhost:8000/docs"
if [ -n "$LOCAL_IP" ]; then
  echo ""
  echo "   Network (same Wi-Fi)"
  echo "     Frontend : http://$LOCAL_IP:3000"
fi
if [ -n "$PUBLIC_URL" ]; then
  echo ""
  echo "   Public (anyone on the internet)"
  echo "     $PUBLIC_URL"
else
  echo ""
  echo "   Public tunnel: could not get URL — check $LOG_DIR/tunnel.log"
fi
echo ""
echo "   Logs → $LOG_DIR/"
echo "   PIDs  backend=$BACKEND_PID  frontend=$FRONTEND_PID  tunnel=$TUNNEL_PID"
echo ""
echo "To stop:  kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID"
echo "          or run: pkill -f 'uvicorn main:app' && pkill -f 'vite' && pkill -f 'cloudflared'"
