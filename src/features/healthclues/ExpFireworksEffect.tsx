"use client";

import React, { useEffect, useRef, useState } from "react";

interface ExpFireworksEffectProps {
  expGained?: number;
  durationMs?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity: number;
  flicker: boolean;
  shape: "circle" | "star";
  trail: Array<{ x: number; y: number; alpha: number }>;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  exploded: boolean;
  burstColorTheme: string[];
  particleCount: number;
}

const COLOR_THEMES = [
  // 1. Golden Sunshine (Level/EXP Glory)
  ["#ffd700", "#ffae00", "#fff59d", "#ffffff", "#f59e0b", "#fde047"],
  // 2. Emerald Healing (HealthClues Signature)
  ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#ffffff", "#059669"],
  // 3. Radiant Rose & Sunset
  ["#f43f5e", "#fb7185", "#fda4af", "#ffd700", "#ffffff", "#e11d48"],
  // 4. Starlight Violet & Cyan
  ["#8b5cf6", "#a78bfa", "#38bdf8", "#7dd3fc", "#ffffff", "#6366f1"],
  // 5. Grand Rainbow Finale
  ["#ffd700", "#10b981", "#38bdf8", "#f43f5e", "#e879f9", "#ffffff", "#facc15"],
];

export function ExpFireworksEffect({
  expGained = 10,
  durationMs = 4200,
  onComplete,
}: ExpFireworksEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [badgeVisible, setBadgeVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let running = true;
    const startTime = performance.now();

    const particles: Particle[] = [];
    const rockets: Rocket[] = [];

    // Schedule 6 staggered launches covering left, center, right of EXP capsule
    const launchSchedule: Array<{ delay: number; startX: number; targetX: number; targetY: number; themeIdx: number; count: number }> = [
      { delay: 30, startX: 180, targetX: 190, targetY: 100, themeIdx: 0, count: 42 },
      { delay: 300, startX: 520, targetX: 510, targetY: 95, themeIdx: 1, count: 42 },
      { delay: 650, startX: 270, targetX: 290, targetY: 80, themeIdx: 2, count: 48 },
      { delay: 1000, startX: 430, targetX: 410, targetY: 85, themeIdx: 3, count: 48 },
      { delay: 1350, startX: 350, targetX: 350, targetY: 65, themeIdx: 4, count: 65 },
      { delay: 1700, startX: 350, targetX: 350, targetY: 90, themeIdx: 0, count: 50 },
    ];

    const launched = new Set<number>();

    function createBurst(x: number, y: number, colors: string[], count: number) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
        const speed = Math.random() * 5.2 + 2.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const isStar = Math.random() > 0.5;

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: isStar ? Math.random() * 4 + 3 : Math.random() * 3 + 2.2,
          alpha: 1,
          decay: Math.random() * 0.014 + 0.011,
          gravity: 0.09,
          flicker: Math.random() > 0.3,
          shape: isStar ? "star" : "circle",
          trail: [],
        });
      }

      // Spark crackle ring
      for (let j = 0; j < 16; j++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6.5 + 1.2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: "#ffffff",
          size: Math.random() * 2 + 1.2,
          alpha: 1,
          decay: Math.random() * 0.025 + 0.018,
          gravity: 0.06,
          flicker: true,
          shape: "circle",
          trail: [],
        });
      }
    }

    function drawStar(context: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      context.beginPath();
      context.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        context.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        context.lineTo(x, y);
        rot += step;
      }
      context.lineTo(cx, cy - outerRadius);
      context.closePath();
      context.fill();
    }

    function render(time: number) {
      if (!running || !ctx || !canvas) return;
      const elapsed = time - startTime;

      // Check launches
      launchSchedule.forEach((item, index) => {
        if (!launched.has(index) && elapsed >= item.delay) {
          launched.add(index);
          const flightSteps = 15;
          const dy = item.targetY - 300;
          const dx = item.targetX - item.startX;
          rockets.push({
            x: item.startX,
            y: 300,
            targetY: item.targetY,
            vx: dx / flightSteps,
            vy: dy / flightSteps,
            color: item.themeIdx === 0 ? "#ffd700" : item.themeIdx === 1 ? "#34d399" : item.themeIdx === 2 ? "#fb7185" : "#38bdf8",
            exploded: false,
            burstColorTheme: COLOR_THEMES[item.themeIdx] || COLOR_THEMES[0],
            particleCount: item.count,
          });
        }
      });

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update & Draw Rockets
      for (let r = rockets.length - 1; r >= 0; r--) {
        const rocket = rockets[r];
        if (!rocket.exploded) {
          rocket.x += rocket.vx;
          rocket.y += rocket.vy;

          ctx.save();
          ctx.fillStyle = rocket.color;
          ctx.shadowColor = rocket.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(rocket.x, rocket.y, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Spark trail
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(rocket.x - rocket.vx * 0.9, rocket.y - rocket.vy * 0.9, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (rocket.y <= rocket.targetY) {
            rocket.exploded = true;
            createBurst(rocket.x, rocket.targetY, rocket.burstColorTheme, rocket.particleCount);
            rockets.splice(r, 1);
          }
        }
      }

      // Update & Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.trail.unshift({ x: p.x, y: p.y, alpha: p.alpha });
        if (p.trail.length > 3) p.trail.pop();

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        let currentAlpha = p.alpha;
        if (p.flicker) {
          currentAlpha *= 0.75 + 0.25 * Math.sin(time * 0.05 + p.x);
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));

        // Draw particle trail
        if (p.trail.length > 1) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * 0.7;
          ctx.beginPath();
          ctx.moveTo(p.trail[1].x, p.trail[1].y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 2.5;

        if (p.shape === "star") {
          drawStar(ctx, p.x, p.y, 4, p.size, p.size * 0.4);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (elapsed >= durationMs && particles.length === 0 && rockets.length === 0) {
        running = false;
        onComplete?.();
        return;
      }

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    const badgeTimer = setTimeout(() => {
      setBadgeVisible(false);
    }, durationMs - 400);

    const completeTimer = setTimeout(() => {
      running = false;
      onComplete?.();
    }, durationMs);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      clearTimeout(badgeTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      className="hc-exp-fireworks-overlay"
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "-40px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "700px",
        height: "320px",
        pointerEvents: "none",
        zIndex: 60,
      }}
    >
      {/* 1. Canvas for Real Multi-burst Fireworks */}
      <canvas
        ref={canvasRef}
        width={700}
        height={320}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* 2. Floating +EXP Pop Badge */}
      {badgeVisible && (
        <div className="hc-exp-float-badge-container">
          <div className="hc-exp-float-badge">
            <span className="hc-exp-float-star">✨</span>
            <span className="hc-exp-float-val">+{expGained} EXP</span>
            <span className="hc-exp-float-star">🌟</span>
          </div>
        </div>
      )}
    </div>
  );
}
