import { cn } from "@/lib/utils";

type LoaderVariant = "dots-pulse" | "dots-wave";
type LoaderSize = "sm" | "md" | "lg";

type LoaderProps = {
  className?: string;
  variant?: LoaderVariant;
  size?: LoaderSize;
};

const sizeClass: Record<LoaderSize, string> = {
  sm: "gap-1.5 [&_span]:size-1.5",
  md: "gap-2 [&_span]:size-2",
  lg: "gap-2.5 [&_span]:size-2.5",
};

export function Loader({ className, variant = "dots-pulse", size = "md" }: LoaderProps) {
  const animation =
    variant === "dots-wave"
      ? "[&_span]:animate-dha-loader-wave"
      : "[&_span]:animate-dha-loader-pulse";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center text-primary",
        sizeClass[size],
        animation,
        className,
      )}
      aria-hidden="true"
    >
      <span className="rounded-full bg-current [animation-delay:-240ms]" />
      <span className="rounded-full bg-current [animation-delay:-120ms]" />
      <span className="rounded-full bg-current" />
    </span>
  );
}
