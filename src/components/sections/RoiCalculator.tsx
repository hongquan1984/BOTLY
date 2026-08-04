"use client";

import { useMemo, useState } from "react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatNumber, scrollToId } from "@/lib/utils";

export function RoiCalculator() {
  const [employees, setEmployees] = useState(5);
  const [salary, setSalary] = useState(12_000_000);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [daysPerMonth, setDaysPerMonth] = useState(22);
  const [automationRate, setAutomationRate] = useState(40);
  const [implementationCost] = useState(30_000_000);

  const results = useMemo(() => {
    const totalManualHours = employees * hoursPerDay * daysPerMonth;
    const hoursSaved = totalManualHours * (automationRate / 100);
    const hourlyCost = salary / (daysPerMonth * 8);
    const monthlySavings = hoursSaved * hourlyCost;
    const yearlySavings = monthlySavings * 12;
    const paybackMonths =
      monthlySavings > 0 ? implementationCost / monthlySavings : null;

    return {
      totalManualHours,
      hoursSaved,
      monthlySavings,
      yearlySavings,
      paybackMonths,
    };
  }, [
    employees,
    salary,
    hoursPerDay,
    daysPerMonth,
    automationRate,
    implementationCost,
  ]);

  return (
    <Section id="roi">
      <SectionHeading
        eyebrow="ROI Calculator"
        title="Ước tính tiềm năng tối ưu chi phí"
        description="Công cụ tham khảo giúp hình dung số giờ và chi phí có thể tối ưu khi tự động hóa đúng tác vụ."
      />

      <div className="mt-10 grid w-full gap-5 sm:mt-12 lg:grid-cols-2 lg:gap-6">
        <div className="w-full space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <Field
            label="Số nhân viên làm việc thủ công"
            value={employees}
            min={1}
            max={200}
            step={1}
            onChange={setEmployees}
            display={`${employees} người`}
          />
          <Field
            label="Chi phí TB mỗi nhân viên / tháng"
            value={salary}
            min={3_000_000}
            max={50_000_000}
            step={500_000}
            onChange={setSalary}
            display={formatCurrency(salary)}
          />
          <Field
            label="Giờ làm việc lặp lại mỗi ngày"
            value={hoursPerDay}
            min={0.5}
            max={8}
            step={0.5}
            onChange={setHoursPerDay}
            display={`${hoursPerDay} giờ`}
          />
          <Field
            label="Số ngày làm việc mỗi tháng"
            value={daysPerMonth}
            min={15}
            max={26}
            step={1}
            onChange={setDaysPerMonth}
            display={`${daysPerMonth} ngày`}
          />
          <Field
            label="Tỷ lệ công việc có thể tự động hóa"
            value={automationRate}
            min={10}
            max={80}
            step={5}
            onChange={setAutomationRate}
            display={`${automationRate}%`}
          />
        </div>

        <div className="flex w-full flex-col rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-cyan-500/10 to-transparent p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-50">Kết quả ước tính</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ResultCard
              label="Tổng giờ có thể tiết kiệm / tháng"
              value={`${formatNumber(results.hoursSaved)} giờ`}
            />
            <ResultCard
              label="Chi phí nhân sự có thể tối ưu"
              value={formatCurrency(results.monthlySavings)}
            />
            <ResultCard
              label="Tiết kiệm ước tính / tháng"
              value={formatCurrency(results.monthlySavings)}
            />
            <ResultCard
              label="Tiết kiệm ước tính / năm"
              value={formatCurrency(results.yearlySavings)}
            />
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-slate-400">Thời gian hoàn vốn dự kiến*</p>
            <p className="mt-1 text-2xl font-bold text-cyan-300">
              {results.paybackMonths == null
                ? "—"
                : `~ ${results.paybackMonths.toFixed(1)} tháng`}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              *Giả định chi phí triển khai tham chiếu {formatCurrency(implementationCost)}.
              Mức thực tế sẽ được báo giá riêng.
            </p>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Đây là ước tính tham khảo. Kết quả thực tế phụ thuộc vào quy trình,
            dữ liệu và phạm vi triển khai.
          </p>

          <Button className="mt-6" fullWidth onClick={() => scrollToId("contact")}>
            Nhận phân tích quy trình miễn phí
          </Button>
        </div>
      </div>
    </Section>
  );
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <span className="text-sm font-semibold text-cyan-300">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-400"
      />
    </label>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-50">{value}</p>
    </div>
  );
}
