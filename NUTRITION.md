# Alimentação 1.3.0 — plano definitivo

Somente estas cinco refeições são ativas a partir da atualização:

| Refeição | Quantidade | kcal | Proteínas (g) | Carboidratos (g) | Gorduras (g) |
|---|---|---:|---:|---:|---:|
| 1 | 200 g iogurte grego natural integral + 2 pães franceses (100 g) | 494 | 27,83 | 69,56 | 12,12 |
| 2 | 200 g frango pronto + 200 g arroz cozido | 576 | 69,02 | 58,40 | 8,10 |
| 3 | 500 ml leite integral + 15 g Nescau (colher cheia de referência) | 383,50 | 12,48 | 49,06 | 15,66 |
| 4 | Frutas à vontade, gramas ou unidades registradas | variável | variável | variável | variável |
| 5 | 200 g frango pronto + 200 g arroz cozido | 576 | 69,02 | 58,40 | 8,10 |

Bebidas realmente zero calorias são livres na refeição 1; não registram água. Leite também não registra água.

Cada seletor de proteína é independente. Com 200 g de arroz, patinho resulta em **698 kcal / 76,82 P / 58,40 C / 18,20 G**; tilápia em **456 kcal / 41,82 P / 58,40 C / 6,66 G**. Pesos são após preparo. Frango é a seleção inicial, sem impor igualdade entre refeições.

A troca para 15 g de Toddy resulta em **384,70 kcal / 12,18 P / 49,83 C / 15,50 G** na refeição 3. A colher cheia de ambos tem referência de 15 g na TBCA, mas a composição é diferente; colher rasa é 10 g. Peso editável para corresponder à colher efetiva. Rótulo confirmado local tem prioridade sobre a referência genérica.

**Subtotal inicial sem frutas: 2.029,50 kcal / 178,35 P / 235,42 C / 43,98 G.** Não é uma meta diária definitiva. A quantidade planejada opcional de frutas completa a meta; não cria consumo nem limita a ingestão. Frutas reais entram imediatamente nas calorias e macros, mesmo antes da conclusão. Restantes = max(0, meta − consumo); excedente = max(0, consumo − meta). Sem meta completa, restantes e percentual não são inventados. Os valores são calculados sem arredondamento intermediário; a tela arredonda kcal para inteiros e macros para uma decimal.

## Referências documentadas

Fontes e URLs individuais ficam em `src/domain/nutritionReferences.json`, visíveis em cada refeição. Referências anteriores consultadas em 26/10/2026; iogurte, achocolatados e frutas em 01/11/2026 na [TBCA](https://www.tbca.net.br/). São estimativas de composição, não promessa de equivalência com qualquer produto. Carboidratos totais; energia publicada, sem recalcular por 4/4/9 a partir de macros arredondados.

| Referência TBCA | Base | kcal | P | C | G |
|---|---|---:|---:|---:|---:|
| BRC0133G · iogurte grego natural integral | 100 g | 97 | 9 | 3,98 | 5 |
| BRC0002A · pão francês | 100 g | 300 | 9,83 | 61,6 | 2,12 |
| BRC0044G · leite integral UHT, porção volumétrica | 240 ml | 156 | 5,63 | 17,2 | 7,3 |
| BRC0208A · arroz cozido com óleo, cebola e alho, sem sal | 100 g | 138 | 2,41 | 29,2 | 1,6 |
| BRC0114F · peito de frango sem pele, grelhado sem óleo/sal | 100 g | 150 | 32,1 | 0 | 2,45 |
| BRC0045F · patinho sem gordura, grelhado sem óleo/sal | 100 g | 211 | 36 | 0 | 7,5 |
| BRC0486E · tilápia sem pele, grelhada sem óleo/sal | 100 g | 90 | 18,5 | 0 | 1,73 |
| BRC0002K · achocolatado Nescau | 100 g | 390 | 5 | 88,2 | 3 |
| BRC0003K · achocolatado Toddy | 100 g | 398 | 3 | 93,3 | 1,92 |
| BRC0011C · banana prata, unidade comestível 40 g | 100 g | 107 | 1,11 | 25,9 | 0,28 |
| BRC0064C · maçã Fuji com casca, unidade 130 g | 100 g | 59 | 0,29 | 15,2 | traços não quantificados |
| BRC0020C · laranja pera, unidade comestível 140 g | 100 g | 37 | 0,87 | 8,63 | 0,21 |

O iogurte genérico não representa o rótulo Itambé Grego Flocos. Produtos/referências confirmados neste dispositivo têm prioridade. Ajustes → Referências nutricionais permite corrigir nutrientes, fonte e peso unitário. Dados ausentes e traços não quantificados permanecem desconhecidos, nunca zero. O consumo já salvo mantém a própria cópia de fontes e quantidades.

## Estado e histórico

Após persistir uma conclusão, o cartão sai em até 160 ms (sem animação com movimento reduzido) e passa para “Refeições concluídas — X/5”, recolhida inicialmente. Horário, alimentos, macros e desfazer continuam disponíveis. Desfazer frutas remove sua contagem, mantendo as entradas como rascunho para corrigir/reconfirmar. IDs e transações evitam duplicação. Novo dia local começa com cinco pendências.

Porções parciais das demais refeições ficam no checklist; só refeições completas entram no contador, conforme o fluxo existente. Alterar referências não apaga parciais. A migração arquiva plano, checklist, horários e declaração do dia corrente; refeições completas antigas continuam no consumo desse dia. Dias históricos não são reescritos e valores antigos não conhecidos não são inventados.

IndexedDB/schema 6, backup `oaolife-backup-6`, importa formatos 2–5. Armazenamento Dexie, fila, auditoria e backups criptografados são os existentes; não há backend de sincronização remota. Treino, cardio 360 min/semana, alongamento 4×60 s + 3×60 s, meta de água e registro hormonal permanecem preservados. Não há lista de compras no aplicativo.
