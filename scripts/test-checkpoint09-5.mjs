import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';
import { createRequire } from 'node:module';

const root = process.cwd();
const sourceFile = path.join(root, 'src/utils/workoutPerformanceInsights.ts');
const source = fs.readFileSync(sourceFile, 'utf8');
const compiled = ts.transpileModule(source, {
  fileName: sourceFile,
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove },
});
const errors = (compiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
assert.equal(errors.length, 0, errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
const baseRequire = createRequire(sourceFile);
const typeSource = fs.readFileSync(path.join(root, 'src/types/index.ts'), 'utf8');
const typeModule = { exports: {} };
const typeCompiled = ts.transpileModule(typeSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
new Function('exports', 'require', 'module', '__filename', '__dirname', typeCompiled)(typeModule.exports, baseRequire, typeModule, path.join(root, 'src/types/index.ts'), path.join(root, 'src/types'));
const evolutionSourceFile = path.join(root, 'src/utils/evolutionCalculator.ts');
const evolutionCompiled = ts.transpileModule(fs.readFileSync(evolutionSourceFile, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const evolutionModule = { exports: {} };
new Function('exports', 'require', 'module', '__filename', '__dirname', evolutionCompiled)(
  evolutionModule.exports,
  (specifier) => specifier === '../types' ? typeModule.exports : baseRequire(specifier),
  evolutionModule,
  evolutionSourceFile,
  path.dirname(evolutionSourceFile),
);
const customRequire = (specifier) => {
  if (specifier === '../types') return typeModule.exports;
  if (specifier === './evolutionCalculator') return evolutionModule.exports;
  return baseRequire(specifier);
};
const module = { exports: {} };
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(module.exports, customRequire, module, sourceFile, path.dirname(sourceFile));
const { buildWorkoutPerformanceInsights } = module.exports;

const now = new Date(2026, 10, 15, 12, 0, 0);
const monday = new Date(2026, 10, 9, 10, 0, 0);
const fixtures = [];
for (let index = 0; index < 8; index += 1) {
  const date = new Date(monday);
  date.setDate(date.getDate() - (7 - index) * 7);
  fixtures.push({
    id: `week-${index}`, startTime: date.toISOString(), isCompleted: true,
    totalVolumeKg: 100 + index * 10,
    exerciseLogs: [{ exerciseId: 'e1', exerciseName: 'Supino', order: 1, sets: [
      { setNumber: 1, actualReps: 10, actualWeightKg: 10 + index, completed: true },
      { setNumber: 2, actualReps: 8, actualWeightKg: 10, completed: false },
    ] }],
  });
}
fixtures.push({ id: 'unfinished', startTime: now.toISOString(), isCompleted: false, totalVolumeKg: 9999, exerciseLogs: [] });
fixtures.push({ id: 'too-old', startTime: new Date(2026, 8, 1).toISOString(), isCompleted: true, totalVolumeKg: 5000, exerciseLogs: [] });

const result = buildWorkoutPerformanceInsights(fixtures, now);
assert.equal(result.weeks.length, 8, 'deve gerar exatamente oito semanas');
assert.equal(result.completedSessions, 8, 'deve considerar apenas sessões concluídas no período');
assert.equal(result.completedSets, 8, 'deve contar apenas séries concluídas');
assert.equal(result.totalVolumeKg, 1080, 'deve somar volume das oito semanas');
assert.equal(result.activeWeeks, 8, 'deve contar semanas ativas');
assert.equal(result.consistencyPercent, 100, 'consistência deve refletir semanas ativas');
assert.equal(result.previousFourWeekVolumeKg, 460, 'volume anterior deve somar as quatro semanas anteriores');
assert.equal(result.recentFourWeekVolumeKg, 620, 'volume recente deve somar as quatro semanas recentes');
assert.equal(result.volumeChangePercent, 34.8, 'comparação percentual deve ser calculada');
assert.equal(result.bestWeek.volumeKg, 170, 'melhor semana deve ser identificada');
assert.equal(fixtures.length, 10, 'a função não deve alterar o histórico de entrada');

const empty = buildWorkoutPerformanceInsights([], now);
assert.equal(empty.completedSessions, 0);
assert.equal(empty.consistencyPercent, 0);
assert.equal(empty.bestWeek, null);
assert.equal(empty.volumeChangePercent, null);

const ui = fs.readFileSync(path.join(root, 'src/components/workout/WorkoutHistoryView.tsx'), 'utf8');
const uiCompiled = ts.transpileModule(ui, {
  fileName: 'WorkoutHistoryView.tsx', reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
});
assert.equal((uiCompiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, 'tela de histórico deve transpilar sem erros');
for (const token of ['Evolução e desempenho', 'Semanas com treino', 'Volume semanal', 'Comparativo de volume', 'buildWorkoutPerformanceInsights']) {
  assert.ok(ui.includes(token), `tela sem recurso CP09.5: ${token}`);
}
console.log('CP09.5: oito semanas, frequência, séries concluídas, volume, comparativo, melhor semana, histórico imutável e estados vazios aprovados.');
