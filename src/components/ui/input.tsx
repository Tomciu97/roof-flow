import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-lg border border-[var(--rf-border)] bg-white/90 px-3 text-[var(--rf-ink)] placeholder:text-slate-400 outline-none transition focus:border-[var(--rf-accent)] focus:ring-2 focus:ring-[var(--rf-accent)]/20",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
