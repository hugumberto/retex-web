// Captura screenshots da landing em vários tamanhos (Chromium + WebKit/iOS).
// Uso: node scripts/landing-shot.mjs [baseUrl]
//   - Arranca primeiro o dev server da landing-page e passa o URL (ex.: http://localhost:3019).
import { chromium, webkit, devices } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const baseUrl = process.argv[2] ?? 'http://localhost:3019';
const outDir = fileURLToPath(new URL('../shots/', import.meta.url));
await mkdir(outDir, { recursive: true });

// Páginas a validar e os tamanhos/dispositivos.
const pages = ['/', '/blog', '/faq', '/register'];
const targets = [
  { name: 'iphone13', engine: webkit, context: devices['iPhone 13'] },
  { name: 'pixel7', engine: chromium, context: devices['Pixel 7'] },
  { name: 'tablet', engine: chromium, context: { viewport: { width: 768, height: 1024 } } },
  { name: 'desktop', engine: chromium, context: { viewport: { width: 1440, height: 900 } } },
];

const slug = (p) => (p === '/' ? 'home' : p.replace(/\//g, '') || 'home');

for (const t of targets) {
  const browser = await t.engine.launch();
  const ctx = await browser.newContext(t.context);
  for (const path of pages) {
    const page = await ctx.newPage();
    try {
      await page.goto(`${baseUrl}${path}`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(900); // deixa imagens/fontes assentarem
      // Verifica overflow horizontal (sintoma clássico de layout mobile partido).
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      const fileName = `landing-${slug(path)}-${t.name}.png`;
      await page.screenshot({ path: join(outDir, fileName), fullPage: true });
      console.log(
        `${slug(path).padEnd(8)} ${t.name.padEnd(9)} -> ${fileName}` +
          (overflow ? '  ⚠️ OVERFLOW-X' : '  ok'),
      );
    } catch (err) {
      console.log(`${slug(path).padEnd(8)} ${t.name.padEnd(9)} -> ERRO: ${err.message}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
}
console.log('Screenshots em:', outDir);
