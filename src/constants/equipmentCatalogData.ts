/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Descrições funcionais detalhadas para facilitar o reconhecimento visual de cada
 * um dos 54 equipamentos padrão em academias de qualquer porte ou padrão de fabricação.
 */
export const EQUIPMENT_DESCRIPTIONS: Record<string, string> = {
  // --- Peito (7 equipamentos) ---
  std_chest_supino_reto_barra:
    'Banco reto estofado com dois suportes verticais metálicos na cabeceira para repouso de barra longa. O praticante deita na horizontal com os pés firmes no chão para empurrar a barra verticalmente sobre o peitoral.',

  std_chest_supino_inclinado_barra:
    'Banco acolchoado inclinado em ângulo fixo aproximado de 30° a 45°, acompanhado de suporte vertical para barra de supino. Destinado ao trabalho da porção clavicular (superior) do peitoral maior.',

  std_chest_supino_declinado:
    'Banco com declive invertido (cabeça mais baixa que o quadril) e apoios de pernas/tornozelos para retenção e segurança. Utilizado para ativação da porção inferior (costal) do peitoral.',

  std_chest_supino_maquina:
    'Aparelho guiado com assento vertical e encosto para as costas, dotado de duas manoplas ou braços articulados à frente do tronco e torre de placas de peso selecionáveis por pino.',

  std_chest_peck_deck:
    'Também conhecido como voador peitoral ou fly machine. Possui assento vertical e duas hastes com almofadas para os antebraços ou manoplas verticais, onde o praticante aproxima os braços à frente em movimento de abraço.',

  std_chest_crossover:
    'Grande estrutura metálica em arco ou pórtico com duas torres de polias opostas e ajustáveis em altura, interligadas por cabos e manoplas em D. Permite cruzamento de braços em diversos ângulos.',

  std_chest_crucifixo_maquina:
    'Máquina com alavancas independentes de arco amplo e manoplas anatômicas, projetada para reproduzir o movimento de abertura e fechamento de braços com resistência contínua sobre o peitoral.',

  // --- Costas (7 equipamentos) ---
  std_back_puxada_alta:
    'Também conhecida como lat pulldown. Composta por torre de polia alta superior, barra reta ou curvada pendente por cabo, assento e roletes acolchoados para prender as coxas do praticante.',

  std_back_remada_baixa:
    'Estrutura com banco horizontal baixo, apoio para os pés na frente e polia posicionada ao nível da canela/quadril com puxador triangular ou barra para puxadas em direção ao abdômen.',

  std_back_remada_articulada:
    'Equipamento com apoio peitoral frontal estofado e duas alavancas convergentes articuladas (com anilhas ou torre de peso), permitindo puxada dorsal com estabilização completa da coluna.',

  std_back_remada_cavalinho:
    'Base de apoio inclinado com suporte fixo para a extremidade de uma barra no chão (landmine) ou máquina com apoio de pés antiderrapante e pegada em V para remadas pesadas.',

  std_back_pulldown:
    'Estação de polia alta equipada com barra reta ou corda, onde o atleta permanece em pé e realiza a descida dos braços estendidos até a altura da cintura para ativação pura do grande dorsal.',

  std_back_barra_fixa:
    'Estrutura tubular de pegada superior fixada na parede ou integrada a racks e estações multifuncionais, permitindo elevações corporais com o próprio peso corporal.',

  std_back_graviton:
    'Máquina de tração assistida com plataforma móvel sob os joelhos ou pés conectada a contrapesos ajustáveis, auxiliando na execução de barras fixas e paralelas.',

  // --- Pernas e glúteos (14 equipamentos) ---
  std_legs_leg_press_45:
    'Grande trenó metálico inclinado em 45 graus que desliza sobre trilhos resistentes, com plataforma ampla para os pés e encosto reclinado para as costas. Movimento de extensão dos membros inferiores.',

  std_legs_leg_press_horizontal:
    'Aparelho de empurrar horizontal com assento nivelado e torre de peso com placas seletoras, onde o usuário empurra a plataforma para frente sem a inclinação vertical do modelo de 45°.',

  std_legs_cadeira_extensora:
    'Assento ergonômico com encosto para as costas e rolete acolchoado posicionado na frente das canelas, próximo aos tornozelos. Foco no isolamento mecânico do quadríceps.',

  std_legs_mesa_flexora:
    'Banco horizontal estofado onde o praticante deita de bruços (decúbito ventral) e flexiona as pernas trazendo o rolete acolchoado em direção aos glúteos. Foco nos isquiotibiais.',

  std_legs_cadeira_flexora:
    'Equipamento sentado onde o usuário prende as coxas sob almofadas e apoia a parte de trás dos calcanhares sobre o rolete móvel, flexionando os joelhos para baixo.',

  std_legs_cadeira_abdutora:
    'Assento onde as pernas ficam posicionadas com almofadas na parte externa dos joelhos/coxas. O exercício consiste em afastar as pernas lateralmente contra a carga para trabalho do glúteo médio e mínimo.',

  std_legs_cadeira_adutora:
    'Assento onde as almofadas ficam posicionadas na parte interna dos joelhos e coxas. O praticante aproxima as pernas unindo-as no centro para trabalhar a musculatura adutora.',

  std_legs_hack_squat:
    'Trenó inclinado guiado com apoio estofado para as costas e ombreiras acolchoadas para repousar sobre os ombros, proporcionando agachamento seguro com os pés posicionados na plataforma inferior.',

  std_legs_smith_machine:
    'Conhecido como máquina Smith ou agachamento guiado. Barra olímpica montada entre dois trilhos tubulares verticais ou ligeiramente inclinados, com pinos de travamento por rotação ao longo de toda a extensão.',

  std_legs_agachamento_livre_rack:
    'Gaiola ou torre aberta robusta de aço com suportes metálicos (J-cups) ajustáveis em múltiplos níveis de altura e barras de proteção laterais para execução de agachamentos com barra livre.',

  std_legs_panturrilha_sentada:
    'Banco pequeno com apoio dianteiro para apoiar as pontas dos pés em degrau de elevação e almofada de pressão ajustável repousando sobre os joelhos/coxas com alavanca de destrave.',

  std_legs_panturrilha_em_pe:
    'Máquina vertical com apoio para as pontas dos pés em degrau metálico e duas ombreiras acolchoadas posicionadas sobre os ombros para extensão dos tornozelos em posição ereta.',

  std_legs_glute_drive:
    'Banco especializado para elevação pélvica (hip thrust) com encosto articulado para as costas, plataforma ampla para os pés e cinto/barra acolchoada travável sobre a linha do quadril.',

  std_legs_maquina_gluteo:
    'Estação de coice de glúteo com almofada para apoio do tronco e braços ou cotovelos e braço mecânico giratório com pedal para empurrar o calcanhar para trás.',

  // --- Ombros (5 equipamentos) ---
  std_shoulders_desenvolvimento_maquina:
    'Aparelho sentado com encosto vertical para a coluna e duas manoplas anatômicas erguidas acima da linha dos ombros, empurradas verticalmente para ativação dos deltoides.',

  std_shoulders_desenvolvimento_halteres:
    'Espaço do setor de pesos livres composto por banco com encosto em 90° e halteres emborrachados ou cromados para elevações controladas acima da cabeça.',

  std_shoulders_elevacao_lateral_maquina:
    'Aparelho com assento e encosto vertical onde o usuário acomoda a parte lateral dos braços contra roletes ou alavancas acolchoadas, elevando os cotovelos lateralmente.',

  std_shoulders_maquina_elevacao_lateral:
    'Máquina biomecânica com almofadas de apoio externo para os braços que isola o deltoide lateral em movimento de arco com trajetória fluida e carga constante.',

  std_shoulders_banco_desenvolvimento:
    'Banco robusto de encosto alto e vertical específico para exercícios de força para ombros, proporcionando estabilidade lombar durante impulsos com pesos livres.',

  // --- Bíceps e tríceps (5 equipamentos) ---
  std_arms_maquina_biceps:
    'Máquina guiada com almofada inclinada de apoio para os braços e manoplas articuladas conectadas a pesos, simulando rosca concentrada sem impulsos do tronco.',

  std_arms_banco_scott:
    'Também chamado de banco pregador. Estrutura com assento e rampa acolchoada inclinada em cerca de 45° à frente para repouso dos braços e suporte frontal para barra W ou barra reta.',

  std_arms_polia_triceps:
    'Coluna vertical de cabos com polia no ponto superior, onde são acopladas cordas trançadas ou barras curtas para o movimento de extensão dos cotovelos (pushdown).',

  std_arms_maquina_triceps:
    'Aparelho com assento vertical e duas manoplas laterais em que o atleta empurra os apoios para baixo estendendo os cotovelos (mergulho/dip guiado com carga selecionável).',

  std_arms_barras_puxadores_polia:
    'Conjunto de acessórios metálicos de treino que inclui barra reta com giro, barra V, barra curva W, corda dupla de nylon, puxadores estribo e triângulos para polia.',

  // --- Equipamentos gerais (11 equipamentos) ---
  std_general_halteres:
    'Conjunto graduado de pesos de mão (de 1 kg até 40+ kg), dispostos em suportes longitudinais de dois ou três níveis na área de peso livre da academia.',

  std_general_barras_retas:
    'Barras sólidas de aço (olímpicas com 2,20m e 20kg ou convencionais de 1,20m a 1,80m) com pegadas ranhuradas e extremidades para colocação de anilhas com presilhas.',

  std_general_barras_w:
    'Barras de ferro com curvaturas anatômicas em formato ondulado (W), desenhadas para reduzir a tensão articular nos punhos durante roscas e extensões de tríceps.',

  std_general_anilhas:
    'Discos metálicos ou emborrachados com furo central (olímpico ou padrão) de pesos variados (1kg a 25kg) armazenados em pinos verticais ou suportes em árvore.',

  std_general_bancos_retos:
    'Bancos acolchoados horizontais de altura fixa e base de aço com sapatas antiderrapantes, ideais para apoios de peso livre, remadas unilaterais e abdominais.',

  std_general_bancos_regulaveis:
    'Bancos versáteis com encosto ajustável por pino metálico em múltiplos ângulos (plano, 30°, 45°, 60°, 75° e 90°), além de assento com inclinação regulável.',

  std_general_rack_agachamento:
    'Gaiola estrutural de aço tubular pesado para sustentação de cargas com travas de segurança ajustáveis para supino, desenvolvimento e agachamentos com segurança total.',

  std_general_polias_ajustaveis:
    'Estação de cabos (pulley funcional) com regulagem deslizante de altura em trilho numerado, permitindo puxar o cabo do chão até o teto em qualquer graduação.',

  std_general_colchonetes:
    'Almofadas de alta densidade revestidas em material impermeável higienizável para realização de exercícios de solo, pranchas abdominais e alongamentos.',

  std_general_kettlebells:
    'Pesos de ferro fundido em formato esférico com alça superior espessa, utilizados para movimentos balísticos, agachamentos sumô e condicionamento funcional.',

  std_general_elasticos_resistencia:
    'Faixas circulares de látex elástico (super bands e mini bands) com diferentes espessuras e tensões para aquecimentos articulares, ativação muscular e auxílio em barras.',

  // --- Cardio (5 equipamentos) ---
  std_cardio_esteira:
    'Equipamento ergonômico de caminhada e corrida com lona rotativa motorizada amortecida, painel digital multifunções, ajuste eletrônico de velocidade e inclinação e chave de segurança magnética.',

  std_cardio_bicicleta_ergometrica:
    'Bicicleta ergométrica com guidão anatômico, selim ajustável em altura e distância, resistência magnética suave e monitor para controle de cadência (RPM) e frequência cardíaca.',

  std_cardio_spinning:
    'Bicicleta de ciclismo indoor com roda de inércia frontal pesada, transmissão por corrente ou correia, pedais com firma-pé e botão giratório de resistência mecânica imediata.',

  std_cardio_eliptico:
    'Simulador de passada fluida com dois pedais articulados e alavancas verticais para os braços, proporcionando exercício aeróbico de baixo impacto articular em movimento elíptico.',

  std_cardio_simulador_escada:
    'Aparelho de alta intensidade aeróbica com degraus giratórios contínuos como uma escada rolante invertida, corrimãos laterais de segurança e painel com controle de velocidade dos degraus.',
};

/**
 * Retorna o texto explicativo oficial para reconhecimento do equipamento
 */
export function getEquipmentDescription(id: string, name?: string): string {
  if (EQUIPMENT_DESCRIPTIONS[id]) {
    return EQUIPMENT_DESCRIPTIONS[id];
  }
  return `Equipamento da categoria muscular para treino na academia. Verifique o modelo específico ou etiqueta de instruções do fabricante para posicionamento correto e ajustes de segurança.`;
}
