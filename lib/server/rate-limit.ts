/**
 * Limite de taxa simples em memória para as rotas de login e busca
 * (seção 12). SUPOSIÇÃO: um limitador em memória por processo é
 * suficiente para o volume do evento (~350 voluntários); se a hospedagem
 * usar múltiplas instâncias, trocar por um limitador compartilhado (ex.:
 * Upstash/Redis) — ponto único de configuração aqui. Ver docs/DECISOES.md.
 */

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > maxRequests;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
