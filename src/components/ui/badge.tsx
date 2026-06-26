import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/15 text-destructive",
        outline: "border border-input bg-transparent",
        success: "bg-emerald-50 text-emerald-700",
        warning: "bg-amber-50 text-amber-700",
        info: "bg-blue-50 text-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
