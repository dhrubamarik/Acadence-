// TaskForm.jsx - Add Personal/Group toggle
import { useState } from 'react'
import API from '../api'

export function TaskForm({ fetchTasks, fetchAnalytics }) {
  const [title,    setTitle]    = useState("")
  const [deadline, setDeadline] = useState("")
  const [priority, setPriority] = useState("medium")
  const [course,   setCourse]   = useState("")
  const [taskType, setTaskType] = useState("personal")
  const [message,  setMessage]  = useState("")
 
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim())  { setMessage("❌ Please enter a task title."); return }
    if (!deadline)      { setMessage("❌ Please select a deadline."); return }
    const taskData = { title: title.trim(), deadline, priority, course: course.trim() || "General", task_type: taskType }
    try {
      await API.post("tasks/", taskData)
      setMessage(`✅ Task added as ${taskType} task!`)
      setTitle(""); setDeadline(""); setPriority("medium"); setCourse(""); setTaskType("personal")
      fetchTasks(); fetchAnalytics()
    } catch (error) {
      console.error("Save error:", error.response?.data); setMessage("❌ Failed to save task.")
    }
  }
 
  const priorityOptions = [
    { value: "high",   label: "🔴 High Priority",  color: "#dc2626" },
    { value: "medium", label: "🟡 Medium Priority", color: "#d97706" },
    { value: "low",    label: "🟢 Low Priority",    color: "#059669" },
  ]
  const selectedConfig = priorityOptions.find(p => p.value === priority)
 
  const typeOpts = [
    { value: "personal", icon: "🔒", label: "Personal", sub: "Only you can see this",        color: "#6366f1", bg: "#eef2ff" },
    { value: "group",    icon: "👥", label: "Group",    sub: "Visible to your department",   color: "#0d9488", bg: "#f0fdfa" },
  ]
 
  return (
    <div style={card}>
      <h4 style={{ ...sectionTitle, marginBottom: "20px" }}>➕ Add Task Manually</h4>
 
      {/* Task Type */}
      <div style={{ marginBottom: "20px" }}>
        <label style={labelSt}>Task Type</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {typeOpts.map(opt => (
            <div key={opt.value} onClick={() => setTaskType(opt.value)} style={{
              padding: "13px 16px",
              border: `2px solid ${taskType === opt.value ? opt.color : "#e5f3f0"}`,
              borderRadius: "12px", cursor: "pointer",
              background: taskType === opt.value ? opt.bg : "#fafffe",
              transition: "all 0.15s",
            }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{opt.icon}</div>
              <div style={{ fontWeight: "600", fontSize: "13.5px", color: taskType === opt.value ? opt.color : "#0f2a27" }}>{opt.label}</div>
              <div style={{ fontSize: "11px", color: "#7aada5", marginTop: "2px" }}>{opt.sub}</div>
            </div>
          ))}
        </div>
      </div>
 
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={labelSt}>Task Title *</label>
          <input type="text" placeholder="e.g. Math Final Exam" value={title} onChange={e => setTitle(e.target.value)} style={inputSt} onFocus={e => e.target.style.borderColor="#0d9488"} onBlur={e => e.target.style.borderColor="#c8f0ea"} />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={labelSt}>Deadline *</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputSt} onFocus={e => e.target.style.borderColor="#0d9488"} onBlur={e => e.target.style.borderColor="#c8f0ea"} />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={labelSt}>Priority *</label>
          <select value={priority} onChange={e => setPriority(e.target.value)} style={{
            ...inputSt, border: `2px solid ${selectedConfig?.color || "#c8f0ea"}`,
            color: selectedConfig?.color, fontWeight: "600",
          }}>
            {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: "22px" }}>
          <label style={labelSt}>Course Name</label>
          <input type="text" placeholder="e.g. Mathematics (optional)" value={course} onChange={e => setCourse(e.target.value)} style={inputSt} onFocus={e => e.target.style.borderColor="#0d9488"} onBlur={e => e.target.style.borderColor="#c8f0ea"} />
        </div>
        <button type="submit" style={{
          width: "100%", padding: "13px",
          background: taskType === "group"
            ? "linear-gradient(135deg,#0d9488,#14b8a6)"
            : "linear-gradient(135deg,#6366f1,#8b5cf6)",
          color: "white", border: "none", borderRadius: "10px",
          fontSize: "14.5px", fontWeight: "700", cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          boxShadow: "0 4px 16px rgba(13,148,136,0.25)",
        }}>
          {taskType === "group" ? "👥 Add Group Task" : "🔒 Add Personal Task"}
        </button>
        {message && (
          <div style={{
            marginTop: "12px", padding: "10px 14px",
            background: message.startsWith("❌") ? "#fef2f2" : "#f0fdfa",
            color:      message.startsWith("❌") ? "#dc2626" : "#065f46",
            border:     `1px solid ${message.startsWith("❌") ? "#fecaca" : "#99f6e4"}`,
            borderRadius: "10px", fontSize: "13.5px",
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}
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

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "600",
  color: "#374151",
  fontSize: "14px"
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit"
}

export default TaskForm