import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { error?: string }
>(({ className, error, children, ...props }, ref) => {
  return (
    <div className="w-full">
      <select
        ref={ref}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20",
          error && "border-rose-400/50 focus:border-rose-400/60 focus:ring-rose-400/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

Select.displayName = "Select";
