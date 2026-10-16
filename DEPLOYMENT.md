# Publicação

## Vercel — preparação atual

A Vercel foi autorizada como destino de hospedagem em 16/10/2026, com a conta existente do usuário, plano Hobby e domínio gratuito disponível. **Ainda não há conta autenticada, projeto, domínio ou deploy Vercel confirmados.** A integração foi encontrada e sua instalação/autorização foi solicitada pelo mecanismo seguro; nenhuma senha ou token foi pedido no chat.

Configuração derivada do checkout em `vercel.json`:

| Campo | Valor preparado |
|---|---|
| Framework | Vite |
| Produção | main, após revisão e verificações |
| Instalação | npm ci, com package-lock.json |
| Build | npm run build |
| Saída | dist |
| Node | 24.x, conforme ambiente e CI existentes |
| Variáveis obrigatórias do app | Nenhuma |
| BASE_PATH | Ausente ou / para raiz Vercel; /oaolife/ é exclusivo de Pages |
| Domínio | A confirmar na conta; preferência oaolife.vercel.app se disponível |

A configuração foi preparada em `feat/vercel-hosting`. Não contém IDs de projeto inventados nem credenciais. `.vercel/` e arquivos privados estão excluídos. Antes de criar projeto, é necessário listar os projetos da conta autenticada e reutilizar uma associação válida se ela existir.

Integração preferencial: importar oaovito/oaolife pela integração oficial GitHub–Vercel, confirmar conta/plano Hobby, produção main e prévias de PR. Não contratar plano ou recurso pago. A instalação GitHub da Vercel precisa ter acesso ao repositório privado oficial. Aprovar/mesclar alterações e publicar depois do merge são operações distintas; commits arbitrários não são considerados aprovados. A CI do GitHub é preservada. Configurar checks obrigatórios apenas quando plano/permissões permitirem; até lá, usar PR com checks aprovados antes do merge.

O workflow Pages continua preservado até a Vercel funcionar. Depois de um deploy HTTPS validado, manter Pages como fallback manual (`workflow_dispatch`), evitando duas publicações automáticas para o mesmo push. Não desligar um endereço antigo que contenha dados sem a migração revisada.

## Rotas, cache e verificações

Rotas de interface: /, /treino, /alimentacao, /hidratacao, /cardio, /mobilidade, /plano, /evolucao e /ajustes. `vercel.json` reescreve caminhos sem extensão para index.html. Arquivos JS/CSS/imagens ausentes devem retornar 404, não HTML. Ícones usam a base de build, preservando compatibilidade com o caminho anterior.

HTML, manifest e demais arquivos de nome estável revalidam. Assets com hash em /assets usam cache imutável de um ano. /sw.js usa no-cache/no-store e escopo /. O Service Worker precacheia recursos, não dados pessoais. Headers de segurança incluem CSP, nosniff, Referrer-Policy, X-Frame-Options e HSTS. A validade efetiva dos headers e rewrites deve ser verificada no deploy real.

`scripts/verify-hosting.mjs` recebe somente uma URL HTTPS real retornada pelo provedor e verifica HTML, rotas, manifest, ícones, tipo/cache de sw.js, headers e 404 de asset ausente. Este script ainda não foi executado em uma URL Vercel confirmada. Testes browser de instalação em aparelho físico são uma etapa separada.

## Migração de origem

Não houve publicação HTTPS confirmada nesta sessão anterior à Vercel. Não é possível inspecionar o armazenamento de outros dispositivos. Se houver registros em qualquer endereço antigo:

1. No endereço antigo, exportar um backup .oaolife com senha e verificar o download externo.
2. Abrir a URL definitiva nova, importar o arquivo com a mesma senha e revisar contagens antes de confirmar RESTAURAR.
3. Conferir dias, sessões, cargas, fotos e configurações no novo endereço, incluindo reabertura offline.
4. Manter o endereço e os dados antigos até a conferência. Não copiar IndexedDB por redirecionamento: o navegador isola por origem.

O ensaio automatizado usa duas origens locais distintas com registros sintéticos. Não comprova transferência de registros reais entre domínios de produção nem sua existência em dispositivos do usuário.

## Falhas e rollback

Falhas de build/deploy ficam nos resultados nativos da Vercel e nos checks GitHub quando conectados; não há monitoramento contínuo externo configurado. Erros de inicialização e de atualização têm mensagens locais. Não adicionar telemetria de saúde.

Para rollback, selecionar um deployment anterior compatível no projeto Vercel e promover pelo mecanismo nativo. Revalidar HTTPS, rotas e offline. Nunca limpar IndexedDB/Cache Storage pessoal para fazer rollback. Esta integração não altera o schema 2; voltar a uma versão compatível não deve exigir migração. Uma futura alteração de schema requer teste de compatibilidade e plano de recuperação antes de reverter o código. Guardar backup antes de migração de dados.

## Histórico do GitHub Pages

Repositório único: https://github.com/oaovito/oaolife. Não criar outro nem mudar visibilidade sem autorização. Não publicar registros de saúde.

Workflows:
- `.github/workflows/ci.yml`: instalação pelo lockfile, TypeScript, Vitest, build, auditoria de produção e Playwright.
- `.github/workflows/deploy.yml`: repete a validação obrigatória, constrói com `BASE_PATH=/oaolife/`, configura Pages, envia artefato e publica com `actions/deploy-pages`.

Push em main ou workflow_dispatch inicia o deploy. Publicação só ocorre se o job de validação passar. GITHUB_TOKEN usa permissões contents:read, pages:write e id-token:write; nenhum token é colocado no código. O pipeline usa o ambiente github-pages e concorrência sem cancelar publicação em curso.

O repositório é privado e Pages não estava configurado na auditoria inicial. Pages pode exigir um plano GitHub com suporte a repositórios privados; não há autorização para custos ou tornar o repositório público. Uma falha por essa limitação deve ser registrada exatamente, sem declarar URL pronta ou contornar criando outro repositório.

Nenhuma URL de produção está confirmada neste ponto. A URL esperada pelo padrão do GitHub só deve ser divulgada como aplicativo utilizável após sucesso do workflow e verificação HTTPS. Verifique context.md para o estado final desta sessão.

Atualizações: HTML e Service Worker detectam novos recursos no retorno conectado; ativação em espera evita interromper treino. Não se deve apagar IndexedDB nem exigir reinstalação. Antes de qualquer migração futura, acrescentar teste de preservação e manter backup compatível.


## Execução observada em 16/10/2026

Commit de implementação: `5fd8aa28512d26a71b4a459d864d4bbda0cb342c` em main.

- [CI aprovado](https://github.com/oaovito/oaolife/actions/runs/38968715539): testes, build e auditoria passaram no GitHub.
- [Publicação bloqueada](https://github.com/oaovito/oaolife/actions/runs/38968715549): todas as verificações e o build para /oaolife/ passaram; actions/configure-pages@v5 não conseguiu criar o site: **Resource not accessible by integration**. Nenhuma URL foi publicada.

A API pela integração também retornou HTTP 403. É preciso habilitar Pages pelo proprietário em Configurações → Pages → origem GitHub Actions, se permitido pelo plano/permissões, ou disponibilizar outra hospedagem gratuita autorizada. Não foi feita mudança de visibilidade nem contratação. Depois da liberação, Codex pode disparar o workflow e validar o deploy sem comandos locais do usuário. Um commit de documentação com [skip ci] não refaz testes do código inalterado; workflow_dispatch continua disponível.
