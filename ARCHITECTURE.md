# Arquitetura

Frontend estático React 19 + TypeScript com Vite e Tailwind 4. Ícones Lucide, gráficos SVG com seleção de pontos e tabela acessível. Sem fontes remotas, telemetria, backend ou chamadas a APIs de saúde.

- `src/domain/model.ts`: contratos validados por Zod, tipos e entidades.
- `src/domain/plan.ts`: plano original congelado e versionado, refeições e periodização.
- `src/domain/training.ts`: calendário civil, geração de sessões, arredondamento, histórico de carga e reagendamentos.
- `src/domain/progression.ts`: motor determinístico de dupla progressão e observações de recuperação.
- `src/domain/daily.ts`: estados dos cinco blocos, relógios, nutrição e média de peso.
- `src/domain/analytics.ts`: séries para gráficos e relatório do ciclo, sem converter ausência em zero.
- `src/storage/db.ts`: transações Dexie, revisão, validação de integridade, auditoria e fila local.
- `src/storage/backup.ts`: criptografia, validação e restauração transacional com controle de revisão.
- `src/ui/`: componentes de apresentação e chamadas aos casos de uso; `useLocalDate` e `useUpdates` cuidam de eventos do navegador.

Persistência por agregado: `state/main` reúne as entidades de domínio; auditoria e outbox têm tabelas próprias. Essa escolha permite salvar uma atividade, sua revisão e seu evento em uma única transação e simplifica backup consistente. Não há tabela física para cada entidade. É uma aplicação pessoal; o agregado pode se tornar oneroso com muitas fotografias, limitação registrada no contexto.

Sessões são snapshots do planejamento ao abrir o treino. Novas sugestões não editam snapshots já abertos. Não existe registro automático de execução. Cada alteração lê a última revisão dentro da transação, preservando alterações concorrentes de outras abas. A restauração exige a mesma revisão analisada pelo usuário.

Service Worker gerado com Workbox: precache dos arquivos construídos, fallback de navegação e atualização em espera. Nada de dados pessoais em Cache Storage. Ativação bloqueada durante sessão ou cronômetro ativo e operações de gravação.
