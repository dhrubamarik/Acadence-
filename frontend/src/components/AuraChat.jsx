import { useState, useRef, useEffect } from 'react'
import API from '../api'

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@600&display=swap');
  .aura-chip { transition: all 0.15s !important; }
  .aura-chip:hover { background: rgba(13,148,136,0.10) !important; border-color: #5eead4 !important; color: #0d9488 !important; transform: translateY(-1px); }
  .aura-send:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
`

const intensityConfig = {
  light:  { color: "#0d9488", bg: "#f0fdfa", label: "🟢 Light",    border: "#99f6e4" },
  medium: { color: "#f59e0b", bg: "#fffbeb", label: "🟡 Moderate", border: "#fde68a" },
  heavy:  { color: "#ef4444", bg: "#fef2f2", label: "🔴 Heavy",    border: "#fecaca" },
}

const INTENT = {
  GENERAL_PLAN: "GENERAL_PLAN", EXAM_PLAN: "EXAM_PLAN",
  SHOW_CLASHES: "SHOW_CLASHES", SHOW_STRESS: "SHOW_STRESS",
  GREETING: "GREETING", UNKNOWN: "UNKNOWN",
}

function detectIntent(text) {
  const lower = text.toLowerCase().trim()
  const greetWords = ["hi","hello","hey"]
  if (greetWords.includes(lower) || lower === "help" || lower.includes("what can you do"))
    return { intent: INTENT.GREETING }
  if (["clash","clashes","conflict","overlap","collision"].some(w => lower.includes(w)))
    return { intent: INTENT.SHOW_CLASHES }
  if (["stress","stressful","heavy day","busy day","hardest day","worst day","burnout","overwhelm"].some(w => lower.includes(w)))
    return { intent: INTENT.SHOW_STRESS }
  const courseWords = ["math","mathematics","physics","history","computer science","chemistry","biology","english","science","economics","geography","engineering","calculus","algebra","statistics"]
  const foundCourse = courseWords.find(c => lower.includes(c))
  const prepWords = ["prepare for","prep for","study for","plan for","revision for","help me with","help me study","help me prepare","focus on","ready for","preparing for","roadmap for","plan for my","study plan for"]
  const hasPrepIntent = prepWords.some(w => lower.includes(w))
  const isPastedSyllabus = text.length > 150
  if (isPastedSyllabus && foundCourse) return { intent: INTENT.EXAM_PLAN, examName: foundCourse.charAt(0).toUpperCase() + foundCourse.slice(1), syllabus: text }
  if (hasPrepIntent && foundCourse) return { intent: INTENT.EXAM_PLAN, examName: foundCourse.charAt(0).toUpperCase() + foundCourse.slice(1), syllabus: isPastedSyllabus ? text : "" }
  if (["plan","schedule","roadmap","all tasks","my week","my tasks","everything","all subjects","study plan","timetable","organise","organize"].some(w => lower.includes(w)))
    return { intent: INTENT.GENERAL_PLAN }
  if (foundCourse) return { intent: INTENT.EXAM_PLAN, examName: foundCourse.charAt(0).toUpperCase() + foundCourse.slice(1), syllabus: "" }
  return { intent: INTENT.UNKNOWN }
}

/* ── Roadmap Card ── */
function RoadmapCard({ roadmap }) {
  if (!roadmap) return null
  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{
        background: "linear-gradient(135deg, #0d9488, #06b6d4)",
        borderRadius: "14px", padding: "16px 20px", color: "white", marginBottom: "12px",
        boxShadow: "0 4px 16px rgba(13,148,136,0.25)",
      }}>
        <strong style={{ fontSize: "14px" }}>
          {roadmap.type === "exam_specific" ? `📖 Exam plan: ${roadmap.exam_name}` : "🗺️ General study plan"}
        </strong>
        <p style={{ margin: "8px 0 0", opacity: 0.9, fontSize: "13px", lineHeight: "1.5" }}>{roadmap.summary}</p>
        {roadmap.warning && (
          <div style={{ marginTop: "10px", background: "rgba(255,255,255,0.18)", borderRadius: "8px", padding: "8px 12px", fontSize: "12.5px" }}>
            ⚠️ {roadmap.warning}
          </div>
        )}
      </div>

      {roadmap.topics?.length > 0 && (
        <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: "12px", padding: "12px 16px", marginBottom: "12px" }}>
          <strong style={{ fontSize: "12.5px", color: "#0d7a7a" }}>📚 Topics covered</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
            {roadmap.topics.map((t, i) => (
              <span key={i} style={{ background: "#ccfbf1", color: "#0f6e56", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "12px" }}>
        {[
          { icon: "📅", label: "Total days", value: roadmap.days?.length || 0 },
          { icon: "🔥", label: "Heavy",      value: roadmap.days?.filter(d => d.intensity === "heavy").length || 0 },
          { icon: "✅", label: "Light",      value: roadmap.days?.filter(d => d.intensity === "light").length || 0 },
        ].map(s => (
          <div key={s.label} style={{ background: "#f0fdfa", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "20px" }}>{s.icon}</div>
            <div style={{ fontWeight: "800", fontSize: "20px", color: "#0f2a27" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "#5e8b83" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {roadmap.days?.map((day, i) => {
        const cfg = intensityConfig[day.intensity] || intensityConfig.medium
        return (
          <div key={i} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "12px", padding: "14px 16px", marginBottom: "8px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ background: cfg.color, color: "white", borderRadius: "8px", padding: "4px 10px", fontWeight: "700", fontSize: "12px", whiteSpace: "nowrap", minWidth: "48px", textAlign: "center" }}>
              Day {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", flexWrap: "wrap", gap: "4px" }}>
                <strong style={{ fontSize: "13px", color: "#0f2a27" }}>{day.day_label}</strong>
                <span style={{ fontSize: "11px", color: cfg.color, fontWeight: "700" }}>{cfg.label}</span>
              </div>
              {day.unit && (
                <div style={{ fontSize: "11px", color: "#0d7a7a", fontWeight: "600", marginBottom: "4px", background: "#ccfbf1", display: "inline-block", padding: "2px 8px", borderRadius: "4px" }}>
                  {day.unit}
                </div>
              )}
              <p style={{ margin: "4px 0 6px", fontSize: "13px", color: "#0f2a27", fontWeight: "600" }}>🎯 {day.focus}</p>
              <ul style={{ margin: "0 0 6px", paddingLeft: "16px", fontSize: "12px", color: "#5e8b83" }}>
                {day.tasks?.map((t, j) => <li key={j} style={{ marginBottom: "2px" }}>{t}</li>)}
              </ul>
              {day.tip && (
                <div style={{ fontSize: "11px", color: "#d97706", background: "#fffbeb", padding: "4px 8px", borderRadius: "6px", border: "1px solid #fde68a", marginTop: "6px" }}>
                  💡 {day.tip}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Clashes Card ── */
function ClashesCard({ clashes }) {
  if (!clashes || clashes.length === 0) return (
    <div style={{ background: "#f0fdfa", border: "1px solid #a7f3d0", borderRadius: "12px", padding: "16px", textAlign: "center", color: "#0f6e56" }}>
      ✅ <strong>No clashes detected!</strong>
      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#5e8b83" }}>Your schedule looks clean. Keep it up!</p>
    </div>
  )
  return (
    <div>
      {clashes.map((clash, i) => (
        <div key={i} style={{ background: "#fff5f5", border: "1.5px solid #fca5a5", borderRadius: "12px", padding: "16px", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "18px" }}>🚨</span>
            <strong style={{ color: "#dc2626", fontSize: "13px" }}>High priority clash!</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ background: "white", border: "1px solid #fecaca", borderRadius: "8px", padding: "6px 12px", fontWeight: "600", fontSize: "12.5px", color: "#0f2a27" }}>📌 {clash.task1}</span>
            <span style={{ background: "#ef4444", color: "white", borderRadius: "999px", padding: "3px 10px", fontSize: "11px", fontWeight: "700" }}>VS</span>
            <span style={{ background: "white", border: "1px solid #fecaca", borderRadius: "8px", padding: "6px 12px", fontWeight: "600", fontSize: "12.5px", color: "#0f2a27" }}>📌 {clash.task2}</span>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: "12.5px", color: "#dc2626", fontWeight: "600" }}>
            ⏰ Only {clash.days_apart} day{clash.days_apart !== 1 ? "s" : ""} apart!
          </p>
        </div>
      ))}
    </div>
  )
}

/* ── Stress Card ── */
function StressCard({ stress }) {
  if (!stress || Object.keys(stress).length === 0) return (
    <div style={{ background: "#f0fdfa", border: "1px solid #a7f3d0", borderRadius: "12px", padding: "16px", color: "#0f6e56", textAlign: "center" }}>
      ✅ No stress data yet. Add some tasks first!
    </div>
  )
  const sorted = Object.entries(stress).sort(([, a], [, b]) => b - a)
  return (
    <div>
      {sorted.map(([date, value]) => {
        const isHigh = value >= 8, isMedium = value >= 4
        const cfg = isHigh
          ? { bg: "#fef2f2", border: "#ef4444", color: "#dc2626", icon: "🔥", label: "High stress" }
          : isMedium
          ? { bg: "#fffbeb", border: "#f59e0b", color: "#d97706", icon: "⚡", label: "Moderate" }
          : { bg: "#f0fdfa", border: "#0d9488", color: "#0d7a7a", icon: "✅", label: "Low" }
        return (
          <div key={date} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>{cfg.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <strong style={{ fontSize: "12.5px", color: "#0f2a27" }}>📅 {date}</strong>
                <span style={{ color: cfg.color, fontSize: "11px", fontWeight: "700" }}>{cfg.label} ({value}/10)</span>
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "6px" }}>
                <div style={{ width: `${Math.min((value/10)*100,100)}%`, background: cfg.color, borderRadius: "999px", height: "6px" }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const SUGGESTIONS = [
  { label: "📅 Plan all tasks",         text: "plan all my tasks" },
  { label: "📖 Math exam prep",         text: "help me prepare for Math exam" },
  { label: "⚡ Check clashes",          text: "what clashes do I have?" },
  { label: "🔥 Most stressful days",    text: "which days are most stressful?" },
]

/* ── Main AuraChat ── */
function AuraChat() {
  const [messages, setMessages] = useState([{
    role: "assistant", type: "text",
    content: "Hi! I'm **Aura** 👋 Your AI academic coach.\n\nI can help you with:\n• 📅 **Plan all my tasks** — full semester roadmap\n• 📖 **Exam prep** — e.g. *help me prepare for Math*\n• ⚡ **Clash detection** — *what clashes do I have?*\n• 🔥 **Stress forecast** — *which days are most stressful?*",
  }])
  const [input,   setInput]   = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const addMessage = (role, content, type = "text", data = null) =>
    setMessages(prev => [...prev, { role, content, type, data }])
  const removeLoading = () =>
    setMessages(prev => prev.filter(m => m.type !== "loading"))

  const handleSend = async (textOverride = null) => {
    const text = (textOverride || input).trim()
    if (!text || loading) return
    addMessage("user", text)
    setInput("")
    setLoading(true)
    addMessage("assistant", "⏳ Thinking...", "loading")
    const { intent, examName, syllabus } = detectIntent(text)
    try {
      if (intent === INTENT.GREETING) {
        removeLoading()
        addMessage("assistant", "Hi! 👋 I'm Aura, your AI academic coach.\n\nI can help you with:\n• 📅 **'plan all my tasks'** — full semester roadmap\n• 📖 **'help me prepare for Math exam'** — exam prep\n• 📝 **Paste your syllabus** — topic-wise study plan\n• ⚡ **'what clashes do I have?'** — conflict check\n• 🔥 **'which days are most stressful?'** — stress map")
      } else if (intent === INTENT.SHOW_CLASHES) {
        const res = await API.get("analytics/"); removeLoading()
        const clashes = res.data.clashes || []
        addMessage("assistant", clashes.length > 0 ? `Found **${clashes.length} clash${clashes.length > 1 ? "es" : ""}**! ⚡` : "✅ No clashes detected!", "clashes", clashes)
      } else if (intent === INTENT.SHOW_STRESS) {
        const res = await API.get("analytics/"); removeLoading()
        addMessage("assistant", "Here's your stress forecast 🌡️", "stress", res.data.stress || {})
      } else if (intent === INTENT.EXAM_PLAN) {
        const res = await API.post("exam-roadmap/", { exam_name: examName || text, syllabus: syllabus || "", exam_date: "" }); removeLoading()
        res.data.error ? addMessage("assistant", `❌ ${res.data.error}`) : addMessage("assistant", `Here's your **topic-by-topic** prep plan for **${examName}**! 📖`, "roadmap", res.data)
      } else if (intent === INTENT.GENERAL_PLAN) {
        const res = await API.post("general-roadmap/"); removeLoading()
        res.data.error ? addMessage("assistant", `❌ ${res.data.error}`) : addMessage("assistant", "Here's your complete study roadmap! 📅", "roadmap", res.data)
      } else {
        removeLoading()
        addMessage("assistant", "I'm not sure what you mean 🤔\n\nTry:\n• **'plan all my tasks'**\n• **'help me prepare for Math exam'**\n• **'what clashes do I have?'**\n• Paste your syllabus text for a topic-wise plan")
      }
    } catch (err) {
      removeLoading()
      addMessage("assistant", `❌ ${err.response?.data?.error || "Something went wrong."}`)
    }
    setLoading(false)
  }

  const renderMessage = (msg, index) => {
    const isUser = msg.role === "user"
    return (
      <div key={index} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "12px", alignItems: "flex-start", gap: "8px" }}>
        {!isUser && (
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0, boxShadow: "0 2px 8px rgba(13,148,136,0.3)" }}>🤖</div>
        )}
        <div style={{
          maxWidth: isUser ? "70%" : "90%",
          background: isUser
            ? "linear-gradient(135deg, #0d9488, #06b6d4)"
            : msg.type === "loading" ? "#f0fdfa" : "white",
          color: isUser ? "white" : "#0f2a27",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "12px 16px",
          boxShadow: isUser ? "0 4px 16px rgba(13,148,136,0.25)" : "0 2px 10px rgba(13,148,136,0.07)",
          border: isUser ? "none" : "1px solid #e0f7f4",
          fontSize: "13.5px", lineHeight: "1.55",
        }}>
          <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />
          {msg.type === "roadmap"  && <RoadmapCard roadmap={msg.data} />}
          {msg.type === "clashes"  && <div style={{ marginTop: "10px" }}><ClashesCard clashes={msg.data} /></div>}
          {msg.type === "stress"   && <div style={{ marginTop: "10px" }}><StressCard stress={msg.data} /></div>}
        </div>
        {isUser && (
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #0f2a27, #1e4a45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>🎓</div>
        )}
      </div>
    )
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ marginTop: "20px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{
          background: "white",
          border: "1.5px solid #c8f0ea",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(13,148,136,0.10)",
        }}>
          {/* Chat header bar */}
          <div style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #0f2a27 0%, #0d3d38 100%)",
            display: "flex", alignItems: "center", gap: "12px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 2px 8px rgba(13,148,136,0.4)" }}>🤖</div>
            <div>
              <div style={{ fontFamily: "'Lora', serif", fontSize: "16px", fontWeight: 600, color: "#5eead4", letterSpacing: "-0.2px" }}>Aura AI Coach</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Ask me to plan, prep, or detect clashes</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#5eead4", boxShadow: "0 0 6px #5eead4" }} />
              <span style={{ fontSize: "11px", color: "#5eead4", fontWeight: "600" }}>Online</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ height: "520px", overflowY: "auto", padding: "20px", background: "#f8fffe" }}>
            {messages.map((msg, i) => renderMessage(msg, i))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          <div style={{ padding: "10px 16px", display: "flex", gap: "8px", flexWrap: "wrap", borderTop: "1px solid #e0f7f4", background: "white" }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="aura-chip" onClick={() => handleSend(s.text)} disabled={loading} style={{
                background: "#f0fdfa", border: "1px solid #a7f3d0", borderRadius: "999px",
                padding: "6px 14px", fontSize: "12px", cursor: loading ? "not-allowed" : "pointer",
                color: "#0d7a7a", fontWeight: "600", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>{s.label}</button>
            ))}
          </div>

          {/* Input bar */}
          <div style={{ display: "flex", gap: "10px", padding: "14px 16px", borderTop: "1px solid #e0f7f4", background: "white" }}>
            <input
              type="text"
              placeholder='Try "what clashes do I have?" or "help me prepare for Physics"'
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              disabled={loading}
              style={{
                flex: 1, padding: "11px 16px",
                border: "1.5px solid #c8f0ea", borderRadius: "999px",
                fontSize: "13.5px", outline: "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: "#f8fffe", color: "#0f2a27",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "#0d9488"}
              onBlur={e => e.target.style.borderColor = "#c8f0ea"}
            />
            <button className="aura-send" onClick={() => handleSend()} disabled={loading || !input.trim()} style={{
              background: loading || !input.trim() ? "#e0f7f4" : "linear-gradient(135deg, #0d9488, #06b6d4)",
              color: loading || !input.trim() ? "#7aada5" : "white",
              border: "none", borderRadius: "999px", padding: "11px 22px",
              fontWeight: "700", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: "13.5px", fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: loading || !input.trim() ? "none" : "0 4px 14px rgba(13,148,136,0.3)",
              transition: "all 0.2s",
            }}>
              {loading ? "⏳" : "Send ➤"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AuraChat