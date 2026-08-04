import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import {
  activityLog,
  chartSeries,
  dashboardStats,
} from "@/data/dashboard";
import { cn } from "@/lib/utils";

export function DashboardPreview() {
  const maxConv = Math.max(...chartSeries.conversations);
  const maxLead = Math.max(...chartSeries.leads);

  return (
    <Section id="dashboard" muted>
      <SectionHeading
        eyebrow="Dashboard"
        title="Một màn hình để nắm toàn bộ vận hành AI"
        description="Dữ liệu hiển thị bên dưới là demo minh họa giao diện quản trị."
      />

      <ScrollReveal className="mt-12">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#070b16] p-4 shadow-2xl sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Botly Operations Dashboard
              </p>
              <p className="text-xs text-slate-500">Dữ liệu demo · không phải production</p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Live preview
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
              >
                <p className="text-[11px] text-slate-400">{stat.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-50">{stat.value}</p>
                <p
                  className={cn(
                    "mt-0.5 text-[11px]",
                    stat.tone === "cyan" && "text-cyan-300",
                    stat.tone === "blue" && "text-blue-300",
                    stat.tone === "purple" && "text-violet-300"
                  )}
                >
                  {stat.trend}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            {/* Line-ish chart */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-4 text-sm font-medium text-slate-200">
                Conversations theo tháng
              </p>
              <div className="flex h-40 items-end gap-1.5 sm:gap-2">
                {chartSeries.conversations.map((v, i) => (
                  <div key={chartSeries.labels[i]} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-600/40 to-cyan-400/80"
                      style={{ height: `${(v / maxConv) * 100}%` }}
                      title={`${v}`}
                    />
                    <span className="text-[9px] text-slate-500">{chartSeries.labels[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar chart leads */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-4 text-sm font-medium text-slate-200">New leads</p>
              <div className="space-y-2">
                {chartSeries.leads.slice(-6).map((v, i) => {
                  const label = chartSeries.labels[chartSeries.labels.length - 6 + i];
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-8 text-[10px] text-slate-500">{label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                          style={{ width: `${(v / maxLead) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-[10px] text-slate-400">{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-3 text-sm font-medium text-slate-200">Recent activities</p>
            <ul className="space-y-2">
              {activityLog.map((a) => (
                <li
                  key={a.time + a.text}
                  className="flex gap-3 border-b border-white/5 pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span className="shrink-0 font-mono text-xs text-cyan-300/80">
                    {a.time}
                  </span>
                  <span className="text-slate-400">{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ScrollReveal>
    </Section>
  );
}
