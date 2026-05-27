// src/components/ProfessorAlerts.jsx
// Phase 5: Professor Alert System - Complete Final Version

import { useEffect, useState } from 'react'
import API from '../api'

function ProfessorAlerts() {
    const [alertData, setAlertData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [raising, setRaising] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [studentNote, setStudentNote] = useState("")
    const [raiseMessage, setRaiseMessage] = useState("")
    const [raiseResult, setRaiseResult] = useState(null)

    const fetchAlerts = async () => {
        try {
            const res = await API.get("alerts/")
            setAlertData(res.data)
        } catch (err) {
            console.error("Alerts fetch error:", err)
        }
        setLoading(false)
    }

    useEffect(() => { fetchAlerts() }, [])

    // ── Raise alert ────────────────────────────────────────
    const handleRaiseAlert = async () => {
        setRaising(true)
        setRaiseMessage("")
        try {
            const res = await API.post("alerts/raise/", {
                message: studentNote
            })
            setRaiseResult(res.data)
            setRaiseMessage(
                res.data.already_exists
                    ? "⚠️ An alert is already pending for today."
                    : "🚨 Alert raised! Professor notified via email."
            )
            setShowForm(false)
            setStudentNote("")
            fetchAlerts()
        } catch (err) {
            setRaiseMessage(
                err.response?.data?.error || "❌ Could not raise alert."
            )
        }
        setRaising(false)
    }

    // ── Resolve alert ──────────────────────────────────────
    const handleResolve = async (alertId) => {
        try {
            await API.post(`alerts/${alertId}/resolve/`)
            setRaiseMessage("✅ Alert marked as resolved.")
            fetchAlerts()
        } catch (err) {
            setRaiseMessage("❌ Could not resolve alert.")
        }
    }

    // ── Config maps ────────────────────────────────────────
    const statusConfig = {
        pending: {
            bg: "#fffbeb",
            border: "#fde68a",
            color: "#d97706",
            icon: "⏳",
            label: "PENDING",
        },
        acknowledged: {
            bg: "#eff6ff",
            border: "#bfdbfe",
            color: "#2563eb",
            icon: "👁️",
            label: "SEEN",
        },
        resolved: {
            bg: "#f0fdfa",
            border: "#99f6e4",
            color: "#0d9488",
            icon: "✅",
            label: "RESOLVED",
        },
    }

    const alertTypeConfig = {
        auto: {
            bg: "#faf5ff",
            color: "#7c3aed",
            label: "🤖 AUTO",
        },
        manual: {
            bg: "#fef2f2",
            color: "#dc2626",
            label: "🙋 STUDENT",
        },
    }

    // ── Loading ────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px",
                color: "#7aada5",
            }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚨</div>
                <div style={{ fontSize: "14px" }}>Loading alert system...</div>
            </div>
        )
    }

    // ── No department ──────────────────────────────────────
    if (!alertData?.has_department) {
        return (
            <div style={{
                textAlign: "center",
                padding: "60px",
                background: "#f8fffe",
                border: "2px dashed #a7f3d0",
                borderRadius: "18px",
                color: "#7aada5",
            }}>
                <p style={{ fontSize: "52px" }}>🏫</p>
                <p style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#0f2a27",
                    marginTop: "12px",
                }}>
                    No department found
                </p>
                <p style={{ fontSize: "14px", marginTop: "4px" }}>
                    Join a department to use the alert system.
                </p>
            </div>
        )
    }

    const alerts = alertData.alerts || []

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            {/* ── Header ── */}
            <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "28px",
                flexWrap: "wrap",
                gap: "16px",
            }}>
                <div>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "6px",
                    }}>
                        <div style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                            boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
                        }}>
                            🚨
                        </div>
                        <div>
                            <h2 style={{
                                margin: 0,
                                fontSize: "22px",
                                fontWeight: "700",
                                fontFamily: "'Lora', serif",
                                color: "#0f2a27",
                            }}>
                                Professor Alert System
                            </h2>
                            <p style={{ margin: 0, fontSize: "12.5px", color: "#7aada5" }}>
                                {alertData.dept_name} · {alertData.dept_code}
                            </p>
                        </div>
                    </div>
                    <div style={{
                        height: "2px",
                        width: "80px",
                        background: "linear-gradient(90deg, #ef4444, transparent)",
                        borderRadius: "99px",
                        marginTop: "10px",
                    }} />
                </div>

                {/* Raise Alert button */}
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "11px 20px",
                        background: showForm
                            ? "white"
                            : "linear-gradient(135deg, #ef4444, #dc2626)",
                        border: showForm
                            ? "2px solid #fecaca"
                            : "none",
                        borderRadius: "12px",
                        color: showForm ? "#dc2626" : "white",
                        fontSize: "13.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                        boxShadow: showForm
                            ? "none"
                            : "0 4px 16px rgba(239,68,68,0.35)",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                        if (!showForm) {
                            e.currentTarget.style.transform = "translateY(-2px)"
                            e.currentTarget.style.boxShadow = "0 8px 24px rgba(239,68,68,0.45)"
                        }
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)"
                        e.currentTarget.style.boxShadow = showForm
                            ? "none"
                            : "0 4px 16px rgba(239,68,68,0.35)"
                    }}
                >
                    <span style={{ fontSize: "16px" }}>
                        {showForm ? "✕" : "🚨"}
                    </span>
                    {showForm ? "Cancel" : "Raise Stress Alert"}
                </button>
            </div>

            {/* ── Raise Alert Form ── */}
            {showForm && (
                <div style={{
                    background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: "16px",
                    padding: "22px",
                    marginBottom: "22px",
                }}>
                    <h3 style={{
                        margin: "0 0 6px",
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#b91c1c",
                        fontFamily: "'Lora', serif",
                    }}>
                        🚨 Raise Department Stress Alert
                    </h3>
                    <p style={{
                        margin: "0 0 16px",
                        fontSize: "12.5px",
                        color: "#991b1b",
                        lineHeight: 1.6,
                    }}>
                        This will notify your professor via email with the current
                        department stress score, affected tasks and an AI-generated
                        deadline extension suggestion.
                    </p>

                    <label style={{
                        display: "block",
                        marginBottom: "7px",
                        fontWeight: "600",
                        color: "#0f2a27",
                        fontSize: "13px",
                    }}>
                        📝 Add a note <span style={{ color: "#7aada5", fontWeight: 400 }}>
                            (optional)
                        </span>
                    </label>
                    <textarea
                        rows={3}
                        placeholder="e.g. We have 4 assignments due the same week. Please consider extending the Database Project deadline..."
                        value={studentNote}
                        onChange={e => setStudentNote(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 14px",
                            border: "1.5px solid #fecaca",
                            borderRadius: "9px",
                            fontSize: "13px",
                            outline: "none",
                            boxSizing: "border-box",
                            resize: "none",
                            background: "white",
                            color: "#0f2a27",
                            fontFamily: "inherit",
                            marginBottom: "14px",
                        }}
                    />

                    {/* What gets auto-attached */}
                    <div style={{
                        background: "rgba(255,255,255,0.7)",
                        border: "1px solid #fecaca",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        marginBottom: "14px",
                        fontSize: "12px",
                        color: "#991b1b",
                        lineHeight: 1.7,
                    }}>
                        <strong>What gets auto-attached to the email:</strong><br />
                        ✅ Current department stress score<br />
                        ✅ Number of deadline clashes detected<br />
                        ✅ Affected high-priority tasks list<br />
                        ✅ AI-generated deadline extension suggestion<br />
                        ✅ Number of students affected
                    </div>

                    <button
                        onClick={handleRaiseAlert}
                        disabled={raising}
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: raising
                                ? "#fca5a5"
                                : "linear-gradient(135deg, #ef4444, #dc2626)",
                            border: "none",
                            borderRadius: "10px",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "700",
                            cursor: raising ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                            transition: "all 0.2s",
                        }}
                    >
                        {raising ? "⏳ Raising Alert..." : "🚨 Raise Alert Now"}
                    </button>
                </div>
            )}

            {/* ── Raise result message ── */}
            {raiseMessage && (
                <div style={{
                    marginBottom: "20px",
                    padding: "12px 16px",
                    background: raiseMessage.startsWith("❌") || raiseMessage.startsWith("⚠️")
                        ? "#fef2f2" : "#f0fdfa",
                    color: raiseMessage.startsWith("❌") || raiseMessage.startsWith("⚠️")
                        ? "#dc2626" : "#0d9488",
                    border: `1px solid ${raiseMessage.startsWith("❌") || raiseMessage.startsWith("⚠️")
                            ? "#fecaca" : "#99f6e4"
                        }`,
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    fontWeight: "500",
                }}>
                    {raiseMessage}
                    {raiseResult?.suggestion && (
                        <div style={{
                            marginTop: "8px",
                            fontSize: "12px",
                            color: "#4a7a7a",
                            lineHeight: 1.6,
                        }}>
                            💡 <strong>AI Suggestion:</strong> {raiseResult.suggestion}
                        </div>
                    )}
                    {raiseResult?.email_sent === false && (
                        <div style={{
                            marginTop: "6px",
                            fontSize: "12px",
                            color: "#d97706",
                        }}>
                            ⚠️ Alert saved but email delivery failed. Check PROFESSOR_EMAIL in settings.
                        </div>
                    )}
                    <button
                        onClick={() => { setRaiseMessage(""); setRaiseResult(null) }}
                        style={{
                            float: "right",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "inherit",
                            fontWeight: "700",
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ── Stats Row ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
                marginBottom: "22px",
            }}>
                {[
                    {
                        icon: "🚨",
                        label: "TOTAL ALERTS",
                        value: alerts.length,
                        color: "#dc2626",
                        bg: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                        border: "rgba(239,68,68,0.2)",
                    },
                    {
                        icon: "⏳",
                        label: "PENDING",
                        value: alerts.filter(a => a.status === "pending").length,
                        color: "#d97706",
                        bg: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                        border: "rgba(245,158,11,0.2)",
                    },
                    {
                        icon: "✅",
                        label: "RESOLVED",
                        value: alerts.filter(a => a.status === "resolved").length,
                        color: "#0d9488",
                        bg: "linear-gradient(135deg, #f0fdfa, #d1faf4)",
                        border: "rgba(13,148,136,0.2)",
                    },
                ].map(stat => (
                    <div key={stat.label} style={{
                        background: stat.bg,
                        borderRadius: "14px",
                        padding: "18px",
                        border: `1px solid ${stat.border}`,
                        boxShadow: `0 2px 12px ${stat.border}`,
                        textAlign: "center",
                    }}>
                        <div style={{ fontSize: "28px", marginBottom: "6px" }}>
                            {stat.icon}
                        </div>
                        <div style={{
                            fontSize: "32px",
                            fontWeight: "800",
                            color: stat.color,
                            lineHeight: 1,
                        }}>
                            {stat.value}
                        </div>
                        <div style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: stat.color,
                            marginTop: "4px",
                            letterSpacing: "0.08em",
                        }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Alert List ── */}
            <div style={{
                background: "white",
                borderRadius: "18px",
                padding: "24px",
                border: "1px solid rgba(13,148,136,0.1)",
                boxShadow: "0 4px 24px rgba(13,148,136,0.06)",
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "18px",
                }}>
                    <div style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #ef4444, #f87171)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                    }}>
                        📋
                    </div>
                    <h3 style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#0f2a27",
                        fontFamily: "'Lora', serif",
                    }}>
                        Alert History
                    </h3>
                    <span style={{
                        marginLeft: "auto",
                        fontSize: "12px",
                        color: "#7aada5",
                    }}>
                        Last 10 alerts
                    </span>
                </div>

                {alerts.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#7aada5",
                    }}>
                        <p style={{ fontSize: "40px" }}>✅</p>
                        <p style={{
                            fontSize: "15px",
                            fontWeight: "700",
                            color: "#0f2a27",
                        }}>
                            No alerts raised yet
                        </p>
                        <p style={{ fontSize: "13px", marginTop: "4px" }}>
                            When dept stress exceeds 7.5/10, alerts appear here.
                        </p>
                    </div>
                ) : (
                    alerts.map(alert => {
                        const sc = statusConfig[alert.status] || statusConfig.pending
                        const atc = alertTypeConfig[alert.alert_type] || alertTypeConfig.auto

                        return (
                            <div key={alert.id} style={{
                                border: `1px solid ${sc.border}`,
                                borderRadius: "14px",
                                padding: "18px",
                                marginBottom: "12px",
                                background: sc.bg,
                                transition: "transform 0.15s, box-shadow 0.15s",
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = "translateY(-1px)"
                                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = "translateY(0)"
                                    e.currentTarget.style.boxShadow = "none"
                                }}
                            >
                                {/* Alert header */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    marginBottom: "12px",
                                    flexWrap: "wrap",
                                }}>
                                    <span style={{ fontSize: "22px" }}>{sc.icon}</span>

                                    {/* Stress score */}
                                    <div style={{
                                        fontSize: "20px",
                                        fontWeight: "800",
                                        color: alert.stress_score >= 8
                                            ? "#dc2626"
                                            : alert.stress_score >= 6
                                                ? "#d97706"
                                                : "#0d9488",
                                    }}>
                                        {alert.stress_score}/10
                                    </div>

                                    {/* Status badge */}
                                    <span style={{
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        padding: "3px 9px",
                                        borderRadius: "999px",
                                        background: sc.bg,
                                        color: sc.color,
                                        border: `1px solid ${sc.border}`,
                                        letterSpacing: "0.06em",
                                    }}>
                                        {sc.icon} {sc.label}
                                    </span>

                                    {/* Type badge */}
                                    <span style={{
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        padding: "3px 9px",
                                        borderRadius: "999px",
                                        background: atc.bg,
                                        color: atc.color,
                                        letterSpacing: "0.06em",
                                    }}>
                                        {atc.label}
                                    </span>

                                    {/* Time */}
                                    <span style={{
                                        marginLeft: "auto",
                                        fontSize: "11px",
                                        color: "#7aada5",
                                        whiteSpace: "nowrap",
                                    }}>
                                        🕐 {alert.created_at}
                                    </span>
                                </div>

                                {/* Message */}
                                <div style={{
                                    background: "rgba(255,255,255,0.7)",
                                    border: `1px solid ${sc.border}`,
                                    borderRadius: "10px",
                                    padding: "12px 14px",
                                    marginBottom: "10px",
                                    fontSize: "12.5px",
                                    color: "#374151",
                                    lineHeight: 1.7,
                                    whiteSpace: "pre-line",
                                }}>
                                    {alert.message}
                                </div>

                                {/* AI Suggestion */}
                                {alert.suggestion && (
                                    <div style={{
                                        background: "linear-gradient(135deg, #f0fdfa, #e6faf6)",
                                        border: "1px solid rgba(13,148,136,0.2)",
                                        borderRadius: "10px",
                                        padding: "10px 14px",
                                        marginBottom: "10px",
                                        fontSize: "12px",
                                        color: "#0d7a7a",
                                        lineHeight: 1.7,
                                    }}>
                                        <strong>💡 AI Suggestion:</strong><br />
                                        {alert.suggestion}
                                    </div>
                                )}

                                {/* Affected tasks */}
                                {alert.affected_tasks?.length > 0 && (
                                    <div style={{
                                        display: "flex",
                                        gap: "6px",
                                        flexWrap: "wrap",
                                        marginBottom: "10px",
                                    }}>
                                        <span style={{
                                            fontSize: "11px",
                                            color: "#7aada5",
                                            alignSelf: "center",
                                        }}>
                                            Affected tasks:
                                        </span>
                                        {alert.affected_tasks.map(t => (
                                            <span key={t.id} style={{
                                                fontSize: "11px",
                                                fontWeight: "600",
                                                padding: "2px 9px",
                                                borderRadius: "999px",
                                                background: "rgba(255,255,255,0.8)",
                                                border: `1px solid ${sc.border}`,
                                                color: "#0f2a27",
                                            }}>
                                                📌 {t.title}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Footer — view only for students */}
                                <div style={{
                                    marginTop: "10px",
                                    fontSize: "11px",
                                    color: "#7aada5",
                                    display: "flex",
                                    gap: "16px",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                }}>
                                    <span>👤 Raised by: <strong>{alert.raised_by}</strong></span>
                                    <span>👥 {alert.students_count} students affected</span>

                                    {/* Status indicator — no button */}
                                    <div style={{ marginLeft: "auto" }}>
                                        {alert.status === 'pending' && (
                                            <span style={{
                                                padding: "4px 12px",
                                                background: "#fffbeb",
                                                border: "1px solid #fde68a",
                                                borderRadius: "8px",
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                color: "#d97706",
                                            }}>
                                                ⏳ Awaiting professor response
                                            </span>
                                        )}
                                        {alert.status === 'resolved' && (
                                            <span style={{
                                                padding: "4px 12px",
                                                background: "#f0fdfa",
                                                border: "1px solid #99f6e4",
                                                borderRadius: "8px",
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                color: "#0d9488",
                                            }}>
                                                ✅ Resolved by Professor
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default ProfessorAlerts