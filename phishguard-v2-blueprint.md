# PhishGuard v2 — Blueprint Estratégico, Arquitetural e de Produto

> **Projeto:** Plataforma SaaS brasileira de conscientização e simulação anti-phishing
> **Inspiração competitiva:** HackRangers, KnowBe4, Hoxhunt, Proofpoint Security Awareness
> **Stack:** Next.js 15 (App Router) + TypeScript + Supabase + Cloudflare Pages
> **Versão:** 2.0 — Reengenharia completa
> **Autor deste blueprint:** Marlon com assistência técnica aprofundada
> **Data:** Abril 2026

---

## Sumário Executivo

Este documento substitui integralmente o blueprint anterior (`phishguard-architecture.md`). A versão 1 era sólida como checklist visual, mas insuficiente como especificação de produto — faltava arquitetura de jornada de aprendizagem, mecanismos anti-IA nas avaliações, governança legal (LGPD/CLT), modelagem de dados tenant-safe, e um sistema de design escalável. Além disso, a direção visual original (`Elegant Dark Ops` com `#00FF88` puro) é genérica: é a mesma paleta que 70% dos produtos de cibersegurança usam desde 2021. Não diferencia.

O v2 entrega:

1. **Análise crítica** do frontend e do documento atual, apontando o que precisa ser reconstruído e por quê.
2. **Nova direção visual** — *Forensic Noir* — deliberadamente afastada dos clichês SOC/hacker-green, mais editorial, mais próxima de ferramentas como Linear, Arc e Proofpoint Enterprise.
3. **Arquitetura de jornada pedagógica** em três tiers (Básica / Intermediária / Avançada), com justificativa pedagógica e mapeamento por evento.
4. **Sistema anti-IA para avaliações** — o diferencial técnico mais crítico do projeto, com sete camadas de defesa combinadas (nenhuma camada sozinha resolve).
5. **Design System v2** completo em tokens, pronto para Tailwind CSS 4 e shadcn/ui.
6. **Estrutura de código** Next.js 15 com App Router, Server Components, Server Actions, RLS no Supabase.
7. **Governança legal brasileira** — LGPD, CLT, base legal do tratamento, retenção, direitos do titular.
8. **Roadmap de entrega** em fases com critérios de aceitação.

---

## Parte I — Análise Crítica do Estado Atual

### 1.1 Diagnóstico do documento v1

O documento original tem mérito em três pontos: (a) definiu stack coerente, (b) mapeou rotas do App Router, (c) especificou componentes reutilizáveis básicos. Porém, como blueprint de produto SaaS B2B em cibersegurança brasileira, apresenta lacunas estruturais:

**Lacunas estratégicas.** Não há nenhuma palavra sobre LGPD, CLT, base legal para tratamento de dados do colaborador, retenção de logs de engenharia social, ou termo de ciência do empregado. Isso é intratável num produto que vai rodar em empresas brasileiras — um único processo trabalhista por "simulação sem ciência" derruba a plataforma. Também não há modelo de multi-tenant real (apesar da menção a "empresa switcher" futura), nenhum esquema de RLS no Supabase, nenhuma política de isolamento por `company_id`.

**Lacunas pedagógicas.** O documento trata "treinamento" como um módulo genérico com vídeo + quiz. Mas o briefing do projeto exige *jornadas progressivas* (básica → intermediária → avançada) com fluxos distintos condicionados ao comportamento do usuário no ataque simulado. Isso não é um módulo — é uma máquina de estados de aprendizagem, e precisa ser modelada como tal.

**Lacunas anti-IA.** O ponto mais crítico do briefing — "dificultar o uso de IA nas avaliações" — não aparece em lugar algum do v1. Essa omissão é grave, porque resolver isso bem é o principal fator de diferenciação técnica versus HackRangers e concorrentes, que hoje têm avaliações trivialmente contornáveis por LLMs.

**Lacunas de design.** A paleta escolhida (`#00FF88` sobre `#080C12`) é literalmente o preset de dezenas de produtos concorrentes — Tenable, SentinelOne, Darktrace, HackRangers, todos usam variações quase idênticas. A diretriz "Vercel + Linear + Stripe mas para cibersegurança" é um *briefing incompleto*, não uma direção visual. Syne + DM Sans é uma combinação respeitável, mas está virando padrão em produtos de AI/cyber desde 2023 — já não diferencia. Precisamos de personalidade visual própria.

**Lacunas técnicas.** Não há especificação de: estratégia de testes, observabilidade, feature flags, internacionalização (pt-BR é default mas empresas multinacionais precisam de EN/ES), rate limiting, proteção contra scraping de templates, pipeline de entregabilidade SMTP (SPF/DKIM/DMARC próprios para não queimar domínio), ou separação de domínio entre o app (`app.phishguard.com.br`) e os iscas de phishing (`mail-rh-banco.click`, etc).

### 1.2 Diagnóstico da interface inicial

Você mencionou ter uma "estrutura inicial de frontend" mas não anexou os arquivos dela — apenas o documento de arquitetura. Como não tenho acesso ao código-fonte do frontend atual, a análise de responsividade, UX, clareza de jornada e performance será feita contra a *especificação* do v1 (os layouts ASCII nas seções 5.1 a 5.6) e não contra o código renderizado. Se você puder me enviar o repositório ou screenshots, eu faço uma segunda passagem focada em código real.

Com base na especificação:

**Responsividade.** O v1 menciona mobile na seção 8, mas superficialmente ("sidebar vira drawer, cards empilham"). Faltam decisões importantes: o dashboard tem tabelas largas com 8+ colunas — como viram cards verticais preservando ordenação? O wizard de campanha tem layout split (lista + preview) no step 3 — no mobile, como alternar? A página "Você foi pescado" precisa funcionar perfeitamente no celular porque *é nele que 70% dos phishing reais são clicados* (dados Verizon DBIR 2024). O v1 não trata isso.

**Usabilidade.** O dashboard v1 tem 4 rows densas + 1 benchmark full-width. Isso é muita informação simultânea. Para um admin que abre pela primeira vez, qual é a *hierarquia de atenção*? O v1 não responde. Precisa haver um "one number" — o risco da empresa — que domina visualmente e uma separação clara entre "saúde geral" e "ação necessária agora" (quem clicou hoje, campanha precisando de revisão).

**Clareza de jornada.** O fluxo "funcionário recebe e-mail → clica → aprende" está descrito textualmente (seção 5.6) mas não modelado como máquina de estados. Quem é o usuário em cada tela? Qual é o contexto emocional? A página "Você foi pescado" precisa ser cuidadosa — não pode humilhar, não pode ser paternalista, precisa converter vergonha em aprendizado. O v1 trata isso como um template visual, não como um problema de design comportamental.

**Performance e boas práticas.** Faltam decisões sobre: Server Components vs Client Components (tudo "use client" default mata o RSC), estratégia de caching (ISR? Revalidate on-demand?), imagens (Next/Image com AVIF?), fontes auto-hospedadas (o v1 menciona mas não especifica `next/font/local`), bundle splitting por rota, e métricas de Core Web Vitals alvo.

### 1.3 Conclusão do diagnóstico

O v1 é um bom *mood board técnico*, mas não um blueprint de produto. Precisa ser refundado nos eixos: (a) direção visual autêntica, (b) arquitetura pedagógica, (c) sistema anti-IA, (d) governança legal, (e) engenharia frontend moderna com Next.js 15. É o que este documento faz a seguir.

---

## Parte II — Direção Visual: *Forensic Noir*

### 2.1 Conceito

**Forensic Noir** é a direção visual do PhishGuard v2. O conceito parte de uma observação: a UI de ferramentas SOC parece SOC porque foi feita para *analistas SOC*. Mas o comprador do PhishGuard não é um analista SOC — é um gestor de segurança, um CISO, um diretor de TI, um gerente de compliance. O produto é consumido em reunião de diretoria, em relatório exportado para o board, em tela compartilhada no Teams. A linguagem visual precisa refletir isso: **séria, editorial, densa de informação quando necessário, sóbria em decoração.**

Referências concretas (não clichês):
- **The Financial Times** (tipografia editorial, uso de cor como pontuação)
- **Bloomberg Terminal, mas refinado** (densidade informacional legítima)
- **Linear** (disciplina de espaçamento, precisão do espaçamento, shortcuts)
- **Proofpoint Enterprise** (credibilidade institucional)
- **Are.na** (contraste editorial, composições assimétricas)

Anti-referências (o que não queremos):
- Interfaces "hacker green terminal" de filme dos anos 90
- Paletas saturadas de roxo/ciano que dominam AI SaaS
- Gradientes neon "cyberpunk" — já foi
- Glass morphism indistinto

### 2.2 Paleta de cor — dois modos

A paleta v2 é **bi-modal** (light + dark), com dark como default mas light como first-class citizen (muitos relatórios são lidos impressos, e a reunião de board às vezes é em sala clara com projetor). Cor de acento não é verde — é um **âmbar arqueológico** (`#D97757`), que é distintivo, elegante, e *não* é usado por concorrentes em cibersegurança. Mantemos vermelho e verde apenas para semântica funcional (phishing capturado, report correto), nunca como acento decorativo.

```css
/* =========================================================
   PhishGuard v2 — Design Tokens
   Filosofia: cor é pontuação, não decoração.
   ========================================================= */

/* ---------- MODO ESCURO (default) ---------- */
:root[data-theme='dark'] {
  /* Superfícies — gradação sutil, não preto puro */
  --surface-0:  #0B0C0E;   /* canvas absoluto */
  --surface-1:  #121317;   /* superfície primária (cards) */
  --surface-2:  #191B21;   /* superfície elevada (modais) */
  --surface-3:  #22252D;   /* superfície interativa (hover) */
  --surface-inset: #08090B; /* áreas rebaixadas (inputs) */

  /* Texto — gradação de 4 níveis, nunca branco puro */
  --text-primary:   #ECE8E1;  /* quase-branco quente, menos cansativo */
  --text-secondary: #B5B0A6;
  --text-tertiary:  #726E64;
  --text-quaternary:#45433E;

  /* Bordas — gradação semântica */
  --border-subtle: rgba(236, 232, 225, 0.06);
  --border-default:rgba(236, 232, 225, 0.10);
  --border-strong: rgba(236, 232, 225, 0.18);
  --border-focus:  rgba(217, 119, 87, 0.60);

  /* Acento primário — âmbar arqueológico */
  --accent:        #D97757;
  --accent-hover:  #E08B6F;
  --accent-pressed:#C26547;
  --accent-subtle: rgba(217, 119, 87, 0.12);
  --accent-ghost:  rgba(217, 119, 87, 0.04);
  --on-accent:     #0B0C0E;    /* texto sobre acento */

  /* Semântica — funcionais, nunca decorativos */
  --success:       #6B9B6F;    /* verde musgo, não neon */
  --success-subtle:rgba(107, 155, 111, 0.12);
  --danger:        #C6575F;    /* vermelho tijolo, não cereja */
  --danger-subtle: rgba(198, 87, 95, 0.12);
  --warning:       #D4A056;    /* mostarda, não amarelo-taxi */
  --warning-subtle:rgba(212, 160, 86, 0.12);
  --info:          #7A95B8;    /* azul acinzentado */
  --info-subtle:   rgba(122, 149, 184, 0.12);

  /* Sombras — construídas em camadas, nunca uma sombra só */
  --shadow-sm:
    0 1px 2px rgba(0, 0, 0, 0.40);
  --shadow-md:
    0 2px 4px rgba(0, 0, 0, 0.30),
    0 8px 16px rgba(0, 0, 0, 0.40);
  --shadow-lg:
    0 4px 8px rgba(0, 0, 0, 0.30),
    0 16px 32px rgba(0, 0, 0, 0.50);
  --shadow-focus:
    0 0 0 2px var(--surface-0),
    0 0 0 4px var(--border-focus);
}

/* ---------- MODO CLARO ---------- */
:root[data-theme='light'] {
  --surface-0:  #F7F5F0;   /* creme, nunca branco puro */
  --surface-1:  #FFFFFF;
  --surface-2:  #FDFCF9;
  --surface-3:  #F0EDE5;
  --surface-inset: #EDEAE2;

  --text-primary:   #17181A;
  --text-secondary: #5A5C62;
  --text-tertiary:  #8A8C93;
  --text-quaternary:#B8BAC0;

  --border-subtle: rgba(23, 24, 26, 0.06);
  --border-default:rgba(23, 24, 26, 0.10);
  --border-strong: rgba(23, 24, 26, 0.18);
  --border-focus:  rgba(179, 86, 58, 0.60);

  --accent:        #B3563A;  /* mesma cor, tom adaptado para light */
  --accent-hover:  #A04A30;
  --accent-pressed:#8C4029;
  --accent-subtle: rgba(179, 86, 58, 0.08);
  --accent-ghost:  rgba(179, 86, 58, 0.03);
  --on-accent:     #FFFFFF;

  --success:       #4F7553;
  --success-subtle:rgba(79, 117, 83, 0.08);
  --danger:        #A8424A;
  --danger-subtle: rgba(168, 66, 74, 0.08);
  --warning:       #A37938;
  --warning-subtle:rgba(163, 121, 56, 0.08);
  --info:          #5A7A9B;
  --info-subtle:   rgba(90, 122, 155, 0.08);

  --shadow-sm:
    0 1px 2px rgba(23, 24, 26, 0.06);
  --shadow-md:
    0 1px 2px rgba(23, 24, 26, 0.04),
    0 4px 12px rgba(23, 24, 26, 0.06);
  --shadow-lg:
    0 2px 4px rgba(23, 24, 26, 0.04),
    0 12px 24px rgba(23, 24, 26, 0.08);
  --shadow-focus:
    0 0 0 2px var(--surface-0),
    0 0 0 4px var(--border-focus);
}
```

**Princípio de uso da cor:** a regra 60-30-10 invertida. 70% da tela é superfície neutra, 25% é texto primário, 5% é cor semântica. O acento (`--accent`) aparece em no máximo **um lugar por viewport** — o CTA principal, ou o número que define a tela. Se aparece em dois lugares, um dos dois está errado. Isso é o oposto do que o v1 fazia (verde em tudo).

### 2.3 Tipografia

Substituo a combinação genérica Syne + DM Sans pela seguinte escolha, mais distintiva e coerente com *Forensic Noir*:

```css
/* Display — Fraunces (serifa variável, personalidade editorial) */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,500;9..144,600;9..144,700&display=swap');

/* Corpo — Söhne substituída pela open-source Geist (mais neutra, legível, menos clichê que Inter) */
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');

/* Mono — JetBrains Mono permanece (padrão de mercado decente) */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --font-display: 'Fraunces', 'Times New Roman', serif;
  --font-body:    'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, 'Courier New', monospace;

  /* Escala modular — proporção áurea reduzida (1.25) */
  --text-3xs:   10px;  /* metadata, timestamps */
  --text-2xs:   11px;
  --text-xs:    12px;
  --text-sm:    13px;
  --text-base:  14px;  /* corpo padrão — menor que v1, mais densidade */
  --text-md:    16px;
  --text-lg:    18px;
  --text-xl:    22px;
  --text-2xl:   28px;
  --text-3xl:   36px;
  --text-4xl:   48px;
  --text-5xl:   64px;
  --text-6xl:   80px;  /* hero only */

  /* Alturas de linha calibradas por tamanho */
  --leading-tight:   1.1;   /* display e números */
  --leading-snug:    1.25;  /* títulos */
  --leading-normal:  1.5;   /* corpo */
  --leading-relaxed: 1.7;   /* texto longo editorial */

  /* Tracking */
  --tracking-tight:   -0.03em;
  --tracking-normal:  0;
  --tracking-wide:    0.04em;
  --tracking-widest:  0.12em;  /* labels uppercase */
}
```

**Por quê Fraunces.** É uma serifa variável moderna com eixo `SOFT` e `WONK` (quirks tipográficos intencionais). Dá à marca uma voz editorial séria, com personalidade — algo que nenhum concorrente direto está fazendo. Usada em títulos grandes, números de métrica e em marca. Nunca em corpo de texto nem em UI.

**Por quê Geist.** Sans-serif open-source da Vercel, desenhada por Basement Studio. Tem variante mono harmônica, é gratuita, está em trajetória de padrão moderno sem ser Inter. Substitui DM Sans por ser mais neutra e melhor otimizada para UI densa.

**Regra de uso tipográfica.** Fraunces *somente* para: H1 de páginas, números de métrica grandes (>= 36px), wordmark da marca, citações editoriais. Todo o resto é Geist. Nunca use Fraunces em botões, labels, inputs, badges, ou texto abaixo de 22px.

### 2.4 Grade, espaçamento e geometria

```css
:root {
  /* Espaçamento — escala 4px base com passos semânticos */
  --space-0:  0;
  --space-1:  2px;
  --space-2:  4px;
  --space-3:  6px;
  --space-4:  8px;
  --space-5:  12px;
  --space-6:  16px;
  --space-7:  20px;
  --space-8:  24px;
  --space-9:  32px;
  --space-10: 40px;
  --space-11: 48px;
  --space-12: 64px;
  --space-13: 80px;
  --space-14: 96px;
  --space-15: 128px;

  /* Raios — mais conservadores que v1, mais editoriais */
  --radius-none: 0;
  --radius-xs:   2px;   /* inputs internos, chips */
  --radius-sm:   4px;   /* inputs, botões secundários */
  --radius-md:   6px;   /* botões primários, cards pequenos */
  --radius-lg:   10px;  /* cards principais, modais */
  --radius-xl:   16px;  /* hero cards, previews */
  --radius-full: 9999px;

  /* Container — não fullbleed por padrão, conteúdo respira */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl:1440px;   /* admin dashboard cap */
  --container-prose: 680px; /* texto longo editorial */
}
```

**Princípio geométrico.** Raios pequenos (4-10px) são mais editoriais e sérios que os 12-20px do v1. O produto não é um app de consumer — é uma ferramenta enterprise. Cards precisam parecer documentos, não bolhas.

### 2.5 Texturas e atmosfera

Em vez do "grid pattern + scanline + glow verde" do v1 (que vira visual ruído), o v2 usa três técnicas atmosféricas mais sutis:

**Grain overlay.** Ruído SVG muito sutil (opacidade 3-5%) aplicado globalmente ao `body`. Dá à interface uma qualidade analógica, editorial, "impressa". Isso é o detalhe que diferencia design refinado de design genérico.

```css
.grain-overlay::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.035;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
```

**Vinhetas radiais contextuais.** Fundo do dashboard não é sólido — é uma superfície com uma vinheta radial de `--accent-ghost` no topo direito, quase imperceptível, que dá profundidade sem chamar atenção.

**Marcações tipográficas como textura.** Em áreas vazias (empty states, tela de login), use Fraunces gigante em opacidade muito baixa (2-4%) como elemento de composição — números, palavras-chave ("phishguard", "risco", "2026") criam atmosfera sem imagem.

---

## Parte III — Arquitetura da Jornada Pedagógica

Esta é a seção mais crítica do blueprint. O produto inteiro gira em torno da jornada de aprendizagem, e ela precisa ser modelada com rigor.

### 3.1 Princípio central: aprendizagem é condicional ao comportamento

O erro mais comum em plataformas anti-phishing é tratar treinamento como conteúdo *a priori* — "todo mundo assiste os mesmos módulos". O PhishGuard v2 inverte isso: **o conteúdo é consequência do comportamento observado na simulação**. Quem não clicou recebe reforço leve. Quem clicou recebe intervenção. Quem clicou e digitou credenciais recebe intervenção completa com avaliação bloqueante.

Isso está ancorado em teoria pedagógica — especificamente Kirkpatrick (4 níveis: reação → aprendizagem → comportamento → resultados) e no modelo de Just-in-Time Training (Shapiro). A intervenção tem 10x mais retenção quando acontece *no momento do erro* do que quando acontece em calendário fixo.

### 3.2 Os três tiers da jornada

**Tier 1 — Campanha Básica (Exposição controlada).**
Objetivo: medir taxa de clique e entregar micro-aprendizagem leve. O colaborador recebe e-mail simulado, clica, e cai numa landing de 30-60 segundos com animação explicativa, sem quiz, sem bloqueio. A ideia é normalizar o reporte e criar consciência sem punir.

Gatilho: campanhas rotineiras mensais/trimestrais. Indicada para a base geral.

Fluxo:
```
Envio → Abertura → Clique → Landing educativa (60s) → Fim
                 → Report correto → Agradecimento + micro-elogio → Fim
                 → Não-clique → Zero intervenção (correto é não clicar)
```

**Tier 2 — Campanha Intermediária (Intervenção dirigida).**
Objetivo: intervir com quem clicou em simulação recente, com cenário um pouco mais verossímil. Se o colaborador clicar de novo, é levado a um módulo de 5-8 minutos: vídeo curto + conteúdo explicativo + quiz simples (5 questões, 3 tentativas).

Gatilho: usuário clicou em campanha Tier 1 nos últimos 90 dias, OU empresa está em setor regulado (bancário, jurídico, saúde).

Fluxo:
```
Envio → Clique → Landing "Você foi pescado" →
  → Vídeo (3-4 min) → Artigo interativo (2-3 min) →
  → Quiz (5 questões, banco rotativo) →
  → Aprovado (≥80%): certificado digital + fim →
  → Reprovado (<80%): revisa + tenta de novo (máx 3x) →
  → 3 reprovações: acionamento do gestor direto
```

**Tier 3 — Campanha Avançada (Intervenção completa com credenciais).**
Objetivo: usado quando o colaborador não apenas clicou mas *digitou credenciais simuladas*. Este é o sinal mais grave — significa que em um ataque real o atacante teria sessão ativa. Demanda intervenção máxima.

Gatilho: clique + envio de formulário de credenciais na landing falsa. Ou: reincidência em campanhas Tier 2. Ou: enquadramento administrativo por área de alto risco (financeiro, TI, executivos).

Fluxo:
```
Clique → Digitar credenciais (fake form) →
  → Tela imediata: "Suas credenciais NÃO foram enviadas.
     Mas em um ataque real elas já estariam com o invasor." →
  → Trilha obrigatória de 20-30 min:
    ├── Vídeo 1: anatomia do ataque (5 min)
    ├── Vídeo 2: impacto de credencial comprometida (4 min)
    ├── Artigo: como o atacante usa credenciais roubadas (5 min)
    ├── Simulação interativa: identificar sinais no e-mail original (5 min)
    ├── Avaliação final (10 questões, banco rotativo, modo anti-IA ativado)
    └── Se aprovado: certificado + redução de risk score
       Se reprovado: nova tentativa após 24h + notificação ao gestor + RH
```

### 3.3 Máquina de estados do usuário

Cada colaborador tem um `risk_score` dinâmico (0-100) e um estado na jornada. A transição entre estados é governada por eventos.

```
ESTADOS:
  pristino          → nunca foi alvo de campanha
  monitorado        → recebeu campanha, não interagiu (estado saudável)
  alertado          → abriu e-mail mas não clicou
  comprometido-L1   → clicou
  comprometido-L2   → clicou + digitou credenciais
  em-treinamento    → foi designado para trilha mas ainda não concluiu
  certificado       → completou trilha com aprovação
  reincidente       → caiu 2+ vezes em campanhas do mesmo tipo
  crítico           → reincidente em Tier 3, precisa de intervenção humana

EVENTOS PRIMÁRIOS:
  campaign.sent     → entrou em campanha
  email.opened      → pixel de tracking ativou
  link.clicked      → clicou no link de phishing
  credentials.submitted → enviou formulário falso
  email.reported    → clicou em "reportar phishing" no Outlook/Gmail
  training.started  → abriu módulo de treinamento
  training.completed → concluiu módulo
  quiz.passed       → aprovado em avaliação
  quiz.failed       → reprovado (usa tentativa)

REGRAS DE TRANSIÇÃO (ilustrativas):
  pristino + campaign.sent → monitorado
  monitorado + email.opened → alertado
  alertado + link.clicked → comprometido-L1 + trigger_tier_2_training
  comprometido-L1 + credentials.submitted → comprometido-L2 + trigger_tier_3_training
  em-treinamento + quiz.passed → certificado + risk_score -= 15
  certificado + link.clicked (nova campanha) → reincidente + escalate_notification
```

Essa máquina de estados vive no Postgres (tabela `user_journey_states`) com audit log completo de cada transição. O frontend consulta o estado atual e renderiza a UI apropriada — por exemplo, no portal do colaborador, se ele está em `em-treinamento`, a tela de login já redireciona para a trilha pendente.

### 3.4 Landing "Você foi pescado" — design comportamental

Esta página é o momento pedagógico mais crítico. O usuário está numa mistura de emoções: curiosidade (clicou esperando algo), surpresa (entendeu que foi pego), possivelmente vergonha (especialmente se digitou credenciais). O design tem que fazer três coisas simultaneamente:

1. **Despertar, não humilhar.** Tom é "isto aconteceu com você, é normal, vamos aprender juntos". Nunca "você errou, você é o elo fraco". Palavras como "falha" e "erro" devem ser substituídas por "oportunidade de aprender" e "sinal".

2. **Ensinar no momento do impacto.** Mostrar na tela o e-mail que a pessoa clicou, com anotações em tempo real apontando os sinais que ela poderia ter percebido (remetente ligeiramente errado, urgência artificial, domínio suspeito). Isso aproveita o estado emocional amplificado para fixar o aprendizado.

3. **Transformar vergonha em agência.** Oferecer imediatamente um caminho de reparo — "faça este treinamento de 8 minutos e seu score volta ao normal". Isso devolve controle ao usuário.

Layout da página (revisado do v1):

```
[Full bleed, modo escuro fixado, grain overlay]

NAVBAR MINIMALISTA — só o logo (sem menu, sem links, para não distrair)

HERO (60vh, centralizado)
Ícone grande em SVG: uma agulha de bússola apontando para "atenção" —
não um anzol caricato. Animação: entrada com leve tremor (0.8s) e repouso.

H1 (Fraunces, 48-56px):
"Isso foi uma simulação.
Poderia ter sido real."

Sub (Geist, 17px, secondary):
"Há 2 minutos você clicou em um link que, em um ataque verdadeiro,
teria sido o primeiro passo de um comprometimento."

[Timer sutil: "você passou 2 min 14s expondo-se" — humaniza a urgência]

SEÇÃO "O EMAIL QUE VOCÊ RECEBEU" (100vh)
Reprodução fiel do e-mail a ocupar 2/3 da tela à direita.
À esquerda, lista numerada de 4-6 sinais que ele continha.
Ao clicar em cada sinal, uma anotação aparece sobre a área correspondente
do e-mail (linhas conectoras SVG, como num post-mortem forense).

Exemplos de sinais:
  1. Remetente: rh-banco@bandoitau.com.br   (domínio com erro)
  2. Urgência: "responda em 2 horas ou seu acesso será bloqueado"
  3. Saudação genérica: "Prezado colaborador" (empresa real usa nome)
  4. Link oculto: texto diz "acessar portal" mas URL é outra
  5. Gramática: vírgula antes de "para" + mudança de tom
  6. Assinatura: departamento existe mas cargo não confere

SEÇÃO "O QUE ACONTECERIA EM UM ATAQUE REAL" (80vh)
Timeline horizontal com 5 etapas. Você está no momento 3.
  1. Atacante cria o e-mail (→ já aconteceu)
  2. E-mail chega ao seu Outlook (→ já aconteceu)
  3. Você clica (→ você está aqui)
  4. Credenciais são capturadas (→ teria acontecido em X segundos)
  5. Atacante acessa seu e-mail/Teams/SAP (→ em menos de 1 hora)

Cada etapa com ícone minimalista, tempo estimado, e consequência.

SEÇÃO CTA
Card centralizado, border-accent, padding generoso.
"Seu treinamento obrigatório começa agora."
Info do treinamento: tempo, tópicos, o que você vai aprender.
Botão primário grande: "Iniciar agora (8 minutos)"
Botão secundário: "Agendar para depois" (só disponível se Tier 1)

FOOTER MINIMALISTA
"Você tem dúvidas? Fale com segurança@suaempresa.com"
"PhishGuard · LGPD · esta página é gerada apenas para você · não há tracking de terceiros"
```

**Observação legal.** Esta página deve estar em domínio *separado* da empresa — recomendação: subdomínio do cliente (`aprenda.suaempresa.com.br`) apontando para a aplicação PhishGuard via CNAME. Assim a URL vista pelo colaborador tem a marca da empresa, reforçando autoridade e legitimidade.

### 3.5 Modelagem de dados da jornada

```sql
-- === Trilhas de aprendizagem ===
CREATE TABLE learning_tracks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES companies(id),
  tier         INT NOT NULL CHECK (tier IN (1,2,3)),
  title        TEXT NOT NULL,
  description  TEXT,
  estimated_minutes INT NOT NULL,
  passing_score INT NOT NULL DEFAULT 80,
  max_attempts INT NOT NULL DEFAULT 3,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at  TIMESTAMPTZ
);

-- === Módulos dentro das trilhas ===
CREATE TABLE learning_modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id    UUID NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE,
  position    INT NOT NULL,  -- ordem dentro da trilha
  kind        TEXT NOT NULL CHECK (kind IN ('video','article','interactive','quiz')),
  title       TEXT NOT NULL,
  content     JSONB NOT NULL, -- polimórfico por kind
  duration_seconds INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === Progresso do usuário ===
CREATE TABLE user_track_enrollments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id),
  track_id       UUID NOT NULL REFERENCES learning_tracks(id),
  triggered_by   TEXT NOT NULL, -- 'tier_2_auto', 'admin_manual', 'reincidence'
  triggered_from UUID,          -- referência a campaign_target, se aplicável
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at         TIMESTAMPTZ,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  final_score    INT,
  attempts_used  INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, track_id, assigned_at)
);

-- === Transições de estado do usuário (audit log imutável) ===
CREATE TABLE user_journey_events (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id),
  tenant_id     UUID NOT NULL REFERENCES companies(id),
  event_type    TEXT NOT NULL,
  previous_state TEXT,
  new_state     TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address    INET,
  user_agent    TEXT,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (occurred_at);

-- Particionamento mensal para performance e retenção seletiva
CREATE TABLE user_journey_events_2026_04 PARTITION OF user_journey_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
```

---

## Parte IV — Sistema Anti-IA nas Avaliações

Este é o diferencial técnico mais crítico do produto. A maioria das plataformas anti-phishing hoje tem avaliações triviais para LLMs: "Quais destes são sinais de phishing? a) urgência b) gramática ruim c) ambos". Qualquer colaborador copia para o ChatGPT e acerta.

O PhishGuard v2 resolve isso com **sete camadas combinadas de defesa**. Nenhuma camada isolada é suficiente — a força vem da combinação. Importante: a estratégia *não é* detectar uso de IA com 100% de precisão (isso é impossível), é *tornar o uso de IA mais custoso e menos eficaz do que simplesmente aprender*.

### 4.1 Camada 1 — Questões contextualizadas à empresa

Metade do banco de questões referencia elementos específicos da empresa do usuário: o domínio de e-mail corporativo, o nome do CEO, o departamento do usuário, a cidade da matriz, ferramentas internas. Exemplo:

> "Você recebe um e-mail de `diretoria@{empresa-do-usuario-com-typo}.com.br` dizendo que o `{CEO-real-da-empresa}` precisa que você transfira R$ 47.300 urgentemente. Qual é o sinal MAIS crítico de phishing aqui?"

Um LLM genérico não tem esse contexto. Para resolver, o colaborador precisaria dar ao LLM o nome do CEO, o domínio, etc — o que é por si só trabalho e introduz atrito. E mesmo com esse contexto, a LLM não sabe qual resposta "certa" a plataforma espera, porque...

### 4.2 Camada 2 — Questões com vídeo/imagem interativa como única fonte

Um terço das questões exige observar uma captura de tela de e-mail (imagem) e clicar na *área exata* do sinal de phishing, OU responder uma pergunta que só pode ser respondida vendo um vídeo específico da trilha. Exemplos:

- "Na imagem abaixo, clique na região que contém o indicador mais forte de fraude." (hit detection em coordenadas)
- "No minuto 3:42 do vídeo, o instrutor menciona a 'regra dos 3 segundos'. Qual é a aplicação dela?"

LLMs podem processar imagens (GPT-4V, Claude Vision), mas:
- A resposta não é textual — é uma coordenada (x, y) dentro de uma região
- O vídeo está hospedado com DRM e não tem transcrição pública
- Cada imagem é gerada dinamicamente com variações (o "sinal" muda de posição entre sessões)

### 4.3 Camada 3 — Questões de tempo-real baseadas em telemetria

Algumas questões referenciam o comportamento *do próprio usuário* nas últimas semanas:

> "Na campanha simulada do dia 12/03, você levou 14 segundos do recebimento ao clique. Quando um colaborador responde a um phishing em menos de 30 segundos, isso é um indicador de quê?"

A LLM externa não tem acesso a esse dado. Para usar IA, o colaborador precisaria informar o dado exato — o que é ele dando a resposta à IA ("levei 14 segundos"), algo que ele poderia simplesmente ter usado na resposta direta.

### 4.4 Camada 4 — Banco rotativo com variação semântica

Cada questão do banco tem entre 5 e 12 variantes semânticas (mesmo conceito, redação diferente, alternativas embaralhadas, exemplos substituídos). O usuário pega uma variante aleatória a cada tentativa. Dois colaboradores da mesma empresa respondendo simultaneamente pegam variantes diferentes.

Efeito prático: copiar a questão + alternativas + resposta correta para um grupo de WhatsApp da equipe não funciona — o colega recebe outra variante. Um LLM que foi "treinado" numa sessão anterior com dump de banco não se beneficia.

### 4.5 Camada 5 — Fingerprinting de sessão + detecção de sinais

A página de avaliação monitora:
- Perda de foco da janela (`visibilitychange` API)
- Cópia de texto (`copy` event)
- Colagem de texto em campos (`paste` event)
- Tempo de resposta por questão (resposta em < 3 segundos em pergunta complexa é sinalizada)
- Movimento de mouse inconsistente (jumps diretos de ponto a ponto sem curva humana)
- Dimensões de tela vs. user agent (headless browsers declaram mal)
- Abas abertas (limitado, mas via `Window.focus` tracking)

Nenhum desses sinais *isolado* prova uso de IA. Mas combinados, geram um `integrity_score` por tentativa. Se está baixo, a tentativa é marcada "sob revisão" e o gestor é notificado — não reprovamos automaticamente (evita falso positivo), mas geramos dado.

```typescript
// Exemplo simplificado do monitor client-side
const integritySignals = {
  tab_switches: 0,
  copy_events: 0,
  paste_events: 0,
  suspiciously_fast_answers: 0,
  mouse_path_anomalies: 0,
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) integritySignals.tab_switches++;
});

document.addEventListener('copy', () => integritySignals.copy_events++);

document.addEventListener('paste', (e) => {
  integritySignals.paste_events++;
  if (e.target instanceof HTMLTextAreaElement) {
    const pasted = e.clipboardData?.getData('text') ?? '';
    if (pasted.length > 200) {
      // Sinal forte: paste longo em campo de resposta
      integritySignals.paste_events += 5;
    }
  }
});
```

Tudo isso com aviso explícito e consentimento antes da avaliação: "esta avaliação monitora integridade da sua sessão — se você precisa sair, use o botão pausar" — transparência é obrigatória por LGPD.

### 4.6 Camada 6 — Perguntas abertas com rubrica + avaliação assistida

Em campanhas Tier 3 (as mais críticas), parte da avaliação é dissertativa curta (2-4 perguntas de 200-400 caracteres). Exemplo:

> "Em suas próprias palavras, explique em 3 frases como um atacante usaria as credenciais que você teria entregado, e qual é a primeira ação que você tomaria se percebesse que caiu num ataque real."

Avaliar respostas dissertativas automaticamente é um problema. A solução: enviar a resposta para um LLM próprio (Claude ou GPT via API, controlado pelo PhishGuard) com um *prompt de rubrica* específico da questão, que avalia em 4 critérios fixos (coerência conceitual, uso correto de termos, aplicação prática, autenticidade linguística — se o texto parece LLM-gerado).

Paradoxo aparente: estamos usando LLM para detectar LLM. Funciona porque:
- A rubrica é específica e fechada, não está no prompt do colaborador
- A detecção de LLM-gerado é feita por características linguísticas (perplexidade, uniformidade de sentença, vocabulário não-coloquial em brasileiro), não por "feeling"
- Respostas que parecem LLM são sinalizadas, não reprovadas — gestor revisa

### 4.7 Camada 7 — Presença humana aleatória em casos críticos

Em 5-10% das avaliações Tier 3, a plataforma agenda uma conversa de 5 minutos com o gestor direto, mediada por checklist simples. O gestor pergunta 2-3 perguntas abertas ao colaborador ("me conta com suas palavras o que você aprendeu") e registra uma nota qualitativa.

Isso não é IA-proof por escala, mas reforça a percepção de que a avaliação é levada a sério — o efeito dissuasório é maior do que o efeito detectivo.

### 4.8 Como tudo se combina

Em uma avaliação Tier 2 típica (5 questões), a distribuição é:
- 2 questões contextualizadas à empresa (Camada 1)
- 1 questão com imagem + hit detection (Camada 2)
- 1 questão variante do banco rotativo (Camada 4)
- 1 questão de telemetria pessoal (Camada 3)
- Fingerprinting rodando o tempo todo (Camada 5)

Em uma avaliação Tier 3 (10 questões + 3 dissertativas):
- Todas as camadas 1-5
- 3 perguntas abertas com rubrica LLM (Camada 6)
- Flag aleatória para conversa com gestor (Camada 7)

O resultado é um sistema onde **usar IA é possível mas menos eficiente do que estudar**. Quando o custo cognitivo de "terceirizar para IA" supera o custo de "prestar atenção no conteúdo", o colaborador simplesmente aprende. É esse o objetivo.

### 4.9 Aviso honesto sobre limites

Nenhum sistema torna a avaliação 100% à prova de IA. Três considerações:

- **Screenshot + IA multimodal.** Um colaborador pode tirar foto da tela com celular, passar para GPT-4V. Isso é detectável apenas por mouse/timing anomalies (Camada 5), não por inspeção direta.
- **Câmera desligada.** Adicionar proctoring via webcam é *invasivo* e juridicamente delicado no Brasil (LGPD exige base legal robusta para biometria). Recomendo não fazer no MVP.
- **Cooperação humana.** Dois colaboradores podem se ajudar via outro canal. Banco rotativo mitiga, não elimina.

A mensagem para o comprador do produto deve ser honesta: "o PhishGuard torna as avaliações significativamente mais resistentes a uso de IA que qualquer produto concorrente, mas nenhuma avaliação digital é completamente à prova de trapaça — combinamos controles técnicos com prática cultural e responsabilização humana". Isso é mais crível e defensável que "100% anti-IA".

---

## Parte V — Arquitetura Frontend Moderna (Next.js 15)

### 5.1 Stack revisada

A stack do v1 estava razoável mas desatualizada em alguns pontos críticos. Revisão completa:

```
Core
├── Next.js 15.x (App Router, RSC estável, Server Actions GA)
├── React 19 (use, useOptimistic, Actions nativas)
├── TypeScript 5.5+ (strict mode, noUncheckedIndexedAccess)
└── Node.js 22 LTS

Styling & UI
├── Tailwind CSS 4.x (CSS-first config, @theme nativo)
├── shadcn/ui (customizado pesadamente — ver seção 5.3)
├── Radix UI (primitivas acessíveis por baixo do shadcn)
├── next-themes (toggle dark/light)
└── class-variance-authority + tailwind-merge (variantes de componente)

Data & Forms
├── @tanstack/react-query v5 (cache client-side, hidratação RSC)
├── react-hook-form + zod (validação unificada client/server)
├── @supabase/ssr (auth helpers Next 15)
└── drizzle-orm (opcional, alternativa tipada ao Prisma — ver nota abaixo)

Dataviz
├── visx (low-level, mais flexível e mais leve que Recharts)
├── d3-scale, d3-shape (escalas e formas)
└── nivo apenas se precisar de algo pronto específico

Animação
├── motion (ex-Framer Motion) para React
├── tailwindcss-animate para utilitárias
└── CSS View Transitions API onde suportado (Chrome/Edge)

Observabilidade & Segurança
├── Sentry (frontend + edge functions)
├── PostHog (analytics de produto, feature flags, experimentos)
├── Arcjet ou Cloudflare Turnstile (proteção de endpoints públicos)
└── Cloudflare WAF + Rate Limiting Rules

Email
├── React Email (componentes de e-mail em React)
├── Resend (transacional oficial — notificações do sistema)
└── SMTP próprio por tenant para simulações de phishing
    (NUNCA usar Resend para enviar phishing — queima o domínio;
     precisa de domínios de isca gerenciados por cliente)

Conteúdo (LMS)
├── Mux Video (hospedagem de vídeos educativos com DRM + transcrição)
├── mdx-remote (artigos interativos renderizados server-side)
└── Uploadthing (upload simples de assets de template)

Testing
├── Vitest (unit + integration)
├── Playwright (e2e + visual regression)
└── Storybook 8 (catálogo visual de componentes)
```

**Nota sobre Prisma vs Drizzle.** O v1 apontava Prisma. Para Next.js 15 em Cloudflare Pages (Edge Runtime), Prisma tem atrito operacional — o Edge runtime não roda Prisma sem a camada Accelerate/Data Proxy paga. Drizzle funciona nativo no Edge, tem tipagem melhor, e integra com postgres-js. **Recomendação:** Drizzle. Isso é uma mudança em relação ao v1 e precisa ser uma decisão consciente sua — me avise se preferir manter Prisma, pesando o custo.

### 5.2 Estrutura de pastas completa

```
phishguard/
│
├── app/
│   ├── layout.tsx                   ← root layout com providers, fonts, theme
│   ├── globals.css                  ← tailwind + tokens css
│   ├── not-found.tsx                ← 404 editorial
│   ├── error.tsx                    ← fallback boundary
│   │
│   ├── (marketing)/                 ← landing e páginas institucionais
│   │   ├── layout.tsx               ← nav + footer marketing
│   │   ├── page.tsx                 ← home
│   │   ├── pricing/page.tsx
│   │   ├── sobre/page.tsx
│   │   ├── seguranca/page.tsx       ← página de segurança/compliance
│   │   └── lgpd/page.tsx
│   │
│   ├── (auth)/
│   │   ├── layout.tsx               ← layout centralizado com grain overlay
│   │   ├── login/page.tsx
│   │   ├── cadastro/page.tsx
│   │   ├── esqueci-senha/page.tsx
│   │   ├── trocar-senha/page.tsx
│   │   └── verificar-email/page.tsx
│   │
│   ├── (app)/                       ← aplicação autenticada (admin/gestor)
│   │   ├── layout.tsx               ← shell (sidebar + topbar)
│   │   ├── loading.tsx              ← skeleton do shell
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── _components/        ← colocação (colocation) de componentes locais
│   │   ├── campanhas/
│   │   │   ├── page.tsx             ← lista
│   │   │   ├── nova/
│   │   │   │   ├── page.tsx         ← wizard (RSC + client forms)
│   │   │   │   └── _steps/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── targets/page.tsx
│   │   │   │   └── relatorio/page.tsx
│   │   │   └── _components/
│   │   ├── treinamento/
│   │   │   ├── page.tsx
│   │   │   ├── trilhas/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── biblioteca/page.tsx
│   │   ├── usuarios/
│   │   │   ├── page.tsx
│   │   │   ├── importar/page.tsx    ← CSV/AD sync
│   │   │   ├── [id]/page.tsx
│   │   │   └── grupos/page.tsx
│   │   ├── relatorios/
│   │   │   ├── page.tsx
│   │   │   └── [tipo]/page.tsx
│   │   ├── templates/
│   │   │   ├── page.tsx
│   │   │   ├── editor/[id]/page.tsx ← editor visual de templates
│   │   │   └── galeria/page.tsx
│   │   ├── configuracoes/
│   │   │   ├── page.tsx
│   │   │   ├── dominios/page.tsx    ← gestão de domínios de isca + DNS
│   │   │   ├── sso/page.tsx
│   │   │   ├── integracao/page.tsx
│   │   │   └── faturamento/page.tsx
│   │   └── auditoria/page.tsx       ← logs LGPD-compliant
│   │
│   ├── (learner)/                   ← portal do colaborador (layout próprio)
│   │   ├── layout.tsx               ← layout mais leve, menos chrome
│   │   ├── inicio/page.tsx          ← score pessoal + ações pendentes
│   │   ├── trilhas/[id]/
│   │   │   ├── page.tsx             ← overview da trilha
│   │   │   ├── modulo/[moduleId]/page.tsx
│   │   │   └── avaliacao/page.tsx   ← avaliação isolada
│   │   └── certificados/page.tsx
│   │
│   ├── pescado/                     ← landing "você foi pescado" (sem shell)
│   │   └── [campaignTargetId]/
│   │       ├── page.tsx             ← renderização server-side com token
│   │       └── credenciais/page.tsx ← para Tier 3
│   │
│   └── api/                         ← Route Handlers (uso limitado)
│       ├── webhooks/
│       │   ├── stripe/route.ts
│       │   ├── mux/route.ts
│       │   └── resend/route.ts
│       ├── tracking/
│       │   ├── open/[id]/route.ts   ← pixel 1x1 de abertura
│       │   ├── click/[id]/route.ts  ← redirect + registro
│       │   └── report/[id]/route.ts ← report legítimo
│       └── public/
│           ├── og/route.tsx         ← OG image dinâmica
│           └── health/route.ts
│
├── components/
│   ├── ui/                          ← shadcn customizado (button, card, dialog...)
│   ├── forms/                       ← componentes de formulário de alto nível
│   ├── data-viz/                    ← charts (RiskRing, CampaignFunnel, etc)
│   ├── navigation/                  ← Sidebar, Topbar, Breadcrumbs, CommandK
│   ├── layouts/                     ← AppShell, LearnerShell, AuthShell
│   ├── domain/                      ← componentes de domínio (CampaignCard, RiskBadge...)
│   ├── feedback/                    ← Toasts, EmptyStates, ErrorBoundary
│   └── marketing/                   ← hero, feature grid, testimonials
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                ← browser client
│   │   ├── server.ts                ← server component client
│   │   ├── middleware.ts            ← refresh de sessão
│   │   └── admin.ts                 ← service role (apenas server actions admin)
│   ├── db/
│   │   ├── schema.ts                ← drizzle schema
│   │   ├── queries/                 ← queries tipadas reutilizáveis
│   │   └── migrations/
│   ├── auth/
│   │   ├── session.ts
│   │   ├── rbac.ts                  ← controle de acesso baseado em papel
│   │   └── audit.ts                 ← log imutável de ações
│   ├── campaigns/
│   │   ├── scheduler.ts             ← agendamento de envios
│   │   ├── targeting.ts             ← seleção de alvos
│   │   └── tracking.ts              ← eventos de abertura/clique/report
│   ├── learning/
│   │   ├── state-machine.ts         ← transições de estado do usuário
│   │   ├── tier-selector.ts         ← decide tier da intervenção
│   │   └── integrity/
│   │       ├── signals.ts           ← Camada 5 (monitores)
│   │       ├── rubric-grader.ts     ← Camada 6 (LLM rubric)
│   │       └── question-rotator.ts  ← Camada 4 (banco rotativo)
│   ├── email/
│   │   ├── phishing-sender.ts       ← envio via SMTP próprio
│   │   ├── transactional.ts         ← Resend
│   │   └── templates/               ← React Email components
│   ├── i18n/
│   │   ├── config.ts                ← pt-BR default, EN, ES
│   │   └── dictionaries/
│   ├── feature-flags/
│   │   └── index.ts                 ← wrapper PostHog
│   ├── validations/                 ← schemas zod compartilhados
│   ├── constants/
│   └── utils/
│       ├── cn.ts
│       ├── format.ts                ← formatadores pt-BR (datas, moedas, números)
│       └── telemetry.ts
│
├── hooks/
│   ├── use-company.ts
│   ├── use-user-session.ts
│   ├── use-realtime.ts              ← wrapper Supabase Realtime
│   ├── use-risk-score.ts
│   └── use-integrity-monitor.ts     ← Camada 5
│
├── types/
│   ├── database.ts                  ← gerado pelo supabase CLI
│   ├── domain.ts                    ← tipos de domínio (Campaign, User, etc)
│   └── env.ts                       ← zod schema de env vars
│
├── public/
│   ├── fonts/                       ← fraunces + geist self-hosted
│   ├── images/
│   └── assets/
│
├── tests/
│   ├── e2e/                         ← playwright
│   ├── visual/                      ← playwright visual regression
│   └── integration/
│
├── stories/                         ← storybook
│
├── drizzle.config.ts
├── tailwind.config.ts               ← apenas safelist + plugins (resto em CSS)
├── next.config.mjs
├── tsconfig.json
├── middleware.ts                    ← auth middleware + rate limit
└── .env.example
```

### 5.3 Tailwind CSS 4 — configuração CSS-first

Tailwind 4 mudou para configuração em CSS via `@theme`. Isso se integra perfeitamente com os tokens do Design System. Substitui o `tailwind.config.js` do v1.

```css
/* app/globals.css */
@import 'tailwindcss';

@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,400..700,0..100&family=Geist:wght@300..700&family=JetBrains+Mono:wght@400;500;600&display=swap');

@theme {
  /* superfícies */
  --color-surface-0: #0B0C0E;
  --color-surface-1: #121317;
  --color-surface-2: #191B21;
  --color-surface-3: #22252D;

  /* texto */
  --color-fg-primary: #ECE8E1;
  --color-fg-secondary: #B5B0A6;
  --color-fg-tertiary: #726E64;
  --color-fg-quaternary: #45433E;

  /* acento */
  --color-accent: #D97757;
  --color-accent-hover: #E08B6F;
  --color-accent-pressed: #C26547;
  --color-accent-subtle: rgba(217, 119, 87, 0.12);

  /* semânticas */
  --color-success: #6B9B6F;
  --color-danger: #C6575F;
  --color-warning: #D4A056;
  --color-info: #7A95B8;

  /* fontes */
  --font-display: 'Fraunces', serif;
  --font-body: 'Geist', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* raios */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-xl: 16px;

  /* easings */
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* tema claro — override via seletor */
[data-theme='light'] {
  --color-surface-0: #F7F5F0;
  --color-surface-1: #FFFFFF;
  --color-surface-2: #FDFCF9;
  --color-surface-3: #F0EDE5;
  --color-fg-primary: #17181A;
  --color-fg-secondary: #5A5C62;
  --color-fg-tertiary: #8A8C93;
  --color-fg-quaternary: #B8BAC0;
  --color-accent: #B3563A;
  --color-accent-hover: #A04A30;
  --color-accent-pressed: #8C4029;
  --color-accent-subtle: rgba(179, 86, 58, 0.08);
}

html, body { background: var(--color-surface-0); color: var(--color-fg-primary); }

body {
  font-family: var(--font-body);
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Classe utilitária para texto editorial em display font */
.font-display {
  font-family: var(--font-display);
  font-variation-settings: 'opsz' 144, 'SOFT' 50;
  letter-spacing: -0.02em;
}

/* Grain overlay global */
.grain::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  opacity: 0.035;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}

/* Scroll estilizado */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--color-surface-3);
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-surface-0);
}
::-webkit-scrollbar-thumb:hover { background: var(--color-fg-quaternary); }

/* Seleção */
::selection { background: var(--color-accent-subtle); color: var(--color-fg-primary); }

/* Foco visível padronizado */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 5.4 Componentes-chave: exemplos de código

Vou mostrar quatro componentes-chave implementados com o novo design system. Estes servem como *padrão de referência* para todos os outros.

#### RiskRing — anel de score de risco

```tsx
// components/data-viz/risk-ring.tsx
'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

type RiskRingProps = {
  value: number;           // 0-100
  size?: number;           // px
  strokeWidth?: number;
  label?: string;
  delta?: number;          // variação vs período anterior
  className?: string;
};

export function RiskRing({
  value,
  size = 180,
  strokeWidth = 10,
  label = 'Risco Geral',
  delta,
  className,
}: RiskRingProps) {
  const reduced = useReducedMotion();
  const [animatedValue, setAnimatedValue] = useState(reduced ? value : 0);

  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  // Cor semântica
  const tone =
    clamped < 20 ? 'var(--color-success)' :
    clamped < 40 ? 'var(--color-warning)' :
    'var(--color-danger)';

  const toneLabel =
    clamped < 20 ? 'Baixo' :
    clamped < 40 ? 'Moderado' :
    clamped < 70 ? 'Elevado' :
    'Crítico';

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setAnimatedValue(clamped), 50);
    return () => clearTimeout(t);
  }, [clamped, reduced]);

  return (
    <div
      className={`relative inline-flex flex-col items-center ${className ?? ''}`}
      role="img"
      aria-label={`${label}: ${clamped}% (${toneLabel})`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="var(--color-surface-3)"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={tone}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: reduced ? 0 : 1.2,
            ease: [0.19, 1, 0.22, 1],
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl tabular-nums tracking-tight text-[var(--color-fg-primary)]">
          {Math.round(animatedValue)}
          <span className="text-2xl text-[var(--color-fg-tertiary)]">%</span>
        </span>
        <span className="mt-1 text-xs uppercase tracking-widest text-[var(--color-fg-tertiary)]">
          {toneLabel}
        </span>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs uppercase tracking-widest text-[var(--color-fg-tertiary)]">
          {label}
        </p>
        {delta !== undefined && (
          <p
            className={`mt-1 text-sm tabular-nums ${
              delta < 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
            }`}
          >
            {delta > 0 ? '↑' : '↓'} {Math.abs(delta)} pts vs. mês anterior
          </p>
        )}
      </div>
    </div>
  );
}
```

#### MetricCard

```tsx
// components/data-viz/metric-card.tsx
import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

type Trend = 'positive' | 'negative' | 'neutral';

type MetricCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { value: string; trend: Trend };
  icon?: LucideIcon;
  subtle?: string;
  className?: string;
};

export function MetricCard({ label, value, unit, delta, icon: Icon, subtle, className }: MetricCardProps) {
  return (
    <article
      className={cn(
        'group relative rounded-lg border border-[var(--color-surface-3)]',
        'bg-[var(--color-surface-1)] p-6 transition-colors duration-200',
        'hover:border-[var(--color-accent-subtle)]',
        className,
      )}
    >
      <header className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-widest text-[var(--color-fg-tertiary)]">
          {label}
        </p>
        {Icon && (
          <Icon className="h-4 w-4 text-[var(--color-fg-tertiary)] transition-colors group-hover:text-[var(--color-accent)]" />
        )}
      </header>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-display text-4xl tabular-nums tracking-tight text-[var(--color-fg-primary)]">
          {value}
        </span>
        {unit && (
          <span className="text-lg text-[var(--color-fg-tertiary)]">{unit}</span>
        )}
      </div>

      {delta && (
        <p
          className={cn(
            'mt-3 flex items-center gap-1.5 text-sm tabular-nums',
            delta.trend === 'positive' && 'text-[var(--color-success)]',
            delta.trend === 'negative' && 'text-[var(--color-danger)]',
            delta.trend === 'neutral' && 'text-[var(--color-fg-tertiary)]',
          )}
        >
          <span aria-hidden>
            {delta.trend === 'positive' ? '↑' : delta.trend === 'negative' ? '↓' : '→'}
          </span>
          {delta.value}
        </p>
      )}

      {subtle && (
        <p className="mt-4 border-t border-[var(--color-surface-3)] pt-3 text-xs text-[var(--color-fg-tertiary)]">
          {subtle}
        </p>
      )}
    </article>
  );
}
```

#### Sidebar (AppShell)

```tsx
// components/navigation/app-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Target, GraduationCap, Users,
  BarChart3, FileText, Settings, LifeBuoy, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const sections = [
  {
    label: 'Operação',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Panorama' },
      { href: '/campanhas', icon: Target, label: 'Campanhas', badge: 3 },
      { href: '/treinamento', icon: GraduationCap, label: 'Trilhas' },
      { href: '/usuarios', icon: Users, label: 'Pessoas' },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { href: '/relatorios', icon: BarChart3, label: 'Relatórios' },
      { href: '/auditoria', icon: FileText, label: 'Auditoria' },
      { href: '/inteligencia', icon: ShieldAlert, label: 'Inteligência', tag: 'beta' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/configuracoes', icon: Settings, label: 'Configurações' },
      { href: '/suporte', icon: LifeBuoy, label: 'Suporte' },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-screen w-[260px] flex-col border-r border-[var(--color-surface-3)] bg-[var(--color-surface-1)]"
      aria-label="Navegação principal"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-surface-3)] px-5">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--color-accent)] text-[var(--color-on-accent)]">
          <span className="font-display text-sm font-bold">P</span>
        </div>
        <span className="font-display text-lg tracking-tight text-[var(--color-fg-primary)]">
          phishguard
        </span>
      </div>

      {/* Tenant switcher */}
      <button className="mx-3 mt-3 flex items-center gap-3 rounded-md border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-accent-subtle)]">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[var(--color-surface-3)] font-display text-sm">
          D
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
            Dannemann
          </p>
          <p className="truncate text-xs text-[var(--color-fg-tertiary)]">
            Plano Business · 1.240 usuários
          </p>
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[10px] uppercase tracking-widest text-[var(--color-fg-quaternary)]">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-[var(--color-accent-subtle)] text-[var(--color-fg-primary)]'
                          : 'text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]',
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          active ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]',
                        )}
                      />
                      <span className="flex-1">{item.label}</span>

                      {'badge' in item && item.badge && (
                        <span className="rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[var(--color-fg-secondary)]">
                          {item.badge}
                        </span>
                      )}
                      {'tag' in item && item.tag && (
                        <span className="rounded bg-[var(--color-accent-subtle)] px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-[var(--color-accent)]">
                          {item.tag}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-[var(--color-surface-3)] p-3">
        <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-[var(--color-surface-2)]">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] font-display text-sm text-[var(--color-on-accent)]">
            M
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
              Marlon Vieira
            </p>
            <p className="truncate text-xs text-[var(--color-fg-tertiary)]">
              Administrador
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
}
```

#### CampaignCard

```tsx
// components/domain/campaign-card.tsx
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime, formatPercent } from '@/lib/utils/format';

type CampaignStatus = 'rascunho' | 'agendada' | 'ativa' | 'pausada' | 'concluida';

type Campaign = {
  id: string;
  name: string;
  status: CampaignStatus;
  tier: 1 | 2 | 3;
  scheduledAt: Date;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    submitted: number;
    reported: number;
  };
};

const statusConfig: Record<CampaignStatus, { label: string; dot: string; ring: string }> = {
  rascunho:   { label: 'Rascunho',    dot: 'bg-[var(--color-fg-tertiary)]',      ring: '' },
  agendada:   { label: 'Agendada',    dot: 'bg-[var(--color-warning)]',          ring: '' },
  ativa:      { label: 'Em andamento',dot: 'bg-[var(--color-accent)]',           ring: 'animate-pulse' },
  pausada:    { label: 'Pausada',     dot: 'bg-[var(--color-fg-tertiary)]',      ring: '' },
  concluida:  { label: 'Concluída',   dot: 'bg-[var(--color-success)]',          ring: '' },
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { metrics } = campaign;
  const clickRate = metrics.sent > 0 ? metrics.clicked / metrics.sent : 0;
  const reportRate = metrics.sent > 0 ? metrics.reported / metrics.sent : 0;
  const cfg = statusConfig[campaign.status];

  return (
    <a
      href={`/campanhas/${campaign.id}`}
      className="group block rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-5 transition-colors hover:border-[var(--color-accent-subtle)]"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn('h-1.5 w-1.5 rounded-full', cfg.dot, cfg.ring)}
            />
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-fg-tertiary)]">
              {cfg.label} · Tier {campaign.tier}
            </span>
          </div>
          <h3 className="mt-2 truncate font-display text-lg tracking-tight text-[var(--color-fg-primary)]">
            {campaign.name}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-fg-tertiary)]">
            {formatRelativeTime(campaign.scheduledAt)}
          </p>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-4 gap-3 text-sm">
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-[var(--color-fg-tertiary)]">
            Enviados
          </dt>
          <dd className="mt-1 font-mono tabular-nums text-[var(--color-fg-primary)]">
            {metrics.sent}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-[var(--color-fg-tertiary)]">
            Clicaram
          </dt>
          <dd className="mt-1 font-mono tabular-nums text-[var(--color-danger)]">
            {formatPercent(clickRate)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-[var(--color-fg-tertiary)]">
            Reportaram
          </dt>
          <dd className="mt-1 font-mono tabular-nums text-[var(--color-success)]">
            {formatPercent(reportRate)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-[var(--color-fg-tertiary)]">
            Credenciais
          </dt>
          <dd className="mt-1 font-mono tabular-nums text-[var(--color-fg-primary)]">
            {metrics.submitted}
          </dd>
        </div>
      </dl>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-danger)] transition-all duration-1000 ease-out"
          style={{ width: `${Math.round(clickRate * 100)}%` }}
          aria-hidden
        />
      </div>
    </a>
  );
}
```

### 5.5 Considerações de performance

- **Server Components por padrão.** Toda página começa como RSC. `use client` é decisão deliberada, nunca default.
- **Streaming.** Todas as páginas de listagem usam `<Suspense>` com skeletons por zona. Dashboard carrega score primeiro (hero), depois gráficos, depois tabelas.
- **Imagens.** Apenas `next/image` com AVIF/WebP, dimensões fixas no HTML para evitar CLS.
- **Fontes.** Auto-hospedadas via `next/font/local` com `display: swap`, subset latin-ext apenas. Pré-carrega Fraunces e Geist no `<head>`.
- **Bundle splitting.** Charts (visx + d3) ficam em rota de relatórios e dashboard. Editor de templates (pesado, lazy) em rota própria.
- **Edge Runtime.** Rotas de tracking (`/api/tracking/*`) rodam no Edge (baixa latência global). Rotas com acesso pesado a DB rodam em Node.
- **Cache.** `revalidateTag` para dados de campanha quando ocorre evento; `revalidatePath` para dashboard após ação administrativa.
- **Core Web Vitals alvo:** LCP < 1.8s, INP < 150ms, CLS < 0.05.

---

## Parte VI — Governança Legal (LGPD + CLT)

Esta seção não é opcional. Uma plataforma que simula ataques contra colaboradores e armazena dados de comportamento deles é tratamento de dado pessoal sensível no Brasil. Sem os controles aqui, o produto é inseguro juridicamente.

### 6.1 Base legal para o tratamento

Duas bases legais são aplicáveis, dependendo da natureza do dado:

- **Legítimo interesse do controlador (Art. 7º, IX da LGPD).** Aplicável para: envio de e-mail simulado, registro de abertura/clique, manutenção do risk_score, análise agregada anônima. Requer *teste de legítimo interesse* documentado (TLI — o DPO da empresa cliente precisa preencher).

- **Execução de contrato de trabalho (Art. 7º, VI — obrigação legal/regulatória + cláusulas contratuais).** Aplicável para: treinamento obrigatório, certificação, retenção de log por prazo de compliance setorial (bancário, saúde).

O PhishGuard **não deve operar sob "consentimento"** (Art. 7º, I), porque consentimento trabalhista é frágil — a hipossuficiência do colaborador vicia o consentimento. ANPD já se manifestou nesse sentido.

### 6.2 Aviso de ciência obrigatório

Antes de a primeira campanha ser executada em uma empresa cliente, o produto **bloqueia o envio** até que o admin confirme três coisas, com registro em audit log imutável:

1. A empresa enviou comunicado geral aos colaboradores informando sobre a existência de um programa de conscientização com simulações periódicas (a plataforma disponibiliza modelo editável).
2. O programa consta em política interna aprovada pela liderança (plataforma solicita upload do documento).
3. O DPO da empresa revisou o TLI disponibilizado pelo PhishGuard e anuiu.

Isso não é decoração — é o que diferencia "programa legítimo de segurança" de "perseguição/assédio moral individualizado" sob a ótica da Justiça do Trabalho.

### 6.3 Dados coletados e retenção

Por tipo de dado, a política:

| Dado | Base legal | Retenção | Direito do titular |
|------|-----------|----------|--------------------|
| E-mail corporativo do colaborador | Legítimo interesse | Vínculo ativo + 6 meses | Não excluível enquanto no vínculo |
| Nome + cargo + departamento | Legítimo interesse | Vínculo ativo + 6 meses | Correção via admin |
| Abertura/clique em simulação | Legítimo interesse | 24 meses rolantes | Anonimização após 24 meses |
| Credenciais digitadas em fake form | **Nunca armazenadas em claro** | N/A | Hash único de verificação, descartado em 7 dias |
| Progresso em trilha + score de quiz | Execução de contrato | Vínculo + 5 anos (comprovação de treinamento) | Exportável, não excluível antes do prazo |
| Sinais de integridade (Camada 5) | Legítimo interesse | 90 dias | Revisão mediante solicitação |
| Logs de auditoria do admin | Obrigação legal | 5 anos | Imutável |

**Atenção crítica às credenciais.** Quando o colaborador digita a senha no formulário falso, a senha **nunca** pode ser transmitida para o servidor nem armazenada. O formulário faz hash local (SubtleCrypto SHA-256) apenas para confirmar que *algo* foi digitado, e envia apenas o hash. Isso evita que o próprio produto se torne um vetor de vazamento em caso de comprometimento.

```typescript
// app/pescado/[id]/credenciais/_form.tsx
'use client';

async function submitFakeCredentials(email: string, password: string) {
  // NUNCA transmitir senha em claro
  const encoder = new TextEncoder();
  const data = encoder.encode(`${email}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Só enviamos o hash + confirmação de comprimento mínimo
  await fetch('/api/tracking/submitted', {
    method: 'POST',
    body: JSON.stringify({
      attempt_hash: hashHex,
      password_length: password.length,
      email_matches_corporate: email.endsWith('@empresa.com.br'),
    }),
  });
}
```

### 6.4 Direitos do titular

A plataforma expõe, na área do colaborador (`/portal/privacidade`), interface para exercício dos direitos garantidos pelo Art. 18 da LGPD:

- **Confirmação e acesso.** Ver todos os dados que o PhishGuard tem sobre você, exportáveis em JSON ou PDF.
- **Correção.** Solicitar correção de dados cadastrais (mediante aprovação do admin da empresa).
- **Anonimização/bloqueio.** Após desligamento do colaborador, workflow automático anonimiza dados comportamentais mantendo apenas agregados estatísticos.
- **Portabilidade.** Export completo em formato estruturado.
- **Revisão de decisão automatizada.** Se o colaborador foi flagado por `integrity_score` baixo, tem direito a solicitar revisão humana — admin vê o caso e decide.

### 6.5 Subcontratantes (Art. 39)

Lista pública dos sub-operadores utilizados, por finalidade:

- **Supabase** (PostgreSQL, auth, storage) — dados principais — Frankfurt/eu-central-1
- **Cloudflare** (WAF, CDN, Pages) — roteamento
- **Resend** (e-mail transacional do sistema, nunca phishing) — SES us-east-1
- **Mux** (vídeo educativo) — nenhum PII
- **Sentry** (monitoramento de erros) — dados sanitizados
- **PostHog** (analytics de produto) — auto-hospedado UE

Contrato com cada um deles precisa ter DPA (Data Processing Agreement) vinculado, disponibilizado ao cliente.

### 6.6 Domínios de isca — questão delicada

Este é um ponto operacional crítico que o v1 ignorou completamente. Para as simulações funcionarem, a plataforma precisa enviar e-mails de domínios "suspeitos-mas-verossímeis" (ex: `rh-beneficios-dannemann.com`). Isso envolve:

- **Registro legítimo de domínios** em nome do PhishGuard ou da empresa cliente (nunca typosquatting de terceiros — `itau.com.br` parecido é ilegal).
- **Configuração de SPF/DKIM/DMARC** nesses domínios para entrega.
- **Separação estrita do domínio transacional** — `mail.phishguard.com.br` (notificações do sistema) nunca é o mesmo servidor SMTP que envia os simulados. Isso evita queima de reputação.
- **Reuso controlado.** Um domínio de isca não deve ser usado por mais de 2 campanhas; após isso, provavelmente já foi sinalizado em listas de proteção.
- **Cláusula contratual com o cliente.** O contrato SaaS deixa claro que a empresa cliente autoriza o PhishGuard a operar domínios-isca em seu nome para execução do serviço.

Recomendação: desde o MVP, o PhishGuard deve ter um *pool* gerenciado de 20-30 domínios próprios rotativos (custo: ~R$ 40/ano cada), e oferecer como upsell a possibilidade da empresa registrar domínios dedicados.

---

## Parte VII — Layouts das Páginas Críticas

Vou especificar cinco páginas em detalhe, aplicando toda a direção de design. Estas substituem as seções 5.1-5.6 do v1.

### 7.1 Landing page (/) — versão Forensic Noir

```
Estrutura geral: rolagem vertical longa, narrativa em 6 blocos.
Grain overlay global ativo. Fundo: surface-0 com vinheta radial accent-ghost no topo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 1 — Hero (altura: min(90vh, 780px))
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nav superior (68px, transparent no topo, surface-1 ao scrollar):
  [wordmark "phishguard" em Fraunces]              [Produto · Planos · Segurança · Blog]    [Entrar · Solicitar demo]
                                                                                              (primário com acento)

Layout principal em 12 colunas, desktop:
  ┌ col 1-7 ──────────────────────────────────┐  ┌ col 8-12 ───────────────────┐
  │                                            │  │                              │
  │  eyebrow (mono, uppercase, tracking-wide,  │  │  [visualização do produto]   │
  │   fg-tertiary):                            │  │                              │
  │  SÉRIE B · 500 EMPRESAS · 2M SIMULAÇÕES   │  │  mockup do dashboard         │
  │                                            │  │  flutuando suavemente        │
  │  H1 (Fraunces, 72px, leading-tight,        │  │  com border glow muito sutil │
  │   tracking-tight):                         │  │                              │
  │  "Seus colaboradores                       │  │  mostra: RiskRing (34%),     │
  │   não são o elo fraco.                     │  │  uma linha de campanha       │
  │   Eles nunca foram treinados."             │  │  ativa pulsando,             │
  │                                            │  │  uma métrica em tempo real   │
  │  (a palavra "treinados" em accent color,   │  │                              │
  │   com underline decorativo feito via SVG   │  │                              │
  │   drawing animation — strokeDasharray)    │  │                              │
  │                                            │  │                              │
  │  Sub (Geist, 18px, fg-secondary,          │  │                              │
  │   max-width 520px, leading-relaxed):       │  │                              │
  │  "Plataforma brasileira de conscientização │  │                              │
  │   anti-phishing com jornadas progressivas  │  │                              │
  │   de aprendizagem, avaliações resistentes  │  │                              │
  │   a IA e conformidade LGPD por padrão."    │  │                              │
  │                                            │  │                              │
  │  CTAs:                                     │  │                              │
  │  [Solicitar demonstração →]  [Ver preços]  │  │                              │
  │   (primário ocre)             (secundário  │  │                              │
  │                                ghost)      │  │                              │
  │                                            │  │                              │
  │  Abaixo dos CTAs (tipografia pequena):     │  │                              │
  │  "Trial gratuito de 14 dias · Sem cartão   │  │                              │
  │   · Setup em 45 minutos"                   │  │                              │
  │                                            │  │                              │
  └────────────────────────────────────────────┘  └──────────────────────────────┘

Abaixo do hero, faixa de logos de clientes:
  [cinza escuro, 64px altura, opacity 0.4 nos logos, hover restaura opacity]
  DANNEMANN · OCYAN · BANCO X · EMPRESA Y · CLIENTE Z · [+12 logos]

Animação de entrada do hero (stagger):
  eyebrow → 100ms
  H1 linha 1 → 200ms
  H1 linha 2 → 300ms
  H1 linha 3 → 400ms (com animação do underline começando 600ms depois)
  sub → 500ms
  CTAs → 650ms
  mockup do produto → 700ms com leve fade + translateY(12px)
  logos → 900ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 2 — "O problema" (100vh, fundo surface-1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout: pergunta grande à esquerda, dado reforçando à direita.

  [eyebrow]  O PROBLEMA
  [H2 Fraunces, 54px]
  "Toda empresa com e-mail é atacada.
   Quantas estão prontas?"

  [ao lado direito, grande número]
  "94%"
  [legenda fg-tertiary]
  das brechas de segurança começam em um e-mail
  de phishing humano — Verizon DBIR 2024

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 3 — Como funciona (3 passos em cards)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Grid de 3 colunas, cards com numeração editorial.

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 01               │  │ 02               │  │ 03               │
│ (Fraunces 200px, │  │                  │  │                  │
│ opacity 0.08,    │  │                  │  │                  │
│ fg-primary)      │  │                  │  │                  │
│                  │  │                  │  │                  │
│ [ícone: Target]  │  │ [ícone: Activity]│  │ [ícone: GradCap] │
│                  │  │                  │  │                  │
│ Simule           │  │ Meça             │  │ Ensine           │
│                  │  │                  │  │                  │
│ Campanhas        │  │ Dashboard em     │  │ Trilhas         │
│ realistas com    │  │ tempo real com   │  │ progressivas    │
│ templates        │  │ score de risco   │  │ ativadas pelo   │
│ específicos do   │  │ por colaborador  │  │ comportamento   │
│ setor brasileiro.│  │ e por setor.     │  │ — com avaliação │
│                  │  │                  │  │ anti-IA.        │
└──────────────────┘  └──────────────────┘  └──────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 4 — Prova em números (100vh, fundo surface-0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3 métricas grandes, número Fraunces 120px, counter animado no scroll.
Separadas por linhas verticais finas em border-subtle.

     87%                 500+                   93%
     redução de          empresas               NPS dos
     risco em 90 dias    brasileiras ativas     colaboradores

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 5 — Features editoriais (lista com ilustrações)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Não é grid uniforme — é layout editorial assimétrico.
4 features em linhas alternadas (texto esquerda/direita, imagem direita/esquerda).

FEATURE 1: "Avaliações que IA não resolve"
  Imagem: screenshot da avaliação com Camada 2 ativa (hit detection)
  Texto: explica Camadas 1-7 resumidamente, CTA "Leia o whitepaper técnico →"

FEATURE 2: "Conformidade LGPD por padrão"
  Imagem: painel de privacidade do colaborador
  Texto: base legal explicada, direitos do titular, TLI pré-aprovado

FEATURE 3: "Jornadas que se adaptam"
  Imagem: diagrama da máquina de estados Tier 1 → 2 → 3
  Texto: sobre just-in-time training

FEATURE 4: "Dados seus, infraestrutura brasileira"
  Imagem: mapa sutil com ponto em São Paulo
  Texto: sobre residência de dados no Brasil (Supabase region)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 6 — Planos (preview, link para /pricing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3 cards: Starter / Business / Enterprise.
Business destacado com borda accent e label "mais popular".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 7 — CTA final
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bloco full-width, fundo surface-1, padding 160px vertical.
Tipografia Fraunces 72px centralizada.

  "A próxima vez que um colaborador seu
   receber um e-mail suspeito,
   ele vai saber o que fazer."

  [Solicitar demonstração →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOCO 8 — Footer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Grid minimalista de 4 colunas + wordmark + notice LGPD + ano.
```

### 7.2 Dashboard principal (/dashboard)

```
Layout: 12 colunas, container máximo 1440px, padding 32px.

┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                    │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ Bom dia, Marlon                            [⌘K busca]  [🔔 3]     │  │
│ │ Dannemann · Semana 16 · atualizado há 2 min ●                       │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│ HIERARQUIA PRIMÁRIA: o número que importa                                 │
│ ┌──────────────────────────┐ ┌──────────────────────────────────────┐   │
│ │                          │ │ CONTEXTUALIZAÇÃO DO SCORE             │   │
│ │   RISCO DA EMPRESA       │ │                                       │   │
│ │                          │ │ "Sua empresa está 12 pontos abaixo    │   │
│ │     [RiskRing 180px]     │ │ da média do setor jurídico brasileiro │   │
│ │        34%               │ │ (46%)."                                │   │
│ │      Moderado            │ │                                       │   │
│ │                          │ │ Principais contribuições:             │   │
│ │  ↓ -12 pts vs março      │ │ ├─ 3 colaboradores em Tier 3 pendente │   │
│ │                          │ │ ├─ Taxa de clique aumentou em Vendas  │   │
│ │  [Ver como é calculado]  │ │ └─ 78% da base com certificação vigente│  │
│ │                          │ │                                       │   │
│ └──────────────────────────┘ └──────────────────────────────────────┘   │
│ (col-span 4)                  (col-span 8)                                │
│                                                                           │
│ HIERARQUIA SECUNDÁRIA: ações necessárias agora                            │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │  AÇÕES PENDENTES                                                    │  │
│ │  ────────────────                                                    │  │
│ │  🔴 3 colaboradores em Tier 3 não concluíram o treinamento [Ver]    │  │
│ │  🟡 Campanha "Black Friday RH" precisa de revisão para envio [Abrir]│  │
│ │  🟡 Domínio de isca mail-rh-bradesco.click expira em 12 dias [Renovar]│ │
│ │  ⚪ 8 colaboradores foram desligados — anonimizar dados? [Revisar]  │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│ HIERARQUIA TERCIÁRIA: dados longitudinais                                 │
│ ┌──────────────────────────────────────────────┐ ┌───────────────────┐  │
│ │  EVOLUÇÃO DA TAXA DE CLIQUE                   │ │ ATIVIDADE RECENTE │  │
│ │                                                │ │                    │  │
│ │  [área chart, visx]                            │ │ 14:32 João M.     │  │
│ │  linha sólida em accent                        │ │    clicou em      │  │
│ │  área abaixo em accent-subtle                  │ │    "Suporte TI"   │  │
│ │  pontos destacados quando teve campanha        │ │                    │  │
│ │                                                │ │ 14:28 Ana B.      │  │
│ │  eixo X: últimos 6 meses                       │ │    reportou       │  │
│ │  eixo Y: % click rate                          │ │    phishing ✓    │  │
│ │                                                │ │                    │  │
│ │  tooltip ao hover: valor + campanha naquele dia│ │ [ver todas →]      │  │
│ └──────────────────────────────────────────────┘ └───────────────────┘  │
│ (col-span 8)                                      (col-span 4)            │
│                                                                           │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │  BENCHMARK SETORIAL                                                 │  │
│ │  Sua empresa vs. mediana do setor jurídico brasileiro (n=127)       │  │
│ │                                                                     │  │
│ │  [bar chart horizontal comparativo em 4 métricas]                   │  │
│ │  ● Sua empresa  ○ Mediana do setor                                  │  │
│ │                                                                     │  │
│ │  Taxa de clique     34% ●————— 46% ○   (12 pts melhor)              │  │
│ │  Taxa de reporte    62% ——●——— 48% ○   (14 pts melhor)              │  │
│ │  Certificação       78% ——●——— 71% ○   (7 pts melhor)               │  │
│ │  Reincidência       8%  ●————— 14% ○   (6 pts melhor)               │  │
│ └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

Mobile (< 768px):
- Sidebar → drawer (hamburger menu)
- Todas as rows viram coluna única
- RiskRing ainda aparece grande (centralizado, 160px)
- Tabelas viram cards empilhados
- Charts rolagem horizontal com snap ou substituídos por sparklines
```

### 7.3 Criar campanha (/campanhas/nova) — wizard

```
Layout: wizard full-height, com progress fixo no topo.
Navegação: Avançar/Voltar no rodapé fixo.
Máquina de estado no cliente via useReducer + validação zod por step.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEADER COMPACTO
  [← Voltar]    Nova campanha            [Salvar rascunho]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP INDICATOR (fixed top, surface-1 com border-bottom)
┌─────────────────────────────────────────────────────────────────┐
│  ◉ Configurar   ○ Público   ○ Template   ○ Cronograma   ○ Revisar │
│  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  (barra de progresso accent, passo atual em bold)                │
└─────────────────────────────────────────────────────────────────┘

ÁREA DE CONTEÚDO (max-width 920px, centralizada, padding vertical 48px)

STEP 1 — Configurar
━━━━━━━━━━━━━━━━━

[eyebrow]  PASSO 1 DE 5
[H1 Fraunces 36px] Que campanha você quer executar?
[sub] Essas escolhas definem o nível de intervenção que o
colaborador vai receber quando cair no ataque.

  Nome interno
  ┌──────────────────────────────────────────────┐
  │ Campanha Financeiro · Abril 2026             │
  └──────────────────────────────────────────────┘
  (sugestão automática baseada em padrão + departamento)

  Tier da campanha
  Escolha como a jornada de aprendizagem será conduzida.
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ TIER 1       │  │ TIER 2       │  │ TIER 3       │
  │ Básica       │  │ Intermediária│  │ Avançada     │
  │              │  │              │  │              │
  │ Clique leva  │  │ Clique leva  │  │ Clique +     │
  │ a micro-     │  │ a trilha de  │  │ formulário   │
  │ aprendizagem │  │ 8 min com    │  │ falso → tri- │
  │ de 60 seg.   │  │ quiz.        │  │ lha de 25 min│
  │              │  │              │  │ obrigatória. │
  │ [selecionar] │  │ [selecionar] │  │ [selecionar] │
  └──────────────┘  └──────────────┘  └──────────────┘
  (cards clicáveis, selecionado ganha border-accent)

  Vetor do ataque
  ○ E-mail  ○ E-mail + página falsa  ○ SMS  ○ LinkedIn*
   (* em beta — futuro)

  Nível de sofisticação do iscagem
  ◉ Genérico (1)  ○ Contextual (2)  ○ Direcionado (3)  ○ Elite (4)
  [tooltip em cada nível explicando]

  Objetivo da campanha
  Para que você quer executar esta campanha? Esta informação
  orienta a IA de sugestão de templates.
  ┌──────────────────────────────────────────────┐
  │ ◻ Baseline — primeira campanha da empresa    │
  │ ◻ Reincidentes — quem já clicou antes        │
  │ ◻ Setor/cargo específico                      │
  │ ◻ Conformidade — requisito regulatório        │
  │ ◻ Pós-incidente — treinamento corretivo       │
  └──────────────────────────────────────────────┘

STEP 2 — Público
━━━━━━━━━━━━━

Layout split: filtros à esquerda (320px), tabela à direita.

[eyebrow] PASSO 2 DE 5
[H1] Quem vai receber esta campanha?
[sub] 1.240 colaboradores disponíveis. Filtros são combinados com AND.

Filtros ativos: (pills com X para remover)
[ Departamento: Financeiro × ]  [ Exceto: Diretoria × ]

┌ FILTROS ─────────────────┐  ┌ COLABORADORES SELECIONADOS (342) ─┐
│                           │  │ [busca...] [Export CSV]          │
│ Departamento              │  │                                   │
│ ☑ Financeiro (89)         │  │ ┌─────────────────────────────┐ │
│ ☐ RH (34)                 │  │ │ ☑ Nome · Cargo · Última caiu│ │
│ ☐ TI (156)                │  │ ├─────────────────────────────┤ │
│ ...                       │  │ │ ☑ Ana Silva · Analista Jr  │ │
│                           │  │ │   última: 34 dias · R 68%  │ │
│ Cargo                     │  │ │ ☑ Carlos Souza · Gerente    │ │
│ Score de risco            │  │ │   última: N/A · R 12%      │ │
│ Última campanha           │  │ │ ...                          │ │
│ Certificação vigente      │  │ └─────────────────────────────┘ │
│ Tempo de empresa          │  │                                   │
│                           │  │ [Selecionar todos visíveis]       │
│ [+ Salvar como grupo]     │  │                                   │
└───────────────────────────┘  └──────────────────────────────────┘

Observação ao pé: "Você está excluindo automaticamente colaboradores
em trilha Tier 3 ativa (3 pessoas). Isso evita sobrecarga."

STEP 3 — Template
━━━━━━━━━━━━━━

Grid de templates, com pré-visualização grande lateral.

┌ FILTROS ─────┐  ┌ GRID 2 COLUNAS ────────┐  ┌ PREVIEW ─────────┐
│ Setor        │  │ ┌─────┐ ┌─────┐        │  │                   │
│ Assunto      │  │ │Tmpl1│ │Tmpl2│        │  │  [mockup de       │
│ Dificuldade  │  │ │selec│ │     │        │  │   e-mail com      │
│ Idioma       │  │ └─────┘ └─────┘        │  │   header, body,   │
│              │  │ ┌─────┐ ┌─────┐        │  │   links, etc]     │
│ [+ Gerar com │  │ │     │ │     │        │  │                   │
│   IA]        │  │ └─────┘ └─────┘        │  │  Remetente:       │
└──────────────┘  └─────────────────────────┘  │  contabilidade    │
                                                │  @bradeco.com.br  │
                                                │                   │
                                                │  Assunto:         │
                                                │  Boleto 04/2026   │
                                                │  vencido - 2ª via │
                                                └───────────────────┘

Cada template mostra: nome, setor, taxa média de clique em outros clientes.

STEP 4 — Cronograma
━━━━━━━━━━━━━━━━

Escolha o momento do envio.

  Data e hora de início
  [date picker]  [time picker]

  Distribuição temporal
  ◯ Tudo de uma vez (mais agressivo, melhor para medição limpa)
  ◉ Escalonado ao longo de 4 horas (mais realista, evita picos de suspeita)
  ◯ Escalonado ao longo de 2 dias (campanha de longa duração)

  Fuso horário
  [America/Sao_Paulo (GMT-3)]

  Exclusões inteligentes
  ☑ Não enviar fora do horário comercial (8h-18h)
  ☑ Não enviar em feriados nacionais ou regionais
  ☑ Não enviar a colaboradores em férias (conforme HRIS)
  ☐ Evitar sexta-feira pós-15h

STEP 5 — Revisão
━━━━━━━━━━━━━━

Resumo estruturado do que vai ser executado.

┌ CAMPANHA ───────────────────────────────────────────┐
│ Nome: Campanha Financeiro · Abril 2026               │
│ Tier: 2 (Intermediária)                              │
│ Vetor: E-mail                                        │
│ Alvos: 342 colaboradores                             │
│ Template: "Boleto vencido Bradesco"                  │
│ Início: 22 abr 2026 às 9h                            │
│ Distribuição: escalonada em 4h                       │
└──────────────────────────────────────────────────────┘

┌ COMPLIANCE ─────────────────────────────────────────┐
│ ✓ Comunicado geral da empresa está em vigor         │
│ ✓ TLI aprovado pelo DPO (Ricardo M.) em 15/03/2026  │
│ ✓ Política interna disponível aos colaboradores     │
│ ✓ Domínio de isca legítimo (mail-bradeco.click)     │
└──────────────────────────────────────────────────────┘

Autorização final
Digite seu nome completo para confirmar que você está autorizando
esta campanha em nome de Dannemann:
[ Marlon Vieira                                      ]

[ Cancelar ]              [ Lançar campanha → ]
```

### 7.4 Página "Você foi pescado" (/pescado/[campaignTargetId])

(já detalhada na seção 3.4; não repetir aqui — ver acima.)

### 7.5 Portal do colaborador (/inicio)

```
Layout mais leve que o app admin — sem sidebar larga, navegação no topo.
Foco em conteúdo e ação do próprio colaborador.

HEADER (72px, surface-1)
  [wordmark phishguard]           [Minhas trilhas · Certificados · Privacidade · Sair]

HERO PESSOAL (min-height 40vh, padding-top 80px)

  "Olá, Marlon."
  (H1 Fraunces 48px)

  "Seu score de segurança esta semana:"

  ┌────────────────────────┐  ┌──────────────────────────────┐
  │                         │  │ VOCÊ ESTÁ INDO BEM           │
  │    [RiskRing 140px]     │  │                               │
  │       18%               │  │ Seu score é 12 pontos melhor  │
  │       Baixo             │  │ que há 3 meses. Você reportou │
  │                         │  │ 3 phishing corretamente este  │
  │                         │  │ trimestre — obrigado!         │
  │                         │  │                               │
  │                         │  │ [Ver meu histórico →]         │
  └─────────────────────────┘  └───────────────────────────────┘

AÇÕES PENDENTES (se houver)

  Trilha obrigatória pendente
  ┌──────────────────────────────────────────────────────────┐
  │ [ícone Alert]                                             │
  │ Você tem uma trilha pendente: "Ataques de spear-phishing"│
  │ Tempo estimado: 8 minutos · Prazo: 25 abril               │
  │ [Começar agora →]                                          │
  └──────────────────────────────────────────────────────────┘

TIMELINE PESSOAL

  "Sua jornada de segurança"

  ├─ 02/04 · Você concluiu "Reconhecendo BEC" · ✓ 92% no quiz
  ├─ 19/03 · Você reportou phishing corretamente · +5 pontos
  ├─ 14/03 · Campanha simulada enviada · você não clicou (ótimo)
  ├─ 28/02 · Você completou certificação anual · válida até 28/02/2027
  └─ 12/01 · Primeira simulação · Você clicou · trilha Tier 2 concluída

CERTIFICAÇÕES

  [grid de 3 cards de certificados com thumbnail, data, botão "baixar PDF"]

RECURSOS

  [cards de conteúdo opcional: artigos, vídeos, podcasts sobre segurança]
```

---

## Parte VIII — Roadmap de Entrega

Projeto desta magnitude precisa ser entregue em fases. Recomendo 5 fases, cada uma com critério de aceitação claro. Totaliza ~5-6 meses de desenvolvimento com 1 dev full-stack ou ~3 meses com equipe de 2-3 pessoas.

### Fase 0 — Fundações (2 semanas)

- Repositório Next.js 15 + TypeScript strict + Tailwind 4 configurados
- Design tokens implementados (light + dark)
- shadcn/ui customizado instalado
- Storybook rodando com 5 componentes de referência (Button, Card, Input, Badge, RiskRing)
- Supabase projeto criado, schema inicial via Drizzle migrations
- RLS policies básicas escritas e testadas
- CI/CD Cloudflare Pages + GitHub Actions
- Domínio registrado, DNS, SSL

**Aceitação:** rodar `npm run dev`, ver storybook com 5 componentes, fazer deploy em preview.

### Fase 1 — MVP de campanha Tier 1 (4 semanas)

- Auth Supabase com SSO por e-mail
- Onboarding de empresa (criação de company, primeiro admin)
- Importação de colaboradores via CSV
- Criação de template básico (editor simples, não visual por enquanto)
- Wizard de criação de campanha (steps 1, 2, 3, 5 apenas — sem cronograma complexo)
- Envio real de e-mail de phishing (SMTP próprio com 1 domínio de isca)
- Tracking de abertura + clique
- Landing "Você foi pescado" versão básica (sem vídeo, só HTML estático educativo)
- Dashboard com RiskRing + 4 métricas + lista de campanhas

**Aceitação:** empresa consegue criar campanha, enviar para 10 colaboradores, ver resultado no dashboard no dia seguinte.

### Fase 2 — Jornadas pedagógicas Tier 2 (5 semanas)

- Sistema de trilhas de aprendizagem (CRUD admin)
- Player de vídeo Mux integrado
- Renderer de artigos MDX
- Engine de quiz (banco rotativo, 5 questões)
- Camada 5 (fingerprinting de integridade client-side)
- Camada 1 (contextualização com dados da empresa)
- Máquina de estados do usuário (tabela + triggers)
- Notificações por e-mail (Resend) para trilha atribuída
- Portal do colaborador com acesso a trilhas
- Certificado em PDF

**Aceitação:** colaborador clica em phishing, recebe e-mail com trilha, faz vídeo + quiz, recebe certificado.

### Fase 3 — Tier 3 completo + anti-IA avançado (6 semanas)

- Formulário falso de credenciais (com hash local)
- Trilha Tier 3 completa
- Camada 2 (hit detection em imagens)
- Camada 3 (questões com telemetria pessoal)
- Camada 4 (banco rotativo com variantes)
- Camada 6 (avaliação dissertativa com rubrica LLM)
- Camada 7 (agendamento com gestor)
- Sistema de reincidência e notificação ao gestor direto
- Relatórios detalhados por campanha

**Aceitação:** executar campanha Tier 3 completa com todos os sete mecanismos anti-IA. Auditoria externa do sistema de integridade.

### Fase 4 — Enterprise features + compliance (4 semanas)

- Multi-tenant completo com isolamento por RLS revisado
- SSO SAML 2.0 (Azure AD, Okta, Google Workspace)
- Sincronização com Active Directory / Entra ID
- Gestão de domínios de isca pelo admin
- Painel de privacidade do colaborador (direitos LGPD)
- Workflow de anonimização pós-desligamento
- Audit log exportável
- Portal de compliance para o DPO da empresa cliente
- Internacionalização (pt-BR, EN, ES)
- Whitepaper técnico do sistema anti-IA

**Aceitação:** empresa com 1.000+ colaboradores faz onboarding completo, sincroniza AD, executa campanha, DPO recebe relatório.

### Fase 5 — Intelligence & growth (contínuo)

- IA de sugestão de templates (LLM próprio com RAG do histórico da empresa)
- Benchmark setorial (após acumular dados de 50+ empresas)
- Template marketplace (clientes compartilham templates anonimizados)
- Integração com SIEM (Splunk, Sentinel) via webhook
- Integração com Microsoft Defender / Gmail Advanced Threat Protection
- Mobile app nativo para colaboradores (React Native)
- Simulações vishing (voz) e smishing (SMS) em GA

---

## Parte IX — Observações Finais e Responsabilidades

### 9.1 O que este blueprint entrega

Um caminho concreto de reengenharia que transforma o PhishGuard de "clone visual de HackRangers" em produto com identidade própria, diferenciação técnica real (anti-IA é uma vantagem competitiva sustentável) e conformidade jurídica brasileira desde o dia um. A proposta visual se afasta deliberadamente de clichês de cibersegurança para ancorar o produto num segmento editorial/enterprise que hoje não está bem servido.

### 9.2 Decisões pendentes que precisam da sua resposta

Cinco decisões que dependem de você, Marlon, e que eu recomendo revisar antes de iniciar a Fase 0:

Primeira: Drizzle ou Prisma? Recomendei Drizzle pelo Edge runtime, mas se você já tem experiência com Prisma e prefere ficar nele (usando driver serverless da Neon ou Supabase), é uma escolha defensável.

Segunda: hospedagem de vídeo — Mux (premium, ~$300/mês para começar) vs. Bunny Stream (~$30/mês, qualidade boa) vs. Cloudflare Stream (integração com seu hosting, ~$1/1000min). Para MVP, Bunny ou Cloudflare Stream bastam.

Terceira: residência dos dados. Supabase tem região São Paulo desde 2024 — recomendo *não* usar Frankfurt. Dado brasileiro no Brasil simplifica compliance.

Quarta: proctoring. Fui conservador e não incluí webcam. Se seu cliente-alvo são bancos (setor que aceita mais invasão por compliance), talvez valha um módulo opcional Tier 3+ com proctoring via webcam + consentimento explícito.

Quinta: nome do produto. "PhishGuard" é bom mas genérico — há muitos produtos com esse nome no mundo. Como a linguagem visual é *Forensic Noir*, nomes alternativos que combinam: "Feixe" (minimalista, pt-BR), "Sentinel" (já usado), "Ofício" (muito pt-BR), "Vigília", "Anzol" (auto-irônico, memorável). Considere pesquisa de marca registrada antes de investir em identidade.

### 9.3 O que falta e eu não fiz (honestamente)

- **Código de exemplo completo.** Mostrei 4 componentes de referência. Implementar 100+ componentes do sistema é trabalho de semanas, não de uma resposta. O padrão está estabelecido.
- **Análise do código frontend atual.** Você não anexou o repositório, então a crítica foi à *especificação* v1, não ao código real. Se enviar, faço segunda passagem.
- **Pesquisa com usuários.** Recomendo entrevistar 5-8 CISOs/gestores de TI brasileiros antes de finalizar o produto. Blueprints não substituem conversa com cliente.
- **Cotação real de infraestrutura.** Os números mencionados (R$ 40/ano por domínio, ~$30/mês Bunny) são estimativas; fazer orçamento consolidado é próximo passo.

Este documento foi escrito para servir como **fundamento técnico e estratégico do PhishGuard v2**. A partir daqui, é implementação. Me avise se quer que eu abra a próxima etapa — por exemplo, gerar o schema Drizzle completo, implementar componentes adicionais, ou escrever o whitepaper técnico do sistema anti-IA para comercialização.

---

*Fim do documento.*
*Blueprint v2.0 — PhishGuard · Abril 2026*
*Forensic Noir · Next.js 15 · Supabase · Cloudflare Pages*
