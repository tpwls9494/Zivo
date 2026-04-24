import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-border shadow-sm p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardForm({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
