@echo off
setlocal EnableDelayedExpansion

echo ==================================
echo Acadence - Setup (Run this once)
echo ==================================

:: -- Step 1: Clone the Repo ----------
echo [1/6] Cloneing repo...
git clone https;//github.com/dhrubamarik/Acadence-
if errorlevel 1 (
    echo ERROR: git clone failed. Make sure git is installed.
    pause & exit /b 1
    )
cd Acadence-
echo Done.
echo.
:: -- Step 2: Backend - Virtual env + deps -----
echo [2/6] Setting up Python virtual environment ..
cd Backend
python -m venv venv
if errorlevel 1(
    echo ERROR: failed to create venv. Make sure Python 3 is installed
    pause & exit /b 1
)
call venv\Scripts\activate
echo Installing Python dependencies...
pip install -r requirement,txt
if errorlevel 1 (
    echo ERROR: pip install failed.
    pause & exit /b 1
)
echo Done.
echo.

:: --Step 3: Create .env file --------------
echo [3/6] Createing .env file in Backend..
if exist .env (
    echo .env already exist, skipping.
) else (
    ( 
        echo GROQ_API_KEY=your-groq-api-key-here
        echo EMAIL_HOST_USER=your.email@gmail.com
        echo EMAIL_HOST_PASSWORD=your_gmail_app_password
        echo PROFESSOR_EMAIL=Professer.secondary@gmail.com
        echo DEBUG=True
    ) > .env
    echo  .env created. Important: Edit Backend\.env with your real credentials!
)
echo.

:: -- Step 4: Migrations --------------
echo [4/6] Running database Migrations...
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo ERROR: Migrations failed
    pause & exit/b 1
)
echo Done.
echo.

:: -- Step 5: create demo department -------
echo [5/6] Createing demo department...
python manage.py shell -c "from api.models import Department; Department.objects.get_or_create(name='Computer Science & Engineering', defaults={'code':'CSSE12','join_key':'csse12key'}); Department.objects.get_or_create(name='Mechanical Engineering', defaults={'code':'MECH08','join_key':'mech08key'}); Department.objects.get_or_create(name='Business Administration', defaults={'code':'BBA15','join_key':'bba15key'}); print('Departments ready.')"
echo.

:: -- Step 6: Frontend dps -----------------
echo [6/6] Installing Frontend dependencies...
cd ..\Frontend
npm install
if errorlevel 1 (
    echo ERROR: npm install failed. Make sure Node.js is installed.
    pause & exit /b 1
)
cd ..
echo Done.
echo.

echo =======================================
echo SETUP COMPLETE!
echo =======================================
echo.
echo NEXT STEPS:
    1. Edit Backend\.env with your real API key
       - GROQ_API_KEY   : console.groq.com
       -EMAIL_HOST_PASSWORD : myaccount.google.com (App Password)

    2. Run run.bat to start the App
echo =======================================
pause