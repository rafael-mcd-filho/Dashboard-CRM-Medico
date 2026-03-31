# Contexto do Projeto

## Identidade

- Nome do produto: `V4 Dash for Derick Vinhas`
- Tipo de produto: dashboard BI operacional e analitico
- Foco: acompanhar funis, faturamento, recebimento, conversoes, agenda e origem dos contatos
- Publico principal: operacao, gestao comercial e analise de performance

## Objetivo do projeto

O projeto consolida dados operacionais vindos do CRM/Supabase e transforma isso em:

- visao executiva geral
- visao detalhada por funil
- acompanhamento de contatos e origem dos leads
- agenda operacional por data de agendamento
- comparativos entre periodo atual e periodo imediatamente anterior
- drill-down em funis e graficos para abrir os registros que compoem um numero

O objetivo nao e apenas mostrar numeros brutos. O dashboard aplica regras de negocio para definir o que conta como agendado, realizado, no-show, faturamento, origem e conversao.

## Stack tecnico

- Frontend: `React 18 + TypeScript + Vite`
- Roteamento: `react-router-dom`
- Data fetching e cache: `@tanstack/react-query`
- UI base: `shadcn/ui + Radix UI`
- Graficos: `recharts`
- Datas: `date-fns`
- Banco: `Supabase`
- Testes atuais: `Vitest` com setup minimo

## Estrutura principal do app

### Entrada e shell

- App principal: [src/App.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/App.tsx)
- Layout: [src/pages/PainelLayout.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/pages/PainelLayout.tsx)
- Sidebar: [src/components/layout/Sidebar.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/layout/Sidebar.tsx)
- Filtros globais: [src/components/layout/GlobalFilters.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/layout/GlobalFilters.tsx)

### Rotas atuais

- `/visao-geral`
- `/contatos`
- `/agenda`
- `/consultas`
- `/broncoscopia`
- `/espirometria`
- `/procedimentos-cirurgicos`

## Arquitetura de dados e estado

### Providers

- `QueryClientProvider` para cache e revalidacao de dados
- `TooltipProvider`
- `FiltersProvider` para filtros globais do dashboard

### Observacao importante

A rota `Agenda` e isolada dos filtros globais. O layout esconde `GlobalFilters` quando a rota comeca por `/agenda`.

## Banco de dados

### Tabelas principais usadas pelo projeto

- `contatos`
- `consultas`
- `espirometria`
- `broncoscopia`
- `procedimentos_cirurgicos`

Os tipos locais do Supabase ficam em [src/integrations/supabase/types.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/integrations/supabase/types.ts).

### contatos

Campos principais usados:

- `contato_id`
- `nome`
- `tags`
- `origem_contato`
- `criado_em`
- `numero`

Uso principal:

- aba `Contatos`
- lookup de origem agrupada
- filtro `Somente anuncios`
- cruzamentos por `contato_id`

### consultas

Campos principais usados:

- `id`
- `key`
- `contato_id`
- `nome_contato`
- `responsavel`
- `etapa_no_crm`
- `tipo_consulta`
- `modalidade_pagamento`
- `origem`
- `data_criacao_card`
- `data_agendamento`
- `horario_agendamento`
- `data_pagamento`
- `valor_atribuido`
- `link_da_conversa`
- `id_do_card`
- `descricao_card`
- `tag_id_card`
- `tag_name_contato`

### espirometria

Campos principais usados:

- `id`
- `key`
- `contato_id`
- `nome_contato`
- `responsavel`
- `etapa_no_crm`
- `modalidade_pagamento`
- `origem`
- `data_criacao_card`
- `data_agendamento`
- `horario_agendamento`
- `data_pagamento`
- `valor_atribuido`
- `vinculo`
- `link_da_conversa`
- `id_do_card`
- `descricao_card`
- `tag_id_card`
- `tag_name_contato`

### broncoscopia

Campos principais usados:

- `id`
- `key`
- `contato_id`
- `nome_contato`
- `responsavel`
- `etapa_no_crm`
- `tipo_paciente`
- `quantidade_codigos`
- `modalidade_pagamento`
- `origem`
- `data_criacao_card`
- `data_agendamento`
- `horario_agendamento`
- `data_pagamento`
- `valor_atribuido`
- `vinculo`
- `link_da_conversa`
- `id_do_card`
- `descricao_card`
- `tag_id_card`
- `tag_name_contato`

### procedimentos_cirurgicos

Campos principais usados:

- `id`
- `key`
- `contato_id`
- `nome_contato`
- `responsavel`
- `etapa_no_crm`
- `tipo_paciente`
- `modalidade_pagamento`
- `origem`
- `data_criacao_card`
- `data_agendamento`
- `horario_agendamento`
- `data_pagamento`
- `valor_atribuido`
- `descricao_card`
- `tag_id_card`
- `tag_name_contato`
- `custo_anestesia`
- `custo_comissao`
- `custo_hospital`
- `custo_instrumentacao`
- `impostos`
- `valor_liquido`

### Observacoes de schema

- `descricao_card` existe nas quatro tabelas operacionais e hoje ja aparece no drawer da agenda.
- `tag_id_card` existe nas quatro tabelas operacionais, mas ainda nao e usado pela interface.
- `tag_name_contato` substituiu `tag_names` nas quatro tabelas operacionais.
- Apesar de `procedimentos_cirurgicos` ter `valor_liquido` no schema, o dashboard hoje recalcula liquido localmente a partir de `valor_atribuido - custos`.

## Utilitarios e regras compartilhadas

### Parsing de dados

Arquivo: [src/lib/parse.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/parse.ts)

- `parseMonetary` aceita `1500`, `1500.50`, `1.500,50`, `R$ 1.500,50`
- `parseBRDate` aceita `DD/MM/YYYY` e `YYYY-MM-DD`
- `isInDateRange` compara datas apenas pela data, ignorando hora
- `calcDiffDias` calcula diferenca entre `data_pagamento` e `data_agendamento`

### Formatacao

Arquivo: [src/lib/fmt.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/fmt.ts)

- `fmtNum`
- `fmtBRL`
- `fmtPct`
- `fmtDecimal`

O projeto normaliza espacos do `Intl` para evitar problemas de responsividade em cards e KPIs.

### Modo de data

Arquivo: [src/lib/dateMode.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/dateMode.ts)

Modos:

- `criacao`
- `agendamento`

Labels visiveis:

- `Data de Criacao do Card`
- `Data de Agendamento`

Regra:

- nos funis, o modo muda qual campo controla o filtro de periodo
- em `Contatos`, a base continua por `criado_em`

### Comparativo entre periodos

Arquivo: [src/lib/comparison.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/comparison.ts)

Regra:

- o comparativo usa o periodo imediatamente anterior
- o periodo anterior tem exatamente o mesmo tamanho do periodo atual

Exemplo:

- atual: 01/03 a 31/03
- anterior: 29/01 a 28/02, se o recorte tiver o mesmo numero de dias

### Evolucao temporal

Arquivo: [src/lib/evolucao.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/evolucao.ts)

Regra de agrupamento:

- ate 62 dias: por dia
- ate 180 dias: por semana
- acima disso: por mes

### Origem do contato

Arquivo: [src/lib/contactOrigins.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/contactOrigins.ts)

Regra atual de classificacao:

- se tags indicarem `Anuncio`, prevalece `Anuncio`
- se tags indicarem `Doctoralia`, prevalece `Doctoralia`
- se tags indicarem `Indicacao` ou `Parente Paciente`, prevalece `Indicacao`
- se nao houver tag dominante:
  - `facebook`, `instagram`, `google`, `site`, `meta ads`, `google ads` => `Anuncio`
  - `created from hub`, `created_by_user`, `imported`, vazio, nao definido => `Direta`
  - `doctoralia` => `Doctoralia`
  - demais valores sao humanizados

### Filtro Somente anuncios

Regra:

- usa a classificacao agrupada da origem do contato
- se um registro nao tiver `contato_id`, ele nao passa no filtro de anuncio
- esse filtro existe globalmente no dashboard e localmente na agenda

### Filtro por responsavel

Arquivo: [src/lib/cardFilters.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/cardFilters.ts)

Regra:

- compara o campo `responsavel` com o valor exato selecionado
- existe a opcao especial `Cards sem responsavel`

## Filtros globais do dashboard

Arquivos:

- [src/contexts/FiltersContext.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/contexts/FiltersContext.tsx)
- [src/components/layout/GlobalFilters.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/layout/GlobalFilters.tsx)

### O que os filtros globais controlam

- periodo
- modo de data
- responsavel
- somente anuncios

### Atalhos de periodo

- Hoje
- Esta semana
- Semana anterior
- Este mes
- Mes anterior
- Este ano
- Todo periodo
- Personalizado

### Regra atual de Todo periodo

`Todo periodo` e fixo e nao muda mais ao trocar entre `Data de Criacao do Card` e `Data de Agendamento`.

Ele usa uma janela unica baseada em:

- menor e maior `data_criacao_card`
- menor e maior `data_agendamento`
- menor e maior `criado_em` de `contatos`

Isso evita que a troca de modo de data mude o intervalo e distorca a comparacao.

### Excecao importante

Mesmo com `Data de Agendamento` ativa:

- a aba `Contatos` continua usando `criado_em`
- a interface mostra um aviso explicando isso

## Aba Agenda

Pagina: [src/pages/AbaAgenda.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/pages/AbaAgenda.tsx)
Hook: [src/hooks/useAgendaData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useAgendaData.ts)
Lib: [src/lib/agenda.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/agenda.ts)

### Caracteristicas principais

- aba isolada dos filtros globais
- opera sempre por `Data de Agendamento`
- mistura `consultas`, `espirometria`, `broncoscopia` e `procedimentos_cirurgicos`
- nao inclui `contatos`

### Visoes

- diaria
- semanal
- mensal

### Filtros locais da agenda

- visao: dia, semana, mes
- funil: tudo, consultas, espirometria, broncoscopia, cirurgia
- responsavel
- somente anuncios
- tipo, quando aplicavel ao funil filtrado
- turno: todos, manha, tarde, noite, sem horario
- busca por paciente

### Regras da agenda

- usa `data_agendamento`
- exclui etapas `captacao`, `negociacao` e `perdido`
- usa `horario_agendamento` para classificar turno
- registros sem horario vao para `sem_horario`
- o drawer do evento mostra:
  - paciente
  - funil
  - etapa
  - modalidade
  - origem
  - tipo
  - valor
  - descricao do card
  - CRM key
  - ID do card
  - link da conversa

### Cores por funil na agenda

- Consultas: azul
- Espirometria: teal
- Broncoscopia: verde
- Cirurgia: roxo

### Realtime

A agenda nao esta em realtime. Ela usa React Query com `staleTime` de 5 minutos.

Na pratica:

- recarregar a pagina puxa de novo
- sem refresh, nao ha assinatura realtime do Supabase

## Componentes compartilhados do dashboard

### Componentes de estrutura visual

- [src/components/dashboard/HeroMetricCard.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/HeroMetricCard.tsx)
- [src/components/dashboard/PresenceConversionPanel.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/PresenceConversionPanel.tsx)
- [src/components/dashboard/RecebimentoPanel.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/RecebimentoPanel.tsx)
- [src/components/dashboard/FinancialBridgePanel.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/FinancialBridgePanel.tsx)
- [src/components/dashboard/CrossFunnelPanel.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/CrossFunnelPanel.tsx)
- [src/components/dashboard/PanelTitle.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/PanelTitle.tsx)
- [src/components/dashboard/ComparisonBadge.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/ComparisonBadge.tsx)

### Drill-down

- funil por etapa: [src/components/dashboard/FunnelStageSheet.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/FunnelStageSheet.tsx)
- drill-down de graficos: [src/components/dashboard/RecordsDrilldownSheet.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/RecordsDrilldownSheet.tsx)

Os drawers suportam:

- busca local
- quantidade de registros
- valor
- responsavel
- data de agendamento
- detalhes adicionais

## Regras de negocio por aba

## Visao Geral

Pagina: [src/pages/AbaGeral.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/pages/AbaGeral.tsx)
Hook: [src/hooks/useVisaoGeralData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useVisaoGeralData.ts)

Objetivo:

- consolidar as principais metricas mantendo a mesma logica operacional das abas especificas

Metricas hero:

- Leads novos
- Faturamento total
- Taxa de realizacao
- Prazo medio geral

Regras:

- `Leads novos` = contatos dentro do periodo por `criado_em`
- `Faturamento total` = soma do faturamento das bases realizadas dos quatro funis
- `Taxa de realizacao` = total realizado / total agendado dos quatro funis
- `Prazo medio geral` = media ponderada dos prazos de recebimento, ponderada pelo volume pago de cada funil

Conversoes:

- usam intersecao por `contato_id`
- base de comparacao = contatos unicos da base de consultas

## Contatos

Pagina: [src/pages/AbaContatos.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/pages/AbaContatos.tsx)
Hook: [src/hooks/useContatosData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useContatosData.ts)

Regra central:

- esta aba continua por `criado_em` do contato
- ela nao muda de logica ao trocar o modo global para `Data de Agendamento`

Metricas principais:

- `Leads novos` = quantidade de contatos criados no periodo
- `Contatos multi-funil` = contatos presentes em dois ou mais funis
- `Taxa de retencao` = contatos multi-funil / leads novos

Graficos:

- `Leads por origem` usa a classificacao agrupada em `contactOrigins.ts`
- `Leads por tag` ignora `[]` e tags vazias
- `Evolucao de leads` usa `criado_em`

Nuances:

- a aba usa `contatos` como base principal
- os cruzamentos com funis usam `contato_id`
- os cards dos funis usados para cruzamento sao filtrados por `data_criacao_card`

## Consultas

Pagina: [src/pages/AbaConsultas.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/pages/AbaConsultas.tsx)
Hook: [src/hooks/useConsultasData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useConsultasData.ts)

### Regras de etapa

Etapas excluidas da base de agendamento:

- `captacao`
- `negociacao`
- `perdido`

Etapas consideradas realizadas:

- `realizado`
- `retorno agendado`
- `compareceu retorno`
- `nao compareceu retorno`
- `finalizado/concluido`

No-show separado:

- `nao compareceu`
- `nao compareceu retorno`

### Metricas principais

- `Agendadas` = todas as linhas fora de captacao, negociacao e perdido
- `Realizadas` = subconjunto das agendadas nas etapas de realizada
- `No-show consulta` = etapa `nao compareceu`
- `No-show retorno` = etapa `nao compareceu retorno`
- `Faturamento` = soma de `valor_atribuido` apenas das realizadas
- `Ticket medio` = faturamento / contatos unicos das realizadas
- `Pagos` = quantidade com `data_pagamento`
- `Pago no dia` = pagamento na mesma data do agendamento
- `Prazo medio` = media de dias entre agendamento e pagamento
- `Tempo medio de captacao` = media de dias entre `data_criacao_card` e `data_agendamento`

### Conversoes

As conversoes nao usam mais `vinculo` como regra principal do dashboard.
Elas usam intersecao de `contato_id` entre a base de consultas e os outros funis, respeitando os filtros ativos.

Conversoes mostradas:

- para espirometria
- para broncoscopia
- para cirurgia

### Origem

- volume por origem usa a origem agrupada do contato
- faturamento por origem usa apenas as realizadas

## Espirometria

Pagina: [src/pages/AbaEspirometria.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/pages/AbaEspirometria.tsx)
Hook: [src/hooks/useEspirometriaData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useEspirometriaData.ts)

### Regras de etapa

Etapas excluidas da base de agendamento:

- `captacao`
- `negociacao`
- `perdido`

Etapas consideradas realizadas:

- `realizado`
- `finalizado/concluido`

No-show:

- `nao compareceu`

### Metricas principais

- `Agendadas` = linhas fora das etapas excluidas
- `Realizadas` = apenas `realizado` e `finalizado/concluido`
- `No-show` = etapa `nao compareceu`
- `Faturamento` = soma de `valor_atribuido` apenas das realizadas
- `Ticket medio` = faturamento / contatos unicos das realizadas
- `Pagos`, `Pago no dia`, `Prazo medio` seguem a mesma logica base das consultas
- `Conversao consulta` = intersecao por `contato_id` com a base de consultas

## Broncoscopia

Pagina: [src/pages/AbaBroncoscopia.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/pages/AbaBroncoscopia.tsx)
Hook: [src/hooks/useBroncoscopiaData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useBroncoscopiaData.ts)

### Regras de etapa

Etapas excluidas da base de agendamento:

- `captacao`
- `negociacao`
- `perdido`

Etapas consideradas realizadas:

- `realizado`
- `exames / resultados`
- `retorno agendado`
- `compareceu retorno`
- `nao compareceu retorno`
- `finalizado/concluido`

No-show separado:

- `nao compareceu`
- `nao compareceu retorno`

### Metricas principais

- `Agendadas` = linhas fora das etapas excluidas
- `Realizadas` = etapas listadas acima
- `Faturamento` = soma das realizadas
- `Ticket medio` = faturamento / contatos unicos das realizadas
- `Pagos`, `Pago no dia`, `Prazo medio` seguem a mesma logica geral
- `Conversao consulta` = intersecao por `contato_id` com consultas
- `Quantidade de codigos` usa o campo `quantidade_codigos`

## Procedimentos Cirurgicos

Pagina: [src/pages/AbaProcedimentosCirurgicos.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/pages/AbaProcedimentosCirurgicos.tsx)
Hook: [src/hooks/useProcedimentosData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useProcedimentosData.ts)

### Regras de etapa

Etapas excluidas da base:

- `captacao`
- `negociacao`
- `perdido`

Etapas consideradas realizadas:

- `realizado`
- `retorno agendado`
- `compareceu retorno`
- `nao compareceu retorno`
- `finalizado/concluido`

No-show separado:

- `nao compareceu`
- `nao compareceu retorno`

### Nuance importante

Hoje:

- `Agendados` e `Fechados (qtd.)` usam a mesma base
- ambos significam todos os cards fora de captacao, negociacao e perdido

### Financeiro

- `Fechados (R$)` = soma de `valor_atribuido` da base fechada/agendada
- `Faturamento bruto` = soma de `valor_atribuido` apenas das realizadas
- `Custo total` = anestesia + comissao + hospital + impostos + instrumentacao
- `Valor liquido total` = bruto - custo
- `Margem bruta` = faturamento - custo total
- `Custo medio` = custo total / realizados
- `Ticket medio` = faturamento / contatos unicos das realizadas

### Recebimento

- `Pagos` = linhas com `data_pagamento`
- `Pago no dia` = `data_pagamento` igual a `data_agendamento`
- `Prazo medio` = media de dias entre agendamento e pagamento

## Graficos e drill-down

O projeto ja suporta drill-down em:

- funil por etapa nas quatro abas operacionais
- varios graficos de barra e evolucao da primeira leva

Arquivos relevantes:

- [src/components/dashboard/FunnelStageSheet.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/FunnelStageSheet.tsx)
- [src/components/dashboard/RecordsDrilldownSheet.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/components/dashboard/RecordsDrilldownSheet.tsx)

O drill-down foi desenhado primeiro para casos `viaveis diretos`, ou seja:

- contagens
- somas
- distribuicoes por categoria
- pontos de evolucao

Casos mais complexos como medias, taxas e alguns paineis compostos ficaram para uma segunda leva.

## Estrategia de consultas ao banco

### Padrao atual

A maior parte dos hooks:

- busca todas as linhas necessarias
- guarda em cache pelo React Query
- aplica as regras de negocio no frontend

### Consequencias

Vantagens:

- regras ficam explicitas no codigo
- facilita comparar abas e manter consistencia
- permite drill-down sem nova ida ao banco para cada clique

Tradeoffs:

- alguns datasets crescem bastante
- varias regras rodam no cliente
- o projeto depende de cache local e refresh para revalidar

### staleTime

Na maior parte das queries, o `staleTime` atual e `5 minutos`.

## Estado atual dos testes

Testes atuais:

- [src/test/example.test.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/test/example.test.ts)
- [src/test/setup.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/test/setup.ts)

Situacao:

- existe apenas um teste placeholder simples
- a validacao real do projeto hoje tem sido principalmente por `npm run build`

## Arquivos que concentram regras de negocio

Se alguem novo entrar no projeto, os melhores pontos de entrada sao:

- [src/contexts/FiltersContext.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/contexts/FiltersContext.tsx)
- [src/lib/contactOrigins.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/contactOrigins.ts)
- [src/lib/dateMode.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/dateMode.ts)
- [src/lib/evolucao.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/evolucao.ts)
- [src/lib/parse.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/lib/parse.ts)
- [src/hooks/useVisaoGeralData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useVisaoGeralData.ts)
- [src/hooks/useContatosData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useContatosData.ts)
- [src/hooks/useConsultasData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useConsultasData.ts)
- [src/hooks/useEspirometriaData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useEspirometriaData.ts)
- [src/hooks/useBroncoscopiaData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useBroncoscopiaData.ts)
- [src/hooks/useProcedimentosData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useProcedimentosData.ts)
- [src/hooks/useAgendaData.ts](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/hooks/useAgendaData.ts)

## Nuances e cuidados para manutencao

- A aba `Contatos` e uma excecao importante dentro do modo global de data.
- O filtro `Somente anuncios` depende de `contato_id`. Linhas sem contato nao entram nesse recorte.
- `Todo periodo` e fixo e combinado entre criacao, agendamento e contatos.
- `Agenda` e isolada do restante do dashboard.
- `descricao_card` ja existe nas tabelas operacionais e hoje aparece na agenda.
- `tag_id_card` e `tag_name_contato` ainda nao sao usados na logica analitica principal.
- O schema local e o banco precisam seguir sincronizados quando houver renome de colunas.
- Alguns textos da base ainda mostram sinais de problema de encoding. Ao editar arquivos antigos, vale conferir se o arquivo esta em UTF-8 ou manter ASCII para evitar regressao visual.
- `procedimentos_cirurgicos.valor_liquido` existe no schema, mas a regra do dashboard hoje recalcula o liquido no frontend.

## Sugestao de onboarding rapido

Para entender o projeto em menos tempo, a sequencia ideal e:

1. ler este arquivo
2. abrir [src/App.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/App.tsx) e [src/pages/PainelLayout.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/pages/PainelLayout.tsx)
3. ler [src/contexts/FiltersContext.tsx](/d:/Biblioteca/Documentos/Projetos/project-lovable-main/src/contexts/FiltersContext.tsx)
4. ler `contactOrigins`, `dateMode`, `evolucao` e `parse`
5. ler os hooks de cada aba
6. por fim, revisar as paginas para entender a composicao visual

## Estado funcional atual

Em alto nivel, o projeto ja possui:

- dashboard analitico por funil
- comparativos contra periodo anterior
- filtros globais consolidados
- agenda operacional isolada
- drill-down em funis e graficos da primeira leva
- visual compactado e reorganizado para leitura executiva

O proximo desenvolvedor que entrar deve assumir que o ponto mais sensivel do sistema nao e o layout, e sim a consistencia das regras de negocio entre abas.
