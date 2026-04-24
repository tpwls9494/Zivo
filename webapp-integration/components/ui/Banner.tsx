import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BannerVariant = "info" | "success" | "warning" | "danger";

interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BannerVariant;
}

const bannerStyles: Record<BannerVariant, string> = {
  info:    "bg-primary-light text-primary-text",
  success: "bg-success-light text-success-text",
  warning: "bg-warning-light text-warning-text border border-warning-mid",
  danger:  "bg-danger-light text-danger-DEFAULT border border-danger-mid",
};

export function Banner({ variant = "info", className, children, ...props }: BannerProps) {
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-sm leading-relaxed",
        bannerStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
