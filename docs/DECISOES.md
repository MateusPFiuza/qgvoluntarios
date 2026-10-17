# Decisões de projeto — G'26 Voluntários

Registro das decisões tomadas para ambiguidades não resolvidas pela
especificação ou marcadas como PENDENTE/SUPOSIÇÃO, conforme pedido na
seção 16. Cada item aponta o ponto único de configuração para trocar a
decisão depois, sem espalhar a mudança pelo código.

## 1. Conexão real com o Supabase (PENDENTE neste ambiente)

Não há acesso de rede a um projeto Supabase real neste ambiente de
desenvolvimento. Decisão: estruturar todo o acesso a dados em
`lib/server/repo.ts`, que escolhe entre o Supabase real
(`lib/server/supabase.ts`) e uma semente de demonstração em memória
(`lib/server/demo-store.ts`) com base só na presença de
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.

**Ponto único de configuração:** `.env.local` (ou variáveis de ambiente
na Vercel). Nenhuma outra mudança de código é necessária para ligar a um
projeto Supabase real — basta aplicar as migrações de
`supabase/migrations/`, opcionalmente carregar `supabase/seed/demo/seed.sql`
num projeto de demonstração separado, e definir as env vars.

## 2. Formato da ficha de cadastro (PENDENTE)

O formato real da planilha/CSV de inscrição não foi fornecido. Decisão:
o script `scripts/import-volunteers.*` (a ser escrito no M1, quando os
dados reais existirem) deve aceitar CSV com cabeçalho e mapear por nome
de coluna, não por posição, para tolerar pequenas variações do arquivo
real. Não implementado neste M0 por não haver dados reais nem M1.

**Ponto único de configuração:** um mapa de nomes de coluna no topo do
script de importação, quando ele for escrito.

## 3. Fontes Sansgeo e Andale Mono (PENDENTE — arquivos não disponíveis)

Os arquivos reais das fontes da identidade visual não estão disponíveis
neste ambiente. Decisão: usar apenas o fallback monoespaçado do sistema,
documentado em `app/fonts.ts` e nas variáveis CSS `--font-display` /
`--font-mono` (`app/globals.css`).

**Ponto único de configuração:** `app/fonts.ts`. Quando os arquivos
reais (.otf/.woff2) chegarem, registrar com `next/font/local` nesse
arquivo — nenhuma outra mudança é necessária, pois todo o restante do
app já referencia as variáveis CSS.

## 4. Logos e cores exatas da identidade "ID | G'26" (PENDENTE)

Não há acesso aos arquivos reais de identidade visual. Decisão: usar os
tokens de cor sugeridos na própria especificação (seção 3) como ponto de
partida, e texto no lugar de logo.

**Ponto único de configuração:** `tailwind.config.ts` (bloco
`theme.extend.colors.nave`). Ajustar os valores hexadecimais quando os
arquivos finais de identidade visual estiverem disponíveis; nenhum outro
arquivo precisa mudar, pois tudo usa as classes `nave-*`.

## 5. Dados de demonstração (seção 11)

40+ voluntários fictícios e 9 equipes (7 nomes reais da identidade do
evento + 2 inventadas: "Alimentação" e "QG dos Voluntários", para
completar o intervalo de 8 a 10 pedido). Gerados por
`scripts/seed-demo.ts`, sempre com `is_mock: true`.

**Ponto único de configuração:** `scripts/seed-demo.ts` (listas de nomes
e quantidade) e `supabase/seed/demo/teams.json` (lista de equipes).
Rodar `npm run seed:demo` depois de qualquer mudança.

## 6. Limite de taxa (rate limiting) em memória (SUPOSIÇÃO)

A especificação pede limite de taxa nas rotas de login e busca (seção
12), mas não define a tecnologia. Decisão: implementar um limitador
simples em memória por processo (`lib/server/rate-limit.ts`), suficiente
para o volume esperado (~350 voluntários) numa única instância.

**Ponto único de configuração:** `lib/server/rate-limit.ts`. Se a
hospedagem rodar múltiplas instâncias simultâneas, trocar a
implementação interna por um serviço compartilhado (ex.: Upstash Redis)
sem mudar as chamadas nas rotas.

## 7. Renovação de sessão do voluntário (SUPOSIÇÃO)

A especificação pede sessão de 3 dias "com renovação". Decisão para o
M0: o cookie é emitido com validade fixa de 3 dias a cada login; a
renovação automática em uso contínuo (sliding session) fica para M1,
quando middleware de renovação puder ser adicionado sem risco a este
escopo.

**Ponto único de configuração:** `lib/server/session.ts`
(`VOLUNTEER_SESSION_DAYS` e `createVolunteerSession`).

## 8. Layout mobile "uma tela por vez" com abas (SUPOSIÇÃO, seção 3)

Não implementado ainda no M0 (não há telas operacionais suficientes para
justificar a barra de abas). A Home já está estruturada para receber os
links de Cronograma/Refeições/Mapa/Elogios como futuras abas/telas.

**Ponto único de configuração:** `app/page.tsx` (grade de atalhos) —
substituir por navegação em abas quando as telas de M2+ existirem.

## 9. Sons desligados por padrão (SUPOSIÇÃO, seção 3)

Nenhum som foi implementado neste M0 (não há interação operacional que
precise de som ainda). Quando implementado, deve nascer desligado por
padrão, com preferência salva no aparelho ao lado do Modo Simples.

**Ponto único de configuração:** ao implementar, adicionar ao
`SimpleModeProvider` (`components/ship-fx/`) para reaproveitar o mesmo
mecanismo de preferência por aparelho.

## 10. Chave de criptografia dos dados pessoais em desenvolvimento

`PERSONAL_DATA_ENCRYPTION_KEY` e `SESSION_SECRET` têm valores de
exemplo em `.env.local` para desenvolvimento local. Decisão: nunca usar
esses valores em produção; `lib/server/env.ts` cai para um valor
"inseguro" apenas como rede de segurança para não quebrar o build, mas
isso deve ser substituído antes de qualquer deploy real.

**Ponto único de configuração:** variáveis de ambiente na hospedagem
(Vercel) — nunca no repositório.
