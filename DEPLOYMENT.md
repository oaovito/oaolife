# Publicação

Repositório único: https://github.com/oaovito/oaolife. Não criar outro nem mudar visibilidade sem autorização. Não publicar registros de saúde.

Workflows:
- `.github/workflows/ci.yml`: instalação pelo lockfile, TypeScript, Vitest, build, auditoria de produção e Playwright.
- `.github/workflows/deploy.yml`: repete a validação obrigatória, constrói com `BASE_PATH=/oaolife/`, configura Pages, envia artefato e publica com `actions/deploy-pages`.

Push em main ou workflow_dispatch inicia o deploy. Publicação só ocorre se o job de validação passar. GITHUB_TOKEN usa permissões contents:read, pages:write e id-token:write; nenhum token é colocado no código. O pipeline usa o ambiente github-pages e concorrência sem cancelar publicação em curso.

O repositório é privado e Pages não estava configurado na auditoria inicial. Pages pode exigir um plano GitHub com suporte a repositórios privados; não há autorização para custos ou tornar o repositório público. Uma falha por essa limitação deve ser registrada exatamente, sem declarar URL pronta ou contornar criando outro repositório.

Nenhuma URL de produção está confirmada neste ponto. A URL esperada pelo padrão do GitHub só deve ser divulgada como aplicativo utilizável após sucesso do workflow e verificação HTTPS. Verifique context.md para o estado final desta sessão.

Atualizações: HTML e Service Worker detectam novos recursos no retorno conectado; ativação em espera evita interromper treino. Não se deve apagar IndexedDB nem exigir reinstalação. Antes de qualquer migração futura, acrescentar teste de preservação e manter backup compatível.
