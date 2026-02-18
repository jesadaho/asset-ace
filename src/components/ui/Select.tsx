import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "placeholder"> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full appearance-none rounded-xl border border-[#0F172A]/20 bg-white px-4 py-2 pr-10 text-base text-[#0F172A] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 focus:border-transparent",
            "tap-target min-h-[44px]",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0F172A]/50 pointer-events-none"
          aria-hidden
        />
      </div>
    );
  }
);

Select.displayName = "Select";
