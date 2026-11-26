# Cardio

Plano fixo de 360 minutos semanais de esteira, com velocidade mínima de 5,0 km/h:

| Dia | Musculação | Cardio |
|---|---|---|
| Segunda | A1 | 60 min |
| Terça | B1 | 60 min |
| Quarta | C1 | 30 min |
| Quinta | A2 | 60 min |
| Sexta | B2 | 60 min |
| Sábado | C2 | 30 min |
| Domingo | Descanso | 60 min |

O calendário do cardio permanece fixo por dia da semana, inclusive quando a musculação é reagendada. O domingo não gera exercícios de musculação. Outros blocos mantêm suas regras.

O cronômetro persiste tempo acumulado e timestamp de início. Pausa, retomada e reabertura preservam o progresso; retomar soma uma nova sessão no mesmo dia. O registro manual permite substituir o total ou adicionar uma sessão. Minutos planejados e realizados são separados. Conclusão exige a meta diária, esteira e velocidade informada de pelo menos 5,0 km/h. Sessões menores permanecem parciais. Ao alcançar a meta com os parâmetros informados, o cronômetro é finalizado automaticamente, também ao voltar ao app.

A tela mostra progresso diário e semanal. O total real pode ultrapassar 360; o indicador semanal limita a contribuição de cada dia à sua própria meta, impedindo compensação automática de outro dia. Sem aumento automático de duração ou intensidade, inclusive por frequência cardíaca ou calorias.

Snapshots antigos preservam metas, modalidade, velocidade e duração reais. Um botão permite aplicar explicitamente o novo plano ao dia consultado. Novos dias usam a distribuição definitiva. IndexedDB, auditoria, outbox local e backup continuam sendo a arquitetura existente; não há backend de sincronização remota configurado.

## Meta semanal flexível · 1.4.0

Todos os minutos realizados na semana (segunda a domingo) contam para os 360 minutos, em qualquer
distribuição. Os valores diários são sugestões. Ao atingir 360 min, o bloco do dia não fica pendente.
A velocidade mínima de 5 km/h vale apenas para a esteira; outras modalidades concluem pela duração.
Gasto energético não é calculado.
