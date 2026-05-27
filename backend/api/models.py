# api/models.py - Replace entire file

from django.db import models
from django.contrib.auth.models import AbstractUser
import random
import string

# ── Department ─────────────────────────────────────────────
class Department(models.Model):
    name     = models.CharField(max_length=100)   # "Computer Science"
    code     = models.CharField(max_length=20, unique=True)  # "CSSE12"
    join_key = models.CharField(max_length=20)    # secret key to join

    def __str__(self):
        return f"{self.name} ({self.code})"


# ── Custom User ────────────────────────────────────────────
class User(AbstractUser):
    email       = models.EmailField(unique=True)
    full_name  = models.CharField(max_length=150, blank=True) 
    department  = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="students"
    )
    is_verified = models.BooleanField(default=False)  # email verified
    otp         = models.CharField(max_length=6, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    def generate_otp(self):
        self.otp = ''.join(random.choices(string.digits, k=6))
        self.save()
        return self.otp

    def __str__(self):
        return self.email


# ── Task ───────────────────────────────────────────────────
class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low',    'Low'),
        ('medium', 'Medium'),
        ('high',   'High'),
    ]
    TYPE_CHOICES = [
        ('personal', 'Personal'),
        ('group',    'Group'),
    ]

    title       = models.CharField(max_length=200)
    deadline    = models.DateField()
    priority    = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    course      = models.CharField(max_length=100, default='General')

    # New fields
    task_type   = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        default='personal'
    )
    owner       = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name="tasks"
    )
    department  = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="tasks"
    )
    approved_by = models.ManyToManyField(
        User,
        blank=True,
        related_name="approved_tasks"
    )
    is_verified = models.BooleanField(default=False)  # 5+ approvals

    def approval_count(self):
        return self.approved_by.count()

    def check_verification(self):
        """Auto verify when 5 students approve"""
        if self.approved_by.count() >= 5:
            self.is_verified = True
            self.save()

    def __str__(self):
        return self.title
# ── Task Completion (Phase 1 - Feedback Loop) ─────────────
class TaskCompletion(models.Model):
    """
    Recorded when a student marks a task as done.
    Captures actual time spent vs task difficulty.
    This data trains the personalized stress engine (Phase 2).
    """
    task            = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="completions"
    )
    user            = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="completions"
    )
    completed_at    = models.DateTimeField(auto_now_add=True)
    actual_hours    = models.FloatField(
        help_text="How many hours did this actually take?"
    )
    difficulty_rating = models.IntegerField(
        help_text="1=Very Easy, 2=Easy, 3=Medium, 4=Hard, 5=Very Hard"
    )
    completed_on_time = models.BooleanField(
        default=True,
        help_text="Was it submitted before the deadline?"
    )
    notes           = models.TextField(
        blank=True,
        help_text="Optional: what was hardest about this task?"
    )

    class Meta:
        # One user can only complete one task once
        unique_together = ['task', 'user']
        ordering        = ['-completed_at']

    def __str__(self):
        return f"{self.user.email} completed {self.task.title}"


# ── User Learning Profile (Phase 2 - ML Weights) ──────────
class UserProfile(models.Model):
    """
    Auto-updated after each task completion.
    Stores personalized weights for stress calculation.
    Phase 2 reads these to generate personalized stress scores.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    # How accurate is this user's time estimation?
    # 1.0 = perfect, 1.4 = takes 40% longer than estimated
    estimation_accuracy = models.FloatField(
        default=1.0,
        help_text="Ratio: actual_hours / estimated_hours avg"
    )

    # 0.0 = always starts early, 1.0 = always last minute
    procrastination_score = models.FloatField(
        default=0.5
    )

    # Total tasks completed (used to weight the averages)
    tasks_completed = models.IntegerField(default=0)

    # Per-course speed multipliers stored as JSON
    # e.g. {"Mathematics": 1.4, "Physics": 0.9}
    subject_multipliers = models.JSONField(
        default=dict,
        help_text="Per-subject time multipliers learned from history"
    )

    # Average difficulty rating given by this user
    avg_difficulty_given = models.FloatField(default=3.0)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.email}"

    def update_after_completion(self, completion):
        """
        Called after every TaskCompletion save.
        Updates running averages for personalized scoring.
        """
        self.tasks_completed += 1

        # Update average difficulty
        self.avg_difficulty_given = (
            (self.avg_difficulty_given * (self.tasks_completed - 1) +
             completion.difficulty_rating)
            / self.tasks_completed
        )

        # Update subject multiplier for this course
        course = completion.task.course
        current = self.subject_multipliers.get(course, 1.0)
        # Running average per subject
        self.subject_multipliers[course] = round(
            (current + completion.difficulty_rating / 3.0) / 2, 2
        )

        # On-time score feeds procrastination metric
        if not completion.completed_on_time:
            self.procrastination_score = min(
                1.0,
                self.procrastination_score + 0.05
            )
        else:
            self.procrastination_score = max(
                0.0,
                self.procrastination_score - 0.02
            )

        self.save()

#  Phase 5

class ProfessorAlert(models.Model):
    """
    Generated when dept stress crosses 7.5/10 threshold.
    OR when students manually raise a stress flag.
    """
    ALERT_TYPES = [
        ('auto',   'Auto Generated'),
        ('manual', 'Student Raised'),
    ]
    STATUS_CHOICES = [
        ('pending',      'Pending'),
        ('acknowledged', 'Acknowledged'),
        ('resolved',     'Resolved'),
    ]

    department      = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="alerts"
    )
    alert_type      = models.CharField(
        max_length=10,
        choices=ALERT_TYPES,
        default='auto'
    )
    status          = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='pending'
    )
    stress_score    = models.FloatField(
        help_text="Dept stress score that triggered alert"
    )
    affected_tasks  = models.ManyToManyField(
        Task,
        blank=True,
        related_name="alerts"
    )
    students_count  = models.IntegerField(
        default=0,
        help_text="Number of students affected"
    )
    raised_by       = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="raised_alerts"
    )
    message         = models.TextField(
        blank=True,
        help_text="Auto-generated or student message"
    )
    suggestion      = models.TextField(
        blank=True,
        help_text="AI suggested action e.g. extend deadline"
    )
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    resolve_token   = models.CharField(
        max_length=64,
        blank=True,
        help_text="Unique token for professor to resolve via email link"
    )
    resolved_by_professor = models.BooleanField(
        default=False,
        help_text="True when professor clicks resolve in email"
    )
    resolved_at = models.DateTimeField(
        null=True, blank=True
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Alert: {self.department.code} — {self.stress_score}/10"
    
#  File Share Feature

class DepartmentFile(models.Model):
    """
    PDF/file uploaded by a student.
    Visible to all dept members.
    Only uploader can delete.
    """
    FILE_TYPES = [
        ('assignment', 'Assignment'),
        ('lab',        'Lab Copy'),
        ('notes',      'Notes'),
        ('other',      'Other'),
    ]

    title        = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    file         = models.FileField(
        upload_to='department_files/%Y/%m/'
    )
    file_type    = models.CharField(
        max_length=20,
        choices=FILE_TYPES,
        default='other'
    )
    uploaded_by  = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='uploaded_files'
    )
    department   = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='files'
    )
    uploaded_at  = models.DateTimeField(auto_now_add=True)
    file_size    = models.IntegerField(
        default=0,
        help_text="File size in bytes"
    )

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} — {self.department.code}"

    def file_size_display(self):
        """Human readable file size"""
        size = self.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{round(size/1024, 1)} KB"
        else:
            return f"{round(size/(1024*1024), 1)} MB"