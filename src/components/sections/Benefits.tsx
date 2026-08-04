import {
  Layers,
  Zap,
  Moon,
  ShieldCheck,
  Link2,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { Card } from "@/components/ui/Card";
import { benefits, benefitCounters } from "@/data/benefits";

const benefitIcons: LucideIcon[] = [
  Layers,
  Zap,
  Moon,
  ShieldCheck,
  Link2,
  Target,
];

export function Benefits() {
  return (
    <Section id="benefits" muted>
      <SectionHeading
        eyebrow="Lợi ích"
        title="AI Automation mang lại điều gì cho doanh nghiệp?"
        description="Tập trung vào kết quả vận hành: nhanh hơn, ít sai hơn, và đội ngũ làm việc có giá trị hơn."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((item, i) => {
          const Icon = benefitIcons[i] ?? Zap;
          return (
            <ScrollReveal key={item.title} delay={i * 0.04}>
              <Card hover className="h-full p-5">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-50">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.description}</p>
              </Card>
            </ScrollReveal>
          );
        })}
      </div>

      <p className="mx-auto mt-12 max-w-3xl text-center text-xs leading-relaxed text-slate-500">
        Các con số dưới đây là mục tiêu tham khảo, kết quả thực tế phụ thuộc vào
        quy trình và mức độ triển khai.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {benefitCounters.map((c, i) => (
          <ScrollReveal key={c.label} delay={i * 0.03}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-2xl font-bold text-cyan-300 sm:text-3xl">
                <AnimatedCounter value={c.value} suffix={c.suffix} />
              </p>
              <p className="mt-1 text-[11px] leading-snug text-slate-400">{c.label}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
