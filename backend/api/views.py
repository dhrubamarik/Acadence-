# api/views.py - Complete replacement

from django.shortcuts import render
from .models import Task, User
from .serializers import TaskSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .utils import calculate_stress, detect_clashes, fix_year, weight_to_priority
from .ai import parse_tasks
import json
import PyPDF2
import io
import secrets  


# ── Task List ──────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_list(request):

    if request.method == 'GET':
        user = request.user

        # Personal tasks owned by user
        personal_tasks = Task.objects.filter(
            owner=user,
            task_type='personal'
        )

        # Group tasks from user's department
        if user.department:
            group_tasks = Task.objects.filter(
                task_type='group',
                department=user.department
            )
        else:
            group_tasks = Task.objects.filter(
                task_type='group',
                owner=user
            )

        # Combine and order
        from itertools import chain
        all_tasks = list(chain(personal_tasks, group_tasks))
        all_tasks.sort(key=lambda t: t.deadline)

        serializer = TaskSerializer(
            all_tasks,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)

    if request.method == 'POST':
        # Check duplicate (same title + deadline)
        title    = request.data.get('title', '').strip()
        deadline = request.data.get('deadline', '')

        existing = Task.objects.filter(
            title__iexact=title,
            deadline=deadline,
            owner=request.user
        ).first()

        if existing:
            serializer = TaskSerializer(
                existing,
                context={'request': request}
            )
            return Response(serializer.data, status=200)

        serializer = TaskSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            # Set owner and department automatically
            task_type = request.data.get('task_type', 'personal')

            if task_type == 'group' and request.user.department:
                serializer.save(
                    owner=request.user,
                    department=request.user.department
                )
            else:
                serializer.save(owner=request.user)

            return Response(serializer.data, status=201)

        print("TASK ERROR:", serializer.errors)
        return Response(serializer.errors, status=400)


# ── Task Detail ────────────────────────────────────────────
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def task_detail(request, pk):
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response(
            {"error": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # ── GET ──
    if request.method == 'GET':
        serializer = TaskSerializer(task, context={'request': request})
        return Response(serializer.data)

    # ── PUT ──
    if request.method == 'PUT':
        # Only owner can edit
        if task.owner != request.user:
            return Response(
                {"error": "Only the task owner can edit this task."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = TaskSerializer(
            task,
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    # ── DELETE ──
    if request.method == 'DELETE':
        user = request.user

        # PERSONAL TASK - only owner can delete
        if task.task_type == 'personal':
            if task.owner != user:
                return Response(
                    {"error": "You can only delete your own personal tasks."},
                    status=status.HTTP_403_FORBIDDEN
                )
            task.delete()
            return Response(
                {"message": "Task deleted successfully."},
                status=status.HTTP_204_NO_CONTENT
            )

        # GROUP TASK - needs 3+ approvals OR owner deletes unverified
        if task.task_type == 'group':
            approval_count = task.approval_count()

            # Owner can delete if no one has approved yet
            if task.owner == user and approval_count == 0:
                task.delete()
                return Response(
                    {"message": "Group task deleted."},
                    status=status.HTTP_204_NO_CONTENT
                )

            # If already verified or has approvals
            if approval_count > 0 and task.owner == user:
                return Response({
                    "error": f"This task has {approval_count} approval(s). It cannot be deleted by owner alone.",
                    "approval_count": approval_count,
                    "needs_delete_approval": True
                }, status=status.HTTP_403_FORBIDDEN)

            # Non-owner trying to delete
            if task.owner != user:
                return Response(
                    {"error": "Only the task owner can request deletion."},
                    status=status.HTTP_403_FORBIDDEN
                )

        return Response(
            {"error": "Cannot delete this task."},
            status=status.HTTP_403_FORBIDDEN
        )


# ── Approve Task ───────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_task(request, pk):
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response(
            {"error": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Only group tasks can be approved
    if task.task_type == 'personal':
        return Response(
            {"error": "Personal tasks cannot be approved."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Owner cannot approve own task
    if task.owner == request.user:
        return Response(
            {"error": "You cannot approve your own task."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Must be in same department
    if (task.department and
        request.user.department != task.department):
        return Response(
            {"error": "You must be in the same department to approve."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Toggle approval
    if task.approved_by.filter(id=request.user.id).exists():
        task.approved_by.remove(request.user)
        action = "removed"
        message = "Approval removed."
    else:
        task.approved_by.add(request.user)
        task.check_verification()
        action = "added"
        message = "Task approved!"

    return Response({
        "action":         action,
        "message":        message,
        "approval_count": task.approval_count(),
        "is_verified":    task.is_verified
    })


# ── Analytics ──────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics(request):
    user = request.user

    # Same task filter as task_list
    personal_tasks = Task.objects.filter(
        owner=user,
        task_type='personal'
    )

    if user.department:
        group_tasks = Task.objects.filter(
            task_type='group',
            department=user.department
        )
    else:
        group_tasks = Task.objects.filter(
            task_type='group',
            owner=user
        )

    from itertools import chain
    all_tasks = list(chain(personal_tasks, group_tasks))

    stress  = calculate_stress(all_tasks,user=user)
    clashes = detect_clashes(all_tasks)

    return Response({
        "stress":  stress,
        "clashes": clashes
    })


# ── AI Parse ───────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_parse(request):
    text = request.data.get("text")

    if not text or not isinstance(text, str):
        return Response(
            {"error": "Missing or invalid 'text' field."},
            status=status.HTTP_400_BAD_REQUEST
        )

    tasks = parse_tasks(text)

    if tasks is None:
        return Response([])

    if isinstance(tasks, dict) and "tasks" in tasks:
        tasks = tasks["tasks"]

    if not isinstance(tasks, (list, tuple)):
        return Response([])

    cleaned_tasks = []
    for t in tasks:
        if not isinstance(t, dict):
            continue
        try:
            ai_weight = t.get("weight", 5)
            try:
                ai_weight = int(ai_weight)
            except:
                ai_weight = 5
            ai_weight = max(1, min(10, ai_weight))
            priority_label = weight_to_priority(ai_weight)

            deadline = t.get("deadline")
            if deadline:
                deadline = fix_year(deadline)
            else:
                from datetime import datetime, timedelta
                deadline = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

            cleaned_tasks.append({
                "title":    t.get("title", "Untitled").strip(),
                "deadline": deadline,
                "priority": priority_label,
                "course":   t.get("course", "General").strip().title()
            })
        except Exception as e:
            print("Skipping task:", e)
            continue

    return Response(cleaned_tasks)


# ── PDF Parse ──────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pdf_parse(request):
    if 'file' not in request.FILES:
        return Response(
            {"error": "No file uploaded."},
            status=status.HTTP_400_BAD_REQUEST
        )

    pdf_file = request.FILES['file']

    if not pdf_file.name.endswith('.pdf'):
        return Response(
            {"error": "Only PDF files are supported."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        pdf_reader     = PyPDF2.PdfReader(io.BytesIO(pdf_file.read()))
        extracted_text = ""
        for page in pdf_reader.pages:
            extracted_text += page.extract_text() + "\n"
    except Exception as e:
        return Response(
            {"error": f"Could not read PDF: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not extracted_text.strip():
        return Response(
            {"error": "PDF appears empty or is image-based."},
            status=status.HTTP_400_BAD_REQUEST
        )

    tasks = parse_tasks(extracted_text)

    if not tasks:
        return Response(
            {"error": "AI could not find tasks in this PDF."},
            status=status.HTTP_400_BAD_REQUEST
        )

    cleaned_tasks = []
    for t in tasks:
        if not isinstance(t, dict):
            continue
        try:
            ai_weight = int(t.get("weight", 5))
            ai_weight = max(1, min(10, ai_weight))
            priority_label = weight_to_priority(ai_weight)

            deadline = t.get("deadline")
            if deadline:
                deadline = fix_year(deadline)
            else:
                from datetime import datetime, timedelta
                deadline = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

            cleaned_tasks.append({
                "title":    t.get("title", "Untitled").strip(),
                "deadline": deadline,
                "priority": priority_label,
                "course":   t.get("course", "General").strip().title()
            })
        except Exception as e:
            continue

    return Response(cleaned_tasks)


# ── General Roadmap ────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def general_roadmap(request):
    user = request.user

    personal_tasks = Task.objects.filter(owner=user, task_type='personal')
    if user.department:
        group_tasks = Task.objects.filter(
            task_type='group',
            department=user.department
        )
    else:
        group_tasks = Task.objects.filter(task_type='group', owner=user)

    from itertools import chain
    all_tasks = list(chain(personal_tasks, group_tasks))
    all_tasks.sort(key=lambda t: t.deadline)

    if not all_tasks:
        return Response(
            {"error": "No tasks found. Add some tasks first!"},
            status=status.HTTP_400_BAD_REQUEST
        )

    task_summary = ""
    for task in all_tasks:
        task_summary += f"- {task.title} | Due: {task.deadline} | Priority: {task.priority} | Course: {task.course}\n"

    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")

    prompt = f"""
You are Acadence, an expert academic coach for college students.
Today's date is {today}.

The student has these upcoming tasks:
{task_summary}

Create a practical day-by-day study roadmap.

STRICT RULES:
1. Return ONLY valid JSON. No explanation. No markdown.
2. Return this exact structure:
{{
  "type": "general",
  "summary": "One sentence overview",
  "warning": "One sentence about biggest risk or null",
  "days": [
    {{
      "date": "YYYY-MM-DD",
      "day_label": "Monday, March 15",
      "focus": "Main task to focus on today",
      "tasks": ["specific action 1", "specific action 2"],
      "intensity": "light or medium or heavy"
    }}
  ]
}}
3. Only include days from today until the last deadline.
4. Maximum 14 days.
5. Be specific with actions.
"""
    return _call_groq_for_roadmap(prompt)


# ── Exam Roadmap ───────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exam_roadmap(request):
    exam_name = request.data.get("exam_name", "")
    syllabus  = request.data.get("syllabus", "")
    exam_date = request.data.get("exam_date", "")

    if not exam_name:
        return Response(
            {"error": "Please provide the exam name."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Find matching task in DB
    from django.db.models import Q
    matching_task = Task.objects.filter(
        Q(title__icontains=exam_name) |
        Q(course__icontains=exam_name),
        owner=request.user
    ).first()

    task_info = ""
    if matching_task:
        task_info = (
            f"Exam: {matching_task.title}\n"
            f"Due Date: {matching_task.deadline}\n"
            f"Priority: {matching_task.priority}\n"
            f"Course: {matching_task.course}"
        )
        exam_date = str(matching_task.deadline)
    elif exam_date:
        task_info = f"Exam: {exam_name}\nDue Date: {exam_date}"
    else:
        task_info = f"Exam: {exam_name}\nDue Date: Not specified"

    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")

    # Build syllabus section
    syllabus_section = ""
    if syllabus and syllabus.strip():
        syllabus_section = f"""
STUDENT PROVIDED SYLLABUS/TOPICS:
{syllabus}

CRITICAL INSTRUCTION: Use EXACTLY these topics from the syllabus above.
Create day-wise tasks for each specific topic mentioned.
Do NOT use generic tasks like "review notes" or "practice problems".
Instead use specific tasks like "Study Limits and Continuity - solve 15 limit problems"
"""
    else:
        syllabus_section = """
No syllabus provided. Use standard topics for this subject.
Still be specific with task names.
"""

    prompt = f"""
You are Acadence, an elite academic coach who creates HIGHLY SPECIFIC study plans.

Today's date is: {today}

EXAM INFORMATION:
{task_info}

{syllabus_section}

Your task: Create a DAY-BY-DAY exam preparation roadmap.

STRICT RULES:
1. Return ONLY valid JSON. Zero explanation. Zero markdown.
2. Every single task must mention a SPECIFIC TOPIC from the syllabus.
3. NEVER write generic tasks like "review notes", "practice problems", "watch videos".
4. ALWAYS write specific tasks like:
   - "Study Limits: solve 10 limit problems using L'Hopital's rule"
   - "Master Matrix Multiplication: practice 5 problems with 3x3 matrices"
   - "Understand Eigenvalues: find eigenvalues for 3 different matrices"
5. Distribute topics logically - Unit 1 first, Unit 2 next, etc.
6. Last 2 days MUST be full revision with mock exam simulation.
7. Day intensity based on topic difficulty.

Return this EXACT JSON structure:
{{
  "type": "exam_specific",
  "exam_name": "{exam_name}",
  "exam_date": "{exam_date}",
  "summary": "Specific one-sentence strategy for THIS exam based on syllabus",
  "warning": "Most difficult topic from syllabus that needs extra attention",
  "topics": ["exact topic 1 from syllabus", "exact topic 2", "..."],
  "daily_hours": 3,
  "days": [
    {{
      "date": "YYYY-MM-DD",
      "day_label": "Monday, June 2",
      "unit": "Unit 1: Calculus",
      "focus": "EXACT topic name from syllabus",
      "tasks": [
        "Specific action with topic name and quantity",
        "Another specific action"
      ],
      "intensity": "light or medium or heavy",
      "tip": "One specific study tip for this topic"
    }}
  ]
}}
"""
    return _call_groq_for_roadmap(prompt)

# ── Groq Helper ────────────────────────────────────────────
def _call_groq_for_roadmap(prompt):
    try:
        from groq import Groq
        import os

        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a JSON-only academic planning bot. Never explain. Only return valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3
        )

        result = response.choices[0].message.content.strip()

        if result.startswith("```"):
            lines  = result.split("\n")
            lines  = [l for l in lines if not l.startswith("```")]
            result = "\n".join(lines)

        start = result.find('{')
        end   = result.rfind('}') + 1

        if start == -1 or end == 0:
            return Response(
                {"error": "AI returned invalid format."},
                status=500
            )

        roadmap = json.loads(result[start:end])
        return Response(roadmap)

    except Exception as e:
        print("ROADMAP ERROR:", e)
        return Response({"error": str(e)}, status=500)
# ── Mark Task Complete ─────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_task(request, pk):
    """
    Student marks a task as done + submits feedback.
    Creates TaskCompletion record.
    Updates UserProfile learning weights.
    """
    from .models import TaskCompletion, UserProfile

    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response(
            {"error": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check already completed
    if TaskCompletion.objects.filter(
        task=task,
        user=request.user
    ).exists():
        return Response(
            {"error": "You already marked this task as complete."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate input
    actual_hours = request.data.get("actual_hours")
    difficulty   = request.data.get("difficulty_rating")
    on_time      = request.data.get("completed_on_time", True)
    notes        = request.data.get("notes", "")

    if actual_hours is None or difficulty is None:
        return Response(
            {"error": "actual_hours and difficulty_rating are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        actual_hours = float(actual_hours)
        difficulty   = int(difficulty)
        if not (1 <= difficulty <= 5):
            raise ValueError()
    except (ValueError, TypeError):
        return Response(
            {"error": "actual_hours must be a number, difficulty_rating must be 1-5."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create completion record
    from datetime import date
    completed_on_time = bool(on_time)
    if task.deadline:
        completed_on_time = date.today() <= task.deadline

    completion = TaskCompletion.objects.create(
        task              = task,
        user              = request.user,
        actual_hours      = actual_hours,
        difficulty_rating = difficulty,
        completed_on_time = completed_on_time,
        notes             = notes
    )

    # Get or create user profile and update it
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.update_after_completion(completion)

    return Response({
        "message":          "Task marked as complete! Great work 🎉",
        "completion_id":    completion.id,
        "tasks_completed":  profile.tasks_completed,
        "on_time":          completed_on_time,
    }, status=status.HTTP_201_CREATED)


# ── Get User Insights (for frontend display) ───────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_insights(request):
    """
    Returns personalized stats for the logged-in user.
    Frontend uses this to show "Your learning profile" card.
    """
    from .models import TaskCompletion, UserProfile

    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    completions = TaskCompletion.objects.filter(
        user=request.user
    ).select_related('task').order_by('-completed_at')[:10]

    recent = []
    for c in completions:
        recent.append({
            "task":              c.task.title,
            "course":            c.task.course,
            "actual_hours":      c.actual_hours,
            "difficulty_rating": c.difficulty_rating,
            "completed_on_time": c.completed_on_time,
            "completed_at":      c.completed_at.strftime("%Y-%m-%d"),
        })

    # On-time rate
    total      = completions.count()
    on_time_ct = TaskCompletion.objects.filter(
        user=request.user,
        completed_on_time=True
    ).count()
    on_time_rate = round(
        (on_time_ct / total * 100) if total > 0 else 0
    )

    return Response({
        "tasks_completed":      profile.tasks_completed,
        "avg_difficulty_given": round(profile.avg_difficulty_given, 1),
        "procrastination_score": round(profile.procrastination_score, 2),
        "subject_multipliers":  profile.subject_multipliers,
        "on_time_rate":         on_time_rate,
        "recent_completions":   recent,
        "estimation_accuracy":  round(profile.estimation_accuracy, 2),
    })

#  Phase 3: AI Recommendations

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    from .models import UserProfile, TaskCompletion
    from datetime import date, timedelta

    user = request.user

    # Get tasks (same logic as analytics view)
    personal_tasks = Task.objects.filter(
        owner=user,
        task_type='personal'
    )
    if user.department:
        group_tasks = Task.objects.filter(
            task_type='group',
            department=user.department
        )
    else:
        group_tasks = Task.objects.filter(
            task_type='group',
            owner=user
        )

    from itertools import chain
    all_tasks = list(chain(personal_tasks, group_tasks))

    # Get user profile
    profile, _ = UserProfile.objects.get_or_create(user=user)

    # Get stress + clashes
    stress  = calculate_stress(all_tasks, user=user)
    clashes = detect_clashes(all_tasks)

    today       = date.today()
    next14_days = today + timedelta(days=14)

    recommendations = []

    # ── Recommendation Type 1: High Stress Warning ─────────
    high_stress_dates = [
        (d, v) for d, v in stress.items()
        if v >= 7
        and today <= date.fromisoformat(d) <= next14_days
    ]
    high_stress_dates.sort(key=lambda x: x[1], reverse=True)

    for stress_date, stress_val in high_stress_dates[:2]:
        stress_dt    = date.fromisoformat(stress_date)
        nearby_tasks = [
            t for t in all_tasks
            if abs((t.deadline - stress_dt).days) <= 2
        ]

        if not nearby_tasks:
            continue

        # Pick highest priority task
        task = sorted(
            nearby_tasks,
            key=lambda t: {"high": 3, "medium": 2, "low": 1}.get(t.priority, 1),
            reverse=True
        )[0]

        days_until = (task.deadline - today).days

        # Personalized message based on subject multiplier
        subject_mult = profile.subject_multipliers.get(task.course, 1.0)
        personalized = profile.tasks_completed >= 3

        if personalized and subject_mult > 1.2:
            tip = f"You typically take {round(subject_mult, 1)}x longer on {task.course} tasks — start earlier than usual."
        elif days_until <= 1:
            tip = "Due very soon — prioritize this above everything else today."
        elif days_until <= 3:
            tip = "Only a few days left — block 2-3 hours today to make progress."
        else:
            tip = "High workload week ahead — spread tasks across multiple days."

        # ── Fixed: start date = deadline minus buffer ──────
        if personalized and profile.procrastination_score > 0.6:
            days_before_deadline = 4
        elif personalized and subject_mult > 1.2:
            days_before_deadline = 3
        else:
            days_before_deadline = 2

        deadline_date = task.deadline  # already a date object
        start_date    = deadline_date - timedelta(days=days_before_deadline)

        # If recommended start already passed → suggest today
        if start_date <= today:
            start_date = today

        recommended_start = start_date.strftime("%b %d")
        days_to_start     = (start_date - today).days

        recommendations.append({
            "id":                f"stress_{stress_date}",
            "type":              "stress",
            "severity":          "high" if stress_val >= 8 else "medium",
            "title":             f"High stress detected — {stress_date}",
            "task":              task.title,
            "course":            task.course,
            "deadline":          str(task.deadline),
            "days_until":        days_to_start,        # ← days to START not deadline
            "stress_score":      stress_val,
            "tip":               tip,
            "recommended_start": recommended_start,    # ← date before deadline
            "personalized":      personalized,
        })

    # ── Recommendation Type 2: Clash Warnings ──────────────
    for clash in clashes[:2]:
        task1_obj = next(
            (t for t in all_tasks if t.title == clash["task1"]), None
        )
        task2_obj = next(
            (t for t in all_tasks if t.title == clash["task2"]), None
        )

        if not task1_obj or not task2_obj:
            continue

        days_until_1 = (task1_obj.deadline - today).days
        days_until_2 = (task2_obj.deadline - today).days

        # Only show future clashes
        if days_until_1 < 0 and days_until_2 < 0:
            continue

        # Recommended start = 2 days before the earlier deadline
        earlier_deadline = min(task1_obj.deadline, task2_obj.deadline)
        start_date       = earlier_deadline - timedelta(days=2)

        if start_date <= today:
            start_date = today

        recommended_start = start_date.strftime("%b %d")
        days_to_start     = (start_date - today).days

        recommendations.append({
            "id":                f"clash_{clash['task1'][:10]}",
            "type":              "clash",
            "severity":          "high",
            "title":             "Deadline clash detected",
            "task":              clash["task1"],
            "task2":             clash["task2"],
            "days_apart":        clash["days_apart"],
            "days_until":        days_to_start,
            "recommended_start": recommended_start,
            "tip":               f"Two high-priority tasks only {clash['days_apart']} day(s) apart. Start the earlier one by {recommended_start}.",
            "personalized":      False,
        })

    # ── Recommendation Type 3: Procrastination Nudge ───────
    if profile.tasks_completed >= 5 and profile.procrastination_score > 0.65:
        urgent = [
            t for t in all_tasks
            if 0 < (t.deadline - today).days <= 4
            and t.priority in ["high", "medium"]
        ]
        if urgent:
            urgent_task   = sorted(urgent, key=lambda t: t.deadline)[0]
            days_until    = (urgent_task.deadline - today).days

            # Start date = today (already urgent)
            start_date        = today
            recommended_start = "Today"
            days_to_start     = 0

            recommendations.append({
                "id":                f"procrastination_{urgent_task.id}",
                "type":              "procrastination",
                "severity":          "medium",
                "title":             "Your pattern says — start now",
                "task":              urgent_task.title,
                "course":            urgent_task.course,
                "deadline":          str(urgent_task.deadline),
                "days_until":        days_to_start,
                "recommended_start": recommended_start,
                "tip":               f"Based on your history, you complete {int((1 - profile.procrastination_score) * 100)}% of tasks on time when started 3+ days early. Only {days_until} day(s) left.",
                "personalized":      True,
            })

    # ── Recommendation Type 4: Positive (no stress) ────────
    if not recommendations and profile.tasks_completed >= 3:
        on_time_ct = TaskCompletion.objects.filter(
            user=user,
            completed_on_time=True
        ).count()
        total    = profile.tasks_completed
        rate     = int((on_time_ct / total * 100)) if total > 0 else 0

        recommendations.append({
            "id":                "ontrack",
            "type":              "positive",
            "severity":          "low",
            "title":             "You're on track! 🎉",
            "task":              "",
            "days_until":        None,
            "recommended_start": None,
            "tip":               f"No stress spikes or clashes detected. You complete {rate}% of tasks on time. Keep it up!",
            "personalized":      True,
        })

    return Response({
        "recommendations": recommendations,
        "total":           len(recommendations),
        "personalized":    profile.tasks_completed >= 3,
    })

#  Phase 4: Department Dashboard

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def department_analytics(request):
    """
    Returns department-wide stress intelligence:
    - Overall dept stress score this week
    - Per-task crowd difficulty ratings
    - How many students are affected by each task
    - User's stress vs department average
    """
    from .models import UserProfile, TaskCompletion
    from datetime import date, timedelta
    from django.db.models import Avg, Count

    user = request.user

    # Must be in a department
    if not user.department:
        return Response({
            "error": "You are not part of any department.",
            "has_department": False,
        }, status=200)

    dept        = user.department
    today       = date.today()
    next7_days  = today + timedelta(days=7)

    # ── All students in department ─────────────────────────
    dept_students = User.objects.filter(
        department=dept
    ).count()

    # ── All group tasks in department ──────────────────────
    dept_tasks = Task.objects.filter(
        department=dept,
        task_type='group'
    )

    # ── This week's tasks ──────────────────────────────────
    this_week_tasks = dept_tasks.filter(
        deadline__gte=today,
        deadline__lte=next7_days
    )

    # ── Department stress score (avg across all students) ──
    dept_stress_scores = []
    all_dept_users     = User.objects.filter(department=dept)

    for dept_user in all_dept_users:
        user_tasks = list(dept_tasks)
        if user_tasks:
            user_stress = calculate_stress(user_tasks)
            week_scores = [
                v for d, v in user_stress.items()
                if today <= date.fromisoformat(d) <= next7_days
            ]
            if week_scores:
                dept_stress_scores.append(max(week_scores))

    dept_avg_stress = round(
        sum(dept_stress_scores) / len(dept_stress_scores), 1
    ) if dept_stress_scores else 0

    # User's own stress for comparison
    personal_tasks = Task.objects.filter(
        owner=user, task_type='personal'
    )
    from itertools import chain
    all_user_tasks  = list(chain(personal_tasks, dept_tasks))
    user_stress_map = calculate_stress(all_user_tasks, user=user)
    user_week_scores = [
        v for d, v in user_stress_map.items()
        if today <= date.fromisoformat(d) <= next7_days
    ]
    user_stress_score = round(
        max(user_week_scores), 1
    ) if user_week_scores else 0

    # ── Per-task crowd intelligence ────────────────────────
    task_intelligence = []

    for task in dept_tasks.order_by('deadline')[:15]:
        # How many students completed + rated this task
        completions = TaskCompletion.objects.filter(task=task)
        rating_count = completions.count()

        avg_difficulty = None
        avg_hours      = None

        if rating_count > 0:
            agg = completions.aggregate(
                avg_diff  = Avg('difficulty_rating'),
                avg_hours = Avg('actual_hours')
            )
            avg_difficulty = round(agg['avg_diff'],  1)
            avg_hours      = round(agg['avg_hours'], 1)

        # Days until deadline
        days_until = (task.deadline - today).days

        # How many dept students have this task
        # (all group tasks visible to whole dept)
        affected_pct = 100  # group task = all dept students

        # Approval count = engagement metric
        approval_count = task.approved_by.count()

        task_intelligence.append({
            "id":             task.id,
            "title":          task.title,
            "course":         task.course,
            "deadline":       str(task.deadline),
            "priority":       task.priority,
            "days_until":     days_until,
            "rating_count":   rating_count,
            "avg_difficulty": avg_difficulty,
            "avg_hours":      avg_hours,
            "approval_count": approval_count,
            "is_verified":    task.is_verified,
            "is_this_week":   0 <= days_until <= 7,
        })

    # Sort: this week first, then by deadline
    task_intelligence.sort(
        key=lambda t: (not t['is_this_week'], t['days_until'])
    )

    # ── Top stressors (highest priority + closest deadline) ─
    top_stressors = sorted(
        [t for t in task_intelligence if t['days_until'] >= 0],
        key=lambda t: (
            {"high": 3, "medium": 2, "low": 1}.get(t['priority'], 1),
            -t['days_until']
        ),
        reverse=True
    )[:3]

    # ── Dept completion rate ───────────────────────────────
    total_completions = TaskCompletion.objects.filter(
        task__department=dept
    ).count()

    on_time_completions = TaskCompletion.objects.filter(
        task__department=dept,
        completed_on_time=True
    ).count()

    completion_rate = round(
        (on_time_completions / total_completions * 100)
        if total_completions > 0 else 0
    )

    return Response({
        "has_department":     True,
        "department": {
            "name":           dept.name,
            "code":           dept.code,
            "total_students": dept_students,
        },
        "this_week": {
            "dept_stress":    dept_avg_stress,
            "user_stress":    user_stress_score,
            "task_count":     this_week_tasks.count(),
            "stress_level":   (
                "high"   if dept_avg_stress >= 7 else
                "medium" if dept_avg_stress >= 4 else
                "low"
            ),
        },
        "top_stressors":      top_stressors,
        "task_intelligence":  task_intelligence,
        "dept_stats": {
            "total_tasks":       dept_tasks.count(),
            "total_completions": total_completions,
            "completion_rate":   completion_rate,
        }
    })

#  Phase 5: Professor Alert System

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_alerts(request):
    """
    Returns all alerts for user's department.
    Students see alerts raised for their dept.
    """
    from .models import ProfessorAlert
    from datetime import date, timedelta

    user = request.user

    if not user.department:
        return Response({
            "alerts": [],
            "has_department": False
        })

    alerts = ProfessorAlert.objects.filter(
        department=user.department
    ).order_by('-created_at')[:10]

    alert_data = []
    for alert in alerts:
        affected_tasks = list(
            alert.affected_tasks.values(
                'id', 'title', 'deadline', 'priority', 'course'
            )
        )
        alert_data.append({
            "id":             alert.id,
            "alert_type":     alert.alert_type,
            "status":         alert.status,
            "stress_score":   alert.stress_score,
            "students_count": alert.students_count,
            "message":        alert.message,
            "suggestion":     alert.suggestion,
            "raised_by":      alert.raised_by.full_name
                              if alert.raised_by else "Auto System",
            "created_at":     alert.created_at.strftime("%Y-%m-%d %H:%M"),
            "affected_tasks": affected_tasks,
        })

    return Response({
        "alerts":          alert_data,
        "has_department":  True,
        "dept_name":       user.department.name,
        "dept_code":       user.department.code,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def raise_alert(request):
    """
    Student manually raises a stress alert.
    Auto-checks if dept stress is high enough to justify it.
    """
    from .models import ProfessorAlert, UserProfile
    from datetime import date, timedelta
    from itertools import chain

    user = request.user

    if not user.department:
        return Response(
            {"error": "You must be in a department to raise an alert."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get current dept stress
    dept_tasks = Task.objects.filter(
        department=user.department,
        task_type='group'
    )
    personal_tasks = Task.objects.filter(
        owner=user,
        task_type='personal'
    )
    all_tasks   = list(chain(personal_tasks, dept_tasks))
    stress      = calculate_stress(all_tasks, user=user)
    clashes     = detect_clashes(list(dept_tasks))

    today       = date.today()
    next7       = today + timedelta(days=7)

    # Peak stress this week
    week_scores = [
        v for d, v in stress.items()
        if today <= date.fromisoformat(d) <= next7
    ]
    peak_stress = max(week_scores) if week_scores else 0

    # Get affected tasks (high priority this week)
    affected = [
        t for t in dept_tasks
        if today <= t.deadline <= next7
        and t.priority in ['high', 'medium']
    ]

    # Build auto message
    student_message = request.data.get("message", "").strip()
    dept_students   = user.department.students.count()

    auto_message = (
        f"Department {user.department.code} stress alert raised by "
        f"{user.full_name or user.email}.\n"
        f"Current peak stress: {peak_stress}/10.\n"
        f"{len(affected)} high/medium priority tasks due this week.\n"
        f"{len(clashes)} deadline clashes detected.\n"
        f"Affecting approximately {dept_students} students."
    )

    if student_message:
        auto_message += f"\n\nStudent note: {student_message}"

    # AI suggestion based on stress level
    if peak_stress >= 9:
        suggestion = (
            f"URGENT: Consider extending deadlines for "
            f"{len(affected)} tasks by 3-5 days. "
            f"Stress score {peak_stress}/10 indicates severe burnout risk."
        )
    elif peak_stress >= 7:
        suggestion = (
            f"Recommend: Review task clustering for "
            f"{user.department.code}. "
            f"{len(clashes)} clashes detected. "
            f"Consider staggering deadlines by 2-3 days."
        )
    else:
        suggestion = (
            f"Moderate stress detected. "
            f"Monitor {user.department.code} over next 3 days. "
            f"No immediate action required."
        )

    # Check if alert already raised today
    from django.utils import timezone
    existing = ProfessorAlert.objects.filter(
        department=user.department,
        created_at__date=today,
        status='pending'
    ).first()

    if existing:
        return Response({
            "message":    "An alert is already pending for today.",
            "alert_id":   existing.id,
            "already_exists": True,
        })

    # Create alert
    alert = ProfessorAlert.objects.create(
        department    = user.department,
        alert_type    = 'manual',
        stress_score  = peak_stress,
        students_count = dept_students,
        raised_by     = user,
        message       = auto_message,
        suggestion    = suggestion,
    )

    # Link affected tasks
    alert.affected_tasks.set(affected)
    alert.save()

    return Response({
        "message":      "🚨 Alert raised successfully! Professor notified.",
        "alert_id":     alert.id,
        "stress_score": peak_stress,
        "suggestion":   suggestion,
        "affected_tasks_count": len(affected),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auto_check_and_alert(request):
    """
    Called after task creation/analytics fetch.
    Auto-raises alert if dept stress crosses 7.5 threshold.
    No duplicate alerts same day.
    """
    from .models import ProfessorAlert
    from datetime import date, timedelta
    from itertools import chain

    user = request.user
    if not user.department:
        return Response({"triggered": False})

    dept_tasks     = Task.objects.filter(
        department=user.department,
        task_type='group'
    )
    personal_tasks = Task.objects.filter(
        owner=user, task_type='personal'
    )
    all_tasks   = list(chain(personal_tasks, dept_tasks))
    stress      = calculate_stress(all_tasks, user=user)
    clashes     = detect_clashes(list(dept_tasks))

    today = date.today()
    next7 = today + timedelta(days=7)

    week_scores = [
        v for d, v in stress.items()
        if today <= date.fromisoformat(d) <= next7
    ]
    peak_stress = max(week_scores) if week_scores else 0

    # Only auto-alert if stress >= 7.5
    if peak_stress < 7.5:
        return Response({
            "triggered":    False,
            "stress_score": peak_stress
        })

    # No duplicate same day
    existing = ProfessorAlert.objects.filter(
        department=user.department,
        created_at__date=today
    ).first()

    if existing:
        return Response({
            "triggered":  False,
            "reason":     "Alert already exists for today",
            "alert_id":   existing.id
        })

    # Auto-generate alert
    affected    = [
        t for t in dept_tasks
        if today <= t.deadline <= next7
        and t.priority in ['high', 'medium']
    ]
    dept_students = user.department.students.count()

    suggestion = (
        f"Auto-detected: {user.department.code} stress at "
        f"{peak_stress}/10. "
        f"{len(clashes)} clashes found. "
        f"Recommend reviewing deadline clustering."
    )

    alert = ProfessorAlert.objects.create(
        department     = user.department,
        alert_type     = 'auto',
        stress_score   = peak_stress,
        students_count = dept_students,
        raised_by      = None,
        message        = (
            f"Auto-generated alert: {user.department.code} "
            f"stress score reached {peak_stress}/10 "
            f"with {len(affected)} tasks due this week."
        ),
        suggestion     = suggestion,
    )
    alert.affected_tasks.set(affected)

    return Response({
        "triggered":    True,
        "alert_id":     alert.id,
        "stress_score": peak_stress,
        "suggestion":   suggestion,
    })


# ── Professor Alert Email Helper ───────────────────────────
def send_professor_alert_email(alert, dept):
    """Sends real email to professor when alert is raised"""
    from django.core.mail import send_mail
    from django.conf import settings

    professor_email = getattr(settings, 'PROFESSOR_EMAIL', None)
    if not professor_email:
        print("❌ PROFESSOR_EMAIL not set in settings")
        return False

    subject = f"🚨 Acadence Alert: {dept.code} Stress Level {alert.stress_score}/10"

    affected_list = "\n".join([
        f"  • {t.title} (Due: {t.deadline}, Priority: {t.priority})"
        for t in alert.affected_tasks.all()
    ])

    plain_message = f"""
ACADENCE — DEPARTMENT STRESS ALERT
===================================

Department : {dept.name} ({dept.code})
Stress Score: {alert.stress_score} / 10
Students Affected: {alert.students_count}
Alert Type: {alert.get_alert_type_display()}
Raised By: {alert.raised_by.full_name if alert.raised_by else 'Auto System'}
Time: {alert.created_at.strftime('%Y-%m-%d %H:%M')}

MESSAGE:
{alert.message}

AFFECTED TASKS:
{affected_list if affected_list else 'None specified'}

AI RECOMMENDATION:
{alert.suggestion}

---
This alert was generated by Acadence AI Academic Planner.
Log in to dashboard to review and resolve this alert.
    """

    html_message = f"""
    <div style="font-family: Inter, Arial, sans-serif;
                max-width: 560px;
                margin: 0 auto;
                padding: 32px;
                background: #f8fffe;
                border-radius: 16px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0d9488, #14b8a6);
                    borderRadius: 12px;
                    padding: 20px 24px;
                    margin-bottom: 24px;
                    border-radius: 12px;">
            <h1 style="color: white; margin: 0; font-size: 22px;">
                🎓 Acadence
            </h1>
            <p style="color: rgba(255,255,255,0.8);
                      margin: 4px 0 0; font-size: 13px;">
                Department Stress Alert System
            </p>
        </div>

        <!-- Alert Banner -->
        <div style="background: #fef2f2;
                    border: 2px solid #fecaca;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    text-align: center;">
            <div style="font-size: 40px; margin-bottom: 8px;">🚨</div>
            <h2 style="color: #dc2626; margin: 0 0 6px; font-size: 20px;">
                Stress Alert — {dept.code}
            </h2>
            <div style="font-size: 36px;
                        font-weight: 800;
                        color: #dc2626;">
                {alert.stress_score} / 10
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                Department Stress Score
            </div>
        </div>

        <!-- Details -->
        <div style="background: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 16px;
                    border: 1px solid rgba(13,148,136,0.1);">

            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                    <td style="padding: 6px 0; color: #7aada5; width: 140px;">
                        🏫 Department
                    </td>
                    <td style="padding: 6px 0; font-weight: 600; color: #0f2a27;">
                        {dept.name} ({dept.code})
                    </td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #7aada5;">
                        👥 Students
                    </td>
                    <td style="padding: 6px 0; font-weight: 600; color: #0f2a27;">
                        {alert.students_count} affected
                    </td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #7aada5;">
                        👤 Raised By
                    </td>
                    <td style="padding: 6px 0; font-weight: 600; color: #0f2a27;">
                        {alert.raised_by.full_name if alert.raised_by
                         else 'Auto System'}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #7aada5;">
                        🕐 Time
                    </td>
                    <td style="padding: 6px 0; font-weight: 600; color: #0f2a27;">
                        {alert.created_at.strftime('%Y-%m-%d %H:%M')}
                    </td>
                </tr>
            </table>
        </div>

        <!-- Message -->
        <div style="background: white;
                    border-radius: 12px;
                    padding: 16px 20px;
                    margin-bottom: 16px;
                    border: 1px solid #fecaca;
                    font-size: 13px;
                    color: #374151;
                    line-height: 1.7;
                    white-space: pre-line;">
            <strong style="color: #dc2626;">📋 Alert Details:</strong><br/>
            {alert.message}
        </div>

        <!-- Affected Tasks -->
        {"<div style='background:white;border-radius:12px;padding:16px 20px;margin-bottom:16px;border:1px solid rgba(13,148,136,0.1);'><strong style='color:#0d9488;font-size:13px;'>📌 Affected Tasks:</strong><br/><br/>" + "".join([f"<div style='padding:6px 10px;background:#f0fdfa;border-radius:6px;margin-bottom:6px;font-size:12px;'><strong>{t.title}</strong> — Due: {t.deadline} | Priority: {t.priority.upper()}</div>" for t in alert.affected_tasks.all()]) + "</div>" if alert.affected_tasks.exists() else ""}

        <!-- AI Suggestion -->
        <div style="background: linear-gradient(135deg, #f0fdfa, #e6faf6);
                    border: 1px solid rgba(13,148,136,0.2);
                    border-radius: 12px;
                    padding: 16px 20px;
                    margin-bottom: 20px;
                    font-size: 13px;
                    color: #0d7a7a;
                    line-height: 1.7;">
            <strong>💡 AI Recommendation:</strong><br/>
            {alert.suggestion}
        </div>

        <!-- Footer -->
        <p style="text-align: center;
                  color: #9ca3af;
                  font-size: 12px;
                  margin: 0;">
            Generated by Acadence AI · Academic Stress Intelligence Platform
        </p>
    </div>
    """

    try:
        send_mail(
            subject        = subject,
            message        = plain_message,
            from_email     = None,
            recipient_list = [professor_email],
            html_message   = html_message,
            fail_silently  = False,
        )
        print(f"✅ Professor alert email sent to {professor_email}")
        return True
    except Exception as e:
        print(f"❌ Professor email failed: {e}")
        return False


# ── Resolve Alert ──────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolve_alert(request, pk):
    """
    Mark alert as resolved.
    Removes it from pending list.
    """
    from .models import ProfessorAlert

    try:
        alert = ProfessorAlert.objects.get(pk=pk)
    except ProfessorAlert.DoesNotExist:
        return Response(
            {"error": "Alert not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if alert.department != request.user.department:
        return Response(
            {"error": "Not authorized for this alert"},
            status=status.HTTP_403_FORBIDDEN
        )

    alert.status = 'resolved'
    alert.save()

    return Response({
        "message":  "✅ Alert resolved successfully.",
        "alert_id": alert.id,
        "status":   "resolved"
    })


# ── Updated raise_alert with email ────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def raise_alert(request):
    from .models import ProfessorAlert, UserProfile
    from datetime import date, timedelta
    from itertools import chain

    user = request.user
    if not user.department:
        return Response(
            {"error": "You must be in a department to raise an alert."},
            status=status.HTTP_400_BAD_REQUEST
        )

    dept_tasks     = Task.objects.filter(
        department=user.department,
        task_type='group'
    )
    personal_tasks = Task.objects.filter(
        owner=user,
        task_type='personal'
    )
    all_tasks   = list(chain(personal_tasks, dept_tasks))
    stress      = calculate_stress(all_tasks, user=user)
    clashes     = detect_clashes(list(dept_tasks))

    today = date.today()
    next7 = today + timedelta(days=7)

    week_scores = [
        v for d, v in stress.items()
        if today <= date.fromisoformat(d) <= next7
    ]
    peak_stress = max(week_scores) if week_scores else 0

    affected = [
        t for t in dept_tasks
        if today <= t.deadline <= next7
        and t.priority in ['high', 'medium']
    ]

    student_message = request.data.get("message", "").strip()
    dept_students   = user.department.students.count()

    auto_message = (
        f"Department {user.department.code} stress alert raised by "
        f"{user.full_name or user.email}.\n"
        f"Current peak stress: {peak_stress}/10.\n"
        f"{len(affected)} high/medium priority tasks due this week.\n"
        f"{len(clashes)} deadline clashes detected.\n"
        f"Affecting approximately {dept_students} students."
    )
    if student_message:
        auto_message += f"\n\nStudent note: {student_message}"

    if peak_stress >= 9:
        suggestion = (
            f"URGENT: Consider extending deadlines for "
            f"{len(affected)} tasks by 3-5 days. "
            f"Stress score {peak_stress}/10 indicates severe burnout risk."
        )
    elif peak_stress >= 7:
        suggestion = (
            f"Recommend: Review task clustering for "
            f"{user.department.code}. "
            f"{len(clashes)} clashes detected. "
            f"Consider staggering deadlines by 2-3 days."
        )
    else:
        suggestion = (
            f"Moderate stress detected. "
            f"Monitor {user.department.code} over next 3 days. "
            f"No immediate action required."
        )

    # No duplicate same day
    existing = ProfessorAlert.objects.filter(
        department=user.department,
        created_at__date=today,
        status='pending'
    ).first()

    if existing:
        return Response({
            "message":        "An alert is already pending for today.",
            "alert_id":       existing.id,
            "already_exists": True,
        })

    # Create alert
    alert = ProfessorAlert.objects.create(
        department     = user.department,
        alert_type     = 'manual',
        stress_score   = peak_stress,
        students_count = dept_students,
        raised_by      = user,
        message        = auto_message,
        suggestion     = suggestion,
    )
    alert.affected_tasks.set(affected)
    alert.save()

    # ── Send real email to professor ──────────────────────
    email_sent = send_professor_alert_email(alert, user.department)

    return Response({
        "message":              "🚨 Alert raised! Professor notified via email.",
        "alert_id":             alert.id,
        "stress_score":         peak_stress,
        "suggestion":           suggestion,
        "affected_tasks_count": len(affected),
        "email_sent":           email_sent,
    }, status=status.HTTP_201_CREATED)


# ── Department File Share ──────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def department_files(request):
    from .models import DepartmentFile

    user = request.user
    if not user.department:
        return Response(
            {"error": "You must be in a department."},
            status=400
        )

    if request.method == 'GET':
        files = DepartmentFile.objects.filter(
            department=user.department
        ).order_by('-uploaded_at')

        file_data = []
        for f in files:
            file_data.append({
                "id":           f.id,
                "title":        f.title,
                "description":  f.description,
                "file_type":    f.file_type,
                "file_url":     request.build_absolute_uri(f.file.url),
                "file_name":    f.file.name.split('/')[-1],
                "file_size":    f.file_size_display(),
                "uploaded_by":  f.uploaded_by.full_name or f.uploaded_by.email,
                "is_owner":     f.uploaded_by == user,
                "uploaded_at":  f.uploaded_at.strftime("%Y-%m-%d %H:%M"),
            })

        return Response({
            "files":      file_data,
            "dept_name":  user.department.name,
            "dept_code":  user.department.code,
        })

    if request.method == 'POST':
        uploaded_file = request.FILES.get('file')
        title         = request.data.get('title', '').strip()
        description   = request.data.get('description', '').strip()
        file_type     = request.data.get('file_type', 'other')

        if not uploaded_file:
            return Response(
                {"error": "No file uploaded."},
                status=400
            )
        if not title:
            return Response(
                {"error": "Title is required."},
                status=400
            )

        # 20MB limit
        if uploaded_file.size > 20 * 1024 * 1024:
            return Response(
                {"error": "File too large. Maximum 20MB."},
                status=400
            )

        dept_file = DepartmentFile.objects.create(
            title       = title,
            description = description,
            file        = uploaded_file,
            file_type   = file_type,
            uploaded_by = user,
            department  = user.department,
            file_size   = uploaded_file.size,
        )

        return Response({
            "message":   "✅ File uploaded successfully!",
            "file_id":   dept_file.id,
            "title":     dept_file.title,
            "file_url":  request.build_absolute_uri(dept_file.file.url),
            "file_size": dept_file.file_size_display(),
        }, status=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_department_file(request, pk):
    from .models import DepartmentFile

    try:
        dept_file = DepartmentFile.objects.get(pk=pk)
    except DepartmentFile.DoesNotExist:
        return Response(
            {"error": "File not found"},
            status=404
        )

    if dept_file.uploaded_by != request.user:
        return Response(
            {"error": "Only the uploader can delete this file."},
            status=403
        )

    # Delete physical file too
    import os
    if dept_file.file and os.path.exists(dept_file.file.path):
        os.remove(dept_file.file.path)

    dept_file.delete()
    return Response({"message": "✅ File deleted."})

# ── Professor Resolves via Email Link ─────────────────────
@api_view(['GET'])
@permission_classes([])  # No auth needed — professor uses token
def professor_resolve_alert(request):
    """
    Professor clicks link in email → alert resolved.
    No login required — uses secure token.
    """
    from .models import ProfessorAlert
    from django.utils import timezone

    token = request.GET.get('token', '').strip()

    if not token:
        return Response(
            {"error": "Invalid or missing token."},
            status=400
        )

    try:
        alert = ProfessorAlert.objects.get(
            resolve_token=token
        )
    except ProfessorAlert.DoesNotExist:
        return Response(
            {"error": "Alert not found or token expired."},
            status=404
        )

    if alert.status == 'resolved':
        return Response({
            "message":  "This alert was already resolved.",
            "dept":     alert.department.code,
            "resolved_at": str(alert.resolved_at),
        })

    # Resolve it
    alert.status               = 'resolved'
    alert.resolved_by_professor = True
    alert.resolved_at          = timezone.now()
    alert.save()

    # Return a nice HTML response (professor sees this in browser)
    from django.http import HttpResponse
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Alert Resolved — Acadence</title>
        <style>
            body {{
                font-family: Inter, Arial, sans-serif;
                background: #f0fdfa;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
            }}
            .card {{
                background: white;
                border-radius: 20px;
                padding: 48px;
                max-width: 480px;
                text-align: center;
                box-shadow: 0 8px 40px rgba(13,148,136,0.15);
                border: 1px solid rgba(13,148,136,0.2);
            }}
            .icon {{ font-size: 56px; margin-bottom: 16px; }}
            h1 {{ color: #0d9488; font-size: 24px; margin: 0 0 10px; }}
            p  {{ color: #7aada5; font-size: 14px; line-height: 1.7; margin: 0; }}
            .dept {{
                display: inline-block;
                background: #f0fdfa;
                border: 1px solid #99f6e4;
                color: #0d9488;
                padding: 4px 16px;
                border-radius: 999px;
                font-weight: 700;
                font-size: 13px;
                margin-top: 16px;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">✅</div>
            <h1>Alert Resolved!</h1>
            <p>
                The stress alert for <strong>{alert.department.name}</strong>
                ({alert.department.code}) has been marked as resolved.<br/><br/>
                Stress Score was: <strong>{alert.stress_score}/10</strong><br/>
                Students will be notified in their dashboard.
            </p>
            <div class="dept">{alert.department.code} — Resolved</div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html)


# ── Student Can Only View — Remove student resolve ─────────
# DELETE the old resolve_alert view entirely
# Students cannot resolve — only professors can via email link


# ── Updated send_professor_alert_email with resolve link ──
def send_professor_alert_email(alert, dept):
    from django.core.mail import send_mail
    from django.conf import settings

    professor_email = getattr(settings, 'PROFESSOR_EMAIL', None)
    if not professor_email:
        print("❌ PROFESSOR_EMAIL not set in settings")
        return False

    # Build resolve link using token
    resolve_link = (
        f"http://localhost:8000/api/alerts/resolve-by-professor/"
        f"?token={alert.resolve_token}"
    )

    subject = (
        f"🚨 Acadence Alert: {dept.code} "
        f"Stress Level {alert.stress_score}/10"
    )

    affected_list = "\n".join([
        f"  • {t.title} (Due: {t.deadline}, Priority: {t.priority})"
        for t in alert.affected_tasks.all()
    ])

    plain_message = f"""
ACADENCE — DEPARTMENT STRESS ALERT
===================================

Department  : {dept.name} ({dept.code})
Stress Score: {alert.stress_score} / 10
Students    : {alert.students_count}
Alert Type  : {alert.get_alert_type_display()}
Raised By   : {alert.raised_by.full_name if alert.raised_by else 'Auto System'}
Time        : {alert.created_at.strftime('%Y-%m-%d %H:%M')}

MESSAGE:
{alert.message}

AFFECTED TASKS:
{affected_list if affected_list else 'None specified'}

AI RECOMMENDATION:
{alert.suggestion}

TO RESOLVE THIS ALERT, CLICK:
{resolve_link}

---
Acadence AI Academic Planner
    """

    html_message = f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:580px;
                margin:0 auto;padding:32px;background:#f8fffe;
                border-radius:16px;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0d9488,#14b8a6);
                    padding:20px 24px;margin-bottom:24px;
                    border-radius:12px;">
            <h1 style="color:white;margin:0;font-size:22px;">
                🎓 Acadence
            </h1>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;
                      font-size:13px;">
                Department Stress Alert System
            </p>
        </div>

        <!-- Alert Banner -->
        <div style="background:#fef2f2;border:2px solid #fecaca;
                    border-radius:12px;padding:20px;
                    margin-bottom:20px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">🚨</div>
            <h2 style="color:#dc2626;margin:0 0 6px;font-size:20px;">
                Stress Alert — {dept.code}
            </h2>
            <div style="font-size:36px;font-weight:800;color:#dc2626;">
                {alert.stress_score} / 10
            </div>
            <div style="font-size:12px;color:#9ca3af;margin-top:4px;">
                Department Stress Score
            </div>
        </div>

        <!-- Details -->
        <div style="background:white;border-radius:12px;padding:20px;
                    margin-bottom:16px;
                    border:1px solid rgba(13,148,136,0.1);">
            <table style="width:100%;font-size:13px;
                          border-collapse:collapse;">
                <tr>
                    <td style="padding:6px 0;color:#7aada5;width:140px;">
                        🏫 Department
                    </td>
                    <td style="padding:6px 0;font-weight:600;
                               color:#0f2a27;">
                        {dept.name} ({dept.code})
                    </td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#7aada5;">
                        👥 Students
                    </td>
                    <td style="padding:6px 0;font-weight:600;
                               color:#0f2a27;">
                        {alert.students_count} affected
                    </td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#7aada5;">
                        👤 Raised By
                    </td>
                    <td style="padding:6px 0;font-weight:600;
                               color:#0f2a27;">
                        {alert.raised_by.full_name
                         if alert.raised_by else 'Auto System'}
                    </td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#7aada5;">
                        🕐 Time
                    </td>
                    <td style="padding:6px 0;font-weight:600;
                               color:#0f2a27;">
                        {alert.created_at.strftime('%Y-%m-%d %H:%M')}
                    </td>
                </tr>
            </table>
        </div>

        <!-- Message -->
        <div style="background:white;border-radius:12px;
                    padding:16px 20px;margin-bottom:16px;
                    border:1px solid #fecaca;font-size:13px;
                    color:#374151;line-height:1.7;
                    white-space:pre-line;">
            <strong style="color:#dc2626;">📋 Alert Details:</strong>
            <br/>{alert.message}
        </div>

        <!-- Affected Tasks -->
        {"<div style='background:white;border-radius:12px;padding:16px 20px;margin-bottom:16px;border:1px solid rgba(13,148,136,0.1);'><strong style='color:#0d9488;font-size:13px;'>📌 Affected Tasks:</strong><br/><br/>" + "".join([f"<div style='padding:6px 10px;background:#f0fdfa;border-radius:6px;margin-bottom:6px;font-size:12px;'><strong>{t.title}</strong> — Due: {t.deadline} | {t.priority.upper()}</div>" for t in alert.affected_tasks.all()]) + "</div>" if alert.affected_tasks.exists() else ""}

        <!-- AI Suggestion -->
        <div style="background:linear-gradient(135deg,#f0fdfa,#e6faf6);
                    border:1px solid rgba(13,148,136,0.2);
                    border-radius:12px;padding:16px 20px;
                    margin-bottom:20px;font-size:13px;
                    color:#0d7a7a;line-height:1.7;">
            <strong>💡 AI Recommendation:</strong><br/>
            {alert.suggestion}
        </div>

        <!-- RESOLVE BUTTON -->
        <div style="text-align:center;margin-bottom:20px;">
            <p style="font-size:13px;color:#374151;margin-bottom:12px;">
                After reviewing, click below to resolve this alert:
            </p>
            <a href="{resolve_link}"
               style="display:inline-block;
                      padding:14px 36px;
                      background:linear-gradient(135deg,#0d9488,#14b8a6);
                      color:white;
                      font-size:15px;
                      font-weight:700;
                      border-radius:999px;
                      text-decoration:none;
                      box-shadow:0 4px 20px rgba(13,148,136,0.4);">
                ✅ Mark Alert as Resolved
            </a>
            <p style="font-size:11px;color:#9ca3af;margin-top:10px;">
                Or copy this link: {resolve_link}
            </p>
        </div>

        <!-- Footer -->
        <p style="text-align:center;color:#9ca3af;font-size:12px;
                  margin:0;">
            Generated by Acadence AI · Academic Stress Intelligence
        </p>
    </div>
    """

    try:
        send_mail(
            subject        = subject,
            message        = plain_message,
            from_email     = None,
            recipient_list = [professor_email],
            html_message   = html_message,
            fail_silently  = False,
        )
        print(f"✅ Professor alert email sent to {professor_email}")
        return True
    except Exception as e:
        print(f"❌ Professor email failed: {e}")
        return False


# ── Updated raise_alert — generates token ─────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def raise_alert(request):
    from .models import ProfessorAlert, UserProfile
    from datetime import date, timedelta
    from itertools import chain
    import secrets  # secure token

    user = request.user
    if not user.department:
        return Response(
            {"error": "You must be in a department to raise an alert."},
            status=400
        )

    dept_tasks     = Task.objects.filter(
        department=user.department,
        task_type='group'
    )
    personal_tasks = Task.objects.filter(
        owner=user, task_type='personal'
    )
    all_tasks   = list(chain(personal_tasks, dept_tasks))
    stress      = calculate_stress(all_tasks, user=user)
    clashes     = detect_clashes(list(dept_tasks))

    today = date.today()
    next7 = today + timedelta(days=7)

    week_scores = [
        v for d, v in stress.items()
        if today <= date.fromisoformat(d) <= next7
    ]
    peak_stress   = max(week_scores) if week_scores else 0
    dept_students = user.department.students.count()

    affected = [
        t for t in dept_tasks
        if today <= t.deadline <= next7
        and t.priority in ['high', 'medium']
    ]

    student_message = request.data.get("message", "").strip()

    auto_message = (
        f"Department {user.department.code} stress alert raised by "
        f"{user.full_name or user.email}.\n"
        f"Current peak stress: {peak_stress}/10.\n"
        f"{len(affected)} high/medium priority tasks due this week.\n"
        f"{len(clashes)} deadline clashes detected.\n"
        f"Affecting approximately {dept_students} students."
    )
    if student_message:
        auto_message += f"\n\nStudent note: {student_message}"

    if peak_stress >= 9:
        suggestion = (
            f"URGENT: Consider extending deadlines for "
            f"{len(affected)} tasks by 3-5 days. "
            f"Stress score {peak_stress}/10 — severe burnout risk."
        )
    elif peak_stress >= 7:
        suggestion = (
            f"Recommend reviewing task clustering for "
            f"{user.department.code}. "
            f"{len(clashes)} clashes detected. "
            f"Consider staggering deadlines by 2-3 days."
        )
    else:
        suggestion = (
            f"Moderate stress detected. "
            f"Monitor {user.department.code} over next 3 days."
        )

    # No duplicate same day
    existing = ProfessorAlert.objects.filter(
        department=user.department,
        created_at__date=today,
        status='pending'
    ).first()
    if existing:
        return Response({
            "message":        "An alert is already pending for today.",
            "alert_id":       existing.id,
            "already_exists": True,
        })

    # Generate secure token for professor resolve link
    token = secrets.token_urlsafe(32)

    alert = ProfessorAlert.objects.create(
        department     = user.department,
        alert_type     = 'manual',
        stress_score   = peak_stress,
        students_count = dept_students,
        raised_by      = user,
        message        = auto_message,
        suggestion     = suggestion,
        resolve_token  = token,         # ← secure token
    )
    alert.affected_tasks.set(affected)
    alert.save()

    email_sent = send_professor_alert_email(alert, user.department)

    return Response({
        "message":              "🚨 Alert raised! Professor notified via email.",
        "alert_id":             alert.id,
        "stress_score":         peak_stress,
        "suggestion":           suggestion,
        "affected_tasks_count": len(affected),
        "email_sent":           email_sent,
    }, status=201)