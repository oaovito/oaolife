# Schema 8 — quatro refeições e líquidos

Compatível com schemas 2–7. `daily.meals`/`mealTimes` admitem 4 ou 5 posições,
validadas contra a versão do snapshot. `four-meals-1` tem quatro snapshots e
metas `calorieGoal`/`proteinGoal`. Os demais formatos de nutrição ficam legíveis.
`daily.hydration` é nulo para registros antigos ou `{version:'liquids-1',target,
bottle,entries:[{id,at,ml}]}`. Os arrays antigos `water`/`waterTargets` são mantidos.
Configurações adicionadas: `hydrationTarget`, `bottleVolume`, `calorieGoal`,
`proteinGoal`. Migração transacional, auditada e idempotente; sem exclusões.

# Atualização 1.3.1 — schema 7

`TrainingCycle.end` opcional permite encerrar o ciclo anterior em 01/11/2026 sem apagar seus registros. O ciclo corrigido começa em 02/11/2026, preservando os percentuais originais das 12 semanas. A migração idempotente é identificada pelo ajuste `training-anchor-2026-11-02`; sessões/dias/decisões mantêm relações válidas, com execução preservada. Mudanças em banco existente incrementam revisão e registram auditoria/outbox na mesma transação. A mesma correção se aplica na restauração e retorno ao app. Backup 7 importa formatos 2–6; versões antigas não podem sobrescrever schema 7.

# Atualização 1.3.0 — schema 6

IndexedDB 6 e backup `oaolife-backup-6`; importa backups 2–5. Nutrição é uma união versionada: `five-meals-1` histórico e `five-meals-2` atual. O novo plano guarda `lunchProtein` e `protein` independentes, `chocolate`, `chocolateGrams`, `fruitPlan` opcional e `fruitEntries` com ID, instante, porção e estado contado. Conclusão de fruta cria snapshot sem duplicar suas calorias. Desfazer mantém entradas como rascunhos não contados.

`archivedNutrition` preserva integralmente os planos anteriores do dia de atualização, seus checklists, horários e declarações. `previousNutrition` continua preservando o plano original sem nutrientes. Dias passados não são convertidos no plano novo. A ativação ocorre apenas no dia corrente. Refeições completas arquivadas continuam nos totais do próprio dia. Referências de consumo e frutas registradas são snapshots, não valores recalculados a partir de tabelas novas. Validações cobrem exclusividade das proteínas, frutas, IDs e correspondência entre conclusão e horários.

O design não altera metas de outros blocos, auditoria, outbox ou arquitetura. As seções abaixo documentam as versões anteriores.

# Atualização v4

Migração de v2/v3 preserva snapshots históricos, revisão, auditoria e fila. `cardio.planVersion` diferencia o plano semanal dos registros anteriores. `mobility.sequences` persiste tempo acumulado, timestamp e conclusão por exercício. Novos backups são v4; formatos v2/v3 continuam aceitos. Abas antigas não podem validar snapshots v4 para sobrescrevê-los.

## Atualização 1.1.0 — schema 3

A versão 3 do IndexedDB migra o snapshot para `schemaVersion: 3`, preservando revisão, auditoria, fila e medições. `skipped` distingue séries não realizadas; `done` pode existir com detalhes nulos. `cardio.speed` registra velocidade real e `minimumSpeed` é a meta do snapshot. Registros antigos recebem ambos nulos, mantendo tempo, modalidade e meta anteriores.

`days[].declarations` guarda confirmações de blocos sem detalhes. Nenhum valor planejado é copiado para medidas reais. `hormonalProtocol` e `hormonalLogs` guardam respectivamente o protocolo informado e administrações explícitas; o plano informado acompanha o aplicativo, enquanto as administrações começam vazias. O bloco `hormonal` participa das declarações de conclusão do dia, sem criar doses realizadas.

O código v2 exige `schemaVersion: 2` antes de gravar. Após a migração, a transação antiga rejeita o snapshot v3, impedindo perda silenciosa dos novos campos. Apenas aumentar a versão Dexie não basta: Dexie pode reabrir estruturas compatíveis. Backups novos usam payload `oaolife-backup-3`; versões anteriores não os aceitam. A nova versão importa backups v2 com migração sem perdas. Não fazer downgrade de código após migração; publicar correções compatíveis com schema 3.

# Modelo de dados

IndexedDB `oaolife`, versão 2. Tabelas Dexie: `state` (id, revision, data), `audit` (id, at, revision, kind, detail) e `outbox` (id, at, revision, state, kind). Migração 1→2 adiciona índices sem limpar tabelas. Mudanças futuras de conteúdo devem incluir migração explícita; schemas desconhecidos são rejeitados sem apagar o banco.

O agregado `AppData` contém UserProfile, AppSettings, TrainingCycle[], WorkoutSession[], DailyLog[], BodyMeasurement[], PhotoRecord[], Food[], Recipe[], MobilityProtocol, ProgressionDecision[] e AdjustmentHistory[].

TrainingWeek, WorkoutTemplate, Exercise, ProgressionRule, MealPlan, Meal, HydrationPlan e CardioPlan são definições ou tipos de domínio; PlannedSet e CompletedSet aparecem nas séries do snapshot. LoadHistory é derivado das séries executadas e decisões. FoodLog, WaterLog, CardioSession, MobilitySession, SleepLog e RecoveryLog estão nos registros diários. SyncOperation fica na outbox. Não se declara uma tabela física inexistente para esses tipos.

IDs estáveis: UUIDs para entidades criadas; data civil para o dia; `cycleId:date` para sessão; `exerciseId:index` para série. Datas civis não usam conversão UTC implícita. Instantes são ISO UTC, acompanhados do timezone no registro do dia/sessão. O calendário usa a data civil do dispositivo e a referência fixa 17/10/2026=C2. Ciclos guardam início separado e overrides explícitos por data.

Planejado e executado são distintos: referências e sugestões não preenchem a carga executada. Série executada exige dados e confirmação. Registro de dia guarda metas de água e protocolo copiado, para que mudanças futuras não alterem registros anteriores. `recorded` diferencia área sem registro de um zero efetivamente informado. `null` representa informação ausente; não é convertido em zero nos gráficos.

Backup contém o agregado, auditoria e outbox. Auditoria guarda antes/depois das alterações por caminho; imagens são representadas por metadados de tamanho para não duplicar seu conteúdo em cada evento. Zod e verificações relacionais rejeitam datas inválidas, ciclos sobrepostos, duplicações, referências órfãs e treinos completos com séries ausentes. Restauração troca o conjunto inteiro após revisão; não faz merge silencioso. A revisão local após importar é superior às revisões atuais e importadas.


## Migração alimentar v5

`DailyLog.nutrition` guarda plano, proteína escolhida e uma cópia dos alimentos/referências de cada refeição consumida. Cada posição de consumo é única; marcar é idempotente e desfazer remove a posição. `previousNutrition` arquiva o checklist, horários e declaração do plano anterior quando o dia corrente é ativado no novo plano. Dias anteriores sem `nutrition` continuam usando `LEGACY_MEALS`, sem inferir nutrientes. `nutritionOverrides` permite ajustar referências sem alterar consumos históricos. A validação de integridade compara plano, checklist e horários de consumo. O backup v5 preserva esses campos e continua importando v2–v4.

# Atualização 1.4.0 — schema 9

`settings.setPolicy` (`full` | `full-deload` | `periodized`, padrão `full`). Migração 9
(`src/domain/migrations.ts`, marcador `migration-9-2026-11-26`): meta calórica padrão 2525 → 2000
apenas se for o padrão antigo (dias passados mantêm a meta registrada); referências nutricionais
desconhecidas do plano de quatro refeições completadas, inclusive em consumos já registrados, sem
mudar quantidades; sessões abertas de hoje em diante recebem as séries do plano vigente sem apagar
séries com dados. IndexedDB v9 adiciona a tabela `snapshots`; `initialize` grava `pre-v9` antes de
migrar e `restoreSnapshot` restaura com auditoria (a migração não é reaplicada após restaurar).
Backup `oaolife-backup-9` importa formatos 2–9.
