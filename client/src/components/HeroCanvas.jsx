import { useEffect, useRef } from "react";

export default function HeroCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let W = 0, H = 0;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const PARTICLE_COUNT = 90;
    function mkParticle() {
      const orange = Math.random() < 0.3;
      return {
        x: Math.random() * (W || 800),
        y: Math.random() * (H || 600),
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35 - 0.18,
        alpha: Math.random() * 0.55 + 0.15,
        color: orange ? "#ff632d" : "#ffffff",
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.025 + 0.008,
      };
    }
    const particles = Array.from({ length: PARTICLE_COUNT }, mkParticle);

    const STREAK_COUNT = 6;
    function mkStreak() {
      return {
        progress: Math.random(),
        speed: Math.random() * 0.0015 + 0.0008,
        width: Math.random() * 1.5 + 0.4,
        angle: -35 + Math.random() * 20,
        opacity: Math.random() * 0.18 + 0.06,
        color: Math.random() < 0.4 ? "#ff632d" : "#ffffff",
        length: Math.random() * 0.45 + 0.25,
      };
    }
    const streaks = Array.from({ length: STREAK_COUNT }, mkStreak);

    let pulseT = 0;

    function draw() {
      if (!W || !H) { animId = requestAnimationFrame(draw); return; }

      ctx.fillStyle = "#060606";
      ctx.fillRect(0, 0, W, H);

      pulseT += 0.008;
      const breathR = W * (0.45 + Math.sin(pulseT) * 0.04);
      const pulse = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, breathR);
      pulse.addColorStop(0, "rgba(255,99,45,0.045)");
      pulse.addColorStop(0.5, "rgba(255,99,45,0.018)");
      pulse.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pulse;
      ctx.fillRect(0, 0, W, H);

      const diag = Math.sqrt(W * W + H * H);
      streaks.forEach((s) => {
        s.progress += s.speed;
        if (s.progress > 1.3) Object.assign(s, mkStreak(), { progress: -0.3 });

        const rad = (s.angle * Math.PI) / 180;
        const cx = W * s.progress;
        const cy = H * 0.5;
        const halfLen = diag * s.length * 0.5;
        const x1 = cx - Math.cos(rad) * halfLen;
        const y1 = cy - Math.sin(rad) * halfLen;
        const x2 = cx + Math.cos(rad) * halfLen;
        const y2 = cy + Math.sin(rad) * halfLen;
        const rgb = s.color === "#ff632d" ? "255,99,45" : "255,255,255";

        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.35, "rgba(" + rgb + "," + s.opacity + ")");
        g.addColorStop(0.65, "rgba(" + rgb + "," + s.opacity + ")");
        g.addColorStop(1, "rgba(0,0,0,0)");

        ctx.save();
        ctx.strokeStyle = g;
        ctx.lineWidth = s.width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      });

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += p.twinkleSpeed;
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkle));
        if (p.x < -5) p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        if (p.y > H + 5) p.y = -5;

        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.color === "#ff632d" && p.r > 1.2) {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          glow.addColorStop(0, "rgba(255,99,45,0.25)");
          glow.addColorStop(1, "rgba(255,99,45,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}
