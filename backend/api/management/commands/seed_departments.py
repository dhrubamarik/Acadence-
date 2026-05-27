# Create file: api/management/commands/seed_departments.py
# (create these folders too: api/management/__init__.py
#                            api/management/commands/__init__.py)

from django.core.management.base import BaseCommand
from api.models import Department

class Command(BaseCommand):
    help = 'Seed demo departments'

    def handle(self, *args, **kwargs):
        departments = [
            {
                "name":     "Computer Science & Engineering",
                "code":     "CSSE12",
                "join_key": "cs2026"
            },
            {
                "name":     "Mechanical Engineering",
                "code":     "MECH08",
                "join_key": "mech2026"
            },
            {
                "name":     "Business Administration",
                "code":     "BBA15",
                "join_key": "bba2026"
            },
        ]

        for dept in departments:
            obj, created = Department.objects.get_or_create(
                code=dept["code"],
                defaults={
                    "name":     dept["name"],
                    "join_key": dept["join_key"]
                }
            )
            status = "Created" if created else "Already exists"
            self.stdout.write(f"{status}: {obj.name} ({obj.code})")

        self.stdout.write(self.style.SUCCESS("✅ Departments seeded!"))