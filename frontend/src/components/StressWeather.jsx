// StressWeather.jsx - Upgraded with task names display

function StressWeather({ stress, isPersonalized, tasks = [] }) {

  if (!stress || Object.keys(stress).length === 0) {
    return (
      <div style={{ marginTop: "20px" }}>
        <div style={{
          textAlign: "center", padding: "52px",
          background: "#f8fffe", border: "2px dashed #a7f3d0",
          borderRadius: "18px", color: "#7aada5",
        }}>
          <p style={{ fontSize: "48px" }}>🌤️</p>
          <p style={{ fontSize: "18px", fontWeight: "700",
            color: "#0f2a27", marginTop: "12px" }}>
            All clear!
          </p>
          <p style={{ fontSize: "14px", marginTop: "4px" }}>
            No stress data yet. Add some tasks first.
          </p>
        </div>
      </div>
    )
  }

  // Get tasks for a specific date (±1 day window)
  const getTasksForDate = (dateStr) => {
    const target = new Date(dateStr)
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline)
      const diff = Math.abs((taskDate - target) / (1000 * 60 * 60 * 24))
      return diff <= 1
    })
  }

  const priorityColor = (priority) => {
    if (priority === "high")   return { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" }
    if (priority === "medium") return { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" }
    return { bg: "#f0fdfa", color: "#0d9488", dot: "#0d9488" }
  }

  return (
    <div style={{ marginTop: "20px" }}>

      {/* ── Personalized banner ── */}
      <div style={{
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "space-between",
        marginBottom:    "20px",
        padding:         "14px 18px",
        background:      isPersonalized ? "#f0fdfa" : "#fffbeb",
        border:          `1px solid ${isPersonalized ? "#99f6e4" : "#fde68a"}`,
        borderRadius:    "14px",
        flexWrap:        "wrap",
        gap:             "8px",
        boxShadow:       "0 2px 10px rgba(13,148,136,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width:           "34px",
            height:          "34px",
            borderRadius:    "10px",
            background:      isPersonalized
              ? "linear-gradient(135deg, #0d9488, #14b8a6)"
              : "linear-gradient(135deg, #f59e0b, #fbbf24)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            fontSize:        "17px",
            boxShadow:       "0 2px 8px rgba(13,148,136,0.2)",
          }}>
            {isPersonalized ? "🧠" : "📊"}
          </div>
          <div>
            <div style={{
              fontSize:   "13.5px",
              fontWeight: "700",
              color:      isPersonalized ? "#0d7a7a" : "#d97706",
            }}>
              {isPersonalized
                ? "Personalized Stress Model Active"
                : "Generic Stress Model"}
            </div>
            <div style={{
              fontSize: "11.5px",
              color:    isPersonalized ? "#7aada5" : "#92400e",
            }}>
              {isPersonalized
                ? "Scores calibrated to YOUR work speed and history"
                : "Complete 3+ tasks to unlock personalized predictions"}
            </div>
          </div>
        </div>
        <div style={{
          padding:      "5px 14px",
          borderRadius: "999px",
          fontSize:     "11.5px",
          fontWeight:   "700",
          background:   isPersonalized
            ? "linear-gradient(135deg, #0d9488, #14b8a6)"
            : "#f59e0b",
          color:        "white",
          boxShadow:    "0 2px 8px rgba(13,148,136,0.2)",
        }}>
          {isPersonalized ? "~85% Accuracy" : "~55% Accuracy"}
        </div>
      </div>

      {/* ── Stress date cards ── */}
      {Object.entries(stress)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, value]) => {
          const isHigh   = value >= 8
          const isMedium = value >= 4

          const config = isHigh ? {
            bg:          "#fff0f0",
            border:      "#ef4444",
            headerBg:    "linear-gradient(135deg, #fef2f2, #fee2e2)",
            icon:        "🔥",
            label:       "High stress — burnout risk",
            labelBg:     "#fef2f2",
            labelColor:  "#dc2626",
            labelBorder: "#fecaca",
            bar:         "linear-gradient(90deg, #ef4444, #dc2626)",
            barBg:       "#fecaca",
            scoreColor:  "#dc2626",
          } : isMedium ? {
            bg:          "#fffbeb",
            border:      "#f59e0b",
            headerBg:    "linear-gradient(135deg, #fffbeb, #fef3c7)",
            icon:        "⚡",
            label:       "Moderate — stay alert",
            labelBg:     "#fffbeb",
            labelColor:  "#d97706",
            labelBorder: "#fde68a",
            bar:         "linear-gradient(90deg, #f59e0b, #d97706)",
            barBg:       "#fde68a",
            scoreColor:  "#d97706",
          } : {
            bg:          "#f0fdfa",
            border:      "#0d9488",
            headerBg:    "linear-gradient(135deg, #f0fdfa, #d1faf4)",
            icon:        "✅",
            label:       "Low stress — you're good",
            labelBg:     "#f0fdfa",
            labelColor:  "#0d7a7a",
            labelBorder: "#99f6e4",
            bar:         "linear-gradient(90deg, #0d9488, #14b8a6)",
            barBg:       "#a7f3d0",
            scoreColor:  "#0d9488",
          }

          const barWidth   = Math.min((value / 10) * 100, 100)
          const dateTasks  = getTasksForDate(date)

          // Format date nicely
          const dateObj     = new Date(date + 'T00:00:00')
          const dayName     = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
          const dateFormatted = dateObj.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })

          return (
            <div key={date} style={{
              border:       `1.5px solid ${config.border}`,
              borderRadius: "16px",
              marginBottom: "14px",
              overflow:     "hidden",
              boxShadow:    "0 2px 14px rgba(13,148,136,0.06)",
              transition:   "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform  = "translateY(-2px)"
                e.currentTarget.style.boxShadow  = "0 8px 28px rgba(13,148,136,0.12)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform  = "translateY(0)"
                e.currentTarget.style.boxShadow  = "0 2px 14px rgba(13,148,136,0.06)"
              }}
            >
              {/* ── Card header ── */}
              <div style={{
                background: config.headerBg,
                padding:    "16px 20px",
                display:    "flex",
                alignItems: "center",
                gap:        "14px",
              }}>
                {/* Icon */}
                <div style={{
                  width:           "42px",
                  height:          "42px",
                  borderRadius:    "12px",
                  background:      "white",
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  fontSize:        "22px",
                  flexShrink:      0,
                  boxShadow:       `0 2px 8px ${config.border}44`,
                }}>
                  {config.icon}
                </div>

                {/* Date info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize:   "15px",
                    fontWeight: "700",
                    color:      "#0f2a27",
                    fontFamily: "'Lora', serif",
                  }}>
                    {dayName}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color:    "#7aada5",
                  }}>
                    📅 {dateFormatted}
                  </div>
                </div>

                {/* Score + label */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontSize:   "28px",
                    fontWeight: "800",
                    color:      config.scoreColor,
                    lineHeight: 1,
                  }}>
                    {value}
                    <span style={{ fontSize: "14px", fontWeight: "400" }}>
                      /10
                    </span>
                  </div>
                  <div style={{
                    marginTop:    "4px",
                    fontSize:     "10.5px",
                    fontWeight:   "700",
                    padding:      "3px 10px",
                    borderRadius: "999px",
                    background:   config.labelBg,
                    color:        config.labelColor,
                    border:       `1px solid ${config.labelBorder}`,
                    whiteSpace:   "nowrap",
                  }}>
                    {config.label}
                  </div>
                </div>
              </div>

              {/* ── Stress bar ── */}
              <div style={{
                padding:    "12px 20px",
                background: "white",
              }}>
                <div style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  alignItems:     "center",
                  marginBottom:   "6px",
                }}>
                  <span style={{
                    fontSize:   "11px",
                    color:      "#7aada5",
                    fontWeight: "600",
                    letterSpacing: "0.04em",
                  }}>
                    STRESS INTENSITY
                  </span>
                  <span style={{
                    fontSize:   "11px",
                    color:      config.scoreColor,
                    fontWeight: "700",
                  }}>
                    {barWidth.toFixed(0)}%
                    {isPersonalized && (
                      <span style={{ color: "#0d9488", marginLeft: "5px" }}>
                        · personalized ✦
                      </span>
                    )}
                  </span>
                </div>
                <div style={{
                  background:   config.barBg,
                  borderRadius: "999px",
                  height:       "10px",
                  overflow:     "hidden",
                }}>
                  <div style={{
                    width:        `${barWidth}%`,
                    background:   config.bar,
                    borderRadius: "999px",
                    height:       "10px",
                    transition:   "width 0.7s cubic-bezier(0.23,1,0.32,1)",
                    boxShadow:    `0 0 10px ${config.border}66`,
                  }} />
                </div>
              </div>

              {/* ── Tasks on this date ── */}
              {dateTasks.length > 0 && (
                <div style={{
                  padding:    "0 20px 16px",
                  background: "white",
                }}>
                  <div style={{
                    fontSize:      "11px",
                    fontWeight:    "700",
                    color:         "#7aada5",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom:  "8px",
                  }}>
                    Tasks on this date
                  </div>
                  <div style={{
                    display:  "flex",
                    flexWrap: "wrap",
                    gap:      "6px",
                  }}>
                    {dateTasks.map(task => {
                      const pc = priorityColor(task.priority)
                      return (
                        <div key={task.id} style={{
                          display:      "flex",
                          alignItems:   "center",
                          gap:          "6px",
                          padding:      "5px 10px",
                          background:   pc.bg,
                          border:       `1px solid ${pc.dot}33`,
                          borderRadius: "8px",
                          fontSize:     "12px",
                          fontWeight:   "500",
                          color:        pc.color,
                        }}>
                          <div style={{
                            width:        "6px",
                            height:       "6px",
                            borderRadius: "50%",
                            background:   pc.dot,
                            flexShrink:   0,
                          }} />
                          <span style={{
                            maxWidth:     "180px",
                            overflow:     "hidden",
                            whiteSpace:   "nowrap",
                            textOverflow: "ellipsis",
                          }}>
                            {task.title}
                          </span>
                          <span style={{
                            fontSize:  "10px",
                            color:     "#7aada5",
                            flexShrink: 0,
                          }}>
                            · {task.course?.charAt(0).toUpperCase() +
                               task.course?.slice(1).toLowerCase()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* No tasks message */}
              {dateTasks.length === 0 && (
                <div style={{
                  padding:   "0 20px 14px",
                  background: "white",
                  fontSize:  "12px",
                  color:     "#7aada5",
                }}>
                  No specific tasks found for this date window.
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}

export default StressWeather