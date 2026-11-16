# TREINO CERTO — Bloco 04

## Escopo implementado
- Grupo Glúteos: 13 exercícios adicionados (3 existentes + 13 = 16).
- Grupo Panturrilhas: 7 exercícios adicionados (5 existentes + 7 = 12).
- Catálogo total: 156 exercícios (136 anteriores + 20 deste bloco).
- 20 novas imagens WebP locais adicionadas em `public/images/exercises/` e ligadas ao registro `REALISTIC_3D_EXERCISE_IMAGES`.
- IDs anteriores preservados; os novos registros possuem quatro passos, três erros comuns e duas recomendações de segurança.
- Referências de equipamentos verificadas contra o catálogo oficial; exercícios sem equipamento foram marcados explicitamente com `isBodyweight` e `canExecuteWithoutEquipment`.
- Testes CP03 ajustados para aceitar a expansão progressiva e acrescido teste de mapeamento dos 20 arquivos do Bloco 04.

## Verificações realizadas nesta entrega
- 156 registros no catálogo, 156 IDs únicos.
- Distribuição: Peito 18; Costas 20; Ombros 16; Bíceps 14; Tríceps 14; Quadríceps 20; Posterior de coxa 18; Glúteos 16; Panturrilhas 12; Abdômen/Core 5; Corpo inteiro 3.
- 156 chaves no mapa de imagens; nenhum exercício sem mapeamento e nenhum caminho de imagem ausente.
- 20 novas imagens WebP individuais, com arquivos acima de 5 KB.
- Sintaxe TypeScript/TSX verificada por transpilation diagnostics; sintaxe dos scripts de teste verificada com `node --check`.

## Limitação de validação
`npm test` e `npm run build` foram tentados, mas não puderam executar porque o pacote de trabalho não contém as dependências instaladas (`tsx: not found` e `vite: not found`). Portanto, esta entrega tem auditoria estática concluída, mas ainda requer testes automatizados e build em ambiente com dependências.
