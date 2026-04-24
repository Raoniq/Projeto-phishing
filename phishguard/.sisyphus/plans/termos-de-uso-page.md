# Página de Termos de Uso + Política de Privacidade

## TL;DR

> **Objetivo**: Criar página de Termos de Uso (combinando com LGPD/Privacidade) e adicionar links de navegação no header e footer.
> 
> **Entregáveis**:
> - Página `/termos` completa com conteúdo jurídico
> - Link "Termos de Uso" no header (MarketingLayout)
> - Link "Termos de Uso" no footer
> - Atualizar links em Login.tsx e Register.tsx
> 
> **Estimativa**: Curto (~30-45 min)
> **Execução Paralela**: NÃO - sequencial (2 waves)

---

## Contexto

### Situação Atual
- Página LGPD já existe (`/lgpd`) e é bem completa
- Login.tsx e Register.tsx têm links apontando para `/lgpd` com texto "Termos de Uso" e "Política de Privacidade"
- MarketingLayout tem navegação no header e footer
- Não há página separada de Termos de Uso

### Decisões de Design
- **Conteúdo**: Página única `/termos` combinando Termos de Uso + Política de Privacidade (LGPD)
- **Estilo**: Coeso com páginas existentes (MarketingLayout, mesmo design system)
- **Navegação**: Adicionar "Termos" no header e footer

---

## Objetivos de Trabalho

### Objetivo Principal
Criar página de Termos de Uso profissional e completa, seguindo o padrão de design das páginas de marketing existentes.

### Entregáveis Concretos
1. Arquivo: `src/routes/marketing/Termos.tsx`
2. Rota: `/termos` registrada no App.tsx
3. Links de navegação atualizados no MarketingLayout
4. Links em Login.tsx e Register.tsx apontando para `/termos`

### Definição de Pronto
- [ ] Página `/termos` acessível e renderizando
- [ ] Link "Termos" visível no header (desktop e mobile)
- [ ] Link "Termos" visível no footer
- [ ] Links em Login e Register funcionando
- [ ] Build sem erros

### Must Have
- Conteúdo jurídico completo (termos, privacidade, LGPD)
- Design coeso com páginas existentes
- Responsivo (mobile-friendly)
- Scroll animations (mesmo padrão das outras páginas)

### Must NOT Have (Guardrails)
- **NÃO** modificar a página LGPD existente
- **NÃO** criar páginas separadas para termos e privacidade
- **NÃO** usar componentes que não existam no design system atual

---

## Estratégia de Verificação

### Testes
- **Infraestrutura existe**: Sim (Vite + React)
- **Testes automatizados**: NÃO (tests-after)
- **QA Agent-Executed**: SIM (Playwright para navegação)

### Cenários de QA (obrigatórios por tarefa)

**Tarefa 1 - Criar página:**
```
Scenario: Acessar página /termos
  Tool: Playwright
  Steps:
    1. Navigate to http://localhost:3000/termos
    2. Wait for h1 with text "Termos de Uso"
    3. Scroll down 500px
    4. Verify content sections are visible
  Expected: Page loads without errors, content visible
  Evidence: .sisyphus/evidence/task-1-termos-page.png
```

**Tarefa 2 - Navegação:**
```
Scenario: Clicar link "Termos" no header
  Tool: Playwright
  Steps:
    1. Navigate to http://localhost:3000
    2. Click link with text "Termos" in header nav
    3. Verify URL changes to /termos
  Expected: Navigation successful, URL = /termos
  Evidence: .sisyphus/evidence/task-2-header-nav.png
```

---

## Estratégia de Execução

### Wave 1 - Criar página de Termos (sequencial)

**Task 1: Criar página Termos.tsx**
- **Category**: `frontend-design` (design coeso, estética editorial)
- **Skills**: [`frontend-ui-ux`] - UI/UX polish
- **Paralelo**: NÃO (base para resto)
- **Bloqueia**: Tarefa 2

**O que fazer**:
1. Criar `src/routes/marketing/Termos.tsx`
2. Usar mesmo padrão de Lgpd.tsx (scroll animations, cards, sections)
3. Conteúdo sections:
   - Hero: "Termos de Uso e Política de Privacidade"
   - Visão geral (summary cards)
   - Termos de Uso (aceitação, conta, conduta, propriedade intelectual)
   - Privacidade (dados coletados, uso, direitos LGPD)
   - Cookies
   - Contato DPO
4. Manter consistência visual com Lgpd.tsx

**Referências**:
- `src/routes/marketing/Lgpd.tsx` - padrão de sections, cards, animations
- `src/routes/marketing/Home.tsx` - scroll reveal patterns
- `src/components/ui/Card.tsx` - componente Card
- `src/components/ui/Button.tsx` - componente Button

**Aceite**:
- [ ] Arquivo criado em `src/routes/marketing/Termos.tsx`
- [ ] Export default component `TermosPage`
- [ ] Build passa sem erros
- [ ] Página acessível em `/termos`

**Commit**: YES
- Message: `feat: add Terms of Use and Privacy Policy page`
- Files: `src/routes/marketing/Termos.tsx`

---

### Wave 2 - Atualizar navegação e rotas (paralelo possível)

**Task 2: Adicionar rota no App.tsx**
- **Category**: `quick`
- **Skills**: []
- **Paralelo**: SIM (com Task 3)
- **Bloqueado por**: Task 1

**O que fazer**:
1. Importar `TermosPage` em App.tsx
2. Adicionar rota `/termos` dentro do MarketingLayout

**Referências**:
- `src/App.tsx:23` - import LgpdPage
- `src/App.tsx:104` - rota /lgpd

**Aceite**:
- [ ] Import adicionado: `import TermosPage from './routes/marketing/Termos'`
- [ ] Rota registrada: `<Route path="/termos" element={<TermosPage />} />`
- [ ] Build sem erros

**Commit**: YES (grupa com Task 3)

---

**Task 3: Atualizar MarketingLayout navegação**
- **Category**: `quick`
- **Skills**: []
- **Paralelo**: SIM (com Task 2)
- **Bloqueado por**: Task 1

**O que fazer**:
1. Adicionar "Termos" no array `navLinks` (header)
2. Adicionar link "Termos" no footer

**Referências**:
- `src/components/navigation/MarketingLayout.tsx:13-20` - navLinks array
- `src/components/navigation/MarketingLayout.tsx:110-118` - footer links

**Aceite**:
- [ ] navLinks inclui: `{ to: '/termos', label: 'Termos' }`
- [ ] Footer tem link: `<Link to="/termos">Termos de Uso</Link>`
- [ ] Link ativo funciona (highlight quando na página)

**Commit**: YES (grupa com Task 3)

---

**Task 4: Atualizar Login.tsx e Register.tsx**
- **Category**: `quick`
- **Skills**: []
- **Paralelo**: SIM (com Task 2 e 3)
- **Bloqueado por**: Task 1

**O que fazer**:
1. Em Login.tsx: mudar links de `/lgpd` para `/termos`
2. Em Register.tsx: mudar links de `/lgpd` para `/termos`

**Referências**:
- `src/routes/auth/Login.tsx:363-368` - links atuais
- `src/routes/auth/Register.tsx:230-234` - links atuais

**Aceite**:
- [ ] Login.tsx: `<Link to="/termos">Termos de Uso</Link>`
- [ ] Login.tsx: `<Link to="/termos">Política de Privacidade</Link>`
- [ ] Register.tsx: mesma atualização

**Commit**: YES (grupa com Tasks 2-4)

---

## Final Verification Wave

**F1. Plan Compliance Audit** - `oracle`
- Verificar página `/termos` existe e tem conteúdo
- Verificar links no header e footer
- Verificar links em Login e Register

**F2. Code Quality Review** - `unspecified-high`
- Build sem erros
- Sem `as any`, `@ts-ignore`
- Imports organizados

**F3. Real Manual QA** - `unspecified-high` + `playwright`
- Navegar para `/termos` via URL direta
- Clicar link "Termos" no header
- Clicar link "Termos" no footer
- Voltar do link em Login
- Evidence: screenshots em `.sisyphus/evidence/final-qa/`

**F4. Scope Fidelity Check** - `deep`
- Página tem conteúdo completo (termos + privacidade)
- Navegação atualizada em todos os lugares
- Sem mudanças não solicitadas

---

## Commit Strategy

**Commit 1**: `feat: add Terms of Use and Privacy Policy page`
- Files: `src/routes/marketing/Termos.tsx`

**Commit 2**: `feat: add Terms link to navigation and footer`
- Files: `src/App.tsx`, `src/components/navigation/MarketingLayout.tsx`, `src/routes/auth/Login.tsx`, `src/routes/auth/Register.tsx`

---

## Success Criteria

### Comandos de Verificação
```bash
npm run build  # Expected: build succeeds
npm run dev    # Expected: no errors, /termos accessible
```

### Checklist Final
- [ ] Página `/termos` acessível
- [ ] Link no header (desktop e mobile)
- [ ] Link no footer
- [ ] Links em Login e Register atualizados
- [ ] Design coeso com Lgpd.tsx
- [ ] Build sem erros
- [ ] QA scenarios passing

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Conteúdo jurídico incompleto | Médio | Usar Lgpd.tsx como base, focar em estrutura visual |
| Inconsistência visual | Baixo | Copiar patterns exatos de Lgpd.tsx |
| Links quebrados | Baixo | QA rigoroso em todas as páginas |
