"use client";

import { useState } from "react";
import {
  MessageCircle,
  Phone,
  CalendarDays,
  X,
  MessageSquareMore,
} from "lucide-react";
import { siteConfig } from "@/data/site";
import { scrollToId, cn } from "@/lib/utils";

export function FloatingActions() {
  const [open, setOpen] = useState(false);

  const items = [
    {
      label: "Chat",
      icon: MessageSquareMore,
      onClick: () => scrollToId("contact"),
      className: "bg-violet-500 hover:bg-violet-400",
    },
    {
      label: "Gọi điện",
      icon: Phone,
      href: siteConfig.contact.phoneHref,
      className: "bg-blue-500 hover:bg-blue-400",
    },
    {
      label: "Zalo",
      icon: MessageCircle,
      href: siteConfig.contact.zalo,
      className: "bg-sky-500 hover:bg-sky-400",
    },
    {
      label: "Đặt lịch",
      icon: CalendarDays,
      onClick: () => scrollToId("contact"),
      className: "bg-cyan-500 hover:bg-cyan-400",
    },
  ];

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      <div
        className={cn(
          "flex flex-col items-end gap-2 transition-all duration-300",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const className = cn(
            "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white shadow-lg transition",
            item.className
          );
          if (item.href) {
            return (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                className={className}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          }
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={className}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 text-slate-950 shadow-xl shadow-cyan-500/30 transition hover:brightness-110"
        aria-label={open ? "Đóng menu liên hệ" : "Mở menu liên hệ nhanh"}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
