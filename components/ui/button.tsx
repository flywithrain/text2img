import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none";
    const variants: Record<Variant, string> = {
      primary:
        "bg-gradient-to-r from-brand-sky to-brand-meadow text-white shadow-lg shadow-brand-sky/30 hover:-translate-y-0.5 hover:shadow-brand-sky/50",
      outline:
        "border border-black/10 bg-bg-100 text-ink-900 hover:bg-bg-200",
      ghost: "text-ink-500 hover:bg-bg-100 hover:text-ink-900",
    };
    return (
      <button
        ref={ref}
        type={type}
        className={cn(base, variants[variant], className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
