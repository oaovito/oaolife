# Handoff — 26/11/2026

## Concluído
- Séries integrais do plano, exceto 55% nas semanas 4 e 8 (`setPolicy='full-deload'`), com seletor em Plano
  (full / full-deload / periodized). Migração ajusta sessões abertas de hoje em diante.
- Plano alimentar de 21/11/2026 com nutrientes completos (TBCA/TACO); divergência
  plano × meta exibida; meta padrão 2.525 → 2.000 kcal (só quando era o padrão antigo).
- Cardio rígido: seg, ter, qui, sex, dom × 60 min = 300 min/semana (quarta e sábado sem); velocidade mínima só na esteira.
- Plano alimentar de 26/11/2026 (sem azeite/legumes; aveia 30 g nas líquidas): 2.355 kcal / 230 g P.
- Relatório semanal (Evolução → Relatórios), visão Situação, pesagem de domingo em Hoje.
- Registro hormonal seg/qui pré-preenchido, exceções em Ajustes; Hoje oculta blocos fora do programa.
- Alongamento para hipercifose diário (todos os dias); tutorial de instalação no iPhone removido de Ajustes.
- Regra suprema no topo do CLAUDE.md: planejamento militar, regras rígidas.
- Novo ícone (chevrons + cantoneiras) em `public/icon.svg` e PNGs; o iPhone só troca o ícone ao readicionar à Tela de Início.
- Migração 9 (`src/domain/migrations.ts`), Dexie v9 com tabela `snapshots`, cópia
  `pre-v9` antes de migrar e `restoreSnapshot` para rollback.
- Redesign Military Command System (`src/command.css`, fontes locais) e novo Hoje.
- Documentação: CLAUDE.md, docs/*.
- Testes: 164 unitários; 87 cenários Playwright (iPhone + desktop Chromium) passando.

## Decisões tomadas
- A "falha das 2 séries" era o fator de volume semanal, não um dado corrompido.
  Padrão escolhido pelo proprietário (26/11/2026): integrais, exceto recuperação; RIR periodizado. Pergunta respondida pelo
  proprietário com as três opções; a escolha pode ser trocada em Plano sem perda de dados.
- Alerta de divergência calórica fica na página de Alimentação (permanente), não em Hoje.
- Hoje mantém o requisito anterior de caber sem rolagem no iPhone 16; em telas menores rola.

## Pendente / próxima ação obrigatória
1. Validar em iPhone físico (Safari e PWA instalada): arraste lateral, áreas seguras, fontes.
2. Acompanhar a CI (WebKit) e o deploy Vercel após cada merge.

## Arquivos principais alterados
`src/domain/{training,migrations,cardio,daily,model,nutrition}.ts`,
`src/domain/nutritionReferences.json`, `src/storage/{db,backup}.ts`,
`src/ui/{Home,FourMeals,Water,DailyBlocks,Plan,MobilityTimer,shared,CompletionFeedback}.tsx`,
`src/App.tsx`, `src/command.css`, `src/main.tsx`, `e2e/*`, `src/test/v9-regression.test.ts`.
