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

## 32. Visual mais limpo, sem faixa de demonstração e sem Modo simples (decisão do autor)

A pedido do autor do projeto, isto sobrepõe a seção 3 e a seção 11 da especificação:
- Removidos scanlines, vinheta e brilho de texto. Fica só um campo de estrelas muito discreto, desligado nas telas operacionais e com `prefers-reduced-motion`. A abertura dura 1,5 s.
- Removida a faixa fixa "DEMONSTRAÇÃO, dados fictícios". Os selos "EXEMPLO" continuam onde há conteúdo de exemplo.
- Removido o "Modo simples", porque na prática quase não mudava nada. `prefers-reduced-motion` continua desligando as animações.
- Texto corrido em fonte sans do sistema. A fonte mono fica só nos rótulos e horários.

## 33. Lista completa de voluntários nos campos de escolha (decisão do autor)

Fora do login, todo campo de escolher voluntário mostra a lista completa, filtrada enquanto a pessoa digita: busca, check-in por nome, rádios, elogios e pins. A lista vem de `/api/volunteers/directory`, que exige sessão e devolve só nome, equipe e líder. O login continua exigindo 3 letras (seção 5.2), porque ali ainda não há sessão. A equipe aparece em destaque em cada item, por causa dos homônimos.

## 34. Cronograma importado da planilha v1

`npm run import:cronograma` lê a aba CRONOGRAMA de `docs/fonte/CRONOGRAMA_GERAÇÃO_2026_v1.xlsx` (ignora Página6 e LISTA CONVIDADOS) e grava `supabase/seed/demo/schedule_items.json` com `is_mock = false`. Com `--sql arquivo.sql` gera também o upsert para o banco já no ar. Regras em `lib/rules/cronograma.ts`:
- O fim de cada item é o início do próximo; se a duração da linha terminar antes, vale a duração. Assim os itens nunca se sobrepõem. Exemplo: o intervalo de sábado tem 2h a partir de 12:05, mas o Relógio começa 13:55, então o item do cronograma vai até 13:55. A janela da refeição (almoço até 14:00) continua a de `meals`.
- Linha sem duração e sem item seguinte no dia (encerramentos) ganha 15 minutos.
- Sexta não tem sessões na planilha: rótulo "Programação". Intervalos usam o rótulo "Intervalo" e viram bloco próprio; quando começam junto com uma refeição, o título ganha o apelido, por exemplo "Intervalo (almoço)".
- Títulos e apresentadores ficam como estão na planilha, sem correção.
- A tela mostra "versão provisória v1" (`config.scheduleVersionLabel`) quando os itens não são de exemplo.
- Abertura do evento passou a 18:30 de sexta e o fim a 17:55 de domingo (`config.eventStart`/`eventEnd`).
- Ficaram de exemplo as refeições que não batem com a planilha: janta de sexta (17:00 a 19:00, antes do check-in) e lanche de domingo (15:30, durante a Santa Missa). Ajustar quando o cardápio real chegar.

## 35. Identidade visual de volta (logos, listras, Sansgeo, estrelas)

- Logos para fundo escuro em `public/brand/` (WebP, 800 px de largura): `geracao-atomika-26-escuro.webp` (Ativo 49) na tela de entrada e `g26-escuro.webp` (Ativo 56) no cabeçalho do início. Os PNG originais não vão para o repositório. Componentes em `components/brand/`; faixa de listras em `StripeDivider`.
- Sansgeo em `public/fonts/Sansgeo.otf`, registrada com `next/font/local` em `app/fonts.ts` (variável `--font-display`). PENDENTE: confirmar com o design da Colo de Deus que a licença permite uso na web; se não permitir, basta trocar o arquivo em `app/fonts.ts`.
- Andale Mono não é distribuída (licença da Microsoft). O texto técnico usa a mono do sistema (`--font-mono`).
- Campo de estrelas em pixels só no início e na entrada, 36 pontos a 10 quadros por segundo, parado com a aba oculta. Desliga com `prefers-reduced-motion` e com o Modo simples.
- Modo simples volta, discreto, no fim da tela Mais (sobrepõe a decisão 32). Fica salvo no aparelho (`localStorage`, chave `qg26:modo-simples`).
- Fundos de planetas não foram enviados; ficam de fora.

## 36. Início com foco na refeição

- O cartão da refeição vem primeiro, com borda dourada e o botão "Mostrar meu QR" dentro (regras em `lib/rules/home.ts`). Estados: "Almoço agora, até 14:00"; "Almoço registrado às 12:16" com a próxima em menor destaque; ou a próxima refeição com contagem regressiva.
- "Viajar no tempo" virou um ícone de relógio no cabeçalho que abre um painel. Aparece na demonstração (com selo "Demo" quando o relógio está simulado) e, em produção, só com a sessão de ADM ativa, como a API já exigia.
- Turno de intervalo da equipe: "Intervalo. Refeição às HH:MM", usando o início da janela da equipe que cai dentro do intervalo; sem janela, só "Intervalo". O prompt cita "12:43", que é o fim da janela de exemplo; usamos o início porque é o horário em que a equipe deve ir comer.

## 37. Elogios: busca primeiro, ícones numa folha inferior

- A lista só aparece com 2 letras ou mais e fica na rolagem normal da página. Isso sobrepõe a decisão 33 nos elogios (e, no item 5, na busca de voluntário). No check-in, rádios e pins do QG a lista completa continua.
- Sem busca, a tela mostra quem a pessoa já elogiou nesta janela, com os ícones que ela mesma enviou.
- Ao tocar num nome, sobe uma folha com os três botões grandes, estados "Enviado" e "Não enviado". Fecha com o botão "Fechar", com Esc, tocando fora ou arrastando para baixo (mais de 80 px).
- A pessoa não aparece na própria busca, e o servidor continua recusando autoelogio.

## 38. Prioridade média dos ajustes de interface

- Busca de voluntário: lista só com 2 letras ou mais, local em uma linha ("Refeitório, até 14:00" ou "Intervalo no Refeitório, até 14:00") e o aviso "local previsto pela escala, pode ter mudado" uma vez, no topo. O botão de limpar dos campos de busca usa o dourado da paleta (`app/globals.css`).
- Barra inferior: Início, Agenda, Meu QR (destaque no centro), Refeições, Mais. Mapa foi para Mais, junto com Buscar, Elogios e Privacidade.
- Entrada da Área do QG: cada módulo mostra um número ao vivo (`/api/qg/summary`, atualiza a cada 15 s): refeição atual consumidas de preparadas, rádios fora e não devolvidos, estado da janela de elogios.
- Painel de refeições: equipes da menor para a maior porcentagem; em laranja, com o texto "atenção", as abaixo de `MEAL_LOW_THRESHOLD_PCT` (padrão 50) depois da metade da janela da refeição. Mostra "Atualizado há N s" e um botão de atualizar.
- A partir de 1024 px, as telas do QG usam até 6xl de largura e duas colunas: no painel, "por equipe" à esquerda e "ainda não comeu" à direita; nos rádios, a lista à esquerda e o formulário à direita (a aba "painel" some, porque a lista já está visível). As telas do voluntário continuam numa coluna central de até 2xl.

## 39. Prioridade baixa dos ajustes de interface

- Contraste: avatar com iniciais claras sobre o vermelho (5,3:1) e escuras nos demais fundos; o tom `#8A7245` saiu dos avatares. `gold-dim` fica só para bordas. Placeholders usam `text-secondary` (`#B89A63`, 7:1 no fundo do campo).
- QR pessoal: anel com os segundos de validade (30 s) e linha com o status da refeição atual: "Almoço: liberado", "Almoço: já registrado às 12:16" ou a próxima refeição.
- Estados dos elogios: "Enviado" e "Não enviado" (feito no item 4).
- Logins de teste, com as senhas de ADM, só aparecem com `DEMO_MODE=true` explícito (`showDemoLogins()` em `lib/server/env.ts`). Sem Supabase o app continua em modo demonstração, mas não mostra os logins. Conferido: com `DEMO_MODE=false` o HTML de `/entrar` não contém nenhum login nem senha.
- `npm run shots [pasta]` gera capturas das telas principais em 390x844 e 1280x800 (precisa do app rodando e do Playwright; `BASE_URL` e `CHROMIUM_PATH` opcionais).

## 40. Elogios direto no card e sem logins de teste na entrada (decisão do autor)

- Substitui o item 37 e o item 13 da prioridade baixa (decisão 39) quanto aos logins.
- Elogios: não há mais folha inferior. Cada card de voluntário traz nome, equipe e os três botões (Feliz, Facilitador, Por inteiro), com `aria-pressed` e texto "Enviado"/"Não enviado". Tocar envia, tocar de novo retira; erro de rede reverte o estado e mostra a mensagem no próprio card.
- A lista completa aparece sem digitar; o campo de busca fica fixo no topo e só filtra. O próprio usuário não aparece.
- Tela de entrada: o quadro de logins de teste foi removido em qualquer modo. Os logins seguem documentados em `supabase/seed/demo/LOGINS_DE_TESTE.md`.
