import {
  ScanSearch,
  PencilRuler,
  Boxes,
  Layers,
  LayoutDashboard,
  BookOpen,
  LifeBuoy,
  TrendingUp,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { whyChooseUs } from "@/data/why-us";

const iconMap: Record<string, LucideIcon> = {
  ScanSearch,
  PencilRuler,
  Boxes,
  Layers,
  LayoutDashboard,
  BookOpen,
  LifeBuoy,
  TrendingUp,
  Shield,
};

export function WhyChooseUs() {
  return (
    <Section id="why-us">
      <SectionHeading
        eyebrow="Why AIFlow"
        title="Không chỉ cài phần mềm. Chúng tôi thiết kế một hệ thống phù hợp với doanh nghiệp."
        description="Ưu tiên ROI, tích hợp hiện trạng và triển khai theo giai đoạn có kiểm soát."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {whyChooseUs.map((item, i) => {
          const Icon = iconMap[item.icon] ?? Shield;
          return (
            <ScrollReveal key={item.title} delay={i * 0.03}>
              <Card hover className="h-full p-5">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-50">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </Card>
            </ScrollReveal>
          );
        })}
      </div>
    </Section>
  );
}
