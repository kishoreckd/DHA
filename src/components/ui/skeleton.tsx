import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-muted before:absolute before:inset-0 before:animate-dha-skeleton-shimmer before:bg-linear-to-r before:from-transparent before:via-background/70 before:to-transparent", className)}
      {...props}
    />
  );
}

export { Skeleton };
