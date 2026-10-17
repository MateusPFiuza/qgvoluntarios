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
  const hues = ["#E8B85A", "#E5672F", "#C8232C", "#8A7245", "#B89A63"];
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded font-mono font-bold text-nave-bg"
      style={{ width: size, height: size, background: hues[hash % hues.length], fontSize: size * 0.38, imageRendering: "pixelated" }}
    >
      {initials}
    </span>
  );
}
