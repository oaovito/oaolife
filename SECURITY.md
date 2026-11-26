# Segurança e privacidade

Não existem tokens ou segredos no frontend, telemetria ou anúncios. Registros de saúde só chegam ao GitHub cifrados no aparelho (AES-256-GCM, ramo `dados`, ver SYNC.md); o token `GITHUB_DATA_TOKEN` existe apenas no ambiente da função Vercel `api/sync.ts`. Definições de plano individuais no código estão listadas em docs/PERSONAL_DATA_INVENTORY.md. Fixtures de testes são sintéticas; fotografias pessoais nunca são incluídas. Publicação em https://oaolife.vercel.app, com HTTPS validado.

React escapa texto, não há `dangerouslySetInnerHTML`. CSP limita scripts, conexões e workers à mesma origem, bloqueia objetos e permite imagens locais; estilos inline são necessários para os indicadores dinâmicos. Entradas e importações passam por Zod e integridade relacional. Imagens aceitam apenas data URLs de PNG, JPEG ou WebP, com limites de tamanho. Nenhuma URL externa de foto é buscada automaticamente. Backups são autenticados por AES-GCM 256; chave derivada de senha por PBKDF2-SHA256, 310.000 iterações, sal aleatório de 16 bytes e IV de 12 bytes. Senha mínima de 12 caracteres, não recuperável. AES-GCM detecta senha errada e adulteração.

Dados no IndexedDB dependem da proteção do dispositivo; não são criptografados individualmente pelo aplicativo. Não há bloqueio próprio por senha. Use código/Face ID e não compartilhe navegador desbloqueado. Um backup exportado continua confidencial, mas a senha deve ser guardada com segurança.

Importação limita conteúdo a aproximadamente 50 MB, valida schema e relações antes de escrever e exige confirmação de substituição. Falha dentro da transação reverte o conjunto. Exclusão local exige digitar APAGAR após mostrar os dados afetados. A cópia na nuvem não tem exclusão remota: ela só acrescenta (retenção ilimitada).

Limitações: o iOS pode remover armazenamento; não há garantia de permanência sem backup externo. Fotografias aumentam o agregado e o tamanho dos backups. Logs técnicos de hospedagem podem registrar pedidos dos arquivos estáticos, mas não recebem registros pessoais pelo código do aplicativo. Auditamos dependências de produção; resultados atualizados em TESTING.md.


## Vercel

vercel.json prepara headers de segurança e cache para app estático. Não há variáveis privilegiadas no frontend nem dados de saúde no build. A instalação da integração e o acesso da Vercel ao repositório privado devem ocorrer por OAuth/instalação oficial; nunca por senha ou token enviados no chat. Configuração local .vercel é ignorada pelo Git. Prévia deve conter somente dados sintéticos locais e ter o acesso nativo apropriado à conta, quando disponível. Headers CSP/nosniff, HTTPS, cache do SW e rotas foram conferidos na URL publicada; dados IndexedDB continuam locais.

Conta Hobby confirmada; CLI oficial obteve acesso por autenticação segura. Credenciais/OIDC/bypass da CLI são mantidos somente nos arquivos locais ignorados ou fora do repositório. Não há token em variáveis VITE_*. Preview mantém Deployment Protection; testes públicos não precisam de credenciais. Não há conta de usuário; a única função remota é `api/sync.ts`, que valida identificador, tamanho e formato, nunca recebe a chave e nunca apaga arquivos.
