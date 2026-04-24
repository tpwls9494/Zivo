interface LogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function ZivoLogo({ size = 32, color = "#2563EB", className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      className={className}
      aria-label="Zivo"
    >
      <line x1="10" y1="11" x2="46" y2="11" stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      <line x1="46" y1="11" x2="10" y2="45" stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      <line x1="10" y1="45" x2="46" y2="45" stroke={color} strokeWidth="6.5" strokeLinecap="round" />
    </svg>
  );
}

export function ZivoWordmark({ height = 28, color = "#111827", className }: { height?: number; color?: string; className?: string }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-geist-sans), Arial, sans-serif",
        fontSize: height,
        fontWeight: 700,
        color,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      Zivo
    </span>
  );
}
