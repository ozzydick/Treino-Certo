import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const transpile = (relative) => {
  const file = path.join(root, relative);
  const result = ts.transpileModule(read(relative), {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  });
  const errors = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `${relative}: ${errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n')}`);
};

transpile('src/components/evolution/EvolutionView.tsx');
transpile('src/utils/muscleVolumeCalculator.ts');
const view = read('src/components/evolution/EvolutionView.tsx');
const calculator = read('src/utils/muscleVolumeCalculator.ts');
for (const token of [
  'selectedMuscleGroup', 'setSelectedMuscleGroup', 'aria-pressed={active}',
  'selectedMuscleTrend.currentTotal', 'selectedMuscleTrend.previousTotal',
  'selectedMuscleTrend.deltaPercent', 'séries por semana',
  'quatro semanas mais recentes contra as quatro anteriores',
]) assert.ok(view.includes(token), `Painel de evolução muscular sem: ${token}`);
for (const token of [
  "(s.setType || 'working') !== 'warmup'", 'SECONDARY_FACTOR = 0.5',
  'normalizeCompletedSessions(sessions, nowMs)',
]) assert.ok(calculator.includes(token), `Regra de volume muscular ausente: ${token}`);
console.log('CP09.3 Bloco 01: estrutura do comparativo muscular e regras de séries efetivas verificadas.');
