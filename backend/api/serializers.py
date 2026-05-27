
from rest_framework import serializers
from .models import Task, User, Department, TaskCompletion


class DepartmentSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()

    class Meta:
        model  = Department
        fields = ['id', 'name', 'code', 'student_count']

    def get_student_count(self, obj):
        return obj.students.count()


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'username', 'full_name',
            'department', 'department_name',
            'is_verified'
        ]

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None


# serializers.py - Update RegisterSerializer

class RegisterSerializer(serializers.ModelSerializer):
    password        = serializers.CharField(write_only=True, min_length=6)
    department_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    full_name       = serializers.CharField(required=True)

    class Meta:
        model  = User
        fields = [
            'email',
            'full_name',
            'password',
            'department_code'
        ]
        # 👇 This removes username from required fields
        extra_kwargs = {
            'username': {'required': False}
        }

    def create(self, validated_data):
        dept_code = validated_data.pop('department_code', None)
        password  = validated_data.pop('password')
        full_name = validated_data.pop('full_name', '')

        # Auto generate username from email
        email    = validated_data.get('email', '')
        username = email.split('@')[0]

        # Make username unique if already taken
        base_username = username
        counter       = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Build user
        user           = User(**validated_data)
        user.username  = username    # auto generated ✅
        user.full_name = full_name   # stores "John Doe" ✅
        user.set_password(password)

        # Link department
        if dept_code:
            try:
                dept            = Department.objects.get(code=dept_code)
                user.department = dept
            except Department.DoesNotExist:
                raise serializers.ValidationError(
                    {"department_code": "Invalid department code."}
                )

        user.save()
        return user


class TaskSerializer(serializers.ModelSerializer):
    approval_count       = serializers.SerializerMethodField()
    owner_email          = serializers.SerializerMethodField()
    user_approved        = serializers.SerializerMethodField()
    is_completed_by_user = serializers.SerializerMethodField()

    class Meta:
        model  = Task
        fields = [
            'id', 'title', 'deadline', 'priority',
            'course', 'task_type', 'is_verified',
            'approval_count', 'owner_email', 'user_approved',
            'is_completed_by_user',   # ← comma added
            'owner', 'department'
        ]
        read_only_fields = ['owner', 'department', 'is_verified']

    def get_approval_count(self, obj):
        return obj.approved_by.count()

    def get_owner_email(self, obj):
        return obj.owner.email if obj.owner else None

    def get_user_approved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.approved_by.filter(id=request.user.id).exists()
        return False

    def get_is_completed_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.completions.filter(user=request.user).exists()
        return False