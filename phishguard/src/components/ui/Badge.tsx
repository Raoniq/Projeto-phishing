import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-body font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-0)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-accent)] text-[var(--color-surface-0)]",
        secondary:
          "border-transparent bg-[var(--color-surface-2)] text-[var(--color-fg-primary)]",
        destructive:
          "border-transparent bg-[var(--color-danger)] text-white",
        outline:
          "border-[var(--color-noir-600)] text-[var(--color-fg-primary)] bg-transparent",
        success:
          "border-transparent bg-[var(--color-success)] text-white",
        warning:
          "border-transparent bg-[var(--color-warning)] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
