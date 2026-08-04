"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { demoFormSchema, type DemoFormValues } from "@/lib/validations";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export function DemoPopup() {
  const [dismissed, setDismissed, ready] = useLocalStorage(
    "aiflow-demo-popup-dismissed",
    false
  );
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      interest: "",
    },
  });

  useEffect(() => {
    if (!ready || dismissed) return;

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const progress = scrollTop / docHeight;
      if (progress >= 0.6) {
        setOpen(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ready, dismissed]);

  const close = () => {
    setOpen(false);
    setDismissed(true);
  };

  const onSubmit = async (data: DemoFormValues) => {
    // Mock submit — thay bằng API endpoint thực tế
    await new Promise((r) => setTimeout(r, 600));
    console.info("[Demo request]", data);
    setSuccess(true);
    reset();
    setTimeout(() => {
      close();
      setSuccess(false);
    }, 1800);
  };

  if (!open || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Đóng popup"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-popup-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0A1020] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="demo-popup-title" className="pr-8 text-xl font-bold text-slate-50">
          Nhận bản demo AI Automation
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Để lại thông tin — chúng tôi sẽ liên hệ tư vấn và gửi demo phù hợp với
          ngành của bạn.
        </p>

        {success ? (
          <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            Đã gửi yêu cầu demo. Cảm ơn bạn!
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3" noValidate>
            <Input
              placeholder="Họ và tên"
              autoComplete="name"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <Input
              placeholder="Số điện thoại"
              autoComplete="tel"
              inputMode="tel"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <Input
              placeholder="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Select error={errors.interest?.message} {...register("interest")}>
              <option value="">Dịch vụ quan tâm</option>
              <option value="ai-livestream">AI Livestream</option>
              <option value="customer-service">AI Customer Service</option>
              <option value="marketing">Automation Marketing</option>
              <option value="workflow">Workflow Automation</option>
              <option value="custom">Custom AI</option>
            </Select>
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Yêu cầu demo"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
