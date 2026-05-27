# 🎓 Acadence — AI Academic Stress Intelligence Platform

<div align="center">

![Acadence Banner](https://img.shields.io/badge/Acadence-AI%20Academic%20Coach-0d9488?style=for-the-badge)

[![React](https://img.shields.io/badge/React-18.x-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Django](https://img.shields.io/badge/Django-4.x-092e20?style=flat-square&logo=django)](https://djangoproject.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-f55036?style=flat-square)](https://groq.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-black?style=flat-square&logo=jsonwebtokens)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Predict burnout before it happens. Learn · Align · Thrive.**

[Features](#features) • [Tech Stack](#tech-stack) • [Installation](#installation) • [Usage](#usage) • [API Reference](#api-reference) • [Project Structure](#project-structure) • [Deploy](#deployment)

</div>

---

## What is Acadence?

Acadence is a full-stack AI-powered academic stress intelligence platform built for college students managing 5–7 subjects simultaneously.

No more scattered deadlines across PDFs, emails and WhatsApp groups.  
No more discovering crunch weeks at midnight.  
Just upload your syllabus — Acadence handles the rest.

> Upload syllabus PDF → **Groq AI extracts all deadlines in 10 seconds**  
> Complete tasks → **ML engine learns YOUR work patterns**  
> High stress detected → **"Start Math Assignment by May 24 — you take 1.4x longer"**  
> Department stress critical → **Auto-email alert sent to professor**

---

## Features

### 🔐 Authentication
- JWT-based login and signup with email OTP verification
- Protected routes — dashboard only accessible after login
- Token stored in localStorage with 24-hour expiry
- Auto-redirect to login on token expiry
- Complete user session management
- Cinematic intro screen on first visit (session-based)

### 🤖 AI Task Generator
- Paste any syllabus text → Groq Llama 3.3 70B extracts all deadlines
- Returns structured tasks with title, deadline, priority, course
- Duplicate detection — no double entries
- Save as Personal (private) or Group (department-wide)

### 📄 PDF Syllabus Parser
- Upload any PDF syllabus
- PyPDF2 extracts text → Groq AI parses deadlines
- Handles image-based PDF detection gracefully

### 🌡️ Stress Weather Map
- Color-coded stress forecast per date: 🟢 Low → 🟡 Moderate → 🔥 High
- Shows **task names** on each stress date
- Personalized vs generic model indicator
- Stress score: `0–10` scale with visual bar

### 🧠 Personalized ML Stress Engine *(Phase 2)*
- After 3+ task completions → switches from generic to personalized model
- Learns per-subject speed multipliers: `{"Mathematics": 1.4, "Physics": 0.9}`
- Procrastination score adjusts urgency windows
- Accuracy: ~55% generic → ~85% personalized

### 🤖 Aura AI Recommendations *(Phase 3)*
- Dashboard shows smart recommendation cards
- Types: High Stress Warning, Clash Alert, Procrastination Nudge, On-Track Positive
- Personalized start dates: *"Start by May 24 — 2d until recommended start"*
- Dismiss with "Got it ✓" button

### 👥 Department Groups
- Join departments with codes: CSSE12, MECH08, BBA15
- Group tasks visible to entire department
- Personal tasks visible only to you
- Crowd verification: 5 approvals = ✅ Verified badge

### 🏫 Department Intelligence *(Phase 4)*
- Department-wide stress score vs your personal score
- ▲ above avg / ▼ below avg comparison
- Crowd difficulty ratings: ⭐4.2/5 (23 rated)
- Average hours per task from real completion data
- Top 3 stressors ranked by priority + urgency

### 🚨 Professor Alert System *(Phase 5)*
- Students raise stress alerts with optional note
- Auto-attaches: stress score, clash count, affected tasks, AI suggestion
- **Real email sent to professor** with beautiful HTML template
- Professor clicks **"✅ Mark Alert as Resolved"** in email → alert resolves
- Token-based secure resolution — no login required for professor
- Students see "✅ Resolved by Professor" in dashboard

### 📁 Department File Share
- Upload assignments, lab copies, notes (max 20MB)
- All department members can view + download
- Only uploader can delete
- File type categories: Assignment, Lab, Notes, Other

### 📅 LMS Calendar
- Full calendar view with stress color coding
- Click dates to see tasks due
- Course filter support

### 💬 Aura AI Chat
- Chat with Aura for personalized study roadmaps
- Exam-specific plans built from YOUR syllabus topics
- General roadmap from all upcoming tasks

### ✔ Task Completion + Feedback Loop *(Phase 1)*
- Mark tasks done → feedback modal (hours taken + difficulty rating)
- Data trains personalized stress predictor
- After 5 completions → procrastination nudges activate
- Completed tasks persist across refresh (backend-authoritative)

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool |
| React Router DOM | 6.x | Client-side routing |
| Axios | latest | HTTP client |
| Canvas API | native | Cinematic intro + orb animation |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Django | 4.x | Web framework |
| Django REST Framework | 3.x | API layer |
| SimpleJWT | latest | JWT authentication |
| django-cors-headers | latest | CORS handling |
| Groq | latest | LLM API client |
| PyPDF2 | latest | PDF text extraction |
| python-dotenv | latest | Environment variables |

### AI / LLM
| Service | Model | Purpose |
|---|---|---|
| Groq API | Llama 3.3 70B Versatile | Deadline extraction + study roadmaps |

### Database
| Technology | Purpose |
|---|---|
| SQLite | Development database |
| PostgreSQL | Production (recommended) |

---

## Project Structure

```
acadence/
├── backend/
│   ├── api/
│   │   ├── migrations/
│   │   ├── models.py              # Task, User, Dept, TaskCompletion
│   │   │                          # UserProfile, ProfessorAlert, DepartmentFile
│   │   ├── views.py               # All API endpoints + ML logic
│   │   ├── auth_views.py          # Register, Login, OTP verification
│   │   ├── serializers.py         # Data serialization
│   │   ├── utils.py               # Personalized stress calculation (ML)
│   │   ├── ai.py                  # Groq AI integration
│   │   └── urls.py                # URL routing
│   ├── backend/
│   │   ├── settings.py            # Django configuration
│   │   ├── urls.py                # Main URL routing
│   │   └── wsgi.py
│   ├── media/                     # Uploaded files storage
│   ├── .env                       # Environment variables
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.jsx          # Stats + Aura Recommendations
    │   │   ├── TaskList.jsx           # Tasks + Mark Complete modal
    │   │   ├── TaskForm.jsx           # Manual task creation
    │   │   ├── AIGenerator.jsx        # Text → AI task extraction
    │   │   ├── PDFUpload.jsx          # PDF → AI task extraction
    │   │   ├── StressWeather.jsx      # Stress heatmap + task names
    │   │   ├── Clashes.jsx            # Deadline clash cards
    │   │   ├── AuraChat.jsx           # AI study roadmap chat
    │   │   ├── CalendarView.jsx       # LMS calendar
    │   │   ├── DepartmentDashboard.jsx # Crowd intelligence
    │   │   ├── ProfessorAlerts.jsx    # Alert system
    │   │   ├── DepartmentFiles.jsx    # File share
    │   │   └── Introscreen.jsx        # Cinematic canvas intro
    │   ├── pages/
    │   │   ├── LandingPage.jsx        # Marketing landing page
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Verify.jsx             # OTP verification
    │   ├── context/
    │   │   └── AuthContext.jsx        # JWT auth state
    │   ├── App.jsx                    # Sidebar + routing
    │   ├── main.jsx                   # Entry + intro flow
    │   └── api.js                     # Axios instance + interceptors
    └── package.json
```

---

## How It Works — Full Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    ACADENCE FULL FLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. FIRST VISIT                                              │
│     Cinematic Intro (4s) → Landing Page                      │
│     (intro skipped on return visits via sessionStorage)      │
│                                                              │
│  2. AUTHENTICATION                                           │
│     Register → Email OTP → Verify → JWT Token                │
│     Login → JWT → localStorage → Dashboard                   │
│                                                              │
│  3. ADD TASKS                                                │
│     Paste syllabus text OR upload PDF                        │
│     → Groq Llama 3.3 extracts deadlines                      │
│     → Saved as Personal or Group task                        │
│     → Group tasks visible to entire department               │
│                                                              │
│  4. STRESS FORECASTING                                       │
│     Django calculates stress per date                        │
│     < 3 completions → generic formula                        │
│     3+ completions  → personalized ML:                       │
│       stress = base × subject_mult × urgency × difficulty    │
│     → Stress Weather Map shows color-coded forecast          │
│                                                              │
│  5. AI RECOMMENDATIONS                                       │
│     /recommendations/ endpoint checks:                       │
│     → High stress dates this week?                           │
│     → Deadline clashes detected?                             │
│     → Procrastination pattern found?                         │
│     → Dashboard shows actionable cards                       │
│                                                              │
│  6. TASK COMPLETION LOOP                                     │
│     Mark task done → Hours + Difficulty modal                │
│     → TaskCompletion saved                                   │
│     → UserProfile.subject_multipliers updated                │
│     → Next stress calculation more accurate                  │
│                                                              │
│  7. DEPARTMENT INTELLIGENCE                                  │
│     Crowd rates tasks 1–5 ⭐ after completion                │
│     → Department tab shows avg difficulty per task           │
│     → Your stress vs department average                      │
│                                                              │
│  8. PROFESSOR ALERT                                          │
│     Student raises alert                                     │
│     → Secure token generated                                 │
│     → HTML email → professor's inbox                         │
│     → Professor clicks "Resolve" button in email             │
│     → Alert resolved in dashboard ✅                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Installation

### Prerequisites
```
Node.js >= 18.x
Python >= 3.10
pip
Git
Groq API Key    → free at console.groq.com
Gmail App Password → myaccount.google.com/apppasswords
```

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/acadence.git
cd acadence
```

---

### Step 2 — Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### Step 3 — Create Environment File

Create `.env` inside `/backend`:

```env
GROQ_API_KEY=your_groq_api_key_here
EMAIL_HOST_USER=your.email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password
PROFESSOR_EMAIL=professor.secondary@gmail.com
DEBUG=True
```

**Get Groq API key:**
```
1. Go to console.groq.com
2. Sign up free
3. API Keys → Create new key
4. Paste into .env
```

**Get Gmail App Password:**
```
1. Go to myaccount.google.com
2. Security → 2-Step Verification → App Passwords
3. Create → Copy 16-digit password
4. Paste into EMAIL_HOST_PASSWORD
```

---

### Step 4 — Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

---

### Step 5 — Create Demo Departments

```bash
python manage.py shell
```

```python
from api.models import Department

Department.objects.create(
    name="Computer Science & Engineering",
    code="CSSE12",
    join_key="csse12key"
)
Department.objects.create(
    name="Mechanical Engineering",
    code="MECH08",
    join_key="mech08key"
)
Department.objects.create(
    name="Business Administration",
    code="BBA15",
    join_key="bba15key"
)
exit()
```

---

### Step 6 — Start Backend

```bash
python manage.py runserver
```

```
✅ Django running at: http://127.0.0.1:8000
```

---

### Step 7 — Frontend Setup

```bash
# Open new terminal
cd frontend

npm install
npm run dev
```

```
✅ React running at: http://localhost:5173
```

---

### Step 8 — Open the App

```
1. Go to http://localhost:5173
2. Watch cinematic intro (4 seconds)
3. Click "Get Started Free" on landing page
4. Register with department code: CSSE12
5. Verify email OTP
6. Start adding tasks!
```

---

## Sample Tasks to Test

### Paste in AI Generator:
```
Data Structures Assignment on Graph Algorithms due in 3 days, high priority
Mathematics Calculus Exam due in 5 days, high priority
Physics Lab Report on Waves due in 3 days, high priority
Database Management Project due in 6 days, medium priority
English Essay on Literature due in 8 days, medium priority
Operating Systems Quiz due in 4 days, high priority
Chemistry Lab Report due in 3 days, medium priority
Software Engineering Assignment due in 7 days, low priority
```

### Full System Test Checklist:
```
✅ Register → CSSE12 → Verify OTP
✅ Add all 8 tasks via AI Generator
✅ Dashboard → Aura Recommendations appear
✅ Stress Map → Task names visible on dates
✅ Mark 3 tasks done → rate Math tasks ⭐⭐⭐⭐⭐
✅ Stress Map → 🧠 Personalized banner appears
✅ Department tab → Crowd ratings update
✅ Prof Alerts → Raise alert → Check professor email
✅ Click "Resolve" in email → Dashboard updates
✅ Dept Files → Upload a PDF → Download it
```

---

## API Reference

### Authentication

#### Register
```
POST /api/auth/register/

Body:
{
  "email": "student@college.edu",
  "full_name": "John Doe",
  "password": "secure123",
  "department_code": "CSSE12"
}

Response:
{
  "message": "Registration successful! Check your email for OTP.",
  "email": "student@college.edu"
}
```

#### Verify OTP
```
POST /api/auth/verify-email/

Body:
{
  "email": "student@college.edu",
  "otp": "482910"
}

Response:
{
  "tokens": { "access": "...", "refresh": "..." },
  "user": { "id": 1, "email": "...", "full_name": "..." }
}
```

#### Login
```
POST /api/auth/login/

Body:
{
  "email": "student@college.edu",
  "password": "secure123"
}
```

---

### Tasks

#### List / Create Tasks
```
GET  /api/tasks/
POST /api/tasks/

POST Body:
{
  "title": "Math Assignment",
  "deadline": "2025-05-20",
  "priority": "high",
  "course": "Mathematics",
  "task_type": "group"
}
```

#### Mark Complete
```
POST /api/tasks/:id/complete/

Body:
{
  "actual_hours": 3.5,
  "difficulty_rating": 4,
  "notes": "Graph traversal was hardest"
}
```

#### Approve Group Task
```
POST /api/tasks/:id/approve/
```

---

### Analytics & AI

#### Get Stress + Clashes
```
GET /api/analytics/

Response:
{
  "stress": { "2025-05-15": 7.2, "2025-05-16": 4.8 },
  "clashes": [{ "task1": "...", "task2": "...", "days_apart": 1 }]
}
```

#### Get AI Recommendations
```
GET /api/recommendations/

Response:
{
  "recommendations": [
    {
      "type": "stress",
      "title": "High stress detected — 2025-05-15",
      "task": "Math Assignment",
      "tip": "You take 1.4x longer on Mathematics tasks",
      "recommended_start": "May 12",
      "days_until": 2,
      "personalized": true
    }
  ]
}
```

#### Parse Text with AI
```
POST /api/ai-parse/

Body:
{
  "text": "Math exam on May 15, Physics lab due May 17..."
}
```

#### Parse PDF
```
POST /api/pdf-parse/
Content-Type: multipart/form-data

Body:
file: <pdf file>
```

---

### Department

#### Department Analytics
```
GET /api/department/analytics/

Response:
{
  "this_week": {
    "dept_stress": 7.2,
    "user_stress": 6.8,
    "stress_level": "high"
  },
  "task_intelligence": [
    {
      "title": "Algo Assignment",
      "avg_difficulty": 4.2,
      "avg_hours": 6.5,
      "rating_count": 23
    }
  ]
}
```

#### Upload Department File
```
POST /api/department/files/
Content-Type: multipart/form-data

Body:
title: "Lab Copy Week 5"
file_type: "lab"
file: <file>
```

---

### Professor Alerts

#### Raise Alert
```
POST /api/alerts/raise/

Body:
{
  "message": "Too many deadlines this week"
}

Response:
{
  "message": "Alert raised! Professor notified via email.",
  "stress_score": 8.4,
  "suggestion": "Consider extending deadlines by 3 days",
  "email_sent": true
}
```

#### Resolve via Email Token (Professor)
```
GET /api/alerts/resolve-by-professor/?token=abc123

Response: HTML page — "Alert Resolved!"
```

---

## Environment Variables

### Backend (.env)
```env
GROQ_API_KEY=your_groq_api_key
EMAIL_HOST_USER=your.email@gmail.com
EMAIL_HOST_PASSWORD=your_16_digit_app_password
PROFESSOR_EMAIL=professor@college.edu
DEBUG=True
SECRET_KEY=django-insecure-change-this-in-production
```

### Frontend (.env) — optional
```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## Requirements

### Backend (requirements.txt)
```
django
djangorestframework
djangorestframework-simplejwt
django-cors-headers
groq
PyPDF2
python-dotenv
gunicorn
whitenoise
dj-database-url
psycopg2-binary
pillow
```

### Frontend (package.json dependencies)
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x"
}
```

---

## ML Innovation — How It Works

### Phase 1 — Data Collection
```python
# After each task completion:
TaskCompletion.save()  # actual_hours, difficulty, on_time
UserProfile.update()   # running averages per subject
```

### Phase 2 — Personalized Stress Formula
```python
# Generic (< 3 completions):
stress = task_priority_points

# Personalized (3+ completions):
stress = (
    base_score
    × subject_multiplier    # "Math: 1.4x for you"
    × urgency_factor        # closer deadline = higher
    × difficulty_modifier   # your avg rating calibrates
)
```

### Phase 3 — AI Recommendations
```
High stress date detected
→ Find highest priority task nearby
→ Calculate recommended start date
→ Apply procrastination penalty if score > 0.6
→ Show: "Start by May 24 — you take 1.4x longer on Math"
```

### Phase 4 — Crowd Intelligence
```
47 students complete "Algo Assignment 3"
→ avg difficulty: 4.2/5
→ avg time: 6.5 hours
→ New student joins → gets accurate forecast from day 1
```

### Phase 5 — Professor Alerts
```
Dept stress > 7.5/10 OR student manually raises
→ Secure token generated
→ HTML email → professor inbox
→ Professor clicks resolve link
→ Dashboard updates for all students
```

---

## Key Design Decisions

### Why JWT over Session Auth?
```
Stateless — no server session storage needed
Works with React SPA + Django API separation
Scalable for multiple concurrent users
24-hour token + 7-day refresh cycle
```

### Why Personalized ML over Static Formulas?
```
Every student works at different speeds
"5 days left" means different stress for different people
Subject-specific multipliers learn from your history
After 10 completions — 85% accurate vs 55% generic
```

### Why Token-Based Professor Resolution?
```
Professors don't have Acadence accounts
Email link = zero friction for professor
Secure unique token prevents unauthorized resolution
Beautiful browser page confirms resolution
```

### Why Department Groups + Verification?
```
One upload helps 100 classmates (network effect)
5 peer verifications = trusted deadline
Prevents wrong deadlines spreading in WhatsApp groups
Crowd difficulty ratings benefit new students
```

---

## Deployment

### Deploy Backend on Render

**Step 1 — Prepare `requirements.txt`**
```
# Make sure these are included:
gunicorn
whitenoise
dj-database-url
psycopg2-binary
```

**Step 2 — Update `settings.py` for production**
```python
import dj_database_url
import os

# Add to settings.py
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ['*']

# Database — auto switches to PostgreSQL on Render
DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600
    )
}

# Static files
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Add whitenoise to middleware (after SecurityMiddleware)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # ← ADD
    ...
]
```

**Step 3 — Create `build.sh` in backend root**
```bash
#!/usr/bin/env bash
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
```

**Step 4 — Deploy on Render**
```
1. Go to render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   Root Directory: backend
   Build Command:  ./build.sh
   Start Command:  gunicorn backend.wsgi:application
4. Environment Variables → Add:
   GROQ_API_KEY=...
   EMAIL_HOST_USER=...
   EMAIL_HOST_PASSWORD=...
   PROFESSOR_EMAIL=...
   DEBUG=False
   SECRET_KEY=your-production-secret-key
5. Click Deploy
```

---

### Deploy Frontend on Vercel

**Step 1 — Create `.env.production` in frontend**
```env
VITE_API_URL=https://your-render-app.onrender.com
```

**Step 2 — Update `api.js`**
```js
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/`
    : 'http://localhost:8000/api/',
})
```

**Step 3 — Deploy on Vercel**
```
1. Go to vercel.com → New Project
2. Import your GitHub repo
3. Settings:
   Root Directory: frontend
   Build Command:  npm run build
   Output Dir:     dist
4. Environment Variables → Add:
   VITE_API_URL=https://your-render-app.onrender.com
5. Click Deploy
```

**Step 4 — Update Django CORS**
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://your-vercel-app.vercel.app",  # ← ADD
]
```

---

### Deploy Database on Render (PostgreSQL)

```
1. Render Dashboard → New → PostgreSQL
2. Free tier is fine for demo
3. Copy Internal Database URL
4. Add to Render backend environment:
   DATABASE_URL=postgresql://...
5. settings.py already handles it via dj_database_url
```

---

### Full Deployment Checklist
```
Backend (Render):
✅ requirements.txt includes gunicorn, whitenoise, dj-database-url
✅ settings.py updated for production
✅ build.sh created
✅ All env variables added in Render dashboard
✅ PostgreSQL database linked
✅ Departments created via manage.py shell on Render console

Frontend (Vercel):
✅ VITE_API_URL points to Render backend URL
✅ api.js uses environment variable
✅ CORS updated in Django settings
✅ Deployed and accessible

Final Check:
✅ Register → OTP email received
✅ AI Generator works
✅ Professor alert email works
✅ File upload/download works
```

---

## Demo Departments

| Department | Code | Use For |
|---|---|---|
| Computer Science & Engineering | `CSSE12` | Demo/Testing |
| Mechanical Engineering | `MECH08` | Demo/Testing |
| Business Administration | `BBA15` | Demo/Testing |

---

## Contributing

```bash
# Fork the repository
# Create feature branch
git checkout -b feature/AmazingFeature

# Commit changes
git commit -m '✨ Add: AmazingFeature'

# Push branch
git push origin feature/AmazingFeature

# Open Pull Request
```

---

## Built With ❤️ For

<div align="center">

**Academic Stress is a solved problem.**

*Built to help students study smarter, not harder.*

</div>

---

<div align="center">

⭐ **Star this repo if Acadence helped you!** ⭐

*Built with React · Django · Groq AI · Canvas API*

**Learn · Align · Thrive**

</div>
