import teamsSeed from "@/supabase/seed/demo/teams.json";
import volunteersSeed from "@/supabase/seed/demo/volunteers.json";
import adminAccountsSeed from "@/supabase/seed/demo/admin_accounts.json";

/**
 * Armazenamento em memória usado quando o Supabase real não está
 * configurado (por exemplo, neste ambiente de desenvolvimento, sem
 * acesso de rede a um projeto Supabase). Carrega a semente de
 * demonstração (seção 11) uma única vez por processo do servidor.
 *
 * Isto NÃO substitui o Postgres/Supabase em produção — é só o que
 * permite o M0 funcionar de ponta a ponta sem um projeto real conectado.
 * Quando SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estiverem definidos,
 * lib/server/repo.ts usa o Supabase de verdade em vez deste módulo.
 */

export type Team = {
  id: string;
  name: string;
  group_name: string | null;
  sort: number;
  is_mock: boolean;
};

export type Volunteer = {
  id: string;
  full_name: string;
  search_name: string;
  team_id: string | null;
  is_leader: boolean;
  photo_path: string | null;
  pin_hash: string | null;
  birth_dm: string | null;
  diet_notes: string | null;
  login_locked_until: string | null;
  active: boolean;
  is_mock: boolean;
};

export type AdminAccount = {
  volunteer_id: string;
  password_hash: string;
  can_manage_radios: boolean;
  locked_until: string | null;
};

export type LoginAttemptRow = {
  id: string;
  volunteer_id: string | null;
  kind: "volunteer" | "admin";
  ip_hash: string | null;
  ok: boolean;
  created_at: string;
};

type StoreShape = {
  teams: Team[];
  volunteers: Volunteer[];
  adminAccounts: AdminAccount[];
  loginAttempts: LoginAttemptRow[];
};

const globalForDemoStore = globalThis as unknown as { __qg26DemoStore?: StoreShape };

function initStore(): StoreShape {
  return {
    teams: structuredClone(teamsSeed) as Team[],
    volunteers: structuredClone(volunteersSeed) as Volunteer[],
    adminAccounts: structuredClone(adminAccountsSeed) as AdminAccount[],
    loginAttempts: [],
  };
}

export function getDemoStore(): StoreShape {
  if (!globalForDemoStore.__qg26DemoStore) {
    globalForDemoStore.__qg26DemoStore = initStore();
  }
  return globalForDemoStore.__qg26DemoStore;
}
