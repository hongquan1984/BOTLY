import { ArrowRight } from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { caseStudies } from "@/data/case-studies";

export function CaseStudies() {
  return (
    <Section id="case-studies">
      <SectionHeading
        eyebrow="Case Study"
        title="Tình huống minh họa: trước và sau khi tự động hóa"
        description="Các case study dưới đây mang tính minh họa để giúp bạn hình dung giá trị — chưa phải dữ liệu khách hàng thật."
      />

      <div className="section-grid section-grid-3 mt-10 sm:mt-12">
        {caseStudies.map((cs, i) => (
          <ScrollReveal key={cs.id} delay={i * 0.06} className="w-full">
            <Card hover className="flex h-full flex-col">
              <Badge className="mb-3 w-fit border-amber-400/20 bg-amber-400/10 text-amber-200">
                {cs.badge}
              </Badge>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                {cs.industry}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-50">{cs.title}</h3>

              <div className="mt-5 grid gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-rose-300/90">
                    Trước
                  </p>
                  <ul className="space-y-1.5">
                    {cs.before.map((b) => (
                      <li key={b} className="text-sm text-slate-400">
                        • {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center text-cyan-400">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-emerald-300/90">
                    Sau
                  </p>
                  <ul className="space-y-1.5">
                    {cs.after.map((a) => (
                      <li key={a} className="text-sm text-slate-300">
                        • {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-relaxed text-slate-400">
                {cs.outcome}
              </p>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
