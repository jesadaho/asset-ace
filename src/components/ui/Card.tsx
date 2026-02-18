import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outline" | "light";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border overflow-hidden",
          variant === "default" &&
            "border-[#0F172A]/10 bg-[#0F172A] text-white",
          variant === "elevated" &&
            "border-[#0F172A]/10 bg-[#0F172A] text-white shadow-lg shadow-[#0F172A]/20",
          variant === "outline" &&
            "border-white/10 bg-[#1E293B] text-white",
          variant === "light" &&
            "border-[#0F172A]/10 bg-white text-[#0F172A] shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-4 pt-4 pb-2", className)}
    {...props}
  />
));

CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-tight", className)}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-4 pb-4", className)} {...props} />
));

CardContent.displayName = "CardContent";
