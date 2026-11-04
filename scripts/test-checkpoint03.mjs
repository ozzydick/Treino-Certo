/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import fs from 'node:fs';
import {
  DB_NAME,
  FitAppDB,
  REQUIRED_STORES,
} from '../src/services/db.ts';
import { MediaDB } from '../src/services/mediaDb.ts';
import {
  DEFAULT_EQUIPMENTS_CATALOG,
} from '../src/constants/equipmentsCatalog.ts';
import {
  DEFAULT_EXERCISES_CATALOG,
  MUSCLE_GROUP_LABELS,
  ORDERED_MUSCLE_GROUPS,
  buildExplicitCustomCompatibilityMap,
  filterExercisesCatalog,
  formatEquipmentAlternativesSummary,
  getExerciseCountByMuscleGroup,
  isExerciseCompatibleWithGym,
  isExternalVideoVerifiedAndValid,
  resolveCompatibleEquipmentsForExercise,
  resolveEquipmentAlternativesForExercise,
  validateExerciseCatalogEntry,
  validateExternalVideoUrl,
} from '../src/constants/exercisesCatalog.ts';
import {
  SPECIFIC_ILLUSTRATION_EXERCISE_IDS,
  StandardExerciseSvg,
  classifyExerciseIllustration,
} from '../src/components/exercises/ExerciseIllustration.tsx';
import {
  buildExerciseDetailViewModel,
} from '../src/components/exercises/ExerciseDetailModal.tsx';

console.log('================================================================================');
console.log('TREINO CERTO — AUDITORIA TÉCNICA DO CHECKPOINT 03');
console.log('Biblioteca de Exercícios, Instruções Biomecânicas e Compatibilidade Real');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testCode, testTitle, details = '') {
  if (condition) {
    passCount++;
    console.log(`[PASS] ${testCode}. ${testTitle}`);
    if (details) {
      console.log(`       ↳ ${details}`);
    }
  } else {
    failCount++;
    console.error(`[FAIL] ${testCode}. ${testTitle}`);
    if (details) {
      console.error(`       ↳ ERRO: ${details}`);
    }
  }
}

function extractReactText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractReactText).join(' ');
  if (typeof node === 'object' && node.props) {
    return extractReactText(node.props.children);
  }
  return '';
}

function getExerciseById(id) {
  const found = DEFAULT_EXERCISES_CATALOG.find((ex) => ex.id === id);
  if (!found) {
    throw new Error(`Exercício não encontrado no catálogo: ${id}`);
  }
  return found;
}

async function runCheckpoint03TestSuite() {
  const validEquipmentIdsSet = new Set(DEFAULT_EQUIPMENTS_CATALOG.map((item) => item.id));

  // ===========================================================================
  // TESTE 01: Integridade e unicidade dos IDs dos exercícios
  // ===========================================================================
  const allExerciseIds = DEFAULT_EXERCISES_CATALOG.map((ex) => ex.id);
  const uniqueExerciseIds = new Set(allExerciseIds);
  const allIdsValidFormat = allExerciseIds.every(
    (id) => typeof id === 'string' && /^ex_[a-z0-9_]+$/.test(id)
  );

  assert(
    DEFAULT_EXERCISES_CATALOG.length === 48 &&
      uniqueExerciseIds.size === DEFAULT_EXERCISES_CATALOG.length &&
      allIdsValidFormat,
    'TESTE 01',
    'Integridade e Unicidade dos IDs dos Exercícios (36 Originais + 4 Costas + 4 Pernas + 4 Peito = 48)',
    `${DEFAULT_EXERCISES_CATALOG.length} exercícios com IDs únicos e estáveis no padrão 'ex_*' (zero duplicações).`
  );

  // Verificação específica dos 8 exercícios do grupo Costas (4 originais preservados + 4 novos)
  const expectedCostasIds = [
    'ex_costas_puxada_alta_frontal',
    'ex_costas_remada_baixa_triangulo',
    'ex_costas_remada_articulada_maquina',
    'ex_costas_barra_fixa_graviton',
    'ex_costas_remada_curvada_barra',
    'ex_costas_remada_unilateral_halter',
    'ex_costas_pullover_polia',
    'ex_costas_remada_banco_inclinado',
  ];
  const newCostasIds = expectedCostasIds.slice(4);
  const costasExercises = DEFAULT_EXERCISES_CATALOG.filter(
    (ex) => ex.primaryMuscleGroup === 'costas'
  );
  const costasExpansionOk =
    costasExercises.length === 8 &&
    expectedCostasIds.every((id, idx) => costasExercises[idx]?.id === id) &&
    newCostasIds.every((id) => {
      const ex = getExerciseById(id);
      return (
        ex.primaryMuscleGroup === 'costas' &&
        ex.secondaryMuscleGroups.length >= 1 &&
        ex.executionSteps.length === 4 &&
        ex.compatibleEquipmentIds.length >= 1 &&
        ex.equipmentAlternatives.length >= 1
      );
    });

  assert(
    costasExpansionOk,
    'TESTE 01B',
    'Expansão do Grupo Muscular Costas (4 Originais Preservados + 4 Novos com 4 Passos de Execução = 8)',
    `Exercícios de Costas verificados: ${costasExercises.map((e) => e.id).join(', ')}.`
  );

  // Verificação específica da expansão de Pernas (Quadríceps: 4, Posterior de coxa: 5, Glúteos: 3, Panturrilhas: 4)
  const expectedPosteriorIds = [
    'ex_posterior_mesa_flexora',
    'ex_posterior_cadeira_flexora',
    'ex_posterior_stiff_barra',
    'ex_posterior_cadeira_flexora_unilateral',
    'ex_posterior_terra_romeno_unilateral_halter',
  ];
  const expectedPanturrilhasIds = [
    'ex_panturrilhas_em_pe_maquina',
    'ex_panturrilhas_sentado_maquina',
    'ex_panturrilhas_leg_press',
    'ex_panturrilhas_unilateral_em_pe_maquina',
  ];
  const quadricepsExercises = DEFAULT_EXERCISES_CATALOG.filter(
    (ex) => ex.primaryMuscleGroup === 'quadriceps'
  );
  const posteriorExercises = DEFAULT_EXERCISES_CATALOG.filter(
    (ex) => ex.primaryMuscleGroup === 'posterior_coxa'
  );
  const gluteosExercises = DEFAULT_EXERCISES_CATALOG.filter(
    (ex) => ex.primaryMuscleGroup === 'gluteos'
  );
  const panturrilhasExercises = DEFAULT_EXERCISES_CATALOG.filter(
    (ex) => ex.primaryMuscleGroup === 'panturrilhas'
  );

  const newLegsSpecs = [
    {
      id: 'ex_posterior_cadeira_flexora_unilateral',
      group: 'posterior_coxa',
      equipmentId: 'std_legs_cadeira_flexora',
    },
    {
      id: 'ex_posterior_terra_romeno_unilateral_halter',
      group: 'posterior_coxa',
      equipmentId: 'std_general_halteres',
    },
    {
      id: 'ex_panturrilhas_leg_press',
      group: 'panturrilhas',
      equipmentId: 'std_legs_leg_press_45',
    },
    {
      id: 'ex_panturrilhas_unilateral_em_pe_maquina',
      group: 'panturrilhas',
      equipmentId: 'std_legs_panturrilha_em_pe',
    },
  ];

  const legsExpansionOk =
    quadricepsExercises.length === 4 &&
    posteriorExercises.length === 5 &&
    gluteosExercises.length === 3 &&
    panturrilhasExercises.length === 4 &&
    expectedPosteriorIds.every((id, idx) => posteriorExercises[idx]?.id === id) &&
    expectedPanturrilhasIds.every((id, idx) => panturrilhasExercises[idx]?.id === id) &&
    newLegsSpecs.every((spec) => {
      const ex = getExerciseById(spec.id);
      return (
        ex.primaryMuscleGroup === spec.group &&
        ex.executionSteps.length === 4 &&
        ex.commonMistakes.length === 3 &&
        ex.safetyTips.length === 2 &&
        ex.compatibleEquipmentIds.length === 1 &&
        ex.compatibleEquipmentIds[0] === spec.equipmentId &&
        ex.equipmentAlternatives.length === 1 &&
        ex.equipmentAlternatives[0].length === 1 &&
        ex.equipmentAlternatives[0][0] === spec.equipmentId
      );
    });

  assert(
    legsExpansionOk,
    'TESTE 01C',
    'Expansão do Catálogo de Pernas (Quadríceps: 4, Posterior de coxa: 5, Glúteos: 3, Panturrilhas: 4)',
    `Novos exercícios de pernas validados: ${newLegsSpecs.map((s) => s.id).join(', ')}.`
  );

  // Verificação específica da expansão de Peito (4 originais preservados + 4 novos = 8 exercícios)
  const expectedPeitoIds = [
    'ex_peito_supino_reto_barra',
    'ex_peito_supino_inclinado_halteres',
    'ex_peito_crucifixo_peck_deck',
    'ex_peito_crossover_polia_alta',
    'ex_peito_supino_reto_halteres',
    'ex_peito_supino_inclinado_barra',
    'ex_peito_crucifixo_reto_halteres',
    'ex_peito_flexao_bracos',
  ];
  const peitoExercises = DEFAULT_EXERCISES_CATALOG.filter(
    (ex) => ex.primaryMuscleGroup === 'peito'
  );
  const exSupinoRetoHalteres = getExerciseById('ex_peito_supino_reto_halteres');
  const exSupinoInclinadoBarra = getExerciseById('ex_peito_supino_inclinado_barra');
  const exCrucifixoRetoHalteres = getExerciseById('ex_peito_crucifixo_reto_halteres');
  const exPeitoFlexaoBracos = getExerciseById('ex_peito_flexao_bracos');

  const peitoNewExercisesStructureOk = [
    exSupinoRetoHalteres,
    exSupinoInclinadoBarra,
    exCrucifixoRetoHalteres,
    exPeitoFlexaoBracos,
  ].every(
    (ex) =>
      ex.primaryMuscleGroup === 'peito' &&
      ex.secondaryMuscleGroups.length >= 1 &&
      ex.executionSteps.length === 4 &&
      ex.commonMistakes.length === 3 &&
      ex.safetyTips.length === 2 &&
      ex.shortDescription.trim().length >= 20 &&
      ex.initialPosition.trim().length >= 20 &&
      typeof ex.breathingGuide === 'string' &&
      ex.breathingGuide.trim().length >= 15
  );

  const peitoEquipmentRulesOk =
    // A. Supino reto com halteres: obrigatoriamente halteres E banco reto
    JSON.stringify(exSupinoRetoHalteres.equipmentAlternatives) ===
      JSON.stringify([['std_general_halteres', 'std_general_bancos_retos']]) &&
    isExerciseCompatibleWithGym(exSupinoRetoHalteres, new Set(['std_general_halteres'])) === false &&
    isExerciseCompatibleWithGym(exSupinoRetoHalteres, new Set(['std_general_bancos_retos'])) === false &&
    isExerciseCompatibleWithGym(
      exSupinoRetoHalteres,
      new Set(['std_general_halteres', 'std_general_bancos_retos'])
    ) === true &&
    // B. Supino inclinado com barra: std_chest_supino_inclinado_barra OU barra reta + banco regulável + anilhas
    JSON.stringify(exSupinoInclinadoBarra.equipmentAlternatives) ===
      JSON.stringify([
        ['std_chest_supino_inclinado_barra'],
        ['std_general_barras_retas', 'std_general_bancos_regulaveis', 'std_general_anilhas'],
      ]) &&
    isExerciseCompatibleWithGym(
      exSupinoInclinadoBarra,
      new Set(['std_chest_supino_inclinado_barra'])
    ) === true &&
    isExerciseCompatibleWithGym(
      exSupinoInclinadoBarra,
      new Set(['std_general_barras_retas', 'std_general_bancos_regulaveis'])
    ) === false &&
    isExerciseCompatibleWithGym(
      exSupinoInclinadoBarra,
      new Set(['std_general_barras_retas', 'std_general_bancos_regulaveis', 'std_general_anilhas'])
    ) === true &&
    // C. Crucifixo reto com halteres: obrigatoriamente halteres E banco reto
    JSON.stringify(exCrucifixoRetoHalteres.equipmentAlternatives) ===
      JSON.stringify([['std_general_halteres', 'std_general_bancos_retos']]) &&
    isExerciseCompatibleWithGym(exCrucifixoRetoHalteres, new Set(['std_general_halteres'])) === false &&
    isExerciseCompatibleWithGym(
      exCrucifixoRetoHalteres,
      new Set(['std_general_halteres', 'std_general_bancos_retos'])
    ) === true &&
    // D. Flexão de braços: peso corporal sem equipamento obrigatório
    exPeitoFlexaoBracos.isBodyweight === true &&
    exPeitoFlexaoBracos.canExecuteWithoutEquipment === true &&
    exPeitoFlexaoBracos.compatibleEquipmentIds.length === 0 &&
    exPeitoFlexaoBracos.equipmentAlternatives.length === 0 &&
    isExerciseCompatibleWithGym(exPeitoFlexaoBracos, new Set()) === true;

  assert(
    peitoExercises.length === 8 &&
      expectedPeitoIds.every((id, idx) => peitoExercises[idx]?.id === id) &&
      peitoNewExercisesStructureOk &&
      peitoEquipmentRulesOk,
    'TESTE 01D',
    'Expansão do Catálogo de Peito (4 Originais Preservados + 4 Novos = 8 Exercícios e Regras de Compatibilidade)',
    `Exercícios de Peito verificados: ${peitoExercises.map((e) => e.id).join(', ')}.`
  );

  // ===========================================================================
  // TESTE 02: Campos obrigatórios, instruções completas e equipmentAlternatives válidas
  // ===========================================================================
  const entryValidations = DEFAULT_EXERCISES_CATALOG.map((ex) =>
    validateExerciseCatalogEntry(ex, validEquipmentIdsSet)
  );
  const allEntriesValid = entryValidations.every((v) => v.valid);
  const allHaveCompleteInstructions = DEFAULT_EXERCISES_CATALOG.every(
    (ex) =>
      typeof ex.name === 'string' &&
      ex.name.trim().length >= 3 &&
      typeof ex.shortDescription === 'string' &&
      ex.shortDescription.trim().length >= 20 &&
      typeof ex.initialPosition === 'string' &&
      ex.initialPosition.trim().length >= 20 &&
      Array.isArray(ex.executionSteps) &&
      ex.executionSteps.length >= 3 &&
      typeof ex.breathingGuide === 'string' &&
      ex.breathingGuide.trim().length >= 15 &&
      Array.isArray(ex.commonMistakes) &&
      ex.commonMistakes.length >= 2 &&
      Array.isArray(ex.safetyTips) &&
      ex.safetyTips.length >= 2 &&
      Array.isArray(ex.equipmentAlternatives) &&
      (ex.equipmentAlternatives.length >= 1 || ex.canExecuteWithoutEquipment === true)
  );

  assert(
    allEntriesValid && allHaveCompleteInstructions,
    'TESTE 02',
    'Validação de Campos Obrigatórios, Alternativas de Equipamentos e Instruções Completas',
    `Todos os ${DEFAULT_EXERCISES_CATALOG.length} exercícios possuem instruções completas e equipmentAlternatives consistentes com compatibleEquipmentIds.`
  );

  // ===========================================================================
  // TESTE 03: Grupos musculares válidos e cobertura dos 11 grupos oficiais
  // ===========================================================================
  const expectedMuscleGroups = [
    'peito',
    'costas',
    'ombros',
    'biceps',
    'triceps',
    'quadriceps',
    'posterior_coxa',
    'gluteos',
    'panturrilhas',
    'abdomen_core',
    'corpo_inteiro',
  ];
  const exact11GroupsOrder =
    ORDERED_MUSCLE_GROUPS.length === 11 &&
    expectedMuscleGroups.every((g, i) => ORDERED_MUSCLE_GROUPS[i] === g);

  const countsByGroup = getExerciseCountByMuscleGroup(DEFAULT_EXERCISES_CATALOG);
  const everyGroupHasExercises = ORDERED_MUSCLE_GROUPS.every(
    (g) => countsByGroup[g] >= 2
  );
  const allPrimaryAndSecondaryGroupsValid = DEFAULT_EXERCISES_CATALOG.every(
    (ex) =>
      ORDERED_MUSCLE_GROUPS.includes(ex.primaryMuscleGroup) &&
      ex.secondaryMuscleGroups.every(
        (sec) =>
          ORDERED_MUSCLE_GROUPS.includes(sec) && sec !== ex.primaryMuscleGroup
      )
  );

  const distributionSummary = ORDERED_MUSCLE_GROUPS.map(
    (g) => `${MUSCLE_GROUP_LABELS[g]}: ${countsByGroup[g]}`
  ).join(' | ');

  assert(
    exact11GroupsOrder && everyGroupHasExercises && allPrimaryAndSecondaryGroupsValid,
    'TESTE 03',
    'Grupos Musculares Válidos e Distribuição nos 11 Grupos Oficiais',
    distributionSummary
  );

  // ===========================================================================
  // TESTE 04: Compatibilidade com IDs reais do catálogo de equipamentos e personalizados explícitos
  // ===========================================================================
  const allCompatibleIdsExistInCatalog = DEFAULT_EXERCISES_CATALOG.every(
    (ex) =>
      (ex.compatibleEquipmentIds.length > 0 || ex.canExecuteWithoutEquipment === true) &&
      ex.compatibleEquipmentIds.every((eqId) => validEquipmentIdsSet.has(eqId)) &&
      ex.equipmentAlternatives.every(
        (alt) => alt.length > 0 && alt.every((eqId) => validEquipmentIdsSet.has(eqId))
      )
  );

  const sampleExercise = getExerciseById('ex_peito_supino_reto_barra');
  const sampleCustomEquipments = [
    {
      id: 'custom_supino_hammer_1',
      name: 'Supino reto com barra articulado personalizado',
      category: 'chest',
      isCustom: true,
      isSelected: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'custom_outro_2',
      name: 'Aparelho personalizado sem vínculo',
      category: 'chest',
      isCustom: true,
      isSelected: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const resolvedWithoutExplicitLink = resolveCompatibleEquipmentsForExercise(
    sampleExercise,
    sampleCustomEquipments,
    {}
  );
  const noUnlinkedCustomAppears = resolvedWithoutExplicitLink.every((eq) => !eq.isCustom);

  const resolvedWithExplicitLink = resolveCompatibleEquipmentsForExercise(
    sampleExercise,
    sampleCustomEquipments,
    { [sampleExercise.id]: ['custom_supino_hammer_1'] }
  );
  const explicitCustomAppearsCorrectly =
    resolvedWithExplicitLink.some((eq) => eq.id === 'custom_supino_hammer_1' && eq.isCustom) &&
    !resolvedWithExplicitLink.some((eq) => eq.id === 'custom_outro_2');

  assert(
    allCompatibleIdsExistInCatalog &&
      noUnlinkedCustomAppears &&
      explicitCustomAppearsCorrectly,
    'TESTE 04',
    'Compatibilidade com IDs Reais do Catálogo de 54 Equipamentos e Regra Estrita de Personalizados',
    '100% dos exercícios referenciam IDs reais do catálogo padrão e personalizados aparecem somente mediante vínculo explícito.'
  );

  // ===========================================================================
  // TESTE 05: Ausência de referências a equipamentos inexistentes e detecção ativa de IDs inválidos
  // ===========================================================================
  const orphanEquipmentRefs = [];
  for (const ex of DEFAULT_EXERCISES_CATALOG) {
    for (const eqId of ex.compatibleEquipmentIds) {
      if (!validEquipmentIdsSet.has(eqId)) {
        orphanEquipmentRefs.push(`${ex.id} -> ${eqId}`);
      }
    }
    for (const alt of ex.equipmentAlternatives) {
      for (const eqId of alt) {
        if (!validEquipmentIdsSet.has(eqId)) {
          orphanEquipmentRefs.push(`${ex.id} (alt) -> ${eqId}`);
        }
      }
    }
  }

  const fakeExerciseWithInvalidEq = {
    ...DEFAULT_EXERCISES_CATALOG[0],
    id: 'ex_teste_invalido',
    compatibleEquipmentIds: ['std_equipamento_fantasma_inexistente'],
    equipmentAlternatives: [['std_equipamento_fantasma_inexistente']],
  };
  const invalidEqValidation = validateExerciseCatalogEntry(
    fakeExerciseWithInvalidEq,
    validEquipmentIdsSet
  );

  assert(
    orphanEquipmentRefs.length === 0 && invalidEqValidation.valid === false,
    'TESTE 05',
    'Ausência de Referências a Equipamentos Inexistentes e Rejeição de Órfãos',
    `Nenhuma referência órfã encontrada em compatibleEquipmentIds ou equipmentAlternatives (0/${DEFAULT_EXERCISES_CATALOG.length}) e detector rejeita IDs inexistentes.`
  );

  // ===========================================================================
  // TESTE 06: Pesquisa por nome (case-insensitive, sem acentos, parcial e sem resultados)
  // ===========================================================================
  const searchSupino = filterExercisesCatalog(DEFAULT_EXERCISES_CATALOG, {
    searchQuery: 'SUPINO',
  });
  const searchElevacaoSemAcento = filterExercisesCatalog(DEFAULT_EXERCISES_CATALOG, {
    searchQuery: 'elevacao pelvica',
  });
  const searchPanturrilha = filterExercisesCatalog(DEFAULT_EXERCISES_CATALOG, {
    searchQuery: '  panturrilha ',
  });
  const searchInexistente = filterExercisesCatalog(DEFAULT_EXERCISES_CATALOG, {
    searchQuery: 'exercicio_inexistente_xyz_999',
  });

  assert(
    searchSupino.length === 4 &&
      searchSupino.every((ex) => ex.name.toLowerCase().includes('supino')) &&
      searchElevacaoSemAcento.length === 1 &&
      searchElevacaoSemAcento[0].id === 'ex_gluteos_elevacao_pelvica_maquina' &&
      searchPanturrilha.length === 4 &&
      searchInexistente.length === 0,
    'TESTE 06',
    'Pesquisa por Nome do Exercício (Maiúsculas/Minúsculas, Acentos e Termos Parciais)',
    `Resultados: "SUPINO"=${searchSupino.length}, "elevacao pelvica"=${searchElevacaoSemAcento.length}, "panturrilha"=${searchPanturrilha.length}, inexistente=0.`
  );

  // ===========================================================================
  // TESTE 07: Filtros por grupo muscular e combinação com pesquisa e academia
  // ===========================================================================
  let allGroupFiltersAccurate = true;
  for (const group of ORDERED_MUSCLE_GROUPS) {
    const filteredByGroup = filterExercisesCatalog(DEFAULT_EXERCISES_CATALOG, {
      muscleGroup: group,
    });
    if (
      filteredByGroup.length !== countsByGroup[group] ||
      !filteredByGroup.every((ex) => ex.primaryMuscleGroup === group)
    ) {
      allGroupFiltersAccurate = false;
    }
  }

  const combinedBackPull = filterExercisesCatalog(DEFAULT_EXERCISES_CATALOG, {
    muscleGroup: 'costas',
    searchQuery: 'remada',
  });

  const mockGymSelection = new Set(['std_legs_cadeira_extensora']);
  const filteredByGymQuadriceps = filterExercisesCatalog(DEFAULT_EXERCISES_CATALOG, {
    muscleGroup: 'quadriceps',
    onlyAvailableInGym: true,
    selectedEquipmentIds: mockGymSelection,
  });

  assert(
    allGroupFiltersAccurate &&
      countsByGroup.costas === 8 &&
      combinedBackPull.length === 5 &&
      filteredByGymQuadriceps.length === 1 &&
      filteredByGymQuadriceps[0].id === 'ex_quadriceps_cadeira_extensora',
    'TESTE 07',
    'Filtros por Grupo Muscular, Pesquisa Combinada e Disponibilidade na Academia',
    'Todos os 11 filtros de grupo muscular (incluindo Costas com 8 exercícios e 5 variações de remada) e filtros combinados retornaram subconjuntos exatos.'
  );

  // ===========================================================================
  // TESTE 08: Exibição completa dos detalhes do exercício (10 seções obrigatórias)
  // ===========================================================================
  const detailViewModels = DEFAULT_EXERCISES_CATALOG.map((ex) =>
    buildExerciseDetailViewModel(
      ex,
      [],
      new Set(['std_chest_supino_reto_barra', 'std_legs_leg_press_45'])
    )
  );
  const allDetailsComplete = detailViewModels.every(
    (vm) =>
      vm.name.length > 0 &&
      vm.primaryMuscleLabel.length > 0 &&
      (vm.illustrationMode === 'specific' || vm.illustrationMode === 'placeholder') &&
      ((vm.compatibleEquipments.length > 0 && vm.equipmentAlternatives.length > 0) ||
        vm.canExecuteWithoutEquipment === true) &&
      vm.shortDescription.length >= 20 &&
      vm.initialPosition.length >= 20 &&
      vm.executionSteps.length >= 3 &&
      typeof vm.breathingGuide === 'string' &&
      vm.breathingGuide.length >= 15 &&
      vm.commonMistakes.length >= 2 &&
      vm.safetyTips.length >= 2 &&
      (vm.hasValidExternalVideo
        ? Boolean(vm.validatedVideoUrl) && vm.videoUnavailableReason === null
        : vm.validatedVideoUrl === null && Boolean(vm.videoUnavailableReason))
  );

  assert(
    allDetailsComplete && detailViewModels.length === 48,
    'TESTE 08',
    'Exibição Completa dos Detalhes do Exercício (10 Itens Estruturais + Alternativas)',
    'Todos os 48 exercícios geram modelo completo de detalhes com instruções, respiração, erros comuns, segurança e alternativas de equipamentos.'
  );

  // ===========================================================================
  // TESTE 09: Tratamento de imagem demonstrativa e imagem ausente (Paridade estrita SVG vs Placeholder)
  // ===========================================================================
  const illustrationSource = fs.readFileSync(
    new URL('../src/components/exercises/ExerciseIllustration.tsx', import.meta.url),
    'utf8'
  );
  const stdExerciseSvgSlice = illustrationSource.slice(
    illustrationSource.indexOf('export const StandardExerciseSvg'),
    illustrationSource.indexOf('export const ExerciseIllustration:')
  );
  const sourceSpecificExerciseIds = new Set(
    [...stdExerciseSvgSlice.matchAll(/if\s*\(\s*id\s*===\s*'([^']+)'\s*\)/g)].map(
      (m) => m[1]
    )
  );

  const visualAudit = DEFAULT_EXERCISES_CATALOG.map((ex) => {
    const classification = classifyExerciseIllustration(ex.id, ex.name);
    const rendered = StandardExerciseSvg({
      id: ex.id,
      name: ex.name,
      muscleGroup: ex.primaryMuscleGroup,
      size: 'lg',
    });
    const actualMode = rendered.props?.['data-render-mode'];
    const actualTemplate = rendered.props?.['data-template-id'];
    const hasBranchInSource = sourceSpecificExerciseIds.has(ex.id);

    const modeMatches = classification.renderMode === actualMode;
    const templateMatches = classification.templateId === actualTemplate;
    const branchMatches =
      (classification.renderMode === 'specific' &&
        hasBranchInSource &&
        rendered.type === 'svg') ||
      (classification.renderMode === 'placeholder' &&
        !hasBranchInSource &&
        rendered.type === 'div' &&
        extractReactText(rendered).includes(ex.name) &&
        extractReactText(rendered).includes('Ilustração específica não disponível'));

    return {
      ex,
      classification,
      rendered,
      ok: modeMatches && templateMatches && branchMatches,
    };
  });

  const specificIllustrationItems = visualAudit.filter(
    (x) => x.classification.renderMode === 'specific'
  );
  const placeholderIllustrationItems = visualAudit.filter(
    (x) => x.classification.renderMode === 'placeholder'
  );

  assert(
    visualAudit.every((x) => x.ok) &&
      SPECIFIC_ILLUSTRATION_EXERCISE_IDS.length === 26 &&
      sourceSpecificExerciseIds.size === 26 &&
      specificIllustrationItems.length === 26 &&
      placeholderIllustrationItems.length === 22,
    'TESTE 09',
    'Tratamento de Imagem Demonstrativa e Placeholder Nominal quando Ausente (Sem Divergência)',
    `SVGs específicos implementados (id === '...'): ${specificIllustrationItems.length}/48 | Placeholders nominais honestos quando sem imagem específica: ${placeholderIllustrationItems.length}/48.`
  );

  // TESTE 09C: imagens 3D do grupo Peito devem estar registradas e presentes em disco para os 8 exercícios oficiais.
  const expectedPeitoWebpIds = [
    'ex_peito_supino_reto_barra',
    'ex_peito_supino_inclinado_halteres',
    'ex_peito_crucifixo_peck_deck',
    'ex_peito_crossover_polia_alta',
    'ex_peito_supino_reto_halteres',
    'ex_peito_supino_inclinado_barra',
    'ex_peito_crucifixo_reto_halteres',
    'ex_peito_flexao_bracos',
  ];
  const peitoVisualMapOk = expectedPeitoWebpIds.every((id) => {
    const fileUrl = new URL(`../public/images/exercises/${id}.webp`, import.meta.url);
    const existsAndNonEmpty = fs.existsSync(fileUrl) && fs.statSync(fileUrl).size > 5000;
    const mappedInComponent =
      illustrationSource.includes(`${id}: '/images/exercises/${id}.webp'`) &&
      illustrationSource.includes('object-contain');
    return existsAndNonEmpty && mappedInComponent;
  });
  assert(
    peitoVisualMapOk && expectedPeitoWebpIds.length === 8,
    'TESTE 09C',
    'Imagens 3D do grupo Peito registradas e presentes em disco para os 8 exercícios oficiais',
    `Todos os 8 arquivos .webp de Peito verificados em public/images/exercises/ e mapeados com object-contain: ${peitoVisualMapOk}`
  );

  // TESTE 09D: imagens 3D do lote Costas devem estar registradas e presentes em public/images/exercises/ para todos os 8 exercícios de Costas.
  const expectedCostasWebpIds = [
    'ex_costas_puxada_alta_frontal',
    'ex_costas_remada_baixa_triangulo',
    'ex_costas_remada_articulada_maquina',
    'ex_costas_barra_fixa_graviton',
    'ex_costas_remada_curvada_barra',
    'ex_costas_remada_unilateral_halter',
    'ex_costas_pullover_polia',
    'ex_costas_remada_banco_inclinado',
  ];
  const costasVisualMapOk = expectedCostasWebpIds.every((id) => {
    const fileUrl = new URL(`../public/images/exercises/${id}.webp`, import.meta.url);
    const existsAndNonEmpty = fs.existsSync(fileUrl) && fs.statSync(fileUrl).size > 5000;
    const mappedInComponent =
      illustrationSource.includes(`${id}: '/images/exercises/${id}.webp'`) &&
      illustrationSource.includes('object-contain');
    return existsAndNonEmpty && mappedInComponent;
  });
  assert(
    costasVisualMapOk && expectedCostasWebpIds.length === 8,
    'TESTE 09D',
    'Imagens 3D do Lote Costas registradas e presentes em disco para os 8 exercícios oficiais',
    `Todos os 8 arquivos .webp de Costas verificados em public/images/exercises/ e mapeados com object-contain: ${costasVisualMapOk}`
  );

  // TESTE 09B: A imagem 3D aprovada deve ser usada em todos os tamanhos de apresentação.
  const hasUnrestricted3DExerciseImage =
    (/exerciseId\s*===\s*'ex_peito_supino_inclinado_halteres'\s*\?/.test(illustrationSource) ||
      illustrationSource.includes('ex_peito_supino_inclinado_halteres:')) &&
    illustrationSource.includes('ex_peito_supino_inclinado_halteres.webp') &&
    illustrationSource.includes('object-contain');
  assert(
    hasUnrestricted3DExerciseImage &&
      !/size\s*===\s*'lg'/.test(
        illustrationSource.slice(illustrationSource.indexOf('export const ExerciseIllustration'))
      ),
    'TESTE 09B',
    'Imagem 3D do Supino inclinado disponível em miniaturas e detalhes',
    `Regra de renderização sem restrição por tamanho: ${hasUnrestricted3DExerciseImage}`
  );

  // ===========================================================================
  // TESTE 10: Validação estrutural de URL vs Verificação de Destino Remoto dos Links Externos
  // ===========================================================================
  // NOTA DE AUDITORIA: `validateExternalVideoUrl()` realiza apenas validação sintática/estrutural
  // da URL (HTTPS, domínio permitido, caminho não vazio) e NÃO comprova que a página remota
  // existe ou que o conteúdo corresponde ao exercício.
  // Os 26 links exrx.net configurados possuem estrutura de URL válida, mas retornaram HTTP 403
  // na verificação individual de destino remoto e, portanto, são marcados com `externalVideoVerified: false`
  // e NÃO são apresentados como demonstração validada na interface (`hasValidExternalVideo === false`).
  const exercisesWithStructurallyValidUrl = DEFAULT_EXERCISES_CATALOG.filter(
    (ex) => validateExternalVideoUrl(ex.externalVideoUrl).valid
  );
  const exercisesWithoutConfiguredUrl = DEFAULT_EXERCISES_CATALOG.filter(
    (ex) => ex.externalVideoUrl === undefined
  );
  const exercisesPresentedAsVerifiedVideo = DEFAULT_EXERCISES_CATALOG.filter(
    (ex) => isExternalVideoVerifiedAndValid(ex)
  );
  const allUnconfirmedLinksNotPresentedAsValidated = exercisesWithStructurallyValidUrl.every(
    (ex) => {
      const vm = buildExerciseDetailViewModel(ex);
      return (
        ex.externalVideoVerified === false &&
        vm.isVideoUrlStructurallyValid === true &&
        vm.videoVerificationStatus === 'unverified' &&
        vm.hasValidExternalVideo === false &&
        vm.validatedVideoUrl === null &&
        Boolean(vm.videoUnavailableReason)
      );
    }
  );

  const invalidVideoSamples = [
    undefined,
    null,
    '',
    '   ',
    'not-a-url',
    'http://exrx.net/WeightExercises/PectoralSternal/BBBenchPress',
    'javascript:alert(1)',
    'https://dominio-nao-verificado-falso.com/video/123',
    'https://www.youtube.com/watch',
    'https://exrx.net/',
  ];
  const allInvalidVideosRejected = invalidVideoSamples.every(
    (sample) => validateExternalVideoUrl(sample).valid === false
  );

  const modelWithConfirmedVerifiedVideo = buildExerciseDetailViewModel({
    ...DEFAULT_EXERCISES_CATALOG[0],
    externalVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    externalVideoVerified: true,
  });

  assert(
    exercisesWithStructurallyValidUrl.length === 26 &&
      exercisesWithoutConfiguredUrl.length === 22 &&
      exercisesPresentedAsVerifiedVideo.length === 0 &&
      allUnconfirmedLinksNotPresentedAsValidated &&
      allInvalidVideosRejected &&
      modelWithConfirmedVerifiedVideo.hasValidExternalVideo === true &&
      modelWithConfirmedVerifiedVideo.videoVerificationStatus === 'verified',
    'TESTE 10',
    'Distinção entre Validação Estrutural de URL e Destino Remoto Não Verificado',
    `URLs estruturalmente válidas mas com destino remoto não confirmado (HTTP 403): ${exercisesWithStructurallyValidUrl.length}/48 (tratadas como não verificadas, 0 apresentadas como validadas) | Sem link configurado: ${exercisesWithoutConfiguredUrl.length}/48.`
  );

  // ===========================================================================
  // TESTE 11: Escopo do Teste Automatizado Node.js (Catálogo Estático Local e SVGs sem Rede)
  // ===========================================================================
  // NOTA DE ESCOPO: Este teste automatizado em Node.js comprova exclusivamente que os dados
  // da biblioteca estão em estruturas estáticas locais em TypeScript e que os componentes SVG
  // e placeholders renderizam localmente sem disparar requisições de rede para imagens externas.
  // A validação de Service Worker e modo avião real depende de execução em navegador/dispositivo.
  const noExternalImageUrlsInCatalog = DEFAULT_EXERCISES_CATALOG.every(
    (ex) => !('imageUrl' in ex) && (!ex.illustrationId || ex.illustrationId.startsWith('svg_exercise_'))
  );
  const allIllustrationsRenderLocallyWithoutNetwork = DEFAULT_EXERCISES_CATALOG.every((ex) => {
    const el = StandardExerciseSvg({
      id: ex.id,
      name: ex.name,
      muscleGroup: ex.primaryMuscleGroup,
      size: 'md',
    });
    return el && (el.type === 'svg' || el.type === 'div');
  });

  assert(
    noExternalImageUrlsInCatalog && allIllustrationsRenderLocallyWithoutNetwork,
    'TESTE 11',
    'Catálogo Estático Local e Renderização de Ilustrações SVG/Placeholders sem Requisição de Rede (Escopo Node.js)',
    'Dados em estruturas estáticas locais e 48 ilustrações/placeholders renderizados em memória sem dependência de URLs externas de imagem.'
  );

  // ===========================================================================
  // TESTE 12: Preservação integral dos CHECKPOINTS 01 e 02 (Bancos, 7 Stores, 54 Equipamentos e Mídia)
  // ===========================================================================
  const cpDbFactory = new IDBFactory();
  const cpDb = new FitAppDB(cpDbFactory);
  const cpMediaDb = new MediaDB(cpDbFactory);

  const rawDb = await cpDb.getDB();
  const storeNames = Array.from(rawDb.objectStoreNames);
  const storesIntact =
    rawDb.name === DB_NAME &&
    storeNames.length === 7 &&
    REQUIRED_STORES.every((s) => storeNames.includes(s));

  await cpDb.saveProfile({
    id: 'current_user',
    name: 'Atleta Checkpoint 03',
    gymName: 'Academia Homologada',
    updatedAt: new Date().toISOString(),
  });
  await cpDb.saveEquipment({
    id: 'std_chest_supino_reto_barra',
    name: 'Supino reto com barra',
    category: 'chest',
    isCustom: false,
    isSelected: true,
    createdAt: new Date().toISOString(),
  });

  const savedProfile = await cpDb.getProfile();
  const savedEquipments = await cpDb.getEquipments();
  cpDb.closeConnection();
  cpMediaDb.closeConnection();

  assert(
    storesIntact &&
      DEFAULT_EQUIPMENTS_CATALOG.length === 54 &&
      savedProfile?.name === 'Atleta Checkpoint 03' &&
      savedEquipments.length === 1 &&
      isExerciseCompatibleWithGym(
        DEFAULT_EXERCISES_CATALOG[0],
        new Set(savedEquipments.map((e) => e.id))
      ) === true,
    'TESTE 12',
    'Preservação Integral dos CHECKPOINTS 01 e 02 (fit_app_db, 7 Tabelas e 54 Equipamentos)',
    'Banco fit_app_db com 7 stores intactas, catálogo de 54 equipamentos preservado e integrado à biblioteca.'
  );

  // ===========================================================================
  // CENÁRIOS OBRIGATÓRIOS DE COMPATIBILIDADE DE EQUIPAMENTOS E PESO CORPORAL (SEÇÃO 4)
  // ===========================================================================
  console.log('\n--------------------------------------------------------------------------------');
  console.log('AUDITORIA DE COMPATIBILIDADE DE COMBINAÇÕES (AND), ALTERNATIVAS (OR) E PESO CORPORAL');
  console.log('--------------------------------------------------------------------------------\n');

  const exSupinoReto = getExerciseById('ex_peito_supino_reto_barra');
  const exSupinoInclinado = getExerciseById('ex_peito_supino_inclinado_halteres');
  const exAgachamentoLivre = getExerciseById('ex_quadriceps_agachamento_livre');
  const exTricepsTesta = getExerciseById('ex_triceps_testa_barra_w');
  const exStiff = getExerciseById('ex_posterior_stiff_barra');
  const exBarraFixa = getExerciseById('ex_costas_barra_fixa_graviton');
  const exElevacaoPernasBarra = getExerciseById('ex_abdomen_infra_barra_fixa');
  const exPrancha = getExerciseById('ex_abdomen_prancha_isometrica');
  const exAbdominalSupra = getExerciseById('ex_abdomen_supra_solo');
  const exFlexaoSolo = getExerciseById('ex_corpo_inteiro_flexao_bracos_solo');

  // 1. Supino reto: apenas barra selecionada -> indisponível
  const supinoRetoOnlyBar = isExerciseCompatibleWithGym(
    exSupinoReto,
    new Set(['std_general_barras_retas'])
  );
  assert(
    supinoRetoOnlyBar === false,
    'COMPAT 01',
    'Supino reto com barra: apenas barra reta selecionada -> indisponível',
    `isExerciseCompatibleWithGym(['std_general_barras_retas']) === ${supinoRetoOnlyBar}`
  );

  // 2. Supino reto: apenas banco selecionado -> indisponível
  const supinoRetoOnlyBench = isExerciseCompatibleWithGym(
    exSupinoReto,
    new Set(['std_general_bancos_retos'])
  );
  const supinoRetoBarAndBenchNoPlates = isExerciseCompatibleWithGym(
    exSupinoReto,
    new Set(['std_general_barras_retas', 'std_general_bancos_retos'])
  );
  assert(
    supinoRetoOnlyBench === false && supinoRetoBarAndBenchNoPlates === false,
    'COMPAT 02',
    'Supino reto com barra: apenas banco reto selecionado (ou barra + banco sem anilhas) -> indisponível',
    `apenas banco=${supinoRetoOnlyBench} | barra+banco sem anilhas=${supinoRetoBarAndBenchNoPlates}`
  );

  // 3. Supino reto: combinação completa selecionada -> disponível
  const supinoRetoCompleteCombo = isExerciseCompatibleWithGym(
    exSupinoReto,
    new Set(['std_general_barras_retas', 'std_general_bancos_retos', 'std_general_anilhas'])
  );
  const supinoRetoCompleteStation = isExerciseCompatibleWithGym(
    exSupinoReto,
    new Set(['std_chest_supino_reto_barra'])
  );
  assert(
    supinoRetoCompleteCombo === true && supinoRetoCompleteStation === true,
    'COMPAT 03',
    'Supino reto com barra: combinação completa (barra reta + banco reto + anilhas) OU banco completo de supino -> disponível',
    `combinação completa (3 itens)=${supinoRetoCompleteCombo} | aparelho dedicado=${supinoRetoCompleteStation}`
  );

  // 4. Supino inclinado: apenas halteres sem banco regulável -> indisponível
  const supinoInclinadoOnlyDumbbells = isExerciseCompatibleWithGym(
    exSupinoInclinado,
    new Set(['std_general_halteres'])
  );
  const supinoInclinadoOnlyBench = isExerciseCompatibleWithGym(
    exSupinoInclinado,
    new Set(['std_general_bancos_regulaveis'])
  );
  assert(
    supinoInclinadoOnlyDumbbells === false && supinoInclinadoOnlyBench === false,
    'COMPAT 04',
    'Supino inclinado com halteres: apenas halteres sem banco regulável (ou apenas banco sem halteres) -> indisponível',
    `apenas halteres=${supinoInclinadoOnlyDumbbells} | apenas banco regulável=${supinoInclinadoOnlyBench}`
  );

  // 5. Supino inclinado: halteres + banco regulável -> disponível
  const supinoInclinadoComplete = isExerciseCompatibleWithGym(
    exSupinoInclinado,
    new Set(['std_general_halteres', 'std_general_bancos_regulaveis'])
  );
  assert(
    supinoInclinadoComplete === true,
    'COMPAT 05',
    'Supino inclinado com halteres: halteres + banco regulável selecionados -> disponível',
    `halteres + banco regulável=${supinoInclinadoComplete}`
  );

  // 6. Agachamento livre: apenas rack selecionado -> indisponível
  const agachamentoOnlyRack1 = isExerciseCompatibleWithGym(
    exAgachamentoLivre,
    new Set(['std_legs_agachamento_livre_rack'])
  );
  const agachamentoOnlyRack2 = isExerciseCompatibleWithGym(
    exAgachamentoLivre,
    new Set(['std_general_rack_agachamento'])
  );
  const agachamentoRackAndBarNoPlates = isExerciseCompatibleWithGym(
    exAgachamentoLivre,
    new Set(['std_legs_agachamento_livre_rack', 'std_general_barras_retas'])
  );
  assert(
    agachamentoOnlyRack1 === false &&
      agachamentoOnlyRack2 === false &&
      agachamentoRackAndBarNoPlates === false,
    'COMPAT 06',
    'Agachamento livre com barra: apenas rack selecionado (ou rack + barra sem anilhas) -> indisponível',
    `apenas gaiola=${agachamentoOnlyRack1} | apenas rack geral=${agachamentoOnlyRack2} | sem anilhas=${agachamentoRackAndBarNoPlates}`
  );

  // 7. Agachamento livre: combinação completa selecionada -> disponível (e validação de Tríceps testa e Stiff)
  const agachamentoComplete1 = isExerciseCompatibleWithGym(
    exAgachamentoLivre,
    new Set(['std_legs_agachamento_livre_rack', 'std_general_barras_retas', 'std_general_anilhas'])
  );
  const agachamentoComplete2 = isExerciseCompatibleWithGym(
    exAgachamentoLivre,
    new Set(['std_general_rack_agachamento', 'std_general_barras_retas', 'std_general_anilhas'])
  );
  const tricepsTestaIncomplete = isExerciseCompatibleWithGym(
    exTricepsTesta,
    new Set(['std_general_barras_w', 'std_general_bancos_retos'])
  );
  const tricepsTestaComplete = isExerciseCompatibleWithGym(
    exTricepsTesta,
    new Set(['std_general_barras_w', 'std_general_bancos_retos', 'std_general_anilhas'])
  );
  const stiffOnlyBar = isExerciseCompatibleWithGym(
    exStiff,
    new Set(['std_general_barras_retas'])
  );
  const stiffBarAndPlates = isExerciseCompatibleWithGym(
    exStiff,
    new Set(['std_general_barras_retas', 'std_general_anilhas'])
  );
  const stiffDumbbells = isExerciseCompatibleWithGym(
    exStiff,
    new Set(['std_general_halteres'])
  );

  assert(
    agachamentoComplete1 === true &&
      agachamentoComplete2 === true &&
      tricepsTestaIncomplete === false &&
      tricepsTestaComplete === true &&
      stiffOnlyBar === false &&
      stiffBarAndPlates === true &&
      stiffDumbbells === true,
    'COMPAT 07',
    'Agachamento livre, Tríceps testa e Stiff: combinações completas exigidas (AND) e alternativas independentes (OR)',
    `Agachamento completo=${agachamentoComplete1}/${agachamentoComplete2} | Tríceps testa (incompleto=${tricepsTestaIncomplete}, completo=${tricepsTestaComplete}) | Stiff (só barra=${stiffOnlyBar}, barra+anilhas=${stiffBarAndPlates}, halteres=${stiffDumbbells})`
  );

  // 8. Barra fixa: sem barra fixa e sem Graviton -> indisponível
  const barraFixaWithoutEquipment = isExerciseCompatibleWithGym(
    exBarraFixa,
    new Set()
  );
  const barraFixaWithUnrelatedEquipment = isExerciseCompatibleWithGym(
    exBarraFixa,
    new Set(['std_general_halteres', 'std_general_colchonetes'])
  );
  const elevacaoPernasWithoutBar = isExerciseCompatibleWithGym(
    exElevacaoPernasBarra,
    new Set()
  );
  assert(
    barraFixaWithoutEquipment === false &&
      barraFixaWithUnrelatedEquipment === false &&
      elevacaoPernasWithoutBar === false,
    'COMPAT 08',
    'Barra fixa e Elevação de pernas na barra fixa: sem barra fixa e sem Graviton -> indisponível',
    `Barra fixa sem aparelho=${barraFixaWithoutEquipment} | Elevação de pernas sem barra=${elevacaoPernasWithoutBar}`
  );

  // 9. Barra fixa: barra fixa selecionada -> disponível
  const barraFixaWithBar = isExerciseCompatibleWithGym(
    exBarraFixa,
    new Set(['std_back_barra_fixa'])
  );
  const elevacaoPernasWithBar = isExerciseCompatibleWithGym(
    exElevacaoPernasBarra,
    new Set(['std_back_barra_fixa'])
  );
  assert(
    barraFixaWithBar === true && elevacaoPernasWithBar === true,
    'COMPAT 09',
    'Barra fixa (e Elevação de pernas na barra): std_back_barra_fixa selecionada -> disponível',
    `Barra fixa=${barraFixaWithBar} | Elevação de pernas=${elevacaoPernasWithBar}`
  );

  // 10. Barra fixa: Graviton selecionado -> disponível
  const barraFixaWithGraviton = isExerciseCompatibleWithGym(
    exBarraFixa,
    new Set(['std_back_graviton'])
  );
  assert(
    barraFixaWithGraviton === true,
    'COMPAT 10',
    'Barra fixa: Graviton (std_back_graviton) selecionado -> disponível',
    `Barra fixa com Graviton=${barraFixaWithGraviton}`
  );

  // 11. Exercícios sem equipamento obrigatório (Prancha, Abdominal supra, Flexão no solo e Flexão de braços em Peito): disponíveis sem equipamentos
  const pranchaNoEquipment = isExerciseCompatibleWithGym(exPrancha, new Set());
  const supraNoEquipment = isExerciseCompatibleWithGym(exAbdominalSupra, new Set());
  const flexaoNoEquipment = isExerciseCompatibleWithGym(exFlexaoSolo, new Set());
  const peitoFlexaoNoEquipment = isExerciseCompatibleWithGym(exPeitoFlexaoBracos, new Set());
  const peitoFlexaoSummary = formatEquipmentAlternativesSummary(exPeitoFlexaoBracos);
  const peitoFlexaoModalVm = buildExerciseDetailViewModel(exPeitoFlexaoBracos, [], new Set());
  assert(
    pranchaNoEquipment === true &&
      supraNoEquipment === true &&
      flexaoNoEquipment === true &&
      peitoFlexaoNoEquipment === true &&
      peitoFlexaoSummary === 'Livre no solo (peso corporal)' &&
      peitoFlexaoModalVm.isAvailableInUserGym === true &&
      peitoFlexaoModalVm.canExecuteWithoutEquipment === true &&
      peitoFlexaoModalVm.isBodyweight === true,
    'COMPAT 11',
    'Exercícios sem equipamento obrigatório (incluindo ex_peito_flexao_bracos): disponíveis mesmo com academia vazia',
    `Prancha=${pranchaNoEquipment} | Abdominal supra=${supraNoEquipment} | Flexão solo=${flexaoNoEquipment} | Flexão de braços (Peito)=${peitoFlexaoNoEquipment} ("${peitoFlexaoSummary}")`
  );

  // 12. Equipamento personalizado sem vínculo explícito não habilita exercício (mesmo com mesmo nome e categoria)
  const customFlowDbFactory = new IDBFactory();
  const customFlowDb = new FitAppDB(customFlowDbFactory);

  const customUnlinkedItem = {
    id: 'custom_supino_hammer_1',
    name: 'Supino reto com barra', // Mesmo nome exato do exercício/aparelho
    category: 'chest',
    isCustom: true,
    isSelected: true,
    createdAt: new Date().toISOString(),
  };
  await customFlowDb.saveEquipment(customUnlinkedItem);

  let dbEquipments = await customFlowDb.getEquipments();
  let dbCustomEquipments = dbEquipments.filter((e) => Boolean(e.isCustom));
  let dbSelectedIds = new Set(
    dbEquipments.filter((e) => e.isSelected !== false).map((e) => e.id)
  );
  let dbExplicitMap = buildExplicitCustomCompatibilityMap(dbCustomEquipments);

  const supinoWithUnlinkedCustom = isExerciseCompatibleWithGym(
    exSupinoReto,
    dbSelectedIds,
    dbExplicitMap,
    dbCustomEquipments
  );
  assert(
    supinoWithUnlinkedCustom === false && Object.keys(dbExplicitMap).length === 0,
    'COMPAT 12',
    'Equipamento personalizado selecionado SEM vínculo explícito NÃO habilita exercício (nem por nome ou categoria)',
    `isExerciseCompatibleWithGym(Supino reto, ['custom_supino_hammer_1'], dbExplicitMap, dbCustomEquipments) === ${supinoWithUnlinkedCustom}`
  );

  // 13. Vínculo para equipamento inexistente, removido ou não cadastrado é rejeitado e NUNCA usa o próprio ID como nome
  const ghostId = 'custom_fantasma_nao_cadastrado_999';
  const ghostMap = { [exSupinoReto.id]: [ghostId] };
  const ghostSelectedSet = new Set([ghostId]);

  const ghostCompatible = isExerciseCompatibleWithGym(
    exSupinoReto,
    ghostSelectedSet,
    ghostMap,
    dbCustomEquipments
  );
  const ghostResolvedEquipments = resolveCompatibleEquipmentsForExercise(
    exSupinoReto,
    dbCustomEquipments,
    ghostMap
  );
  const ghostResolvedAlternatives = resolveEquipmentAlternativesForExercise(
    exSupinoReto,
    dbCustomEquipments,
    ghostSelectedSet,
    ghostMap
  );
  const ghostSummary = formatEquipmentAlternativesSummary(
    exSupinoReto,
    dbCustomEquipments,
    ghostSelectedSet,
    ghostMap
  );
  const ghostModalVm = buildExerciseDetailViewModel(
    exSupinoReto,
    dbCustomEquipments,
    ghostSelectedSet,
    ghostMap
  );

  const ghostNeverAppearsByIdAsName =
    !ghostResolvedEquipments.some((eq) => eq.id === ghostId || eq.name === ghostId) &&
    !ghostResolvedAlternatives.some((alt) =>
      alt.items.some((it) => it.id === ghostId || it.name === ghostId)
    ) &&
    !ghostSummary.includes(ghostId) &&
    ghostModalVm.isAvailableInUserGym === false;

  assert(
    ghostCompatible === false && ghostNeverAppearsByIdAsName,
    'COMPAT 13',
    'Vínculo para equipamento inexistente/não cadastrado: rejeitado e NUNCA utiliza o próprio ID como nome',
    `ghostCompatible=${ghostCompatible} | ID fantasma ausente de equipamentos, alternativas, resumo e modal=${ghostNeverAppearsByIdAsName}`
  );

  // 14. Equipamento personalizado cadastrado e vinculado, mas NÃO selecionado: indisponível
  const customLinkedButUnselected = {
    ...customUnlinkedItem,
    isSelected: false,
    linkedExerciseIds: [exSupinoReto.id],
    updatedAt: new Date().toISOString(),
  };
  await customFlowDb.saveEquipment(customLinkedButUnselected);

  dbEquipments = await customFlowDb.getEquipments();
  dbCustomEquipments = dbEquipments.filter((e) => Boolean(e.isCustom));
  dbSelectedIds = new Set(
    dbEquipments.filter((e) => e.isSelected !== false).map((e) => e.id)
  );
  dbExplicitMap = buildExplicitCustomCompatibilityMap(dbCustomEquipments);

  const supinoLinkedUnselected = isExerciseCompatibleWithGym(
    exSupinoReto,
    dbSelectedIds,
    dbExplicitMap,
    dbCustomEquipments
  );
  // Mesmo se alguém passar um Set manual contendo o ID, se isSelected === false no cadastro do equipamento, deve continuar false
  const supinoLinkedUnselectedForcedSet = isExerciseCompatibleWithGym(
    exSupinoReto,
    new Set([customLinkedButUnselected.id]),
    dbExplicitMap,
    dbCustomEquipments
  );
  const modalLinkedUnselected = buildExerciseDetailViewModel(
    exSupinoReto,
    dbCustomEquipments,
    dbSelectedIds,
    dbExplicitMap
  );

  assert(
    supinoLinkedUnselected === false &&
      supinoLinkedUnselectedForcedSet === false &&
      modalLinkedUnselected.isAvailableInUserGym === false,
    'COMPAT 14',
    'Equipamento personalizado cadastrado e vinculado, mas NÃO selecionado na academia -> indisponível',
    `isSelected=false -> compatível=${supinoLinkedUnselected} (forçando Set=${supinoLinkedUnselectedForcedSet}, modal=${modalLinkedUnselected.isAvailableInUserGym})`
  );

  // 15. Equipamento personalizado cadastrado, vinculado e selecionado no fluxo real (FitAppDB -> Context -> UI): disponível
  const customLinkedAndSelected = {
    ...customLinkedButUnselected,
    name: 'Supino Articulado Convergente Custom',
    isSelected: true,
    linkedExerciseIds: [exSupinoReto.id],
    updatedAt: new Date().toISOString(),
  };
  await customFlowDb.saveEquipment(customLinkedAndSelected);

  dbEquipments = await customFlowDb.getEquipments();
  dbCustomEquipments = dbEquipments.filter((e) => Boolean(e.isCustom));
  dbSelectedIds = new Set(
    dbEquipments.filter((e) => e.isSelected !== false).map((e) => e.id)
  );
  dbExplicitMap = buildExplicitCustomCompatibilityMap(dbCustomEquipments);

  const supinoLinkedSelected = isExerciseCompatibleWithGym(
    exSupinoReto,
    dbSelectedIds,
    dbExplicitMap,
    dbCustomEquipments
  );
  const filteredWithLinkedSelected = filterExercisesCatalog(DEFAULT_EXERCISES_CATALOG, {
    onlyAvailableInGym: true,
    selectedEquipmentIds: dbSelectedIds,
    customEquipments: dbCustomEquipments,
    explicitCustomCompatibilityMap: dbExplicitMap,
  });
  const summaryWithLinkedSelected = formatEquipmentAlternativesSummary(
    exSupinoReto,
    dbCustomEquipments,
    dbSelectedIds,
    dbExplicitMap
  );
  const modalLinkedSelected = buildExerciseDetailViewModel(
    exSupinoReto,
    dbCustomEquipments,
    dbSelectedIds,
    dbExplicitMap
  );

  assert(
    supinoLinkedSelected === true &&
      filteredWithLinkedSelected.some((e) => e.id === exSupinoReto.id) &&
      summaryWithLinkedSelected.includes('Supino Articulado Convergente Custom') &&
      modalLinkedSelected.isAvailableInUserGym === true &&
      modalLinkedSelected.equipmentAlternatives.some(
        (alt) => alt.isSatisfiedInGym && alt.label === 'Supino Articulado Convergente Custom'
      ),
    'COMPAT 15',
    'Equipamento personalizado cadastrado, vinculado e selecionado: disponível e consistente no filtro, card, resumo e modal',
    `disponível=${supinoLinkedSelected} | resumo="${summaryWithLinkedSelected}" | modal=${modalLinkedSelected.isAvailableInUserGym}`
  );

  // 16. Combinações AND/OR com equipamento personalizado (alternativa composta por mais de um equipamento)
  const customPowerRack = {
    id: 'custom_power_rack_monolitico',
    name: 'Monolift Power Rack Custom',
    category: 'legs',
    isCustom: true,
    isSelected: true,
    linkedExerciseAlternatives: {
      [exAgachamentoLivre.id]: [
        ['custom_power_rack_monolitico', 'std_general_barras_retas', 'std_general_anilhas'],
      ],
    },
    createdAt: new Date().toISOString(),
  };
  await customFlowDb.saveEquipment(customPowerRack);

  dbEquipments = await customFlowDb.getEquipments();
  dbCustomEquipments = dbEquipments.filter((e) => Boolean(e.isCustom));
  dbExplicitMap = buildExplicitCustomCompatibilityMap(dbCustomEquipments);

  // Apenas o Monolift Custom selecionado (sem barra reta e sem anilhas) -> indisponível (AND incompleto)
  const squatOnlyCustomRack = isExerciseCompatibleWithGym(
    exAgachamentoLivre,
    new Set(['custom_power_rack_monolitico']),
    dbExplicitMap,
    dbCustomEquipments
  );
  // Monolift Custom + barra reta + anilhas -> disponível (AND completo)
  const squatCustomComboComplete = isExerciseCompatibleWithGym(
    exAgachamentoLivre,
    new Set(['custom_power_rack_monolitico', 'std_general_barras_retas', 'std_general_anilhas']),
    dbExplicitMap,
    dbCustomEquipments
  );
  // Alternativa padrão original (gaiola padrão + barra reta + anilhas) continua funcionando via OR
  const squatStandardComboStillWorks = isExerciseCompatibleWithGym(
    exAgachamentoLivre,
    new Set(['std_legs_agachamento_livre_rack', 'std_general_barras_retas', 'std_general_anilhas']),
    dbExplicitMap,
    dbCustomEquipments
  );

  assert(
    squatOnlyCustomRack === false &&
      squatCustomComboComplete === true &&
      squatStandardComboStillWorks === true,
    'COMPAT 16',
    'Alternativa personalizada composta (AND/OR): exige todos os itens da combinação e preserva alternativas padrão',
    `só rack custom=${squatOnlyCustomRack} | rack custom+barra+anilhas=${squatCustomComboComplete} | alternativa padrão=${squatStandardComboStillWorks}`
  );

  // 17. Vínculo removido (ou equipamento personalizado excluído): deixa imediatamente de habilitar o exercício
  const customUnlinkedAgain = {
    ...customLinkedAndSelected,
    linkedExerciseIds: [],
    linkedExerciseAlternatives: {},
    updatedAt: new Date().toISOString(),
  };
  await customFlowDb.saveEquipment(customUnlinkedAgain);

  dbEquipments = await customFlowDb.getEquipments();
  dbCustomEquipments = dbEquipments.filter((e) => Boolean(e.isCustom));
  dbSelectedIds = new Set(
    dbEquipments.filter((e) => e.isSelected !== false).map((e) => e.id)
  );
  dbExplicitMap = buildExplicitCustomCompatibilityMap(dbCustomEquipments);

  const supinoAfterUnlink = isExerciseCompatibleWithGym(
    exSupinoReto,
    dbSelectedIds,
    dbExplicitMap,
    dbCustomEquipments
  );

  // E se excluirmos o customPowerRack do banco, o agachamento com o ID antigo também deixa de habilitar
  await customFlowDb.deleteEquipment(customPowerRack.id);
  dbEquipments = await customFlowDb.getEquipments();
  dbCustomEquipments = dbEquipments.filter((e) => Boolean(e.isCustom));
  dbExplicitMap = buildExplicitCustomCompatibilityMap(dbCustomEquipments);

  const squatAfterDeleteCustom = isExerciseCompatibleWithGym(
    exAgachamentoLivre,
    new Set(['custom_power_rack_monolitico', 'std_general_barras_retas', 'std_general_anilhas']),
    dbExplicitMap,
    dbCustomEquipments
  );

  customFlowDb.closeConnection();

  assert(
    supinoAfterUnlink === false && squatAfterDeleteCustom === false,
    'COMPAT 17',
    'Vínculo removido ou equipamento personalizado excluído: deixa de habilitar o exercício imediatamente',
    `após remover vínculo=${supinoAfterUnlink} | após excluir equipamento personalizado=${squatAfterDeleteCustom}`
  );

  // 18. Contador, filtro "Minha Academia", indicador visual, resumo e modal produzem resultados 100% consistentes
  const customForConsistency = [
    {
      id: 'custom_supino_especial',
      name: 'Máquina Supino Especial',
      category: 'chest',
      isCustom: true,
      isSelected: true,
      linkedExerciseIds: ['ex_peito_supino_reto_barra'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'custom_puxador_desmarcado',
      name: 'Puxador Articulado Desmarcado',
      category: 'back',
      isCustom: true,
      isSelected: false,
      linkedExerciseIds: ['ex_costas_puxada_frontal_polia'],
      createdAt: new Date().toISOString(),
    },
  ];
  const explicitMapForConsistency = buildExplicitCustomCompatibilityMap(customForConsistency);

  const testScenarios = [
    {
      selectedSet: new Set(),
      customs: [],
      explicitMap: {},
    },
    {
      selectedSet: new Set(['std_general_barras_retas', 'std_general_bancos_retos']),
      customs: [],
      explicitMap: {},
    },
    {
      selectedSet: new Set(['std_general_barras_retas', 'std_general_bancos_retos', 'std_general_anilhas']),
      customs: [],
      explicitMap: {},
    },
    {
      selectedSet: new Set(['custom_supino_especial', 'std_general_halteres', 'std_general_bancos_regulaveis']),
      customs: customForConsistency,
      explicitMap: explicitMapForConsistency,
    },
    {
      selectedSet: new Set(DEFAULT_EQUIPMENTS_CATALOG.map((e) => e.id)),
      customs: customForConsistency,
      explicitMap: explicitMapForConsistency,
    },
  ];

  let allViewsConsistent = true;
  for (const scenario of testScenarios) {
    const { selectedSet, customs, explicitMap } = scenario;

    const countAvailable = DEFAULT_EXERCISES_CATALOG.filter((ex) =>
      isExerciseCompatibleWithGym(ex, selectedSet, explicitMap, customs)
    ).length;

    const filteredAvailable = filterExercisesCatalog(DEFAULT_EXERCISES_CATALOG, {
      onlyAvailableInGym: true,
      selectedEquipmentIds: selectedSet,
      customEquipments: customs,
      explicitCustomCompatibilityMap: explicitMap,
    });

    if (countAvailable !== filteredAvailable.length) {
      allViewsConsistent = false;
      break;
    }

    for (const ex of DEFAULT_EXERCISES_CATALOG) {
      const directAvailable = isExerciseCompatibleWithGym(
        ex,
        selectedSet,
        explicitMap,
        customs
      );
      const inFilteredList = filteredAvailable.some((item) => item.id === ex.id);
      const detailVm = buildExerciseDetailViewModel(
        ex,
        customs,
        selectedSet,
        explicitMap
      );
      const modalAvailable = detailVm.isAvailableInUserGym;
      const anyAltSatisfiedOrFree =
        detailVm.canExecuteWithoutEquipment ||
        detailVm.equipmentAlternatives.some((alt) => alt.isSatisfiedInGym);
      const summaryText = formatEquipmentAlternativesSummary(
        ex,
        customs,
        selectedSet,
        explicitMap
      );

      if (
        directAvailable !== inFilteredList ||
        directAvailable !== modalAvailable ||
        directAvailable !== anyAltSatisfiedOrFree ||
        typeof summaryText !== 'string' ||
        summaryText.length === 0
      ) {
        allViewsConsistent = false;
        break;
      }
    }
  }

  assert(
    allViewsConsistent,
    'COMPAT 18',
    'Unificação Total: Contador, Filtro "Minha Academia", Selo "Na sua academia", Resumo e Modal de Detalhes 100% Consistentes (Padrão + Personalizados)',
    'Verificada paridade absoluta entre contador, filtro da lista, selo do cartão, alternativas resolvidas e modal em 5 cenários (incluindo personalizados vinculados e desmarcados).'
  );

  console.log('\n================================================================================');
  console.log(`TOTAL DE CENÁRIOS DO CHECKPOINT 03 EXECUTADOS: ${passCount + failCount}`);
  console.log(`APROVADOS: ${passCount} | FALHAS: ${failCount}`);
  console.log('================================================================================');

  if (failCount > 0) {
    console.error('\nHOUVE REPROVAÇÕES NOS TESTES DO CHECKPOINT 03!');
    process.exit(1);
  } else {
    console.log('\nTODOS OS CENÁRIOS DO CHECKPOINT 03 FORAM APROVADOS COM SUCESSO!');
  }
}

runCheckpoint03TestSuite().catch((err) => {
  console.error('Erro fatal no teste do Checkpoint 03:', err);
  process.exit(1);
});
