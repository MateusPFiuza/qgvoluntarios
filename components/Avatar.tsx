/** Avatar gerado com iniciais (nunca foto real na demonstração). */
export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  // Fundo e cor do texto escolhidos para contraste de pelo menos 4,5:1.
  const palettes = [
    { bg: "#E8B85A", fg: "#0B0806" },
    { bg: "#E5672F", fg: "#0B0806" },
    { bg: "#C8232C", fg: "#FFF7E8" },
    { bg: "#B89A63", fg: "#0B0806" },
  ];
  const { bg, fg } = palettes[hash % palettes.length];
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded font-mono font-bold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38, imageRendering: "pixelated" }}
    >
      {initials}
    </span>
  );
}
