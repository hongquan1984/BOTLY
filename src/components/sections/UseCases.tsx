"use client";

import { useState } from "react";
import {
  Store,
  ShoppingCart,
  Building2,
  GraduationCap,
  Stethoscope,
  UtensilsCrossed,
  Sparkle,
  Plane,
  Truck,
  Factory,
  HardHat,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { useCases } from "@/data/use-cases";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Store,
  ShoppingCart,
  Building2,
  GraduationCap,
  Stethoscope,
  UtensilsCrossed,
  Sparkle,
  Plane,
  Truck,
  Factory,
  HardHat,
  Briefcase,
};

export function UseCases() {
  const [activeId, setActiveId] = useState<string>(useCases[0].id);
  const active = useCases.find((u) => u.id === activeId) ?? useCases[0];
  const ActiveIcon = iconMap[active.icon] ?? Store;

  return (
    <Section id="use-cases" muted>
      <SectionHeading
        eyebrow="Use Cases"
        title="AI Automation phù hợp với nhiều mô hình doanh nghiệp"
        description="Chọn ngành của bạn để xem ví dụ automation mẫu."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {useCases.map((item) => {
            const Icon = iconMap[item.icon] ?? Store;
            const selected = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition",
                  selected
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-cyan-500/10 to-transparent p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-50">{active.name}</h3>
              <p className="text-xs text-slate-400">Automation mẫu</p>
            </div>
          </div>
          <ol className="space-y-2.5">
            {active.automations.map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-200"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-bold text-cyan-300">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
