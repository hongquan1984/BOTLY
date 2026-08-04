import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <a
      href="#top"
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="AIFlow Automation - Trang chủ"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 shadow-lg shadow-cyan-500/25">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-slate-950"
          fill="none"
          aria-hidden
        >
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
          <path
            d="M12 4v3M12 17v3M4 12h3M17 12h3M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showText ? (
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight text-slate-50 sm:text-base">
            AIFlow
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Automation
          </span>
        </span>
      ) : null}
    </a>
  );
}
