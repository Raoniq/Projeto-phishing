import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-[var(--radius-md)] border bg-[var(--color-surface-0)] px-3 py-2 text-sm font-body text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-muted)] transition-all duration-200",
          "border-[var(--color-noir-600)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-0)] focus:border-[var(--color-accent)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
            : "",
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
