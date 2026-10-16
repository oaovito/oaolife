# oaolife

Aplicação pessoal em português para acompanhar treino, alimentação, hidratação, cardio e protocolo habitual de hipercifose. React, TypeScript, Vite e IndexedDB; dados locais, sem conta ou backend remoto.

Repositório oficial e único: https://github.com/oaovito/oaolife

## Uso

O aplicativo abre no dashboard. A data vem do dispositivo. Segunda A1, terça B1, quarta C1, quinta A2, sexta B2, sábado C2, domingo descanso. A referência **17/10/2026 = C2** não define a semana de periodização: configure-a em Plano. Antes disso, o treino original pode ser consultado, sem inventar uma semana.

Registre cada série com carga, modalidade, repetições, RIR, técnica e amplitude. Conclua o treino ou encerre parcialmente com motivo. Alimentação, água, cardio e hipercifose são independentes. O dia só termina quando os blocos programados terminam. O protocolo terapêutico e os incrementos dos equipamentos precisam ser cadastrados com informações reais.

## Instalação no iPhone

Depois da publicação HTTPS confirmada, abrir no Safari → Compartilhar → Adicionar à Tela de Início. Aguarde o primeiro carregamento conectado para armazenar os recursos. Não é preciso assinatura Apple Developer. A validação em iPhone físico deve complementar os testes automatizados; não está presumida.

## Dados e backup

Os registros ficam no IndexedDB deste navegador. O sistema ou o usuário pode removê-los. Em Ajustes, exporte um backup `.oaolife` criptografado, com senha de pelo menos 12 caracteres, e salve-o externamente. A senha não pode ser recuperada. A importação valida o arquivo, mostra o conteúdo agregado e exige confirmação de substituição. Não há sincronização de saúde com GitHub.

## Desenvolvimento e qualidade

Node 24 e npm: `npm ci`, `npm run dev`. Verificações: `npm run check`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`. Esses comandos são documentação para manutenção, não passos que o usuário precisa executar para a publicação desta sessão.

## Publicação e limites

GitHub Actions contém CI e publicação no GitHub Pages, condicionada à disponibilidade de Pages para este repositório privado. Nenhuma mudança de visibilidade é feita automaticamente. A existência do workflow não comprova um deploy: veja [context.md](context.md) e [DEPLOYMENT.md](DEPLOYMENT.md) para o resultado observado.

Sem backend privado configurado, autenticação remota ou sincronização de dados. Armazenamento local depende da proteção do dispositivo desbloqueado. O aplicativo não avalia técnica por sensores e não substitui avaliação médica. Sem alteração automática de dieta, sódio, água ou cardio.

## Documentação

[Arquitetura](ARCHITECTURE.md) · [Modelo de dados](DATA_MODEL.md) · [Treino](TRAINING_PLAN.md) · [Progressão](PROGRESSION_RULES.md) · [Nutrição](NUTRITION.md) · [Hidratação](HYDRATION.md) · [Cardio](CARDIO.md) · [Mobilidade](MOBILITY.md) · [Sincronização](SYNC.md) · [Segurança](SECURITY.md) · [Testes](TESTING.md) · [Publicação](DEPLOYMENT.md).
