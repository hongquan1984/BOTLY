"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/shared/Container";
import { heroNodes } from "@/data/platforms";
import { heroDashboardMetrics } from "@/data/dashboard";
import { scrollToId, cn } from "@/lib/utils";

export function Hero() {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);
  // Avoid SSR/client mismatch: only apply reduced-motion after mount
  const reduce = mounted && !!reduceMotion;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const el = glowRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--glow-x", `${x}px`);
      el.style.setProperty("--glow-y", `${y}px`);
    };

    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [reduce]);

  return (
    <section
      id="top"
      ref={glowRef}
      className="relative overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-32 lg:min-h-[100svh] lg:pb-24 lg:pt-36"
    >
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.12),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.35] motion-safe:animate-[grid-drift_28s_linear_infinite]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(500px circle at var(--glow-x, 50%) var(--glow-y, 30%), rgba(34,211,238,0.12), transparent 45%)",
          }}
        />
      </div>

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div>
            <Badge>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              AI Automation cho SMB
            </Badge>

            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Biến doanh nghiệp của bạn thành hệ thống vận hành bằng{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                AI
              </span>
            </h1>

            <p className="mt-5 text-lg font-medium text-slate-200 sm:text-xl">
              Tự động hóa marketing, chăm sóc khách hàng, livestream, bán hàng,
              báo cáo và quy trình nội bộ.
            </p>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
              Chúng tôi xây dựng hệ thống AI Automation theo đúng quy trình
              doanh nghiệp, giúp giảm việc thủ công, tiết kiệm chi phí và vận
              hành hiệu quả 24/7.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" fullWidth className="sm:w-auto" onClick={() => scrollToId("contact")}>
                Nhận tư vấn miễn phí
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                fullWidth
                className="sm:w-auto"
                onClick={() => scrollToId("automation")}
              >
                <Play className="h-4 w-4" />
                Xem hệ thống hoạt động
              </Button>
            </div>

            <ul className="mt-8 space-y-2.5">
              {[
                "Không cần kiến thức kỹ thuật",
                "Tích hợp với hệ thống hiện tại",
                "Có bản demo trước khi triển khai",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Dashboard visual */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Orbit nodes */}
            <div className="absolute inset-0 hidden sm:block" aria-hidden>
              {heroNodes.map((node, i) => (
                <motion.div
                  key={node.id}
                  className="absolute z-10"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                  animate={reduce ? undefined : { opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                >
                  <div className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-[#0A1020]/90 px-2.5 py-1 text-[10px] font-medium text-slate-300 shadow-lg backdrop-blur">
                    {node.label}
                  </div>
                </motion.div>
              ))}
              <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
                {heroNodes.map((node) => (
                  <line
                    key={node.id}
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2="50%"
                    y2="50%"
                    stroke="url(#lineGrad)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className={reduce ? undefined : "animate-[dash_8s_linear_infinite]"}
                  />
                ))}
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="relative z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#0A1020]/90 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-cyan-300">
                    AI Control Center
                  </p>
                  <p className="text-sm text-slate-400">Dashboard vận hành realtime</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  System Online
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {heroDashboardMetrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <p className="text-[11px] text-slate-400">{m.label}</p>
                    <p className="mt-1 text-xl font-bold text-slate-50">{m.value}</p>
                    <p className="text-[11px] text-cyan-300/80">{m.sub}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>AI Core Load</span>
                  <span className="text-cyan-300">72%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full w-[72%] rounded-full bg-gradient-to-r from-cyan-400 to-violet-500",
                      !reduce && "animate-pulse"
                    )}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Lead routing", "CRM sync", "Livestream script"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
