// Dashboard.jsx - Phase 3: AI Recommendations added
// All existing logic untouched

import { useMemo, useEffect, useState } from 'react'
import API from '../api'

const COURSE_COLORS = [
  "#0d9488", "#06b6d4", "#0891b2",
  "#0d7a7a", "#10b981", "#6366f1", "#f59e0b"
]

const cardStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideIn {
    from { opacity:0; transform:translateX(-12px); }
    to   { opacity:1; transform:translateX(0); }
  }

  .stat-card {
    transition: transform 0.2s cubic-bezier(0.23,1,0.32,1), box-shadow 0.2s !important;
  }
  .stat-card:hover {
    transform: translateY(-4px) !important;
    box-shadow: 0 16px 40px rgba(13,148,136,0.14) !important;
  }

  .deadline-row {
    transition: background 0.15s;
    border-radius: 10px;
    padding: 10px 8px !important;
  }
  .deadline-row:hover {
    background: #f0fdfa;
  }

  .rec-card {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .rec-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(13,148,136,0.13) !important;
  }
`

// ── Phase 3: Recommendation Card Component ─────────────────
function RecommendationCard({ rec, onDismiss }) {
  const configs = {
    stress: {
      bg: "linear-gradient(135deg, #fff7ed, #ffedd5)",
      border: "rgba(249,115,22,0.25)",
      iconBg: "linear-gradient(135deg, #f97316, #fb923c)",
      icon: "⚠️",
      titleColor: "#c2410c",
      tipColor: "#9a3412",
      badgeBg: "#fef3c7",
      badgeColor: "#d97706",
      badgeText: "HIGH STRESS",
    },
    clash: {
      bg: "linear-gradient(135deg, #fef2f2, #fee2e2)",
      border: "rgba(239,68,68,0.25)",
      iconBg: "linear-gradient(135deg, #ef4444, #dc2626)",
      icon: "⚡",
      titleColor: "#b91c1c",
      tipColor: "#991b1b",
      badgeBg: "#fee2e2",
      badgeColor: "#dc2626",
      badgeText: "CLASH",
    },
    procrastination: {
      bg: "linear-gradient(135deg, #faf5ff, #f3e8ff)",
      border: "rgba(124,58,237,0.2)",
      iconBg: "linear-gradient(135deg, #7c3aed, #9333ea)",
      icon: "🧠",
      titleColor: "#6d28d9",
      tipColor: "#5b21b6",
      badgeBg: "#ede9fe",
      badgeColor: "#7c3aed",
      badgeText: "PATTERN",
    },
    positive: {
      bg: "linear-gradient(135deg, #f0fdfa, #d1faf4)",
      border: "rgba(13,148,136,0.2)",
      iconBg: "linear-gradient(135deg, #0d9488, #14b8a6)",
      icon: "✅",
      titleColor: "#0d7a7a",
      tipColor: "#0f5f5f",
      badgeBg: "#f0fdfa",
      badgeColor: "#0d9488",
      badgeText: "ON TRACK",
    },
  }

  const cfg = configs[rec.type] || configs.positive

  return (
    <div
      className="rec-card"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "14px",
        padding: "16px 18px",
        marginBottom: "10px",
        animation: "slideIn 0.4s cubic-bezier(0.23,1,0.32,1) both",
        boxShadow: `0 2px 12px ${cfg.border}`,
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}>
        {/* Icon */}
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: cfg.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "17px",
          flexShrink: 0,
          boxShadow: `0 2px 8px ${cfg.border}`,
        }}>
          {cfg.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "5px",
            flexWrap: "wrap"
          }}>
            <span style={{
              fontSize: "13px",
              fontWeight: "700",
              color: cfg.titleColor,
            }}>
              {rec.title}
            </span>
            <span style={{
              fontSize: "9.5px",
              fontWeight: "700",
              padding: "2px 7px",
              borderRadius: "999px",
              background: cfg.badgeBg,
              color: cfg.badgeColor,
              letterSpacing: "0.06em",
            }}>
              {cfg.badgeText}
            </span>
            {rec.personalized && (
              <span style={{
                fontSize: "9.5px",
                fontWeight: "600",
                padding: "2px 7px",
                borderRadius: "999px",
                background: "#f0fdfa",
                color: "#0d9488",
                border: "1px solid #99f6e4",
              }}>
                🧠 personalized
              </span>
            )}
          </div>

          {/* Task pill */}
          {rec.task && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(255,255,255,0.7)",
              border: `1px solid ${cfg.border}`,
              borderRadius: "7px",
              padding: "3px 10px",
              fontSize: "12px",
              fontWeight: "600",
              color: cfg.titleColor,
              marginBottom: "7px",
            }}>
              📌 {rec.task}
              {rec.task2 && (
                <>
                  <span style={{ color: "#94a3b8", margin: "0 3px" }}>vs</span>
                  📌 {rec.task2}
                </>
              )}
            </div>
          )}

          {/* Tip */}
          <p style={{
            margin: "0 0 8px",
            fontSize: "12px",
            color: cfg.tipColor,
            lineHeight: 1.6,
          }}>
            💡 {rec.tip}
          </p>

          {/* Recommended start + dismiss row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}>
            {rec.recommended_start && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255,255,255,0.8)",
                border: `1px solid ${cfg.border}`,
                borderRadius: "7px",
                padding: "4px 10px",
                fontSize: "11.5px",
                fontWeight: "600",
                color: cfg.titleColor,
              }}>
                🗓️ Start by: <strong>{rec.recommended_start}</strong>
              </div>
            )}
            {rec.days_until !== undefined && rec.days_until >= 0 && (
              <div style={{
                fontSize: "11px",
                color: "#7aada5",
                fontWeight: "500",
              }}>
                {rec.days_until === 0
                  ? "Start today!"
                  : `${rec.days_until}d until recommended start`}
              </div>
            )}
            {/* Dismiss button */}
            <button
              onClick={() => onDismiss(rec.id)}
              style={{
                marginLeft: "auto",
                background: "rgba(255,255,255,0.7)",
                border: `1px solid ${cfg.border}`,
                borderRadius: "7px",
                padding: "4px 11px",
                fontSize: "11px",
                fontWeight: "600",
                color: "#7aada5",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255,255,255,1)"
                e.currentTarget.style.color = cfg.titleColor
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.7)"
                e.currentTarget.style.color = "#7aada5"
              }}
            >
              Got it ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────
function Dashboard({ tasks, analytics }) {

  // ── Phase 3: Recommendations state ────────────────────
  const [recommendations, setRecommendations] = useState([])
  const [dismissedIds, setDismissedIds] = useState([])
  const [recLoading, setRecLoading] = useState(true)

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await API.get("recommendations/")
        setRecommendations(res.data.recommendations || [])
      } catch (err) {
        console.error("Recommendations:", err)
      }
      setRecLoading(false)
    }
    fetchRecs()
  }, [tasks]) // refetch when tasks change

  const handleDismiss = (id) => {
    setDismissedIds(prev => [...prev, id])
  }

  const visibleRecs = recommendations.filter(
    r => !dismissedIds.includes(r.id)
  )

  /* ── All existing derived data UNCHANGED ── */
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const toDate = (str) => new Date(str)

  const upcomingTasks = useMemo(() => {
    const next7 = new Date(today)
    next7.setDate(next7.getDate() + 7)
    return tasks
      .filter(t => { const d = toDate(t.deadline); return d >= today && d <= next7 })
      .sort((a, b) => toDate(a.deadline) - toDate(b.deadline))
  }, [tasks])

  const daysLeft = (deadline) =>
    Math.ceil((toDate(deadline) - today) / (1000 * 60 * 60 * 24))

  const courseBreakdown = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      const course = t.course.charAt(0).toUpperCase() + t.course.slice(1).toLowerCase()
      if (!map[course]) map[course] = []
      map[course].push(t)
    })
    return Object.entries(map).map(([course, courseTasks], i) => ({
      course,
      count: courseTasks.length,
      color: COURSE_COLORS[i % COURSE_COLORS.length],
      high: courseTasks.filter(t => t.priority === "high").length,
    }))
  }, [tasks])

  const peakStress = useMemo(() => {
    if (!analytics.stress) return 0
    const values = Object.values(analytics.stress)
    return values.length ? Math.max(...values) : 0
  }, [analytics])

  const thisWeekCount = useMemo(() => {
    const next7 = new Date(today)
    next7.setDate(next7.getDate() + 7)
    return tasks.filter(t => {
      const d = toDate(t.deadline)
      return d >= today && d <= next7
    }).length
  }, [tasks])

  const daysLeftColor = (days) => {
    if (days === 0) return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" }
    if (days <= 3) return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" }
    return { bg: "#f0fdfa", color: "#0d9488", border: "#99f6e4" }
  }

  const priorityColor = (priority) => {
    if (priority === "high") return "#ef4444"
    if (priority === "medium") return "#f59e0b"
    return "#0d9488"
  }

  const stats = [
    {
      icon: "📋", label: "TOTAL TASKS", value: tasks.length,
      sub: "this semester",
      gradient: "linear-gradient(135deg, #f0fdfa 0%, #e0faf6 100%)",
      iconGrad: "linear-gradient(135deg, #0d9488, #14b8a6)",
      valColor: "#0d7a7a", border: "rgba(13,148,136,0.2)", glow: "rgba(13,148,136,0.1)",
    },
    {
      icon: "🔥", label: "PEAK STRESS", value: peakStress,
      sub: "max stress score",
      gradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
      iconGrad: "linear-gradient(135deg, #f97316, #fb923c)",
      valColor: "#ea580c", border: "rgba(249,115,22,0.2)", glow: "rgba(249,115,22,0.1)",
    },
    {
      icon: "📅", label: "THIS WEEK", value: thisWeekCount,
      sub: "deadlines due",
      gradient: "linear-gradient(135deg, #f0fdfa 0%, #d1faf4 100%)",
      iconGrad: "linear-gradient(135deg, #06b6d4, #0891b2)",
      valColor: "#0891b2", border: "rgba(6,182,212,0.2)", glow: "rgba(6,182,212,0.1)",
    },
    {
      icon: "⚡", label: "CLASHES", value: analytics.clashes?.length || 0,
      sub: "schedule conflicts",
      gradient: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
      iconGrad: "linear-gradient(135deg, #7c3aed, #9333ea)",
      valColor: "#7c3aed", border: "rgba(124,58,237,0.2)", glow: "rgba(124,58,237,0.1)",
    },
  ]

  return (
    <>
      <style>{cardStyle}</style>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

        {/* ── Header — unchanged ── */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontFamily: "'Lora', serif",
            margin: "0 0 6px", fontSize: "32px", fontWeight: 600,
            background: "linear-gradient(135deg, #0d9488, #06b6d4)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", letterSpacing: "-0.5px",
          }}>
            Acadence
          </h1>
          <p style={{ margin: 0, color: "#5e8b83", fontSize: "14px" }}>
            AI-powered academic stress forecaster — Current Semester
          </p>
          <div style={{
            marginTop: "14px", height: "2px", width: "80px",
            background: "linear-gradient(90deg, #0d9488, transparent)",
            borderRadius: "99px",
          }} />
        </div>

        {/* ════════════════════════════════════════
             PHASE 3: AI RECOMMENDATIONS SECTION
        ════════════════════════════════════════ */}
        {(recLoading || visibleRecs.length > 0) && (
          <div style={{
            marginBottom: "28px",
            background: "white",
            borderRadius: "18px",
            padding: "22px 24px",
            border: "1px solid rgba(13,148,136,0.1)",
            boxShadow: "0 4px 24px rgba(13,148,136,0.06)",
          }}>
            {/* Section header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}>
              <div style={{
                width: "30px",
                height: "30px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                boxShadow: "0 2px 10px rgba(13,148,136,0.3)",
              }}>
                🤖
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#0f2a27",
                  fontFamily: "'Lora', serif",
                }}>
                  Aura Recommends
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: "11.5px",
                  color: "#7aada5",
                }}>
                  Personalized actions based on your work patterns
                </p>
              </div>

              {/* Count badge */}
              {visibleRecs.length > 0 && (
                <div style={{
                  marginLeft: "auto",
                  background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                  color: "white",
                  borderRadius: "999px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: "700",
                }}>
                  {visibleRecs.length} action{visibleRecs.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* Loading state */}
            {recLoading ? (
              <div style={{
                textAlign: "center", padding: "20px",
                color: "#7aada5", fontSize: "13px",
              }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔄</div>
                Aura is analyzing your schedule...
              </div>
            ) : (
              visibleRecs.map(rec => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </div>
        )}

        {/* ── Stats Row — unchanged ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: "18px", marginBottom: "28px",
        }}>
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="stat-card"
              style={{
                background: stat.gradient,
                borderRadius: "18px",
                padding: "22px",
                border: `1px solid ${stat.border}`,
                boxShadow: `0 4px 20px ${stat.glow}`,
                animation: `fadeUp 0.5s cubic-bezier(0.23,1,0.32,1) ${idx * 0.07}s both`,
              }}
            >
              <div style={{
                width: "44px", height: "44px", background: stat.iconGrad,
                borderRadius: "12px", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "22px", marginBottom: "14px",
                boxShadow: `0 4px 14px ${stat.glow}`,
              }}>
                {stat.icon}
              </div>
              <p style={{
                margin: "0 0 4px", fontSize: "10.5px", fontWeight: "700",
                color: "#5e8b83", letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                {stat.label}
              </p>
              <p style={{
                margin: "0 0 4px", fontSize: "36px", fontWeight: "800",
                color: stat.valColor, lineHeight: 1, letterSpacing: "-1px",
              }}>
                {stat.value}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#7aada5" }}>
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Bottom Two Columns — unchanged ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px" }}>

          {/* LEFT — Course Breakdown */}
          <div style={{
            background: "#ffffff", borderRadius: "18px", padding: "26px",
            border: "1px solid rgba(13,148,136,0.1)",
            boxShadow: "0 4px 24px rgba(13,148,136,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "linear-gradient(135deg, #0d9488, #14b8a6)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
              }}>📊</div>
              <h3 style={{
                margin: 0, fontSize: "15px", fontWeight: "700",
                color: "#0f2a27", fontFamily: "'Lora', serif",
              }}>Course breakdown</h3>
            </div>
            {courseBreakdown.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#7aada5" }}>
                <p style={{ fontSize: "36px" }}>📭</p>
                <p style={{ fontSize: "14px", marginTop: "8px" }}>No tasks yet. Add some!</p>
              </div>
            ) : (
              courseBreakdown.map(({ course, count, color }) => {
                const maxTasks = Math.max(...courseBreakdown.map(c => c.count))
                const barWidth = (count / maxTasks) * 100
                return (
                  <div key={course} style={{
                    display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px",
                  }}>
                    <div style={{
                      width: "9px", height: "9px", borderRadius: "50%",
                      background: color, flexShrink: 0, boxShadow: `0 0 7px ${color}88`,
                    }} />
                    <span style={{
                      fontSize: "13.5px", color: "#0f2a27", fontWeight: "500",
                      width: "150px", flexShrink: 0,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {course}
                    </span>
                    <div style={{
                      flex: 1, background: "#f0fdfa", borderRadius: "999px",
                      height: "7px", overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${barWidth}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                        borderRadius: "999px", height: "7px",
                        transition: "width 0.6s cubic-bezier(0.23,1,0.32,1)",
                        boxShadow: `0 0 8px ${color}55`,
                      }} />
                    </div>
                    <span style={{
                      fontSize: "12px", color: "#7aada5",
                      whiteSpace: "nowrap", flexShrink: 0,
                      minWidth: "52px", textAlign: "right",
                    }}>
                      {count} task{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {/* RIGHT — Upcoming Deadlines */}
          <div style={{
            background: "#ffffff", borderRadius: "18px", padding: "26px",
            border: "1px solid rgba(13,148,136,0.1)",
            boxShadow: "0 4px 24px rgba(13,148,136,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "linear-gradient(135deg, #ef4444, #f87171)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
              }}>🔔</div>
              <h3 style={{
                margin: 0, fontSize: "15px", fontWeight: "700",
                color: "#0f2a27", fontFamily: "'Lora', serif",
              }}>Upcoming deadlines</h3>
            </div>
            <p style={{ margin: "0 0 18px", fontSize: "12.5px", color: "#7aada5", paddingLeft: "38px" }}>
              Next 7 days — <strong style={{ color: "#0d9488" }}>{upcomingTasks.length}</strong> deadline{upcomingTasks.length !== 1 ? "s" : ""}
            </p>
            {upcomingTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#7aada5" }}>
                <p style={{ fontSize: "36px" }}>✅</p>
                <p style={{ fontSize: "14px", marginTop: "8px" }}>Nothing due this week!</p>
              </div>
            ) : (
              upcomingTasks.map(task => {
                const days = daysLeft(task.deadline)
                const daysCfg = daysLeftColor(days)
                const lColor = priorityColor(task.priority)
                return (
                  <div key={task.id} className="deadline-row" style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    borderBottom: "1px solid #f0fdfa", marginBottom: "2px",
                  }}>
                    <div style={{
                      width: "3px", height: "40px", borderRadius: "999px",
                      background: lColor, flexShrink: 0, boxShadow: `0 0 8px ${lColor}66`,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: "0 0 2px", fontSize: "13.5px", fontWeight: "600",
                        color: "#0f2a27", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {task.title}
                      </p>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "#7aada5" }}>
                        {task.course.charAt(0).toUpperCase() + task.course.slice(1).toLowerCase()} · {task.deadline}
                      </p>
                    </div>
                    <div style={{
                      background: daysCfg.bg, color: daysCfg.color,
                      border: `1px solid ${daysCfg.border}`,
                      borderRadius: "999px", padding: "4px 11px",
                      fontSize: "11.5px", fontWeight: "700",
                      flexShrink: 0, whiteSpace: "nowrap",
                    }}>
                      {days === 0 ? "Today!" : `${days}d left`}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard