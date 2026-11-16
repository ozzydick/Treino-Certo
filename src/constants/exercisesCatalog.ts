/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EquipmentCategory,
  ExerciseItem,
  GymEquipmentItem,
  MUSCLE_GROUP_LABELS,
  MuscleGroupId,
} from '../types';
import { DEFAULT_EQUIPMENTS_CATALOG } from './equipmentsCatalog';
import { ORDERED_MUSCLE_GROUPS, buildExplicitCustomCompatibilityMap } from './exerciseCatalogMeta';
import type { ExplicitCustomCompatibilityMap } from './exerciseCatalogMeta';
export { ORDERED_MUSCLE_GROUPS, buildExplicitCustomCompatibilityMap } from './exerciseCatalogMeta';
export type { ExplicitCustomCompatibilityMap } from './exerciseCatalogMeta';

/**
 * Ordem oficial dos 11 grupos musculares da biblioteca do TREINO CERTO (Checkpoint 03).
 */

/**
 * Domínios externos confiáveis para referências técnicas de vídeo demonstrativo.
 */
export const TRUSTED_VIDEO_DOMAINS: readonly string[] = [
  'exrx.net',
  'www.exrx.net',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'musclewiki.com',
  'www.musclewiki.com',
];

/**
 * Valida exclusivamente a estrutura sintática de uma URL de vídeo externo
 * (protocolo HTTPS, domínio confiável e caminho não vazio).
 *
 * IMPORTANTE: Esta validação estrutural NÃO comprova que a página remota existe,
 * que responde com sucesso (HTTP 200) ou que o conteúdo remoto corresponde ao exercício.
 * Para apresentação como demonstração validada, utilize `isExternalVideoVerifiedAndValid()`.
 */
export function validateExternalVideoUrl(url?: string | null): {
  valid: boolean;
  sanitizedUrl: string | null;
  reason?: string;
} {
  if (url === undefined || url === null || url === '') {
    return { valid: false, sanitizedUrl: null, reason: 'URL de vídeo ausente.' };
  }

  if (typeof url !== 'string') {
    return { valid: false, sanitizedUrl: null, reason: 'URL de vídeo deve ser texto.' };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, sanitizedUrl: null, reason: 'URL de vídeo vazia.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, sanitizedUrl: null, reason: 'URL de vídeo malformada.' };
  }

  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      sanitizedUrl: null,
      reason: 'Apenas URLs seguras com protocolo HTTPS são permitidas.',
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!TRUSTED_VIDEO_DOMAINS.includes(hostname)) {
    return {
      valid: false,
      sanitizedUrl: null,
      reason: `Domínio de vídeo não homologado: ${hostname}.`,
    };
  }

  if (!parsed.pathname || parsed.pathname === '/') {
    return {
      valid: false,
      sanitizedUrl: null,
      reason: 'URL de vídeo não especifica um recurso de demonstração.',
    };
  }

  if (
    (hostname === 'youtube.com' || hostname === 'www.youtube.com') &&
    parsed.pathname === '/watch' &&
    !parsed.searchParams.get('v')
  ) {
    return {
      valid: false,
      sanitizedUrl: null,
      reason: 'Link do YouTube sem identificador de vídeo (v).',
    };
  }

  return { valid: true, sanitizedUrl: parsed.toString() };
}

/**
 * Verifica se um exercício possui simultaneamente uma URL estruturalmente válida
 * E confirmação efetiva do destino/conteúdo remoto (`externalVideoVerified === true`).
 * Quando não for possível confirmar um destino remoto, ele é tratado como não verificado
 * e não é apresentado como demonstração validada.
 */
export function isExternalVideoVerifiedAndValid(
  exercise: Pick<ExerciseItem, 'externalVideoUrl' | 'externalVideoVerified'>
): boolean {
  if (exercise.externalVideoVerified !== true) {
    return false;
  }
  return validateExternalVideoUrl(exercise.externalVideoUrl).valid;
}

/**
 * Catálogo oficial de exercícios do TREINO CERTO (Checkpoint 03 em expansão).
 *
 * Diretrizes seguidas:
 * - Exercícios distribuídos nos 11 grupos musculares oficiais.
 * - Compatibilidade biomecânica real utilizando exclusivamente os IDs oficiais do Checkpoint 02,
 *   com combinações obrigatórias (AND) e alternativas independentes (OR) explícitas em `equipmentAlternatives`.
 * - Instruções técnicas completas, claras e fundamentadas.
 * - Links externos cujo destino remoto não pôde ser confirmado permanecem marcados com
 *   `externalVideoVerified: false` e não são apresentados como demonstração validada.
 */
export const DEFAULT_EXERCISES_CATALOG: readonly ExerciseItem[] = [
  {
      id: 'ex_peito_supino_reto_barra',
      name: 'Supino reto com barra',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros', 'triceps'],
      compatibleEquipmentIds: [
        'std_chest_supino_reto_barra',
        'std_general_barras_retas',
        'std_general_bancos_retos',
        'std_general_anilhas',
      ],
      equipmentAlternatives: [
        ['std_chest_supino_reto_barra'],
        ['std_general_barras_retas', 'std_general_bancos_retos', 'std_general_anilhas'],
      ],
      shortDescription:
        'Exercício multiarticular clássico para desenvolvimento global do peitoral maior, com ação sinergista de deltoide anterior e tríceps braquial.',
      initialPosition:
        'Deite-se em decúbito dorsal no banco reto com os pés firmemente apoiados no chão, retraia e deprima as escápulas contra o estofado e segure a barra com pegada pronada ligeiramente mais larga que a linha dos ombros.',
      executionSteps: [
        'Retire a barra do suporte mantendo os punhos firmes e alinhados diretamente sobre os cotovelos.',
        'Desça a barra de forma controlada em direção à linha média-inferior do esterno, mantendo os cotovelos entre 45° e 75° em relação ao tronco.',
        'Toque levemente a região peitoral (ou chegue próximo sem perder a estabilidade escapular) sem ricochetear a barra no tórax.',
        'Empurre a barra de volta à posição inicial estendendo os cotovelos sem projetar os ombros para a frente.',
      ],
      breathingGuide:
        'Inspire durante a fase excêntrica (descida da barra) e expire de forma firme ao concluir a fase concêntrica (subida).',
      commonMistakes: [
        'Abduzir os cotovelos a 90° alinhados ao pescoço, sobrecarregando a articulação glenoumeral.',
        'Bater a barra contra o peito para ganhar impulso na subida.',
        'Retirar os glúteos do banco ou perder a retração escapular ao empurrar.',
      ],
      safetyTips: [
        'Utilize presilhas nas extremidades da barra para evitar o deslizamento das anilhas.',
        'Em cargas elevadas, peça auxílio de um instrutor ou parceiro de treino para segurança.',
      ],
      illustrationId: 'svg_exercise_supino_reto_barra',
      externalVideoUrl: 'https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress',
      externalVideoSource: 'ExRx.net — Barbell Bench Press',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_supino_inclinado_halteres',
      name: 'Supino inclinado com halteres',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros', 'triceps'],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_general_bancos_regulaveis',
      ],
      equipmentAlternatives: [
        ['std_general_halteres', 'std_general_bancos_regulaveis'],
      ],
      shortDescription:
        'Variação com pesos livres em banco inclinado (30° a 45°) que enfatiza a porção clavicular (superior) do peitoral e exige estabilização independente de cada braço.',
      initialPosition:
        'Ajuste o encosto do banco regulável entre 30° e 45°. Sente-se com os halteres apoiados nas coxas, deite-se impulsionando os pesos com os joelhos e posicione os halteres na lateral do peitoral superior com as escápulas retraídas.',
      executionSteps: [
        'Posicione os antebraços na vertical, mantendo os punhos neutros e firmes.',
        'Empurre os halteres para cima em trajetória levemente convergente até estender os braços acima da linha clavicular, sem chocar os pesos no topo.',
        'Desça os halteres de maneira cadenciada até que os cotovelos fiquem levemente abaixo da linha do tronco, sentindo o alongamento controlado do peitoral.',
        'Retome a subida mantendo os pés fixos no solo e a lombar neutra.',
      ],
      breathingGuide:
        'Inspire ao descer os halteres controlando a carga e expire ao empurrá-los para cima.',
      commonMistakes: [
        'Ajustar o banco em inclinação excessiva (> 60°), transferindo o foco principal para os ombros.',
        'Bater os halteres com força no topo do movimento, perdendo tensão muscular.',
        'Descer os pesos com os punhos flexionados para trás.',
      ],
      safetyTips: [
        'Ao finalizar a série, traga os joelhos para receber os halteres antes de descer os pesos ao chão, protegendo o manguito rotador.',
        'Mantenha a cabeça e a coluna torácica apoiadas no encosto durante toda a série.',
      ],
      illustrationId: 'svg_exercise_supino_inclinado_halteres',
      externalVideoUrl: 'https://exrx.net/WeightExercises/PectoralClavicular/DBInclineBenchPress',
      externalVideoSource: 'ExRx.net — Dumbbell Incline Bench Press',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_crucifixo_peck_deck',
      name: 'Voador peitoral (Peck deck / Crucifixo máquina)',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros'],
      compatibleEquipmentIds: [
        'std_chest_peck_deck',
        'std_chest_crucifixo_maquina',
      ],
      equipmentAlternatives: [
        ['std_chest_peck_deck'],
        ['std_chest_crucifixo_maquina'],
      ],
      shortDescription:
        'Exercício uniarticular guiado de adução horizontal dos ombros, ideal para isolamento seguro do peitoral maior com tensão constante.',
      initialPosition:
        'Regule a altura do assento para que as manoplas ou apoios fiquem na linha média do peitoral. Sente-se com a coluna totalmente apoiada no encosto e as escápulas estabilizadas.',
      executionSteps: [
        'Segure as manoplas mantendo uma leve e constante semiflexão nos cotovelos.',
        'Aproxime os braços à frente do tórax em um arco amplo, contraindo o peitoral no centro do movimento.',
        'Sustente brevemente a contração máxima sem desencostar as costas do banco.',
        'Retorne devagar à posição inicial controlando o peso até que as mãos fiquem alinhadas à linha do tronco, sem deixar as placas baterem.',
      ],
      breathingGuide:
        'Expire ao fechar os braços à frente do peito e inspire ao retornar controlando a abertura.',
      commonMistakes: [
        'Levar os braços excessivamente para trás da linha dos ombros na fase excêntrica.',
        'Curvar os ombros e desencostar a coluna do encosto para vencer a carga.',
        'Flexionar e estender os cotovelos transformando a adução em um empurrão.',
      ],
      safetyTips: [
        'Ajuste o limitador de amplitude das hastes conforme sua mobilidade articular de ombro.',
        'Use os pedais auxiliares de partida, quando presentes no aparelho, para iniciar e encerrar a série.',
      ],
      illustrationId: 'svg_exercise_peck_deck',
      externalVideoUrl: 'https://exrx.net/WeightExercises/PectoralSternal/LVPecDeckFly',
      externalVideoSource: 'ExRx.net — Lever Pec Deck Fly',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_crossover_polia_alta',
      name: 'Crossover na polia alta',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros', 'abdomen_core'],
      compatibleEquipmentIds: [
        'std_chest_crossover',
        'std_general_polias_ajustaveis',
      ],
      equipmentAlternatives: [
        ['std_chest_crossover'],
        ['std_general_polias_ajustaveis'],
      ],
      shortDescription:
        'Adução de ombros em cabos partindo das polias superiores, proporcionando tensão contínua em todo o arco de movimento peitoral.',
      initialPosition:
        'Posicione as roldanas no topo da torre, segure os puxadores de estribo, dê um passo à frente em base anteroposterior (um pé à frente do outro) e incline sutilmente o tronco mantendo o abdômen contraído.',
      executionSteps: [
        'Com os cotovelos levemente flexionados e estabilizados, puxe as alças para baixo e para o centro em formato de arco.',
        'Una as mãos na altura da linha abdominal superior ou inferior do esterno, enfatizando a contração do peitoral.',
        'Retorne lentamente os braços de forma controlada acompanhando a tração dos cabos até a linha lateral do peito.',
        'Mantenha o tronco firme sem balançar para gerar impulso.',
      ],
      breathingGuide:
        'Expire ao fechar as alças à frente do corpo e inspire durante a abertura controlada.',
      commonMistakes: [
        'Oscilar o tronco para a frente e para trás a cada repetição.',
        'Transformar o movimento em um supino em pé dobrando excessivamente os cotovelos.',
        'Deixar os cabos puxarem os ombros bruscamente para trás no final da fase excêntrica.',
      ],
      safetyTips: [
        'Verifique se os pinos de regulagem de altura das duas torres estão travados exatamente no mesmo nível.',
        'Ao terminar, retorne um lado de cada vez ou dê um passo para trás antes de soltar os cabos.',
      ],
      illustrationId: 'svg_exercise_crossover_polia',
      externalVideoUrl: 'https://exrx.net/WeightExercises/PectoralSternal/CBCableStandingFly',
      externalVideoSource: 'ExRx.net — Cable Standing Fly',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_supino_reto_halteres',
      name: 'Supino reto com halteres',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros', 'triceps'],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_general_bancos_retos',
      ],
      equipmentAlternatives: [
        ['std_general_halteres', 'std_general_bancos_retos'],
      ],
      shortDescription:
        'Empurrão horizontal com pesos livres em banco plano que favorece maior amplitude de alongamento peitoral e trabalho simétrico independente entre os membros superiores.',
      initialPosition:
        'Sente-se na extremidade de um banco reto segurando um par de halteres apoiados verticalmente sobre as coxas. Deite-se em decúbito dorsal trazendo os halteres para a linha lateral do peito com o auxílio das coxas, apoie os pés firmemente no chão e retraia as escápulas contra o estofado.',
      executionSteps: [
        'Posicione os halteres na altura média do tórax com os antebraços verticais, punhos firmes e cotovelos formando um ângulo de 45° a 70° em relação ao tronco.',
        'Empurre os halteres para cima em trajetória levemente convergente até estender os cotovelos acima da linha do peito, mantendo os ombros encaixados no banco.',
        'Controle a descida abrindo os cotovelos de forma cadenciada até que as mãos fiquem alinhadas ao nível do tórax, sentindo o alongamento da musculatura peitoral.',
        'Retome a fase concêntrica de maneira fluida sem bater os halteres um contra o outro no topo do movimento.',
      ],
      breathingGuide:
        'Inspire profundamente durante a descida controlada dos halteres e expire ao empurrar os pesos para cima.',
      commonMistakes: [
        'Descer os halteres com os cotovelos abertos a 90° na linha do pescoço, aumentando o estresse na cápsula articular do ombro.',
        'Chocar os halteres no ponto alto da subida, dissipando a tensão mecânica do peitoral e desestabilizando os punhos.',
        'Perder o apoio dos pés ou arquear exageradamente a lombar retirando os glúteos do banco.',
      ],
      safetyTips: [
        'Ao concluir a última repetição, eleve os joelhos para apoiar os halteres nas coxas e sente-se em um movimento único, jamais soltando os pesos lateralmente no solo com os braços abertos.',
        'Verifique a estabilidade do banco reto e mantenha os punhos alinhados aos antebraços durante todo o percurso.',
      ],
    },
  {
      id: 'ex_peito_supino_inclinado_barra',
      name: 'Supino inclinado com barra',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros', 'triceps'],
      compatibleEquipmentIds: [
        'std_chest_supino_inclinado_barra',
        'std_general_barras_retas',
        'std_general_bancos_regulaveis',
        'std_general_anilhas',
      ],
      equipmentAlternatives: [
        ['std_chest_supino_inclinado_barra'],
        ['std_general_barras_retas', 'std_general_bancos_regulaveis', 'std_general_anilhas'],
      ],
      shortDescription:
        'Pressão multiarticular com barra longa em banco inclinado voltada ao fortalecimento prioritário da porção clavicular (superior) do peitoral maior e deltoide anterior.',
      initialPosition:
        'Deite-se no banco de supino inclinado (ou banco regulável posicionado no suporte entre 30° e 45°) com os olhos alinhados sob a barra. Apoie os pés firmes no chão, encaixe as escápulas contra o encosto e segure a barra com pegada pronada um pouco mais aberta que a largura dos ombros.',
      executionSteps: [
        'Retire a barra dos ganchos estendendo os braços e estabilize-a diretamente acima da região clavicular com os punhos neutros.',
        'Desça a barra de forma controlada em direção à parte alta do peito (logo abaixo das clavículas), mantendo os cotovelos apontados levemente para a frente e para baixo.',
        'Pause por um instante próximo ao tórax superior sem relaxar a musculatura nem ricochetear a barra.',
        'Empurre a barra verticalmente de volta à posição inicial mantendo a cabeça, as escápulas e os glúteos firmemente apoiados.',
      ],
      breathingGuide:
        'Inspire ao descer a barra até a região superior do peitoral e expire ao estender os cotovelos na subida.',
      commonMistakes: [
        'Descer a barra em direção ao abdômen ou à garganta em vez da linha clavicular superior do peito.',
        'Projetar os ombros para a frente no final da subida, perdendo a retração escapular e sobrecarregando o manguito rotador.',
        'Levantar o quadril do assento para transformar a inclinação em um supino reto improvisado.',
      ],
      safetyTips: [
        'Certifique-se de que a altura dos ganchos de apoio permita retirar e devolver a barra sem precisar desencostar as escápulas do banco.',
        'Fixe sempre as anilhas com presilhas de segurança e solicite acompanhamento ao trabalhar próximo da falha concêntrica.',
      ],
    },
  {
      id: 'ex_peito_crucifixo_reto_halteres',
      name: 'Crucifixo reto com halteres',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros'],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_general_bancos_retos',
      ],
      equipmentAlternatives: [
        ['std_general_halteres', 'std_general_bancos_retos'],
      ],
      shortDescription:
        'Exercício uniarticular de adução horizontal dos ombros em banco plano com halteres, focado no alongamento controlado e isolamento das fibras esternocostais do peitoral maior.',
      initialPosition:
        'Deite-se em um banco reto com os pés bem apoiados no solo e as escápulas retraídas. Eleve os halteres acima da linha do peito utilizando pegada neutra (palmas das mãos voltadas uma para a outra) e estabeleça uma leve semiflexão fixa nos cotovelos.',
      executionSteps: [
        'Mantendo o ângulo de semiflexão dos cotovelos constante, abra os braços lateralmente em um arco amplo e controlado.',
        'Desça os halteres até que os braços fiquem aproximadamente paralelos ao solo (alinhados ao tronco), sentindo o alongamento confortável do peitoral.',
        'Inverta o movimento contraindo o peitoral para trazer os halteres de volta pelo mesmo arco amplo, como se estivesse abraçando um cilindro.',
        'Estabilize os halteres acima do peito mantendo uma pequena distância entre eles para preservar a tensão muscular contínua.',
      ],
      breathingGuide:
        'Inspire lentamente enquanto abre os braços na fase excêntrica e expire ao fechar os braços contraindo o peitoral.',
      commonMistakes: [
        'Dobrar excessivamente os cotovelos durante a descida, descaracterizando o crucifixo e transformando-o em um supino.',
        'Estender totalmente os cotovelos com os braços rígidos, gerando torque excessivo sobre a articulação do cotovelo e tendão do bíceps.',
        'Ultrapassar excessivamente a linha posterior do tronco na descida com cargas altas, forçando a cápsula anterior do ombro.',
      ],
      safetyTips: [
        'Selecione cargas moderadas que permitam controle absoluto no ponto de maior alavanca (braços abertos).',
        'Para encerrar a série com segurança, flexione os cotovelos trazendo os halteres próximos ao peito antes de se sentar.',
      ],
    },
  {
      id: 'ex_peito_flexao_bracos',
      name: 'Flexão de braços',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros', 'triceps', 'abdomen_core'],
      compatibleEquipmentIds: [],
      equipmentAlternatives: [],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription:
        'Empurrão horizontal de cadeia cinética fechada com o peso do próprio corpo, promovendo recrutamento coordenado do peitoral maior, tríceps, deltoide anterior e estabilizadores escapulares.',
      initialPosition:
        'Posicione-se em apoio facial no solo com as mãos espalmadas um pouco além da largura dos ombros, na linha média do peitoral. Estenda os joelhos apoiando a ponta dos pés no chão e mantenha tornozelos, quadril, tronco e cabeça alinhados em prancha rígida.',
      executionSteps: [
        'Contraia firmemente o abdômen e os glúteos para manter a pelve neutra e impedir que a região lombar afunde.',
        'Flexione os cotovelos direcionando-os diagonalmente para trás (cerca de 45° em relação ao tronco) enquanto desce o corpo em bloco único.',
        'Aproxime o esterno do solo de forma controlada mantendo o pescoço alinhado ao restante da coluna.',
        'Empurre o chão com as palmas das mãos até estender os cotovelos no topo, finalizando com a estabilização ativa das escápulas.',
      ],
      breathingGuide:
        'Inspire de maneira controlada ao descer o peito em direção ao solo e expire ao empurrar o corpo de volta ao topo.',
      commonMistakes: [
        'Abduzir os cotovelos a 90° alinhados aos ombros, reduzindo a eficiência mecânica e sobrecarregando a articulação glenoumeral.',
        'Permitir que o quadril caia em hiperextensão lombar ou fique elevado em formato de pirâmide durante a repetição.',
        'Realizar amplitude parcial mexendo apenas a cabeça e as escápulas sem flexionar adequadamente os cotovelos.',
      ],
      safetyTips: [
        'Caso não consiga sustentar o alinhamento da prancha durante toda a série, apoie os joelhos no solo ou apoie as mãos em uma superfície elevada e firme.',
        'Distribua o peso por toda a palma da mão e dedos para reduzir a sobrecarga compressiva nos punhos.',
      ],
    },
  {
      id: 'ex_costas_puxada_alta_frontal',
      name: 'Puxada alta frontal na polia',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps', 'ombros'],
      compatibleEquipmentIds: ['std_back_puxada_alta'],
      equipmentAlternatives: [['std_back_puxada_alta']],
      shortDescription:
        'Tração vertical em polia alta voltada ao trabalho do latíssimo do dorso (grande dorsal), redondo maior e estabilizadores escapulares.',
      initialPosition:
        'Segure a barra longa com pegada pronada aberta (além da linha dos ombros) e sente-se no aparelho ajustando os rolos acolchoados firmemente sobre as coxas.',
      executionSteps: [
        'Mantenha o peito aberto, coluna neutra e incline o tronco muito sutilmente (cerca de 10° a 15°) para trás.',
        'Inicie o movimento deprimindo as escápulas (afastando os ombros das orelhas) e puxe a barra em direção à região superior do peitoral (clavícula).',
        'Direcione os cotovelos para baixo e para os lados do tronco, aproximando as escápulas.',
        'Retorne a barra de forma controlada até a extensão dos braços, sem soltar o peso de forma abrupta.',
      ],
      breathingGuide:
        'Expire ao puxar a barra em direção ao peitoral e inspire ao retornar a barra de forma controlada.',
      commonMistakes: [
        'Puxar a barra por trás da nuca, impondo rotação externa extrema e risco cervical.',
        'Jogar o tronco excessivamente para trás usando o peso do corpo como alavanca.',
        'Puxar a barra abaixo da linha do abdômen flexionando os punhos.',
      ],
      safetyTips: [
        'Ajuste sempre o trava-coxas antes de iniciar a série para não ser suspenso pela carga.',
        'Ao encerrar a série, levante-se acompanhando a barra até o topo das placas de peso.',
      ],
      illustrationId: 'svg_exercise_puxada_alta_frontal',
      externalVideoUrl: 'https://exrx.net/WeightExercises/LatissimusDorsi/CBFrontPulldown',
      externalVideoSource: 'ExRx.net — Cable Front Pulldown',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_remada_baixa_triangulo',
      name: 'Remada baixa sentada na polia',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps', 'ombros'],
      compatibleEquipmentIds: ['std_back_remada_baixa'],
      equipmentAlternatives: [['std_back_remada_baixa']],
      shortDescription:
        'Tração horizontal sentada com cabo que trabalha de forma integrada o latíssimo do dorso, trapézio médio/inferior e romboides.',
      initialPosition:
        'Sente-se no banco da remada baixa, apoie os pés nas plataformas frontais mantendo os joelhos semiflexionados, segure o puxador e posicione o tronco ereto com a coluna neutra.',
      executionSteps: [
        'Com o abdômen ativado e o peito estufado, puxe o acessório em direção à linha superior do abdômen.',
        'Conduza os cotovelos rentes ao tronco para trás, retraindo firmemente as escápulas no final da puxada.',
        'Segure por um instante a contração dorsal mantendo os ombros baixos.',
        'Estenda os braços de maneira controlada retornando à posição inicial sem curvar a coluna lombar.',
      ],
      breathingGuide:
        'Expire ao trazer o puxador em direção ao abdômen e inspire ao estender os braços.',
      commonMistakes: [
        'Flexionar e estender repetidamente a coluna lombar como um remo.',
        'Estender totalmente os joelhos, aumentando a tensão isquiotibial e lombar.',
        'Elevar os ombros em direção às orelhas durante a puxada.',
      ],
      safetyTips: [
        'Para pegar e devolver o puxador com segurança, mantenha a coluna neutra e utilize o impulso das pernas apenas na saída e devolução da carga.',
        'Nunca arredonde a lombar sob carga.',
      ],
      illustrationId: 'svg_exercise_remada_baixa',
      externalVideoUrl: 'https://exrx.net/WeightExercises/BackGeneral/CBSeatedRow',
      externalVideoSource: 'ExRx.net — Cable Seated Row',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_remada_articulada_maquina',
      name: 'Remada articulada na máquina',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps', 'ombros'],
      compatibleEquipmentIds: ['std_back_remada_articulada'],
      equipmentAlternatives: [['std_back_remada_articulada']],
      shortDescription:
        'Remada guiada com apoio peitoral que reduz a sobrecarga sobre a coluna lombar e permite foco estrito na retração escapular e tração dorsal.',
      initialPosition:
        'Ajuste a altura do banco e a distância do apoio peitoral de modo que você consiga segurar as manoplas com a ponta dos dedos ou palma completa mantendo o tórax apoiado.',
      executionSteps: [
        'Apoie o esterno firmemente contra a almofada frontal e segure as manoplas na pegada indicada pelo instrutor (neutra ou pronada).',
        'Inicie o movimento retraindo as escápulas e puxe os braços articulados para trás.',
        'Contraia a musculatura dorsal no ponto final sem desencostar o peitoral do apoio.',
        'Retorne lentamente os braços até o alongamento controlado das escápulas.',
      ],
      breathingGuide:
        'Expire na fase concêntrica (puxada para trás) e inspire ao retornar as alavancas.',
      commonMistakes: [
        'Afastar o peito do apoio acolchoado para roubar com a coluna.',
        'Encolher o trapézio superior durante a fase final da puxada.',
        'Soltar a carga de uma vez na fase excêntrica.',
      ],
      safetyTips: [
        'Certifique-se de que ambos os lados (em máquinas convergentes de anilhas) estejam abastecidos com a mesma quilagem.',
        'Mantenha os pés apoiados nas bases do equipamento para estabilidade pélvica.',
      ],
    },
  {
      id: 'ex_costas_barra_fixa_graviton',
      name: 'Barra fixa (livre ou assistida no Graviton)',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps', 'abdomen_core'],
      compatibleEquipmentIds: ['std_back_barra_fixa', 'std_back_graviton'],
      equipmentAlternatives: [
        ['std_back_barra_fixa'],
        ['std_back_graviton'],
      ],
      isBodyweight: true,
      canExecuteWithoutEquipment: false,
      shortDescription:
        'Exercício fundamental de tração vertical com o próprio peso corporal ou com contrapeso assistido no Graviton para fortalecimento dorsal.',
      initialPosition:
        'Segure as manoplas superiores da barra fixa com pegada pronada ou neutra. Caso utilize o Graviton, selecione o contrapeso desejado e apoie os joelhos ou pés na plataforma acolchoada.',
      executionSteps: [
        'Partindo da suspensão com braços estendidos, ative as escápulas puxando os ombros para baixo.',
        'Flexione os cotovelos elevando o corpo até que o queixo alcance ou ultrapasse levemente a linha da barra.',
        'Mantenha o core firme para evitar balanço pendular das pernas.',
        'Desça de forma controlada até a extensão quase completa dos cotovelos mantendo os ombros encaixados.',
      ],
      breathingGuide:
        'Expire durante a subida do corpo e inspire durante a descida controlada.',
      commonMistakes: [
        'Balançar as pernas e o quadril (kipping involuntário) para subir.',
        'Realizar repetições curtas sem descer o corpo na fase excêntrica.',
        'No Graviton, esquecer que quanto maior a placa selecionada, mais leve fica o exercício.',
      ],
      safetyTips: [
        'No Graviton, desça um joelho/pé da plataforma somente após a plataforma retornar totalmente ao ponto mais alto.',
        'Evite soltar as mãos da barra fixa enquanto o corpo ainda estiver em oscilação.',
      ],
      illustrationId: 'svg_exercise_barra_fixa',
      externalVideoUrl: 'https://exrx.net/WeightExercises/LatissimusDorsi/BWPullup',
      externalVideoSource: 'ExRx.net — Pull-up / Assisted Pull-up',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_remada_curvada_barra',
      name: 'Remada curvada com barra',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps', 'ombros', 'abdomen_core'],
      compatibleEquipmentIds: [
        'std_general_barras_retas',
        'std_general_barras_w',
        'std_general_anilhas',
      ],
      equipmentAlternatives: [
        ['std_general_barras_retas', 'std_general_anilhas'],
        ['std_general_barras_w', 'std_general_anilhas'],
      ],
      shortDescription:
        'Tração horizontal livre em inclinação de tronco, excelente para ganho de densidade dorsal, recrutando grande dorsal, romboides, trapézio e estabilizadores lombares.',
      initialPosition:
        'Em pé com os pés afastados na largura do quadril, segure a barra com pegada pronada ou supinada um pouco além da linha dos ombros, flexione levemente os joelhos e incline o tronco à frente (entre 45° e 60°) mantendo a coluna rigorosamente neutra.',
      executionSteps: [
        'Estabilize o abdômen (bracing) e deixe a barra suspensa abaixo da linha dos ombros com as escápulas controladas.',
        'Puxe a barra em direção à região inferior do abdômen (próximo à linha umbilical) conduzindo o movimento pelos cotovelos.',
        'Contraia fortemente as escápulas no topo da puxada sem elevar o tronco para ganhar impulso.',
        'Desça a barra de forma controlada até a extensão dos braços mantendo o ângulo do quadril e da coluna estável.',
      ],
      breathingGuide:
        'Expire ao puxar a barra em direção ao abdômen e inspire durante a descida controlada da carga.',
      commonMistakes: [
        'Arredondar a coluna lombar e torácica devido ao excesso de carga ou fadiga do core.',
        'Subir o tronco repetidamente durante a puxada transformando o exercício em um encolhimento.',
        'Puxar a barra em direção ao pescoço com os cotovelos excessivamente abertos.',
      ],
      safetyTips: [
        'Utilize presilhas de segurança nas extremidades da barra para fixar as anilhas.',
        'Interrompa a série imediatamente caso perceba perda do alinhamento neutro da coluna lombar.',
      ],
    },
  {
      id: 'ex_costas_remada_unilateral_halter',
      name: 'Remada unilateral com halter',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps', 'ombros', 'abdomen_core'],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_general_bancos_retos',
        'std_general_bancos_regulaveis',
      ],
      equipmentAlternatives: [
        ['std_general_halteres', 'std_general_bancos_retos'],
        ['std_general_halteres', 'std_general_bancos_regulaveis'],
      ],
      shortDescription:
        'Remada unilateral com peso livre apoiada no banco (serrote), permitindo grande amplitude de movimento, correção de assimetrias e menor sobrecarga lombar.',
      initialPosition:
        'Apoie o joelho e a mão do mesmo lado sobre um banco reto ou regulável horizontal, mantendo a outra perna firme no chão, o tronco paralelo ao solo com a coluna neutra e o halter suspenso na mão livre.',
      executionSteps: [
        'Mantenha os ombros e o quadril alinhados horizontalmente, evitando girar o tronco na posição inicial.',
        'Puxe o halter para cima e levemente para trás em direção à lateral do quadril, mantendo o cotovelo próximo ao corpo.',
        'Contraia o grande dorsal e retraia a escápula do lado trabalhado no ponto alto do movimento.',
        'Desça o halter de maneira controlada até alongar a musculatura dorsal sem relaxar o apoio da coluna.',
      ],
      breathingGuide:
        'Expire ao puxar o halter em direção ao quadril e inspire ao retornar o peso de forma controlada.',
      commonMistakes: [
        'Girar exageradamente o tronco como se estivesse dando partida em um motor.',
        'Puxar o halter em direção ao ombro flexionando apenas o bíceps em vez de conduzir o cotovelo para o quadril.',
        'Hiperestender o pescoço olhando para a frente em vez de manter a cervical alinhada ao tronco.',
      ],
      safetyTips: [
        'Execute o mesmo número de repetições e a mesma carga para ambos os lados.',
        'Ao finalizar a série, apoie o halter com cuidado no banco ou no chão mantendo a coluna estável.',
      ],
    },
  {
      id: 'ex_costas_pullover_polia',
      name: 'Pullover na polia alta',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['peito', 'triceps', 'abdomen_core'],
      compatibleEquipmentIds: [
        'std_back_pulldown',
        'std_back_puxada_alta',
        'std_general_polias_ajustaveis',
        'std_arms_barras_puxadores_polia',
      ],
      equipmentAlternatives: [
        ['std_back_pulldown'],
        ['std_back_puxada_alta'],
        ['std_general_polias_ajustaveis', 'std_arms_barras_puxadores_polia'],
      ],
      shortDescription:
        'Extensão de ombros em pé na polia alta (pulldown com braços semiestendidos), isolando o grande dorsal sem participação ativa dos flexores do cotovelo.',
      initialPosition:
        'Posicione a polia no ponto alto com barra reta ou corda. Em pé a um passo de distância da torre, segure o puxador com pegada pronada na largura dos ombros, incline levemente o tronco à frente e mantenha os cotovelos discretamente semiflexionados.',
      executionSteps: [
        'Encaixe as escápulas mantendo o abdômen contraído e os joelhos levemente destravados.',
        'Puxe a barra ou corda para baixo em um arco amplo, mantendo o ângulo dos cotovelos fixo até aproximar as mãos das coxas.',
        'Sustente a contração do grande dorsal por 1 segundo na parte inferior mantendo o peito aberto.',
        'Retorne os braços de forma controlada até a linha da testa ou olhos, sentindo o alongamento dorsal sem perder a estabilidade lombar.',
      ],
      breathingGuide:
        'Expire ao conduzir o puxador para baixo até as coxas e inspire durante a subida controlada dos braços.',
      commonMistakes: [
        'Dobrar e esticar os cotovelos transformando o exercício em um tríceps pulley.',
        'Elevar os braços além da linha da cabeça perdendo a estabilização escapular.',
        'Balançar o tronco para baixo usando o peso do corpo para mover a carga.',
      ],
      safetyTips: [
        'Verifique o travamento do mosquetão e do pino seletor da polia antes de iniciar.',
        'Utilize cargas que permitam manter os punhos firmes e o arco de movimento contínuo.',
      ],
    },
  {
      id: 'ex_costas_remada_banco_inclinado',
      name: 'Remada com halteres apoiada no banco inclinado',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps', 'ombros'],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_general_bancos_regulaveis',
      ],
      equipmentAlternatives: [
        ['std_general_halteres', 'std_general_bancos_regulaveis'],
      ],
      shortDescription:
        'Remada bilateral com halteres com o peito apoiado no banco inclinado, eliminando compensações lombares e isolando a musculatura dorsal e escapular.',
      initialPosition:
        'Ajuste o banco regulável entre 30° e 45°. Deite-se de bruços (decúbito ventral) apoiando o peito e o abdômen no encosto, fixe a ponta dos pés no solo e segure um par de halteres com os braços estendidos verticalmente abaixo dos ombros.',
      executionSteps: [
        'Mantenha o esterno apoiado no estofado e o pescoço alinhado à coluna (olhar voltado para o chão à frente do banco).',
        'Inicie a puxada retraindo as escápulas e flexionando os cotovelos para trás em direção à linha do quadril.',
        'Pause brevemente no topo sentindo a contração de dorsais, romboides e trapézio médio sem desencostar o tórax do banco.',
        'Desça os halteres lentamente até a extensão completa dos braços mantendo o controle escapular.',
      ],
      breathingGuide:
        'Expire ao puxar os halteres para cima e inspire ao descer os pesos de forma controlada.',
      commonMistakes: [
        'Desencostar o peitoral do encosto realizando hiperextensão lombar para subir os halteres.',
        'Hiperestender a coluna cervical olhando para o alto.',
        'Encolher os ombros em direção às orelhas durante a puxada.',
      ],
      safetyTips: [
        'Posicione os halteres no chão ao alcance das mãos antes de deitar-se no banco inclinado.',
        'Evite soltar os halteres bruscamente ao final da série para proteger a articulação dos ombros.',
      ],
    },
  {
      id: 'ex_ombros_desenvolvimento_halteres',
      name: 'Desenvolvimento de ombros com halteres',
      primaryMuscleGroup: 'ombros',
      secondaryMuscleGroups: ['triceps', 'abdomen_core'],
      compatibleEquipmentIds: [
        'std_shoulders_desenvolvimento_halteres',
        'std_shoulders_banco_desenvolvimento',
        'std_general_halteres',
        'std_general_bancos_regulaveis',
      ],
      equipmentAlternatives: [
        ['std_shoulders_desenvolvimento_halteres'],
        ['std_general_halteres', 'std_shoulders_banco_desenvolvimento'],
        ['std_general_halteres', 'std_general_bancos_regulaveis'],
      ],
      shortDescription:
        'Empurrão vertical com pesos livres sentado, trabalhando intensamente o deltoide anterior e lateral, além do tríceps e estabilizadores escapulares.',
      initialPosition:
        'Ajuste o banco em cerca de 75° a 85° (quase vertical). Sente-se com a coluna apoiada, pés firmes no chão e posicione os halteres na altura das orelhas com os cotovelos apontados levemente à frente (plano escapular).',
      executionSteps: [
        'Mantenha o abdômen contraído e as costelas baixas para evitar hiperextensão lombar.',
        'Empurre os halteres verticalmente para cima até estender os cotovelos acima da cabeça, sem bater um peso no outro.',
        'Desça os halteres de forma controlada até que as mãos retornem à linha do queixo/orelhas.',
        'Inicie a próxima repetição sem relaxar a postura torácica.',
      ],
      breathingGuide:
        'Expire ao empurrar os halteres para o alto e inspire durante a descida controlada.',
      commonMistakes: [
        'Arquear excessivamente a coluna lombar afastando-a do encosto.',
        'Alinhar os cotovelos exageradamente para trás da linha do tronco.',
        'Realizar meias repetições apenas no topo sem descer os halteres até a altura dos ombros.',
      ],
      safetyTips: [
        'Trabalhe com os cotovelos cerca de 20° a 30° à frente da linha lateral do corpo (plano da escápula) para maior conforto articular.',
        'Utilize os joelhos para auxiliar na subida inicial e na descida final dos halteres.',
      ],
      illustrationId: 'svg_exercise_desenvolvimento_halteres',
      externalVideoUrl: 'https://exrx.net/WeightExercises/DeltoidAnterior/DBShoulderPress',
      externalVideoSource: 'ExRx.net — Dumbbell Shoulder Press',
      externalVideoVerified: false,
    },
  {
      id: 'ex_ombros_desenvolvimento_maquina',
      name: 'Desenvolvimento de ombros na máquina',
      primaryMuscleGroup: 'ombros',
      secondaryMuscleGroups: ['triceps'],
      compatibleEquipmentIds: ['std_shoulders_desenvolvimento_maquina'],
      equipmentAlternatives: [['std_shoulders_desenvolvimento_maquina']],
      shortDescription:
        'Empurrão vertical guiado em aparelho articulado ou de polia, oferecendo estabilidade extra para focar na força de deltoides e tríceps.',
      initialPosition:
        'Regule a altura do assento para que as manoplas da máquina fiquem alinhadas à altura dos ombros na posição inicial. Sente-se apoiando totalmente a coluna no encosto.',
      executionSteps: [
        'Segure as manoplas na pegada selecionada (pronada frontal ou neutra lateral) com os punhos neutros.',
        'Empurre os braços da máquina para cima até próximo da extensão completa dos cotovelos.',
        'Desça o peso de maneira controlada sem deixar as placas de carga se chocarem ao final da descida.',
        'Mantenha a cabeça e os ombros encaixados no encosto durante toda a série.',
      ],
      breathingGuide:
        'Expire ao empurrar as alavancas para cima e inspire ao descer controladamente.',
      commonMistakes: [
        'Regular o assento muito baixo, iniciando o movimento em amplitude excessiva para a cápsula articular.',
        'Projetar o pescoço para a frente na tentativa de completar as últimas repetições.',
        'Travar bruscamente os cotovelos no topo.',
      ],
      safetyTips: [
        'Confira o pino seletor da pilha de pesos antes de iniciar a execução.',
        'Evite tirar o quadril do assento durante o esforço.',
      ],
    },
  {
      id: 'ex_ombros_elevacao_lateral_halteres',
      name: 'Elevação lateral com halteres',
      primaryMuscleGroup: 'ombros',
      secondaryMuscleGroups: ['abdomen_core'],
      compatibleEquipmentIds: ['std_general_halteres'],
      equipmentAlternatives: [['std_general_halteres']],
      shortDescription:
        'Abdução de ombros com pesos livres voltada ao isolamento da porção média (lateral) do deltoide.',
      initialPosition:
        'Em pé, com os pés afastados na largura do quadril, joelhos destravados e abdômen firme, segure um par de halteres ao lado das coxas com as palmas voltadas para dentro.',
      executionSteps: [
        'Mantendo uma leve semiflexão nos cotovelos, eleve os braços lateralmente (cerca de 15° a 20° à frente do plano coronal).',
        'Suba até que os cotovelos e os punhos atinjam a linha dos ombros (paralelos ao chão).',
        'Desça os halteres de forma controlada resistindo à gravidade, evitando que os pesos despenquem.',
        'Interrompa a descida pouco antes de relaxar totalmente os braços contra as coxas para manter a tensão.',
      ],
      breathingGuide:
        'Expire ao elevar os braços lateralmente e inspire ao descer de forma cadenciada.',
      commonMistakes: [
        'Usar carga excessiva e balançar o tronco para lançar os halteres para cima.',
        'Encolher os ombros (acionando excessivamente o trapézio superior) no início da subida.',
        'Dobrar os cotovelos a 90° e elevar apenas as mãos acima da linha dos cotovelos.',
      ],
      safetyTips: [
        'Priorize a cadência e a precisão técnica em vez de cargas pesadas neste exercício uniarticular.',
        'Imagine que está afastando os halteres para longe das paredes laterais, não para cima das orelhas.',
      ],
      illustrationId: 'svg_exercise_elevacao_lateral_halteres',
      externalVideoUrl: 'https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise',
      externalVideoSource: 'ExRx.net — Dumbbell Lateral Raise',
      externalVideoVerified: false,
    },
  {
      id: 'ex_ombros_elevacao_lateral_maquina',
      name: 'Elevação lateral na máquina',
      primaryMuscleGroup: 'ombros',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: [
        'std_shoulders_elevacao_lateral_maquina',
        'std_shoulders_maquina_elevacao_lateral',
      ],
      equipmentAlternatives: [
        ['std_shoulders_elevacao_lateral_maquina'],
        ['std_shoulders_maquina_elevacao_lateral'],
      ],
      shortDescription:
        'Abdução guiada de ombros com apoio nos cotovelos/antebraços, isolando o deltoide lateral sem exigir força de preensão manual.',
      initialPosition:
        'Regule o banco de modo que o eixo de rotação da máquina fique alinhado à articulação do seu ombro. Sente-se e posicione a lateral dos cotovelos e antebraços nos rolos acolchoados.',
      executionSteps: [
        'Mantenha os ombros baixos e a coluna apoiada no estofado.',
        'Empurre os apoios acolchoados para os lados e para cima usando a força dos cotovelos até a altura da linha dos ombros.',
        'Sustente por um breve instante no topo da abdução.',
        'Desça controladamente os braços até a posição inicial sem bater a pilha de pesos.',
      ],
      breathingGuide:
        'Expire ao elevar os braços contra os rolos e inspire na fase excêntrica.',
      commonMistakes: [
        'Desalinhamento entre o pivô da máquina e o ombro, gerando atrito articular.',
        'Empurrar com as mãos nas alças em vez de conduzir o movimento pelos cotovelos.',
        'Ultrapassar exageradamente a linha horizontal dos ombros encolhendo o pescoço.',
      ],
      safetyTips: [
        'O alinhamento do eixo da máquina com o acrômio (ombro) é indispensável para segurança.',
        'Utilize cargas moderadas e controle a fase negativa.',
      ],
    },
  {
      id: 'ex_biceps_rosca_direta_barra',
      name: 'Rosca direta com barra (reta ou W)',
      primaryMuscleGroup: 'biceps',
      secondaryMuscleGroups: ['abdomen_core'],
      compatibleEquipmentIds: [
        'std_general_barras_retas',
        'std_general_barras_w',
        'std_general_anilhas',
      ],
      equipmentAlternatives: [
        ['std_general_barras_retas', 'std_general_anilhas'],
        ['std_general_barras_w', 'std_general_anilhas'],
      ],
      shortDescription:
        'Flexão de cotovelos em pé com barra, excelente para ganho de força e volume do bíceps braquial e braquial.',
      initialPosition:
        'Em pé, com os pés na largura dos ombros e joelhos levemente destravados, segure a barra reta ou barra W com pegada supinada (palmas voltadas para a frente) e cotovelos posicionados ao lado do tronco.',
      executionSteps: [
        'Mantenha o peito aberto, abdômen firme e os cotovelos fixos ao lado das costelas.',
        'Flexione os cotovelos elevando a barra em um arco até a altura do peitoral superior.',
        'Contraia os bíceps no ponto alto sem projetar os cotovelos excessivamente para a frente.',
        'Desça a barra lentamente até a extensão completa dos braços com controle muscular.',
      ],
      breathingGuide:
        'Expire durante a subida da barra e inspire durante a descida controlada.',
      commonMistakes: [
        'Inclinar o tronco para trás usando a lombar para impulsionar a barra.',
        'Abrir ou avançar exageradamente os cotovelos transformando o final do movimento em flexão de ombro.',
        'Não estender os braços na parte inferior do movimento.',
      ],
      safetyTips: [
        'Caso sinta desconforto nos punhos ou antebraços com a barra reta, prefira a barra W (EZ), que oferece angulação mais anatômica.',
        'Use presilhas nas pontas da barra.',
      ],
      illustrationId: 'svg_exercise_rosca_direta_barra',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Biceps/BBCurl',
      externalVideoSource: 'ExRx.net — Barbell Curl',
      externalVideoVerified: false,
    },
  {
      id: 'ex_biceps_rosca_scott',
      name: 'Rosca bíceps no banco Scott',
      primaryMuscleGroup: 'biceps',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: [
        'std_arms_banco_scott',
        'std_arms_maquina_biceps',
        'std_general_barras_w',
        'std_general_halteres',
        'std_general_anilhas',
      ],
      equipmentAlternatives: [
        ['std_arms_maquina_biceps'],
        ['std_arms_banco_scott', 'std_general_barras_w', 'std_general_anilhas'],
        ['std_arms_banco_scott', 'std_general_halteres'],
      ],
      shortDescription:
        'Flexão de cotovelos com os braços apoiados em rampa inclinada (banco Scott), eliminando o balanço do tronco e isolando os flexores do cotovelo.',
      initialPosition:
        'Ajuste a altura do assento do banco Scott para que as axilas fiquem encaixadas no topo do apoio inclinado e toda a parte posterior dos braços repouse sobre o estofado.',
      executionSteps: [
        'Segure a barra W, halteres ou alça da máquina com pegada supinada.',
        'Flexione os cotovelos trazendo a carga em direção aos ombros sem desencostar os tríceps/cotovelos do apoio.',
        'Pause brevemente na contração superior antes que o antebraço fique totalmente vertical e perca tensão.',
        'Desça a carga de forma muito controlada até quase estender totalmente os cotovelos.',
      ],
      breathingGuide:
        'Expire ao subir a carga e inspire ao descer controladamente.',
      commonMistakes: [
        'Levantar o quadril do banco e jogar o tronco sobre a barra na fase excêntrica.',
        'Deixar a barra despencar no final da descida, gerando hiperextensão brusca do tendão distal do bíceps.',
        'Desencostar os cotovelos do apoio almofadado.',
      ],
      safetyTips: [
        'Nunca solte o peso de forma abrupta no final da extensão; mantenha tensão ativa do bíceps nos últimos graus da descida.',
        'Regule o banco antes de retirar a barra do suporte.',
      ],
      illustrationId: 'svg_exercise_rosca_scott',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Brachialis/BBPreacherCurl',
      externalVideoSource: 'ExRx.net — Preacher Curl',
      externalVideoVerified: false,
    },
  {
      id: 'ex_biceps_rosca_alternada_halteres',
      name: 'Rosca alternada com halteres',
      primaryMuscleGroup: 'biceps',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_general_bancos_regulaveis',
      ],
      equipmentAlternatives: [
        ['std_general_halteres', 'std_general_bancos_regulaveis'],
        ['std_general_halteres'],
      ],
      shortDescription:
        'Flexão de cotovelos com halteres permitindo trabalhar a supinação do antebraço e corrigir assimetrias de força entre os membros.',
      initialPosition:
        'Sentado em banco regulável (75° a 90°) ou em pé com postura firme, segure um halter em cada mão ao lado do corpo com pegada neutra (palmas voltadas uma para a outra).',
      executionSteps: [
        'Inicie a flexão de um dos cotovelos girando gradualmente o punho (supinação) até que a palma da mão fique voltada para cima na metade do caminho.',
        'Complete a subida contraindo o bíceps com o cotovelo estável ao lado do tronco.',
        'Desça o halter de maneira controlada retornando à pegada neutra na lateral da coxa.',
        'Repita o movimento com o braço oposto mantendo o ritmo constante.',
      ],
      breathingGuide:
        'Expire na subida de cada braço e inspire durante o retorno controlado.',
      commonMistakes: [
        'Iniciar a subida do segundo braço antes de concluir a descida do primeiro, gerando gangorra no tronco.',
        'Girar o tronco lateralmente para impulsionar o halter.',
        'Encolher o ombro do lado que está executando a repetição.',
      ],
      safetyTips: [
        'Executar sentado com as costas apoiadas no banco regulável reduz compensações da coluna.',
        'Mantenha os punhos alinhados sem dobrá-los para trás.',
      ],
    },
  {
      id: 'ex_biceps_rosca_martelo_halteres',
      name: 'Rosca martelo com halteres',
      primaryMuscleGroup: 'biceps',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_general_bancos_regulaveis',
        'std_general_bancos_retos',
      ],
      equipmentAlternatives: [
        ['std_general_halteres'],
        ['std_general_halteres', 'std_general_bancos_regulaveis'],
        ['std_general_halteres', 'std_general_bancos_retos'],
      ],
      shortDescription:
        'Flexão de cotovelos com pegada neutra (palmas voltadas para dentro), enfatizando o braquial, braquiorradial e cabeça longa do bíceps.',
      initialPosition:
        'Em pé ou sentado, com o tronco ereto e os joelhos levemente flexionados, segure um halter em cada mão com pegada neutra (palmas voltadas uma para a outra).',
      executionSteps: [
        'Mantendo os cotovelos fixos ao lado do tronco, flexione os braços subindo os halteres na vertical.',
        'Eleve os pesos até a altura dos ombros mantendo os punhos firmes e neutros durante todo o trajeto.',
        'Contraia o bíceps e antebraço na posição superior por um segundo.',
        'Desça os halteres de forma cadenciada até a extensão quase completa dos cotovelos.',
      ],
      breathingGuide:
        'Expire ao elevar os halteres e inspire durante o retorno controlado à posição inicial.',
      commonMistakes: [
        'Balançar o tronco para trás criando balanço e tirando o foco dos braços.',
        'Mover os cotovelos para a frente durante a subida.',
        'Rotacionar os punhos no meio do movimento (perder a pegada neutra).',
      ],
      safetyTips: [
        'Mantenha os joelhos sutilmente destravados para absorver a tensão na coluna lombar.',
        'Se usar cargas altas, execute sentado com encosto apoiado a 90°.',
      ],
    },
  {
      id: 'ex_biceps_rosca_concentrada_halter',
      name: 'Rosca concentrada unilateral com halter',
      primaryMuscleGroup: 'biceps',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_general_bancos_retos',
        'std_general_bancos_regulaveis',
      ],
      equipmentAlternatives: [
        ['std_general_halteres', 'std_general_bancos_retos'],
        ['std_general_halteres', 'std_general_bancos_regulaveis'],
      ],
      shortDescription:
        'Exercício isolador unilateral realizado sentado com apoio do cotovelo na parte interna da coxa, proporcionando pico de contração no bíceps.',
      initialPosition:
        'Sente-se na extremidade do banco com as pernas afastadas. Segure o halter com uma das mãos, apoie a parte posterior do tríceps na parte interna da coxa correspondente e incline o tronco à frente.',
      executionSteps: [
        'Mantenha o braço estendido apontando o halter em direção ao solo.',
        'Flexione o cotovelo de forma estritamente isolada, trazendo o halter em direção ao peitoral.',
        'Aperte o bíceps no ponto de máxima flexão por um segundo sem mover a coxa ou o tronco.',
        'Baixe o peso devagar até estender o cotovelo quase completamente.',
      ],
      breathingGuide:
        'Expire ao realizar a flexão do braço e inspire no retorno lento ao ponto inicial.',
      commonMistakes: [
        'Usar o tronco ou o ombro para puxar o peso para cima.',
        'Deslizar o cotovelo para fora do apoio na coxa.',
        'Largar o peso rapidamente na descida.',
      ],
      safetyTips: [
        'Concentre a força exclusivamente no bíceps; se precisar de impulso, reduza a carga do halter.',
        'Faça o mesmo número de repetições com ambos os braços.',
      ],
    },
  {
      id: 'ex_triceps_pulley_barra',
      name: 'Tríceps na polia alta (Pulley)',
      primaryMuscleGroup: 'triceps',
      secondaryMuscleGroups: ['abdomen_core'],
      compatibleEquipmentIds: [
        'std_arms_polia_triceps',
        'std_arms_barras_puxadores_polia',
        'std_general_polias_ajustaveis',
      ],
      equipmentAlternatives: [
        ['std_arms_polia_triceps'],
        ['std_general_polias_ajustaveis', 'std_arms_barras_puxadores_polia'],
      ],
      shortDescription:
        'Extensão de cotovelos na polia alta com barra reta, W ou corda, proporcionando isolamento seguro das três cabeças do tríceps braquial.',
      initialPosition:
        'Conecte a barra ou corda na polia alta. Em pé a um passo da torre, segure o puxador, incline sutilmente o tronco à frente com a coluna neutra e posicione os cotovelos fixos ao lado das costelas.',
      executionSteps: [
        'Mantendo os braços imóveis ao lado do tronco, empurre o puxador para baixo até estender completamente os cotovelos.',
        'Contraia firmemente o tríceps no ponto inferior do movimento.',
        'Retorne o antebraço de forma controlada até formar cerca de 90° ou ligeiramente acima, sem que os cotovelos avancem para a frente.',
        'Mantenha os ombros baixos e as escápulas estabilizadas durante toda a série.',
      ],
      breathingGuide:
        'Expire ao estender os cotovelos para baixo e inspire ao retornar o puxador até a altura do peito.',
      commonMistakes: [
        'Movimentar os cotovelos para a frente e para cima a cada repetição.',
        'Jogar o tronco por cima da barra usando o peso corporal para descer a carga.',
        'Dobrar excessivamente os punhos durante o empurrão.',
      ],
      safetyTips: [
        'Se utilizar a corda, abra suavemente as pontas no final da extensão mantendo os punhos neutros.',
        'Confira se o mosquetão da polia está devidamente fechado antes de iniciar.',
      ],
      illustrationId: 'svg_exercise_triceps_pulley',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Triceps/CBPushdown',
      externalVideoSource: 'ExRx.net — Cable Pushdown',
      externalVideoVerified: false,
    },
  {
      id: 'ex_triceps_testa_barra_w',
      name: 'Tríceps testa deitado com barra W',
      primaryMuscleGroup: 'triceps',
      secondaryMuscleGroups: ['ombros'],
      compatibleEquipmentIds: [
        'std_general_barras_w',
        'std_general_bancos_retos',
        'std_general_anilhas',
      ],
      equipmentAlternatives: [
        ['std_general_barras_w', 'std_general_bancos_retos', 'std_general_anilhas'],
      ],
      shortDescription:
        'Extensão de cotovelos em decúbito dorsal no banco reto, trabalhando fortemente a cabeça longa e medial do tríceps braquial.',
      initialPosition:
        'Deite-se no banco reto com os pés firmes no chão. Segure a barra W com pegada pronada na largura dos ombros e estenda os braços acima do peito, inclinando os braços cerca de 10° a 15° em direção à cabeça.',
      executionSteps: [
        'Mantendo os cotovelos apontados para a frente (sem abrir para os lados), flexione apenas os cotovelos descendo a barra em direção à testa ou topo da cabeça.',
        'Pause por uma fração de segundo com total controle da carga.',
        'Estenda os cotovelos retornando a barra à posição inicial sem mover os ombros.',
        'Mantenha os cotovelos fechados e paralelos durante todo o percurso.',
      ],
      breathingGuide:
        'Inspire ao descer a barra em direção à testa e expire ao estender os cotovelos.',
      commonMistakes: [
        'Abrir excessivamente os cotovelos para os lados durante a subida.',
        'Movimentar os braços para a frente e para trás como um pullover.',
        'Descer a barra de forma descontrolada próximo ao rosto.',
      ],
      safetyTips: [
        'Manter uma leve inclinação dos braços para trás (em direção à cabeça) mantém tensão contínua no tríceps e protege os cotovelos.',
        'Peça auxílio para retirar e devolver a barra caso utilize cargas mais altas.',
      ],
      illustrationId: 'svg_exercise_triceps_testa',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Triceps/BBLyingTriExt',
      externalVideoSource: 'ExRx.net — Barbell Lying Triceps Extension',
      externalVideoVerified: false,
    },
  {
      id: 'ex_triceps_maquina_sentado',
      name: 'Extensão de tríceps na máquina',
      primaryMuscleGroup: 'triceps',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ['std_arms_maquina_triceps'],
      equipmentAlternatives: [['std_arms_maquina_triceps']],
      shortDescription:
        'Exercício guiado em máquina articulada sentado (mergulho máquina ou extensão apoiada), ideal para controle estrito do tríceps.',
      initialPosition:
        'Regule a altura do assento e sente-se com as costas bem apoiadas no encosto. Segure as manoplas laterais ou apoie os braços no suporte do equipamento conforme o modelo da academia.',
      executionSteps: [
        'Deprima as escápulas afastando os ombros das orelhas antes de empurrar.',
        'Estenda os cotovelos empurrando as alavancas até quase a extensão total dos braços.',
        'Contraia o tríceps por um instante mantendo o tronco imóvel no banco.',
        'Retorne as alavancas de maneira controlada até um ângulo próximo de 90° nos cotovelos.',
      ],
      breathingGuide:
        'Expire ao empurrar as alavancas e inspire ao retornar.',
      commonMistakes: [
        'Elevar os ombros na fase excêntrica deixando o peso empurrar os cotovelos muito para cima.',
        'Inclinar o tronco para a frente fora do encosto.',
        'Soltar a carga abruptamente entre as repetições.',
      ],
      safetyTips: [
        'Use o cinto de retenção no quadril caso o equipamento possua e a carga seja próxima ao seu peso corporal.',
        'Evite hiperestender os cotovelos de forma brusca.',
      ],
    },
  {
      id: 'ex_triceps_corda_polia',
      name: 'Tríceps na polia alta com corda',
      primaryMuscleGroup: 'triceps',
      secondaryMuscleGroups: ['abdomen_core'],
      compatibleEquipmentIds: [
        'std_arms_polia_triceps',
        'std_arms_barras_puxadores_polia',
        'std_general_polias_ajustaveis',
      ],
      equipmentAlternatives: [
        ['std_arms_polia_triceps'],
        ['std_general_polias_ajustaveis', 'std_arms_barras_puxadores_polia'],
      ],
      shortDescription:
        'Extensão de cotovelos na polia alta utilizando o puxador de corda, permitindo rotação e abertura final das mãos para máxima contração da cabeça lateral e longa do tríceps.',
      initialPosition:
        'Conecte o puxador de corda na polia alta. Segure a corda com pegada neutra e incline levemente o tronco à frente, mantendo os cotovelos colados às laterais das costelas.',
      executionSteps: [
        'Empurre a corda para baixo estendendo os cotovelos.',
        'No final da descida, afaste as pontas da corda para fora rodando levemente os punhos para aumentar a contração do tríceps.',
        'Mantenha a contração de pico por um instante.',
        'Retorne de forma controlada permitindo que as mãos se aproximem novamente até a altura do tórax.',
      ],
      breathingGuide:
        'Expire ao estender os braços para baixo e afastar a corda, e inspire ao retornar à Posição Inicial.',
      commonMistakes: [
        'Mover os cotovelos para a frente e para trás durante a extensão.',
        'Flexionar excessivamente o punho para baixo no final do movimento.',
        'Incurvar a coluna torácica ou usar o peso do corpo para empurrar.',
      ],
      safetyTips: [
        'Mantenha os ombros abaixados e longe das orelhas.',
        'O movimento deve ser focado estritamente na articulação do cotovelo.',
      ],
    },
  {
      id: 'ex_triceps_coice_halter',
      name: 'Tríceps coice com halter no banco',
      primaryMuscleGroup: 'triceps',
      secondaryMuscleGroups: ['ombros'],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_general_bancos_retos',
        'std_general_bancos_regulaveis',
      ],
      equipmentAlternatives: [
        ['std_general_halteres', 'std_general_bancos_retos'],
        ['std_general_halteres', 'std_general_bancos_regulaveis'],
      ],
      shortDescription:
        'Extensão de cotovelo unilateral com o tronco inclinado e apoiado em banco reto, excelente para isolar a cabeça longa e medial do tríceps.',
      initialPosition:
        'Apoie o joelho e a mão do mesmo lado em um banco reto, mantendo a coluna paralela ao solo. Segure o halter com a outra mão e eleve o cotovelo até que o braço fique paralelo ao tronco.',
      executionSteps: [
        'Fixe o cotovelo ao lado do tronco e estenda o antebraço para trás até que o braço fique totalmente reto.',
        'Sustente a posição final paralela ao solo por um segundo sentindo a contração do tríceps.',
        'Retorne o antebraço a 90° de forma cadenciada sem deixar o cotovelo cair.',
      ],
      breathingGuide:
        'Expire ao estender o braço para trás e inspire ao retornar o antebraço.',
      commonMistakes: [
        'Deixar o cotovelo cair em direção ao chão a cada repetição.',
        'Rodar o tronco para cima para ajudar a subir a carga.',
        'Balançar o braço usando o impulso do ombro.',
      ],
      safetyTips: [
        'Mantenha o pescoço em alinhamento neutro com a coluna olhando sutilmente para o banco.',
        'Selecione uma carga que permita a extensão completa do cotovelo no topo.',
      ],
    },
  {
      id: "ex_ombros_desenvolvimento_barra_em_pe",
      name: "Desenvolvimento militar com barra em pé",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: ["triceps", "abdomen_core"],
      compatibleEquipmentIds: ["std_general_barras_retas", "std_general_anilhas"],
      equipmentAlternatives: [["std_general_barras_retas", "std_general_anilhas"]],
      shortDescription: "Press vertical multiarticular para deltoides, com participação do tríceps e estabilizadores do tronco.",
      initialPosition: "Em pé, barra apoiada na parte alta do tórax, pegada ligeiramente além dos ombros, glúteos e abdômen contraídos.",
      executionSteps: ["Inicie com antebraços aproximadamente verticais e punhos alinhados.", "Empurre a barra verticalmente, afastando a cabeça apenas o necessário.", "Finalize acima da cabeça sem hiperestender a lombar.", "Desça com controle até a posição inicial."],
      breathingGuide: "Expire ao empurrar e inspire na descida.",
      commonMistakes: ["Arquear excessivamente a lombar.", "Desviar a barra para a frente.", "Usar impulso das pernas."],
      safetyTips: ["Mantenha costelas alinhadas sobre a pelve.", "Use rack e travas de segurança."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_desenvolvimento_arnold",
      name: "Desenvolvimento Arnold com halteres",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: ["triceps"],
      compatibleEquipmentIds: ["std_general_halteres", "std_general_bancos_regulaveis"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: "Press com rotação dos antebraços que percorre flexão e abdução do ombro.",
      initialPosition: "Sentado com encosto alto, halteres à frente dos ombros e palmas voltadas para o rosto.",
      executionSteps: ["Inicie a rotação externa enquanto eleva os halteres.", "Empurre até acima da cabeça sem bater os pesos.", "Inverta a rotação ao descer lentamente.", "Retorne à posição inicial com controle."],
      breathingGuide: "Expire na subida e inspire na descida.",
      commonMistakes: ["Rotacionar bruscamente os punhos.", "Arquear a lombar.", "Descer além da amplitude confortável."],
      safetyTips: ["Use carga moderada e amplitude sem dor.", "Mantenha o encosto ajustado."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_elevacao_frontal_halteres",
      name: "Elevação frontal alternada com halteres",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_halteres"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: "Isolador de flexão do ombro com ênfase no deltoide anterior.",
      initialPosition: "Em pé, halteres ao lado das coxas, cotovelos levemente flexionados e tronco estável.",
      executionSteps: ["Eleve um halter à frente até aproximadamente a linha dos ombros.", "Evite elevar o ombro em direção à orelha.", "Desça lentamente e alterne os braços."],
      breathingGuide: "Expire ao elevar e inspire ao retornar.",
      commonMistakes: ["Balançar o tronco.", "Elevar acima da amplitude controlada.", "Usar carga excessiva."],
      safetyTips: ["Mantenha punho neutro.", "Interrompa se houver dor anterior no ombro."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_elevacao_lateral_polia",
      name: "Elevação lateral unilateral na polia",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Tensão contínua na abdução do ombro, enfatizando a porção lateral do deltoide.",
      initialPosition: "Posicione-se ao lado da polia baixa e segure a alça com a mão oposta à torre.",
      executionSteps: ["Afaste a mão lateralmente com cotovelo suavemente flexionado.", "Eleve até a linha do ombro sem inclinar o tronco.", "Retorne devagar mantendo tensão no cabo."],
      breathingGuide: "Expire na elevação e inspire no retorno.",
      commonMistakes: ["Inclinar o tronco para gerar impulso.", "Encolher o ombro.", "Rodar o punho excessivamente."],
      safetyTips: ["Ajuste a polia na posição mais baixa.", "Use carga que permita movimento sem balanço."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_crucifixo_inverso_halteres",
      name: "Crucifixo inverso com halteres",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: ["costas"],
      compatibleEquipmentIds: ["std_general_halteres"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: "Abdução horizontal do ombro com foco no deltoide posterior e estabilizadores escapulares.",
      initialPosition: "Incline o tronco com coluna neutra, joelhos flexionados e halteres abaixo dos ombros.",
      executionSteps: ["Abra os braços em arco mantendo cotovelos semiflexionados.", "Aproxime as escápulas sem elevar os ombros.", "Desça os halteres lentamente."],
      breathingGuide: "Expire ao abrir e inspire ao fechar.",
      commonMistakes: ["Arredondar a coluna.", "Transformar o movimento em remada.", "Usar impulso."],
      safetyTips: ["Mantenha pescoço neutro.", "Prefira carga leve e execução controlada."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_face_pull_corda",
      name: "Face pull na polia com corda",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: ["costas"],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Puxada horizontal alta com rotação externa, enfatizando deltoide posterior e rotadores externos.",
      initialPosition: "Polia na altura do rosto, segure as pontas da corda com braços estendidos.",
      executionSteps: ["Puxe a corda em direção ao rosto separando as mãos.", "Leve os cotovelos para fora sem elevar os ombros.", "Retorne lentamente mantendo o tronco estável."],
      breathingGuide: "Expire ao puxar e inspire ao retornar.",
      commonMistakes: ["Arquear a lombar.", "Puxar em direção ao peito.", "Usar carga que force compensações."],
      safetyTips: ["Mantenha punhos alinhados.", "Não force rotação externa além do conforto."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_remada_alta_cabo",
      name: "Remada alta na polia com barra",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: ["biceps"],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Puxada vertical para deltoide lateral e trapézio superior.",
      initialPosition: "Em pé diante da polia baixa, segure a barra com pegada confortável à frente das coxas.",
      executionSteps: ["Puxe a barra verticalmente mantendo-a próxima ao corpo.", "Pare quando os cotovelos alcançarem altura confortável.", "Desça com controle até estender os braços."],
      breathingGuide: "Expire ao puxar e inspire ao descer.",
      commonMistakes: ["Elevar os cotovelos muito acima dos ombros.", "Balançar o tronco.", "Flexionar os punhos."],
      safetyTips: ["Use pegada que não cause desconforto.", "Não force amplitude alta."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_elevacao_lateral_inclinada",
      name: "Elevação lateral inclinada unilateral",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_halteres"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: "Variação de abdução que mantém tensão no deltoide lateral.",
      initialPosition: "Segure apoio estável com uma mão e incline levemente o tronco; halter na mão livre.",
      executionSteps: ["Eleve o braço lateralmente até a linha do ombro.", "Mantenha cotovelo semiflexionado e tronco imóvel.", "Retorne devagar sem apoiar o halter na coxa."],
      breathingGuide: "Expire ao elevar e inspire ao descer.",
      commonMistakes: ["Girar o tronco.", "Encolher o ombro.", "Usar balanço."],
      safetyTips: ["Não incline além do controle.", "Use carga leve."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_desenvolvimento_unilateral_maquina",
      name: "Desenvolvimento unilateral na máquina",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: ["triceps"],
      compatibleEquipmentIds: ["std_shoulders_desenvolvimento_maquina"],
      equipmentAlternatives: [["std_shoulders_desenvolvimento_maquina"]],
      shortDescription: "Press unilateral guiado para deltoides, permitindo atenção a diferenças entre os lados.",
      initialPosition: "Ajuste o assento e posicione a manopla na altura do ombro.",
      executionSteps: ["Empurre a manopla para cima sem rodar o tronco.", "Estenda o cotovelo sem travar bruscamente.", "Retorne controladamente até a posição inicial."],
      breathingGuide: "Expire ao empurrar e inspire ao retornar.",
      commonMistakes: ["Inclinar o tronco.", "Elevar o ombro.", "Descer além da amplitude confortável."],
      safetyTips: ["Ajuste o eixo da máquina ao ombro.", "Execute ambos os lados com a mesma amplitude."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_elevacao_lateral_cabo_unilateral",
      name: "Elevação lateral unilateral na polia baixa",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Abdução unilateral com resistência constante para o deltoide lateral.",
      initialPosition: "Fique de lado para a torre, cabo atrás do corpo e mão oposta segurando a alça.",
      executionSteps: ["Eleve o braço lateralmente até a linha do ombro.", "Mantenha o cotovelo levemente flexionado.", "Retorne lentamente sem perder a postura."],
      breathingGuide: "Expire na subida e inspire na descida.",
      commonMistakes: ["Inclinar o corpo.", "Rodar o tronco.", "Subir além da amplitude estável."],
      safetyTips: ["Mantenha o cabo livre de obstáculos.", "Não use carga excessiva."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_encolhimento_halteres",
      name: "Encolhimento de ombros com halteres",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: ["costas"],
      compatibleEquipmentIds: ["std_general_halteres"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: "Elevação escapular para trapézio superior.",
      initialPosition: "Em pé, halteres ao lado do corpo, braços estendidos e coluna neutra.",
      executionSteps: ["Eleve os ombros verticalmente em direção às orelhas.", "Pause brevemente sem girar os ombros.", "Desça lentamente até a posição inicial."],
      breathingGuide: "Expire ao elevar e inspire ao descer.",
      commonMistakes: ["Fazer círculos com os ombros.", "Flexionar cotovelos.", "Projetar a cabeça à frente."],
      safetyTips: ["Mantenha pescoço neutro.", "Use carga que permita controle completo."],
      externalVideoVerified: false
    },
  {
      id: "ex_ombros_crucifixo_inverso_maquina",
      name: "Crucifixo inverso na máquina (peck deck invertido)",
      primaryMuscleGroup: "ombros",
      secondaryMuscleGroups: ["costas"],
      compatibleEquipmentIds: ["std_chest_peck_deck", "std_shoulders_elevacao_lateral_maquina"],
      equipmentAlternatives: [["std_chest_peck_deck"], ["std_shoulders_elevacao_lateral_maquina"]],
      shortDescription: "Abdução horizontal guiada para deltoide posterior.",
      initialPosition: "Sente-se de frente para o encosto, peito apoiado e mãos nas manoplas.",
      executionSteps: ["Abra os braços para trás mantendo cotovelos semiflexionados.", "Pause ao alinhar braços com o tronco.", "Retorne lentamente sem deixar os pesos baterem."],
      breathingGuide: "Expire ao abrir e inspire ao retornar.",
      commonMistakes: ["Arquear a lombar.", "Encolher os ombros.", "Usar impulso."],
      safetyTips: ["Ajuste o banco para alinhar as manoplas ao ombro.", "Use amplitude confortável."],
      externalVideoVerified: false
    },
  {
      id: "ex_biceps_rosca_inclinada_halteres",
      name: "Rosca inclinada com halteres",
      primaryMuscleGroup: "biceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_halteres", "std_general_bancos_regulaveis"],
      equipmentAlternatives: [["std_general_halteres", "std_general_bancos_regulaveis"]],
      shortDescription: "Flexão de cotovelo com ombros estendidos, enfatizando a cabeça longa do bíceps.",
      initialPosition: "Sente-se em banco inclinado, braços pendentes e palmas voltadas para a frente.",
      executionSteps: ["Flexione os cotovelos sem avançá-los.", "Eleve os halteres até próximo dos ombros.", "Desça lentamente até alongar sem travar o cotovelo."],
      breathingGuide: "Expire ao subir e inspire ao descer.",
      commonMistakes: ["Levar cotovelos à frente.", "Balançar o tronco.", "Descer sem controle."],
      safetyTips: ["Use amplitude confortável para o ombro.", "Evite hiperextensão do cotovelo."],
      externalVideoVerified: false
    },
  {
      id: "ex_biceps_rosca_cabo_barra",
      name: "Rosca direta na polia baixa com barra",
      primaryMuscleGroup: "biceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Flexão de cotovelo com resistência constante para bíceps e braquial.",
      initialPosition: "Em pé diante da polia baixa, segure a barra com pegada supinada.",
      executionSteps: ["Mantenha cotovelos próximos ao tronco.", "Flexione os cotovelos até a altura do peito.", "Desça lentamente sem deixar a pilha bater."],
      breathingGuide: "Expire na subida e inspire na descida.",
      commonMistakes: ["Inclinar o tronco para trás.", "Mover os cotovelos.", "Flexionar os punhos."],
      safetyTips: ["Mantenha punhos alinhados.", "Use carga que permita execução estrita."],
      externalVideoVerified: false
    },
  {
      id: "ex_biceps_rosca_martelo_corda",
      name: "Rosca martelo na polia com corda",
      primaryMuscleGroup: "biceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Flexão de cotovelos com pegada neutra, enfatizando braquial e braquiorradial.",
      initialPosition: "Segure as pontas da corda na polia baixa com palmas voltadas uma para a outra.",
      executionSteps: ["Flexione os cotovelos mantendo pegada neutra.", "Separe levemente as pontas no topo.", "Retorne devagar sem mover os braços."],
      breathingGuide: "Expire ao flexionar e inspire ao retornar.",
      commonMistakes: ["Balançar o tronco.", "Abrir os cotovelos.", "Dobrar os punhos."],
      safetyTips: ["Mantenha cotovelos junto ao corpo.", "Controle a fase excêntrica."],
      externalVideoVerified: false
    },
  {
      id: "ex_biceps_rosca_reversa_barra",
      name: "Rosca inversa com barra",
      primaryMuscleGroup: "biceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_barras_retas", "std_general_barras_w"],
      equipmentAlternatives: [["std_general_barras_retas"], ["std_general_barras_w"]],
      shortDescription: "Flexão de cotovelos com pegada pronada, recrutando braquiorradial e braquial.",
      initialPosition: "Em pé, segure a barra com palmas voltadas para baixo e punhos alinhados.",
      executionSteps: ["Flexione os cotovelos sem girar os punhos.", "Eleve a barra até próximo do abdômen superior.", "Desça lentamente até quase estender os braços."],
      breathingGuide: "Expire ao subir e inspire ao descer.",
      commonMistakes: ["Usar carga excessiva.", "Flexionar os punhos.", "Balançar o tronco."],
      safetyTips: ["Comece com carga menor que na rosca supinada.", "Mantenha cotovelos estáveis."],
      externalVideoVerified: false
    },
  {
      id: "ex_biceps_rosca_unilateral_polia",
      name: "Rosca unilateral na polia baixa",
      primaryMuscleGroup: "biceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Flexão unilateral com tensão contínua para bíceps.",
      initialPosition: "Fique de frente para a polia baixa e segure a alça com uma mão, palma para cima.",
      executionSteps: ["Flexione o cotovelo mantendo o braço junto ao tronco.", "Contraia sem elevar o ombro.", "Retorne lentamente e repita do outro lado."],
      breathingGuide: "Expire ao flexionar e inspire ao estender.",
      commonMistakes: ["Girar o tronco.", "Avançar o cotovelo.", "Usar impulso."],
      safetyTips: ["Mantenha postura simétrica.", "Iguale repetições entre os lados."],
      externalVideoVerified: false
    },
  {
      id: "ex_biceps_rosca_banco_inclinado_unilateral",
      name: "Rosca unilateral apoiada no banco inclinado",
      primaryMuscleGroup: "biceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_halteres", "std_general_bancos_regulaveis"],
      equipmentAlternatives: [["std_general_halteres", "std_general_bancos_regulaveis"]],
      shortDescription: "Rosca com apoio do braço para reduzir compensações e isolar o bíceps.",
      initialPosition: "Apoie as costas no banco inclinado e mantenha um braço ao lado do corpo com halter.",
      executionSteps: ["Flexione o cotovelo sem deslocar o ombro.", "Eleve o halter até a contração confortável.", "Desça lentamente e troque o braço."],
      breathingGuide: "Expire na subida e inspire na descida.",
      commonMistakes: ["Rodar o tronco.", "Elevar o ombro.", "Soltar a descida."],
      safetyTips: ["Mantenha as costas apoiadas.", "Use carga moderada."],
      externalVideoVerified: false
    },
  {
      id: "ex_biceps_rosca_martelo_cruzada",
      name: "Rosca martelo cruzada com halteres",
      primaryMuscleGroup: "biceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_halteres"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: "Flexão diagonal com pegada neutra, enfatizando braquial e braquiorradial.",
      initialPosition: "Em pé, halteres ao lado do corpo com pegada neutra.",
      executionSteps: ["Eleve um halter em direção ao ombro oposto.", "Mantenha o cotovelo próximo ao tronco.", "Desça controladamente e alterne os lados."],
      breathingGuide: "Expire ao elevar e inspire ao descer.",
      commonMistakes: ["Girar o tronco.", "Balançar o braço.", "Elevar o ombro."],
      safetyTips: ["Faça o movimento sem cruzar excessivamente o corpo.", "Mantenha punho neutro."],
      externalVideoVerified: false
    },
  {
      id: "ex_biceps_rosca_scott_maquina_unilateral",
      name: "Rosca Scott unilateral na máquina",
      primaryMuscleGroup: "biceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_arms_maquina_biceps", "std_arms_banco_scott"],
      equipmentAlternatives: [["std_arms_maquina_biceps"], ["std_arms_banco_scott", "std_general_halteres"]],
      shortDescription: "Flexão unilateral apoiada para trabalho isolado do bíceps.",
      initialPosition: "Ajuste o apoio Scott e posicione um braço totalmente apoiado na almofada.",
      executionSteps: ["Flexione o cotovelo elevando a manopla.", "Pause sem retirar o braço do apoio.", "Desça com controle e repita do outro lado."],
      breathingGuide: "Expire ao subir e inspire ao descer.",
      commonMistakes: ["Tirar o braço do apoio.", "Deixar o peso despencar.", "Estender o cotovelo bruscamente."],
      safetyTips: ["Ajuste o eixo da máquina ao cotovelo.", "Não force a extensão final."],
      externalVideoVerified: false
    },
  {
      id: "ex_biceps_rosca_concentrada_cabo",
      name: "Rosca concentrada unilateral na polia baixa",
      primaryMuscleGroup: "biceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Flexão de cotovelo unilateral com tensão constante e tronco estabilizado.",
      initialPosition: "Sente-se de frente à polia baixa, cotovelo apoiado na parte interna da coxa e alça na mão.",
      executionSteps: ["Flexione o cotovelo mantendo o braço apoiado.", "Contraia o bíceps sem mover o ombro.", "Retorne lentamente até quase estender."],
      breathingGuide: "Expire ao flexionar e inspire ao retornar.",
      commonMistakes: ["Descolar o cotovelo da coxa.", "Girar o tronco.", "Usar carga excessiva."],
      safetyTips: ["Mantenha o punho alinhado.", "Repita dos dois lados."],
      externalVideoVerified: false
    },
  {
      id: "ex_triceps_frances_halter_unilateral",
      name: "Tríceps francês unilateral com halter",
      primaryMuscleGroup: "triceps",
      secondaryMuscleGroups: ["ombros"],
      compatibleEquipmentIds: ["std_general_halteres"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: "Extensão de cotovelo acima da cabeça, enfatizando a cabeça longa do tríceps.",
      initialPosition: "Em pé ou sentado, segure um halter acima da cabeça com uma mão e cotovelo apontado para cima.",
      executionSteps: ["Flexione o cotovelo levando o halter atrás da cabeça.", "Mantenha o braço próximo à orelha.", "Estenda o cotovelo sem arquear a lombar."],
      breathingGuide: "Inspire ao descer e expire ao estender.",
      commonMistakes: ["Abrir excessivamente o cotovelo.", "Arquear a lombar.", "Mover o braço inteiro."],
      safetyTips: ["Use amplitude confortável para o ombro.", "Comece com carga leve."],
      externalVideoVerified: false
    },
  {
      id: "ex_triceps_frances_corda_polia",
      name: "Tríceps francês na polia com corda",
      primaryMuscleGroup: "triceps",
      secondaryMuscleGroups: ["ombros"],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Extensão de cotovelos acima da cabeça com resistência de cabo.",
      initialPosition: "De costas para a polia baixa, segure a corda atrás da cabeça e incline levemente o tronco.",
      executionSteps: ["Estenda os cotovelos à frente mantendo braços próximos à cabeça.", "Contraia o tríceps no final sem mover os ombros.", "Flexione lentamente retornando à posição inicial."],
      breathingGuide: "Expire ao estender e inspire ao flexionar.",
      commonMistakes: ["Abrir os cotovelos.", "Arquear a lombar.", "Usar impulso do tronco."],
      safetyTips: ["Mantenha abdômen contraído.", "Verifique o mosquetão antes de iniciar."],
      externalVideoVerified: false
    },
  {
      id: "ex_triceps_coice_polia",
      name: "Coice de tríceps na polia baixa",
      primaryMuscleGroup: "triceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Extensão unilateral de cotovelo com tensão constante para tríceps.",
      initialPosition: "Incline o tronco com coluna neutra e segure a alça da polia baixa, cotovelo junto ao tronco.",
      executionSteps: ["Estenda o cotovelo levando a mão para trás.", "Mantenha o braço alinhado ao tronco.", "Retorne devagar sem deixar o cotovelo avançar excessivamente."],
      breathingGuide: "Expire ao estender e inspire ao retornar.",
      commonMistakes: ["Girar o tronco.", "Mover o ombro.", "Usar carga alta."],
      safetyTips: ["Mantenha o cotovelo estável.", "Use carga leve e controle total."],
      externalVideoVerified: false
    },
  {
      id: "ex_triceps_supino_fechado_barra",
      name: "Supino fechado com barra",
      primaryMuscleGroup: "triceps",
      secondaryMuscleGroups: ["peito"],
      compatibleEquipmentIds: ["std_general_barras_retas", "std_general_bancos_retos", "std_general_anilhas"],
      equipmentAlternatives: [["std_general_barras_retas", "std_general_bancos_retos", "std_general_anilhas"]],
      shortDescription: "Press horizontal com pegada mais fechada, enfatizando tríceps com participação do peitoral.",
      initialPosition: "Deite no banco reto, pés apoiados e segure a barra com pegada aproximadamente na largura dos ombros.",
      executionSteps: ["Desça a barra em direção à parte inferior do esterno mantendo cotovelos próximos ao tronco.", "Toque suavemente ou pare antes de perder estabilidade.", "Empurre até estender os cotovelos sem travar bruscamente."],
      breathingGuide: "Inspire ao descer e expire ao empurrar.",
      commonMistakes: ["Pegada excessivamente estreita.", "Abrir cotovelos.", "Quicar a barra no peito."],
      safetyTips: ["Use observador ou travas de segurança.", "Punhos alinhados sobre os antebraços."],
      externalVideoVerified: false
    },
  {
      id: "ex_triceps_mergulho_banco",
      name: "Mergulho de tríceps no banco",
      primaryMuscleGroup: "triceps",
      secondaryMuscleGroups: ["ombros"],
      compatibleEquipmentIds: ["std_general_bancos_retos"],
      equipmentAlternatives: [["std_general_bancos_retos"]],
      shortDescription: "Extensão de cotovelos com peso corporal, enfatizando tríceps.",
      initialPosition: "Apoie as mãos na borda de um banco firme, dedos para a frente, pernas posicionadas à frente.",
      executionSteps: ["Flexione os cotovelos levando o quadril próximo ao banco.", "Desça apenas até amplitude confortável para os ombros.", "Empurre o banco estendendo os cotovelos."],
      breathingGuide: "Inspire ao descer e expire ao subir.",
      commonMistakes: ["Descer excessivamente.", "Afastar o quadril do banco.", "Abrir cotovelos."],
      safetyTips: ["Interrompa se houver dor anterior no ombro.", "Prefira variação assistida se necessário."],
      externalVideoVerified: false
    },
  {
      id: "ex_triceps_extensao_unilateral_polia",
      name: "Extensão unilateral de tríceps na polia",
      primaryMuscleGroup: "triceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Extensão isolada unilateral para tríceps com cabo.",
      initialPosition: "Fique de frente para a polia alta e segure a alça com uma mão, cotovelo junto ao tronco.",
      executionSteps: ["Estenda o cotovelo para baixo até contrair o tríceps.", "Mantenha o braço superior imóvel.", "Retorne lentamente e troque de lado."],
      breathingGuide: "Expire ao estender e inspire ao retornar.",
      commonMistakes: ["Rodar o tronco.", "Mover o ombro.", "Dobrar o punho."],
      safetyTips: ["Mantenha o punho neutro.", "Iguale o trabalho dos lados."],
      externalVideoVerified: false
    },
  {
      id: "ex_triceps_extensao_triceps_maquina_acima",
      name: "Extensão de tríceps acima da cabeça na máquina",
      primaryMuscleGroup: "triceps",
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_arms_maquina_triceps"],
      equipmentAlternatives: [["std_arms_maquina_triceps"]],
      shortDescription: "Extensão guiada de cotovelos em posição elevada para enfatizar a cabeça longa.",
      initialPosition: "Ajuste o assento e posicione cotovelos e braços conforme o apoio da máquina.",
      executionSteps: ["Flexione os cotovelos de forma controlada.", "Estenda até contrair o tríceps sem travar abruptamente.", "Retorne lentamente mantendo os braços apoiados."],
      breathingGuide: "Expire ao estender e inspire ao flexionar.",
      commonMistakes: ["Ajuste inadequado do eixo.", "Usar impulso.", "Forçar a amplitude."],
      safetyTips: ["Ajuste o equipamento antes da série.", "Respeite o limite articular."],
      externalVideoVerified: false
    },
  {
      id: "ex_triceps_pullover_triceps_corda",
      name: "Extensão de tríceps com corda acima da cabeça",
      primaryMuscleGroup: "triceps",
      secondaryMuscleGroups: ["ombros"],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"],
      equipmentAlternatives: [["std_general_polias_ajustaveis", "std_arms_barras_puxadores_polia"]],
      shortDescription: "Extensão de cotovelos com cabo em posição inclinada, enfatizando cabeça longa.",
      initialPosition: "De costas para a polia alta, segure a corda atrás da cabeça com cotovelos flexionados.",
      executionSteps: ["Estenda os cotovelos à frente mantendo braços estáveis.", "Separe levemente as pontas da corda no final.", "Retorne com controle."],
      breathingGuide: "Expire ao estender e inspire ao retornar.",
      commonMistakes: ["Abrir cotovelos.", "Mover os ombros.", "Arquear a lombar."],
      safetyTips: ["Mantenha abdômen firme.", "Não force a amplitude do ombro."],
      externalVideoVerified: false
    },
  {
      id: "ex_triceps_triceps_paralelas_assistido",
      name: "Mergulho nas paralelas assistido",
      primaryMuscleGroup: "triceps",
      secondaryMuscleGroups: ["peito", "ombros"],
      compatibleEquipmentIds: ["std_arms_maquina_triceps"],
      equipmentAlternatives: [["std_arms_maquina_triceps"]],
      shortDescription: "Extensão de cotovelos em cadeia fechada com assistência para regular a carga corporal.",
      initialPosition: "Ajuste a assistência do equipamento e apoie as mãos nas barras paralelas.",
      executionSteps: ["Desça flexionando os cotovelos em amplitude confortável.", "Mantenha o tronco relativamente vertical para enfatizar tríceps.", "Empurre as barras até retornar ao topo."],
      breathingGuide: "Inspire ao descer e expire ao subir.",
      commonMistakes: ["Descer além da mobilidade do ombro.", "Balançar as pernas.", "Elevar os ombros."],
      safetyTips: ["Use assistência suficiente para controlar o movimento.", "Não force a posição inferior."],
      externalVideoVerified: false
    },
  {
      id: 'ex_quadriceps_agachamento_livre',
      name: 'Agachamento livre com barra',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'posterior_coxa', 'abdomen_core'],
      compatibleEquipmentIds: [
        'std_legs_agachamento_livre_rack',
        'std_general_rack_agachamento',
        'std_general_barras_retas',
        'std_general_anilhas',
      ],
      equipmentAlternatives: [
        ['std_legs_agachamento_livre_rack', 'std_general_barras_retas', 'std_general_anilhas'],
        ['std_general_rack_agachamento', 'std_general_barras_retas', 'std_general_anilhas'],
      ],
      shortDescription:
        'Exercício multiarticular base de membros inferiores para desenvolvimento de quadríceps, glúteos e estabilidade de tronco.',
      initialPosition:
        'Posicione a barra no rack na altura da linha superior do peitoral. Entre sob a barra apoiando-a sobre a musculatura do trapézio (nunca sobre as vértebras cervicais), retire-a do suporte e afaste os pés na largura dos ombros com as pontas levemente voltadas para fora.',
      executionSteps: [
        'Inspire profundamente ativando a parede abdominal (bracing) e mantenha o olhar à frente.',
        'Flexione simultaneamente quadris, joelhos e tornozelos descendo o quadril de forma controlada.',
        'Mantenha os joelhos alinhados na direção da ponta dos pés e a coluna neutra até atingir a amplitude segura para a sua mobilidade.',
        'Empurre o chão com a planta inteira dos pés retornando de forma firme à posição em pé.',
      ],
      breathingGuide:
        'Inspire e estabilize o core antes de iniciar a descida; expire na metade final da subida.',
      commonMistakes: [
        'Permitir que os joelhos colapsem para dentro (valgo dinâmico) durante a subida.',
        'Retirar os calcanhares do chão deslocando o peso para a ponta dos pés.',
        'Perder a curvatura neutra da coluna lombar no fundo do movimento.',
      ],
      safetyTips: [
        'Configure sempre as barras de segurança laterais do rack ligeiramente abaixo da sua profundidade máxima de agachamento.',
        'Ao finalizar a série, caminhe à frente até encostar ambos os lados da barra nos ganchos antes de abaixá-la.',
      ],
      illustrationId: 'svg_exercise_agachamento_livre',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Quadriceps/BBSquat',
      externalVideoSource: 'ExRx.net — Barbell Squat',
      externalVideoVerified: false,
    },
  {
      id: 'ex_quadriceps_leg_press_45',
      name: 'Leg press 45°',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'posterior_coxa'],
      compatibleEquipmentIds: [
        'std_legs_leg_press_45',
        'std_legs_leg_press_horizontal',
      ],
      equipmentAlternatives: [
        ['std_legs_leg_press_45'],
        ['std_legs_leg_press_horizontal'],
      ],
      shortDescription:
        'Empurrão de membros inferiores em plataforma guiada, permitindo trabalho intenso de quadríceps e glúteos com a coluna totalmente apoiada.',
      initialPosition:
        'Sente-se no aparelho apoiando completamente o quadril e a região lombar no encosto. Posicione os pés na plataforma na largura do quadril ou ombros, destrave a plataforma estendendo os joelhos sem hiperestendê-los e acione as alavancas laterais de segurança.',
      executionSteps: [
        'Segure nas alças laterais do assento para manter o quadril preso contra o estofado.',
        'Flexione os joelhos descendo a plataforma de forma controlada até cerca de 90° ou enquanto o quadril permanecer totalmente apoiado no banco.',
        'Mantenha os joelhos alinhados com a direção dos pés durante todo o percurso.',
        'Empurre a plataforma pelos calcanhares e meio dos pés até próximo da extensão completa, mantendo os joelhos levemente destravados no topo.',
      ],
      breathingGuide:
        'Inspire durante a descida controlada da plataforma e expire ao empurrá-la.',
      commonMistakes: [
        'Travar completamente os joelhos em hiperextensão no topo sob carga.',
        'Descer a plataforma além da sua mobilidade, fazendo o quadril e o sacro desencostarem do banco (retroversão pélvica).',
        'Empurrar os joelhos com as mãos em vez de segurar nas alças laterais.',
      ],
      safetyTips: [
        'NUNCA hiperestenda ou trave os joelhos no final da subida.',
        'Ao terminar a série, trave completamente as alavancas laterais de segurança e confirme o encaixe mecânico antes de relaxar as pernas.',
      ],
      illustrationId: 'svg_exercise_leg_press_45',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Quadriceps/SL45LegPress',
      externalVideoSource: 'ExRx.net — Sled 45° Leg Press',
      externalVideoVerified: false,
    },
  {
      id: 'ex_quadriceps_cadeira_extensora',
      name: 'Cadeira extensora',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ['std_legs_cadeira_extensora'],
      equipmentAlternatives: [['std_legs_cadeira_extensora']],
      shortDescription:
        'Exercício uniarticular de extensão de joelhos para isolamento direto das quatro porções do músculo quadríceps femoral.',
      initialPosition:
        'Regule a distância do encosto para que a parte posterior dos seus joelhos fique encaixada na borda do assento (alinhada ao eixo de rotação da máquina) e ajuste o rolo inferior na parte distal da canela, logo acima do tornozelo.',
      executionSteps: [
        'Sente-se com a pelve e a coluna bem apoiadas e segure firme nas alças laterais.',
        'Estenda os joelhos elevando o rolo acolchoado até o alinhamento completo das pernas.',
        'Sustente a contração máxima do quadríceps no topo por 1 segundo.',
        'Desça a carga de maneira controlada sem deixar as placas de peso baterem no fim do curso.',
      ],
      breathingGuide:
        'Expire ao estender os joelhos e inspire ao retornar de maneira controlada.',
      commonMistakes: [
        'Posicionar o rolo acolchoado sobre o dorso do pé em vez da região inferior da tíbia.',
        'Chutar o peso com impulso balístico tirando o quadril do banco.',
        'Deixar os joelhos muito à frente ou muito atrás do eixo de giro da máquina.',
      ],
      safetyTips: [
        'Reserve alguns segundos antes da série para ajustar o encosto e a altura do rolo conforme o comprimento da sua perna.',
        'Evite movimentos explosivos que gerem impacto patelofemoral.',
      ],
      illustrationId: 'svg_exercise_cadeira_extensora',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Quadriceps/LVLegExtension',
      externalVideoSource: 'ExRx.net — Lever Leg Extension',
      externalVideoVerified: false,
    },
  {
      id: 'ex_quadriceps_hack_squat',
      name: 'Agachamento no Hack machine',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'posterior_coxa'],
      compatibleEquipmentIds: [
        'std_legs_hack_squat',
        'std_legs_smith_machine',
      ],
      equipmentAlternatives: [
        ['std_legs_hack_squat'],
        ['std_legs_smith_machine'],
      ],
      shortDescription:
        'Agachamento guiado em trilho inclinado com apoio dorsal e ombreiras acolchoadas, proporcionando alto estímulo para os quadríceps com estabilidade de coluna.',
      initialPosition:
        'Entre no aparelho Hack squat, encaixe os ombros sob as ombreiras acolchoadas, apoie totalmente as costas e o quadril no encosto deslizante e posicione os pés na plataforma na largura dos ombros.',
      executionSteps: [
        'Empurre levemente para cima para liberar as travas laterais de segurança.',
        'Desça o carrinho flexionando os joelhos e o quadril de forma controlada, mantendo toda a coluna apoiada na prancha.',
        'Desça até que as coxas fiquem aproximadamente paralelas à plataforma, mantendo os calcanhares inteiramente apoiados.',
        'Empurre a plataforma de volta à posição inicial sem travar os joelhos no topo.',
      ],
      breathingGuide:
        'Inspire durante a descida no trilho e expire na metade superior da subida.',
      commonMistakes: [
        'Desencostar a lombar ou o quadril do encosto tentando empurrar apenas com o tronco.',
        'Posicionar os pés excessivamente para baixo a ponto de levantar os calcanhares.',
        'Fechar os joelhos para dentro durante a fase concêntrica.',
      ],
      safetyTips: [
        'Acione as travas laterais de segurança com firmeza ao concluir a última repetição antes de sair do aparelho.',
        'Nunca trave os joelhos em hiperextensão.',
      ],
    },
  {
      id: 'ex_quadriceps_agachamento_bulgaro',
      name: 'Agachamento búlgaro com halteres',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'posterior_coxa'],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_general_bancos_retos',
        'std_general_bancos_regulaveis',
      ],
      equipmentAlternatives: [
        ['std_general_halteres', 'std_general_bancos_retos'],
        ['std_general_halteres', 'std_general_bancos_regulaveis'],
      ],
      shortDescription:
        'Agachamento unipedal avançado com a perna traseira elevada em um banco, excelente para hipertrofia de quadríceps e glúteos com alta estabilização.',
      initialPosition:
        'Em pé de costas para um banco reto, apoie o peito do pé traseiro no acolchoado. Dê um passo à frente com a perna de apoio e segure um halter em cada mão.',
      executionSteps: [
        'Flexione o joelho da perna da frente descendo o quadril na vertical até que a coxa fique paralela ao solo.',
        'Mantenha o joelho da frente alinhado com a ponta do pé sem ultrapassá-la excessivamente.',
        'Empurre o solo com o calcanhar da frente retornando à posição inicial.',
        'Conclua a série com uma perna antes de alternar o lado.',
      ],
      breathingGuide:
        'Inspire ao descer no agachamento e expire ao empurrar o solo para subir.',
      commonMistakes: [
        'Posicionar o pé da frente muito próximo do banco colidindo o joelho.',
        'Projetar o joelho para dentro (valgo dinâmico).',
        'Inclinar excessivamente o tronco para a frente.',
      ],
      safetyTips: [
        'Inicie apenas com o peso do corpo para dominar o equilíbrio antes de adicionar halteres.',
        'Mantenha o olhar fixo em um ponto à frente para preservar o equilíbrio postural.',
      ],
    },
  {
      id: 'ex_quadriceps_passada_afundo_halteres',
      name: 'Passada (Afundo dinâmico com halteres)',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'posterior_coxa', 'panturrilhas'],
      compatibleEquipmentIds: [
        'std_general_halteres',
      ],
      equipmentAlternatives: [
        ['std_general_halteres'],
      ],
      shortDescription:
        'Exercício dinâmico de caminhada com passadas e flexão unilateral de joelhos, promovendo desenvolvimento funcional de quadríceps, glúteos e equilíbrio.',
      initialPosition:
        'Em pé no início do corredor com postura ereta, segure um halter em cada mão com os braços estendidos ao lado do corpo.',
      executionSteps: [
        'Dê um passo largo à frente com uma das pernas e flexione ambos os joelhos a cerca de 90°.',
        'O joelho traseiro deve se aproximar do solo sem tocá-lo bruscamente.',
        'Projete o corpo à frente empurrando com o pé da frente e dando o próximo passo com a outra perna.',
        'Prossiga alternando as pernas continuamente.',
      ],
      breathingGuide:
        'Inspire ao dar o passo e afundar os joelhos e expire ao subir e projetar o próximo passo.',
      commonMistakes: [
        'Dar passadas muito curtas sobrecarregando a articulação patelar.',
        'Perder o equilíbrio e pender o tronco para as laterais.',
        'Bater o joelho traseiro com força no chão.',
      ],
      safetyTips: [
        'Mantenha o abdômen contraído durante todo o percurso da caminhada.',
        'Garanta um corredor livre de obstáculos antes de começar.',
      ],
    },
  {
      id: 'ex_posterior_mesa_flexora',
      name: 'Mesa flexora deitado',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['panturrilhas'],
      compatibleEquipmentIds: ['std_legs_mesa_flexora'],
      equipmentAlternatives: [['std_legs_mesa_flexora']],
      shortDescription:
        'Flexão de joelhos em decúbito ventral (deitado de bruços) para isolamento dos músculos isquiotibiais (posterior de coxa).',
      initialPosition:
        'Deite-se de bruços na mesa flexora alinhando a articulação dos joelhos exatamente com o eixo de rotação lateral do aparelho (logo fora da borda do estofado). Ajuste o rolo acolchoado na parte posterior do tornozelo, acima do calcanhar.',
      executionSteps: [
        'Segure as alças frontais e mantenha o quadril (cristas ilíacas) pressionado contra o banco durante toda a série.',
        'Flexione os joelhos trazendo o rolo acolchoado em direção aos glúteos de forma controlada.',
        'Pause brevemente no ponto de maior contração sem levantar o quadril do estofado.',
        'Desça o peso lentamente controlando a fase excêntrica até próximo da extensão completa.',
      ],
      breathingGuide:
        'Expire ao flexionar os joelhos subindo o rolo e inspire ao estender as pernas.',
      commonMistakes: [
        'Levantar o quadril do banco ao subir o peso, sobrecarregando a coluna lombar.',
        'Deixar a cabeça hiperestendida olhando para cima; mantenha a cervical neutra.',
        'Soltar o peso rapidamente na descida.',
      ],
      safetyTips: [
        'Pressionar suavemente a pelve contra o banco evita compensação lombar e aumenta o recrutamento dos isquiotibiais.',
        'Ajuste o comprimento do braço mecânico para que o rolo não escorregue pela panturrilha.',
      ],
      illustrationId: 'svg_exercise_mesa_flexora',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl',
      externalVideoSource: 'ExRx.net — Lever Lying Leg Curl',
      externalVideoVerified: false,
    },
  {
      id: 'ex_posterior_cadeira_flexora',
      name: 'Cadeira flexora sentado',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['panturrilhas'],
      compatibleEquipmentIds: ['std_legs_cadeira_flexora'],
      equipmentAlternatives: [['std_legs_cadeira_flexora']],
      shortDescription:
        'Flexão de joelhos sentado com o quadril flexionado, colocando os isquiotibiais em posição de pré-alongamento altamente eficiente.',
      initialPosition:
        'Ajuste o encosto para que seus joelhos fiquem alinhados ao pivô da máquina. Posicione a parte posterior dos tornozelos sobre o rolo inferior e trave a almofada superior firmemente sobre as coxas (acima da patela).',
      executionSteps: [
        'Sente-se com a coluna apoiada no encosto e segure nas alças da trava frontal.',
        'Flexione os joelhos empurrando o rolo inferior para baixo e para trás o máximo possível com controle.',
        'Segure a contração na parte inferior por um instante.',
        'Retorne as pernas devagar até a extensão controlada sem perder o contato das costas com o banco.',
      ],
      breathingGuide:
        'Expire ao flexionar os joelhos para baixo e inspire na subida controlada das pernas.',
      commonMistakes: [
        'Deixar a trava superior das coxas frouxa, fazendo o quadril subir durante a força.',
        'Posicionar a trava superior diretamente em cima da patela (joelho).',
        'Inclinar o tronco para a frente saindo do encosto.',
      ],
      safetyTips: [
        'A almofada de retenção deve ficar apoiada na parte distal da coxa, nunca pressionando a articulação do joelho.',
        'Controle o retorno para proteger a musculatura alongada.',
      ],
    },
  {
      id: 'ex_posterior_stiff_barra',
      name: 'Stiff com barra ou halteres',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'costas', 'abdomen_core'],
      compatibleEquipmentIds: [
        'std_general_barras_retas',
        'std_general_halteres',
        'std_general_anilhas',
      ],
      equipmentAlternatives: [
        ['std_general_barras_retas', 'std_general_anilhas'],
        ['std_general_halteres'],
      ],
      shortDescription:
        'Exercício de dobradiça de quadril (hip hinge) que trabalha intensamente os isquiotibiais em alongamento e os extensores do quadril.',
      initialPosition:
        'Em pé, com os pés afastados na largura do quadril, segure a barra ou par de halteres à frente das coxas com pegada pronada. Mantenha as escápulas encaixadas, o abdômen firme e os joelhos com uma leve e fixa semiflexão.',
      executionSteps: [
        'Inicie o movimento projetando o quadril para trás (como se fosse fechar uma porta com os glúteos), mantendo a coluna rigorosamente neutra.',
        'Desça a barra ou os halteres deslizando rente às coxas e canelas até sentir um alongamento firme no posterior de coxa (geralmente até o meio da canela).',
        'Não arredonde a coluna para tentar tocar os pesos no chão.',
        'Contraia glúteos e posteriores empurrando o quadril de volta à frente até ficar ereto.',
      ],
      breathingGuide:
        'Inspire ao projetar o quadril para trás na descida e expire ao estender o quadril retornando à posição em pé.',
      commonMistakes: [
        'Afastar a barra ou os halteres para longe das pernas, aumentando a alavanca sobre a lombar.',
        'Curvar a coluna torácica e lombar para ganhar amplitude artificial.',
        'Hiperestender a coluna lombar jogando os ombros para trás no topo.',
      ],
      safetyTips: [
        'A amplitude correta do Stiff termina exatamente onde o quadril para de ir para trás; descer além disso força apenas a coluna.',
        'Mantenha o pescoço alinhado ao tronco (olhar acompanha a inclinação do tronco).',
      ],
      illustrationId: 'svg_exercise_stiff_barra',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Hamstrings/BBStrBackStrLegDeadlift',
      externalVideoSource: 'ExRx.net — Barbell Straight-Back Stiff-Leg Deadlift',
      externalVideoVerified: false,
    },
  {
      id: 'ex_posterior_cadeira_flexora_unilateral',
      name: 'Flexão de joelho unilateral na cadeira flexora',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['panturrilhas'],
      compatibleEquipmentIds: ['std_legs_cadeira_flexora'],
      equipmentAlternatives: [['std_legs_cadeira_flexora']],
      shortDescription:
        'Execução unilateral na cadeira flexora para fortalecimento individualizado dos isquiotibiais, correção de assimetrias entre membros e suporte ao controle muscular na corrida de rua.',
      initialPosition:
        'Ajuste o encosto da cadeira flexora alinhando o joelho da perna de trabalho ao eixo de rotação da máquina. Posicione apenas o tornozelo do membro ativo sobre o rolo inferior, acomode a perna oposta fora da área de curso do rolo e fixe a trava acolchoada sobre as coxas, logo acima da patela.',
      executionSteps: [
        'Sente-se com a pelve e a coluna firmemente apoiadas no encosto, segurando nas alças frontais da trava.',
        'Flexione o joelho da perna ativa empurrando o rolo inferior para baixo e para trás de maneira fluida e controlada.',
        'Sustente a contração máxima dos isquiotibiais por 1 segundo na parte inferior sem compensar com o quadril.',
        'Retorne o rolo lentamente na fase excêntrica até próximo da extensão completa e conclua todas as repetições antes de trocar de perna.',
      ],
      breathingGuide:
        'Expire ao flexionar o joelho empurrando o rolo para baixo e inspire durante o retorno controlado.',
      commonMistakes: [
        'Girar a pelve ou desencostar o glúteo do banco para compensar excesso de carga na perna ativa.',
        'Soltar a carga rapidamente na subida, perdendo o controle excêntrico fundamental para prevenção de lesões na corrida.',
        'Posicionar a almofada de retenção diretamente sobre a patela em vez da porção distal da coxa.',
      ],
      safetyTips: [
        'Utilize carga compatível com a força individual de cada perna, iniciando a série pelo membro com menor força para nivelar o volume.',
        'Mantenha o tornozelo da perna ativa em leve dorsiflexão (ponta do pé voltada para a canela) e a perna livre fora do trajeto mecânico.',
      ],
    },
  {
      id: 'ex_posterior_terra_romeno_unilateral_halter',
      name: 'Terra romeno unilateral com halter',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core', 'panturrilhas'],
      compatibleEquipmentIds: ['std_general_halteres'],
      equipmentAlternatives: [['std_general_halteres']],
      shortDescription:
        'Dobradiça de quadril em apoio unipodal com halter, integrando fortalecimento excêntrico de posterior de coxa, estabilidade pélvica e propriocepção essenciais para a corrida de rua.',
      initialPosition:
        'Em pé, apoie o peso corporal sobre uma das pernas mantendo o joelho de base levemente semiflexionado e destravado. Segure um halter na mão oposta à perna de apoio (ou um par de halteres à frente das coxas), mantenha o abdômen ativo e as escápulas encaixadas.',
      executionSteps: [
        'Inicie o movimento projetando o quadril para trás enquanto eleva a perna livre estendida no prolongamento exato do tronco (como uma gangorra).',
        'Desça o halter rente à linha da perna de apoio mantendo a coluna neutra e os dois lados do quadril paralelos ao solo.',
        'Interrompa a descida ao sentir o alongamento firme dos isquiotibiais da perna de base (geralmente na altura do meio da canela).',
        'Empurre o solo com o pé de apoio contraindo glúteo e posterior de coxa para estender o quadril de volta à posição ereta.',
      ],
      breathingGuide:
        'Inspire durante a inclinação controlada do tronco à frente e expire ao estender o quadril retornando à posição inicial.',
      commonMistakes: [
        'Abrir e girar o quadril da perna elevada para o lado, perdendo o alinhamento pélvico frontal.',
        'Arredondar a coluna lombar e torácica tentando levar o halter até o chão sem mobilidade suficiente.',
        'Deixar o halter afastar-se para a frente longe da linha vertical do pé de apoio.',
      ],
      safetyTips: [
        'Foque um ponto fixo no solo cerca de dois metros à frente para auxiliar o equilíbrio e manter a cervical alinhada ao tronco.',
        'Se o equilíbrio limitar a execução técnica, apoie levemente a mão livre em uma estrutura estável na altura do quadril.',
      ],
    },
  {
      id: 'ex_quadriceps_agachamento_frontal_barra',
      name: 'Agachamento frontal com barra',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_barras_retas', 'std_general_anilhas', 'std_general_rack_agachamento'],
      equipmentAlternatives: [['std_general_barras_retas'], ['std_general_anilhas'], ['std_general_rack_agachamento']],
      shortDescription: 'Agachamento com a barra à frente dos ombros, exigindo tronco mais vertical e grande participação do quadríceps.',
      initialPosition: 'Apoie a barra na região anterior dos deltoides, cotovelos altos, pés na largura dos ombros e abdômen firme.',
      executionSteps: [
        'Inspire e estabilize o tronco antes de iniciar.',
        'Flexione quadris e joelhos mantendo os cotovelos elevados e a barra apoiada.',
        'Desça até a amplitude em que mantenha calcanhares e coluna estáveis.',
        'Empurre o chão e estenda quadris e joelhos sem travá-los bruscamente.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_agachamento_goblet',
      name: 'Agachamento goblet com halter',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_halteres'],
      equipmentAlternatives: [['std_general_halteres']],
      shortDescription: 'Agachamento segurando um halter junto ao peito, útil para controle de postura e amplitude.',
      initialPosition: 'Segure um halter verticalmente junto ao peito, pés ligeiramente abertos e tronco firme.',
      executionSteps: [
        'Inspire e mantenha o halter próximo ao esterno.',
        'Flexione joelhos e quadris acompanhando a direção dos pés.',
        'Desça sem arredondar a lombar ou retirar os calcanhares do solo.',
        'Suba pressionando o chão de maneira uniforme.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_agachamento_sumo_halter',
      name: 'Agachamento sumô com halter',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'adutores'],
      compatibleEquipmentIds: ['std_general_halteres'],
      equipmentAlternatives: [['std_general_halteres']],
      shortDescription: 'Agachamento com base ampla e ponta dos pés para fora, trabalhando quadríceps e musculatura do quadril.',
      initialPosition: 'Afaste os pés além da largura dos ombros, pontas voltadas para fora e halter suspenso entre as pernas.',
      executionSteps: [
        'Inspire e mantenha o peito aberto.',
        'Flexione joelhos na direção dos pés e leve o quadril para baixo.',
        'Desça até a amplitude confortável mantendo a coluna neutra.',
        'Empurre o solo e retorne sem deixar os joelhos colapsarem para dentro.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_agachamento_smith',
      name: 'Agachamento no Smith',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos'],
      compatibleEquipmentIds: ['std_legs_smith_machine'],
      equipmentAlternatives: [['std_legs_smith_machine']],
      shortDescription: 'Agachamento guiado que permite controlar a trajetória da barra e concentrar o esforço nos membros inferiores.',
      initialPosition: 'Posicione a barra sobre o trapézio, pés alinhados à trajetória do Smith e travas de segurança ajustadas.',
      executionSteps: [
        'Destrave a barra e firme o abdômen.',
        'Flexione quadris e joelhos mantendo os pés totalmente apoiados.',
        'Desça até a amplitude individual sem perder o alinhamento dos joelhos.',
        'Estenda quadris e joelhos e trave a barra nos suportes ao terminar.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_step_up_banco_halteres',
      name: 'Step-up no banco com halteres',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos'],
      compatibleEquipmentIds: ['std_general_halteres', 'std_general_bancos_retos'],
      equipmentAlternatives: [['std_general_halteres'], ['std_general_bancos_retos']],
      shortDescription: 'Subida unilateral em plataforma estável, desenvolvendo força de quadríceps e controle de apoio.',
      initialPosition: 'Fique diante de um banco/plataforma firme, segurando halteres ao lado do corpo; apoie um pé inteiro no banco.',
      executionSteps: [
        'Incline levemente o tronco mantendo a coluna neutra.',
        'Empurre o banco com a perna apoiada e suba até ficar ereto.',
        'Evite impulsionar excessivamente com a perna que ficou no chão.',
        'Desça devagar e complete as repetições antes de trocar o lado.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_sissy_squat_assistido',
      name: 'Sissy squat assistido',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['abdomen_core'],
      compatibleEquipmentIds: ['std_general_elasticos_resistencia'],
      equipmentAlternatives: [['std_general_elasticos_resistencia']],
      shortDescription: 'Agachamento com joelhos avançando e tronco alinhado, enfatizando a extensão do joelho e o quadríceps.',
      initialPosition: 'Segure em apoio fixo, pés próximos e tronco alinhado da cabeça aos joelhos.',
      executionSteps: [
        'Mantenha o abdômen contraído e eleve os calcanhares se a técnica exigir.',
        'Flexione os joelhos levando-os à frente enquanto o corpo inclina como uma unidade.',
        'Desça apenas até a amplitude sem dor e sem perder o controle.',
        'Estenda os joelhos retornando lentamente.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_agachamento_caixa',
      name: 'Agachamento até a caixa',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_bancos_retos'],
      equipmentAlternatives: [['std_general_bancos_retos']],
      shortDescription: 'Variação com referência de profundidade que facilita padronizar a amplitude do agachamento.',
      initialPosition: 'Fique à frente de uma caixa ou banco firme, pés na largura dos ombros e braços à frente.',
      executionSteps: [
        'Leve o quadril para trás e flexione os joelhos.',
        'Desça até tocar levemente a caixa sem relaxar o tronco.',
        'Mantenha os pés apoiados e os joelhos alinhados.',
        'Empurre o chão e retorne à posição inicial.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_pistol_squat_assistido',
      name: 'Agachamento unilateral assistido (pistol squat)',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_elasticos_resistencia'],
      equipmentAlternatives: [['std_general_elasticos_resistencia']],
      shortDescription: 'Agachamento em uma perna com apoio das mãos para desenvolver força unilateral e estabilidade.',
      initialPosition: 'Segure em uma estrutura fixa, apoie o peso em uma perna e estenda a outra à frente.',
      executionSteps: [
        'Flexione o joelho de apoio levando o quadril para trás e para baixo.',
        'Mantenha o pé apoiado e o joelho alinhado com os dedos.',
        'Desça somente até onde mantenha equilíbrio e controle.',
        'Empurre o solo e retorne; depois troque a perna.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_cadeira_extensora_unilateral',
      name: 'Cadeira extensora unilateral',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ['std_legs_cadeira_extensora'],
      equipmentAlternatives: [['std_legs_cadeira_extensora']],
      shortDescription: 'Extensão unilateral do joelho para trabalhar cada quadríceps separadamente e observar diferenças de força.',
      initialPosition: 'Ajuste o eixo da máquina ao joelho e posicione o rolo acima do tornozelo da perna ativa.',
      executionSteps: [
        'Segure as alças e mantenha a pelve apoiada.',
        'Estenda o joelho da perna ativa sem chutar a carga.',
        'Pause brevemente no topo mantendo a contração.',
        'Retorne devagar e conclua o lado antes de alternar.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_leg_press_unilateral',
      name: 'Leg press 45° unilateral',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos'],
      compatibleEquipmentIds: ['std_legs_leg_press_45'],
      equipmentAlternatives: [['std_legs_leg_press_45']],
      shortDescription: 'Pressão unilateral na plataforma, permitindo ajustar a amplitude e a carga de cada perna.',
      initialPosition: 'Sente-se com quadril e lombar apoiados; coloque um pé no centro da plataforma e mantenha o outro fora do curso.',
      executionSteps: [
        'Destrave a plataforma com controle.',
        'Flexione o joelho até a amplitude que preserve a pelve apoiada.',
        'Empurre com o pé ativo sem travar o joelho.',
        'Trave a máquina antes de trocar a perna.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_avanco_reverso_halteres',
      name: 'Avanço reverso com halteres',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos'],
      compatibleEquipmentIds: ['std_general_halteres'],
      equipmentAlternatives: [['std_general_halteres']],
      shortDescription: 'Passo para trás com retorno à posição inicial, enfatizando quadríceps e controle unilateral.',
      initialPosition: 'Em pé, segure halteres ao lado do corpo e mantenha os pés na largura do quadril.',
      executionSteps: [
        'Dê um passo para trás apoiando a ponta do pé.',
        'Flexione os dois joelhos mantendo o tronco estável.',
        'Empurre o chão com o pé da frente para retornar.',
        'Alterne as pernas mantendo o joelho da frente alinhado.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_passada_smith',
      name: 'Passada no Smith',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos'],
      compatibleEquipmentIds: ['std_legs_smith_machine'],
      equipmentAlternatives: [['std_legs_smith_machine']],
      shortDescription: 'Passada com barra guiada para trabalhar quadríceps unilateralmente com trajetória estável.',
      initialPosition: 'Posicione a barra no trapézio, pés em posição de passada e travas de segurança ajustadas.',
      executionSteps: [
        'Destrave a barra e estabilize o tronco.',
        'Flexione os joelhos descendo verticalmente.',
        'Mantenha o joelho dianteiro alinhado ao pé e o calcanhar apoiado.',
        'Suba com controle e trave a barra antes de sair.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_agachamento_pendulo',
      name: 'Agachamento pendular na máquina',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos'],
      compatibleEquipmentIds: ['std_legs_hack_squat'],
      equipmentAlternatives: [['std_legs_hack_squat']],
      shortDescription: 'Agachamento em máquina pendular com apoio dorsal e trajetória guiada para quadríceps.',
      initialPosition: 'Ajuste os apoios, encoste costas e quadril no estofado e posicione os pés na plataforma.',
      executionSteps: [
        'Libere as travas conforme o modelo do aparelho.',
        'Flexione joelhos e quadris em velocidade controlada.',
        'Desça sem retirar a pelve do encosto.',
        'Empurre a plataforma sem hiperestender os joelhos e recoloque as travas.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_quadriceps_agachamento_halteres_lados',
      name: 'Agachamento com halteres ao lado do corpo',
      primaryMuscleGroup: 'quadriceps',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_halteres'],
      equipmentAlternatives: [['std_general_halteres']],
      shortDescription: 'Agachamento com carga independente nas mãos, permitindo ajuste simples da postura e amplitude.',
      initialPosition: 'Segure um halter em cada mão ao lado do corpo, pés na largura dos ombros e coluna neutra.',
      executionSteps: [
        'Inspire e firme o abdômen.',
        'Flexione quadris e joelhos mantendo os halteres ao lado das pernas.',
        'Desça até a amplitude estável sem elevar os calcanhares.',
        'Suba pressionando o chão e mantenha os joelhos alinhados.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna ou perder o alinhamento do joelho durante a fase de esforço.', 'Usar impulso e reduzir o controle da fase de retorno.', 'Aumentar a amplitude além da mobilidade individual.'],
      safetyTips: ['Ajuste a amplitude à mobilidade e interrompa se houver dor articular.', 'Use carga que permita manter joelhos alinhados e movimento controlado.'],
    },
  {
      id: 'ex_posterior_coxa_terra_romeno_barra',
      name: 'Levantamento terra romeno com barra',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_barras_retas', 'std_general_anilhas'],
      equipmentAlternatives: [['std_general_barras_retas'], ['std_general_anilhas']],
      shortDescription: 'Dobradiça de quadril com barra próxima às pernas, enfatizando os isquiotibiais em alongamento.',
      initialPosition: 'Em pé, segure a barra à frente das coxas, pés na largura do quadril e joelhos levemente flexionados.',
      executionSteps: [
        'Leve o quadril para trás mantendo a barra rente às pernas.',
        'Desça até sentir alongamento nos posteriores sem arredondar a coluna.',
        'Mantenha a barra próxima às canelas e os joelhos com semiflexão constante.',
        'Estenda o quadril contraindo glúteos e posteriores para retornar.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_terra_romeno_halteres',
      name: 'Levantamento terra romeno com halteres',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_halteres'],
      equipmentAlternatives: [['std_general_halteres']],
      shortDescription: 'Variação com halteres que permite trajetória natural e controle individual das mãos.',
      initialPosition: 'Segure halteres à frente das coxas, pés no quadril e ombros encaixados.',
      executionSteps: [
        'Projete o quadril para trás mantendo os halteres próximos às pernas.',
        'Desça até a amplitude em que a coluna permaneça neutra.',
        'Mantenha os joelhos levemente flexionados e o peso distribuído no pé.',
        'Retorne estendendo o quadril sem hiperestender a lombar.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_good_morning_barra',
      name: 'Good morning com barra',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_barras_retas', 'std_general_anilhas'],
      equipmentAlternatives: [['std_general_barras_retas'], ['std_general_anilhas']],
      shortDescription: 'Dobradiça de quadril com barra apoiada no trapézio, exigindo controle do tronco e posteriores.',
      initialPosition: 'Apoie a barra sobre o trapézio, pés na largura do quadril e joelhos destravados.',
      executionSteps: [
        'Inspire e firme o abdômen antes de inclinar.',
        'Leve o quadril para trás inclinando o tronco como uma unidade.',
        'Pare quando sentir alongamento nos posteriores sem perder a coluna neutra.',
        'Estenda o quadril e retorne à posição ereta.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_nordic_curl_assistido',
      name: 'Nordic curl assistido',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['panturrilhas'],
      compatibleEquipmentIds: ['std_legs_mesa_flexora'],
      equipmentAlternatives: [['std_legs_mesa_flexora']],
      shortDescription: 'Flexão excêntrica de joelho com o tronco descendo em bloco, focada nos isquiotibiais.',
      initialPosition: 'Ajoelhe-se em colchonete com tornozelos firmemente presos por apoio acolchoado.',
      executionSteps: [
        'Mantenha quadril estendido e tronco alinhado com as coxas.',
        'Incline o corpo à frente lentamente resistindo à queda com os posteriores.',
        'Use as mãos para amortecer o contato com o solo.',
        'Empurre levemente com as mãos para retornar e ajuste a assistência.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_glute_ham_raise',
      name: 'Glute-ham raise na máquina',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'panturrilhas'],
      compatibleEquipmentIds: ['std_legs_mesa_flexora'],
      equipmentAlternatives: [['std_legs_mesa_flexora']],
      shortDescription: 'Flexão de joelho combinada à extensão do quadril em equipamento específico para cadeia posterior.',
      initialPosition: 'Ajuste os apoios da máquina para joelhos e tornozelos ficarem firmes, tronco alinhado.',
      executionSteps: [
        'Inicie com o corpo alinhado e abdômen ativo.',
        'Flexione os joelhos controlando a descida do tronco.',
        'Mantenha o quadril estendido sem dobrar excessivamente a cintura.',
        'Retorne à posição inicial sem impulso.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_flexora_em_pe_unilateral',
      name: 'Flexora em pé unilateral na máquina',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['panturrilhas'],
      compatibleEquipmentIds: ['std_legs_cadeira_flexora'],
      equipmentAlternatives: [['std_legs_cadeira_flexora']],
      shortDescription: 'Flexão unilateral do joelho em pé, isolando os posteriores de cada perna.',
      initialPosition: 'Fique em pé na máquina, alinhe o joelho ao eixo e ajuste o rolo atrás do tornozelo.',
      executionSteps: [
        'Segure os apoios e mantenha o tronco estável.',
        'Flexione o joelho levando o calcanhar em direção ao glúteo.',
        'Pause sem arquear a lombar.',
        'Estenda lentamente e troque o lado após concluir as repetições.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_flexora_bola_suica',
      name: 'Flexão de joelhos na bola suíça',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_colchonetes'],
      equipmentAlternatives: [['std_general_colchonetes']],
      shortDescription: 'Flexão de joelhos com os calcanhares sobre a bola, exigindo estabilidade do quadril e tronco.',
      initialPosition: 'Deite-se de costas, braços no solo, calcanhares sobre a bola e quadril elevado.',
      executionSteps: [
        'Mantenha o quadril alinhado e contraia glúteos.',
        'Puxe a bola em direção ao quadril flexionando os joelhos.',
        'Evite deixar a pelve cair ou girar.',
        'Estenda os joelhos lentamente mantendo o quadril elevado.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_pull_through_polia',
      name: 'Pull-through na polia baixa',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_polias_ajustaveis'],
      equipmentAlternatives: [['std_general_polias_ajustaveis']],
      shortDescription: 'Dobradiça de quadril com cabo passando entre as pernas, enfatizando extensão do quadril.',
      initialPosition: 'Fique de costas para a polia baixa, segure a corda entre as pernas e afaste-se até tensionar o cabo.',
      executionSteps: [
        'Flexione levemente os joelhos e leve o quadril para trás.',
        'Incline o tronco mantendo a coluna neutra e a corda entre as pernas.',
        'Estenda o quadril contraindo glúteos e posteriores.',
        'Retorne controlando a tração sem arredondar as costas.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_extensao_quadril_banco_45',
      name: 'Extensão de quadril no banco 45°',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'costas'],
      compatibleEquipmentIds: ['std_general_bancos_regulaveis'],
      equipmentAlternatives: [['std_general_bancos_regulaveis']],
      shortDescription: 'Extensão de tronco no banco romano com movimento iniciado no quadril, recrutando posteriores e glúteos.',
      initialPosition: 'Ajuste o apoio para ficar abaixo da linha do quadril e prenda os pés nos suportes.',
      executionSteps: [
        'Cruze os braços e mantenha a coluna neutra.',
        'Flexione o quadril inclinando o tronco sem arredondar as costas.',
        'Eleve o tronco até alinhar quadril e ombros, sem hiperestender.',
        'Desça lentamente mantendo o controle.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_flexora_polia_unilateral',
      name: 'Flexão de joelho unilateral na polia baixa',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['panturrilhas'],
      compatibleEquipmentIds: ['std_general_polias_ajustaveis', 'std_general_polias_ajustaveis'],
      equipmentAlternatives: [['std_general_polias_ajustaveis'], ['std_general_polias_ajustaveis']],
      shortDescription: 'Flexão de joelho com tornozeleira na polia, permitindo resistência unilateral ajustável.',
      initialPosition: 'Prenda tornozeleira à polia baixa, fique de frente para a máquina e segure o apoio.',
      executionSteps: [
        'Mantenha a coxa alinhada e o tronco estável.',
        'Flexione o joelho levando o calcanhar para trás.',
        'Evite mover o quadril ou arquear a lombar.',
        'Retorne devagar e alterne a perna.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_terra_kettlebell',
      name: 'Levantamento terra com kettlebell',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'quadriceps', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_kettlebells'],
      equipmentAlternatives: [['std_general_kettlebells']],
      shortDescription: 'Levantamento do kettlebell a partir do solo, integrando quadril e joelhos com carga próxima ao corpo.',
      initialPosition: 'Posicione o kettlebell entre os pés, pés na largura do quadril e coluna neutra.',
      executionSteps: [
        'Flexione quadris e joelhos para alcançar a alça.',
        'Segure firme e mantenha os ombros sobre a carga.',
        'Empurre o chão e estenda quadris e joelhos juntos.',
        'Retorne o kettlebell ao solo com a mesma dobradiça controlada.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_flexora_deslizante_solo',
      name: 'Flexão de joelhos deslizante no solo',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_colchonetes'],
      equipmentAlternatives: [['std_general_colchonetes']],
      shortDescription: 'Flexão de joelhos com discos deslizantes sob os calcanhares, usando o peso corporal.',
      initialPosition: 'Deite-se de costas com calcanhares sobre discos deslizantes, braços no solo e quadril elevado.',
      executionSteps: [
        'Eleve o quadril mantendo uma linha entre ombros e joelhos.',
        'Deslize os calcanhares para longe estendendo os joelhos.',
        'Puxe os calcanhares de volta sem deixar o quadril cair.',
        'Reduza a amplitude se perder o alinhamento pélvico.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_posterior_coxa_terra_romeno_deficit',
      name: 'Terra romeno com amplitude controlada em déficit',
      primaryMuscleGroup: 'posterior_coxa',
      secondaryMuscleGroups: ['gluteos', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_halteres', 'std_general_bancos_retos'],
      equipmentAlternatives: [['std_general_halteres'], ['std_general_bancos_retos']],
      shortDescription: 'Variação com apoio elevado baixo para ampliar a amplitude somente quando houver mobilidade e controle suficientes.',
      initialPosition: 'Suba em plataforma baixa estável, segure halteres e mantenha os pés firmes.',
      executionSteps: [
        'Leve o quadril para trás mantendo os halteres junto às pernas.',
        'Desça apenas até o limite de mobilidade dos posteriores sem arredondar a coluna.',
        'Mantenha joelhos destravados e abdômen ativo.',
        'Retorne estendendo o quadril; não use altura que comprometa a postura.'
      ],
      breathingGuide: 'Inspire na fase de retorno ou descida controlada e expire durante a fase de esforço.',
      commonMistakes: ['Arredondar a coluna para ganhar amplitude.', 'Transformar a dobradiça de quadril em agachamento excessivo.', 'Usar impulso ou soltar a fase excêntrica.'],
      safetyTips: ['Mantenha a coluna neutra e reduza a amplitude se perder a posição.', 'Comece com carga leve até dominar o padrão de dobradiça/flexão.'],
    },
  {
      id: 'ex_gluteos_elevacao_pelvica_maquina',
      name: 'Elevação pélvica (Glute drive / barra)',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ['posterior_coxa', 'abdomen_core'],
      compatibleEquipmentIds: [
        'std_legs_glute_drive',
        'std_general_barras_retas',
        'std_general_bancos_retos',
        'std_general_anilhas',
      ],
      equipmentAlternatives: [
        ['std_legs_glute_drive'],
        ['std_general_barras_retas', 'std_general_bancos_retos', 'std_general_anilhas'],
      ],
      shortDescription:
        'Extensão horizontal de quadril (Hip Thrust) focada na ativação máxima do glúteo máximo no pico de contração.',
      initialPosition:
        'Apoie a região inferior das escápulas no encosto do Glute drive ou banco reto, posicione o cinto acolchoado (ou barra com protetor de espuma) sobre a linha do quadril e apoie os pés de forma que, no topo do movimento, as canelas fiquem verticais (90° nos joelhos).',
      executionSteps: [
        'Mantenha o queixo levemente recolhido (olhar à frente) e as costelas alinhadas à pelve.',
        'Empurre o chão pelos calcanhares estendendo o quadril até que coxas e tronco formem uma linha horizontal.',
        'Contraia fortemente os glúteos no topo por 1 a 2 segundos sem arquear a coluna lombar.',
        'Desça o quadril de maneira controlada mantendo a estabilidade torácica.',
      ],
      breathingGuide:
        'Expire ao elevar o quadril até o topo e inspire durante a descida controlada.',
      commonMistakes: [
        'Hiperestender a coluna lombar e jogar a cabeça para trás no topo em vez de estender o quadril.',
        'Posicionar os pés muito perto ou muito longe, tirando as tíbias da vertical no ponto alto.',
        'Subir na ponta dos pés transferindo a força para as coxas.',
      ],
      safetyTips: [
        'Se realizar com barra livre, utilize sempre uma almofada protetora espessa (pad) sobre a pelve.',
        'No Glute drive, trave a alavanca lateral de segurança antes de retirar o cinto.',
      ],
      illustrationId: 'svg_exercise_elevacao_pelvica',
      externalVideoUrl: 'https://exrx.net/WeightExercises/GluteusMaximus/BBHipThrust',
      externalVideoSource: 'ExRx.net — Hip Thrust',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_cadeira_abdutora',
      name: 'Abdução de quadril na cadeira abdutora',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ['std_legs_cadeira_abdutora'],
      equipmentAlternatives: [['std_legs_cadeira_abdutora']],
      shortDescription:
        'Exercício uniarticular guiado para fortalecimento do glúteo médio, glúteo mínimo e fibras superiores do glúteo máximo.',
      initialPosition:
        'Sente-se na cadeira abdutora com a coluna e a pelve apoiadas, posicione a face externa dos joelhos/coxas contra os apoios laterais e regule a trava inicial na posição fechada.',
      executionSteps: [
        'Segure nas alças laterais do assento mantendo o tronco estável.',
        'Afaste as pernas para fora empurrando os apoios acolchoados com a lateral dos joelhos.',
        'Sustente por um instante na abertura máxima sem girar os pés.',
        'Retorne as pernas de forma controlada sem permitir que as placas de peso batam.',
      ],
      breathingGuide:
        'Expire ao abrir as pernas contra a resistência e inspire ao fechar de maneira controlada.',
      commonMistakes: [
        'Realizar repetições rápidas e curtas usando o rebote elástico dos cabos.',
        'Tirar o quadril do assento para tentar empurrar mais carga.',
        'Ficar sem apoio das mãos ou da coluna, gerando instabilidade.',
      ],
      safetyTips: [
        'Use a alavanca de regulagem de abertura para entrar e sair confortavelmente do aparelho.',
        'Priorize o controle na fase de fechamento (excêntrica).',
      ],
      illustrationId: 'svg_exercise_cadeira_abdutora',
      externalVideoUrl: 'https://exrx.net/WeightExercises/HipAbductor/LVSeatedHipAbduction',
      externalVideoSource: 'ExRx.net — Lever Seated Hip Abduction',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_extensao_quadril_maquina',
      name: 'Extensão de quadril na máquina de glúteo',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ['posterior_coxa'],
      compatibleEquipmentIds: ['std_legs_maquina_gluteo'],
      equipmentAlternatives: [['std_legs_maquina_gluteo']],
      shortDescription:
        'Extensão unilateral de quadril em máquina dedicada (coice guiado), permitindo foco individualizado em cada glúteo.',
      initialPosition:
        'Posicione-se na máquina de glúteo apoiando o tronco ou antebraços nos suportes frontais, mantenha a perna de base firme com o joelho levemente destravado e apoie a planta do pé de trabalho (ou posterior da coxa, conforme o aparelho) no pedal/rolo.',
      executionSteps: [
        'Mantenha o abdômen contraído para que a pelve não gire nem a lombar arqueie.',
        'Empurre o pedal ou alavanca para trás e para baixo usando a força do calcanhar até estender o quadril.',
        'Contraia o glúteo no ponto final da extensão sem compensar com a coluna.',
        'Retorne a perna lentamente até a linha inicial e complete todas as repetições antes de trocar o lado.',
      ],
      breathingGuide:
        'Expire ao empurrar a alavanca para trás e inspire ao retornar a perna.',
      commonMistakes: [
        'Arquear a coluna lombar tentando chutar a alavanca além da extensão fisiológica do quadril (15° a 20°).',
        'Girar o quadril lateralmente durante o movimento.',
        'Travar o joelho da perna de apoio.',
      ],
      safetyTips: [
        'Realize o mesmo número de repetições e a mesma carga em ambos os lados, iniciando pelo lado com menor força.',
        'Mantenha a coluna alinhada durante toda a execução.',
      ],
    },
  {
      id: 'ex_panturrilhas_em_pe_maquina',
      name: 'Elevação de panturrilhas em pé na máquina',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: [
        'std_legs_panturrilha_em_pe',
        'std_legs_smith_machine',
      ],
      equipmentAlternatives: [
        ['std_legs_panturrilha_em_pe'],
        ['std_legs_smith_machine'],
      ],
      shortDescription:
        'Flexão plantar com os joelhos estendidos, enfatizando fortemente o músculo gastrocnêmio (porções medial e lateral da panturrilha).',
      initialPosition:
        'Posicione o antepé (metatarsos) na borda da plataforma inferior deixando os calcanhares livres. Encaixe os ombros sob as ombreiras acolchoadas e suba estendendo os joelhos (mantendo-os destravados) e a coluna alinhada.',
      executionSteps: [
        'Desça os calcanhares de forma controlada abaixo do nível da plataforma até sentir um alongamento completo da panturrilha.',
        'Pause por 1 segundo no ponto mais baixo para eliminar o reflexo elástico do tendão calcâneo.',
        'Eleve o corpo na ponta dos pés até a contração máxima da panturrilha.',
        'Sustente por 1 segundo no topo antes de iniciar a próxima descida controlada.',
      ],
      breathingGuide:
        'Inspire ao descer os calcanhares alongando e expire ao subir na ponta dos pés.',
      commonMistakes: [
        'Realizar repetições curtas e rápidas (quicar no tendão de Aquiles) sem alongar nem contrair.',
        'Flexionar e estender os joelhos para roubar com o quadríceps.',
        'Dobrar o quadril para trás tirando o alinhamento vertical da coluna.',
      ],
      safetyTips: [
        'Mantenha pelo menos um terço anterior do pé firmemente apoiado no degrau antiderrapante para não escorregar.',
        'Ao finalizar, flexione os joelhos para devolver as ombreiras ao suporte antes de descer da plataforma.',
      ],
      illustrationId: 'svg_exercise_panturrilha_em_pe',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Gastrocnemius/LVStandingCalfRaise',
      externalVideoSource: 'ExRx.net — Lever Standing Calf Raise',
      externalVideoVerified: false,
    },
  {
      id: 'ex_panturrilhas_sentado_maquina',
      name: 'Elevação de panturrilhas sentado (Gêmeos sentado)',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ['std_legs_panturrilha_sentada'],
      equipmentAlternatives: [['std_legs_panturrilha_sentada']],
      shortDescription:
        'Flexão plantar com os joelhos flexionados a 90°, direcionando o foco principal para o músculo sóleo.',
      initialPosition:
        'Sente-se no aparelho de panturrilha sentada, posicione a parte anterior dos pés no degrau frontal e ajuste a almofada superior firmemente sobre a parte distal das coxas (logo acima dos joelhos).',
      executionSteps: [
        'Eleve os calcanhares para liberar a haste de trava de segurança e afaste-a para o lado.',
        'Desça os calcanhares de maneira controlada até obter o alongamento completo na parte inferior.',
        'Empurre pela ponta dos pés elevando os joelhos até a contração máxima da panturrilha.',
        'Ao concluir a série, recoloque a haste de trava antes de descer os calcanhares.',
      ],
      breathingGuide:
        'Inspire durante a descida dos calcanhares e expire ao elevar a carga.',
      commonMistakes: [
        'Posicionar a almofada muito atrás na coxa, reduzindo a alavanca sobre o tornozelo.',
        'Executar o movimento em velocidade excessiva sem pausa nos extremos.',
        'Balançar o tronco para trás a cada repetição.',
      ],
      safetyTips: [
        'Certifique-se de que a haste de trava esteja devidamente encaixada antes de retirar os pés do degrau.',
        'Trabalhe toda a amplitude articular do tornozelo.',
      ],
      illustrationId: 'svg_exercise_panturrilha_sentada',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Soleus/LVSeatedCalfRaise',
      externalVideoSource: 'ExRx.net — Lever Seated Calf Raise',
      externalVideoVerified: false,
    },
  {
      id: 'ex_panturrilhas_leg_press',
      name: 'Elevação de panturrilhas no leg press',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ['std_legs_leg_press_45'],
      equipmentAlternatives: [['std_legs_leg_press_45']],
      shortDescription:
        'Flexão plantar bilateral no carro do leg press 45°, trabalhando o gastrocnêmio em cadeia fechada com suporte completo para a coluna lombar.',
      initialPosition:
        'Sente-se no leg press 45° com a coluna e a pelve apoiadas no encosto. Posicione o terço anterior dos pés (metatarsos) na borda inferior da plataforma na largura do quadril, empurre o carro mantendo os joelhos estendidos mas sempre com leve destravamento articular e acione as travas de segurança na posição mais segura.',
      executionSteps: [
        'Segure nas alças laterais do assento mantendo os joelhos fixos em leve semiflexão de segurança durante toda a série.',
        'Deixe a plataforma recuar lentamente flexionando apenas os tornozelos (dorsiflexão) até sentir um alongamento firme nas panturrilhas.',
        'Empurre a plataforma com a região anterior dos pés realizando a flexão plantar máxima de maneira controlada.',
        'Sustente a contração no topo por 1 segundo e, somente após concluir a última repetição, apoie os pés inteiros na plataforma e trave o carro.',
      ],
      breathingGuide:
        'Inspire enquanto os tornozelos alongam na descida controlada e expire ao empurrar a plataforma com as pontas dos pés.',
      commonMistakes: [
        'Hiperestender e travar rigidamente os joelhos sob carga elevada, expondo a articulação a risco grave.',
        'Apoiar apenas a ponta extrema dos dedos na borda da plataforma, aumentando o risco de o pé escapar.',
        'Realizar movimentos curtos e rápidos com rebote elástico sem controlar a fase excêntrica.',
      ],
      safetyTips: [
        'Mantenha as travas laterais do leg press prontas para acionamento imediato e utilize solado antiderrapante seco.',
        'Nunca tente reposicionar os pés na plataforma com a carga solta; trave o carro primeiro.',
      ],
    },
  {
      id: 'ex_panturrilhas_unilateral_em_pe_maquina',
      name: 'Elevação unilateral de panturrilhas em pé na máquina',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ['std_legs_panturrilha_em_pe'],
      equipmentAlternatives: [['std_legs_panturrilha_em_pe']],
      shortDescription:
        'Flexão plantar unilateral em pé na máquina para fortalecimento específico do tríceps sural e tendão calcâneo, essencial para absorção de impacto e propulsão na corrida de rua.',
      initialPosition:
        'Encaixe os ombros sob os apoios acolchoados da máquina de panturrilha em pé e apoie o antepé de apenas uma perna no degrau inferior, mantendo o calcanhar livre e a outra perna suspensa ao lado ou cruzada levemente atrás do tornozelo de apoio.',
      executionSteps: [
        'Estenda o corpo mantendo a coluna neutra, o quadril alinhado e o joelho da perna de base estendido sem hiperextensão.',
        'Desça o calcanhar da perna ativa de forma lenta abaixo do nível do degrau até o alongamento completo da panturrilha.',
        'Suba na ponta do pé empurrando o degrau verticalmente até atingir o pico de contração do gastrocnêmio.',
        'Segure por 1 segundo no topo, controle a descida e finalize todas as repetições antes de apoiar os dois pés para trocar o lado.',
      ],
      breathingGuide:
        'Inspire durante a descida unilateral do calcanhar e expire ao impulsionar o corpo para cima na ponta do pé.',
      commonMistakes: [
        'Selecionar a mesma carga da execução bilateral, forçando compensações de joelho e quadril.',
        'Inclinar ou girar o quadril para o lado da perna de apoio, desalinhando a carga sobre o tornozelo.',
        'Quicar no ponto inferior usando o reflexo elástico sem pausa nem controle excêntrico.',
      ],
      safetyTips: [
        'Reduza substancialmente a carga em relação ao exercício bilateral para garantir amplitude completa com segurança no tendão calcâneo.',
        'Apoie os dois pés firmemente na plataforma antes de flexionar os joelhos para devolver as ombreiras ao suporte.',
      ],
    },
  {
      id: 'ex_panturrilhas_em_pe_degrau_halteres',
      name: 'Panturrilha em pé no degrau com halteres',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: [
        'std_general_halteres',
        'std_legs_panturrilha_em_pe',
      ],
      equipmentAlternatives: [
        ['std_general_halteres'],
        ['std_legs_panturrilha_em_pe'],
      ],
      shortDescription:
        'Elevação de calcanhares em degrau ou bloco com pesos livres, proporcionando máxima amplitude de alongamento e contração do gastrocnêmio.',
      initialPosition:
        'Pise com a metade anterior dos pés sobre o degrau ou step, deixando os calcanhares livres. Segure um halter em cada mão com os braços estendidos ao lado do corpo e mantenha a postura ereta.',
      executionSteps: [
        'Baixe os calcanhares o máximo possível abaixo da linha do degrau, sentindo o alongamento da panturrilha.',
        'Empurre o solo subindo na ponta dos pés o mais alto que puder.',
        'Sustente a contração máxima por um segundo no topo.',
        'Retorne desatando os calcanhares de forma cadenciada.',
      ],
      breathingGuide:
        'Expire ao subir na ponta dos pés e inspire ao descer os calcanhares.',
      commonMistakes: [
        'Realizar repetições curtas sem aproveitar a amplitude total do degrau.',
        'Flexionar os joelhos durante a subida usando o quadríceps.',
        'Balançar os braços e halteres para dar impulso.',
      ],
      safetyTips: [
        'Se necessário, faça a versão unilateral segurando o suporte com uma das mãos para estabilidade.',
        'Mantenha o tornozelo alinhado verticalmente sem deixar o pé virar para dentro ou para fora.',
      ],
    },
  {
      id: 'ex_abdomen_prancha_isometrica',
      name: 'Prancha abdominal isométrica',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ['ombros', 'gluteos'],
      compatibleEquipmentIds: ['std_general_colchonetes'],
      equipmentAlternatives: [['std_general_colchonetes']],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription:
        'Exercício isométrico fundamental de estabilização do core (transverso do abdômen, reto abdominal, oblíquos e paravertebrais).',
      initialPosition:
        'Deite-se de bruços sobre um colchonete, apoie os antebraços no chão com os cotovelos alinhados exatamente abaixo dos ombros e apoie as pontas dos pés no solo na largura do quadril.',
      executionSteps: [
        'Eleve o quadril do colchonete formando uma linha reta contínua da cabeça aos calcanhares.',
        'Contraia ativamente o abdômen (como se preparasse o tronco para um impacto) e contraia os glúteos.',
        'Empurre o chão com os antebraços mantendo as escápulas estáveis e o olhar voltado para o chão entre as mãos.',
        'Sustente a posição pelo tempo prescrito pelo seu instrutor mantendo a respiração fluida.',
      ],
      breathingGuide:
        'Respire de forma curta e contínua (costodiafragmática) sem prender o ar e sem relaxar a parede abdominal.',
      commonMistakes: [
        'Deixar o quadril cair em direção ao solo, hiperestendendo e sobrecarregando a coluna lombar.',
        'Elevar excessivamente o quadril formando uma pirâmide.',
        'Prender totalmente a respiração (apneia prolongada).',
      ],
      safetyTips: [
        'Se sentir fadiga na lombar e perder o alinhamento pélvico, encerre a série imediatamente; qualidade postural vale mais que segundos extras.',
        'Utilize sempre um colchonete para proteger a pele e a bursa dos cotovelos.',
      ],
      illustrationId: 'svg_exercise_prancha_isometrica',
      externalVideoUrl: 'https://exrx.net/WeightExercises/RectusAbdominis/BWFrontPlank',
      externalVideoSource: 'ExRx.net — Front Plank',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_supra_solo',
      name: 'Abdominal supra no solo',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ['std_general_colchonetes'],
      equipmentAlternatives: [['std_general_colchonetes']],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription:
        'Flexão controlada da coluna torácica no solo para fortalecimento direto do músculo reto abdominal.',
      initialPosition:
        'Deite-se de barriga para cima sobre um colchonete, flexione os joelhos apoiando a planta dos pés no chão e posicione as mãos levemente ao lado das têmporas ou cruzadas sobre o peito.',
      executionSteps: [
        'Pressione a região lombar contra o colchonete ativando o abdômen antes de subir.',
        'Enrole a parte superior do tronco retirando a cabeça e as escápulas do chão, aproximando as costelas da pelve.',
        'Mantenha o espaço de um punho entre o queixo e o peito, sem puxar a nuca com as mãos.',
        'Retorne lentamente desenrolando a coluna até um pouco antes de relaxar totalmente os ombros no solo.',
      ],
      breathingGuide:
        'Expire completamente pela boca ao subir o tronco e inspire ao descer.',
      commonMistakes: [
        'Entrelaçar os dedos atrás da cabeça e puxar o pescoço com força.',
        'Subir o tronco inteiro até sentar com os pés presos, acionando predominantemente os flexores do quadril (iliopsoas).',
        'Desabar de costas no colchonete sem controle excêntrico.',
      ],
      safetyTips: [
        'O movimento do abdominal supra ocorre na coluna torácica (retirar as escápulas do solo); a lombar permanece apoiada.',
        'Evite prender os pés debaixo de suportes.',
      ],
      illustrationId: 'svg_exercise_abdominal_supra',
      externalVideoUrl: 'https://exrx.net/WeightExercises/RectusAbdominis/BWCrunch',
      externalVideoSource: 'ExRx.net — Crunch',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_infra_barra_fixa',
      name: 'Elevação de pernas na barra fixa',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ['costas'],
      compatibleEquipmentIds: ['std_back_barra_fixa'],
      equipmentAlternatives: [['std_back_barra_fixa']],
      isBodyweight: true,
      canExecuteWithoutEquipment: false,
      shortDescription:
        'Exercício avançado em suspensão na barra fixa com flexão de quadril e retroversão pélvica para fortalecimento abdominal.',
      initialPosition:
        'Segure na barra fixa com pegada pronada na largura dos ombros, mantenha os ombros ativos (deprimidos) e o corpo suspenso sem balanço.',
      executionSteps: [
        'Estabilize o tronco e inicie o movimento flexionando os joelhos ou as pernas à frente.',
        'No final da subida, realize uma leve retroversão pélvica (enrolando o quadril para cima) para ativar efetivamente o reto abdominal.',
        'Segure por um instante no topo do movimento.',
        'Desça as pernas de forma lenta e controlada evitando que o corpo balance como um pêndulo.',
      ],
      breathingGuide:
        'Expire ao elevar os joelhos/pernas e inspire durante a descida controlada.',
      commonMistakes: [
        'Balançar o corpo na barra usando o impulso pendular para subir as pernas.',
        'Subir os joelhos apenas até 45° sem movimentar a pelve, trabalhando apenas os flexores de quadril.',
        'Relaxar completamente os ombros ficando pendurado nas estruturas articulares.',
      ],
      safetyTips: [
        'Inicie com os joelhos flexionados (elevação de joelhos) e progrida para pernas estendidas conforme orientação do instrutor.',
        'Ao finalizar, aguarde os pés pararem de oscilar antes de tocar o solo.',
      ],
    },
  {
      id: 'ex_abdomen_infra_paralelas',
      name: 'Elevação de pernas nas paralelas (Captain Chair)',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ['quadriceps'],
      compatibleEquipmentIds: [
        'std_back_barra_fixa',
      ],
      equipmentAlternatives: [
        ['std_back_barra_fixa'],
      ],
      shortDescription:
        'Exercício em estação paralela com apoio de antebraços para fortalecimento focado na porção infra do reto abdominal e flexores do quadril.',
      initialPosition:
        'Apoie os antebraços nos acolchoados da estação paralela e segure as manoplas. Mantenha as costas firmemente encostadas no suporte e as pernas estendidas suspensas.',
      executionSteps: [
        'Eleve as pernas flexionando ligeiramente os joelhos até que as coxas fiquem no mínimo paralelas ao solo ou próximas do tórax.',
        'Enrole sutilmente o quadril para cima no topo para recrutar totalmente a musculatura abdominal.',
        'Pause brevemente no ponto mais alto e desça as pernas devagar até a posição vertical sem balançar o corpo.',
      ],
      breathingGuide:
        'Expire ao elevar as pernas em direção ao peito e inspire ao retornar à Posição Inicial.',
      commonMistakes: [
        'Balançar o tronco ou utilizar o impulso das pernas (gangorra).',
        'Desencostar a lombar do acolchoados durante a subida.',
        'Descer as pernas despencando sem controle.',
      ],
      safetyTips: [
        'Mantenha os ombros abaixados sem afundar o pescoço na estrutura.',
        'Se sentir desconforto na lombar, execute com os joelhos mais flexionados.',
      ],
    },
  {
      id: 'ex_abdomen_remador_solo',
      name: 'Abdominal remador no solo',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ['quadriceps'],
      compatibleEquipmentIds: [
        'std_general_colchonetes',
      ],
      equipmentAlternatives: [
        ['std_general_colchonetes'],
      ],
      shortDescription:
        'Exercício dinâmico e completo que combina a flexão simultânea do tronco e dos joelhos no solo, recrutando todo o reto abdominal.',
      initialPosition:
        'Deite-se de costas no colchonete com os braços e pernas totalmente estendidos ao longo do corpo.',
      executionSteps: [
        'Flexione o tronco e os joelhos simultaneamente trazendo o tórax e os joelhos em direção ao centro do corpo.',
        'Abraçe os joelhos ou aproxime os braços dos tornozelos no ponto de contração máxima.',
        'Retorne de forma controlada estendendo o tronco e as pernas de volta ao solo sem desabar.',
      ],
      breathingGuide:
        'Expire ao sentar e abraçar os joelhos e inspire ao deitar novamente estendendo o corpo.',
      commonMistakes: [
        'Puxar o pescoço com as mãos provocando tensão cervical.',
        'Bater as costas com força no solo no retorno.',
        'Uso de impulso descontrolado dos braços.',
      ],
      safetyTips: [
        'Execute sobre um colchonete para proteger a coluna vertebral.',
        'Mantenha a musculatura do core ativada durante todo o percurso.',
      ],
    },
  {
      id: 'ex_corpo_inteiro_kettlebell_swing',
      name: 'Kettlebell swing',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ['gluteos', 'posterior_coxa', 'abdomen_core', 'ombros'],
      compatibleEquipmentIds: ['std_general_kettlebells'],
      equipmentAlternatives: [['std_general_kettlebells']],
      shortDescription:
        'Exercício dinâmico integrado de cadeia posterior e potência de extensão de quadril utilizando kettlebell.',
      initialPosition:
        'Posicione o kettlebell no chão cerca de 30 cm à frente dos pés (afastados um pouco além da largura dos ombros). Projete o quadril para trás com a coluna neutra e segure a alça do kettlebell com ambas as mãos.',
      executionSteps: [
        'Puxe o kettlebell para trás entre as pernas (como um passe de futebol americano) mantendo os antebraços próximos à virilha e a coluna reta.',
        'Estenda de forma potente os quadris e joelhos contraindo glúteos e abdômen no topo (posição de prancha em pé).',
        'Deixe o impulso do quadril projetar o kettlebell à frente até a altura do peito/ombros, com os braços funcionando apenas como cordas.',
        'Acompanhe a descida do peso e projete o quadril para trás apenas quando os antebraços tocarem novamente a linha do quadril.',
      ],
      breathingGuide:
        'Inspire na fase de recuo do quadril e expire de forma vigorosa na extensão completa do quadril.',
      commonMistakes: [
        'Agachar subindo e descendo os joelhos em vez de realizar a dobradiça de quadril (hip hinge).',
        'Levantar o kettlebell fazendo força de elevação frontal com os ombros.',
        'Inclinar o tronco para trás no topo hiperestendendo a lombar.',
      ],
      safetyTips: [
        'Certifique-se de que as mãos e a alça do kettlebell estejam secas antes de iniciar.',
        'Para encerrar a série, desacelere o peso entre as pernas e apoie-o de volta no chão à frente com a coluna neutra.',
      ],
      illustrationId: 'svg_exercise_kettlebell_swing',
      externalVideoUrl: 'https://exrx.net/WeightExercises/Kettlebell/KBTwoArmSwing',
      externalVideoSource: 'ExRx.net — Kettlebell Two-Arm Swing',
      externalVideoVerified: false,
    },
  {
      id: 'ex_corpo_inteiro_agachamento_desenvolvimento_halteres',
      name: 'Thruster com halteres (Agachamento + Desenvolvimento)',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ['quadriceps', 'gluteos', 'ombros', 'triceps', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_halteres'],
      equipmentAlternatives: [['std_general_halteres']],
      shortDescription:
        'Movimento combinado multiarticular que une o agachamento frontal com halteres ao desenvolvimento vertical de ombros em uma ação contínua.',
      initialPosition:
        'Em pé, com os pés na largura dos ombros, segure um par de halteres apoiados na linha anterior dos ombros (pegada neutra), com os cotovelos apontados para a frente e o core ativado.',
      executionSteps: [
        'Realize um agachamento controlado mantendo o tronco ereto e os cotovelos elevados.',
        'Suba estendendo quadris e joelhos de forma fluida e aproveite a velocidade final da subida para impulsionar os halteres acima da cabeça.',
        'Estenda completamente os braços no topo mantendo o abdômen e os glúteos firmes.',
        'Retorne os halteres de forma controlada aos ombros antes de iniciar o próximo agachamento.',
      ],
      breathingGuide:
        'Inspire na descida do agachamento e expire ao finalizar o empurrão dos halteres acima da cabeça.',
      commonMistakes: [
        'Começar a empurrar os halteres com os braços enquanto ainda está no fundo do agachamento.',
        'Deixar os cotovelos caírem na descida, curvando a coluna torácica.',
        'Desalinhar os joelhos para dentro ao subir.',
      ],
      safetyTips: [
        'Utilize uma carga compatível com a sua força de desenvolvimento de ombros, não apenas de agachamento.',
        'Mantenha os calcanhares firmes no solo durante toda a fase de agachamento.',
      ],
    },
  {
      id: 'ex_corpo_inteiro_flexao_bracos_solo',
      name: 'Flexão de braços tradicional no solo',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ['peito', 'ombros', 'triceps', 'abdomen_core'],
      compatibleEquipmentIds: ['std_general_colchonetes'],
      equipmentAlternatives: [['std_general_colchonetes']],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription:
        'Exercício calistênico clássico que integra empurrão horizontal (peitoral, deltoide anterior e tríceps) com estabilização isométrica de todo o core.',
      initialPosition:
        'Apoie as mãos no chão ligeiramente mais afastadas que a largura dos ombros, estenda as pernas atrás apoiando as pontas dos pés e alinhe cabeça, tronco, quadril e calcanhares em prancha.',
      executionSteps: [
        'Mantenha o abdômen e os glúteos contraídos para que o quadril não ceda.',
        'Flexione os cotovelos (em ângulo aproximado de 45° em relação ao tronco) descendo o corpo em bloco único até o peito chegar próximo ao solo.',
        'Empurre o chão estendendo os cotovelos e retornando o corpo em prancha até a posição inicial.',
        'Caso necessário, apoie os joelhos em um colchonete mantendo a linha reta entre joelhos, quadril e ombros.',
      ],
      breathingGuide:
        'Inspire ao descer o corpo em direção ao solo e expire ao empurrar de volta.',
      commonMistakes: [
        'Abrir os cotovelos a 90° em formato de "T", sobrecarregando os ombros.',
        'Deixar a lombar afundar ou subir apenas os ombros deixando o quadril no chão.',
        'Projetar o pescoço para baixo para tocar a testa no chão antes do peito.',
      ],
      safetyTips: [
        'Posicione os dedos das mãos levemente abertos para distribuir a pressão de forma uniforme pela palma da mão.',
        'Use um colchonete sob os joelhos quando realizar a variação adaptada.',
      ],
      illustrationId: 'svg_exercise_flexao_bracos',
      externalVideoUrl: 'https://exrx.net/WeightExercises/PectoralSternal/BWPushup',
      externalVideoSource: 'ExRx.net — Push-up',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_supino_declinado_barra',
      name: 'Supino declinado com barra',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['triceps', 'ombros'],
      compatibleEquipmentIds: ['std_chest_supino_declinado'],
      equipmentAlternatives: [['std_chest_supino_declinado']],
      shortDescription: 'Supino declinado com barra: movimento de força com foco em peitoral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Deite-se no banco declinado, fixe os pés nos apoios e mantenha as escápulas retraídas. Segure a barra com pegada pronada um pouco além dos ombros.',
      executionSteps: [
        'Desencaixe a barra com controle e alinhe-a sobre a parte inferior do tórax.',
        'Desça até próximo à linha inferior do peitoral sem perder o apoio dos ombros.',
        'Empurre a barra verticalmente até quase estender os cotovelos, sem travá-los bruscamente.',
      ],
      breathingGuide: 'Inspire na descida e expire durante a subida.',
      commonMistakes: ['Quicar a barra no tórax', 'abrir excessivamente os cotovelos', 'perder a fixação dos pés.'],
      safetyTips: ['Use presilhas e solicite supervisão para cargas altas.'],
      illustrationId: '3d_ex_peito_supino_declinado_barra',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_supino_maquina',
      name: 'Supino reto na máquina',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['triceps', 'ombros'],
      compatibleEquipmentIds: ['std_chest_supino_maquina'],
      equipmentAlternatives: [['std_chest_supino_maquina']],
      shortDescription: 'Supino reto na máquina: movimento de força com foco em peitoral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Ajuste o assento para que as alças fiquem na altura média do peitoral. Apoie as costas e mantenha os pés firmes no chão.',
      executionSteps: [
        'Segure as alças com punhos alinhados aos antebraços.',
        'Empurre à frente sem elevar os ombros nem retirar as costas do encosto.',
        'Retorne lentamente até sentir alongamento confortável no peitoral, sem deixar as placas baterem.',
      ],
      breathingGuide: 'Expire ao empurrar e inspire ao retornar.',
      commonMistakes: ['Ajustar o assento muito alto', 'encurtar a amplitude', 'soltar o retorno da carga.'],
      safetyTips: ['Não force amplitude que provoque dor no ombro.'],
      illustrationId: '3d_ex_peito_supino_maquina',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_crucifixo_cabo_medio',
      name: 'Crucifixo na polia na altura do peito',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros'],
      compatibleEquipmentIds: ['std_general_polias_ajustaveis'],
      equipmentAlternatives: [['std_general_polias_ajustaveis']],
      shortDescription: 'Crucifixo na polia na altura do peito: movimento de força com foco em peitoral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione as polias na altura dos ombros, fique no centro com um pé à frente e incline levemente o tronco. Mantenha cotovelos semiflexionados.',
      executionSteps: [
        'Abra os braços até um alongamento confortável, sem deixar os ombros avançarem excessivamente.',
        'Aproxime as mãos à frente do esterno em arco, mantendo o mesmo ângulo dos cotovelos.',
        'Retorne devagar até a posição inicial, controlando a tensão dos cabos.',
      ],
      breathingGuide: 'Expire ao aproximar as mãos e inspire ao abrir.',
      commonMistakes: ['Transformar o movimento em supino', 'hiperestender a lombar', 'usar impulso do tronco.'],
      safetyTips: ['Comece com carga leve para dominar o trajeto e a estabilidade.'],
      illustrationId: '3d_ex_peito_crucifixo_cabo_medio',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_crossover_polia_baixa',
      name: 'Crossover na polia baixa',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros'],
      compatibleEquipmentIds: ['std_general_polias_ajustaveis'],
      equipmentAlternatives: [['std_general_polias_ajustaveis']],
      shortDescription: 'Crossover na polia baixa: movimento de força com foco em peitoral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Ajuste as polias na posição inferior, segure as manoplas e fique no centro com base estável e cotovelos semiflexionados.',
      executionSteps: [
        'Inicie com as mãos baixas e lateralizadas, mantendo o peito aberto.',
        'Eleve e aproxime as mãos em arco à frente da parte superior do tórax.',
        'Retorne de forma controlada sem deixar os cabos puxarem os braços abruptamente.',
      ],
      breathingGuide: 'Expire na elevação e inspire no retorno.',
      commonMistakes: ['Flexionar e estender os cotovelos durante a repetição', 'balançar o tronco', 'elevar os ombros.'],
      safetyTips: ['Evite alongamento excessivo se houver desconforto anterior no ombro.'],
      illustrationId: '3d_ex_peito_crossover_polia_baixa',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_supino_halteres_neutro',
      name: 'Supino com halteres e pegada neutra',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['triceps', 'ombros'],
      compatibleEquipmentIds: ['std_general_halteres', 'std_general_bancos_retos'],
      equipmentAlternatives: [['std_general_halteres', 'std_general_bancos_retos']],
      shortDescription: 'Supino com halteres e pegada neutra: movimento de força com foco em peitoral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Deite-se no banco reto com pés apoiados, escápulas estáveis e halteres ao lado do tórax com as palmas voltadas uma para a outra.',
      executionSteps: [
        'Mantenha os punhos neutros e antebraços alinhados.',
        'Empurre os halteres para cima sem bater os pesos, mantendo a pegada neutra.',
        'Desça lentamente até os cotovelos ficarem próximos à linha do tronco, respeitando a mobilidade.',
      ],
      breathingGuide: 'Inspire ao descer e expire ao empurrar.',
      commonMistakes: ['Deixar os punhos dobrarem', 'bater os halteres', 'perder a estabilidade escapular.'],
      safetyTips: ['Use carga que permita controlar a descida e a subida.'],
      illustrationId: '3d_ex_peito_supino_halteres_neutro',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_supino_inclinado_maquina',
      name: 'Supino inclinado na máquina',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['ombros', 'triceps'],
      compatibleEquipmentIds: ['std_chest_supino_inclinado_barra', 'std_chest_supino_maquina'],
      equipmentAlternatives: [['std_chest_supino_inclinado_barra', 'std_chest_supino_maquina']],
      shortDescription: 'Supino inclinado na máquina: movimento de força com foco em peitoral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Ajuste o encosto inclinado e a altura do assento para alinhar as alças à região superior do peitoral. Mantenha as costas apoiadas.',
      executionSteps: [
        'Segure as alças e estabilize as escápulas contra o encosto.',
        'Empurre para cima e à frente seguindo a trajetória da máquina.',
        'Retorne lentamente até a amplitude confortável, sem relaxar completamente a musculatura.',
      ],
      breathingGuide: 'Expire ao empurrar e inspire ao retornar.',
      commonMistakes: ['Assento desalinhado', 'ombros elevados', 'retorno rápido.'],
      safetyTips: ['Ajuste a máquina antes de iniciar e não force a articulação.'],
      illustrationId: '3d_ex_peito_supino_inclinado_maquina',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_flexao_inclinada',
      name: 'Flexão inclinada',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['triceps', 'ombros'],
      compatibleEquipmentIds: ['std_general_bancos_retos'],
      equipmentAlternatives: [['std_general_bancos_retos']],
      shortDescription: 'Flexão inclinada: movimento de força com foco em peitoral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Apoie as mãos em um banco firme um pouco além da largura dos ombros. Estenda as pernas e mantenha cabeça, tronco e quadril alinhados.',
      executionSteps: [
        'Contraia o abdômen e mantenha os cotovelos em diagonal ao tronco.',
        'Flexione os cotovelos aproximando o peito do apoio sem deixar o quadril cair.',
        'Empurre o apoio até retornar à posição inicial mantendo o corpo alinhado.',
      ],
      breathingGuide: 'Inspire ao descer e expire ao empurrar.',
      commonMistakes: ['Deixar a lombar afundar', 'abrir os cotovelos a 90 graus', 'encurtar a descida.'],
      safetyTips: ['Garanta que o apoio não deslize antes de executar.'],
      illustrationId: '3d_ex_peito_flexao_inclinada',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_flexao_diamante',
      name: 'Flexão com mãos próximas (diamante)',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['triceps', 'ombros'],
      compatibleEquipmentIds: ['std_general_colchonetes'],
      equipmentAlternatives: [['std_general_colchonetes']],
      shortDescription: 'Flexão com mãos próximas (diamante): movimento de força com foco em peitoral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Assuma a posição de prancha alta e aproxime as mãos sob o centro do peito, formando um losango confortável com os dedos.',
      executionSteps: [
        'Mantenha o corpo alinhado e os cotovelos próximos ao tronco.',
        'Flexione os cotovelos levando o peito em direção às mãos.',
        'Empurre o solo até estender os braços sem perder o alinhamento corporal.',
      ],
      breathingGuide: 'Inspire na descida e expire na subida.',
      commonMistakes: ['Abrir os cotovelos', 'deixar o quadril cair', 'posicionar as mãos de modo doloroso para os punhos.'],
      safetyTips: ['Afaste um pouco as mãos se houver desconforto nos punhos.'],
      illustrationId: '3d_ex_peito_flexao_diamante',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_paralelas',
      name: 'Mergulho nas paralelas com ênfase no peitoral',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['triceps', 'ombros'],
      compatibleEquipmentIds: ['std_back_barra_fixa'],
      equipmentAlternatives: [['std_back_barra_fixa']],
      shortDescription: 'Mergulho nas paralelas com ênfase no peitoral: movimento de força com foco em peitoral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Apoie-se nas barras paralelas com braços estendidos, incline o tronco discretamente à frente e mantenha as pernas estáveis.',
      executionSteps: [
        'Flexione os cotovelos mantendo controle escapular e inclinação do tronco.',
        'Desça somente até a amplitude confortável dos ombros.',
        'Empurre as barras para retornar sem dar impulso com as pernas.',
      ],
      breathingGuide: 'Inspire ao descer e expire ao subir.',
      commonMistakes: ['Descer além da mobilidade', 'balançar o corpo', 'perder controle escapular.'],
      safetyTips: ['Evite o exercício se houver dor no ombro e use assistência se necessário.'],
      illustrationId: '3d_ex_peito_paralelas',
      externalVideoVerified: false,
    },
  {
      id: 'ex_peito_pullover_halter',
      name: 'Pullover com halter',
      primaryMuscleGroup: 'peito',
      secondaryMuscleGroups: ['costas', 'triceps'],
      compatibleEquipmentIds: ['std_general_halteres', 'std_general_bancos_retos'],
      equipmentAlternatives: [['std_general_halteres', 'std_general_bancos_retos']],
      shortDescription: 'Pullover com halter: movimento de força com foco em peitoral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Deite-se no banco com pés firmes. Segure um halter com as duas mãos acima do tórax, cotovelos levemente flexionados.',
      executionSteps: [
        'Estabilize costelas e abdômen antes de iniciar.',
        'Leve o halter em arco para trás da cabeça até onde os ombros permitirem sem arquear a lombar.',
        'Retorne o halter sobre o tórax mantendo o mesmo ângulo dos cotovelos.',
      ],
      breathingGuide: 'Inspire ao levar o peso para trás e expire ao retornar.',
      commonMistakes: ['Exagerar na amplitude', 'dobrar e estender os cotovelos', 'arquear a lombar.'],
      safetyTips: ['Use carga conservadora e interrompa se houver desconforto no ombro.'],
      illustrationId: '3d_ex_peito_pullover_halter',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_puxada_aberta_frontal',
      name: 'Puxada frontal com pegada aberta',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_back_pulldown'],
      equipmentAlternatives: [['std_back_pulldown']],
      shortDescription: 'Puxada frontal com pegada aberta: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Sente-se com coxas fixadas sob o apoio. Segure a barra com pegada pronada mais aberta que os ombros e incline o tronco levemente.',
      executionSteps: [
        'Inicie com braços estendidos e escápulas elevadas de forma controlada.',
        'Puxe a barra em direção à parte superior do tórax conduzindo os cotovelos para baixo.',
        'Estenda os braços lentamente sem perder o controle das escápulas.',
      ],
      breathingGuide: 'Expire ao puxar e inspire ao retornar.',
      commonMistakes: ['Puxar a barra atrás da nuca', 'usar balanço', 'transformar o movimento em remada.'],
      safetyTips: ['Mantenha a barra à frente e ajuste a carga para evitar compensações.'],
      illustrationId: '3d_ex_costas_puxada_aberta_frontal',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_puxada_neutra',
      name: 'Puxada alta com pegada neutra',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_back_puxada_alta', 'std_arms_barras_puxadores_polia'],
      equipmentAlternatives: [['std_back_puxada_alta', 'std_arms_barras_puxadores_polia']],
      shortDescription: 'Puxada alta com pegada neutra: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Sente-se com as coxas presas e segure o puxador neutro com as palmas voltadas uma para a outra.',
      executionSteps: [
        'Alongue os braços sem perder a estabilidade do tronco.',
        'Puxe o puxador em direção à parte alta do peito mantendo cotovelos próximos às laterais.',
        'Retorne devagar até estender os braços sem soltar a tensão.',
      ],
      breathingGuide: 'Expire na puxada e inspire no retorno.',
      commonMistakes: ['Inclinar demais o tronco', 'elevar os ombros', 'puxar com impulso.'],
      safetyTips: ['Evite tracionar atrás da cabeça.'],
      illustrationId: '3d_ex_costas_puxada_neutra',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_puxada_supinada',
      name: 'Puxada alta com pegada supinada',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_back_pulldown', 'std_arms_barras_puxadores_polia'],
      equipmentAlternatives: [['std_back_pulldown', 'std_arms_barras_puxadores_polia']],
      shortDescription: 'Puxada alta com pegada supinada: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Sente-se e segure a barra com as palmas voltadas para o rosto, mãos aproximadamente na largura dos ombros.',
      executionSteps: [
        'Mantenha o tronco estável e os cotovelos inicialmente estendidos.',
        'Puxe a barra à frente em direção à parte superior do peito, conduzindo os cotovelos para baixo.',
        'Retorne lentamente até alongar os dorsais sem perder a postura.',
      ],
      breathingGuide: 'Expire ao puxar e inspire ao retornar.',
      commonMistakes: ['Usar balanço', 'levar a barra atrás da nuca', 'flexionar os punhos.'],
      safetyTips: ['Use amplitude confortável para cotovelos e ombros.'],
      illustrationId: '3d_ex_costas_puxada_supinada',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_remada_curvada_supinada',
      name: 'Remada curvada com barra e pegada supinada',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_general_barras_retas', 'std_general_anilhas'],
      equipmentAlternatives: [['std_general_barras_retas', 'std_general_anilhas']],
      shortDescription: 'Remada curvada com barra e pegada supinada: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Fique em pé com pés na largura do quadril, segure a barra supinada e incline o quadril mantendo coluna neutra e joelhos semiflexionados.',
      executionSteps: [
        'Deixe a barra abaixo dos ombros com abdômen firme.',
        'Puxe a barra em direção ao abdômen conduzindo os cotovelos para trás.',
        'Desça a barra de forma controlada sem arredondar a coluna.',
      ],
      breathingGuide: 'Expire ao remar e inspire ao descer.',
      commonMistakes: ['Arredondar a lombar', 'usar impulso do quadril', 'puxar em direção ao peito.'],
      safetyTips: ['Reduza a carga se não conseguir manter a coluna neutra.'],
      illustrationId: '3d_ex_costas_remada_curvada_supinada',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_remada_cavalinho',
      name: 'Remada cavalinho',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_back_remada_cavalinho'],
      equipmentAlternatives: [['std_back_remada_cavalinho']],
      shortDescription: 'Remada cavalinho: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione-se na máquina cavalinho com peito apoiado quando disponível, pés firmes e mãos no pegador.',
      executionSteps: [
        'Estenda os braços sem arredondar os ombros.',
        'Puxe o pegador em direção ao abdômen, aproximando as escápulas sem elevar os ombros.',
        'Retorne lentamente até alongar as costas mantendo o tronco apoiado.',
      ],
      breathingGuide: 'Expire na puxada e inspire no retorno.',
      commonMistakes: ['Tracionar com lombar', 'encolher os ombros', 'soltar o peso rapidamente.'],
      safetyTips: ['Ajuste o apoio para não comprimir o tórax.'],
      illustrationId: '3d_ex_costas_remada_cavalinho',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_remada_unilateral_polia',
      name: 'Remada unilateral na polia',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_general_polias_ajustaveis'],
      equipmentAlternatives: [['std_general_polias_ajustaveis']],
      shortDescription: 'Remada unilateral na polia: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Ajuste a polia na altura do abdômen, segure a manopla com uma mão e estabilize a base com joelhos levemente flexionados.',
      executionSteps: [
        'Mantenha o tronco firme e permita alcance controlado do braço à frente.',
        'Puxe o cotovelo para trás junto ao tronco sem girar o quadril.',
        'Estenda o braço lentamente mantendo o ombro controlado.',
      ],
      breathingGuide: 'Expire ao puxar e inspire ao estender.',
      commonMistakes: ['Rotacionar excessivamente o tronco', 'elevar o ombro', 'usar impulso.'],
      safetyTips: ['Execute os dois lados com amplitude e carga equivalentes.'],
      illustrationId: '3d_ex_costas_remada_unilateral_polia',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_remada_serrote_banco',
      name: 'Remada serrote com halter',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_general_halteres', 'std_general_bancos_retos'],
      equipmentAlternatives: [['std_general_halteres', 'std_general_bancos_retos']],
      shortDescription: 'Remada serrote com halter: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Apoie uma mão e o joelho do mesmo lado no banco. Mantenha a coluna neutra e o halter pendente sob o ombro oposto.',
      executionSteps: [
        'Estabilize o tronco e mantenha o pescoço alinhado.',
        'Puxe o halter em direção ao quadril conduzindo o cotovelo próximo ao corpo.',
        'Desça o halter lentamente até estender o braço sem girar o tronco.',
      ],
      breathingGuide: 'Expire ao remar e inspire ao descer.',
      commonMistakes: ['Girar o tronco', 'puxar em direção ao ombro', 'arredondar as costas.'],
      safetyTips: ['Use apoio firme e não torça a coluna para elevar a carga.'],
      illustrationId: '3d_ex_costas_remada_serrote_banco',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_remada_maquina_peito_apoiado',
      name: 'Remada na máquina com peito apoiado',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_back_remada_articulada'],
      equipmentAlternatives: [['std_back_remada_articulada']],
      shortDescription: 'Remada na máquina com peito apoiado: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Ajuste o banco e o apoio torácico para que as alças fiquem ao alcance com braços estendidos e pés firmes.',
      executionSteps: [
        'Mantenha o peito apoiado e os ombros afastados das orelhas.',
        'Puxe as alças em direção às laterais do tronco aproximando as escápulas.',
        'Retorne devagar sem perder o contato do tórax com o apoio.',
      ],
      breathingGuide: 'Expire ao puxar e inspire no retorno.',
      commonMistakes: ['Descolar o peito do apoio', 'encolher os ombros', 'usar impulso.'],
      safetyTips: ['Regule o assento antes da série e respeite a amplitude articular.'],
      illustrationId: '3d_ex_costas_remada_maquina_peito_apoiado',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_pulldown_braco_reto',
      name: 'Pulldown com braços estendidos',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['ombros'],
      compatibleEquipmentIds: ['std_general_polias_ajustaveis'],
      equipmentAlternatives: [['std_general_polias_ajustaveis']],
      shortDescription: 'Pulldown com braços estendidos: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Fique de frente para a polia alta, segure a barra com braços quase estendidos e incline o tronco discretamente mantendo abdômen firme.',
      executionSteps: [
        'Posicione as mãos à frente da linha dos ombros.',
        'Puxe a barra em arco até próximo às coxas mantendo cotovelos com leve flexão constante.',
        'Retorne controlando a subida dos braços sem arquear a lombar.',
      ],
      breathingGuide: 'Expire ao puxar para baixo e inspire ao retornar.',
      commonMistakes: ['Flexionar os cotovelos como uma puxada', 'balançar o tronco', 'hiperestender a lombar.'],
      safetyTips: ['Mantenha a carga leve o suficiente para isolar a extensão do ombro.'],
      illustrationId: '3d_ex_costas_pulldown_braco_reto',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_barra_fixa_pronada',
      name: 'Barra fixa pronada',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_back_barra_fixa'],
      equipmentAlternatives: [['std_back_barra_fixa']],
      shortDescription: 'Barra fixa pronada: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Segure a barra com pegada pronada um pouco além dos ombros, pendure-se com controle e mantenha pernas estáveis.',
      executionSteps: [
        'Ative as escápulas antes de iniciar a flexão dos cotovelos.',
        'Puxe o corpo para cima até o queixo ultrapassar a barra sem projetar o pescoço.',
        'Desça lentamente até quase estender os cotovelos mantendo controle.',
      ],
      breathingGuide: 'Expire ao subir e inspire ao descer.',
      commonMistakes: ['Dar impulso com as pernas', 'encurtar a descida', 'elevar os ombros sem controle.'],
      safetyTips: ['Use o Graviton ou elástico de assistência se necessário.'],
      illustrationId: '3d_ex_costas_barra_fixa_pronada',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_barra_fixa_supinada',
      name: 'Barra fixa supinada (chin-up)',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_back_barra_fixa'],
      equipmentAlternatives: [['std_back_barra_fixa']],
      shortDescription: 'Barra fixa supinada (chin-up): movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Segure a barra com as palmas voltadas para você, mãos na largura dos ombros e corpo suspenso com pernas estáveis.',
      executionSteps: [
        'Ative as escápulas e mantenha o abdômen contraído.',
        'Puxe o corpo até aproximar a parte superior do peito da barra.',
        'Desça com controle até quase estender os cotovelos sem relaxar abruptamente.',
      ],
      breathingGuide: 'Expire ao subir e inspire ao descer.',
      commonMistakes: ['Balançar o corpo', 'elevar o queixo sem subir o tronco', 'cair na descida.'],
      safetyTips: ['Use assistência quando não conseguir controlar todo o percurso.'],
      illustrationId: '3d_ex_costas_barra_fixa_supinada',
      externalVideoVerified: false,
    },
  {
      id: 'ex_costas_remada_invertida',
      name: 'Remada invertida na barra',
      primaryMuscleGroup: 'costas',
      secondaryMuscleGroups: ['biceps'],
      compatibleEquipmentIds: ['std_general_barras_retas'],
      equipmentAlternatives: [['std_general_barras_retas']],
      shortDescription: 'Remada invertida na barra: movimento de força com foco em dorsais e musculatura média das costas, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Ajuste a barra na altura adequada, posicione-se sob ela e segure com pegada pronada. Mantenha corpo alinhado e calcanhares apoiados.',
      executionSteps: [
        'Inicie com braços estendidos e escápulas controladas.',
        'Puxe o peito em direção à barra mantendo quadril alinhado ao tronco.',
        'Desça lentamente até estender os braços sem deixar o quadril cair.',
      ],
      breathingGuide: 'Expire ao puxar e inspire ao descer.',
      commonMistakes: ['Deixar o quadril afundar', 'projetar a cabeça', 'usar impulso das pernas.'],
      safetyTips: ['Ajuste a altura da barra para controlar a dificuldade.'],
      illustrationId: '3d_ex_costas_remada_invertida',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_crunch_solo',
      name: 'Abdominal crunch no solo',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["corpo_inteiro"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_abdomen_crunch_solo',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_reverso',
      name: 'Abdominal reverso',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["corpo_inteiro"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_abdomen_reverso',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_bicicleta',
      name: 'Abdominal bicicleta',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["corpo_inteiro"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_abdomen_bicicleta',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_obliquo',
      name: 'Abdominal oblíquo no solo',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["corpo_inteiro"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_abdomen_obliquo',
      externalVideoVerified: false,
    },
  {
      id: 'ex_core_prancha_frontal',
      name: 'Prancha frontal',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["gluteos"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_core_prancha_frontal',
      externalVideoVerified: false,
    },
  {
      id: 'ex_core_prancha_lateral',
      name: 'Prancha lateral',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["gluteos"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_core_prancha_lateral',
      externalVideoVerified: false,
    },
  {
      id: 'ex_core_prancha_elevacao_perna',
      name: 'Prancha com elevação de perna',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["gluteos"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_core_prancha_elevacao_perna',
      externalVideoVerified: false,
    },
  {
      id: 'ex_core_prancha_toque_ombro',
      name: 'Prancha com toque no ombro',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["ombros"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_core_prancha_toque_ombro',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_elevacao_joelhos_barra',
      name: 'Elevação de joelhos na barra fixa',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["costas"],
      compatibleEquipmentIds: ["std_back_barra_fixa"],
      equipmentAlternatives: [["std_back_barra_fixa"]],
      isBodyweight: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_abdomen_elevacao_joelhos_barra',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_elevacao_pernas_banco',
      name: 'Elevação de pernas no banco',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["quadriceps"],
      compatibleEquipmentIds: ["std_general_bancos_retos"],
      equipmentAlternatives: [["std_general_bancos_retos"]],
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_abdomen_elevacao_pernas_banco',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_crunch_polia',
      name: 'Abdominal na polia',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["costas"],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis"],
      equipmentAlternatives: [["std_general_polias_ajustaveis"]],
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_abdomen_crunch_polia',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_crunch_bola_suica',
      name: 'Abdominal na bola suíça',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["corpo_inteiro"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_abdomen_crunch_bola_suica',
      externalVideoVerified: false,
    },
  {
      id: 'ex_abdomen_ab_wheel',
      name: 'Abdominal na roda (ab wheel)',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["costas", "ombros"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_abdomen_ab_wheel',
      externalVideoVerified: false,
    },
  {
      id: 'ex_core_dead_bug',
      name: 'Dead bug',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["corpo_inteiro"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_core_dead_bug',
      externalVideoVerified: false,
    },
  {
      id: 'ex_core_bird_dog',
      name: 'Bird dog',
      primaryMuscleGroup: 'abdomen_core',
      secondaryMuscleGroups: ["costas", "gluteos"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de estabilização e fortalecimento do core, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Posicione-se sobre um colchonete ou no equipamento indicado, ajuste a postura inicial e estabilize a pelve e a coluna antes de iniciar.',
      executionSteps: ["Ative a musculatura abdominal e mantenha a respiração fluida antes de começar.", "Execute o movimento descrito mantendo controle do tronco e amplitude compatível com sua mobilidade.", "Retorne lentamente à posição inicial sem usar balanço ou impulso."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, sem prender a respiração.',
      commonMistakes: ["Perder o alinhamento da coluna ou da pelve durante a execução.", "Usar impulso para completar a repetição.", "Prender a respiração ou acelerar a fase de retorno."],
      safetyTips: ["Mantenha a amplitude confortável e interrompa se houver dor lombar ou articular.", "Priorize o controle do tronco e a técnica antes de aumentar o tempo ou a dificuldade."],
      illustrationId: '3d_ex_core_bird_dog',
      externalVideoVerified: false,
    },
  {
      id: 'ex_corpo_mountain_climber',
      name: 'Mountain climber',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ["abdomen_core", "ombros", "quadriceps"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de condicionamento integrado de corpo inteiro, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Assuma a posição inicial estável, confira o espaço livre ao redor e ajuste a carga ou resistência conforme a orientação do instrutor.',
      executionSteps: ["Estabilize o tronco e distribua o peso de forma equilibrada antes de iniciar.", "Execute o movimento de maneira coordenada, mantendo articulações alinhadas e controle da trajetória.", "Retorne à posição inicial de forma controlada e prepare a repetição seguinte."],
      breathingGuide: 'Inspire na preparação e expire durante a fase principal de esforço, mantendo a respiração contínua.',
      commonMistakes: ["Iniciar com carga ou velocidade acima do controle técnico.", "Perder o alinhamento dos joelhos, quadris ou coluna.", "Usar impulso excessivo ou encurtar a amplitude sem necessidade."],
      safetyTips: ["Comece com intensidade leve e aumente apenas quando dominar a técnica.", "Mantenha a área de execução livre e interrompa diante de dor ou tontura."],
      illustrationId: '3d_ex_corpo_mountain_climber',
      externalVideoVerified: false,
    },
  {
      id: 'ex_corpo_burpee',
      name: 'Burpee',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ["abdomen_core", "peito", "quadriceps"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de condicionamento integrado de corpo inteiro, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Assuma a posição inicial estável, confira o espaço livre ao redor e ajuste a carga ou resistência conforme a orientação do instrutor.',
      executionSteps: ["Estabilize o tronco e distribua o peso de forma equilibrada antes de iniciar.", "Execute o movimento de maneira coordenada, mantendo articulações alinhadas e controle da trajetória.", "Retorne à posição inicial de forma controlada e prepare a repetição seguinte."],
      breathingGuide: 'Inspire na preparação e expire durante a fase principal de esforço, mantendo a respiração contínua.',
      commonMistakes: ["Iniciar com carga ou velocidade acima do controle técnico.", "Perder o alinhamento dos joelhos, quadris ou coluna.", "Usar impulso excessivo ou encurtar a amplitude sem necessidade."],
      safetyTips: ["Comece com intensidade leve e aumente apenas quando dominar a técnica.", "Mantenha a área de execução livre e interrompa diante de dor ou tontura."],
      illustrationId: '3d_ex_corpo_burpee',
      externalVideoVerified: false,
    },
  {
      id: 'ex_corpo_kettlebell_swing_bloco05',
      name: 'Kettlebell swing',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ["gluteos", "posterior_coxa", "abdomen_core"],
      compatibleEquipmentIds: ["std_general_kettlebells"],
      equipmentAlternatives: [["std_general_kettlebells"]],
      shortDescription: 'Exercício de condicionamento integrado de corpo inteiro, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Assuma a posição inicial estável, confira o espaço livre ao redor e ajuste a carga ou resistência conforme a orientação do instrutor.',
      executionSteps: ["Estabilize o tronco e distribua o peso de forma equilibrada antes de iniciar.", "Execute o movimento de maneira coordenada, mantendo articulações alinhadas e controle da trajetória.", "Retorne à posição inicial de forma controlada e prepare a repetição seguinte."],
      breathingGuide: 'Inspire na preparação e expire durante a fase principal de esforço, mantendo a respiração contínua.',
      commonMistakes: ["Iniciar com carga ou velocidade acima do controle técnico.", "Perder o alinhamento dos joelhos, quadris ou coluna.", "Usar impulso excessivo ou encurtar a amplitude sem necessidade."],
      safetyTips: ["Comece com intensidade leve e aumente apenas quando dominar a técnica.", "Mantenha a área de execução livre e interrompa diante de dor ou tontura."],
      illustrationId: '3d_ex_corpo_kettlebell_swing_bloco05',
      externalVideoVerified: false,
    },
  {
      id: 'ex_corpo_agachamento_salto',
      name: 'Agachamento com salto',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ["quadriceps", "gluteos"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      canExecuteWithoutEquipment: true,
      shortDescription: 'Exercício de condicionamento integrado de corpo inteiro, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Assuma a posição inicial estável, confira o espaço livre ao redor e ajuste a carga ou resistência conforme a orientação do instrutor.',
      executionSteps: ["Estabilize o tronco e distribua o peso de forma equilibrada antes de iniciar.", "Execute o movimento de maneira coordenada, mantendo articulações alinhadas e controle da trajetória.", "Retorne à posição inicial de forma controlada e prepare a repetição seguinte."],
      breathingGuide: 'Inspire na preparação e expire durante a fase principal de esforço, mantendo a respiração contínua.',
      commonMistakes: ["Iniciar com carga ou velocidade acima do controle técnico.", "Perder o alinhamento dos joelhos, quadris ou coluna.", "Usar impulso excessivo ou encurtar a amplitude sem necessidade."],
      safetyTips: ["Comece com intensidade leve e aumente apenas quando dominar a técnica.", "Mantenha a área de execução livre e interrompa diante de dor ou tontura."],
      illustrationId: '3d_ex_corpo_agachamento_salto',
      externalVideoVerified: false,
    },
  {
      id: 'ex_corpo_thruster_halteres',
      name: 'Thruster com halteres',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ["quadriceps", "ombros", "triceps"],
      compatibleEquipmentIds: ["std_general_halteres"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: 'Exercício de condicionamento integrado de corpo inteiro, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Assuma a posição inicial estável, confira o espaço livre ao redor e ajuste a carga ou resistência conforme a orientação do instrutor.',
      executionSteps: ["Estabilize o tronco e distribua o peso de forma equilibrada antes de iniciar.", "Execute o movimento de maneira coordenada, mantendo articulações alinhadas e controle da trajetória.", "Retorne à posição inicial de forma controlada e prepare a repetição seguinte."],
      breathingGuide: 'Inspire na preparação e expire durante a fase principal de esforço, mantendo a respiração contínua.',
      commonMistakes: ["Iniciar com carga ou velocidade acima do controle técnico.", "Perder o alinhamento dos joelhos, quadris ou coluna.", "Usar impulso excessivo ou encurtar a amplitude sem necessidade."],
      safetyTips: ["Comece com intensidade leve e aumente apenas quando dominar a técnica.", "Mantenha a área de execução livre e interrompa diante de dor ou tontura."],
      illustrationId: '3d_ex_corpo_thruster_halteres',
      externalVideoVerified: false,
    },
  {
      id: 'ex_corpo_remada_renegada',
      name: 'Remada renegada',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ["costas", "abdomen_core", "ombros"],
      compatibleEquipmentIds: ["std_general_halteres"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: 'Exercício de condicionamento integrado de corpo inteiro, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Assuma a posição inicial estável, confira o espaço livre ao redor e ajuste a carga ou resistência conforme a orientação do instrutor.',
      executionSteps: ["Estabilize o tronco e distribua o peso de forma equilibrada antes de iniciar.", "Execute o movimento de maneira coordenada, mantendo articulações alinhadas e controle da trajetória.", "Retorne à posição inicial de forma controlada e prepare a repetição seguinte."],
      breathingGuide: 'Inspire na preparação e expire durante a fase principal de esforço, mantendo a respiração contínua.',
      commonMistakes: ["Iniciar com carga ou velocidade acima do controle técnico.", "Perder o alinhamento dos joelhos, quadris ou coluna.", "Usar impulso excessivo ou encurtar a amplitude sem necessidade."],
      safetyTips: ["Comece com intensidade leve e aumente apenas quando dominar a técnica.", "Mantenha a área de execução livre e interrompa diante de dor ou tontura."],
      illustrationId: '3d_ex_corpo_remada_renegada',
      externalVideoVerified: false,
    },
  {
      id: 'ex_corpo_clean_press_halteres',
      name: 'Clean and press com halteres',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ["quadriceps", "gluteos", "ombros"],
      compatibleEquipmentIds: ["std_general_halteres"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: 'Exercício de condicionamento integrado de corpo inteiro, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Assuma a posição inicial estável, confira o espaço livre ao redor e ajuste a carga ou resistência conforme a orientação do instrutor.',
      executionSteps: ["Estabilize o tronco e distribua o peso de forma equilibrada antes de iniciar.", "Execute o movimento de maneira coordenada, mantendo articulações alinhadas e controle da trajetória.", "Retorne à posição inicial de forma controlada e prepare a repetição seguinte."],
      breathingGuide: 'Inspire na preparação e expire durante a fase principal de esforço, mantendo a respiração contínua.',
      commonMistakes: ["Iniciar com carga ou velocidade acima do controle técnico.", "Perder o alinhamento dos joelhos, quadris ou coluna.", "Usar impulso excessivo ou encurtar a amplitude sem necessidade."],
      safetyTips: ["Comece com intensidade leve e aumente apenas quando dominar a técnica.", "Mantenha a área de execução livre e interrompa diante de dor ou tontura."],
      illustrationId: '3d_ex_corpo_clean_press_halteres',
      externalVideoVerified: false,
    },
  {
      id: 'ex_corpo_sled_push',
      name: 'Empurrada de trenó (sled push)',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ["quadriceps", "gluteos", "panturrilhas"],
      compatibleEquipmentIds: ["std_general_anilhas"],
      equipmentAlternatives: [["std_general_anilhas"]],
      shortDescription: 'Exercício de condicionamento integrado de corpo inteiro, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Assuma a posição inicial estável, confira o espaço livre ao redor e ajuste a carga ou resistência conforme a orientação do instrutor.',
      executionSteps: ["Estabilize o tronco e distribua o peso de forma equilibrada antes de iniciar.", "Execute o movimento de maneira coordenada, mantendo articulações alinhadas e controle da trajetória.", "Retorne à posição inicial de forma controlada e prepare a repetição seguinte."],
      breathingGuide: 'Inspire na preparação e expire durante a fase principal de esforço, mantendo a respiração contínua.',
      commonMistakes: ["Iniciar com carga ou velocidade acima do controle técnico.", "Perder o alinhamento dos joelhos, quadris ou coluna.", "Usar impulso excessivo ou encurtar a amplitude sem necessidade."],
      safetyTips: ["Comece com intensidade leve e aumente apenas quando dominar a técnica.", "Mantenha a área de execução livre e interrompa diante de dor ou tontura."],
      illustrationId: '3d_ex_corpo_sled_push',
      externalVideoVerified: false,
    },
  {
      id: 'ex_corpo_battle_rope',
      name: 'Ondulação de corda naval (battle rope)',
      primaryMuscleGroup: 'corpo_inteiro',
      secondaryMuscleGroups: ["ombros", "abdomen_core"],
      compatibleEquipmentIds: ["std_general_elasticos_resistencia"],
      equipmentAlternatives: [["std_general_elasticos_resistencia"]],
      shortDescription: 'Exercício de condicionamento integrado de corpo inteiro, com foco em controle técnico, coordenação e execução consistente.',
      initialPosition: 'Assuma a posição inicial estável, confira o espaço livre ao redor e ajuste a carga ou resistência conforme a orientação do instrutor.',
      executionSteps: ["Estabilize o tronco e distribua o peso de forma equilibrada antes de iniciar.", "Execute o movimento de maneira coordenada, mantendo articulações alinhadas e controle da trajetória.", "Retorne à posição inicial de forma controlada e prepare a repetição seguinte."],
      breathingGuide: 'Inspire na preparação e expire durante a fase principal de esforço, mantendo a respiração contínua.',
      commonMistakes: ["Iniciar com carga ou velocidade acima do controle técnico.", "Perder o alinhamento dos joelhos, quadris ou coluna.", "Usar impulso excessivo ou encurtar a amplitude sem necessidade."],
      safetyTips: ["Comece com intensidade leve e aumente apenas quando dominar a técnica.", "Mantenha a área de execução livre e interrompa diante de dor ou tontura."],
      illustrationId: '3d_ex_corpo_battle_rope',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_hip_thrust_unilateral',
      name: 'Hip thrust unilateral',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ["posterior_coxa"],
      compatibleEquipmentIds: ["std_legs_glute_drive"],
      equipmentAlternatives: [["std_legs_glute_drive"]],
      shortDescription: 'Hip thrust unilateral: exercício de fortalecimento com foco em hip thrust unilateral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_hip_thrust_unilateral',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_ponte_gluteos_solo',
      name: 'Ponte de glúteos no solo',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ["posterior_coxa"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription: 'Ponte de glúteos no solo: exercício de fortalecimento com foco em ponte de glúteos no solo, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_ponte_gluteos_solo',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_ponte_gluteos_unilateral',
      name: 'Ponte de glúteos unilateral',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ["posterior_coxa"],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription: 'Ponte de glúteos unilateral: exercício de fortalecimento com foco em ponte de glúteos unilateral, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_ponte_gluteos_unilateral',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_coice_polia_unilateral',
      name: 'Coice unilateral na polia',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ["posterior_coxa"],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis"],
      equipmentAlternatives: [["std_general_polias_ajustaveis"]],
      shortDescription: 'Coice unilateral na polia: exercício de fortalecimento com foco em coice unilateral na polia, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_coice_polia_unilateral',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_abducao_quadril_polia',
      name: 'Abdução de quadril na polia',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis"],
      equipmentAlternatives: [["std_general_polias_ajustaveis"]],
      shortDescription: 'Abdução de quadril na polia: exercício de fortalecimento com foco em abdução de quadril na polia, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_abducao_quadril_polia',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_abducao_quadril_elastico',
      name: 'Abdução de quadril com elástico',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_elasticos_resistencia"],
      equipmentAlternatives: [["std_general_elasticos_resistencia"]],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription: 'Abdução de quadril com elástico: exercício de fortalecimento com foco em abdução de quadril com elástico, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_abducao_quadril_elastico',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_pull_through_polia',
      name: 'Pull-through na polia',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ["posterior_coxa"],
      compatibleEquipmentIds: ["std_general_polias_ajustaveis"],
      equipmentAlternatives: [["std_general_polias_ajustaveis"]],
      shortDescription: 'Pull-through na polia: exercício de fortalecimento com foco em pull-through na polia, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_pull_through_polia',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_terra_sumo_kettlebell',
      name: 'Levantamento terra sumô com kettlebell',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ["quadriceps", "posterior_coxa"],
      compatibleEquipmentIds: ["std_general_kettlebells"],
      equipmentAlternatives: [["std_general_kettlebells"]],
      shortDescription: 'Levantamento terra sumô com kettlebell: exercício de fortalecimento com foco em levantamento terra sumô com kettlebell, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_terra_sumo_kettlebell',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_passada_lateral_halteres',
      name: 'Passada lateral com halteres',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ["quadriceps"],
      compatibleEquipmentIds: ["std_general_halteres"],
      equipmentAlternatives: [["std_general_halteres"]],
      shortDescription: 'Passada lateral com halteres: exercício de fortalecimento com foco em passada lateral com halteres, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_passada_lateral_halteres',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_step_up_lateral',
      name: 'Step-up lateral no banco',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ["quadriceps"],
      compatibleEquipmentIds: ["std_general_bancos_retos"],
      equipmentAlternatives: [["std_general_bancos_retos"]],
      shortDescription: 'Step-up lateral no banco: exercício de fortalecimento com foco em step-up lateral no banco, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_step_up_lateral',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_frog_pump',
      name: 'Frog pump',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription: 'Frog pump: exercício de fortalecimento com foco em frog pump, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_frog_pump',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_clam_shell_elastico',
      name: 'Clam shell com elástico',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_elasticos_resistencia"],
      equipmentAlternatives: [["std_general_elasticos_resistencia"]],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription: 'Clam shell com elástico: exercício de fortalecimento com foco em clam shell com elástico, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_clam_shell_elastico',
      externalVideoVerified: false,
    },
  {
      id: 'ex_gluteos_extensao_quadril_banco_45',
      name: 'Extensão de quadril no banco 45°',
      primaryMuscleGroup: 'gluteos',
      secondaryMuscleGroups: ["posterior_coxa"],
      compatibleEquipmentIds: ["std_general_bancos_regulaveis"],
      equipmentAlternatives: [["std_general_bancos_regulaveis"]],
      shortDescription: 'Extensão de quadril no banco 45°: exercício de fortalecimento com foco em extensão de quadril no banco 45°, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_gluteos_extensao_quadril_banco_45',
      externalVideoVerified: false,
    },
  {
      id: 'ex_panturrilhas_em_pe_smith',
      name: 'Elevação de panturrilhas no Smith',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_legs_smith_machine"],
      equipmentAlternatives: [["std_legs_smith_machine"]],
      shortDescription: 'Elevação de panturrilhas no Smith: exercício de fortalecimento com foco em elevação de panturrilhas no smith, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_panturrilhas_em_pe_smith',
      externalVideoVerified: false,
    },
  {
      id: 'ex_panturrilhas_donkey_raise',
      name: 'Elevação de panturrilhas donkey raise',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_legs_panturrilha_em_pe"],
      equipmentAlternatives: [["std_legs_panturrilha_em_pe"]],
      shortDescription: 'Elevação de panturrilhas donkey raise: exercício de fortalecimento com foco em elevação de panturrilhas donkey raise, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_panturrilhas_donkey_raise',
      externalVideoVerified: false,
    },
  {
      id: 'ex_panturrilhas_unilateral_peso_corporal',
      name: 'Elevação unilateral de panturrilha com peso corporal',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription: 'Elevação unilateral de panturrilha com peso corporal: exercício de fortalecimento com foco em elevação unilateral de panturrilha com peso corporal, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_panturrilhas_unilateral_peso_corporal',
      externalVideoVerified: false,
    },
  {
      id: 'ex_panturrilhas_sentado_halteres',
      name: 'Elevação de panturrilhas sentado com halter',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_halteres", "std_general_bancos_retos"],
      equipmentAlternatives: [["std_general_halteres", "std_general_bancos_retos"]],
      shortDescription: 'Elevação de panturrilhas sentado com halter: exercício de fortalecimento com foco em elevação de panturrilhas sentado com halter, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_panturrilhas_sentado_halteres',
      externalVideoVerified: false,
    },
  {
      id: 'ex_panturrilhas_leg_press_horizontal',
      name: 'Elevação de panturrilhas no leg press horizontal',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_legs_leg_press_horizontal"],
      equipmentAlternatives: [["std_legs_leg_press_horizontal"]],
      shortDescription: 'Elevação de panturrilhas no leg press horizontal: exercício de fortalecimento com foco em elevação de panturrilhas no leg press horizontal, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_panturrilhas_leg_press_horizontal',
      externalVideoVerified: false,
    },
  {
      id: 'ex_panturrilhas_hack_machine',
      name: 'Elevação de panturrilhas no hack machine',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_legs_hack_squat"],
      equipmentAlternatives: [["std_legs_hack_squat"]],
      shortDescription: 'Elevação de panturrilhas no hack machine: exercício de fortalecimento com foco em elevação de panturrilhas no hack machine, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_panturrilhas_hack_machine',
      externalVideoVerified: false,
    },
  {
      id: 'ex_panturrilhas_isometria_degrau',
      name: 'Isometria de panturrilhas no degrau',
      primaryMuscleGroup: 'panturrilhas',
      secondaryMuscleGroups: [],
      compatibleEquipmentIds: ["std_general_colchonetes"],
      equipmentAlternatives: [["std_general_colchonetes"]],
      isBodyweight: true,
      canExecuteWithoutEquipment: true,
      shortDescription: 'Isometria de panturrilhas no degrau: exercício de fortalecimento com foco em isometria de panturrilhas no degrau, executado com amplitude controlada e estabilidade articular.',
      initialPosition: 'Posicione o corpo e ajuste o equipamento para que a articulação principal fique alinhada ao eixo de movimento. Estabilize o tronco antes de iniciar.',
      executionSteps: ["Inicie com a musculatura-alvo sob tensão e articulações alinhadas.", "Execute a fase principal com amplitude controlada, sem impulso ou compensação do tronco.", "Retorne lentamente à posição inicial mantendo a tensão e a postura."],
      breathingGuide: 'Expire durante a fase de esforço e inspire no retorno, mantendo a respiração contínua.',
      commonMistakes: ["Usar impulso para completar a repetição.", "Perder o alinhamento articular ou a estabilidade do tronco.", "Reduzir o controle na fase de retorno."],
      safetyTips: ["Ajuste a carga e a amplitude à capacidade individual e à orientação do instrutor.", "Interrompa a execução se houver dor articular ou perda de controle técnico."],
      illustrationId: '3d_ex_panturrilhas_isometria_degrau',
      externalVideoVerified: false,
    }
];

/**
 * Normaliza uma string de pesquisa de exercício (minúsculas, sem acentos, espaços enxutos).
 */
export function normalizeExerciseSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export interface ResolvedCompatibleEquipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  isCustom: boolean;
}

/**
 * Normaliza uma entrada do mapa de compatibilidade explícita de equipamentos personalizados
 * em alternativas explícitas (`string[][]`).
 */
export function normalizeExplicitCustomAlternatives(
  explicitEntries?: Array<string | string[]>
): string[][] {
  if (!Array.isArray(explicitEntries) || explicitEntries.length === 0) {
    return [];
  }

  const normalized: string[][] = [];
  for (const entry of explicitEntries) {
    if (typeof entry === 'string' && entry.trim().length > 0) {
      normalized.push([entry.trim()]);
    } else if (Array.isArray(entry)) {
      const cleaned = entry
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        .map((id) => id.trim());
      if (cleaned.length > 0) {
        normalized.push(cleaned);
      }
    }
  }
  return normalized;
}

/**
 * Constrói o mapa explícito de compatibilidade personalizada a partir dos equipamentos
 * personalizados efetivamente cadastrados pelo usuário (`customEquipments`).
 *
 * Regras:
 * - Considera apenas registros válidos com `isCustom: true` e `id`/`name` preenchidos.
 * - Lê apenas vínculos explícitos (`linkedExerciseIds` e `linkedExerciseAlternatives`).
 * - Jamais cria vínculo automático por nome, categoria ou semelhança textual.
 */
interface InternalResolvedEquipment extends ResolvedCompatibleEquipment {
  isSelectedInRecord: boolean;
}

/**
 * Resolve um ID de equipamento exclusivamente contra o catálogo padrão de 54 equipamentos
 * ou contra a lista de equipamentos personalizados efetivamente cadastrados (`customEquipments`).
 *
 * IMPORTANTE:
 * - Rejeita IDs inexistentes, removidos ou não cadastrados retornando `null`.
 * - Jamais utiliza o próprio `eqId` como nome de equipamento quando a referência não puder ser resolvida.
 */
function resolveRegisteredEquipmentById(
  eqId: string,
  customEquipments: GymEquipmentItem[] = []
): InternalResolvedEquipment | null {
  if (typeof eqId !== 'string' || !eqId.trim()) {
    return null;
  }
  const normalizedId = eqId.trim();

  const standardMatch = DEFAULT_EQUIPMENTS_CATALOG.find(
    (item) => item.id === normalizedId
  );
  if (standardMatch) {
    return {
      id: standardMatch.id,
      name: standardMatch.name,
      category: standardMatch.category,
      isCustom: false,
      isSelectedInRecord: true,
    };
  }

  if (!Array.isArray(customEquipments) || customEquipments.length === 0) {
    return null;
  }

  const customMatch = customEquipments.find(
    (item) =>
      item &&
      Boolean(item.isCustom) &&
      typeof item.id === 'string' &&
      item.id.trim() === normalizedId &&
      typeof item.name === 'string' &&
      item.name.trim().length > 0
  );

  if (customMatch) {
    return {
      id: customMatch.id.trim(),
      name: customMatch.name.trim(),
      category: customMatch.category,
      isCustom: true,
      isSelectedInRecord: customMatch.isSelected !== false,
    };
  }

  return null;
}

/**
 * Obtém e valida todas as alternativas personalizadas explicitamente vinculadas a um exercício.
 *
 * Uma alternativa personalizada só é aceita quando:
 * 1. Possui vínculo explícito com o exercício (via `customEquipments` ou `explicitCustomCompatibilityMap`).
 * 2. Contém pelo menos um equipamento personalizado efetivamente existente e cadastrado em `customEquipments`.
 * 3. TODOS os IDs da alternativa existem e estão cadastrados (rejeitando qualquer alternativa
 *    que contenha IDs inexistentes, removidos ou não cadastrados).
 */
export function getValidatedCustomAlternativesForExercise(
  exerciseId: string,
  customEquipments: GymEquipmentItem[] = [],
  explicitCustomCompatibilityMap: ExplicitCustomCompatibilityMap = {}
): InternalResolvedEquipment[][] {
  const fromCustomItems = buildExplicitCustomCompatibilityMap(customEquipments)[exerciseId] || [];
  const fromExplicitMap = explicitCustomCompatibilityMap[exerciseId] || [];

  const candidateAlternatives = [
    ...normalizeExplicitCustomAlternatives(fromCustomItems),
    ...normalizeExplicitCustomAlternatives(fromExplicitMap),
  ];

  const validated: InternalResolvedEquipment[][] = [];
  const seenKeys = new Set<string>();

  for (const alt of candidateAlternatives) {
    if (!Array.isArray(alt) || alt.length === 0) continue;

    // Deduplicar IDs dentro da mesma alternativa preservando a ordem
    const uniqueIdsInAlt = Array.from(new Set(alt));
    const canonicalKey = uniqueIdsInAlt.join('+');
    if (seenKeys.has(canonicalKey)) continue;

    const resolvedItems: InternalResolvedEquipment[] = [];
    let allExist = true;
    let hasAtLeastOneCustom = false;

    for (const eqId of uniqueIdsInAlt) {
      const resolved = resolveRegisteredEquipmentById(eqId, customEquipments);
      if (!resolved) {
        allExist = false;
        break;
      }
      if (resolved.isCustom) {
        hasAtLeastOneCustom = true;
      }
      resolvedItems.push(resolved);
    }

    if (allExist && hasAtLeastOneCustom && resolvedItems.length > 0) {
      seenKeys.add(canonicalKey);
      validated.push(resolvedItems);
    }
  }

  return validated;
}

/**
 * Resolve os objetos de equipamentos compatíveis com um exercício.
 *
 * Regras estritas:
 * - Equipamentos personalizados aparecem somente quando existir vínculo explícito E
 *   o equipamento personalizado estiver efetivamente cadastrado em `customEquipments`.
 * - Vínculos para IDs inexistentes, removidos ou não cadastrados são rejeitados.
 * - Jamais associa equipamentos personalizados apenas por semelhança de nome ou categoria.
 */
export function resolveCompatibleEquipmentsForExercise(
  exercise: ExerciseItem,
  customEquipments: GymEquipmentItem[] = [],
  explicitCustomCompatibilityMap: ExplicitCustomCompatibilityMap = {}
): ResolvedCompatibleEquipment[] {
  const result: ResolvedCompatibleEquipment[] = [];
  const seenIds = new Set<string>();

  // 1. Equipamentos padrão listados em exercise.compatibleEquipmentIds
  for (const eqId of exercise.compatibleEquipmentIds) {
    if (seenIds.has(eqId)) continue;

    const resolved = resolveRegisteredEquipmentById(eqId, customEquipments);
    if (resolved) {
      seenIds.add(resolved.id);
      result.push({
        id: resolved.id,
        name: resolved.name,
        category: resolved.category,
        isCustom: resolved.isCustom,
      });
    }
  }

  // 2. Equipamentos personalizados com vínculo explícito validado contra customEquipments
  const validatedCustomAlts = getValidatedCustomAlternativesForExercise(
    exercise.id,
    customEquipments,
    explicitCustomCompatibilityMap
  );
  for (const alt of validatedCustomAlts) {
    for (const item of alt) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      result.push({
        id: item.id,
        name: item.name,
        category: item.category,
        isCustom: item.isCustom,
      });
    }
  }

  return result;
}

export interface ResolvedEquipmentAlternative {
  index: number;
  items: Array<
    ResolvedCompatibleEquipment & {
      isSelectedInGym: boolean;
    }
  >;
  isSatisfiedInGym: boolean;
  isCustomAlternative: boolean;
  label: string;
}

/**
 * Resolve as alternativas de execução (`equipmentAlternatives`) de um exercício,
 * indicando claramente quais equipamentos são obrigatórios em conjunto (AND) dentro
 * de cada alternativa e quais alternativas estão completas na academia do usuário.
 *
 * Rejeita vínculos personalizados para IDs inexistentes, removidos ou não cadastrados,
 * e nunca utiliza o próprio ID como nome de equipamento.
 */
export function resolveEquipmentAlternativesForExercise(
  exercise: ExerciseItem,
  customEquipments: GymEquipmentItem[] = [],
  selectedEquipmentIds: Set<string> = new Set<string>(),
  explicitCustomCompatibilityMap: ExplicitCustomCompatibilityMap = {}
): ResolvedEquipmentAlternative[] {
  const resolvedAlternatives: ResolvedEquipmentAlternative[] = [];
  const rawAlternatives =
    Array.isArray(exercise.equipmentAlternatives) &&
    exercise.equipmentAlternatives.length > 0
      ? exercise.equipmentAlternatives
      : exercise.compatibleEquipmentIds.map((id) => [id]);

  let altIndex = 1;

  for (const alt of rawAlternatives) {
    if (!Array.isArray(alt) || alt.length === 0) continue;
    const items: Array<ResolvedCompatibleEquipment & { isSelectedInGym: boolean }> = [];
    let allResolved = true;

    for (const eqId of alt) {
      const resolved = resolveRegisteredEquipmentById(eqId, customEquipments);
      if (!resolved) {
        allResolved = false;
        break;
      }
      const isSelected =
        selectedEquipmentIds.has(resolved.id) && resolved.isSelectedInRecord;
      items.push({
        id: resolved.id,
        name: resolved.name,
        category: resolved.category,
        isCustom: resolved.isCustom,
        isSelectedInGym: isSelected,
      });
    }

    if (allResolved && items.length > 0) {
      resolvedAlternatives.push({
        index: altIndex++,
        items,
        isSatisfiedInGym: items.every((item) => item.isSelectedInGym),
        isCustomAlternative: items.some((item) => item.isCustom),
        label: items.map((item) => item.name).join(' + '),
      });
    }
  }

  // Alternativas personalizadas validadas (exigem equipamento cadastrado + vínculo explícito)
  const validatedCustomAlts = getValidatedCustomAlternativesForExercise(
    exercise.id,
    customEquipments,
    explicitCustomCompatibilityMap
  );
  for (const customAlt of validatedCustomAlts) {
    const items = customAlt.map((resolved) => ({
      id: resolved.id,
      name: resolved.name,
      category: resolved.category,
      isCustom: resolved.isCustom,
      isSelectedInGym:
        selectedEquipmentIds.has(resolved.id) && resolved.isSelectedInRecord,
    }));

    if (items.length > 0) {
      resolvedAlternatives.push({
        index: altIndex++,
        items,
        isSatisfiedInGym: items.every((item) => item.isSelectedInGym),
        isCustomAlternative: true,
        label: items.map((item) => item.name).join(' + '),
      });
    }
  }

  return resolvedAlternatives;
}

/**
 * Formata um resumo legível das combinações e alternativas de equipamentos para exibição nos cartões
 * da biblioteca (usando " + " para itens obrigatórios em conjunto e " ou " entre alternativas),
 * evitando sugerir que um único item complementar isolado é suficiente.
 */
export function formatEquipmentAlternativesSummary(
  exercise: ExerciseItem,
  customEquipments: GymEquipmentItem[] = [],
  selectedEquipmentIds: Set<string> = new Set<string>(),
  explicitCustomCompatibilityMap: ExplicitCustomCompatibilityMap = {}
): string {
  const alternatives = resolveEquipmentAlternativesForExercise(
    exercise,
    customEquipments,
    selectedEquipmentIds,
    explicitCustomCompatibilityMap
  );

  const labels = alternatives.map((alt) => alt.label);
  if (exercise.canExecuteWithoutEquipment) {
    if (labels.length > 0) {
      return `Livre no solo (peso corporal) ou ${labels.join(' ou ')}`;
    }
    return 'Livre no solo (peso corporal)';
  }

  if (labels.length > 0) {
    return labels.join(' ou ');
  }

  return 'Sem equipamento associado';
}

/**
 * Verifica se um exercício está efetivamente disponível na academia do usuário.
 *
 * Regra unificada:
 * 1. Exercícios que realmente podem ser executados sem equipamentos obrigatórios no solo
 *    (`exercise.canExecuteWithoutEquipment === true`) estão sempre disponíveis.
 *    Nota: `isBodyweight` sozinho NÃO torna o exercício disponível (ex.: barra fixa exige barra ou Graviton).
 * 2. Um exercício com equipamentos está disponível quando PELO MENOS UMA alternativa completa
 *    de `exercise.equipmentAlternatives` possui TODOS os seus equipamentos selecionados (AND interno, OR externo).
 * 3. Uma alternativa personalizada somente habilita o exercício quando:
 *    - O equipamento personalizado existir e estiver cadastrado em `customEquipments`;
 *    - Existir vínculo explícito com o exercício;
 *    - O equipamento personalizado estiver efetivamente selecionado na academia (`selectedEquipmentIds` e `isSelected !== false`);
 *    - Todos os equipamentos obrigatórios da alternativa estiverem selecionados (quando houver combinação).
 */
export function isExerciseCompatibleWithGym(
  exercise: ExerciseItem,
  selectedEquipmentIds: Set<string>,
  explicitCustomCompatibilityMap: ExplicitCustomCompatibilityMap = {},
  customEquipments: GymEquipmentItem[] = []
): boolean {
  if (exercise.canExecuteWithoutEquipment === true) {
    return true;
  }

  const alternatives =
    Array.isArray(exercise.equipmentAlternatives) &&
    exercise.equipmentAlternatives.length > 0
      ? exercise.equipmentAlternatives
      : [];

  for (const alt of alternatives) {
    if (
      Array.isArray(alt) &&
      alt.length > 0 &&
      alt.every((eqId) => {
        const resolved = resolveRegisteredEquipmentById(eqId, customEquipments);
        return (
          resolved !== null &&
          resolved.isSelectedInRecord &&
          selectedEquipmentIds.has(resolved.id)
        );
      })
    ) {
      return true;
    }
  }

  const validatedCustomAlts = getValidatedCustomAlternativesForExercise(
    exercise.id,
    customEquipments,
    explicitCustomCompatibilityMap
  );
  for (const customAlt of validatedCustomAlts) {
    if (
      customAlt.length > 0 &&
      customAlt.every(
        (resolved) =>
          resolved.isSelectedInRecord && selectedEquipmentIds.has(resolved.id)
      )
    ) {
      return true;
    }
  }

  return false;
}

export interface FilterExercisesOptions {
  searchQuery?: string;
  muscleGroup?: 'all' | MuscleGroupId;
  onlyAvailableInGym?: boolean;
  selectedEquipmentIds?: Set<string>;
  customEquipments?: GymEquipmentItem[];
  explicitCustomCompatibilityMap?: ExplicitCustomCompatibilityMap;
}

/**
 * Filtra de forma determinística a biblioteca de exercícios por nome, grupo muscular
 * e disponibilidade na academia do usuário (usando a regra unificada `isExerciseCompatibleWithGym`).
 */
export function filterExercisesCatalog(
  exercises: readonly ExerciseItem[],
  options: FilterExercisesOptions = {}
): ExerciseItem[] {
  const {
    searchQuery = '',
    muscleGroup = 'all',
    onlyAvailableInGym = false,
    selectedEquipmentIds = new Set<string>(),
    customEquipments = [],
    explicitCustomCompatibilityMap = {},
  } = options;

  const normalizedQuery = normalizeExerciseSearchText(searchQuery);

  return exercises.filter((exercise) => {
    // 1. Filtro por grupo muscular principal
    if (muscleGroup !== 'all' && exercise.primaryMuscleGroup !== muscleGroup) {
      return false;
    }

    // 2. Filtro por nome do exercício (case e accent insensitive)
    if (normalizedQuery) {
      const normalizedName = normalizeExerciseSearchText(exercise.name);
      if (!normalizedName.includes(normalizedQuery)) {
        return false;
      }
    }

    // 3. Filtro opcional por equipamentos disponíveis na academia
    if (onlyAvailableInGym) {
      if (
        !isExerciseCompatibleWithGym(
          exercise,
          selectedEquipmentIds,
          explicitCustomCompatibilityMap,
          customEquipments
        )
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Valida a integridade estrutural e biomecânica de um registro de exercício,
 * incluindo a consistência entre `compatibleEquipmentIds` e `equipmentAlternatives`.
 */
export function validateExerciseCatalogEntry(
  exercise: ExerciseItem,
  validCatalogEquipmentIds: Set<string> = new Set(
    DEFAULT_EQUIPMENTS_CATALOG.map((item) => item.id)
  )
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!exercise.id || !exercise.id.trim().startsWith('ex_')) {
    errors.push(`ID inválido ou fora do padrão 'ex_*': "${exercise.id}"`);
  }

  if (!exercise.name || exercise.name.trim().length < 3) {
    errors.push(`Nome inválido para o exercício "${exercise.id}".`);
  }

  if (!ORDERED_MUSCLE_GROUPS.includes(exercise.primaryMuscleGroup)) {
    errors.push(
      `Grupo muscular principal inválido ("${exercise.primaryMuscleGroup}") em "${exercise.id}".`
    );
  }

  if (!Array.isArray(exercise.secondaryMuscleGroups)) {
    errors.push(`secondaryMuscleGroups deve ser array em "${exercise.id}".`);
  } else {
    for (const sec of exercise.secondaryMuscleGroups) {
      if (!ORDERED_MUSCLE_GROUPS.includes(sec)) {
        errors.push(`Grupo muscular secundário inválido ("${sec}") em "${exercise.id}".`);
      }
      if (sec === exercise.primaryMuscleGroup) {
        errors.push(
          `Grupo secundário ("${sec}") duplicado com o principal em "${exercise.id}".`
        );
      }
    }
  }

  const compatibleSet = new Set<string>();
  if (
    !Array.isArray(exercise.compatibleEquipmentIds) ||
    (exercise.compatibleEquipmentIds.length === 0 && !exercise.canExecuteWithoutEquipment)
  ) {
    errors.push(
      `Exercício "${exercise.id}" deve possuir ao menos um equipamento compatível ou permitir execução sem equipamento.`
    );
  } else {
    for (const eqId of exercise.compatibleEquipmentIds) {
      if (!validCatalogEquipmentIds.has(eqId)) {
        errors.push(
          `Referência a equipamento inexistente ("${eqId}") no exercício "${exercise.id}".`
        );
      }
      if (compatibleSet.has(eqId)) {
        errors.push(`Equipamento duplicado ("${eqId}") no exercício "${exercise.id}".`);
      }
      compatibleSet.add(eqId);
    }
  }

  if (
    !Array.isArray(exercise.equipmentAlternatives) ||
    (exercise.equipmentAlternatives.length === 0 && !exercise.canExecuteWithoutEquipment)
  ) {
    errors.push(
      `Exercício "${exercise.id}" deve definir equipmentAlternatives válidas.`
    );
  } else if (Array.isArray(exercise.equipmentAlternatives)) {
    const usedInAlternatives = new Set<string>();
    for (const alt of exercise.equipmentAlternatives) {
      if (!Array.isArray(alt) || alt.length === 0) {
        errors.push(
          `Alternativa de equipamento vazia em "${exercise.id}".`
        );
        continue;
      }
      for (const eqId of alt) {
        if (!validCatalogEquipmentIds.has(eqId)) {
          errors.push(
            `Equipamento inexistente ("${eqId}") em equipmentAlternatives de "${exercise.id}".`
          );
        }
        if (!compatibleSet.has(eqId)) {
          errors.push(
            `Equipamento "${eqId}" presente em equipmentAlternatives mas ausente de compatibleEquipmentIds em "${exercise.id}".`
          );
        }
        usedInAlternatives.add(eqId);
      }
    }

    for (const eqId of compatibleSet) {
      if (!usedInAlternatives.has(eqId)) {
        errors.push(
          `Equipamento "${eqId}" listado em compatibleEquipmentIds não participa de nenhuma alternativa em "${exercise.id}".`
        );
      }
    }
  }

  if (!exercise.shortDescription || exercise.shortDescription.trim().length < 20) {
    errors.push(`Descrição breve ausente ou insuficiente em "${exercise.id}".`);
  }

  if (!exercise.initialPosition || exercise.initialPosition.trim().length < 20) {
    errors.push(`Posição inicial ausente ou insuficiente em "${exercise.id}".`);
  }

  if (
    !Array.isArray(exercise.executionSteps) ||
    exercise.executionSteps.length < 3 ||
    exercise.executionSteps.some((step) => !step || step.trim().length < 10)
  ) {
    errors.push(`Passos de execução insuficientes em "${exercise.id}".`);
  }

  if (
    !Array.isArray(exercise.commonMistakes) ||
    exercise.commonMistakes.length < 2 ||
    exercise.commonMistakes.some((err) => !err || err.trim().length < 10)
  ) {
    errors.push(`Erros comuns insuficientes em "${exercise.id}".`);
  }

  if (
    !Array.isArray(exercise.safetyTips) ||
    exercise.safetyTips.length < 1 ||
    exercise.safetyTips.some((tip) => !tip || tip.trim().length < 10)
  ) {
    errors.push(`Cuidados importantes insuficientes em "${exercise.id}".`);
  }

  if (exercise.externalVideoUrl !== undefined) {
    const videoCheck = validateExternalVideoUrl(exercise.externalVideoUrl);
    if (!videoCheck.valid) {
      errors.push(
        `URL de vídeo externo inválida em "${exercise.id}": ${videoCheck.reason}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Retorna a contagem de exercícios por grupo muscular.
 */
export function getExerciseCountByMuscleGroup(
  exercises: readonly ExerciseItem[] = DEFAULT_EXERCISES_CATALOG
): Record<MuscleGroupId, number> {
  const counts = {} as Record<MuscleGroupId, number>;
  for (const group of ORDERED_MUSCLE_GROUPS) {
    counts[group] = 0;
  }
  for (const ex of exercises) {
    if (ex.primaryMuscleGroup in counts) {
      counts[ex.primaryMuscleGroup] += 1;
    }
  }
  return counts;
}

export { MUSCLE_GROUP_LABELS };
