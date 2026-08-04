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
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      {eyebrow ? <Badge className="mb-4">{eyebrow}</Badge> : null}
      <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-slate-400 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
