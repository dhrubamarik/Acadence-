// src/components/DepartmentDashboard.jsx
// Phase 4: Department Stress Dashboard + Crowd Difficulty

import { useEffect, useState } from 'react'
import API from '../api'

function DepartmentDashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get("department/analytics/")
        setData(res.data)
      } catch (err) {
        setError("Could not load department data.")
      }
      setLoading(false)
    }
    fetch()
  }, [])

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "80px",
        color:          "#7aada5",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏫</div>
        <div style={{ fontSize: "14px", letterSpacing: "0.05em" }}>
          Loading department intelligence...
        </div>
      </div>
    )
  }

  // ── No department ────────────────────────────────────────
  if (!data?.has_department) {
    return (
      <div style={{
        textAlign:    "center",
        padding:      "60px",
        background:   "#f8fffe",
        border:       "2px dashed #a7f3d0",
        borderRadius: "18px",
        color:        "#7aada5",
      }}>
        <p style={{ fontSize: "52px" }}>🏫</p>
        <p style={{
          fontSize:   "18px",
          fontWeight: "700",
          color:      "#0f2a27",
          marginTop:  "12px",
        }}>
          Not in a department yet
        </p>
        <p style={{ fontSize: "14px", marginTop: "4px" }}>
          Join a department during registration to see collective intelligence.
        </p>
      </div>
    )
  }

  const {
    department,
    this_week,
    top_stressors,
    task_intelligence,
    dept_stats,
  } = data

  // ── Stress config ────────────────────────────────────────
  const stressConfig = {
    high: {
      bg:     "linear-gradient(135deg, #fef2f2, #fee2e2)",
      border: "rgba(239,68,68,0.25)",
      color:  "#dc2626",
      icon:   "🔥",
      label:  "High Stress Week",
    },
    medium: {
      bg:     "linear-gradient(135deg, #fffbeb, #fef3c7)",
      border: "rgba(245,158,11,0.25)",
      color:  "#d97706",
      icon:   "⚡",
      label:  "Moderate Stress Week",
    },
    low: {
      bg:     "linear-gradient(135deg, #f0fdfa, #d1faf4)",
      border: "rgba(13,148,136,0.2)",
      color:  "#0d9488",
      icon:   "✅",
      label:  "Low Stress Week",
    },
  }

  const sc = stressConfig[this_week.stress_level]

  // ── Difficulty stars ─────────────────────────────────────
  const DifficultyStars = ({ rating, count }) => {
    if (!rating) return (
      <span style={{ fontSize: "11px", color: "#7aada5" }}>
        No ratings yet
      </span>
    )
    const full  = Math.round(rating)
    const stars = "⭐".repeat(full) + "☆".repeat(5 - full)
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ fontSize: "12px" }}>{stars}</span>
        <span style={{
          fontSize:   "11.5px",
          fontWeight: "700",
          color:      "#0f2a27",
        }}>
          {rating}/5
        </span>
        <span style={{ fontSize: "11px", color: "#7aada5" }}>
          ({count} rated)
        </span>
      </div>
    )
  }

  // ── Priority badge ───────────────────────────────────────
  const PriorityBadge = ({ priority }) => {
    const cfg = {
      high:   { bg: "#fef2f2", color: "#dc2626", label: "🔴 HIGH"   },
      medium: { bg: "#fffbeb", color: "#d97706", label: "🟡 MED"    },
      low:    { bg: "#f0fdfa", color: "#0d9488", label: "🟢 LOW"    },
    }[priority] || { bg: "#f0fdfa", color: "#0d9488", label: "🟢 LOW" }

    return (
      <span style={{
        fontSize:     "10px",
        fontWeight:   "700",
        padding:      "2px 8px",
        borderRadius: "999px",
        background:   cfg.bg,
        color:        cfg.color,
      }}>
        {cfg.label}
      </span>
    )
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width:          "42px",
            height:         "42px",
            borderRadius:   "12px",
            background:     "linear-gradient(135deg, #0d9488, #14b8a6)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       "22px",
            boxShadow:      "0 4px 14px rgba(13,148,136,0.3)",
          }}>
            🏫
          </div>
          <div>
            <h1 style={{
              margin:     "0 0 3px",
              fontSize:   "24px",
              fontWeight: "700",
              fontFamily: "'Lora', serif",
              background: "linear-gradient(135deg, #0d9488, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              backgroundClip:       "text",
            }}>
              {department.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontSize:     "11px",
                fontWeight:   "700",
                padding:      "2px 10px",
                borderRadius: "999px",
                background:   "linear-gradient(135deg, #0d9488, #14b8a6)",
                color:        "white",
                letterSpacing: "0.06em",
              }}>
                {department.code}
              </span>
              <span style={{ fontSize: "12.5px", color: "#7aada5" }}>
                {department.total_students} student{department.total_students !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div style={{
          marginTop:    "14px",
          height:       "2px",
          width:        "80px",
          background:   "linear-gradient(90deg, #0d9488, transparent)",
          borderRadius: "99px",
        }} />
      </div>

      {/* ── This Week Overview ── */}
      <div style={{
        background:   sc.bg,
        border:       `1px solid ${sc.border}`,
        borderRadius: "18px",
        padding:      "24px",
        marginBottom: "22px",
        display:      "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap:          "20px",
      }}>
        {/* Dept stress */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "4px" }}>
            {sc.icon}
          </div>
          <div style={{
            fontSize:   "32px",
            fontWeight: "800",
            color:      sc.color,
            lineHeight: 1,
          }}>
            {this_week.dept_stress}
            <span style={{ fontSize: "16px", fontWeight: "400" }}>/10</span>
          </div>
          <div style={{
            fontSize:   "11px",
            color:      sc.color,
            fontWeight: "600",
            marginTop:  "4px",
            letterSpacing: "0.05em",
          }}>
            DEPT STRESS
          </div>
          <div style={{
            fontSize:     "10px",
            color:        sc.color,
            background:   "rgba(255,255,255,0.6)",
            borderRadius: "999px",
            padding:      "2px 10px",
            marginTop:    "6px",
            display:      "inline-block",
          }}>
            {sc.label}
          </div>
        </div>

        {/* Your stress vs dept */}
        <div style={{
          textAlign:    "center",
          borderLeft:   `1px solid ${sc.border}`,
          borderRight:  `1px solid ${sc.border}`,
          padding:      "0 20px",
        }}>
          <div style={{ fontSize: "36px", marginBottom: "4px" }}>🎯</div>
          <div style={{
            fontSize:   "32px",
            fontWeight: "800",
            color:      "#0f2a27",
            lineHeight: 1,
          }}>
            {this_week.user_stress}
            <span style={{ fontSize: "16px", fontWeight: "400" }}>/10</span>
          </div>
          <div style={{
            fontSize:      "11px",
            color:         "#7aada5",
            fontWeight:    "600",
            marginTop:     "4px",
            letterSpacing: "0.05em",
          }}>
            YOUR STRESS
          </div>

          {/* Comparison */}
          <div style={{
            marginTop:    "6px",
            fontSize:     "10.5px",
            fontWeight:   "600",
            color:        this_week.user_stress > this_week.dept_stress
              ? "#dc2626" : "#0d9488",
          }}>
            {this_week.user_stress > this_week.dept_stress
              ? `▲ ${round1(this_week.user_stress - this_week.dept_stress)} above avg`
              : this_week.user_stress < this_week.dept_stress
              ? `▼ ${round1(this_week.dept_stress - this_week.user_stress)} below avg`
              : "= At dept average"
            }
          </div>
        </div>

        {/* This week tasks */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "4px" }}>📅</div>
          <div style={{
            fontSize:   "32px",
            fontWeight: "800",
            color:      "#0891b2",
            lineHeight: 1,
          }}>
            {this_week.task_count}
          </div>
          <div style={{
            fontSize:      "11px",
            color:         "#7aada5",
            fontWeight:    "600",
            marginTop:     "4px",
            letterSpacing: "0.05em",
          }}>
            TASKS THIS WEEK
          </div>
          <div style={{
            fontSize:     "10px",
            color:        "#0891b2",
            background:   "rgba(255,255,255,0.6)",
            borderRadius: "999px",
            padding:      "2px 10px",
            marginTop:    "6px",
            display:      "inline-block",
          }}>
            {dept_stats.completion_rate}% on-time rate
          </div>
        </div>
      </div>

      {/* ── Two Columns ── */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "1fr 1fr",
        gap:                 "22px",
        marginBottom:        "22px",
      }}>

        {/* LEFT — Top Stressors */}
        <div style={{
          background:   "white",
          borderRadius: "18px",
          padding:      "24px",
          border:       "1px solid rgba(13,148,136,0.1)",
          boxShadow:    "0 4px 24px rgba(13,148,136,0.06)",
        }}>
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "10px",
            marginBottom: "18px",
          }}>
            <div style={{
              width:          "28px",
              height:         "28px",
              borderRadius:   "8px",
              background:     "linear-gradient(135deg, #ef4444, #f87171)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       "14px",
            }}>
              🔥
            </div>
            <h3 style={{
              margin:     0,
              fontSize:   "15px",
              fontWeight: "700",
              color:      "#0f2a27",
              fontFamily: "'Lora', serif",
            }}>
              Top Stressors
            </h3>
          </div>

          {top_stressors.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding:   "24px",
              color:     "#7aada5",
              fontSize:  "13px",
            }}>
              <p style={{ fontSize: "32px" }}>✅</p>
              <p>No major stressors this week!</p>
            </div>
          ) : (
            top_stressors.map((task, idx) => (
              <div key={task.id} style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "12px",
                padding:      "12px",
                borderRadius: "10px",
                background:   idx === 0 ? "#fef2f2" : "#fafafa",
                marginBottom: "8px",
                border:       `1px solid ${idx === 0 ? "#fecaca" : "#f0f0f0"}`,
              }}>
                {/* Rank */}
                <div style={{
                  width:          "28px",
                  height:         "28px",
                  borderRadius:   "8px",
                  background:     idx === 0
                    ? "linear-gradient(135deg, #ef4444, #dc2626)"
                    : idx === 1
                    ? "linear-gradient(135deg, #f97316, #fb923c)"
                    : "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  color:          "white",
                  fontSize:       "13px",
                  fontWeight:     "800",
                  flexShrink:     0,
                }}>
                  {idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize:       "13px",
                    fontWeight:     "600",
                    color:          "#0f2a27",
                    whiteSpace:     "nowrap",
                    overflow:       "hidden",
                    textOverflow:   "ellipsis",
                    marginBottom:   "3px",
                  }}>
                    {task.title}
                  </div>
                  <div style={{
                    display:    "flex",
                    alignItems: "center",
                    gap:        "6px",
                    flexWrap:   "wrap",
                  }}>
                    <PriorityBadge priority={task.priority} />
                    <span style={{ fontSize: "11px", color: "#7aada5" }}>
                      {task.days_until === 0
                        ? "Due today"
                        : task.days_until < 0
                        ? "Overdue"
                        : `${task.days_until}d left`}
                    </span>
                  </div>
                </div>

                {/* Difficulty */}
                {task.avg_difficulty && (
                  <div style={{
                    textAlign:  "center",
                    flexShrink: 0,
                  }}>
                    <div style={{
                      fontSize:   "13px",
                      fontWeight: "700",
                      color:      "#0f2a27",
                    }}>
                      {task.avg_difficulty}/5
                    </div>
                    <div style={{ fontSize: "10px", color: "#7aada5" }}>
                      difficulty
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* RIGHT — Dept Stats */}
        <div style={{
          background:   "white",
          borderRadius: "18px",
          padding:      "24px",
          border:       "1px solid rgba(13,148,136,0.1)",
          boxShadow:    "0 4px 24px rgba(13,148,136,0.06)",
        }}>
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "10px",
            marginBottom: "18px",
          }}>
            <div style={{
              width:          "28px",
              height:         "28px",
              borderRadius:   "8px",
              background:     "linear-gradient(135deg, #0d9488, #14b8a6)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       "14px",
            }}>
              📊
            </div>
            <h3 style={{
              margin:     0,
              fontSize:   "15px",
              fontWeight: "700",
              color:      "#0f2a27",
              fontFamily: "'Lora', serif",
            }}>
              Department Stats
            </h3>
          </div>

          {[
            {
              icon:    "📋",
              label:   "Total Group Tasks",
              value:   dept_stats.total_tasks,
              color:   "#0d9488",
              sub:     "shared with department",
            },
            {
              icon:    "✅",
              label:   "Total Completions",
              value:   dept_stats.total_completions,
              color:   "#0891b2",
              sub:     "tasks marked done",
            },
            {
              icon:    "🎯",
              label:   "On-Time Rate",
              value:   `${dept_stats.completion_rate}%`,
              color:   dept_stats.completion_rate >= 70 ? "#0d9488" : "#d97706",
              sub:     "submitted before deadline",
            },
            {
              icon:    "👥",
              label:   "Dept Students",
              value:   department.total_students,
              color:   "#7c3aed",
              sub:     "in your department",
            },
          ].map(stat => (
            <div key={stat.label} style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "14px",
              padding:      "12px",
              borderRadius: "10px",
              background:   "#f8fffe",
              marginBottom: "8px",
              border:       "1px solid rgba(13,148,136,0.08)",
            }}>
              <span style={{ fontSize: "20px" }}>{stat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize:   "11px",
                  color:      "#7aada5",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "11px", color: "#7aada5" }}>
                  {stat.sub}
                </div>
              </div>
              <div style={{
                fontSize:   "22px",
                fontWeight: "800",
                color:      stat.color,
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Crowd Difficulty Table ── */}
      <div style={{
        background:   "white",
        borderRadius: "18px",
        padding:      "24px",
        border:       "1px solid rgba(13,148,136,0.1)",
        boxShadow:    "0 4px 24px rgba(13,148,136,0.06)",
      }}>
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "10px",
          marginBottom: "18px",
        }}>
          <div style={{
            width:          "28px",
            height:         "28px",
            borderRadius:   "8px",
            background:     "linear-gradient(135deg, #7c3aed, #9333ea)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       "14px",
          }}>
            🧠
          </div>
          <div>
            <h3 style={{
              margin:     0,
              fontSize:   "15px",
              fontWeight: "700",
              color:      "#0f2a27",
              fontFamily: "'Lora', serif",
            }}>
              Crowd Difficulty Intelligence
            </h3>
            <p style={{ margin: 0, fontSize: "11.5px", color: "#7aada5" }}>
              Rated by students who completed each task
            </p>
          </div>
        </div>

        {task_intelligence.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding:   "30px",
            color:     "#7aada5",
          }}>
            <p style={{ fontSize: "32px" }}>📭</p>
            <p>No department tasks yet.</p>
          </div>
        ) : (
          task_intelligence.map((task, idx) => (
            <div key={task.id} style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "14px",
              padding:      "13px 14px",
              borderRadius: "10px",
              marginBottom: "6px",
              background:   task.is_this_week
                ? "linear-gradient(135deg, #f0fdfa, #e6faf6)"
                : "#fafafa",
              border:       `1px solid ${
                task.is_this_week
                  ? "rgba(13,148,136,0.15)"
                  : "#f0f0f0"
              }`,
              transition:   "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform  = "translateY(-1px)"
                e.currentTarget.style.boxShadow  = "0 4px 16px rgba(13,148,136,0.1)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform  = "translateY(0)"
                e.currentTarget.style.boxShadow  = "none"
              }}
            >
              {/* This week indicator */}
              <div style={{
                width:          "6px",
                height:         "40px",
                borderRadius:   "999px",
                background:     task.is_this_week
                  ? "linear-gradient(180deg, #0d9488, #14b8a6)"
                  : "#e5e7eb",
                flexShrink:     0,
                boxShadow:      task.is_this_week
                  ? "0 0 8px rgba(13,148,136,0.4)"
                  : "none",
              }} />

              {/* Task info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display:     "flex",
                  alignItems:  "center",
                  gap:         "7px",
                  marginBottom: "4px",
                  flexWrap:    "wrap",
                }}>
                  <span style={{
                    fontSize:     "13.5px",
                    fontWeight:   "600",
                    color:        "#0f2a27",
                    whiteSpace:   "nowrap",
                    overflow:     "hidden",
                    textOverflow: "ellipsis",
                    maxWidth:     "200px",
                  }}>
                    {task.title}
                  </span>
                  <PriorityBadge priority={task.priority} />
                  {task.is_verified && (
                    <span style={{
                      fontSize:     "10px",
                      fontWeight:   "700",
                      padding:      "2px 7px",
                      borderRadius: "999px",
                      background:   "#f0fdfa",
                      color:        "#059669",
                      border:       "1px solid #a7f3d0",
                    }}>
                      ✅ VERIFIED
                    </span>
                  )}
                  {task.is_this_week && (
                    <span style={{
                      fontSize:     "10px",
                      fontWeight:   "700",
                      padding:      "2px 7px",
                      borderRadius: "999px",
                      background:   "linear-gradient(135deg, #0d9488, #14b8a6)",
                      color:        "white",
                    }}>
                      THIS WEEK
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: "11.5px",
                  color:    "#7aada5",
                }}>
                  📘 {task.course} · 📅 {task.deadline}
                  {task.days_until >= 0
                    ? ` · ${task.days_until}d left`
                    : " · Overdue"}
                </div>
              </div>

              {/* Crowd rating */}
              <div style={{
                textAlign:  "right",
                flexShrink: 0,
              }}>
                <DifficultyStars
                  rating={task.avg_difficulty}
                  count={task.rating_count}
                />
                {task.avg_hours && (
                  <div style={{
                    fontSize:  "11px",
                    color:     "#7aada5",
                    marginTop: "3px",
                  }}>
                    ⏱️ avg {task.avg_hours}h to complete
                  </div>
                )}
                {task.approval_count > 0 && (
                  <div style={{
                    fontSize:  "11px",
                    color:     "#0d9488",
                    marginTop: "3px",
                  }}>
                    👍 {task.approval_count} approved
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Helper
const round1 = (n) => Math.round(n * 10) / 10

export default DepartmentDashboard