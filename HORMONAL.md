# Registro hormonal

Sexto bloco de Hoje, na rota `/hormonal`, com o mesmo armazenamento, auditoria e backup dos demais registros. O plano informado pelo usuário está incluído em `src/domain/hormonal.ts`; não exige importação. Protocolos já existentes são preservados. O protocolo informado não cria administrações realizadas e é independente do ciclo de treino.

A consulta por semana filtra períodos e calcula totais declarados. O segundo dia semanal permanece não informado. A oximetolona aparece nas semanas 1–8 e as demais entradas nas semanas 1–12. Nenhuma data inicial é presumida.

O usuário registra data, semana e quantidade efetivamente administrada. Datas futuras são rejeitadas. Concluir o registro do dia recolhe o bloco sem preencher doses ausentes; reabrir e desfazer permitem corrigir. Alterar uma administração reabre o bloco da data correspondente. O resumo do dia lista somente administrações detalhadas; a conclusão é uma declaração separada.

Todos os registros do app ficam em IndexedDB, entram no backup criptografado e não têm sincronização remota configurada. O plano fornecido é distribuído com o aplicativo, como os planos de treino e alimentação; administrações reais não são publicadas.
