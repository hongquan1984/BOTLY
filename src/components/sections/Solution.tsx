"use client";

import { ArrowRight, XCircle, CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { beforeAutomation, afterAutomation } from "@/data/flows";
import { cn } from "@/lib/utils";

function FlowColumn({
  title,
  steps,
  variant,
}: {
  title: string;
  steps: readonly string[];
  variant: "before" | "after";
}) {
  const reduce = useReducedMotion();
  const isAfter = variant === "after";

  return (
    <div
      className={cn(
        "h-full w-full rounded-2xl border p-5 sm:p-6",
        isAfter
          ? "border-cyan-400/25 bg-gradient-to-b from-cyan-500/10 to-transparent"
          : "border-white/10 bg-white/[0.03]"
      )}
    >
      <div className="mb-5 flex items-center gap-2">
        {isAfter ? (
          <CheckCircle2 className="h-5 w-5 text-cyan-300" />
        ) : (
          <XCircle className="h-5 w-5 text-rose-300" />
        )}
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      </div>

      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={step}>
            <motion.div
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm",
                isAfter
                  ? "border-cyan-400/20 bg-cyan-400/5 text-slate-100"
                  : "border-white/10 bg-white/[0.02] text-slate-300"
              )}
              initial={reduce ? false : { opacity: 0.4 }}
              whileInView={
                reduce
                  ? undefined
                  : {
                      opacity: [0.4, 1, 0.85],
                    }
              }
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
              }}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  isAfter
                    ? "bg-cyan-400/20 text-cyan-200"
                    : "bg-white/10 text-slate-400"
                )}
              >
                {i + 1}
              </span>
              <span className="flex-1">{step}</span>
              {i < steps.length - 1 ? (
                <ArrowRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isAfter ? "text-cyan-400/60" : "text-slate-600"
                  )}
                />
              ) : null}
            </motion.div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Solution() {
  return (
    <Section id="solution" muted>
      <SectionHeading
        eyebrow="Giải pháp"
        title="Một hệ thống AI. Tự động hóa toàn bộ hành trình khách hàng."
        description="Thay chuỗi thao tác thủ công bằng luồng AI kết nối từ quảng cáo đến báo cáo."
      />

      <div className="mt-10 grid w-full gap-5 sm:mt-12 lg:grid-cols-2">
        <ScrollReveal className="w-full">
          <FlowColumn
            title="Trước khi tự động hóa"
            steps={beforeAutomation}
            variant="before"
          />
        </ScrollReveal>
        <ScrollReveal className="w-full" delay={0.1}>
          <FlowColumn
            title="Sau khi tự động hóa"
            steps={afterAutomation}
            variant="after"
          />
        </ScrollReveal>
      </div>
    </Section>
  );
}
