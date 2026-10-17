-- G'26 Voluntários — M4: elogios anônimos, janelas e pins (seções 6 e 8)

create table if not exists praise_windows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_open boolean not null default false,
  opened_at timestamptz,
  closed_at timestamptz,
  opened_by uuid references volunteers(id) on delete set null,
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No máximo uma janela aberta por vez.
create unique index if not exists praise_windows_single_open on praise_windows ((true)) where is_open;

create table if not exists praises (
  id uuid primary key default gen_random_uuid(),
  window_id uuid not null references praise_windows(id) on delete cascade,
  -- O remetente existe SÓ para aplicar a unicidade. Nenhuma rota, visão ou tela o expõe.
  sender_id uuid not null references volunteers(id) on delete cascade,
  receiver_id uuid not null references volunteers(id) on delete cascade,
  trait text not null check (trait in ('feliz', 'facilitador', 'por_inteiro')),
  is_mock boolean not null default false,
  created_at timestamptz not null default now(),
  constraint praises_one_per_trait_per_window unique (window_id, sender_id, receiver_id, trait),
  constraint praises_no_self check (sender_id <> receiver_id)
);

create index if not exists idx_praises_window_receiver on praises (window_id, receiver_id);

-- Elogio só entra (ou sai) com a janela aberta, mesmo chamando o banco direto (critério 6).
create or replace function praises_require_open_window() returns trigger
language plpgsql as $$
declare
  win uuid := coalesce(new.window_id, old.window_id);
begin
  if not exists (select 1 from praise_windows w where w.id = win and w.is_open) then
    raise exception 'janela de elogios fechada' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_praises_open_window on praises;
create trigger trg_praises_open_window
  before insert or update or delete on praises
  for each row execute function praises_require_open_window();

-- Leitura agregada: só totais por pessoa, característica e janela. Sem remetente.
create or replace view praise_totals_by_window as
  select window_id, receiver_id, trait, count(*)::int as total
  from praises
  group by window_id, receiver_id, trait;

-- Alerta informativo de reciprocidade: devolve só um número, nunca quem.
create or replace function praise_reciprocal_pairs(p_window uuid) returns integer
language sql stable as $$
  select count(*)::int from (
    select distinct least(a.sender_id, a.receiver_id), greatest(a.sender_id, a.receiver_id)
    from praises a
    join praises b on b.window_id = a.window_id and b.sender_id = a.receiver_id and b.receiver_id = a.sender_id
    where a.window_id = p_window
  ) pairs;
$$;

create table if not exists pin_awards (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  trait text not null check (trait in ('feliz', 'facilitador', 'por_inteiro')),
  awarded_by uuid references volunteers(id) on delete set null,
  awarded_at timestamptz not null default now(),
  delivered_at timestamptz,
  is_mock boolean not null default false,
  -- Um mesmo pin não é concedido duas vezes à mesma pessoa.
  constraint pin_awards_once unique (volunteer_id, trait)
);

alter table volunteers add column if not exists privacy_accepted_at timestamptz;

insert into app_settings (key, value) values ('explainer_video_url', 'null'::jsonb) on conflict (key) do nothing;

alter table praise_windows enable row level security;
alter table praises enable row level security;
alter table pin_awards enable row level security;
-- A visão herda a proteção: sem política para anon/authenticated, nada é lido de fora do servidor.
revoke all on praise_totals_by_window from anon, authenticated;
revoke all on function praise_reciprocal_pairs(uuid) from anon, authenticated, public;
