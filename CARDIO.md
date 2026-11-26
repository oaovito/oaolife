# Cardio

Prescrição rígida (proprietário, 26/11/2026): 5 sessões de 60 min = **300 minutos semanais**, esteira com velocidade mínima de 5,0 km/h:

| Dia | Musculação | Cardio |
|---|---|---|
| Segunda | A1 | 60 min |
| Terça | B1 | 60 min |
| Quarta | C1 | — |
| Quinta | A2 | 60 min |
| Sexta | B2 | 60 min |
| Sábado | C2 | — |
| Domingo | Descanso | 60 min |

O calendário do cardio permanece fixo por dia da semana, inclusive quando a musculação é reagendada. O domingo não gera exercícios de musculação. Outros blocos mantêm suas regras.

O cronômetro persiste tempo acumulado e timestamp de início. Pausa, retomada e reabertura preservam o progresso; retomar soma uma nova sessão no mesmo dia. O registro manual permite substituir o total ou adicionar uma sessão. Minutos planejados e realizados são separados. Conclusão exige a meta diária, esteira e velocidade informada de pelo menos 5,0 km/h. Sessões menores permanecem parciais. Ao alcançar a meta com os parâmetros informados, o cronômetro é finalizado automaticamente, também ao voltar ao app.

A tela mostra progresso diário e semanal. O total real pode ultrapassar 300; o indicador semanal limita a contribuição de cada dia à sua própria meta, impedindo compensação automática de outro dia. Sem aumento automático de duração ou intensidade, inclusive por frequência cardíaca ou calorias.

Snapshots antigos preservam metas, modalidade, velocidade e duração reais. Um botão permite aplicar explicitamente o novo plano ao dia consultado. Novos dias usam a distribuição definitiva. IndexedDB, auditoria, outbox local e backup continuam sendo a arquitetura existente; não há backend de sincronização remota configurado.

## Prescrição rígida · 1.4.0

Dias fixos: segunda, terça, quinta, sexta e domingo, 60 min cada (5 × 60 = 300 min/semana).
Quarta e sábado sem cardio. Cada sessão só conclui com a meta do próprio dia; minutos extras ou em
dia sem cardio ficam registrados, mas não compensam outro dia (`weeklyCardio.credited`). A semana
fecha com as 5 sessões cumpridas. A migração 9 aplica a nova meta aos dias de hoje em diante ainda
não concluídos, preservando tempo, velocidade e observações; dias passados e concluídos não mudam.
A velocidade mínima de 5 km/h vale apenas para a esteira; outras modalidades concluem pela duração.
