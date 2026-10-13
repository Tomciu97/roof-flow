import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-lg border border-[var(--rf-border)] bg-white/90 px-3 text-[var(--rf-ink)] outline-none transition focus:border-[var(--rf-accent)] focus:ring-2 focus:ring-[var(--rf-accent)]/20",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
