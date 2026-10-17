## Atualização 1.1.0 — schema 3

A versão 3 do IndexedDB migra o snapshot para `schemaVersion: 3`, preservando revisão, auditoria, fila e medições. `skipped` distingue séries não realizadas; `done` pode existir com detalhes nulos. `cardio.speed` registra velocidade real e `minimumSpeed` é a meta do snapshot. Registros antigos recebem ambos nulos, mantendo tempo, modalidade e meta anteriores.

`days[].declarations` guarda confirmações de blocos sem detalhes. Nenhum valor planejado é copiado para medidas reais. `hormonalProtocol` e `hormonalLogs` guardam respectivamente o protocolo informado e administrações explícitas; ambos começam vazios.

O código v2 exige `schemaVersion: 2` antes de gravar. Após a migração, a transação antiga rejeita o snapshot v3, impedindo perda silenciosa dos novos campos. Apenas aumentar a versão Dexie não basta: Dexie pode reabrir estruturas compatíveis. Backups novos usam payload `oaolife-backup-3`; versões anteriores não os aceitam. A nova versão importa backups v2 com migração sem perdas. Não fazer downgrade de código após migração; publicar correções compatíveis com schema 3.

# Modelo de dados

IndexedDB `oaolife`, versão 2. Tabelas Dexie: `state` (id, revision, data), `audit` (id, at, revision, kind, detail) e `outbox` (id, at, revision, state, kind). Migração 1→2 adiciona índices sem limpar tabelas. Mudanças futuras de conteúdo devem incluir migração explícita; schemas desconhecidos são rejeitados sem apagar o banco.

O agregado `AppData` contém UserProfile, AppSettings, TrainingCycle[], WorkoutSession[], DailyLog[], BodyMeasurement[], PhotoRecord[], Food[], Recipe[], MobilityProtocol, ProgressionDecision[] e AdjustmentHistory[].

TrainingWeek, WorkoutTemplate, Exercise, ProgressionRule, MealPlan, Meal, HydrationPlan e CardioPlan são definições ou tipos de domínio; PlannedSet e CompletedSet aparecem nas séries do snapshot. LoadHistory é derivado das séries executadas e decisões. FoodLog, WaterLog, CardioSession, MobilitySession, SleepLog e RecoveryLog estão nos registros diários. SyncOperation fica na outbox. Não se declara uma tabela física inexistente para esses tipos.

IDs estáveis: UUIDs para entidades criadas; data civil para o dia; `cycleId:date` para sessão; `exerciseId:index` para série. Datas civis não usam conversão UTC implícita. Instantes são ISO UTC, acompanhados do timezone no registro do dia/sessão. O calendário usa a data civil do dispositivo e a referência fixa 17/10/2026=C2. Ciclos guardam início separado e overrides explícitos por data.

Planejado e executado são distintos: referências e sugestões não preenchem a carga executada. Série executada exige dados e confirmação. Registro de dia guarda metas de água e protocolo copiado, para que mudanças futuras não alterem registros anteriores. `recorded` diferencia área sem registro de um zero efetivamente informado. `null` representa informação ausente; não é convertido em zero nos gráficos.

Backup contém o agregado, auditoria e outbox. Auditoria guarda antes/depois das alterações por caminho; imagens são representadas por metadados de tamanho para não duplicar seu conteúdo em cada evento. Zod e verificações relacionais rejeitam datas inválidas, ciclos sobrepostos, duplicações, referências órfãs e treinos completos com séries ausentes. Restauração troca o conjunto inteiro após revisão; não faz merge silencioso. A revisão local após importar é superior às revisões atuais e importadas.
