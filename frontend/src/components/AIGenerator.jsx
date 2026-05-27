// ════════════════════════════════════════════════════
//  AIGenerator.jsx  —  Polished (zero logic changes)
// ════════════════════════════════════════════════════
import { useState } from 'react'
import API from '../api'
 
export function AIGenerator({ onTasksGenerated }) {
  const [inputText, setInputText] = useState("")
  const [loading,   setLoading]   = useState(false)
  const [message,   setMessage]   = useState("")
  const [taskType,  setTaskType]  = useState("group")
 
  const handleGenerate = async () => {
    if (!inputText.trim()) { setMessage("⚠️ Please paste some text first!"); return }
    setLoading(true)
    setMessage("🤖 AI is reading your text...")
    try {
      const res = await API.post("ai-parse/", { text: inputText })
      if (!res.data || res.data.length === 0) {
        setMessage("⚠️ AI found no tasks. Try pasting a syllabus with dates.")
        setLoading(false); return
      }
      setMessage(`⏳ Found ${res.data.length} tasks. Saving as ${taskType}...`)
      let saved = 0
      for (const task of res.data) {
        try { await API.post("tasks/", { ...task, task_type: taskType }); saved++ }
        catch (err) { console.error("Failed to save task:", err.response?.data) }
      }
      setMessage(`🎉 Saved ${saved} of ${res.data.length} tasks as ${taskType}!`)
      setInputText(""); onTasksGenerated()
    } catch (error) {
      console.error("AI Error:", error.response?.data || error.message)
      setMessage("❌ Something went wrong. Check console.")
    }
    setLoading(false)
  }
 
  const typeOpts = [
    { value: "personal", icon: "🔒", label: "Personal", sub: "Only visible to you",         color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
    { value: "group",    icon: "👥", label: "Group",    sub: "Visible to your department",   color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
  ]
 
  return (
    <div style={card}>
      <div style={{ marginBottom: "20px" }}>
        <h4 style={sectionTitle}>🤖 AI Task Generator</h4>
        <p style={sectionSub}>Paste your syllabus, email, or any text with deadlines</p>
      </div>
 
      {/* Type toggle */}
      <div style={{ marginBottom: "18px" }}>
        <label style={labelSt}>Save tasks as:</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {typeOpts.map(opt => (
            <div key={opt.value} onClick={() => setTaskType(opt.value)} style={{
              padding: "11px 14px",
              border: `2px solid ${taskType === opt.value ? opt.color : "#e5f3f0"}`,
              borderRadius: "12px", cursor: "pointer",
              background: taskType === opt.value ? opt.bg : "#fafffe",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span style={{ fontSize: "20px" }}>{opt.icon}</span>
              <div>
                <div style={{ fontWeight: "600", fontSize: "13px", color: taskType === opt.value ? opt.color : "#0f2a27" }}>{opt.label}</div>
                <div style={{ fontSize: "11px", color: "#7aada5" }}>{opt.sub}</div>
              </div>
              {taskType === opt.value && (
                <div style={{
                  marginLeft: "auto", width: "18px", height: "18px", borderRadius: "50%",
                  background: opt.color, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: "10px", fontWeight: "700", flexShrink: 0,
                }}>✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
 
      <textarea
        rows={5}
        placeholder="e.g. Math Final Exam on May 15th, History Essay due April 20th..."
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        style={{
          width: "100%", padding: "12px 14px",
          border: "1.5px solid #c8f0ea", borderRadius: "10px",
          fontSize: "14px", resize: "vertical", outline: "none",
          boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans', sans-serif",
          background: "#f8fffe", color: "#0f2a27",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "#0d9488"}
        onBlur={e => e.target.style.borderColor = "#c8f0ea"}
      />
 
      <button onClick={handleGenerate} disabled={loading} style={{
        marginTop: "12px", width: "100%", padding: "13px",
        background: loading ? "#b2dfdb" : taskType === "group"
          ? "linear-gradient(135deg, #0d9488, #14b8a6)"
          : "linear-gradient(135deg, #6366f1, #8b5cf6)",
        color: "white", border: "none", borderRadius: "10px",
        fontSize: "14.5px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxShadow: loading ? "none" : "0 4px 16px rgba(13,148,136,0.3)",
        transition: "all 0.2s",
      }}>
        {loading ? "⏳ Processing..." : taskType === "group" ? "👥 Generate Group Tasks" : "🔒 Generate Personal Tasks"}
      </button>
 
      {message && (
        <div style={{
          marginTop: "12px", padding: "10px 14px", borderRadius: "10px",
          background: message.startsWith("❌") || message.startsWith("⚠️") ? "#fef2f2" : "#f0fdfa",
          color:      message.startsWith("❌") || message.startsWith("⚠️") ? "#dc2626" : "#0d7a7a",
          border:     `1px solid ${message.startsWith("❌") || message.startsWith("⚠️") ? "#fecaca" : "#99f6e4"}`,
          fontSize: "13.5px", fontWeight: "500",
        }}>
          {message}
        </div>
      )}
    </div>
  )
}
 
export default AIGenerator
const card = {
  background: "#ffffff",
  border: "1px solid rgba(13,148,136,0.12)",
  borderRadius: "18px",
  padding: "26px",
  marginBottom: "24px",
  boxShadow: "0 4px 20px rgba(13,148,136,0.07)",
}
 
const sectionTitle = {
  fontSize: "16px", fontWeight: "700",
  color: "#0f2a27", fontFamily: "'Lora',serif",
}
 
const sectionSub = {
  color: "#7aada5", fontSize: "13px", marginTop: "4px",
}
 
const labelSt = {
  display: "block", marginBottom: "7px",
  fontWeight: "600", color: "#0f2a27", fontSize: "13.5px",
}
 
const inputSt = {
  width: "100%", padding: "10px 14px",
  border: "1.5px solid #c8f0ea", borderRadius: "9px",
  fontSize: "13.5px", outline: "none",
  boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
  background: "#f8fffe", color: "#0f2a27",
  transition: "border-color 0.15s",
}
