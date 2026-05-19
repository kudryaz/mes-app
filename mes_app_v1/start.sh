#!/bin/bash
echo "=== Запуск MES Application (тест с телефона) ==="

cd "$(dirname "$0")"

# Stop existing
pkill -f "uvicorn app.main" 2>/dev/null
pkill -f "python3 -m http.server" 2>/dev/null
sleep 1

# Build frontend
echo "Сборка фронтенда..."
cd frontend && npm run build 2>&1 | tail -2
cd ..

# Backend
echo "Запуск бэкенда..."
cd backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level warning &>/tmp/mes_backend.log &
echo "Бэкенд запущен (порт 8000)"
cd ..

# Frontend (served with Python)
echo "Запуск фронтенда..."
cd frontend/dist
nohup python3 -m http.server 5173 --bind 0.0.0.0 &>/tmp/mes_frontend.log &
echo "Фронтенд запущен (порт 5173)"
cd ../..

sleep 2

echo ""
echo "=== Готово ==="
echo "С компьютера: http://localhost:5173"
echo ""
echo "С телефона (в той же Wi-Fi):"
IP=$(ip -4 addr show wlan0 2>/dev/null | grep -oP 'inet \K[\d.]+')
echo "  http://$IP:5173"
echo ""
echo "Для остановки: pkill -f 'uvicorn app.main'; pkill -f 'http.server 5173'"
