import { cn } from "@/lib/utils";
import { Container } from "./Container";

export function Section({
  id,
  children,
  className,
  containerClassName,
  muted = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  muted?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-24 py-16 sm:py-20 lg:py-24",
        muted ? "bg-[#0A1020]/60" : "bg-transparent",
        className
      )}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
