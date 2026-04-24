import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "success" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

function buttonVariants({ variant, size }: Pick<ButtonProps, "variant" | "size">) {
  const base =
    "inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT focus:ring-offset-2";

  const variants = {
    primary: "bg-primary-DEFAULT text-white hover:bg-primary-hover rounded-xl",
    success: "bg-success-DEFAULT text-white hover:bg-success-hover rounded-xl",
    ghost:   "border border-border-input text-fg-4 hover:bg-gray-50 rounded-md",
    link:    "text-primary-DEFAULT underline underline-offset-2 hover:text-primary-hover",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-4 py-3 text-sm w-full",
    lg: "px-6 py-3.5 text-base w-full",
  };

  return [base, variants[variant!], sizes[size!]].join(" ");
}
