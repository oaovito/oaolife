# Atualização e sincronização

São processos distintos. O aplicativo recebe arquivos novos por Service Worker/Workbox; dados pessoais ficam no IndexedDB. Não há backend remoto, autenticação ou envio de dados implementados. A UI não usa “Sincronizado”.

Cada operação local grava snapshot, auditoria e outbox na mesma transação. Outbox usa `local-only`; o tipo suporta estados futuros, mas não há transporte remoto configurado. Estar online não significa que dados pessoais têm cópia fora do aparelho. A retomada da rede apenas atualiza o indicador e solicita verificação de recursos novos quando o aplicativo está ativo.

O Service Worker precacheia HTML, JS, CSS e ícones produzidos pelo build. Não cacheia registros pessoais. Versões antigas de recursos são limpas após ativação; IndexedDB não é removido. Atualização fica em espera e só pode ser ativada explicitamente sem sessões/cronômetros ativos e sem gravação em andamento. Não exige reinstalação. O primeiro carregamento conectado é necessário.

O iOS pode suspender totalmente uma PWA fechada. Não se promete sincronização, download ou execução em segundo plano. Foco, conexão e retorno visível revalidam atualizações. Sem rede, atividades e cronômetros continuam baseados no estado persistido.

Concorrência local usa a transação serializável do IndexedDB. Importação compara a revisão atual à revisada e falha se houver novas alterações. Backup substitui o conjunto somente após confirmação, sem merge silencioso. Sincronização remota futura exige backend privado, autenticação, autorização por usuário, transporte seguro, proteção em repouso, protocolo de conflitos e testes completos.
