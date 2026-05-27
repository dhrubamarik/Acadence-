# api/auth_views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from .models import User, Department
from .serializers import RegisterSerializer, UserSerializer, DepartmentSerializer


# ── Helper: Generate JWT Tokens ────────────────────────────
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


# ── Helper: Send Beautiful OTP Email ──────────────────────
def send_otp_email(user_email, otp):
    subject = "🎓 AuraPlan - Verify Your Email"

    html_message = f"""
    <div style="font-family: Inter, Arial, sans-serif; 
                max-width: 480px; 
                margin: 0 auto; 
                padding: 32px; 
                background: #f8f9ff; 
                border-radius: 16px;">

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366f1; 
                       font-size: 28px; 
                       margin: 0;">
                🎓 AuraPlan
            </h1>
            <p style="color: #9ca3af; 
                      margin: 4px 0 0; 
                      font-size: 14px;">
                AI Academic Stress Forecaster
            </p>
        </div>

        <!-- Card -->
        <div style="background: white; 
                    border-radius: 12px; 
                    padding: 28px; 
                    text-align: center; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

            <h2 style="color: #1f2937; margin: 0 0 8px;">
                Verify Your Email
            </h2>
            <p style="color: #6b7280; 
                      margin: 0 0 24px; 
                      font-size: 14px;">
                Use this OTP to complete your AuraPlan registration.
            </p>

            <!-- OTP Box -->
            <div style="background: #f0f4ff; 
                        border: 2px dashed #6366f1; 
                        border-radius: 12px; 
                        padding: 24px; 
                        margin: 0 0 24px;">
                <p style="margin: 0 0 6px; 
                           font-size: 11px; 
                           color: #9ca3af; 
                           text-transform: uppercase; 
                           letter-spacing: 3px;">
                    Your OTP Code
                </p>
                <p style="margin: 0; 
                           font-size: 46px; 
                           font-weight: 800; 
                           color: #6366f1; 
                           letter-spacing: 14px;">
                    {otp}
                </p>
            </div>

            <!-- Warning -->
            <div style="background: #fffbeb; 
                        border: 1px solid #fde68a; 
                        border-radius: 8px; 
                        padding: 12px; 
                        margin-bottom: 16px;">
                <p style="margin: 0; 
                           font-size: 13px; 
                           color: #d97706;">
                    ⏰ Valid for <strong>10 minutes</strong> only
                </p>
            </div>

            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                🔒 Never share this OTP with anyone
            </p>
        </div>

        <!-- Footer -->
        <p style="text-align: center; 
                  color: #d1d5db; 
                  font-size: 12px; 
                  margin-top: 20px;">
            If you didn't register on AuraPlan, ignore this email.
        </p>
    </div>
    """

    plain_message = (
        f"Your AuraPlan OTP is: {otp}\n\n"
        f"Valid for 10 minutes.\n"
        f"Never share this with anyone."
    )

    try:
        send_mail(
            subject        = subject,
            message        = plain_message,
            from_email     = None,          # uses DEFAULT_FROM_EMAIL
            recipient_list = [user_email],
            html_message   = html_message,
            fail_silently  = False,
        )
        print(f"✅ OTP email sent to {user_email}")
        return True

    except Exception as e:
        print(f"❌ Email send FAILED: {e}")
        return False


# ── REGISTER ───────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    print("=== REGISTER REQUEST DATA ===")
    print(request.data)
    print("=============================")
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
         # 🔍 See exactly what error is occurring
        print("=== SERIALIZER ERRORS ===")
        print(serializer.errors)
        print("=========================")
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    user = serializer.save()
    otp  = user.generate_otp()

    # Always print to terminal as backup
    print(f"=== OTP for {user.email}: {otp} ===")

    # Send real email
    email_sent = send_otp_email(user.email, otp)

    return Response({
        "message":    "Registration successful! Check your email for OTP.",
        "email":      user.email,
        "email_sent": email_sent   # frontend can warn if email failed
    }, status=status.HTTP_201_CREATED)


# ── VERIFY EMAIL ───────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    email = request.data.get("email", "").strip()
    otp   = request.data.get("otp",   "").strip()

    if not email or not otp:
        return Response(
            {"error": "Email and OTP are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"error": "No account found with this email."},
            status=status.HTTP_404_NOT_FOUND
        )

    # Already verified
    if user.is_verified:
        tokens = get_tokens_for_user(user)
        return Response({
            "message": "Already verified! Logging you in.",
            "tokens":  tokens,
            "user":    UserSerializer(user).data
        })

    # Wrong OTP
    if user.otp != otp:
        return Response(
            {"error": "Invalid OTP. Please check your email and try again."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ✅ Correct OTP - verify user
    user.is_verified = True
    user.otp         = ""
    user.save()

    tokens = get_tokens_for_user(user)
    return Response({
        "message": "✅ Email verified! Welcome to ACADENCE.",
        "tokens":  tokens,
        "user":    UserSerializer(user).data
    })


# ── LOGIN ──────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email    = request.data.get("email",    "").strip()
    password = request.data.get("password", "").strip()

    if not email or not password:
        return Response(
            {"error": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Django auth uses username field internally
    # Our USERNAME_FIELD = 'email' so pass email as username
    user = authenticate(request, username=email, password=password)

    if not user:
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Not verified - resend OTP
    if not user.is_verified:
        otp = user.generate_otp()

        print(f"=== RESENT OTP for {user.email}: {otp} ===")
        send_otp_email(user.email, otp)

        return Response({
            "error":        "Email not verified. A new OTP has been sent.",
            "needs_verify": True,
            "email":        email
        }, status=status.HTTP_403_FORBIDDEN)

    # ✅ All good - return tokens
    tokens = get_tokens_for_user(user)
    return Response({
        "message": "Login successful!",
        "tokens":  tokens,
        "user":    UserSerializer(user).data
    })


# ── RESEND OTP ─────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request):
    email = request.data.get("email", "").strip()

    if not email:
        return Response(
            {"error": "Email is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"error": "No account found with this email."},
            status=status.HTTP_404_NOT_FOUND
        )

    if user.is_verified:
        return Response(
            {"error": "This account is already verified."},
            status=status.HTTP_400_BAD_REQUEST
        )

    otp = user.generate_otp()
    print(f"=== RESENT OTP for {user.email}: {otp} ===")
    email_sent = send_otp_email(user.email, otp)

    return Response({
        "message":    "New OTP sent to your email!",
        "email_sent": email_sent
    })


# ── PROFILE ────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    return Response(UserSerializer(request.user).data)


# ── LIST DEPARTMENTS ───────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def list_departments(request):
    departments = Department.objects.all()
    return Response(
        DepartmentSerializer(departments, many=True).data
    )