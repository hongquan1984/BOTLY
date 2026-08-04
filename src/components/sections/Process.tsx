import {
  MessageCircle,
  Search,
  ListChecks,
  Network,
  FlaskConical,
  TestTube2,
  Plug,
  Users,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { processSteps } from "@/data/process";

const iconMap: Record<string, LucideIcon> = {
  MessageCircle,
  Search,
  ListChecks,
  Network,
  FlaskConical,
  TestTube2,
  Plug,
  Users,
  LineChart,
};

export function Process() {
  return (
    <Section id="process" muted>
      <SectionHeading
        eyebrow="Quy trình"
        title="Quy trình triển khai"
        description="9 bước rõ ràng — từ tư vấn miễn phí đến tối ưu sau go-live."
      />

      <div className="relative mt-12">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400/50 via-violet-400/30 to-transparent md:left-1/2" />

        <ol className="space-y-6">
          {processSteps.map((step, i) => {
            const Icon = iconMap[step.icon] ?? Search;
            const left = i % 2 === 0;
            return (
              <ScrollReveal key={step.step} delay={i * 0.03}>
                <li
                  className={`relative grid gap-4 md:grid-cols-2 ${
                    left ? "" : "md:[&>*:first-child]:order-2"
                  }`}
                >
                  <div
                    className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${
                      left ? "md:mr-8" : "md:ml-8"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-slate-950">
                        {step.step}
                      </span>
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cyan-300">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-slate-50">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-400">{step.description}</p>
                  </div>
                  <div className="hidden md:block" />
                  <span className="absolute left-4 top-6 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-cyan-300 bg-[#050816] md:left-1/2" />
                </li>
              </ScrollReveal>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
