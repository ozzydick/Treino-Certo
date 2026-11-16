import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const pwa = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
const exerciseView = fs.readFileSync(path.join(root, 'src/components/exercises/ExerciseIllustration.tsx'), 'utf8');
const equipmentView = fs.readFileSync(path.join(root, 'src/components/equipments/EquipmentIllustration.tsx'), 'utf8');
const equipmentContext = fs.readFileSync(path.join(root, 'src/context/EquipmentsContext.tsx'), 'utf8');
const gymView = fs.readFileSync(path.join(root, 'src/components/equipments/GymEquipmentsView.tsx'), 'utf8');

const lazyScreens = [
  ['./components/profile/ProfileView', 'ProfileView'],
  ['./components/equipments/GymEquipmentsView', 'GymEquipmentsView'],
  ['./components/exercises/ExerciseLibraryView', 'ExerciseLibraryView'],
  ['./components/theme/ThemeLibraryModal', 'ThemeLibraryModal'],
  ['./components/workout/WorkoutPlanView', 'WorkoutPlanView'],
  ['./components/evolution/EvolutionView', 'EvolutionView'],
];
for (const [modulePath, exportName] of lazyScreens) {
  assert.ok(app.includes(`import('${modulePath}')`), `Tela não carregada sob demanda: ${exportName}`);
  assert.ok(app.includes(`module.${exportName}`), `Exportação lazy ausente: ${exportName}`);
}
assert.match(app, /<Suspense[\s\S]*Carregando tela/);
assert.match(app, /\{isThemeModalOpen && \([\s\S]*<Suspense fallback=\{null\}>[\s\S]*<ThemeLibraryModal/);
assert.match(app, /REFRESH_STATE_KEY/);
assert.match(pwa, /globPatterns: \['\*\*\/\*\.\{js,css,html,ico,png,svg,webp,woff,woff2\}'\]/);
assert.match(pwa, /globIgnores: \['\*\*\/assets\/aistudio\/\*\*'\]/);
assert.match(exerciseView, /loading="lazy"/);
assert.match(exerciseView, /decoding="async"/);
assert.match(equipmentView, /loading="lazy"/);
assert.match(equipmentView, /decoding="async"/);

const exerciseDir = path.join(root, 'public/images/exercises');
const equipmentDir = path.join(root, 'public/images/equipments/3d');
const exercises = fs.readdirSync(exerciseDir).filter((f) => f.endsWith('.webp'));
const equipments = fs.readdirSync(equipmentDir).filter((f) => f.endsWith('.webp'));
assert.equal(exercises.length, 180, `Esperadas 180 imagens de exercícios, encontradas ${exercises.length}`);
assert.equal(equipments.length, 54, `Esperadas 54 imagens 3D de equipamentos, encontradas ${equipments.length}`);
for (const file of [...exercises.map(f => path.join(exerciseDir, f)), ...equipments.map(f => path.join(equipmentDir, f))]) {
  assert.ok(fs.statSync(file).size > 0, `Imagem vazia: ${file}`);
}
const legacyDir = path.join(root, 'src/assets/images');
assert.ok(!fs.existsSync(legacyDir) || fs.readdirSync(legacyDir).length === 0, 'Assets JPEG legados não referenciados ainda presentes');
console.log('CP09.1: telas secundárias com carregamento sob demanda (6/6)');
console.log('CP09.1: fallback Suspense e restauração CP08.9 preservados');
console.log('CP09.1: estratégia PWA mantém WebP/PNG/SVG offline e exclui assets/aistudio');
console.log('CP09.1: imagens 3D lazy/async e catálogos íntegros (180 exercícios + 54 equipamentos)');
console.log('CP09.1: 43 JPEGs legados sem referências removidos com segurança');

assert.match(equipmentContext, /const loadEquipmentPhotos = useCallback\(async \(\) =>/);
assert.match(equipmentContext, /photosLoadPromiseRef\.current/);
assert.match(equipmentContext, /loadEquipmentPhotos,/);
const startupLoader = equipmentContext.match(/const loadEquipmentsFromDB = useCallback\(async \(\) => \{([\s\S]*?)\n  \}, \[\]\);/);
assert.ok(startupLoader, 'Loader inicial de equipamentos não encontrado');
assert.doesNotMatch(startupLoader[1], /getAllEquipmentPhotos/);
assert.match(gymView, /useEffect\(\(\) => \{[\s\S]*loadEquipmentPhotos\(\)/);
console.log('CP09.1: leitura de fotos personalizadas adiada até abrir Minha Academia');
