# api/urls.py - complete updated file
from django.urls import path
from . import views
from . import auth_views

urlpatterns = [
    # ── Tasks ──
    path('tasks/',                     views.task_list),
    path('tasks/<int:pk>/',            views.task_detail),
    path('tasks/<int:pk>/approve/',    views.approve_task),
    path('tasks/<int:pk>/complete/',   views.complete_task),

    # ── Analytics & AI ──
    path('analytics/',                 views.analytics),
    path('ai-parse/',                  views.ai_parse),
    path('pdf-parse/',                 views.pdf_parse),
    path('general-roadmap/',           views.general_roadmap),
    path('exam-roadmap/',              views.exam_roadmap),
    path('recommendations/',           views.get_recommendations),
    path('user/insights/',             views.user_insights),
    path('department/analytics/',      views.department_analytics),

    # ── Alerts ──
    path('alerts/',                    views.get_alerts),
    path('alerts/raise/',              views.raise_alert),
    path('alerts/auto-check/',         views.auto_check_and_alert),
    path('alerts/<int:pk>/resolve/',   views.resolve_alert),
    path('alerts/resolve-by-professor/', views.professor_resolve_alert),

    # ── Department Files ──
    path('department/files/',          views.department_files),
    path('department/files/<int:pk>/', views.delete_department_file),

    # ── Auth ──
    path('auth/register/',             auth_views.register),
    path('auth/verify-email/',         auth_views.verify_email),
    path('auth/login/',                auth_views.login),
    path('auth/profile/',              auth_views.profile),
    path('auth/departments/',          auth_views.list_departments),
    path('auth/resend-otp/',           auth_views.resend_otp),
]