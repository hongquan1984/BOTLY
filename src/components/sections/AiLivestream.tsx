"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  ShoppingBag,
  MessageCircle,
  Radio,
  Check,
  Clock,
} from "lucide-react";
import { Section } from "@/components/shared/Section";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Button } from "@/components/ui/Button";
import { scrollToId } from "@/lib/utils";

const benefits = [
  "Hoạt động 24/7",
  "Không phụ thuộc lịch của host",
  "Dễ thay đổi kịch bản",
  "Dùng được cho nhiều sản phẩm",
  "Triển khai nhiều ngôn ngữ",
  "Đồng nhất thông điệp thương hiệu",
  "Giảm chi phí sản xuất lặp lại",
  "Thu thập dữ liệu trong livestream",
];

const comments = [
  { user: "Minh Anh", text: "Sản phẩm này còn size M không ạ?" },
  { user: "Lan", text: "Giá bao nhiêu shop?" },
  { user: "Hoàng", text: "Ship HN mấy ngày?" },
  { user: "Trang", text: "Có combo ưu đãi không?" },
];

const products = [
  { name: "Serum dưỡng ẩm", price: "289.000đ" },
  { name: "Kem chống nắng", price: "259.000đ" },
  { name: "Combo chăm da", price: "499.000đ" },
];

const script = [
  { t: "00:00", a: "Chào mừng & giới thiệu thương hiệu" },
  { t: "05:00", a: "Giới thiệu sản phẩm nổi bật" },
  { t: "15:00", a: "Trả lời câu hỏi phổ biến" },
  { t: "25:00", a: "Ưu đãi & kêu gọi mua" },
];

export function AiLivestream() {
  const [viewers, setViewers] = useState(1284);
  const [commentIdx, setCommentIdx] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => {
      setViewers((v) => v + Math.floor(Math.random() * 7) - 2);
    }, 2500);
    const t2 = setInterval(() => {
      setCommentIdx((i) => (i + 1) % comments.length);
    }, 3200);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  return (
    <Section id="ai-livestream" muted>
      <SectionHeading
        eyebrow="AI Livestream"
        title="AI Livestream vận hành không mệt mỏi"
        description="Hệ thống AI Livestream giúp doanh nghiệp duy trì nội dung bán hàng, giới thiệu sản phẩm và tương tác với người xem trong thời gian dài mà không phụ thuộc hoàn toàn vào đội ngũ host."
      />

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-2">
        <ScrollReveal>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050816] shadow-2xl shadow-violet-500/10">
            {/* Live header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                  <Radio className="h-3 w-3" />
                  LIVE
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                  <Eye className="h-3.5 w-3.5" />
                  {viewers.toLocaleString("vi-VN")}
                </span>
              </div>
              <span className="text-xs text-emerald-300">AI Host đang phát</span>
            </div>

            <div className="grid gap-0 sm:grid-cols-[1.1fr_0.9fr]">
              {/* Stage */}
              <div className="relative aspect-[4/5] bg-gradient-to-b from-violet-900/40 via-[#0A1020] to-[#050816] sm:aspect-auto sm:min-h-[360px]">
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="relative mb-4 flex h-28 w-28 items-center justify-center rounded-full border border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 to-violet-500/30 shadow-lg shadow-cyan-500/20">
                    <div className="absolute inset-0 animate-ping rounded-full border border-cyan-400/20 opacity-30" />
                    <span className="text-4xl" aria-hidden>
                      🤖
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100">AI Host · Linh</p>
                  <p className="mt-1 text-center text-xs text-slate-400">
                    “Sản phẩm này phù hợp da khô và da hỗn hợp…”
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] text-cyan-200">
                    <MessageCircle className="h-3.5 w-3.5" />
                    AI đang phản hồi: {comments[commentIdx].user}
                  </div>
                </div>
              </div>

              {/* Side panels */}
              <div className="flex flex-col border-t border-white/10 sm:border-l sm:border-t-0">
                <div className="flex-1 border-b border-white/10 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Bình luận
                  </p>
                  <ul className="space-y-2">
                    {comments.map((c, i) => (
                      <li
                        key={c.user}
                        className={`rounded-lg px-2 py-1.5 text-xs transition ${
                          i === commentIdx
                            ? "bg-cyan-400/10 text-slate-100"
                            : "text-slate-400"
                        }`}
                      >
                        <span className="font-semibold text-cyan-300">{c.user}</span>
                        <span className="ml-1">{c.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Sản phẩm
                  </p>
                  <ul className="space-y-2">
                    {products.map((p) => (
                      <li
                        key={p.name}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2"
                      >
                        <div>
                          <p className="text-xs font-medium text-slate-200">{p.name}</p>
                          <p className="text-[11px] text-cyan-300">{p.price}</p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-cyan-400 to-blue-500 px-2 py-1 text-[10px] font-bold text-slate-950"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          Mua
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                Timeline kịch bản
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {script.map((s) => (
                  <div
                    key={s.t}
                    className="min-w-[8rem] shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2"
                  >
                    <p className="text-[10px] font-bold text-violet-300">{s.t}</p>
                    <p className="mt-0.5 text-[11px] text-slate-300">{s.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div>
            <h3 className="text-xl font-semibold text-slate-50">
              Lợi ích cho doanh nghiệp
            </h3>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  {b}
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              className="mt-8"
              fullWidth
              onClick={() => scrollToId("contact")}
            >
              Yêu cầu bản demo AI Livestream
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </Section>
  );
}
