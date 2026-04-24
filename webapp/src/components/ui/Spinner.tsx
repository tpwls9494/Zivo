import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-4",
  lg: "w-12 h-12 border-4",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "rounded-full border-primary border-t-transparent animate-spin",
        sizes[size],
        className
      )}
      role="status"
      aria-label="로딩 중"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="md" />
    </div>
  );
}
