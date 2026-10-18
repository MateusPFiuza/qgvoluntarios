import type { Trait } from "@/lib/rules/praise";

export function TraitIcon({ trait, size = 28 }: { trait: Trait; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (trait === "feliz")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14.5c1 1.5 2.4 2.2 4 2.2s3-.7 4-2.2" />
        <path d="M9 9.5h.01M15 9.5h.01" strokeWidth="2.6" />
      </svg>
    );
  if (trait === "facilitador")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="3" y="7" width="16" height="10" rx="2" />
      <path d="M21 10.5v3" />
      <rect x="5.5" y="9.5" width="11" height="5" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
