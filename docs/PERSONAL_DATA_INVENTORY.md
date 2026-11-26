# Inventário de dados pessoais no repositório

O repositório `oaovito/oaolife` é **público**. Por decisão do proprietário (26/11/2026), continua
público por enquanto; este inventário marca tudo o que é pessoal para migração futura a um
repositório privado. No código, cada ponto está marcado com o comentário `// DADO PESSOAL:`
(`grep -rn "DADO PESSOAL" src`).

## 1. Registros do dia a dia (ramo `dados`)

| O quê | Onde | Proteção atual |
|---|---|---|
| Todos os registros (treinos, refeições, água, cardio, postura, peso, medidas, fotos, registros hormonais, auditoria) | ramo `dados`, pasta `sync/<hash>/` | AES-256-GCM no aparelho; nomes de arquivo opacos; chave só no código de recuperação |

Metadados visíveis: quantidade e tamanho dos arquivos, horários dos commits. Migração: copiar o
ramo `dados` para o repositório privado e apontar `GITHUB_DATA_REPO` para ele (sem mudança no app).

## 2. Configuração individual no código-fonte (texto aberto)

| Assunto | Arquivo |
|---|---|
| Protocolo hormonal informado (substâncias, doses, dias) | `src/domain/hormonal.ts` (`INFORMED_HORMONAL_PLAN`, `LEGACY_HORMONAL_PLAN`) |
| Perfil padrão (idade, altura, peso inicial) e metas (kcal, proteína, água) | `src/domain/daily.ts` (`emptyData`) |
| Plano alimentar individual | `src/domain/nutrition.ts` (`FOUR_MEAL_PLAN`, `FOUR_MEAL_PLAN_2111`), `src/domain/plan.ts` (`MEALS`, `LEGACY_MEALS`) |
| Plano de treino individual | `src/domain/plan.ts` (`ORIGINAL_PLAN`) |
| Condição postural (hipercifose) e protocolo | `src/domain/mobility.ts` (`INFORMED_MOBILITY`) |
| Prescrição de cardio | `src/domain/cardio.ts` |

## 3. Documentação (texto aberto)

| Assunto | Arquivo |
|---|---|
| Protocolo hormonal | `HORMONAL.md`, `CLAUDE.md`, `docs/PRODUCT_SPEC.md`, `docs/HANDOFF_CURRENT.md` |
| Plano alimentar, metas e totais | `NUTRITION.md`, `CLAUDE.md`, `docs/PRODUCT_SPEC.md` |
| Plano de treino | `TRAINING_PLAN.md` |
| Postura (hipercifose) | `MOBILITY.md`, `docs/PRODUCT_SPEC.md` |
| Rotina, objetivos e histórico de decisões | `context.md`, `docs/PROJECT_STATUS.md`, `README.md` |

## 4. Testes (valores de exemplo que espelham o plano)

`src/test/*.test.ts` e `e2e/*.spec.ts` usam as doses, o plano alimentar e o perfil acima.

## Migração sugerida

1. Criar repositório privado e mover para ele os itens das seções 2–4 (o app passa a importar a
   configuração individual de um pacote privado ou de um arquivo de configuração não versionado).
2. Copiar o ramo `dados` e trocar `GITHUB_DATA_REPO`.
3. Reescrever o histórico do repositório público só com autorização explícita do proprietário.
