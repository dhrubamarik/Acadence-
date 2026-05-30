#!/usr/bin/env bash

echo "============================================"
echo "  ACADENCE - START SERVERS"
echo "============================================"
echo

REPO="Acadence-"

if [ ! -d "$REPO" ]; then
    echo "ERROR: Folder '$REPO' not found."
    echo "Make sure you run this file from the same directory where you ran setup.sh"
    exit 1
fi

# ── Start Backend ────────────────────────────
echo "[1/2] Starting Django backend..."
(
    cd "$REPO/backend"
    source venv/bin/activate
    python manage.py runserver
) &
BACKEND_PID=$!
echo "  Backend starting at: http://127.0.0.1:8000  (PID: $BACKEND_PID)"
echo

# Brief pause so backend gets a head start
sleep 3

# ── Start Frontend ───────────────────────────
echo "[2/2] Starting React frontend..."
(
    cd "$REPO/frontend"
    npm run dev
) &
FRONTEND_PID=$!
echo "  Frontend starting at: http://localhost:5173  (PID: $FRONTEND_PID)"
echo

# Wait then open browser
sleep 4
echo "Opening browser..."
if command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:5173       # Linux
elif command -v open &>/dev/null; then
    open http://localhost:5173           # macOS
fi

echo
echo "============================================"
echo "  Both servers are running!"
echo "============================================"
echo
echo "  Backend  : http://127.0.0.1:8000"
echo "  Frontend : http://localhost:5173"
echo
echo "  Press Ctrl+C to stop both servers."
echo "============================================"

# Keep script alive; kill children on Ctrl+C
trap "echo; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
