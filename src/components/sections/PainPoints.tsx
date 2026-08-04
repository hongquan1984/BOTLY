import {
  Repeat,
  Clock,
  UserX,
  Database,
  Video,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { painPoints } from "@/data/pain-points";

const iconMap: Record<string, LucideIcon> = {
  Repeat,
  Clock,
  UserX,
  Database,
  Video,
  BarChart3,
};

export function PainPoints() {
  return (
    <Section id="pain-points">
      <SectionHeading
        eyebrow="Pain Points"
        title="Doanh nghiệp của bạn có đang gặp những vấn đề này?"
        description="Những điểm nghẽn phổ biến khiến chi phí vận hành tăng và cơ hội bán hàng bị bỏ lỡ."
      />

      <div className="section-grid section-grid-3 mt-10 sm:mt-12">
        {painPoints.map((item, i) => {
          const Icon = iconMap[item.icon] ?? Repeat;
          return (
            <ScrollReveal key={item.id} delay={i * 0.05} className="w-full">
              <Card hover className="h-full">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-slate-50">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {item.description}
                </p>
                <p className="mt-4 rounded-lg border border-amber-400/15 bg-amber-400/5 px-3 py-2 text-xs font-medium text-amber-200/90">
                  {item.insight}
                </p>
              </Card>
            </ScrollReveal>
          );
        })}
      </div>
    </Section>
  );
}
