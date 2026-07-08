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
        "bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-lg shadow-brand-violet/30 hover:-translate-y-0.5 hover:shadow-brand-violet/50",
      outline:
        "border border-white/15 bg-white/5 text-[#F4F4F8] hover:bg-white/10",
      ghost: "text-[#C7C7D1] hover:bg-white/5 hover:text-white",
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
