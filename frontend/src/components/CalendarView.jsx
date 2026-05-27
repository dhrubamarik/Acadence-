// CalendarView.jsx — Polished light gradient theme (ZERO logic changes)
import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import API from '../api'

const PRIORITY_CONFIG = {
  high:   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444", label: "🔴 HIGH"   },
  medium: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", label: "🟡 MEDIUM" },
  low:    { color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", dot: "#14b8a6", label: "🟢 LOW"    },
}

const toDateStr = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

function CoursePill({ course, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 15px", borderRadius: "999px",
      border: selected ? "2px solid #0d9488" : "1.5px solid #c8f0ea",
      background: selected ? "linear-gradient(135deg,#0d9488,#14b8a6)" : "#f8fffe",
      color: selected ? "white" : "#0f2a27",
      fontSize: "12px", fontWeight: "600", cursor: "pointer",
      transition: "all 0.15s", fontFamily: "'Plus Jakarta Sans',sans-serif",
      boxShadow: selected ? "0 2px 10px rgba(13,148,136,0.25)" : "none",
    }}>
      {course}
    </button>
  )
}

function TaskCard({ task }) {
  const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low
  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: "12px", padding: "11px 14px", marginBottom: "9px",
      boxShadow: "0 1px 6px rgba(13,148,136,0.05)",
    }}>
      <div style={{ fontWeight: "700", fontSize: "13.5px", color: "#0f2a27", marginBottom: "5px" }}>
        {task.title}
      </div>
      <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "#7aada5", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: cfg.color, fontWeight: "700" }}>{cfg.label}</span>
        <span>📘 {task.course.charAt(0).toUpperCase() + task.course.slice(1).toLowerCase()}</span>
      </div>
    </div>
  )
}

function CalendarView() {
  const [tasks,          setTasks]          = useState([])
  const [analytics,      setAnalytics]      = useState({})
  const [selectedDate,   setSelectedDate]   = useState(new Date())
  const [selectedCourse, setSelectedCourse] = useState("All")
  const [view,           setView]           = useState("month")
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, analyticsRes] = await Promise.all([API.get("tasks/"), API.get("analytics/")])
        setTasks(tasksRes.data); setAnalytics(analyticsRes.data)
      } catch (err) { console.error("Calendar fetch error:", err) }
      setLoading(false)
    }
    fetchData()
  }, [])

  const allCourses = ["All", ...new Set(tasks.map(t => t.course.charAt(0).toUpperCase() + t.course.slice(1).toLowerCase()))]
  const filteredTasks = selectedCourse === "All" ? tasks : tasks.filter(t => t.course.toLowerCase() === selectedCourse.toLowerCase())
  const selectedDateStr = toDateStr(selectedDate)
  const tasksOnDay = filteredTasks.filter(t => t.deadline === selectedDateStr)
  const tasksByDate = {}
  filteredTasks.forEach(task => {
    if (!tasksByDate[task.deadline]) tasksByDate[task.deadline] = []
    tasksByDate[task.deadline].push(task)
  })

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null
    const dateStr = toDateStr(date)
    const dayTasks = tasksByDate[dateStr] || []
    if (dayTasks.length === 0) return null
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: "2px", marginTop: "2px", flexWrap: "wrap" }}>
        {dayTasks.slice(0, 3).map((task, i) => {
          const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low
          return <div key={i} title={task.title} style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.dot }} />
        })}
        {dayTasks.length > 3 && <span style={{ fontSize: "8px", color: "#7aada5", lineHeight: "6px" }}>+{dayTasks.length - 3}</span>}
      </div>
    )
  }

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return ""
    const dateStr = toDateStr(date)
    const dayTasks = tasksByDate[dateStr] || []
    if (dayTasks.length === 0) return ""
    const stressVal = analytics.stress?.[dateStr] || 0
    if (stressVal >= 8) return "tile-high"
    if (stressVal >= 4) return "tile-medium"
    return "tile-low"
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "#7aada5" }}>
        <div style={{ fontSize: "52px" }}>📅</div>
        <p style={{ marginTop: "12px", fontWeight: "600" }}>Loading calendar...</p>
      </div>
    )
  }

  const statCards = [
    { icon: "📋", label: "Total Tasks",   value: tasks.length,                                  bg: "#f0fdfa", border: "#99f6e4",  color: "#0d9488" },
    { icon: "🔴", label: "High Priority", value: tasks.filter(t => t.priority==="high").length, bg: "#fef2f2", border: "#fecaca",  color: "#dc2626" },
    { icon: "⚡", label: "Clashes",       value: analytics.clashes?.length || 0,                bg: "#fffbeb", border: "#fde68a",  color: "#d97706" },
    { icon: "📘", label: "Courses",       value: allCourses.length - 1,                         bg: "#eef2ff", border: "#c7d2fe",  color: "#6366f1" },
  ]

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@400;600&display=swap');

        .react-calendar { width: 100%; border: none; font-family: 'Plus Jakarta Sans',sans-serif; }
        .react-calendar__tile {
          height: 82px; display: flex; flex-direction: column;
          align-items: center; justify-content: flex-start;
          padding-top: 9px; font-size: 13px; border-radius: 10px;
          transition: background 0.15s;
        }
        .react-calendar__tile:hover { background: #f0fdfa !important; }
        .react-calendar__tile--active { background: linear-gradient(135deg,#0d9488,#14b8a6) !important; color: white !important; border-radius: 10px; box-shadow: 0 4px 14px rgba(13,148,136,0.35); }
        .react-calendar__tile--now { background: #f0fdfa; font-weight: 800; color: #0d9488 !important; }
        .tile-high   { background: #fef2f2 !important; }
        .tile-medium { background: #fffbeb !important; }
        .tile-low    { background: #f0fdfa !important; }
        .react-calendar__navigation button {
          font-size: 15px; font-weight: "700"; color: #0f2a27;
          background: none; border: none; padding: 8px; border-radius: 9px; cursor: pointer;
          font-family: 'Plus Jakarta Sans',sans-serif; transition: background 0.15s;
        }
        .react-calendar__navigation button:hover { background: #f0fdfa; color: #0d9488; }
        .react-calendar__month-view__weekdays { font-size: 11px; color: #7aada5; font-weight: 700; text-transform: uppercase; }
        .react-calendar__month-view__weekdays__weekday { text-align: center; padding: 8px 0; }
        .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "26px" }}>
        <h1 style={{ fontFamily: "'Lora',serif", margin: "0 0 5px", fontSize: "28px", fontWeight: 600, color: "#0f2a27" }}>
          📅 LMS Calendar
        </h1>
        <p style={{ color: "#7aada5", margin: 0, fontSize: "13.5px" }}>Your complete semester at a glance</p>
        <div style={{ marginTop: "12px", height: "2px", width: "60px", background: "linear-gradient(90deg,#0d9488,transparent)", borderRadius: "99px" }} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "14px", padding: "18px", textAlign: "center", boxShadow: "0 2px 10px rgba(13,148,136,0.05)" }}>
            <div style={{ fontSize: "26px" }}>{s.icon}</div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#7aada5", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Course Filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px", alignItems: "center" }}>
        <span style={{ fontSize: "12.5px", color: "#7aada5", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase" }}>Filter:</span>
        {allCourses.map(course => (
          <CoursePill key={course} course={course} selected={selectedCourse === course} onClick={() => setSelectedCourse(course)} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "22px", flexWrap: "wrap" }}>
        {[
          { color: "#fecaca", label: "High Stress (8+)"  },
          { color: "#fde68a", label: "Moderate (4–7)"    },
          { color: "#99f6e4", label: "Low Stress (1–3)"  },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#7aada5" }}>
            <div style={{ width: "13px", height: "13px", borderRadius: "4px", background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "22px", alignItems: "start" }}>

        {/* Calendar */}
        <div style={{
          background: "#ffffff", borderRadius: "18px",
          border: "1px solid rgba(13,148,136,0.1)", padding: "22px",
          boxShadow: "0 4px 24px rgba(13,148,136,0.07)",
        }}>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
          />
        </div>

        {/* Sidebar */}
        <div>
          {/* Selected day panel */}
          <div style={{
            background: "#ffffff", border: "1px solid rgba(13,148,136,0.1)",
            borderRadius: "16px", padding: "20px", marginBottom: "16px",
            boxShadow: "0 4px 20px rgba(13,148,136,0.07)",
          }}>
            <h4 style={{ margin: "0 0 4px", color: "#0f2a27", fontFamily: "'Lora',serif", fontWeight: 600, fontSize: "15px" }}>
              📌 {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </h4>
            {analytics.stress?.[selectedDateStr] ? (
              <div style={{ fontSize: "12.5px", color: "#7aada5", marginBottom: "14px" }}>
                Stress Score:{" "}
                <strong style={{ color: analytics.stress[selectedDateStr]>=8 ? "#dc2626" : analytics.stress[selectedDateStr]>=4 ? "#d97706" : "#0d9488" }}>
                  {analytics.stress[selectedDateStr]}/10
                </strong>
              </div>
            ) : (
              <p style={{ fontSize: "12.5px", color: "#7aada5", marginBottom: "14px" }}>No stress data for this day</p>
            )}

            {tasksOnDay.length > 0 ? (
              <>
                <p style={{ fontSize: "11.5px", color: "#7aada5", margin: "0 0 10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {tasksOnDay.length} Task{tasksOnDay.length>1?"s":""} Due
                </p>
                {tasksOnDay.map(task => <TaskCard key={task.id} task={task} />)}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "22px", color: "#7aada5" }}>
                <div style={{ fontSize: "36px" }}>✅</div>
                <p style={{ fontSize: "13px", margin: "8px 0 0" }}>Nothing due on this day!</p>
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div style={{
            background: "#ffffff", border: "1px solid rgba(13,148,136,0.1)",
            borderRadius: "16px", padding: "20px",
            boxShadow: "0 4px 20px rgba(13,148,136,0.07)",
          }}>
            <h4 style={{ margin: "0 0 14px", color: "#0f2a27", fontFamily: "'Lora',serif", fontWeight: 600, fontSize: "15px" }}>
              🔜 Upcoming Tasks
            </h4>
            {filteredTasks
              .filter(t => t.deadline >= toDateStr(new Date()))
              .sort((a,b) => new Date(a.deadline) - new Date(b.deadline))
              .slice(0, 5)
              .map(task => (
                <div key={task.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0fdfa" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f2a27" }}>{task.title}</div>
                    <div style={{ fontSize: "11px", color: "#7aada5" }}>{task.course.charAt(0).toUpperCase() + task.course.slice(1).toLowerCase()}</div>
                  </div>
                  <div style={{
                    fontSize: "11px", color: PRIORITY_CONFIG[task.priority]?.color,
                    fontWeight: "700", background: PRIORITY_CONFIG[task.priority]?.bg,
                    padding: "3px 9px", borderRadius: "999px", whiteSpace: "nowrap",
                    border: `1px solid ${PRIORITY_CONFIG[task.priority]?.border}`,
                  }}>
                    {task.deadline}
                  </div>
                </div>
              ))}
            {filteredTasks.filter(t => t.deadline >= toDateStr(new Date())).length === 0 && (
              <p style={{ textAlign: "center", color: "#7aada5", fontSize: "13px" }}>No upcoming tasks!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarView