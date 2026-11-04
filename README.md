<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/032ad4bf-d428-4003-aea9-1f03f3d9dbfa

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Atualização visual incremental — CP03 (novembro/2026)
- Incluída a primeira demonstração 3D realista individual: `ex_peito_supino_inclinado_halteres`.
- O recurso é local (`public/images/exercises/*.webp`) e permanece disponível offline; o padrão de pré-cache do Workbox inclui `.webp`.
- A demonstração realista é exibida na tela de detalhes do exercício. Miniaturas e os outros 35 exercícios mantêm o renderizador anterior até que cada imagem individual seja produzida e revisada.
- Não foram alterados IDs, nomes, instruções, grupos musculares, compatibilidade de equipamentos, IndexedDB ou dados do usuário.
- A imagem foi recortada para conter somente as duas posições demonstrativas; textos de séries/repetições gerados automaticamente não foram incorporados como prescrição.


## Atualização visual incremental 01.2
A imagem WebP do exercício `ex_peito_supino_inclinado_halteres` agora é utilizada em todos os tamanhos do componente `ExerciseIllustration` (miniaturas e tela de detalhes). A renderização usa `object-contain` para preservar a composição completa da imagem, sem cortes. Os outros 35 exercícios continuam usando suas ilustrações SVG ou placeholders nominais atuais. Nenhum ID, instrução, grupo muscular, compatibilidade ou banco local foi alterado.
