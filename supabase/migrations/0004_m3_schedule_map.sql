-- G'26 Voluntários — M3: cronograma, locais do mapa e escala por equipe (seções 6 e 7)

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null check (kind in ('refeitorio', 'banheiro', 'enfermaria', 'qg', 'palco', 'acolhida', 'loja', 'kids', 'portao', 'servico', 'oracao')),
  description text,
  map_x numeric(5,2) not null check (map_x between 0 and 100), -- posição em % da largura do mapa
  map_y numeric(5,2) not null check (map_y between 0 and 100), -- posição em % da altura do mapa
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists schedule_items (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references event_days(id) on delete cascade,
  session_label text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  title text not null,
  performer text,
  kind text not null check (kind in ('portoes', 'worship', 'pregacao', 'short', 'pitch', 'prayer', 'intervalo', 'missa', 'comunicacao', 'outro')),
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_schedule_items_starts on schedule_items (starts_at);

create table if not exists team_schedule (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  day_id uuid not null references event_days(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  location_id uuid references locations(id) on delete set null,
  activity text not null,
  is_break boolean not null default false, -- intervalo ou refeição
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_schedule_team_starts on team_schedule (team_id, starts_at);

alter table locations enable row level security;
alter table schedule_items enable row level security;
alter table team_schedule enable row level security;
