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
      <span className="relative block h-12 w-[11.5rem] sm:h-14 sm:w-[14rem] lg:h-16 lg:w-[16rem]">
        <Image
          src="/logo.png"
          alt="Botly.vn"
          fill
          priority
          sizes="(max-width: 640px) 184px, (max-width: 1024px) 224px, 256px"
          className="object-contain object-left drop-shadow-[0_0_18px_rgba(34,211,238,0.45)]"
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
