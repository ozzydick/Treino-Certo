import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const view = readFileSync(new URL('../src/components/exercises/ExerciseLibraryView.tsx', import.meta.url), 'utf8');
assert.match(view, /const ExerciseDetailModal = lazy\(\(\) =>\s*import\('\.\/ExerciseDetailModal'\)/);
assert.match(view, /const CustomExerciseModal = lazy\(\(\) =>\s*import\('\.\/CustomExerciseModal'\)/);
assert.match(view, /\{selectedExercise && \(/);
assert.match(view, /\{isCustomModalOpen && \(/);
assert.match(view, /<Suspense fallback=\{null\}>/);
assert.doesNotMatch(view, /^import \{ ExerciseDetailModal \} from/m);
assert.doesNotMatch(view, /^import \{ CustomExerciseModal \} from/m);
console.log('CP09.1 lazy exercise modals: 7/7 structural checks passed.');
