# api/admin.py - Replace with this

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Task, Department

# Register custom user properly
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ['email', 'username', 'department', 'is_verified']
    list_filter   = ['is_verified', 'department']
    
    # Add department and is_verified to admin form
    fieldsets = UserAdmin.fieldsets + (
        ('Acadence', {
            'fields': ('department', 'is_verified', 'otp')
        }),
    )

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'join_key']

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'deadline', 'priority', 'task_type', 'is_verified']