import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api'

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
`

/* ── Temporary debug OTP popup ──
   Shows the OTP inline until email delivery is working in production.
   Reads the code from wherever the backend hands it back (see notes at
   bottom of this file) — remove this block once SMTP/email is fixed. */
function DebugOtpBanner({ otp, onDismiss, onUse }) {
  const [copied, setCopied] = useState(false)
  if (!otp) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(otp)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
      border: "1.5px solid #fbbf24",
      borderRadius: "14px",
      padding: "14px 16px",
      marginBottom: "22px",
      textAlign: "left",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
        <span style={{ fontSize: "18px", flexShrink: 0 }}>🚧</span>
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: "12.5px", color: "#92400e" }}>Temporary debug mode</strong>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#b45309", lineHeight: "1.5" }}>
            Email delivery isn't live yet, so your code is shown here for now.
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#b45309", fontSize: "14px", padding: "2px 4px", lineHeight: 1,
          }}
        >✕</button>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        background: "white", border: "1px solid #fde68a", borderRadius: "10px",
        padding: "10px 14px",
      }}>
        <span style={{
          flex: 1, fontSize: "22px", fontWeight: "800", letterSpacing: "6px",
          color: "#92400e", fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>{otp}</span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: copied ? "#0d9488" : "#fef3c7",
            color: copied ? "white" : "#92400e",
            border: "1px solid #fbbf24", borderRadius: "8px",
            padding: "6px 10px", fontSize: "11.5px", fontWeight: "700",
            cursor: "pointer", whiteSpace: "nowrap",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: "all 0.15s",
          }}
        >{copied ? "✓ Copied" : "Copy"}</button>
        {onUse && (
          <button
            type="button"
            onClick={onUse}
            style={{
              background: "#0d9488", color: "white",
              border: "none", borderRadius: "8px",
              padding: "6px 10px", fontSize: "11.5px", fontWeight: "700",
              cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >Fill in</button>
        )}
      </div>
    </div>
  )
}

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

  // Debug OTP, if the backend included it in the response.
  // Picks it up from Register.jsx's navigate state first (e.g.
  // navigate("/verify", { state: { email, otp: res.data.debug_otp } })),
  // then falls back to updating from the resend-otp response below.
  const [debugOtp, setDebugOtp] = useState(location.state?.otp || null)

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
      const res = await API.post("auth/resend-otp/", { email })
      setMessage("✅ New OTP sent! Check your email inbox.")
      // If the backend echoes the OTP back (debug/deployment stopgap),
      // refresh the banner with the new code.
      if (res.data?.debug_otp) setDebugOtp(res.data.debug_otp)
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

          <DebugOtpBanner
            otp={debugOtp}
            onDismiss={() => setDebugOtp(null)}
            onUse={() => setOtp(debugOtp)}
          />

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