import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "default" | "warning" | "error";
}

const variantStyles = {
  success:
    "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30",
  default:
    "bg-[#0F172A]/10 text-[#0F172A] border border-[#0F172A]/20",
  warning:
    "bg-amber-500/20 text-amber-600 border border-amber-500/30 dark:text-amber-400",
  error:
    "bg-red-500/20 text-red-600 border border-red-500/30 dark:text-red-400",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
