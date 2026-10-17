export const TZ = "America/Sao_Paulo";

const hmFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long" });

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatHM(value: string | Date): string {
  return hmFormatter.format(toDate(value));
}

export function dayKey(value: string | Date): string {
  return dayKeyFormatter.format(toDate(value));
}

export function weekdayName(value: string | Date): string {
  const name = weekdayFormatter.format(toDate(value));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function isWithin(now: Date, startsAt: string | Date, endsAt: string | Date): boolean {
  const t = now.getTime();
  return t >= toDate(startsAt).getTime() && t < toDate(endsAt).getTime();
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "agora";
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin} min`;
  const totalHours = Math.floor(totalMin / 60);
  if (totalHours < 48) {
    const min = totalMin % 60;
    return min === 0 ? `${totalHours} h` : `${totalHours} h ${String(min).padStart(2, "0")} min`;
  }
  return `${Math.floor(totalHours / 24)} dias`;
}
