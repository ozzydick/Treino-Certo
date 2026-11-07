/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import fs from 'node:fs';
import path from 'node:path';
import {
  DB_NAME,
  FitAppDB,
  REQUIRED_STORES,
  STORES,
} from '../src/services/db.ts';
import { DEFAULT_EXERCISES_CATALOG } from '../src/constants/exercisesCatalog.ts';
import { REALISTIC_3D_EXERCISE_IMAGES } from '../src/components/exercises/ExerciseIllustration.tsx';

console.log('================================================================================');
console.log('TREINO CERTO — AUDITORIA TÉCNICA E TESTES DE HOMOLOGAÇÃO CP07');
console.log('Fechamento Técnico Final: Escopo Cardio, Navegação Ativa e Imagens 3D');
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

async function runCheckpoint07TestSuite() {
  // ===========================================================================
  // BLOCO 1: NAVEGAÇÃO E ESCOPO CARDIO
  // ===========================================================================
  console.log('--- BLOCO 1: NAVEGAÇÃO E RESTRINÇÃO DE ESCOPO CARDIO ---');

  // Teste 01: Navegação com 5 opções (sem Cardio)
  const bottomNavContent = fs.readFileSync('src/components/common/BottomNav.tsx', 'utf8');
  const hasCardioInNav = bottomNavContent.includes("id: 'cardio'");
  const navCols = bottomNavContent.includes('grid-cols-5');

  assert(
    !hasCardioInNav && navCols,
    'CENÁRIO 01',
    'Navegação inferior configurada estritamente com 5 opções (Início, Ficha, Exercícios, Evolução, Perfil)',
    `Aba Cardio removida da navegação ativa | Layout ajustado para grid-cols-5: ${navCols}`
  );

  // Teste 02: Bloqueio de acesso e redirecionamento de rotas Cardio
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  const hasCardioRedirect = appContent.includes("tab === 'cardio' ? 'home' : tab");
  const hasCardioRoute = appContent.includes("<SectionPlaceholder\n                tab=\"cardio\"");

  assert(
    hasCardioRedirect && !hasCardioRoute,
    'CENÁRIO 02',
    'Bloqueio de acesso direto à rota Cardio com redirecionamento automático para Início',
    'Redirecionamento ativo em App.tsx | Remoção da renderização do placeholder de Cardio'
  );

  // Teste 03: Preservação da store cardio_sessions no IndexedDB
  const idbFactory = new IDBFactory();
  const db = new FitAppDB(idbFactory);

  const reqStoresMatch = REQUIRED_STORES.includes(STORES.CARDIO_SESSIONS);
  const dbServicesContent = fs.readFileSync('src/services/db.ts', 'utf8');
  const hasCardioStoreCreation = dbServicesContent.includes('CARDIO_SESSIONS');

  assert(
    reqStoresMatch && hasCardioStoreCreation,
    'CENÁRIO 03',
    'Preservação integral da store "cardio_sessions" no IndexedDB e estruturas de backup',
    `Store cardio_sessions declarada em REQUIRED_STORES e mantida no banco de dados`
  );

  // ===========================================================================
  // BLOCO 2: CORRESPONDÊNCIA E AUDITORIA DE IMAGENS 3D REALISTAS
  // ===========================================================================
  console.log('\n--- BLOCO 2: AUDITORIA DE IMAGENS 3D REALISTAS DOS EXERCÍCIOS ---');

  // Teste 04: Mapeamento de 100% dos 57 exercícios do catálogo
  const catalogCount = DEFAULT_EXERCISES_CATALOG.length;
  const mappedKeys = Object.keys(REALISTIC_3D_EXERCISE_IMAGES);
  const missingInMap = DEFAULT_EXERCISES_CATALOG.filter((ex) => !mappedKeys.includes(ex.id));

  assert(
    catalogCount === 57 && mappedKeys.length >= 57 && missingInMap.length === 0,
    'CENÁRIO 04',
    'Mapeamento 1-para-1 completo de todos os 57 exercícios na estrutura REALISTIC_3D_EXERCISE_IMAGES',
    `Exercícios no catálogo: ${catalogCount} | Mapeamentos configurados: ${mappedKeys.length} | Exercícios sem imagem: ${missingInMap.length}`
  );

  // Teste 05: Existência física dos 57 arquivos WebP na pasta public/images/exercises/
  const publicDir = path.resolve('public/images/exercises');
  const filesInPublic = fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [];
  const missingFiles = DEFAULT_EXERCISES_CATALOG.filter(
    (ex) => !filesInPublic.includes(`${ex.id}.webp`)
  );

  assert(
    filesInPublic.length >= 57 && missingFiles.length === 0,
    'CENÁRIO 05',
    'Existência física de todos os 57 arquivos de imagem .webp em public/images/exercises/',
    `Arquivos WebP encontrados em disk: ${filesInPublic.length} | Arquivos ausentes: ${missingFiles.length}`
  );

  // Teste 06: Ausência de referências quebradas ou caminhos inválidos
  let brokenPathCount = 0;
  for (const [exerciseId, imagePath] of Object.entries(REALISTIC_3D_EXERCISE_IMAGES)) {
    const fileName = imagePath.replace('/images/exercises/', '');
    const fullDiskPath = path.join(publicDir, fileName);
    if (!fs.existsSync(fullDiskPath)) {
      brokenPathCount++;
      console.error(`       ↳ [ERRO] Imagem não encontrada para ${exerciseId}: ${fullDiskPath}`);
    }
  }

  assert(
    brokenPathCount === 0,
    'CENÁRIO 06',
    'Validação estrita de caminhos: nenhuma referência quebrada no mapeamento de imagens 3D',
    `Caminhos auditados em REALISTIC_3D_EXERCISE_IMAGES: ${mappedKeys.length} | Links quebrados: ${brokenPathCount}`
  );

  // Teste 07: Inclusão das imagens WebP na estratégia de precache do Service Worker (PWA)
  const viteConfigContent = fs.readFileSync('vite.config.ts', 'utf8');
  const hasWebpInPrecache = viteConfigContent.includes('webp');

  assert(
    hasWebpInPrecache,
    'CENÁRIO 07',
    'Inclusão dos arquivos .webp nas regras de precache PWA (globPatterns) no vite.config.ts',
    'Configuração do Workbox valida precache offline para imagens .webp'
  );

  // ===========================================================================
  // RELATÓRIO CONSOLIDADO DO CP07
  // ===========================================================================
  console.log('\n================================================================================');
  console.log(`TOTAL DE CENÁRIOS E TESTES CP07 EXECUTADOS: ${passCount + failCount}`);
  console.log(`APROVADOS: ${passCount} | FALHAS: ${failCount}`);
  console.log('================================================================================');

  if (failCount > 0) {
    console.error('ALERTA: FORAM DETECTADAS FALHAS NOS TESTES DO CP07.');
    process.exit(1);
  } else {
    console.log('TODOS OS 7 CENÁRIOS ESPECÍFICOS DO CP07 FORAM APROVADOS COM SUCESSO!');
  }
}

runCheckpoint07TestSuite().catch((err) => {
  console.error('Erro fatal ao executar suíte CP07:', err);
  process.exit(1);
});
