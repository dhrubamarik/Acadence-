import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api'

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
`

function Login() {
  const navigate  = useNavigate()
  const { login } = useAuth()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [message,  setMessage]  = useState("")
  const [isError,  setIsError]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const res = await API.post("auth/login/", { email, password })
      login(res.data.user, res.data.tokens)
      navigate("/")
    } catch (err) {
      const data = err.response?.data
      if (data?.needs_verify) { navigate("/verify", { state: { email } }); return }
      setMessage(data?.error || "❌ Login failed.")
      setIsError(true)
    }
    setLoading(false)
  }

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
          width: "100%", maxWidth: "420px",
          boxShadow: "0 8px 48px rgba(13,148,136,0.13)",
          border: "1px solid rgba(153,246,228,0.4)",
        }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "18px", margin: "0 auto 16px",
              background: "linear-gradient(135deg, #0d9488, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "30px", boxShadow: "0 6px 20px rgba(13,148,136,0.35)",
            }}>🎓</div>
            <div style={{
              fontFamily: "'Lora', serif", fontSize: "26px", fontWeight: 600,
              color: "#0f2a27", letterSpacing: "-0.3px", marginBottom: "4px",
            }}>Welcome back</div>
            <p style={{ color: "#5e8b83", fontSize: "13.5px" }}>
              Sign in to your Acadence account
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label style={labelSt}>Email</label>
              <input type="email" placeholder="you@college.edu" value={email}
                onChange={e => setEmail(e.target.value)} required style={inputSt}
                onFocus={e => e.target.style.borderColor = "#0d9488"}
                onBlur={e => e.target.style.borderColor = "#c8f0ea"}
              />
            </div>
            <div style={{ marginBottom: "26px" }}>
              <label style={labelSt}>Password</label>
              <input type="password" placeholder="Your password" value={password}
                onChange={e => setPassword(e.target.value)} required style={inputSt}
                onFocus={e => e.target.style.borderColor = "#0d9488"}
                onBlur={e => e.target.style.borderColor = "#c8f0ea"}
              />
            </div>

            {message && (
              <div style={{
                marginBottom: "18px", padding: "11px 14px", borderRadius: "10px",
                fontSize: "13.5px", fontWeight: "500",
                background: isError ? "#fef2f2" : "#f0fdfa",
                color:      isError ? "#dc2626" : "#065f46",
                border:     `1px solid ${isError ? "#fecaca" : "#99f6e4"}`,
              }}>{message}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px",
              background: loading ? "#a7f3d0" : "linear-gradient(135deg, #0d9488, #06b6d4)",
              color: "white", border: "none", borderRadius: "12px",
              fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: loading ? "none" : "0 4px 16px rgba(13,148,136,0.35)",
              transition: "all 0.2s",
            }}>
              {loading ? "⏳ Signing in..." : "Sign in →"}
            </button>
          </form>

          <div style={{
            textAlign: "center", marginTop: "24px", fontSize: "13.5px", color: "#7aada5",
          }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#0d9488", fontWeight: "700", textDecoration: "none" }}>
              Register here
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

const labelSt = {
  display: "block", marginBottom: "7px",
  fontWeight: "600", color: "#0f2a27", fontSize: "13.5px",
}
const inputSt = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid #c8f0ea", borderRadius: "10px",
  fontSize: "13.5px", outline: "none", boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  background: "#f8fffe", color: "#0f2a27", transition: "border-color 0.15s",
}

export default Login