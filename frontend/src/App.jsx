// App.jsx - Polished light gradient theme (zero logic changes)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import API from './api'

import Dashboard from './components/Dashboard'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import AIGenerator from './components/AIGenerator'
import PDFUpload from './components/PDFUpload'
import StressWeather from './components/StressWeather'
import Clashes from './components/Clashes'
import AuraChat from './components/AuraChat'
import CalendarView from './components/CalendarView'
import DepartmentDashboard from './components/DepartmentDashboard'
import ProfessorAlerts from './components/ProfessorAlerts'
import DepartmentFiles from './components/DepartmentFiles'

const NAV_ITEMS = [
  { id: "dashboard", icon: "🏠", label: "Dashboard" },
  { id: "ai", icon: "🤖", label: "AI Generator" },
  { id: "pdf", icon: "📄", label: "PDF Upload" },
  { id: "tasks", icon: "📋", label: "My Tasks" },
  { id: "roadmap", icon: "🗺️", label: "AI Roadmap" },
  { id: "calendar", icon: "📅", label: "LMS Calendar" },
  { id: "stress", icon: "🌡️", label: "Stress Map" },
  { id: "clashes", icon: "⚡", label: "Clashes" },
  { id: "department", icon: "🏫", label: "Department" },
  { id: "alerts", icon: "🚨", label: "Prof Alerts" },
  { id: "files", icon: "📁", label: "Dept Files" },

]

/* ── Design tokens ── */
const T = {
  teal: "#0d9488",
  tealLight: "#14b8a6",
  tealPale: "#f0fdfa",
  tealMid: "#ccfbf1",
  tealBorder: "#99f6e4",
  cyan: "#06b6d4",
  slate: "#0f172a",
  slateLight: "#1e293b",
  text: "#0f2a27",
  textMuted: "#5e8b83",
  white: "#ffffff",
  surface: "#f8fffe",
  card: "#ffffff",
  red: "#ef4444",
  amber: "#f59e0b",
  violet: "#7c3aed",
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f0fdfa;
  }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #99f6e4; border-radius: 99px; }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .page-enter {
    animation: fadeSlideIn 0.35s cubic-bezier(0.23,1,0.32,1) both;
  }

  .nav-btn {
    transition: all 0.18s cubic-bezier(0.23,1,0.32,1) !important;
  }
  .nav-btn:hover {
    background: rgba(13,148,136,0.10) !important;
    color: #0d9488 !important;
    transform: translateX(2px);
  }
`

function App() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activePage, setActivePage] = useState("dashboard")
  const [tasks, setTasks] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userInsights, setUserInsights] = useState(null)

  const fetchTasks = async () => {
    try { const res = await API.get("tasks/"); setTasks(res.data) }
    catch (err) { console.error("fetchTasks:", err) }
  }
  const fetchInsights = async () => {
    try {
      const res = await API.get("user/insights/")
      setUserInsights(res.data)
    } catch (err) {
      console.error("fetchInsights:", err)
    }
  }
  const fetchAnalytics = async () => {
    try { const res = await API.get("analytics/"); setAnalytics(res.data) }
    catch (err) { console.error("fetchAnalytics:", err) }
  }

  useEffect(() => { fetchTasks(); fetchAnalytics(); fetchInsights() }, [])

  const refreshAll = () => { fetchTasks(); fetchAnalytics(); fetchInsights() }

  const handleLogout = () => { logout(); navigate('/login') }

  const SIDEBAR_W = sidebarOpen ? "232px" : "68px"

  const avatarLetter =
    user?.full_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() || "U"

  const displayName = user?.full_name || user?.username || "Student"

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdfa 0%, #e0f7fa 50%, #f0fdf4 100%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* ══════════════════════════ SIDEBAR ══════════════════════════ */}
        <div style={{
          width: SIDEBAR_W,
          minHeight: "100vh",
          background: "linear-gradient(180deg, #0f2a27 0%, #0d3d38 60%, #0a2e2a 100%)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0, left: 0,
          zIndex: 200,
          transition: "width 0.25s cubic-bezier(0.23,1,0.32,1)",
          overflow: "hidden",
          boxShadow: "4px 0 32px rgba(13,148,136,0.15)",
        }}>

          {/* Decorative top glow */}
          <div style={{
            position: "absolute",
            top: "-60px", left: "-60px",
            width: "200px", height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(13,148,136,0.25) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* ── Logo ── */}
          <div style={{
            padding: "22px 16px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            position: "relative",
          }}>
            {sidebarOpen && (
              <div>
                <div style={{
                  fontFamily: "'Lora', serif",
                  fontWeight: 600,
                  fontSize: "20px",
                  background: "linear-gradient(135deg, #5eead4, #a7f3d0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.3px",
                }}>
                  Acadence
                </div>
                <div style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.35)",
                  marginTop: "2px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}>
                  Academic Coach
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "6px 9px",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                fontSize: "13px",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>

          {/* ── Nav Items ── */}
          <nav style={{ flex: 1, padding: "14px 10px" }}>
            {NAV_ITEMS.map(item => {
              const isActive = activePage === item.id
              return (
                <button
                  key={item.id}
                  className="nav-btn"
                  onClick={() => setActivePage(item.id)}
                  title={!sidebarOpen ? item.label : ""}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                    padding: "10px 12px",
                    marginBottom: "3px",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(13,148,136,0.28), rgba(6,182,212,0.18))"
                      : "transparent",
                    border: isActive
                      ? "1px solid rgba(94,234,212,0.25)"
                      : "1px solid transparent",
                    borderRadius: "10px",
                    cursor: "pointer",
                    color: isActive ? "#5eead4" : "rgba(255,255,255,0.45)",
                    fontSize: "13.5px",
                    fontWeight: isActive ? "600" : "400",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    boxShadow: isActive ? "0 2px 12px rgba(13,148,136,0.15)" : "none",
                  }}
                >
                  <span style={{ fontSize: "17px", flexShrink: 0 }}>{item.icon}</span>
                  {sidebarOpen && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label}
                    </span>
                  )}
                  {isActive && sidebarOpen && (
                    <div style={{
                      marginLeft: "auto",
                      width: "5px", height: "5px",
                      borderRadius: "50%",
                      background: "#5eead4",
                      flexShrink: 0,
                      boxShadow: "0 0 6px #5eead4",
                    }} />
                  )}
                </button>
              )
            })}
          </nav>

          {/* ── User Section ── */}
          <div style={{
            padding: "12px 10px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            {sidebarOpen && user?.department_name && (
              <div style={{
                background: "rgba(13,148,136,0.15)",
                border: "1px solid rgba(94,234,212,0.2)",
                borderRadius: "8px",
                padding: "6px 10px",
                marginBottom: "10px",
                fontSize: "11px",
                color: "#5eead4",
                fontWeight: "600",
                letterSpacing: "0.02em",
              }}>
                🏫 {user.department_name}
              </div>
            )}

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                width: "34px", height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0d9488, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                flexShrink: 0,
                color: "white",
                fontWeight: "700",
                boxShadow: "0 2px 8px rgba(13,148,136,0.4)",
              }}>
                {avatarLetter}
              </div>
              {sidebarOpen && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "13px", fontWeight: "600",
                    color: "#e2f8f5",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {displayName}
                  </div>
                  <div style={{
                    fontSize: "11px", color: "rgba(255,255,255,0.3)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {user?.email}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                marginTop: "8px",
                width: "100%",
                padding: "8px 12px",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.14)",
                borderRadius: "8px",
                color: "#fca5a5",
                cursor: "pointer",
                fontSize: "12.5px",
                fontWeight: "600",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarOpen ? "flex-start" : "center",
                gap: "8px",
                transition: "all 0.15s",
              }}
            >
              <span>🚪</span>
              {sidebarOpen && "Logout"}
            </button>
          </div>
        </div>

        {/* ══════════════════════════ MAIN CONTENT ══════════════════════════ */}
        <div style={{
          marginLeft: SIDEBAR_W,
          flex: 1,
          padding: "36px 40px",
          transition: "margin-left 0.25s cubic-bezier(0.23,1,0.32,1)",
          minHeight: "100vh",
        }}>
          <div className="page-enter" key={activePage}>

            {activePage === "dashboard" && (
              <Dashboard tasks={tasks} analytics={analytics} />
            )}

            {activePage === "ai" && (
              <div>
                <PageHeader icon="🤖" title="AI Task Generator" sub="Paste syllabus text and let AI extract all deadlines" />
                <AIGenerator onTasksGenerated={refreshAll} />
                <TaskForm fetchTasks={fetchTasks} fetchAnalytics={fetchAnalytics} />
              </div>
            )}

            {activePage === "pdf" && (
              <div>
                <PageHeader icon="📄" title="PDF Syllabus Upload" sub="Upload your syllabus PDF and AI will extract all tasks" />
                <PDFUpload onTasksGenerated={refreshAll} />
              </div>
            )}

            {activePage === "tasks" && (
              <div>
                <PageHeader icon="📋" title="My Tasks" sub="All your tasks across all subjects" />
                <TaskList tasks={tasks} onDelete={refreshAll} />
              </div>
            )}

            {activePage === "roadmap" && (
              <div>
                <PageHeader icon="🗺️" title="AI Study Roadmap" sub="Chat with Aura to get personalized study plans" />
                <AuraChat />
              </div>
            )}

            {activePage === "calendar" && <CalendarView />}

            {activePage === "stress" && (
              <div>
                <PageHeader icon="🌡️" title="Stress Weather Map" sub="Your workload intensity across the semester" />
                <StressWeather stress={analytics.stress}
                  isPersonalized={userInsights?.tasks_completed >= 3}
                  tasks={tasks}
                />
              </div>
            )}

            {activePage === "clashes" && (
              <div>
                <PageHeader icon="⚡" title="Deadline Clashes" sub="High priority tasks dangerously close together" />
                <Clashes clashes={analytics.clashes} />
              </div>
            )}
            {/* DEPARTMENT */}
            {activePage === "department" && (
              <div>
                <PageHeader
                  icon="🏫"
                  title="Department Intelligence"
                  subtitle="Collective stress data and crowd-sourced task difficulty from your department"
                />
                <DepartmentDashboard />
              </div>
            )}
            {activePage === "alerts" && (
              <div>
                <PageHeader
                  icon="🚨"
                  title="Professor Alert System"
                  subtitle="Raise stress alerts and track department-wide academic pressure"
                />
                <ProfessorAlerts />
              </div>
            )}
            {activePage === "files" && (
              <div>
                <PageHeader
                  icon="📁"
                  title="Department Files"
                  subtitle="Share assignments, lab copies and notes with your department"
                />
                <DepartmentFiles />
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

/* ── Shared page header ── */
function PageHeader({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
        <div style={{
          width: "40px", height: "40px",
          borderRadius: "11px",
          background: "linear-gradient(135deg, #0d9488, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px",
          boxShadow: "0 4px 16px rgba(13,148,136,0.3)",
        }}>
          {icon}
        </div>
        <h2 style={{
          fontFamily: "'Lora', serif",
          fontSize: "26px",
          fontWeight: 600,
          color: "#0f2a27",
          letterSpacing: "-0.3px",
        }}>
          {title}
        </h2>
      </div>
      <p style={{
        marginLeft: "52px",
        color: "#5e8b83",
        fontSize: "13.5px",
      }}>
        {sub}
      </p>
    </div>
  )
}

export default App