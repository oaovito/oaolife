# Alimentação — plano de cinco refeições

O único plano ativo para novos registros é:

1. 500 ml de leite integral + 2 pães franceses (50 g por unidade de referência).
2. 200 g de iogurte Itambé Grego Flocos.
3. Igual à refeição 1.
4. Igual à refeição 2.
5. 200 g de arroz branco cozido + 200 g de uma única proteína: frango, carne bovina ou peixe. Pesos após preparo.

A escolha inicial é frango. O seletor exclusivo altera o planejamento do dia. Uma refeição consumida mantém sua própria cópia dos alimentos, quantidades, fonte e nutrientes, mesmo quando o planejamento ou o rótulo muda depois. Desfazer e consumir novamente registra o planejamento atual. O consumo é idempotente: cliques repetidos não somam a mesma refeição várias vezes. Porções parciais são conservadas, mas o contador soma apenas refeições integralmente consumidas. Nenhuma refeição registra água automaticamente.

## Fontes e precisão

Referências consultadas na TBCA em 26/10/2026. URLs individuais, códigos, preparo, qualidade e bases de cálculo estão em `src/domain/nutritionReferences.json` e nos detalhes de cada refeição. Os valores são referências estimadas, não análise do alimento efetivamente consumido. Carboidratos são totais; a energia é a publicada pela TBCA, não recalculada por 4/4/9 a partir de macros arredondados.

| Alimento | Referência | Base | kcal | Proteínas (g) | Carboidratos (g) | Gorduras (g) |
|---|---|---|---:|---:|---:|---:|
| Leite integral UHT | BRC0044G, porção volumétrica da tabela | 240 ml | 156 | 5,63 | 17,2 | 7,30 |
| Pão francês | BRC0002A; unidade média de 50 g | 100 g | 300 | 9,83 | 61,6 | 2,12 |
| Arroz polido cozido | BRC0208A; óleo de soja, cebola e alho, sem sal | 100 g | 138 | 2,41 | 29,2 | 1,60 |
| Peito de frango | BRC0114F; sem pele, grelhado, sem óleo/sal | 100 g | 150 | 32,1 | 0 | 2,45 |
| Patinho | BRC0045F; sem gordura, grelhado, sem óleo/sal | 100 g | 211 | 36 | 0 | 7,50 |
| Tilápia | BRC0486E; filé sem pele, grelhado, sem óleo/sal | 100 g | 90 | 18,5 | 0 | 1,73 |
| Itambé Grego Flocos | Produto confirmado no plano original, rótulo não verificado | 100 g | desconhecido | desconhecido | desconhecido | desconhecido |

Não foi atribuído ao Itambé Grego Flocos o valor do iogurte grego natural da TBCA. O site do fabricante estava bloqueado pela política de rede. Em Ajustes → Referências nutricionais do plano é possível informar o rótulo, corrigir as referências, o corte/espécie/preparo e o peso unitário do pão. Campos ausentes continuam desconhecidos. A alteração aplica-se ao planejamento de hoje e a novos dias; não reescreve refeições consumidas ou dias anteriores.

Refeições 1 e 3: **625 kcal**, 21,56 g de proteína, 97,43 g de carboidratos e 17,33 g de gordura cada.
Refeição 5: **576 kcal** com frango, **698 kcal** com patinho, **456 kcal** com tilápia.

**O total diário completo depende dos 400 g de Itambé Grego Flocos.** Subtotais conhecidos, excluindo as duas porções de iogurte:

| Proteína | kcal | Proteínas (g) | Carboidratos (g) | Gorduras (g) |
|---|---:|---:|---:|---:|
| Frango | 1826 | 112,14 | 253,27 | 42,76 |
| Patinho | 1948 | 119,94 | 253,27 | 52,86 |
| Tilápia | 1706 | 84,94 | 253,27 | 41,32 |

O aplicativo mostra “Não informado” para totais incompletos, nunca o subtotal como meta completa. Com todas as referências preenchidas: meta = soma do planejamento; consumidas = soma das cópias consumidas; restantes = max(0, meta − consumidas); progresso = consumidas/meta × 100 (0 se meta = 0). Excedente é mostrado separadamente; consumo não é bloqueado pela meta.

## Migração e histórico

Schema de dados e IndexedDB versão 5. Backups 2, 3 e 4 continuam importáveis; novos backups usam `oaolife-backup-5`. Dias antigos permanecem vinculados ao plano antigo, com checklist e horários originais. Se já existir um registro do dia da atualização, seu checklist, horários e declaração alimentar são arquivados em `previousNutrition`, visíveis na alimentação; o novo plano começa pendente. Os valores nutricionais antigos nunca são inventados.

Treino, cardio, alongamento, hidratação, protocolo hormonal, preferências e fila local são preservados. Novos dias começam sem refeições consumidas. Não há backend de sincronização remota; IndexedDB e backups criptografados continuam sendo o armazenamento existente.
