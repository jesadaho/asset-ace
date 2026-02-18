import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, error, leftIcon, rightIcon, ...props },
    ref
  ) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F172A]/50">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-base text-[#0F172A] placeholder:text-[#0F172A]/50 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 focus:border-transparent",
            "tap-target min-h-[44px]",
            error && "border-red-500 focus:ring-red-500",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F172A]/50">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
