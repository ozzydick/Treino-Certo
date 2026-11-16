import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const evolutionContext = read('src/context/EvolutionContext.tsx');
const evolutionView = read('src/components/evolution/EvolutionView.tsx');
const app = read('src/App.tsx');
const css = read('src/index.css');
const media = read('src/services/mediaDb.ts');
const db = read('src/services/db.ts');
const equipment = read('src/components/equipments/EquipmentIllustration.tsx');
const exercise = read('src/components/exercises/ExerciseIllustration.tsx');
const vite = read('vite.config.ts');
const customContext = read('src/context/CustomExercisesContext.tsx');
const equipmentContext = read('src/context/EquipmentsContext.tsx');
const workoutContext = read('src/context/WorkoutContext.tsx');
const meta = read('src/constants/exerciseCatalogMeta.ts');

// Dados de medidas corporais só são consultados quando Evolução é aberta.
assert.match(evolutionContext, /ensureMeasurementsLoaded: \(\) => Promise<void>/);
assert.match(evolutionContext, /measurementsLoadedRef/);
assert.match(evolutionContext, /measurementsLoadPromiseRef/);
assert.doesNotMatch(evolutionContext, /useEffect\(\(\) => \{\s*refreshMeasurements\(\)/);
assert.match(evolutionView, /ensureMeasurementsLoaded\(\)/);

// O catálogo extenso não deve ser dependência estática dos provedores globais.
assert.doesNotMatch(customContext, /from ['\"][^'\"]*exercisesCatalog['\"]/);
assert.match(customContext, /import\(['\"]\.\.\/constants\/exercisesCatalog['\"]\)/);
assert.doesNotMatch(equipmentContext, /from ['\"][^'\"]*exercisesCatalog['\"]/);
assert.match(equipmentContext, /await import\(['\"]\.\.\/constants\/exercisesCatalog['\"]\)/);
assert.doesNotMatch(workoutContext, /from ['\"][^'\"]*exercisesCatalog['\"]/);
assert.match(workoutContext, /await import\(['\"]\.\.\/constants\/exercisesCatalog['\"]\)/);
assert.match(meta, /ORDERED_MUSCLE_GROUPS/);
assert.match(customContext, /ensureCatalogLoaded/);
assert.match(exercise, /loading="lazy"/);
assert.match(exercise, /decoding="async"/);

// Renderização das 54 ilustrações: mapa compartilhado, memoização, dimensões e lazy-load.
assert.ok(equipment.indexOf('const REALISTIC_EQUIPMENT_IMAGES') < equipment.indexOf('export const EquipmentIllustration'));
assert.match(equipment, /React\.memo<EquipmentIllustrationProps>/);
assert.match(equipment, /width=\{realisticImage\.width\}/);
assert.match(equipment, /height=\{realisticImage\.height\}/);
assert.match(equipment, /loading="lazy"/);
assert.match(equipment, /decoding="async"/);
assert.match(equipment, /fetchPriority="low"/);

// Fotos pessoais são redimensionadas/comprimidas e submetidas a limites antes de persistir.
assert.match(media, /maxWidth = 720/);
assert.match(media, /maxHeight = 720/);
assert.match(media, /quality = 0\.78/);
assert.match(db, /MAX_MEDIA_PHOTO_DATA_URL_LENGTH = 2 \* 1024 \* 1024/);
assert.match(db, /MAX_TOTAL_MEDIA_DATA_URL_LENGTH = 25 \* 1024 \* 1024/);

// Navegação usa transição leve e respeita a preferência de movimento reduzido.
assert.match(app, /className="app-route-enter"/);
assert.match(css, /app-route-enter 150ms ease-out/);
assert.match(css, /prefers-reduced-motion: reduce/);

// PWA mantém recursos locais offline; arquivos de referência não são publicados em /public.
assert.match(vite, /webp/);
assert.match(vite, /globIgnores: \['\*\*\/assets\/aistudio\/\*\*'\]/);
assert.ok(!fs.existsSync(path.join(root, 'public/assets/aistudio')), 'Referências internas ainda estão em public');
const archiveDir = path.join(root, 'archive/aistudio-reference');
assert.ok(fs.existsSync(archiveDir), 'Arquivo de referência não foi preservado fora de public');
const archiveFiles = fs.readdirSync(archiveDir).filter((name) => fs.statSync(path.join(archiveDir, name)).isFile());
assert.equal(archiveFiles.length, 15, `Esperados 15 arquivos de referência preservados, encontrados ${archiveFiles.length}`);

// Auditoria objetiva dos catálogos de imagens.
const equipmentDir = path.join(root, 'public/images/equipments/3d');
const exerciseDir = path.join(root, 'public/images/exercises');
const equipmentFiles = fs.readdirSync(equipmentDir).filter((name) => name.endsWith('.webp'));
const exerciseFiles = fs.readdirSync(exerciseDir).filter((name) => name.endsWith('.webp'));
assert.equal(equipmentFiles.length, 54, 'Catálogo 3D de equipamentos deve conter 54 imagens');
assert.equal(exerciseFiles.length, 180, 'Biblioteca deve conter 180 imagens de exercícios');
const equipmentBytes = equipmentFiles.reduce((sum, name) => sum + fs.statSync(path.join(equipmentDir, name)).size, 0);
const exerciseBytes = exerciseFiles.reduce((sum, name) => sum + fs.statSync(path.join(exerciseDir, name)).size, 0);
assert.ok(equipmentBytes < 1_000_000, `Imagens 3D excedem 1 MB: ${equipmentBytes}`);
assert.ok(exerciseBytes < 8_000_000, `Imagens de exercícios excedem 8 MB: ${exerciseBytes}`);
assert.ok(equipmentFiles.every((name) => fs.statSync(path.join(equipmentDir, name)).size > 0));
assert.ok(exerciseFiles.every((name) => fs.statSync(path.join(exerciseDir, name)).size > 0));

console.log('CP09.1 performance: catálogo oficial separado do bundle inicial por importação dinâmica — aprovado.');
console.log(`CP09.1 imagens: 54 equipamentos ${(equipmentBytes / 1024).toFixed(1)} KB; 180 exercícios ${(exerciseBytes / 1024 / 1024).toFixed(2)} MB — aprovado.`);
console.log('CP09.1 armazenamento: compressão 720px/0.78 e limites de mídia — aprovado estruturalmente.');
console.log('CP09.1 PWA: recursos WebP mantidos; 15 arquivos internos preservados fora de public — aprovado.');
