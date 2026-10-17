# Registro hormonal local

O aplicativo registra informações fornecidas pelo usuário; não recomenda substâncias, doses, combinações ou ajustes. O protocolo informado não cria administrações realizadas. É independente do início e da semana do ciclo de treino.

Importação em Ajustes → Registro hormonal: JSON com `format: "oaolife-hormonal-1"` e `protocol`. Protocolo: `name`, `weeks`, `entries`. Cada entrada contém `id`, `substance`, `doseMg`, `frequency` (`daily` ou `weekly`), `weekday` (0=domingo a 6=sábado, ou null para desconhecido), `fromWeek` e `toWeek`. Quantidades e períodos são validados. A consulta de uma semana filtra os períodos e soma apenas os totais declarados; uma entrada diária multiplica por sete.

O usuário informa separadamente data, semana e quantidade realmente administrada. Datas futuras são rejeitadas. “Desfazer registro” corrige o lançamento, mantendo o histórico na auditoria. Dados entram no backup criptografado e não saem do navegador. O arquivo pessoal de importação não deve ser adicionado ao Git ou aos assets públicos.
