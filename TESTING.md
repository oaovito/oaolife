# Verificação

## Atualização 1.3.1 · 03/11/2026

TypeScript, 141/141 testes Vitest e build aprovados. 60/60 testes Chromium (móvel e desktop) aprovados. Novos cenários cobrem marco 02/11 como semana 1, percentuais originais, transições semanais, migração real v6→v7, preservação de séries registradas, auditoria idempotente, novo dispositivo, 20 séries do B1 da primeira semana e reabertura offline. Fixtures antigas usam data determinística anterior à nova configuração. Não há script de lint nem validação em iPhone físico nesta rodada.


## Atualização 1.3.0 · 02/11/2026

- `npm run check`: TypeScript e 136/136 testes Vitest aprovados.
- `npm run build`: aprovado, incluindo Service Worker e recursos offline.
- 58/58 testes Playwright aprovados em Chromium, perfis móvel e desktop, com `/workspace/onboarding/playwright.config.ts` e Chromium do sistema.
- Auditoria de produção: zero vulnerabilidades. Não há script de lint; checagem estática pelo TypeScript.
- Revisão visual real em Chromium: alimentação, início, cardio, hidratação, treino e mobilidade, móvel e desktop.
- Cobertura nova: plano definitivo, proteínas independentes, Nescau/Toddy, referência da colher, frutas imediatas e meta opcional, excesso, ocultação e desfazer, histórico, migração Dexie v5→v6, backups, renovação local do dia, offline, contraste nos dois temas, 320–430 px, texto ampliado e movimento reduzido.
- WebKit local indisponível: download retornou HTTP 403 Domain forbidden. Nenhum teste em iPhone físico afirmado. Vibração validada pela API simulada; Safari/iPhone não oferece navigator.vibrate.


## Atualização 1.2.0 · 26/10/2026

- `npm run check`: TypeScript e **129/129 testes Vitest** aprovados.
- `npm run build`: aprovado; PWA gerada com recursos locais.
- **54/54 testes Chromium** aprovados em perfis móvel e desktop, usando `/usr/bin/chromium` (154) com uma configuração de execução externa ao repositório. A configuração manteve os testes e servidor da suíte; só selecionou o Chromium instalado. Nenhuma afirmação de teste em iPhone físico ou WebKit.
- `npm audit --omit=dev --audit-level=moderate`: zero vulnerabilidades de produção.
- Não há script de lint no projeto; a checagem estática executada foi TypeScript.

Os testes novos cobrem plano de cinco refeições, pares idênticos, fonte local confirmada, escala por porção, todas as alternativas de proteína, macros, desconhecido versus zero, excedente, consumo/desfazer idempotente, transações concorrentes, cópias históricas, banco v4→v5 real, backup v5, reabertura, offline, virada de dia, acessibilidade e larguras 320–430 px. Rótulos sintéticos aparecem apenas nos testes; seus valores não foram usados no produto.

A vibração foi validada por chamada simulada à API (padrão `[200,80,250,80,350]`), preferência desativada, ausência/erro de suporte, animação e ausência de repetição ao reabrir. Isso não mede intensidade física. Movimento reduzido desativa partículas e animação. Safari/iPhone não oferece `navigator.vibrate`.

O download dos navegadores oficiais do Playwright foi bloqueado por `403 Domain forbidden`. O domínio Gymondo, o site Itambé e a URL de produção também estavam bloqueados. Portanto, esta rodada não comprova reprodução visual do Gymondo, rótulo Itambé, WebKit, produção ou deploy.


## Retomada 1.1.0

TypeScript/build aprovados; 96/96 testes Vitest e 47/47 Playwright locais (7 WebKit, 20 Chromium móvel, 20 desktop). Novos cenários: campos de horário 320–430 px e persistência; seis blocos acima da navegação; itens recolhidos/corrigíveis; treino sem detalhes e séries não realizadas; cardio com tempo/modalidade/velocidade; fechamento de dia sem inventar medidas; plano hormonal informado separado das administrações, conclusão e correção do bloco. Migração v2→v3 preserva histórico e impede gravação por validação v2. Backups v3 mantêm os novos campos; backups v2 são importáveis. Regressão cobre offline, atualização PWA com formulários pendentes, backup e troca de origem.

Os testes conferem o plano informado incluído no app e usam lançamentos sintéticos para verificar persistência e correção. Nenhuma administração real do usuário é publicada. WebKit em Linux não substitui validação em iPhone físico.

## Estado final da integração Vercel · 16/10/2026

- CI da preparação: **86/86 Vitest e 26/26 Playwright**, TypeScript/build/auditoria aprovados. [Run](https://github.com/oaovito/oaolife/actions/runs/38971627148).
- URL real https://oaolife.vercel.app: **22/22 Playwright**, nos dois perfis, incluindo offline, persistência, calendário, séries, refeições, água, cardio, protocolo, backup/restauração, tema, rotas e axe. Os dois cenários que modificam o SW no servidor local ou usam duas origens locais permanecem na suíte local/CI; não modificam artificialmente produção.
- `node --use-env-proxy scripts/verify-hosting.mjs https://oaolife.vercel.app`: aprovado, HTML/oito rotas/manifest/ícones/SW/headers/404. HTTPS validado com a CA do ambiente. Chromium recebeu confiança restrita na chave da CA do proxy do ambiente; as primeiras tentativas sem essa confiança falharam no certificado do proxy e foram corrigidas na configuração de execução, sem mudar o aplicativo.
- Preview Ready acessível pela CLI autenticada (200), com os mesmos assets da produção. OIDC local para preview retornou incompatibilidade de ambiente; proteção foi preservada e os fluxos browser foram exercitados no endereço público.
- Prévia automática do PR #2 (target preview) Ready; **1/1 teste browser** de refeições/água/persistência passou com OIDC local, sem alterar proteção. O erro de ambiente anterior ocorreu no target staging da API.
- CI main c3fd4a4: [aprovada](https://github.com/oaovito/oaolife/actions/runs/38973269912).
- Merge aprovado do PR #1, commit c3fd4a4, acionou automaticamente Vercel produção dpl_3EJCjkimtcP4WjpxhrbfDBiQdvef, Ready e domínio público confirmado.
- Processo Chromium fechado e reaberto com perfil persistente manteve um registro sintético; revalidação de SW e recarga offline também mantiveram o dado. Nenhum dado real de saúde usado.
- Nenhum teste em iPhone/Safari físico afirmado. Sem transporte remoto de dados para testar.

Os resultados abaixo são o histórico incremental; o estado acima prevalece.

Comandos executáveis: `npm run check` (TypeScript + Vitest), `npm run build`, `npm run test:e2e` (Playwright), `npm audit --omit=dev`.

## Cobertura

- Calendário: todas as datas 16–25/10/2026, sábado→domingo→segunda, ano bissexto, troca de ano, ciclo independente, reagendamento e proteção de histórico.
- Treino: ordem e 26 séries do C2, modalidade por lado, referências desconhecidas, séries individuais, cópia, conclusão parcial e persistência.
- Periodização: 12 semanas, orçamento arredondado, prioridades, volumes diretos, semanas 4/8 e FST adaptado sem extras.
- Progressão: topo de faixa, incremento real, RIR, execução, recuperação, modalidades, exposição seguinte, histórico e desfazer.
- Dia: cinco refeições, próxima refeição e parciais; seis garrafas, volume personalizado, substituição sem duplicação; independência e conclusão geral.
- Cardio: acumulado, iniciar/pausar/retomar/finalizar, duração manual e retomada por timestamp.
- Mobilidade: protocolo ausente nunca conclui, checklist real, série definida e independência da musculação.
- Armazenamento: reabertura, operação interrompida, concorrência, rollback, fila, migração não destrutiva e ciclos anteriores.
- Backup: roundtrip criptográfico, senha errada, adulteração, relações e schema inválidos.
- Indicadores: dados reais, ausência versus zero, média de peso incompleta, receitas com nutrientes desconhecidos e relatório sem meta obrigatória.
- Browser: fluxos reais, offline com Service Worker, virada local de dia e foco, layout 393×852 e desktop 1440×1000, axe WCAG 2 A/AA e 2.1 AA.

## Resultados observados

Primeira rodada: 79 testes Vitest aprovados e build de produção aprovado. Auditoria de dependências de produção: zero vulnerabilidades reportadas. Rodada ampliada: cardio, protocolo real, backup criptografado/restauração, atualização do Service Worker e tema passaram em ambos os perfis (10 testes). Foi corrigido um problema real de ativação do Service Worker: o controle agora usa eventos nativos e recarrega somente após ativação solicitada e segura. Rodada final consolidada: 83 testes Vitest e 22 testes Playwright aprovados (11 fluxos em dois perfis), TypeScript e build aprovados. Axe não reportou violações nos quatro destinos principais. Pipeline remoto ainda será verificado; ver context.md.

Salvamento é assíncrono: o teste de recarga aguarda confirmação de commit. Uma operação interrompida antes do commit é revertida atomicamente; o aplicativo não afirma que um clique ainda em gravação já é durável. Antes de sair durante uma gravação, o navegador recebe um alerta quando suportado.

## Limites

Chromium com viewport/fuso móvel não é um iPhone físico. Safari/iOS, instalação real na Tela de Início, comportamento de armazenamento do sistema e splash controlado pelo iOS exigem validação em aparelho. Pipeline e deploy só são validados após execução no GitHub; não estão comprovados pela compilação local. Não há testes de sincronização com backend inexistente.


## Resultado remoto

[Verificar oaolife](https://github.com/oaovito/oaolife/actions/runs/38968715539) concluiu com sucesso no commit de implementação 5fd8aa2. [Publicar oaolife](https://github.com/oaovito/oaolife/actions/runs/38968715549) passou por testes e builds, mas falhou ao criar o site Pages por falta de permissão da integração. Não há validação de publicação ou teste HTTPS em produção. Os critérios do pipeline são parcialmente comprovados: execução e verificações sim, deploy final não.


## Integração Vercel preparada

Em feat/vercel-hosting: TypeScript, build e **86/86 testes Vitest** aprovados; **26/26 testes Playwright** aprovados nos perfis mobile/desktop. Foram acrescentadas rotas internas com recarga/voltar, backup e restauração entre 127.0.0.1 e localhost (origens distintas) e proteção contra ativação do SW durante formulário não salvo. A mesma revisão salva libera a atualização; edições pendentes continuam bloqueadas.

Nenhum schema ou plano de treinamento/nutrição foi alterado. A migração do banco e os demais registros seguem cobertos. Esta rodada valida a preparação local, não valida Vercel, certificado, headers efetivos, domínio de produção ou transferência de registros reais. Scripts de verificação do endereço estão preparados para execução após a autenticação/deploy. Instalação em iPhone físico permanece pendente.


CI da preparação Vercel confirmada: https://github.com/oaovito/oaolife/actions/runs/38971287133, commit d9b651d. Instalação pelo lockfile, 86 Vitest, build, auditoria e 26 Playwright passaram. Continua pendente a validação de uma URL Vercel, pois a conta ainda não está autenticada nesta sessão.

### Estabilidade horizontal (novembro/2026)

`e2e/horizontal-layout.spec.ts` percorre dez rotas em 320, 375, 390,
430 e 1440 px, com detalhes abertos e fechados. Verifica tanto o documento
quanto `.main-shell` (o verdadeiro scroller móvel), limites dos elementos,
conteúdo interno dos indicadores e tentativas de `scrollLeft`.
O teste de toque usa eventos reais via CDP no projeto Chromium móvel para
arrastos laterais, diagonais e verticais; é explicitamente ignorado nos
outros motores, que não oferecem essa API.

`e2e/horizontal-interactions.spec.ts` verifica consumo/desfazer refeições,
água personalizada offline após recarregar, campos e conclusão de séries,
orientação, cronômetros, confirmação de reinício e persistência do tema.
Ambos os arquivos também rodam no projeto WebKit. Os testes existentes de
PWA verificam áreas seguras e mudanças simuladas do teclado. Isso não
substitui validação em Safari num iPhone físico nem testa gestos do sistema.

Causa reproduzida: a 320 px, a grade de indicadores do treino aumentava a
largura rolável de `.main-shell` para 355 px. O documento continuava em
320 px, portanto verificar apenas `documentElement.scrollWidth` não
capturava o defeito. Colunas com mínimo zero, conteúdo responsivo e proteção
horizontal no scroller corrigem a origem sem bloquear `touchmove`.

Validação local desta correção: `npm run check` (141 testes), `npm run build`
e suíte Playwright completa (95 aprovados, 2 gestos CDP não aplicáveis
ignorados). O ambiente usou Chromium instalado e WebKit WPE headless com
bibliotecas em scratch, via configuração local temporária; nenhuma dependência
ou arquivo de lock foi alterado. Não há script de lint configurado.
