"use client";

import { Check } from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { pricingPlans } from "@/data/pricing";
import { scrollToId, cn } from "@/lib/utils";

export function Pricing() {
  return (
    <Section id="pricing">
      <SectionHeading
        eyebrow="Báo giá"
        title="Chọn gói phù hợp với giai đoạn của doanh nghiệp"
        description="Chi phí phụ thuộc vào số lượng quy trình, nền tảng tích hợp và độ phức tạp của hệ thống."
      />

      <div className="section-grid section-grid-3 mt-10 sm:mt-12">
        {pricingPlans.map((plan, i) => (
          <ScrollReveal key={plan.id} delay={i * 0.06} className="w-full">
            <Card
              className={cn(
                "relative flex h-full flex-col",
                plan.highlighted &&
                  "border-cyan-400/40 bg-gradient-to-b from-cyan-500/10 to-transparent shadow-xl shadow-cyan-500/10"
              )}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-0.5 text-[11px] font-bold text-slate-950">
                  Phổ biến
                </span>
              ) : null}
              <h3 className="text-xl font-bold text-slate-50">{plan.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
              <p className="mt-4 text-sm font-semibold text-cyan-300">
                Báo giá theo phạm vi dự án
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6"
                fullWidth
                variant={plan.highlighted ? "primary" : "secondary"}
                onClick={() => scrollToId("contact")}
              >
                {plan.cta}
              </Button>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
