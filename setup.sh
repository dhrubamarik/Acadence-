#!/usr/bin/env bash
set -e

echo "============================================"
echo "  ACADENCE - SETUP (Run this once)"
echo "============================================"
echo

# ── Step 1: Clone the repo ──────────────────
echo "[1/6] Cloning repository..."
git clone https://github.com/dhrubamarik/Acadence-
cd Acadence-
echo "Done."
echo

# ── Step 2: Backend - virtual env + deps ────
echo "[2/6] Setting up Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate
echo "Installing Python dependencies..."
pip install -r requirements.txt
echo "Done."
echo

# ── Step 3: Create .env file ─────────────────
echo "[3/6] Creating .env file in backend..."
if [ -f .env ]; then
    echo "  .env already exists, skipping."
else
    cat > .env <<EOF
GROQ_API_KEY=your_groq_api_key_here
EMAIL_HOST_USER=your.email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password
PROFESSOR_EMAIL=professor.secondary@gmail.com
DEBUG=True
EOF
    echo "  .env created. IMPORTANT: Edit backend/.env with your real credentials!"
fi
echo

# ── Step 4: Migrations ───────────────────────
echo "[4/6] Running database migrations..."
python manage.py makemigrations
python manage.py migrate
echo "Done."
echo

# ── Step 5: Create demo departments ─────────
echo "[5/6] Creating demo departments..."
python manage.py shell -c "
from api.models import Department
Department.objects.get_or_create(name='Computer Science & Engineering', defaults={'code':'CSSE12','join_key':'csse12key'})
Department.objects.get_or_create(name='Mechanical Engineering', defaults={'code':'MECH08','join_key':'mech08key'})
Department.objects.get_or_create(name='Business Administration', defaults={'code':'BBA15','join_key':'bba15key'})
print('Departments ready.')
"
echo

# ── Step 6: Frontend deps ────────────────────
echo "[6/6] Installing frontend dependencies..."
cd ../frontend
npm install
cd ..
echo "Done."
echo

echo "============================================"
echo "  SETUP COMPLETE!"
echo "============================================"
echo
echo "NEXT STEPS:"
echo "  1. Edit backend/.env with your real API keys"
echo "     - GROQ_API_KEY        : console.groq.com"
echo "     - EMAIL_HOST_PASSWORD : myaccount.google.com (App Password)"
echo
echo "  2. Run  ./run.sh  to start the app"
echo "============================================"
