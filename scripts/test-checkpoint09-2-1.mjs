import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';

const root = process.cwd();
const file = path.join(root, 'src/components/workout/WorkoutExecutionView.tsx');
const source = fs.readFileSync(file, 'utf8');
const result = ts.transpileModule(source, {
  fileName: file,
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
});
const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
assert.equal(errors.length, 0, errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\\n')).join('\\n'));

for (const token of [
  'sessionProgressPercent',
  'currentExerciseProgressPercent',
  'role="progressbar"',
  'aria-label="Progresso geral do treino"',
  'aria-valuenow={sessionProgressPercent}',
  'aria-valuenow={currentExerciseProgressPercent}',
  '{completedSetsCount}/{totalSetsCount}',
  '{currentExerciseCompletedSets} de {currentExerciseTotalSets} concluídas',
]) assert.ok(source.includes(token), `Indicador ausente: ${token}`);

console.log('CP09.2 Bloco 01: progresso geral e por exercício com acessibilidade aprovados.');
