import fs from 'node:fs';

const app = fs.readFileSync('src/App.tsx', 'utf8');
const header = fs.readFileSync('src/components/common/Header.tsx', 'utf8');
const checks = [
  ['botão de atualização no cabeçalho', /aria-label="Atualizar aplicativo"/.test(header)],
  ['estado da aba preservado', /currentTab,\s*activeView,\s*isThemeModalOpen,\s*scrollY/.test(app)],
  ['visão interna da academia preservada', /activeView: 'tabs' \| 'my-gym'/.test(app)],
  ['modal atual preservado', /isThemeModalOpen: boolean/.test(app)],
  ['posição de rolagem preservada', /window\.scrollTo\(0, restoredState\.scrollY\)/.test(app)],
  ['estado temporário guardado por sessão', /sessionStorage\.setItem\(REFRESH_STATE_KEY/.test(app)],
  ['estado temporário consumido uma única vez', /sessionStorage\.removeItem\(REFRESH_STATE_KEY/.test(app)],
  ['recarga nativa acionada pelo botão', /window\.location\.reload\(\)/.test(app)],
];
let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed++;
}
console.log(`Refresh preserve-view: ${checks.length - failed}/${checks.length} checks passed`);
if (failed) process.exit(1);
