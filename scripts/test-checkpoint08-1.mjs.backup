import fs from 'node:fs';
import path from 'node:path';
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';

const root = process.cwd();
const files = [
  'src/types/index.ts',
  'src/context/WorkoutContext.tsx',
  'src/components/workout/WorkoutExecutionView.tsx',
];
let failures = 0;
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  });
  const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  if (errors.length) {
    failures += errors.length;
    console.error(`FAIL ${file}`);
    for (const error of errors) console.error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  } else console.log(`PASS sintaxe ${file}`);
}
const types = fs.readFileSync(path.join(root, 'src/types/index.ts'), 'utf8');
const context = fs.readFileSync(path.join(root, 'src/context/WorkoutContext.tsx'), 'utf8');
const view = fs.readFileSync(path.join(root, 'src/components/workout/WorkoutExecutionView.tsx'), 'utf8');
for (const [label, ok] of [
  ['tipos de série aquecimento/efetiva/drop/falha', /WorkoutSetType = 'warmup' \| 'working' \| 'drop' \| 'failure'/.test(types)],
  ['RPE e RIR opcionais por série', /effortRpe\?: number/.test(types) && /effortRir\?: number/.test(types)],
  ['sugestão baseada na sessão concluída anterior', /previousSession/.test(context) && /suggestedWeight/.test(context) && /suggestedReps/.test(context)],
  ['seletor de tipo de série na execução', /Tipo da série/.test(view) && /Drop set/.test(view) && /Até a falha/.test(view)],
  ['controles RPE/RIR na execução', /RPE série/.test(view) && /RIR série/.test(view)],
]) {
  if (ok) console.log(`PASS ${label}`); else { console.error(`FAIL ${label}`); failures++; }
}
if (failures) process.exit(1);
console.log('CP08.1: verificações estáticas aprovadas.');
