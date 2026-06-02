@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   ACADENCE - START SERVERS
echo ============================================
echo.

:: ── Start Backend ────────────────────────────
echo [1/2] Starting Django backend...
start "Acadence - Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && python manage.py runserver"
echo   Backend starting at: http://127.0.0.1:8000
echo.

:: Brief pause so backend gets a head start
timeout /t 3 /nobreak >nul

:: ── Start Frontend ───────────────────────────
echo [2/2] Starting React frontend...
start "Acadence - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo   Frontend starting at: http://localhost:5173
echo.

:: Wait then open browser
echo Waiting for servers to be ready...
timeout /t 5 /nobreak >nul
start "" http://localhost:5173

echo ============================================
echo   Both servers are running!
echo ============================================
echo.
echo   Backend  : http://127.0.0.1:8000
echo   Frontend : http://localhost:5173
echo.
echo   Close the two server windows to stop the app.
echo ============================================
pause
