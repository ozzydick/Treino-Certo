import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const modal = readFileSync(new URL('../src/components/exercises/CustomExerciseModal.tsx', import.meta.url), 'utf8');
const media = readFileSync(new URL('../src/services/mediaDb.ts', import.meta.url), 'utf8');
const context = readFileSync(new URL('../src/context/CustomExercisesContext.tsx', import.meta.url), 'utf8');

assert.match(modal, /import \{ compressImageFile \} from '\.\.\/\.\.\/services\/mediaDb'/);
assert.match(modal, /await compressImageFile\(file, 720, 720, 0\.78\)/);
assert.match(modal, /file\.size > 5 \* 1024 \* 1024/);
assert.match(modal, /compressedDataUrl\.startsWith\('data:image\/'\)/);
assert.match(media, /canvas\.toDataURL\('image\/webp', quality\)/);
assert.match(media, /canvas\.toDataURL\('image\/jpeg', quality\)/);
assert.match(context, /externalVideoUrl: photoDataUrl \? photoDataUrl : exerciseData\.externalVideoUrl/);
assert.match(context, /merged\.externalVideoUrl = photoDataUrl \|\| undefined/);

console.log('CP09.1 custom photo optimization: 8/8 structural checks passed.');
