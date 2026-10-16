# Segurança e privacidade

Não existem tokens ou segredos no frontend, telemetria, anúncios ou envio de saúde ao GitHub. Apenas código, definições de plano e documentação entram no repositório. Fixtures de testes são sintéticas; fotografias pessoais nunca são incluídas. Publicação depende de HTTPS.

React escapa texto, não há `dangerouslySetInnerHTML`. CSP limita scripts, conexões e workers à mesma origem, bloqueia objetos e permite imagens locais; estilos inline são necessários para os indicadores dinâmicos. Entradas e importações passam por Zod e integridade relacional. Imagens aceitam apenas data URLs de PNG, JPEG ou WebP, com limites de tamanho. Nenhuma URL externa de foto é buscada automaticamente. Backups são autenticados por AES-GCM 256; chave derivada de senha por PBKDF2-SHA256, 310.000 iterações, sal aleatório de 16 bytes e IV de 12 bytes. Senha mínima de 12 caracteres, não recuperável. AES-GCM detecta senha errada e adulteração.

Dados no IndexedDB dependem da proteção do dispositivo; não são criptografados individualmente pelo aplicativo. Não há bloqueio próprio por senha. Use código/Face ID e não compartilhe navegador desbloqueado. Um backup exportado continua confidencial, mas a senha deve ser guardada com segurança.

Importação limita conteúdo a aproximadamente 50 MB, valida schema e relações antes de escrever e exige confirmação de substituição. Falha dentro da transação reverte o conjunto. Exclusão local exige digitar APAGAR após mostrar os dados afetados. Não há exclusão remota porque não há backend.

Limitações: o iOS pode remover armazenamento; não há garantia de permanência sem backup externo. Fotografias aumentam o agregado e o tamanho dos backups. Logs técnicos de hospedagem podem registrar pedidos dos arquivos estáticos, mas não recebem registros pessoais pelo código do aplicativo. Auditamos dependências de produção; resultados atualizados em TESTING.md.


## Vercel

vercel.json prepara headers de segurança e cache para app estático. Não há variáveis privilegiadas no frontend nem dados de saúde no build. A instalação da integração e o acesso da Vercel ao repositório privado devem ocorrer por OAuth/instalação oficial; nunca por senha ou token enviados no chat. Configuração local .vercel é ignorada pelo Git. Prévia deve conter somente dados sintéticos locais e ter o acesso nativo apropriado à conta, quando disponível. Headers, HTTPS e isolamento ainda devem ser conferidos no endereço publicado.
