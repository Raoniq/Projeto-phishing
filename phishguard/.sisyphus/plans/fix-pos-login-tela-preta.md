# Corrigir Tela Preta Após Login Demo

## TL;DR

> **Problema**: Após clicar em "Entrar como Demo" no login, a tela fica preta e nada aparece no devtools.
> 
> **Causa Raiz**: O login demo apenas navega para `/app/dashboard` sem criar uma sessão real no Supabase. O loader da rota `/app` detecta falta de autenticação e tenta redirecionar, causando comportamento indefinido.
> 
> **Solução**: Implementar autenticação mock que cria uma sessão falsa no localStorage, permitindo que o loader passe e o dashboard carregue.

**Deliverables**:
- Mock auth service que simula sessão do Supabase
- Atualização do Login.tsx para usar auth mock no modo demo
- Ajuste no requireAuthLoader para lidar com sessões mock
- Dashboard funcional com dados demo

**Estimated Effort**: Curto (1-2 horas)
**Parallel Execution**: NÃO - sequencial (dependências de auth)

---

## Context

### Original Request
Usuário relatou: "fiz login aqui e ficou tudo preto, e nada no devtools"

### Entrevista Técnica
**Análise do Código**:
- Login.tsx linha 169: Botão demo apenas chama `navigate('/app/dashboard')`
- index.tsx linha 367-374: Rota `/app` tem `loader: requireAuthLoader`
- session.ts linha 53-91: `getAuthContext()` retorna null sem sessão Supabase
- requireAuthLoader (index.tsx linha 72-80): Lança redirect se null

**Problema Identificado**:
1. Usuário clica "Entrar como Demo"
2. Login.tsx navega para `/app/dashboard`
3. Router executa `requireAuthLoader` da rota `/app`
4. `getAuthContext()` retorna null (sem sessão)
5. Loader lança `redirect('/login?returnTo=...')`
6. Loop ou erro silencioso → tela preta

### Metis Review
**Gaps Identificados (resolvidos)**:
- **Gap**: Como mockar sessão do Supabase sem backend real?
  **Resolução**: Usar `supabase.auth.getSession()` retorna dados do localStorage. Criar estrutura compatível.
  
- **Gap**: O dashboard precisa de dados reais?
  **Resolução**: Dashboard já tem mock data (linha 17-35 do dashboard.page.tsx). Só precisa passar pelo auth.

- **Guardrail**: Não quebrar auth real quando Supabase estiver configurado
  **Resolução**: Mock apenas quando ambiente não tiver VITE_SUPABASE_URL

---

## Work Objectives

### Core Objetivo
Implementar autenticação mock funcional para modo demo, permitindo acesso ao dashboard sem Supabase real.

### Deliverables Concretos
- `src/lib/auth/mockAuth.ts` - Serviço de auth mock compatível com Supabase
- `src/routes/auth/Login.tsx` atualizado - Integra com mock auth no botão demo
- `src/lib/auth/session.ts` atualizado - Detecta e lida com sessão mock
- `src/routes/index.tsx` atualizado - Loader lida com modo demo

### Definition of Done
- [ ] Clicar "Entrar como Demo" → Dashboard carrega com dados mock
- [ ] Logout funciona e retorna para /login
- [ ] Navegação entre rotas protegidas funciona
- [ ] Console não mostra erros de auth
- [ ] Auth real (Supabase) continua funcionando quando configurado

### Must Have
- Mock auth deve usar mesma interface do Supabase auth
- Sessão mock persiste no localStorage (compatível com `supabase.auth.getSession()`)
- Dashboard exibe dados mock (já implementado)
- Logout limpa sessão mock

### Must NOT Have (Guardrails)
- **NÃO** modificar componentes UI do dashboard (já funcionam)
- **NÃO** remover suporte a Supabase real
- **NÃO** adicionar dependências novas
- **NÃO** mudar estrutura de rotas existente

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NÃO - projeto não tem testes automatizados configurados
- **Automated tests**: NÃO - verificação será manual via QA scenarios
- **Framework**: N/A
- **Agent-Executed QA**: SIM - Playwright para cenários de navegação

### QA Policy
Cenários executados via Playwright:
- **Frontend**: Navegar para /login, clicar demo, verificar dashboard renderiza
- **Console**: Capturar logs, verificar sem erros
- **Logout**: Verificar redirect para /login

---

## Execution Strategy

### Sequential Execution (auth é dependência crítica)

```
Wave 1 (Fundação - auth mock):
├── Task 1: Criar mockAuth.ts - serviço compatível com Supabase auth [quick]
└── Task 2: Atualizar session.ts - integrar com mock auth [quick]

Wave 2 (Integração - login flow):
├── Task 3: Atualizar Login.tsx - usar mock auth no botão demo [quick]
└── Task 4: Atualizar index.tsx - loader lida com sessão mock [quick]

Wave 3 (Validação - QA):
├── Task 5: Teste manual - verificar fluxo completo [quick]
└── Task 6: Capturar evidências - screenshots do dashboard [quick]

Critical Path: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6
Parallel Speedup: N/A (auth é sequencial por natureza)
```

### Agent Dispatch Summary

- **Wave 1**: **2** tasks - T1 → `quick`, T2 → `quick`
- **Wave 2**: **2** tasks - T3 → `quick`, T4 → `quick`
- **Wave 3**: **2** tasks - T5 → `quick`, T6 → `quick`

---

## TODOs

- [ ] 1. Criar Mock Auth Service

  **What to do**:
  - Criar arquivo `src/lib/auth/mockAuth.ts`
  - Implementar interface compatível com Supabase auth:
    - `getSession()`: Retorna sessão do localStorage
    - `getUser()`: Retorna usuário da sessão
    - `signIn()`: Cria sessão e salva no localStorage
    - `signOut()`: Remove sessão do localStorage
    - `onAuthStateChange()`: Listener simples
  - Estrutura da sessão mock deve matchar tipo do Supabase
  - Exportar `mockSupabaseAuth` object

  **Must NOT do**:
  - NÃO implementar features complexas (refresh token, etc.)
  - NÃO modificar auth real do Supabase
  - NÃO adicionar dependências externas

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Implementação simples de interface conhecida

  **Parallelization**:
  - **Can Run In Parallel**: NÃO
  - **Blocked By**: None
  - **Blocks**: Task 2, 3

  **References**:
  - `src/lib/supabase.ts` - Ver estrutura do cliente Supabase
  - `src/lib/auth/session.ts` - Ver como auth é consumido
  - Supabase docs: `https://supabase.com/docs/reference/javascript/auth-getsession`

  **Acceptance Criteria**:
  - [ ] Arquivo criado em `src/lib/auth/mockAuth.ts`
  - [ ] Exporta objeto com métodos: getSession, getUser, signIn, signOut, onAuthStateChange
  - [ ] Sessão persiste no localStorage com chave `mock-supabase-auth-token`
  - [ ] Tipos TypeScript compatíveis com @supabase/supabase-js

  **QA Scenario**:
  ```
  Scenario: Mock auth cria sessão válida
    Tool: Bash (node REPL ou script TypeScript)
    Steps:
      1. Importar mockSupabaseAuth
      2. Chamar signIn({ email: 'demo@phishguard.com', name: 'Demo User' })
      3. Verificar localStorage contém 'mock-supabase-auth-token'
      4. Chamar getSession()
      5. Verificar retorna objeto com user e session
    Expected: Sessão criada e recuperável
    Evidence: .sisyphus/evidence/task-1-mock-auth-test.txt
  ```

  **Commit**: NÃO (grupo com Task 2-4)

---

- [ ] 2. Atualizar session.ts para suportar mock auth

  **What to do**:
  - Importar `mockSupabaseAuth` em `src/lib/auth/session.ts`
  - Atualizar `getSession()`: Tentar Supabase real primeiro, fallback para mock
  - Atualizar `getCurrentUser()`: Mesma lógica
  - Adicionar flag `isMockAuth` no AuthContext para debug
  - Manter compatibilidade com auth real

  **Must NOT do**:
  - NÃO quebrar fluxo de auth real
  - NÃO remover logs de erro existentes
  - NÃO mudar interface pública do módulo

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NÃO
  - **Blocked By**: Task 1
  - **Blocks**: Task 3, 4

  **References**:
  - `src/lib/auth/session.ts` (atual) - Modificar este arquivo
  - `src/lib/auth/mockAuth.ts` (Task 1) - Importar e usar

  **Acceptance Criteria**:
  - [ ] `getSession()` tenta Supabase, fallback para mock
  - [ ] `getAuthContext()` funciona com sessão mock
  - [ ] Console log indica quando usando mock auth (debug)
  - [ ] TypeScript compila sem erros

  **QA Scenario**:
  ```
  Scenario: getAuthContext retorna contexto com mock auth
    Tool: Bash (script de teste)
    Steps:
      1. Chamar mockSupabaseAuth.signIn()
      2. Chamar getAuthContext()
      3. Verificar retorna objeto com session, user, profile: null, company: null
    Expected: Contexto retornado sem erros
    Evidence: .sisyphus/evidence/task-2-session-test.txt
  ```

  **Commit**: NÃO (grupo com Task 3-4)

---

- [ ] 3. Atualizar Login.tsx para usar mock auth

  **What to do**:
  - Importar `mockSupabaseAuth` em `src/routes/auth/Login.tsx`
  - Atualizar `handleEmailPasswordLogin`:
    - Se VITE_SUPABASE_URL não configurado, usar mock auth
    - Chamar `mockSupabaseAuth.signIn()` com dados do usuário
  - Atualizar botão "Entrar como Demo":
    - Chamar `mockSupabaseAuth.signIn({ email: 'demo@phishguard.com', name: 'Demo User' })`
    - Depois navegar para `/app/dashboard`
  - Manter fluxo real quando Supabase configurado

  **Must NOT do**:
  - NÃO remover opção de login real
  - NÃO mudar UI do formulário
  - NÃO adicionar novos estados

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NÃO
  - **Blocked By**: Task 1, 2
  - **Blocks**: Task 4

  **References**:
  - `src/routes/auth/Login.tsx` (atual) - Modificar
  - `src/lib/auth/mockAuth.ts` - Usar para login demo
  - `src/lib/auth/session.ts` - Ver como session é usada

  **Acceptance Criteria**:
  - [ ] Botão "Entrar como Demo" cria sessão mock
  - [ ] Navegação para /app/dashboard após login demo
  - [ ] Login com email/senha usa mock quando Supabase indisponível
  - [ ] Console não mostra erros de auth

  **QA Scenario**:
  ```
  Scenario: Login demo funciona
    Tool: Playwright
    Steps:
      1. Navegar para /login
      2. Clicar em "Entrar como Demo"
      3. Aguardar navegação
      4. Verificar URL é /app/dashboard
      5. Verificar elemento do dashboard renderiza (ex: texto "Dashboard")
    Expected: Dashboard visível, sem tela preta
    Evidence: .sisyphus/evidence/task-3-login-demo.png
  ```

  **Commit**: NÃO (grupo com Task 4)

---

- [ ] 4. Atualizar requireAuthLoader para lidar com mock

  **What to do**:
  - Em `src/routes/index.tsx`, atualizar `requireAuthLoader`
  - Verificar se `getAuthContext()` retorna null
  - Se null E estiver em modo demo, permitir acesso com contexto vazio
  - Se null E produção, manter redirect para /login
  - Adicionar variável de ambiente `VITE_USE_MOCK_AUTH` para forçar modo demo

  **Must NOT do**:
  - NÃO remover redirect em produção
  - NÃO permitir acesso sem auth em produção
  - NÃO mudar estrutura de rotas

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NÃO
  - **Blocked By**: Task 2, 3
  - **Blocks**: Task 5

  **References**:
  - `src/routes/index.tsx` (atual) - Modificar requireAuthLoader
  - `src/lib/auth/session.ts` - Ver getAuthContext

  **Acceptance Criteria**:
  - [ ] Loader permite acesso com mock auth
  - [ ] Loader redirect em produção sem auth
  - [ ] Variável VITE_USE_MOCK_AUTH funciona
  - [ ] TypeScript compila sem erros

  **QA Scenario**:
  ```
  Scenario: Loader permite acesso com mock auth
    Tool: Playwright
    Steps:
      1. Fazer login demo (Task 3)
      2. Navegar para /app/usuarios
      3. Verificar página carrega (não redirect para login)
      4. Navegar para /app/configuracoes
      5. Verificar página carrega
    Expected: Todas rotas protegidas acessíveis
    Evidence: .sisyphus/evidence/task-4-loader-test.png
  ```

  **Commit**: SIM
  - Message: `fix(auth): implementar mock auth para modo demo`
  - Files: `src/lib/auth/mockAuth.ts`, `src/lib/auth/session.ts`, `src/routes/auth/Login.tsx`, `src/routes/index.tsx`
  - Pre-commit: `tsc --noEmit`

---

- [ ] 5. Teste manual do fluxo completo

  **What to do**:
  - Iniciar servidor de desenvolvimento: `bun run dev`
  - N avegar para http://localhost:5173/login
  - Clicar em "Entrar como Demo"
  - Verificar dashboard carrega com:
    - Sidebar visível
    - Topbar visível
    - Cards de métricas
    - RiskRing
  - Testar navegação:
    - Clicar em "Campanhas"
    - Clicar em "Pessoas"
    - Clicar em "Configurações"
  - Testar logout:
    - Clicar no menu de usuário
    - Clicar em "Sair"
    - Verificar redirect para /login

  **Must NOT do**:
  - NÃO pular nenhum passo do teste
  - NÃO ignorar erros no console

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NÃO
  - **Blocked By**: Task 4

  **Acceptance Criteria**:
  - [ ] Dashboard carrega em < 2 segundos
  - [ ] Todos elementos visíveis
  - [ ] Navegação funciona
  - [ ] Logout funciona
  - [ ] Console sem erros vermelhos

  **QA Scenario**:
  ```
  Scenario: Fluxo completo demo
    Tool: Playwright + manual
    Steps:
      1. bun run dev
      2. http://localhost:5173/login
      3. Clicar "Entrar como Demo"
      4. Aguardar dashboard
      5. Pressionar F12, verificar console
      6. Tirar screenshot do dashboard
    Expected: Tela completa do dashboard visível
    Evidence: .sisyphus/evidence/task-5-full-flow.png
  ```

  **Commit**: NÃO

---

- [ ] 6. Capturar evidências e documentar

  **What to do**:
  - Capturar screenshots do dashboard funcionando
  - Documentar como usar modo demo no README
  - Adicionar nota sobre VITE_USE_MOCK_AUTH
  - Salvar evidências em .sisyphus/evidence/

  **Must NOT do**:
  - NÃO criar documentação extensa (apenas notas)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: SIM (com Task 5)
  - **Blocked By**: Task 5

  **Acceptance Criteria**:
  - [ ] Screenshot do dashboard em .sisyphus/evidence/
  - [ ] README atualizado com seção "Modo Demo"
  - [ ] .env.example inclui VITE_USE_MOCK_AUTH=true

  **Commit**: SIM (grupo com Task 7)
  - Message: `docs: adicionar modo demo ao README`

---

## Final Verification Wave

> 4 review agents rodam em PARALELO. Todos devem APROVAR.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Verificar:
  - Mock auth implementado em `src/lib/auth/mockAuth.ts`
  - Session.ts atualizado integra com mock
  - Login.tsx usa mock no botão demo
  - requireAuthLoader lida com mock
  - Evidências existem em .sisyphus/evidence/
  
  Output: `Must Have [4/4] | Must NOT Have [4/4] | Tasks [6/6] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Rodar:
  - `tsc --noEmit` - verificar tipos
  - `bun run lint` (se existir)
  - Verificar arquivos: sem `as any`, `@ts-ignore`, console.log em prod
  
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [4 clean] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` + `playwright`
  Executar:
  - Login demo → Dashboard carrega
  - Navegar entre 3 rotas protegidas
  - Logout → Redirect para /login
  - Console sem erros
  - Capturar screenshots
  
  Output: `Scenarios [3/3 pass] | Integration [CLEAN] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  Verificar:
  - Task 1-6 implementadas conforme especificado
  - Sem files modificados além do escopo
  - Sem features adicionais não planejadas
  
  Output: `Tasks [6/6 compliant] | Contamination [CLEAN] | VERDICT`

---

## Commit Strategy

- **Grupo 1** (Tasks 1-4): `fix(auth): implementar mock auth para modo demo`
  - Files: `src/lib/auth/mockAuth.ts`, `src/lib/auth/session.ts`, `src/routes/auth/Login.tsx`, `src/routes/index.tsx`
  - Pre-commit: `tsc --noEmit`

- **Grupo 2** (Tasks 5-6): `docs: adicionar modo demo ao README`
  - Files: `README.md`, `.env.example`
  - Pre-commit: N/A

---

## Success Criteria

### Verification Commands
```bash
# 1. TypeScript compila
tsc --noEmit  # Expected: No errors

# 2. Servidor inicia
bun run dev  # Expected: Server runs on http://localhost:5173

# 3. Login demo funciona
# Manual: http://localhost:5173/login → "Entrar como Demo" → Dashboard
```

### Final Checklist
- [ ] Dashboard carrega após login demo
- [ ] Sidebar e Topbar visíveis
- [ ] Navegação funciona
- [ ] Logout funciona
- [ ] Console sem erros
- [ ] Auth real não quebrado
- [ ] README atualizado
