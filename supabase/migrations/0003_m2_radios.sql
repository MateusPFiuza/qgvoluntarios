-- G'26 Voluntários — M2: rádios (seção 9)

create table if not exists radios (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique check (number > 0),
  status text not null default 'ok' check (status in ('ok', 'defeito', 'perdido')),
  notes text,
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists radio_checkouts (
  id uuid primary key default gen_random_uuid(),
  radio_id uuid not null references radios(id) on delete cascade,
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  checked_out_at timestamptz not null default now(),
  checked_out_by uuid references volunteers(id) on delete set null,
  signature_path text, -- caminho no bucket privado "signatures"
  returned_at timestamptz,
  returned_by uuid references volunteers(id) on delete set null, -- operador que registrou
  returned_by_volunteer_id uuid references volunteers(id) on delete set null, -- quem entregou o rádio
  battery_state text check (battery_state in ('carregado', 'parcial', 'descarregado')),
  condition text check (condition in ('ok', 'defeito')),
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  check ((returned_at is null) = (battery_state is null and condition is null))
);

-- Um rádio não pode ter duas retiradas abertas ao mesmo tempo (critério 10).
create unique index if not exists radio_checkouts_one_open_per_radio
  on radio_checkouts (radio_id) where returned_at is null;

create index if not exists idx_radio_checkouts_volunteer on radio_checkouts (volunteer_id);

alter table radios enable row level security;
alter table radio_checkouts enable row level security;

-- Bucket privado para as assinaturas (acesso só por URL assinada de curta duração).
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;
