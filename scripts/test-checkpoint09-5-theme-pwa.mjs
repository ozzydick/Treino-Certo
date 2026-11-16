import fs from 'node:fs';
import assert from 'node:assert/strict';

const themes = fs.readFileSync('src/constants/themes.ts', 'utf8');
const types = fs.readFileSync('src/types/index.ts', 'utf8');
const css = fs.readFileSync('src/index.css', 'utf8');
const context = fs.readFileSync('src/context/ThemeContext.tsx', 'utf8');
const db = fs.readFileSync('src/services/db.ts', 'utf8');
const vite = fs.readFileSync('vite.config.ts', 'utf8');
const themeIds = ['orange', 'green', 'blue', 'purple', 'red', 'gold', 'ocean'];
for (const id of themeIds) {
  assert.ok(themes.includes(`${id}: {`), `tema ausente no catálogo: ${id}`);
  assert.ok(types.includes(`'${id}'`), `ThemeId não contempla ${id}`);
}
assert.equal((themes.match(/^  [a-z]+: \{/gm) || []).length, 7, 'catálogo deve conter exatamente sete temas');
assert.ok(themes.includes("primaryHex: '#39F500'"), 'OCEANO deve manter o verde elétrico');
assert.ok(css.includes('--app-bg: #061A1C'), 'fundo petróleo principal ausente');
assert.ok(css.includes('--app-header: #08272B'), 'superfície petróleo ausente');
assert.ok(context.includes("metaThemeColor.setAttribute('content', '#061A1C')"), 'meta theme-color deve acompanhar o app');
assert.ok(db.includes('gold, ocean'), 'validador de backup deve aceitar tema OCEANO');
assert.ok(vite.includes("theme_color: '#061A1C'"), 'manifest theme_color desalinhado');
assert.ok(vite.includes("background_color: '#061A1C'"), 'manifest background_color desalinhado');
assert.ok(vite.includes("globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}']"), 'precache offline não contempla formatos esperados');
assert.ok(vite.includes("globIgnores: ['**/assets/aistudio/**']"), 'exclusão de assets internos ausente');
for (const file of ['public/pwa-192x192.png', 'public/pwa-512x512.png', 'public/pwa-maskable-512x512.png', 'public/icon.svg']) {
  assert.ok(fs.existsSync(file) && fs.statSync(file).size > 0, `ícone PWA ausente ou vazio: ${file}`);
}
console.log('CP09.5 tema/PWA: sete temas, OCEANO, compatibilidade de backup, cores do manifest, precache offline e quatro ícones verificados.');
