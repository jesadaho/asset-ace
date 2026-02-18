import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles = {
  primary:
    "bg-[#10B981] text-white hover:bg-[#0D9668] active:bg-[#0B7A56] border-transparent",
  secondary:
    "border-2 border-[#0F172A] text-[#0F172A] bg-transparent hover:bg-[#0F172A]/5 active:bg-[#0F172A]/10",
  ghost:
    "bg-transparent text-[#0F172A] hover:bg-[#0F172A]/5 active:bg-[#0F172A]/10 border-transparent",
};

const sizeStyles = {
  sm: "h-9 px-4 text-sm rounded-lg",
  md: "h-11 px-5 text-base rounded-xl tap-target min-h-[44px]",
  lg: "h-12 px-6 text-lg rounded-xl tap-target min-h-[44px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
