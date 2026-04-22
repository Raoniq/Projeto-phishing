# Plano: Correção de Largura de Texto em Todo o Site

## TL;DR

> **Objetivo**: Corrigir problemas de legibilidade onde textos estão muito estreitos ou sem constraint de largura, causando "corredor vertical" no centro da tela.
> 
> **Abordagem**: Aplicar `max-w-*` apropriado em todos os `<p>` e elementos descritivos identificados pelos agentes explore.
> 
> **Estimated Effort**: Medium (20+ correções em 10 arquivos)
> **Parallel Execution**: YES - 3 waves

---

## Context

### Original Request
Usuário relatou que textos estão "centralizados numa linha no meio do browser e cortando na vertical". Exemplos citados:
- "Treinamento gamificado que modifica comportamentos..."
- "Dos nossos clientes, 89% relatam redução significativa..."
- "Baseado em ciência comportamental e psicología da aprendizagem..."

### Agent Scan Results
4 agentes explore varreram todo o código e identificaram **20+ problemas** de largura de texto:

**Marketing Pages** (bg_dbc2409d):
- Home.tsx:184 - `max-w-xl` muito estreito → needs `max-w-3xl`
- Security.tsx:116 - sem max-width → needs `max-w-4xl`

**Components** (bg_7cf510fe):
- DragAndDropCanvas.tsx:146 - empty state sem constraint
- LandingPreview.tsx:15 - empty state sem constraint
- LandingBuilder.tsx:72 - descrição sem constraint
- EmailEditor.tsx:325 - template description sem constraint
- QuizButton.tsx:163,207 - hint text sem constraint
- InteractiveArticle.tsx:227,265 - explanatory text sem constraint
- CertificateGenerator.tsx:96,105,109 - status/certificate text sem constraint

**Auth/Learner** (bg_3a4d845c):
- EmailVerification.tsx:115,145,214 - could use explicit `max-w-lg`
- ChangePassword.tsx:71,125 - could use explicit `max-w-lg`

**App Pages** (bg_c09e0450):
- Configuracoes.tsx:90-92,127-129 - descriptions could use `max-w-xl`
- NovaCampanhaPage.tsx:777-780 - warning text needs `max-w-xl`

---

## Work Objectives

### Core Objective
Aplicar constraints de largura (`max-w-*`) em todos os textos descritivos identificados para garantir legibilidade ideal (60-75 caracteres por linha).

### Concrete Deliverables
- 20+ elementos HTML com `max-w-*` adicionado/atualizado
- Zero regressões visuais (testar cada página modificada)

### Definition of Done
- [ ] Todos os arquivos listados foram modificados
- [ ] `bun run build` succeeds
- [ ] Usuário confirma que textos não estão mais em "corredor vertical"

### Must Have
- Manter consistência: textos descritivos longos → `max-w-3xl` ou `max-w-4xl`
- Textos curtos/hints → `max-w-xs` ou `max-w-sm`
- Não quebrar layouts existentes (testar responsivo)

### Must NOT Have (Guardrails)
- NÃO adicionar `max-w-full` em textos longos (causa o problema original)
- NÃO modificar estilos de botões, apenas `<p>` e descrições
- NÃO remover classes existentes, apenas adicionar `max-w-*`

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: NO (mudanças visuais, teste manual necessário)
- **Agent-Executed QA**: YES - Playwright para verificar rendering

### QA Policy
Cada tarefa deve incluir cenário QA onde agente:
1. Navega até a página modificada
2. Verifica se o texto está com largura adequada
3. Captura screenshot para evidência

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - Marketing pages, 2 tasks):
├── Task 1: Fix Home.tsx + Security.tsx [quick]
└── Task 2: Fix Pricing.tsx + About.tsx + Lgpd.tsx [quick]

Wave 2 (After Wave 1 - Components, 4 tasks):
├── Task 3: Fix DragAndDropCanvas.tsx + LandingPreview.tsx [quick]
├── Task 4: Fix LandingBuilder.tsx + EmailEditor.tsx [quick]
├── Task 5: Fix QuizButton.tsx + InteractiveArticle.tsx [quick]
└── Task 6: Fix CertificateGenerator.tsx [quick]

Wave 3 (After Wave 2 - Auth/App pages, 2 tasks):
├── Task 7: Fix EmailVerification.tsx + ChangePassword.tsx [quick]
└── Task 8: Fix Configuracoes.tsx + NovaCampanhaPage.tsx [quick]

Wave FINAL (After ALL tasks — visual verification):
└── Task F1: Playwright QA - verify all pages render correctly

Critical Path: Task 1 → Task 3 → Task 7 → F1
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Wave 2)
```

### Dependency Matrix
- **1-2**: - - 3-6, F1
- **3-6**: 1-2 - 7-8, F1
- **7-8**: 3-6 - F1
- **F1**: 1-8 - complete

---

## TODOs

- [x] 1. Fix Home.tsx:184 + Security.tsx:116

  **What to do**:
  - Home.tsx linha 184: mudar `max-w-xl` → `max-w-3xl`
  - Security.tsx linha 116: adicionar `max-w-4xl` ao className

  **Must NOT do**:
  - NÃO remover outras classes
  - NÃO modificar outros elementos

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Edições simples de string replacement

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3-6
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] Home.tsx:184 tem `max-w-3xl`
  - [ ] Security.tsx:116 tem `max-w-4xl`

  **QA Scenarios**:
  ```
  Scenario: Verify Home.tsx hero section text width
    Tool: Playwright
    Preconditions: bun dev running
    Steps:
      1. Navigate to http://localhost:5173/
      2. Wait for HeroSection to render
      3. Locate paragraph with text "Baseado em ciência comportamental"
      4. Measure element width via JavaScript
    Expected Result: Width should be ~768px (max-w-3xl) or larger
    Evidence: .sisyphus/evidence/task-1-home-width.png

  Scenario: Verify Security.tsx hero text width
    Tool: Playwright
    Preconditions: bun dev running
    Steps:
      1. Navigate to http://localhost:5173/security
      2. Wait for page load
      3. Locate hero description "Levamos segurança tão a sério"
      4. Verify text doesn't span full viewport width
    Expected Result: Text constrained to ~896px (max-w-4xl)
    Evidence: .sisyphus/evidence/task-1-security-width.png
  ```

  **Commit**: YES (groups with 2)
  - Message: `fix(layout): add max-w constraints to marketing hero text`
  - Files: `src/routes/marketing/Home.tsx, src/routes/marketing/Security.tsx`

---

- [x] 2. Fix Pricing.tsx + About.tsx + Lgpd.tsx remaining issues

  **What to do**:
  - Apply any remaining max-w fixes identified in scan results
  - Verify no new narrow constraints introduced

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3-6
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] All marketing pages have proper max-w on descriptive text

  **QA Scenarios**:
  ```
  Scenario: Verify all marketing pages render correctly
    Tool: Playwright
    Steps:
      1. Navigate to /pricing, /about, /lgpd
      2. Verify text is readable and not too narrow/wide
    Evidence: .sisyphus/evidence/task-2-marketing-pages.png
  ```

  **Commit**: YES (groups with 1)

---

- [x] 3. Fix DragAndDropCanvas.tsx:146 + LandingPreview.tsx:15

  **What to do**:
  - DragAndDropCanvas.tsx:146: adicionar `max-w-sm` ao `<p>` "Arraste blocos para cá"
  - LandingPreview.tsx:15: adicionar `max-w-xs` ao `<p>` "Selecione um template"

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4-6)
  - **Blocks**: Task 7-8
  - **Blocked By**: Tasks 1-2

  **Acceptance Criteria**:
  - [ ] Both files have max-w added

  **QA Scenarios**:
  ```
  Scenario: Verify empty state text width
    Tool: Playwright
    Steps:
      1. Navigate to landing builder/preview pages
      2. Verify empty state messages are constrained
    Evidence: .sisyphus/evidence/task-3-empty-states.png
  ```

  **Commit**: YES (groups with 4-6)

---

- [x] 4. Fix LandingBuilder.tsx:72 + EmailEditor.tsx:325

  **What to do**:
  - LandingBuilder.tsx:72: adicionar `max-w-sm` à descrição
  - EmailEditor.tsx:325: adicionar `max-w-sm` à descrição do template

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 2, parallel with 3,5,6

  **Acceptance Criteria**:
  - [ ] Both descriptions have max-w-sm

  **QA Scenarios**:
  ```
  Scenario: Verify builder/editor descriptions
    Tool: Playwright
    Steps:
      1. Navigate to landing builder page
      2. Navigate to email editor page
      3. Verify description text width
    Evidence: .sisyphus/evidence/task-4-descriptions.png
  ```

  **Commit**: YES (groups with 3,5,6)

---

- [x] 5. Fix QuizButton.tsx:163,207 + InteractiveArticle.tsx:227,265

  **What to do**:
  - QuizButton.tsx:163: adicionar `max-w-xs`
  - QuizButton.tsx:207: adicionar `max-w-sm`
  - InteractiveArticle.tsx:227: adicionar `max-w-sm`
  - InteractiveArticle.tsx:265: adicionar `max-w-xs`

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 2, parallel with 3,4,6

  **Acceptance Criteria**:
  - [ ] All hint/explanation texts have max-w

  **QA Scenarios**:
  ```
  Scenario: Verify quiz and article hints
    Tool: Playwright
    Steps:
      1. Navigate to a quiz page
      2. Navigate to an interactive article
      3. Verify hint text width
    Evidence: .sisyphus/evidence/task-5-hints.png
  ```

  **Commit**: YES (groups with 3,4,6)

---

- [x] 6. Fix CertificateGenerator.tsx:96,105,109

  **What to do**:
  - Adicionar `max-w-sm` a todos os textos de status e certificate

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 2, parallel with 3,4,5

  **Acceptance Criteria**:
  - [ ] All certificate texts have max-w-sm

  **QA Scenarios**:
  ```
  Scenario: Verify certificate text width
    Tool: Playwright
    Steps:
      1. Navigate to certificate generator page
      2. Verify certificate text doesn't span too wide
    Evidence: .sisyphus/evidence/task-6-certificates.png
  ```

  **Commit**: YES (groups with 3,4,5)

---

- [x] 7. Fix EmailVerification.tsx:115,145,214 + ChangePassword.tsx:71,125

  **What to do**:
  - EmailVerification.tsx: adicionar `max-w-lg` aos 3 parágrafos
  - ChangePassword.tsx: adicionar `max-w-lg` aos 2 parágrafos

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 3, parallel with 8

  **Acceptance Criteria**:
  - [ ] All auth page descriptions have max-w-lg

  **QA Scenarios**:
  ```
  Scenario: Verify auth page text width
    Tool: Playwright
    Steps:
      1. Navigate to email verification page
      2. Navigate to change password page
      3. Verify description text width
    Evidence: .sisyphus/evidence/task-7-auth.png
  ```

  **Commit**: YES (groups with 8)

---

- [x] 8. Fix Configuracoes.tsx:90-92,127-129 + NovaCampanhaPage.tsx:777-780

  **What to do**:
  - Configuracoes.tsx: adicionar `max-w-xl` às descrições
  - NovaCampanhaPage.tsx: adicionar `max-w-xl` ao warning text

  **Recommended Agent Profile**: `quick`

  **Parallelization**: Wave 3, parallel with 7

  **Acceptance Criteria**:
  - [ ] All app page descriptions have max-w-xl

  **QA Scenarios**:
  ```
  Scenario: Verify app settings page text width
    Tool: Playwright
    Steps:
      1. Navigate to /app/configuracoes
      2. Navigate to new campaign page
      3. Verify description text width
    Evidence: .sisyphus/evidence/task-8-app-pages.png
  ```

  **Commit**: YES (groups with 7)

---

## Final Verification Wave

- [x] F1. **Visual QA - All Pages** — `playwright` skill

  Run Playwright to verify all modified pages render correctly:
  1. Marketing: /, /pricing, /about, /security, /lgpd
  2. Components: landing builder, email editor, quiz, certificate
  3. Auth: /login, /register, /forgot-password, /verify-email
  4. App: /app/configuracoes, /app/campanhas/nova

  Capture screenshots of each page showing text is properly constrained.

  **Output**: `Pages [N/N pass] | Text Width [N/N correct] | VERDICT: APPROVE/REJECT`

  **Evidence**: `.sisyphus/evidence/final-qa/text-width-verification/`

---

## Commit Strategy

- **Wave 1 (Tasks 1-2)**: `fix(layout): add max-w constraints to marketing pages`
  - Files: `src/routes/marketing/Home.tsx, Security.tsx, Pricing.tsx, About.tsx, Lgpd.tsx`

- **Wave 2 (Tasks 3-6)**: `fix(layout): add max-w constraints to components`
  - Files: All component files modified

- **Wave 3 (Tasks 7-8)**: `fix(layout): add max-w constraints to auth and app pages`
  - Files: Auth pages + app pages

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Expected: Build completed successfully
```

### Final Checklist
- [ ] All 20+ text elements have proper max-w constraints
- [ ] No visual regressions (text not too narrow or too wide)
- [ ] User confirms "corredor vertical" issue is resolved
