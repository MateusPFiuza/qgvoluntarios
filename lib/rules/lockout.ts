/**
 * Regra de bloqueio de login (seção 5.2 / critério de aceite #1):
 * no máximo 5 tentativas erradas em 15 minutos, depois bloqueio temporário.
 *
 * Função pura, sem efeitos colaterais: recebe o histórico de tentativas e
 * devolve o estado de bloqueio. A gravação em `login_attempts` acontece na
 * camada de servidor.
 */

export const MAX_ATTEMPTS = 5;
export const WINDOW_MINUTES = 15;
export const LOCKOUT_MINUTES = 15;

export type AttemptRecord = {
  ok: boolean;
  createdAt: Date;
};

export type LockoutStatus =
  | { locked: false }
  | { locked: true; until: Date };

export function evaluateLockout(
  attempts: AttemptRecord[],
  now: Date = new Date(),
): LockoutStatus {
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60_000);

  const recentFailures = attempts
    .filter((a) => !a.ok && a.createdAt >= windowStart && a.createdAt <= now)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (recentFailures.length < MAX_ATTEMPTS) {
    return { locked: false };
  }

  // Bloqueia a partir da tentativa que atingiu o limite (a 5ª mais antiga
  // dentro da janela), por LOCKOUT_MINUTES.
  const triggering = recentFailures[MAX_ATTEMPTS - 1];
  const until = new Date(triggering.createdAt.getTime() + LOCKOUT_MINUTES * 60_000);

  if (until <= now) {
    return { locked: false };
  }

  return { locked: true, until };
}
