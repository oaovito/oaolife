# oaolife

Aplicação pessoal em português para acompanhar treino, alimentação, hidratação, cardio e protocolo habitual de hipercifose. React, TypeScript, Vite e IndexedDB; dados locais, sem conta ou backend remoto.

**Acesse: https://oaolife.vercel.app** · versão 1.2.0

Repositório oficial e único: https://github.com/oaovito/oaolife

## Uso

O aplicativo abre no dashboard. A data vem do dispositivo. Segunda A1, terça B1, quarta C1, quinta A2, sexta B2, sábado C2, domingo descanso. A referência **17/10/2026 = C2** não define a semana de periodização: configure-a em Plano. Antes disso, o treino original pode ser consultado, sem inventar uma semana.

Conclua séries ou exercícios com um toque; carga, repetições, RIR, técnica e amplitude são opcionais para o registro e obrigatórios para a progressão automática. Séries não realizadas ficam separadas dos totais executados. Conclua o treino ou encerre parcialmente com motivo. Alimentação, água, cardio e hipercifose são independentes. O dia só termina quando os blocos programados terminam. O alongamento de hipercifose em pé com cotovelos na parede já está disponível: 4 séries de 60 s, 3 descansos de 60 s, sequência automática de 7 min. Os incrementos dos equipamentos continuam sendo informados separadamente. Novos dias de cardio usam 360 minutos semanais de esteira (quarta e sábado 30 min; demais dias 60 min), a pelo menos 5,0 km/h; a velocidade realmente realizada é informada separadamente.

## Instalação no iPhone

Abra https://oaolife.vercel.app no Safari → Compartilhar → Adicionar à Tela de Início. Aguarde o primeiro carregamento conectado para armazenar os recursos. Não é preciso assinatura Apple Developer. A validação em iPhone físico deve complementar os testes automatizados; não está presumida.

## Dados e backup

Os registros ficam no IndexedDB deste navegador. O sistema ou o usuário pode removê-los. Em Ajustes, exporte um backup `.oaolife` criptografado, com senha de pelo menos 12 caracteres, e salve-o externamente. A senha não pode ser recuperada. A importação valida o arquivo, mostra o conteúdo agregado e exige confirmação de substituição. Não há sincronização de saúde com GitHub.

## Desenvolvimento e qualidade

Node 24 e npm: `npm ci`, `npm run dev`. Verificações: `npm run check`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`. Esses comandos são documentação para manutenção, não passos que o usuário precisa executar para a publicação desta sessão.

## Publicação e limites

Hospedado na Vercel, projeto oaolife da conta oao7 (Hobby), com integração oficial ao GitHub. Produção main e prévias de branches/PR. O merge do PR #1 acionou um deploy de produção Ready, validado em HTTPS. GitHub Actions mantém testes; Pages fica como fallback manual, sem publicação automática duplicada. Veja [context.md](context.md) e [DEPLOYMENT.md](DEPLOYMENT.md) para evidências e limites.

Sem backend privado configurado, autenticação remota ou sincronização de dados. Armazenamento local depende da proteção do dispositivo desbloqueado. O aplicativo não avalia técnica por sensores e não substitui avaliação médica. Sem alteração automática de dieta, sódio, água ou cardio.

## Documentação

[Arquitetura](ARCHITECTURE.md) · [Modelo de dados](DATA_MODEL.md) · [Treino](TRAINING_PLAN.md) · [Progressão](PROGRESSION_RULES.md) · [Nutrição](NUTRITION.md) · [Hidratação](HYDRATION.md) · [Cardio](CARDIO.md) · [Mobilidade](MOBILITY.md) · [Sincronização](SYNC.md) · [Segurança](SECURITY.md) · [Testes](TESTING.md) · [Publicação](DEPLOYMENT.md).

## Registros rápidos e correções

Itens feitos ficam recolhidos em “Ver e corrigir”. No treino, séries e exercícios podem ser concluídos sem preencher todos os campos, ou marcados como não realizados. Séries sem detalhes não geram progressão automática. Os campos de horário respeitam larguras de 320–430 px.

Em Hoje → Resumo e fechamento do dia, “Concluir dia sem detalhar” confirma apenas a realização declarada, preserva medições existentes e não inventa cargas, tempos, quantidades ou calorias. A data selecionada pode ser aberta com `?date=AAAA-MM-DD`. A confirmação é gravada no navegador em que o usuário aperta o botão; não há alteração remota do iPhone.

Em Hoje → Registro hormonal, o plano informado já está disponível, sem importação. O bloco pode ser concluído, recolhido e reaberto para correção. As administrações reais são registradas separadamente; nada é marcado como tomado automaticamente. Usa o mesmo armazenamento e backup dos demais blocos. Consulte [HORMONAL.md](HORMONAL.md).


## Plano alimentar 1.2.0

Cinco refeições: leite integral e dois pães franceses nas refeições 1 e 3; 200 g de Itambé Grego Flocos nas refeições 2 e 4; 200 g de arroz cozido e 200 g de frango, patinho ou tilápia na refeição 5. A alimentação exibe metas e consumo por dia, permite desfazer sem duplicação e preserva as referências nutricionais de cada refeição consumida. Veja [NUTRITION.md](NUTRITION.md) para fontes, subtotais e a pendência do rótulo do iogurte.

A conclusão de blocos tem animação, respeita movimento reduzido e solicita um padrão de vibração nos navegadores compatíveis. A vibração pode ser desativada em Ajustes. Safari no iPhone não disponibiliza a API de vibração; não se promete resposta háptica nesse dispositivo. O visual 1:1 do Gymondo permanece pendente de acesso à referência.
