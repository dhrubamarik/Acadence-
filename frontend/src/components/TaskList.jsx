// TaskList.jsx - Phase 1: Add completion tracking
// Only additions: completeTask state + modal + button
// Zero existing logic changed

import { useState } from 'react'
import API from '../api'

export function TaskList({ tasks, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [approving, setApproving] = useState(null)
  const [message, setMessage] = useState("")

  // ── Phase 1: New state (additions only) ───────────────
  const [completingTask, setCompletingTask] = useState(null)  // task being completed
  const [completionForm, setCompletionForm] = useState({
    actual_hours: "",
    difficulty_rating: 3,
    notes: ""
  })
  const [submittingDone, setSubmittingDone] = useState(false)
     // track locally

  const priorityConfig = {
    high: { border: "#ef4444", badge: "#fef2f2", text: "#dc2626", label: "🔴 HIGH", dot: "#ef4444" },
    medium: { border: "#f59e0b", badge: "#fffbeb", text: "#d97706", label: "🟡 MEDIUM", dot: "#f59e0b" },
    low: { border: "#0d9488", badge: "#f0fdfa", text: "#0d7a7a", label: "🟢 LOW", dot: "#0d9488" },
  }

  // ── Existing handlers (unchanged) ─────────────────────
  const handleDelete = async (task) => {
    if (confirmDelete !== task.id) { setConfirmDelete(task.id); return }
    try {
      await API.delete(`tasks/${task.id}/`)
      setConfirmDelete(null); setMessage("✅ Task deleted."); onDelete()
    } catch (err) {
      const errData = err.response?.data
      if (errData?.needs_delete_approval) {
        setMessage(`🔒 Cannot delete: This group task has ${errData.approval_count} approval(s). Group tasks with approvals are protected.`)
      } else { setMessage(errData?.error || "❌ Could not delete task.") }
      setConfirmDelete(null)
    }
  }

  const handleApprove = async (task) => {
    setApproving(task.id)
    try {
      const res = await API.post(`tasks/${task.id}/approve/`)
      setMessage(res.data.action === "added"
        ? `✅ Approved! (${res.data.approval_count}/5 approvals)`
        : `↩️ Approval removed. (${res.data.approval_count}/5 approvals)`)
      onDelete()
    } catch (err) { setMessage(err.response?.data?.error || "❌ Could not approve.") }
    setApproving(null)
  }

  // ── Phase 1: New handler ───────────────────────────────
  const handleCompleteSubmit = async () => {
    if (!completingTask) return
    if (!completionForm.actual_hours) {
      setMessage("⚠️ Please enter how many hours it took.")
      return
    }

    setSubmittingDone(true)
    try {
      const res = await API.post(`tasks/${completingTask.id}/complete/`, {
        actual_hours: parseFloat(completionForm.actual_hours),
        difficulty_rating: completionForm.difficulty_rating,
        notes: completionForm.notes,
      })

      setCompletingTask(null)
      setCompletionForm({ actual_hours: "", difficulty_rating: 3, notes: "" })
      setMessage(
        `🎉 "${completingTask.title}" marked complete! ` +
        `Total completed: ${res.data.tasks_completed}`
      )
      onDelete()
    } catch (err) {
      setMessage(err.response?.data?.error || "❌ Could not mark complete.")
    }
    setSubmittingDone(false)
  }

  if (tasks.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "52px",
        background: "#f8fffe",
        border: "2px dashed #a7f3d0",
        borderRadius: "18px", color: "#7aada5", marginTop: "20px",
      }}>
        <p style={{ fontSize: "52px" }}>📭</p>
        <p style={{ fontSize: "18px", fontWeight: "700", color: "#0f2a27", marginTop: "12px" }}>No tasks yet!</p>
        <p style={{ fontSize: "14px", marginTop: "4px" }}>Use the AI Generator or Add Task form.</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h2 style={{ marginBottom: "18px", fontFamily: "'Lora',serif", color: "#0f2a27", fontWeight: 600 }}>
        📋 Your Tasks
        <span style={{
          marginLeft: "10px", fontSize: "13px",
          background: "linear-gradient(135deg,#0d9488,#14b8a6)",
          color: "white", padding: "3px 12px", borderRadius: "999px",
        }}>
          {tasks.length}
        </span>
      </h2>

      {message && (
        <div style={{
          marginBottom: "16px", padding: "12px 16px",
          background: message.startsWith("❌") || message.startsWith("🔒") || message.startsWith("⚠️")
            ? "#fef2f2" : "#f0fdfa",
          color: message.startsWith("❌") || message.startsWith("🔒") || message.startsWith("⚠️")
            ? "#dc2626" : "#065f46",
          border: `1px solid ${message.startsWith("❌") || message.startsWith("🔒") || message.startsWith("⚠️")
            ? "#fecaca" : "#99f6e4"
            }`,
          borderRadius: "12px", fontSize: "13.5px", fontWeight: "500",
        }}>
          {message}
          <button onClick={() => setMessage("")} style={{
            float: "right", background: "none", border: "none",
            cursor: "pointer", color: "inherit", fontWeight: "700"
          }}>✕</button>
        </div>
      )}

      {tasks.map(task => {
        const config = priorityConfig[task.priority] || priorityConfig.low
        const isUnknownDate = task.deadline === "2026-12-31"
        const isGroup = task.task_type === "group"
        const approvalCount = task.approval_count || 0
        const isVerified = task.is_verified
        const userApproved = task.is_approved_by_user
        const isConfirming = confirmDelete === task.id
        const isApproving = approving === task.id
        const isCompleted = task.is_completed_by_user // ← Phase 1

        return (
          <div key={task.id} style={{
            border: `1.5px solid ${isCompleted ? "#0d9488" :
              isVerified ? "#0d9488" :
                config.border + "55"
              }`,
            borderRadius: "14px", padding: "18px 20px", marginBottom: "12px",
            background: isCompleted ? "#f0fdfa" : "#ffffff",
            boxShadow: "0 2px 12px rgba(13,148,136,0.06)",
            transition: "box-shadow 0.2s, transform 0.2s",
            opacity: isCompleted ? 0.75 : 1,
          }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(13,148,136,0.12)"
              e.currentTarget.style.transform = "translateY(-1px)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,148,136,0.06)"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                {/* Title row — unchanged + completed badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "7px" }}>
                  <h5 style={{
                    margin: 0, fontSize: "16px", color: "#0f2a27", fontWeight: "700",
                    textDecoration: isCompleted ? "line-through" : "none",
                    color: isCompleted ? "#7aada5" : "#0f2a27"
                  }}>
                    {task.title}
                  </h5>
                  <span style={{
                    fontSize: "11px", padding: "2px 9px", borderRadius: "999px", fontWeight: "600",
                    background: isGroup ? "#f0fdfa" : "#eef2ff",
                    color: isGroup ? "#0d9488" : "#6366f1",
                    border: `1px solid ${isGroup ? "#99f6e4" : "#c7d2fe"}`,
                  }}>
                    {isGroup ? "👥 Group" : "🔒 Personal"}
                  </span>
                  {isVerified && (
                    <span style={{
                      fontSize: "11px", padding: "2px 10px", borderRadius: "999px", fontWeight: "700",
                      background: "#f0fdfa", color: "#059669", border: "1px solid #a7f3d0",
                    }}>✅ VERIFIED</span>
                  )}
                  {/* ── Phase 1: Completed badge ── */}
                  {isCompleted && (
                    <span style={{
                      fontSize: "11px", padding: "2px 10px", borderRadius: "999px", fontWeight: "700",
                      background: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4",
                    }}>✔ DONE</span>
                  )}
                </div>

                {/* Meta — unchanged */}
                <div style={{ display: "flex", gap: "10px", fontSize: "12.5px", color: "#7aada5", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ color: isUnknownDate ? "#f59e0b" : "#7aada5", fontWeight: isUnknownDate ? "600" : "normal" }}>
                    📅 {isUnknownDate ? "⚠️ Date Unknown" : task.deadline}
                  </span>
                  <span style={{
                    background: config.badge, color: config.text,
                    padding: "2px 8px", borderRadius: "999px", fontWeight: "600", fontSize: "11px",
                  }}>{config.label}</span>
                  <span>📘 {task.course?.charAt(0).toUpperCase() + task.course?.slice(1).toLowerCase()}</span>
                  {task.owner_name && <span style={{ color: "#9ca3af", fontSize: "11px" }}>by {task.owner_name}</span>}
                </div>

                {isUnknownDate && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#d97706", background: "#fffbeb", padding: "4px 10px", borderRadius: "6px", display: "inline-block", border: "1px solid #fde68a" }}>
                    ⚠️ AI couldn't detect date — please delete and re-add.
                  </div>
                )}

                {isGroup && !isVerified && (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#7aada5", marginBottom: "4px" }}>
                      <span>Verification progress</span><span>{approvalCount}/5 approvals</span>
                    </div>
                    <div style={{ background: "#f0fdfa", borderRadius: "999px", height: "6px" }}>
                      <div style={{ width: `${(approvalCount / 5) * 100}%`, background: approvalCount >= 5 ? "#0d9488" : "#6366f1", borderRadius: "999px", height: "6px", transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>

                {/* ── Phase 1: Mark Complete button ── */}
                {!isCompleted && (
                  <button
                    onClick={() => setCompletingTask(task)}
                    style={{
                      background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "7px 13px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 8px rgba(13,148,136,0.3)",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-1px)"
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(13,148,136,0.45)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)"
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(13,148,136,0.3)"
                    }}
                  >
                    ✔ Done
                  </button>
                )}

                {isGroup && (
                  <button onClick={() => handleApprove(task)} disabled={isApproving} style={{
                    background: userApproved ? "#f0fdfa" : "#eef2ff",
                    color: userApproved ? "#059669" : "#6366f1",
                    border: `1px solid ${userApproved ? "#99f6e4" : "#c7d2fe"}`,
                    borderRadius: "8px", padding: "7px 13px",
                    cursor: isApproving ? "not-allowed" : "pointer",
                    fontWeight: "600", fontSize: "12px", whiteSpace: "nowrap",
                  }}>
                    {isApproving ? "⏳" : userApproved ? "✅ Approved" : "👍 Approve"}
                  </button>
                )}

                <button onClick={() => handleDelete(task)} style={{
                  background: isConfirming ? "#ef4444" : "#fef2f2",
                  color: isConfirming ? "white" : "#dc2626",
                  border: "1px solid #fecaca", borderRadius: "8px",
                  padding: "7px 13px", cursor: "pointer",
                  fontWeight: "600", fontSize: "12px", whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}>
                  {isConfirming ? "⚠️ Confirm?" : "🗑️ Delete"}
                </button>
                {isConfirming && (
                  <button onClick={() => setConfirmDelete(null)} style={{
                    background: "white", color: "#7aada5",
                    border: "1px solid #e5f3f0", borderRadius: "8px",
                    padding: "7px 13px", cursor: "pointer", fontSize: "12px",
                  }}>Cancel</button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* ════════════════════════════════════════
           PHASE 1: Completion Feedback Modal
      ════════════════════════════════════════ */}
      {completingTask && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(10,42,42,0.55)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
          overflowY: "auto",
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "32px",
            width: "100%",
            maxWidth: "440px",
            boxShadow: "0 24px 80px rgba(13,148,136,0.2)",
            border: "1px solid rgba(13,148,136,0.15)",
            maxHeight: "90vh",       // ← ADD THIS
            overflowY: "auto",       // ← ADD THIS
            margin: "auto",
          }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "20px"
              }}>
                🎯
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f2a27" }}>
                  Task Complete!
                </h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#7aada5" }}>
                  Help us learn your work patterns
                </p>
              </div>
            </div>

            {/* Task name pill */}
            <div style={{
              margin: "16px 0",
              padding: "10px 14px",
              background: "#f0fdfa",
              border: "1px solid #99f6e4",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: "600",
              color: "#0d9488"
            }}>
              📌 {completingTask.title}
            </div>

            {/* Hours input */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{
                display: "block", marginBottom: "7px",
                fontWeight: "600", color: "#0f2a27", fontSize: "13.5px"
              }}>
                ⏱️ How many hours did this take?
              </label>
              <input
                type="number"
                min="0.5"
                max="50"
                step="0.5"
                placeholder="e.g. 3.5"
                value={completionForm.actual_hours}
                onChange={e => setCompletionForm(p => ({
                  ...p, actual_hours: e.target.value
                }))}
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "1.5px solid #c8f0ea", borderRadius: "9px",
                  fontSize: "14px", outline: "none",
                  boxSizing: "border-box",
                  background: "#f8fffe", color: "#0f2a27",
                }}
              />
            </div>

            {/* Difficulty stars */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{
                display: "block", marginBottom: "10px",
                fontWeight: "600", color: "#0f2a27", fontSize: "13.5px"
              }}>
                🌟 How difficult was it?
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { val: 1, label: "Very Easy" },
                  { val: 2, label: "Easy" },
                  { val: 3, label: "Medium" },
                  { val: 4, label: "Hard" },
                  { val: 5, label: "Very Hard" },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setCompletionForm(p => ({
                      ...p, difficulty_rating: opt.val
                    }))}
                    title={opt.label}
                    style={{
                      flex: 1,
                      padding: "8px 4px",
                      border: `2px solid ${completionForm.difficulty_rating === opt.val
                        ? "#0d9488" : "#e5f3f0"
                        }`,
                      borderRadius: "8px",
                      background: completionForm.difficulty_rating === opt.val
                        ? "#f0fdfa" : "white",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: completionForm.difficulty_rating === opt.val
                        ? "#0d9488" : "#7aada5",
                      transition: "all 0.15s",
                      textAlign: "center"
                    }}
                  >
                    {"⭐".repeat(opt.val)}
                    <div style={{ fontSize: "9px", marginTop: "3px" }}>{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional notes */}
            <div style={{ marginBottom: "22px" }}>
              <label style={{
                display: "block", marginBottom: "7px",
                fontWeight: "600", color: "#0f2a27", fontSize: "13.5px"
              }}>
                📝 What was hardest? <span style={{ color: "#7aada5", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. understanding recursion, writing the introduction..."
                value={completionForm.notes}
                onChange={e => setCompletionForm(p => ({
                  ...p, notes: e.target.value
                }))}
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "1.5px solid #c8f0ea", borderRadius: "9px",
                  fontSize: "13px", outline: "none",
                  boxSizing: "border-box", resize: "none",
                  background: "#f8fffe", color: "#0f2a27",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  setCompletingTask(null)
                  setCompletionForm({ actual_hours: "", difficulty_rating: 3, notes: "" })
                }}
                style={{
                  flex: 1, padding: "11px",
                  background: "white",
                  border: "1.5px solid #c8f0ea",
                  borderRadius: "10px",
                  color: "#7aada5", cursor: "pointer",
                  fontWeight: "600", fontSize: "13.5px"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSubmit}
                disabled={submittingDone}
                style={{
                  flex: 2, padding: "11px",
                  background: submittingDone
                    ? "#a7f3d0"
                    : "linear-gradient(135deg, #0d9488, #14b8a6)",
                  border: "none", borderRadius: "10px",
                  color: "white", cursor: submittingDone ? "not-allowed" : "pointer",
                  fontWeight: "700", fontSize: "13.5px",
                  boxShadow: "0 4px 16px rgba(13,148,136,0.3)",
                  transition: "all 0.2s"
                }}
              >
                {submittingDone ? "⏳ Saving..." : "✔ Mark Complete & Save"}
              </button>
            </div>

            {/* Why we ask */}
            <p style={{
              margin: "14px 0 0",
              fontSize: "11px",
              color: "#7aada5",
              textAlign: "center",
              lineHeight: 1.6
            }}>
              🧠 This data trains your personal stress predictor.
              After 5 completions, Acadence learns YOUR work patterns.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskList