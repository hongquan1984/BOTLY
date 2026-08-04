import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl",
        centered
          ? "flex flex-col items-center text-center"
          : "text-left",
        className
      )}
    >
      {eyebrow ? (
        <Badge className={cn("mb-4", centered && "mx-auto")}>{eyebrow}</Badge>
      ) : null}
      <h2 className="w-full text-balance text-[1.65rem] font-bold leading-tight tracking-tight text-slate-50 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 w-full text-pretty text-[0.95rem] leading-relaxed text-slate-400 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
