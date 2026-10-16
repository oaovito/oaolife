# oaolife — continuidade

## Estado atual — integração Vercel
- Preparação na branch feat/vercel-hosting, derivada de main e preservando commit local de documentação b190baf. Código funcional anterior em origin/main: 5fd8aa2, CI remota aprovada.
- Configuração Vercel, rotas internas, headers/cache, proteção de formulários e verificação de hospedagem prontas. Testes locais da preparação: 86/86 Vitest e 26/26 Playwright; TypeScript/build aprovados.
- Vercel ainda não instalada/conectada: busca confirmada retornou installed:false após a sugestão de autorização. Ambiente sem credenciais Vercel configuradas. Projeto, plano efetivo da conta, domínio, preview e produção não confirmados.
- Conta existente/Hobby autorizados pelo usuário. Solicitar somente autorização segura da integração Vercel, sem senha/token no chat. Não criar repositório alternativo ou serviço pago.
- Pages e CI preservados. Consulta administrativa de branch protection e leitura de deployments via integração GitHub retornaram 403; não se afirma que proteções obrigatórias foram configuradas ou que não existem.
- Não existe URL HTTPS de produção confirmada. Não declarar tarefa concluída até publicar e validar.

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


## Integração Vercel em andamento · 16/10/2026
- Autorizado usar a conta Vercel existente, Hobby, domínio gratuito disponível próximo de oaolife.vercel.app, integração oficial com oaovito/oaolife/main. Sem custos, sem outro repositório, sem retirar Pages antes de validar Vercel.
- Auditoria retomada: main remoto com implementação 5fd8aa2; commit local b190baf de documentação ainda estava à frente do remoto após interrupções de envio. Criada branch feat/vercel-hosting, preservando ambos.
- React/Vite, npm ci, npm run build, saída dist, Node 24; nenhuma variável secreta necessária ao aplicativo. BASE_PATH deve ficar ausente ou / na Vercel.
- Não existe vercel.json ou .vercel/project.json anterior no checkout; nenhum projeto Vercel confirmado. Não houve deploy anterior confirmado e não há evidência de usuários num domínio publicado, mas não é possível inspecionar armazenamento de outros dispositivos.
- Plugin Vercel encontrado como disponível e não instalado; sugestão de instalação/autorização emitida. Conta ainda não confirmada conectada. Ambiente não possui secrets/runtime variables Vercel configuradas; não pedir tokens no chat.
- Preparados vercel.json (Vite/build/dist, SPA sem reescrever arquivos estáticos ausentes, headers e política de cache), engines Node 24 e exclusões de arquivos locais.
- Em desenvolvimento: bloqueio de atualização durante formulários não salvos e rotas internas leves. Nenhuma mudança no plano clínico, na periodização ou no schema IndexedDB.
- Workflows Pages/CI preservados até Vercel ter produção confirmada. Próximo passo dependente: autorização segura da integração Vercel. Demais testes/documentação seguem em paralelo.


## Validação da preparação Vercel
- Rodada final local: 86 testes Vitest, 26 testes Playwright, TypeScript e build aprovados. A primeira rodada encontrou e corrigiu a associação do formulário à confirmação de commit: microtask podia limpar o token antes do handler React; a associação agora dura até o fim da tarefa. Teste real confirmou bloqueio e liberação da atualização após salvar.
- Ensaio entre duas origens locais: destino começou vazio, importação criptografada restaurou o volume e origem antiga continuou preservada. Não representa migração de um domínio Vercel já publicado.
- Nenhuma alteração em src/domain/model.ts, plan.ts, training.ts ou progression.ts nesta integração. Schema IndexedDB permanece 2; nenhuma limpeza de dados.
- vercel.json e engines: Vite / npm ci / npm run build / dist / Node 24.x. Branch de produção desejada main; domínio desejado só será divulgado após confirmação do provedor.
- scripts/verify-hosting.mjs pronto para verificar uma URL HTTPS real; não executado sem URL confirmada.
- Documentação atualizada: README, ARCHITECTURE, DEPLOYMENT, TESTING, SYNC e SECURITY. Acompanhamento da branch/PR e autenticação são os próximos passos.


## Ponto de continuidade confirmado — Vercel aguarda autenticação
- Preparação enviada à branch feat/vercel-hosting, commit de código d9b651d49395d821e05631ebce413354648c1a70.
- PR aberto e revisável: https://github.com/oaovito/oaolife/pull/1. Base main 5fd8aa2. Mantido aberto para conectar/validar a prévia Vercel antes de concluir a integração na produção.
- CI remota da preparação **aprovada**: https://github.com/oaovito/oaolife/actions/runs/38971287133, job verify. npm ci, TypeScript, 86 Vitest, build, auditoria e 26 Playwright passaram no runner Ubuntu/Node 24.
- Estado de acesso mais recente: plugin Vercel ainda installed:false; nenhuma ferramenta Vercel autenticada disponível e nenhum segredo Vercel no ambiente. Sugestão de instalação/autorização emitida uma vez. Não repetir a sugestão se o usuário confirmar conexão; redescobrir ferramentas e continuar a tarefa original.
- Não criar uma hospedagem diferente ou outro repositório para contornar essa autorização. Não pedir tokens/senhas no chat. Só é necessária a instalação/autorização segura da integração com a conta existente neste ponto.
- Não há projeto/domínio/deploy de prévia/produção confirmados. oaolife.vercel.app é apenas preferência do usuário, não um endereço publicado.
- Continuar após autorização: listar contas/projetos, confirmar Hobby, reutilizar projeto associado ou criar no repo oficial, ligar GitHub e main, validar prévia desta branch, incorporar somente após checks/regras, publicar, executar scripts/verify-hosting.mjs na URL real e testes browser publicados; só então tornar Pages fallback manual.
- Documentação posterior ao código aprovado apenas registra esses resultados; não muda o build, dados ou regras de negócio.
