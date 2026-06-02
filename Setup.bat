@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   ACADENCE - SETUP (Run this once)
echo ============================================
echo.

:: ── Step 1: Backend - virtual env + deps ────
echo [1/5] Setting up Python virtual environment...
cd /d %~dp0backend
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create venv. Make sure Python 3 is installed.
    pause & exit /b 1
)
call venv\Scripts\activate
echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: pip install failed.
    pause & exit /b 1
)
echo Done.
echo.

:: ── Step 2: Create .env file ─────────────────
echo [2/5] Creating .env file...
if exist .env (
    echo   .env already exists, skipping.
) else (
    (
        echo GROQ_API_KEY=your_groq_api_key_here
        echo EMAIL_HOST_USER=your.email@gmail.com
        echo EMAIL_HOST_PASSWORD=your_gmail_app_password
        echo PROFESSOR_EMAIL=professor.secondary@gmail.com
        echo DEBUG=True
    ) > .env
    echo   .env created. IMPORTANT: Edit backend\.env with your real credentials!
)
echo.

:: ── Step 3: Migrations ───────────────────────
echo [3/5] Running database migrations...
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo ERROR: Migrations failed.
    pause & exit /b 1
)
echo Done.
echo.

:: ── Step 4: Create demo departments ─────────
echo [4/5] Creating demo departments...
python manage.py shell -c "from api.models import Department; Department.objects.get_or_create(name='Computer Science & Engineering', defaults={'code':'CSSE12','join_key':'csse12key'}); Department.objects.get_or_create(name='Mechanical Engineering', defaults={'code':'MECH08','join_key':'mech08key'}); Department.objects.get_or_create(name='Business Administration', defaults={'code':'BBA15','join_key':'bba15key'}); print('Departments ready.')"
echo.

:: ── Step 5: Frontend deps ────────────────────
echo [5/5] Installing frontend dependencies...
cd /d %~dp0frontend
npm install
if errorlevel 1 (
    echo ERROR: npm install failed. Make sure Node.js is installed.
    pause & exit /b 1
)
echo Done.
echo.

echo ============================================
echo   SETUP COMPLETE!
echo ============================================
echo.
echo NEXT STEPS:
echo   1. Edit backend\.env with your real API keys
echo      - GROQ_API_KEY        : console.groq.com
echo      - EMAIL_HOST_PASSWORD : myaccount.google.com (App Passwords)
echo.
echo   2. Run  run.bat  to start the app
echo ============================================
pause
