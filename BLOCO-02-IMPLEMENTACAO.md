# TREINO CERTO — Bloco 02

## Escopo implementado
- 12 exercícios novos de Ombros
- 9 exercícios novos de Bíceps
- 9 exercícios novos de Tríceps
- Total: 30 exercícios adicionados ao catálogo anterior de 79 (109 no total)

## Integração visual
- 30 arquivos WebP individuais, 800×600, armazenados localmente em `public/images/exercises/`
- 30 novos mapeamentos no componente `ExerciseIllustration`
- Imagens locais, compatíveis com a estratégia offline do PWA

## Integridade estática verificada
- 109 IDs únicos no catálogo
- 109 chaves de mapeamento de ilustração
- 109 arquivos WebP correspondentes
- Nenhuma imagem ausente
- Equipamentos novos conferidos com o catálogo oficial

## Limitação da validação
O ambiente de trabalho não contém `node_modules` e não há dependências no cache offline. Por isso, não foi possível executar `npm test`, `npm run lint` ou `npm run build`. O pacote não deve ser tratado como build de produção validado até que esses comandos sejam executados em ambiente com dependências instaladas.
