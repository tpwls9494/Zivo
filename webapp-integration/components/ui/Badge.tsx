import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "blue" | "green" | "gray" | "amber" | "indigo" | "purple";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, string> = {
  blue:   "bg-primary-mid text-primary-text",
  green:  "bg-success-mid text-success-text",
  gray:   "bg-border text-fg-5",
  amber:  "bg-warning-mid text-warning-text",
  indigo: "bg-indigo-100 text-indigo-700",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({ variant = "gray", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        badgeStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
