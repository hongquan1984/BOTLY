import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = false,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <a
      href="#top"
      className={cn("inline-flex items-center gap-3", className)}
      aria-label="Botly - Trang chủ"
    >
      {/* Aspect ~2.68 (182×68) — wordmark botly.vn */}
      <span className="relative block h-11 w-[7.5rem] sm:h-12 sm:w-[8.5rem] lg:h-14 lg:w-[10rem]">
        <Image
          src="/logo.png"
          alt="Botly.vn"
          fill
          priority
          sizes="(max-width: 640px) 120px, (max-width: 1024px) 136px, 160px"
          className="object-contain object-left"
        />
      </span>
      {showText ? (
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-bold tracking-tight text-slate-50">
            Botly
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Automation
          </span>
        </span>
      ) : null}
    </a>
  );
}
