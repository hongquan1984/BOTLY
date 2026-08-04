"use client";

import { useState } from "react";
import {
  Radio,
  MessageSquare,
  Megaphone,
  Handshake,
  Workflow,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Card } from "@/components/ui/Card";
import { services } from "@/data/services";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Radio,
  MessageSquare,
  Megaphone,
  Handshake,
  Workflow,
  Sparkles,
};

export function Services() {
  const [active, setActive] = useState<string>(services[0].id);

  return (
    <Section id="services">
      <SectionHeading
        eyebrow="Dịch vụ"
        title="Giải pháp AI Automation cho từng phần vận hành"
        description="Từ livestream, chăm sóc khách hàng đến workflow nội bộ — thiết kế theo quy trình doanh nghiệp của bạn."
      />

      <div className="section-grid section-grid-3 mt-10 sm:mt-12">
        {services.map((service, i) => {
          const Icon = iconMap[service.icon] ?? Sparkles;
          const isActive = active === service.id;
          return (
            <ScrollReveal key={service.id} delay={i * 0.04} className="w-full">
              <Card
                hover
                className={cn(
                  "flex h-full cursor-pointer flex-col",
                  isActive && "border-cyan-400/35 bg-cyan-400/[0.06]"
                )}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setActive(service.id)}
                  aria-expanded={isActive}
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-50">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {service.description}
                  </p>
                </button>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {service.features.slice(0, isActive ? undefined : 5).map((f) => (
                    <li
                      key={f}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300"
                    >
                      {f}
                    </li>
                  ))}
                  {!isActive && service.features.length > 5 ? (
                    <li className="rounded-md px-2 py-1 text-[11px] text-cyan-300">
                      +{service.features.length - 5} tính năng
                    </li>
                  ) : null}
                </ul>
              </Card>
            </ScrollReveal>
          );
        })}
      </div>
    </Section>
  );
}
