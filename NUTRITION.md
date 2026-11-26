# Alimentação — four-meals-1

O plano ativo tem exatamente quatro refeições: café da manhã e lanche líquidos;
almoço e jantar sólidos. Porções oficiais em `domain/plan.ts` e construção dos
snapshots em `domain/nutrition.ts`:

| Refeição | Ingredientes |
| --- | --- |
| Café | Grego natural 200 g, leite desnatado 300 ml, leite em pó desnatado 40 g, aveia 50 g |
| Almoço | Frango grelhado 200 g, arroz branco cozido 250 g, legumes 150 g, azeite 10 g |
| Lanche | Grego natural 200 g, leite desnatado 300 ml, leite em pó desnatado 40 g, aveia 30 g |
| Jantar | Patinho grelhado 180 g, arroz branco cozido 200 g, legumes 150 g, azeite 5 g |

Carnes/arroz/legumes são pesados preparados; aveia e pó são secos. As vitaminas
são batidas, com opcionais descritos na interface. Não há whey, feijão, banana,
morango ou skyr no plano ativo. Alimentos antigos permanecem legíveis no histórico.

Metas individuais configuráveis: 2525 kcal e 190 g proteína, dentro das faixas
iniciais de 2500–2550 kcal e 185–200 g. Cada dia guarda suas metas; ajustes alteram
hoje e próximos dias. Não se alteram as quantidades oficiais para atingir a meta.

## Fontes e limites

`nutritionReferences.json` contém fonte, unidade, porção, preparo e qualidade.
TACO 4ª edição, NEPA/UNICAMP: alimentos 3 (arroz sem óleo), 7 (aveia), 456
(leite em pó desnatado) e 260 (azeite). As referências de carnes TBCA já existentes
foram mantidas. Não se reaproveita o arroz com óleo do plano antigo.

Iogurte natural grego não herda os 9 g/100 g de proteína da referência genérica
antiga. Exige rótulo compatível. Leite líquido exige rótulo por ml; não convertemos
g em ml por suposição. Legumes exigem composição e preparo. TACO marca proteína
e carboidratos do azeite como NA; permanecem pendentes até um rótulo quantificar
esses campos, inclusive zeros explícitos.

Subtotal conhecido (não é total diário): **1993,2 kcal; 179,13 g proteína;
222,13 g carboidratos; 41,82 g gordura**. Valores ausentes são `null`, nunca zero.
A tela distingue subtotal de total, mostra diferenças quando calculáveis e sugere
ajustes sem executá-los. Cadastros confirmados e referências editadas têm prioridade.

Apenas refeições completas entram no consumo do novo plano. Cada conclusão
salva uma cópia das porções/referências; editar o rótulo depois não muda esse consumo.
Checklist parcial, ocultação, expansão e desfazer permanecem disponíveis.

## Migração

Schema 8 / IndexedDB 8. Somente o dia atual troca de plano na inicialização ou
restauração. O plano antigo e seus horários/checklists/declarações ficam em
`archivedNutrition` (ou `previousNutrition` para o plano sem dados nutricionais).
Consumo completo anterior conhecido continua somado no dia. Datas anteriores não
são reescritas. Reabrir não duplica arquivos nem registros, e toda alteração da
migração entra na auditoria/fila local. Os planos five-meals-1/2 continuam suportados.

## Referências completas · 1.4.0 (26/11/2026)

| Alimento | Referência por 100 g/ml | Fonte |
|---|---|---|
| Iogurte grego natural | 97 kcal · 9 P · 3,98 C · 5 G | TBCA BRC0133G |
| Leite desnatado UHT (100 ml) | 30,9 kcal · 2,99 P · 4,43 C · 0,21 G | TACO (por 100 g) × densidade 1,03 g/ml |
| Leite em pó desnatado | 362 · 34,7 · 53 · 0,9 | TACO |
| Aveia em flocos | 394 · 13,9 · 66,6 · 8,5 | TACO |
| Peito de frango grelhado | 150 · 32,1 · 0 · 2,45 | TBCA BRC0114F |
| Arroz branco cozido | 128 · 2,5 · 28,1 · 0,2 | TACO |
| Legumes cozidos (mix) | 23,3 · 1,33 · 4,7 · 0,3 | Média TACO cenoura, brócolis e abobrinha cozidos |
| Patinho grelhado | 211 · 36 · 0 · 7,5 | TBCA BRC0045F |
| Azeite de oliva | 884 · 0 · 0 · 100 | TACO (P e C "NA": lipídio puro) |

Totais do plano: R1 628 kcal / 47,8 g P; R2 743 / 72,4; R3 550 / 45,0; R4 715 / 71,8;
**dia 2.637 kcal / 237,1 g P / 278,7 g C / 64,0 g G**. Meta solicitada ~2.000 kcal: a
divergência (+637 kcal) é exibida em Alimentação; as quantidades não são alteradas.
Rótulos confirmados cadastrados pelo usuário continuam com prioridade.
