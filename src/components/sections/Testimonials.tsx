"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { testimonials } from "@/data/testimonials";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const item = testimonials[index];

  const prev = () =>
    setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setIndex((i) => (i + 1) % testimonials.length);

  return (
    <Section id="testimonials" muted>
      <SectionHeading
        eyebrow="Feedback"
        title="Những gì khách hàng mong đợi sau khi tự động hóa"
        description="Các nhận xét dưới đây là placeholder minh họa — sẽ được thay bằng feedback thật khi có dữ liệu."
      />

      <div className="mx-auto mt-10 max-w-3xl">
        <figure className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <Quote className="absolute right-6 top-6 h-10 w-10 text-cyan-400/15" />
          <blockquote className="text-lg leading-relaxed text-slate-100 sm:text-xl">
            “{item.quote}”
          </blockquote>
          <figcaption className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-200">{item.role}</p>
              <p className="text-xs text-amber-200/80">{item.note}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="Nhận xét trước"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Nhận xét sau"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </figcaption>
        </figure>

        <div className="mt-4 flex justify-center gap-1.5">
          {testimonials.map((t, i) => (
            <button
              key={t.id}
              type="button"
              aria-label={`Xem nhận xét ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-cyan-400" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
