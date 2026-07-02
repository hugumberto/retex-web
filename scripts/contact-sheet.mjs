// Monta contact sheets (HTML + PDF) SEPARADOS por viewport (desktop / mobile).
// Uso:
//   node scripts/contact-sheet.mjs            -> ambos os que existirem
//   node scripts/contact-sheet.mjs desktop    -> só desktop
//   node scripts/contact-sheet.mjs mobile     -> só mobile
// Pré-requisito: scripts/shots.mjs já correu (evidencias/<target>/{landing,portal}).
import { chromium } from '@playwright/test';
import { readdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const outRoot = fileURLToPath(new URL('../evidencias/', import.meta.url));

const LABELS = {
  home: 'Página inicial',
  blog: 'Blog (listagem)',
  'blog-post': 'Blog (artigo)',
  faq: 'FAQ',
  register: 'Criar conta',
  'auth-login': 'Login',
  'auth-activate': 'Ativação de conta',
  'auth-reset-password': 'Repor palavra-passe',
  'portal-home': 'Início',
  'portal-dashboard': 'Dashboard',
  'portal-collection-request': 'Solicitar coleta',
  'portal-triage': 'Triagem',
  'portal-package-collection': 'Recolha',
  'portal-storage-unit': 'Armazenamento',
  'portal-brand': 'Marcas',
  'portal-user': 'Utilizadores',
  'portal-zona': 'Zonas de atuação',
  'portal-faq': 'FAQ (gestão)',
  'portal-blog': 'Blog (gestão)',
  'portal-blog-new': 'Blog — novo artigo',
  'portal-blog-edit': 'Blog — editar artigo',
  'portal-blog-categories': 'Categorias do blog',
  'portal-perfil': 'Perfil / Conta',
};
const ORDER = Object.keys(LABELS);

const exists = (p) => access(p).then(() => true).catch(() => false);

async function collect(target, subdir) {
  const dir = join(outRoot, target, subdir);
  let files = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.png'));
  } catch {
    return [];
  }
  return files
    .map((f) => ({ base: f.replace(/\.png$/, ''), src: `${target}/${subdir}/${f}` }))
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.base);
      const ib = ORDER.indexOf(b.base);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
}

function pageBlock(item) {
  const title = LABELS[item.base] ?? item.base;
  return `
    <section class="page">
      <h3>${title} <span class="route">${item.base}</span></h3>
      <figure><img src="${item.src}" loading="lazy"/></figure>
    </section>`;
}

function appSection(name, items) {
  if (!items.length) return '';
  return `<div class="app"><h2>${name}</h2>${items.map(pageBlock).join('')}</div>`;
}

function buildHtml(target, landing, portal, total) {
  const isMobile = target === 'mobile';
  return `<!doctype html>
<html lang="pt"><head><meta charset="utf-8"/>
<title>Retex — Evidências (${target})</title>
<style>
  :root { --ink:#0f2e3a; --teal:#0e7c86; --muted:#6b7280; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: var(--ink); margin: 0; padding: 32px; background:#fff; }
  header.cover { text-align:center; padding: 24px 0 36px; border-bottom: 2px solid #e5e7eb; margin-bottom: 28px; }
  header.cover h1 { font-size: 32px; margin: 0 0 6px; color: var(--teal); }
  header.cover .tag { display:inline-block; margin-top:8px; padding:4px 12px; border-radius:999px; background:var(--teal); color:#fff; font-size:13px; text-transform:uppercase; letter-spacing:.5px; }
  header.cover p { color: var(--muted); margin: 6px 0 0; }
  .app > h2 { font-size: 23px; color: var(--teal); border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 34px; }
  .page { margin: 18px 0 26px; break-inside: avoid; page-break-inside: avoid; }
  .page h3 { font-size: 16px; margin: 0 0 10px; }
  .page h3 .route { font-size: 12px; color: var(--muted); font-weight: 400; margin-left: 8px; }
  figure { margin: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background:#fafafa; ${isMobile ? 'max-width:430px;' : ''} }
  figure img { width: 100%; display: block; }
</style></head>
<body>
  <header class="cover">
    <h1>Retex — Evidências das páginas</h1>
    <span class="tag">${isMobile ? 'Mobile (iPhone 13)' : 'Desktop (1440×900)'}</span>
    <p>${total} páginas · Landing page e Portal</p>
  </header>
  ${appSection('Landing page', landing)}
  ${appSection('Portal', portal)}
</body></html>`;
}

async function build(target) {
  if (!(await exists(join(outRoot, target)))) {
    console.log(`• ${target}: pasta inexistente, ignorado.`);
    return;
  }
  const landing = await collect(target, 'landing');
  const portal = await collect(target, 'portal');
  const total = landing.length + portal.length;
  if (!total) {
    console.log(`• ${target}: sem imagens, ignorado.`);
    return;
  }

  const htmlPath = join(outRoot, `index-${target}.html`);
  await writeFile(htmlPath, buildHtml(target, landing, portal, total), 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newContext().then((c) => c.newPage());
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(800);
  const pdfPath = join(outRoot, `evidencias-retex-${target}.pdf`);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
  });
  await browser.close();
  console.log(`✔ ${target}: ${total} páginas -> ${htmlPath}  |  ${pdfPath}`);
}

const pick = (process.argv[2] ?? '').toLowerCase();
const targets = pick ? [pick] : ['desktop', 'mobile'];
for (const t of targets) await build(t);
