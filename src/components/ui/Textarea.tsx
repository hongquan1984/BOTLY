import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(
          "min-h-[110px] w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20",
          error && "border-rose-400/50 focus:border-rose-400/60 focus:ring-rose-400/20",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

Textarea.displayName = "Textarea";
