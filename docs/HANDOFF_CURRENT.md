# Handoff — 26/11/2026

## Concluído
- Séries integrais do plano em todas as semanas (`setPolicy='full'`), com seletor em Plano
  (full / full-deload / periodized). Migração ajusta sessões abertas de hoje em diante.
- Plano alimentar de 21/11/2026 com nutrientes completos (TBCA/TACO); divergência
  plano × meta exibida; meta padrão 2.525 → 2.000 kcal (só quando era o padrão antigo).
- Cardio semanal flexível; velocidade mínima só na esteira.
- Migração 9 (`src/domain/migrations.ts`), Dexie v9 com tabela `snapshots`, cópia
  `pre-v9` antes de migrar e `restoreSnapshot` para rollback.
- Redesign Military Command System (`src/command.css`, fontes locais) e novo Hoje.
- Documentação: CLAUDE.md, docs/*.
- Testes: 164 unitários; 87 cenários Playwright (iPhone + desktop Chromium) passando.

## Decisões tomadas
- A "falha das 2 séries" era o fator de volume semanal, não um dado corrompido.
  Escolha padrão: séries integrais; RIR continua periodizado. Pergunta enviada ao
  proprietário com as três opções; a escolha pode ser trocada em Plano sem perda de dados.
- Alerta de divergência calórica fica na página de Alimentação (permanente), não em Hoje.
- Hoje mantém o requisito anterior de caber sem rolagem no iPhone 16; em telas menores rola.

## Pendente / próxima ação obrigatória
1. Confirmar a resposta do proprietário sobre a política de séries (se escolher outra,
   alterar o padrão em `emptyData`/`model.ts` ou só a configuração dele em Plano).
2. Validar em iPhone físico (Safari e PWA instalada): arraste lateral, áreas seguras, fontes.
3. Acompanhar a CI (WebKit) e o deploy Vercel após cada merge.

## Arquivos principais alterados
`src/domain/{training,migrations,cardio,daily,model,nutrition}.ts`,
`src/domain/nutritionReferences.json`, `src/storage/{db,backup}.ts`,
`src/ui/{Home,FourMeals,Water,DailyBlocks,Plan,MobilityTimer,shared,CompletionFeedback}.tsx`,
`src/App.tsx`, `src/command.css`, `src/main.tsx`, `e2e/*`, `src/test/v9-regression.test.ts`.
