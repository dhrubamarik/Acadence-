# 🎓 Acadence — AI Academic Stress Intelligence Platform

> Predict burnout before it happens. Learn · Align · Thrive.

---

## 🚀 What is Acadence?

Acadence is an AI-powered academic planner that:

- **Extracts deadlines** from syllabi PDFs in 10 seconds (Groq AI)
- **Predicts stress** weeks before burnout using personalized ML
- **Detects deadline clashes** automatically
- **Learns YOUR work patterns** after each completed task
- **Crowd-sources difficulty** from department peers
- **Alerts professors** when stress levels are critical

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Task Generator | Paste syllabus → Groq Llama 3.3 extracts all deadlines |
| 📄 PDF Upload | Upload PDF syllabus → AI parses it |
| 🌡️ Stress Weather Map | Color-coded stress forecast per day |
| 🧠 Personalized ML | Learns your speed per subject after 3 completions |
| 🤖 Aura Recommendations | AI suggests when to start each task |
| 📅 LMS Calendar | Visual calendar with stress colors |
| 👥 Department Groups | Share tasks with CSSE12, MECH08, BBA15 |
| ✅ Verification System | 5 peers verify = trusted deadline |
| 🏫 Dept Intelligence | Crowd difficulty ratings + dept stress score |
| 🚨 Professor Alerts | Auto-email when dept stress > 7.5/10 |
| 📁 File Share | Upload/download assignments within department |
| 💬 Aura AI Chat | Personalized study roadmaps from your syllabus |

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- React Router DOM
- Axios
- Canvas API (animated intro + orb)

**Backend**
- Django 4.x + Django REST Framework
- Simple JWT (authentication)
- Groq API — Llama 3.3 70B (AI extraction + chat)
- SQLite (development)
- PyPDF2 (PDF parsing)

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key (free at console.groq.com)
- Gmail account with App Password

---

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/acadence.git
cd acadence
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` file in `/backend`:

```env
GROQ_API_KEY=your_groq_api_key_here
EMAIL_HOST_USER=your.email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password
PROFESSOR_EMAIL=professor.email@gmail.com
```

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Create demo departments:

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

Start backend:

```bash
python manage.py runserver
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open: `http://localhost:5173`

---

## 🧪 Test the System

### Register
1. Go to `/register`
2. Use department code: `CSSE12`
3. Verify email with OTP

### Add Tasks
Paste in AI Generator:
```
Data Structures Assignment due in 3 days, high priority
Mathematics Exam due in 5 days, high priority
Physics Lab Report due in 3 days, medium priority
```

### Check All Features
- ✅ Dashboard → Aura Recommendations appear
- ✅ Stress Map → Shows task names per date
- ✅ Complete 3 tasks → Personalized model activates
- ✅ Department → Crowd difficulty ratings
- ✅ Prof Alerts → Raise alert → Check email
- ✅ Dept Files → Upload PDF → Download

---

## 📁 Project Structure

```
acadence/
├── backend/
│   ├── api/
│   │   ├── models.py          # Task, User, Dept, TaskCompletion, UserProfile, ProfessorAlert, DepartmentFile
│   │   ├── views.py           # All API endpoints
│   │   ├── auth_views.py      # Register, Login, OTP
│   │   ├── serializers.py     # Data serialization
│   │   ├── utils.py           # Stress calculation (personalized ML)
│   │   ├── ai.py              # Groq AI integration
│   │   └── urls.py            # URL routing
│   ├── backend/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── media/                 # Uploaded files
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.jsx
    │   │   ├── TaskList.jsx
    │   │   ├── TaskForm.jsx
    │   │   ├── AIGenerator.jsx
    │   │   ├── PDFUpload.jsx
    │   │   ├── StressWeather.jsx
    │   │   ├── Clashes.jsx
    │   │   ├── AuraChat.jsx
    │   │   ├── CalendarView.jsx
    │   │   ├── DepartmentDashboard.jsx
    │   │   ├── ProfessorAlerts.jsx
    │   │   └── DepartmentFiles.jsx
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Verify.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   └── Introscreen.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── api.js
    └── package.json
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register user |
| POST | `/api/auth/login/` | Login |
| POST | `/api/auth/verify-email/` | OTP verification |
| GET/POST | `/api/tasks/` | List/create tasks |
| POST | `/api/tasks/:id/complete/` | Mark task done + feedback |
| POST | `/api/tasks/:id/approve/` | Approve group task |
| GET | `/api/analytics/` | Stress + clash data |
| GET | `/api/recommendations/` | AI recommendations |
| GET | `/api/user/insights/` | Personal ML profile |
| POST | `/api/ai-parse/` | AI text extraction |
| POST | `/api/pdf-parse/` | PDF extraction |
| GET | `/api/department/analytics/` | Dept intelligence |
| GET/POST | `/api/department/files/` | File share |
| POST | `/api/alerts/raise/` | Raise professor alert |
| GET | `/api/alerts/` | View alerts |
| POST | `/api/alerts/:id/resolve/` | Resolve alert |

---

## 🧠 ML Innovation

**Phase 1:** Completion tracking — captures actual hours + difficulty per task

**Phase 2:** Personalized stress scoring:
```python
stress = base_score × subject_multiplier × urgency_decay × difficulty_modifier
```

**Phase 3:** AI recommendations — "Start Math Assignment by May 24 (you take 1.4x longer)"

**Phase 4:** Crowd intelligence — 47 students rate Algo Assignment 4.2/5 difficulty

**Phase 5:** Professor alerts — auto-email when dept stress > 7.5/10

---

## 👤 Demo Accounts

| Department | Code |
|---|---|
| Computer Science | CSSE12 |
| Mechanical Engineering | MECH08 |
| Business Administration | BBA15 |

---

## 📄 License

MIT License — Free to use for educational purposes.

---

Built with 🤖 Groq AI · Django · React · Canvas API
