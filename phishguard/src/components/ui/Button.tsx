/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-body font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-0)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent)] text-[var(--color-surface-0)] hover:bg-[var(--color-accent-hover)] shadow-md hover:shadow-glow active:scale-[0.98]",
        secondary:
          "border border-[var(--color-noir-600)] bg-transparent text-[var(--color-fg-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-[0.98]",
        ghost:
          "bg-transparent text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-2)] active:scale-[0.98]",
        destructive:
          "bg-[var(--color-danger)] text-white hover:bg-[var(--color-red-500)]/90 shadow-md active:scale-[0.98]",
        link: "bg-transparent text-[var(--color-accent)] underline-offset-4 hover:underline focus-visible:ring-0",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm rounded-[var(--radius-md)]",
        sm: "h-8 px-3 text-xs rounded-[var(--radius-sm)]",
        lg: "h-12 px-6 text-base rounded-[var(--radius-lg)]",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
