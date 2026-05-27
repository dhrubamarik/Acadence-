// LandingPage.jsx
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '../context/AuthContext'
const LandingPage = () => {
    const canvasRef = useRef(null)
    const mouseRef = useRef({ x: 0, y: 0 })
    const [loaded, setLoaded] = useState(false)
    const [scrollY, setScrollY] = useState(0)
    const navigate = useNavigate()
    const { user } = useAuth()
    // If already logged in, skip landing → go to dashboard
    useEffect(() => {
        if (user) {
            navigate('/')
        }
    }, [user])                    // 👈 ADD THIS

    // ... rest of your component


    // ── Mouse tracking ─────────────────────────────────────
    useEffect(() => {
        const move = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY }
        }
        window.addEventListener("mousemove", move)
        return () => window.removeEventListener("mousemove", move)
    }, [])

    // ── Scroll tracking ────────────────────────────────────
    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY)
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    // ── Canvas Orb Animation (Teal Theme) ─────────────────
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const resize = () => {
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
        }
        resize()
        window.addEventListener("resize", resize)

        const ctx = canvas.getContext("2d")
        let raf, t = 0

        const STRIPS = 38

        // Floating particles around orb
        const ORB_PARTS = 200
        const orbParts = Array.from({ length: ORB_PARTS }, () => {
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            return {
                theta,
                phi,
                r: 140 + Math.random() * 35,
                speed: (Math.random() - 0.5) * 0.004,
                opacity: Math.random()
            }
        })

        // Background floating dots
        const STARS = 60
        const stars = Array.from({ length: STARS }, () => ({
            x: Math.random(),
            y: Math.random(),
            r: Math.random() * 1.2,
            o: Math.random() * 0.3 + 0.05,
        }))

        function tick() {
            t += 0.012
            const W = canvas.width
            const H = canvas.height
            const cx = W / 2
            const cy = H / 2

            ctx.clearRect(0, 0, W, H)

            // Mouse parallax
            const mx = (mouseRef.current.x / window.innerWidth - 0.5) * 40
            const my = (mouseRef.current.y / window.innerHeight - 0.5) * 40

            // Floating dots (teal tinted)
            stars.forEach(s => {
                ctx.beginPath()
                ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(14,152,152,${s.o})`
                ctx.fill()
            })

            // ── CORE ORB ──
            const ox = cx + mx * 0.6
            const oy = cy + my * 0.6
            const orbR = Math.min(W, H) * 0.24

                // Outer glow layers (teal)
                ;[
                    { r: orbR * 2.8, a: 0.05 },
                    { r: orbR * 2.0, a: 0.09 },
                    { r: orbR * 1.5, a: 0.13 },
                ].forEach(({ r, a }) => {
                    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r)
                    g.addColorStop(0, `rgba(14,152,152,${a})`)
                    g.addColorStop(0.5, `rgba(6,182,212,${a * 0.6})`)
                    g.addColorStop(1, "transparent")
                    ctx.beginPath()
                    ctx.arc(ox, oy, r, 0, Math.PI * 2)
                    ctx.fillStyle = g
                    ctx.fill()
                })

            // Main orb body (teal → deep teal → dark)
            const bodyGrad = ctx.createRadialGradient(
                ox - orbR * 0.3, oy - orbR * 0.3, orbR * 0.05,
                ox, oy, orbR
            )
            bodyGrad.addColorStop(0, "#7dd8d8")
            bodyGrad.addColorStop(0.25, "#0e9898")
            bodyGrad.addColorStop(0.55, "#0d7a7a")
            bodyGrad.addColorStop(0.8, "#064e4e")
            bodyGrad.addColorStop(1, "#0a2020")
            ctx.beginPath()
            ctx.arc(ox, oy, orbR, 0, Math.PI * 2)
            ctx.fillStyle = bodyGrad
            ctx.fill()

            // Specular highlight
            const specGrad = ctx.createRadialGradient(
                ox - orbR * 0.35, oy - orbR * 0.38, 0,
                ox - orbR * 0.2, oy - orbR * 0.2, orbR * 0.55
            )
            specGrad.addColorStop(0, "rgba(200,245,245,0.6)")
            specGrad.addColorStop(0.4, "rgba(100,220,220,0.15)")
            specGrad.addColorStop(1, "transparent")
            ctx.beginPath()
            ctx.arc(ox, oy, orbR, 0, Math.PI * 2)
            ctx.fillStyle = specGrad
            ctx.fill()

            // Rim light (sea blue accent)
            const rimGrad = ctx.createRadialGradient(
                ox + orbR * 0.5, oy + orbR * 0.4, 0,
                ox + orbR * 0.5, oy + orbR * 0.4, orbR * 0.7
            )
            rimGrad.addColorStop(0, "rgba(6,182,212,0.4)")
            rimGrad.addColorStop(1, "transparent")
            ctx.beginPath()
            ctx.arc(ox, oy, orbR, 0, Math.PI * 2)
            ctx.fillStyle = rimGrad
            ctx.fill()

            // Clip to orb for interior effects
            ctx.save()
            ctx.beginPath()
            ctx.arc(ox, oy, orbR - 1, 0, Math.PI * 2)
            ctx.clip()

            // Energy veins inside orb
            for (let i = 0; i < 7; i++) {
                const angle = t * 0.4 + (i / 7) * Math.PI * 2
                const sweep = Math.PI * 0.6 + Math.sin(t + i) * 0.3
                const vx1 = ox + Math.cos(angle) * orbR * 0.1
                const vy1 = oy + Math.sin(angle) * orbR * 0.1
                const vx2 = ox + Math.cos(angle + sweep) * orbR * 0.9
                const vy2 = oy + Math.sin(angle + sweep) * orbR * 0.9
                const vg = ctx.createLinearGradient(vx1, vy1, vx2, vy2)
                vg.addColorStop(0, "transparent")
                vg.addColorStop(0.4, `rgba(14,152,152,${0.15 + 0.07 * Math.sin(t * 2 + i)})`)
                vg.addColorStop(1, "transparent")
                ctx.beginPath()
                ctx.moveTo(vx1, vy1)
                ctx.lineTo(vx2, vy2)
                ctx.strokeStyle = vg
                ctx.lineWidth = 1.5
                ctx.stroke()
            }
            ctx.restore()

            // Vertical refraction strips (signature effect)
            ctx.save()
            for (let i = 0; i < STRIPS; i++) {
                const frac = i / STRIPS
                const stripX = ox - orbR + frac * orbR * 2
                const dx = (stripX - ox) / orbR
                const insideR = Math.sqrt(Math.max(0, 1 - dx * dx))
                if (insideR < 0.01) continue

                const topY = oy - insideR * orbR
                const botY = oy + insideR * orbR
                const stripH = botY - topY
                const bright = (0.5 - Math.abs(dx)) * 2
                const alpha = bright * (0.22 + 0.1 * Math.abs(Math.sin(t * 2 + i * 0.4)))
                const offsetY = Math.sin(t * 1.2 + frac * Math.PI * 3) * stripH * 0.22

                ctx.beginPath()
                ctx.rect(stripX, topY + offsetY - stripH * 0.05, orbR * 2 / STRIPS + 0.5, stripH * 1.1)
                ctx.fillStyle = `rgba(14,152,152,${alpha})`
                ctx.fill()

                // Lighter sea-blue accent strips
                if (i % 5 === 2) {
                    ctx.beginPath()
                    ctx.rect(stripX, topY + offsetY, orbR * 2 / STRIPS * 0.4, stripH)
                    ctx.fillStyle = `rgba(6,182,212,${alpha * 0.7})`
                    ctx.fill()
                }
            }
            ctx.restore()

            // Orb edge ring
            ctx.beginPath()
            ctx.arc(ox, oy, orbR, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(14,152,152,0.4)`
            ctx.lineWidth = 1.5
            ctx.shadowColor = "#0e9898"
            ctx.shadowBlur = 24
            ctx.stroke()
            ctx.shadowBlur = 0

            // Orbiting particles
            orbParts.forEach(p => {
                p.theta += p.speed
                const sx = Math.sin(p.phi) * Math.cos(p.theta + t * 0.1)
                const sy = Math.sin(p.phi) * Math.sin(p.theta + t * 0.1)
                const sz = Math.cos(p.phi)
                const tiltX = sx
                const tiltY = sy * Math.cos(0.4) - sz * Math.sin(0.4)
                const tiltZ = sy * Math.sin(0.4) + sz * Math.cos(0.4)
                const scale = 1 / (1 + tiltZ * 0.3)
                const px = ox + tiltX * p.r * scale + mx * 0.3
                const py = oy + tiltY * p.r * scale + my * 0.3
                const alpha = (0.3 + tiltZ * 0.5) * p.opacity * 0.7
                if (alpha <= 0) return
                ctx.beginPath()
                ctx.arc(px, py, 1.4 * scale, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(14,152,152,${alpha})`
                ctx.fill()
            })

            // Floor shadow
            const shadowGrad = ctx.createRadialGradient(
                ox, oy + orbR * 0.9, 0,
                ox, oy + orbR * 0.9, orbR * 1.2
            )
            shadowGrad.addColorStop(0, "rgba(14,152,152,0.15)")
            shadowGrad.addColorStop(1, "transparent")
            ctx.beginPath()
            ctx.ellipse(ox, oy + orbR * 0.95, orbR * 1.1, orbR * 0.18, 0, 0, Math.PI * 2)
            ctx.fillStyle = shadowGrad
            ctx.fill()

            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        setTimeout(() => setLoaded(true), 200)

        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("resize", resize)
        }
    }, [])

    // ── Scroll to section helper ───────────────────────────
    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    }

    return (
        <div style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            background: "#f0fafa",
            color: "#0a2a2a",
            overflowX: "hidden"
        }}>

            {/* ════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════ */}
            <section style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #0a2020 0%, #0e4040 40%, #0a3535 100%)",
                display: "flex",
                alignItems: "stretch",
                overflow: "hidden",
                position: "relative"
            }}>

                {/* Top teal border */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: "linear-gradient(90deg, transparent, #0e9898, #06b6d4, transparent)"
                }} />

                {/* ── LEFT PANEL ── */}
                <div style={{
                    flex: "0 0 50%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "2.5rem 3.5rem 3rem",
                    position: "relative",
                    zIndex: 2,
                }}>

                    {/* Logo */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        opacity: loaded ? 1 : 0,
                        transform: loaded ? "translateY(0)" : "translateY(-12px)",
                        transition: "all 0.8s cubic-bezier(0.23,1,0.32,1) 0.1s"
                    }}>
                        {/* Logo image */}
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            overflow: "hidden",
                            boxShadow: "0 4px 20px rgba(14,152,152,0.5)",
                            border: "1px solid rgba(14,152,152,0.4)"
                        }}>
                            <img
                                src="/logo.png"
                                alt="Acadence"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={e => {
                                    // Fallback if logo not found
                                    e.target.style.display = "none"
                                    e.target.parentElement.style.background = "linear-gradient(135deg,#0e9898,#06b6d4)"
                                    e.target.parentElement.innerHTML = '<span style="color:white;font-size:22px;display:flex;align-items:center;justify-content:center;height:100%">🎓</span>'
                                }}
                            />
                        </div>
                        <div>
                            <div style={{
                                fontSize: "1.3rem",
                                fontWeight: 700,
                                color: "#e0f7f7",
                                letterSpacing: "0.05em"
                            }}>
                                Acadence
                            </div>
                            <div style={{
                                fontSize: "0.62rem",
                                letterSpacing: "0.22em",
                                color: "#4db8b8",
                                textTransform: "uppercase"
                            }}>
                                AI Academic Coach
                            </div>
                        </div>
                    </div>

                    {/* Main Copy */}
                    <div style={{
                        opacity: loaded ? 1 : 0,
                        transform: loaded ? "translateY(0)" : "translateY(30px)",
                        transition: "all 1s cubic-bezier(0.23,1,0.32,1) 0.3s"
                    }}>
                        <p style={{
                            fontSize: "0.68rem",
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                            color: "#0e9898",
                            marginBottom: "1.2rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                            <span style={{
                                display: "inline-block",
                                width: 6, height: 6,
                                borderRadius: "50%",
                                background: "#0e9898",
                                boxShadow: "0 0 8px #0e9898"
                            }} />
                            AI-Powered Academic Intelligence
                        </p>

                        <h1 style={{
                            fontSize: "clamp(2.8rem, 4vw, 4rem)",
                            fontWeight: 300,
                            lineHeight: 1.1,
                            letterSpacing: "0.01em",
                            color: "#e0f7f7",
                            marginBottom: "1.5rem"
                        }}>
                            Study Smarter.<br />
                            Stress{" "}
                            <span style={{
                                fontWeight: 700,
                                background: "linear-gradient(135deg,#0e9898,#06b6d4,#7dd8d8)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text"
                            }}>
                                Less.
                            </span>
                        </h1>

                        <p style={{
                            fontSize: "1rem",
                            fontWeight: 300,
                            color: "#7ab8b8",
                            lineHeight: 1.8,
                            maxWidth: 420,
                            marginBottom: "2.8rem"
                        }}>
                            Acadence turns your scattered syllabi, PDFs and emails
                            into a color-coded stress forecast and AI study plan
                            — in under 10 seconds.
                        </p>

                        {/* CTA Buttons */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            flexWrap: "wrap"
                        }}>
                            <button
                                onClick={() => navigate("/register")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    padding: "0.9rem 2.2rem",
                                    background: "linear-gradient(135deg,#0e9898,#06b6d4)",
                                    border: "none",
                                    borderRadius: "999px",
                                    color: "white",
                                    fontSize: "0.88rem",
                                    fontWeight: 600,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                    boxShadow: "0 8px 32px rgba(14,152,152,0.5)",
                                    transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = "translateY(-3px) scale(1.03)"
                                    e.currentTarget.style.boxShadow = "0 16px 48px rgba(14,152,152,0.7)"
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = "translateY(0) scale(1)"
                                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(14,152,152,0.5)"
                                }}
                            >
                                Get Started Free
                                <span style={{
                                    width: 28, height: 28,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.9rem"
                                }}>
                                    →
                                </span>
                            </button>

                            <button
                                onClick={() => scrollTo("features")}
                                style={{
                                    padding: "0.9rem 2rem",
                                    background: "transparent",
                                    border: "1px solid rgba(14,152,152,0.35)",
                                    borderRadius: "999px",
                                    color: "#e0f7f7",
                                    fontSize: "0.88rem",
                                    fontWeight: 300,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                    transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "rgba(14,152,152,0.7)"
                                    e.currentTarget.style.background = "rgba(14,152,152,0.08)"
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "rgba(14,152,152,0.35)"
                                    e.currentTarget.style.background = "transparent"
                                }}
                            >
                                See How It Works
                            </button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div style={{
                        display: "flex",
                        gap: "2.5rem",
                        opacity: loaded ? 1 : 0,
                        transform: loaded ? "translateY(0)" : "translateY(12px)",
                        transition: "all 0.9s cubic-bezier(0.23,1,0.32,1) 0.6s"
                    }}>
                        {[
                            { n: "10s", label: "Setup Time" },
                            { n: "AI", label: "Powered Engine" },
                            { n: "5★", label: "Stress Control" },
                        ].map(({ n, label }) => (
                            <div key={label}>
                                <div style={{
                                    fontSize: "2rem",
                                    fontWeight: 700,
                                    color: "#0e9898",
                                    lineHeight: 1,
                                    textShadow: "0 0 20px rgba(14,152,152,0.4)"
                                }}>
                                    {n}
                                </div>
                                <div style={{
                                    fontSize: "0.62rem",
                                    letterSpacing: "0.18em",
                                    color: "#4db8b8",
                                    textTransform: "uppercase",
                                    marginTop: 4
                                }}>
                                    {label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT PANEL — Canvas ── */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

                    {/* Separator line */}
                    <div style={{
                        position: "absolute", left: 0, top: "10%", bottom: "10%",
                        width: 1,
                        background: "linear-gradient(180deg, transparent, rgba(14,152,152,0.3), transparent)"
                    }} />

                    <canvas ref={canvasRef} style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%"
                    }} />

                    {/* Interact hint */}
                    <div style={{
                        position: "absolute", bottom: "2.5rem", left: "50%",
                        transform: "translateX(-50%)",
                        padding: "0.5rem 1.2rem",
                        background: "rgba(10,32,32,0.7)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(14,152,152,0.2)",
                        borderRadius: 999,
                        fontSize: "0.65rem",
                        letterSpacing: "0.18em",
                        color: "#4db8b8",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        opacity: loaded ? 0.8 : 0,
                        transition: "opacity 1s ease 1s"
                    }}>
                        Move cursor to interact
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════
          PROBLEM SECTION
      ════════════════════════════════════════ */}
            <section style={{
                padding: "100px 80px",
                background: "linear-gradient(180deg, #f0fafa 0%, #e6f7f7 100%)",
                textAlign: "center"
            }}>
                <p style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#0e9898",
                    marginBottom: "16px"
                }}>
                    The Problem
                </p>
                <h2 style={{
                    fontSize: "clamp(2rem, 3.5vw, 3rem)",
                    fontWeight: 700,
                    color: "#0a2a2a",
                    marginBottom: "16px",
                    lineHeight: 1.2
                }}>
                    The "Invisible" Deadline Crisis
                </h2>
                <p style={{
                    fontSize: "1.1rem",
                    color: "#4a7a7a",
                    maxWidth: 600,
                    margin: "0 auto 60px",
                    lineHeight: 1.8
                }}>
                    Students manage 5–7 subjects simultaneously.
                    Deadlines are scattered everywhere.
                    Nobody sees the crunch coming.
                </p>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "24px",
                    maxWidth: 900,
                    margin: "0 auto"
                }}>
                    {[
                        {
                            icon: "📄",
                            title: "Fragmented Data",
                            desc: "Syllabi in PDFs, deadlines in emails, tasks in WhatsApp groups — nothing is connected.",
                            color: "#ef4444"
                        },
                        {
                            icon: "💥",
                            title: "Crunch Weeks",
                            desc: "Sudden overlaps where multiple high-stakes assignments are due at once — with zero warning.",
                            color: "#f59e0b"
                        },
                        {
                            icon: "😓",
                            title: "Student Burnout",
                            desc: "Missed submissions, lower grades, increased stress — all due to lack of logistical foresight.",
                            color: "#8b5cf6"
                        }
                    ].map(item => (
                        <div
                            key={item.title}
                            style={{
                                background: "white",
                                borderRadius: "20px",
                                padding: "32px 28px",
                                boxShadow: "0 4px 24px rgba(14,152,152,0.08)",
                                border: "1px solid rgba(14,152,152,0.1)",
                                textAlign: "left",
                                transition: "transform 0.2s, box-shadow 0.2s"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-6px)"
                                e.currentTarget.style.boxShadow = "0 12px 40px rgba(14,152,152,0.15)"
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)"
                                e.currentTarget.style.boxShadow = "0 4px 24px rgba(14,152,152,0.08)"
                            }}
                        >
                            <div style={{
                                width: 52, height: 52,
                                borderRadius: 14,
                                background: `${item.color}18`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px",
                                marginBottom: "16px"
                            }}>
                                {item.icon}
                            </div>
                            <h3 style={{
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                color: "#0a2a2a",
                                marginBottom: "10px"
                            }}>
                                {item.title}
                            </h3>
                            <p style={{
                                fontSize: "0.9rem",
                                color: "#4a7a7a",
                                lineHeight: 1.7,
                                margin: 0
                            }}>
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
            <section id="features" style={{
                padding: "100px 80px",
                background: "linear-gradient(135deg, #0a2020 0%, #0e3535 100%)",
                textAlign: "center"
            }}>
                <p style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#0e9898",
                    marginBottom: "16px"
                }}>
                    How It Works
                </p>
                <h2 style={{
                    fontSize: "clamp(2rem, 3.5vw, 3rem)",
                    fontWeight: 700,
                    color: "#e0f7f7",
                    marginBottom: "16px"
                }}>
                    Four Steps to Zero Stress
                </h2>
                <p style={{
                    color: "#4db8b8",
                    marginBottom: "60px",
                    fontSize: "1rem"
                }}>
                    From scattered deadlines to a complete AI study plan
                </p>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: "20px",
                    maxWidth: 1100,
                    margin: "0 auto"
                }}>
                    {[
                        {
                            step: "01",
                            icon: "🤖",
                            title: "Intelligent Ingestion",
                            desc: "Paste syllabus text or upload a PDF. Groq AI (Llama 3.3) extracts every deadline instantly.",
                            color: "#0e9898"
                        },
                        {
                            step: "02",
                            icon: "⚡",
                            title: "Clash Detection",
                            desc: "Django backend auto-calculates stress scores. 48-hour clash alerts fire before you even notice.",
                            color: "#06b6d4"
                        },
                        {
                            step: "03",
                            icon: "👥",
                            title: "Group Workload",
                            desc: "Share tasks with your department. 5 classmates verify = ✅ Verified badge. Collaborative truth.",
                            color: "#0891b2"
                        },
                        {
                            step: "04",
                            icon: "🗺️",
                            title: "AI Study Roadmap",
                            desc: "Chat with Aura AI. Get a topic-by-topic study plan built from YOUR syllabus content.",
                            color: "#0e7490"
                        }
                    ].map((item, i) => (
                        <div
                            key={item.step}
                            style={{
                                background: "rgba(14,152,152,0.08)",
                                border: "1px solid rgba(14,152,152,0.2)",
                                borderRadius: "20px",
                                padding: "32px 24px",
                                textAlign: "left",
                                transition: "all 0.2s",
                                position: "relative",
                                overflow: "hidden"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = "rgba(14,152,152,0.15)"
                                e.currentTarget.style.borderColor = "rgba(14,152,152,0.4)"
                                e.currentTarget.style.transform = "translateY(-4px)"
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = "rgba(14,152,152,0.08)"
                                e.currentTarget.style.borderColor = "rgba(14,152,152,0.2)"
                                e.currentTarget.style.transform = "translateY(0)"
                            }}
                        >
                            {/* Step number watermark */}
                            <div style={{
                                position: "absolute",
                                top: 12, right: 16,
                                fontSize: "3.5rem",
                                fontWeight: 800,
                                color: "rgba(14,152,152,0.08)",
                                lineHeight: 1
                            }}>
                                {item.step}
                            </div>

                            <div style={{
                                width: 52, height: 52,
                                borderRadius: 14,
                                background: `${item.color}22`,
                                border: `1px solid ${item.color}44`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px",
                                marginBottom: "16px"
                            }}>
                                {item.icon}
                            </div>

                            <h3 style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                color: "#e0f7f7",
                                marginBottom: "10px"
                            }}>
                                {item.title}
                            </h3>

                            <p style={{
                                fontSize: "0.88rem",
                                color: "#4db8b8",
                                lineHeight: 1.7,
                                margin: 0
                            }}>
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════════════
          FEATURES GRID
      ════════════════════════════════════════ */}
            <section style={{
                padding: "100px 80px",
                background: "linear-gradient(180deg, #e6f7f7 0%, #f0fafa 100%)"
            }}>
                <div style={{ textAlign: "center", marginBottom: "60px" }}>
                    <p style={{
                        fontSize: "0.7rem",
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: "#0e9898",
                        marginBottom: "16px"
                    }}>
                        Features
                    </p>
                    <h2 style={{
                        fontSize: "clamp(2rem, 3.5vw, 3rem)",
                        fontWeight: 700,
                        color: "#0a2a2a",
                        marginBottom: "16px"
                    }}>
                        Everything You Need
                    </h2>
                    <p style={{
                        color: "#4a7a7a",
                        fontSize: "1rem",
                        maxWidth: 500,
                        margin: "0 auto"
                    }}>
                        Built specifically for college students managing multiple subjects
                    </p>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "20px",
                    maxWidth: 1100,
                    margin: "0 auto"
                }}>
                    {[
                        {
                            icon: "📄",
                            title: "PDF Syllabus Parser",
                            desc: "Upload any PDF. Groq AI extracts all deadlines, exams and assignments automatically.",
                            tag: "AI Powered"
                        },
                        {
                            icon: "🌡️",
                            title: "Stress Weather Map",
                            desc: "Color-coded calendar: Green (safe) → Yellow (moderate) → Red (burnout risk).",
                            tag: "Visual"
                        },
                        {
                            icon: "💬",
                            title: "Aura AI Chat",
                            desc: "Chat to get exam-specific study plans built from your syllabus topics.",
                            tag: "Conversational AI"
                        },
                        {
                            icon: "👥",
                            title: "Department Groups",
                            desc: "Share tasks with CSSE12, MECH08, BBA15. One upload helps the whole class.",
                            tag: "Collaborative"
                        },
                        {
                            icon: "✅",
                            title: "Verification Badge",
                            desc: "5 classmates approve = task gets verified. Prevents misinformation from spreading.",
                            tag: "Trust System"
                        },
                        {
                            icon: "📅",
                            title: "LMS Calendar",
                            desc: "Full calendar view with stress colors, click-to-view tasks, course filters.",
                            tag: "Visual"
                        }
                    ].map(item => (
                        <div
                            key={item.title}
                            style={{
                                background: "white",
                                borderRadius: "20px",
                                padding: "28px",
                                boxShadow: "0 4px 24px rgba(14,152,152,0.07)",
                                border: "1px solid rgba(14,152,152,0.1)",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-5px)"
                                e.currentTarget.style.boxShadow = "0 12px 40px rgba(14,152,152,0.15)"
                                e.currentTarget.style.borderColor = "rgba(14,152,152,0.3)"
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)"
                                e.currentTarget.style.boxShadow = "0 4px 24px rgba(14,152,152,0.07)"
                                e.currentTarget.style.borderColor = "rgba(14,152,152,0.1)"
                            }}
                        >
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "16px"
                            }}>
                                <div style={{
                                    width: 48, height: 48,
                                    borderRadius: 12,
                                    background: "linear-gradient(135deg,#e6f7f7,#c5eeee)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "22px"
                                }}>
                                    {item.icon}
                                </div>
                                <span style={{
                                    fontSize: "10px",
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    background: "#e6f7f7",
                                    color: "#0e9898",
                                    fontWeight: 600,
                                    letterSpacing: "0.05em"
                                }}>
                                    {item.tag}
                                </span>
                            </div>

                            <h3 style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                color: "#0a2a2a",
                                marginBottom: "10px"
                            }}>
                                {item.title}
                            </h3>

                            <p style={{
                                fontSize: "0.88rem",
                                color: "#4a7a7a",
                                lineHeight: 1.7,
                                margin: 0
                            }}>
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════════════
          DEPARTMENTS SECTION
      ════════════════════════════════════════ */}
            <section style={{
                padding: "80px 80px",
                background: "linear-gradient(135deg,#0a2020,#0e3535)",
                textAlign: "center"
            }}>
                <p style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "#0e9898",
                    marginBottom: "16px"
                }}>
                    Demo Departments
                </p>
                <h2 style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "#e0f7f7",
                    marginBottom: "12px"
                }}>
                    Join Your Department
                </h2>
                <p style={{
                    color: "#4db8b8",
                    marginBottom: "48px",
                    fontSize: "0.95rem"
                }}>
                    Use these demo access codes to get started instantly
                </p>

                <div style={{
                    display: "flex",
                    gap: "20px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginBottom: "48px"
                }}>
                    {[
                        {
                            name: "Computer Science & Engineering",
                            code: "CSSE12",
                            icon: "💻",
                            color: "#0e9898"
                        },
                        {
                            name: "Mechanical Engineering",
                            code: "MECH08",
                            icon: "⚙️",
                            color: "#06b6d4"
                        },
                        {
                            name: "Business Administration",
                            code: "BBA15",
                            icon: "📊",
                            color: "#0891b2"
                        }
                    ].map(dept => (
                        <div
                            key={dept.code}
                            style={{
                                background: "rgba(14,152,152,0.1)",
                                border: "1px solid rgba(14,152,152,0.25)",
                                borderRadius: "16px",
                                padding: "28px 32px",
                                minWidth: "240px",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = "rgba(14,152,152,0.18)"
                                e.currentTarget.style.borderColor = "rgba(14,152,152,0.5)"
                                e.currentTarget.style.transform = "translateY(-4px)"
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = "rgba(14,152,152,0.1)"
                                e.currentTarget.style.borderColor = "rgba(14,152,152,0.25)"
                                e.currentTarget.style.transform = "translateY(0)"
                            }}
                        >
                            <div style={{ fontSize: "36px", marginBottom: "12px" }}>
                                {dept.icon}
                            </div>
                            <div style={{
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                color: "#e0f7f7",
                                marginBottom: "8px"
                            }}>
                                {dept.name}
                            </div>
                            <div style={{
                                display: "inline-block",
                                background: "rgba(14,152,152,0.2)",
                                border: "1px solid rgba(14,152,152,0.4)",
                                borderRadius: "8px",
                                padding: "4px 14px",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                color: "#0e9898",
                                letterSpacing: "0.1em"
                            }}>
                                {dept.code}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════════════
          CTA SECTION
      ════════════════════════════════════════ */}
            <section style={{
                padding: "100px 80px",
                background: "linear-gradient(180deg, #f0fafa, #e6f7f7)",
                textAlign: "center"
            }}>
                <h2 style={{
                    fontSize: "clamp(2rem, 4vw, 3.5rem)",
                    fontWeight: 700,
                    color: "#0a2a2a",
                    marginBottom: "20px",
                    lineHeight: 1.2
                }}>
                    Ready to{" "}
                    <span style={{
                        background: "linear-gradient(135deg,#0e9898,#06b6d4)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text"
                    }}>
                        Study Smarter?
                    </span>
                </h2>
                <p style={{
                    color: "#4a7a7a",
                    fontSize: "1.1rem",
                    marginBottom: "40px",
                    maxWidth: 480,
                    margin: "0 auto 40px",
                    lineHeight: 1.8
                }}>
                    Join your department. Upload your syllabus.
                    Let Acadence handle the rest.
                </p>

                <div style={{
                    display: "flex",
                    gap: "16px",
                    justifyContent: "center",
                    flexWrap: "wrap"
                }}>
                    <button
                        onClick={() => navigate("/register")}
                        style={{
                            padding: "1rem 2.5rem",
                            background: "linear-gradient(135deg,#0e9898,#06b6d4)",
                            border: "none",
                            borderRadius: "999px",
                            color: "white",
                            fontSize: "1rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 8px 32px rgba(14,152,152,0.4)",
                            transition: "all 0.3s"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = "translateY(-3px)"
                            e.currentTarget.style.boxShadow = "0 16px 48px rgba(14,152,152,0.6)"
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = "translateY(0)"
                            e.currentTarget.style.boxShadow = "0 8px 32px rgba(14,152,152,0.4)"
                        }}
                    >
                        Create Free Account →
                    </button>

                    <button
                        onClick={() => navigate("/login")}
                        style={{
                            padding: "1rem 2.5rem",
                            background: "white",
                            border: "2px solid rgba(14,152,152,0.3)",
                            borderRadius: "999px",
                            color: "#0e9898",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.3s"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = "#0e9898"
                            e.currentTarget.style.background = "#e6f7f7"
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = "rgba(14,152,152,0.3)"
                            e.currentTarget.style.background = "white"
                        }}
                    >
                        Already have an account
                    </button>
                </div>
            </section>

            {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
            <footer style={{
                padding: "40px 80px",
                background: "#0a2020",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                borderTop: "1px solid rgba(14,152,152,0.15)"
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <div style={{
                        width: 36, height: 36,
                        borderRadius: 10,
                        overflow: "hidden",
                        border: "1px solid rgba(14,152,152,0.3)"
                    }}>
                        <img
                            src="/logo.png"
                            alt="Acadence"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={e => {
                                e.target.style.display = "none"
                                e.target.parentElement.innerHTML = '<span style="color:#0e9898;font-size:18px;display:flex;align-items:center;justify-content:center;height:100%">🎓</span>'
                            }}
                        />
                    </div>
                    <div>
                        <div style={{
                            color: "#e0f7f7",
                            fontWeight: 700,
                            fontSize: "1rem"
                        }}>
                            Acadence
                        </div>
                        <div style={{
                            color: "#4db8b8",
                            fontSize: "0.7rem",
                            letterSpacing: "0.1em"
                        }}>
                            AI Academic Coach
                        </div>
                    </div>
                </div>

                <div style={{
                    color: "#4db8b8",
                    fontSize: "0.8rem"
                }}>
                    Built with 🤖 Groq AI · Django · React
                </div>

                <div style={{
                    display: "flex",
                    gap: "24px"
                }}>
                    {["Dashboard", "Register", "Login"].map(link => (
                        <span
                            key={link}
                            onClick={() => navigate(
                                link === "Dashboard" ? "/" :
                                    `/${link.toLowerCase()}`
                            )}
                            style={{
                                color: "#4db8b8",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                transition: "color 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "#0e9898"}
                            onMouseLeave={e => e.currentTarget.style.color = "#4db8b8"}
                        >
                            {link}
                        </span>
                    ))}
                </div>
            </footer>
        </div>
    )
}

export default LandingPage