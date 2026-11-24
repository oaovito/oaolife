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

A data inicial do ciclo define a semana (intervalos de sete dias), sem alterar a divisão semanal. O formulário de semana atual calcula o início pela segunda-feira da semana selecionada e mostra a data antes da confirmação. A partir da versão 1.3.1, o ciclo foi explicitamente ancorado em 02/11/2026 por solicitação do usuário; a semana é calculada pela data local. Na versão 1.3.2, uma nova solicitação define 23/11/2026 como início da semana 1 (75% das séries, RIR 3–4). O ciclo anterior termina em 22/11; registros anteriores e sessões encerradas são preservados. Sessões abertas desde 23/11 recebem a nova distribuição, mantendo séries já preenchidas/concluídas. A migração é idempotente e conserva ciclos futuros explicitamente configurados. Reagendamento troca duas datas do mesmo ciclo sem sessão registrada; não desloca semanas posteriores.

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

## Correção do início do ciclo · 1.3.1

Semana 1: **02–08/11/2026 (75%)**; semana 2: **09–15/11 (85%)**; semana 3: **16–22/11 (100%)**; semana 4: **23–29/11 (55%)**. Os 12 percentuais e o RIR originais permanecem: 75/85/100/55/85/100/100/55/90/100/100/75%. Término normal: 24/01/2027. Não foi aplicada a proposta anterior de volume completo em todas as semanas.

Na terça-feira da semana 1, B1 tem 20 séries: puxada 3, remada máquina 3, remada Smith 2, posterior na polia 4, rosca W 3, alternada 3 e encolhimento 2. Duas séries podem ser corretas nessa semana. O volume completo semanal continua sendo o listado acima.

A migração registra o marco uma única vez. Ciclos anteriores sobrepostos terminam em 01/11; seus registros são preservados. Sessões desde 02/11 são vinculadas ao ciclo corrigido. Treinos encerrados ou de dias passados mantêm suas séries, metas e execução. Treinos abertos de hoje em diante ajustam a semana, RIR planejado e séries pendentes; nenhuma série com carga, execução, observação ou outro detalhe é apagada. Por isso, uma sessão parcialmente registrada pode conservar séries além do novo planejamento. Outros blocos não são alterados.
