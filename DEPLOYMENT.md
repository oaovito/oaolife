# Publicação

## Destino confirmado · 16/10/2026

| Campo | Configuração real |
|---|---|
| URL definitiva | https://oaolife.vercel.app |
| Projeto | oaolife |
| Conta / equipe | oaovito / oao7 |
| Plano | Hobby, sem recursos pagos contratados |
| ID do projeto | prj_3IBSBETJUAlsyzDW4AYcHTbGKlAZ |
| Repositório oficial | https://github.com/oaovito/oaolife |
| Produção | main |
| Framework / Node | Vite / 24.x |
| Instalação / build / saída | npm ci / npm run build / dist |
| Variáveis obrigatórias do app | Nenhuma |
| BASE_PATH | Ausente ou /; /oaolife/ é exclusivo do fallback Pages |

O domínio foi confirmado na conta e testado por HTTPS. Não é necessário App Store, Apple Developer, TestFlight ou serviço pago. Instalar no Safari → Compartilhar → Adicionar à Tela de Início. Primeiro carregamento conectado para precache. Instalação em iPhone físico ainda não foi exercitada nesta sessão.

## Integração oficial e evidências

Autorização segura pela CLI Vercel na conta existente. O MCP Vercel não teve acesso ao escopo oao7 (403); foi usado o fallback oficial CLI com a própria autenticação, sem tokens no chat. Projeto criado após listar e confirmar ausência de associação existente. GitHub conectado a oaovito/oaolife, productionBranch main. Nenhum outro repositório criado.

- Preparação revisada no [PR #1](https://github.com/oaovito/oaolife/pull/1), com [CI aprovada](https://github.com/oaovito/oaolife/actions/runs/38971627148).
- Deploy inicial dos arquivos já verificados: dpl_Eno1K1kRgPJuAAsLjdzSHfe1mCeE. A API promoveu o primeiro deploy automaticamente para production; essa inicialização não comprova automação por merge.
- Prévia: dpl_DH283hm1BBNxGraAftpbgVwMbQrK, Ready, target staging na API, https://oaolife-b0fuy2ofg-oao7.vercel.app. Acesso protegido pela CLI retornou 200; assets idênticos à produção. OIDC de desenvolvimento retornou TRUSTED_SOURCES_ENVIRONMENT_MISMATCH; não foi desabilitada a proteção.
- **Prévia automática comprovada:** push/PR #2 da branch docs/vercel-release gerou dpl_GEVzsrVUm9XzM3ErZ4i7Tqy1vB5x, Ready, target preview, https://oaolife-4muon2zwa-oao7.vercel.app. OIDC local funcionou na prévia normal; um teste browser de refeições/água/persistência passou. A recusa anterior dizia respeito ao deploy staging, não ao preview nativo.
- **Automação comprovada:** merge do PR #1 gerou commit c3fd4a4e070903d25d88294b8ca17c2e1cf930a6 em main. A integração GitHub acionou dpl_3EJCjkimtcP4WjpxhrbfDBiQdvef automaticamente; terminou Ready, com https://oaolife.vercel.app e https://oaolife-git-main-oao7.vercel.app.
- `scripts/verify-hosting.mjs` e 22 testes Playwright passaram na URL definitiva. Perfil Chromium persistente foi fechado/reaberto, revalidou SW e manteve um registro sintético na recarga offline.

Não há aprovação automática de código. Fluxo de manutenção: branch → PR → CI e prévia → revisão → merge → produção nativa Vercel → verificação da URL. Consultas administrativas de branch protection retornaram 403; não se afirma que checks obrigatórios foram configurados. Respeitar as regras efetivas do repositório e conferir os checks antes de cada merge.

GitHub Actions mantém `.github/workflows/ci.yml`. `.github/workflows/deploy.yml` preserva Pages como **fallback manual** por workflow_dispatch após Vercel validada, evitando publicação automática duplicada. O deploy nativo Vercel não precisa de segredo GitHub Actions VERCEL_TOKEN.

## Rotas, cache e atualizações

Rotas: /, /treino, /alimentacao, /hidratacao, /cardio, /mobilidade, /plano, /evolucao e /ajustes. vercel.json reescreve caminhos sem extensão para index.html; arquivos estáticos ausentes retornam 404. Atualizar uma rota interna funciona. PWA start_url abre o dashboard.

HTML/manifest revalidam; assets com hash usam cache imutável de um ano; /sw.js usa no-cache/no-store, escopo /. Headers de segurança incluem CSP, nosniff, Referrer-Policy, X-Frame-Options e HSTS. Recursos foram verificados em HTTPS com certificado aceito pelo cliente. Nenhum dado pessoal integra o cache de recursos.

Service Worker precacheia o build e espera ativação segura. O botão Atualizar agora permanece visível. Formulário não salvo ou gravação em curso bloqueiam a ativação; sessões e cronômetros já persistidos continuam após a recarga. Ajustes oferece Verificar atualizações, com estado de verificação e mensagem offline. A interface não força recarga ao receber controllerchange de outra aba. Retorno conectado/visível/foco solicita verificação. iOS fechado não é considerado executor em segundo plano. O teste de substituição real do SW e preservação de dados passou localmente; a hospedagem foi verificada para registro/cache/offline/checagem de atualização, sem alterar produção só para simular versões.

Verificação operacional: `node scripts/verify-hosting.mjs https://oaolife.vercel.app` em ambiente com acesso HTTPS. Em executores com proxy de ambiente, Node 24 pode exigir `--use-env-proxy`. Esses comandos são documentação de manutenção, não tarefas manuais exigidas do usuário.

## Persistência e migração de domínio

IndexedDB oaolife, schema 2. Esta integração não muda IDs, schema, plano original, cargas, séries ou histórico. Publicação de arquivos não limpa IndexedDB. Não há backend/sincronização remota; Vercel hospeda código e GitHub versiona código.

Não houve endereço Pages publicado confirmado. Não há evidência de usuários em uma origem antiga nesta sessão, mas armazenamento de outros dispositivos não pode ser inspecionado. Se existirem registros em outro endereço, a migração é necessária:

1. Exportar .oaolife criptografado em Ajustes no endereço antigo e guardar fora do navegador, com senha.
2. Abrir o domínio definitivo e importar; conferir resumo e confirmar RESTAURAR.
3. Conferir dias, sessões, cargas, fotos e configurações; reabrir offline.
4. Manter endereço e dados antigos até concluir a conferência. Um redirect não transfere IndexedDB entre origens.

Backup/restauração foram testados na URL publicada, e a transferência entre duas origens locais distintas foi validada. Não se afirma que registros reais do usuário foram transferidos entre domínios. Backups externos continuam necessários porque o sistema/usuário pode remover armazenamento local.

## Segurança, falhas e rollback

Sem segredos necessários ao frontend ou variáveis VITE_ privilegiadas. .env*, .vercel/, registros, backups e arquivos privados estão excluídos de Git e upload. Tokens de CLI/OIDC/bypass ficam somente nos mecanismos locais seguros, nunca em commits. Preview usa dados sintéticos e Deployment Protection nativa. Não desabilitar proteção para facilitar testes; usar CLI autenticada.

Falhas aparecem nos estados/logs nativos de build/deploy Vercel e nos checks do GitHub. Não há monitoramento externo contínuo contratado ou configurado, nem telemetria de saúde. Erros locais de inicialização/atualização têm mensagens na interface.

Para reverter: selecionar deployment anterior compatível no projeto e promover pelo mecanismo nativo, conferir alias, HTTPS, rotas e offline. Um rollback pode suspender atribuição automática de domínios até nova promoção; conferir o estado antes de retomar o fluxo. Nunca apagar IndexedDB para voltar código. Schema 2 permanece compatível nesta entrega; alterações futuras de schema exigem migração testada, backup e estratégia de retorno. Não executar downgrade destrutivo.

## Histórico Pages

No commit inicial 5fd8aa2, CI passou. [Pages falhou](https://github.com/oaovito/oaolife/actions/runs/38968715549) em actions/configure-pages com “Resource not accessible by integration”, depois dos testes/build aprovados. O repositório privado e a visibilidade foram preservados. Pages não foi removido, mas sua configuração manual depende das permissões/plano GitHub. A Vercel resolve o acesso HTTPS atual; não é necessário habilitar Pages para usar o aplicativo.
