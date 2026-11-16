# TREINO CERTO — Bloco 01 (Peito e Costas)

## Implementação aplicada nesta revisão

- Catálogo expandido de 57 para **79 exercícios**.
- Inclusão de **10 exercícios de Peito** e **12 de Costas**.
- Distribuição atual: Peito 18; Costas 20; demais grupos preservados (41 exercícios).
- Cada novo registro contém ID estável, grupo principal e secundários, equipamentos oficiais, alternativas de equipamento, descrição, posição inicial, três etapas de execução, respiração, erros comuns e cuidados.
- Adicionadas **22 imagens WebP locais** e respectivos mapeamentos no componente `ExerciseIllustration`.
- O catálogo e as imagens permanecem locais, sem dependência de URLs externas para exibição.
- Atualizadas as descrições de testes que ainda citavam 48 ilustrações.

## Verificações executadas

- Sintaxe TypeScript/transpilação dos dois arquivos alterados: sem erros de sintaxe.
- Catálogo: 79 IDs únicos; nenhuma duplicidade.
- Mapeamento: 79 exercícios / 79 entradas de imagem; nenhum exercício sem mapeamento.
- Arquivos WebP: 79 arquivos com correspondência pelo ID; nenhum arquivo ausente.
- Equipamentos dos 22 novos exercícios: todos os IDs referenciados existem no catálogo oficial.
- Estrutura obrigatória dos 22 novos registros: campos essenciais presentes.

## Limitação de validação

Não foi possível executar `npm run lint`, `npm test` ou `npm run build`: o pacote não contém `node_modules` e a instalação offline falhou porque as dependências não estão disponíveis no cache local. Portanto, esta é uma atualização de código e ativos com verificações estáticas; não é apresentada como build de produção validado.

## Próxima etapa

Bloco 02 — Ombros, Bíceps e Tríceps (+30 exercícios), após a validação de ambiente do projeto.
