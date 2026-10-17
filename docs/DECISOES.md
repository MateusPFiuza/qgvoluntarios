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

## 11. Relógio simulado por cookie (M1, seção 11)

O "agora" do app vem de `lib/server/clock.ts`. Na demonstração, o padrão é
sábado 12h40 (`config.demoDefaultNow` em `lib/config.ts`) para as telas
terem movimento, e qualquer pessoa pode trocar. Em produção o cookie de
relógio simulado só é aceito com sessão de ADM ativa e afeta só a tela
desse ADM, nunca a dos voluntários. Mais seguro do que um valor global em
`app_settings`, que mudaria a tela de todo mundo.

O QR pessoal sempre usa o relógio real, senão a validação falharia.

## 12. Módulo de refeições desligável (PENDENTE de aprovação, seção 10)

`FEATURE_MEALS=false` esconde o check-in e o painel e faz as rotas
responderem 404. Ponto único: `lib/config.ts`.

## 13. Corrida no check-in

A restrição `unique (volunteer_id, meal_id)` em `meal_checkins` decide.
No modo em memória, a verificação e a inserção acontecem sem `await` entre
elas, o que é atômico dentro do processo. O segundo ADM recebe "JÁ
CONSUMIU" (ou "JÁ REGISTRADO AGORA" quando perdeu a corrida na inserção).

## 14. Proteção contra CSRF nas rotas de API

`lib/server/guard.ts`: toda rota que altera dados exige corpo JSON e,
quando há cabeçalho `Origin`, que seja do mesmo host. Somado ao cookie
`sameSite=lax`, um formulário de outro site não consegue disparar ações.

## 15. Sessão de ADM renovada a cada uso

Cada chamada de API do QG reemite o cookie de 30 min, cumprindo "30
minutos sem uso". Visitar páginas sem chamar API não renova (limitação do
Next.js: componentes de servidor não podem gravar cookie).

## 16. Gestor de rádios como perfil da Área do QG (SUPOSIÇÃO, seção 4)

`admin_accounts.role` é `adm` ou `radios`. O gestor de rádios passa pela
mesma segunda barreira de senha (ele vê CPF/RG mascarados e assinaturas),
mas só enxerga o módulo de rádios. ADMs também operam rádios.

## 17. Rádios: conferência sem digitar CPF/RG (SUPOSIÇÃO, seção 9)

A retirada mostra CPF e RG mascarados para o voluntário conferir. Se a
organização exigir digitação, `RADIO_REQUIRE_TYPED_DOCS=true` passa a
pedir os 4 últimos dígitos do CPF, conferidos no servidor. Ponto único:
`lib/config.ts`. CPF/RG só são lidos em `getMaskedDocuments`
(`lib/server/repo-radios.ts`), que já devolve tudo mascarado.

## 18. Rádio "não devolvido"

Retirada aberta de um dia anterior, ou do mesmo dia depois das 23h
(`END_OF_DAY_HM` em `lib/rules/radios.ts`).

## 19. Assinatura obrigatória e atômica

Sem a assinatura gravada no bucket privado `signatures`, a retirada é
desfeita e a tela mostra erro (princípio 6). Na demonstração sem Supabase,
a assinatura fica em memória. As retiradas da semente não têm assinatura
(marcadas como exemplo).

## 20. "Quem devolveu"

`returned_by` é o operador que registrou; `returned_by_volunteer_id` é a
pessoa que entregou o rádio (padrão: quem retirou). Liberar rádio com
defeito ou marcar como perdido é só para ADM.

## 21. Gestor de rádios de exemplo

Na semente, Diego Lima (equipe Space) é gestor de rádios, senha
`radios2026`. A conta é criada por `scripts/seed-demo-event.ts`.

## 22. Cronograma de exemplo (PENDENTE: planilha não disponível)

A planilha `CRONOGRAMA_GERAÇÃO_2026_v1.xlsx` não está neste ambiente. A
semente traz um cronograma de exemplo (marcado `is_mock` e com selo
"cronograma de exemplo"), coerente com os intervalos conhecidos (sábado
12h05–14h, 16h10–16h40, 18h40–19h30; domingo 12h05–13h35). Para trocar,
importar a aba `CRONOGRAMA` em `schedule_items` (ignorando `Página6` e
`LISTA CONVIDADOS`) e apagar as linhas `is_mock`. Encerramento do evento:
domingo 16h (`config.eventEnd`).

## 23. Escala e local provável

A escala por equipe (`team_schedule`) tem `is_break` para intervalos. A
busca mostra só o local previsto, com o aviso "local previsto pela escala,
pode ter mudado", e nunca telefone ou dados pessoais. Alimentação e QG
ficam no posto durante os intervalos.

## 24. Mapa ilustrativo

Desenho esquemático em SVG com pontos clicáveis (botões de 48 px,
posicionados em % via `locations.map_x/map_y`). Zoom por botões e pela
pinça nativa do navegador. Quando a imagem oficial chegar, basta trocar o
desenho em `components/MapView.tsx` e as coordenadas na tabela.

## 25. Registros "do futuro" com relógio simulado

Nas telas do voluntário, check-ins com horário depois do "agora" simulado
não contam, para a demonstração ficar coerente ao voltar no tempo.

## 26. Anonimato dos elogios garantido em camadas (seção 8, critério 4)

- `lib/server/repo-praise.ts` nunca devolve `sender_id`: só totais
  (`praise_totals_by_window`) ou "o que eu mesmo enviei".
- A rota `/api/praise` responde só `{ ok, on }`.
- O alerta de reciprocidade é um número (`praise_reciprocal_pairs`), sem
  identificar ninguém.
- Visão e função têm `revoke` para `anon`/`authenticated`.

## 27. Janela aberta exigida também no banco (critério 6)

Gatilho `trg_praises_open_window` rejeita inserir, alterar ou apagar
elogio com a janela fechada. Só uma janela aberta por vez (índice único
parcial); abrir uma nova fecha a anterior. O `seed.sql` suspende o gatilho
apenas para carregar os elogios de exemplo da janela já fechada.

## 28. Repetir um elogio é idempotente

Acender de novo o mesmo ícone não cria segundo registro (unicidade
`window_id, sender_id, receiver_id, trait`). Desligar apaga o próprio
elogio enquanto a janela está aberta (SUPOSIÇÃO da seção 8).

## 29. Vídeo explicativo (PENDENTE)

`explainer_video_url` em `app_settings` (ou `EXPLAINER_VIDEO_URL` sem
Supabase). Sem URL, toca uma animação de 20 s marcada "vídeo de exemplo".
O botão "Entendi" libera no fim do vídeo, ou 15 s depois de abrir se o
vídeo não carregar.

## 30. Pins (PENDENTE: correspondência e estoque)

Correspondência provisória: Feliz = astronauta na lua, Facilitador =
foguete, Por inteiro = capacete com galáxia (`TRAIT_INFO` em
`lib/rules/praise.ts`), com selo "sujeita a confirmação". Desenhos
provisórios em `components/PinIcon.tsx`. Estoque por pin:
`PIN_STOCK_PER_TRAIT` (padrão 30). Um mesmo pin não é concedido duas vezes
à mesma pessoa.

## 31. Aviso de privacidade na primeira entrada (PENDENTE: texto)

`volunteers.privacy_accepted_at`. Enquanto não aceitar, a tela inicial
mostra o aviso. Texto provisório marcado como exemplo em
`app/privacidade/page.tsx`. Na demonstração sem Supabase, o aceite fica em
memória.
