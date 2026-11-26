# oaolife

Aplicação pessoal em português para acompanhar treino, alimentação, hidratação, cardio e protocolo habitual de hipercifose. React, TypeScript, Vite e IndexedDB; dados locais, sem conta ou backend remoto.

**Acesse: https://oaolife.vercel.app** · versão 1.4.0

> Diretrizes permanentes: [CLAUDE.md](CLAUDE.md). Produto, design, auditoria e estado: [docs/](docs/PRODUCT_SPEC.md).

Repositório oficial e único: https://github.com/oaovito/oaolife

## Uso

O aplicativo abre no dashboard. A data vem do dispositivo. Segunda A1, terça B1, quarta C1, quinta A2, sexta B2, sábado C2, domingo descanso. A referência **17/10/2026 = C2** não define a semana de periodização: configure-a em Plano. Antes disso, o treino original pode ser consultado, sem inventar uma semana.

Conclua séries ou exercícios com um toque; carga, repetições, RIR, técnica e amplitude são opcionais para o registro e obrigatórios para a progressão automática. Séries não realizadas ficam separadas dos totais executados. Conclua o treino ou encerre parcialmente com motivo. Alimentação, água, cardio e hipercifose são independentes. O dia só termina quando os blocos programados terminam. O alongamento de hipercifose em pé com cotovelos na parede já está disponível: 4 séries de 60 s, 3 descansos de 60 s, sequência automática de 7 min. Os incrementos dos equipamentos continuam sendo informados separadamente. O cardio é rígido: segunda, terça, quinta, sexta e domingo, 60 minutos cada (300 min/semana); quarta e sábado sem cardio; cada sessão se cumpre no próprio dia. Na esteira, a velocidade mínima é 5,0 km/h. Cada exercício exibe exatamente as séries do plano em todas as semanas (ajustável em Plano).

O plano alimentar ativo tem quatro refeições (duas líquidas e duas sólidas), com porções e referências em [NUTRITION.md](NUTRITION.md). A meta inicial de líquidos é 4.000 ml, ajustável, com garrafa visual de 500 ou 600 ml, registros manuais e histórico. O plano soma cerca de 2.637 kcal e 237 g de proteína (TACO/TBCA); a meta solicitada de ~2.000 kcal é exibida com a divergência, sem alterar quantidades. Planos antigos e consumos realizados são preservados.

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


## Histórico de versões

Notas das versões 1.0–1.3 permanecem em [context.md](context.md) e nos documentos temáticos. A versão 1.4.0 (26/11/2026) está descrita em [docs/TECHNICAL_AUDIT.md](docs/TECHNICAL_AUDIT.md).
