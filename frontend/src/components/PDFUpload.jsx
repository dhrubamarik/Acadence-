// PDFUpload.jsx - Add task type selection
import { useState } from 'react'
import API from '../api'

//  PDFUpload.jsx  —  Polished (zero logic changes)
// ════════════════════════════════════════════════════
export function PDFUpload({ onTasksGenerated }) {
  const [file,     setFile]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [message,  setMessage]  = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [taskType, setTaskType] = useState("group")
 
  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && selected.type === "application/pdf") {
      setFile(selected); setMessage(`✅ Selected: ${selected.name}`)
    } else { setMessage("❌ Please select a PDF file only."); setFile(null) }
  }
 
  const handleUpload = async () => {
    if (!file) { setMessage("⚠️ Please select a PDF file first!"); return }
    setLoading(true); setMessage("🔍 Reading PDF and extracting tasks...")
    const formData = new FormData(); formData.append('file', file)
    try {
      const res = await API.post("pdf-parse/", formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const tasks = res.data
      if (tasks.error) { setMessage(`❌ ${tasks.error}`); setLoading(false); return }
      setMessage(`⏳ Found ${tasks.length} tasks. Saving as ${taskType}...`)
      let saved = 0
      for (const task of tasks) {
        try { await API.post("tasks/", { ...task, task_type: taskType }); saved++ }
        catch (err) { console.error("Failed to save:", err.response?.data) }
      }
      setMessage(`🎉 Saved ${saved} of ${tasks.length} tasks as ${taskType}!`)
      setFile(null); onTasksGenerated()
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.error || "Upload failed."}`)
    }
    setLoading(false)
  }
 
  const typeOpts = [
    { value: "personal", icon: "🔒", label: "Personal", sub: "Only visible to you",       color: "#6366f1", bg: "#eef2ff" },
    { value: "group",    icon: "👥", label: "Group",    sub: "Visible to department",      color: "#0d9488", bg: "#f0fdfa" },
  ]
 
  return (
    <div>
      <div style={{ marginBottom: "18px" }}>
        <label style={labelSt}>Save extracted tasks as:</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          {typeOpts.map(opt => (
            <div key={opt.value} onClick={() => setTaskType(opt.value)} style={{
              padding: "11px 14px",
              border: `2px solid ${taskType === opt.value ? opt.color : "#e5f3f0"}`,
              borderRadius: "12px", cursor: "pointer",
              background: taskType === opt.value ? opt.bg : "#fafffe",
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span style={{ fontSize: "20px" }}>{opt.icon}</span>
              <div>
                <div style={{ fontWeight: "600", fontSize: "13px", color: taskType === opt.value ? opt.color : "#0f2a27" }}>{opt.label}</div>
                <div style={{ fontSize: "11px", color: "#7aada5" }}>{opt.sub}</div>
              </div>
              {taskType === opt.value && (
                <div style={{ marginLeft: "auto", width: "18px", height: "18px", borderRadius: "50%", background: opt.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", fontWeight: "700", flexShrink: 0 }}>✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
 
      {/* Drop Zone */}
      <div
        style={{
          border: `2px dashed ${dragOver ? "#0d9488" : "#a7f3d0"}`,
          borderRadius: "18px", padding: "36px 24px", textAlign: "center",
          background: dragOver ? "#f0fdfa" : "#f8fffe",
          transition: "all 0.2s", marginBottom: "24px",
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault(); setDragOver(false)
          const dropped = e.dataTransfer.files[0]
          if (dropped?.type === "application/pdf") { setFile(dropped); setMessage(`✅ Dropped: ${dropped.name}`) }
          else setMessage("❌ Only PDF files accepted.")
        }}
      >
        <div style={{ fontSize: "52px", marginBottom: "12px" }}>📄</div>
        <h4 style={{ color: "#0d9488", marginBottom: "8px", fontFamily: "'Lora',serif", fontWeight: 600 }}>Upload Syllabus PDF</h4>
        <p style={{ color: "#7aada5", fontSize: "13.5px", marginBottom: "22px" }}>Drag & drop your syllabus here, or click to browse</p>
 
        <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: "none" }} id="pdf-input" />
        <label htmlFor="pdf-input" style={{
          background: "linear-gradient(135deg, #0d9488, #14b8a6)",
          color: "white", padding: "10px 26px", borderRadius: "8px",
          cursor: "pointer", fontSize: "13.5px", fontWeight: "700",
          boxShadow: "0 4px 14px rgba(13,148,136,0.3)",
        }}>
          📁 Browse PDF
        </label>
 
        {file && (
          <button onClick={handleUpload} disabled={loading} style={{
            marginLeft: "12px",
            background: loading ? "#b2dfdb" : taskType === "group" ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "white", border: "none", padding: "10px 26px",
            borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer",
            fontSize: "13.5px", fontWeight: "700", fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}>
            {loading ? "⏳ Processing..." : taskType === "group" ? "👥 Extract Group Tasks" : "🔒 Extract Personal Tasks"}
          </button>
        )}
 
        {message && (
          <div style={{
            marginTop: "18px", padding: "10px 16px",
            background: message.startsWith("❌") ? "#fef2f2" : "#f0fdfa",
            color:      message.startsWith("❌") ? "#dc2626" : "#065f46",
            border:     `1px solid ${message.startsWith("❌") ? "#fecaca" : "#99f6e4"}`,
            borderRadius: "10px", fontSize: "13.5px", fontWeight: "500",
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
export default PDFUpload
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
