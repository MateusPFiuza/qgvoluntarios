# G'26 Voluntários

Plataforma web de gestão dos voluntários do Geração Atômika 2026
(Comunidade Católica Colo de Deus, Aparecida do Norte, 11–13/12/2026).

Este repositório contém o **M0**: repositório Next.js configurado,
design system de "tela de nave" com Modo Simples, login do voluntário e
do ADM, e modo demonstração com semente completa de dados fictícios. Ver
a especificação completa e `docs/DECISOES.md` para decisões registradas.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres) como banco — acesso só pelo servidor, RLS ativado
  sem políticas para `anon`/`authenticated`
- Sessão própria por cookie assinado (JWT via `jose`), nunca Supabase Auth
- Hash de credenciais/senhas com argon2id (`hash-wasm`, sem dependência
  nativa — funciona em qualquer ambiente sem toolchain de compilação)
- Validação com `zod`
- Testes de regras de negócio com Vitest

## Sobre o Supabase neste ambiente

**Não há um projeto Supabase real conectado neste ambiente de
desenvolvimento.** O código foi estruturado para funcionar com um
Supabase real sem nenhuma mudança além de variáveis de ambiente:

- `lib/server/repo.ts` é o único ponto de acesso a dados do app. Ele usa
  o Supabase real (`lib/server/supabase.ts`, com a service role) quando
  `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão definidos.
- Quando essas variáveis **não** estão definidas (como neste ambiente),
  `lib/server/repo.ts` usa uma semente de demonstração em memória
  (`lib/server/demo-store.ts`), carregada de `supabase/seed/demo/*.json`.
  Isso permite rodar o app de ponta a ponta (login de voluntário, login
  de ADM, bloqueio por tentativas) sem nenhuma conexão de rede.
- As migrações SQL em `supabase/migrations/` são a fonte de verdade do
  esquema e devem ser aplicadas em qualquer projeto Supabase real (via
  `supabase db push`, pelo editor SQL, ou CI).
- `supabase/seed/demo/seed.sql` (gerado por
  `npm run seed:demo:sql`) carrega a mesma semente de demonstração num
  projeto Supabase real **separado** do de produção, como pede a seção 11
  da especificação.

## Como rodar

```bash
npm install
cp .env.example .env.local   # já vem preenchido com valores de dev/demo
npm run seed:demo            # (re)gera supabase/seed/demo/*.json
npm run dev
```

Acesse `http://localhost:3000/entrar`. A tela de entrada em modo
demonstração mostra logins de teste (também em
`supabase/seed/demo/LOGINS_DE_TESTE.md`).

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm test` — roda os testes Vitest de `lib/rules/*`
- `npm run seed:demo` — regera a semente de demonstração (JSON)
- `npm run seed:demo:sql` — exporta a semente para `supabase/seed/demo/seed.sql`

## Fontes (Sansgeo / Andale Mono)

Os arquivos reais das fontes da identidade visual não estão disponíveis
neste ambiente. `app/fonts.ts` documenta o placeholder (fallback
monoespaçado do sistema) e o ponto único onde registrar as fontes reais
quando chegarem.

## Estrutura relevante

```
app/
  entrar/            tela de login do voluntário
  qg/entrar/          segunda barreira (senha individual de ADM)
  qg/                 Área do QG (placeholder M0)
  api/auth/           rotas de login/logout (voluntário e ADM)
  api/volunteers/     busca de nomes (3+ letras)
components/
  ship-fx/            efeitos de "tela de nave" + Modo Simples
lib/
  rules/              regras de negócio puras, testadas (Vitest)
  server/             sessão, criptografia, acesso a dados, rate limit
supabase/
  migrations/         esquema SQL versionado
  seed/demo/          semente de demonstração (dados 100% fictícios)
docs/
  DECISOES.md         decisões para PENDENTE/SUPOSIÇÃO e ambiguidades
```

## O que NÃO está neste M0

Check-in de refeições, gestão de rádios, janelas de elogios e os painéis
de mapa/cronograma ficam para M1+, conforme a ordem de entrega da seção
13 da especificação.

## Módulos (M1 a M4)

| Marco | Telas | Onde |
|---|---|---|
| M1 Refeições | QR pessoal (`/minha-identificacao`), check-in do QG (`/qg/refeicoes`), painel (`/qg/refeicoes/painel`) | `lib/rules/meals.ts`, `lib/rules/qr-token.ts` |
| M2 Rádios | Retirada com assinatura, devolução, painel e histórico (`/qg/radios`) | `lib/rules/radios.ts` |
| M3 Início | Painel de missão (`/`), cronograma, refeições, mapa, busca, abas | `lib/rules/mission.ts` |
| M4 Elogios | Elogios com vídeo (`/elogios`), janelas, ranking e pins (`/qg/elogios`) | `lib/rules/praise.ts` |

Logins de teste: `supabase/seed/demo/LOGINS_DE_TESTE.md`. Na demonstração o
relógio começa no sábado às 12h40; troque pelo painel "Relógio" na tela
inicial para percorrer o evento.

Semente dos módulos: `npm run seed:demo:event` e depois `npm run seed:demo:sql`.
Migrações: aplicar `supabase/migrations/0001` a `0005` em ordem.
Configurações dos módulos: `lib/config.ts` e `.env.example`.
