// Ponto único de leitura das variáveis de ambiente do servidor.
// Nunca importar este arquivo em código que roda no navegador.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function getSupabaseConfig() {
  // Em modo demonstração sem Supabase real configurado, retornamos null e
  // o restante do código usa o armazenamento de demonstração em memória/seed
  // (ver lib/server/demo-store.ts). Quando as env vars estiverem presentes,
  // o app passa a falar com o Supabase normalmente — nenhuma outra mudança
  // de código é necessária.
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

export function getSessionSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-insecure-session-secret-troque-em-produção";
}

export function getPersonalDataEncryptionKey(): string {
  return (
    process.env.PERSONAL_DATA_ENCRYPTION_KEY ??
    "dev-insecure-32-bytes-key-aaaaaa!!"
  );
}
