// Captura screenshots da landing e do portal (autenticado como ADMIN) para
// evidências ao cliente. Versões Desktop e Mobile ficam em pastas separadas.
// Uso:
//   node scripts/shots.mjs            -> desktop + mobile
//   node scripts/shots.mjs desktop    -> só desktop
//   node scripts/shots.mjs mobile     -> só mobile
//   SHOT_DELAY_MS=10000 (default)     -> espera antes de cada print (resposta da API)
// Pré-requisitos: retex-api :3000, landing :3001, portal :3002, dados de demo.
import { chromium, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const API = (process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const LANDING = (process.env.LANDING_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const PORTAL = (process.env.PORTAL_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const EMAIL = process.env.ADMIN_EMAIL ?? 'admin@retex.pt';
const PASSWORD = process.env.ADMIN_PASSWORD ?? '123456';
const DELAY = Number(process.env.SHOT_DELAY_MS ?? 10000); // 10s antes de cada print

const outRoot = fileURLToPath(new URL('../evidencias/', import.meta.url));

async function apiLogin() {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!r.ok) throw new Error(`login API ${r.status}`);
  return r.json();
}

async function discoverBlog(accessToken) {
  try {
    const r = await fetch(`${API}/blog-post?limit=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const j = await r.json();
    const arr = Array.isArray(j) ? j : j.data ?? [];
    const pub = arr.find((p) => p.status === 'PUBLISHED') ?? arr[0];
    return pub ? { id: pub.id, slug: pub.slug } : null;
  } catch {
    return null;
  }
}

const session = await apiLogin();
const blog = await discoverBlog(session.access_token);
const blogSlug = blog?.slug ?? 'o-que-e-moda-circular';
const blogId = blog?.id ?? '';

const persisted = JSON.stringify({
  state: {
    isDarkMode: false,
    pageTitle: '',
    breadcrumbs: [],
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    user: session.user,
  },
  version: 0,
});

const landingRoutes = [
  { path: '/', name: 'home' },
  { path: '/blog', name: 'blog' },
  { path: `/blog/${blogSlug}`, name: 'blog-post' },
  { path: '/faq', name: 'faq' },
  { path: '/register', name: 'register' },
];

const portalPublicRoutes = [
  { path: '/auth/login', name: 'auth-login' },
  { path: '/auth/activate?token=token-de-exemplo', name: 'auth-activate' },
  { path: '/auth/reset-password?token=token-de-exemplo', name: 'auth-reset-password' },
];

const portalAuthRoutes = [
  { path: '/portal', name: 'portal-home' },
  { path: '/portal/dashboard', name: 'portal-dashboard' },
  { path: '/portal/collection-request', name: 'portal-collection-request' },
  { path: '/portal/triage', name: 'portal-triage' },
  { path: '/portal/package-collection', name: 'portal-package-collection' },
  { path: '/portal/storage-unit', name: 'portal-storage-unit' },
  { path: '/portal/brand', name: 'portal-brand' },
  { path: '/portal/user', name: 'portal-user' },
  { path: '/portal/zona', name: 'portal-zona' },
  { path: '/portal/faq', name: 'portal-faq' },
  { path: '/portal/blog', name: 'portal-blog' },
  { path: '/portal/blog/new', name: 'portal-blog-new' },
  ...(blogId ? [{ path: `/portal/blog/${blogId}`, name: 'portal-blog-edit' }] : []),
  { path: '/portal/blog-categories', name: 'portal-blog-categories' },
  { path: '/portal/perfil', name: 'portal-perfil' },
];

const allTargets = [
  { name: 'desktop', context: { viewport: { width: 1440, height: 900 } } },
  { name: 'mobile', context: { ...devices['iPhone 13'] } },
];
const pick = (process.argv[2] ?? '').toLowerCase();
const targets = pick ? allTargets.filter((t) => t.name === pick) : allTargets;
if (!targets.length) {
  console.error(`Alvo inválido: "${pick}". Use desktop, mobile ou nada.`);
  process.exit(1);
}

async function dismissCookies(page) {
  const selectors = [
    '.iubenda-cs-accept-btn',
    '#iubenda-cs-banner .iubenda-cs-accept-btn',
    '.iubenda-cs-close-btn',
    'button:has-text("Aceitar")',
  ];
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) {
      await el.click().catch(() => {});
      await page.waitForTimeout(400);
      return;
    }
  }
}

async function shoot(page, baseUrl, route, target, subdir) {
  const file = `${route.name}.png`;
  try {
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (subdir === 'landing') await dismissCookies(page);
    await page.waitForTimeout(DELAY); // espera a resposta da API / render assentar
    // Remove o indicador de dev do Next.js (badge "N"/erros) para evidências limpas.
    await page
      .evaluate(() => document.querySelectorAll('nextjs-portal').forEach((e) => e.remove()))
      .catch(() => {});
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    await page.screenshot({ path: join(outRoot, target.name, subdir, file), fullPage: true });
    console.log(`${target.name.padEnd(7)} ${subdir.padEnd(7)} ${route.name.padEnd(26)} -> ${file}${overflow ? '  ⚠️ overflow-x' : ''}`);
  } catch (err) {
    console.log(`${target.name.padEnd(7)} ${subdir.padEnd(7)} ${route.name.padEnd(26)} -> ERRO: ${err.message}`);
  }
}

for (const target of targets) {
  await mkdir(join(outRoot, target.name, 'landing'), { recursive: true });
  await mkdir(join(outRoot, target.name, 'portal'), { recursive: true });

  const browser = await chromium.launch();

  // 1) Landing (sem auth)
  const landingCtx = await browser.newContext(target.context);
  for (const route of landingRoutes) {
    const page = await landingCtx.newPage();
    await shoot(page, LANDING, route, target, 'landing');
    await page.close();
  }
  await landingCtx.close();

  // 2) Portal — públicas (sem sessão)
  const publicCtx = await browser.newContext(target.context);
  for (const route of portalPublicRoutes) {
    const page = await publicCtx.newPage();
    await shoot(page, PORTAL, route, target, 'portal');
    await page.close();
  }
  await publicCtx.close();

  // 3) Portal — autenticadas: semeia a sessão e intercepta o refresh.
  const authCtx = await browser.newContext(target.context);
  await authCtx.addInitScript((value) => {
    try {
      localStorage.setItem('app-storage', value);
    } catch {
      /* noop */
    }
  }, persisted);
  await authCtx.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
      }),
    }),
  );
  for (const route of portalAuthRoutes) {
    const page = await authCtx.newPage();
    await shoot(page, PORTAL, route, target, 'portal');
    await page.close();
  }
  await authCtx.close();

  await browser.close();
  console.log(`✔ ${target.name} concluído\n`);
}

console.log('Screenshots em:', outRoot, `(delay ${DELAY}ms/print)`);
console.log(`Blog dinâmico -> slug=${blogSlug} id=${blogId || '(nenhum)'}`);
