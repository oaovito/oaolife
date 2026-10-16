# Verificação

Comandos executáveis: `npm run check` (TypeScript + Vitest), `npm run build`, `npm run test:e2e` (Playwright), `npm audit --omit=dev`.

## Cobertura

- Calendário: todas as datas 16–25/10/2026, sábado→domingo→segunda, ano bissexto, troca de ano, ciclo independente, reagendamento e proteção de histórico.
- Treino: ordem e 26 séries do C2, modalidade por lado, referências desconhecidas, séries individuais, cópia, conclusão parcial e persistência.
- Periodização: 12 semanas, orçamento arredondado, prioridades, volumes diretos, semanas 4/8 e FST adaptado sem extras.
- Progressão: topo de faixa, incremento real, RIR, execução, recuperação, modalidades, exposição seguinte, histórico e desfazer.
- Dia: cinco refeições, próxima refeição e parciais; seis garrafas, volume personalizado, substituição sem duplicação; independência e conclusão geral.
- Cardio: acumulado, iniciar/pausar/retomar/finalizar, duração manual e retomada por timestamp.
- Mobilidade: protocolo ausente nunca conclui, checklist real, série definida e independência da musculação.
- Armazenamento: reabertura, operação interrompida, concorrência, rollback, fila, migração não destrutiva e ciclos anteriores.
- Backup: roundtrip criptográfico, senha errada, adulteração, relações e schema inválidos.
- Indicadores: dados reais, ausência versus zero, média de peso incompleta, receitas com nutrientes desconhecidos e relatório sem meta obrigatória.
- Browser: fluxos reais, offline com Service Worker, virada local de dia e foco, layout 393×852 e desktop 1440×1000, axe WCAG 2 A/AA e 2.1 AA.

## Resultados observados

Primeira rodada: 79 testes Vitest aprovados e build de produção aprovado. Auditoria de dependências de produção: zero vulnerabilidades reportadas. Rodada ampliada: cardio, protocolo real, backup criptografado/restauração, atualização do Service Worker e tema passaram em ambos os perfis (10 testes). Foi corrigido um problema real de ativação do Service Worker: o controle agora usa eventos nativos e recarrega somente após ativação solicitada e segura. Rodada final consolidada: 83 testes Vitest e 22 testes Playwright aprovados (11 fluxos em dois perfis), TypeScript e build aprovados. Axe não reportou violações nos quatro destinos principais. Pipeline remoto ainda será verificado; ver context.md.

Salvamento é assíncrono: o teste de recarga aguarda confirmação de commit. Uma operação interrompida antes do commit é revertida atomicamente; o aplicativo não afirma que um clique ainda em gravação já é durável. Antes de sair durante uma gravação, o navegador recebe um alerta quando suportado.

## Limites

Chromium com viewport/fuso móvel não é um iPhone físico. Safari/iOS, instalação real na Tela de Início, comportamento de armazenamento do sistema e splash controlado pelo iOS exigem validação em aparelho. Pipeline e deploy só são validados após execução no GitHub; não estão comprovados pela compilação local. Não há testes de sincronização com backend inexistente.


## Resultado remoto

[Verificar oaolife](https://github.com/oaovito/oaolife/actions/runs/38968715539) concluiu com sucesso no commit de implementação 5fd8aa2. [Publicar oaolife](https://github.com/oaovito/oaolife/actions/runs/38968715549) passou por testes e builds, mas falhou ao criar o site Pages por falta de permissão da integração. Não há validação de publicação ou teste HTTPS em produção. Os critérios do pipeline são parcialmente comprovados: execução e verificações sim, deploy final não.
