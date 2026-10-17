-- G'26 Voluntários — M1: refeições e check-in (seções 6 e 10)

-- Perfil da conta da Área do QG: 'adm' (QG completo) ou 'radios' (gestor de rádios).
alter table admin_accounts
  add column if not exists role text not null default 'adm' check (role in ('adm', 'radios'));

create table if not exists event_days (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references event_days(id) on delete cascade,
  kind text not null check (kind in ('cafe', 'almoco', 'lanche', 'janta')),
  label text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  menu_text text,
  total_prepared integer not null default 0 check (total_prepared >= 0),
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day_id, kind)
);

create table if not exists team_meal_windows (
  team_id uuid not null references teams(id) on delete cascade,
  meal_id uuid not null references meals(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  is_mock boolean not null default false,
  primary key (team_id, meal_id)
);

create table if not exists meal_checkins (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  meal_id uuid not null references meals(id) on delete cascade,
  method text not null check (method in ('qr', 'search')),
  checked_by uuid references volunteers(id) on delete set null,
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  -- Uma refeição de cada tipo por voluntário: garantido no banco (princípio 5, critério 1).
  constraint meal_checkins_one_per_meal unique (volunteer_id, meal_id)
);

create index if not exists idx_meal_checkins_meal on meal_checkins (meal_id);

alter table event_days enable row level security;
alter table meals enable row level security;
alter table team_meal_windows enable row level security;
alter table meal_checkins enable row level security;
