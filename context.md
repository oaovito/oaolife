> **Nota (26/11/2026):** as diretrizes vigentes estão em [CLAUDE.md](CLAUDE.md) e [docs/](docs/). Este arquivo é histórico; decisões posteriores prevalecem.

# oaolife — continuidade

## Retomada no Codex — versão 1.1.0 preparada

- Escopo recuperado por capturas do chat: fluxo compacto, horários no iPhone, destaque de séries/RIR/descanso, cardio de 60 min e 5 km/h, conclusão sem detalhes e indicação de séries não realizadas.
- Itens feitos ficam recolhidos e corrigíveis. Seis blocos cabem acima da navegação em 393×852; campos de horário testados em 320/360/393/430 px.
- Novos dias de cardio usam esteira, 60 min e meta mínima 5 km/h; velocidade real começa nula. Histórico mantém metas e medições; nova meta em dia existente exige ação explícita.
- Séries feitas aceitam campos nulos, mas progressão exige todos os dados anteriores. Séries não realizadas não contam como executadas.
- “Concluir dia sem detalhar” grava declaração local, sem inventar doses, cargas, tempos, porções ou calorias. Pode fechar sessão aberta preservando somente as séries detalhadas e encerrar cronômetros pela duração real. Correção desfaz a declaração. Links aceitam `?date=AAAA-MM-DD`.
- Pedido sobre um dia anterior requer execução no dispositivo que contém os registros: não há backend para modificar remotamente o armazenamento do iPhone. Nenhuma administração ou medição realizada foi semeada no código.
- Registro hormonal como sexto bloco da rotina: plano informado incorporado, períodos e segundo dia desconhecido preservados. Administrações reais separadas; concluir/reabrir o bloco não preenche doses. Mesmo IndexedDB, auditoria e backup dos demais blocos. Sem importação separada, conforme correção explícita do usuário.
- IndexedDB e payload sob schema 3; importação compatível com backups v2. A validação literal do código antigo rejeita snapshots v3 antes de escrever, impedindo perda dos novos campos. Novo backup usa formato oaolife-backup-3; não fazer rollback para código v2.
- Verificação local: TypeScript/build, 96 Vitest e 47 Playwright aprovados (7 WebKit + 20 Chromium móvel + 20 desktop). Inclui backup/restauração entre origens, offline, atualização segura, migração e preservação de campos desconhecidos. Safari/iPhone físico não foi testado.
- WebKit local usou bibliotecas Debian extraídas no workspace e wrapper local preservando LD_LIBRARY_PATH; o app não incorpora essas bibliotecas. CI instala dependências oficiais de Chromium/WebKit.
- Publicação desta retomada: PR #3 aberto; aguardando CI do ajuste final e merge; a URL de produção existente ainda não comprova a versão 1.1.0.

O estado acima prevalece sobre as notas históricas abaixo.

## Estado atual — Vercel publicada, versão 1.0.0
- URL HTTPS pública confirmada: https://oaolife.vercel.app. Projeto oaolife, conta oaovito, equipe oao7, plano Hobby. Projeto prj_3IBSBETJUAlsyzDW4AYcHTbGKlAZ. Nenhum serviço pago contratado.
- Autorização concluída por login seguro da CLI; MCP Vercel apareceu, mas recusou o escopo oao7 com 403. Fallback oficial CLI autenticado funcionou. Credenciais locais fora do Git; nenhum token no cliente ou na documentação.
- GitHub oficial conectado, productionBranch main. PR #1 incorporado após CI aprovada e prévia Ready. Commit c3fd4a4e070903d25d88294b8ca17c2e1cf930a6 acionou automaticamente o deployment de produção dpl_3EJCjkimtcP4WjpxhrbfDBiQdvef, Ready, com alias oaolife.vercel.app.
- Prévia dpl_DH283hm1BBNxGraAftpbgVwMbQrK Ready (target staging na API); acesso protegido por CLI oficial retornou HTTP 200. Os assets coincidiram com a produção. OIDC de desenvolvimento foi recusado por TRUSTED_SOURCES_ENVIRONMENT_MISMATCH; proteção não foi desabilitada. Testes browser foram executados no domínio público.
- Prévia nativa automática do PR #2 confirmada Ready: dpl_GEVzsrVUm9XzM3ErZ4i7Tqy1vB5x, https://oaolife-4muon2zwa-oao7.vercel.app. Um teste browser passou autenticado por OIDC local. A incompatibilidade anterior foi no target staging, não no preview nativo.
- CI de main c3fd4a4 aprovada: https://github.com/oaovito/oaolife/actions/runs/38973269912. Pages ainda falhou nessa execução anterior à mudança para fallback manual; Vercel independente terminou Ready.
- Qualidade: 86/86 Vitest + 26/26 Playwright na CI da preparação; mais 22/22 Playwright na URL real, em Chromium mobile/desktop. Script HTTPS aprovou HTML, oito rotas, manifest, ícones, Service Worker, headers e 404 de asset ausente. TypeScript/build/auditoria de produção aprovados na CI.
- Reabertura real de processo Chromium com perfil persistente, consulta ao SW e recarga offline mantiveram um registro sintético de hidratação. Dados privados do usuário nunca foram enviados ao servidor.
- Banco IndexedDB schema 2 preservado; nenhuma alteração no domínio ou nos registros de treinamento durante integração. Backup/restauração AES-GCM testados localmente e na URL real. Sem backend ou sincronização remota.
- GitHub Actions mantém CI. Pages preservado como fallback manual após Vercel validada; não existe endereço Pages publicado confirmado. Migração de domínio só será necessária se o usuário tiver dados em outra origem; ensaio de exportação/importação entre duas origens locais passou, transferência de registros reais não foi afirmada.
- Consulta administrativa de branch protection retornou 403. Não se afirma que verificações obrigatórias foram configuradas; merges desta entrega são precedidos de checks aprovados.
- Pendências: instalação e uso em Safari/iPhone físico; cadastro pelo usuário da semana atual do ciclo, incrementos reais, duração do cardio e protocolo habitual. Sem dados inventados. Nutrição cadastrada ainda não calcula automaticamente macros dos itens fixos das refeições.
- Os itens abaixo registram a evolução histórica, inclusive bloqueios de publicação que foram superados pela Vercel. Este estado atual prevalece.

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
- Publicação nativa GitHub–Vercel; GitHub Actions verifica qualidade. Repositório privado pode limitar GitHub Pages no plano gratuito; não alterar visibilidade automaticamente.

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
