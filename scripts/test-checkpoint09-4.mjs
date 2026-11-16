import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';
import { createRequire } from 'node:module';

const root = process.cwd();
const transpile = (relative) => {
  const file = path.join(root, relative);
  const source = fs.readFileSync(file, 'utf8');
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  });
  const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `${relative}: ${errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('\n')}`);
  return source;
};

const history = transpile('src/components/workout/WorkoutHistoryView.tsx');
for (const token of [
  'Explorar histórico', 'historySearch', 'historyPeriod', 'historySort',
  'Últimos 7 dias', 'Últimos 30 dias', 'Últimos 90 dias',
  'Maior volume', 'Maior duração', 'Exportar CSV', 'Nenhum treino encontrado',
  'aria-label="Buscar no histórico de treinos"', 'aria-label="Filtrar período do histórico"', 'filterWorkoutHistory(',
]) assert.ok(history.includes(token), `Histórico sem recurso: ${token}`);

const utilityFile = path.join(root, 'src/utils/workoutHistoryExport.ts');
const utilitySource = fs.readFileSync(utilityFile, 'utf8');
const compiled = ts.transpileModule(utilitySource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove },
}).outputText;
const module = { exports: {} };
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled)(module.exports, createRequire(utilityFile), module, utilityFile, path.dirname(utilityFile));
const { buildWorkoutHistoryCsv } = module.exports;
const fixture = [{
  id: 's1', workoutPlanId: 'p1', planName: 'Ficha "A"', divisionId: 'd1', divisionName: 'Treino A',
  startTime: '2026-11-15T10:00:00.000Z', isCompleted: true, exercisesCompleted: 1, totalVolumeKg: 100,
  notes: 'Sessão; observação', exerciseLogs: [{ exerciseId: 'e1', exerciseName: 'Supino reto', order: 1, notes: 'Ajuste "leve"', sets: [
    { setNumber: 1, setType: 'working', prescribedReps: '10', actualReps: 10, actualWeightKg: 10, completed: true, effortRpe: 8, effortRir: 2 },
    { setNumber: 2, prescribedReps: '10', actualReps: 8, actualWeightKg: 10, completed: false },
  ] }],
}];

const filterFile = path.join(root, 'src/utils/workoutHistoryFilters.ts');
const filterSource = fs.readFileSync(filterFile, 'utf8');
const filterCompiled = ts.transpileModule(filterSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove },
}).outputText;
const filterModule = { exports: {} };
new Function('exports', 'require', 'module', '__filename', '__dirname', filterCompiled)(filterModule.exports, createRequire(filterFile), filterModule, filterFile, path.dirname(filterFile));
const { filterWorkoutHistory } = filterModule.exports;
const now = Date.parse('2026-11-15T12:00:00.000Z');
const older = { ...fixture[0], id: 'older', startTime: '2026-10-01T10:00:00.000Z', totalVolumeKg: 250, durationSeconds: 2400, divisionName: 'Treino B' };
const newer = { ...fixture[0], id: 'newer', startTime: '2026-11-14T10:00:00.000Z', totalVolumeKg: 150, durationSeconds: 1800, divisionName: 'Treino A' };
const historyFixtures = [older, newer];
assert.deepEqual(filterWorkoutHistory(historyFixtures, { period: '7' }, now).map(item => item.id), ['newer'], 'período de 7 dias deve excluir registros antigos');
assert.deepEqual(filterWorkoutHistory(historyFixtures, { search: 'supino reto' }, now).map(item => item.id), ['newer', 'older'], 'busca deve considerar nomes de exercícios sem diferenciar caixa');
assert.deepEqual(filterWorkoutHistory(historyFixtures, { sort: 'volume' }, now).map(item => item.id), ['older', 'newer'], 'ordenação por volume deve ser decrescente');
assert.deepEqual(filterWorkoutHistory(historyFixtures, { sort: 'oldest' }, now).map(item => item.id), ['older', 'newer'], 'ordenação cronológica antiga-primeiro deve funcionar');
assert.deepEqual(historyFixtures.map(item => item.id), ['older', 'newer'], 'filtro não deve mutar a lista original');

const csv = buildWorkoutHistoryCsv(fixture);
assert.ok(csv.startsWith('\uFEFF'), 'CSV deve incluir BOM UTF-8');
assert.ok(csv.includes('"Ficha ""A"""'), 'CSV deve escapar aspas');
assert.ok(csv.includes('"Sessão; observação"'), 'CSV deve preservar delimitador dentro de célula');
assert.ok(csv.includes('"Supino reto"'), 'CSV deve exportar exercício');
assert.ok(csv.includes('"100"'), 'CSV deve calcular volume da série');
assert.equal((csv.match(/\r\n/g) || []).length, 2, 'CSV deve gerar uma linha por série');
assert.ok(buildWorkoutHistoryCsv([]).includes('"Data"'), 'CSV vazio deve manter cabeçalho');

console.log('CP09.4: TSX do histórico, filtros/ordenação funcionais, estados vazios e exportação CSV (UTF-8, escaping e uma linha por série) aprovados.');
