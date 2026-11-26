# Auditoria técnica — 26/11/2026 (versão 1.3.2 → 1.4.0)

## Estado inicial
- Base sólida: domínio puro, IndexedDB transacional com auditoria, backup AES-GCM,
  PWA, 151 testes unitários e 44 cenários de navegador (×3 projetos) passando.
- Código denso (linhas longas), CSS legado em camadas sobrepostas (~60 KB).
- Plano alimentar de quatro refeições já implantado, mas com referências desconhecidas.
- Identidade visual genérica (azul-marinho, cantos arredondados, "Seu dia, em movimento").

## Problemas encontrados

| # | Problema | Gravidade | Impacto | Risco de regressão | Situação |
|---|---|---|---|---|---|
| 1 | Exercícios com 2 séries: o fator de volume da semana (75% na semana 1, 55% nas 4/8) reduzia 3 → 2 séries; o usuário entendia como defeito e as 18–20 séries semanais não eram cumpridas | Alta | Treino abaixo do prescrito | Médio (migração de sessões abertas) | Corrigido: `setPolicy='full'` padrão, migração 9, testes |
| 2 | Iogurte grego natural, leite desnatado e legumes sem valores: totais do dia ficavam "não informados" | Alta | Sem calorias/proteína reais | Baixo | Corrigido com TBCA/TACO; registros consumidos completados |
| 3 | Azeite com proteína/carboidrato nulos anulava os totais de macros | Média | Totais nulos | Baixo | Corrigido (0 g, lipídio puro, TACO NA) |
| 4 | Meta calórica padrão 2.525 kcal (herdada do plano de cinco refeições) em vez de ~2.000 solicitada | Média | Restante incorreto | Baixo | Migração altera só o padrão antigo; metas personalizadas e dias passados preservados |
| 5 | Divergência plano × meta escondida em um `details` | Média | Hierarquia | Baixo | Exibida (Plano / Meta / Diferença) + tabela por refeição |
| 6 | Cardio: excedente de um dia não contava para a semana (meta diária fixa) | Média | Contradiz meta semanal flexível | Baixo | Todos os minutos contam; bloco conclui com 360 min/semana |
| 7 | Cardio fora da esteira nunca concluía (regra de velocidade aplicada a todas as modalidades) | Média | Conclusão impossível | Baixo | Velocidade mínima só na esteira |
| 8 | Barra superior estourava a largura a 320 px quando offline | Média | Arraste lateral | Baixo | Corrigido; teste de layout passa |
| 9 | Grade de séries×reps cortava texto a 320 px | Baixa | Legibilidade | Baixo | Corrigido |
| 10 | Botão "Reiniciar sequência" visível sem progresso | Baixa | Ação inútil/acidental | Baixo | Só aparece com progresso; confirmação mantida |
| 11 | Efeito de partículas na conclusão | Baixa | Desempenho/estética | Baixo | Removido; feedback discreto |
| 12 | Alvos de toque < 44 px (marca, rodapé) | Baixa | Toque | Baixo | Corrigido |
| 13 | Hierarquia: Hoje não mostrava calorias, proteína, água restante, séries restantes ou cardio semanal | Alta | Leitura do dia | Médio | Novo centro de comando |
| 14 | Sem rollback local antes de migrações | Média | Integridade | Baixo | `db.snapshots` + `restoreSnapshot` |

## Itens auditados sem defeito encontrado
Persistência transacional, IDs idempotentes de água e frutas (sem duplicação), reset à
meia-noite local e no retorno do segundo plano, cronômetros por timestamp (cardio e
postura), backup/restauração entre origens, CSP e headers, sem segredos no repositório,
sem telemetria, inputs ≥ 16 px (evita zoom do Safari).

## Arraste horizontal no iPhone
Causas investigadas: overflow de elementos (varredura de todos os elementos em 320/393/430 px
com todos os `details` abertos), zoom por foco em campo < 16 px, toast `max-content`, `position:
fixed`, `100vw`. Encontrado e corrigido: barra superior offline a 320 px e toast em telas
pequenas. Proteções: `overflow-x: clip` em html/body/#root, `overscroll-behavior-x: none`,
`touch-action: manipulation` nos botões. Limite: Safari físico não disponível nesta sessão
(Chromium com toque real via CDP validou gestos horizontais e diagonais).

## Desempenho (antes × depois, Chromium móvel, CPU 4× mais lenta, mediana de 5)
| Métrica | 1.3.2 | 1.4.0 |
|---|---|---|
| Hoje pronto (módulos visíveis) | 803 ms | 837 ms |
| DOMContentLoaded | 257 ms | 269 ms |
| Heap JS | 9,5 MiB | 9,5 MiB |
| Transferido no 1º acesso | 203 KiB | ~240 KiB (fontes, cacheadas uma vez) |
| CSS (gzip) | 13,3 KB | 18,2 KB |
| JS principal (gzip) | 62,4 KB | 65,3 KB |
| Precache PWA | 712 KiB | 820 KiB |
Sem regressão perceptível; textura é CSS/SVG inline sem requisições.
