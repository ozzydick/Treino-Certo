import fs from 'node:fs';
import path from 'node:path';
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';
const files = ['src/utils/workoutProgress.ts','src/components/workout/WorkoutHistoryView.tsx'];
let failures = 0;
for (const file of files) {
  const source = fs.readFileSync(path.resolve(file), 'utf8');
  const result = ts.transpileModule(source, { fileName: file, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } });
  const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  if (errors.length) { failures += errors.length; console.error(`FAIL ${file}`); for (const e of errors) console.error(ts.flattenDiagnosticMessageText(e.messageText, '\n')); }
  else console.log(`PASS sintaxe ${file}`);
}
const util = fs.readFileSync(path.resolve('src/utils/workoutProgress.ts'), 'utf8');
const view = fs.readFileSync(path.resolve('src/components/workout/WorkoutHistoryView.tsx'), 'utf8');
for (const [label, ok] of [
 ['estimativa Epley limitada a 1–12 repetições', /reps <= 12/.test(util) && /1 \+ reps \/ 30/.test(util)],
 ['séries incompletas e aquecimento excluídos', /set.completed/.test(util) && /setType !== 'warmup'/.test(util)],
 ['PRs derivados de sessões concluídas', /filter\(s => s.isCompleted\)/.test(util) && /buildPersonalRecords/.test(util)],
 ['gráfico histórico por exercício', /SvgLineChart/.test(view) && /Evolução do 1RM estimado/.test(view)],
 ['sem armazenamento paralelo de PRs', !/localStorage|indexedDB|savePersonalRecord/i.test(util)],
]) { if (ok) console.log(`PASS ${label}`); else { console.error(`FAIL ${label}`); failures++; } }
if (failures) process.exit(1);
console.log('CP08.2: verificações estáticas aprovadas.');
