"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/Button";
import { salesAutomationFlow } from "@/data/flows";
import { cn } from "@/lib/utils";

export function AutomationShowcase() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || reduce) return;
    if (active >= salesAutomationFlow.length - 1) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setActive((a) => a + 1), 900);
    return () => clearTimeout(t);
  }, [running, active, reduce]);

  // scroll-based highlight when not running
  useEffect(() => {
    if (running) return;
    const nodes = salesAutomationFlow.map((_, i) =>
      document.getElementById(`flow-step-${i}`)
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.id;
          const idx = Number(id.replace("flow-step-", ""));
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0.4 }
    );
    nodes.forEach((n) => n && observer.observe(n));
    return () => observer.disconnect();
  }, [running]);

  const startRun = () => {
    setActive(0);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setActive(0);
  };

  return (
    <Section id="automation">
      <SectionHeading
        eyebrow="Automation Showcase"
        title="Hãy xem một quy trình bán hàng được tự động hóa"
        description="Từ bình luận Facebook đến chăm sóc sau bán — mỗi bước được AI và workflow xử lý liên tục."
      />

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <Button fullWidth className="sm:w-auto" onClick={startRun} disabled={running}>
          {running ? (
            <>
              <Pause className="h-4 w-4" />
              Đang chạy...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Chạy thử quy trình
            </>
          )}
        </Button>
        <Button fullWidth className="sm:w-auto" variant="secondary" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Đặt lại
        </Button>
      </div>

      <div className="mt-10 w-full">
        <ol className="mx-auto grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {salesAutomationFlow.map((step, i) => {
            const isActive = active === i;
            const isDone = active > i;
            return (
              <li key={step.id} id={`flow-step-${i}`} className="w-full min-w-0">
                <motion.div
                  className={cn(
                    "flex h-full w-full flex-col rounded-2xl border p-4 transition-all duration-300 sm:p-5",
                    isActive &&
                      "border-cyan-400/50 bg-cyan-400/10 shadow-lg shadow-cyan-500/10",
                    isDone && !isActive && "border-emerald-400/25 bg-emerald-400/5",
                    !isActive && !isDone && "border-white/10 bg-white/[0.03]"
                  )}
                  animate={
                    reduce
                      ? undefined
                      : isActive
                        ? { scale: 1.01 }
                        : { scale: 1 }
                  }
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                        isActive && "bg-cyan-400 text-slate-950",
                        isDone && !isActive && "bg-emerald-400/20 text-emerald-300",
                        !isActive && !isDone && "bg-white/10 text-slate-400"
                      )}
                    >
                      {step.id}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 sm:text-[0.95rem]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
                    {step.detail}
                  </p>
                </motion.div>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
