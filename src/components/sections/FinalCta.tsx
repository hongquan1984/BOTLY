"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Section } from "@/components/shared/Section";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { contactFormSchema, type ContactFormValues } from "@/lib/validations";
import { useToast } from "@/components/layout/ToastProvider";
import { useCases } from "@/data/use-cases";

export function FinalCta() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      company: "",
      industry: "",
      employees: "",
      problem: "",
      platforms: "",
      budget: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    // Mock submit — nối API tại đây (ví dụ POST /api/leads)
    await new Promise((r) => setTimeout(r, 700));
    console.info("[Contact form]", data);
    toast("Gửi thành công! Chúng tôi sẽ liên hệ trong thời gian sớm nhất.", "success");
    reset();
  };

  return (
    <Section id="contact" muted>
      <div className="grid w-full items-start gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="w-full text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
            Bắt đầu ngay
          </p>
          <h2 className="mt-3 text-balance text-[1.65rem] font-bold leading-tight tracking-tight text-slate-50 sm:text-4xl">
            Sẵn sàng tự động hóa doanh nghiệp của bạn?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base lg:mx-0">
            Hãy bắt đầu từ một quy trình nhỏ. Chúng tôi sẽ phân tích và đề xuất
            giải pháp AI phù hợp với nhu cầu, ngân sách và hệ thống hiện tại của
            doanh nghiệp.
          </p>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-slate-300 lg:mx-0 lg:max-w-none">
            <li>• Tư vấn miễn phí, không ràng buộc</li>
            <li>• Có thể yêu cầu demo trước khi triển khai</li>
            <li>• Không cần kiến thức kỹ thuật để bắt đầu</li>
          </ul>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full rounded-2xl border border-white/10 bg-[#050816]/60 p-5 sm:p-6"
          noValidate
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium text-slate-300">
                Họ tên *
              </label>
              <Input
                id="fullName"
                autoComplete="name"
                error={errors.fullName?.message}
                {...register("fullName")}
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-slate-300">
                Số điện thoại *
              </label>
              <Input
                id="phone"
                autoComplete="tel"
                inputMode="tel"
                error={errors.phone?.message}
                {...register("phone")}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
            <div>
              <label htmlFor="company" className="mb-1.5 block text-xs font-medium text-slate-300">
                Tên doanh nghiệp *
              </label>
              <Input
                id="company"
                autoComplete="organization"
                error={errors.company?.message}
                {...register("company")}
              />
            </div>
            <div>
              <label htmlFor="industry" className="mb-1.5 block text-xs font-medium text-slate-300">
                Ngành nghề *
              </label>
              <Select id="industry" error={errors.industry?.message} {...register("industry")}>
                <option value="">Chọn ngành</option>
                {useCases.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
                <option value="Khác">Khác</option>
              </Select>
            </div>
            <div>
              <label htmlFor="employees" className="mb-1.5 block text-xs font-medium text-slate-300">
                Số lượng nhân viên *
              </label>
              <Select
                id="employees"
                error={errors.employees?.message}
                {...register("employees")}
              >
                <option value="">Chọn quy mô</option>
                <option value="1-10">1–10</option>
                <option value="11-50">11–50</option>
                <option value="51-200">51–200</option>
                <option value="200+">200+</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="problem" className="mb-1.5 block text-xs font-medium text-slate-300">
                Vấn đề muốn tự động hóa *
              </label>
              <Textarea
                id="problem"
                placeholder="Ví dụ: phản hồi tin nhắn Facebook/Zalo, nhắc lịch, đồng bộ CRM..."
                error={errors.problem?.message}
                {...register("problem")}
              />
            </div>
            <div>
              <label htmlFor="platforms" className="mb-1.5 block text-xs font-medium text-slate-300">
                Nền tảng đang dùng
              </label>
              <Input
                id="platforms"
                placeholder="Facebook, Zalo, Shopee, HubSpot..."
                {...register("platforms")}
              />
            </div>
            <div>
              <label htmlFor="budget" className="mb-1.5 block text-xs font-medium text-slate-300">
                Ngân sách dự kiến
              </label>
              <Select id="budget" {...register("budget")}>
                <option value="">Chưa xác định</option>
                <option value="<20tr">Dưới 20 triệu</option>
                <option value="20-50tr">20–50 triệu</option>
                <option value="50-100tr">50–100 triệu</option>
                <option value="100tr+">Trên 100 triệu</option>
              </Select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Đặt lịch tư vấn miễn phí"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                const el = document.getElementById("problem");
                if (el instanceof HTMLTextAreaElement) {
                  el.focus();
                  el.value = "Tôi muốn xem demo hệ thống AI Automation / AI Livestream.";
                  el.dispatchEvent(new Event("input", { bubbles: true }));
                }
              }}
            >
              Yêu cầu bản demo
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Form hiện mock submit. Nối backend tại{" "}
            <code className="text-slate-400">FinalCta.tsx → onSubmit</code>.
          </p>
        </form>
      </div>
    </Section>
  );
}
