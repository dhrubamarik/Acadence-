import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api'

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
`

function Verify() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuth()
  const email     = location.state?.email || ""

  const [otp,       setOtp]       = useState("")
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [message,   setMessage]   = useState("")
  const [isError,   setIsError]   = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault(); setLoading(true); setMessage(""); setIsError(false)
    try {
      const res = await API.post("auth/verify-email/", { email, otp })
      login(res.data.user, res.data.tokens); navigate("/")
    } catch (err) {
      setMessage(err.response?.data?.error || "❌ Invalid OTP. Please try again.")
      setIsError(true)
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setResending(true); setMessage(""); setIsError(false); setOtp("")
    try {
      await API.post("auth/resend-otp/", { email })
      setMessage("✅ New OTP sent! Check your email inbox.")
    } catch (err) {
      setMessage(err.response?.data?.error || "❌ Could not resend OTP."); setIsError(true)
    }
    setResending(false)
  }

  const handleOtpChange = (e) => setOtp(e.target.value.replace(/\D/g, ""))
  const isReady = otp.length === 6

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdfa 0%, #e0f7fa 50%, #f0fdf4 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{
          background: "white", borderRadius: "24px", padding: "44px 40px",
          width: "100%", maxWidth: "420px", textAlign: "center",
          boxShadow: "0 8px 48px rgba(13,148,136,0.13)",
          border: "1px solid rgba(153,246,228,0.4)",
        }}>

          {/* Icon */}
          <div style={{
            width: "64px", height: "64px", borderRadius: "18px", margin: "0 auto 20px",
            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "30px", boxShadow: "0 6px 20px rgba(13,148,136,0.35)",
          }}>📧</div>

          <div style={{
            fontFamily: "'Lora', serif", fontSize: "24px", fontWeight: 600,
            color: "#0f2a27", marginBottom: "8px",
          }}>Verify your email</div>

          <p style={{ color: "#5e8b83", fontSize: "13.5px", marginBottom: "24px", lineHeight: "1.6" }}>
            We sent a 6-digit OTP to<br />
            <strong style={{ color: "#0d9488" }}>{email}</strong>
          </p>

          {/* Info banner */}
          <div style={{
            background: "#f0fdfa", border: "1px solid #a7f3d0", borderRadius: "12px",
            padding: "12px 16px", marginBottom: "28px",
            fontSize: "13px", color: "#0f2a27", textAlign: "left",
            display: "flex", gap: "10px", alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "16px", flexShrink: 0 }}>💡</span>
            <span>
              Check your <strong style={{ color: "#0d9488" }}>inbox</strong> for an email from Acadence.
              Also check <strong style={{ color: "#0d9488" }}>spam / junk</strong> if not visible.
            </span>
          </div>

          <form onSubmit={handleVerify}>
            {/* OTP input */}
            <div style={{ marginBottom: "8px" }}>
              <input
                type="text" inputMode="numeric" placeholder="• • • • • •"
                value={otp} onChange={handleOtpChange} maxLength={6} required
                style={{
                  width: "100%", padding: "18px",
                  border: `2px solid ${isReady ? "#0d9488" : "#c8f0ea"}`,
                  borderRadius: "14px", fontSize: "32px", textAlign: "center",
                  letterSpacing: "12px", outline: "none", boxSizing: "border-box",
                  fontWeight: "800", color: "#0d9488", background: "#f8fffe",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "border-color 0.2s",
                }}
              />
              <p style={{ marginTop: "6px", fontSize: "12px", color: "#7aada5" }}>
                {otp.length}/6 digits entered
              </p>
            </div>

            {message && (
              <div style={{
                marginBottom: "16px", padding: "11px 14px", borderRadius: "10px",
                fontSize: "13.5px", fontWeight: "500", textAlign: "left",
                background: isError ? "#fef2f2" : "#f0fdfa",
                color:      isError ? "#dc2626" : "#065f46",
                border:     `1px solid ${isError ? "#fecaca" : "#99f6e4"}`,
              }}>{message}</div>
            )}

            <button type="submit" disabled={loading || !isReady} style={{
              width: "100%", padding: "13px", marginBottom: "10px",
              background: loading || !isReady ? "#e0f2fe" : "linear-gradient(135deg, #0d9488, #06b6d4)",
              color: loading || !isReady ? "#7aada5" : "white",
              border: "none", borderRadius: "12px",
              fontSize: "15px", fontWeight: "700",
              cursor: loading || !isReady ? "not-allowed" : "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: loading || !isReady ? "none" : "0 4px 16px rgba(13,148,136,0.35)",
              transition: "all 0.2s",
            }}>
              {loading ? "⏳ Verifying..." : "✅ Verify email"}
            </button>

            <button type="button" onClick={handleResend} disabled={resending} style={{
              width: "100%", padding: "12px",
              background: "white", border: "1.5px solid #c8f0ea", borderRadius: "12px",
              color: resending ? "#7aada5" : "#0d9488",
              fontWeight: "700", cursor: resending ? "not-allowed" : "pointer",
              fontSize: "14px", fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all 0.2s", marginBottom: "24px",
            }}>
              {resending ? "⏳ Sending..." : "🔄 Resend OTP"}
            </button>
          </form>

          <div style={{ borderTop: "1px solid #e0f7f4", paddingTop: "18px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#7aada5" }}>
              Wrong email?{" "}
              <Link to="/register" style={{ color: "#0d9488", fontWeight: "700", textDecoration: "none" }}>
                Go back to Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Verify