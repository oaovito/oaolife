# Hidratação — liquids-1

Meta inicial configurável: 4000 ml; unidade visual padrão 500 ml (8 garrafas).
Aceita 600 ml ou outro volume configurado. Consumo, restante, percentual e
frações equivalentes são calculados, sem arredondar o volume armazenado.
A interface informa quando exibe equivalências arredondadas a três casas.

Cada adição manual (250/500/600 ml ou personalizada) guarda ID, data/hora e ml.
É possível corrigir, excluir e desfazer o último registro. IDs repetidos não
são somados duas vezes. Refeições nunca adicionam líquidos automaticamente.
Não se confunde volume total da bebida com água efetiva de composição desconhecida.

Dias novos guardam a meta e unidade visual configuradas. O dia atual migra uma
vez; as seis garrafas antigas permanecem intactas e são somadas como consumo
anterior, sem gerar cópias nas entradas novas. Seus controles de correção
continuam disponíveis quando há consumo. Dias históricos usam a interface antiga.

A virada segue a meia-noite local existente, também offline e ao retomar o app.
Não havia horário de redefinição configurável. Horários de refeições não são
horários de redefinição. Histórico, IndexedDB e backup criptografado permanecem.

A meta é uma referência individual, distribuída entre manhã/tarde/noite sem
cotas horárias rígidas. A UI permite ajuste e não orienta compensação rápida,
volumes adicionais automáticos ou eletrólitos. Orientação clínica existente é
preservada. Sincronização remota continua não configurada.
