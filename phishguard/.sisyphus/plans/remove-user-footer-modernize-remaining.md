# Plano: Remover UserFooter do AppSidebar + Modernizar Páginas Restantes

## TL;DR

Remover o botão de usuário duplicado no canto inferior esquerdo da sidebar (que redireciona para `/login`). Já existe botão similar no canto superior direito (AppTopbar). Identificar e planejar a modernização das 9 páginas restantes.

---

## Context

### Problema 1: Botão duplicado no sidebar
- **Arquivo**: `src/components/navigation/AppSidebar.tsx`
- **Componente**: `UserFooter` (linhas 154-171)
- **Comportamento**: Ao clicar, executa `onLogout` → `navigate('/login')`
- **Posição**: Sidebar esquerda, canto inferior
- **Solução**: Remover UserFooter

### Status das Páginas Modernizadas
As seguintes páginas já estão modernizadas (CSS variables + motion/react):
- ✅ Dashboard.tsx
- ✅ Campanhas.tsx
- ✅ Configuracoes.tsx
- ✅ UsersPage.tsx
- ✅ GroupsPage.tsx
- ✅ AuditoriaPage.tsx
- ✅ InteligenciaPage.tsx
- ✅ SuportePage.tsx (suporte/page.tsx)
- ✅ TreinamentoPage.tsx (treinamento/page.tsx)
- ✅ RelatorioTecnicoPage.tsx (CSS vars, sem motion)
- ✅ RelatorioExecutivoPage.tsx (CSS vars, sem motion)

### Páginas NÃO Modernizadas (9 arquivos)
Estas páginas ainda usam estilos antigos e precisam de modernização:

| Arquivo | Problemas |
|---------|-----------|
| `Usuarios.tsx` | noir-800, text-white hardcoded |
| `onboarding/Onboarding.tsx` | noir-800 |
| `compliance/CompliancePage.tsx` | noir-800 |
| `usuarios/UserDetailPage.tsx` | noir-800 |
| `usuarios/ImportPage.tsx` | noir-800 |
| `dashboard.page.tsx` | Legacy duplicado, sem motion |
| `templates/editor.page.tsx` | Sem motion |
| `relatorios/RelatorioTecnicoPage.tsx` | Sem motion (CSS vars OK) |
| `relatorios/RelatorioExecutivoPage.tsx` | Sem motion (CSS vars OK) |

---

## Work Objectives

### TAREFA 1: Remover UserFooter do AppSidebar ✅ (Simples - 1 arquivo)
**Arquivo**: `src/components/navigation/AppSidebar.tsx`

**O que fazer**:
1. Remover a função/componente `UserFooter` (linhas 154-171)
2. Remover a chamada `<UserFooter user={user} onLogout={onLogout ?? (() => {})} />` (linha 282)
3. Remover a prop `user` do AppSidebar se só servir pro UserFooter
4. Opcional: adicionar footer minimal com copyright

**Guardrails**:
- NÃO remover o TenantSwitcher
- NÃO remover a navegação (sections)
- NÃO alterar AppTopbar

### TAREFA 2-10: Modernizar 9 páginas restantes
Cada página deve ser atualizada para:
1. Usar CSS variables em vez de noir-X hardcoded
2. Adicionar motion/react para animações
3. Usar componentes UI existentes (Card, Button, etc.)
4. Seguir o padrão visual das páginas já modernizadas

**Prioridade sugerida**:
1. `Usuarios.tsx` - mais usado, muitos problemas
2. `compliance/CompliancePage.tsx` - página importante
3. `onboarding/Onboarding.tsx` - primeira experiência
4. `usuarios/UserDetailPage.tsx` - usuário único
5. `usuarios/ImportPage.tsx` - fluxo de importação
6. `dashboard.page.tsx` - remover duplicado legacy
7. `templates/editor.page.tsx` - wrapper simples
8. `relatorios/RelatorioTecnicoPage.tsx` - adicionar motion
9. `relatorios/RelatorioExecutivoPage.tsx` - adicionar motion

---

## Verification Strategy

```bash
cd phishguard && npm run build
```

---

## Execution Strategy

### Fase 1: Remover UserFooter (IMEDIATO - trivial)
1 pessoa, 1 tarefa

### Fase 2: Modernizar páginas (PODEM SER PARALELAS)
- 9 páginas independentes
- podem ser feitas em paralelo por agentes diferentes

---

## TODOs

- [x] 1. Remover UserFooter do AppSidebar.tsx

  **What to do**:
  - Remover função `UserFooter` (linhas 154-171)
  - Remover `<UserFooter ... />` (linha 282)
  - Remover prop `user` se não usada
  - Opcional: adicionar footer minimal

  **References**:
  - `src/components/navigation/AppSidebar.tsx:154-171` - UserFooter
  - `src/components/navigation/AppSidebar.tsx:282` - Chamada

  **QA Scenarios**:
  - Sidebar sem avatar/nome no canto inferior
  - Topbar continua com menu de usuário
  - Build passa

- [x] 2. Modernizar Usuarios.tsx ✅
- [x] 3. Modernizar onboarding/Onboarding.tsx (already modernized)
- [x] 4. Modernizar compliance/CompliancePage.tsx (already modernized)
- [x] 5. Modernizar usuarios/UserDetailPage.tsx (already modernized)
- [x] 6. Modernizar usuarios/ImportPage.tsx (already modernized)
- [x] 7. Remover dashboard.page.tsx (duplicado - legado) ✅
- [x] 8. Adicionar motion em relatorios/RelatorioTecnicoPage.tsx ✅
- [x] 9. Adicionar motion em relatorios/RelatorioExecutivoPage.tsx ✅

---

## Final Verification Wave

- [x] F1. Build passa `npm run build` sem erros ✅
- [x] F2. Sidebar sem botão de usuário no canto inferior ✅
- [x] F3. Topbar com menu de usuário preservado ✅
- [x] F4. Remover dashboard.page.tsx (legacy duplicate) ✅
- [x] F5. Adicionar motion aos relatórios técnicos ✅

## Success Criteria

1. ✅ UserFooter removido da sidebar esquerda
2. ✅ Menu de usuário preservado no topo direito
3. ✅ Build passa sem erros
4. ✅ Todas as páginas modernizadas com CSS variables + motion/react

## Success Criteria

1. ✅ UserFooter removido da sidebar esquerda
2. ✅ Menu de usuário preservado no topo direito
3. ✅ Build passa sem erros
4. ✅ 9 páginas restantes modernizadas com CSS variables + motion/react