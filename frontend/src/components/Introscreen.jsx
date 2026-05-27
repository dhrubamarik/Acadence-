import { useEffect, useRef, useState } from "react";

/*
  Acadence — Cinematic Intro
  Faithfully recreates the logo elements via Canvas:

  Layer order (back → front):
    1. Teal background floods in
    2. Mandala blooms petal-by-petal (dark, intricate, behind everything)
    3. Book opens from spine (white-outlined, left=lines, right=window grid)
    4. Lotus-pose figure rises up sitting on the book
    5. "Acadence" writes itself in handwritten style
    6. Tagline fades in → hold → fade out → onDone()

  Timeline (ms):
    0    – 500   teal BG
    200  – 1500  mandala bloom
    900  – 1700  book open
    1400 – 2000  figure materialise
    1900 – 2800  text write-in
    2800 – 3300  hold
    3300 – 4100  fade out
*/

export default function IntroScreen({ onDone }) {
  const canvasRef              = useRef(null);
  const [textPhase, setTextPhase] = useState(0); // 0 hidden | 1 name | 2 tagline
  const [fadeOut,   setFadeOut]   = useState(false);
  const [gone,      setGone]      = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W   = window.innerWidth;
    const H   = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // Logo centre — slightly above mid so text sits below
    const cx = W / 2;
    const cy = H / 2 - 55;
    // S = half-size of the logo bounding circle
    const S  = Math.min(W, H) * 0.35;

    const start = performance.now();
    let raf;

    /* ─── easings ─── */
    const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
    const prog  = (ms, s, e) => clamp((ms - s) / (e - s));
    const eo3   = t => 1 - Math.pow(1 - clamp(t), 3);
    const eo5   = t => 1 - Math.pow(1 - clamp(t), 5);
    const eio   = t => { const c = clamp(t); return c < 0.5 ? 4*c*c*c : 1 - Math.pow(-2*c+2, 3) / 2; };

    /* ════════════════════════════════════════════════
       MANDALA
       Matches the logo: dark teal/black pointed petal
       rings radiating from centre, concentric lacy
       outline circles, and 8 thin radiating spokes.
    ════════════════════════════════════════════════ */
    function mandala(t) {
      if (t <= 0) return;
      ctx.save();
      ctx.translate(cx, cy);

      const dark = (a) => `rgba(10,35,35,${a * t})`;

      /* helper: draw one pointy teardrop petal facing "up" (−y) */
      function petal(dist, petalH, petalW, alpha) {
        ctx.beginPath();
        ctx.moveTo(0, -dist);
        ctx.bezierCurveTo(
           petalW, -dist - petalH * 0.2,
           petalW * 0.7, -dist - petalH,
           0, -dist - petalH
        );
        ctx.bezierCurveTo(
          -petalW * 0.7, -dist - petalH,
          -petalW, -dist - petalH * 0.2,
          0, -dist
        );
        ctx.fillStyle = dark(alpha);
        ctx.fill();
      }

      /* helper: draw N petals around the origin, blooming in sequence */
      function ring(n, dist, ph, pw, alpha, tStart, tEnd) {
        const rt = prog(t, tStart, tEnd);
        const visible = Math.ceil(n * rt);
        for (let i = 0; i < visible; i++) {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const fadeThis = (i === visible - 1 && rt < 1) ? (n * rt) % 1 : 1;
          ctx.save();
          ctx.rotate(angle);
          ctx.globalAlpha = fadeThis;
          petal(dist, ph, pw, alpha);
          ctx.restore();
        }
      }

      /* ── Ring 1: outermost large petals (16) ── */
      ring(16, S * 0.58, S * 0.34, S * 0.08, 0.90, 0.0, 0.85);

      /* ── Ring 2: rotated medium petals (16) ── */
      ctx.save();
      ctx.rotate(Math.PI / 16);
      ring(16, S * 0.44, S * 0.26, S * 0.065, 0.78, 0.05, 0.80);
      ctx.restore();

      /* ── Ring 3: inner small oval petals (12) ── */
      ring(12, S * 0.30, S * 0.18, S * 0.05, 0.68, 0.10, 0.75);

      /* ── Ring 4: tiny inner petals (8) ── */
      ring(8, S * 0.18, S * 0.11, S * 0.035, 0.55, 0.15, 0.70);

      /* ── concentric outline circles ── */
      const ct = eo3(prog(t, 0.18, 0.95));
      [[S * 0.96, 0.32, [4, 5]], [S * 0.75, 0.40, [2, 4]], [S * 0.52, 0.48, []], [S * 0.28, 0.55, []], [S * 0.12, 0.50, []]].forEach(([r, a, dash]) => {
        ctx.beginPath();
        ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ct);
        ctx.strokeStyle = dark(a);
        ctx.lineWidth = 0.65;
        ctx.globalAlpha = 1;
        ctx.setLineDash(dash);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      /* ── 8 radiating spokes ── */
      const st = eo3(prog(t, 0.25, 1.0));
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.globalAlpha = 0.35 * st;
        ctx.beginPath();
        ctx.moveTo(0, -S * 0.30);
        ctx.lineTo(0, -S * 0.97);
        ctx.strokeStyle = dark(0.7);
        ctx.lineWidth = 0.55;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    /* ════════════════════════════════════════════════
       BOOK
       White-bordered open book with rectangular outer
       frame. Left page = ruled lines. Right page = 
       window / grid of small rectangles (like logo).
       Pages fan open from the spine.
    ════════════════════════════════════════════════ */
    function book(t) {
      if (t <= 0) return;
      const bt = eio(t);

      // book geometry
      const bw   = S * 0.50 * bt;   // half-width of each open page
      const bh   = S * 0.52;         // full height of book
      const top  = cy - bh * 0.50;
      const bot  = cy + bh * 0.42;
      const base = cy + bh * 0.30;  // bottom of pages

      ctx.save();
      ctx.globalAlpha = eo3(t);

      /* ── outer white rectangular border frame ── */
      const fw = bw * 2.12 + 10;
      const fh = bh * 0.95;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.rect(cx - fw / 2, top * 1.0, fw, fh);
      ctx.stroke();

      /* ── LEFT page ── */
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, top + 4);
      ctx.lineTo(cx - bw, top + bh * 0.1);
      ctx.lineTo(cx - bw, base);
      ctx.quadraticCurveTo(cx - bw * 0.25, base + bh * 0.08, cx, base + bh * 0.05);
      ctx.closePath();
      ctx.fillStyle = "#f8f8f8";
      ctx.globalAlpha = eo3(t) * 0.95;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // ruled lines on left page
      ctx.globalAlpha = eo3(t) * 0.45;
      ctx.strokeStyle = "#888888";
      ctx.lineWidth = 0.75;
      const linesN = 7;
      for (let i = 0; i < linesN; i++) {
        const ly = top + bh * 0.15 + i * (bh * 0.58 / linesN);
        ctx.beginPath();
        ctx.moveTo(cx - bw * 0.88, ly);
        ctx.lineTo(cx - bw * 0.10, ly);
        ctx.stroke();
      }
      ctx.restore();

      /* ── RIGHT page ── */
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, top + 4);
      ctx.lineTo(cx + bw, top + bh * 0.1);
      ctx.lineTo(cx + bw, base);
      ctx.quadraticCurveTo(cx + bw * 0.25, base + bh * 0.08, cx, base + bh * 0.05);
      ctx.closePath();
      ctx.fillStyle = "#c2dede";
      ctx.globalAlpha = eo3(t) * 0.80;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // window/grid on right page (2×3 boxes)
      ctx.globalAlpha = eo3(t) * 0.60;
      ctx.strokeStyle = "#5a9999";
      ctx.lineWidth = 0.85;
      const gx0 = cx + bw * 0.10, gx1 = cx + bw * 0.92;
      const gy0 = top + bh * 0.14, gy1 = base - bh * 0.04;
      const gcols = 2, grows = 3;
      const gW = (gx1 - gx0) / gcols;
      const gH = (gy1 - gy0) / grows;
      for (let r = 0; r < grows; r++) {
        for (let c = 0; c < gcols; c++) {
          ctx.beginPath();
          ctx.rect(gx0 + c * gW + 2, gy0 + r * gH + 2, gW - 4, gH - 4);
          ctx.stroke();
        }
      }
      ctx.restore();

      /* ── spine ── */
      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.globalAlpha = eo3(t);
      ctx.beginPath();
      ctx.moveTo(cx, top + 2);
      ctx.lineTo(cx, base + bh * 0.06);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    /* ════════════════════════════════════════════════
       FIGURE
       Black lotus-pose silhouette.
       Sits centered on the book spine, rises upward.
    ════════════════════════════════════════════════ */
    function figure(t) {
      if (t <= 0) return;
      const alpha = eo5(t);
      const scale = S * 0.40 * eo3(t);

      // figure base sits at book vertical center
      const fy = cy + S * 0.02;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, fy);
      // normalize: we draw in a ±50 unit space
      ctx.scale(scale / 50, scale / 50);

      const C = "#0a2828";
      ctx.fillStyle = C;
      ctx.strokeStyle = C;
      ctx.lineCap = "round";

      /* crossed legs / lotus base */
      ctx.beginPath();
      ctx.ellipse(0, 22, 40, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      /* left knee */
      ctx.beginPath();
      ctx.ellipse(-34, 22, 13, 8, -0.25, 0, Math.PI * 2);
      ctx.fill();

      /* right knee */
      ctx.beginPath();
      ctx.ellipse(34, 22, 13, 8, 0.25, 0, Math.PI * 2);
      ctx.fill();

      /* torso */
      ctx.beginPath();
      ctx.ellipse(0, -2, 13, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      /* left arm */
      ctx.beginPath();
      ctx.moveTo(-11, 8);
      ctx.quadraticCurveTo(-32, 14, -33, 22);
      ctx.lineWidth = 10;
      ctx.stroke();

      /* right arm */
      ctx.beginPath();
      ctx.moveTo(11, 8);
      ctx.quadraticCurveTo(32, 14, 33, 22);
      ctx.stroke();

      /* neck */
      ctx.beginPath();
      ctx.ellipse(0, -26, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      /* head */
      ctx.beginPath();
      ctx.arc(0, -40, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    /* ════════════════════════════════════════════════
       MAIN TICK
    ════════════════════════════════════════════════ */
    function tick(now) {
      const ms = now - start;
      ctx.clearRect(0, 0, W, H);

      /* background */
      ctx.save();
      ctx.globalAlpha = eo5(prog(ms, 0, 500));
      ctx.fillStyle = "#1a9090";
      ctx.fillRect(0, 0, W, H);
      const vg = ctx.createRadialGradient(cx, cy, S * 0.2, cx, cy, Math.max(W, H) * 0.85);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,28,28,0.38)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      /* mandala 200–1500ms */
      mandala(prog(ms, 200, 1500));

      /* book 900–1700ms */
      book(prog(ms, 900, 1700));

      /* figure 1400–2000ms */
      figure(prog(ms, 1400, 2000));

      /* fade-out overlay 3300–4100ms */
      if (ms > 3300) {
        ctx.save();
        ctx.globalAlpha = eio(prog(ms, 3300, 4100));
        ctx.fillStyle = "#1a9090";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    const timers = [
      setTimeout(() => setTextPhase(1), 1900),
      setTimeout(() => setTextPhase(2), 2500),
      setTimeout(() => setFadeOut(true), 3300),
      setTimeout(() => { setGone(true); onDone?.(); }, 4200),
    ];

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  if (gone) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap');
        @keyframes acadence-write {
          from { clip-path: inset(0 100% 0 0); opacity: 0.2; }
          to   { clip-path: inset(0 0%   0 0); opacity: 1; }
        }
        @keyframes acadence-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.9s cubic-bezier(0.23,1,0.32,1)",
      }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, display: "block" }} />

        {/* Text — positioned below logo */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          paddingTop: `${Math.min(window.innerWidth, window.innerHeight) * 0.50}px`,
        }}>
          {textPhase >= 1 && (
            <h1 key="name" style={{
              fontFamily: "'Caveat', cursive",
              fontSize: "clamp(2.2rem, 6vw, 3.4rem)",
              fontWeight: 400,
              color: "#ffffff",
              margin: 0,
              letterSpacing: "0.05em",
              textShadow: "0 2px 18px rgba(0,0,0,0.22)",
              animation: "acadence-write 1.1s cubic-bezier(0.23,1,0.32,1) forwards",
            }}>
              Acadence
            </h1>
          )}

          {textPhase >= 2 && (
            <p key="tag" style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.62rem",
              fontWeight: 400,
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.58)",
              margin: "0.55rem 0 0",
              animation: "acadence-fade-up 0.85s ease forwards",
            }}>
              Learn · Align · Thrive
            </p>
          )}
        </div>
      </div>
    </>
  );
}