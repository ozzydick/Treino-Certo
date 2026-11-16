import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = process.cwd();
const catalog = fs.readFileSync(path.join(root, 'src/constants/equipmentsCatalog.ts'), 'utf8');
const view = fs.readFileSync(path.join(root, 'src/components/equipments/EquipmentIllustration.tsx'), 'utf8');
const imageIds = [
  'std_chest_supino_reto_barra',
  'std_chest_supino_inclinado_barra',
  'std_chest_supino_declinado',
  'std_chest_supino_maquina',
  'std_chest_peck_deck',
  'std_chest_crossover',
  'std_chest_crucifixo_maquina',
  'std_back_puxada_alta',
  'std_back_remada_baixa',
  'std_back_remada_articulada',
  'std_back_remada_cavalinho',
  'std_back_pulldown',
  'std_back_barra_fixa',
  'std_back_graviton',
  'std_legs_leg_press_45',
  'std_legs_leg_press_horizontal',
  'std_legs_cadeira_extensora',
  'std_legs_mesa_flexora',
  'std_legs_cadeira_flexora',
  'std_legs_cadeira_abdutora',
  'std_legs_cadeira_adutora',
  'std_legs_hack_squat',
  'std_legs_smith_machine',
  'std_legs_agachamento_livre_rack',
  'std_legs_panturrilha_sentada',
  'std_legs_panturrilha_em_pe',
  'std_legs_glute_drive',
  'std_legs_maquina_gluteo',
  'std_shoulders_desenvolvimento_maquina',
  'std_shoulders_desenvolvimento_halteres',
  'std_shoulders_elevacao_lateral_maquina',
  'std_shoulders_maquina_elevacao_lateral',
  'std_shoulders_banco_desenvolvimento',
  'std_arms_maquina_biceps',
  'std_arms_banco_scott',
  'std_arms_polia_triceps',
  'std_arms_maquina_triceps',
  'std_arms_barras_puxadores_polia',
  'std_general_halteres',
  'std_general_barras_retas',
  'std_general_barras_w',
  'std_general_anilhas',
  'std_general_bancos_retos',
  'std_general_bancos_regulaveis',
  'std_general_rack_agachamento',
  'std_general_polias_ajustaveis',
  'std_general_colchonetes',
  'std_general_kettlebells',
  'std_general_elasticos_resistencia',
  'std_cardio_esteira',
  'std_cardio_bicicleta_ergometrica',
  'std_cardio_spinning',
  'std_cardio_eliptico',
  'std_cardio_simulador_escada',
];
const ids = [...catalog.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
assert.equal(ids.length, 54, `Esperados 54 equipamentos, encontrados ${ids.length}`);
assert.equal(new Set(ids).size, 54, 'IDs duplicados no catálogo');
assert.ok(ids.includes('std_chest_supino_reto_barra'), 'ID do piloto ausente');
for (const id of imageIds) {
  assert.ok(fs.existsSync(path.join(root, `public/images/equipments/3d/${id}.webp`)), `Imagem 3D ausente: ${id}`);
  assert.ok(view.includes(`${id}: { src: '/images/equipments/3d/${id}.webp'`), `Vínculo por ID ausente: ${id}`);
}
assert.ok(view.includes('REALISTIC_EQUIPMENT_IMAGES[equipmentId]'), 'Registro de imagens por ID ausente');
assert.ok(view.indexOf('const REALISTIC_EQUIPMENT_IMAGES') < view.indexOf('export const EquipmentIllustration'), 'Mapa de imagens deve ficar fora do componente');
assert.ok(view.includes('width={realisticImage.width}') && view.includes('height={realisticImage.height}'), 'Dimensões intrínsecas das imagens não estão declaradas');
assert.ok(view.includes('React.memo<EquipmentIllustrationProps>'), 'Componente de equipamentos não está memoizado');
assert.ok(view.includes('<StandardEquipmentSvg id={equipmentId}'), 'Fallback SVG original ausente');
assert.ok(view.includes('loading="lazy"') && view.includes('decoding="async"'), 'Carregamento otimizado ausente');
console.log('PASS: catálogo oficial contém 54 IDs únicos');
console.log(`PASS: ${imageIds.length} imagens 3D individuais vinculadas aos IDs corretos`);
console.log('PASS: carregamento lazy/async configurado');
console.log('PASS: SVG original preservado como fallback para os equipamentos ainda sem render 3D');
