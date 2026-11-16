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
  'flex flex-col gap-3 p-3 sm:p-3.5',
  'grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]',
  'aria-label={`Carga realizada em kg na série ${setLog.setNumber}`}',
  'aria-label={`Repetições realizadas na série ${setLog.setNumber}`}',
  'aria-label={`Diminuir carga da série ${setLog.setNumber}`}',
  'aria-label={`Aumentar carga da série ${setLog.setNumber}`}',
  'aria-label={`Diminuir repetições da série ${setLog.setNumber}`}',
  'aria-label={`Aumentar repetições da série ${setLog.setNumber}`}',
  'RPE série',
  'RIR série',
  'handleToggleSetCompletion(setLog.setNumber)',
]) assert.ok(source.includes(token), `Ajuste ausente: ${token}`);
console.log('CP09.2 Bloco 02: layout responsivo e controles acessíveis de séries/carga/repetições aprovados.');
