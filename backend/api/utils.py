# api/utils.py - Phase 2: Personalized Stress Scoring
# Changes: calculate_stress now accepts optional user parameter
# detect_clashes unchanged

from collections import defaultdict
from datetime import datetime, date
import re

PRIORITY_MAP = {
    "high":   10,
    "medium":  5,
    "low":     2
}

# ── Phase 2: Personalized stress calculation ───────────────
def calculate_stress(tasks, user=None):
    """
    Phase 1 (no user): simple priority sum — same as before
    Phase 2 (with user): multiplies by learned UserProfile weights

    user param is optional so nothing breaks if called without it
    """
    stress_map = defaultdict(float)

    # Load user profile if user provided
    profile = None
    if user:
        try:
            from .models import UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=user)
        except Exception:
            profile = None

    today = date.today()

    for task in tasks:
        date_str   = task.deadline.strftime("%Y-%m-%d")
        base_score = PRIORITY_MAP.get(task.priority, 3)

        if profile and profile.tasks_completed >= 3:
            # ── Personalized path ─────────────────────────

            # 1. Subject multiplier
            # "Math tasks take you 40% longer → stress them more"
            subject_mult = profile.subject_multipliers.get(
                task.course, 1.0
            )
            subject_mult = max(0.5, min(2.5, subject_mult))

            # 2. Procrastination factor
            # High procrastinator + close deadline = spike stress earlier
            days_until = (task.deadline - today).days
            if days_until < 0:
                days_until = 0

            if profile.procrastination_score > 0.6:
                # Warn earlier — compress urgency window
                urgency = _urgency_factor(days_until, window=10)
            elif profile.procrastination_score < 0.3:
                # Starts early — relax urgency slightly
                urgency = _urgency_factor(days_until, window=5)
            else:
                urgency = _urgency_factor(days_until, window=7)

            # 3. Difficulty modifier from past completions
            # If user historically rates this course hard → boost score
            avg_diff = profile.avg_difficulty_given  # 1.0–5.0
            diff_modifier = 0.6 + (avg_diff / 5.0) * 0.8  # 0.6–1.4

            # 4. Final personalized score
            personalized = (
                base_score
                * subject_mult
                * urgency
                * diff_modifier
            )

            # Cap at 10
            stress_map[date_str] += min(round(personalized, 2), 10)

        else:
            # ── Generic path (Phase 1 behavior, unchanged) ─
            # Used when user has < 3 completions
            # Keeps system working for new users
            stress_map[date_str] += base_score

    # Round all values to 1 decimal
    return {k: min(round(v, 1), 10) for k, v in stress_map.items()}


def _urgency_factor(days_until, window=7):
    """
    Returns 0.5 → 2.0 based on how close the deadline is.
    window = how many days before deadline urgency kicks in hard.

    > window days away  → 0.5  (low urgency)
    = window days away  → 1.0  (medium)
    0 days away         → 2.0  (maximum urgency)
    """
    if days_until <= 0:
        return 2.0
    if days_until >= window * 2:
        return 0.5
    # Linear scale: window*2 days → 0.5, 0 days → 2.0
    factor = 2.0 - (days_until / (window * 2)) * 1.5
    return round(max(0.5, min(2.0, factor)), 2)


# ── detect_clashes — UNCHANGED ─────────────────────────────
def detect_clashes(tasks):
    clashes = []
    tasks   = sorted(tasks, key=lambda x: x.deadline)

    for i in range(len(tasks)):
        for j in range(i + 1, len(tasks)):
            diff = abs((tasks[j].deadline - tasks[i].deadline).days)

            if diff <= 2:
                if (
                    PRIORITY_MAP.get(tasks[i].priority, 3) >= 5 and
                    PRIORITY_MAP.get(tasks[j].priority, 3) >= 5
                ):
                    clashes.append({
                        "task1":      tasks[i].title,
                        "task2":      tasks[j].title,
                        "days_apart": diff
                    })

    return clashes


# ── fix_year — UNCHANGED ───────────────────────────────────
def fix_year(date_str):
    if not date_str:
        return datetime.now().strftime("%Y-%m-%d")

    if re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
        return date_str

    try:
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        return date_str
    except Exception:
        return datetime.now().strftime("%Y-%m-%d")


# ── weight_to_priority — UNCHANGED ────────────────────────
def weight_to_priority(weight):
    weight = int(weight)
    if weight >= 8:
        return "high"
    elif weight >= 5:
        return "medium"
    else:
        return "low"