#!/bin/bash
# LittySplitty server management
# Usage: ./server.sh [start|stop|restart|status]

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$APP_DIR/.pids"
SERVER_PID="$PID_DIR/server.pid"
CLIENT_PID="$PID_DIR/client.pid"
SERVER_LOG="$APP_DIR/logs/server.log"
CLIENT_LOG="$APP_DIR/logs/client.log"

mkdir -p "$PID_DIR" "$APP_DIR/logs"

start_server() {
  if [ -f "$SERVER_PID" ] && kill -0 "$(cat "$SERVER_PID")" 2>/dev/null; then
    echo "  Backend  already running (PID $(cat "$SERVER_PID"))"
  else
    npm run dev:server --prefix "$APP_DIR" >> "$SERVER_LOG" 2>&1 &
    echo $! > "$SERVER_PID"
    echo "  Backend  started (PID $!) — logs: logs/server.log"
  fi
}

start_client() {
  if [ -f "$CLIENT_PID" ] && kill -0 "$(cat "$CLIENT_PID")" 2>/dev/null; then
    echo "  Frontend already running (PID $(cat "$CLIENT_PID"))"
  else
    npm run dev:client --prefix "$APP_DIR" >> "$CLIENT_LOG" 2>&1 &
    echo $! > "$CLIENT_PID"
    echo "  Frontend started (PID $!) — logs: logs/client.log"
  fi
}

stop_server() {
  if [ -f "$SERVER_PID" ]; then
    PID=$(cat "$SERVER_PID")
    if kill -0 "$PID" 2>/dev/null; then
      # Kill process group to catch tsx child processes
      pkill -P "$PID" 2>/dev/null
      kill "$PID" 2>/dev/null
      echo "  Backend  stopped (PID $PID)"
    else
      echo "  Backend  was not running"
    fi
    rm -f "$SERVER_PID"
  else
    # Fallback: find by port
    lsof -ti:3001 | xargs kill 2>/dev/null && echo "  Backend  stopped (port 3001)" || echo "  Backend  was not running"
  fi
}

stop_client() {
  if [ -f "$CLIENT_PID" ]; then
    PID=$(cat "$CLIENT_PID")
    if kill -0 "$PID" 2>/dev/null; then
      pkill -P "$PID" 2>/dev/null
      kill "$PID" 2>/dev/null
      echo "  Frontend stopped (PID $PID)"
    else
      echo "  Frontend was not running"
    fi
    rm -f "$CLIENT_PID"
  else
    lsof -ti:5173 | xargs kill 2>/dev/null && echo "  Frontend stopped (port 5173)" || echo "  Frontend was not running"
  fi
}

status() {
  if [ -f "$SERVER_PID" ] && kill -0 "$(cat "$SERVER_PID")" 2>/dev/null; then
    echo "  Backend  ✓ running  — http://localhost:3001  (PID $(cat "$SERVER_PID"))"
  else
    echo "  Backend  ✗ stopped"
  fi
  if [ -f "$CLIENT_PID" ] && kill -0 "$(cat "$CLIENT_PID")" 2>/dev/null; then
    echo "  Frontend ✓ running  — http://localhost:5173  (PID $(cat "$CLIENT_PID"))"
  else
    echo "  Frontend ✗ stopped"
  fi
}

case "$1" in
  start)
    echo "Starting LittySplitty..."
    start_server
    start_client
    echo "Done. Open http://localhost:5173"
    ;;
  stop)
    echo "Stopping LittySplitty..."
    stop_server
    stop_client
    echo "Done."
    ;;
  restart)
    echo "Restarting LittySplitty..."
    stop_server
    stop_client
    sleep 1
    start_server
    start_client
    echo "Done. Open http://localhost:5173"
    ;;
  status)
    status
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
