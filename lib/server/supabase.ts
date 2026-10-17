import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

let cachedClient: SupabaseClient | null = null;

/**
 * Cliente Supabase usando a service role, só para uso no servidor.
 * Retorna null quando as env vars não estão configuradas — nesse caso o
 * repositório (lib/server/repo.ts) usa a semente de demonstração em
 * memória, sem tentar nenhuma conexão de rede.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (!cachedClient) {
    cachedClient = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}
