# Design system — Military Command System

Fonte de código: `src/command.css` (camada canônica, carregada depois de
`styles.css` e `design-system.css`, que permanecem como base estrutural).

## Princípios
1. **O número é o protagonista.** Valores consumidos/realizados em display condensado
   grande; metas e unidades em mono pequeno e atenuado.
2. **Estado por cor semântica**, nunca decorativa.
3. **Módulos táticos**: cartões com cantoneiras, bordas finas, cantos de 3–4 px.
4. **Textura perceptível, nunca competindo** com conteúdo.
5. **Sem efeitos gratuitos**: sem partículas, neon ou animações pesadas.

## Paleta (tema escuro, padrão)
| Token | Hex | Uso |
|---|---|---|
| `--carbon` / `--bg` | #0c0e0b | Fundo |
| `--graphite` / `--surface` | #151812 | Painéis |
| `--graphite-2` / `--surface2` | #1d211a | Superfícies elevadas, botão secundário |
| `--line` / `--line-strong` | #2b3025 / #58604a | Divisores / cantoneiras e bordas fortes |
| `--signal` / `--accent` | #a8b86e | Progresso, concluído, ação principal |
| `--olive`, `--moss` | #5b6838, #7d8c4f | Apoios de identidade |
| `--tan` | #c9b78f | Rótulos, ícones de módulo |
| `--bone` / `--text` | #ebe6d8 | Texto principal |
| `--muted` | #a7ab98 | Texto secundário (contraste ≥ 7:1 sobre painel) |
| `--amber` | #e3a93c | Em andamento, alertas, pausa |
| `--red` | #e07a68 | Erro e ações destrutivas |

Tema claro ("deserto"): mesmos papéis, tokens redefinidos em `:root[data-theme=light]`.
Axe (WCAG 2 A/AA) sem violações nos dois temas em todas as páginas.

## Textura de fundo
Três camadas CSS, sem imagem externa: granulação `feTurbulence` (SVG inline 160 px),
grade ripstop de 28 px e trama de 4 px, mais vinheta oliva sutil. Custo: zero requisições.

## Tipografia
| Papel | Fonte | Notas |
|---|---|---|
| Títulos, números | Barlow Condensed 600/700 | maiúsculas, `tabular-nums` |
| Rótulos, status, botões | IBM Plex Mono 500/600 | maiúsculas, espaçamento .06–.12em |
| Corpo | fonte do sistema (SF Pro no iPhone) | legibilidade |
Fontes auto-hospedadas (`src/assets/fonts`, OFL), subset latino, precache da PWA.

## Botões
| Tipo | Classe | Aparência |
|---|---|---|
| Ação principal | `.primary` | verde sinal sólido, texto carbono |
| Secundária / navegação | `.secondary` | grafite com borda forte |
| Pausa / atenção | `.pause-button` | âmbar sólido |
| Destrutiva | `.danger` | contorno vermelho; sempre com confirmação em duas etapas |
| Terciária | `.quiet`, `.text-button` | mono atenuado / verde |
Mínimo 44–48 px de altura; `touch-action: manipulation`; estado desabilitado a 45%;
foco visível âmbar. Ações que gravam usam `run()` (estado "Salvando…" e bloqueio de duplo envio
por IDs idempotentes em água/frutas).

## Hoje (centro de comando)
1. Cabeçalho: data · semana · RIR; sessão do dia (código + título).
2. Status da missão: módulos concluídos/programados, trilha segmentada (verde = concluído,
   âmbar listrado = em andamento) e botão **Próxima ação**.
3. Alertas reais (cronômetro ativo, backup ausente/antigo).
4. Grade de módulos: número principal, meta, detalhe, barra segmentada e "quanto falta".
5. Concluídos recolhidos com "ver e corrigir".
Cabe acima do menu em 393×852 (inclusive áreas seguras da PWA); em telas menores rola
verticalmente sem cortes.

## Componentes
`Segments` (barra segmentada de 10 blocos), `Metric` (`emphasis` = verde e maior),
`.plan-balance` (plano × meta × diferença), `.meal-table` (nutrientes por refeição),
`.week-strip` (minutos de cardio por dia), `.water-quick` e `.bottle-strip`.
