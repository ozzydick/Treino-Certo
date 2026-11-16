import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const library = fs.readFileSync(path.join(root, 'src/components/exercises/ExerciseLibraryView.tsx'), 'utf8');
const exerciseImage = fs.readFileSync(path.join(root, 'src/components/exercises/ExerciseIllustration.tsx'), 'utf8');
const equipmentImage = fs.readFileSync(path.join(root, 'src/components/equipments/EquipmentIllustration.tsx'), 'utf8');

assert.match(library, /useState\(24\)/, 'A biblioteca deve iniciar com lote de 24 exercícios');
assert.match(library, /filteredExercises\.slice\(0, visibleExerciseCount\)/, 'A lista deve limitar os itens renderizados');
assert.match(library, /visibleExercises\.map\(/, 'A renderização deve usar o lote visível');
assert.match(library, /setVisibleExerciseCount\(\(current\) => Math\.min\(current \+ 24, filteredExercises\.length\)\)/, 'O botão deve carregar o próximo lote');
assert.match(library, /\[searchQuery, selectedMuscleGroup, onlyAvailableInGym, onlyCustom\]/, 'Filtros devem reiniciar a paginação');
assert.match(exerciseImage, /React\.memo<ExerciseIllustrationProps>/, 'Miniaturas de exercícios devem usar memoização');
assert.match(exerciseImage, /fetchPriority="low"/, 'Imagens de exercícios devem ter prioridade baixa');
assert.match(equipmentImage, /fetchPriority="low"/, 'Imagens de equipamentos devem ter prioridade baixa');
assert.match(exerciseImage, /loading="lazy"[\s\S]*decoding="async"/, 'Imagens de exercícios devem manter lazy/async');
assert.match(equipmentImage, /loading="lazy"[\s\S]*decoding="async"/, 'Imagens de equipamentos devem manter lazy/async');

console.log('CP09.1 Bloco 03: renderização progressiva da biblioteca (24 por lote)');
console.log('CP09.1 Bloco 03: paginação reiniciada ao alterar busca/filtros');
console.log('CP09.1 Bloco 03: miniaturas de exercícios memoizadas');
console.log('CP09.1 Bloco 03: imagens lazy/async com prioridade baixa');
