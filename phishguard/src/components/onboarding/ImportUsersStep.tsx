import * as React from 'react'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface ImportedUser {
  email: string
  name: string
  role: string
  department: string
}

interface ImportUsersStepProps {
  defaultUsers?: ImportedUser[]
  onSubmit: (users: ImportedUser[]) => void
  onSkip?: () => void
  isLoading?: boolean
}

type ImportMode = 'csv' | 'manual' | 'ad'

const CSV_TEMPLATE = `email,name,role,department
joao.silva@empresa.com,João Silva,Gerente,Financeiro
maria.santos@empresa.com,Maria Santos,Analista,RH
carlos.oliveira@empresa.com,Carlos Oliveira,Dev,TI
ana.souza@empresa.com,Ana Souza,Diretora,Comercial`

function parseCSV(content: string): ImportedUser[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const users: ImportedUser[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    if (values.length < headers.length) continue

    const user: ImportedUser = {
      email: values[headers.indexOf('email')] || '',
      name: values[headers.indexOf('name')] || '',
      role: values[headers.indexOf('role')] || '',
      department: values[headers.indexOf('department')] || '',
    }

    if (user.email && user.name) {
      users.push(user)
    }
  }

  return users
}

export function ImportUsersStep({
  defaultUsers = [],
  onSubmit,
  onSkip,
  isLoading,
}: ImportUsersStepProps) {
  const [mode, setMode] = useState<ImportMode>('csv')
  const [users, setUsers] = useState<ImportedUser[]>(defaultUsers)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = useCallback((file: File) => {
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = parseCSV(content)
        if (parsed.length === 0) {
          setError('Nenhum usuário válido encontrado no arquivo. Verifique o formato.')
          return
        }
        setUsers(prev => [...prev, ...parsed])
      } catch {
        setError('Erro ao processar arquivo CSV')
      }
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file)
    } else {
      setError('Por favor, envie um arquivo CSV')
    }
  }, [handleFileUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const handleManualAdd = useCallback(() => {
    setUsers(prev => [
      ...prev,
      { email: '', name: '', role: '', department: '' }
    ])
  }, [])

  const handleManualUpdate = useCallback((index: number, field: keyof ImportedUser, value: string) => {
    setUsers(prev => prev.map((u, i) => i === index ? { ...u, [field]: value } : u))
  }, [])

  const handleManualRemove = useCallback((index: number) => {
    setUsers(prev => prev.filter((_, i) => i !== index))
  }, [])

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_usuarios.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <div className="animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
          Importar Usuários
        </h2>
        <p className="mt-2 text-[var(--color-fg-secondary)]">
          Adicione os usuários que serão monitorados. Você pode importar de um CSV ou adicionar manualmente.
        </p>
      </div>

      {/* Import Mode Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[var(--color-noir-700)]">
        <button
          type="button"
          onClick={() => setMode('csv')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors relative',
            mode === 'csv'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]'
          )}
        >
          Importar CSV
          {mode === 'csv' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors relative',
            mode === 'manual'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]'
          )}
        >
          Adicionar Manual
          {mode === 'manual' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMode('ad')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors relative flex items-center gap-2',
            mode === 'ad'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]'
          )}
        >
          Active Directory
          <Badge variant="secondary" className="text-xs">Em breve</Badge>
          {mode === 'ad' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
          )}
        </button>
      </div>

      {/* CSV Import Area */}
      {mode === 'csv' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
              dragging
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                : 'border-[var(--color-noir-600)] hover:border-[var(--color-noir-500)]'
            )}
          >
            <div className="mb-4 rounded-full bg-[var(--color-surface-2)] p-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[var(--color-accent)]"
              >
                <path
                  d="M16 4V20M16 20L10 14M16 20L22 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 24V28H28V24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mb-2 text-center text-sm text-[var(--color-fg-primary)]">
              Arraste e solte seu arquivo CSV aqui
            </p>
            <p className="mb-4 text-center text-xs text-[var(--color-fg-muted)]">
              ou
            </p>
            <div className="flex gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button asChild size="sm" variant="secondary">
                  <span>Escolher arquivo</span>
                </Button>
              </label>
              <Button size="sm" variant="ghost" onClick={downloadTemplate}>
                Baixar template
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          )}

          {users.length > 0 && (
            <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-noir-700)]">
                <span className="text-sm font-medium text-[var(--color-fg-primary)]">
                  {users.length} usuário(s) importado(s)
                </span>
                <Button size="sm" variant="ghost" onClick={() => setUsers([])}>
                  Limpar tudo
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {users.map((user, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-noir-800)] last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-fg-primary)]">{user.name}</p>
                      <p className="text-xs text-[var(--color-fg-muted)]">{user.email}</p>
                    </div>
                    {user.department && (
                      <Badge variant="secondary">{user.department}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Add Area */}
      {mode === 'manual' && (
        <div className="space-y-4">
          <Button size="sm" variant="secondary" onClick={handleManualAdd}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Adicionar usuário
          </Button>

          {users.filter(u => !u.email).map((user, i) => (
            <Card key={i} className="p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-[var(--color-fg-muted)] mb-1 block">Nome</label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => handleManualUpdate(i, 'name', e.target.value)}
                    placeholder="João Silva"
                    className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-600)] bg-[var(--color-surface-0)] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-fg-muted)] mb-1 block">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) => handleManualUpdate(i, 'email', e.target.value)}
                    placeholder="joao@empresa.com"
                    className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-600)] bg-[var(--color-surface-0)] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-fg-muted)] mb-1 block">Cargo</label>
                  <input
                    type="text"
                    value={user.role}
                    onChange={(e) => handleManualUpdate(i, 'role', e.target.value)}
                    placeholder="Gerente"
                    className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-600)] bg-[var(--color-surface-0)] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-fg-muted)] mb-1 block">Departamento</label>
                  <input
                    type="text"
                    value={user.department}
                    onChange={(e) => handleManualUpdate(i, 'department', e.target.value)}
                    placeholder="Financeiro"
                    className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-600)] bg-[var(--color-surface-0)] px-3 text-sm"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => handleManualRemove(i)}>
                  Remover
                </Button>
              </div>
            </Card>
          ))}

          {users.filter(u => u.email).length > 0 && (
            <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4">
              <span className="text-sm font-medium text-[var(--color-fg-primary)]">
                {users.filter(u => u.email).length} usuário(s) adicionado(s)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Active Directory Placeholder */}
      {mode === 'ad' && (
        <Card className="p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-[var(--color-surface-2)] p-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[var(--color-fg-muted)]"
              >
                <rect x="6" y="6" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M11 16H21M11 11H21M11 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <h3 className="mb-2 font-display text-lg font-semibold text-[var(--color-fg-primary)]">
            Integração com Active Directory
          </h3>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Esta funcionalidade estará disponível em breve. Conecte seu Active Directory para importar usuários automaticamente.
          </p>
        </Card>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={isLoading}
        >
          Pular por agora
        </Button>

        <div className="flex gap-3">
          <span className="flex items-center text-sm text-[var(--color-fg-muted)]">
            {users.length} usuário(s)
          </span>
          <Button
            onClick={() => onSubmit(users)}
            isLoading={isLoading}
            disabled={users.length === 0}
          >
            Continuar
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2"
            >
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}