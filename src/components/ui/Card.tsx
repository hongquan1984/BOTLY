import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm sm:p-6",
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-cyan-500/10",
        className
      )}
    >
      {children}
    </div>
  );
}
