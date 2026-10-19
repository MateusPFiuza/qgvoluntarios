// Capturas das telas principais em 390x844 e 1280x800 (modo demonstração).
// Uso: npm run build && npm start, depois `npm run shots [pasta-de-saida]`.
// Variáveis: BASE_URL (padrão http://localhost:3000), CHROMIUM_PATH (opcional).
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const p of ["playwright", "@playwright/test", "/opt/node22/lib/node_modules/playwright"]) {
    try {
      return require(p);
    } catch {}
  }
  throw new Error("Playwright não encontrado. Instale com `npm i -D playwright` ou globalmente.");
}

const { chromium } = loadPlaywright();
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? "shots";
const VOLUNTEER = { id: "499355c2-e0c9-4d3c-9e61-aea586af8dbb", cpf: "1000", birth: "0101" };
const ADMIN = { id: "357d31b6-4ca0-45d6-bbc9-77d8c2f4379c", cpf: "0000", birth: "0101", password: "qg2026-clara" };
const VIEWPORTS = [
  { name: "390", width: 390, height: 844, mobile: true },
  { name: "1280", width: 1280, height: 800, mobile: false },
];
const VOLUNTEER_PAGES = ["/", "/cronograma", "/refeicoes", "/minha-identificacao", "/elogios", "/buscar", "/mapa", "/mais"];
const ADMIN_PAGES = ["/qg", "/qg/refeicoes", "/qg/refeicoes/painel", "/qg/radios", "/qg/elogios"];

const slug = (p) => (p === "/" ? "inicio" : p.slice(1).replace(/\//g, "-"));

async function login(page, who, admin) {
  const headers = { "content-type": "application/json", origin: BASE };
  const r = await page.request.post(`${BASE}/api/auth/volunteer/login`, {
    headers,
    data: { volunteerId: who.id, cpfLast4: who.cpf, birthDDMM: who.birth },
  });
  if (!r.ok()) throw new Error(`login falhou: ${r.status()}`);
  await page.request.post(`${BASE}/api/me/privacy`, { headers, data: {} });
  if (admin) {
    const a = await page.request.post(`${BASE}/api/auth/admin/login`, { headers, data: { password: who.password } });
    if (!a.ok()) throw new Error(`login ADM falhou: ${a.status()}`);
  }
}

async function capture(page, dir, name) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage: false });
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const vp of VIEWPORTS) {
  const dir = join(OUT, vp.name);
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    deviceScaleFactor: vp.mobile ? 2 : 1,
    reducedMotion: "reduce",
  });
  await ctx.addInitScript(() => {
    try {
      window.sessionStorage.setItem("qg26:boot-visto", "1");
    } catch {}
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/entrar`);
  await capture(page, dir, "entrar");

  await login(page, VOLUNTEER, false);
  for (const p of VOLUNTEER_PAGES) {
    await page.goto(BASE + p);
    await capture(page, dir, slug(p));
  }
  await ctx.clearCookies();
  await login(page, ADMIN, true);
  for (const p of ADMIN_PAGES) {
    await page.goto(BASE + p);
    await capture(page, dir, slug(p));
  }
  await ctx.close();
}
await browser.close();
console.log(`Capturas salvas em ${OUT}/`);
