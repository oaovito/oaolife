# Alongamento para hipercifose

Exercício informado: em pé, com os cotovelos na parede. Quatro séries de 60 segundos e três descansos de 60 segundos. Total: 240 segundos ativos e 180 segundos de descanso, ou 7 minutos. Não há descanso após a quarta série.

O protocolo vem disponível nos dias A1, B1 e A2. Dias explicitamente personalizados no dispositivo são preservados. Ao criar um novo dia, a cópia do protocolo usa os parâmetros atuais de hipercifose; exercícios adicionais permanecem disponíveis. Protocolos e medições já salvos no histórico não são reescritos. Dias antigos sem protocolo oferecem aplicação explícita do protocolo atual.

A sequência alterna automaticamente entre Alongando e Descansando. Mostra série atual, tempo restante, progresso total e tempo ativo separado. Iniciar, pausar e continuar são persistidos em IndexedDB. O timestamp mantém o tempo correto no segundo plano e ao reabrir offline. Não depende de intervalos executados enquanto o sistema suspende o app; a recuperação reconcilia as etapas pelo tempo decorrido.

Cada série concluída atualiza o checklist e o bloco diário. Conclusão automática ocorre exatamente após a quarta série, sem duplicação em duas abas. O cronômetro de cardio é independente. Reiniciar exige confirmação e limpa somente o progresso daquela sequência naquele dia; a auditoria mantém a correção. A navegação por data permite consultar os registros históricos.

Schema e banco v4 adicionam o estado da sequência, com migração compatível de v2/v3. Backups novos usam formato v4 e os anteriores continuam importáveis. O armazenamento e a fila locais são preservados; não há serviço remoto de sincronização configurado.
