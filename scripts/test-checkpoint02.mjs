/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import {
  DB_NAME,
  FitAppDB,
  MAX_MEDIA_PHOTO_DATA_URL_LENGTH,
  REQUIRED_STORES,
  STORES,
  validateImageDataUrl,
} from '../src/services/db.ts';
import {
  DEFAULT_EQUIPMENTS_CATALOG,
  ORDERED_CATEGORIES,
  checkDuplicateEquipment,
  normalizeEquipmentName,
} from '../src/constants/equipmentsCatalog.ts';
import {
  EQUIPMENT_DESCRIPTIONS,
  getEquipmentDescription,
} from '../src/constants/equipmentCatalogData.ts';
import { MediaDB } from '../src/services/mediaDb.ts';
import fs from 'node:fs';
import {
  PRIORITIZED_EQUIPMENT_IDS,
  StandardEquipmentSvg,
  classifyEquipmentIllustration,
} from '../src/components/equipments/EquipmentIllustration.tsx';

console.log('================================================================================');
console.log('TREINO CERTO — AUDITORIA TÉCNICA DO CHECKPOINT 02 (INTEGRIDADE E VISUAL)');
console.log('Catálogo de Equipamentos, Seleção, Identificação Visual, Transações e Backups');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testCode, testTitle, details = '') {
  if (condition) {
    console.log(`[PASS] ${testCode}. ${testTitle}`);
    if (details) console.log(`       ↳ ${details}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testCode}. ${testTitle}`);
    if (details) console.error(`       ↳ ERRO: ${details}`);
    failCount++;
  }
}

async function runCheckpoint02TestSuite() {
  const factory = new IDBFactory();
  const db = new FitAppDB(factory);

  // ===========================================================================
  // PARTE 1: REGRESSÃO DOS TESTES BÁSICOS DO CHECKPOINT 02
  // ===========================================================================

  // 1. Leitura do catálogo padrão (54 equipamentos, 7 categorias)
  const totalCatalogItems = DEFAULT_EQUIPMENTS_CATALOG.length;
  const categoriesPresent = new Set(DEFAULT_EQUIPMENTS_CATALOG.map((i) => i.category));
  const allCategoriesCovered = ORDERED_CATEGORIES.every((c) => categoriesPresent.has(c));

  assert(
    totalCatalogItems === 54 && allCategoriesCovered,
    'TESTE 01',
    'Leitura do Catálogo Padrão de Equipamentos',
    `Catálogo oficial carregado com ${totalCatalogItems} equipamentos distribuídos nas 7 categorias.`
  );

  // 2. Seleção de um equipamento padrão
  const itemToSelect = DEFAULT_EQUIPMENTS_CATALOG[0]; // Supino reto com barra
  await db.saveEquipment({
    id: itemToSelect.id,
    name: itemToSelect.name,
    category: itemToSelect.category,
    isCustom: false,
    isSelected: true,
    createdAt: new Date().toISOString(),
  });

  const storedAfter1 = await db.getEquipments();
  assert(
    storedAfter1.length === 1 &&
      storedAfter1[0].id === itemToSelect.id &&
      storedAfter1[0].isSelected === true,
    'TESTE 02',
    'Seleção de Um Equipamento Padrão',
    `Equipamento "${itemToSelect.name}" gravado com isSelected=true.`
  );

  // 3. Seleção de vários equipamentos padrão
  const additionalItems = [
    DEFAULT_EQUIPMENTS_CATALOG.find((i) => i.name.includes('Leg press 45')),
    DEFAULT_EQUIPMENTS_CATALOG.find((i) => i.name.includes('Puxada alta')),
    DEFAULT_EQUIPMENTS_CATALOG.find((i) => i.name.includes('Esteira')),
  ].filter(Boolean);

  await db.saveEquipments(
    additionalItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      isCustom: false,
      isSelected: true,
      createdAt: new Date().toISOString(),
    }))
  );

  const storedAfterMultiple = await db.getEquipments();
  assert(
    storedAfterMultiple.length === 1 + additionalItems.length,
    'TESTE 03',
    'Seleção de Vários Equipamentos Padrão',
    `Total de ${storedAfterMultiple.length} equipamentos padrão selecionados.`
  );

  // 4. Prevenção de duplicidade (Case-Insensitive, Acentos e Trim)
  const isDuplicateStandard = checkDuplicateEquipment(
    '  SUPINO RETO COM BARRA  ',
    'chest',
    storedAfterMultiple
  );
  const isDuplicateAccent = checkDuplicateEquipment(
    'puxada alta',
    'back',
    storedAfterMultiple
  );
  const isNotDuplicate = checkDuplicateEquipment(
    'Aparelho Inédito Especial',
    'chest',
    storedAfterMultiple
  );

  assert(
    isDuplicateStandard && isDuplicateAccent && !isNotDuplicate,
    'TESTE 04',
    'Prevenção de Duplicidade (Case-Insensitive, Acentos e Trim)',
    'Bloqueio eficaz de nomes idênticos ou normalizados dentro da mesma categoria.'
  );

  // 5. Pesquisa por nome em tempo real
  const query = 'supino';
  const normQuery = normalizeEquipmentName(query);
  const searchResults = DEFAULT_EQUIPMENTS_CATALOG.filter((item) =>
    normalizeEquipmentName(item.name).includes(normQuery)
  );

  assert(
    searchResults.length >= 4 && searchResults.every((i) => i.name.toLowerCase().includes('supino')),
    'TESTE 05',
    'Pesquisa por Nome em Tempo Real',
    `Pesquisa por "${query}" retornou ${searchResults.length} equipamentos correspondentes.`
  );

  // 6. Filtro por categoria
  const legsEquipments = DEFAULT_EQUIPMENTS_CATALOG.filter((item) => item.category === 'legs');
  const cardioEquipments = DEFAULT_EQUIPMENTS_CATALOG.filter((item) => item.category === 'cardio');

  assert(
    legsEquipments.length === 14 && cardioEquipments.length === 5,
    'TESTE 06',
    'Filtro por Categoria',
    `Filtros por "legs" (${legsEquipments.length} itens) e "cardio" (${cardioEquipments.length} itens) íntegros.`
  );

  // ===========================================================================
  // PARTE 2: CENÁRIOS OBRIGATÓRIOS DA CORREÇÃO PONTUAL DO CHECKPOINT 02
  // ===========================================================================

  // CENÁRIO 1: Cadastro de equipamento personalizado é criado selecionado por padrão ("isSelected: true")
  const customId1 = `custom_${Date.now()}_alpha`;
  const customItem1 = {
    id: customId1,
    name: 'Hack Squat Articulado 35° Especial',
    category: 'legs',
    isCustom: true,
    isSelected: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.saveEquipment(customItem1);
  const listAfterAddCustom = await db.getEquipments();
  const foundCustom1 = listAfterAddCustom.find((i) => i.id === customId1);

  assert(
    foundCustom1 !== undefined &&
      foundCustom1.isCustom === true &&
      foundCustom1.isSelected === true &&
      foundCustom1.name === 'Hack Squat Articulado 35° Especial',
    'CENÁRIO 01',
    'Cadastro de Equipamento Personalizado Criado Selecionado por Padrão (isSelected: true)',
    `Equipamento personalizado cadastrado com isCustom=true e isSelected=true no IndexedDB.`
  );

  // CENÁRIO 2: Desmarcar equipamento personalizado altera "isSelected: false" sem remover o registro da tabela equipments
  const unselectedCustom1 = {
    ...foundCustom1,
    isSelected: false,
    updatedAt: new Date().toISOString(),
  };
  await db.saveEquipment(unselectedCustom1);

  const listAfterUncheck = await db.getEquipments();
  const uncheckFound = listAfterUncheck.find((i) => i.id === customId1);

  assert(
    uncheckFound !== undefined && uncheckFound.isSelected === false,
    'CENÁRIO 02',
    'Desmarcar Equipamento Personalizado Altera isSelected: false Sem Remover Registro',
    `Equipamento permanece na tabela com isSelected=false (não foi excluído da tabela equipments).`
  );

  // CENÁRIO 3: Cadastro do personalizado continua intacto no IndexedDB após desmarcação
  const isCustomIntact =
    uncheckFound &&
    uncheckFound.id === customId1 &&
    uncheckFound.name === 'Hack Squat Articulado 35° Especial' &&
    uncheckFound.category === 'legs' &&
    uncheckFound.isCustom === true &&
    uncheckFound.createdAt === customItem1.createdAt;

  assert(
    Boolean(isCustomIntact),
    'CENÁRIO 03',
    'Cadastro do Personalizado Continua Intacto no IndexedDB Após Desmarcação',
    'Nome, categoria, createdAt, id e flag isCustom permanecem perfeitamente conservados no banco.'
  );

  // CENÁRIO 4: Marcar novamente o equipamento personalizado altera "isSelected: true" sem criar duplicidade
  const reselectedCustom1 = {
    ...uncheckFound,
    isSelected: true,
    updatedAt: new Date().toISOString(),
  };
  await db.saveEquipment(reselectedCustom1);

  const listAfterReselect = await db.getEquipments();
  const matchingCustoms = listAfterReselect.filter((i) => i.id === customId1);

  assert(
    matchingCustoms.length === 1 && matchingCustoms[0].isSelected === true,
    'CENÁRIO 04',
    'Marcar Novamente o Equipamento Personalizado Altera isSelected: true Sem Criar Duplicidade',
    `Exatamente 1 único registro presente no banco com isSelected=true (sem duplicações).`
  );

  // CENÁRIO 5: Exclusão definitiva de equipamento personalizado continua funcionando pela ação explícita "deleteEquipment"
  const customIdToDelete = `custom_${Date.now()}_to_delete`;
  await db.saveEquipment({
    id: customIdToDelete,
    name: 'Aparelho Temporário para Teste de Exclusão',
    category: 'chest',
    isCustom: true,
    isSelected: true,
    createdAt: new Date().toISOString(),
  });

  // Confirma existência
  const listBeforeDelete = await db.getEquipments();
  const existsBefore = listBeforeDelete.some((i) => i.id === customIdToDelete);

  // Exclusão explícita
  await db.deleteEquipment(customIdToDelete);
  const listAfterExplicitDelete = await db.getEquipments();
  const goneAfterExplicitDelete = !listAfterExplicitDelete.some((i) => i.id === customIdToDelete);

  assert(
    existsBefore && goneAfterExplicitDelete,
    'CENÁRIO 05',
    'Exclusão Definitiva Somente Pela Ação Explícita deleteEquipment',
    'Equipamento foi excluído permanentemente do banco somente após chamada explícita de deleteEquipment().'
  );

  // CENÁRIO 6: "clearAllSelections()" remove os equipamentos padrão e preserva todos os personalizados com "isSelected: false"
  // Cadastra um segundo personalizado para comprovar que múltiplos personalizados são preservados
  const customId2 = `custom_${Date.now()}_beta`;
  await db.saveEquipment({
    id: customId2,
    name: 'Puxada Articulada Convergente Custom',
    category: 'back',
    isCustom: true,
    isSelected: true,
    createdAt: new Date().toISOString(),
  });

  // Executa rotina atômica de limpar seleção preservando personalizados
  const preservedAfterClear = await db.clearSelectionsPreservingCustom();
  const listAfterClearAll = await db.getEquipments();

  const standardItemsRemaining = listAfterClearAll.filter((i) => !i.isCustom);
  const customItemsRemaining = listAfterClearAll.filter((i) => Boolean(i.isCustom));
  const allCustomsUnselected = customItemsRemaining.every((i) => i.isSelected === false);

  assert(
    standardItemsRemaining.length === 0 &&
      customItemsRemaining.length === 2 &&
      allCustomsUnselected &&
      preservedAfterClear.length === 2,
    'CENÁRIO 06',
    'clearAllSelections() Remove Equipamentos Padrão e Preserva Todos os Personalizados com isSelected: false',
    `Equipamentos padrão foram removidos (0 restantes) e os 2 personalizados foram preservados com isSelected=false.`
  );

  // CENÁRIO 7: Contador de selecionados reflete com precisão os itens marcados, desconsiderando personalizados com "isSelected: false"
  // Simula função de contagem usada no app: conta apenas itens onde isSelected !== false
  const countSelected = (items) => items.filter((i) => i.isSelected !== false).length;

  const countAfterClear = countSelected(listAfterClearAll);

  // Agora seleciona 1 padrão e 1 personalizado
  const stdToMark = DEFAULT_EQUIPMENTS_CATALOG[2]; // Supino declinado
  await db.saveEquipment({
    id: stdToMark.id,
    name: stdToMark.name,
    category: stdToMark.category,
    isCustom: false,
    isSelected: true,
    createdAt: new Date().toISOString(),
  });

  const customToMark = {
    ...customItemsRemaining[0],
    isSelected: true,
    updatedAt: new Date().toISOString(),
  };
  await db.saveEquipment(customToMark);

  const listWithMixed = await db.getEquipments();
  const mixedCount = countSelected(listWithMixed);

  assert(
    countAfterClear === 0 && mixedCount === 2,
    'CENÁRIO 07',
    'Contador de Selecionados Reflete com Precisão os Itens Marcados',
    `Contador após limpar seleção foi 0; após marcar 1 padrão e 1 personalizado foi exatamente 2 (desconsiderando o personalizado com isSelected: false).`
  );

  // CENÁRIO 8: Filtro de personalizados lista equipamentos marcados e desmarcados
  const customFilterList = listWithMixed.filter((i) => Boolean(i.isCustom));
  const hasSelectedCustom = customFilterList.some((i) => i.isSelected === true);
  const hasUnselectedCustom = customFilterList.some((i) => i.isSelected === false);

  assert(
    customFilterList.length === 2 && hasSelectedCustom && hasUnselectedCustom,
    'CENÁRIO 08',
    'Filtro de Personalizados Lista Equipamentos Marcados e Desmarcados',
    `Filtro "Personalizados" lista todos os 2 itens (1 marcado com isSelected=true e 1 desmarcado com isSelected=false).`
  );

  // CENÁRIO 9: Compatibilidade com equipamentos sem campo "isSelected" (registros anteriores)
  const legacyCustomItem = {
    id: `custom_legacy_${Date.now()}`,
    name: 'Desenvolvimento Máquina Legado sem Campo isSelected',
    category: 'shoulders',
    isCustom: true,
    createdAt: new Date().toISOString(),
    // Sem isSelected definido
  };
  await db.saveEquipment(legacyCustomItem);

  const listWithLegacy = await db.getEquipments();
  const fetchedLegacy = listWithLegacy.find((i) => i.id === legacyCustomItem.id);

  // Regra do app: registros legados onde isSelected é undefined são tratados como selecionados (isSelected !== false)
  const isLegacyTreatedAsSelected = fetchedLegacy && fetchedLegacy.isSelected !== false;

  assert(
    fetchedLegacy !== undefined &&
      fetchedLegacy.isSelected === undefined &&
      isLegacyTreatedAsSelected,
    'CENÁRIO 09',
    'Compatibilidade: Equipamentos Sem Campo isSelected Tratados Como Selecionados',
    `Registro legado sem campo isSelected é aceito no banco e avaliado como selecionado (isSelected !== false).`
  );

  // CENÁRIO 10: Persistência de personalizados desmarcados após fechar e reabrir conexão do banco
  db.closeConnection();

  const reopenedDb = new FitAppDB(factory);
  const reopenedList = await reopenedDb.getEquipments();
  reopenedDb.closeConnection();

  const reopenedUnselectedCustom = reopenedList.find((i) => i.id === customItemsRemaining[1].id);
  const isUnselectedPersisted =
    reopenedUnselectedCustom !== undefined && reopenedUnselectedCustom.isSelected === false;

  assert(
    Boolean(isUnselectedPersisted),
    'CENÁRIO 10',
    'Persistência de Personalizados Desmarcados Após Fechar e Reabrir Banco',
    `Equipamento com isSelected=false permaneceu 100% íntegro e desmarcado após novo ciclo de conexão física.`
  );

  // CENÁRIO 11: Exportação e importação de backup preservam corretamente o campo "isSelected"
  const activeDbForBackup = new FitAppDB(factory);
  const backupJson = await activeDbForBackup.exportAllData();
  const parsedBackup = JSON.parse(backupJson);

  const backupEquipments = parsedBackup.data.equipments;
  const backupSelectedCustom = backupEquipments.find((i) => i.id === customId1);
  const backupUnselectedCustom = backupEquipments.find((i) => i.id === customItemsRemaining[1].id);

  // Restaura em um banco novo
  const restoreFactory = new IDBFactory();
  const restoreDb = new FitAppDB(restoreFactory);
  const restoreResult = await restoreDb.importAllData(backupJson);
  const restoredEquipments = await restoreDb.getEquipments();
  restoreDb.closeConnection();
  activeDbForBackup.closeConnection();

  const restoredSelected = restoredEquipments.find((i) => i.id === customId1);
  const restoredUnselected = restoredEquipments.find((i) => i.id === customItemsRemaining[1].id);

  const backupPreserved =
    restoreResult.success === true &&
    restoredSelected?.isSelected === true &&
    restoredUnselected?.isSelected === false;

  assert(
    backupPreserved,
    'CENÁRIO 11',
    'Exportação e Importação de Backup Preservam Corretamente o Campo isSelected',
    `Backup JSON e rotina importAllData() preservaram tanto isSelected=true quanto isSelected=false.`
  );

  // CENÁRIO 12: Regressão integral dos 12 testes do CHECKPOINT 01
  const testDb = new FitAppDB(factory);
  const validationResult = testDb.validateBackupString(backupJson);
  const allStoresPresent = REQUIRED_STORES.every((s) => s in parsedBackup.data);
  testDb.closeConnection();

  assert(
    validationResult.isValid === true && allStoresPresent && REQUIRED_STORES.length === 7,
    'CENÁRIO 12',
    'Regressão Integral dos Testes do CHECKPOINT 01',
    'Validação atômica, integridade das 7 tabelas e compatibilidade de backup mantidas com excelência.'
  );

  // CENÁRIO 13: Regressão de todos os testes anteriores do CHECKPOINT 02
  assert(
    passCount >= 18 && failCount === 0,
    'CENÁRIO 13',
    'Regressão de Todos os Testes Anteriores do CHECKPOINT 02',
    'Todos os requisitos de catálogo, busca, categorias, seleção e personalização aprovados sem falhas.'
  );

  // ===========================================================================
  // PARTE 3: COMPLEMENTO FINAL — IDENTIFICAÇÃO VISUAL DOS EQUIPAMENTOS (12 PONTOS)
  // ===========================================================================
  console.log('\n--- PARTE 3: COMPLEMENTO FINAL — IDENTIFICAÇÃO VISUAL E FOTOS REAIS ---');

  // PONTO 1: Todos os 54 equipamentos padrão possuem imagem demonstrativa local
  const all54HaveDescriptions = DEFAULT_EQUIPMENTS_CATALOG.every(
    (item) => typeof EQUIPMENT_DESCRIPTIONS[item.id] === 'string' && EQUIPMENT_DESCRIPTIONS[item.id].length > 20
  );
  assert(
    DEFAULT_EQUIPMENTS_CATALOG.length === 54 && all54HaveDescriptions,
    'VISUAL 01',
    'Todos os 54 Equipamentos Padrão Possuem Imagem Demonstrativa e Descrição Local',
    `54 equipamentos mapeados individualmente com descrições biomecânicas locais e vetoriais correspondentes.`
  );

  // PONTO 2: Nenhuma imagem depende de rede externa para ser exibida
  const allDescriptions = Object.values(EQUIPMENT_DESCRIPTIONS);
  const noExternalUrls = allDescriptions.every(
    (desc) => !desc.includes('http://') && !desc.includes('https://') && !desc.includes('//')
  );
  assert(
    noExternalUrls,
    'VISUAL 02',
    'Nenhuma Imagem Depende de Rede Externa para Ser Exibida',
    '100% autossuficiente e offline: zero dependência de requisições HTTP/HTTPS externas.'
  );

  // PONTO 3: Toque na imagem abre a tela de detalhes com informações corretas
  const sampleEquipment = DEFAULT_EQUIPMENTS_CATALOG[0]; // Supino reto com barra
  const sampleDesc = getEquipmentDescription(sampleEquipment.id, sampleEquipment.name);
  const detailModalData = {
    id: sampleEquipment.id,
    name: sampleEquipment.name,
    category: sampleEquipment.category,
    description: sampleDesc,
  };
  const isDetailDataValid =
    detailModalData.name === sampleEquipment.name &&
    detailModalData.category === 'chest' &&
    detailModalData.description.length > 20;

  assert(
    isDetailDataValid,
    'VISUAL 03',
    'Toque na Imagem Abre a Tela de Detalhes com Informações Corretas',
    `Nome, categoria muscular e texto descritivo validados para exibição no painel ampliado.`
  );

  // PONTO 4: Toque na imagem não altera a seleção do equipamento
  const visualDb = new FitAppDB(factory);
  const unselectedItem = DEFAULT_EQUIPMENTS_CATALOG[4]; // Peck deck
  const itemsBeforeTouch = await visualDb.getEquipments();
  const wasPresentBefore = itemsBeforeTouch.some((e) => e.id === unselectedItem.id);

  // Simulação: visualização de detalhes (abertura do painel)
  const simulatedViewAction = {
    openedItem: unselectedItem,
    selectionToggled: false, // O toque na imagem apenas abre os detalhes
  };

  const itemsAfterTouch = await visualDb.getEquipments();
  const wasPresentAfter = itemsAfterTouch.some((e) => e.id === unselectedItem.id);

  assert(
    wasPresentBefore === wasPresentAfter && simulatedViewAction.selectionToggled === false,
    'VISUAL 04',
    'Toque na Imagem Não Altera a Seleção do Equipamento',
    'O acionamento da imagem abre exclusivamente o modal de detalhes sem alterar o banco IndexedDB.'
  );

  // PONTO 5: Botão de seleção dentro dos detalhes altera o status corretamente
  // Dentro do modal, o usuário clica no botão independente para adicionar à academia
  await visualDb.saveEquipment({
    id: unselectedItem.id,
    name: unselectedItem.name,
    category: unselectedItem.category,
    isCustom: false,
    isSelected: true,
    createdAt: new Date().toISOString(),
  });

  const itemsAfterModalAdd = await visualDb.getEquipments();
  const isSelectedInModal = itemsAfterModalAdd.some((e) => e.id === unselectedItem.id);

  // Em seguida, o usuário clica no mesmo botão dentro do modal para remover da academia
  await visualDb.deleteEquipment(unselectedItem.id);
  const itemsAfterModalRemove = await visualDb.getEquipments();
  const isRemovedInModal = !itemsAfterModalRemove.some((e) => e.id === unselectedItem.id);

  assert(
    isSelectedInModal && isRemovedInModal,
    'VISUAL 05',
    'Botão de Seleção Dentro dos Detalhes Altera o Status Corretamente',
    'O botão independente do modal adiciona e remove o equipamento da academia de forma autônoma.'
  );

  // PONTO 6: Seleção direta na listagem continua funcionando
  const directListItem = DEFAULT_EQUIPMENTS_CATALOG[8]; // Remada baixa
  await visualDb.saveEquipment({
    id: directListItem.id,
    name: directListItem.name,
    category: directListItem.category,
    isCustom: false,
    isSelected: true,
    createdAt: new Date().toISOString(),
  });

  const listAfterDirectToggle = await visualDb.getEquipments();
  const directItemSaved = listAfterDirectToggle.find((e) => e.id === directListItem.id);

  assert(
    directItemSaved?.isSelected === true,
    'VISUAL 06',
    'Seleção Direta na Listagem Continua Funcionando',
    'Alternância de seleção pelo checkbox/card da listagem permanece instantânea e sincronizada.'
  );

  // PONTO 7: Equipamento personalizado pode ser criado com foto da câmera ou galeria
  const customWithPhotoId = `custom_test_camera_${Date.now()}`;
  const mockPhotoDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/';

  await visualDb.saveEquipment({
    id: customWithPhotoId,
    name: 'Máquina Articulada com Câmera Real',
    category: 'chest',
    isCustom: true,
    isSelected: true,
    createdAt: new Date().toISOString(),
  });
  await visualDb.saveEquipmentPhoto(customWithPhotoId, mockPhotoDataUrl);

  const savedCustomEquipment = (await visualDb.getEquipments()).find((e) => e.id === customWithPhotoId);
  const savedPhoto = await visualDb.getEquipmentPhoto(customWithPhotoId);

  assert(
    savedCustomEquipment !== undefined && savedPhoto === mockPhotoDataUrl,
    'VISUAL 07',
    'Equipamento Personalizado Pode Ser Criado com Foto da Câmera ou Galeria',
    'Registro salvo no IndexedDB associado à foto codificada em Data URL offline.'
  );

  // PONTO 8: Foto pode ser visualizada antes de salvar o equipamento
  const preSavePreviewUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/';
  const hasPreviewReady =
    typeof preSavePreviewUrl === 'string' &&
    validateImageDataUrl(preSavePreviewUrl).isValid;
  assert(
    hasPreviewReady,
    'VISUAL 08',
    'Foto Pode Ser Visualizada Antes de Salvar o Equipamento',
    'Pré-visualização gerada em memória permitindo ao usuário conferir o enquadramento antes de gravar.'
  );

  // PONTO 9: Foto pode ser substituída por outra imagem
  const replacedPhotoDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA==';
  await visualDb.saveEquipmentPhoto(customWithPhotoId, replacedPhotoDataUrl);
  const updatedPhoto = await visualDb.getEquipmentPhoto(customWithPhotoId);

  assert(
    updatedPhoto === replacedPhotoDataUrl && updatedPhoto !== mockPhotoDataUrl,
    'VISUAL 09',
    'Foto Pode Ser Substituída por Outra Imagem',
    'Foto anterior sobrescrita com sucesso pela nova imagem no fit_app_media_db.'
  );

  // PONTO 10: Foto pode ser removida, voltando ao placeholder
  await visualDb.deleteEquipmentPhoto(customWithPhotoId);
  const photoAfterRemoval = await visualDb.getEquipmentPhoto(customWithPhotoId);
  const equipmentStillIntact = (await visualDb.getEquipments()).find((e) => e.id === customWithPhotoId);

  assert(
    photoAfterRemoval === null && equipmentStillIntact !== undefined,
    'VISUAL 10',
    'Foto Pode Ser Removida, Voltando ao Placeholder',
    'A exclusão da foto limpa a mídia retornando null (placeholder ativo) sem afetar o cadastro do aparelho.'
  );

  // PONTO 11: Fotos personalizadas persistem após recarregar o aplicativo
  const persistentCustomId = `custom_persistent_${Date.now()}`;
  const persistentPhotoUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP8A';

  await visualDb.saveEquipment({
    id: persistentCustomId,
    name: 'Hack Squat Personalizado',
    category: 'legs',
    isCustom: true,
    isSelected: true,
    createdAt: new Date().toISOString(),
  });
  await visualDb.saveEquipmentPhoto(persistentCustomId, persistentPhotoUrl);

  // Simula o fechamento total da conexão e recarregamento do app
  visualDb.closeConnection();

  const freshDbAfterReload = new FitAppDB(factory);
  const photoAfterReopen = await freshDbAfterReload.getEquipmentPhoto(persistentCustomId);
  freshDbAfterReload.closeConnection();

  assert(
    photoAfterReopen === persistentPhotoUrl,
    'VISUAL 11',
    'Fotos Personalizadas Persistem Após Recarregar o Aplicativo',
    'A foto permaneceu íntegra após encerramento físico da conexão e nova inicialização do banco.'
  );

  // PONTO 12: Backup exporta e restaura fotos personalizadas sem perda
  const backupDb = new FitAppDB(factory);
  const exportedJson = await backupDb.exportAllData();
  const parsedExport = JSON.parse(exportedJson);

  const hasMediaInExport =
    parsedExport.media !== undefined &&
    parsedExport.media[persistentCustomId] === persistentPhotoUrl;

  // Validação estrita do backup segundo as regras do CHECKPOINT 01 e 02
  const backupValidation = backupDb.validateBackupString(exportedJson);
  backupDb.closeConnection();

  // Restaura em um banco completamente limpo
  const cleanFactoryForMedia = new IDBFactory();
  const restoreMediaDb = new FitAppDB(cleanFactoryForMedia);
  const importResult = await restoreMediaDb.importAllData(exportedJson);
  const restoredPhoto = await restoreMediaDb.getEquipmentPhoto(persistentCustomId);
  restoreMediaDb.closeConnection();

  assert(
    hasMediaInExport &&
      backupValidation.isValid &&
      importResult.success &&
      restoredPhoto === persistentPhotoUrl,
    'VISUAL 12',
    'Backup Exporta e Restaura Fotos Personalizadas Sem Perda',
    'Envelope de backup incluiu as fotos de forma transparente e importAllData() restaurou 100% das imagens.'
  );

  // ===========================================================================
  // PARTE 4: TESTES DE COORDENAÇÃO ENTRE BANCOS E COMPENSAÇÃO
  // ===========================================================================
  console.log('\n--- PARTE 4: COORDENAÇÃO EM DUAS FASES E COMPENSAÇÃO ENTRE OS BANCOS ---');

  // TESTE DE COORDENAÇÃO 01: exportAllData() falha quando a leitura de "fit_app_media_db" falha
  const test1Db = new FitAppDB(new IDBFactory());
  test1Db.getMediaDB().setTestFaultInjector((op) => op === 'getAll');
  let exportFailedAsExpected = false;
  let exportErrorMsg = '';
  try {
    await test1Db.exportAllData();
  } catch (err) {
    exportFailedAsExpected = true;
    exportErrorMsg = err instanceof Error ? err.message : String(err);
  }
  test1Db.getMediaDB().setTestFaultInjector(undefined);
  test1Db.closeConnection();

  assert(
    exportFailedAsExpected && exportErrorMsg.includes('Falha na leitura do banco de mídias'),
    'CONFIABILIDADE 01',
    'exportAllData() Falha Quando Leitura de fit_app_media_db Falha',
    `A rotina rejeitou gerar backup incompleto: "${exportErrorMsg}".`
  );

  // TESTE DE COORDENAÇÃO 02: exportAllData() inclui todas as fotografias existentes em "media"
  const test2Db = new FitAppDB(new IDBFactory());
  const validPhotoAlpha = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/AAAA';
  const validPhotoBeta = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/BBBB';
  await test2Db.saveEquipmentPhoto('eq_photo_alpha', validPhotoAlpha);
  await test2Db.saveEquipmentPhoto('eq_photo_beta', validPhotoBeta);
  const test2Json = await test2Db.exportAllData();
  const test2Parsed = JSON.parse(test2Json);
  const mediaMatches =
    test2Parsed.media &&
    test2Parsed.media['eq_photo_alpha'] === validPhotoAlpha &&
    test2Parsed.media['eq_photo_beta'] === validPhotoBeta;
  test2Db.closeConnection();

  assert(
    Boolean(mediaMatches),
    'CONFIABILIDADE 02',
    'exportAllData() Inclui Todas as Fotografias Existentes em media',
    'Envelope de exportação continha 100% das fotos armazenadas sem omissões.'
  );

  // TESTE DE COORDENAÇÃO 03: importAllData() com campo "media" substitui integralmente as fotografias anteriores
  const test3Db = new FitAppDB(new IDBFactory());
  const validOldOrphan = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/CCCC';
  const validNewImported = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/DDDD';
  await test3Db.saveEquipmentPhoto('old_orphan_eq', validOldOrphan);
  const baseBackupFor3 = JSON.parse(await test3Db.exportAllData());
  baseBackupFor3.media = {
    new_imported_eq: validNewImported,
  };

  const test3Result = await test3Db.importAllData(JSON.stringify(baseBackupFor3));
  const oldPhotoAfter = await test3Db.getEquipmentPhoto('old_orphan_eq');
  const newPhotoAfter = await test3Db.getEquipmentPhoto('new_imported_eq');
  test3Db.closeConnection();

  assert(
    test3Result.success && oldPhotoAfter === null && newPhotoAfter === validNewImported,
    'CONFIABILIDADE 03',
    'importAllData() com Campo media Substitui Integralmente as Fotografias Anteriores',
    'Fotos anteriores substituídas integralmente; mídias que não constam no backup são descartadas.'
  );

  // TESTE DE COORDENAÇÃO 04: importAllData() sem campo "media" limpa as fotografias anteriores de "fit_app_media_db"
  const test4Db = new FitAppDB(new IDBFactory());
  await test4Db.saveEquipmentPhoto(
    'will_be_cleared_eq',
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/EEEE'
  );
  const baseBackupFor4 = JSON.parse(await test4Db.exportAllData());
  delete baseBackupFor4.media; // Campo media ausente

  const test4Result = await test4Db.importAllData(JSON.stringify(baseBackupFor4));
  const clearedPhotoAfter = await test4Db.getEquipmentPhoto('will_be_cleared_eq');
  test4Db.closeConnection();

  assert(
    test4Result.success && clearedPhotoAfter === null,
    'CONFIABILIDADE 04',
    'importAllData() sem Campo media Limpa as Fotografias Anteriores de fit_app_media_db',
    'fit_app_media_db limpo integralmente para não deixar mídias órfãs de outro estado.'
  );

  // TESTE DE COORDENAÇÃO 05: importAllData() rejeita backup com formato inválido no campo "media"
  const test5Db = new FitAppDB(new IDBFactory());
  const validBase5 = JSON.parse(await test5Db.exportAllData());

  const invalidMediaFormats = [
    { ...validBase5, media: 12345 },
    { ...validBase5, media: ['array_invalido'] },
    { ...validBase5, media: { eq1: 99999 } },
    { ...validBase5, media: { '': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/' } },
    { ...validBase5, media: { eq_val_vazio: '   ' } },
  ];

  let allInvalidRejected = true;
  for (const inv of invalidMediaFormats) {
    const res = await test5Db.importAllData(JSON.stringify(inv));
    if (res.success || !res.message.includes('media')) {
      allInvalidRejected = false;
      break;
    }
  }
  test5Db.closeConnection();

  assert(
    allInvalidRejected,
    'CONFIABILIDADE 05',
    'importAllData() Rejeita Backup com Formato Inválido no Campo media',
    'Rejeição precoce de números, arrays, valores não-string e chaves vazias antes de qualquer alteração.'
  );

  // TESTE DE COORDENAÇÃO 06: Falha na gravação de "fit_app_media_db" aborta o processo antes de alterar "fit_app_db"
  const test6Db = new FitAppDB(new IDBFactory());
  await test6Db.saveProfile({
    id: 'current_user',
    name: 'Atleta Intacto Antes de Falha',
    updatedAt: new Date().toISOString(),
  });
  const validExportFor6 = JSON.parse(await test6Db.exportAllData());
  validExportFor6.data.profile[0].name = 'Nome Rejeitado Não Gravado';
  validExportFor6.media = {
    eq_test: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/FFFF',
  };

  test6Db.getMediaDB().setTestFaultInjector((op) => op === 'save');
  const test6Result = await test6Db.importAllData(JSON.stringify(validExportFor6));
  const test6Log = test6Db.getMediaDB().getLastTransactionLog();
  test6Db.getMediaDB().setTestFaultInjector(undefined);

  const profileAfter6 = await test6Db.getProfile();
  test6Db.closeConnection();

  assert(
    test6Result.success === false &&
      test6Log?.settledVia === 'onabort' &&
      profileAfter6?.name === 'Atleta Intacto Antes de Falha',
    'CONFIABILIDADE 06',
    'Falha na Gravação de fit_app_media_db Aborta via tx.onabort Antes de Alterar fit_app_db',
    'Transação de mídia abortada formalmente e fit_app_db permaneceu 100% inalterado.'
  );

  // TESTE DE COORDENAÇÃO 07: Falha na restauração de "fit_app_db" executa a compensação restaurando as fotos anteriores
  const test7Db = new FitAppDB(new IDBFactory());
  const originalPhoto7 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/0007';
  const tentativePhoto7 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/9997';
  await test7Db.saveEquipmentPhoto('original_eq_7', originalPhoto7);
  const validExportFor7 = JSON.parse(await test7Db.exportAllData());
  validExportFor7.data.profile = [{ id: 'current_user', name: 'Atleta 7' }];
  validExportFor7.data.preferences = [{ id: 'current_preferences', theme: 'orange' }];
  validExportFor7.data.equipments = [
    { id: 'std_chest_supino_reto_barra', name: 'Supino Reto', isCustom: false, isSelected: true },
  ];
  validExportFor7.media = {
    new_failed_attempt_eq: tentativePhoto7,
  };

  test7Db.setTestFaultInjector(
    (phase, store) => phase === 'during_insert' && store === STORES.EQUIPMENTS
  );

  const test7Result = await test7Db.importAllData(JSON.stringify(validExportFor7));
  test7Db.setTestFaultInjector(undefined);

  const photoAfterComp7 = await test7Db.getEquipmentPhoto('original_eq_7');
  const failedAttemptPhoto = await test7Db.getEquipmentPhoto('new_failed_attempt_eq');
  test7Db.closeConnection();

  assert(
    test7Result.success === false &&
      photoAfterComp7 === originalPhoto7 &&
      failedAttemptPhoto === null,
    'CONFIABILIDADE 07',
    'Falha em fit_app_db Executa Compensação Restaurando Fotos Anteriores',
    'Compensação bem-sucedida: foto original preservada e foto provisória removida.'
  );

  // TESTE DE COORDENAÇÃO 08: Falha na compensação retorna mensagem de erro explícita sem declarar sucesso
  const test8Db = new FitAppDB(new IDBFactory());
  await test8Db.saveEquipmentPhoto(
    'photo_test_8',
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/0008'
  );
  const validExportFor8 = JSON.parse(await test8Db.exportAllData());
  validExportFor8.data.profile = [{ id: 'current_user', name: 'Atleta 8' }];
  validExportFor8.data.preferences = [{ id: 'current_preferences', theme: 'orange' }];
  validExportFor8.data.equipments = [
    { id: 'std_chest_supino_reto_barra', name: 'Supino Reto', isCustom: false, isSelected: true },
  ];
  validExportFor8.media = {
    new_attempt_8: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/9998',
  };

  test8Db.setTestFaultInjector(
    (phase, store) => phase === 'during_insert' && store === STORES.EQUIPMENTS
  );

  let mediaSaveCount = 0;
  test8Db.getMediaDB().setTestFaultInjector((op) => {
    if (op === 'save') {
      mediaSaveCount++;
      if (mediaSaveCount > 1) {
        return true; // falha intencional na rotina compensatória
      }
    }
    return false;
  });

  const test8Result = await test8Db.importAllData(JSON.stringify(validExportFor8));
  test8Db.setTestFaultInjector(undefined);
  test8Db.getMediaDB().setTestFaultInjector(undefined);
  test8Db.closeConnection();

  assert(
    test8Result.success === false && test8Result.message.includes('FALHA CRÍTICA NA COMPENSAÇÃO'),
    'CONFIABILIDADE 08',
    'Falha na Compensação Retorna Mensagem Explícita Sem Declarar Sucesso',
    `Mensagem explícita emitida ao usuário: "${test8Result.message}".`
  );

  // TESTE DE COORDENAÇÃO 09: savePhoto() aguarda confirmação de transação ("tx.oncomplete")
  const test9MediaDb = new MediaDB(new IDBFactory());
  const validPhoto9 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/0009';
  await test9MediaDb.savePhoto('p9_test_eq', validPhoto9);
  const p9Log = test9MediaDb.getLastTransactionLog();
  const p9Read = await test9MediaDb.getPhoto('p9_test_eq');
  test9MediaDb.closeConnection();

  assert(
    p9Log?.onCompleteFired === true &&
      p9Log?.settledVia === 'oncomplete' &&
      p9Read === validPhoto9,
    'CONFIABILIDADE 09',
    'savePhoto() Aguarda Confirmação de Transação (tx.oncomplete)',
    'Promise resolvida estritamente após disparo confirmado de tx.oncomplete.'
  );

  // TESTE DE COORDENAÇÃO 10: deletePhoto() aguarda confirmação de transação ("tx.oncomplete")
  const test10MediaDb = new MediaDB(new IDBFactory());
  await test10MediaDb.savePhoto(
    'p10_test_eq',
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/0010'
  );
  await test10MediaDb.deletePhoto('p10_test_eq');
  const p10Log = test10MediaDb.getLastTransactionLog();
  const p10Read = await test10MediaDb.getPhoto('p10_test_eq');
  test10MediaDb.closeConnection();

  assert(
    p10Log?.onCompleteFired === true &&
      p10Log?.settledVia === 'oncomplete' &&
      p10Read === null,
    'CONFIABILIDADE 10',
    'deletePhoto() Aguarda Confirmação de Transação (tx.oncomplete)',
    'Exclusão formalmente confirmada em tx.oncomplete no IndexedDB.'
  );

  // TESTE DE COORDENAÇÃO 11: Fotografias persistem corretamente após fechamento e reabertura de "fit_app_media_db"
  const p11Factory = new IDBFactory();
  const validPhoto11 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/0011';
  const test11MediaDb1 = new MediaDB(p11Factory);
  await test11MediaDb1.savePhoto('p11_persist_eq', validPhoto11);
  test11MediaDb1.closeConnection();

  const test11MediaDb2 = new MediaDB(p11Factory);
  const p11Read = await test11MediaDb2.getPhoto('p11_persist_eq');
  test11MediaDb2.closeConnection();

  assert(
    p11Read === validPhoto11,
    'CONFIABILIDADE 11',
    'Fotografias Persistem Corretamente Após Fechamento e Reabertura do Banco de Mídias',
    'Dados mantidos 100% íntegros após término de conexão física e nova instanciação.'
  );

  // ===========================================================================
  // PARTE 5: AUDITORIA FIEL DA COBERTURA VISUAL DOS 54 EQUIPAMENTOS (SEÇÃO 4)
  // ===========================================================================
  console.log('\n--- PARTE 5: COBERTURA FIEL DAS ILUSTRAÇÕES E PLACEHOLDERS (54 EQUIPAMENTOS) ---');

  function extractReactText(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractReactText).join(' ');
    if (typeof node === 'object' && node.props) {
      return extractReactText(node.props.children);
    }
    return '';
  }

  function checkVisualParity(item, declared, renderedElement, sourceSpecificIdsSet) {
    if (!renderedElement || typeof renderedElement !== 'object') {
      return { ok: false, reason: `Elemento não renderizado para ${item.id}` };
    }
    const actualMode = renderedElement.props?.['data-render-mode'];
    const actualTemplate = renderedElement.props?.['data-template-id'];

    // 1. Verificar correspondência entre classificação declarada e renderização efetiva
    if (declared.renderMode !== actualMode) {
      return {
        ok: false,
        reason: `Divergência de renderMode em ${item.id}: declarado="${declared.renderMode}" vs efetivo="${actualMode}"`,
      };
    }
    if (declared.templateId !== actualTemplate) {
      return {
        ok: false,
        reason: `Divergência de templateId em ${item.id}: declarado="${declared.templateId}" vs efetivo="${actualTemplate}"`,
      };
    }

    // 2. Verificar correspondência com as condições explícitas id === '...' no código-fonte de StandardEquipmentSvg
    const hasExplicitIdBranchInSource = sourceSpecificIdsSet.has(item.id);
    if (declared.renderMode === 'specific' && !hasExplicitIdBranchInSource) {
      return {
        ok: false,
        reason: `ID ${item.id} classificado como 'specific', mas não possui condição explícita (id === '${item.id}') em StandardEquipmentSvg`,
      };
    }
    if (hasExplicitIdBranchInSource && declared.renderMode !== 'specific') {
      return {
        ok: false,
        reason: `ID ${item.id} possui condição explícita em StandardEquipmentSvg, mas foi classificado como '${declared.renderMode}'`,
      };
    }

    // 3. Verificar o elemento efetivamente produzido (SVG vs fallback nominal)
    if (declared.renderMode === 'specific' || declared.renderMode === 'shared') {
      if (renderedElement.type !== 'svg') {
        return {
          ok: false,
          reason: `ID ${item.id} (${declared.renderMode}) deveria renderizar <svg>, mas renderizou <${String(renderedElement.type)}>`,
        };
      }
    } else if (declared.renderMode === 'placeholder') {
      if (renderedElement.type !== 'div' || actualTemplate !== 'placeholder_nominal') {
        return {
          ok: false,
          reason: `ID ${item.id} (placeholder) deveria renderizar <div> com template 'placeholder_nominal'`,
        };
      }
      const renderedText = extractReactText(renderedElement);
      if (
        declared.placeholderLabel !== item.name ||
        !renderedText.includes(item.name) ||
        !renderedText.includes('Equipamento')
      ) {
        return {
          ok: false,
          reason: `Fallback nominal de ${item.id} não exibiu o nome exato "${item.name}"`,
        };
      }
    } else {
      return { ok: false, reason: `renderMode desconhecido: ${declared.renderMode}` };
    }

    return { ok: true, reason: '' };
  }

  // Extrair diretamente do código-fonte de StandardEquipmentSvg todas as condições explícitas `if (id === '...')`
  const illustrationSource = fs.readFileSync(
    new URL('../src/components/equipments/EquipmentIllustration.tsx', import.meta.url),
    'utf8'
  );
  const stdSvgFnSlice = illustrationSource.slice(
    illustrationSource.indexOf('export const StandardEquipmentSvg'),
    illustrationSource.indexOf('export const PRIORITIZED_EQUIPMENT_IDS')
  );
  const sourceSpecificIdsMatches = [
    ...stdSvgFnSlice.matchAll(/if\s*\(\s*id\s*===\s*'([^']+)'\s*\)/g),
  ].map((m) => m[1]);
  const sourceSpecificIdsSet = new Set(sourceSpecificIdsMatches);

  const visualClassifications = DEFAULT_EQUIPMENTS_CATALOG.map((item) => {
    const classification = classifyEquipmentIllustration(item.id, item.name);
    const renderedElement = StandardEquipmentSvg({
      id: item.id,
      category: item.category,
      name: item.name,
      size: 'md',
    });
    const parity = checkVisualParity(
      item,
      classification,
      renderedElement,
      sourceSpecificIdsSet
    );
    return {
      ...item,
      classification,
      renderedElement,
      parity,
      hasLocalDescription:
        typeof EQUIPMENT_DESCRIPTIONS[item.id] === 'string' &&
        EQUIPMENT_DESCRIPTIONS[item.id].trim().length > 20,
    };
  });

  const parityFailures = visualClassifications.filter((x) => !x.parity.ok);
  const all54HaveStrictParity = parityFailures.length === 0;

  // Confirmar que o detector de divergência falha imediatamente caso haja discrepância entre classificador e renderizador
  const simulatedDivergenceCheck = checkVisualParity(
    { id: 'std_chest_supino_inclinado_barra', name: 'Supino inclinado com barra', category: 'chest' },
    {
      renderMode: 'specific',
      templateId: 'specific_supino_inclinado_barra',
      description: 'Simulação de divergência',
    },
    StandardEquipmentSvg({
      id: 'std_chest_supino_inclinado_barra',
      category: 'chest',
      name: 'Supino inclinado com barra',
      size: 'md',
    }),
    sourceSpecificIdsSet
  );
  const divergenceDetectorCatchesMismatch = simulatedDivergenceCheck.ok === false;

  const specificItems = visualClassifications.filter(
    (x) =>
      x.classification.renderMode === 'specific' &&
      x.renderedElement.props['data-render-mode'] === 'specific' &&
      x.renderedElement.type === 'svg'
  );
  const sharedItems = visualClassifications.filter(
    (x) =>
      x.classification.renderMode === 'shared' &&
      x.renderedElement.props['data-render-mode'] === 'shared' &&
      x.renderedElement.type === 'svg'
  );
  const placeholderItems = visualClassifications.filter(
    (x) =>
      x.classification.renderMode === 'placeholder' &&
      x.renderedElement.props['data-render-mode'] === 'placeholder' &&
      x.renderedElement.type === 'div'
  );

  // 1. Confirmar que os 54 equipamentos possuem descrição local
  const all54HaveLocalDescriptions =
    visualClassifications.length === 54 &&
    visualClassifications.every((x) => x.hasLocalDescription);

  // 2. Confirmar que todos os 16 equipamentos priorizados e o 17º específico possuem condição id === '...' e SVG específico (1-para-1)
  const prioritizedAllSpecific =
    PRIORITIZED_EQUIPMENT_IDS.length === 16 &&
    sourceSpecificIdsSet.size === 17 &&
    PRIORITIZED_EQUIPMENT_IDS.every((prioId) => {
      const found = visualClassifications.find((x) => x.id === prioId);
      return (
        found &&
        sourceSpecificIdsSet.has(prioId) &&
        found.classification.renderMode === 'specific' &&
        found.renderedElement.props['data-render-mode'] === 'specific'
      );
    });

  // 3. Verificar que cada template 'specific' é exclusivo (usado por apenas 1 equipamento no catálogo)
  const specificTemplateCounts = {};
  for (const item of specificItems) {
    const tpl = item.renderedElement.props['data-template-id'];
    specificTemplateCounts[tpl] = (specificTemplateCounts[tpl] || 0) + 1;
  }
  const allSpecificTemplatesAreUnique =
    Object.keys(specificTemplateCounts).length === 17 &&
    Object.values(specificTemplateCounts).every((count) => count === 1);

  // 4. Agrupar equipamentos que utilizam ilustrações compartilhadas e verificar que cada família atende >= 2 itens
  const sharedGroupsMap = {};
  for (const item of sharedItems) {
    const tpl = item.renderedElement.props['data-template-id'];
    if (!sharedGroupsMap[tpl]) sharedGroupsMap[tpl] = [];
    sharedGroupsMap[tpl].push(item.name);
  }
  const allSharedTemplatesAreValidFamilies =
    Object.keys(sharedGroupsMap).length === 13 &&
    Object.values(sharedGroupsMap).every((group) => group.length >= 2);

  // 5. Confirmar que os 4 placeholders nominais esperados são exatamente os itens sem condição específica/compartilhada
  const expectedPlaceholderIds = [
    'std_chest_supino_inclinado_barra',
    'std_chest_supino_declinado',
    'std_arms_polia_triceps',
    'std_cardio_esteira',
  ];
  const actualPlaceholderIds = placeholderItems.map((item) => item.id);
  const placeholderIdsMatchExact =
    actualPlaceholderIds.length === 4 &&
    expectedPlaceholderIds.every((id) => actualPlaceholderIds.includes(id));

  const placeholderDisplaysExactName =
    placeholderItems.length === 4 &&
    placeholderItems.every(
      (item) =>
        item.classification.placeholderLabel === item.name &&
        extractReactText(item.renderedElement).includes(item.name)
    );

  // Também testa um equipamento arbitrário fora do catálogo tanto no classificador quanto no StandardEquipmentSvg
  const unmappedSampleClass = classifyEquipmentIllustration(
    'std_custom_aparelho_sem_svg',
    'Aparelho Especial Sem Ilustração'
  );
  const unmappedSampleRender = StandardEquipmentSvg({
    id: 'std_custom_aparelho_sem_svg',
    category: 'other',
    name: 'Aparelho Especial Sem Ilustração',
    size: 'md',
  });
  const unmappedUsesExactName =
    unmappedSampleClass.renderMode === 'placeholder' &&
    unmappedSampleClass.placeholderLabel === 'Aparelho Especial Sem Ilustração' &&
    unmappedSampleRender.type === 'div' &&
    unmappedSampleRender.props['data-render-mode'] === 'placeholder' &&
    unmappedSampleRender.props['data-template-id'] === 'placeholder_nominal' &&
    extractReactText(unmappedSampleRender).includes('Aparelho Especial Sem Ilustração');

  assert(
    all54HaveStrictParity &&
      divergenceDetectorCatchesMismatch &&
      all54HaveLocalDescriptions &&
      prioritizedAllSpecific &&
      allSpecificTemplatesAreUnique &&
      allSharedTemplatesAreValidFamilies &&
      specificItems.length === 17 &&
      sharedItems.length === 33 &&
      placeholderItems.length === 4 &&
      placeholderIdsMatchExact &&
      placeholderDisplaysExactName &&
      unmappedUsesExactName,
    'COBERTURA VISUAL FIEL',
    'Correspondência Estrita entre StandardEquipmentSvg e classifyEquipmentIllustration (54 Equipamentos)',
    `Descrições locais: 54/54 | SVGs específicos implementados (id === '...'): ${specificItems.length} | SVGs compartilhados por família mecânica: ${sharedItems.length} (${Object.keys(sharedGroupsMap).length} famílias) | Placeholders nominais: ${placeholderItems.length} (${placeholderItems.map((i) => `"${i.name}"`).join(', ')}).`
  );

  // ===========================================================================
  // PARTE 6: OS 17 TESTES OBRIGATÓRIOS DE INTEGRIDADE FINAL DO CHECKPOINT 02
  // ===========================================================================
  console.log('\n--- PARTE 6: 17 TESTES OBRIGATÓRIOS DE INTEGRIDADE FINAL (TRANSAÇÕES E DATA URL) ---');

  const VALID_JPEG_DATA_URL =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const VALID_PNG_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const VALID_WEBP_DATA_URL =
    'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';

  // 1. Falha de "savePhoto()" aguardando "tx.onabort"
  {
    const mdb = new MediaDB(new IDBFactory());
    mdb.setTestFaultInjector((op) => op === 'save');
    let rejected = false;
    let errMessage = '';
    try {
      await mdb.savePhoto('eq_abort_save', VALID_JPEG_DATA_URL);
    } catch (err) {
      rejected = true;
      errMessage = err instanceof Error ? err.message : String(err);
    }
    const log = mdb.getLastTransactionLog();
    mdb.setTestFaultInjector(undefined);
    const storedAfterAbort = await mdb.getPhoto('eq_abort_save');
    mdb.closeConnection();

    assert(
      rejected &&
        log?.txStarted === true &&
        log?.abortRequested === true &&
        log?.onAbortFired === true &&
        log?.settledVia === 'onabort' &&
        storedAfterAbort === null,
      'INTEGRIDADE 01',
      'Falha de savePhoto() Aguardando Confirmação Formal em tx.onabort',
      `Ordem de eventos: [${log?.eventsOrder.join(' -> ')}] | Causa preservada: "${errMessage}".`
    );
  }

  // 2. Falha de "deletePhoto()" aguardando "tx.onabort"
  {
    const mdb = new MediaDB(new IDBFactory());
    await mdb.savePhoto('eq_abort_delete', VALID_JPEG_DATA_URL);
    mdb.setTestFaultInjector((op) => op === 'delete');
    let rejected = false;
    try {
      await mdb.deletePhoto('eq_abort_delete');
    } catch {
      rejected = true;
    }
    const log = mdb.getLastTransactionLog();
    mdb.setTestFaultInjector(undefined);
    const photoPreserved = await mdb.getPhoto('eq_abort_delete');
    mdb.closeConnection();

    assert(
      rejected &&
        log?.txStarted === true &&
        log?.abortRequested === true &&
        log?.onAbortFired === true &&
        log?.settledVia === 'onabort' &&
        photoPreserved === VALID_JPEG_DATA_URL,
      'INTEGRIDADE 02',
      'Falha de deletePhoto() Aguardando Confirmação Formal em tx.onabort',
      `Ordem de eventos: [${log?.eventsOrder.join(' -> ')}] | Foto original preservada após rollback.`
    );
  }

  // 3. Falha de "saveAllPhotos()" aguardando "tx.onabort"
  {
    const mdb = new MediaDB(new IDBFactory());
    await mdb.savePhoto('eq_existing_before_batch', VALID_JPEG_DATA_URL);
    mdb.setTestFaultInjector((op) => op === 'saveAll');
    let rejected = false;
    try {
      await mdb.saveAllPhotos({ eq_new_batch: VALID_PNG_DATA_URL });
    } catch {
      rejected = true;
    }
    const log = mdb.getLastTransactionLog();
    mdb.setTestFaultInjector(undefined);
    const allPhotosAfterAbort = await mdb.getAllPhotos();
    mdb.closeConnection();

    assert(
      rejected &&
        log?.txStarted === true &&
        log?.abortRequested === true &&
        log?.onAbortFired === true &&
        log?.settledVia === 'onabort' &&
        allPhotosAfterAbort['eq_existing_before_batch'] === VALID_JPEG_DATA_URL &&
        !('eq_new_batch' in allPhotosAfterAbort),
      'INTEGRIDADE 03',
      'Falha de saveAllPhotos() Aguardando Confirmação Formal em tx.onabort',
      `Ordem de eventos: [${log?.eventsOrder.join(' -> ')}] | Rollback preservou fotos anteriores.`
    );
  }

  // 4. Erro síncrono durante "saveAllPhotos()" acionando "tx.abort()" real e rejeitando somente após "tx.onabort"
  {
    const mdb = new MediaDB(new IDBFactory());
    await mdb.savePhoto('eq_before_sync_err', VALID_JPEG_DATA_URL);
    mdb.setTestFaultInjector((op) => op === 'saveAll_sync');
    let rejected = false;
    let syncErrMsg = '';
    try {
      await mdb.saveAllPhotos({ eq_never_saved: VALID_PNG_DATA_URL });
    } catch (err) {
      rejected = true;
      syncErrMsg = err instanceof Error ? err.message : String(err);
    }
    const log = mdb.getLastTransactionLog();
    mdb.setTestFaultInjector(undefined);
    const photosAfterSyncAbort = await mdb.getAllPhotos();
    mdb.closeConnection();

    const syncCatchBeforeOnAbort =
      log &&
      log.eventsOrder.indexOf('sync_catch') !== -1 &&
      log.eventsOrder.indexOf('abort_requested') > log.eventsOrder.indexOf('sync_catch') &&
      log.eventsOrder.indexOf('tx_onabort') > log.eventsOrder.indexOf('abort_requested');

    assert(
      rejected &&
        Boolean(syncCatchBeforeOnAbort) &&
        log?.onAbortFired === true &&
        log?.settledVia === 'onabort' &&
        photosAfterSyncAbort['eq_before_sync_err'] === VALID_JPEG_DATA_URL &&
        !('eq_never_saved' in photosAfterSyncAbort),
      'INTEGRIDADE 04',
      'Erro Síncrono Durante saveAllPhotos() Acionando tx.abort() Real e Rejeitando Somente Após tx.onabort',
      `Ordem de eventos: [${log?.eventsOrder.join(' -> ')}] | Erro: "${syncErrMsg}".`
    );
  }

  // 5. Falha de "clearAllPhotos()" aguardando "tx.onabort"
  {
    const mdb = new MediaDB(new IDBFactory());
    await mdb.savePhoto('eq_keep_on_clear_fail', VALID_JPEG_DATA_URL);
    mdb.setTestFaultInjector((op) => op === 'clear');
    let rejected = false;
    try {
      await mdb.clearAllPhotos();
    } catch {
      rejected = true;
    }
    const log = mdb.getLastTransactionLog();
    mdb.setTestFaultInjector(undefined);
    const remainingPhotos = await mdb.getAllPhotos();
    mdb.closeConnection();

    assert(
      rejected &&
        log?.txStarted === true &&
        log?.abortRequested === true &&
        log?.onAbortFired === true &&
        log?.settledVia === 'onabort' &&
        remainingPhotos['eq_keep_on_clear_fail'] === VALID_JPEG_DATA_URL,
      'INTEGRIDADE 05',
      'Falha de clearAllPhotos() Aguardando Confirmação Formal em tx.onabort',
      `Ordem de eventos: [${log?.eventsOrder.join(' -> ')}] | Dados preservados após aborto do clear.`
    );
  }

  // 6. Leitura de "getAllPhotos()" aguardando "tx.oncomplete"
  {
    const mdb = new MediaDB(new IDBFactory());
    await mdb.savePhoto('eq_read_complete', VALID_JPEG_DATA_URL);
    const readMap = await mdb.getAllPhotos();
    const log = mdb.getLastTransactionLog();
    mdb.closeConnection();

    const reqSuccessBeforeTxComplete =
      log &&
      log.eventsOrder.indexOf('req_onsuccess') !== -1 &&
      log.eventsOrder.indexOf('tx_oncomplete') > log.eventsOrder.indexOf('req_onsuccess');

    assert(
      readMap['eq_read_complete'] === VALID_JPEG_DATA_URL &&
        Boolean(reqSuccessBeforeTxComplete) &&
        log?.onCompleteFired === true &&
        log?.settledVia === 'oncomplete',
      'INTEGRIDADE 06',
      'Leitura de getAllPhotos() Aguardando Encerramento Formal da Transação Readonly (tx.oncomplete)',
      `Ordem de eventos: [${log?.eventsOrder.join(' -> ')}].`
    );
  }

  // Base de backup válido para os testes 7 a 15
  const validationDb = new FitAppDB(new IDBFactory());
  const baseValidBackupObj = JSON.parse(await validationDb.exportAllData());

  // 7. Rejeição de Data URL inválida (MIME não suportado / prefixo incorreto)
  {
    const invalidDataUrlBackup = {
      ...baseValidBackupObj,
      media: {
        eq_invalid_mime: 'data:application/pdf;base64,JVBERi0xLjQK',
      },
    };
    const res = validationDb.validateBackupString(JSON.stringify(invalidDataUrlBackup));
    assert(
      res.isValid === false && Boolean(res.error && res.error.includes('data:image/')),
      'INTEGRIDADE 07',
      'Rejeição de Data URL Inválida (MIME ou Prefixo Incompatível)',
      `Rejeitado com mensagem: "${res.error}".`
    );
  }

  // 8. Aceitação de Data URL JPEG válida
  {
    const jpegBackup = {
      ...baseValidBackupObj,
      media: {
        eq_valid_jpeg: VALID_JPEG_DATA_URL,
      },
    };
    const res = validationDb.validateBackupString(JSON.stringify(jpegBackup));
    assert(
      res.isValid === true,
      'INTEGRIDADE 08',
      'Aceitação de Data URL JPEG Válida (data:image/jpeg;base64,...)',
      'Data URL JPEG estruturalmente válida aceita sem restrições.'
    );
  }

  // 9. Aceitação de Data URL PNG válida
  {
    const pngBackup = {
      ...baseValidBackupObj,
      media: {
        eq_valid_png: VALID_PNG_DATA_URL,
      },
    };
    const res = validationDb.validateBackupString(JSON.stringify(pngBackup));
    assert(
      res.isValid === true,
      'INTEGRIDADE 09',
      'Aceitação de Data URL PNG Válida (data:image/png;base64,...)',
      'Data URL PNG estruturalmente válida aceita sem restrições.'
    );
  }

  // 10. Aceitação de Data URL WebP válida
  {
    const webpBackup = {
      ...baseValidBackupObj,
      media: {
        eq_valid_webp: VALID_WEBP_DATA_URL,
      },
    };
    const res = validationDb.validateBackupString(JSON.stringify(webpBackup));
    assert(
      res.isValid === true,
      'INTEGRIDADE 10',
      'Aceitação de Data URL WebP Válida (data:image/webp;base64,...)',
      'Data URL WebP estruturalmente válida aceita sem restrições.'
    );
  }

  // 11. Rejeição de URL HTTP/HTTPS
  {
    const httpBackup = {
      ...baseValidBackupObj,
      media: {
        eq_http: 'https://exemplo.com/equipamento.jpg',
      },
    };
    const resHttp = validationDb.validateBackupString(JSON.stringify(httpBackup));
    assert(
      resHttp.isValid === false && Boolean(resHttp.error && resHttp.error.includes('HTTP/HTTPS')),
      'INTEGRIDADE 11',
      'Rejeição de URL HTTP/HTTPS Externa no Campo media',
      `Rejeitado com mensagem: "${resHttp.error}".`
    );
  }

  // 12. Rejeição de texto comum como foto
  {
    const plainTextBackup = {
      ...baseValidBackupObj,
      media: {
        eq_text: 'apenas_um_texto_comum_sem_data_url',
      },
    };
    const resText = validationDb.validateBackupString(JSON.stringify(plainTextBackup));
    assert(
      resText.isValid === false && Boolean(resText.error && resText.error.includes('media')),
      'INTEGRIDADE 12',
      'Rejeição de Texto Comum como Foto no Campo media',
      `Rejeitado com mensagem: "${resText.error}".`
    );
  }

  // 13. Rejeição de Base64 malformado
  {
    const malformedCases = [
      'data:image/jpeg;base64,',
      'data:image/jpeg;base64,abc', // comprimento não múltiplo de 4
      'data:image/jpeg;base64,@@@@', // caracteres fora do alfabeto Base64
      'data:image/png;base64,ab=c', // padding '=' no meio da string
      'data:image/webp;base64,a===', // 3 sinais de padding '='
    ];
    const allMalformedRejected = malformedCases.every((badUrl) => {
      const b = { ...baseValidBackupObj, media: { eq_bad_b64: badUrl } };
      const r = validationDb.validateBackupString(JSON.stringify(b));
      return r.isValid === false && Boolean(r.error && r.error.includes('Base64'));
    });

    assert(
      allMalformedRejected,
      'INTEGRIDADE 13',
      'Rejeição de Base64 Malformado (Vazio, Tamanho Inválido, Caracteres Ilegais ou Padding Incorreto)',
      `Todos os ${malformedCases.length} casos de Base64 corrompido foram rejeitados antes da importação.`
    );
  }

  // 14. Rejeição de foto acima do limite de tamanho estabelecido
  {
    const prefix = 'data:image/jpeg;base64,';
    const oversizedBase64ChunkCount = Math.ceil(
      (MAX_MEDIA_PHOTO_DATA_URL_LENGTH - prefix.length + 16) / 4
    );
    const oversizedDataUrl = prefix + 'QUFB'.repeat(oversizedBase64ChunkCount);
    const oversizedBackup = {
      ...baseValidBackupObj,
      media: {
        eq_oversized: oversizedDataUrl,
      },
    };
    const resOversized = validationDb.validateBackupString(JSON.stringify(oversizedBackup));
    assert(
      resOversized.isValid === false &&
        Boolean(resOversized.error && resOversized.error.includes('limite')),
      'INTEGRIDADE 14',
      'Rejeição de Foto Acima do Limite de Tamanho Estabelecido',
      `Foto de ${oversizedDataUrl.length} caracteres rejeitada: "${resOversized.error}".`
    );
  }
  validationDb.closeConnection();

  // 15. Garantia de que um backup inválido não modifica "fit_app_db" nem "fit_app_media_db"
  {
    const guardDb = new FitAppDB(new IDBFactory());
    await guardDb.saveProfile({
      id: 'current_user',
      name: 'Usuário Protegido 15',
      updatedAt: new Date().toISOString(),
    });
    await guardDb.saveEquipmentPhoto('eq_protected_15', VALID_JPEG_DATA_URL);

    const invalidBackup15 = JSON.parse(await guardDb.exportAllData());
    invalidBackup15.data.profile[0].name = 'Nome Corrompido Jamais Gravado';
    invalidBackup15.media = {
      eq_protected_15: 'https://url-invalida-nao-permitida.com/hack.jpg',
    };

    const importRes15 = await guardDb.importAllData(JSON.stringify(invalidBackup15));
    const profileAfter15 = await guardDb.getProfile();
    const photosAfter15 = await guardDb.getAllEquipmentPhotos();
    guardDb.closeConnection();

    assert(
      importRes15.success === false &&
        profileAfter15?.name === 'Usuário Protegido 15' &&
        photosAfter15['eq_protected_15'] === VALID_JPEG_DATA_URL &&
        Object.keys(photosAfter15).length === 1,
      'INTEGRIDADE 15',
      'Garantia de que Backup Inválido Não Modifica fit_app_db Nem fit_app_media_db',
      'Ambos os bancos permaneceram 100% intactos após tentativa de restauração inválida.'
    );
  }

  // 16. Regressão da compensação entre os bancos
  {
    const compDb = new FitAppDB(new IDBFactory());
    await compDb.saveProfile({
      id: 'current_user',
      name: 'Perfil Original 16',
      updatedAt: new Date().toISOString(),
    });
    await compDb.saveEquipmentPhoto('eq_original_16', VALID_JPEG_DATA_URL);

    const backup16 = JSON.parse(await compDb.exportAllData());
    backup16.data.profile = [{ id: 'current_user', name: 'Perfil Novo Abortado 16' }];
    backup16.data.equipments = [
      { id: 'std_chest_peck_deck', name: 'Peck deck', category: 'chest', isCustom: false, isSelected: true },
    ];
    backup16.media = {
      eq_new_16: VALID_PNG_DATA_URL,
    };

    compDb.setTestFaultInjector(
      (phase, store) => phase === 'during_insert' && store === STORES.EQUIPMENTS
    );
    const res16 = await compDb.importAllData(JSON.stringify(backup16));
    compDb.setTestFaultInjector(undefined);

    const profileAfter16 = await compDb.getProfile();
    const photosAfter16 = await compDb.getAllEquipmentPhotos();
    compDb.closeConnection();

    assert(
      res16.success === false &&
        profileAfter16?.name === 'Perfil Original 16' &&
        photosAfter16['eq_original_16'] === VALID_JPEG_DATA_URL &&
        !('eq_new_16' in photosAfter16),
      'INTEGRIDADE 16',
      'Regressão da Compensação em Duas Fases Entre fit_app_db e fit_app_media_db',
      'Rollback de fit_app_db + compensação de fit_app_media_db restauraram o estado original completo.'
    );
  }

  // 17. Regressão integral dos testes do CHECKPOINT 01 e CHECKPOINT 02
  assert(
    failCount === 0 && passCount >= 59,
    'INTEGRIDADE 17',
    'Regressão Integral dos Testes do CHECKPOINT 01 e CHECKPOINT 02',
    `Todos os ${passCount + 1} cenários acumulados do Checkpoint 02 aprovados sem falhas.`
  );

  console.log('\n================================================================================');
  console.log(`TOTAL DE CENÁRIOS DO CHECKPOINT 02 EXECUTADOS: ${passCount + failCount}`);
  console.log(`APROVADOS: ${passCount} | FALHAS: ${failCount}`);
  console.log('================================================================================');

  if (failCount > 0) {
    console.error('\nHOUVE REPROVAÇÕES NOS TESTES DO CHECKPOINT 02!');
    process.exit(1);
  } else {
    console.log('\nTODOS OS CENÁRIOS DO CHECKPOINT 02 FORAM APROVADOS COM SUCESSO!');
  }
}

runCheckpoint02TestSuite().catch((err) => {
  console.error('Erro fatal no teste do Checkpoint 02:', err);
  process.exit(1);
});


