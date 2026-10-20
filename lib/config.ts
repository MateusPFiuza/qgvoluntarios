// Pontos únicos de configuração de módulos e suposições (ver docs/DECISOES.md).
// Lido só no servidor.

const flag = (name: string, fallback: boolean) => {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v === "true";
};

export const config = {
  mealsEnabled: () => flag("FEATURE_MEALS", true),
  radioRequireTypedDocs: () => flag("RADIO_REQUIRE_TYPED_DOCS", false),
  retentionDaysAfterEvent: () => Number(process.env.RETENTION_DAYS_AFTER_EVENT ?? 30),
  eventStart: "2026-12-11T18:30:00-03:00",
  eventEnd: "2026-12-13T17:55:00-03:00",
  // Relógio padrão da demonstração: sábado no almoço, para as telas terem movimento.
  demoDefaultNow: "2026-12-12T12:40:00-03:00",
  adminIdleMinutes: 30,
  // Painel de refeições: equipe em destaque abaixo deste percentual depois da metade da janela.
  mealLowThresholdPct: () => Number(process.env.MEAL_LOW_THRESHOLD_PCT ?? 50),
  // Rótulo do cronograma quando os itens vêm da planilha (is_mock = false).
  scheduleVersionLabel: "versão provisória v1",
  // PENDENTE: estoque real dos 3 pins do kit.
  pinStockPerTrait: () => Number(process.env.PIN_STOCK_PER_TRAIT ?? 30),
};
