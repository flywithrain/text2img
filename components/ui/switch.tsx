import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 cursor-pointer select-none"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-200",
          checked ? "bg-gradient-to-r from-brand-indigo to-brand-purple" : "bg-black/10",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
      {label ? <span className="text-sm text-ink-500">{label}</span> : null}
    </button>
  );
}
