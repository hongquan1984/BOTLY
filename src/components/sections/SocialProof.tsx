import { Section } from "@/components/shared/Section";
import { integrationPlatforms } from "@/data/platforms";

export function SocialProof() {
  const doubled = [...integrationPlatforms, ...integrationPlatforms];

  return (
    <Section className="!py-10 sm:!py-12" muted>
      <p className="mb-6 text-center text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
        Tích hợp với những nền tảng doanh nghiệp đang sử dụng
      </p>
      <p className="mb-8 text-center text-xs text-slate-500">
        Logo mang tính minh họa khả năng tích hợp — không khẳng định đối tác chính thức.
      </p>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0A1020] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0A1020] to-transparent" />
        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-3 motion-reduce:animate-none">
          {doubled.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex h-12 min-w-[8.5rem] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-slate-400 grayscale"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
