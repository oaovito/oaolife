# oaolife — continuidade

## Auditoria inicial · 16/10/2026
- Repositório oficial privado: https://github.com/oaovito/oaolife.git.
- Inspeção via API e clone: repositório vazio, sem branches, arquivos ou commits. Branch padrão configurada: main.
- Nenhum AGENTS.md ou contexto anterior encontrado no checkout. Nenhum código ou dado anterior foi removido.
- Autorização: implementar, testar, documentar, registrar commits e publicar gratuitamente no repositório oficial. Não criar outro repositório nem publicar registros pessoais.

## Arquitetura e decisões
- React + TypeScript + Vite, Tailwind, Dexie/IndexedDB; domínio puro separado da UI.
- Plano original versionado e imutável. Sessões realizadas preservam seu planejamento; adaptações só afetam sessões futuras.
- Operações locais transacionais com revisão, auditoria e fila persistente. Sem backend remoto: nunca declarar dados sincronizados.
- Backup criptografado por senha. Sem telemetria ou envio de saúde a terceiros.
- PWA com precache, atualização sob controle e proteção durante sessão ativa.
- Publicação preferencial via GitHub Actions e hospedagem estática gratuita. Repositório privado pode limitar GitHub Pages no plano gratuito; não alterar visibilidade automaticamente.

## Plano incremental
1. Núcleo de calendário, periodização, progressão e persistência.
2. Dashboard e registros independentes de treino, refeições, água, cardio e mobilidade.
3. Acompanhamento, histórico, gráficos, relatório e ciclos.
4. Backup, PWA, atualização segura e acessibilidade.
5. Testes, documentação, commits e publicação validada conforme recursos disponíveis.

## Estado intermediário
- Núcleo implementado: plano original, calendário fixo independente do ciclo, 12 semanas, séries individuais, dupla progressão conservadora, alimentação, hidratação, cardio e protocolo configurável.
- Interface React integrada: cinco blocos, datas passadas/futuras, plano e reagendamentos, gráficos SVG com tabela, medidas, sono/recuperação, fotos locais, relatório e ciclos novos.
- Dexie transacional, revisão/auditoria/outbox local-only, backup AES-GCM e restauração revisada. Sem backend remoto.
- Manifest, ícones, safe areas e Service Worker com ativação protegida por eventos nativos. A primeira implementação de ativação foi corrigida após falha observada em Playwright. Workflows CI/Pages escritos, ainda não validados remotamente. Consulta à API Pages pela integração retornou HTTP 403: Resource not accessible by integration.
- Compilação TypeScript/build aprovada. 83 testes Vitest aprovados, incluindo encerramento real de sessão com progressão e desfazer. Auditoria de dependências de produção sem vulnerabilidades reportadas.
- Playwright final: 22/22 testes aprovados, 11 fluxos em Chromium mobile (393×852, fuso America/Sao_Paulo) e desktop (1440×1000). Inclui calendário, registros, offline, reabertura, meia-noite/foco, axe/layout, cardio, protocolo, backup/restauração, atualização real do SW e tema. Build de produção aprovado, precache de cerca de 589 KiB. Nenhuma validação em aparelho físico presumida.
- Código publicado em main, commit 5fd8aa28512d26a71b4a459d864d4bbda0cb342c. Não há URL de produção confirmada: habilitação do Pages bloqueada por permissão.

## Limites explícitos da primeira versão
- Sem validação em iPhone físico ou Safari real até o momento.
- Sem sincronização remota; outbox preservada localmente, sem fingir sincronização.
- Nutrição cadastrada não vincula automaticamente macros aos itens fixos de cada refeição; estimativas originais continuam provisórias.
- Banco local não tem criptografia própria; depende do bloqueio do dispositivo. Backups têm criptografia autenticada.
- Backup limitado a aproximadamente 50 MB de conteúdo e agregado pode ficar pesado com muitas fotos.
- Operações só são consideradas salvas após confirmação da transação. Fechamento antes do commit reverte a operação incompleta, sem deixar registros pela metade.
- GitHub Pages para o repositório privado depende do plano/permissões da conta. Não mudar visibilidade nem criar repositório alternativo.

## Dados que dependem do usuário no aplicativo
Data inicial do ciclo; duração exata de cardio; incrementos reais das máquinas; composição do molho e rótulos; protocolo habitual de hipercifose.

## Correção de calendário solicitada em 16/10/2026
- Referência obrigatória: sábado 17/10/2026 = C2. Segunda A1, terça B1, quarta C1, quinta A2, sexta B2, sábado C2, domingo descanso.
- Calendário semanal independe da data inicial e da semana da periodização. Sem ciclo configurado, exibir a sessão de referência e pedir a semana antes de gerar séries ajustadas.
- Data civil local revalidada à meia-noite, no foco, pageshow e retorno do segundo plano. Sem rede. Seleção histórica não segue a virada de dia; opção Hoje acompanha o dia corrente.
- Não reiniciar ciclo nem alterar snapshots de sessões registradas ao atualizar calendário.
- Reagendamento explícito troca somente as duas datas escolhidas, preservando a sequência semanal seguinte.

## Ambiente
Node 24 e npm 11 disponíveis. Rede de comandos precisa da permissão de rede adicional; clone oficial realizado. Conector GitHub conectado. Credenciais não devem ser exibidas ou persistidas.


## Entrega validada e bloqueio de publicação · 16/10/2026
- Versão do aplicativo: 1.0.0. Código enviado ao repositório oficial; árvore de trabalho limpa no commit de implementação.
- Local: TypeScript, build, 83 testes Vitest e 22 testes Playwright aprovados; auditoria de produção sem vulnerabilidades reportadas.
- CI remoto **aprovado** no mesmo commit: https://github.com/oaovito/oaolife/actions/runs/38968715539 (job verify). Instalação pelo lockfile, TypeScript, Vitest, build, auditoria e Playwright passaram no runner Ubuntu/Node 24.
- Pipeline de publicação executado: https://github.com/oaovito/oaolife/actions/runs/38968715549. Validações, testes e builds passaram, incluindo BASE_PATH=/oaolife/. Falhou em actions/configure-pages@v5: Get Pages site: Not Found; Create Pages site: Resource not accessible by integration. Job deploy não chegou a publicar.
- A integração CLI também recebeu HTTP 403 ao consultar Pages. Não se pode afirmar que basta repetir o mesmo token, nem inferir o plano da conta a partir desse erro.
- Necessidade externa: proprietário habilitar Pages com origem GitHub Actions em https://github.com/oaovito/oaolife/settings/pages, quando permitido pelo plano/permissões, ou disponibilizar hospedagem gratuita já autorizada. Não criar outro repositório, mudar visibilidade nem assumir despesas.
- Pergunta enviada ao usuário solicitando a liberação da hospedagem ou identificação de alternativa já autorizada; sem resposta até a atualização deste documento.
- Um commit posterior apenas de documentação registra estes resultados com [skip ci], evitando repetir verificações de código que não mudou.

## Próximos passos concretos
1. Após a hospedagem ser liberada, executar workflow_dispatch de Publicar oaolife no main, acompanhar até o resultado terminal e verificar a URL HTTPS retornada.
2. Testar a URL real, manifest, Service Worker e registro offline no caminho publicado; não divulgar uma URL prevista como se estivesse pronta.
3. Validar em iPhone/Safari físico: Adicionar à Tela de Início, safe areas, reabertura offline e atualização. Não está considerado testado pelo Chromium.
4. No app, configurar separadamente a semana do ciclo, os incrementos reais, o cardio e o protocolo habitual. Calendário já alinhado à referência 17/10/2026=C2.
5. Manter backups externos; decidir sobre backend privado apenas em trabalho posterior autorizado. Modo local segue completo para os registros implementados.

## Critérios ainda não comprovados
Publicação HTTPS, instalação em aparelho físico e pipeline de deploy até a etapa final. Portanto a entrega não pode ser declarada integralmente pronta para uso no iPhone enquanto esses pontos não forem resolvidos. Backend remoto não é anunciado como implementado.
