# Publicação

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
