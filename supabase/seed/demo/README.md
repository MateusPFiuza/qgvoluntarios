# Semente de demonstração (seção 11)

Todos os arquivos desta pasta contêm **dados fictícios**, gerados por
`scripts/seed-demo.ts` (nunca editados manualmente, exceto `teams.json`
que define a lista de equipes).

- `teams.json` — 9 equipes (7 nomes reais da identidade do evento +
  "Alimentação" e "QG dos Voluntários", inventadas para completar o
  conjunto pedido na seção 11).
- `volunteers.json` — ~40 voluntários fictícios + 2 contas ADM de teste,
  todos com `is_mock: true`.
- `volunteers_private.json` — "CPF/RG criptografados" de exemplo
  (apenas uma string de demonstração, nunca o dado real).
- `admin_accounts.json` — hash das senhas de ADM de teste.
- `LOGINS_DE_TESTE.md` — tabela com os logins de teste para exercitar o
  app em modo demonstração (gerado junto com os voluntários).

## Como repovoar

```
npm run seed:demo
```

Isso recalcula os hashes (argon2id) e regrava os 4 arquivos acima. Rodar
sempre que a lista de nomes fictícios ou de equipes mudar.

## Para carregar num Supabase real de demonstração

Use `supabase/seed/demo/seed.sql`, gerado a partir destes JSONs
(`npm run seed:demo:sql` — ver `scripts/export-seed-sql.ts`), ou carregue
os JSONs diretamente com a service role.

Nunca misture estes dados com os reais: o modo demonstração usa um
projeto Supabase **separado** (`DEMO_MODE=true` + env vars próprias),
conforme seção 11.
