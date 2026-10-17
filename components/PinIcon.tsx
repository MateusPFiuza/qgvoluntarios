import type { Trait } from "@/lib/rules/praise";

/** Desenho provisório dos 3 pins do kit (imagens oficiais pendentes). */
export function PinIcon({ trait, size = 40 }: { trait: Trait; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 40 40", "aria-hidden": true as const };
  if (trait === "feliz")
    return (
      <svg {...common}>
        <circle cx="20" cy="20" r="19" fill="#15100B" stroke="#E8B85A" />
        <path d="M6 30 A14 6 0 0 1 34 30" fill="#8A7245" />
        <circle cx="20" cy="17" r="6" fill="#F3E6CC" />
        <rect x="16" y="22" width="8" height="7" rx="2" fill="#F3E6CC" />
      </svg>
    );
  if (trait === "facilitador")
    return (
      <svg {...common}>
        <circle cx="20" cy="20" r="19" fill="#15100B" stroke="#E8B85A" />
        <path d="M20 6 C26 12 26 22 23 28 H17 C14 22 14 12 20 6Z" fill="#F3E6CC" />
        <path d="M17 28 L14 33 M23 28 L26 33" stroke="#E5672F" strokeWidth="2" />
        <circle cx="20" cy="16" r="2.5" fill="#C8232C" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="20" cy="20" r="19" fill="#15100B" stroke="#E8B85A" />
      <circle cx="20" cy="19" r="11" fill="#F3E6CC" />
      <rect x="13" y="14" width="14" height="9" rx="4" fill="#3b2a6b" />
      <circle cx="17" cy="17" r="0.8" fill="#fff" />
      <circle cx="23" cy="19" r="0.6" fill="#fff" />
    </svg>
  );
}
