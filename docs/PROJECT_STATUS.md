# Estado do projeto — 1.4.0 (26/11/2026)

| Módulo | Estado | Evidência |
|---|---|---|
| Dashboard Hoje (centro de comando) | Implementado e validado | Playwright 393×852 (com áreas seguras), 320–430 px, desktop, axe |
| Musculação: séries do plano | Implementado e validado | `v9-regression.test.ts` (12 semanas × 6 sessões) + e2e |
| Musculação: registro, histórico, progressão | Implementado e validado | testes existentes + e2e |
| Alimentação: plano 21/11/2026 e cálculos TACO/TBCA | Implementado e validado | testes por refeição e total; e2e |
| Alimentação: concluídas saem da lista e são corrigíveis | Implementado e validado | unitário + e2e |
| Hidratação 4.000 ml configurável | Implementado e validado | e2e (garrafa 600 ml, desfazer, correção, conclusão) |
| Cardio 360 min/semana flexível | Implementado e validado | unitários (distribuição, reset semanal, modalidade) + e2e |
| Postura (hipercifose 4×60 s) | Implementado e validado | e2e (pausa, retomada, reabertura offline) |
| Registro hormonal | Implementado e validado (sem mudança) | e2e |
| Evolução (medidas, fotos, gráficos) | Implementado; apenas reestilizado | e2e de layout e axe |
| Migração 9 + rollback local | Implementado e validado | migração real v8 → v9, restauração, idempotência |
| Backup criptografado | Implementado e validado | e2e entre origens |
| Identidade visual militar e textura | Implementado e validado | inspeção por screenshots (escuro/claro, mobile/desktop) |
| Sem arraste horizontal | Implementado e validado em Chromium | Safari físico: pendente (fora do alcance desta sessão) |
| WebKit (Playwright) | Pendente nesta máquina | Executado pela CI do PR |
| Deploy de produção | Ver docs/HANDOFF_CURRENT.md | Vercel (merge em main) |
| Backend/sincronização remota | Não aplicável | Fora do escopo por decisão |
