-- G'26 Voluntários — M0
-- Subconjunto do modelo de dados (seção 6) necessário para login de
-- voluntário/ADM e para o modo demonstração.
--
-- Convenções: chaves uuid, created_at/updated_at em timestamptz,
-- exclusão lógica via coluna "active" quando fizer sentido.
--
-- Segurança (seção 2 e 12): RLS habilitado em TODAS as tabelas, SEM
-- políticas para os papéis anon/authenticated. O acesso só acontece pelo
-- servidor, usando a service role (que ignora RLS por padrão no
-- Supabase). Isso garante que nada vaza mesmo se uma chave pública for
-- exposta por engano.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_name text,
  sort integer not null default 0,
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table teams is 'Equipes de voluntários (ex.: Acolhida, Check In, Chapelaria).';
comment on column teams.is_mock is 'Marca dados de semente do modo demonstração (seção 11).';

-- ---------------------------------------------------------------------
-- volunteers
-- ---------------------------------------------------------------------
create table if not exists volunteers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  search_name text not null, -- nome normalizado (sem acento, minúsculo) para busca
  team_id uuid references teams(id) on delete set null,
  is_leader boolean not null default false,
  photo_path text,
  pin_hash text, -- hash argon2id da credencial (4 últimos dígitos do CPF + DDMM)
  birth_dm text, -- DDMM, apenas para exibição/depuração administrativa; nunca é a credencial em si
  diet_notes text,
  login_locked_until timestamptz,
  active boolean not null default true,
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table volunteers is 'Voluntários cadastrados a partir da ficha de inscrição (seção 5.1). Nunca armazena CPF/RG em texto.';
comment on column volunteers.pin_hash is 'Hash argon2id da credencial; a credencial em texto nunca é armazenada.';

create index if not exists idx_volunteers_search_name on volunteers (search_name);
create index if not exists idx_volunteers_team_id on volunteers (team_id);

-- ---------------------------------------------------------------------
-- volunteers_private — CPF/RG criptografados, tabela separada (seção 12)
-- ---------------------------------------------------------------------
create table if not exists volunteers_private (
  volunteer_id uuid primary key references volunteers(id) on delete cascade,
  cpf_enc text not null, -- criptografado na aplicação (AES-GCM), nunca em texto puro
  rg_enc text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table volunteers_private is 'CPF e RG, sempre criptografados pela aplicação antes de gravar. Lida só em rotas de servidor dedicadas.';

-- ---------------------------------------------------------------------
-- admin_accounts
-- ---------------------------------------------------------------------
create table if not exists admin_accounts (
  volunteer_id uuid primary key references volunteers(id) on delete cascade,
  password_hash text not null,
  can_manage_radios boolean not null default false,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table admin_accounts is 'Credencial individual de ADM (segunda barreira da Área do QG, seção 5.3).';

-- ---------------------------------------------------------------------
-- login_attempts
-- ---------------------------------------------------------------------
create table if not exists login_attempts (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid references volunteers(id) on delete cascade,
  kind text not null default 'volunteer' check (kind in ('volunteer', 'admin')),
  ip_hash text, -- hash do IP, nunca o IP em texto
  ok boolean not null,
  created_at timestamptz not null default now()
);

comment on table login_attempts is 'Registro de tentativas de login, sem gravar o que foi digitado (seção 5.2).';

create index if not exists idx_login_attempts_volunteer_created on login_attempts (volunteer_id, created_at desc);
create index if not exists idx_login_attempts_ip_created on login_attempts (ip_hash, created_at desc);

-- ---------------------------------------------------------------------
-- app_settings
-- ---------------------------------------------------------------------
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table app_settings is 'Configurações globais: demo_mode, simulated_now (demonstração/ADM).';

insert into app_settings (key, value)
values
  ('demo_mode', 'true'::jsonb),
  ('simulated_now', 'null'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references volunteers(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb, -- NUNCA colocar dados pessoais aqui
  created_at timestamptz not null default now()
);

comment on table audit_log is 'Trilha de auditoria das ações de ADM. "details" nunca deve conter dados pessoais.';

-- ---------------------------------------------------------------------
-- RLS: habilitado em tudo, sem políticas para anon/authenticated.
-- Apenas a service role (usada só no servidor) tem acesso.
-- ---------------------------------------------------------------------
alter table teams enable row level security;
alter table volunteers enable row level security;
alter table volunteers_private enable row level security;
alter table admin_accounts enable row level security;
alter table login_attempts enable row level security;
alter table app_settings enable row level security;
alter table audit_log enable row level security;

-- Nenhuma política é criada de propósito: sem policy, anon/authenticated
-- não leem nem escrevem nada. A service role ignora RLS por padrão.
