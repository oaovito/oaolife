# Atualização e sincronização

São processos distintos. O aplicativo recebe arquivos novos por Service Worker/Workbox; dados pessoais ficam no IndexedDB. Não há backend remoto, autenticação ou envio de dados implementados. A UI não usa “Sincronizado”.

Cada operação local grava snapshot, auditoria e outbox na mesma transação. Outbox usa `local-only`; o tipo suporta estados futuros, mas não há transporte remoto configurado. Estar online não significa que dados pessoais têm cópia fora do aparelho. A retomada da rede apenas atualiza o indicador e solicita verificação de recursos novos quando o aplicativo está ativo.

O Service Worker precacheia HTML, JS, CSS e ícones produzidos pelo build. Não cacheia registros pessoais. Versões antigas de recursos são limpas após ativação; IndexedDB não é removido. Atualização fica em espera e só pode ser ativada explicitamente sem sessões/cronômetros ativos e sem gravação em andamento. Não exige reinstalação. O primeiro carregamento conectado é necessário.

O iOS pode suspender totalmente uma PWA fechada. Não se promete sincronização, download ou execução em segundo plano. Foco, conexão e retorno visível revalidam atualizações. Sem rede, atividades e cronômetros continuam baseados no estado persistido.

Concorrência local usa a transação serializável do IndexedDB. Importação compara a revisão atual à revisada e falha se houver novas alterações. Backup substitui o conjunto somente após confirmação, sem merge silencioso. Sincronização remota futura exige backend privado, autenticação, autorização por usuário, transporte seguro, proteção em repouso, protocolo de conflitos e testes completos.


## Publicação Vercel e segurança da interface

Deploy nativo GitHub–Vercel validado: merge c3fd4a4 em main gerou produção Ready no domínio https://oaolife.vercel.app. Publicação não sincroniza registros pessoais. HTML e SW precisam revalidar no servidor; assets com hash podem ser imutáveis. Uma nova origem tem seu próprio IndexedDB e exige exportação/importação; nenhum redirect transporta dados.

Ativação também é bloqueada por formulários não salvos. Uma submissão só limpa o estado pendente após commit bem-sucedido da mesma revisão; erros ou novas edições mantêm a proteção. O usuário pode continuar usando a versão armazenada offline. O iOS não é considerado um executor confiável de tarefas com a PWA fechada.

A ativação de uma nova versão de SW e a proteção durante sessão/formulário foram validadas em build local real (não simulação da API). Na hospedagem, registro, precache, offline e verificação de atualização foram conferidos. O deploy de documentação conserva os mesmos recursos e não simula uma nova versão de código apenas para forçar recarga.
