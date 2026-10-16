# Periodização e progressão

| Semana | Séries | RIR | Objetivo |
|---|---|---|---|
| 1 | 75% | 3–4 | Calibração |
| 2 | 85% | 2–3 | Adaptação |
| 3 | 100% | 1–2 | Volume completo |
| 4 | 55% | 4–5 | Recuperação |
| 5 | 85% | 2–3 | Retomada |
| 6 | 100% | 1–2 | Sobrecarga |
| 7 | 100% | 1–2 | Consolidação |
| 8 | 55% | 4–5 | Recuperação |
| 9 | 90% | 2–3 | Bloco final |
| 10 | 100% | 1–2 | Progressão |
| 11 | 100% | 1–2 | Consolidação final |
| 12 | 75% | 2–3 | Avaliação |

55% e 75% são valores dentro dos intervalos pedidos. Percentuais aplicam-se às séries, nunca às cargas. Cada sessão usa orçamento arredondado do total e distribuição pelo maior resto, preservando ao menos uma série por exercício e prioridades nos desempates. Não são inventadas séries extras.

Ao encerrar uma sessão, cada exercício é avaliado por função pura: todas as séries realizadas, carga e modalidade consistentes, topo da faixa de repetições, RIR ≥ mínimo previsto, técnica e amplitude adequadas. Sono, fadiga, desconforto muscular e dor devem estar registrados. Sono <6 h, fadiga/desconforto ≥7, dor ≥4, dor articular ou sintomas de alerta bloqueiam a progressão. São limites conservadores de software para revisão, não diagnóstico.

O incremento precisa ter sido informado pelo usuário em Ajustes. Para movimentos com incremento percentual, o passo não pode superar 5% da carga executada. Para laterais, flexora e extensora, usa-se o menor incremento real informado. Nenhum incremento é inventado. O software aceita passos reais menores que 2% quando o equipamento exigir; não força arredondamento para um passo inexistente.

Sem progressão durante ou na entrada de semanas 4 e 8. Se a próxima exposição tiver mais séries, mantém a carga. Se faltarem dados, mantém referência e explica o bloqueio. Uma sessão estagnada mantém carga. Duas exposições sem avanço continuam sem aumento; três exposições semelhantes produzem observação para revisar técnica, descanso e recuperação. Queda em três exposições gera sugestão de revisão de fadiga; não altera volume automaticamente.

Uma decisão elegível atualiza a sugestão da próxima exposição, com justificativa e referência de repetições no limite inferior. Histórico executado e snapshots já abertos não são modificados. Desfazer marca `undoneAt`, preservando a decisão. Reabrir uma sessão para correção desfaz as decisões daquela sessão. Exposições posteriores mais recentes prevalecem sobre sugestões antigas.

Revisões de dieta, cardio e volume não são aplicadas automaticamente. Recuperação ou sintomas podem gerar orientações de avaliação; não há prescrição médica automatizada.
