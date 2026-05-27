# Análise UI/UX Completa — Dashboard CRM Médico (V4 Dash for Derick Vinhas)

Análise feita com base no código de todas as páginas, do design system (Tailwind tokens + index.css), dos componentes compartilhados e da arquitetura visual atual. Padrão de referência: Linear, Stripe Dashboard, Vercel, Attio, Pipedrive Pro.

---

## 📊 Status de Implementação

> Branch: `main` · Build: ✅ passando · Última revisão: 2026-05-27

**Legenda:** ✅ Concluído · ✅✔ Concluído e verificado no código · ⚠️ Revertido a pedido · ❌ Removido a pedido · ⏭️ Pulado a pedido · 🔲 Não implementado

### Fases estruturais (1–5)

| Fase | Status |
|------|--------|
| **Fase 1** — Design tokens (index.css, tailwind.config, kpi scale) | ✅ Concluído |
| **Fase 1** — ComparisonBadge (inverseSentiment) + KpiCard (semântico) | ✅ Concluído |
| **Fase 2** — HeroMetricCard (sem glow/rail, border-l, sparkline, delta inline) | ✅ Concluído |
| **Fase 2** — PerformancePanel + RecebimentoPanel + PanelTitle (hierarquia 30/22/18px, shimmer real) | ✅ Concluído |
| **Fase 2** — Sidebar (grupos nav, avatar footer) | ✅ Concluído · ⚠️ Colapso removido (animação lenta a pedido) · ❌ Cmd+K removido a pedido |
| **Fase 2** — GlobalFilters (3 grupos visuais, botão Limpar, avisos compactos) | ✅ Concluído · ⚠️ Altura reduzida de h-9 para h-7 a pedido |
| **Fase 2** — PainelLayout atualizado (scroll duplo corrigido, body overflow lock) | ✅ Concluído |
| **Fase 3** — AccessShell (hero menor, sem halos, fundo slate-50) | ✅ Concluído |
| **Fase 3** — LocalAdminLoginDialog (sem glow, toggle senha, caps-lock, spinner inline) | ✅ Concluído |
| **Fase 3** — AccessLoading (overlay compacto sem full-page shell) | ✅ Concluído |
| **Fase 3** — AccessDenied (tom âmbar, CTA mailto, detalhes colapsáveis) | ✅ Concluído |
| **Fase 3** — NotFound (português, panel-shell, links rápidos) | ✅ Concluído |
| **Fase 4** — AdminAreaControls (modal animate-modal-in spring, scrim blur) | ✅ Concluído |
| **Fase 4** — CrossFunnelPanel + FinancialBridgePanel (radius-md, aria progressbar) | ✅ Concluído |
| **Fase 4** — FunnelStageSheet (stagger cards, footer export CSV, busca melhorada) | ✅ Concluído |
| **Fase 4** — index.css: stagger, shimmer, modal-in spring, reduced-motion | ✅ Concluído |
| **Fase 5** — Reorganização de páginas (SectionHeader + skeleton shimmer + animate-stagger) | ✅ Concluído |
| **Fase 5** — Agenda: visão por turnos (Manhã/Tarde/Noite) com indicador ao vivo | ✅ Concluído · ⚠️ Timeline por hora substituída por colunas de turno a pedido |
| **Fase 5** — Operacional: sort nas colunas, skeleton shimmer | ✅ Concluído · ⚠️ Bulk select removido a pedido |
| **Fase 5** — Cmd+K command palette (cmdk) | ❌ Removido a pedido do usuário |
| **Fase 5** — Dark mode funcional (variáveis .dark no index.css) | ✅ Concluído · ⚠️ Componentes ainda usam hex direto — migração para tokens semânticos não concluída |
| **Fase 5** — Toast+undo, live data indicator | ✅ Concluído |

### 📋 Rastreio detalhado por seção (§8–§23)

| Seção | Item | Status |
|-------|------|--------|
| **§8 Visão Geral** — 5.7: Volume prod. chart (3ª barra no-show) | ✅ Concluído |
| **§8 Visão Geral** — 5.8: Evolução por funil — legend interativo (clique p/ isolar linha) | ✅ Concluído |
| **§8 Visão Geral** — 5.9: Ranking responsáveis — progress bar inline por coluna | ✅✔ Verificado no código |
| **§10 Contatos** — 6.1: 4 KPIs (leads, multi-funil, retenção, tempo médio 2º funil) | ✅✔ Verificado no código |
| **§10 Contatos** — 6.3: Tabela multi-funil — avatares + ordenável + "Primeira entrada" | ✅ Concluído |
| **§11 Consultas** — 7.2: Remover painel duplicado "Tempo médio de captação" | ✅✔ Verificado — existe só 1 ocorrência no RecebimentoPanel |
| **§11 Consultas** — 7.6: Distribuição — unificar 4 charts em 1 painel com tabs | ⚠️ Implementado, depois revertido: painéis separados em grid 2 colunas a pedido |
| **§11 Consultas** — 7.7: Funil por etapa — filtrar etapas com 0 cards | ⏭️ Pulado a pedido do usuário |
| **§12 Espirometria** — 7.6: Distribuição com tabs | ⚠️ Implementado, depois revertido: painéis separados em grid a pedido |
| **§12 Espirometria** — 7.7: Filtrar etapas com 0 | ⏭️ Pulado a pedido |
| **§13 Broncoscopia** — Mini-painel comparativo Adulto vs Infantil | ✅✔ Verificado no código |
| **§13 Broncoscopia** — KPI extra: "Códigos médios" + "Total de códigos faturados" | ✅✔ Verificado no código |
| **§14 Proc. Cirúrgicos** — 8.1: Renomear "Agendados"→"Fechados" | ✅✔ Verificado — label é "Fechados" |
| **§14 Proc. Cirúrgicos** — 8.3: Painel "Composição do custo" (donut + lista por componente) | ✅✔ Verificado no código (linhas 357–455) |
| **§14 Proc. Cirúrgicos** — 7.6: Distribuição com tabs | ⚠️ Implementado, depois revertido: painéis separados em grid a pedido |
| **§15 Agenda** — 9.1: AgendaEventCard simplificado | ✅✔ Verificado no código |
| **§15 Agenda** — 9.3: Visão Mensal — popover no número do dia | ✅✔ Verificado no código |
| **§15 Agenda** — 9.8: Filtros da Agenda — popover "Filtros (N)" | ✅✔ Verificado no código |
| **§15 Agenda** — 9.10: Eventos passados com opacity 0.55 | ✅✔ Verificado — `isPast && "opacity-55"` |
| **§16 Operacional** — 10.1: Cards de funil — border-clinic-blue quando filtro ativo | ✅✔ Verificado — `ring-2 ring-inset ring-clinic-blue` |
| **§16 Operacional** — 10.2: Badge "N filtros ativos" + botão Limpar | ✅✔ Verificado no código |
| **§16 Operacional** — 10.5: Eye+Edit → 1 botão "Abrir" | ✅✔ Verificado — único botão "Abrir" na tabela |
| **§16 Operacional** — 10.8: Filter presets ("Não pagos do mês" · "Sem responsável" · "Anúncios pendentes") | ✅✔ Verificado no código |
| **§23 Detalhes premium** — Breadcrumb discreto | ❌ Implementado e depois removido a pedido do usuário |
| **§23 Detalhes premium** — Empty states com ícone ilustrado | ✅ Concluído |

### 🔧 Mudanças adicionais da sessão de limpeza UI (fora do plano original)

| Item | Status |
|------|--------|
| Correção de scroll duplo (overscroll-y-contain + body overflow hidden no PainelLayout) | ✅ Concluído |
| Remoção do colapso da sidebar (animação de width era lenta; removido inteiramente) | ✅ Concluído |
| GlobalFilters: altura dos controles reduzida de h-9 para h-7 | ✅ Concluído |
| Operacional: remoção da seleção de linhas / bulk select | ✅ Concluído |
| Agenda — Visão Diária: colunas por turno (Manhã / Tarde / Noite condicional) | ✅ Concluído |
| Agenda — Indicador "ao vivo": chip pulsante com relógio no turno atual ao ver hoje | ✅ Concluído |
| Distribuição — todos os 4 funis: gráficos separados em grids (2 ou 3 colunas) | ✅ Concluído |
| Remoção da Command Palette (Cmd+K) e de toda infraestrutura relacionada | ✅ Concluído |
| Remoção do breadcrumb de todas as páginas | ✅ Concluído |

### 🔲 Itens planejados nunca implementados (fora do escopo acordado)

| Seção | Item |
|-------|------|
| §8 Visão Geral | Novas métricas: velocidade de funil, LTV por origem, custo de oportunidade do no-show, conversão captação→realizado, pico semanal de no-show, margem por procedimento, recompra, NPS proxy, eficiência do anúncio, sazonalidade horária |
| §8 Visão Geral | Insight banner com 3 frases automáticas de tendência |
| §10 Contatos | Painel "Origem da aquisição" com mini-gráfico por canal |
| §10 Contatos | Cohort retention table (semana/mês de entrada × tempo até 2º funil) |
| §10 Contatos | Sankey "Funil de profundidade" (1 funil → 2 → 3 → 4) |
| §10 Contatos | Coluna "Total faturado" na tabela multi-funil |
| §11 Consultas | Novas métricas: conversão para cirurgia, % retorno agendado, no-show por horário, receita/hora, funnel velocity |
| §14 Proc. Cirúrgicos | Novas métricas: custo por componente em tabela, procedimentos com prejuízo, tempo médio fechado→realizado |
| §15 Agenda | Drag & drop para reagendar, export CSV/PDF do dia, indicador de conflitos, hot indicator (2+ no-shows), toggle "Apenas hoje em diante" |
| §16 Operacional | Inline edit (clique duplo no valor), quick add (criar card manualmente) |
| §17 Componentes | FinancialBridgePanel como waterfall chart real (em vez de 3 cards) |
| §20 Dark mode | Migração completa de cores hardcoded (#0F1923, #5C6B7A…) para tokens semânticos (text-foreground, bg-card…) em todos os componentes |
| §23 Premium | Export CSV/PDF em tabelas, compartilhar via link, histórico de filtros, atalhos de teclado (P, R, etc.) |

---

## 0. Diagnóstico geral (vale para todas as telas)

### Pontos fortes atuais

- Arquitetura visual coerente (panel-shell, KPIs, drill-downs).
- Boa tipografia técnica (Plus Jakarta Sans + JetBrains Mono para números — escolha cara).
- Tooltips informativos em quase todas as métricas.
- Comparativos vs. período anterior já implementados (ComparisonBadge).
- Sistema de cores semânticas (clinic-blue, teal, green, amber, red, purple).

### O que faz parecer "sistema bom, mas ainda não premium"

| # | Problema | Onde aparece | Causa |
|---|---|---|---|
| 1 | Inflação de raios "orgânicos" (radius 22/20/18/16 misturados) | Todos os panel-shells, mini-cards, chips, modais | O olho percebe inconsistência. Sistemas premium usam 2-3 raios: 6/12/20. |
| 2 | Excesso de "shadow elevado + borda + glow" | HeroMetricCard tem 3 camadas: rail colorido + glow radial + shadow + border | Polui o foco. Sistemas premium usam 1 sombra sutil ou só borda. |
| 3 | Cores hardcoded em hex (#0F1923, #5C6B7A, #9BAAB8, #E2E6EB, #F7F9FB) espalhadas em ~80% dos arquivos | Quebra o dark-mode (existe .dark no index.css mas nenhum componente usa tokens semânticos). Manutenção difícil. | Falta migrar para text-foreground / text-muted-foreground / border-border / bg-card. |
| 4 | Densidade desigual: cards de KPI são grandes (~140px) e charts grandes (220-260px). Painéis com progress bar 2.5px parecem bons mas margens internas (p-4, p-5, gap-3, gap-5) variam de tela para tela. | Visão Geral vs Consultas vs Operacional | Falta um spacing-scale rígido (4/8/12/16/24/32). |
| 5 | Sem dark mode funcional | Tudo. CSS variables existem mas componentes ignoram. | Sistemas profissionais oferecem dark mode como padrão. |
| 6 | Animações pobres: só fade-in 150ms e slide-up 300ms na entrada. Os hovers fazem translate-y-px (1px). Modais usam Radix default. | Tudo. | Sistemas premium têm spring-physics, stagger nos cards, shared-element nos sheets. |
| 7 | Gráficos sem identidade própria: tooltips genéricos, sem grid pontilhado fino, axis-labels pesados, barras "achatadas" (4px radius). | Todos os charts (Recharts). | Falta micro-detalhes (gradient fills, hover halo, animated bars). |
| 8 | Sidebar pouco trabalhada (220px): logo simplíssimo, sem agrupamento, sem profile no rodapé. | Sidebar.tsx | Linear/Stripe sempre têm profile + workspace switcher no rodapé. |
| 9 | Filtros globais comprimidos demais (h-7 selects, font 11px) | GlobalFilters.tsx | O usuário tem que mirar. Premium = h-9, font-12, mais respiro. |
| 10 | Tabelas básicas (zebra stripe + hover leve) | Visão Geral ranking, Contatos multi-funil, Consultas registros, Operacional | Falta sort por header, virtualização (>50 linhas), sticky header, column resizing, density-toggle (compact/comfortable). |
| 11 | Drawer/sheet com header fraco | FunnelStageSheet, RecordsDrilldownSheet, AgendaDetailSheet | Sem progress contextual (X de Y), sem ações secundárias (export, copiar link). |
| 12 | Sem command-palette / busca global (Cmd+K) | App.tsx | Padrão Linear/Notion/Vercel. |
| 13 | Sem skeleton "real" — usa animate-pulse bg-[#F0F3F6] para tudo | Quase todos os cards | Premium usa shimmer com shape igual ao conteúdo final. |
| 14 | Botão de Sign Out fora de contexto (canto direito da topbar global) | GlobalFilters | Deveria estar no avatar/profile dropdown na sidebar. |
| 15 | Hierarquia visual fraca em painéis longos | Todas as abas de funil | Sem seções com âncoras laterais (TOC sticky) nem agrupamento "Visão executiva / Performance / Recebimento / Distribuição / Detalhe". |

## ✅ 1. Design tokens recomendados (base para tudo)

Antes das telas, proponho trocar a base para deixar o sistema mais elegante:

```css
/* Spacing scale rígida — Linear style */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;

/* Radius — só 3 valores */
--radius-sm: 6px;   /* chips, badges, pills */
--radius-md: 10px;  /* inputs, buttons, mini-cards */
--radius-lg: 16px;  /* panel-shell, modals, KPI cards */

/* Shadows — só 2 perfis */
--shadow-card:  0 1px 2px rgba(15,25,35,0.04), 0 1px 1px rgba(15,25,35,0.02);
--shadow-pop:   0 12px 32px -8px rgba(15,25,35,0.16), 0 2px 4px rgba(15,25,35,0.04);

/* Tipografia — 6 níveis */
--text-display: 28px / 32 / 700 / -0.04em;
--text-h1:      20px / 24 / 600 / -0.02em;
--text-h2:      16px / 20 / 600 / -0.01em;
--text-body:    14px / 20 / 400 / 0;
--text-meta:    13px / 18 / 400 / 0;
--text-label:   11px / 14 / 600 / 0.08em / uppercase;
--text-kpi:     30px / 32 / 700 / -0.04em / JetBrains Mono;
--text-kpi-sm:  22px / 24 / 700 / -0.03em / JetBrains Mono;
```

Por quê? Hoje você tem 8 tamanhos de KPI (clamp variável), 4 raios diferentes por tela (22/20/18/16) e 3+ tons de cinza repetidos em hex. Padronizar dá leveza imediata.

### Paleta refinada — proposta

| Token | Hoje | Proposta | Justificativa |
|---|---|---|---|
| Primary | #1A56DB (azul forte) | #2563EB ou #3B82F6 mais profundo | O atual é "Tailwind blue 700", funciona — mas pareando com slate-900 fica corporativo. |
| Background | #F0F2F4 com radial gradient azul/teal | #F8FAFC plano + grid 1px opacidade 6% | Gradient radial deixa "lúdico". Premium = neutro. |
| Card | bg-white/90 + blur | bg-white border-slate-200/60 shadow-sm | Glassmorphism polui dashboards densos. Cards sólidos são mais legíveis. |
| Cinza-200 (bordas) | #E2E6EB | #E4E7EC ou slate-200 | OK, padronizar. |
| Cinza-500 (label) | #9BAAB8 | #64748B (slate-500) | Slate é mais "Stripe", azulado. |
| Cinza-700 (body) | #5C6B7A | #475569 | Idem. |
| Cinza-900 (heading) | #0F1923 | #0F172A (slate-900) | Idem. |

Recomendação: migrar todo o projeto para slate-* do Tailwind padrão. Mais consistente, dark-mode-ready.

## ✅ 2. Tela: Login / Acesso (LocalAdminLoginDialog + AccessShell)

### Estado atual

Duas colunas: à esquerda, hero gigante (3,4rem) + 3 highlights; à direita, formulário em painel branco com bg-gradient leve. Halos radiais blue/teal no fundo + grid 24x24.

### Problemas

| # | Problema | Justificativa |
|---|---|---|
| 1.1 | Hero gigante demais (3.4rem) ocupa quase metade da tela | Premium = login econômico (Notion, Linear). O hero compete com o formulário, que é o que importa. |
| 1.2 | Halos radiais + grid + gradient + glow nas bordas = overload visual | Camadas demais. Stripe/Vercel usam fundo limpo + acento sutil. |
| 1.3 | Os 3 highlights ("Visão central / Acesso protegido / Uso contínuo") são filler institucional sem valor real | Não ajudam o usuário a logar. |
| 1.4 | Botão "Entrar" com shadow azul forte (0_16px_36px_rgba(26,86,219,0.28)) parece botão de SaaS de promoção | Premium = botão sólido sem glow excessivo. |
| 1.5 | Sem "Esqueceu sua senha?" nem MFA | Sistema "caro" sempre oferece recovery + 2FA. |
| 1.6 | Sem indicação visual da força da senha, sem caps lock detection | Detalhes que dão polidez. |
| 1.7 | Input com bg-[#F8FBFD] (azulado) destoa do tom branco do painel | Inconsistência sutil. |

### Sugestões concretas

- Layout 50/50 (não 60/40), com hero menor (font-display 32-40px) focado em uma única frase e logo. Remover 3 highlights ou substituir por 1 prova social (ex.: "Em uso desde 2024" + ícone shield).
- Adicionar "Lembrar dispositivo (30 dias)" como checkbox e link "Esqueci minha senha" abaixo do botão.
- Botão com bg-slate-900 text-white shadow-sm (preto, premium) ou bg-clinic-blue sem glow. Hover sutil (hover:bg-clinic-blue/95).
- Caps Lock indicator: detectar com event.getModifierState('CapsLock') e mostrar warning amber discreto.
- Loading state: trocar LoaderCircle spin por botão com texto "Validando..." + barra progressiva fina sob o botão (linear-progress).
- Animação de entrada: cards entram com stagger 60ms (hero → form), spring physics. Hoje todos animam juntos.
- Tipografia: trocar text-[2.5rem] por text-3xl md:text-4xl (28-36px), tracking-[-0.05em] por tracking-tight.
- Fundo: substituir halos + grid + gradient por uma única textura noise sutil + bg-slate-50. Mais elegante.

## ✅ 3. Tela: Bloqueio de acesso (AccessDenied)

### Estado atual

Mesmo shell do login, mas tom rosa/amber. Mostra "Credencial recebida" em monospace, blocos com "O que verificar agora".

### Problemas

| # | Problema | Justificativa |
|---|---|---|
| 2.1 | Headline gigante "Você não tem permissão para acessar esta aba" (3,2rem) em vermelho | Excessivamente dramático. Sistemas premium dão mensagem calma ("Acesso ainda não liberado"). |
| 2.2 | Mostra userid técnico ao usuário final | Útil pra debug, mas confunde usuário comum. Esconder atrás de "Ver detalhes técnicos" (acordeão). |
| 2.3 | Sem ação clara ("Solicitar acesso", "Contatar administrador" abre email/Slack) | Texto pede pra contatar admin mas não há CTA. |
| 2.4 | "Status / Parâmetro / Ação" como 3 cards iguais aos do login = confunde estado positivo com negativo | Tom errado para erro. |

### Sugestões

- Reduzir tom de erro: usar amber-500 em vez de red-500/rose. Erro de permissão não é erro fatal.
- CTA primário: botão "Solicitar acesso" que abre mailto: pré-formatado com userid/email + área pedida.
- CTA secundário: "Voltar ao login" + "Tentar com outra conta".
- Detalhes técnicos colapsáveis (<details> ou Accordion).
- Headline 2 linhas curtas: "Acesso ainda não liberado / Solicite a permissão ao administrador" — em vez de 3,2rem.
- Ilustração (Lucide ShieldX 64px) acima do título em vez do ícone 56px num quadrado.

## ✅ 4. Tela: AccessLoading

### Problemas

Tela inteira só para "Validando acesso" com hero gigante + 3 highlights = superexposição.

### Sugestões

- Loading state inline: bloquear o conteúdo com um overlay leve + spinner central pequeno (16px) + texto "Validando sua sessão...".
- Tempo máximo: se passar 3s, mostrar mensagem "Demorando mais que o normal". Após 8s, "Verifique sua conexão".
- Eliminar o AccessShell aqui. Login estendido para "loading" é overkill.

## ✅ 5. Tela: NotFound (404)

### Estado atual

Ultra simplório: 4xl "404" + texto "Oops! Page not found" + link "Return to Home".

### Problemas

- Texto em inglês num sistema todo em português.
- Sem layout que combine com o resto (não usa AccessShell nem panel-shell).
- Sem CTA secundário (busca, recentes).

### Sugestões

- Reescrever em português ("Página não encontrada / Não conseguimos localizar essa rota").
- Reusar AccessShell em tom blue ou um painel limpo com busca rápida ("Procurar página: Visão Geral, Consultas, Agenda...").
- Adicionar ilustração leve ou número 404 grande com tracking apertado em mono.
- Botão primário "Ir para Visão Geral" + secundário "Voltar".

## ✅ 6. Sidebar

### Estado atual

220px fixa, branca. Logo gradient blue→teal 28x28 + "Dashboard BI / Derick Vinhas". 6 nav items com indicador lateral inset. Rodapé: "v4 · 2026".

### Problemas

| # | Problema | Justificativa |
|---|---|---|
| 3.1 | 220px é estreita demais para sidebar premium — apertada para labels como "Proc. Cirúrgicos" (que aparece truncada como "Proc.") | Linear = 240px, Notion = 260-280px. |
| 3.2 | Sem collapse (não dá pra reduzir para só ícones) | Sistemas pro permitem ⌘\ ou seta para colapsar. |
| 3.3 | Não há agrupamento ("Painel" é o único section-label, mas 6 itens não precisam de seção) | Quando crescer (Operacional, Agenda, Settings) vai virar sopa. |
| 3.4 | Rodapé com só "v4 · 2026" | Premium: avatar + nome + role + 3 dots menu (settings, sign out, switch workspace). |
| 3.5 | Sem badge de notificação em nenhum item | Sistemas pro mostram pendências (ex.: "Operacional · 12 sem pagamento"). |
| 3.6 | Sem busca (⌘K não existe) | Padrão atual em SaaS pro. |
| 3.7 | Ícone-logo "LayoutDashboard dentro de quadrado azul" é genérico | Investir num símbolo único (mesmo que monograma "DV"). |

### Sugestões concretas

- 240px. Permitir collapse para 64px (só ícones) via toggle no header da sidebar. Estado persistente em localStorage.
- Header: logo + workspace name + chevron-down (switcher entre BI / Agenda / Operacional — já existe AdminAreaFloatingSwitcher mas não está integrado aqui).
- Agrupar nav em seções:
- Visão (Visão Geral)
- Operação (Agenda, Contatos)
- Funis (Consultas, Broncoscopia, Espirometria, Procedimentos)
- Badges opcionais: ex.: "Agenda · 3 hoje" / "Operacional · 12 sem pagamento".
- Item ativo: usar bg-clinic-blue/8 (cor mais discreta) + border-l-2 border-clinic-blue (em vez de inset shadow).
- Rodapé: avatar + email + dropdown (Settings, Trocar área, Sair). Esconde o botão Sign Out da topbar.
- Trigger Cmd+K: input fake no rodapé do header da sidebar "⌘K Buscar..." que abre um command-palette modal.
- Sub-itens: Consultas → Funil / Performance / Recebimento (navegar por âncoras dentro da aba longa).

## ✅ 7. GlobalFilters (topbar)

### Estado atual

Sticky topbar branca translúcida (90%). Selects h-7 com font 11px (apertados). Datepicker, "Somente anúncios", Responsável, SignOut. Avisos pill amarelo/azul quando modo anúncio ou agendamento ativo.

### Problemas

| # | Problema | Justificativa |
|---|---|---|
| 4.1 | h-7 + text-11px é pequeno demais — risco de mis-tap em touch e fadiga visual | Tap target mínimo 32px (preferível 36). Premium usa 36-40px. |
| 4.2 | 3 selects + datepicker + checkbox + sign-out numa única linha = lotado | Quebra em telas <1280px. |
| 4.3 | Sem indicação de quantos filtros ativos | "Resetar filtros" e "Filtros aplicados (2)" são padrão pro. |
| 4.4 | Aviso pill amarelo "Modo anúncio" ocupa linha inteira | Poderia ser um indicador inline no chip "Somente anúncios" (ex.: borda viva quando ativo) sem aviso flutuante. |
| 4.5 | SignOut visível na topbar sem avatar/email | UX confusa. |
| 4.6 | Sem comparativo on/off | "Comparar com período anterior: [toggle]" deveria ser parte dos filtros para o usuário desligar o ComparisonBadge. |

### Sugestões

- h-9 + text-12px mínimo. Spacing entre filtros: gap-2 (8px).
- Agrupar visualmente: bloco "Período" (atalho + data início + data fim), bloco "Visão" (modo data + somente anúncios), bloco "Equipe" (responsável). Separadores verticais finos.
- Botão "Limpar" quando algum filtro estiver fora do padrão.
- Avisos contextuais sumir-com-animação após 3s ou virar tooltip do chip ativo.
- Comparativo period-over-period como toggle ("Comparar com período anterior"): hoje aparece sempre como ComparisonBadge.
- Mover SignOut para o avatar da sidebar.
- Indicador "última atualização" discreto: "Atualizado há 2 min · ↻". Hoje só dá pra recarregar via F5.
- Atalho de teclado para abrir o seletor de período (P).

## 8. Aba: Visão Geral

### Estado atual

- 4 HeroMetricCards (Leads novos, Faturamento, Taxa realização, Prazo médio).
- 2 painéis lado a lado: Presença operacional + Contatos em outros funis.
- 2 painéis: Motivos de perda + Diagnóstico de perdas.
- 2 charts: Faturamento por funil (barras horizontais) + Volume de produção (barras agrupadas).
- 1 chart: Evolução do faturamento total.
- 1 chart: Evolução do faturamento por funil (linhas múltiplas).
- 1 tabela: Ranking de responsáveis.

### Problemas estruturais

| # | Problema | Justificativa |
|---|---|---|
| 5.1 | Página muito longa sem subdivisões claras (toda em space-y-5) | Cansa o olho. Premium = TOC sticky ou tabs internas. |
| 5.2 | HeroMetricCards são chamativos demais (rail colorido top + glow + ícone chip + Comparison) — visual de "promoção" mais que "analytics" | Linear/Stripe usam KPI mais limpo: número grande + label + delta. |
| 5.3 | Cards de KPI não são clicáveis para drill-down (poderiam abrir o sheet de registros) | Faltaria 1 click até a fonte do número. |
| 5.4 | "Prazo médio geral" está em dias inteiros, sem indicação se é pago/realizado. Conceito confuso. | Renomear para "Tempo médio até pagamento" e detalhar no tooltip. |
| 5.5 | "Taxa de realização" sem indicação de benchmark (qual é a meta?) | Premium mostra "Meta 80% · ▲ 6pp" — comparação útil. |
| 5.6 | Faturamento por funil com altura dinâmica (linhas*58) cria diferença grande entre telas | Usar altura fixa (200) com scroll interno se passar. |
| 5.7 | Volume de produção por funil mistura Agendadas (cinza claro) + Realizadas (verde) — sem barra de "No-show" visual, só no tooltip | Adicionar 3ª barra fina (no-show) ou usar barras empilhadas: realizadas + no-show + restante agendado. |
| 5.8 | Evolução do faturamento por funil: 4 linhas com cores muito próximas (consultas blue, espiro teal, broncos green, cirurgia purple) — confunde colorblind | Adicionar legend interativo (clique para isolar linha) + marker shapes (●▲■◆) diferentes. |
| 5.9 | Ranking de responsáveis: tabela básica sem ordenação por coluna, sem barra horizontal embutida (sparkline ou progress bar) | Premium tableau: progress bar inline com a métrica relativa. |
| 5.10 | Sem "destaques do período" (insights gerados): "🔼 Faturamento cresceu 12% / 🔽 Conversão para cirurgia caiu 3pp" | Padrão Stripe/Pipedrive: a tela abre com 3-4 "insight cards" em texto natural. |

### Novas métricas e reorganização sugerida

Nova ordem proposta:

```text
[Insight banner: 3 frases automáticas com setinhas de tendência]

═══ VISÃO EXECUTIVA ═══
[ 4 KPI cards: Leads novos | Faturamento | Realização | Prazo médio ]
[ Mini sparklines internos (7-30 dias) dentro de cada card ]

═══ PERFORMANCE ═══
[ Presença operacional por funil ] [ Cross-funnel ]

═══ FINANCEIRO ═══
[ Evolução total + por funil em um único chart com tabs ]
[ Faturamento por funil ] [ Volume por funil ]

═══ DIAGNÓSTICO DE PERDA ═══
[ Motivos consolidados ] [ Diagnóstico de perdas ]

═══ TIME ═══
[ Ranking de responsáveis com sparklines ]
```

Novas métricas que podem ser criadas com os dados existentes:

| Nova métrica | Cálculo | Por quê |
|---|---|---|
| Velocidade de funil | Mediana de dias entre data_criacao_card e data_pagamento por funil | Mostra quanto demora do lead até receber dinheiro. |
| Lifetime Value por origem | Faturamento total realizado / contatos únicos por origem agrupada | Mostra que origem traz pacientes que faturam mais. |
| Custo de oportunidade do no-show | Soma de valor_atribuido dos cards nao compareceu (do que teria sido faturado) | Hoje você só tem a contagem, não o valor perdido. |
| Conversão captação→realizado por funil | Realizados / (Realizados + Perdidos + ainda em Negociação) | Hoje a "taxa de realização" só compara dentro da base agendada. |
| % de cards "Sem horário" na agenda | Cards realizados sem horario_agendamento / total realizado | Higiene operacional. |
| Pico semanal de no-show | Dia da semana com mais no-show consolidado | Útil para acionar lembretes. |
| Margem por procedimento (cirurgia) | Valor líquido médio / faturamento bruto médio | Mostra rentabilidade por tipo. |
| Recompra (multi-funil dentro de 90 dias) | Contatos que aparecem em 2+ funis com data_criacao_card em janelas de 90 dias | Indicador de fidelização. |
| NPS proxy de retorno | % de cards com etapa "compareceu retorno" / total realizados | Quem voltou. |
| Eficiência do anúncio | Faturamento realizado dos contatos com origem "Anuncio" / total de leads de anúncio | ROI proxy sem dados de gasto. |
| Sazonalidade horária | Histograma de agendamentos por hora do dia | Útil para alocação de equipe. |

## ✅ 9. HeroMetricCard (componente compartilhado)

### Problemas

- 3 camadas (rail top + glow radial + chip ícone) = visualmente carregado.
- Descrição abaixo do valor ocupa 2 linhas e empurra layout.
- Não clicável para drill.
- Comparison badge com pill cheia (bg-color) compete com o número.

### Versão refatorada (proposta)

```text
┌─────────────────────────────────────┐
│  ▤  LEADS NOVOS         (i)         │ ← label uppercase 11px slate-500
│                                     │
│  1,247  ▲ +12.4%                    │ ← número 30px mono + delta inline pequeno
│                                     │
│  Novos contatos no período          │ ← descrição 12px slate-500 (1 linha)
│  ▁▂▃▄▆▇█▇▆▅                          │ ← sparkline 7-30 dias (10px height)
└─────────────────────────────────────┘
  border-l 2px do `tone` (em vez de rail-top)
```

- Remover glow radial.
- Borda esquerda 2px na cor tone (mais sutil que rail top de 4px).
- Sparkline integrada (pode ser super simples: lib react-sparklines ou inline SVG).
- Click no card → abre drill-down dos registros que compõem.
- Hover: subir 2px (não 1px) com shadow elevada.
- Delta inline ao lado do número, sem pill colorida (só texto + ícone arrow).

## 10. Aba: Contatos

### Estado atual

1 HeroMetricCard (Leads novos) + MultiFunnelPanel (taxa de retenção em destaque). Chart "Evolução de leads". 2 charts lado a lado: Leads por origem + Leads por tag. Tabela "Pacientes multi-funil".

### Problemas

| # | Problema | Justificativa |
|---|---|---|
| 6.1 | Apenas 1 KPI no topo + um painel grande de retenção = desbalanceado | Faltam KPIs auxiliares (contatos com anúncio, contatos sem origem). |
| 6.2 | Leads por tag com [] filtrados, mas se houver 30+ tags fica scroll vertical sem fim | Top 10 + "Ver todas" expandível. |
| 6.3 | Tabela multi-funil com 4 colunas booleanas (CheckCircle / XCircle) = legível mas chata | Trocar por avatar do funil + cor de fundo cheia quando true. |
| 6.4 | Aviso amarelo "período por Data de Criação" repetitivo (já há aviso na topbar) | Remover daqui ou unificar com a topbar. |
| 6.5 | Sem distribuição temporal de cohort | Cohort de retenção (mês de entrada × tempo até multi-funil) seria poderoso. |
| 6.6 | Sem filtro de origem dentro da aba (só global) | Operacionalmente útil. |

### Sugestões + Novas métricas

KPIs em 4 colunas (em vez de 1 + painel):

- Leads novos
- Contatos multi-funil
- Taxa de retenção (já existe)
- Tempo médio até 2º funil (novo: média de dias entre criado_em e data_criacao_card do 2º funil)

Painel "Origem da aquisição":

- Cards stack horizontal: cada origem (Anúncio, Direta, Indicação, Doctoralia) com mini-gráfico de barras temporal + variação vs período anterior + LTV proxy.

Cohort retention (novo):

- Tabela cohort: linhas = semana/mês de entrada, colunas = tempo (0d, 7d, 30d, 60d, 90d), valor = % que entrou em outro funil. Padrão de SaaS analytics.

Gráfico "Funil de profundidade":

- Sankey simples: Contatos novos → Em 1 funil → Em 2 → Em 3 → Em 4. Visualiza fidelização.

Pacientes multi-funil:

- Adicionar coluna "Total faturado" (somar valor_atribuido das realizadas em todos os funis).
- Coluna "Primeira entrada" (data).
- Tornar tabela sortable + paginada.
- Avatares circulares pequenos no início (Notion-style).

## 11. Aba: Consultas

### Estado atual (muito completa)

- 4 HeroMetricCards.
- PerformancePanel + RecebimentoPanel.
- CrossFunnelPanel + Painel "Tempo médio de captação".
- Funil por etapa (drill clicável).
- LossReasons + LossDiagnostics.
- 2 charts: Por tipo + Por modalidade.
- 2 charts: Por origem + Faturamento por origem.
- 1 chart: Realizadas por responsável.
- 1 chart: Evolução do faturamento.
- 1 tabela: Registros operacionais (60 max).

### Problemas

| # | Problema | Justificativa |
|---|---|---|
| 7.1 | Página enorme (10+ blocos) sem âncoras | Scroll fatigue. Sticky TOC à esquerda resolveria. |
| 7.2 | "Tempo médio de captação" aparece 2x (no RecebimentoPanel e como painel próprio) | Redundância. |
| 7.3 | No-show consulta vs No-show retorno — distinção sutil, sem visual hierárquico | Adicionar ícones diferenciadores (Calendar-X vs RotateCcw-X). |
| 7.4 | "Realizadas por responsável" isolado fica solto entre origem e evolução | Mover para perto do Funil por etapa (bloco "Performance") ou junto da Tabela. |
| 7.5 | Tabela mostra só 60 registros sem paginação nem ordenação | Premium = paginação real + sort por coluna. |
| 7.6 | "Por tipo" / "Por modalidade" / "Por origem" são 4 gráficos similares lado a lado — visualmente repetitivo | Tornar 1 painel com pills/tabs para alternar a dimensão analítica ("Distribuir por: Tipo · Modalidade · Origem · Responsável"). |
| 7.7 | "Funil por etapa" com 14 etapas em barras horizontais — algumas etapas têm 0 cards (poluição) | Filtrar etapas com 0 ou colapsar em "Outras (3)". |
| 7.8 | Etapas com cores muito parecidas (Agendado #1A56DB vs Em Confirmação #3B82F6 vs Confirmado #0891B2) | Distinguir grupos (Pré-atendimento / Atendimento / Pós / Encerrados) com famílias de cor. |

### Novas métricas para Consultas

- Conversão consulta → cirurgia com tempo médio (dias de espera entre consulta realizada e procedimento agendado).
- % retorno agendado sobre realizadas (indicador de continuidade do tratamento).
- No-show por horário (manhã/tarde/noite) — útil para entender se manhã tem mais falta.
- Receita média por hora trabalhada = faturamento / horas únicas com agendamento.
- Funnel velocity: tempo médio que um card fica em cada etapa antes de avançar.

### Reorganização proposta

```text
═══ VISÃO ═══
[4 KPIs]

═══ PERFORMANCE ═══
[ PerformancePanel ] [ RecebimentoPanel ]
[ Funil por etapa ] [ Realizadas por responsável ]

═══ ANÁLISE DE PERDA ═══
[ LossReasons ] [ LossDiagnostics ]

═══ DISTRIBUIÇÃO ═══
[ Painel com tabs: Tipo · Modalidade · Origem · Forma Pgto · Responsável ]

═══ EVOLUÇÃO ═══
[ Chart de evolução do faturamento (com tabs: Faturamento · Realizadas · No-show · Ticket médio) ]

═══ CROSS-FUNNEL ═══
[ CrossFunnelPanel ]

═══ REGISTROS ═══
[ Tabela paginada e ordenável ]
```

## 12. Aba: Espirometria

### Estado atual

Mesma estrutura de Consultas, com 1 só CrossFunnel (vínculo com consulta).

### Problemas + Sugestões

- Mesmos problemas estruturais da Consultas — aplicar reorganização idêntica.
- CrossFunnelPanel "Vínculo com consulta" ocupa linha inteira sozinho — fica pequeno e isolado. Combinar com outro painel ao lado (ex.: "Tempo médio até a consulta de origem").
- Nova métrica útil: % de espirometrias com consulta posterior (continuidade do tratamento) — combinar com tempo médio de retorno.
- Nova métrica: Spirometrias adultas vs infantis (se houver tipo_paciente) — já existe na broncoscopia.

## 13. Aba: Broncoscopia

### Estado atual

Igual Consultas, com bloco extra "Por tipo de paciente" (Adulto/Infantil) + "Quantidade de códigos".

### Problemas

- Tipo de paciente com só 3 valores (Adulto/Infantil/Não definido) em um chart de barras de tamanho cheio = desperdício de espaço.
- Quantidade de códigos (quantidade_codigos) — métrica mencionada em CONTEXTO mas não vi nos KPIs. Precisa ficar visível com explicação no tooltip (o que é "código"?).

### Sugestões

- Mini-painel comparativo Adulto vs Infantil: 2 cards lado a lado mostrando volume + faturamento + ticket médio + no-show% — mais informativo que barras.
- KPI extra: "Códigos médios por broncoscopia" + "Total de códigos faturados no período".
- Distinguir broncoscopias com vinculo (a consulta) ou não — % vinculadas é métrica de qualidade operacional.

## 14. Aba: Procedimentos Cirúrgicos

### Estado atual

4 HeroMetricCards (Fechados, Realizados, Faturamento bruto, Valor líquido). Performance + Recebimento. FinancialBridgePanel (Bruto - Custos = Líquido + margem). Funil por etapa. Loss panels. Distribuições. Evolução. Tabela.

### Problemas

| # | Problema | Justificativa |
|---|---|---|
| 8.1 | "Fechados" e "Agendados" são a mesma coisa (Contexto confirma) — confunde o usuário | Renomear para apenas "Fechados" e remover qualquer label "Agendados". Tooltip explica. |
| 8.2 | FinancialBridgePanel é bonito mas perde força porque está depois de Performance/Recebimento, longe dos KPIs financeiros do topo | Mover para logo abaixo dos 4 KPIs ou substituir 1 dos KPIs por um "mini-bridge" inline. |
| 8.3 | Sem decomposição de custos (anestesia, hospital, comissão, instrumentação, impostos) — todos somados em "Custos diretos" | Adicionar painel "Composição do custo" com pizza ou waterfall mostrando contribuição de cada custo. |
| 8.4 | Sem "custo % do bruto" | Útil saber que custo representa X% — hoje só margem. |
| 8.5 | "Margem" em verde sem indicação de meta | Premium: marca da meta no progress bar (ex.: linha vertical em 60%). |

### Novas métricas

- Margem por tipo de paciente (se houver tipo).
- Custo médio por componente: tabela com Anestesia / Hospital / Comissão / Instrumentação / Impostos, cada um com valor médio + % do bruto + comparativo.
- Procedimentos com prejuízo (custos > bruto): contagem + lista clicável.
- Tempo médio entre fechado e realizado (espera cirúrgica).
- Pagos parcelados vs à vista (modalidade de pagamento).

### Reorganização proposta

```text
[4 KPIs: Fechados, Realizados, Faturamento bruto, Líquido]
[ FinancialBridgePanel (mover pra cá) ]
[ Performance ] [ Recebimento ]
[ Composição de custos (NOVO) ]
[ Loss panels ]
[ Distribuições com tabs ]
[ Evolução ]
[ Tabela ]
```

## 15. Agenda (AgendaIsolada)

### Estado atual

Top bar: Tabs (Diária/Semanal/Mensal) + setas nav + Hoje + datepicker + busca + checkbox anúncios + responsável + tipo. Pills de filtro funil + turnos. Distribuição por funil.

Dia: 3 colunas (manhã/tarde/noite) + Sem horário.

Semana: 7 colunas mini.

Mês: grid 7x6 com 3 eventos + "X mais".

AgendaEventCard: pill horário + pill funil + nome + responsável + turno + valor + tag retorno + etapa + tipo + alerta sem horário.

AgendaDetailSheet 440px com grid 2×7 + descrição + identificação + botão "Abrir conversa".

### Problemas

| # | Problema | Justificativa |
|---|---|---|
| 9.1 | AgendaEventCard tem 5-8 pills (horário, funil, retorno, etapa, tipo, alerta) — visual entulhado | Premium agenda (Google, Cron, Notion): 1 linha forte (nome + horário) + 1 linha secundária (funil + responsável). Resto em hover/detalhe. |
| 9.2 | Visão Semanal mostra coluna estreita demais (grid 7) sem timeline vertical real | Premium = timeline com horas no eixo Y e cards posicionados por hora real (Google Calendar style). |
| 9.3 | Visão Mensal mostra só 3 eventos + "X mais" sem hover preview | Premium: hover do dia abre popover com lista completa. |
| 9.4 | Visão Diária com 3 cards horizontais (manhã/tarde/noite) — pouca densidade | Adicionar timeline real do dia (08h-20h) ao lado, com cards posicionados. |
| 9.5 | Drag & drop ausente | Premium permite arrastar para reagendar (mesmo que não persista — pelo menos otimisticamente). |
| 9.6 | Sem indicação de conflitos (2 agendamentos no mesmo horário/responsável) | Críticos! Marcar visualmente. |
| 9.7 | Sem alerta "próximo do horário" | Sistema operacional deveria destacar "Agora" / "Próximos 30 min" / "Atrasado". |
| 9.8 | Topbar com 4 selects + busca + 6 pills + 5 turnos + distribuição = labirinto | Agrupar filtros em popover "Filtros (3)" e deixar só Visão + Navegação + Busca visíveis. |
| 9.9 | Sem export (PDF do dia para imprimir, CSV) | Operacional precisa imprimir agenda. |
| 9.10 | Sem cores diferentes para etapa atual vs futura/passada | Premium acinzenta horários já passados. |

### Sugestões

#### Mini-melhorias rápidas

- Reduzir pills do card: nome (semibold 14px) + horário ao lado + 1 chip de cor funil + valor (à direita). Resto em hover preview tooltip ou abertura do sheet.
- Marcador "Agora": linha horizontal vermelha 1px que atravessa o calendário na hora atual (Google Calendar).
- Tons mais suaves para passado: opacity 0.55 nos eventos com dateValue < now.

#### Reescrita estrutural

- Visão Diária: 2 colunas — timeline real à esquerda (faixa de horas com cards alinhados) + lista "Sem horário" à direita.
- Visão Semanal: timeline horizontal de 7 dias com cards posicionados na hora certa. Hoje fica em coluna estreita não usa o espaço.
- Visão Mensal: grid atual + popover ao hover do número do dia para ver até 8 eventos.

#### Novas funcionalidades operacionais

- Toggle "Apenas hoje em diante".
- Filtro "Sem pagamento" dentro da agenda (cruza com data_pagamento).
- Hot indicator: pacientes com 2+ no-show no histórico (badge vermelho discreto).
- Drag para nova data: visualmente arrasta (sem persistir, ou com confirmação).

## 16. Operacional (AbaEmDesenvolvimento)

### Estado atual

4 cards-botão (resumo por funil).

Filtros operacionais (busca + funil + base + responsável + pagamento + período).

Tabela 10 colunas + paginação + ações (Eye / Edit).

CardEditorSheet (sheet de edição).

### Problemas

| # | Problema | Justificativa |
|---|---|---|
| 10.1 | Resumo por funil com cards-botão grandes (h-20) sem indicação se clicado/ativo (só inverte o filtro mas visual não muda) | Falta border-clinic-blue quando ativo. |
| 10.2 | Filtros densos (busca 1.4fr + 4 selects + período em bloco separado) sem feedback de quantos filtros aplicados | Repetir o padrão da topbar global. |
| 10.3 | Tabela 10 colunas = scroll horizontal em telas <1440px | Permitir esconder/mostrar colunas (Stripe Dashboard style). |
| 10.4 | Sem column resize, sem sort, sem density-toggle | Operacional pesado precisa. |
| 10.5 | Botões Eye + Edit com h-9 w-9 separados — poderia ser 1 botão "Abrir" que entra em modo view, com toggle interno para edit | Reduz cliques. |
| 10.6 | CardEditorSheet (não vi conteúdo completo) provavelmente segue o padrão Sheet — verificar UX de edição inline. | — |
| 10.7 | Sem bulk-actions (selecionar múltiplos cards e marcar como pago, por ex.) | Premium operacional sempre tem. |
| 10.8 | Sem indicador de filtros salvos (presets: "Não pagos do mês", "Sem responsável") | Operação repetitiva. |

### Sugestões

- Resumo por funil: tornar cards menores (h-14) com indicação ativa por borda azul.
- Tabela: usar @tanstack/react-table (já está nas deps?) — adicionar sort, column visibility, density toggle, sticky header, row selection (checkbox).
- Bulk actions: barra flutuante quando >1 row selecionado: "Marcar como pago", "Atribuir responsável", "Exportar".
- Presets de filtro salvos: dropdown "Meus filtros: Não pagos do mês · Sem responsável · Anúncios pendentes".
- Inline edit (sem abrir sheet): clique duplo no valor/forma_pagamento permite editar inline (Notion style).
- Quick add (botão flutuante para criar card manualmente — só admin).

## ✅ 17. Componentes compartilhados (panels, sheets, badges)

### panel-shell (base de todos os painéis)

Atual: rounded-[22px] border-white/80 bg-white/90 shadow-card backdrop-blur-sm.

Problema: backdrop-blur em dashboards é desnecessário (não há fundo dinâmico) e custa GPU.

Sugestão: rounded-2xl border border-slate-200 bg-white shadow-sm. Mais limpo, mais rápido.

### PerformancePanel / RecebimentoPanel

Visual: headline (4 stat-cards menores embaixo) — bom.

Problema: stat-cards têm 1.65rem mono bold + chip pequeno. Bonito mas a tipografia "compete" com o headline (2.15rem). Hierarquia precisa de 2 níveis mais claros.

Sugestão: stat-cards menores em 18px mono + sub em 11px. Reservar 28-32px só para o headline.

Adicionar: trend mini (sparkline ou seta) em cada stat-card.

### CrossFunnelPanel

Bom: progress bar com cor do funil + share %.

Problema: não é clicável para abrir os contatos.

Sugestão: tornar cada card clicável → abre RecordsDrilldownSheet com os contatos.

### LossReasonsPanel / LossDiagnosticsPanel

Bom estado.

Sugestão: tornar barras dos motivos clicáveis → drill-down dos cards perdidos com esse motivo. Verificar se já é (no código vi originsComparison mas não vi onClick em cells).

### FinancialBridgePanel

Bom conceito visual (Bruto - Custos = Líquido com separadores de operador).

Problema: 3 cards iguais separados por "-" e "=" perdem o efeito waterfall.

Sugestão: virar waterfall chart real: barra do bruto cheia → barra do custo descendo (vermelho) → barra do líquido. Visualmente muito mais impactante. Lib recharts suporta.

### FunnelStageSheet / RecordsDrilldownSheet

Sheets bem feitas com header colorido, busca local, contador.

Sugestão:

- Footer com ações: "Exportar CSV", "Copiar link", "Imprimir".
- Densidade toggle (compact/comfortable) na tabela interna.
- Selecionar tudo + ações em lote.
- Animação de entrada: hoje é só slide-right. Adicionar fade do conteúdo interno com stagger 40ms (rows entram uma após a outra).
- Sheets premium (Stripe): ao abrir, o conteúdo de trás escurece sutilmente E é levemente escalado (scale(0.98)) para dar profundidade.

### ComparisonBadge

Bom: 3 estados (up / down / flat) com ícones e cores.

Problema: "down" usa amber (warning), mas down nem sempre é ruim (ex.: prazo médio caiu é bom; no-show caiu é bom). Hoje sempre paint amber.

Sugestão: prop inverseSentiment?: boolean para inverter cores (verde para down, vermelho para up) em métricas onde "menos é melhor".

### KpiCard

Versão antiga, usa panel-shell direto.

Sugestão: descontinuar em favor de uma única MetricCard parametrizada (hero + small).

### Sidebar.AdminAreaFloatingSwitcher

Floating switcher fora da sidebar = visualmente desconectado.

Sugestão: integrar como chevron-down no header da sidebar (workspace switcher).

## ✅ 18. Animações & Modais (o "ar de sistema caro")

### Estado atual

- Animations: fade-in 150ms, slide-up 300ms, chart-in 300ms scale 0.97→1.
- Hover: translate-y-px (1px sutil).
- Modais: Radix default (slide right).
- Sem stagger, sem spring, sem shared-element.

### Sugestões — animação como linguagem

| Onde | Hoje | Premium |
|---|---|---|
| Entrada da página | animate-fade-in (150ms tudo junto) | Stagger 40-60ms: header → KPIs → painéis → tabela. Cada bloco entra de baixo (translateY 8px) com spring [0.32, 0.72, 0, 1]. |
| Hover KPI | translate-y-px + shadow | translate-y(-2px) + scale(1.005) + shadow-pop com duration 200ms ease-out. |
| Click no card | nada | scale-down (0.97) por 100ms antes de abrir sheet (feedback tátil). |
| Sheet entry | slide-right Radix default | slide-right + bg de trás escala 0.985 + fade scrim 60% black, 240ms cubic-bezier. |
| Sheet exit | reverso | exit 65% da duração de entry (mais responsivo). |
| Tab switch (Agenda) | nada | crossfade 200ms entre views + content stagger. |
| Charts | chartIn scale 0.97 | Recharts isAnimationActive=true (already) com animationDuration={600} e animationEasing="ease-out". Adicionar shimmer skeleton com mesmo shape. |
| Loading buttons | LoaderCircle animate-spin | Substituir conteúdo do botão por loader + texto "Validando..." + travar largura para não dar "jump". |
| Toast notifications | sonner padrão | Mover para top-right com slide-from-right + ícone colorido. Auto-dismiss 5s mas pausa no hover. |
| Progress bars | transition-width 300ms | OK, mas adicionar shimmer overlay quando carregando. |
| Tooltips | Radix instant | Delay 300ms (não atrapalha) + transição fade 120ms. |

### Modais premium (Apple HIG / Linear)

- Backdrop scrim: bg-slate-900/40 backdrop-blur-sm (atual já tem blur, mas com 40% black o foco fica perfeito).
- Modal entry: scale(0.96) + translateY(8px) → scale(1) + translateY(0) com spring 280ms.
- Esc para fechar + click-outside + animação reversa rápida (180ms).
- Foco visível no primeiro input/botão ao abrir.

## ✅ 19. Tipografia revisada (todas as telas)

### Problemas

- 5+ tamanhos de KPI (clamp), 3+ tamanhos de headline (text-xl, text-[1.9rem], text-[2.5rem], text-[3.4rem]).
- Section-label inconsistente (11px, 12px, 13px com tracking variável).
- Body text em 13px em painéis e 14px em tabelas.

### Escala recomendada (6 níveis fixos)

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| display | 28-32px | 700 | Page title (h1 das abas) |
| h2 | 16px | 600 | PanelTitle |
| h3 | 14px | 600 | Sub-painéis |
| body | 14px | 400 | Descrições, tabela rows |
| meta | 12px | 400 | Descrições secundárias |
| label | 11px | 600 / uppercase / tracking 0.08em | section-label, table head |
| kpi-xl | 32px | 700 / mono | HeroMetricCard |
| kpi-md | 22px | 700 / mono | PerformancePanel headline |
| kpi-sm | 16-18px | 700 / mono | stat-cards menores |

Substituir text-[2.15rem], text-[1.65rem], text-[1.9rem], text-[1.45rem], text-[2rem], text-[3.4rem] por essas 3 classes mono.

### Font choice

Plus Jakarta Sans está bem (semelhante a Inter, levemente mais humano).

Considerar trocar para Inter Tight ou Geist (Vercel) se quiser tom mais técnico. Plus Jakarta tem terminações arredondadas que sugerem "amigável" — pode ou não combinar com a marca clínica séria.

JetBrains Mono está perfeito para números.

## ✅ 20. Cores: refino e dark mode (modo claro implementado)

### Refino do modo claro

- Trocar slate-equivalentes próprios (#9BAAB8, #5C6B7A, #0F1923) por Tailwind slate padrão (slate-400, slate-500, slate-700, slate-900). Manutenção infinitamente melhor.
- Reduzir saturação do background (remover gradients radiais blue/teal do body). Fundo bg-slate-50 puro.
- Bordas mais sutis: border-slate-200/70 em vez de #E2E6EB direto.

### Dark mode (implementar)

- Variables .dark já existem no index.css mas nenhum componente usa text-foreground ou bg-card.
- Migração: substituir todos os text-[#0F1923] por text-foreground, text-[#5C6B7A] por text-muted-foreground, bg-white por bg-card, border-[#E2E6EB] por border-border, etc.
- Toggle de tema: no avatar dropdown da sidebar (Sistema / Claro / Escuro).
- Charts no dark: redefinir cores dos grids (stroke-slate-700 em vez de #E2E6EB) e tooltips (bg-slate-900 text-slate-100).
- Critical: testar contraste de cada cor semântica no dark (clinic-blue #1A56DB é OK; clinic-amber #B45309 precisa ficar #F59E0B no dark para contraste).

## ✅ 21. Acessibilidade (a11y — fase inicial)

### Problemas observados

| # | Problema | Onde | Fix |
|---|---|---|---|
| a11y.1 | Tooltips em ícones Info sem aria-label no Info em si — TooltipTrigger envolve mas screen reader pode pular | KpiCard, HeroMetricCard, PanelTitle | Adicionar aria-label="Mais informações sobre ${label}". |
| a11y.2 | Selects da topbar com text-[11px] < 14px | GlobalFilters | Subir para 12px+. iOS pode autozoom em <16px se for input. |
| a11y.3 | Botão de fechar do sheet sem label visível | Radix Sheet (defaults) | Verificar srOnly "Fechar". |
| a11y.4 | Charts (Recharts) sem aria-label descritivo do insight | Todos os charts | Adicionar role="img" + aria-label="Faturamento por funil: cirurgia lidera com R$ X". |
| a11y.5 | Cores como única indicação de estado em badges de etapa | Tabela de Consultas, Procedimentos | Adicionar ícone (✓, ✗, ⏱) junto da cor. |
| a11y.6 | Sem skip-link funcional além do que está em PainelLayout | OK no PainelLayout, mas Agenda/Operacional isolados não têm | Replicar <a href="#main">. |
| a11y.7 | Filtro "Somente anúncios" é checkbox embutido em label sem role="switch" apesar de comportamento ON/OFF | GlobalFilters | OK para checkbox. |
| a11y.8 | Sem reduced-motion fallback para chartIn | index.css | Já tem @media (prefers-reduced-motion). Conferir. |

## ✅ 22. Performance / Polish (fase inicial)

| # | Tópico | Sugestão |
|---|---|---|
| p.1 | Charts são recriados em cada filtro (toda a tela rerenderiza) | Memoizar painéis com React.memo + chaves estáveis. |
| p.2 | Recharts pode ser pesado com 1000+ pontos | Já tem buckets, OK. Adicionar <Brush /> para zoom em períodos longos. |
| p.3 | Tabela operacional carrega tudo client-side (PAGE_SIZE = 25 mas filteredCards é o array completo) | Virtualizar com react-window se passar de 200 cards. |
| p.4 | backdrop-blur em panel-shell em todas as telas custa GPU mobile | Substituir por shadow + border simples. |
| p.5 | fonts Plus Jakarta + JetBrains carregadas integralmente | Subset latin + font-display: swap. |
| p.6 | stale-time 5min está OK | Considerar realtime para Agenda (Supabase realtime) — hoje só recarrega. |
| p.7 | No skeleton específico: usa animate-pulse bg-[#F0F3F6] genérico | Substituir por skeletons com mesmo shape do conteúdo (cards retangulares com mini-elementos). |

## 23. Pequenos detalhes que somam muito ("ar premium")

- Cmd+K (Command Palette): busca global de pacientes, abas, filtros. Padrão Linear/Notion. Pode ser feito com lib cmdk.
- Atalhos de teclado visíveis nos botões (P para Período, R para Responsável, G então A para "Go Agenda" — Gmail style).
- Breadcrumb discreto no topo da página (Painel › Funis › Consultas).
- Toast de confirmação com undo ("Card atualizado · Desfazer" por 5s).
- Indicador de "dados ao vivo" (ponto verde pulsando quando hooks revalidam).
- Última atualização ("Atualizado há 2 min · ↻ Atualizar") no canto superior direito.
- Empty states ilustrados (em vez de só texto cinza).
- Skeleton com shimmer (gradient animado) em vez de pulse.
- Avatares circulares para responsáveis (mesmo que iniciais).
- Badges de produto ("BETA", "Em desenvolvimento") onde aplicável.
- Onboarding tour opcional (lib react-joyride) para novos usuários.
- Export CSV / PDF em todas as tabelas (gera arquivo direto).
- Compartilhar via link (URL com filtros pré-aplicados — já é serializável pelo query string).
- Histórico de filtros ("Filtros recentes: Anúncios deste mês, Sem responsável").
