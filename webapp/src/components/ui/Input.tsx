import { InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full border border-border-input rounded-lg px-3 py-2 text-sm text-fg-1 bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT transition-shadow";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-fg-4">{label}</label>
      )}
      <input ref={ref} className={cn(inputBase, className)} {...props} />
      {hint && <p className="text-xs text-fg-6">{hint}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-fg-4">{label}</label>
      )}
      <select ref={ref} className={cn(inputBase, className)} {...props}>
        {children}
      </select>
    </div>
  )
);
Select.displayName = "Select";
