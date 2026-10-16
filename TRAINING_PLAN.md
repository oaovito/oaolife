# Plano de treinamento

Fonte executável auditável: `src/domain/plan.ts`, `ORIGINAL_PLAN`, versão `original-1`, congelada recursivamente. Preserva todos os exercícios, séries, faixas, cargas e modalidades do prompt original. Cargas sem referência são `null`, nunca zero inventado. Cargas por lado e por halter não são convertidas para carga total.

## Calendário

| Dia | Sessão |
|---|---|
| Segunda | A1 |
| Terça | B1 |
| Quarta | C1 |
| Quinta | A2 |
| Sexta | B2 |
| Sábado | C2 |
| Domingo | Descanso |

Referência fixa: sábado 17/10/2026 = C2. 16/10 B2, 18/10 descanso, 19/10 A1, 20/10 B1, 21/10 C1, 22/10 A2, 23/10 B2, 24/10 C2, 25/10 descanso. Funciona sem internet. Data local revalidada à meia-noite, em até um minuto se o relógio/fuso mudar, no foco, pageshow e retorno visível. Uma data explicitamente consultada fica selecionada até tocar Hoje.

A data inicial do ciclo define a semana (intervalos de sete dias), sem alterar a divisão semanal. O formulário de semana atual calcula o início pela segunda-feira da semana selecionada e mostra a data antes da confirmação. Nenhuma semana é escolhida na instalação. Reagendamento troca duas datas do mesmo ciclo sem sessão registrada; não desloca semanas posteriores.

## C2 original

| Exercício | Séries | Repetições | Referência |
|---|---:|---|---|
| Panturrilha máquina, joelho estendido | 4 | 8–12 | 90 kg total |
| Leg press vertical | 4 | 8–12 | 100 kg total |
| Cadeira extensora | 4 | 10–15 | 85 kg total |
| Cadeira flexora | 4 | 10–15 | A definir |
| Elevação pélvica | 3 | 10–15 | 40 kg por lado |
| Cadeira abdutora | 3 | 12–20 | A definir |
| Panturrilha sentado | 4 | 12–20 | A definir |

26 séries antes da periodização; ordem preservada. Cardio e hipercifose não programados, salvo configuração explícita posterior de protocolo.

## Volume direto em semanas completas

Peito 20; costas 20; deltoide lateral 16; anterior 6; posterior 10; bíceps 16; tríceps 16; trapézio 6; quadríceps 12; posteriores 11; glúteos 13; panturrilhas 16. Não soma estímulos indiretos integralmente. Glúteos contabilizam elevação pélvica e abdutora; posteriores, flexora e romeno; leg press fica em quadríceps nesta classificação.

## Execução

Compostos 2–3 min; isoladores 60–120 s; FST adaptado 30–45 s. Crucifixo A1 e lateral média A2 usam até quatro séries, sem extras (volume menor nas semanas reduzidas). Panturrilhas: amplitude e ausência de impulso. Glúteos: excêntrica controlada. Romeno: condicionado à tolerância da coluna e avaliação das limitações. Técnica e amplitude são auto-relatadas, sem avaliação por sensores.
