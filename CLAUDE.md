# CLAUDE.md — diretrizes permanentes do oaolife

> **REGRA SUPREMA (proprietário, 26/11/2026):** o oaolife é um planejamento
> militar envolto em disciplina e regras rígidas. Prescrições têm dia, duração e
> quantidade fixos; cada dia se cumpre no próprio dia, sem compensação nem
> "como eu quiser". Toda decisão de produto, texto ou UX segue esta regra.

Claude Code tem a direção técnica, funcional e visual integral deste projeto
(CTO, engenharia, design, QA, segurança, publicação). Execute e valide; não
entregue apenas planos. Escreva para o proprietário em português, de forma
educada e concisa, sem listas longas de sugestões.

## Produto

Sistema pessoal de comando da rotina diária: musculação, alimentação,
hidratação, cardio, postura (hipercifose), registro hormonal e evolução
corporal. Deve transmitir disciplina, precisão e controle. Não é um app
genérico de academia, contador de calorias ou planilha.
Especificação: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md).

## Fontes canônicas (uma por assunto)

| Assunto | Fonte |
|---|---|
| Produto, objetivos, metas vigentes | docs/PRODUCT_SPEC.md |
| Identidade visual e componentes | docs/DESIGN_SYSTEM.md · `src/command.css` |
| Auditoria técnica e problemas | docs/TECHNICAL_AUDIT.md |
| Estado de cada módulo | docs/PROJECT_STATUS.md |
| Retomada da sessão atual | docs/HANDOFF_CURRENT.md |
| Plano de treino (exercícios, séries) | `src/domain/plan.ts` + TRAINING_PLAN.md |
| Plano alimentar e referências | `src/domain/nutrition.ts`, `nutritionReferences.json` + NUTRITION.md |
| Modelo de dados e migrações | `src/domain/model.ts`, `src/domain/migrations.ts` + DATA_MODEL.md |
| Publicação | DEPLOYMENT.md |
| Testes | TESTING.md |

`context.md` é histórico (não reabrir decisões dele sem checar as fontes acima).

## Arquitetura

React 19 + TypeScript + Vite 7 + Tailwind 4 (legado) + Dexie/IndexedDB + Zod.
Domínio puro em `src/domain/*` (sem React). UI em `src/ui/*`. Persistência em
`src/storage/db.ts` (transações com auditoria e outbox local). PWA via
vite-plugin-pwa. Sem backend: dados ficam no dispositivo; backup AES-GCM.
CSS: `styles.css` (legado) → `design-system.css` (tokens) → `command.css`
(camada visual canônica, carregada por último).

## Decisões vigentes (não regredir)

- **Plano alimentar de 21/11/2026**: 4 refeições (2 líquidas, 2 sólidas),
  quantidades fixas em `createNutrition`. Sem whey, feijão, banana, morango.
  Totais TACO/TBCA: ~2.637 kcal / ~237 g proteína. Meta solicitada ~2.000 kcal.
  A divergência é exibida; **nunca** alterar quantidades para "fechar" a meta.
- **Séries**: cada exercício exibe exatamente as séries do `ORIGINAL_PLAN`
  nas semanas comuns e 55% nas semanas 4 e 8 de recuperação
  (`settings.setPolicy='full-deload'`, padrão escolhido pelo proprietário em
  26/11/2026). Periodização define o RIR. Alternativas (`full`, `periodized`)
  só por escolha explícita em Plano.
  A causa do antigo "2 séries" era o fator de volume da semana 1 (75%).
- **Cardio (rígido)**: segunda, terça, quinta, sexta e domingo, **60 min** cada
  (5 × 60 = **300 min/semana**); quarta e sábado sem cardio. Cada sessão só
  conclui com a meta do próprio dia; minutos extras não compensam outro dia.
  Velocidade mínima 5,0 km/h só na esteira (`src/domain/cardio.ts`).
- **Hidratação**: meta configurável (padrão 4.000 ml; garrafa 500 ml = 8).
- **Postura**: hipercifose 4 × 60 s, 60 s de descanso, cronômetro por timestamp.
- **Refeições concluídas** saem da lista principal e ficam corrigíveis no histórico.
- **Fuso**: data civil do dispositivo (referência America/Sao_Paulo). Reset
  diário renova tarefas; nunca apaga histórico.
- **Hoje** cabe acima do menu no iPhone 16 (393×852, com áreas seguras).

## Regras de dados (absolutas)

1. Nunca apagar ou limpar armazenamento como solução.
2. Mudança de estrutura = nova versão de schema + migração idempotente em
   `src/domain/migrations.ts`, marcada em `adjustments`, testada.
3. Antes de migrar, `initialize` guarda cópia local em `db.snapshots`
   (ex.: `pre-v9`); `restoreSnapshot` faz rollback auditado.
4. Backups antigos continuam importáveis (formatos 2–9).
5. Não enviar dados pessoais/saúde a terceiros; sem telemetria.

## Direção visual

Military Command System: carbono, grafite, oliva, musgo, bege desértico,
branco osso; âmbar = atenção/em andamento; vermelho = erro/destrutivo; verde
sinal = progresso/concluído. Fundo com textura (granulação SVG + ripstop + trama).
Títulos Barlow Condensed; rótulos IBM Plex Mono; corpo fonte do sistema.
Números são protagonistas (tabulares). Ver docs/DESIGN_SYSTEM.md.

## Fluxo de desenvolvimento

1. Branch → commits → PR (corpo com atribuição do projeto) → CI → merge em
   `main` → Vercel publica produção automaticamente.
2. Validação obrigatória antes do merge:
   ```
   npm ci
   npm run check          # tsc + vitest
   npm run build
   npm audit --omit=dev --audit-level=moderate
   npm run test:e2e       # Playwright (Chromium iPhone/desktop + WebKit na CI)
   ```
   Em ambiente sem o Chromium do Playwright: `PW_CHROMIUM=/caminho/chrome npm run test:e2e`.
3. Inspeção visual real (Playwright, 393×852 e 1440×1000), inclusive tema claro.
4. Rollback: reverter o merge em `main` (Vercel republica) ou promover o
   deploy anterior na Vercel. Dados locais permanecem compatíveis (schema 9 lê 2–9).

## Qualidade

Sem regressões; teste de regressão para todo bug corrigido; contraste WCAG AA
(axe sem violações); alvos de toque ≥ 44 px; sem rolagem horizontal (320–430 px);
sem inventar métricas fisiológicas; estimativas rotuladas como tais.
Ao se aproximar do limite de contexto, atualize docs/HANDOFF_CURRENT.md.
