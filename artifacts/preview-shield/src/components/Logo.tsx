import { useId } from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className = "" }: LogoProps) {
  const id = useId().replace(/:/g, "");
  const gradId = `ps-g-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PreviewShield logo"
    >
      <defs>
        <linearGradient id={gradId} x1="10" y1="4" x2="54" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path
        d="M32 7 L10 16 L10 31 C10 44.5 19.5 55.5 32 59 C44.5 55.5 54 44.5 54 31 L54 16 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M22 32 L28.5 38.5 L42 25"
        stroke="white"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LogoFullProps {
  dark?: boolean;
  className?: string;
}

export function LogoFull({ dark = false, className = "" }: LogoFullProps) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={28} />
      <span
        className="font-bold text-xl tracking-tight"
        style={dark ? { color: "#ffffff" } : undefined}
      >
        PreviewShield
      </span>
    </span>
  );
}
