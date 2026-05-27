import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import API from '../api'

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
`

function Register() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [message,     setMessage]     = useState("")
  const [isError,     setIsError]     = useState(false)
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirmPassword: "", department_code: ""
  })

  useEffect(() => {
    API.get("auth/departments/")
      .then(res => setDepartments(res.data))
      .catch(err => console.error("Dept fetch error:", err))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage("")
    if (form.password !== form.confirmPassword) { setMessage("❌ Passwords do not match!"); setIsError(true); return }
    if (form.password.length < 6) { setMessage("❌ Password must be at least 6 characters."); setIsError(true); return }
    setLoading(true)
    try {
      await API.post("auth/register/", {
        full_name: form.full_name, email: form.email,
        password: form.password, department_code: form.department_code
      })
      navigate("/verify", { state: { email: form.email } })
    } catch (err) {
      const errors = err.response?.data
      setMessage(errors ? `❌ ${Object.values(errors).flat().join(" ")}` : "❌ Registration failed. Try again.")
      setIsError(true)
    }
    setLoading(false)
  }

  const focusStyle = (e) => e.target.style.borderColor = "#0d9488"
  const blurStyle  = (e) => e.target.style.borderColor = "#c8f0ea"

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdfa 0%, #e0f7fa 50%, #f0fdf4 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "28px 20px", fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{
          background: "white", borderRadius: "24px", padding: "44px 40px",
          width: "100%", maxWidth: "460px",
          boxShadow: "0 8px 48px rgba(13,148,136,0.13)",
          border: "1px solid rgba(153,246,228,0.4)",
        }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "18px", margin: "0 auto 16px",
              background: "linear-gradient(135deg, #0d9488, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "30px", boxShadow: "0 6px 20px rgba(13,148,136,0.35)",
            }}>🎓</div>
            <div style={{
              fontFamily: "'Lora', serif", fontSize: "26px", fontWeight: 600,
              color: "#0f2a27", letterSpacing: "-0.3px", marginBottom: "4px",
            }}>Create your account</div>
            <p style={{ color: "#5e8b83", fontSize: "13.5px" }}>Join Acadence as a student</p>
          </div>

          <form onSubmit={handleSubmit}>
            {[
              { label: "Full name",      name: "full_name",  type: "text",     placeholder: "e.g. John Doe" },
              { label: "College email",  name: "email",      type: "email",    placeholder: "you@college.edu" },
            ].map(f => (
              <div key={f.name} style={{ marginBottom: "16px" }}>
                <label style={labelSt}>{f.label}</label>
                <input type={f.type} name={f.name} placeholder={f.placeholder}
                  value={form[f.name]} onChange={handleChange} required style={inputSt}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
            ))}

            {/* Department */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelSt}>
                Department code{" "}
                <span style={{ color: "#7aada5", fontWeight: "400" }}>(optional)</span>
              </label>
              <select name="department_code" value={form.department_code}
                onChange={handleChange} style={{ ...inputSt, cursor: "pointer" }}
                onFocus={focusStyle} onBlur={blurStyle}
              >
                <option value="">— Select department —</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.code}>{dept.name} ({dept.code})</option>
                ))}
              </select>
              <div style={{
                marginTop: "8px", padding: "8px 12px",
                background: "#f0fdfa", border: "1px solid #a7f3d0",
                borderRadius: "8px", fontSize: "12px", color: "#5e8b83",
              }}>
                🏫 Demo codes:{" "}
                {["CSSE12","MECH08","BBA15"].map(c => (
                  <strong key={c} style={{ color: "#0d9488", marginRight: "6px" }}>{c}</strong>
                ))}
              </div>
            </div>

            {[
              { label: "Password",         name: "password",        placeholder: "Min 6 characters" },
              { label: "Confirm password", name: "confirmPassword", placeholder: "Repeat password" },
            ].map(f => (
              <div key={f.name} style={{ marginBottom: "16px" }}>
                <label style={labelSt}>{f.label}</label>
                <input type="password" name={f.name} placeholder={f.placeholder}
                  value={form[f.name]} onChange={handleChange} required style={inputSt}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
            ))}

            {message && (
              <div style={{
                marginBottom: "16px", padding: "11px 14px", borderRadius: "10px",
                fontSize: "13.5px", fontWeight: "500",
                background: isError ? "#fef2f2" : "#f0fdfa",
                color:      isError ? "#dc2626" : "#065f46",
                border:     `1px solid ${isError ? "#fecaca" : "#99f6e4"}`,
              }}>{message}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px", marginTop: "8px",
              background: loading ? "#a7f3d0" : "linear-gradient(135deg, #0d9488, #06b6d4)",
              color: "white", border: "none", borderRadius: "12px",
              fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: loading ? "none" : "0 4px 16px rgba(13,148,136,0.35)",
              transition: "all 0.2s",
            }}>
              {loading ? "⏳ Creating account..." : "Create account →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13.5px", color: "#7aada5" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#0d9488", fontWeight: "700", textDecoration: "none" }}>
              Login here
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

export default Register