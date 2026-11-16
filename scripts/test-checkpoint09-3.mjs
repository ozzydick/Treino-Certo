import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js';

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

const execution = transpile('src/components/workout/WorkoutExecutionView.tsx');
const timer = transpile('src/components/workout/WorkoutRestTimerOverlay.tsx');
const context = fs.readFileSync(path.join(root, 'src/context/WorkoutContext.tsx'), 'utf8');

for (const token of [
  'isSavingSession', 'isFinishing', 'isDiscarding', 'role="alert"',
  'Salvando...', 'Descartando...', 'activeSession.isPaused',
  'startRestTimer(0)', 'Séries concluídas', 'Exercícios realizados',
  'aria-label={activeSession.isPaused ? \'Retomar treino\' : \'Pausar treino\'}',
]) assert.ok(execution.includes(token), `Fluxo da sessão sem: ${token}`);
for (const token of [
  'role="timer"', 'role="progressbar"', 'aria-valuenow={Math.round(progressPercent)}',
  'aria-label="Pular intervalo de descanso"', 'aria-label="Adicionar 30 segundos ao descanso"',
  'aria-label="Reduzir 10 segundos do descanso"', 'aria-label="Adicionar 60 segundos ao descanso"', 'min-h-10', 'setIsMinimized(false)',
]) assert.ok(timer.includes(token), `Temporizador sem: ${token}`);
for (const token of [
  "const REST_TIMER_STORAGE_KEY = 'treino_certo_rest_timer'",
  'safeLocalStorageSet(', 'REST_TIMER_STORAGE_KEY',
  'playTimerCompletionChime(preferences.soundAlerts, preferences.vibration)',
  'coordinatorRef.current.enqueueUpdate(updater)',
]) assert.ok(context.includes(token), `Integridade do fluxo/persistência sem: ${token}`);

console.log('CP09.3: transpile TSX, estados de salvamento/finalização, controles acessíveis do descanso e invariantes de persistência aprovados.');
