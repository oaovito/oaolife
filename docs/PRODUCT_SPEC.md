# Especificação do produto — oaolife

Versão 1.4.0 · atualizada em 26/11/2026.

## Propósito

Central de comando pessoal da rotina diária: composição corporal, alimentação,
musculação, condicionamento, hidratação, postura e disciplina. A tela Hoje deve
responder em segundos: situação atual, quanto foi feito, quanto falta, próxima
ação e se há algo que exige atenção.

## Perfil (dados históricos de referência)

Distinguir sempre: histórico, medição atual, meta e estimativa. Medições
registradas pelo usuário prevalecem.

| Campo | Valor de referência | Natureza |
|---|---|---|
| Sexo / idade | Homem, 27 anos | Histórico |
| Altura | 178 cm | Histórico |
| Peso inicial | 84 kg | Histórico (não sobrescreve medições) |
| Objetivo | Recomposição corporal; hipertrofia proporcional com ênfase em glúteos, posteriores e panturrilhas | Meta |
| Postura | Acompanhamento de hipercifose | Condição acompanhada |

Não apresentar redução localizada de gordura como mecanismo possível.

## Módulos e regras vigentes

### Musculação
- Seis sessões por semana: seg A1, ter B1, qua C1, qui A2, sex B2, sáb C2, dom descanso.
  Referência fixa 17/10/2026 = C2.
- Plano `original-1` em `src/domain/plan.ts` (exercícios, séries, faixas, cargas, FST-7
  em crucifixo A1 e lateral média A2).
- Ciclo de 12 semanas iniciado em 23/11/2026 (semana 1). Periodização define RIR.
- **Séries exibidas = séries prescritas do plano** nas semanas comuns; 55% nas semanas 4 e 8 de recuperação (`setPolicy='full-deload'`, escolha do proprietário).
  Volume semanal direto: peito 20, costas 20, deltoide lateral 16, bíceps 16, tríceps 16,
  panturrilhas 16, glúteos 13, posteriores 11, quadríceps 12.
- Registro por série (carga, repetições, RIR, técnica, amplitude), carga total/por lado/por halter,
  sugestão a partir da última carga executada, progressão dupla conservadora com desfazer.

### Alimentação — plano de 26/11/2026 (ativo)
| Refeição | Itens | kcal | P | C | G |
|---|---|---:|---:|---:|---:|
| 1 · líquida | 200 g iogurte grego natural · 300 ml leite desnatado · 40 g leite em pó · 30 g aveia | 549,7 | 45,0 | 62,4 | 13,5 |
| 2 · sólida | 200 g frango · 250 g arroz | 620,0 | 70,5 | 70,3 | 5,4 |
| 3 · líquida | 200 g iogurte grego natural · 300 ml leite desnatado · 40 g leite em pó · 30 g aveia | 549,7 | 45,0 | 62,4 | 13,5 |
| 4 · sólida | 180 g patinho · 200 g arroz | 635,8 | 69,8 | 56,2 | 13,9 |
| **Total** | | **2.355,2** | **230,3** | **251,3** | **46,4** |

Plano anterior (21/11/2026, 2.637 kcal: aveia 50 g na refeição 1, legumes e azeite nas sólidas)
permanece registrado nos dias em que valeu.

- Pesos de alimentos preparados; aveia e leite em pó pesados secos.
- Meta calórica solicitada: ~2.000 kcal (ajustável). O plano soma 2.355 kcal:
  a divergência (+355 kcal) é exibida, sem alterar quantidades.
- Meta proteica: 190 g (ajustável).
- Restrições: sem whey, feijão, banana, morango.
- Refeição concluída sai da lista de pendentes, conta no total e é corrigível no histórico.
- Planos anteriores (cinco refeições) permanecem no histórico dos dias em que valeram.

### Hidratação
Meta configurável (padrão 4.000 ml = 8 garrafas de 500 ml; garrafa configurável).
Registro rápido (+250/+500/+600), quantidade personalizada, correção, exclusão,
desfazer, histórico, reset à meia-noite local. Não incentiva compensação abrupta.

### Cardio
Prescrição **rígida**: segunda, terça, quinta, sexta e domingo, 60 min cada = **300 min/semana**;
quarta e sábado sem cardio. Cada sessão se cumpre no próprio dia, sem compensação. Cronômetro persistente, registro manual
(substituir ou somar), modalidade, velocidade (mínimo 5 km/h só na esteira), PSE e FC opcionais.

### Postura (hipercifose)
Alongamento em pé, cotovelos na parede: 4 séries × 60 s, 60 s de descanso (sem descanso
após a 4ª). Todos os dias, inclusive domingo (fixo). Cronômetro por timestamp: sobrevive a
troca de aba, bloqueio de tela e reabertura.

### Registro hormonal
Plano informado disponível; administrações reais registradas separadamente.

### Evolução
Medidas, fotos locais, gráficos e relatórios de ciclo.

## Fora do escopo
Backend, contas, sincronização remota, IA/APIs pagas, telemetria, métricas fisiológicas
inventadas (prontidão, recuperação, escores de saúde).

### Evolução · relatório semanal e situação atual
- Domingo: pesagem em Hoje. Relatório da semana (seg–dom) liberado após o cardio de domingo
  ou ao fim da semana; acessível sempre em Evolução → Relatórios.
- Conteúdo: cumprimento do plano por módulo e por dia, gráficos diários (calorias, proteína,
  água, cardio, séries), comparação com a semana anterior e com o histórico (média das semanas
  liberadas; peso contra o primeiro registro). Ausência de registro nunca conta como zero.
- Evolução → Situação: prescrição vigente e cumprimento atual de treino, alimentação, água,
  cardio, alongamento e peso, com sequências.

### Registro hormonal
Segunda e quinta, plano informado pré-preenchido; registro com um toque e doses editáveis
apenas como exceção. Outras datas: Ajustes → Registro hormonal fora do dia.
